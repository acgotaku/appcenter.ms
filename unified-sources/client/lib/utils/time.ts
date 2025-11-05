import { t } from "@root/lib/i18n";
import {
  isValid,
  parseISO,
  differenceInYears,
  differenceInMonths,
  differenceInWeeks,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  differenceInMilliseconds,
  differenceInCalendarDays,
  isSameDay,
} from "date-fns";
import { getCurrentLanguage } from "@root/lib/i18n/utils";
import { DateFormats, formatLocalizedDate } from "@root/lib/i18n/date-formatter";

const Iso8601Duration = require("iso8601-duration");

export const ONE_SECOND_IN_MS = 1000;
export const ONE_MINUTE_IN_SECONDS = 60;
export const ONE_HOUR_IN_MINUTES = 60;
export const ONE_DAY_IN_HOURS = 24;
export const ONE_MINUTE_IN_MS = ONE_MINUTE_IN_SECONDS * ONE_SECOND_IN_MS;
export const ONE_HOUR_IN_MS = ONE_HOUR_IN_MINUTES * ONE_MINUTE_IN_MS;
export const ONE_DAY_IN_MS = ONE_DAY_IN_HOURS * ONE_HOUR_IN_MS;
export const ONE_DAY_IN_SECONDS = ONE_DAY_IN_HOURS * ONE_HOUR_IN_MINUTES * ONE_MINUTE_IN_SECONDS;

// Bringing in from Crashes

/**
 * Returns the "named day" representation of a relative date, i.e. Today, Yesterday, Nov 29, 3:30 PM
 *
 * @param input The date to process as relative to now
 */
export function relativeNamedDay(input: string | Date): string | null {
  const then = input instanceof Date ? (input as Date) : new Date(input);
  const now = Date.now();
  const seconds = differenceInSeconds(now, then);
  const days = differenceInCalendarDays(now, then);

  if (isNaN(days) || days < 0) {
    return null;
  }

  if (seconds < ONE_MINUTE_IN_SECONDS) {
    return t("common:dateTime.relative.namedDay.justNow");
  } else if (days === 0) {
    return t("common:dateTime.relative.namedDay.todayWithTime", { time: then });
  } else if (days === 1) {
    return t("common:dateTime.relative.namedDay.yesterdayWithTime", { time: then });
  } else {
    return formatDate(then, "shortMonthAndDateAndTime");
  }
}

/**
 * Formats a date relative to now as a string (i.e. 4 minutes ago, 2 weeks from now).
 *
 * @param input The date to format relative to now
 * @param shorten Whether to use short formats for relative strings (i.e. "h" instead of "hour")
 */
export function relativeDate(input: string | Date, shorten: boolean = false): string {
  const date = typeof input === "string" ? parseISO(input) : input;
  if (!isValid(date)) {
    return t("common:dateTime.invalidDate");
  }

  const now = new Date();

  return (
    checkDifferenceAndReturn(differenceInYears(date, now), "year", shorten) ||
    checkDifferenceAndReturn(differenceInMonths(date, now), "month", shorten) ||
    checkDifferenceAndReturn(differenceInWeeks(date, now), "week", shorten) ||
    checkDifferenceAndReturn(differenceInDays(date, now), "day", shorten) ||
    checkDifferenceAndReturn(differenceInHours(date, now), "hour", shorten) ||
    checkDifferenceAndReturn(differenceInMinutes(date, now), "minute", shorten) ||
    checkDifferenceAndReturn(differenceInSeconds(date, now), "second", shorten) ||
    handleRemainderDifference(differenceInMilliseconds(date, now), shorten)
  );
}

function checkDifferenceAndReturn(difference: number, partName: string, shorten: boolean): string | null {
  const magnitude = Math.abs(difference);
  if (magnitude > 0) {
    return getRelativeString(magnitude, difference > 0 ? "future" : "past", partName, shorten);
  }

  return null;
}

