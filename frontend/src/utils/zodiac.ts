// src/utils/zodiac.ts
//
// Derives a character's zodiac sign from Character.birth_date ('MM/DD', no year).
// Deliberately NOT stored on the Character model — it's a pure function of
// birth_date, so keeping it derived avoids a second source of truth that can
// drift if birth_date is ever edited.

export interface ZodiacSign {
    name: string;       // e.g. "Aries"
    symbol: string;      // e.g. "♈"
    dateRange: string;   // e.g. "Mar 21 – Apr 19"
}

interface ZodiacRange extends ZodiacSign {
    startMonth: number;
    startDay: number;
}

// Ordered Aquarius → Sagittarius (i.e. NOT starting with the year-wrapping
// Capricorn) so a simple descending scan works without special-casing the
// wrap during the loop. Capricorn is handled separately below.
const ZODIAC_RANGES: ZodiacRange[] = [
    { name: 'Aquarius', symbol: '♒', dateRange: 'Jan 20 – Feb 18', startMonth: 1, startDay: 20 },
    { name: 'Pisces', symbol: '♓', dateRange: 'Feb 19 – Mar 20', startMonth: 2, startDay: 19 },
    { name: 'Aries', symbol: '♈', dateRange: 'Mar 21 – Apr 19', startMonth: 3, startDay: 21 },
    { name: 'Taurus', symbol: '♉', dateRange: 'Apr 20 – May 20', startMonth: 4, startDay: 20 },
    { name: 'Gemini', symbol: '♊', dateRange: 'May 21 – Jun 20', startMonth: 5, startDay: 21 },
    { name: 'Cancer', symbol: '♋', dateRange: 'Jun 21 – Jul 22', startMonth: 6, startDay: 21 },
    { name: 'Leo', symbol: '♌', dateRange: 'Jul 23 – Aug 22', startMonth: 7, startDay: 23 },
    { name: 'Virgo', symbol: '♍', dateRange: 'Aug 23 – Sep 22', startMonth: 8, startDay: 23 },
    { name: 'Libra', symbol: '♎', dateRange: 'Sep 23 – Oct 22', startMonth: 9, startDay: 23 },
    { name: 'Scorpio', symbol: '♏', dateRange: 'Oct 23 – Nov 21', startMonth: 10, startDay: 23 },
    { name: 'Sagittarius', symbol: '♐', dateRange: 'Nov 22 – Dec 21', startMonth: 11, startDay: 22 },
];

const CAPRICORN: ZodiacSign = { name: 'Capricorn', symbol: '♑', dateRange: 'Dec 22 – Jan 19' };

/**
 * Returns the zodiac sign for a 'MM/DD' birth_date string, or null if the
 * date is missing/malformed.
 */
export function getZodiacSign(birthDate: string | undefined | null): ZodiacSign | null {
    if (!birthDate) return null;

    const match = /^(\d{1,2})\/(\d{1,2})$/.exec(birthDate);
    if (!match) return null;

    const month = Number(match[1]);
    const day = Number(match[2]);
    if (!Number.isFinite(month) || !Number.isFinite(day)) return null;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    // Capricorn wraps the year boundary (Dec 22 → Jan 19) — check it first.
    const isLateDecember = month === 12 && day >= 22;
    const isEarlyJanuary = month === 1 && day < 20; // before Aquarius starts
    if (isLateDecember || isEarlyJanuary) {
        return CAPRICORN;
    }

    const value = month * 100 + day;

    // Find the last sign (scanning latest → earliest) whose start date is
    // on or before this date. reduce() avoids indexed array access.
    const match_ = ZODIAC_RANGES.reduce<ZodiacRange | null>((found, range) => {
        const rangeValue = range.startMonth * 100 + range.startDay;
        if (value >= rangeValue) {
            if (!found || rangeValue > found.startMonth * 100 + found.startDay) {
                return range;
            }
        }
        return found;
    }, null);

    if (!match_) return CAPRICORN; // shouldn't happen, but keeps return type non-null-safe
    const { startMonth, startDay, ...sign } = match_;
    return sign;
}