<?php

namespace App\Http\Middleware;

use App\Events\SignalsHelperHeartbeatUpdated;
use App\Models\SignalsDevice;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class AuthenticateSignalsDevice
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

        $device = SignalsDevice::query()
            ->where('is_active', true)
            ->with('user')
            ->get()
            ->first(fn (SignalsDevice $signalsDevice) => Hash::check($token, $signalsDevice->token_hash));

        abort_unless($device instanceof SignalsDevice, 401);

        $device->forceFill([
            'last_seen_at' => now(),
        ])->save();

        try {
            event(new SignalsHelperHeartbeatUpdated($device->fresh()));
        } catch (Throwable $throwable) {
            report($throwable);
        }

        $request->attributes->set('signalsDevice', $device);
        $request->setUserResolver(fn () => $device->user);

        return $next($request);
    }
}
