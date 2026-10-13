import type { AppCategory, AppInfo } from '@/domain/types';

/**
 * A sample catalog of apps and websites. On a real device this list comes from
 * the OS: iOS shows its own FamilyActivityPicker (we never see app names), and
 * Android can list installed packages via PackageManager.
 */
export const APP_CATALOG: AppInfo[] = [
  // Social
  { id: 'instagram', name: 'Instagram', category: 'social', icon: 'logo-instagram', color: '#E1306C', kind: 'app' },
  { id: 'tiktok', name: 'TikTok', category: 'social', icon: 'logo-tiktok', color: '#111111', kind: 'app' },
  { id: 'x', name: 'X', category: 'social', icon: 'logo-twitter', color: '#1D1D1F', kind: 'app' },
  { id: 'facebook', name: 'Facebook', category: 'social', icon: 'logo-facebook', color: '#1877F2', kind: 'app' },
  { id: 'snapchat', name: 'Snapchat', category: 'social', icon: 'logo-snapchat', color: '#F7C600', kind: 'app' },
  { id: 'reddit', name: 'Reddit', category: 'social', icon: 'logo-reddit', color: '#FF4500', kind: 'app' },
  { id: 'linkedin', name: 'LinkedIn', category: 'social', icon: 'logo-linkedin', color: '#0A66C2', kind: 'app' },
  // Entertainment
  { id: 'youtube', name: 'YouTube', category: 'entertainment', icon: 'logo-youtube', color: '#FF0000', kind: 'app' },
  { id: 'netflix', name: 'Netflix', category: 'entertainment', icon: 'film', color: '#B20710', kind: 'app' },
  { id: 'twitch', name: 'Twitch', category: 'entertainment', icon: 'logo-twitch', color: '#9146FF', kind: 'app' },
  { id: 'spotify', name: 'Spotify', category: 'entertainment', icon: 'musical-notes', color: '#1DB954', kind: 'app' },
  // Games
  { id: 'candy', name: 'Candy Match', category: 'games', icon: 'game-controller', color: '#F06292', kind: 'app' },
  { id: 'chess', name: 'Chess', category: 'games', icon: 'extension-puzzle', color: '#8D6E63', kind: 'app' },
  { id: 'clash', name: 'Clash Arena', category: 'games', icon: 'shield', color: '#FFB300', kind: 'app' },
  // News
  { id: 'news', name: 'News', category: 'news', icon: 'newspaper', color: '#EF5350', kind: 'app' },
  { id: 'hn', name: 'Hacker News', category: 'news', icon: 'globe-outline', color: '#FF6600', kind: 'website', domain: 'news.ycombinator.com' },
  // Shopping
  { id: 'amazon', name: 'Amazon', category: 'shopping', icon: 'cart', color: '#FF9900', kind: 'app' },
  { id: 'etsy', name: 'Etsy', category: 'shopping', icon: 'pricetag', color: '#F1641E', kind: 'website', domain: 'etsy.com' },
  // Communication (usually allowlisted)
  { id: 'phone', name: 'Phone', category: 'communication', icon: 'call', color: '#34C759', kind: 'app' },
  { id: 'messages', name: 'Messages', category: 'communication', icon: 'chatbubble', color: '#30D158', kind: 'app' },
  { id: 'whatsapp', name: 'WhatsApp', category: 'communication', icon: 'logo-whatsapp', color: '#25D366', kind: 'app' },
  { id: 'mail', name: 'Mail', category: 'communication', icon: 'mail', color: '#0A84FF', kind: 'app' },
  // Productivity
  { id: 'notion', name: 'Notes', category: 'productivity', icon: 'document-text', color: '#6E6E73', kind: 'app' },
  { id: 'calendar', name: 'Calendar', category: 'productivity', icon: 'calendar', color: '#FF3B30', kind: 'app' },
  { id: 'slack', name: 'Slack', category: 'productivity', icon: 'logo-slack', color: '#4A154B', kind: 'app' },
  // Utilities
  { id: 'maps', name: 'Maps', category: 'utilities', icon: 'map', color: '#32ADE6', kind: 'app' },
  { id: 'camera', name: 'Camera', category: 'utilities', icon: 'camera', color: '#636366', kind: 'app' },
  { id: 'bank', name: 'Banking', category: 'utilities', icon: 'card', color: '#2E7D32', kind: 'app' },
];

export const CATEGORY_META: Record<AppCategory, { label: string; emoji: string; icon: string }> = {
  social: { label: 'Social Media', emoji: '💬', icon: 'people' },
  entertainment: { label: 'Entertainment', emoji: '🎬', icon: 'play-circle' },
  games: { label: 'Games', emoji: '🎮', icon: 'game-controller' },
  news: { label: 'News', emoji: '📰', icon: 'newspaper' },
  shopping: { label: 'Shopping', emoji: '🛍️', icon: 'bag-handle' },
  communication: { label: 'Communication', emoji: '📞', icon: 'chatbubbles' },
  productivity: { label: 'Productivity', emoji: '🗂️', icon: 'briefcase' },
  utilities: { label: 'Utilities', emoji: '🧰', icon: 'construct' },
};

export const CATEGORY_ORDER: AppCategory[] = [
  'social',
  'entertainment',
  'games',
  'news',
  'shopping',
  'communication',
  'productivity',
  'utilities',
];

export const DEFAULT_ALLOWLIST = ['phone', 'messages', 'maps', 'calendar', 'bank', 'camera'];

const byId = new Map(APP_CATALOG.map((a) => [a.id, a]));
export function getApp(id: string): AppInfo | undefined {
  return byId.get(id);
}
