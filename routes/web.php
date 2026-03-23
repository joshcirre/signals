<?php

use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ProposalApprovalController;
use App\Http\Controllers\Admin\ProposalQueueController;
use App\Http\Controllers\Admin\ProposalRejectionController;
use App\Http\Controllers\Admin\ProposalUpdateController;
use App\Http\Controllers\Admin\ReviewAnalysisRunController;
use App\Http\Controllers\Admin\SignalsController;
use App\Http\Controllers\Admin\SignalsDeviceTokenController;
use App\Http\Controllers\Storefront\ProductIndexController;
use App\Http\Controllers\Storefront\ProductShowController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::get('/', [ProductIndexController::class, 'index'])->name('home');
Route::get('/products/{product:slug}', [ProductShowController::class, 'show'])->name('products.show');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::redirect('dashboard', '/admin');

    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('signals', [SignalsController::class, 'index'])->name('admin.signals');
        Route::get('audit-log', AuditLogController::class)->name('admin.audit-log');
        Route::get('proposals', ProposalQueueController::class)->name('admin.proposals.index');
        Route::post('review-runs', ReviewAnalysisRunController::class)->name('admin.review-runs.store');
        Route::post('helper-token', SignalsDeviceTokenController::class)->name('admin.helper-token.store');
        Route::post('proposals/{proposal}/approve', ProposalApprovalController::class)->name('admin.proposals.approve');
        Route::post('proposals/{proposal}/reject', ProposalRejectionController::class)->name('admin.proposals.reject');
        Route::patch('proposals/{proposal}', ProposalUpdateController::class)->name('admin.proposals.update');
    });
});

Route::inertia('/welcome', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('welcome');

require __DIR__.'/settings.php';
