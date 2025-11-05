export const Titles = {
  RegisterDevices: "Register Devices",
  Releases: "Releases",
  Template: "{0} - {1}",
  DistributionGroups: "Groups",
  CodePush: "CodePush",
};

export const WizardStrings = {
  Back: "Previous",
  Distribute: "Distribute",
  Done: "Done",
  Close: "Close",
  Next: "Next",
  ProvisioningProfile: "Provisioning Profile",
  Size: "Size",
  MinOS: "Min OS",
  DropBoxTitle: "Release:",
  DropBoxSubtitle: `Upload {0} file`,
  BuildFromBranchText: "Build {0} from the `{1}` branch",
  DistributeText: "{0} will be distributed to the {1} group",
  DistributeMandatoryUpdateText: "{0} will be distributed as a mandatory update to the {1} group",
  DistributeToHockeyAppText: "{0} will be distributed to the HockeyApp {1} group",
  DistributeToHockeyAppMandatoryUpdateText: "{0} will be distributed as a mandatory update to the HockeyApp {1} group",
  NotifyBuildProcessingText: `{0} will be notified about this new update. Please allow a few minutes for your build to be processed and distributed.`,
  UploadFailed: "Upload failed.",
  TitleUpload: "Upload a build",
  TitleGroupSelection: "Who are you distributing this release to?",
  CreateNewGroup: "New distribution group",
  DistributingReleaseTitle: "Distributing release",
  NotifyTestersCheckBox: "Do not notify testers",
  MandatoryUpdateText: "Users will be forced to update to this release in order to continue using the app.",
  MandatoryUpdateLinkText: "Requires App Center SDK In-App Updates to be setup in your app.",
  ReleaseNotes: "Release notes (optional):",
  ReleaseNotesInputPlaceHolderText: "Tell your users what's new in this release",
  ReleaseNotesError: "Release notes are too long",
  DistributeToHockeyAppInfoText: "They will experience the same HockeyApp experience they enjoy today.",
  BuildSourceUploadText: "Upload a build manually",
  BuildSourceRepositoryText: "Distribute an Existing Build",
  BuildSourceUploadBranchSelectionTitle: "Upload a build",
  BuildSourceRepositoryBranchSelectionTitle: "Choose a branch",
  BuildSourceRepositoryBranchSelectionSubtitle: "Only configured branches with builds are shown here.",
  BuildSourceRepositoryBuildSelectionTitle: "Choose a build from `{0}` branch",
  BuildSourceRepositoryBuildSelectionSubtitle:
    "Only the 5 most recent signed and successful{0} builds available for distribution are shown here.",
  NonSimulator: " non-simulator",
  BranchesAuthErrorTitle: "Authorization Failed",
  BranchesAuthErrorSubtitle: "Something went wrong when authorizing access to your repository.",
  BranchesAuthErrorButtonText: "Check authorization",
  BranchesConnectErrorTitle: "No repository found",
  BranchesConnectErrorSubtitle:
    "Connect to your favorite repository service and start distributing builds from branches in your repo.",
  BranchesConnectErrorButtonText: "Connect to repo",
  BranchesEmptyErrorTitle: "No branches found",
  BranchesEmptyErrorSubtitle: "None of your branches have been configured to build.",
  BranchesEmptyErrorButtonText: "Configure branches",
  BranchesEmptyBuildsErrorTitle: "No builds found",
  BranchesEmptyBuildsErrorSubtitle: "None of your branches have builds.",
  BuildsEmptyErrorTitle: "No distributable builds found",
  BuildsEmptyErrorSubtitle:
    "No builds were found in this branch that can be distributed. Perhaps the build is still building or failed?",
  BuildsEmptyErrorButtonText: "Check builds",
  GenericErrorTitle: "Something went wrong. Please try again.",
  Or: "or",
  PublicGroupLabelText: "Public",
  RegisterDevicesTitleSingular: "{0} missing device for this release in '{1}'",
  RegisterDevicesTitlePlural: "{0} missing devices for this release in '{1}'",
  RegisterDevicesDescription:
    "App Center can register your testers' devices into your Apple Developer account, so they can install and run your app.",
  MarkdownSupportedLabelText: "Styling with markdown is supported. 5000 characters or less.",
};

