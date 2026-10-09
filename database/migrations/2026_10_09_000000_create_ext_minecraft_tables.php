<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ext_minecraft_options', function (Blueprint $table): void {
            $table->unsignedInteger('server_id')->primary();
            $table->boolean('history')->default(false);
            $table->boolean('cleanup')->default(false);
            $table->unsignedSmallInteger('cleanup_days')->default(14);
            $table->boolean('cleanup_logs')->default(true);
            $table->boolean('cleanup_crashes')->default(true);
            $table->boolean('cleanup_archive')->default(false);
            $table->timestamps();

            $table->foreign('server_id')->references('id')->on('servers')->cascadeOnDelete();
        });

        Schema::create('ext_minecraft_samples', function (Blueprint $table): void {
            $table->unsignedInteger('server_id');
            $table->dateTime('hour');
            $table->unsignedSmallInteger('samples')->default(0);
            $table->unsignedInteger('total')->default(0);
            $table->unsignedSmallInteger('peak')->default(0);

            $table->primary(['server_id', 'hour']);
            $table->foreign('server_id')->references('id')->on('servers')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ext_minecraft_samples');
        Schema::dropIfExists('ext_minecraft_options');
    }
};
