import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { storeBrand } from '@/lib/brand';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="sticky top-0 z-20 flex h-18 shrink-0 items-center gap-3 border-b border-white/70 bg-white/80 px-6 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-5">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-1 rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50" />
                <div className="space-y-1">
                    <p className="text-[0.68rem] tracking-[0.28em] text-slate-400 uppercase">
                        {storeBrand.adminName}
                    </p>
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>
            <div className="ml-auto hidden items-center gap-2 md:flex">
                <Badge className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[0.68rem] font-medium tracking-[0.22em] text-sky-900 uppercase hover:bg-sky-50">
                    Local Codex
                </Badge>
                <Badge
                    variant="outline"
                    className="rounded-full border-white/80 bg-white/75 px-3 py-1 text-[0.68rem] tracking-[0.22em] text-slate-500 uppercase"
                >
                    {storeBrand.name}
                </Badge>
            </div>
        </header>
    );
}
