import type { SdkServer } from '@pterodactyl/sdk';

export function isMinecraft(server: SdkServer): boolean {
    const features = (server.attributes.egg_features ?? []).map((feature) => feature.toLowerCase());
    const tags = server.attributes.egg_tags.map((tag) => tag.toLowerCase());

    return features.includes('eula') || tags.includes('minecraft');
}