export const DeviceRegistrationStrings = {
  Title: "Publish devices",
  LoginDialogTitle: "Login",
  LoginDialogText: "Login to your Apple Developer account",
  SignedInAs: "Signed in as {0}",
  SigningInAs: "Signing in as {0}",
  StepIntroduction: "ConfirmDeviceRegistration",
  ThisOperationCannotBeUndone: "This operation cannot be undone",
  ConfirmDeviceRegistrationTitle: "You are about to register the following devices on your Apple Developer account:",
  SuccessfulDeviceRegistrationTitleSingular: "{0} device was successfully registered",
  SuccessfulDeviceRegistrationTitlePlural: "{0} devices were successfully registered",
  ProvisioningProfileUpdatedMessage: "Your provisioning profile was updated",
  StepConnectAndPublish: "Connect and Publish",
  StepResults: "Results",
  DoneButton: "Done",
  CloseButton: "Close",
  StartButton: "Start",
  CancelButton: "Cancel",
  RegisterButton: "Register",
  LearnMoreButton: "Learn more",
  LearnMoreAboutPrivacyURL:
    "https://docs.microsoft.com/en-us/mobile-center/distribution/auto-provisioning#privacy-concerns-on-username-and-password",
  LearnMoreAboutRegisteringDevicesURL:
    "https://docs.microsoft.com/en-us/mobile-center/distribution/auto-provisioning#what-is-happening-when-you-click-register-devices",
  EmailField: "someone@something.com",
  EmailFieldLabel: "Apple id",
  PasswordField: "Password",
  IntroductionButton: "ConfirmDeviceRegistration",
  PublishButton: "Publish devices",
  StepIntroductionTitle: "Publish devices to your Apple Developer account",
  StepIntroductionDescription: `In this operation, App Center will publish {0} to your Apple Developer account.`,
  StepIntroductionNotification: "This operation can not be undone.",
  StepIntroductionListItemOne: "Devices can only be removed from your Apple Developer account once per year.",
  StepIntroductionListItemTwo:
    "There are restrictions on the total number of devices (usually 100 per device type) you can have registered.",
  StepIntroductionListItemThree:
    "Once you have hit this limit no further devices can be registered in the account until some of them are removed.",
  StepConnectAndPublishTitle: "Connect your Apple Developer account",
  WarningLoggingIn: "Your credentials will not be saved",
  StepResultsTitle: "All done!",
  DownloadProfileButton: "Download",
  IPhoneSingular: "iPhone",
  IPadSingular: "iPad",
  IPodTouchSingular: "iPod Touch",
  WatchSingular: "Watch",
  IPhonesPlural: "iPhones",
  IPadsPlural: "iPads",
  IPodTouchesPlural: "iPod Touches",
  WatchesPlural: "Watches",
  CurrentlyRegistered: "{0} {1} currently registered",
  NumberOfDevicesToBeRegistered: "{0} {1}",
  NumberOfAvailableDevices: "{0} {1} available",
  ToBeRegisteredLabel: "number of {0} currently registered",
  NumberOfDevicesCurrentlyRegistered: "number of {0} currently registered",
  ResignAppTitle: "Automatically re-sign my app",
  ResignAppDescription: "Re-signing your app will make it available for testers to install it on the newly registered devices.",
  P12UploadTitle: "Certificate:",
  P12UploadSubtitle: "Upload .p12 file",
  P12PasswordPlaceholder: "Certificate password",
  HowToGenerate: "How can I generate a",
  P12CertificateLabel: ".p12 certificate",
  CheckingPasswordLabel: "Checking password",
  ValidPasswordLabel: "Valid password",
  WrongPasswordLabel: "Wrong password",
  WrongP12Password: "The provided password can't open the selected certificate",
  HowToGenerateP12URL: "https://docs.microsoft.com/en-us/mobile-center/distribution/auto-provisioning-feature#generating-a-p12-file",
  RegisterDevicesAndResignAppTitle: "Register devices and re-sign app",
  RegisterDevicesAndResignAppSubtitle:
    "Registering devices and re-signing your app will ensure that the app can be installed by all testers on the distribution group.",
  URLForIPhoneImage:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAABACAMAAABMUIWcAAACAGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS41LjAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICB4bWxuczpleGlmRVg9Imh0dHA6Ly9jaXBhLmpwL2V4aWYvMS4wLyIKICAgIHhtbG5zOmF1eD0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC9hdXgvIgogICB0aWZmOkltYWdlTGVuZ3RoPSIxMjAiCiAgIHRpZmY6SW1hZ2VXaWR0aD0iNjAiCiAgIGV4aWZFWDpMZW5zTW9kZWw9IiIKICAgYXV4OkxlbnM9IiIvPgogPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KPD94cGFja2V0IGVuZD0iciI/PgtkzGsAAAF/aUNDUHNSR0IgSUVDNjE5NjYtMi4xAAAokXWRzytEURTHPzNo5HdRLCwmYTU0KLFRRkJJ0xhlsJl5M29GzRuv90aSrbJVlNj4teAvYKuslSJSUnbWxAY955qpmWTu7Zzzud97z+nec8EdTmuGXe4HI5O1QmMB72xkzut5xkOdWBvNUc02h4PBSUqOjztcKt50qVqlz/07quMJWwNXpfCQZlpZ4XHhyZWsqXhbuElLRePCp8I+Sy4ofKv0WI5fFCdz/KXYCodGwN0g7E0WcayItZRlCMvLaTfSy1r+PuolNYnMzLTENrFWbEKMEcDLBKOM0E8Pg+L76aKXbllRIt//mz/FkuRq4k1WsVgkSYosPlGXpXpCoi56QmaaVdX/v3219b7eXPWaAFQ8Oc5bB3i24HvTcT4PHef7CMoe4SJTyF86gIF30TcLWvs+1K/D2WVBi+3A+Qa0PJhRK/orlYm5dR1eT6A2Ao3XUDWf61l+n+N7CK/JV13B7h50yvn6hR8nsGfJKZNKDQAAAwBQTFRFlpOMV6fG+dvZvb26plM7Z7XJ2+HeHCImpXp7GXGi1t7d8vHtqLi2x3xVv3rC+38x+9c1Zud8ck9PtKeXVJuzV6iY1fnbz9roxc7ONrFMFmmb9fb1zMnETsv1tMzV2NTKdkI9bKq11KQ1JnTuhKqzdKSuEFFvWperHR0eo5SJlMvwlbrB7e3pSafHT4iXrFhSdp2o3t7d9exwSpGtgq66fKStequ1/v39dnh5JztEbKW0O6G8iHeOVI2jb4hVRn/Tl7S4e626Mj5Ea5ysebPGy5NuO6V6TLXvr9numFZY7evmdGZwxLakV5dhOHmWNYmdL6C+Flt7W5y1zmpu86TjpruWdqjD5/T44d7ZmldM9bS+hbzqOMj2opmUjKuzM0VMRoqmNovvSZu3i6SsrKype3uBt+Ly9vXxKnyidau1l6ip9PLtbCIeKGR9b4uYZqnJ7NPQZ83hbbL4VlhWc6y7FlyH4+Lc9clRNml8iJ2ivnhZ+vn2cJnJjFVXblxkRUlK/PPrQ3mOhqWqs62qcH2Q8ePS09zbAAAAysW9u7q2/8Vuhblwtalu4nPk223vEV+T/H2LfLSfcM14scnN6ubaK4yx1uv3r6SWtra1M8hJFFV0ioyRyPrR3Gra8vPx7+rtZaa3x5XRXW5V5OXjG8f8erG99rNIinl8pM1ZIcQ9uJSVd7j5Q4qq605ptpuH/+O2G117k0g5+9Sp+tKKR3B+ijovka209Nvl+fr5mpycOYinNLLuj29leVlYG2eGiLjFo6ensHxv2s4/4tvWm9+mWKS3n57M1uDda6m6bjIuS7TXJywv9/n329nUs2lSlrKumsfTqYeJrYtz2ePlzszKZpWny9PUjEpGg6iyW5SzKm2KZqWuysjH3N7bVeRul2Jc1lRlp4tpbI2x8vDr1NbVoKCh2Y1ZTaa2TpTXydXWh7K7k5iXHHiY2dbRwWtVZduX2p2T6KsXwb65urOp9fTvaZuz8a63OXnW+Pf3rmfk9PPuuJV8daWzULHONHubJkXJmvOC5wAAAQB0Uk5T////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AFP3ByUAAAAJcEhZcwAACxMAAAsTAQCanBgAAAa/SURBVEiJhZV7VBNXAoeDyKpEkGoo2FAgyhiRBOPCBEgWTQxYCByUtEIrFIXIYojgA9oSBdLGLMeurnUNDw8pyayYddtGlq1UBCzY4ghilncgJtQHUw1EV9pT6e6GQffODLWn/3S/+zhn5n753bn33JxLe/5/oIHGvPICi4Fu+fnpCiVYCBbGmROezF8atOccJoEFNIOFaQAwmf95IRwFAtPApHjQZvCMBXgC/SeuAMEAfsYkSyaTSedwqBAKi4UQAHS6ARQ6nWPI5BiMxJtMAwkhcLy/qfLuqaoCdQHvnp6e34DWM9JjAIK3XCVXwTxIwXYwHA4UEggg3GaDQbFBkh4gfCuXq3g8GIIcC0A2CDxAEAzeVVHC5JYtW2Yhli44OAJhRYwdD1ZA8HKdZ4SGEjTy3MOHp6Yk4kWLFjUiju4V3/9WBIselcR68nmkYJN3BNQmcSWuGIsl0+GYSD73Nxd0uWSr+pqASrBpOrKzs7mQK8YYM4IgATfKdRGwJj8lRSXAvwHCGAwLvLzmZyWzOt1gl4IfodMFinJyNBoY4lMJMFhQDgxJZh38aD7fFeZyheWILitIiGWO8WCYB9t4sw42W4JHuwDRYbjAAXYmjBIkkj+fOBMgwq3qa/oSRfTUv9euFbAilyxZUsKiBCtbFziWtBy3jhoztYpomd+GXA+8Zf363bsRUpg2R319IDhLh1s3bTLqBYqOkcwNB6K1W9W31CwH8ZGBj9uXX/J7U2Szqo+1qXsVHefPn/dyRK5fv2Q3i0UKr+xrl/FxXGyDcqIRRFDa1ZWAsFAHxHKiVMJHy/a1R7FncTEuFmcIEARBQUUZToY/ilLCK/aiojKZAN+5c6dc3GvqGuxCUIder2UznGOE8M5HcSUl6haZxs/P72tx7+hTQ0ECqj99etfrDMY0lRB30udkEcOEGY0j4tIkcNASZPpdu96/yGB8S37ksrizy9vK8kzMAmZjhqKKbmAmyC7sOvivi1FRxDcE1yzrjIuL2y5EA7wDdKWlgyMjASg6ee/evd+ZzeQUNTU1XA/nDqETSegqFYtdLpOpF5V5lN82m81EwvQOgNDpgXogJoBY3NuLIDIZIyovikqY3iEs9/X1FXt5Zb/66rzLdXLNmjUSRzyYtczcTixzWsj1bXij4QYfCNmvmcRr/n7pj3q0pcXff6vZTAhjec6Ghj81/MWU0HH4s9eQ0odH3/9czy7zPzS/tX3PgvDfU6dO3XCZcgEI6+GKFSu0US231Opb7WnkTt5mHCgvvyEWiTLKywWIgBdO0/vv2V7WUpb27BmZcPu2LENgA8dQdDknjI8LcAc7fg8Y3Gd/ZqcSJmcltsLLAwMDhQM54A+Jz8bHp6XZ7fZOOymMxU9OKz/HPizca2ldtEku93ygP8tOS+skCQTC6GRx7V/fu3S87mzM6YuthYWq/Fh9cZq9qDn9neZmUiguNpLCDzExrcpr1/T5sbHxH9ib0+vr09MJIVCrnTh48A8/1K1SFii7U/e25cfmF39gL6pft25dPZmQEps/9Hb40FxT3arU1NRVx/YOaOIj7UXpQFhHCBMpKSkXLiwdnpuba2pqSk2te6DiFUeCOV4IlZUpKVevDic2Jc5919S0qu7tRyorEVH/k1BSWVl59+pXRxITE+eGw8Pb2jQwzxqZZu8ExgQQglauXPllxd3+Iz5AuBBOAwJPYgV7aW+uJxOCQkNXjle81X/k4cPExPvDtEePeDwJsdn2zk5yFcdv3gwN/cfixf0+Pok+czSaCoYcCIOxp337487OYEq4GfoFMJ74+AyH03iQoBfxQFFnFGGQCfv377/5BWH099/Xa3nsvDwugbCmZt9j4kwGjYeOj7+1eGP/k/6vhmk8f5mTy+0DcOe5QiEpJG+8euLEif4nr/+omzimx1kzMzNgPOn3SYf6+ghhNDn5zMd3Xrq/cfjQeY8klXXm5czrfX1ZV777sXZ+qopMGF99/aU7m+8u7cjKzdIWzxyN+dg5nxXTWls7zyWE0Yrk1Z+cuXNu49INa3MD8otXz1z/xJ+bVQuYooTxii83n9tckXz302O+4fnayG3btgnznIODGw5wSaF7KSCc6IY+HRrS6+W26K6MjIyEhC7QRoAgbWxslBJF2iqVvtvdXS2lMILKURJXEoaBSnQcjjSkujpEimHg+sIwI0Z3FwABW4BOV2Ih1Zi0OkSpdD9dgBCkHLqbKG43nR5UjWGNIRgYLyggWgEhPMfAKJDdT5XK7iCpdFRKBBQ8JQXqcgdzKelKAIb98/iH7xIzuN2gd7ullPCr/A80z1SxH9r9eAAAAABJRU5ErkJggg==",
  URLForIPadImage:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAABACAYAAACDbo5ZAAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAABCJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIgogICAgICAgICAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyI+CiAgICAgICAgIDx0aWZmOlJlc29sdXRpb25Vbml0PjI8L3RpZmY6UmVzb2x1dGlvblVuaXQ+CiAgICAgICAgIDx0aWZmOkNvbXByZXNzaW9uPjU8L3RpZmY6Q29tcHJlc3Npb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjcyPC90aWZmOlhSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj43MjwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgICAgPGV4aWY6UGl4ZWxYRGltZW5zaW9uPjQzPC9leGlmOlBpeGVsWERpbWVuc2lvbj4KICAgICAgICAgPGV4aWY6Q29sb3JTcGFjZT4xPC9leGlmOkNvbG9yU3BhY2U+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj42NDwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgICAg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",
  URLForIPodImage:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAABACAMAAAA6ajcXAAACAGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS41LjAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICB4bWxuczpleGlmRVg9Imh0dHA6Ly9jaXBhLmpwL2V4aWYvMS4wLyIKICAgIHhtbG5zOmF1eD0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC9hdXgvIgogICB0aWZmOkltYWdlTGVuZ3RoPSIxMjAiCiAgIHRpZmY6SW1hZ2VXaWR0aD0iNTYiCiAgIGV4aWZFWDpMZW5zTW9kZWw9IiIKICAgYXV4OkxlbnM9IiIvPgogPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KPD94cGFja2V0IGVuZD0iciI/PqnHkfoAAAF/aUNDUHNSR0IgSUVDNjE5NjYtMi4xAAAokXWRzytEURTHPzNo5HdRLCwmYTU0KLFRRkJJ0xhlsJl5M29GzRuv90aSrbJVlNj4teAvYKuslSJSUnbWxAY955qpmWTu7Zzzud97z+nec8EdTmuGXe4HI5O1QmMB72xkzut5xkOdWBvNUc02h4PBSUqOjztcKt50qVqlz/07quMJWwNXpfCQZlpZ4XHhyZWsqXhbuElLRePCp8I+Sy4ofKv0WI5fFCdz/KXYCodGwN0g7E0WcayItZRlCMvLaTfSy1r+PuolNYnMzLTENrFWbEKMEcDLBKOM0E8Pg+L76aKXbllRIt//mz/FkuRq4k1WsVgkSYosPlGXpXpCoi56QmaaVdX/v3219b7eXPWaAFQ8Oc5bB3i24HvTcT4PHef7CMoe4SJTyF86gIF30TcLWvs+1K/D2WVBi+3A+Qa0PJhRK/orlYm5dR1eT6A2Ao3XUDWf61l+n+N7CK/JV13B7h50yvn6hR8nsGfJKZNKDQAAAwBQTFRFXfF3f4GDbvSFTk5OvffHFxoedn9u66ns+nEc/lBnND5UOkQ7Mzo9G3XyXF5eUHA3MkqEbXJ1RrNZdbjcOp9KOjo6LWnWyncUVbfh9vb2Lsr6jY6OVdrfLkh4U7ZjJWu5ZfJ9Pj09F9b+r2FTKi4zNzc3PZ33THJSacw3GxscsNXL9c3qg7fY+/TnSqrQMWt2DhIX0YjzIyYoVVVVampqJSw3KjI7+nkpExYauK4DAQAATM310HPxg4OEW1NV0+jz9t47irvrQkNEBQYG7WvVsuTylZWW/ipOUubL9FFMhIWF3NzcJo25akSLcj86MsdLU+H+FhshaXRrzMzMQX/yrKysF6jz7OrrUW2GiuyblGUWBgcJabwnslqsK7r25NBYkZKTHSIsSUlJxcbHUZZdKisrU6ppikwseXp88JjZjY+S+fn3MTM2rPGx0sE7SUU1pKOkZ7V0nJ2dDAwNAgIDOTg4QsgRMpsmpaQfGGbx4tSYXl5eWlpbREVHRkZGWT1QHCEqCwsMOzs8ZmZm+/z7GMP4cnJyYWFit7e4d3yFOTxEHR0eLLLY+83SOkJGpGaUUDk3mZqaErguLS0td2w59KOd8W1ttk34fLv4cmpoMXOCGh0iaJz1dXV11zxTMzMzdk5lg3FjbW1tM2g8fX6BTq67rLW3/dC4/3GN7Orh+9Qovr/BZGprMY/UWcvxGcE1RjtGenhvVWlw//7+BwgKmaNq/JQnGyEmNDQ1+o9ydVol/KwwRT04fX19zunQAwQFbKf121FJXs2WRVukioqKGx8oi6+2dXh6MDAwQkFB8vLySp3kDQ4SVVhZhYaJl1RXMzctYWhy4uTkrbOsXY2e/aQR+zOMGofzd8TZmJiXlc30TY9YLls19PPrGhobUVJSNFBUZLBxzF/Jf4B/FRYZ5fP6OX3zZlAw1NXVJ63pTnBUEhIUqlvOoNebTlBPUDth1M7OZavTHB8jS1tiKm7rRUVF4FEzNzc419vgR0dHZmZmYcRyLjtGQENFHSEsJkXJEMM/YgAAAQB0Uk5T////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AFP3ByUAAAAJcEhZcwAAAOwAAADsAXkocb0AAAWwSURBVDiNdZV9VNNWFMDBil8gzo+KBVE7eTBULLYd61BwCsgo6hyIIFPHCVY7KVaFOiV1W5su4YA4IaiwWYudqCgiR5nGjw459IwUKRbQTdRSFVAU16EOkTM5LknRAWf+bvP67vnl3vde/kicXv8fPhTMxIm66tKD+0GSGDYxiEsdOvgt7NykXIptNNRIa1HwAJw/pPwSJpqbm3Pp6oEay21ekuQIepA6DbIivo9MVr+JWt0RrYN1XafdHTPSeDE/w2AdHAwZjfVGB9S/dKh+Jg4RO9MR0hoSEqKltOrZs+yfWlyYyOZjSD8xMUIp6hQU7I8gkB0AQFAhQAQA9PT0ANC7foMAEVLVLsDv9vrbrgCmTgopbNQoUPSK6+thgCCUbnF1GjbDaVq3JudYQAc7+sKNT6yKuExDUywXxhidyqkdPgHSdNVGR3NPvvDYkbFnCRvqzjUp3WnttppjHTYJOhsdz+ngdv3gveHXPjEO6eq5ZjOtLXmn805/ncWprdUkg66RE2c1smvE9c6b1DYbs7U7d36+EwTca1C0l2DVNGhZsiyzzd4LWBBdzUZKzaUQ244i6DcKrhkRchVcWIjaQO8uptqb4hUggRoneuTjxo0IBZBNqEaIvj5ma2Ovjx07XUfGNibzXZ9OnFgQz4W3iE2N6j41rbN+yWj0nW6Jiy8pGW/K3Be7qOty8acUrm4yuvmrR1ZNxFJiW3RJPCLf/HTRnJeUnjp1qlsPrf33fO/p6bmUbr5Fws3MOPGyw1JcNr+szE3mQzcHPN6PPGprpBrXEfbD+YfHEXt4CbznhA+f1oTd3d2sBmyzkqVQWLDHoUChUMICAkjOM9UP8/PzXYEZRVEIWHAc1wEI1aKwgv85reUnKHaUH7PWWpN1/i2dLm265IiML1MWnw+kd95X0lhSEgdFUA+9C2/J7nyu1s1ZlbemRO7yBV3dXUuJk72pVg6nQwaxIRmbnPVo7e85JpFDcyiaumfXcjjJOj6f/x2fjJ335IK1vC6MeeZ6g1QKAUxqMLAAKZFISMAyGAwIqGOqARuDqSMJlWZMSXARJcbuRuBQGGP1a0yrRbvBt0VFReXgLo/Hu0vIL168+JBgmreYGo92cOK44eHhX60ldq+Yv2KdxePSjUs3FGmMXry5eOmspvLw8JHh92VT1t1aV/bKQxNw9pw8jWneu3nuzTXG8gUL5t1/4na1wLfgSpBHSkDKucuqClr3ZXRE/Lkl68C8AwueBE0+uPPg30Eeoz4aNcqSxmhdodjYukvx17Jly8boxni/5z1Gt3fjxo17+9cGsFKpFHDN7pA5lC2AIVipIzGzgCT6q5UoqmcTe5cvX64AJiEiNBEOGN3G5QTkzI7T7a+KqpqJx20zNJ8kdAxM8zZTSs7o45nElLlXi6tdjSFS5yQ2SeqocGiuRpMzO9PywfZJ27fLtEdQ7REFycCcu42botFoMi0fUyRanKX68UYZidMwuhM3JCV5yfGHiYmJckmf0q4sx3GSjrRKWksUCMqS4LYYBIMkCj2M9OASBlUYo9/CN18GEgn+JlXR1XyB7Q0C5X9zmy20jdY65N69rVtjkITq6uoExKvpt6NeyOGZFEg2rcnSGanDV//TsHPlgweTC196ek5pR6qi9h17UdSvUzVnrdMafBdq2k8Jb666fqpAXxW1/3hUYQu9NRKbwdEMn9Dg2d6+cLdwka/vH7f0h0aPzonEstMZnffZ6bxJZ96n2I01Xll5MB45dDwyMrLI31H92M/PT4k1JCQknMEKjUdCUAy7VnStCGO0D2aQtrbqYXjEiBh3DDYYUBiG9VKtO8ysXamqqFBVqCgcA5Mw0/Swoe/z9EFZ5RCdXjnohqGa/8z/3dWVgZJAnB82SKcNyLJYNpt9wP1DPpIuZ2ow0bt1cLqqcoB0fGJfuwSKRIFUiPqvQDoPFFHmX07mlqjTpwf/AAAAAElFTkSuQmCC",
  URLForWatchesImage:
    "data:image/png;base64,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/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wBT9wclAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEfElEQVRIiWP4TzRgGHxKed+DIQGl8vLyOVevykMhkIVTKe/VHLYDQMAGBCAi5ypOpWxSYkhASuoAG06lYotQgJjUAZxKF2xYsGABsloxNlxKgSo3gOCiBRCwCI9SoCIwBCkHaVgkhs/URQg3gAzGoXQDyHUoYNEiHEplvC9d8geDSyDgfck7118Gq9IGzo9tbW2HDh2aO3fuoeltqVYpnNXp27dhUdqSyMmZGB4eXhoenhieWJ1QKdyw3czc30IZXWm/u7y8jayNsrKnp62nZ1VV1Qag93Om2BmuuNGAplQn971hZ8X+PQoKCntQwf4sd1SlXv1TbhypWKGAqXSPlBeqUvasKTc6K+aB5SYpJyg6IJTmoCk91w90wIdfkyK2PNlj03Ntneme5R/7FcCA9xyaAyxASksiJKK2OOis+2giZpqqk+4GdjrvXDRTIUrz8gsKHVp62ta9vFGtrP1hD8jlvJVV/Sim5vICQ+BXSW3tjKeOcg3vj9RcVLSH+JHX36sNQ6nbyy4Hx7WBk+sdRFVUIvbsUVUFeYvXbJ0XigOASll39yarzgpUD13rELZkSZjosaClZ0uASg3Yp6OburltU9R5jVjf0FgHgYJercdXOK6s/ApUqpPZgmFq4pJs0yau2NgMh0LGxYtrdkgKHitx2MPbjBZYue9vdHaymdZ337133z/l4aPHT+48fe5R4qCAofQcKA18eP0m+l35r4+rTHpaSr79+PEN5CsHeXRT+d4b/vn7b5qS0psLn9vYz2W7/NDXf3u7HORWLEo7nP8p+fnpe5qYuK4qcpmmrz/ttvOdPQ6YDuC90Xn8tb7StH/dXibX1hjcmTpt2tRf4HDF9JZhZ9fZOy6vr++9W9226+Cxrn37DLfuAaYw3jMYphp2ivv4PLvPr7eMpbtvaZBQSfDixSF7FDCUgqLgoI/46rQModqAbwpL15gIioTlay0EmooeAqDAihRfrftcc3VA36w9V9atu3JsY1gY0FQFTFOBUTDvrKrD9VnL+Pc67JCU3OHhMP/6JJC32LFEQVeJgmyw6d4jUg9ueDzfN2vfpEnYlEJCQKFqeur2SQvUD7uqOs2cM6cGnLewmvq1pCzFiHtP4mRxCbEXakJq4OTqgN0B+/f3MxjuaT0559b8PWmn075CTEXP3CCl8+YBg/HDxUnbjEIcgIH/C0QAMzdajmXiA5sKDJtJK/aAfQMDCrZoOTabR/5G51eg0j3w0kVhD9hUt/PCqEobqssUWbvmIRUqUHD8gM5/VKX//yf6L5ii+PLGDSAyfGn4EkjceFmsmNN66j+G0v+cqcACGAJSofShuamJ/7Eo/d+SZWFhwccnLQ1Era2t/a39Fl9a/mNVGhcXZxcXlxmXCQRxEDjlP3alsOodDKAMnEqBQB4I4UBeHpdSqIHyEAKvqe+BAGQ3DPC+v4pLKdAb76cAwXs4/I9LqR3I83GgQADhKXFxuJX+V7QDgs1ACEJ2dpmZuJXaK4KgKRQCAW6lIFBc/BIITYtfoksMxoYeTgAAXKuxZQDDrHcAAAAASUVORK5CYII=",
  DeviceTypeLimitReached: "You've reached the limit of available devices for the highlighted devices",
  TwoFactorAuthenticationDetectedTitle: "Two-factor authentication detected",
  TwoFactorAuthenticationDetectedSubtitle:
    "We do currently not support two factor authentication. Please disable two factor authentication for the time being.",
  TwoFactorAuthenticationDetectedButton: "Go to Apple developer portal",
  LearnMoreAboutTwoFactorAuthenticationDetectedButtonURL:
    "https://docs.microsoft.com/en-us/mobile-center/distribution/auto-provisioning-feature#multifactor-authentication",
  LicenseUpdatedTitle: "New license agreement is pending",
  LicenseUpdatedSubtitle: "You will need accept the new license agreement of your Apple Developer Program before continuing.",
  LicenseUpdatedButton: "Go to Apple developer portal",
  LearnMoreAboutUpdatedLicenseButtonURL:
    "https://docs.microsoft.com/en-us/mobile-center/distribution/auto-provisioning-feature#updated-license-agreement",
  TeamNotFoundTitle: "Team not found",
  TeamNotFoundButton: "Go to Apple developer portal",
  LearnMoreAboutTeamNotFoundButtonURL:
    "https://docs.microsoft.com/en-us/mobile-center/distribution/auto-provisioning-feature#team-not-found",
  ProfileNotFoundTitle: "No provisioning profile found",
  ProfileNotFoundSubtitle: "No provisioning profile found, please go to Apple Developer Portal to fix this.",
  ProfileNotFoundButton: "Go to Apple developer portal",
  LearnMoreAboutProfileNotFoundButtonURL:
    "https://docs.microsoft.com/en-us/mobile-center/distribution/auto-provisioning-feature#profile-not-found",
  LinkToAppleDeveloperPortal: "https://developer.apple.com/account/",
  DeviceRegistrationOnlyAvailableForNonPublicGroups: "Device registration is only available for non public groups",
  LearnMoreAboutDeviceRegistrationOnlyAvailableForNonPublicGroups:
    "https://docs.microsoft.com/en-us/mobile-center/distribution/auto-provisioning-feature#device-registration",
  DeviceRegistrationNotAvailable: "Device registration not available",
  AllDevicesProvisioned: "All devices provisioned",
  GroupHasNoUnprovisionedDevicesToRegister: "The '{0}' group has no unprovisioned devices to register",
  AppleDeveloperProgramExpiredTitle: "Apple Developer Program Expired",
  AppleDeveloperProgramExpiredSubtitle: "You need to renew your Apple Developer Program membership before continuing.",
  AppleDeveloperProgramExpiredButton: "Go to Apple Developer Portal",
  AppleAccountNotRegisteredDeveloperTitle: "Apple account is not a registered Apple Developer",
  AppleAccountNotRegisteredDeveloperSubtitle:
    "You are not registered as an Apple Developer. Please visit Apple Developer Registration to register your account.",
  AppleAccountNotRegisteredDeveloperButton: "Go to Apple Developer Registration",
  LinkToAppleDeveloperRegistration: "https://developer.apple.com/register/",
  AnErrorOccurredWhenTryingToPublishDevices: "An error occurred when trying to publish devices to your app",
};

