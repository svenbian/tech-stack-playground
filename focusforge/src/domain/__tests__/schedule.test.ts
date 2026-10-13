import { activeWindow, formatScheduleDays, isScheduleActive, nextStart } from '../schedule';
import type { Schedule } from '../types';

// 2026-10-12 is a Monday.
const at = (day: number, h: number, m = 0) => new Date(2026, 9, day, h, m).getTime();

const work: Schedule = {
  id: 'w',
  name: 'Work',
  emoji: '💼',
  days: [1, 2, 3, 4, 5],
  startMinutes: 9 * 60,
  endMinutes: 17 * 60,
  blockListIds: [],
  difficulty: 'medium',
  enabled: true,
};
const sleep: Schedule = { ...work, id: 's', days: [1], startMinutes: 23 * 60, endMinutes: 7 * 60 };

describe('schedules', () => {
  it('daytime windows respect days and times', () => {
    expect(isScheduleActive(work, at(12, 10))).toBe(true); // Mon 10:00
    expect(isScheduleActive(work, at(12, 17))).toBe(false); // end is exclusive
    expect(isScheduleActive(work, at(11, 10))).toBe(false); // Sunday
    expect(isScheduleActive({ ...work, enabled: false }, at(12, 10))).toBe(false);
  });

  it('overnight windows belong to the day they start', () => {
    expect(isScheduleActive(sleep, at(12, 23, 30))).toBe(true); // Mon night
    expect(isScheduleActive(sleep, at(13, 6, 59))).toBe(true); // Tue early morning (Mon's window)
    expect(isScheduleActive(sleep, at(13, 7))).toBe(false);
    expect(isScheduleActive(sleep, at(13, 23, 30))).toBe(false); // Tue not selected
    expect(activeWindow(sleep, at(13, 1))).toEqual({ start: at(12, 23), end: at(13, 7) });
  });

  it('finds the next start', () => {
    expect(nextStart(work, at(12, 10))).toBe(at(13, 9));
    expect(nextStart(work, at(16, 18))).toBe(at(19, 9)); // Fri evening → Mon
  });

  it('formats day sets', () => {
    expect(formatScheduleDays([1, 2, 3, 4, 5])).toBe('Weekdays');
    expect(formatScheduleDays([6, 0])).toBe('Weekends');
    expect(formatScheduleDays([0, 1, 2, 3, 4, 5, 6])).toBe('Every day');
    expect(formatScheduleDays([1, 3])).toBe('Mon, Wed');
  });
});
