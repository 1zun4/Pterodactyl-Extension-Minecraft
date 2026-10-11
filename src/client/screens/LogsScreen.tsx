import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Input, Select, ServerContentBlock, Spinner, TitledGreyBox, httpErrorToHuman, toast, useCurrentServerRequired, useServerPermission } from '@pterodactyl/sdk';
import { getLogContent, getLogs, keys, shareLog, type LogFile } from '../api';
import { formatBytes, formatDate } from '../lib/format';
import { countLevels, filterLines, parseLog, type Filter, type LogLine } from '../lib/logs';

const ROW = 20;
const HEIGHT = 640;
const OVERSCAN = 30;

export default function LogsScreen() {
    const { identifier } = useCurrentServerRequired().attributes;
    const canShare = useServerPermission('ext.minecraft.logs-share');
    const files = useQuery({ queryKey: ['minecraft', identifier, 'log-files'], queryFn: () => getLogs(identifier) });
    const [selected, setSelected] = useState<string | null>(null);
    const [filter, setFilter] = useState<Filter>('all');
    const [search, setSearch] = useState('');

    const list = files.data?.files ?? [];
    const path = selected ?? list.find((file) => file.name === 'latest.log')?.path ?? list[0]?.path ?? null;
    const content = useQuery({ queryKey: keys.logContent(identifier, path ?? ''), queryFn: () => getLogContent(identifier, path!), enabled: path !== null });

    const lines = useMemo(() => parseLog(content.data?.content ?? ''), [content.data]);
    const counts = useMemo(() => countLevels(lines), [lines]);
    const shown = useMemo(() => filterLines(lines, filter, search), [lines, filter, search]);

    const sharing = useMutation({
        mutationFn: () => shareLog(identifier, path),
        onSuccess: ({ url }) => {
            window.open(url, '_blank', 'noopener');
            toast.success('Shared on mclo.gs.');
        },
        onError: (error) => toast.error(httpErrorToHuman(error)),
    });

    const download = () => {
        const name = (path ?? 'log').split('/').pop()!.replace(/\.gz$/, '');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([content.data?.content ?? ''], { type: 'text/plain' }));
        link.download = name;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <ServerContentBlock title='Logs'>
            <div className='mc:grid mc:gap-4 mc:lg:grid-cols-[16rem_minmax(0,1fr)]'>
                <TitledGreyBox title='Files'>
                    {files.isLoading ? (
                        <Spinner centered />
                    ) : list.length === 0 ? (
                        <p className='mc:text-sm mc:text-muted-foreground'>No logs yet.</p>
                    ) : (
                        <FileList files={list} selected={path} onSelect={setSelected} />
                    )}
                </TitledGreyBox>
                <div className='mc:min-w-0'>
                    <div className='mc:mb-3 mc:flex mc:flex-wrap mc:items-center mc:gap-2'>
                        <Input className='mc:min-w-0 mc:flex-1' placeholder='Search this log...' aria-label='Search this log' value={search} onChange={(event) => setSearch(event.currentTarget.value)} />
                        <div className='mc:w-56'>
                            <Select
                                aria-label='Show'
                                value={filter}
                                onChange={(value) => setFilter(value as Filter)}
                                options={[
                                    { value: 'all', label: `All lines (${lines.length})` },
                                    { value: 'problems', label: `Warnings and errors (${counts.warn + counts.error})` },
                                    { value: 'errors', label: `Errors only (${counts.error})` },
                                ]}
                            />
                        </div>
                        <Button.Text size='small' disabled={content.isFetching} onClick={() => (files.refetch(), content.refetch())}>
                            Refresh
                        </Button.Text>
                        <Button.Text size='small' disabled={!content.data} onClick={download}>
                            Download
                        </Button.Text>
                        {canShare && (
                            <Button size='small' disabled={!path} isLoading={sharing.isPending} onClick={() => sharing.mutate()}>
                                Share
                            </Button>
                        )}
                    </div>
                    <p className='mc:mb-2 mc:text-xs mc:text-muted-foreground'>
                        {shown.length} of {lines.length} lines shown · {counts.error} errors · {counts.warn} warnings
                        {content.data?.truncated && ' · showing the end of a very large file'}
                    </p>
                    {content.isError ? (
                        <p className='mc:text-sm mc:text-destructive'>{httpErrorToHuman(content.error)}</p>
                    ) : content.isLoading && path ? (
                        <Spinner centered size={Spinner.Size.LARGE} />
                    ) : (
                        <Viewer key={path} lines={shown} search={search} />
                    )}
                </div>
            </div>
        </ServerContentBlock>
    );
}

