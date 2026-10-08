<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('zone_id')->constrained()->cascadeOnDelete();
            $table->foreignId('entered_by')->constrained('users')->restrictOnDelete();
            $table->dateTime('recorded_at');
            $table->decimal('soil_moisture', 5, 2);
            $table->decimal('temperature', 5, 2);
            $table->decimal('humidity', 5, 2);
            $table->decimal('water_applied_liters', 8, 2)->nullable();
            $table->text('notes')->nullable();
            $table->string('source')->default('manual');
            $table->boolean('is_suspicious')->default(false);
            $table->string('suspicious_reason')->nullable();
            // Statuses are stored at save time so later threshold edits do not rewrite history.
            $table->string('moisture_status');
            $table->string('temp_status');
            $table->string('humidity_status');
            $table->decimal('recommended_liters', 8, 2)->default(0);
            $table->text('recommendation_text');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['zone_id', 'recorded_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('readings');
    }
};
