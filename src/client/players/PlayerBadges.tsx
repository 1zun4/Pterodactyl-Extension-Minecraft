import type { Player } from '../api';
import Pill from '../components/Pill';

export default function PlayerBadges({ player }: { player: Player }) {
    return (
        <span className='mc:inline-flex mc:flex-wrap mc:gap-1'>
            {player.online && <Pill tone='success'>Online</Pill>}
            {player.operator && <Pill tone='warning'>OP</Pill>}
            {player.whitelisted && <Pill tone='info'>Whitelist</Pill>}
            {player.banned && <Pill tone='danger'>Banned</Pill>}
        </span>
    );
}
