import { useState } from 'react';
import { avatarUrl } from '../config';

export default function PlayerHead({ player, size }: { player: { uuid: string | null; name: string }; size: number }) {
    const [failed, setFailed] = useState(false);

    if (failed) {
        return (
            <span
                aria-hidden
                style={{ width: size, height: size }}
                className='mc:inline-flex mc:shrink-0 mc:items-center mc:justify-center mc:rounded-sm mc:bg-muted mc:text-xs mc:font-semibold mc:uppercase mc:text-muted-foreground'
            >
                {player.name.slice(0, 2)}
            </span>
        );
    }

    return (
        <img
            alt=''
            width={size}
            height={size}
            loading='lazy'
            src={avatarUrl(player, size * 2)}
            onError={() => setFailed(true)}
            className='mc:shrink-0 mc:rounded-sm'
            style={{ imageRendering: 'pixelated' }}
        />
    );
}
