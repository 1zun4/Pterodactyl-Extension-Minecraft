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
    difficulty: { label: 'Difficulty', section: 'gameplay', options: ['peaceful', 'easy', 'normal', 'hard'] },
    gamemode: { label: 'Game Mode', description: 'The game mode new players start in.', section: 'gameplay', options: ['survival', 'creative', 'adventure', 'spectator'] },
    'force-gamemode': { label: 'Force Game Mode', description: 'Put players back into the default game mode every time they join.', section: 'gameplay' },
    hardcore: { label: 'Hardcore', description: 'Players are switched to spectator mode when they die.', section: 'gameplay' },
    pvp: { label: 'PvP', description: 'Let players damage each other.', section: 'gameplay' },
    'allow-flight': { label: 'Allow Flight', description: 'Stop kicking players that fly with mods or plugins.', section: 'gameplay' },
    'allow-nether': { label: 'Allow Nether', section: 'gameplay' },
    'spawn-monsters': { label: 'Spawn Monsters', section: 'gameplay' },
    'spawn-animals': { label: 'Spawn Animals', section: 'gameplay' },
    'spawn-npcs': { label: 'Spawn Villagers', section: 'gameplay' },
    'enable-command-block': { label: 'Command Blocks', section: 'gameplay' },
    'spawn-protection': { label: 'Spawn Protection', description: 'Radius in blocks around spawn that only operators can build in.', section: 'gameplay', min: 0 },

    'max-players': { label: 'Max Players', section: 'players', min: 0 },
    'online-mode': { label: 'Online Mode', description: 'Check every player against Mojang. Only turn this off behind a proxy.', section: 'players' },
    'white-list': { label: 'Whitelist', description: 'Only let whitelisted players join.', section: 'players' },
    'enforce-whitelist': { label: 'Enforce Whitelist', description: 'Kick players that are not on the whitelist when it reloads.', section: 'players' },
    'enforce-secure-profile': { label: 'Enforce Secure Profile', description: 'Require players to have a Mojang-signed chat key.', section: 'players' },
    'op-permission-level': { label: 'Operator Level', description: 'Permission level new operators get.', section: 'players', options: PERMISSION_LEVELS },
    'function-permission-level': { label: 'Function Level', description: 'Permission level of datapack functions.', section: 'players', options: PERMISSION_LEVELS },
    'player-idle-timeout': { label: 'Idle Timeout', description: 'Minutes before idle players are kicked. 0 turns it off.', section: 'players', min: 0 },
    'hide-online-players': { label: 'Hide Online Players', description: 'Leave player names out of the server list.', section: 'players' },
    'broadcast-console-to-ops': { label: 'Broadcast Console to Ops', section: 'players' },
    'broadcast-rcon-to-ops': { label: 'Broadcast RCON to Ops', section: 'players' },
    'log-ips': { label: 'Log IPs', section: 'players' },

    'level-name': { label: 'World Name', description: 'The folder the world is stored in.', section: 'world' },
    'level-seed': { label: 'Seed', description: 'Only used when a new world is generated.', section: 'world' },
    'level-type': {
        label: 'World Type',
        section: 'world',
        options: ['minecraft:normal', 'minecraft:flat', 'minecraft:large_biomes', 'minecraft:amplified', 'minecraft:single_biome_surface'],
    },
    'generator-settings': { label: 'Generator Settings', description: 'JSON settings for flat or single biome worlds.', section: 'world' },
    'generate-structures': { label: 'Generate Structures', section: 'world' },
    'max-world-size': { label: 'Max World Size', description: 'World border radius in blocks.', section: 'world', min: 1, max: 29999984 },
    'initial-enabled-packs': { label: 'Enabled Datapacks', description: 'Datapacks enabled when the world is created.', section: 'world' },
    'initial-disabled-packs': { label: 'Disabled Datapacks', description: 'Datapacks disabled when the world is created.', section: 'world' },
    'region-file-compression': { label: 'Region Compression', section: 'world', options: ['deflate', 'lz4', 'none'] },

    'view-distance': { label: 'View Distance', description: 'Chunks sent to each player.', section: 'performance', min: 3, max: 32 },
    'simulation-distance': { label: 'Simulation Distance', description: 'Chunks around each player that keep ticking.', section: 'performance', min: 3, max: 32 },
    'entity-broadcast-range-percentage': { label: 'Entity Range', description: 'How far away entities are sent, in percent.', section: 'performance', min: 10, max: 1000 },
    'max-tick-time': { label: 'Max Tick Time', description: 'Milliseconds before the watchdog stops a frozen server. -1 turns it off.', section: 'performance' },
    'max-chained-neighbor-updates': { label: 'Max Chained Updates', section: 'performance' },
    'network-compression-threshold': { label: 'Compression Threshold', description: 'Packets larger than this many bytes are compressed.', section: 'performance' },
    'sync-chunk-writes': { label: 'Sync Chunk Writes', section: 'performance' },
    'pause-when-empty-seconds': { label: 'Pause When Empty', description: 'Seconds without players before the server pauses ticking. -1 turns it off.', section: 'performance', min: -1 },
    'use-native-transport': { label: 'Native Transport', section: 'performance' },
    'rate-limit': { label: 'Rate Limit', description: 'Packets per second before a player is kicked. 0 turns it off.', section: 'performance', min: 0 },

    'server-ip': { label: 'Server IP', section: 'network', managed: true },
    'server-port': { label: 'Server Port', section: 'network', managed: true },
    'enable-status': { label: 'Show in Server List', section: 'network' },
    'prevent-proxy-connections': { label: 'Block Proxy Connections', section: 'network' },
    'accepts-transfers': { label: 'Accept Transfers', description: 'Let other servers transfer players here.', section: 'network' },
    'enable-query': { label: 'Query', description: 'Answer GameSpy4 queries. Needed for full player lists.', section: 'network' },
    'query.port': { label: 'Query Port', section: 'network', min: 1, max: 65535 },
    'enable-rcon': { label: 'RCON', section: 'network' },
    'rcon.port': { label: 'RCON Port', section: 'network', min: 1, max: 65535 },
    'rcon.password': { label: 'RCON Password', section: 'network', control: 'password' },

    'resource-pack': { label: 'Resource Pack URL', section: 'resource-pack' },
    'resource-pack-sha1': { label: 'Resource Pack SHA-1', section: 'resource-pack' },
    'resource-pack-id': { label: 'Resource Pack ID', section: 'resource-pack' },
    'resource-pack-prompt': { label: 'Resource Pack Prompt', section: 'resource-pack' },
    'require-resource-pack': { label: 'Require Resource Pack', section: 'resource-pack' },

    'management-server-secret': { label: 'Management Server Secret', section: 'advanced', control: 'password' },
    'management-server-tls-keystore-password': { label: 'Management TLS Keystore Password', section: 'advanced', control: 'password' },
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
