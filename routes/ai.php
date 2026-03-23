<?php

use App\Mcp\Servers\ReviewOpsServer;
use Laravel\Mcp\Facades\Mcp;

Mcp::web('mcp/review-ops', ReviewOpsServer::class)
    ->middleware('review-ops-device')
    ->name('review-ops.mcp');
