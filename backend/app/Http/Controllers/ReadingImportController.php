<?php

namespace App\Http\Controllers;

use App\Enums\ReadingSource;
use App\Models\ActivityLog;
use App\Models\Zone;
use App\Services\ReadingChecker;
use App\Services\RecommendationService;
use App\Support\ReadingRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ReadingImportController extends Controller
{
    public const MAX_ROWS = 500;

    private const REQUIRED_COLUMNS = ['recorded_at', 'soil_moisture', 'temperature', 'humidity'];

    private const OPTIONAL_COLUMNS = ['water_applied_liters', 'notes'];

    public function __construct(
        private RecommendationService $recommendations,
        private ReadingChecker $checker,
    ) {}

    /**
     * Import a zone's readings from a CSV file.
     *
     * All or nothing: if any row has a problem, nothing is saved and every problem is reported,
     * so a half-imported file never has to be untangled. Unusual values are imported and flagged.
     */
    public function store(Request $request, Zone $zone): JsonResponse
    {
        $this->authorizeFarm($request, $zone->farm);
        abort_unless($zone->is_active && $zone->farm->is_active, 422, 'This zone is inactive, so it cannot take new readings.');

        $request->validate([
            'file' => ['required', 'file', 'max:1024', 'extensions:csv,txt'],
            // Times in the file are read in this time zone (the device's own, sent by the frontend).
            'timezone' => ['nullable', 'timezone'],
        ]);

        $timezone = $request->input('timezone', 'Asia/Manila');
        $rows = $this->parse($request->file('file')->getRealPath());

        if (is_string($rows)) {
            return $this->failed($rows);
        }

        $rules = ReadingRules::rules();
        // The time is checked by hand below, because it has to be read in the file's time zone first.
        $rules['recorded_at'] = ['required', 'string'];

        $crop = $zone->crop;
        $existingTimes = $zone->readings()->pluck('recorded_at')->map(fn ($time) => $time->timestamp)->flip();
        $seenTimes = [];
        $prepared = [];
        $rowErrors = [];

        foreach ($rows as $line => $row) {
            $errors = Validator::make($row, $rules, ReadingRules::messages())->errors()->all();
            $recordedAt = null;

            if (! $errors) {
                try {
                    $recordedAt = Carbon::parse($row['recorded_at'], $timezone)->utc();
                } catch (\Throwable) {
                    $errors[] = 'recorded_at is not a date and time. Use the form 2026-10-08 07:30.';
                }
            }

            if ($recordedAt) {
                if ($recordedAt->gt(now()->addMinutes(5))) {
                    $errors[] = 'The reading time cannot be in the future.';
                } elseif ($existingTimes->has($recordedAt->timestamp)) {
                    $errors[] = 'This zone already has a reading at this time.';
                } elseif (isset($seenTimes[$recordedAt->timestamp])) {
                    $errors[] = "Same time as line {$seenTimes[$recordedAt->timestamp]}.";
                }
            }

            if ($errors) {
                $rowErrors[] = ['line' => $line, 'errors' => $errors];

                continue;
            }

            $seenTimes[$recordedAt->timestamp] = $line;

            $soilMoisture = (float) $row['soil_moisture'];
            $temperature = (float) $row['temperature'];
            $humidity = (float) $row['humidity'];
            $reasons = $this->checker->suspiciousReasons($soilMoisture, $temperature, $humidity, $recordedAt);

            $prepared[] = [
                'entered_by' => $request->user()->id,
                'recorded_at' => $recordedAt,
                'soil_moisture' => $soilMoisture,
                'temperature' => $temperature,
                'humidity' => $humidity,
                'water_applied_liters' => $row['water_applied_liters'] === null ? null : (float) $row['water_applied_liters'],
                'notes' => $row['notes'],
                'source' => ReadingSource::Csv,
                'is_suspicious' => (bool) $reasons,
                'suspicious_reason' => $reasons ? implode(' ', $reasons) : null,
                ...$this->recommendations->evaluate($crop, $zone, $soilMoisture, $temperature, $humidity),
                'thresholds' => $crop->thresholdSnapshot(),
            ];
        }

        if ($rowErrors) {
            return $this->failed(
                count($rowErrors) === 1 ? '1 row has a problem. Nothing was imported.' : count($rowErrors).' rows have problems. Nothing was imported.',
                $rowErrors,
            );
        }

        DB::transaction(function () use ($zone, $prepared) {
            foreach ($prepared as $attributes) {
                $zone->readings()->create($attributes);
            }
        });

        $flagged = count(array_filter($prepared, fn (array $reading) => $reading['is_suspicious']));

        ActivityLog::record($request->user(), 'reading.imported', sprintf(
            'Imported %d %s into %s (%s) from a CSV file',
            count($prepared), count($prepared) === 1 ? 'reading' : 'readings', $zone->name, $zone->farm->name,
        ), $zone, ['imported' => count($prepared), 'flagged_unusual' => $flagged]);

        return response()->json(['imported' => count($prepared), 'flagged' => $flagged], 201);
    }

    /**
     * Reads the file into rows keyed by line number (the header is line 1).
     * Returns a message instead when the file as a whole cannot be used.
     *
     * @return array<int, array<string, ?string>>|string
     */
    private function parse(string $path): array|string
    {
        $handle = fopen($path, 'r');
        $header = fgetcsv($handle);

        if (! $header) {
            return 'The file is empty.';
        }

        // Excel adds a byte order mark to the first cell and people add stray spaces or capitals.
        $header = array_map(fn ($cell) => strtolower(trim(str_replace("\xEF\xBB\xBF", '', (string) $cell))), $header);

        if ($missing = array_diff(self::REQUIRED_COLUMNS, $header)) {
            return 'The first line must name the columns. Missing: '.implode(', ', $missing).'.';
        }

        $columns = [...self::REQUIRED_COLUMNS, ...self::OPTIONAL_COLUMNS];
        $rows = [];
        $line = 1;

        while (($cells = fgetcsv($handle)) !== false) {
            $line++;

            // A blank line comes back as a single empty cell.
            if (count(array_filter($cells, fn ($cell) => trim((string) $cell) !== '')) === 0) {
                continue;
            }

            if (count($rows) >= self::MAX_ROWS) {
                return 'The file has more than '.self::MAX_ROWS.' readings. Split it into smaller files.';
            }

            $row = [];
            foreach ($columns as $column) {
                $index = array_search($column, $header, true);
                $value = $index === false ? '' : trim((string) ($cells[$index] ?? ''));
                $row[$column] = $value === '' ? null : $value;
            }

            $rows[$line] = $row;
        }

        fclose($handle);

        return $rows ?: 'The file has column names but no readings.';
    }

    private function failed(string $message, array $rowErrors = []): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'code' => 'import_failed',
            'row_errors' => array_slice($rowErrors, 0, 50),
            'row_error_count' => count($rowErrors),
        ], 422);
    }
}
