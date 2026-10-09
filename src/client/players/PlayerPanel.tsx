import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, CopyOnClick, Spinner, httpErrorToHuman, useServerPermission } from '@pterodactyl/sdk';
import { getPlayer, keys, type Player } from '../api';
import PlayerHead from '../components/PlayerHead';
import Tabs from '../components/Tabs';
import { formatDate } from '../lib/format';
import PlayerBadges from './PlayerBadges';
import PlayerActions from './PlayerActions';
import { EnderChest, Inventory } from './Inventory';
import Statistics from './Statistics';
import { useIsRunning, usePlayerAction, useServerIdentifiers } from './hooks';

export default function PlayerPanel({ player, onlinePlayers }: { player: Player; onlinePlayers: string[] }) {
    const { identifier } = useServerIdentifiers();
    const [tab, setTab] = useState<'inventory' | 'statistics'>('inventory');
    const [ender, setEnder] = useState(false);
    const running = useIsRunning();
    const canManage = useServerPermission('ext.minecraft.players-manage');
    const save = usePlayerAction();

    const details = useQuery({
        queryKey: keys.player(identifier, player.uuid ?? ''),
        queryFn: () => getPlayer(identifier, player.uuid!),
        enabled: player.uuid !== null,
    });

    const refresh = async () => {
        if (running && canManage && player.online) {
            await save.mutateAsync({ action: 'save' }).catch(() => undefined);
            await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        await details.refetch();
    };

    return (
        <div className='mc:grid mc:gap-4'>
            <div className='mc:flex mc:items-center mc:gap-4 mc:rounded-sm mc:bg-card mc:p-4 mc:shadow-md'>
                <PlayerHead player={player} size={56} />
                <div className='mc:min-w-0'>
                    <h2 className='mc:truncate mc:font-header mc:text-xl mc:font-semibold mc:text-foreground'>{player.name}</h2>
                    {player.uuid && (
                        <CopyOnClick text={player.uuid}>
                            <p className='mc:truncate mc:font-mono mc:text-xs mc:text-muted-foreground'>{player.uuid}</p>
                        </CopyOnClick>
                    )}
                    <div className='mc:mt-1'>
                        <PlayerBadges player={player} />
                    </div>
                </div>
            </div>

            <PlayerActions player={player} onlinePlayers={onlinePlayers} />

            <div className='mc:rounded-sm mc:bg-card mc:shadow-md'>
                <div className='mc:flex mc:flex-wrap mc:items-center mc:justify-between mc:gap-2 mc:px-3 mc:pt-1'>
                    <Tabs
                        active={tab}
                        onChange={setTab}
                        tabs={[
                            { id: 'inventory', label: 'Inventory' },
                            { id: 'statistics', label: 'Statistics' },
                        ]}
                    />
                    <div className='mc:flex mc:gap-2 mc:py-2'>
                        <Button size='small' isSecondary isLoading={details.isFetching || save.isPending} disabled={player.uuid === null} onClick={refresh}>
                            Refresh
                        </Button>
                        {tab === 'inventory' && (
                            <Button size='small' isSecondary onClick={() => setEnder((value) => !value)}>
                                {ender ? 'Inventory' : 'Ender Chest'}
                            </Button>
                        )}
                    </div>
                </div>
                <div className='mc:p-3'>
                    {player.uuid === null ? (
                        <p className='mc:text-sm mc:text-muted-foreground'>The UUID of this player is unknown until they join.</p>
                    ) : details.isLoading ? (
                        <Spinner centered />
                    ) : details.isError ? (
                        <p className='mc:text-sm mc:text-destructive'>{httpErrorToHuman(details.error)}</p>
                    ) : details.data && tab === 'statistics' ? (
                        <Statistics details={details.data} />
                    ) : details.data?.data ? (
                        ender ? <EnderChest data={details.data.data} /> : <Inventory data={details.data.data} />
                    ) : (
                        <p className='mc:text-sm mc:text-muted-foreground'>{player.name} has no saved player data yet.</p>
                    )}
                    {details.data?.saved_at && (
                        <p className='mc:mt-3 mc:text-xs mc:text-muted-foreground'>
                            Saved by the server at {formatDate(details.data.saved_at)}.
                            {player.online && ' Online players are saved every few minutes.'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
