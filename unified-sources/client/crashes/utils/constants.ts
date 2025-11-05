import { CrashGroup } from "@root/crashes/client/crashes-api/model/api";

export const CrashesStrings = {
  DownloadStacktraceButton: "Download stacktrace",
  GetCrashNativeError: "Oops, the raw crash log couldn't be loaded.",
};

export const SymbolsStrings = {
  Title: "Symbols",
  SymbolicateHeader: "Symbolicate crashes",
  SymbolicateText:
    "Upload debug symbol files for your iOS applications here. These will be used to create back traces from crash reports sent.",
  UploadButton: "Upload dSYM file",
};

export const ParkingStrings = {
  Title: "Please provide the following symbol files.",
  IgnoreSymbol:
    "This symbol file will be ignored, and corresponding stacktraces will display memory addresses instead of human-readable names.",
};

/**
 * Type of store to use (only for debug/test purposes).
 */
export type ApiEndpoint = "frontdoor" | "direct" | "local";
export const ApiEndpoint = {
  frontdoor: "frontdoor" as ApiEndpoint,
  direct: "direct" as ApiEndpoint,
  local: "local" as ApiEndpoint,
};

/**
 * Relative time period from now.
 */
export type Period = "last1Day" | "last3Days" | "last7Days" | "last28Days" | "last30Days" | "last60Days" | "last90Days";
export const Period = {
  last1Day: "last1Day" as Period,
  last3Days: "last3Days" as Period,
  last7Days: "last7Days" as Period,
  last28Days: "last28Days" as Period,
  last30Days: "last30Days" as Period,
  last60Days: "last60Days" as Period,
  last90Days: "last90Days" as Period,
};

export enum AnnotationMode {
  View,
  Edit,
  EditSelect,
}

/**
 * A function to convert a period to a number of days
 */
export function periodToDays(period: Period): number {
  switch (period) {
    case Period.last1Day:
      return 1;
    case Period.last3Days:
      return 3;
    case Period.last7Days:
      return 7;
    case Period.last28Days:
      return 28;
    case Period.last30Days:
      return 30;
    case Period.last60Days:
      return 60;
    case Period.last90Days:
      return 90;
    default:
      throw new Error(`Unknown Period ${period.toString()}`);
  }
}

export enum LoadingState {
  Error = -1,
  Initial = 0,
  Loading,
  HasData,
  NeverData,
  NeverSymbols,
  DataLoaded,
}

export enum ErrorType {
  handled = "handlederror",
  unhandled = "unhandlederror",
  all = "all",
  unsymbolicated = "unsymbolicated",
}

/*
 * Default values.
 */
export const defaultApiEndpoint = ApiEndpoint.frontdoor;
export const defaultAppVersion = "All versions";
export const defaultPeriod = Period.last28Days;
export const defaultStatus = CrashGroup.status.Open;
export const defaultAnnotationMode = AnnotationMode.View;
export const defaultLoadingState = LoadingState.Initial;

export const crashGroupStatusLabels: [CrashGroup.StatusEnum, string][] = [
  [CrashGroup.status.Open, "crashes:crashStatus.open"],
  [CrashGroup.status.Closed, "crashes:crashStatus.closed"],
  [CrashGroup.status.Ignored, "crashes:crashStatus.ignored"],
];

//By default all platforms will get to see unhandled errors. The rest of the tabs are platform spefific
export const errorTypeStatusLabels: [CrashGroup.ErrorTypeEnum, string][] = [
  [CrashGroup.errorType.UnhandledError, "crashes:errorTypes.unhandledError"],
];

export const DiagnosticsSearchPropertyNames = {
  exceptionMethod: "Method",
  exceptionClassName: "Class",
  exceptionType: "Exception Type",
  exceptionMessage: "Reason",
  osVersion: "OS Version",
  deviceName: "Model",
  userId: "User ID",
};

export const UserFriendlyOperatorNames = {
  "is not": "isn't",
  contains: "contains",
  "does not contain": "doesn't contain",
};
