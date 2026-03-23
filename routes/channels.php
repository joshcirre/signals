<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('review-ops.user.{id}', function (User $user, string $id): bool {
    return (string) $user->id === $id;
});
