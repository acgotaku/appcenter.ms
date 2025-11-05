enum NumberStyleOptions {
  Decimal = "decimal",
  Currency = "currency",
  Percent = "percent",
}

enum CurrencyDisplayOptions {
  Symbol = "symbol",
  Code = "code",
  Name = "name",
}

/**
 * The number formats supported by localization.
 */
export type NumberFormats = "standard" | "grouped" | "decimal" | "currency" | "percent" | "percentFixed";

const NumberFormat: { [F in NumberFormats]: Intl.NumberFormatOptions } = {
  standard: {
    style: NumberStyleOptions.Decimal,
    useGrouping: false,
    minimumFractionDigits: 0,
  },
  grouped: {
    style: NumberStyleOptions.Decimal,
    useGrouping: true,
    minimumFractionDigits: 0,
  },
  decimal: {
    style: NumberStyleOptions.Decimal,
    useGrouping: true,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
  currency: {
    style: NumberStyleOptions.Currency,
    // @ts-ignore
    currencyDisplay: CurrencyDisplayOptions.Symbol,
  },
  percent: {
    style: NumberStyleOptions.Percent,
  },
  percentFixed: {
    style: NumberStyleOptions.Percent,
  },
};

/**
 * Checks whether the supplied number format is supported by the formatter function.
 *
 * @param format The name of the number format to check.
 */
export function isNumberFormat(format?: string): format is NumberFormats {
  if (!format) {
    return false;
  }

  const parts = format.split(":");
  return NumberFormat.hasOwnProperty(parts[0]);
}

export function getFormatOptions(format: NumberFormats | string): Intl.NumberFormatOptions {
  const parts = format.split(":");
  const formatName = parts[0];
  const options: Intl.NumberFormatOptions = NumberFormat[formatName];
  // TODO Will eventually need to look up what currency this customer's account is charged in.
  // For now, we just always charge in USD.
  if (formatName === "currency") {
    const currencyOpts: any = { currency: "USD" };
    if (parts.length === 2 && parts[1] === "short") {
      currencyOpts.minimumFractionDigits = 0;
      currencyOpts.maximumFractionDigits = 0;
    }
    return { ...options, ...currencyOpts };
  } else if ((formatName === "decimal" || formatName === "percentFixed") && parts.length === 2) {
    const digits = Number.parseInt(parts[1], 10);
    return { ...options, minimumFractionDigits: digits, maximumFractionDigits: digits };
  } else if ((formatName === "percent" || formatName === "grouped") && parts.length === 2) {
    // Precision on these only affects the maximum digits displayed
    const digits = Number.parseInt(parts[1], 10);
    return { ...options, maximumFractionDigits: digits };
  }

  return { ...options };
}

/**
 * Formats a number value with the named format options, according to the localization rules of the language.
 *
 * @param number The number value to format.
 * @param format The named number format.
 * @param language The langauge code whose localization rules should be used to format the number value.
 * @returns The formatted localized number value.
 */
export function formatLocalizedNumber(number: number, format: NumberFormats, language?: string): string {
  if (!global.Intl) {
    // We can't localize numbers for users whose browsers don't support Intl, so at least return something.
    return number.toString();
  }
  const options = getFormatOptions(format);
  // TODO This will probably eventually need to look up a region setting for the user and only fall back to language if one isn't available
  const formatter = new Intl.NumberFormat(language, options);

  return formatter.format(number);
}