function handleRemainderDifference(difference: number, shorten: boolean): string {
  const magnitude = Math.abs(difference);
  // Give ourselves 100ms of leeway for the "no difference" case, to aid in testing. 100ms here makes no
  // material difference and is much easier to guarantee in testing.
  return getRelativeString(magnitude > 100 ? 1 : 0, difference > 100 ? "future" : "past", "second", shorten);
}

function getRelativeString(value: number, timeDiff: string, partName: string, shorten: boolean): string {
  return t(`common:dateTime.relative.${timeDiff}.${shorten ? "short" : "full"}.${partName}`, { count: value, value: value });
}

export function simplePrettyDuration(start: string, end: string): string {
  let diff = new Date(end).getTime() - new Date(start).getTime();
  const isNegative = diff < 0;
  diff = Math.abs(diff);

  const days = Math.floor(diff / ONE_DAY_IN_MS);
  diff -= days * ONE_DAY_IN_MS;

  const hours = Math.floor(diff / ONE_HOUR_IN_MS);
  diff -= hours * ONE_HOUR_IN_MS;

  const minutes = Math.floor(diff / ONE_MINUTE_IN_MS);
  diff -= minutes * ONE_MINUTE_IN_MS;

  const seconds = Math.floor(diff / ONE_SECOND_IN_MS);

  const fractions = [days, hours, minutes, seconds];
  const tokens = [
    (value: number) => getSimplifiedPrettyString(value, "day"),
    (value: number) => getSimplifiedPrettyString(value, "hour"),
    (value: number) => getSimplifiedPrettyString(value, "minute"),
    (value: number) => getSimplifiedPrettyString(value, "second"),
  ];
  const allZero = fractions.every((x) => x === 0);

  if (allZero) {
    const lastIndex = fractions.length - 1;
    return tokens[lastIndex](fractions[lastIndex]);
  }

  // remove leading zeros
  let counter = tokens.length;
  while (counter) {
    if (fractions[0] === 0) {
      fractions.shift();
      tokens.shift();
    }
    counter--;
  }

  const result = fractions.map((x, index) => tokens[index](x)).join(" ");

  return isNegative ? "-" + result : result;
}

function getSimplifiedPrettyString(value: number, part: string) {
  return t(`common:dateTime.duration.simplifiedPretty.${part}`, { value: value, count: value });
}

/**
 * Returns largest amount of time less than or equal the nearest multiple of the snap factor
 *
 * @param timeInMs The time, in milliseconds
 * @param snap The factor, in milliseconds, to snap the time to
 */
export function floorTime(timeInMs: number, snap: number = 5 * ONE_MINUTE_IN_MS) {
  return timeInMs - (timeInMs % snap);
}

/**
 * Returns the largest amount of time greater than or equal to the nearest multiple of the snap factor
 *
 * @param timeInMs The time, in milliseconds
 * @param snap The factor, in milliseconds, to snap the time to
 */
export function ceilTime(timeInMs: number, snap: number = 5 * ONE_MINUTE_IN_MS) {
  let temp = timeInMs % snap;
  if (temp !== 0) {
    temp -= snap;
  }
  return timeInMs - temp;
}

/**
 * Format a date/time value based on a pre-defined format.
 *
 * @param value The date/tiem value to format, as an ISO 8601 string, or a Date
 * @param format The named format to use
 * @param utc Whether the formatted time should be in the UTC timezone, instead of local
 */
export function formatDate(value: string | Date, format: DateFormats, utc: boolean = false): string {
  const toFormat = value instanceof Date ? value : new Date(value);
  const lang = getCurrentLanguage();
  return formatLocalizedDate(toFormat, utc ? `${format}:utc` : format, lang);
}

// From Analytics

/**
 * Formats a duration in milliseconds in a compact format
 *
 * @param durationInMs The duration to format
 */