function FileList({ files, selected, onSelect }: { files: LogFile[]; selected: string | null; onSelect: (path: string) => void }) {
    const groups = [
        { title: 'Logs', files: files.filter((file) => file.directory === 'logs') },
        { title: 'Crash reports', files: files.filter((file) => file.directory === 'crash-reports') },
    ].filter((group) => group.files.length > 0);

    return (
        <div className='mc:grid mc:max-h-[40rem] mc:gap-4 mc:overflow-y-auto'>
            {groups.map((group) => (
                <div key={group.title}>
                    <p className='mc:mb-1 mc:text-xs mc:uppercase mc:text-muted-foreground'>{group.title}</p>
                    <ul className='mc:grid mc:gap-1'>
                        {group.files.map((file) => (
                            <li key={file.path}>
                                <button
                                    type='button'
                                    onClick={() => onSelect(file.path)}
                                    className={`mc:w-full mc:rounded-sm mc:px-2 mc:py-1.5 mc:text-left mc:text-sm ${file.path === selected ? 'mc:bg-muted mc:text-foreground' : 'mc:text-muted-foreground mc:hover:bg-muted/60'}`}
                                >
                                    <span className='mc:block mc:truncate'>{file.name}</span>
                                    <span className='mc:block mc:text-xs mc:text-muted-foreground'>
                                        {formatBytes(file.size)} · {formatDate(file.modified)}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}

/** Only the visible rows are rendered, so logs with tens of thousands of lines scroll smoothly. */
function Viewer({ lines, search }: { lines: LogLine[]; search: string }) {
    const container = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);

    useLayoutEffect(() => {
        const element = container.current;

        if (element) {
            element.scrollTop = element.scrollHeight;
            setScrollTop(element.scrollTop);
        }
    }, []);

    useEffect(() => setScrollTop(container.current?.scrollTop ?? 0), [lines]);

    const start = Math.max(0, Math.floor(scrollTop / ROW) - OVERSCAN);
    const end = Math.min(lines.length, Math.ceil((scrollTop + HEIGHT) / ROW) + OVERSCAN);

    return (
        <div
            ref={container}
            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
            className='mc:overflow-auto mc:rounded-sm mc:bg-terminal mc:font-mono mc:text-xs mc:text-terminal-foreground'
            style={{ height: HEIGHT }}
        >
            {lines.length === 0 ? (
                <p className='mc:p-4 mc:text-muted-foreground'>No lines match.</p>
            ) : (
                <div className='mc:relative mc:min-w-max' style={{ height: lines.length * ROW }}>
                    {lines.slice(start, end).map((line, index) => (
                        <div key={line.number} className='mc:absolute mc:left-0 mc:flex mc:whitespace-pre' style={{ top: (start + index) * ROW, height: ROW, lineHeight: `${ROW}px` }}>
                            <span className='mc:w-14 mc:shrink-0 mc:select-none mc:pr-3 mc:text-right mc:text-muted-foreground/60'>{line.number}</span>
                            <span className={line.level === 'error' ? 'mc:text-destructive' : line.level === 'warn' ? 'mc:text-warning' : undefined}>{highlight(line.text, search)}</span>
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
