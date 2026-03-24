function valueFromCandidates(value, candidates) {
    for (const candidate of candidates) {
        if (candidate == null) {
            continue;
        }

        return candidate;
    }

    return null;
}

export function extractTurnId(payload) {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    return valueFromCandidates(payload, [
        payload.turn?.id,
        payload.turnId,
        payload.id,
    ]);
}

export function extractThreadId(payload) {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    return valueFromCandidates(payload, [
        payload.turn?.thread_id,
        payload.turn?.threadId,
        payload.thread?.id,
        payload.thread_id,
        payload.threadId,
    ]);
}

export function matchesActiveTurn(notification, activeTurn) {
    if (notification?.method !== 'turn/completed' || activeTurn == null) {
        return false;
    }

    const notificationTurnId = extractTurnId(notification.params ?? {});

    if (activeTurn.turnId !== null && notificationTurnId !== null) {
        return notificationTurnId === activeTurn.turnId;
    }

    const notificationThreadId = extractThreadId(notification.params ?? {});

    if (activeTurn.threadId !== null && notificationThreadId !== null) {
        return notificationThreadId === activeTurn.threadId;
    }

    return false;
}
