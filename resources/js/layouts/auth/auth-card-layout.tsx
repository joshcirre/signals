import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { BrandMark } from '@/components/brand-mark';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="flex min-h-svh items-center justify-center bg-[#fcfcfd] px-4 py-8 sm:px-6">
            <div className="flex w-full max-w-sm flex-col gap-4">
                <Link
                    href={home()}
                    className="flex items-center justify-center gap-3 self-center"
                >
                    <BrandMark className="size-9 rounded-lg" />
                </Link>

                <Card className="rounded-lg border-slate-200 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
                    <CardHeader className="px-6 pt-6 pb-0 text-center">
                        <CardTitle className="text-xl font-semibold tracking-tight text-slate-950">
                            {title}
                        </CardTitle>
                        <CardDescription className="mx-auto max-w-xs text-sm leading-5 text-slate-500">
                            {description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 py-6">{children}</CardContent>
                </Card>
            </div>
        </div>
    );
}
