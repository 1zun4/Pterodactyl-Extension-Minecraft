import { useState } from 'react';
import { Button, useServerPermission, type SdkServer } from '@pterodactyl/sdk';
import { isMinecraft } from '../lib/minecraft';
import CleanLogsDialog from './CleanLogsDialog';
import ShareLogDialog from './ShareLogDialog';

export default function LogTools({ data: server }: { data: SdkServer }) {
    const canShare = useServerPermission('ext.minecraft.logs-share');
    const canClean = useServerPermission('ext.minecraft.logs-clean');
    const [open, setOpen] = useState<'share' | 'clean' | null>(null);

    if (!isMinecraft(server) || (!canShare && !canClean)) {
        return null;
    }

    return (
        <div className='mc:mt-2 mc:flex mc:gap-2 mc:sm:justify-end'>
            {canShare && (
                <Button.Text size='small' className='mc:flex-1 mc:sm:flex-none' onClick={() => setOpen('share')}>
                    Share log
                </Button.Text>
            )}
            {canClean && (
                <Button.Text size='small' className='mc:flex-1 mc:sm:flex-none' onClick={() => setOpen('clean')}>
                    Clean logs
                </Button.Text>
            )}
            <ShareLogDialog open={open === 'share'} onClose={() => setOpen(null)} server={server.attributes.identifier} />
            <CleanLogsDialog open={open === 'clean'} onClose={() => setOpen(null)} server={server.attributes.identifier} />
        </div>
    );
}
