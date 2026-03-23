import * as React from 'react';
import { SidebarInset } from '@/components/ui/sidebar';
import type { AppVariant } from '@/types';

type Props = React.ComponentProps<'main'> & {
    variant?: AppVariant;
};

export function AppContent({ variant = 'sidebar', children, ...props }: Props) {
    if (variant === 'sidebar') {
        return (
            <SidebarInset
                {...props}
                className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.04),transparent_24%),linear-gradient(180deg,#f7f7f8_0%,#ffffff_28%,#fbfbfc_100%)]"
            >
                {children}
            </SidebarInset>
        );
    }

    return (
        <main
            className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-4 rounded-xl"
            {...props}
        >
            {children}
        </main>
    );
}
