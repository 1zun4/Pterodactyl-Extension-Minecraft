import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Checkbox, Dialog, Input, Label, Switch, httpErrorToHuman, toast } from '@pterodactyl/sdk';
import { cleanLogs, getLogs, keys, saveCleanupSchedule } from '../api';
import { formatBytes } from '../lib/format';

export default function CleanLogsDialog({ open, onClose, server }: { open: boolean; onClose: () => void; server: string }) {
    const queryClient = useQueryClient();
    const logs = useQuery({ queryKey: keys.logs(server), queryFn: () => getLogs(server), enabled: open });
    const [days, setDays] = useState('14');
    const [include, setInclude] = useState({ logs: true, crashes: true });
    const [archive, setArchive] = useState(false);
    const options = { days: Number(days || 0), ...include, archive };

    useEffect(() => {
        const schedule = logs.data?.schedule;

        if (open && schedule) {
            setDays(String(schedule.cleanup_days));
            setInclude({ logs: schedule.cleanup_logs, crashes: schedule.cleanup_crashes });
            setArchive(schedule.cleanup_archive);
        }
    }, [open, logs.data?.schedule]);

    const preview = useQuery({
        queryKey: [...keys.logs(server), 'preview', options],
        queryFn: () => cleanLogs(server, { ...options, dry_run: true }),
        enabled: open && (include.logs || include.crashes),
    });

    const clean = useMutation({
        mutationFn: () => cleanLogs(server, { ...options, dry_run: false }),
        onSuccess: ({ files, archives }) => {
            toast.success(archives.length > 0 ? `Archived and removed ${files.length} files.` : `Deleted ${files.length} files.`);
            queryClient.invalidateQueries({ queryKey: keys.logs(server) });
            onClose();
        },
        onError: (error) => toast.error(httpErrorToHuman(error)),
    });

    const schedule = useMutation({
        mutationFn: (enabled: boolean) =>
            saveCleanupSchedule(server, { cleanup: enabled, cleanup_days: Math.max(1, options.days), cleanup_logs: include.logs, cleanup_crashes: include.crashes, cleanup_archive: archive }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.logs(server) }),
        onError: (error) => toast.error(httpErrorToHuman(error)),
    });

    const files = preview.data?.files ?? [];
    const size = files.reduce((total, file) => total + file.size, 0);

    return (
        <Dialog open={open} onClose={onClose} title='Clean logs' description='Removes old log archives and crash reports. latest.log is never touched.'>
            <div className='mc:grid mc:gap-4'>
                <div>
                    <Label htmlFor='mc-clean-days'>Older than (days)</Label>
                    <Input id='mc-clean-days' inputMode='numeric' value={days} onChange={(event) => /^\d{0,4}$/.test(event.currentTarget.value) && setDays(event.currentTarget.value)} />
                </div>
                <div className='mc:grid mc:gap-2 mc:text-sm'>
                    <label className='mc:flex mc:items-center mc:gap-2'>
                        <Checkbox checked={include.logs} onChange={(checked) => setInclude((current) => ({ ...current, logs: checked }))} />
                        Old logs in <code className='mc:font-mono'>logs/</code>
                    </label>
                    <label className='mc:flex mc:items-center mc:gap-2'>
                        <Checkbox checked={include.crashes} onChange={(checked) => setInclude((current) => ({ ...current, crashes: checked }))} />
                        Crash reports in <code className='mc:font-mono'>crash-reports/</code>
                    </label>
                </div>
                <Switch label='Archive first' description='Pack the files into one archive before deleting them.' checked={archive} onChange={setArchive} />
                <p className='mc:rounded-sm mc:bg-sunken mc:px-3 mc:py-2 mc:text-sm'>
                    {preview.isFetching ? 'Counting files...' : `${files.length} files, ${formatBytes(size)}`}
                </p>
                <div className='mc:border-t mc:border-border mc:pt-4'>
                    <Switch
                        label='Clean up every day'
                        description='Runs at 04:10 with the options above.'
                        checked={logs.data?.schedule.cleanup ?? false}
                        disabled={schedule.isPending || !logs.data}
                        onChange={(enabled) => schedule.mutate(enabled)}
                    />
                </div>
            </div>
            <Dialog.Footer>
                <Button.Text className='mc:w-full mc:sm:w-auto' onClick={onClose}>
                    Cancel
                </Button.Text>
                <Button.Danger className='mc:w-full mc:sm:w-auto' disabled={files.length === 0} isLoading={clean.isPending} onClick={() => clean.mutate()}>
                    {archive ? 'Archive and delete' : 'Delete'}
                </Button.Danger>
            </Dialog.Footer>
        </Dialog>
    );
}
