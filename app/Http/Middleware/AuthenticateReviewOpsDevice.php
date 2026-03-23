<?php

namespace App\Http\Middleware;

use App\Models\ReviewOpsDevice;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateReviewOpsDevice
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        abort_unless(is_string($token) && $token !== '', 401);

        $device = ReviewOpsDevice::query()
            ->where('is_active', true)
            ->with('user')
            ->get()
            ->first(fn (ReviewOpsDevice $reviewOpsDevice) => Hash::check($token, $reviewOpsDevice->token_hash));

        abort_unless($device instanceof ReviewOpsDevice, 401);

        $device->forceFill([
            'last_seen_at' => now(),
        ])->save();

        $request->attributes->set('reviewOpsDevice', $device);
        $request->setUserResolver(fn () => $device->user);

        return $next($request);
    }
}
