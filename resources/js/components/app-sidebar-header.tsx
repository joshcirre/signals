import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="sticky top-0 z-20 border-b border-slate-950/6 bg-white/92 backdrop-blur">
            <div className="flex h-[3.25rem] shrink-0 items-center gap-3 px-4 md:px-6">
                <SidebarTrigger className="-ml-1 h-8 w-8 rounded-md border border-slate-950/8 text-slate-500 hover:bg-slate-50" />
                <div className="min-w-0 flex-1">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
                <div className="hidden items-center gap-2 rounded-full border border-slate-950/8 bg-white px-2.5 py-1 text-[10px] font-medium tracking-[0.16em] text-slate-400 uppercase lg:flex">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Live demo
                </div>
            </div>
        </header>
    );
}
