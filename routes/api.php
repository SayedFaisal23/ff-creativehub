<?php

use App\Http\Controllers\Api\AssetStorageController;
use App\Http\Controllers\Api\StateController;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Support\Facades\Route;

Route::middleware([EncryptCookies::class, AddQueuedCookiesToResponse::class, StartSession::class, 'creative.auth'])->group(function (): void {
    Route::get('/state', [StateController::class, 'show']);
    Route::put('/state', [StateController::class, 'update']);
    Route::post('/state/reset', [StateController::class, 'reset']);
    Route::post('/projects/folders', [AssetStorageController::class, 'createProjectFolders']);
    Route::post('/assets/chunked/start', [AssetStorageController::class, 'startChunkedUpload']);
    Route::post('/assets/chunked/{uploadId}/chunk', [AssetStorageController::class, 'uploadChunk']);
    Route::post('/assets/chunked/{uploadId}/complete', [AssetStorageController::class, 'completeChunkedUpload']);
    Route::post('/assets/proxy/queue', [AssetStorageController::class, 'queueProxy']);
    Route::get('/assets/{assetId}/stream', [AssetStorageController::class, 'stream']);
});