export function formatMillisecondsDuration(durationInMs: number): string {
  if (durationInMs === 0) {
    return t("dateTime.duration.simplifiedPretty.second", { value: 0 });
  } else if (durationInMs > 0 && durationInMs < ONE_SECOND_IN_MS) {
    return t("dateTime.duration.lessThanSomeSeconds", { value: 1 });
  } else {
    const fd = (amount: number, part: string) =>
      amount > 0 ? t(`dateTime.duration.simplifiedPretty.${part}`, { value: amount }) : "";
    const { hours, minutes, seconds } = splitMs(durationInMs);
    return `${fd(hours, "hour")}${fd(minutes, "minute")}${fd(seconds, "second")}`;
  }
}

function splitMs(durationMS: number): { hours: number; minutes: number; seconds: number } {
  const hoursInMs = Math.floor(durationMS / ONE_HOUR_IN_MS) * ONE_HOUR_IN_MS;
  const minutesInMs = Math.floor((durationMS - hoursInMs) / ONE_MINUTE_IN_MS) * ONE_MINUTE_IN_MS;
  const secondsInMs = Math.floor((durationMS - hoursInMs - minutesInMs) / ONE_SECOND_IN_MS) * ONE_SECOND_IN_MS;

  const hours = hoursInMs / ONE_HOUR_IN_MS;
  const minutes = minutesInMs / ONE_MINUTE_IN_MS;
  const seconds = secondsInMs / ONE_SECOND_IN_MS;

  return { hours, minutes, seconds };
}

/**
 * Format as ISO 8601 duration (required for test data generation).
 *
 * @param durationInMs The duration to format, in milliseconds
 */
export function millisecondsToIsoDuration(durationInMs: number): string {
  const { hours, minutes, seconds } = splitMs(durationInMs);
  const fd = (amount: number, suffix: string): string => (amount > 0 ? `${amount}${suffix}` : "");

  // NOTE: Since this is an ISO standard that is intended to be machine readable, it
  // should not be localized
  return `PT${fd(hours, "H")}${fd(minutes, "M")}${fd(seconds, "S")}`;
}

/**
 * Helper function for converting to milliseconds without a lot of inline multiplies.
 */
export function hmsToMs(hours: number, minutes: number, seconds: number): number {
  return hours * ONE_HOUR_IN_MINUTES + minutes * ONE_MINUTE_IN_MS + seconds * ONE_SECOND_IN_MS;
}

/**
 * Helper function for converting to ISO8601 duration.
 */
export function hmsToIsoDuration(hours: number, minutes: number, seconds: number): string {
  return millisecondsToIsoDuration(hmsToMs(hours, minutes, seconds));
}

/**
 * Parse an ISO8601 duration into milliseconds.
 *
 * @param duration String representation of an ISO8601 duration to parse
 */
export function safeParseIsoDuration(duration: string): number {
  try {
    return Iso8601Duration.toSeconds(Iso8601Duration.parse(duration)) * 1000;
  } catch (ex) {
    return NaN;
  }
}

/**
 * Checks whether the provided date is the same day as today. If providing a Date, be sure
 * it has the proper timezone offset set for comparison. If providing a string, it must be
 * an ISO 8601 date string, with either the timezone offset included, or specified in UTC
 * (with the trailing Z to denote this).
 *
 * @param date The date to compare to today.
 */
export function isToday(date: string | Date): boolean {
  // Have to do several things to make sure we get an accurate comparison here:
  // 1. If date is passed as a string, it *has* to be as an ISO 8601 string, either with the
  //    timezone offset included, or specified as being UTC (i.e. with a Z). Otherwise, the
  //    date will be set with the timezone offset of the user's computer
  // 2. While the isSameDay function of date-fns can accept a string, we need to create the Date
  //    object first ourselves to make sure the timezone offset is properly set. Once the string
  //    value is parsed, it will be stored in terms of the user's computer's timezone offset.
  // 3. Rather than using Date.now() to get the current date, use new Date(). The latter ensures
  //    the correct timezone offset is set.
  const toCompare = date instanceof Date ? date : new Date(date);
  const sameDay = isSameDay(new Date(), toCompare);
  return sameDay;
}
