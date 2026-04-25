import { startOfDay, addDays, subDays } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export function getAppTimeZone(): string {
  return process.env.APP_TIMEZONE || "America/Bogota";
}

export function getTodayRangeUtc(timeZone: string = getAppTimeZone()): {
  startUtc: Date;
  nextStartUtc: Date;
} {
  const currentTimeInZone = toZonedTime(new Date(), timeZone);

  const startOfTodayInZone = startOfDay(currentTimeInZone);
  const startOfTomorrowInZone = startOfDay(addDays(currentTimeInZone, 1));

  return {
    startUtc: fromZonedTime(startOfTodayInZone, timeZone),
    nextStartUtc: fromZonedTime(startOfTomorrowInZone, timeZone),
  };
}

/**
 * Interprets `fromIso` and `toIso` as **UTC calendar dates** (YYYY-MM-DD) and
 * returns a half-open [startUtc, endUtc) range in absolute time.
 * This matches how `timestamptz` values are compared to "the same day" in DB
 * tools that show UTC, so two `sold_at` on the same UTC date are not split
 * by America/Bogota (e.g. 03:08Z vs 22:39Z on 2026-04-25 both count for that day).
 */
export function dateRangeToUtc(
  fromIso: string,
  toIso: string
): { startUtc: Date; endUtc: Date } {
  const startUtc = new Date(`${fromIso}T00:00:00.000Z`);
  const endExclusiveBase = new Date(`${toIso}T00:00:00.000Z`);
  const endUtc = addDays(endExclusiveBase, 1);
  return { startUtc, endUtc };
}

export function getTodayRange(timeZone: string = getAppTimeZone()): {
  from: Date;
  to: Date;
} {
  const now = toZonedTime(new Date(), timeZone);
  const today = startOfDay(now);
  return { from: today, to: today };
}

export function getYesterdayRange(timeZone: string = getAppTimeZone()): {
  from: Date;
  to: Date;
} {
  const now = toZonedTime(new Date(), timeZone);
  const yesterday = startOfDay(subDays(now, 1));
  return { from: yesterday, to: yesterday };
}
