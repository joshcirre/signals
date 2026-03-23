import { cn } from '@/lib/utils';

export function BrandMark({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'flex size-8 items-center justify-center rounded-lg bg-slate-950',
                className,
            )}
        >
            <div className="flex items-end gap-[3px]">
                <span className="h-2.5 w-[3px] rounded-sm bg-white/60" />
                <span className="h-4 w-[3px] rounded-sm bg-white/80" />
                <span className="h-5 w-[3px] rounded-sm bg-white" />
            </div>
        </div>
    );
}
