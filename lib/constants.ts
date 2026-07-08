import { Milestone } from '@/components/MilestoneToast';

// Reading milestones, celebrated once each per reader (tested against
// lifetime read count and current streak length).
export const MILESTONES: (Milestone & { test: (s: { lifetime: number; streak: number }) => boolean })[] = [
  { id: 'first-read', label: 'First book logged!', emoji: '📖', test: s => s.lifetime >= 1 },
  { id: 'reads-10',   label: '10 reads',           emoji: '⭐', test: s => s.lifetime >= 10 },
  { id: 'reads-50',   label: '50 reads',           emoji: '🌟', test: s => s.lifetime >= 50 },
  { id: 'reads-100',  label: '100 reads!',         emoji: '🏆', test: s => s.lifetime >= 100 },
  { id: 'streak-7',   label: '7-day streak',       emoji: '🔥', test: s => s.streak >= 7 },
  { id: 'streak-30',  label: '30-day streak!',     emoji: '🚀', test: s => s.streak >= 30 },
];

// Wish-list gifting occasions (chips on the library row + public registry).
export const OCCASIONS = ['Birthday', 'Holiday', 'Just Because'];

// Who-read-to-whom on a reading log.
export const READ_MODES = [
  { id: 'to_child', label: 'I read to them', short: 'Read to', emoji: '🗣️' },
  { id: 'together', label: 'We read together', short: 'Together', emoji: '👥' },
  { id: 'by_child', label: 'They read it themselves!', short: 'Solo', emoji: '🌟' },
] as const;
