<?php

namespace App\Actions\Signals;

use App\Models\SignalsDevice;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class IssueHelperTokenAction
{
    /**
     * @return array{device: SignalsDevice, token: string}
     */
    public function handle(User $user, string $deviceName = 'Signals Helper'): array
    {
        $plainTextToken = Str::random(48);

        $device = SignalsDevice::query()->updateOrCreate(
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

        return [
            'device' => $device,
            'token' => $plainTextToken,
        ];
    }
}
