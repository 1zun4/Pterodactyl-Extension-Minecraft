import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { LogLine } from '../lib/logs';
import { expandTabs, lineIndex, rowAt, rowOffsets, wrappedRows } from '../lib/viewer';

const ROW = 20;
const HEIGHT = 640;
const OVERSCAN = 30;
const GUTTER = 'mc:w-14 mc:shrink-0 mc:select-none mc:pr-3 mc:text-right mc:text-muted-foreground/60';

interface Anchor {
    /** Number of the first visible line and how far it is scrolled past. */
    number: number;
    offset: number;
    bottom: boolean;
}

/**
 * Only the visible rows are rendered, so logs with tens of thousands of lines scroll smoothly.
 * Wrapped rows start with a height counted from the monospace columns and are corrected once measured.
 */
export default function LogViewer({ lines, search, wrap }: { lines: LogLine[]; search: string; wrap: boolean }) {
    const container = useRef<HTMLDivElement>(null);
    const probe = useRef<HTMLSpanElement>(null);
    const anchor = useRef<Anchor>({ number: 0, offset: 0, bottom: true });
    const [scrollTop, setScrollTop] = useState(0);
    const [columns, setColumns] = useState(0);
    const [measured, setMeasured] = useState<{ columns: number; heights: Map<number, number> }>({ columns: 0, heights: new Map() });

    const texts = useMemo(() => (wrap ? lines.map((line) => expandTabs(line.text)) : lines.map((line) => line.text)), [lines, wrap]);
    const heights = measured.columns === columns ? measured.heights : null;

    const offsets = useMemo(
        () => rowOffsets(lines.map((line, index) => (wrap ? (heights?.get(line.number) ?? wrappedRows(texts[index], columns) * ROW) : ROW))),
        [lines, texts, wrap, columns, heights]
    );

    // Characters per row follow the width of the text column.
    useLayoutEffect(() => {
        const element = container.current;

        if (!wrap || !element) {
            return;
        }

        const measure = () => {
            const text = probe.current;
            const sample = text?.firstElementChild;

            if (text && sample) {
                const character = sample.getBoundingClientRect().width / 10;
                setColumns(character > 0 ? Math.max(1, Math.floor(text.clientWidth / character)) : 0);
            }
        };

        measure();

        if (typeof ResizeObserver === 'undefined') {
            return;
        }

        const observer = new ResizeObserver(measure);
        observer.observe(element);

        return () => observer.disconnect();
    }, [wrap]);

    // Keep the same line at the top (or stay at the end) whenever row heights change.
    useLayoutEffect(() => {
        const element = container.current;

        if (!element) {
            return;
        }

        const { number, offset, bottom } = anchor.current;
        const index = Math.min(lineIndex(lines, number), lines.length);
        const height = offsets[index + 1] - offsets[index] || 0;

        element.scrollTop = bottom ? element.scrollHeight : offsets[index] + Math.min(offset, height);
        setScrollTop(element.scrollTop);
    }, [offsets]);

    // Correct the estimate with the real height of every wrapped row on screen.
    useLayoutEffect(() => {
        const element = container.current;

        if (!wrap || columns === 0 || !element) {
            return;
        }

        let next: Map<number, number> | null = null;

        for (const row of element.querySelectorAll<HTMLElement>('[data-line]')) {
            const index = Number(row.dataset.index);
            const height = row.offsetHeight;

            if (height > 0 && height !== offsets[index + 1] - offsets[index]) {
                next ??= new Map(heights ?? []);
                next.set(Number(row.dataset.line), height);
            }
        }

        if (next) {
            setMeasured({ columns, heights: next });
        }
    });

    const onScroll = (element: HTMLDivElement) => {
        const index = rowAt(offsets, element.scrollTop);

        anchor.current = {
            number: lines[index]?.number ?? 0,
            offset: element.scrollTop - offsets[index],
            bottom: element.scrollTop + element.clientHeight >= element.scrollHeight - 2,
        };
        setScrollTop(element.scrollTop);
    };

    const start = Math.max(0, rowAt(offsets, scrollTop) - OVERSCAN);
    const end = Math.min(lines.length, rowAt(offsets, scrollTop + HEIGHT) + 1 + OVERSCAN);

    return (
        <div
            ref={container}
            onScroll={(event) => onScroll(event.currentTarget)}
            className='mc:relative mc:overflow-auto mc:rounded-sm mc:bg-terminal mc:font-mono mc:text-xs mc:text-terminal-foreground'
            style={{ height: HEIGHT }}
        >
            {wrap && (
                <div aria-hidden className='mc:invisible mc:absolute mc:inset-x-0 mc:top-0 mc:flex mc:h-0 mc:overflow-hidden'>
                    <span className={GUTTER} />
                    <span ref={probe} className='mc:min-w-0 mc:flex-1'>
                        <span>0000000000</span>
                    </span>
                </div>
            )}
            {lines.length === 0 ? (
                <p className='mc:p-4 mc:text-muted-foreground'>No lines match.</p>
            ) : (
                <div className={wrap ? 'mc:relative' : 'mc:relative mc:min-w-max'} style={{ height: offsets[lines.length] }}>
                    {lines.slice(start, end).map((line, index) => (
                        <div
                            key={line.number}
                            data-line={line.number}
                            data-index={start + index}
                            className={wrap ? 'mc:absolute mc:inset-x-0 mc:flex' : 'mc:absolute mc:left-0 mc:flex mc:whitespace-pre'}
                            style={{ top: offsets[start + index], height: wrap ? undefined : ROW, lineHeight: `${ROW}px` }}
                        >
                            <span className={GUTTER}>{line.number}</span>
                            <span
                                className={`${wrap ? 'mc:min-w-0 mc:flex-1 mc:whitespace-pre-wrap mc:break-all' : ''} ${
                                    line.level === 'error' ? 'mc:text-destructive' : line.level === 'warn' ? 'mc:text-warning' : ''
                                }`}
                            >
                                {highlight(texts[start + index], search)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function highlight(text: string, search: string): ReactNode {
    const query = search.trim();

    if (query === '') {
        return text;
    }

    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

    return parts.map((part, index) => (index % 2 === 1 ? <mark key={index} className='mc:rounded-sm mc:bg-warning/40 mc:text-foreground'>{part}</mark> : part));
}
