import { useState } from 'react';
import { Tooltip } from '@pterodactyl/sdk';
import type { Slot } from '../api';
import { itemIconUrls } from '../config';
import { itemName } from '../lib/format';

export default function ItemSlot({ item, label }: { item: Slot; label?: string }) {
    const box = 'mc:relative mc:flex mc:aspect-square mc:w-full mc:min-w-8 mc:max-w-12 mc:items-center mc:justify-center mc:rounded-sm mc:border mc:border-border mc:bg-sunken';

    if (item === null) {
        return <div className={box} title={label} />;
    }

    const name = item.name ?? itemName(item.id);
    const details = [name, item.name ? itemName(item.id) : null, item.enchanted ? 'Enchanted' : null, item.damage > 0 ? `Damage ${item.damage}` : null]
        .filter(Boolean)
        .join(' · ');

    return (
        <Tooltip content={details}>
            <div className={`${box} ${item.enchanted ? 'mc:ring-1 mc:ring-primary/60' : ''}`}>
                <ItemIcon id={item.id} name={name} />
                {item.count > 1 && (
                    <span className='mc:absolute mc:right-0.5 mc:bottom-0 mc:font-mono mc:text-xs mc:font-semibold mc:text-foreground mc:drop-shadow'>
                        {item.count}
                    </span>
                )}
            </div>
        </Tooltip>
    );
}

function ItemIcon({ id, name }: { id: string; name: string }) {
    const urls = itemIconUrls(id);
    const [attempt, setAttempt] = useState(0);

    if (attempt >= urls.length) {
        return <span className='mc:px-0.5 mc:text-center mc:text-[0.6rem] mc:leading-tight mc:text-muted-foreground'>{name}</span>;
    }

    return (
        <img
            alt={name}
            src={urls[attempt]}
            loading='lazy'
            onError={() => setAttempt((current) => current + 1)}
            className='mc:h-3/4 mc:w-3/4 mc:object-contain'
            style={{ imageRendering: 'pixelated' }}
        />
    );
}
