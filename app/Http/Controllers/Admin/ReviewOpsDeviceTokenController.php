<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ReviewOpsDevice;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ReviewOpsDeviceTokenController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $user = $request->user();
        $plainTextToken = Str::random(48);
        $deviceName = $request->string('name')->toString() ?: 'ReviewOps Helper';

        ReviewOpsDevice::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'name' => $deviceName,
            ],
            [
                'token_hash' => Hash::make($plainTextToken),
                'is_active' => true,
                'last_seen_at' => null,
            ],
        );

        return back()->with([
            'helper_token' => $plainTextToken,
            'helper_name' => $deviceName,
        ]);
    }
}
