import { Link } from '@inertiajs/react';
import {
    ClipboardList,
    FolderGit2,
    LayoutGrid,
    Radar,
    ScrollText,
    ShoppingBag,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import { dashboard } from '@/routes';

const mainNavItems: NavItem[] = [
    {
        title: 'Start',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Session',
        href: '/admin/signals',
        icon: Radar,
    },
    {
        title: 'Review',
        href: '/admin/proposals',
        icon: ClipboardList,
    },
    {
        title: 'Audit',
        href: '/admin/audit-log',
        icon: ScrollText,
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
            <SidebarHeader className="border-b border-slate-950/6 px-2 py-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="h-auto rounded-lg px-2.5 py-2 hover:bg-slate-100 data-[state=open]:bg-slate-100"
                        >
                            <Link
                                href={dashboard()}
                                prefetch
                                className="flex items-center gap-3"
                            >
                                <AppLogoIcon className="size-8 shrink-0" />
                                <div className="grid flex-1 text-left group-data-[collapsible=icon]:hidden">
                                    <span className="truncate text-sm font-semibold tracking-tight text-slate-950">
                                        Signals
                                    </span>
                                    <span className="text-[11px] font-medium tracking-[0.2em] text-slate-400 uppercase">
                                        Minimal demo
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-2 py-3">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-950/6 px-2 py-3">
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
