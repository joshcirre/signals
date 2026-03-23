import { sandbox } from '@arrow-js/sandbox';
import { useEffect, useRef } from 'react';

interface ArrowSource {
    'main.ts': string;
    'main.css'?: string;
}

export interface LiveWidget {
    id: number;
    position: string;
    title: string;
    arrow_source: ArrowSource;
}

export function ArrowSandboxWidget({ source }: { source: ArrowSource }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sourceKey = JSON.stringify(source);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) {
            return;
        }

        el.innerHTML = '';

        const template = sandbox({ source });
        template(el);

        return () => {
            el.innerHTML = '';
        };
    }, [sourceKey]);

    return <div ref={containerRef} />;
}

export function LiveWidgetSlot({
    widgets,
    position,
}: {
    widgets: LiveWidget[];
    position: string;
}) {
    const slotWidgets = widgets.filter((w) => w.position === position);

    if (slotWidgets.length === 0) {
        return null;
    }

    return (
        <>
            {slotWidgets.map((widget) => (
                <div key={widget.id} className="border-b border-slate-950/10">
                    <ArrowSandboxWidget source={widget.arrow_source} />
                </div>
            ))}
        </>
    );
}
