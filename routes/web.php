<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ProposalApprovalController;
use App\Http\Controllers\Admin\ReviewAnalysisRunController;
use App\Http\Controllers\Admin\ReviewOpsController;
use App\Http\Controllers\Admin\ReviewOpsDeviceTokenController;
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
        Route::get('review-ops', [ReviewOpsController::class, 'index'])->name('admin.review-ops');
        Route::post('review-runs', ReviewAnalysisRunController::class)->name('admin.review-runs.store');
        Route::post('helper-token', ReviewOpsDeviceTokenController::class)->name('admin.helper-token.store');
        Route::post('proposals/{proposal}/approve', ProposalApprovalController::class)->name('admin.proposals.approve');
    });
});

Route::inertia('/welcome', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('welcome');

require __DIR__.'/settings.php';
