/**
 * Myanmar Time (UTC+6:30) helper utilities to ensure consistent date comparisons
 * regardless of server or client local time.
 */

export const MM_OFFSET_MS = 6.5 * 60 * 60 * 1000;

/**
 * Returns a Date object adjusted to Myanmar Time components,
 * but still represented as a UTC date for component extraction.
 * Useful for getUTCFullYear(), getUTCMonth(), getUTCDate().
 */
export function getMMDate(date: Date = new Date()): Date {
    return new Date(date.getTime() + MM_OFFSET_MS);
}

/**
 * Returns the UTC timestamp representing the start (midnight) of the day in Myanmar.
 */
export function getMMMidnight(date: Date = new Date()): Date {
    const mmDate = getMMDate(date);
    return new Date(Date.UTC(
        mmDate.getUTCFullYear(),
        mmDate.getUTCMonth(),
        mmDate.getUTCDate()
    ));
}

/**
 * Checks if a given timestamp (lastCheckIn) is on or after the current Myanmar "today".
 */
export function hasCheckedInToday(lastCheckIn: Date | string | null): boolean {
    if (!lastCheckIn) return false;
    
    const nowMidnight = getMMMidnight(new Date());
    const lastCheckInMidnight = getMMMidnight(new Date(lastCheckIn));
    
    return lastCheckInMidnight.getTime() >= nowMidnight.getTime();
}
