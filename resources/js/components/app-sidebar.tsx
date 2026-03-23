import { Link } from '@inertiajs/react';
import {
    ClipboardList,
    FolderGit2,
    LayoutGrid,
    Radar,
    ScrollText,
    ShoppingBag,
    Sparkles,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Badge } from '@/components/ui/badge';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import { storeBrand } from '@/lib/brand';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Signals',
        href: '/admin/signals',
        icon: Radar,
    },
    {
        title: 'Audit Log',
        href: '/admin/audit-log',
        icon: ScrollText,
    },
    {
        title: 'Proposals',
        href: '/admin/proposals',
        icon: ClipboardList,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/joshcirre/signals',
        icon: FolderGit2,
    },
    {
        title: 'Storefront',
        href: '/',
        icon: ShoppingBag,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="border-b border-white/70 bg-white/80 backdrop-blur">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <div className="px-3 pb-3 text-xs leading-5 text-slate-500">
                    {storeBrand.tagline}
                </div>
            </SidebarHeader>

            <SidebarContent className="bg-white/65">
                <NavMain items={mainNavItems} />
                <div className="mx-3 mt-4 rounded-[1.75rem] border border-slate-200/80 bg-[linear-gradient(145deg,#112031_0%,#1b3f74_48%,#38bdf8_100%)] p-4 text-white shadow-[0_18px_50px_rgba(17,32,49,0.24)]">
                    <div className="flex items-center justify-between gap-2">
                        <Badge className="rounded-full border-white/12 bg-white/12 px-3 py-1 text-[0.68rem] tracking-[0.22em] text-white uppercase hover:bg-white/12">
                            Live stack
                        </Badge>
                        <Sparkles className="size-4 text-sky-100" />
                    </div>
                    <p className="mt-4 text-base font-semibold tracking-tight">
                        {storeBrand.helperStack}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/74">
                        Queue analysis in the browser, let the local helper run
                        Codex, and stream MCP-backed actions back into the
                        dashboard.
                    </p>
                </div>
            </SidebarContent>

            <SidebarFooter className="border-t border-white/70 bg-white/80">
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
