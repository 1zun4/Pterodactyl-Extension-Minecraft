import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Input, Select, ServerContentBlock, Spinner, Switch, TitledGreyBox, httpErrorToHuman, toast, useCurrentServerRequired, useServerPermission } from '@pterodactyl/sdk';
import { getLogContent, getLogs, keys, shareLog, type LogFile } from '../api';
import { formatBytes, formatDate } from '../lib/format';
import { countLevels, filterLines, parseLog, type Filter } from '../lib/logs';
import { WIDE, useMediaQuery } from '../lib/media';
import LogViewer from '../logs/LogViewer';

export default function LogsScreen() {
    const { identifier } = useCurrentServerRequired().attributes;
    const canShare = useServerPermission('ext.minecraft.logs-share');
    const wide = useMediaQuery(WIDE);
    const files = useQuery({ queryKey: ['minecraft', identifier, 'log-files'], queryFn: () => getLogs(identifier) });
    const [selected, setSelected] = useState<string | null>(null);
    const [filter, setFilter] = useState<Filter>('all');
    const [search, setSearch] = useState('');
    const [wrap, setWrap] = useState(false);

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

    const fileChooser = files.isLoading ? (
        <Spinner centered />
    ) : list.length === 0 ? (
        <p className='mc:text-sm mc:text-muted-foreground'>No logs yet.</p>
    ) : wide ? (
        <FileList files={list} selected={path} onSelect={setSelected} />
    ) : (
        <FileSelect files={list} selected={path} onSelect={setSelected} />
    );

    return (
        <ServerContentBlock title='Logs'>
            <div className='mc:grid mc:grid-cols-1 mc:gap-4 mc:lg:grid-cols-[16rem_minmax(0,1fr)]'>
                {wide ? <TitledGreyBox title='Files'>{fileChooser}</TitledGreyBox> : <div>{fileChooser}</div>}
                <div className='mc:min-w-0'>
                    <div className='mc:mb-3 mc:flex mc:flex-wrap mc:items-center mc:gap-2'>
                        <Input className='mc:min-w-[8rem] mc:flex-1' placeholder='Search log...' aria-label='Search this log' value={search} onChange={(event) => setSearch(event.currentTarget.value)} />
                        <div className='mc:w-44 mc:sm:w-56'>
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
                        <div className='mc:flex mc:gap-2'>
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
                    </div>
                    <div className='mc:mb-2 mc:flex mc:flex-wrap mc:items-center mc:justify-between mc:gap-x-4 mc:gap-y-2'>
                        <p className='mc:text-xs mc:text-muted-foreground'>
                            {shown.length} of {lines.length} lines shown · {counts.error} errors · {counts.warn} warnings
                            {content.data?.truncated && ' · showing the end of a very large file'}
                        </p>
                        <Switch label='Wrap lines' checked={wrap} onChange={setWrap} />
                    </div>
                    {content.isError ? (
                        <p className='mc:text-sm mc:text-destructive'>{httpErrorToHuman(content.error)}</p>
                    ) : content.isLoading && path ? (
                        <Spinner centered size={Spinner.Size.LARGE} />
                    ) : (
                        <LogViewer key={path} lines={shown} search={search} wrap={wrap} />
                    )}
                </div>
            </div>
        </ServerContentBlock>
    );
}

interface FilesProps {
    files: LogFile[];
    selected: string | null;
    onSelect: (path: string) => void;
}

function groupFiles(files: LogFile[]) {
    return [
        { title: 'Logs', files: files.filter((file) => file.directory === 'logs') },
        { title: 'Crash reports', files: files.filter((file) => file.directory === 'crash-reports') },
    ].filter((group) => group.files.length > 0);
}

function FileList({ files, selected, onSelect }: FilesProps) {
    return (
        <div className='mc:grid mc:max-h-[40rem] mc:gap-4 mc:overflow-y-auto'>
            {groupFiles(files).map((group) => (
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
                                    <FileMeta file={file} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}

/** The file list takes a whole screen on phones, so narrow layouts pick the file from a select. */
function FileSelect({ files, selected, onSelect }: FilesProps) {
    return (
        <>
            <label htmlFor='mc-log-file' className='mc:sr-only'>
                Log file
            </label>
            <Select
                id='mc-log-file'
                value={selected}
                onChange={(value) => onSelect(String(value))}
                groups={groupFiles(files).map((group) => ({
                    label: group.title,
                    options: group.files.map((file) => ({
                        value: file.path,
                        textLabel: file.name,
                        label: (
                            <span className='mc:block mc:min-w-0'>
                                <span className='mc:block mc:truncate mc:text-foreground'>{file.name}</span>
                                <FileMeta file={file} />
                            </span>
                        ),
                    })),
                }))}
            />
        </>
    );
}

function FileMeta({ file }: { file: LogFile }) {
    return (
        <span className='mc:block mc:truncate mc:text-xs mc:text-muted-foreground'>
            {formatBytes(file.size)} · {formatDate(file.modified)}
        </span>
    );
}
