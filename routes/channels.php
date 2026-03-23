<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('signals.user.{id}', fn (User $user, string $id): bool => (string) $user->id === $id);
