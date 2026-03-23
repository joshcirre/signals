<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Signals\IssueHelperTokenAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SignalsDeviceTokenController extends Controller
{
    public function __invoke(Request $request, IssueHelperTokenAction $issueHelperToken): RedirectResponse
    {
        $token = $issueHelperToken->handle($request->user(), 'Signals Helper');

        $request->session()->put([
            'helper_token' => $token['token'],
            'helper_name' => $token['device']->name,
        ]);

        return back();
    }
}
