import type { Auth } from '@/types/auth';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            appUrl: string;
            auth: Auth;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}

declare global {
    interface Window {
        SignalsRuntime?: {
            reverb?: {
                key?: string | null;
                wsHost?: string | null;
                wsPort?: number | null;
                wssPort?: number | null;
                forceTLS?: boolean;
                enabledTransports?: Array<'ws' | 'wss'>;
            };
        };
    }
}

export {};
