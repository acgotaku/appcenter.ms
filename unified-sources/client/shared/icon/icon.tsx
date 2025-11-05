import * as React from "react";
import { Skeletal } from "../skeleton/skeleton";
import { IconName, StatusIconName } from "./icon-name";
import { IconSize } from "../common-interfaces";
import { Color, TextColor, StatusColor } from "../utils/color";
import { InterfaceSettingsStore } from "@root/management/settings/user-interface/user-interface-settings-ui-store";

const classNames = require("classnames");
const css = require("./icon.scss");

const interfaceSettingsStore = new InterfaceSettingsStore();

export enum IconArea {
  Compact,
  Normal,
  Relaxed,
}

export const iconReadableName: { [K in IconName]: string } = {
  [IconName.AadGroup]: "AAD Group",
  [IconName.AarFile]: "AAR File",
  [IconName.AccountSettings]: "Account Settings",
  [IconName.Add]: "Add",
  [IconName.AddCircle]: "Add",
  [IconName.AddUser]: "Add User",
  [IconName.Admin]: "Admin",
  [IconName.AppAnalytics]: "Analytics Beacon",
  [IconName.AppBack]: "Back",
  [IconName.AppBeacon]: "Prototype Beacon",
  [IconName.AppBuild]: "Build Beacon",
  [IconName.AppCrashes]: "Crashes Beacon",
  [IconName.AppCenter]: "App Center",
  [IconName.AppCenterWhite]: "App Center",
  [IconName.AppData]: "Data Beacon",
  [IconName.AppDistribute]: "Distribute Beacon",
  [IconName.AppDocs]: "AppDocs", // FIXME
  [IconName.AppHome]: "Home",
  [IconName.AppAuth]: "Auth Beacon",
  [IconName.AppIndex]: "AppIndex", // FIXME
  [IconName.AppOverview]: "Overview",
  [IconName.AppleStore]: "Apple App Store",
  [IconName.AppleTestFlightStore]: "Apple Test Flight Store",
  [IconName.AppleIcon]: "Apple Icon",
  [IconName.AppleIconInvert]: "Apple Icon",
  [IconName.ArrowsDown]: "Arrows Down",
  [IconName.AuthBeacon]: "Auth Beacon",
  [IconName.ApplicationInsights]: "Application Insights",
  [IconName.GettingStarted]: "Getting Started",
  [IconName.AppSettings]: "App Settings",
  [IconName.AppSupport]: "Support",
  [IconName.AppTest]: "Test Beacon",
  [IconName.AttachmentBinary]: "Binary File",
  [IconName.AttachmentText]: "Text File",
  [IconName.Auth0]: "Auth0",
  [IconName.Aad]: "Aad",
  [IconName.Azure]: "Microsoft Azure",
  [IconName.AzureSubscription]: "Microsoft Azure Subscription",
  [IconName.AzureSubscriptionDisabled]: "Microsoft Azure Subscription Disabled",
  [IconName.Billing]: "Billing",
  [IconName.Bitbucket]: "Bitbucket",
  [IconName.Bluetooth]: "Bluetooth",
  [IconName.Breadcrumb]: "Breadcrumb",
  [IconName.Bullet]: "Bullet",
  [IconName.ButtonChevronRight]: "Right",
  [IconName.ButtonChevronLeft]: "Left",
  [IconName.ButtonExpandLess]: "Expand Less",
  [IconName.ButtonExpandMore]: "Expand More",
  [IconName.Calendar]: "Calendar",
  [IconName.CalendarClock]: "Calendar Clock",
  [IconName.Certificate]: "Certificate",
  [IconName.Check]: "Check",
  [IconName.ChevronLeft]: "Left",
  [IconName.ChevronRight]: "Right",
  [IconName.Clear]: "Clear",
  [IconName.Close]: "Close",
  [IconName.CloseSmall]: "Close",
  [IconName.Code]: "Code",
  [IconName.CosmosDB]: "Cosmos DB",
  [IconName.Copy]: "Copy",
  [IconName.Crash]: "Crash",
  [IconName.CrashFilled]: "Crash",
  [IconName.CsrFile]: "Certificate Signing Request File",
  [IconName.CsvFile]: "Comma Separated Values File",
  [IconName.Default]: "Default",
  [IconName.Delete]: "Delete",
  [IconName.Desktop]: "Desktop",
  [IconName.DeviceOrientation]: "Device Orientation",
  [IconName.DistributionGroup]: "Distribution Group",
  [IconName.Docs]: "Docs",
  [IconName.DocsEdit]: "Docs Edit",
  [IconName.Done]: "Done",
  [IconName.Download]: "Download",
  [IconName.DoubleChevronLeft]: "Double Chevron Left",
  [IconName.DoubleChevronRight]: "Double Chevron Right",
  [IconName.Edit]: "Edit",
  [IconName.Email]: "Email",
  [IconName.EmailAdd]: "Add Email",
  [IconName.EmailReply]: "Email Reply",
  [IconName.ExpandLess]: "Expand Less",
  [IconName.ExpandMore]: "Expand More",
  [IconName.FieldClear]: "Clear",
  [IconName.Facebook]: "Facebook",
  [IconName.FacebookInvert]: "Facebook",
  [IconName.File]: "File",
  [IconName.FilterList]: "Filter",
  [IconName.FilterAdd]: "Add Filter",
  [IconName.Filter]: "Enable Filter",
  [IconName.Firebase]: "Firebase",
  [IconName.Fork]: "Fork",
  [IconName.Git]: "Git",
  [IconName.GitHub]: "GitHub",
  [IconName.GitLab]: "GitLab",
  [IconName.Google]: "Google",
  [IconName.GooglePlay]: "Google Play",
  [IconName.Group]: "Group",
  [IconName.GroupCircle]: "Group Circle",
  [IconName.Help]: "Help",
  [IconName.Info]: "Info",
  [IconName.InstallOnDevice]: "Install on device",
  [IconName.InfoFilled]: "Info",
  [IconName.IntuneCompanyPortal]: "Microsoft Intune",
  [IconName.Issue]: "Issue",
  [IconName.IssuesCrash]: "Crash",
  [IconName.IssuesError]: "Error",
  [IconName.Jira]: "Jira",
  [IconName.JksFile]: "Java KeyStore File",
  [IconName.JsonFile]: "JSON File",
  [IconName.Loading]: "Loading",
  [IconName.Locked]: "Locked",
  [IconName.Lock]: "Lock",
  [IconName.LockAlt]: "Lock",
  [IconName.LockOpen]: "Lock Open",
  [IconName.Log]: "Log",
  [IconName.LogOut]: "Log Out",
  [IconName.Menu]: "Menu",
  [IconName.Microsoft]: "Microsoft",
  [IconName.MobileCenterLogo]: "App Center",
  [IconName.MobileCenter]: "App Center",
  [IconName.MobileprovisionFile]: "Mobileprovision File",
  [IconName.More]: "More",
  [IconName.MoreFilled]: "More",
  [IconName.NavigateBack]: "Back",
  [IconName.NavigateNext]: "Next",
  [IconName.None]: "",
  [IconName.Note]: "Note",
  [IconName.OneSignal]: "One Signal",
  [IconName.OpenInNew]: "Open In",
  [IconName.Organization]: "Organization",
  [IconName.Package]: "Package",
  [IconName.People]: "People",
  [IconName.PfxFile]: "Personal Information Exchange File",
  [IconName.Phone]: "Phone",
  [IconName.Preview]: "Preview",
  [IconName.QuestionMark]: "Help",
  [IconName.QuestionMarkOutlinedSmall]: "Help",
  [IconName.QuestionMarkOutlinedLarge]: "Help",
  [IconName.Refresh]: "Refresh",
  [IconName.Release]: "Release",
  [IconName.ReleaseDisabled]: "Disabled Release",
  [IconName.ReleaseDisabledDetails]: "Disabled Release",
  [IconName.ReleaseEnableDetails]: "Release",
  [IconName.ReleaseExternal]: "Externally Hosted Build Release",
  [IconName.ReleaseExternalDetails]: "Externally Hosted Build Release",
  [IconName.ReleaseMandatory]: "Mandatory Release",
  [IconName.Remove]: "Remove",
  [IconName.RemoveCircle]: "Remove",
  [IconName.Repository]: "Repository",
  [IconName.Satellite]: "Satellite",
  [IconName.Search]: "Search",
  [IconName.SelfHost]: "Self-Hosted",
  [IconName.Send]: "Send",
  [IconName.Settings]: "Settings",
  [IconName.Share]: "Share",
  [IconName.SharedDistributionGroup]: "Shared Distribution Group",
  [IconName.Shield]: "Privacy",
  [IconName.SignalFlag]: "Signal Flag",
  [IconName.SignOut]: "Sign Out",
  [IconName.SortDown]: "Sort (descending)",
  [IconName.SortUp]: "Sort (ascending)",
  [IconName.Spinner]: "Loading",
  [IconName.Star]: "Star",
  [IconName.StatusCancelled]: "Cancelled Status",
  [IconName.StatusCommit]: "Commit Status",
  [IconName.StatusCommitBuilt]: "Built Commit Status",
  [IconName.StatusCommitCrashed]: "Crashed Commit Status",
  [IconName.StatusCommitEmpty]: "Empty Commit Status",
  [IconName.StatusCommitFailed]: "Failed Commit Status",
  [IconName.StatusCommitNone]: "None Commit Status",
  [IconName.StatusCommitQueued]: "Queued Commit Status",
  [IconName.StatusCommitRunning]: "Running Commit Status",
  [IconName.StatusCrashed]: "Crashed Status",
  [IconName.StatusCrashedOutline]: "Crashed Status",
  [IconName.StatusEmpty]: "Empty Status",
  [IconName.StatusEmptyOutline]: "Empty Status",
  [IconName.StatusError]: "Error Status",
  [IconName.StatusFailed]: "Failed Status",
  [IconName.StatusFailedOutline]: "Failed Status",
  [IconName.StatusNone]: "No Status",
  [IconName.StatusNoneOutline]: "No Status",
  [IconName.StatusPassed]: "Passed Status",
  [IconName.StatusPassedOutline]: "Passed Status",
  [IconName.StatusQueued]: "Queued Status",
  [IconName.StatusQueuedOutline]: "Queued Status",
  [IconName.StatusRunning]: "Running Status",
  [IconName.StatusRunningOutline]: "Running Status",
  [IconName.Suitcase]: "Suitcase",
  [IconName.Support]: "Support",
  [IconName.TestTube]: "Test Tube",
  [IconName.Time]: "Time",
  [IconName.Transition]: "Transition",
  [IconName.Translation]: "Translation",
  [IconName.TrendingDown]: "Trending Down",
  [IconName.TrendingUp]: "Trending Up",
  [IconName.TrendingUnchanged]: "Trending Unchanged",
  [IconName.Twitter]: "Twitter",
  [IconName.TxtFile]: "Plain text file",
  [IconName.Unlocked]: "Unlocked",
  [IconName.Upload]: "Upload",
  [IconName.User]: "User",
  [IconName.VideoPause]: "Pause",
  [IconName.VideoPlay]: "Play",
  [IconName.VideoStop]: "Stop",
  [IconName.ViewGrid]: "View Grid",
  [IconName.ViewList]: "View List",
  [IconName.AzureDevOps]: "Azure Dev Ops",
  [IconName.Warning]: "Warning",
  [IconName.WarningFilled]: "Warning",
  [IconName.WiFi]: "Wi-Fi",
  [IconName.XcodeprojFile]: "Xcode Project File",
  [IconName.ZipFile]: "Zip File",
  [IconName.ZoomIn]: "Zoom In",
  [IconName.ZoomOut]: "Zoom Out",
};

