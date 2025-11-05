/**
 * Add some enum definitions to ensure correct values are used for
 * date format options
 */
enum NumericOptions {
  Numeric = "numeric",
  TwoDigit = "2-digit",
}

enum StringOptions {
  Narrow = "narrow",
  Short = "short",
  Long = "long",
}

enum MonthOptions {
  Numeric = "numeric",
  TwoDigit = "2-digit",
  Narrow = "narrow",
  Short = "short",
  Long = "long",
}

// This is currently unused:
enum TimeZoneOptions {
  Short = "short",
  Long = "long",
}

/**
 * Formats are as follows (all examples en-US):
 *
 * shortFullDate - Dec 6, 2017
 *
 * shortFullDateTime - Dec 6, 2017, 2:14:37 PM
 *
 * shortFullDateTimeNoSeconds - Dec 6, 2017, 2:14 PM
 *
 * shortFullDateTimeNoCurrentYear - Dec 6, 2:14 PM
 *
 * shortMonthAndDate - Dec 06
 *
 * shortMonthAndShortDate - Dec 6
 *
 * shortTime - 2:14 PM
 *
 * shortMonthAndDateAndTime - Dec 6, 2:14 PM
 *
 * full24HourTime - 14:14:37
 *
 * longFullDateTime - December 6, 2017 2:14:37 PM
 *
 * longFullDateTimeWithSecondsAndWeekday - Wednesday December 6, 2017 2:14:37 PM
 *
 * longFullMonthYear - December 2019
 *
 * longMonthAndDate - December 9
 *
 * longMonthAndDateWithTimezone - December 9 (?)
 *
 */
export type DateFormats =
  | "shortFullDate"
  | "shortFullDateNoCurrentYear"
  | "shortFullDateTime"
  | "shortFullDateTimeNoSeconds"
  | "shortFullDateTimeNoCurrentYear"
  | "shortMonthAndDate"
  | "shortMonthAndShortDate"
  | "shortTime"
  | "shortMonthAndDateAndTime"
  | "full24HourTime"
  | "longFullDateTime"
  | "longFullDateTimeWithSecondsAndWeekday"
  | "longFullMonthYear"
  | "longMonthAndDate"
  | "longMonthAndDateWithTimezone";

const DateFormat: { [F in DateFormats]: Intl.DateTimeFormatOptions } = {
  shortFullDate: {
    month: MonthOptions.Short,
    year: NumericOptions.Numeric,
    day: NumericOptions.Numeric,
  },
  shortFullDateNoCurrentYear: {
    month: MonthOptions.Short,
    year: NumericOptions.Numeric,
    day: NumericOptions.Numeric,
  },
  shortFullDateTime: {
    month: MonthOptions.Short,
    year: NumericOptions.Numeric,
    day: NumericOptions.Numeric,
    hour: NumericOptions.Numeric,
    minute: NumericOptions.Numeric,
    second: NumericOptions.Numeric,
  },
  shortFullDateTimeNoSeconds: {
    month: MonthOptions.Short,
    year: NumericOptions.Numeric,
    day: NumericOptions.Numeric,
    hour: NumericOptions.Numeric,
    minute: NumericOptions.Numeric,
  },
  shortFullDateTimeNoCurrentYear: {
    month: MonthOptions.Short,
    year: NumericOptions.Numeric,
    day: NumericOptions.Numeric,
    hour: NumericOptions.Numeric,
    minute: NumericOptions.Numeric,
  },
  shortMonthAndDate: {
    month: MonthOptions.Short,
    day: NumericOptions.TwoDigit,
  },
  shortMonthAndShortDate: {
    month: MonthOptions.Short,
    day: NumericOptions.Numeric,
  },
  shortTime: {
    hour: NumericOptions.Numeric,
    minute: NumericOptions.Numeric,
  },
  shortMonthAndDateAndTime: {
    month: MonthOptions.Short,
    day: NumericOptions.Numeric,
    hour: NumericOptions.Numeric,
    minute: NumericOptions.Numeric,
  },
  full24HourTime: {
    hour: NumericOptions.TwoDigit,
    minute: NumericOptions.TwoDigit,
    second: NumericOptions.TwoDigit,
    hour12: false,
  },
  longFullDateTime: {
    month: MonthOptions.Long,
    year: NumericOptions.Numeric,
    day: NumericOptions.Numeric,
    hour: NumericOptions.Numeric,
    minute: NumericOptions.Numeric,
    second: NumericOptions.Numeric,
  },
  longFullDateTimeWithSecondsAndWeekday: {
    weekday: StringOptions.Long,
    month: MonthOptions.Long,
    day: NumericOptions.Numeric,
    year: NumericOptions.Numeric,
    hour: NumericOptions.Numeric,
    minute: NumericOptions.Numeric,
    second: NumericOptions.Numeric,
  },
  longFullMonthYear: {
    month: MonthOptions.Long,
    year: NumericOptions.Numeric,
  },
  longMonthAndDate: {
    month: MonthOptions.Long,
    day: NumericOptions.Numeric,
  },
  longMonthAndDateWithTimezone: {
    month: MonthOptions.Long,
    day: NumericOptions.Numeric,
    timeZoneName: TimeZoneOptions.Short,
  },
};

/**
 * Checks whether the supplied date format name is supported by the formatter function.
 *
 * @param format The name of the date format to check.
 */
export function isDateFormat(format?: string): format is DateFormats {
  if (!format) {
    return false;
  }

  const parts = format.split(":");
  return DateFormat.hasOwnProperty(parts[0]);
}

function getFormatOptions(format: DateFormats | string): Intl.DateTimeFormatOptions {
  const parts = format.split(":");
  const options: Intl.DateTimeFormatOptions = DateFormat[parts[0]];

  if (parts.length === 2 && parts[1] === "utc") {
    return { ...options, timeZone: "UTC" };
  }

  return { ...options };
}
/**
 * Formats a date value with the named format options, according to the localization rules of the language.
 *
 * @param date The date value to format.
 * @param format The named date format.
 * @param language The language code whose localization rules should be used to format the date value.
 * @returns The formatted localized date value.
 */
export function formatLocalizedDate(date: Date, format: DateFormats | string, language?: string): string {
  if (!global.Intl) {
    // We can't localize the date for users whose browsers don't support Intl, so at least return something.
    return date.toString();
  }

  // More information about formatting in i18next can be found here:
  // https://www.i18next.com/formatting.html
  let options = getFormatOptions(format);
  if (format === "shortFullDateTimeNoCurrentYear" || format === "shortFullDateNoCurrentYear") {
    const isCurrentYear = date.getFullYear() === new Date().getFullYear();
    if (isCurrentYear) {
      delete options.year;
    }
  }
  const formatter = new Intl.DateTimeFormat(language, options);

  return formatter.format(date);
}
