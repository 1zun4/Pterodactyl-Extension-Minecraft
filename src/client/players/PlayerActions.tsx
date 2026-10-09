import { useState } from 'react';
import { Button, TitledGreyBox, Tooltip, useServerPermission } from '@pterodactyl/sdk';
import type { Player, PlayerAction } from '../api';
import ActionDialog, { type ActionDialogProps } from './ActionDialog';
import { useIsRunning, usePlayerAction } from './hooks';

const GAME_MODES = ['survival', 'creative', 'adventure', 'spectator'].map((mode) => ({ value: mode, label: mode.charAt(0).toUpperCase() + mode.slice(1) }));

const EFFECTS = [
    'speed', 'slowness', 'haste', 'mining_fatigue', 'strength', 'instant_health', 'instant_damage', 'jump_boost', 'nausea',
    'regeneration', 'resistance', 'fire_resistance', 'water_breathing', 'invisibility', 'blindness', 'night_vision', 'hunger',
    'weakness', 'poison', 'wither', 'health_boost', 'absorption', 'saturation', 'glowing', 'levitation', 'luck', 'unluck',
    'slow_falling', 'conduit_power', 'dolphins_grace', 'darkness',
].map((effect) => ({ value: `minecraft:${effect}`, label: effect.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase()) }));

type DialogConfig = Omit<ActionDialogProps, 'open' | 'onClose' | 'pending' | 'onSubmit'> & {
    action: PlayerAction;
    input?: (values: Record<string, string>) => Record<string, unknown>;
};

interface ActionButton {
    label: string;
    live?: boolean;
    danger?: boolean;
    /** Only allowed while the player is offline and has saved data. */
    offlineOnly?: boolean;
    run: DialogConfig | PlayerAction;
}

