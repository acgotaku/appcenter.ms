import { formatLocalizedDate, isDateFormat } from "./date-formatter";
import { formatLocalizedNumber, isNumberFormat } from "./number-formatter";
import { toDate, parseISO, isValid } from "date-fns";

export function FormatNumbersAndDates(value: any, format?: string, lng?: string): any {
  // Do numbers first, so we don't accidentally convert a number to a date
  if (typeof value === "number") {
    // TODO: Institute number formatting
    if (isNumberFormat(format)) {
      return formatLocalizedNumber(value, format, lng);
    }
    return value;
  }

  if (value instanceof Date && isDateFormat(format)) {
    return formatLocalizedDate(value, format, lng);
  }

  // Check to see if the value is a string representation of a date
  if (typeof value === "string") {
    const parsedDate = toDate(parseISO(value));

    // Only accept our named date formats
    if (isValid(parsedDate) && isDateFormat(format)) {
      return formatLocalizedDate(parsedDate, format, lng);
    }
  }

  return value;
}