export const ProvisioningStatusStrings = {
  DistributeTitle: "Your app is being distributed to the '{0}' distribution group",
  ResignTitleSingular: "{0} new device is being registered into your account, and your app is being re-signed.",
  ResignTitlePlural: "{0} new devices are being registered into your account, and your app is being re-signed.",
  ResignSubtitle:
    "This operation may take a few minutes. Feel free to close this modal and come back to check the progress at any time.",
  RegisterDevicesTitle: "Register devices",
  RegisterDevicesSubtitleSingular: "{0} new device was registered into your account",
  RegisterDevicesSubtitlePlural: "{0} new devices were registered into your account",
  RegisteringDevicesWithDots: "Registering…",
  RegisteringDevices: "Registering",
  DevicesCouldNotBeRegisteredInternalProblem: "Devices couldn't be registered due to an internal problem",
  UpdateProvisioningProfileTitle: "Update provisioning profile",
  ResignAndDistributeTitle: "Re-sign app & distribute new release",
  ResignAndUploadTitle: "Re-sign app & upload new release",
  Failed: "Failed",
  Resigning: "Re-signing",
  ResigningApp: "Re-signing app…",
  AppResignedAndNewReleaseDistributed: "Your app was re-signed and a new release was distributed",
  AppCouldNotBeResignedInternalProblem: "Your app couldn't be re-signed due to an internal problem",
  AnErrorOccurredWhenTryingToResign: "An error occurred when trying to re-sign your app",
  LearnMoreButton: "Learn more",
  DistributionProgress: "Distribution progress",
  ProvisioningAreaTitle: "{0} release is being distributed...",
  ProvisionAreaStatus: "Release {0} {1} ({2}) is being distributed...",
  ProvisionAreaFailedStatus: "Release {0} {1} ({2}) failed to distribute",
  ProvisionAreaSuccessStatus: "Your app was re-signed and release {0} {1} ({2}) was distributed.",
  ProvisioningAreaSubTitle: "This operation may take a few minutes.",
};