const defaultAreas: { [size: number]: IconArea } = {
  [IconSize.XXSmall]: IconArea.Relaxed,
  [IconSize.XSmall]: IconArea.Normal,
  [IconSize.Small]: IconArea.Compact,
  [IconSize.XMedium]: IconArea.Compact,
  [IconSize.Medium]: IconArea.Compact,
  [IconSize.Large]: IconArea.Relaxed,
  [IconSize.XLarge]: IconArea.Compact,
};

export interface DefaultIconProps<IconNameType = IconName> extends React.SVGAttributes<SVGSVGElement> {
  icon: IconNameType;
  alternateName?: string;
}
const DefaultIcon: React.FunctionComponent<DefaultIconProps> = (props) => {
  // eslint-disable-next-line security/detect-non-literal-require
  let InlinedSVG = require(`!svg-react-loader!./icon/${props.alternateName || props.icon}.svg`);
  if (interfaceSettingsStore.effectiveTheme === "dark") {
    const InvertedIcon = tryToLoadInvertedIcon(props.icon);
    if (InvertedIcon) {
      InlinedSVG = InvertedIcon;
    }
  }
  const { icon, alternateName, ...passthrough } = props;
  return <InlinedSVG aria-label={iconReadableName[props.icon]} {...passthrough} />;
};
DefaultIcon.displayName = "DefaultIcon";

