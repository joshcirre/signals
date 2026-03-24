import { Link } from '@inertiajs/react';
import type { NavItem } from '@/types';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                            className="h-10 rounded-lg px-2.5 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-950 data-[active=true]:bg-slate-950 data-[active=true]:text-white"
                        >
                            <Link
                                href={item.href}
                                prefetch
                                className="flex items-center gap-3"
                            >
                                {item.icon ? (
                                    <item.icon className="size-4 shrink-0" />
                                ) : null}
                                <span className="min-w-0 flex-1 truncate text-left text-sm font-medium group-data-[collapsible=icon]:hidden">
                                    {item.title}
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