export default function PlayerActions({ player, onlinePlayers }: { player: Player; onlinePlayers: string[] }) {
    const running = useIsRunning();
    const canManage = useServerPermission('ext.minecraft.players-manage');
    const canModerate = useServerPermission('ext.minecraft.players-moderate');
    const mutation = usePlayerAction();
    const [dialog, setDialog] = useState<DialogConfig | null>(null);

    const target = { name: player.name, uuid: player.uuid ?? undefined };
    const run = (action: PlayerAction, input: Record<string, unknown> = {}) =>
        mutation
            .mutateAsync({ action, input: { ...target, ...input } })
            .then(() => setDialog(null))
            .catch(() => undefined);

    const groups: { title: string; visible: boolean; buttons: ActionButton[] }[] = [
        {
            title: 'General',
            visible: canManage,
            buttons: [
                { label: 'Message', live: true, run: { action: 'message', title: `Message ${player.name}`, confirm: 'Send', fields: [{ name: 'text', label: 'Message' }] } },
                {
                    label: 'Teleport',
                    live: true,
                    run: {
                        action: 'teleport',
                        title: `Teleport ${player.name}`,
                        description: 'Pick a player, or leave it empty and enter coordinates. ~ is relative to the player.',
                        confirm: 'Teleport',
                        fields: [
                            { name: 'target', label: 'To player', type: 'select', optional: true, options: [{ value: '', label: 'Coordinates' }, ...onlinePlayers.filter((name) => name !== player.name).map((name) => ({ value: name, label: name }))] },
                            { name: 'x', label: 'X', placeholder: '~', optional: true },
                            { name: 'y', label: 'Y', placeholder: '~', optional: true },
                            { name: 'z', label: 'Z', placeholder: '~', optional: true },
                        ],
                        input: (values) => (values.target ? { target: values.target } : { x: values.x || '~', y: values.y || '~', z: values.z || '~' }),
                    },
                },
                { label: 'Game Mode', live: true, run: { action: 'gamemode', title: `Game mode for ${player.name}`, confirm: 'Apply', fields: [{ name: 'mode', label: 'Game mode', type: 'select', options: GAME_MODES, defaultValue: 'survival' }] } },
                { label: 'Kill', live: true, danger: true, run: { action: 'kill', title: `Kill ${player.name}?`, description: `${player.name} drops their items unless keepInventory is on.`, confirm: 'Kill', danger: true } },
            ],
        },
        {
            title: 'Inventory & Effects',
            visible: canManage,
            buttons: [
                {
                    label: 'Give Item',
                    live: true,
                    run: {
                        action: 'give',
                        title: `Give item to ${player.name}`,
                        confirm: 'Give',
                        fields: [
                            { name: 'item', label: 'Item ID', placeholder: 'minecraft:diamond', defaultValue: 'minecraft:' },
                            { name: 'count', label: 'Count', type: 'number', defaultValue: '1' },
                        ],
                        input: (values) => ({ item: values.item, count: Number(values.count) }),
                    },
                },
                {
                    label: 'Add Effect',
                    live: true,
                    run: {
                        action: 'effect',
                        title: `Add effect to ${player.name}`,
                        confirm: 'Add',
                        fields: [
                            { name: 'effect', label: 'Effect', type: 'select', options: EFFECTS, defaultValue: 'minecraft:speed' },
                            { name: 'seconds', label: 'Duration in seconds', type: 'number', defaultValue: '30' },
                            { name: 'amplifier', label: 'Amplifier', type: 'number', defaultValue: '0' },
                        ],
                        input: (values) => ({ effect: values.effect, seconds: Number(values.seconds), amplifier: Number(values.amplifier) }),
                    },
                },
                { label: 'Clear Effects', live: true, run: { action: 'clear-effects', title: `Clear effects on ${player.name}?`, description: 'All active potion effects are removed.', confirm: 'Clear effects' } },
                { label: 'Clear Inventory', live: true, danger: true, run: { action: 'clear-inventory', title: `Clear the inventory of ${player.name}?`, description: 'Every item in their inventory is deleted. This cannot be undone.', confirm: 'Clear inventory', danger: true } },
            ],
        },
        {
            title: 'Moderation',
            visible: canModerate,
            buttons: [
                player.banned
                    ? { label: 'Pardon', run: { action: 'pardon', title: `Pardon ${player.name}?`, description: `${player.name} can join again.`, confirm: 'Pardon' } }
                    : { label: 'Ban', danger: true, run: { action: 'ban', title: `Ban ${player.name}`, confirm: 'Ban', danger: true, fields: [{ name: 'reason', label: 'Reason', optional: true, placeholder: 'Banned by an operator.' }] } },
                { label: 'Kick', live: true, run: { action: 'kick', title: `Kick ${player.name}`, confirm: 'Kick', fields: [{ name: 'reason', label: 'Reason', optional: true, placeholder: 'Kicked by an operator.' }] } },
                player.whitelisted
                    ? { label: 'Unwhitelist', run: { action: 'whitelist-remove', title: `Remove ${player.name} from the whitelist?`, confirm: 'Remove' } }
                    : { label: 'Whitelist', run: 'whitelist-add' },
                player.operator
                    ? { label: 'De-op', run: { action: 'deop', title: `Remove operator from ${player.name}?`, description: `${player.name} will lose operator permissions.`, confirm: 'De-op' } }
                    : { label: 'Op', run: { action: 'op', title: `Make ${player.name} an operator?`, description: 'Operators can run every command on the server.', confirm: 'Op' } },
                {
                    label: 'Wipe Data',
                    danger: true,
                    offlineOnly: true,
                    run: {
                        action: 'wipe',
                        title: `Wipe ${player.name}'s data`,
                        description: `This permanently deletes ${player.name}'s inventory, statistics and advancements. It cannot be undone.`,
                        confirm: 'Wipe data',
                        danger: true,
                        typeToConfirm: player.name,
                        input: () => ({ confirm: player.name }),
                    },
                },
            ],
        },
    ];

    const visible = groups.filter((group) => group.visible);

    if (visible.length === 0) {
        return null;
    }

    return (
        <>
            <div className='mc:grid mc:gap-4 mc:sm:grid-cols-3'>
                {visible.map((group) => (
                    <TitledGreyBox key={group.title} title={group.title} contentClassName='mc:grid mc:gap-2'>
                        {group.buttons.map((button) => {
                            const blocker = button.live && !running
                                ? 'Start the server to use this.'
                                : button.offlineOnly && player.online
                                  ? `${player.name} has to be offline.`
                                  : button.offlineOnly && !player.uuid
                                    ? 'This player has no saved data.'
                                    : null;
                            const Component = button.danger ? Button.Danger : Button;
                            const element = (
                                <Component
                                    key={button.label}
                                    size='small'
                                    className='mc:w-full'
                                    disabled={blocker !== null || (typeof button.run === 'string' && mutation.isPending)}
                                    onClick={() => (typeof button.run === 'string' ? run(button.run) : setDialog(button.run))}
                                >
                                    {button.label}
                                </Component>
                            );

                            return blocker ? (
                                <Tooltip key={button.label} content={blocker}>
                                    <span className='mc:block'>{element}</span>
                                </Tooltip>
                            ) : (
                                element
                            );
                        })}
                    </TitledGreyBox>
                ))}
            </div>
            <ActionDialog
                open={dialog !== null}
                onClose={() => setDialog(null)}
                title={dialog?.title ?? ''}
                description={dialog?.description}
                confirm={dialog?.confirm ?? ''}
                danger={dialog?.danger}
                fields={dialog?.fields}
                typeToConfirm={dialog?.typeToConfirm}
                pending={mutation.isPending}
                onSubmit={(values) => dialog && run(dialog.action, dialog.input ? dialog.input(values) : values)}
            />
        </>
    );
}
