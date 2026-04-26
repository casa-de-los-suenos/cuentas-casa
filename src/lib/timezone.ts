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
 * Interprets `fromIso` and `toIso` as inclusive **calendar** dates (YYYY-MM-DD) in
 * `timeZone` (e.g. business day in `APP_TIMEZONE`) and returns a half-open
 * [startUtc, endUtc) range for querying `timestamptz` (e.g. `sold_at`).
 */
export function dateRangeToUtc(
  fromIso: string,
  toIso: string,
  timeZone: string = getAppTimeZone()
): { startUtc: Date; endUtc: Date } {
  const startUtc = fromZonedTime(`${fromIso}T00:00:00`, timeZone);

  const toDayStartUtc = fromZonedTime(`${toIso}T00:00:00`, timeZone);
  const toDayInBusinessZone = toZonedTime(toDayStartUtc, timeZone);
  const startOfDayAfterToInZone = startOfDay(addDays(toDayInBusinessZone, 1));
  const endUtc = fromZonedTime(startOfDayAfterToInZone, timeZone);

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
