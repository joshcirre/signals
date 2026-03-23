import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

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
                            className="h-auto rounded-lg px-2.5 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-950 data-[active=true]:bg-slate-950 data-[active=true]:text-white data-[active=true]:shadow-sm"
                        >
                            <Link
                                href={item.href}
                                prefetch
                                className="flex items-start gap-3"
                            >
                                {item.icon ? (
                                    <item.icon className="mt-0.5 size-4 shrink-0" />
                                ) : null}
                                <span className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                                    <span className="truncate text-sm font-medium">
                                        {item.title}
                                    </span>
                                    {item.description ? (
                                        <span className="mt-1 truncate text-xs text-slate-400 group-data-[active=true]:text-white/60">
                                            {item.description}
                                        </span>
                                    ) : null}
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
