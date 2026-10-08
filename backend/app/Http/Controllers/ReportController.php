<?php

namespace App\Http\Controllers;

use App\Models\Farm;
use App\Models\Reading;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Water report: recommended vs. applied liters per zone, with farm and overall totals.
     *
     * Only readings that have a water applied value are compared. The rest are counted
     * as "not recorded" so a missing entry is never mistaken for zero liters.
     */
    public function water(Request $request): JsonResponse
    {
        [$from, $to, $farms] = $this->scope($request);

        return response()->json($this->waterReport($from, $to, $farms));
    }

    public function waterCsv(Request $request): StreamedResponse
    {
        [$from, $to, $farms, $timezone] = $this->scope($request);
        $report = $this->waterReport($from, $to, $farms);

        $rows = [[
            'Farm', 'Zone', 'Crop', 'Environment', 'Readings', 'Readings compared',
            'Water applied not recorded', 'Recommended liters', 'Applied liters', 'Difference liters',
        ]];

        foreach ($report['farms'] as $farm) {
            foreach ($farm['zones'] as $zone) {
                $rows[] = [
                    $farm['name'], $zone['name'], $zone['crop'], $zone['environment'], $zone['readings_count'],
                    $zone['compared_count'], $zone['not_recorded_count'], $zone['recommended_liters'],
                    $zone['applied_liters'], $zone['difference_liters'],
                ];
            }
        }

        $totals = $report['totals'];
        $rows[] = [
            'All farms', '', '', '', $totals['readings_count'], $totals['compared_count'], $totals['not_recorded_count'],
            $totals['recommended_liters'], $totals['applied_liters'], $totals['difference_liters'],
        ];

        return $this->csv($this->filename('water-report', $from, $to, $timezone), fn () => $rows);
    }

    /**
     * Every reading in the range, one row each, for use in a spreadsheet.
     */
    public function readingsCsv(Request $request): StreamedResponse
    {
        [$from, $to, $farms, $timezone] = $this->scope($request);

        $zoneIds = $farms->flatMap(fn (Farm $farm) => $farm->zones->pluck('id'));

        $rows = function () use ($zoneIds, $from, $to, $timezone) {
            yield [
                'Farm', 'Zone', 'Crop', 'Environment', 'Recorded at', 'Soil moisture (%)', 'Temperature (C)', 'Humidity (%)',
                'Soil status', 'Temperature status', 'Humidity status', 'Recommended liters', 'Water applied liters',
                'Unusual', 'Unusual reason', 'Recommendation', 'Notes', 'Entered by',
            ];

            $readings = Reading::whereIn('zone_id', $zoneIds)
                ->whereBetween('recorded_at', [$from, $to])
                ->with('zone.farm:id,name', 'zone.crop:id,name', 'enteredByUser:id,name')
                ->orderBy('recorded_at')
                ->orderBy('id')
                ->lazy();

            foreach ($readings as $reading) {
                yield [
                    $reading->zone->farm->name,
                    $reading->zone->name,
                    $reading->zone->crop->name,
                    $reading->zone->environment->value,
                    $reading->recorded_at->timezone($timezone)->format('Y-m-d H:i'),
                    $reading->soil_moisture,
                    $reading->temperature,
                    $reading->humidity,
                    $reading->moisture_status->label(),
                    $reading->temp_status->label(),
                    $reading->humidity_status->label(),
                    $reading->recommended_liters,
                    $reading->water_applied_liters,
                    $reading->is_suspicious ? 'Yes' : 'No',
                    $reading->suspicious_reason,
                    $reading->recommendation_text,
                    $reading->notes,
                    $reading->enteredByUser?->name,
                ];
            }
        };

        return $this->csv($this->filename('readings', $from, $to, $timezone), $rows);
    }

    /**
     * Resolves the date range and the farms the user may report on.
     * Inactive farms and zones are included: their history stays reportable.
     *
     * @return array{0: CarbonInterface, 1: CarbonInterface, 2: Collection<int, Farm>, 3: string}
     */
    private function scope(Request $request): array
    {
        $filters = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'farm_id' => ['nullable', 'integer', 'exists:farms,id'],
            'timezone' => ['nullable', 'timezone'],
        ]);

        $to = isset($filters['to']) ? Carbon::parse($filters['to'])->utc() : now();
        $from = isset($filters['from']) ? Carbon::parse($filters['from'])->utc() : $to->copy()->subDays(30);

        if (isset($filters['farm_id'])) {
            $this->authorizeFarm($request, Farm::findOrFail($filters['farm_id']));
        }

        $farms = $request->user()->accessibleFarms()
            ->when($filters['farm_id'] ?? null, fn ($query, $farmId) => $query->whereKey($farmId))
            ->with(['zones' => fn ($query) => $query->orderBy('name'), 'zones.crop:id,name'])
            ->orderBy('name')
            ->get();

        return [$from, $to, $farms, $filters['timezone'] ?? 'Asia/Manila'];
    }

    /**
     * @param  Collection<int, Farm>  $farms
     */
    private function waterReport(CarbonInterface $from, CarbonInterface $to, Collection $farms): array
    {
        $zoneIds = $farms->flatMap(fn (Farm $farm) => $farm->zones->pluck('id'));

        $stats = Reading::whereIn('zone_id', $zoneIds)
            ->whereBetween('recorded_at', [$from, $to])
            ->selectRaw('zone_id')
            ->selectRaw('COUNT(*) as readings_count')
            ->selectRaw('SUM(CASE WHEN water_applied_liters IS NULL THEN 1 ELSE 0 END) as not_recorded_count')
            ->selectRaw('SUM(CASE WHEN water_applied_liters IS NULL THEN 0 ELSE recommended_liters END) as recommended_sum')
            ->selectRaw('SUM(COALESCE(water_applied_liters, 0)) as applied_sum')
            ->groupBy('zone_id')
            ->toBase()
            ->get()
            ->keyBy('zone_id');

        $farmRows = [];

        foreach ($farms as $farm) {
            $zoneRows = [];

            foreach ($farm->zones as $zone) {
                $stat = $stats->get($zone->id);

                // Zones with no readings in the range are left out of the report.
                if (! $stat) {
                    continue;
                }

                $zoneRows[] = [
                    'id' => $zone->id,
                    'name' => $zone->name,
                    'crop' => $zone->crop->name,
                    'environment' => $zone->environment->value,
                    'is_active' => $zone->is_active,
                    ...$this->figures(
                        (int) $stat->readings_count,
                        (int) $stat->not_recorded_count,
                        (float) $stat->recommended_sum,
                        (float) $stat->applied_sum,
                    ),
                ];
            }

            if ($zoneRows) {
                $farmRows[] = [
                    'id' => $farm->id,
                    'name' => $farm->name,
                    'zones' => $zoneRows,
                    'totals' => $this->sum($zoneRows),
                ];
            }
        }

        return [
            'from' => $from->toIso8601String(),
            'to' => $to->toIso8601String(),
            'farms' => $farmRows,
            'totals' => $this->sum(array_column($farmRows, 'totals')),
        ];
    }

    private function figures(int $readings, int $notRecorded, float $recommended, float $applied): array
    {
        return [
            'readings_count' => $readings,
            'compared_count' => $readings - $notRecorded,
            'not_recorded_count' => $notRecorded,
            'recommended_liters' => round($recommended, 2),
            'applied_liters' => round($applied, 2),
            // Positive: more water was applied than recommended. Negative: less.
            'difference_liters' => round($applied - $recommended, 2),
        ];
    }

    private function sum(array $rows): array
    {
        return $this->figures(
            array_sum(array_column($rows, 'readings_count')),
            array_sum(array_column($rows, 'not_recorded_count')),
            array_sum(array_column($rows, 'recommended_liters')),
            array_sum(array_column($rows, 'applied_liters')),
        );
    }

    private function filename(string $name, CarbonInterface $from, CarbonInterface $to, string $timezone): string
    {
        return sprintf(
            'sibol-%s_%s_to_%s.csv',
            $name,
            $from->copy()->timezone($timezone)->format('Y-m-d'),
            $to->copy()->timezone($timezone)->format('Y-m-d'),
        );
    }

    /**
     * @param  callable(): iterable<array>  $rows
     */
    private function csv(string $filename, callable $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($rows) {
            $output = fopen('php://output', 'w');

            // Byte order mark, so Excel opens the file as UTF-8.
            fwrite($output, "\xEF\xBB\xBF");

            foreach ($rows() as $row) {
                fputcsv($output, array_map($this->safeCell(...), $row));
            }

            fclose($output);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * Stops typed text such as notes from being run as a formula when the file is opened in a spreadsheet.
     */
    private function safeCell(mixed $value): mixed
    {
        if (is_string($value) && $value !== '' && in_array($value[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'".$value;
        }

        return $value;
    }
}
