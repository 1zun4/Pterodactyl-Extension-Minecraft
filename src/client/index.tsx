import './styles.css';
import { useQuery } from '@tanstack/react-query';
import { definePterodactylExtension, type ScreenContext } from '@pterodactyl/sdk';
import { getMeta, keys } from './api';
import { setConfig } from './config';
import LogTools from './console/LogTools';
import PlayerCount from './dashboard/PlayerCount';

// Proxies (Velocity, BungeeCord) share the eula egg feature but have no worlds or server.properties.
function useIsGameServer({ server }: ScreenContext): boolean {
    const identifier = server?.attributes.identifier ?? '';
    const meta = useQuery({ queryKey: keys.meta(identifier), queryFn: () => getMeta(identifier), enabled: identifier !== '', staleTime: Infinity });

    return meta.data?.proxy === false;
}

export default definePterodactylExtension({
    setup({ config, screens, slots }) {
        setConfig(config);

        screens.register('players', () => import('./screens/PlayersScreen'), { visible: useIsGameServer });
        screens.register('properties', () => import('./screens/PropertiesScreen'), { visible: useIsGameServer });

        slots.register('server.console.power.after', LogTools);
        slots.register('dashboard.serverRow.name.after', PlayerCount);
    },
});
