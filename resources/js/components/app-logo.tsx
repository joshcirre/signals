import { BrandMark } from '@/components/brand-mark';
import { storeBrand } from '@/lib/brand';

export default function AppLogo() {
    return (
        <>
            <BrandMark />
            <div className="ml-2 grid flex-1 text-left">
                <span className="truncate text-sm font-semibold tracking-tight text-slate-950">
                    {storeBrand.adminName}
                </span>
            </div>
        </>
    );
}
