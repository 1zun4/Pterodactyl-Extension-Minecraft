import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, CopyOnClick, Dialog, Label, Select, httpErrorToHuman } from '@pterodactyl/sdk';
import { getLogs, keys, shareLog } from '../api';
import { formatBytes } from '../lib/format';

const CONSOLE = '';

export default function ShareLogDialog({ open, onClose, server }: { open: boolean; onClose: () => void; server: string }) {
    const files = useQuery({ queryKey: keys.logs(server), queryFn: () => getLogs(server), enabled: open });
    const [source, setSource] = useState<string>('logs/latest.log');
    const share = useMutation({ mutationFn: () => shareLog(server, source === CONSOLE ? null : source) });

    useEffect(() => {
        if (open) {
            share.reset();
        }
    }, [open]);

    const options = [
        { value: CONSOLE, label: 'Console (last 100 lines)' },
        ...(files.data?.files ?? []).filter((file) => file.size > 0).map((file) => ({ value: file.path, label: `${file.path} (${formatBytes(file.size)})` })),
    ];

    return (
        <Dialog open={open} onClose={onClose} title='Share a log' description='Uploads the log to mclo.gs, where anyone with the link can read it. IP addresses are hidden by mclo.gs.'>
            {share.data ? (
                <div className='mc:grid mc:gap-2'>
                    <Label>Share link</Label>
                    <CopyOnClick text={share.data.url}>
                        <p className='mc:rounded-sm mc:bg-sunken mc:px-3 mc:py-2 mc:font-mono mc:text-sm mc:text-foreground'>{share.data.url}</p>
                    </CopyOnClick>
                </div>
            ) : (
                <div>
                    <Label htmlFor='mc-share-source'>Log</Label>
                    <Select id='mc-share-source' value={source} options={options} onChange={(value) => setSource(String(value))} />
                    {share.isError && <p className='mc:mt-2 mc:text-sm mc:text-destructive'>{httpErrorToHuman(share.error)}</p>}
                </div>
            )}
            <Dialog.Footer>
                <Button.Text className='mc:w-full mc:sm:w-auto' onClick={onClose}>
                    {share.data ? 'Close' : 'Cancel'}
                </Button.Text>
                {share.data ? (
                    <Button className='mc:w-full mc:sm:w-auto' onClick={() => window.open(share.data.url, '_blank', 'noopener')}>
                        Open
                    </Button>
                ) : (
                    <Button className='mc:w-full mc:sm:w-auto' isLoading={share.isPending} onClick={() => share.mutate()}>
                        Upload
                    </Button>
                )}
            </Dialog.Footer>
        </Dialog>
    );
}