const tryToLoadInvertedIcon = (iconName: IconName) => {
  try {
    // eslint-disable-next-line security/detect-non-literal-require
    return require(`!svg-react-loader!./icon/${iconName}-invert.svg`);
  } catch (err) {
    return undefined;
  }
};

export interface CustomIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}
const CustomIcon: React.FunctionComponent<CustomIconProps> = (props) => {
  const WARNING = !props.alt && props.role !== "presentation";
  if (WARNING) {
    console.warn("WARNING: alt text was not provided for this image");
  }
  const { src, ...passthrough } = props;

  return <img alt={props.alt || ""} src={props.src} {...passthrough} />;
};
CustomIcon.displayName = "CustomIconProps";

export type IconBaseProps<ColorType = Color | TextColor> = {
  size?: IconSize;
  area?: IconArea;
  color?: ColorType;
  styles?: any;
  invert?: boolean;
};

export type IconProps = Skeletal & Partial<DefaultIconProps & CustomIconProps & IconBaseProps>;

/**
 * Base Icon component
 */
export class Icon extends React.PureComponent<IconProps, {}> {
  public static defaultProps = {
    size: IconSize.Small,
    styles: css,
    invert: false,
    color: TextColor.Primary,
  };

  public getColorName(color, invert) {
    if (TextColor[color]) {
      return TextColor[color].toLowerCase() + (invert ? "-invert" : "");
    }

    // keep ability to use colors from Color enum for now
    // note: it won't be supported once we migrate to TextColor enum everywhere
    if (Color[color]) {
      if (invert) {
        console.warn(
          "DEPRECATION: Using `Color` instead of `TextColor` for `Icon` is deprecated. " +
            "In addition it does not support `invert` prop. " +
            "Please refactor from `<Icon color={Color.ColorName} invert />` to `<Icon color={TextColor.ColorName} invert />`."
        );
      }
      return Color[color].toLowerCase();
    }
  }

