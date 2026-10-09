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

    return (
        <span className='mc:ml-3 mc:inline-flex mc:shrink-0 mc:items-center mc:gap-1 mc:rounded-full mc:bg-muted mc:px-2 mc:py-0.5 mc:text-xs mc:text-muted-foreground' title='Players online'>
            <NamedIcon name='users' size={12} />
            {status.data.players}/{status.data.max}
        </span>
    );
}
