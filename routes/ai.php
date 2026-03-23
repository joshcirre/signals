<?php

use App\Mcp\Servers\SignalsServer;
use Laravel\Mcp\Facades\Mcp;

Mcp::web('mcp/signals', SignalsServer::class)
    ->middleware('signals-device')
    ->name('signals.mcp');
