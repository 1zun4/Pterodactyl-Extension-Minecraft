import { useState } from 'react';
import { Button, useServerPermission } from '@pterodactyl/sdk';
import type { PlayerAction } from '../api';
import ActionDialog from './ActionDialog';
import { usePlayerAction } from './hooks';

export default function AddPlayer() {
    const canModerate = useServerPermission('ext.minecraft.players-moderate');
    const action = usePlayerAction();
    const [open, setOpen] = useState(false);

    if (!canModerate) {
        return null;
    }

    return (
        <>
            <Button size='small' isSecondary className='mc:w-full' onClick={() => setOpen(true)}>
                Add player
            </Button>
            <ActionDialog
                open={open}
                onClose={() => setOpen(false)}
                title='Add a player'
                description='Works for players that never joined. While the server is stopped the lists are edited directly.'
                confirm='Add'
                fields={[
                    { name: 'name', label: 'Player name', placeholder: 'Notch' },
                    {
                        name: 'action',
                        label: 'Add to',
                        type: 'select',
                        defaultValue: 'whitelist-add',
                        options: [
                            { value: 'whitelist-add', label: 'Whitelist' },
                            { value: 'op', label: 'Operators' },
                            { value: 'ban', label: 'Ban list' },
                        ],
                    },
                ]}
                pending={action.isPending}
                onSubmit={({ name, action: list }) =>
                    action.mutateAsync({ action: list as PlayerAction, input: { name: name.trim() } }).then(() => setOpen(false)).catch(() => undefined)
                }
            />
        </>
    );
}
