<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'action',
        'subject_type',
        'subject_id',
        'description',
        'changes',
    ];

    protected function casts(): array
    {
        return [
            'changes' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Write one line to the activity log.
     *
     * @param  array<string, mixed>  $changes
     */
    public static function record(?User $user, string $action, string $description, ?Model $subject = null, array $changes = []): self
    {
        return self::create([
            'user_id' => $user?->id,
            'action' => $action,
            'subject_type' => $subject ? class_basename($subject) : null,
            'subject_id' => $subject?->getKey(),
            'description' => $description,
            'changes' => $changes ?: null,
        ]);
    }

    /**
     * Fill and save a model, logging what changed. Nothing is logged when nothing changed.
     *
     * @param  array<string, mixed>  $data
     * @param  array<string, mixed>  $extra  Changes outside the model's own columns, such as farm assignments.
     */
    public static function recordUpdate(?User $user, Model $model, array $data, string $action, string $description, array $extra = []): void
    {
        $model->fill($data);

        $after = array_diff_key($model->getDirty(), array_flip(['password', 'remember_token', 'thresholds']));
        $before = array_intersect_key($model->getRawOriginal(), $after);

        $model->save();

        if ($after || $extra) {
            self::record($user, $action, $description, $model, array_filter([
                'before' => $before,
                'after' => $after,
                ...$extra,
            ]));
        }
    }
}
