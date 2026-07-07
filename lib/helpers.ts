// Pure date/display helpers shared across the app.

export const isToday = (isoString?: string) => {
    if (!isoString) return false;
    const date = new Date(isoString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

export const isYesterday = (isoString?: string) => {
    if (!isoString) return false;
    const date = new Date(isoString);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getDate() === yesterday.getDate() &&
           date.getMonth() === yesterday.getMonth() &&
           date.getFullYear() === yesterday.getFullYear();
};

export const isEarlierThisWeek = (isoString?: string) => {
    if (!isoString) return false;
    if (isToday(isoString) || isYesterday(isoString)) return false;
    const date = new Date(isoString);
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0,0,0,0);
    return date >= monday && date <= now;
};

export const isThisWeek = (isoString?: string) => {
    if (!isoString) return false;
    const date = new Date(isoString);
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= oneWeekAgo && date <= now;
};

export const getLastName = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    return parts.length > 0 ? parts[parts.length - 1] : fullName;
};

export const getAvatarUrl = (name: string, map: Record<string, string>) => {
    if (!name) return 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback';
    if (map[name]) return `/avatars/${map[name]}`;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
};

// Inclusive whole-day count between two ISO timestamps (day 1 = same day).
export const daysBetween = (aIso?: string | null, bIso?: string | null) => {
    if (!aIso || !bIso) return 0;
    const a = new Date(aIso); const b = new Date(bIso);
    const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((b0.getTime() - a0.getTime()) / 86400000) + 1;
};
