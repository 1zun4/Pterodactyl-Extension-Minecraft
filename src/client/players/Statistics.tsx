import type { PlayerDetails } from '../api';
import { formatDistance, formatPlayTime } from '../lib/format';

function Stat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className='mc:rounded-sm mc:border mc:border-border mc:bg-sunken mc:p-3'>
            <p className='mc:truncate mc:text-lg mc:font-semibold mc:text-foreground'>{value}</p>
            <p className='mc:text-xs mc:uppercase mc:tracking-wide mc:text-muted-foreground'>{label}</p>
        </div>
    );
}

export default function Statistics({ details }: { details: PlayerDetails }) {
    const { data, statistics } = details;
    const capitalize = (text: string) => text.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase());

    return (
        <div className='mc:grid mc:grid-cols-2 mc:gap-2 mc:md:grid-cols-4'>
            {data && (
                <>
                    <Stat label='Health' value={`${data.health} / 20`} />
                    <Stat label='Food' value={`${data.food} / 20`} />
                    <Stat label='XP level' value={data.xp_level} />
                    <Stat label='Game mode' value={capitalize(data.game_mode)} />
                    <Stat label='Dimension' value={capitalize(data.dimension)} />
                    <Stat label='Position' value={data.position ? data.position.join(', ') : 'Unknown'} />
                </>
            )}
            <Stat label='Advancements' value={statistics.advancements} />
            <Stat label='Play time' value={formatPlayTime(statistics.play_time)} />
            <Stat label='Deaths' value={statistics.deaths} />
            <Stat label='Mob kills' value={statistics.mob_kills} />
            <Stat label='Player kills' value={statistics.player_kills} />
            <Stat label='Distance walked' value={formatDistance(statistics.distance_walked)} />
        </div>
    );
}
