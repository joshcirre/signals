<?php

use App\Http\Controllers\Api\Device\ClaimReviewAnalysisRunController;
use App\Http\Controllers\Api\Device\CompleteReviewAnalysisRunController;
use App\Http\Controllers\Api\Device\RecordReviewAnalysisEventController;
use Illuminate\Support\Facades\Route;

Route::middleware('signals-device')->prefix('device')->group(function () {
    Route::post('runs/claim', ClaimReviewAnalysisRunController::class)->name('api.device.runs.claim');
    Route::post('runs/{reviewAnalysisRun}/events', RecordReviewAnalysisEventController::class)->name('api.device.runs.events');
    Route::post('runs/{reviewAnalysisRun}/complete', CompleteReviewAnalysisRunController::class)->name('api.device.runs.complete');
});
