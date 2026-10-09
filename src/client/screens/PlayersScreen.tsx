import { useMemo, useState } from 'react';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    Input,
    NamedIcon,
    ServerContentBlock,
    ServerError,
    Spinner,
    httpErrorToHuman,
} from '@pterodactyl/sdk';
import Activity from '../players/Activity';
import AddPlayer from '../players/AddPlayer';
import BannedIps from '../players/BannedIps';
import PlayerPanel from '../players/PlayerPanel';
import { FILTERS, FilterChips, PlayerList, type Filter } from '../players/PlayerList';
import ServerOverview from '../players/ServerOverview';
import { usePlayers } from '../players/hooks';

export default function PlayersScreen() {
    const players = usePlayers();
    const [filter, setFilter] = useState<Filter>('all');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string | null>(null);

    const list = players.data?.players ?? [];
    const counts = useMemo(
        () => ({
            ...(Object.fromEntries(FILTERS.map(({ id, test }) => [id, list.filter(test).length])) as Record<Exclude<Filter, 'banned-ips'>, number>),
            'banned-ips': players.data?.banned_ips.length ?? 0,
        }),
        [list, players.data]
    );

    const visible = useMemo(() => {
        const test = FILTERS.find(({ id }) => id === filter)?.test ?? (() => true);
        const needle = search.trim().toLowerCase();

        return list.filter((player) => test(player) && (needle === '' || player.name.toLowerCase().includes(needle) || player.uuid?.includes(needle)));
    }, [list, filter, search]);

    const current = list.find((player) => (player.uuid ?? player.name) === selected) ?? null;
    const onlineNames = list.filter((player) => player.online).map((player) => player.name);

    if (players.isError) {
        return <ServerError title='Could not load players' message={httpErrorToHuman(players.error)} onRetry={() => players.refetch()} />;
    }

    return (
        <ServerContentBlock title='Players'>
            {!players.data ? (
                <Spinner centered size={Spinner.Size.LARGE} />
            ) : (
                <>
                    <div className='mc:grid mc:gap-6 mc:lg:grid-cols-[20rem_minmax(0,1fr)]'>
                        <div className='mc:grid mc:content-start mc:gap-3'>
                            <ServerOverview data={players.data} />
                            <FilterChips filter={filter} counts={counts} onFilter={setFilter} />
                            {filter === 'banned-ips' ? (
                                <BannedIps entries={players.data.banned_ips} />
                            ) : (
                                <>
                                    <Input placeholder='Search players...' aria-label='Search players' value={search} onChange={(event) => setSearch(event.currentTarget.value)} />
                                    <PlayerList players={visible} selected={selected} onSelect={(player) => setSelected(player.uuid ?? player.name)} />
                                    <AddPlayer />
                                </>
                            )}
                        </div>
                        {current ? (
                            <PlayerPanel key={selected} player={current} onlinePlayers={onlineNames} />
                        ) : (
                            <Empty className='mc:border mc:bg-card'>
                                <EmptyHeader>
                                    <EmptyMedia variant='icon'>
                                        <NamedIcon name='user-round' />
                                    </EmptyMedia>
                                    <EmptyTitle>Select a player</EmptyTitle>
                                    <EmptyDescription>Pick a player on the left to see their inventory, statistics and actions.</EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        )}
                    </div>
                    <div className='mc:mt-6'>
                        <Activity />
                    </div>
                </>
            )}
        </ServerContentBlock>
    );
}