  /**
   * Renders an Icon component
   * @returns {JSX.Element} Icon component
   */
  public render(): JSX.Element {
    const { styles, color, invert, size, src, icon, area, skeleton, ...passthrough } = this.props;
    if (this.props.skeleton) {
      return (
        <Icon
          alt=""
          role="presentation"
          {...passthrough}
          icon={IconName.Default}
          className={classNames(this.props.className, this.props.styles.skeleton)}
        />
      );
    }

    const sizeClass = IconSize[size!].toLowerCase();
    const role = icon === IconName.None ? { "aria-role": "hidden" } : {};
    const className = classNames(
      this.props.className,
      styles[sizeClass],
      styles[`${sizeClass}-${IconArea[Number.isInteger(area!) ? area! : defaultAreas[size!]].toLowerCase()}`],
      color ? styles[this.getColorName(color, invert) || ""] : null,
      icon ? styles[`icon-${icon}`] : null
    );

    let alternateName: string | undefined;
    if (icon === IconName.ChevronLeft && size === IconSize.XXSmall) {
      alternateName = "chevron-left-12";
    }

    return src ? (
      <CustomIcon src={src} {...passthrough} {...role} className={className} />
    ) : (
      <DefaultIcon icon={icon!} alternateName={alternateName} {...passthrough} className={className} />
    );
  }
}

export type StatusIconProps = Skeletal & Partial<DefaultIconProps<StatusIconName> & CustomIconProps & IconBaseProps<StatusColor>>;

export class StatusIcon extends React.Component<StatusIconProps, {}> {
  public static defaultProps = {
    styles: css,
  };

  public render() {
    const { color, className, ...passthrough } = this.props;
    const iconClass = classNames(className, color ? passthrough.styles[`status${StatusColor[color]}`] : null);
    return <Icon className={iconClass} {...passthrough} />;
  }
}

// For convenience
export { IconSize, IconName };
