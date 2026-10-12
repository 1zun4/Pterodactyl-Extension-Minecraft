import { useQuery } from '@tanstack/react-query';
import { NamedIcon, type SdkServer } from '@pterodactyl/sdk';
import { getStatus, keys } from '../api';
import { isMinecraft } from '../lib/minecraft';

export default function PlayerCount({ data: server }: { data: SdkServer }) {
    const { identifier } = server.attributes;

    // The dashboard list carries no per-server permissions, so a 403 just hides the badge.
    const status = useQuery({
        queryKey: keys.status(identifier),
        queryFn: () => getStatus(identifier),
        enabled: isMinecraft(server) && !server.attributes.is_suspended,
        refetchInterval: (query) => (query.state.error ? false : 60_000),
        staleTime: 30_000,
        retry: false,
    });

    if (!status.data?.online) {
        return null;
    }

    // Shares the row with the server name and other badges, so it stays as narrow as its numbers on phones.
    return (
        <span
            className='mc:ml-2 mc:inline-flex mc:shrink mc:items-center mc:gap-1 mc:whitespace-nowrap mc:rounded-full mc:bg-muted mc:px-1.5 mc:py-0.5 mc:text-xs mc:leading-4 mc:tabular-nums mc:text-muted-foreground mc:sm:ml-3 mc:sm:px-2'
            title='Players online'
        >
            <span className='mc:hidden mc:sm:inline-flex'>
                <NamedIcon name='users' size={12} />
            </span>
            {status.data.players}/{status.data.max}
        </span>
    );
}
