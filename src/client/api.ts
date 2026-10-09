import { http } from '@pterodactyl/sdk';

export interface PropertyEntry {
    key: string;
    value: string;
}

export interface PropertiesResponse {
    exists: boolean;
    properties: PropertyEntry[];
}

export interface ServerStatus {
    online: boolean;
    players: number;
    max: number;
    version: string | null;
    motd: string | null;
}

export interface Player {
    uuid: string | null;
    name: string;
    online: boolean;
    operator: boolean;
    op_level: number | null;
    whitelisted: boolean;
    banned: boolean;
    ban_reason: string | null;
    last_seen: string | null;
}

export interface BannedIp {
    ip: string;
    reason: string | null;
    created: string | null;
}

export interface PlayersResponse {
    status: ServerStatus & { source: 'ping' | 'query' | 'none' };
    whitelist_enabled: boolean;
    online_mode: boolean;
    players: Player[];
    banned_ips: BannedIp[];
}

export interface Item {
    id: string;
    count: number;
    name: string | null;
    enchanted: boolean;
    damage: number;
}

export type Slot = Item | null;

export interface PlayerDetails {
    uuid: string;
    data: {
        inventory: {
            armor: { head: Slot; chest: Slot; legs: Slot; feet: Slot };
            offhand: Slot;
            main: Slot[];
            hotbar: Slot[];
        };
        ender_chest: Slot[];
        health: number;
        food: number;
        xp_level: number;
        game_mode: string;
        dimension: string;
        position: [number, number, number] | null;
    } | null;
    statistics: {
        play_time: number;
        deaths: number;
        mob_kills: number;
        player_kills: number;
        distance_walked: number;
        advancements: number;
    };
    saved_at: string | null;
}

export interface HistoryResponse {
    enabled: boolean;
    days: number;
    hours: { hour: string; average: number; peak: number }[];
}

export interface LogFile {
    path: string;
    directory: 'logs' | 'crash-reports';
    name: string;
    size: number;
    modified: string | null;
}

export interface CleanupSchedule {
    cleanup: boolean;
    cleanup_days: number;
    cleanup_logs: boolean;
    cleanup_crashes: boolean;
    cleanup_archive: boolean;
}

export type PlayerAction =
    | 'message'
    | 'teleport'
    | 'gamemode'
    | 'kill'
    | 'give'
    | 'effect'
    | 'clear-effects'
    | 'clear-inventory'
    | 'save'
    | 'kick'
    | 'ban'
    | 'pardon'
    | 'ban-ip'
    | 'pardon-ip'
    | 'whitelist-add'
    | 'whitelist-remove'
    | 'whitelist-enabled'
    | 'op'
    | 'deop'
    | 'wipe';

const base = (server: string) => `/api/client/servers/${server}/extensions/minecraft`;

export const keys = {
    meta: (server: string) => ['minecraft', server, 'meta'] as const,
    status: (server: string) => ['minecraft', server, 'status'] as const,
    properties: (server: string) => ['minecraft', server, 'properties'] as const,
    players: (server: string) => ['minecraft', server, 'players'] as const,
    player: (server: string, uuid: string) => ['minecraft', server, 'players', uuid] as const,
    history: (server: string) => ['minecraft', server, 'history'] as const,
    logs: (server: string) => ['minecraft', server, 'logs'] as const,
};

export const getMeta = async (server: string) => (await http.get<{ proxy: boolean }>(`${base(server)}/meta`)).data;

export const getStatus = async (server: string) => (await http.get<ServerStatus>(`${base(server)}/status`)).data;

export const getProperties = async (server: string) =>
    (await http.get<PropertiesResponse>(`${base(server)}/properties`)).data;

export const saveProperties = async (server: string, values: Record<string, string>) =>
    (await http.patch<PropertiesResponse>(`${base(server)}/properties`, { values })).data;

export const getPlayers = async (server: string, fresh = false) =>
    (await http.get<PlayersResponse>(`${base(server)}/players`, { params: fresh ? { fresh: 1 } : {} })).data;

export const getPlayer = async (server: string, uuid: string) =>
    (await http.get<PlayerDetails>(`${base(server)}/players/${uuid}`)).data;

export const runPlayerAction = async (server: string, action: PlayerAction, input: Record<string, unknown> = {}) =>
    (await http.post<{ message: string }>(`${base(server)}/players/actions`, { action, ...input })).data;

export const getHistory = async (server: string) => (await http.get<HistoryResponse>(`${base(server)}/history`)).data;

export const setHistory = async (server: string, enabled: boolean) =>
    (await http.put<HistoryResponse>(`${base(server)}/history`, { enabled })).data;

export const getLogs = async (server: string) =>
    (await http.get<{ files: LogFile[]; schedule: CleanupSchedule }>(`${base(server)}/logs`)).data;

export const shareLog = async (server: string, path: string | null) =>
    (await http.post<{ url: string }>(`${base(server)}/logs/share`, { path })).data;

export const cleanLogs = async (
    server: string,
    input: { days: number; logs: boolean; crashes: boolean; archive: boolean; dry_run: boolean }
) => (await http.post<{ files: LogFile[]; archives: string[] }>(`${base(server)}/logs/clean`, input)).data;

export const saveCleanupSchedule = async (server: string, schedule: CleanupSchedule) =>
    (await http.put<{ schedule: CleanupSchedule }>(`${base(server)}/logs/schedule`, schedule)).data;
