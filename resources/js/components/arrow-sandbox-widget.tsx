import { sandbox } from '@arrow-js/sandbox';
import { useEffect, useRef } from 'react';

export interface ArrowSource {
    'main.ts'?: string;
    'main.js'?: string;
    'main.css'?: string;
    [key: string]: string | undefined;
}

export interface LiveWidget {
    id: number;
    position: string;
    title: string;
    arrow_source: ArrowSource;
}

export function ArrowSandboxWidget({
    onError,
    shadowDOM = true,
    source,
}: {
    onError?: (error: Error | string) => void;
    shadowDOM?: boolean;
    source: ArrowSource;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const serializedSource = JSON.stringify(source);

    useEffect(() => {
        const el = containerRef.current;

        if (!el) {
            return;
        }

        el.innerHTML = '';

        const template = sandbox({
            source: JSON.parse(serializedSource) as ArrowSource,
            shadowDOM,
            onError,
        });
        template(el);

        return () => {
            el.innerHTML = '';
        };
    }, [onError, serializedSource, shadowDOM]);

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
