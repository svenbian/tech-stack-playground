/** Gentle words for the block screen. Kind, never preachy. */
export const MINDFUL_QUOTES: { text: string; author?: string }[] = [
  { text: 'Almost everything will work again if you unplug it for a few minutes, including you.', author: 'Anne Lamott' },
  { text: 'The present moment is filled with joy and happiness. If you are attentive, you will see it.', author: 'Thich Nhat Hanh' },
  { text: 'Where attention goes, energy flows.' },
  { text: 'You don’t have to see the whole staircase. Just take the first step.', author: 'Martin Luther King Jr.' },
  { text: 'Slow is smooth, and smooth is fast.' },
  { text: 'Starve your distractions, feed your focus.' },
  { text: 'The successful warrior is the average person with laser-like focus.', author: 'Bruce Lee' },
  { text: 'Nothing is worth more than this day.', author: 'Goethe' },
  { text: 'Rest is not idleness.', author: 'John Lubbock' },
  { text: 'Be where your feet are.' },
];

export const GENTLE_MESSAGES = [
  'This can wait. Your future self will thank you.',
  'You set this boundary for a reason. Let’s honour it.',
  'Take a breath. What were you about to do before this?',
  'A little pause goes a long way.',
  'You’re doing better than you think.',
];

export const ENCOURAGEMENTS = [
  'Every focused minute counts.',
  'Small steps, steady progress.',
  'Your attention is precious. Spend it well.',
  'Progress, not perfection.',
];

export function pickDaily<T>(items: T[], now: number, salt = 0): T {
  const day = Math.floor(now / 86_400_000);
  return items[(day + salt) % items.length];
}

export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