export const WizardPages = {
  UploadRelease: "Upload",
  SelectBranch: "Branch",
  SelectBuild: "Build",
  Destination: "Destinations",
  Devices: "Devices",
  Summary: "Review",
  Notes: "Notes",
};

export const ReleaseListStrings = {
  ColumnTitleReleases: "Release history",
  ColumnTitleRelease: "Release",
  ColumnTitleVersion: "Version",
  ColumnTitleDestination: "Destination",
  ColumnTitleDestinations: "Destinations",
  ColumnTitleDistributionType: "Type",
  ColumnTitleDistributionStatus: "Status",
  ColumnTitleDate: "Date",
  RowEntryVersionFormat: `{0} ({1})`,
  MoreOptions: "More Options",
};

export const ReleaseDetailsStrings = {
  DistributeButtonTitle: "Distribute",
  DistributeButtonDestinationHeader: "Destination:",
  DistributeButtonGroupTitle: "Distribution group",
  DistributeButtonStoreTitle: "Store",
  ReleaseDetails: "Release details",
  Release: "release",
  ReleaseTitle: "Release",
  DistributedOn: "Distributed on",
  Version: "Version",
  BuildNumber: "Build number",
  Destination: "Destination",
  Downloads: "Downloads",
  Size: "Size",
  Status: "STATUS",
  MinOS: "Minimum OS",
  ShortMinOS: "Min OS",
  MD5: "MD5 fingerprint",
  ProvisioningProfile: "Provisioning profile",
  ReleaseNotes: "Release notes",
  DownloadButtonText: "Download",
  NoReleaseText: "No release details",
  LoadFailed: "Failed to load releases. Please try again later.",
  AppNameVersionFormat: `{0} {1}`,
  LabeledReleaseNumberFormat: `Release: {0}`,
  EmptyReleaseNotesPlaceholder: "-",
  MandatoryUpdateText: "Mandatory update",
  BuildTitle: "Build:",
  DetailedAppVersionReleaseFormat: "{0} {1} ({2})",
  Mandatory: "Mandatory release",
  FileExtension: "File extension",
};

