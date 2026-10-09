import { useState } from 'react';
import { Button, Dialog, useServerPermission } from '@pterodactyl/sdk';
import type { BannedIp } from '../api';
import { formatDate } from '../lib/format';
import ActionDialog from './ActionDialog';
import { usePlayerAction } from './hooks';

export default function BannedIps({ entries }: { entries: BannedIp[] }) {
    const canModerate = useServerPermission('ext.minecraft.players-moderate');
    const action = usePlayerAction();
    const [banning, setBanning] = useState(false);
    const [pardoning, setPardoning] = useState<string | null>(null);

    return (
        <div className='mc:grid mc:gap-2'>
            {entries.length === 0 && <p className='mc:py-6 mc:text-center mc:text-sm mc:text-muted-foreground'>No banned IPs.</p>}
            {entries.map((entry) => (
                <div key={entry.ip} className='mc:flex mc:items-center mc:justify-between mc:gap-2 mc:rounded-sm mc:bg-card mc:p-2 mc:shadow-sm'>
                    <div className='mc:min-w-0'>
                        <p className='mc:font-mono mc:text-sm mc:text-foreground'>{entry.ip}</p>
                        <p className='mc:truncate mc:text-xs mc:text-muted-foreground'>
                            {entry.reason ?? 'No reason'} · {formatDate(entry.created)}
                        </p>
                    </div>
                    {canModerate && (
                        <Button.Text size='small' onClick={() => setPardoning(entry.ip)}>
                            Pardon
                        </Button.Text>
                    )}
                </div>
            ))}
            {canModerate && (
                <Button size='small' isSecondary onClick={() => setBanning(true)}>
                    Ban an IP
                </Button>
            )}
            <ActionDialog
                open={banning}
                onClose={() => setBanning(false)}
                title='Ban an IP address'
                confirm='Ban'
                danger
                fields={[
                    { name: 'ip', label: 'IP address', placeholder: '203.0.113.7' },
                    { name: 'reason', label: 'Reason', optional: true },
                ]}
                pending={action.isPending}
                onSubmit={(values) => action.mutateAsync({ action: 'ban-ip', input: values }).then(() => setBanning(false)).catch(() => undefined)}
            />
            <Dialog.Confirm
                open={pardoning !== null}
                onClose={() => setPardoning(null)}
                title={`Pardon ${pardoning}?`}
                confirm='Pardon'
                pending={action.isPending}
                onConfirmed={() =>
                    pardoning && action.mutateAsync({ action: 'pardon-ip', input: { ip: pardoning } }).then(() => setPardoning(null)).catch(() => undefined)
                }
            >
                Players from this address can join again.
            </Dialog.Confirm>
        </div>
    );
}
