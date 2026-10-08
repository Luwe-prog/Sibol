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
        Schema::create('crops', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->decimal('soil_moisture_min', 5, 2);
            $table->decimal('soil_moisture_max', 5, 2);
            $table->decimal('temp_min', 5, 2);
            $table->decimal('temp_max', 5, 2);
            $table->decimal('humidity_min', 5, 2);
            $table->decimal('humidity_max', 5, 2);
            $table->string('source_reference')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crops');
    }
};
