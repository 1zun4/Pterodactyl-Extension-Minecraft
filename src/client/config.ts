import type { ExtensionConfig } from '@pterodactyl/sdk';

const DEFAULT_AVATAR = 'https://mc-heads.net/avatar/{uuid}/{size}';

let config: ExtensionConfig = {};

export function setConfig(value: ExtensionConfig): void {
    config = value;
}

export function avatarUrl(player: { uuid: string | null; name: string }, size: number): string {
    const template = typeof config.avatar_url === 'string' && config.avatar_url !== '' ? config.avatar_url : DEFAULT_AVATAR;

    return template
        .replaceAll('{uuid}', encodeURIComponent(player.uuid ?? player.name))
        .replaceAll('{name}', encodeURIComponent(player.name))
        .replaceAll('{size}', String(size));
}

export function itemIconUrls(id: string): string[] {
    const templates = Array.isArray(config.item_icons) ? config.item_icons.filter((value) => typeof value === 'string') : [];
    const name = id.replace(/^minecraft:/, '');

    return (templates as string[]).map((template) => template.replaceAll('{name}', encodeURIComponent(name)));
}
