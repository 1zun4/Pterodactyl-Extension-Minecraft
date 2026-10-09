import type { Player } from '../api';
import PlayerHead from '../components/PlayerHead';
import PlayerBadges from './PlayerBadges';

export type Filter = 'all' | 'online' | 'banned' | 'whitelist' | 'operators' | 'banned-ips';

export const FILTERS: { id: Filter; label: string; test: (player: Player) => boolean }[] = [
    { id: 'all', label: 'All', test: () => true },
    { id: 'online', label: 'Online', test: (player) => player.online },
    { id: 'banned', label: 'Banned', test: (player) => player.banned },
    { id: 'whitelist', label: 'Whitelist', test: (player) => player.whitelisted },
    { id: 'operators', label: 'Operators', test: (player) => player.operator },
];

interface Props {
    filter: Filter;
    counts: Record<Filter, number>;
    onFilter: (filter: Filter) => void;
}

export function FilterChips({ filter, counts, onFilter }: Props) {
    const chips = [...FILTERS.map(({ id, label }) => ({ id, label })), { id: 'banned-ips' as const, label: 'Banned IPs' }];

    return (
        <div className='mc:grid mc:grid-cols-2 mc:gap-2'>
            {chips.map((chip) => (
                <button
                    key={chip.id}
                    type='button'
                    aria-pressed={chip.id === filter}
                    onClick={() => onFilter(chip.id)}
                    className={
                        chip.id === filter
                            ? 'mc:rounded-sm mc:bg-primary mc:px-3 mc:py-1.5 mc:text-left mc:text-xs mc:text-primary-foreground'
                            : 'mc:rounded-sm mc:border mc:border-border mc:bg-card mc:px-3 mc:py-1.5 mc:text-left mc:text-xs mc:text-muted-foreground mc:transition-colors mc:hover:text-foreground'
                    }
                >
                    {chip.label} ({counts[chip.id]})
                </button>
            ))}
        </div>
    );
}

export function PlayerList({ players, selected, onSelect }: { players: Player[]; selected: string | null; onSelect: (player: Player) => void }) {
    if (players.length === 0) {
        return <p className='mc:py-6 mc:text-center mc:text-sm mc:text-muted-foreground'>No players found.</p>;
    }

    return (
        <ul className='mc:grid mc:gap-2'>
            {players.map((player) => {
                const key = player.uuid ?? player.name;

                return (
                    <li key={key}>
                        <button
                            type='button'
                            onClick={() => onSelect(player)}
                            aria-current={key === selected}
                            className={`mc:flex mc:w-full mc:items-center mc:gap-3 mc:rounded-sm mc:border mc:bg-card mc:p-2 mc:text-left mc:shadow-sm mc:transition-colors ${
                                key === selected ? 'mc:border-primary' : 'mc:border-transparent mc:hover:border-border'
                            }`}
                        >
                            <span className='mc:relative'>
                                <PlayerHead player={player} size={32} />
                                {player.online && <span className='mc:absolute mc:-right-0.5 mc:-bottom-0.5 mc:h-2.5 mc:w-2.5 mc:rounded-full mc:border-2 mc:border-card mc:bg-success' />}
                            </span>
                            <span className='mc:min-w-0'>
                                <span className='mc:block mc:truncate mc:text-sm mc:text-foreground'>{player.name}</span>
                                <PlayerBadges player={player} />
                            </span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
