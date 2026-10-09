<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Minecraft\Http\Controllers\HistoryController;
use Minecraft\Http\Controllers\LogController;
use Minecraft\Http\Controllers\MetaController;
use Minecraft\Http\Controllers\PlayerActionController;
use Minecraft\Http\Controllers\PlayerController;
use Minecraft\Http\Controllers\PropertiesController;
use Minecraft\Http\Controllers\StatusController;

Route::get('/meta', [MetaController::class, 'show']);
Route::get('/status', [StatusController::class, 'show']);

Route::get('/properties', [PropertiesController::class, 'show']);
Route::patch('/properties', [PropertiesController::class, 'update']);

Route::get('/players', [PlayerController::class, 'index']);
Route::get('/players/{uuid}', [PlayerController::class, 'show']);
Route::post('/players/actions', [PlayerActionController::class, 'store']);

Route::get('/history', [HistoryController::class, 'show']);
Route::put('/history', [HistoryController::class, 'update']);

Route::get('/logs', [LogController::class, 'index']);
Route::post('/logs/share', [LogController::class, 'share']);
Route::post('/logs/clean', [LogController::class, 'clean']);
Route::put('/logs/schedule', [LogController::class, 'updateSchedule']);