export const CommonStrings = {
  DateJustNow: "Just now",
  ShortcutMegabyte: "MB",
  Unknown: "Unknown",
  Dismiss: "Dismiss",
  VersionWithShortVersion: "{0} ({1})",
  NoValue: "-",
  HockeyAppGroup: "HockeyApp group",
  XSelected: `{0} selected`,
  DistributionDestinationType: "Distribution group",
  Invited: "Invited",
};

export const ReleasePageStrings = {
  DistributeButtonText: "Distribute new release",
  NoReleasesHeader: "You have no releases yet",
  NoReleasesWithPermissionText: "Start distributing your app among your teams and testers.",
  NoReleasesNoPermissionText: "Have a team mate with a Manager or Developer role on this app to create a release.",
  ReloadData: "Reload data",
  ReleaseCount: "{0} release(s)",
};

export const DragDropUploadStrings = {
  BadFileType: `{0} is not supported for this OS`,
  OneFileLimit: "Only the first file will be processed.",
};

export const DistributionGroupsPageStrings = {
  NoDistributionGroupsErrorHeader: "Something went wrong",
  NoDistributionGroupsError:
    "Sorry, but we were unable to get your distribution groups at this time. Please try again in a few minutes.",
  NoDistributionGroups: "No Distribution Groups",
  BannerTitle: "Distribution groups make sharing easy",
  BannerDescription:
    "Collaborators is the default distribution group of all the collaborators of your app on App Center, which includes admins, developers, and managers.",
  BannerDismissButton: "Got it",
};

