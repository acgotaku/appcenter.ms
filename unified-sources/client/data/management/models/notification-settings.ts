export enum EventType {
  BuildCompleteSucceeded = "BuildCompleteSucceeded",
  BuildCompleteFixed = "BuildCompleteFixed",
  BuildCompleteFailed = "BuildCompleteFailed",
  BuildCompleteBroken = "BuildCompleteBroken",
  TestRunFinished = "TestRunFinished",
  TestRunCancelled = "TestRunCancelled",
  TestRunInvalid = "TestRunInvalid",
  TestRunTimedOut = "TestRunTimedOut",
  NewCrashGroupCreated = "NewCrashGroupCreated",
  NewAppRelease = "NewAppRelease",
  ResignGenericFailure = "ResignGenericFailure",
  ResignCertificateMismatch = "ResignCertificateMismatch",
  ResignInvalidCredentials = "ResignInvalidCredentials",
}

export enum BuildCompleteSetting {
  Never = "Never",
  OnlyBroken = "OnlyBroken",
  OnlyFixed = "OnlyFixed",
  Always = "Always",
}

export enum NewCrashGroupCreatedSetting {
  Never = "Never",
  Daily = "Daily",
  Immediately = "Immediately",
}

export enum NewAppReleaseSetting {
  Never = "Never",
  Daily = "Daily",
  Immediately = "Immediately",
}

export enum TestRunCompletedSetting {
  Never = "Never",
  Immediately = "Immediately",
}

export enum SettingType {
  Select = "select",
  Checkbox = "checkbox",
}

export interface SettingsSection<T> {
  title: string;
  settings: T[];
}

export interface Setting<T, ValueT> {
  type: T;
  id: string;
  label: string;
  telemetryKey: string;
  selectedIndex: number;
  displayValues: ValueT[];
}
