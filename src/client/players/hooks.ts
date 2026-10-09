import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpErrorToHuman, toast, useCurrentServerRequired, useServerResources } from '@pterodactyl/sdk';
import { getPlayers, keys, runPlayerAction, type PlayerAction } from '../api';

export function useServerIdentifiers() {
    const { identifier, uuid } = useCurrentServerRequired().attributes;

    return { identifier, uuid };
}

export function useIsRunning(): boolean {
    const { uuid } = useServerIdentifiers();

    return useServerResources(uuid, (data) => data.attributes.current_state).data === 'running';
}

export function usePlayers() {
    const { identifier } = useServerIdentifiers();

    return useQuery({ queryKey: keys.players(identifier), queryFn: () => getPlayers(identifier), refetchInterval: 30_000 });
}

export function usePlayerAction() {
    const { identifier } = useServerIdentifiers();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ action, input }: { action: PlayerAction; input?: Record<string, unknown> }) => runPlayerAction(identifier, action, input),
        onSuccess: ({ message }) => {
            toast.success(message);

            // Commands take a moment to reach the server and its files.
            setTimeout(() => queryClient.invalidateQueries({ queryKey: keys.players(identifier) }), 1500);
        },
        onError: (error) => toast.error(httpErrorToHuman(error)),
    });
}
