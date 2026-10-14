/**
 * The app works with *date-only* values as ISO strings (`YYYY-MM-DD`), since a
 * weight is logged against a day, not an instant. This is the one place that
 * converts between those strings and real dates, so nothing else has to hand-
 * roll parsing or day arithmetic.
 *
 * Built on `date-fns` rather than `Date` maths: it already handles the awkward
 * cases (month ends, DST, leap years) that hand-written `setDate` calls get
 * wrong.
 */
import { differenceInCalendarDays, format, parseISO, subDays } from 'date-fns'

/** Parses a `YYYY-MM-DD` string into a local-midnight Date. */
export function parseDay(iso: string): Date {
  return parseISO(iso)
}

/** Formats a Date as `YYYY-MM-DD`. */
export function formatDay(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/** Today as `YYYY-MM-DD`, in local time. */
export function today(): string {
  return formatDay(new Date())
}

/** Whole days from `from` to `to`, later minus earlier. */
export function daysBetween(fromIso: string, toIso: string): number {
  return differenceInCalendarDays(parseDay(toIso), parseDay(fromIso))
}

/** `days` before the given date, as an ISO string. */
export function subDaysIso(iso: string, days: number): string {
  return formatDay(subDays(parseDay(iso), days))
}
