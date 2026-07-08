import { useMemo } from 'react';
import { isToday, isYesterday, isEarlierThisWeek, isThisWeek } from '@/lib/helpers';
import type { Book, ReadingLog } from '@/lib/types';

// Derived reading stats for the active reader. Pure extraction of the five
// memo blocks that used to live in page.tsx (getBookCover is passed in because
// groupedHistory looks up covers from the library).
export function useStats({
  logs, library, activeReader, readerGoals, getBookCover,
}: {
  logs: ReadingLog[];
  library: Book[];
  activeReader: string;
  readerGoals: Record<string, { daily: number; weekly: number }>;
  getBookCover: (title: string) => string | null;
}) {
  const stats = useMemo(() => {
    const readerLog = logs.filter(item => item.reader_name === activeReader);
    // Completed reads have a timestamp; chapter books still in progress
    // (started_at set, timestamp null) are tracked separately and must not
    // inflate counts/streaks/history.
    const completed = readerLog.filter(item => item.timestamp);
    const currentlyReading = readerLog.filter(item => item.started_at && !item.timestamp);
    const currentGoals = readerGoals[activeReader] || readerGoals['default'] || { daily: 2, weekly: 10 };
    const dailyCount = completed.filter(item => isToday(item.timestamp)).length;
    const weeklyCount = completed.filter(item => isThisWeek(item.timestamp)).length;
    const lifetimeCount = completed.length;
    return { dailyCount, weeklyCount, lifetimeCount, readerLog, completed, currentlyReading, goals: currentGoals };
  }, [logs, activeReader, readerGoals]);

  // Reading streak for the active reader: consecutive calendar days with at
  // least one logged read. `current` counts back from today (still "alive" if
  // they read yesterday but not yet today); `longest` is their all-time best.
  const streak = useMemo(() => {
    const keyFor = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const dayKeys = new Set(stats.completed.map(l => keyFor(new Date(l.timestamp))));

    let current = 0;
    const cursor = new Date();
    if (!dayKeys.has(keyFor(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (dayKeys.has(keyFor(cursor))) {
      current++;
      cursor.setDate(cursor.getDate() - 1);
    }

    // Longest run, stepping day-by-day (DST-safe) over the sorted unique days.
    const days = Array.from(dayKeys)
      .map(k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m, d); })
      .sort((a, b) => a.getTime() - b.getTime());
    let longest = 0, run = 0;
    let prev: Date | null = null;
    for (const d of days) {
      if (prev) {
        const next = new Date(prev);
        next.setDate(next.getDate() + 1);
        run = keyFor(next) === keyFor(d) ? run + 1 : 1;
      } else {
        run = 1;
      }
      longest = Math.max(longest, run);
      prev = d;
    }
    return { current, longest };
  }, [stats.completed]);

  const uniqueShelves = useMemo(() => {
      const shelves = new Set<string>();
      library.forEach(book => {
          if (book.shelves) book.shelves.forEach(s => shelves.add(s));
      });
      return Array.from(shelves).sort();
  }, [library]);

  const chartData = useMemo(() => {
      const days = [];
      const now = new Date();
      const currentDay = now.getDay();
      const diff = currentDay === 0 ? 6 : currentDay - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diff);
      for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d);
          let count = 0;
          if (d <= now) {
              count = logs.filter(item => { if (!item.timestamp) return false; const itemDate = new Date(item.timestamp); return item.reader_name === activeReader && itemDate.getDate() === d.getDate() && itemDate.getMonth() === d.getMonth(); }).length;
          }
          days.push({ day: dayName, count, isToday: d.getDate() === now.getDate() && d.getMonth() === now.getMonth() });
      }
      return days;
  }, [logs, activeReader]);

  const groupedHistory = useMemo(() => {
      const groups: { today: any[], yesterday: any[], week: any[], older: any[] } = { today: [], yesterday: [], week: [], older: [] };
      const sortedLog = [...stats.completed].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const aggregated: Record<string, any> = {};

      sortedLog.forEach(item => {
          const dateKey = new Date(item.timestamp).toLocaleDateString();
          const key = `${dateKey}-${item.book_title}`;
          if (!aggregated[key]) {
              const libBook = library.find(b => b.title === item.book_title);
              aggregated[key] = {
                  id: item.id,
                  title: item.book_title,
                  author: item.book_author,
                  cover: getBookCover(item.book_title),
                  dailyCount: 0,
                  timestamp: item.timestamp,
                  reader: item.reader_name,
                  notes: item.notes,
                  read_mode: item.read_mode,
                  ownershipStatus: libBook ? libBook.ownership_status : 'wishlist',
                  shelves: libBook ? libBook.shelves : []
              };
          }
          aggregated[key].dailyCount += 1;
      });

      Object.values(aggregated).forEach((item: any) => {
          if (isToday(item.timestamp)) groups.today.push(item);
          else if (isYesterday(item.timestamp)) groups.yesterday.push(item);
          else if (isEarlierThisWeek(item.timestamp)) groups.week.push(item);
          else groups.older.push(item);
      });
      return groups;
  }, [stats.completed, library]); // Removed getBookCover from dependencies as it's a function

  return { stats, streak, chartData, uniqueShelves, groupedHistory };
}
