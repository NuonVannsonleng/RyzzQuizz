import {
  AVATAR_BASES,
  AVATAR_COLORS,
  type BotPreset,
  type Question,
} from '@ryzzquizz/shared';
import { joinRoom, RoomError, type ServerRoom } from './roomService.js';

// Dev-mode simulated players. They join and answer through the exact same
// roomService functions real players use (joinRoom, submitAnswer) — only the
// *trigger* differs: a setTimeout here instead of a socket event from a
// browser. See registerHandlers.ts for where scheduleBotAnswers is called.

const BOT_FIRST_NAMES = [
  'Kanya', 'Dara', 'Sokha', 'Vibol', 'Chan', 'Reaksmey', 'Mony', 'Sopheak',
  'Bopha', 'Rithy', 'Chenda', 'Piseth', 'Sreymom', 'Vannak', 'Lina', 'Sovann',
  'Maly', 'Panha', 'Thida', 'Kosal',
];

// Round-robins through the non-'mixed' presets for a realistic spread of behavior.
const MIXED_ROTATION: BotPreset[] = ['perfect', 'beginner', 'fast', 'slow', 'random', 'timeout'];

const RESOLVED_PRESETS = MIXED_ROTATION; // presets that actually resolve to a concrete behavior

function randomAvatar() {
  const base = AVATAR_BASES[Math.floor(Math.random() * AVATAR_BASES.length)];
  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  return { base: base.id, color: color.id, shirt: 'none', accessory: 'none' };
}

function resolvePreset(preset: BotPreset, index: number): BotPreset {
  return preset === 'mixed' ? MIXED_ROTATION[index % MIXED_ROTATION.length] : preset;
}

/** Adds `count` simulated players to the room, tagged with their behavior in room.bots. */
export function addBots(room: ServerRoom, count: number, preset: BotPreset): void {
  if (count < 1 || count > 30) throw new RoomError('Bot count must be between 1 and 30');

  for (let i = 0; i < count; i++) {
    const n = room.bots.size + i;
    // Suffixed with a number once the name pool wraps, so nicknames stay
    // unique (joinRoom rejects collisions the same as it would for a real
    // player) no matter how many bots are requested.
    const name = BOT_FIRST_NAMES[n % BOT_FIRST_NAMES.length];
    const nickname = n < BOT_FIRST_NAMES.length ? `${name} 🤖` : `${name} 🤖 ${Math.floor(n / BOT_FIRST_NAMES.length) + 1}`;
    const player = joinRoom(room, nickname, undefined, randomAvatar());
    player.isBot = true;
    room.bots.set(player.id, resolvePreset(preset, room.bots.size));
  }
}

/** Fraction into the time limit (0–1) a bot of this behavior answers at, or null if it never answers. */
function timingFor(behavior: BotPreset): number | null {
  switch (behavior) {
    case 'perfect': return 0.3 + Math.random() * 0.3; // 30–60%
    case 'beginner': return 0.7 + Math.random() * 0.2; // 70–90%
    case 'fast': return 0.1 + Math.random() * 0.1; // 10–20%
    case 'slow': return 0.85 + Math.random() * 0.1; // 85–95%
    case 'random': return Math.random() * 0.9;
    case 'timeout': return null;
    case 'mixed': return 0.4; // resolved before this is ever called
  }
}

function pickOption(behavior: BotPreset, question: Question): number {
  if (behavior === 'perfect' || behavior === 'fast' || behavior === 'slow') {
    return question.correctIndex;
  }
  if (behavior === 'beginner') {
    const wrong = question.options.map((_, i) => i).filter((i) => i !== question.correctIndex);
    return wrong.length > 0 ? wrong[Math.floor(Math.random() * wrong.length)] : question.correctIndex;
  }
  // random / mixed(unresolved)
  return Math.floor(Math.random() * question.options.length);
}

/**
 * Schedules each bot's answer for the just-started question. `submit` is the
 * same post-answer path (record + broadcast + maybe auto-reveal) the real
 * player:answer handler uses — see registerHandlers.ts.
 */
export function scheduleBotAnswers(
  room: ServerRoom,
  question: Question,
  submit: (playerId: string, optionIndex: number) => void,
): void {
  if (room.bots.size === 0) return;

  for (const [playerId, behavior] of room.bots) {
    const t = timingFor(behavior);
    if (t === null) continue; // 'timeout' bots simply never answer

    const optionIndex = pickOption(behavior, question);
    const delayMs = Math.max(50, t * question.timeLimitSec * 1000);
    const timer = setTimeout(() => submit(playerId, optionIndex), delayMs);
    room.botTimers.push(timer);
  }
}

export const BOT_PRESETS: BotPreset[] = [...RESOLVED_PRESETS, 'mixed'];
