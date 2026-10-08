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
        Schema::table('readings', function (Blueprint $table) {
            // The crop's ideal ranges at the moment the status was computed, so charts can
            // draw the band each reading was actually judged against.
            $table->json('thresholds')->nullable()->after('humidity_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('readings', function (Blueprint $table) {
            $table->dropColumn('thresholds');
        });
    }
};
