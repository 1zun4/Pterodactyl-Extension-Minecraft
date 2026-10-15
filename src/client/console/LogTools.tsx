import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, NamedIcon, Tooltip, useServerPermission, type SdkServer } from '@pterodactyl/sdk';
import { isMinecraft } from '../lib/minecraft';
import CleanLogsDialog from './CleanLogsDialog';
import ShareLogDialog from './ShareLogDialog';

export default function LogTools({ data: server }: { data: SdkServer }) {
    const canShare = useServerPermission('ext.minecraft.logs-share');
    const canClean = useServerPermission('ext.minecraft.logs-clean');
    const [open, setOpen] = useState<'share' | 'clean' | null>(null);
    const [anchor, setAnchor] = useState<HTMLSpanElement | null>(null);
    const [terminal, setTerminal] = useState<HTMLElement | null>(null);

    useLayoutEffect(() => {
        const container = anchor?.parentElement;

        if (!container) {
            return;
        }

        const place = () => {
            const input = container.querySelector('input[aria-label="Console command input."]');
            const output = input?.parentElement?.previousElementSibling;

            // Read-only consoles have no command input.
            setTerminal(output instanceof HTMLElement ? output : container.querySelector('div.bg-terminal'));
        };

        place();
        const observer = new MutationObserver(place);
        observer.observe(container, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, [anchor]);

    if (!isMinecraft(server) || (!canShare && !canClean)) {
        return null;
    }

    return (
        <>
            <span hidden ref={setAnchor} />
            {terminal && createPortal(
                <div role='toolbar' aria-label='Log actions' className='mc:absolute mc:top-2 mc:right-5 mc:z-10 mc:flex mc:gap-1'>
                    {canShare && (
                        <Tooltip content='Share log' placement='bottom'>
                            <Button.Text type='button' size='xsmall' isSecondary aria-label='Share log' className='mc:size-8 mc:bg-terminal/90 mc:p-0' onClick={() => setOpen('share')}>
                                <NamedIcon name='share-2' size={16} aria-hidden />
                            </Button.Text>
                        </Tooltip>
                    )}
                    {canClean && (
                        <Tooltip content='Clean logs' placement='bottom'>
                            <Button.Text type='button' size='xsmall' isSecondary aria-label='Clean logs' className='mc:size-8 mc:bg-terminal/90 mc:p-0' onClick={() => setOpen('clean')}>
                                <NamedIcon name='brush-cleaning' size={16} aria-hidden />
                            </Button.Text>
                        </Tooltip>
                    )}
                </div>,
                terminal
            )}
            <ShareLogDialog open={open === 'share'} onClose={() => setOpen(null)} server={server.attributes.identifier} />
            <CleanLogsDialog open={open === 'clean'} onClose={() => setOpen(null)} server={server.attributes.identifier} />
        </>
    );
}