export const DistributionGroupsListStrings = {
  ColumnTitleGroup: "Group",
  ColumnTitleMembers: "Members",
  ColumnTitleRelease: "Release",
  ColumnTitleDistributedOn: "Distributed on",
  RowEntryVersionFormat: `{0} ({1})`,
  NotApplicable: "––",
  ContextMenuEntryTitleDelete: "Delete Group",
  OtherGroupsCallToActionButtonText: "Add Group",
  OtherGroupsCallToActionText:
    "Distribution groups allow you to organize your testers and manage who receives specific versions of your app.",
  OtherGroupsCallToActionTitle: "You haven't created any distribution groups yet",
  RemoveDialogTitle: `Delete "{0}" distribution group?`,
  RemoveDialogText: "This will remove all releases from the distribution group and delete the distribution history and statistics.",
  RemoveDialogButtonTitleCancel: "Cancel",
  RemoveDialogButtonTitleDelete: "Delete",
  PublicGroupLabelText: "Public",
  DisabledGroupLabelText: "Disabled",
  PublicGroupLabelWithTesters: `Public, {0}`,
  PublicGroupLabelWithApps: "Public, ",
  DistributionGroupTooltipTitle: "Distribution Group",
  DistributionGroupTooltip: "This icon indicates a distribution group at the app level.",
  SharedDistributionGroupTooltipTitle: "Shared Distribution Group",
  SharedDistributionGroupTooltip: "This icon indicates a shared distribution group at the organization level.",
};

export const DistributionGroupDetailsStrings = {
  Register: "Register",
  DeleteTester: "Delete",
  Testers: "Testers",
  AADGroupDefaultDescription: "Azure Active Directory group",
  ReleaseHistory: "Release history",
  Releases: "Releases",
  Version: "Version",
  DistributedOn: "Distributed on: {0}",
  Date: "Date",
  Tester: "tester",
  ManageLinkLabel: "Manage",
  NoReleasesHeader: "There are no releases for this group yet.",
  NoReleasesWithPermissionText: 'Click on "Distribute new release" to start sending your app to the testers.',
  NoReleasesNoPermissionText: "Have a team mate with a Manager or Developer role on this app to create a release.",
  NoTesterHeader: "Your app is ready to be tested.",
  NoTesterText: "Start distributing your app by adding testers to this group.",
  DeleteReleaseError: "Failed to delete a release. Please try again later.",
  RemoveReleaseError: "Failed to remove a release. Please try again later.",
  CollaboratoresExplanationText: "This group corresponds to the collaborators of the {0} app",
  CollaboratoresExplanationLinkText: "collaborators of this app",
  MandatoryUpdateText: "Mandatory update",
  ReleaseNameAndVersionFormat: "{0} {1}",
  ProvisioningProfile: "Provisioning Profile",
  MinOs: "Min OS",
  Size: "Size",
  Devices: "Devices",
  UDID: "UDID",
  OS: "OS",
  Status: "Status",
  Provisioned: "Provisioned",
  Unprovisioned: "Unprovisioned",
  UnprovisionedInRelease: "Unprovisioned in release",
  ExportUDIDs: "Export UDIDs",
  Download: "Download",
  SearchDevices: "Search devices",
  NoDeviceHeader: "There are no registered devices on this group yet",
  NoDeviceText: "As testers register devices, they will appear here.",
  Total: "Total",
  All: "All",
  ExportFailedTitle: "Could not generate csv file",
  ExportFailedMessage:
    "An unknown error occurred while trying to export devices. Please try again or contact support if the problem persists.",
  PublicPage: "Public page",
  PrivatePage: "Private page",
  PublishDevices: "Publish devices",
  RegisterDevices: "Register devices",
  DeviceOsVersionFormat: "iOS {0}",
  SeeDetailsText: "See details",
  ResendInviteText: "Resend invitation",
  ResendLatestReleaseText: "Remind About Latest Release",
};

export const DistributionGroupSettingsStrings = {
  Title: "Group settings",
  ButtonTitleDone: "Done",
  LinkTitleDeleteGroup: "Delete group",
  InputGroupNamePlaceholderText: "New group name",
  GroupWithSameNameError: "This app already has a group with the same name.",
  PublicUrl: "Public Url",
  Id: "ID",
};

export const AddTesterInputStrings = {
  SearchBarPlaceholderTextSimple: "Add testers",
  SearchBarPlaceholderText: "Add testers by name or email…",
  MessageAlreadyAdded: `'{0}' has already been added to this distribution group.`,
  MessageInvalidEmail: "Please enter a valid email address.",
  MessageNotMember: `{0} is not a member of the app.`,
  MessageOverflowWarning: `Maximum group member amount is {0}, please note that not all invitees can successfully accept the invitation and be added to the group.`,
};

export const DistributionGroupWizardStrings = {
  ButtonTitleNewGroup: "New Group",
  ButtonTitleCreateGroup: "Create Group",
  TitleInviteUsers: "Who would you like to invite to the group?",
  GroupWithSameNameError: "This app already has a group with the same name.",
};

