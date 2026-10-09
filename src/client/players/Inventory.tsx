import type { PlayerDetails, Slot } from '../api';
import ItemSlot from '../components/ItemSlot';

type Data = NonNullable<PlayerDetails['data']>;

function Grid({ slots }: { slots: Slot[] }) {
    return (
        <div className='mc:grid mc:grid-cols-9 mc:gap-1'>
            {slots.map((slot, index) => (
                <ItemSlot key={index} item={slot} />
            ))}
        </div>
    );
}

function Caption({ children }: { children: string }) {
    return <p className='mc:mb-1 mc:text-xs mc:text-muted-foreground'>{children}</p>;
}

export function Inventory({ data }: { data: Data }) {
    const { armor, offhand, main, hotbar } = data.inventory;

    return (
        <div className='mc:flex mc:gap-4'>
            <div>
                <Caption>Armor</Caption>
                <div className='mc:grid mc:w-10 mc:gap-1'>
                    <ItemSlot item={armor.head} label='Helmet' />
                    <ItemSlot item={armor.chest} label='Chestplate' />
                    <ItemSlot item={armor.legs} label='Leggings' />
                    <ItemSlot item={armor.feet} label='Boots' />
                </div>
            </div>
            <div>
                <Caption>Off-hand</Caption>
                <div className='mc:w-10'>
                    <ItemSlot item={offhand} label='Off-hand' />
                </div>
            </div>
            <div className='mc:flex-1'>
                <Caption>Main inventory</Caption>
                <Grid slots={main} />
                <div className='mc:mt-3'>
                    <Caption>Hotbar</Caption>
                    <Grid slots={hotbar} />
                </div>
            </div>
        </div>
    );
}

export function EnderChest({ data }: { data: Data }) {
    return (
        <div>
            <Caption>Ender chest</Caption>
            <Grid slots={data.ender_chest} />
        </div>
    );
}
