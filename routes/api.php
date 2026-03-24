<?php

use App\Http\Controllers\Api\Device\ClaimReviewAnalysisRunController;
use App\Http\Controllers\Api\Device\ClaimReviewAnalysisRunFollowUpController;
use App\Http\Controllers\Api\Device\CompleteReviewAnalysisRunController;
use App\Http\Controllers\Api\Device\CompleteReviewAnalysisRunFollowUpController;
use App\Http\Controllers\Api\Device\RecordReviewAnalysisEventController;
use App\Http\Controllers\Api\Device\UpdateReviewAnalysisRunSessionController;
use Illuminate\Support\Facades\Route;

Route::middleware('signals-device')->prefix('device')->group(function (): void {
    Route::post('runs/claim', ClaimReviewAnalysisRunController::class)->name('api.device.runs.claim');
    Route::post('follow-ups/claim', ClaimReviewAnalysisRunFollowUpController::class)->name('api.device.follow-ups.claim');
    Route::post('runs/{reviewAnalysisRun}/stream', RecordReviewAnalysisEventController::class)->name('api.device.runs.stream');
    Route::post('runs/{reviewAnalysisRun}/events', RecordReviewAnalysisEventController::class)->name('api.device.runs.events');
    Route::post('runs/{reviewAnalysisRun}/session', UpdateReviewAnalysisRunSessionController::class)->name('api.device.runs.session');
    Route::post('runs/{reviewAnalysisRun}/complete', CompleteReviewAnalysisRunController::class)->name('api.device.runs.complete');
    Route::post('runs/{reviewAnalysisRun}/follow-ups/{reviewAnalysisRunFollowUp}/complete', CompleteReviewAnalysisRunFollowUpController::class)->name('api.device.follow-ups.complete');
});
