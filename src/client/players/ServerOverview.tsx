import { Switch, useServerPermission } from '@pterodactyl/sdk';
import type { PlayersResponse } from '../api';
import Pill from '../components/Pill';
import { usePlayerAction } from './hooks';

export default function ServerOverview({ data }: { data: PlayersResponse }) {
    const canModerate = useServerPermission('ext.minecraft.players-moderate');
    const action = usePlayerAction();
    const { status } = data;

    return (
        <div className='mc:rounded-sm mc:bg-card mc:p-3 mc:shadow-md'>
            <div className='mc:flex mc:items-center mc:justify-between'>
                <h2 className='mc:font-header mc:text-sm mc:font-semibold mc:uppercase mc:tracking-wide mc:text-foreground'>Server overview</h2>
                <Pill tone={status.online ? 'success' : 'muted'}>{status.online ? 'Online' : 'Offline'}</Pill>
            </div>
            <div className='mc:mt-3 mc:grid mc:grid-cols-2 mc:gap-2'>
                <div className='mc:rounded-sm mc:border mc:border-border mc:bg-sunken mc:p-2'>
                    <p className='mc:text-lg mc:font-semibold mc:text-foreground'>
                        {status.players} / {status.max}
                    </p>
                    <p className='mc:text-xs mc:uppercase mc:tracking-wide mc:text-muted-foreground'>Players</p>
                </div>
                <div className='mc:rounded-sm mc:border mc:border-border mc:bg-sunken mc:p-2'>
                    <p className='mc:truncate mc:text-lg mc:font-semibold mc:text-foreground' title={status.version ?? undefined}>
                        {status.version ?? 'Unknown'}
                    </p>
                    <p className='mc:text-xs mc:uppercase mc:tracking-wide mc:text-muted-foreground'>Version</p>
                </div>
            </div>
            <div className='mc:mt-3'>
                <Switch
                    label='Whitelist'
                    description='Only whitelisted players can join.'
                    checked={data.whitelist_enabled}
                    disabled={!canModerate || action.isPending}
                    onChange={(enabled) => action.mutate({ action: 'whitelist-enabled', input: { enabled } })}
                />
            </div>
        </div>
    );
}
