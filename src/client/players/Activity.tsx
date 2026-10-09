import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Spinner, Switch, TitledGreyBox, Tooltip, httpErrorToHuman, toast, useServerPermission } from '@pterodactyl/sdk';
import { getHistory, keys, setHistory } from '../api';
import { buildHeatmap } from '../lib/heatmap';
import { useServerIdentifiers } from './hooks';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Activity() {
    const { identifier } = useServerIdentifiers();
    const queryClient = useQueryClient();
    const canModerate = useServerPermission('ext.minecraft.players-moderate');
    const history = useQuery({ queryKey: keys.history(identifier), queryFn: () => getHistory(identifier) });
    const heatmap = useMemo(() => buildHeatmap(history.data?.hours ?? []), [history.data]);

    const toggle = useMutation({
        mutationFn: (enabled: boolean) => setHistory(identifier, enabled),
        onSuccess: (data) => queryClient.setQueryData(keys.history(identifier), data),
        onError: (error) => toast.error(httpErrorToHuman(error)),
    });

    return (
        <TitledGreyBox title='Player activity'>
            <div className='mc:mb-3 mc:flex mc:flex-wrap mc:items-center mc:justify-between mc:gap-3'>
                <p className='mc:text-xs mc:text-muted-foreground'>
                    Average players per hour over the last {history.data?.days ?? 28} days, in your time zone.
                    {heatmap.peak && ` Peak: ${heatmap.peak.players} players on ${heatmap.peak.at.toLocaleString()}.`}
                </p>
                <Switch
                    label='Record history'
                    checked={history.data?.enabled ?? false}
                    disabled={!canModerate || toggle.isPending || history.isLoading}
                    onChange={(enabled) => toggle.mutate(enabled)}
                />
            </div>
            {history.isLoading ? (
                <Spinner centered />
            ) : history.data && history.data.hours.length === 0 ? (
                <p className='mc:py-4 mc:text-center mc:text-sm mc:text-muted-foreground'>
                    {history.data.enabled ? 'The first samples arrive within five minutes.' : 'Turn on history to record player counts every five minutes.'}
                </p>
            ) : (
                <div className='mc:overflow-x-auto'>
                    <div className='mc:grid mc:min-w-[36rem] mc:grid-cols-[2.5rem_repeat(24,minmax(0,1fr))] mc:gap-0.5 mc:text-[0.65rem] mc:text-muted-foreground'>
                        <span />
                        {Array.from({ length: 24 }, (_, hour) => (
                            <span key={hour} className='mc:text-center'>
                                {hour % 3 === 0 ? hour : ''}
                            </span>
                        ))}
                        {heatmap.cells.map((row, day) => (
                            <Row key={day} day={DAYS[day]} row={row} max={heatmap.max} />
                        ))}
                    </div>
                </div>
            )}
        </TitledGreyBox>
    );
}

function Row({ day, row, max }: { day: string; row: number[]; max: number }) {
    return (
        <>
            <span className='mc:self-center'>{day}</span>
            {row.map((value, hour) => (
                <Tooltip key={hour} content={`${day} ${hour}:00 · ${value.toFixed(1)} players`}>
                    <span
                        className='mc:h-4 mc:rounded-[2px] mc:bg-primary'
                        style={{ opacity: max > 0 && value > 0 ? 0.15 + 0.85 * (value / max) : 0.06 }}
                    />
                </Tooltip>
            ))}
        </>
    );
}