export const DistributionStoresListStrings = {
  DistributionStoresTitle: "Stores",
  ColumnTitleGroup: "Store",
  ColumnTitleRelease: "Release",
  ColumnTitleDistributedOn: "Distributed on",
  RowEntryVersionFormat: `{0} ({1})`,
  NotApplicable: "-",
  NoStoresTitle: "Connect to Google Play and Intune Company Portal",
  NoStoresIosTitle: "Connect to App Store Connect and Intune Company Portal",
  NoStoresSubTitle: "Go beyond testing and publish your app to external app stores.",
  NoStoresIosSubTitle: "Release your app to the App Store, TestFlight, or Intune.",
  NoStoresAndroidSubTitle: "Release your app to the Google Play Store or Intune.",
  NoStoresForbiddenSubTitle: "Have a team mate with a Manager or Developer role on this app to publish to external app stores.",
  ButtonTitleNewStore: "Connect to Store",
  ButtonTitleDeleteStore: "Delete Store",
  LearnMoreLinkText: "Learn more.",
  LearnMoreUrl: "https://docs.microsoft.com/en-us/mobile-center/distribution/stores",
};

export const DistributionStoreCommonStrings = {
  GooglePlayTitle: "Google Play",
  IntuneTitle: "Intune Company Portal",
  AppleStoreTitle: "App Store",
  AppleTestFlightStoreTitle: "TestFlight",
  ITunesConnectTitle: "App Store Connect",
  DefaultStoreTitle: "Store",
};

export const DistributionStoreTrackCommonStrings = {
  AppStoreProductionTrack: "App Store",
  TestFlightInternal: "testflight-internal",
  TestFlightExternal: "testflight-external",
  TestFlightGroup: `{0} TestFlight group`,
  GooglePlayTracks: `{0} track`,
  IntuneStore: `{0} store`,
};

export const DistributionStoreDeveloperPortalsCommonStrings = {
  GooglePlayDeveloperConsoleTitle: "Google Play Developer Console",
  AppleStoreConnectTitle: "App Store Connect",
};

export const DistributionStoreCreateStrings = {
  ButtonTitleCreateStore: "Connect",
  ConnectStorePageTitle: "Connect to Store",
  SelectStoreTab: "Select store",
  ConnectStoreTab: "Authenticate",
  AssignAppTab: "Assign app",
  ConfigureStoreTab: "Configure",
  ConnectStoreHeaderString: "Where would you like to distribute your app?",
  StoreWithSameNameError: "This app already has a store with the same name.",
  InvalidStoreTypeError: "Unrecognized store type {0}",
  Next: "Next",
  Back: "Back",
  Connect: "Connect",
  Assign: "Assign",
  Register: "Register",
  AlreadyConnected: "Already connected",
  AppleAppStoreConnectSecondaryText: "App Store and TestFlight",
  IntuneStoreConnectSecondaryText: "Use old Intune OAuth application.",
  LearnMoreText: "Learn more.",
  LearnMoreUrl: "https://learn.microsoft.com/en-us/appcenter/distribution/stores/intune#prerequisites",
};

export const DistributionStoreErrorStrings = {
  GooglePlayJsonInvalid: "Uploaded json is invalid.",
  GooglePlayJsonFormatInvalid: "Uploaded file is not in a json format.",
  GooglePlayCreateDuplicate: "You have already connected to Google Play Store.",
  IntuneUnauthorizedAccess: "You don't have Intune AppManager roles in your organization. Please contact your admin.",
  GenericError: "Something went wrong. Please try again.",
  AppleStoreCredentialsInvalid: "Apple App Store Credentials are not valid.",
  AppleStoreCreateDuplicate: "You have already connected to Apple App Store.",
  WrongCredentials: "Wrong username/email and password.",
};

export const DistributionStoreErrorTypes = {
  NoUploadedAppBuild: "no_uploaded_app_build",
};

export const DistributionStoreGooglePlayStrings = {
  GooglePlayJsonUploadTitle: "Security token:",
  GooglePlayJsonUploadSubTitle: "Upload .json file",
  GooglePlayJsonUploadHeader: "Upload the Google Dev Console API credentials",
  GooglePlayJsonHelpString: "Where can I find my .json file?",
  GooglePlayJsonUploadLearnMoreText: "App Center can upload new versions of apps that are already published on the Google Play store.",
  JsonUploadFileNotProvidedString: "File not provided",
  JsonUploadFileTypeInvalidString: "File type not supported",
  JsonUploadFileSizeExceedString: "File size exceeds maximum upload size",
  JsonUploadFileUploadInterruptString: "Upload was interrupted",
  LearnMoreAboutGooglePlayURL: "https://docs.microsoft.com/en-us/mobile-center/distribution/stores/googleplay",
  GooglePlayAppPublicPageURL: "https://play.google.com/store/apps/details?id={0}",
  GooglePlayStoreViewURL: "View in Play store",
  GooglePlayServiceConnectionDisplayName: "Google Play Service Connection",
};

export const DistributionStoreIntuneStrings = {
  PageTitle: "Configure your store",
  StoreNameInputLabel: "Store name:",
  CategorySelectLabel: "Category:",
  CategorySelectPlaceHolderText: "Select Category",
  AudienceInputLabel: "Audience:",
  StoreNameInputPlaceholderText: "Enter a store name",
  AudienceInputPlaceholderText: "Enter security group name",
};

export const DistributionStoreAppleStrings = {
  HeaderText: "Log in with your Apple Developer account",
  AssignAppTitleText: "Select your app on App Store Connect",
  AssignAppSubTitleText:
    "App Center can only upload new versions to existing apps that are already published on the App Store or TestFlight.",
  ConnectToItunesConnectSubtitle: "Your credentials will be stored and will only be used for auto provisioning and publishing.",
  InputUserNamePlaceHolderText: "Username",
  InputPasswordPlaceHolderText: "Password",
  SelectTeam: "Select a team:",
  SelectTeamPlaceholder: "Select team",
  NoAppsFoundTitleText: "No apps found on App Store Connect",
  NoAppsFoundSubTitleText: "Please create an app and refresh",
  NewAppleApp: "New app",
  ITunesConnectUrl: "https://appstoreconnect.apple.com/",
  ProductionStoreName: "Production",
  InternalStoreName: "App Store Connect Users",
  AppleServiceConnectionDisplayName: "Apple Service Connection",
};

export const DistributeStoreWizardStrings = {
  WizardPageTitle: "Publish to {0}",
  UploadPageSubTitle: "Upload Build",
  DestinationPageSubTitle: "Destination",
  ReleaseNotesPageSubTitle: "Notes",
  ReviewPageSubTitle: "Review",
  UploadPageHeaderText: "Upload the build",
  UploadPageHeaderUpgradeText: "Upload a build",
  UploadPageLabelText: "Please ensure the first version of your app is already published to {0}.",
  DestinationPageHeaderText: "Where would you like to distribute your release?",
  DragDropUploadTitle: "Build",
  DragDropUploadSubtitle: "Upload {0} file",
  UploadPackageHelpText: "Where can I find my {0} file?",
  ReleaseNotesText: "Release notes:",
  ReleaseNotesInputPlaceHolderText: "Tell your users what's new in this release",
  ReleaseNotesError: "Release Notes must contain{0}{1} characters",
  MarkdownSupportedLabelText: "Styling with markdown is supported. 5000 characters or less.",
  ReleaseNotesStringsLabelText: "You need ten or more characters in the release note to continue.",
  ReviewPageDistributeText: "{0} will be published to the {1}",
  ReviewPageDistributeMultipleStoreText: "{0} will be published to multiple stores: {1}.",
  ReviewPageNotifyText: "You may experience a delay before your app is published while Google reviews it.",
  TestersDescriptionString: "You can configure the testers for this track in the Google Play Developer Console.",
  ReviewPageAppleNotifyText: "You may experience a delay before your app is published while Apple reviews it.",
  ReviewPageMultipleNotifyText: "It may take up additional time to publish your app to these stores.",
  DestinationPageEmptyTitle: "No stores",
  DestinationPageEmptyText: "You have not created any stores, yet.",
  Back: "Previous",
  Next: "Next",
  Publish: "Publish",
  RecommendedExtensionText: " (recommended)",
};

