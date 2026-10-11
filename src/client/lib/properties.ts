export type PropertyControl = 'switch' | 'select' | 'number' | 'text' | 'password';

export interface PropertyDefinition {
    label: string;
    description?: string;
    section: SectionId;
    control?: PropertyControl;
    options?: string[];
    min?: number;
    max?: number;
    /** The panel rewrites this key on every start. */
    managed?: boolean;
}

export type SectionId = 'gameplay' | 'players' | 'world' | 'performance' | 'network' | 'resource-pack' | 'advanced';

export const SECTIONS: { id: SectionId; title: string }[] = [
    { id: 'gameplay', title: 'Gameplay' },
    { id: 'players', title: 'Players' },
    { id: 'world', title: 'World' },
    { id: 'performance', title: 'Performance' },
    { id: 'network', title: 'Network' },
    { id: 'resource-pack', title: 'Resource Pack' },
    { id: 'advanced', title: 'Advanced' },
];

const PERMISSION_LEVELS = ['1', '2', '3', '4'];

export const PROPERTIES: Record<string, PropertyDefinition> = {
    motd: { label: 'MOTD', description: 'The message shown below the server name in the server list.', section: 'gameplay' },
    difficulty: { label: 'Difficulty', description: 'How hard the game is. Peaceful removes hostile mobs and hunger.', section: 'gameplay', options: ['peaceful', 'easy', 'normal', 'hard'] },
    gamemode: { label: 'Game Mode', description: 'The game mode new players start in.', section: 'gameplay', options: ['survival', 'creative', 'adventure', 'spectator'] },
    'force-gamemode': { label: 'Force Game Mode', description: 'Put players back into the default game mode every time they join.', section: 'gameplay' },
    hardcore: { label: 'Hardcore', description: 'Players are switched to spectator mode when they die.', section: 'gameplay' },
    pvp: { label: 'PvP', description: 'Let players damage each other.', section: 'gameplay' },
    'allow-flight': { label: 'Allow Flight', description: 'Stop kicking players that fly with mods or plugins.', section: 'gameplay' },
    'allow-nether': { label: 'Allow Nether', description: 'Let players travel to the Nether through portals.', section: 'gameplay' },
    'spawn-monsters': { label: 'Spawn Monsters', description: 'Spawn hostile mobs such as zombies and creepers.', section: 'gameplay' },
    'spawn-animals': { label: 'Spawn Animals', description: 'Spawn passive animals such as cows, pigs and sheep.', section: 'gameplay' },
    'spawn-npcs': { label: 'Spawn Villagers', description: 'Spawn villagers in villages.', section: 'gameplay' },
    'enable-command-block': { label: 'Command Blocks', description: 'Let command blocks run their commands.', section: 'gameplay' },
    'spawn-protection': { label: 'Spawn Protection', description: 'Radius in blocks around spawn that only operators can build in.', section: 'gameplay', min: 0 },

    'max-players': { label: 'Max Players', description: 'How many players can be online at the same time.', section: 'players', min: 0 },
    'online-mode': { label: 'Online Mode', description: 'Check every player against Mojang. Only turn this off behind a proxy.', section: 'players' },
    'white-list': { label: 'Whitelist', description: 'Only let whitelisted players join.', section: 'players' },
    'enforce-whitelist': { label: 'Enforce Whitelist', description: 'Kick players that are not on the whitelist when it reloads.', section: 'players' },
    'enforce-secure-profile': { label: 'Enforce Secure Profile', description: 'Require players to have a Mojang-signed chat key.', section: 'players' },
    'op-permission-level': { label: 'Operator Level', description: 'Permission level new operators get.', section: 'players', options: PERMISSION_LEVELS },
    'function-permission-level': { label: 'Function Level', description: 'Permission level of datapack functions.', section: 'players', options: PERMISSION_LEVELS },
    'player-idle-timeout': { label: 'Idle Timeout', description: 'Minutes before idle players are kicked. 0 turns it off.', section: 'players', min: 0 },
    'hide-online-players': { label: 'Hide Online Players', description: 'Leave player names out of the server list.', section: 'players' },
    'broadcast-console-to-ops': { label: 'Broadcast Console to Ops', description: 'Show commands run from the console to online operators.', section: 'players' },
    'broadcast-rcon-to-ops': { label: 'Broadcast RCON to Ops', description: 'Show commands run over RCON to online operators.', section: 'players' },
    'log-ips': { label: 'Log IPs', description: 'Write player IP addresses to the server log.', section: 'players' },

    'level-name': { label: 'World Name', description: 'The folder the world is stored in.', section: 'world' },
    'level-seed': { label: 'Seed', description: 'Only used when a new world is generated.', section: 'world' },
    'level-type': {
        label: 'World Type',
        description: 'The terrain new worlds generate with.',
        section: 'world',
        options: ['minecraft:normal', 'minecraft:flat', 'minecraft:large_biomes', 'minecraft:amplified', 'minecraft:single_biome_surface'],
    },
    'generator-settings': { label: 'Generator Settings', description: 'JSON settings for flat or single biome worlds.', section: 'world' },
    'generate-structures': { label: 'Generate Structures', description: 'Generate villages, temples and other structures in new chunks.', section: 'world' },
    'max-world-size': { label: 'Max World Size', description: 'World border radius in blocks.', section: 'world', min: 1, max: 29999984 },
    'initial-enabled-packs': { label: 'Enabled Datapacks', description: 'Datapacks enabled when the world is created.', section: 'world' },
    'initial-disabled-packs': { label: 'Disabled Datapacks', description: 'Datapacks disabled when the world is created.', section: 'world' },
    'region-file-compression': { label: 'Region Compression', description: 'How world region files are compressed on disk.', section: 'world', options: ['deflate', 'lz4', 'none'] },

    'view-distance': { label: 'View Distance', description: 'Chunks sent to each player.', section: 'performance', min: 3, max: 32 },
    'simulation-distance': { label: 'Simulation Distance', description: 'Chunks around each player that keep ticking.', section: 'performance', min: 3, max: 32 },
    'entity-broadcast-range-percentage': { label: 'Entity Range', description: 'How far away entities are sent, in percent.', section: 'performance', min: 10, max: 1000 },
    'max-tick-time': { label: 'Max Tick Time', description: 'Milliseconds before the watchdog stops a frozen server. -1 turns it off.', section: 'performance' },
    'max-chained-neighbor-updates': { label: 'Max Chained Updates', description: 'Limit for chained block updates in one tick, to stop lag machines.', section: 'performance' },
    'network-compression-threshold': { label: 'Compression Threshold', description: 'Packets larger than this many bytes are compressed.', section: 'performance' },
    'sync-chunk-writes': { label: 'Sync Chunk Writes', description: 'Write chunks to disk immediately. Safer, but slower.', section: 'performance' },
    'pause-when-empty-seconds': { label: 'Pause When Empty', description: 'Seconds without players before the server pauses ticking. -1 turns it off.', section: 'performance', min: -1 },
    'use-native-transport': { label: 'Native Transport', description: 'Use faster Linux networking when available.', section: 'performance' },
    'rate-limit': { label: 'Rate Limit', description: 'Packets per second before a player is kicked. 0 turns it off.', section: 'performance', min: 0 },

    'server-ip': { label: 'Server IP', description: 'The address to listen on. Leave empty to listen on every address.', section: 'network', managed: true },
    'server-port': { label: 'Server Port', description: 'The port players connect to.', section: 'network', managed: true },
    'enable-status': { label: 'Show in Server List', description: 'Show the server as online in the server list.', section: 'network' },
    'prevent-proxy-connections': { label: 'Block Proxy Connections', description: 'Kick players whose network differs from the one they signed in to Mojang from. Blocks most VPNs and proxies.', section: 'network' },
    'accepts-transfers': { label: 'Accept Transfers', description: 'Let other servers transfer players here.', section: 'network' },
    'enable-query': { label: 'Query', description: 'Answer GameSpy4 queries. Needed for full player lists.', section: 'network' },
    'query.port': { label: 'Query Port', description: 'The port for the GameSpy query protocol.', section: 'network', min: 1, max: 65535 },
    'enable-rcon': { label: 'RCON', description: 'Allow remote console access over the RCON protocol.', section: 'network' },
    'rcon.port': { label: 'RCON Port', description: 'The port RCON listens on.', section: 'network', min: 1, max: 65535 },
    'rcon.password': { label: 'RCON Password', description: 'The password RCON clients must send. Use a long random one.', section: 'network', control: 'password' },

    'resource-pack': { label: 'Resource Pack URL', description: 'A direct download link to a resource pack zip offered to players.', section: 'resource-pack' },
    'resource-pack-sha1': { label: 'Resource Pack SHA-1', description: 'The SHA-1 hash of the resource pack, so players only download it again when it changes.', section: 'resource-pack' },
    'resource-pack-id': { label: 'Resource Pack ID', description: 'A UUID that identifies the resource pack on the client.', section: 'resource-pack' },
    'resource-pack-prompt': { label: 'Resource Pack Prompt', description: 'A custom message shown when players are asked to download the pack.', section: 'resource-pack' },
    'require-resource-pack': { label: 'Require Resource Pack', description: 'Disconnect players who decline the resource pack.', section: 'resource-pack' },

    'management-server-secret': { label: 'Management Server Secret', description: 'The secret clients of the management API must send.', section: 'advanced', control: 'password' },
    'management-server-tls-keystore-password': { label: 'Management TLS Keystore Password', description: 'The password of the keystore used for TLS on the management API.', section: 'advanced', control: 'password' },
};

export interface Property extends PropertyDefinition {
    key: string;
    control: PropertyControl;
}

export function titleCase(key: string): string {
    return key
        .split(/[-._]/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function describe(key: string, value: string): Property {
    const known = PROPERTIES[key];
    const control: PropertyControl =
        known?.control ??
        (known?.options ? 'select' : value === 'true' || value === 'false' ? 'switch' : /^-?\d+$/.test(value) ? 'number' : 'text');

    return { ...known, label: known?.label ?? titleCase(key), section: known?.section ?? 'advanced', key, control };
}

export function matches(property: Property, value: string, search: string): boolean {
    const needle = search.trim().toLowerCase();

    return needle === '' || [property.key, property.label, property.description ?? '', value].some((text) => text.toLowerCase().includes(needle));
}
