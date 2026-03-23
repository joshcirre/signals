import { cn } from '@/lib/utils';

export function BrandMark({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'relative flex size-10 items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#112031_0%,#1c4fa1_55%,#7dd3fc_100%)] text-white shadow-[0_12px_34px_rgba(17,32,49,0.28)]',
                className,
            )}
        >
            <div className="absolute inset-[2px] rounded-[1rem] border border-white/15" />
            <div className="absolute top-0 -right-2 size-6 rounded-full bg-white/15 blur-md" />
            <span className="relative text-sm font-semibold tracking-[0.3em]">
                NS
            </span>
        </div>
    );
}