export const DistributionStoreRemoveStrings = {
  RemoveDialogTitle: "Delete {0} distribution store?",
  RemoveDialogText: "This will delete all distribution history and statistics for this store as well.",
  RemoveGooglePlayStoresText:
    "This will delete the Production, Alpha and Beta Google Play stores along with all the distribution history and statistics for these stores.",
  RemoveAppleStoresText: "This will delete the App Store and TestFlight stores.",
  RemoveGooglePlayStoresDialogTitle: "Delete Google Play connection?",
  RemoveAppleStoresDialogTitle: "Delete App Store connection?",
  RemoveDialogButtonTitleCancel: "Cancel",
  RemoveDialogButtonTitleDelete: "Delete",
};

export const DistributionStoreDetailsStrings = {
  PageTitleText: "Distribution Store Details",
  PublishButtonText: "Publish to Store",
  PublishButtonGoogleText: "Publish to Google Play",
  PublishButtonAppleText: "Publish to App Store",
  PublishButtonAppleTestFlightText: "Publish to TestFlight",
  NoReleaseTitle: "There are no releases yet",
  NoReleaseSubtitleApple: "Upload new versions of apps that are already published on the App Store",
  NoReleaseSubtitleGoogle: "Upload new versions of apps that are already published on the Google Play Store",
  NoReleaseSubtitleIntune: "Upload new versions of apps that are already published on the Intune Store",
  ReleaseNameAndVersionFormat: "{0} {1}",
  Size: "Size",
  MinOS: "Min OS",
  Status: "STATUS",
  SubmittedStatus: "Submitted",
  ReleaseTableReleaseLabel: "RELEASES",
  ReleaseTableVersionLabel: "Version",
  ReleaseTableDateLabel: "Date",
  CategoryLabel: "Category",
  AudienceLabel: "Audience",
};

export const CodePushStrings = {
  NoReleaseTitle: "You have no deployments yet.",
  NoReleaseSubTitleLine1:
    "CodePush is a service that lets you provide updates instantly to your users. The updates are distributed through deployment environments.",
  NoReleaseSubTitleLine2:
    "When you push code to your app, you specify the devices using the name of the deployment. Follow the steps below to CodePush enable your app.",
  NoReleaseSubTitleLine3: "Add the CodePush SDK your app",
  NoReleaseInstructionsInstall: "1. Install the CodePush command line interface (CLI)",
  NoReleaseInstructionsInstall2:
    "You manage your CodePush account using our NodeJS-based CLI. To install it, open a command prompt or terminal, and type ",
  NoReleaseInstructionsInstallNote: "Note: ",
  NoReleaseInstructionsInstallNoteContent: "On macOS and Linux, you may need to prefix this command with ",
  NoReleaseInstructionsInstallNoteSudo: "sudo",
  NoReleaseInstructionsNewDeployment:
    "2. Create default deployments for your app by clicking on the wrench at the top right of this screen or by executing the following command from the CLI:",
  NoReleaseInstructionsNewDeployment2:
    "You may also create the default 'Staging' and 'Production' deployments by specifying the --default switch in place of a deployment name.",
  NoReleaseInstructionsDocumentation: "3. CodePush enable your app.",
  NoReleaseInstructionsDocumentationLink: "CodePush CLI documentation",
  DeploymentButtonText: "Create standard deployments",
};

export const CodePushDeploymentListStoreStrings = {
  EmptyDeploymentNameError: "Deployment name cannot be empty.",
};

export const CodePushDeployNoReleaseStrings = {
  NoReleaseTitle: "No updates released yet for {0}.",
  NoReleaseSubTitle: "Release an update to {0} with the command:",
};

export const CodePushNoReleasesForAnyDeploymentStrings = {
  NoReleaseTitle: "Everything is ready.",
  NoReleaseSubTitle: "Time to release your first CodePush update.",
  StepInstallCLI: "1. Install the App Center CLI",
  InstallCLIDetails: "Note: On macOS and Linux, you may need to prefix this command with {0}",
  StepAddSDK: "2. Add the CodePush SDK to your app",
  AddSDKDetails: "Follow",
  TheseInstructions: "these instructions",
  StepSubmitToTheStoreiOS: "3. Submit to App Store",
  StepSubmitToTheStoreAndroid: "3. Submit to Google Play Store",
  StepReleaseAnUpdate: "4. Release an update",
  ReleaseAnUpdateDetails: 'Release an update using the "{0}" command:',
};

export const CodePushTable = {
  Releases: "Releases",
  TargetVersions: "Target Versions",
  Description: "Description",
  Status: "Status",
  Mandatory: "Mandatory",
  UpdateTime: "Date",
  Failures: "Rollbacks",
  ActiveDevices: "Active Devices",
  StatusDisabled: "Disabled",
  StatusEnabled: "Enabled",
  MandatoryYes: "Yes",
  MandatoryNo: "No",
  NoData: "-",
};

export const CodePushDetailPageStrings = {
  Title: "Release Details",
  ReleaseLabel: "Release Label",
  Status: "Status",
  Deployment: "Deployment",
  TargetVersions: "Target Versions",
  Mandatory: "Mandatory",
  Size: "Size",
  ReleaseMethod: "Release Method",
  Rollout: "Rollout",
  RolloutDescription: "Rollout percentage.",
  ReleasedOn: "Released On",
  ReleasedBy: "Released By",
  Description: "Description",
  Active: "Active",
  ActiveDescription: "Percentage of active installs.",
  Downloaded: "Downloaded",
  Failed: "failed",
  ActiveDevice: "Active Devices",
  FailedInstalls: "Rollbacks",
  NotAvailable: "-",
  InstalledMetricValue: "{0}",
  Installs: "Installs",
  Downloads: "Downloads",
  ChartSubTitleNull: "0 of 0",
  ChartSubTitle: "{0} of {1}",
};

export const CodePushEditReleaseDetailPageStrings = {
  Title: "Edit '{0}'",
  Description: "Description:",
  Mandatory: "Required Update:",
  Rollout: "Rollout:",
  RolloutDescription: "The percentage of users eligible for this update (value can only be increased).",
  Enabled: "Enabled:",
  EnabledDescription: "When disabled, this update will not be available to your users.",
  On: "On",
  Off: "Off",
  Done: "Done",
  Versions: "Target Versions:",
  EnterTargetVersion: "Enter target version(s)",
  InvalidVersion: "Invalid semantic version.",
  TargetVersionRequired: "Target versions are required.",
};

export const CodePushManageDeploymentsPageStrings = {
  Name: "Name",
  Key: "Key",
  Cancel: "Cancel",
  Save: "Save",
  Delete: "Delete",
  Rename: "Rename",
  NameInput: "Rename and New deployment input",
  NewDeployment: "New deployment",
  DeleteTitle: "Delete '{0}' deployment?",
  DeleteInput: "Delete deployment input",
  DeleteDialogDescription:
    "Deleting this deployment will disable all updates for the app which uses it. As this operation can't be reverted, please confirm the name of the deployment you with to delete:",
};

export const GroupModeSwitchStrings = {
  ToggleStateOn: "On",
  ToggleStateOff: "Off",
  ToggleTitle: "Allow public access",
  ToggleSubtitle: "Allow anyone to download",
};

export const DocumentLinks = {
  DistrbutionGroups: "https://aka.ms/docs/migration/hockeyapp/distribution-groups",
};
