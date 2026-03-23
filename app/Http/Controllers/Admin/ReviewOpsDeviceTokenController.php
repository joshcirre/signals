<?php

namespace App\Http\Controllers\Admin;

use App\Actions\ReviewOps\IssueHelperTokenAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ReviewOpsDeviceTokenController extends Controller
{
    public function __invoke(Request $request, IssueHelperTokenAction $issueHelperToken): RedirectResponse
    {
        $deviceName = $request->string('name')->toString() ?: 'ReviewOps Helper';
        $token = $issueHelperToken->handle($request->user(), $deviceName);

        return back()->with([
            'helper_token' => $token['token'],
            'helper_name' => $deviceName,
        ]);
    }
}
