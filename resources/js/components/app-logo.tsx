import { BrandMark } from '@/components/brand-mark';
import { storeBrand } from '@/lib/brand';

export default function AppLogo() {
    return (
        <>
            <BrandMark className="size-10 rounded-2xl" />
            <div className="ml-2 grid flex-1 text-left">
                <span className="truncate text-sm font-semibold tracking-tight text-slate-950">
                    {storeBrand.adminName}
                </span>
                <span className="truncate text-xs text-slate-500">
                    {storeBrand.accent}
                </span>
            </div>
        </>
    );
}
