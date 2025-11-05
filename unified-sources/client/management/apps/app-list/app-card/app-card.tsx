import * as React from "react";
import { observer } from "mobx-react";
import { Link } from "react-router";
import {
  GridRow as Row,
  GridCol as Col,
  MediaObject,
  Space,
  OrganizationIcon,
  AppIcon,
  Gravatar,
  Text,
  Size,
  TextColor,
  IconName,
  IconSize,
  Pill,
  Color,
  Icon,
  UserInitialsAvatar,
  FakeButton,
} from "@root/shared";
import { IApp } from "@lib/common-interfaces";
import { locationStore } from "@root/stores/location-store";
import { AppListType, isValidReleaseType, roleColumnWidth, releaseTypeColumnWidth } from "../../../constants/constants";
import { withTranslation, WithTranslation } from "react-i18next";
import { organizationStore } from "@root/stores/organization-store";
import { isTesterApp, isDogfoodTesterApp } from "@root/stores/utils/app-utils";
import { globalUIStore, layoutStore } from "@root/stores";
import { MicrosoftInternalGroupName } from "@root/distribute/utils/constants";
import * as i18next from "i18next";

const styles = require("./app-card.scss");
const classNames = require("classnames");

const TesterAppBadge: React.FunctionComponent<{ label: string }> = ({ label }) => (
  <Icon aria-label={label} icon={IconName.TestTube} size={IconSize.XSmall} color={Color.LightGray} />
);

const Owner: React.FunctionComponent<{ app: IApp }> = ({ app }) => {
  if (isDogfoodTesterApp(app)) {
    return (
      <>
        <Icon icon={IconName.Microsoft} size={IconSize.XMedium} />
        <Text ellipsize size={Size.Medium}>
          {MicrosoftInternalGroupName}
        </Text>
      </>
    );
  }

  const ownerIcon = app.isOrgApp ? (
    <OrganizationIcon key={app.id} size={24} organization={organizationStore.find(app.owner?.name || "")} />
  ) : (
    <Gravatar
      key={app.id}
      email={app.owner?.email}
      size={24}
      fallback={app.ownerFriendlyName ? <UserInitialsAvatar initialsName={app.ownerFriendlyName} size={24} /> : undefined}
    />
  );

  return (
    <>
      {ownerIcon}
      <Text ellipsize size={Size.Medium}>
        {app.ownerFriendlyName}
      </Text>
    </>
  );
};

const RowHeader: React.FunctionComponent<{ app: IApp; action: Action }> = ({ app, action }) => {
  const tagName: React.ComponentClass<any> = action.to ? Link : FakeButton;
  const appNameWithIcon = (
    <>
      <AppIcon app={app} size={32} />
      <Text size={Size.Medium} bold ellipsize>
        {app.display_name}
      </Text>
    </>
  );
  const rowHeader = React.createElement(
    tagName,
    { tabIndex: 0, className: styles["row-header-cell"], ...action },
    <React.Suspense fallback={null}>{appNameWithIcon}</React.Suspense>
  );
  return rowHeader;
};

const DesktopColumns: React.FunctionComponent<
  { app: IApp; testerApp: boolean; action: Action; hideOwner?: boolean; showReleaseType?: boolean } & Pick<WithTranslation, "t">
> = ({ app, hideOwner, t, testerApp, showReleaseType, action }) => {
  const columnWidth = showReleaseType ? releaseTypeColumnWidth : roleColumnWidth;

  return (
    <>
      <Col role="rowheader" width={hideOwner ? columnWidth.nameColumnHideOwner : columnWidth.nameColumn}>
        <RowHeader app={app} action={action}></RowHeader>
      </Col>
      <Col role="cell" width={columnWidth.platformColumn}>
        <Text size={Size.Medium} color={TextColor.Secondary}>
          {app.os}
        </Text>
      </Col>
      {showReleaseType ? (
        <Col role="cell" width={2}>
          {isValidReleaseType(app.release_type) ? (
            <Text ellipsize size={Size.Medium} color={TextColor.Secondary}>
              {app.release_type}
            </Text>
          ) : (
            <Text size={Size.Medium} className={styles["off-screen"]}>
              Blank Cell
            </Text>
          )}
        </Col>
      ) : null}
      <Col role="cell" width={2}>
        <Text size={Size.Medium} color={TextColor.Secondary}>
          {testerApp ? t("access.tester") : t("access.collaborator")}
        </Text>
      </Col>
      {!hideOwner ? (
        <Col role="cell" width={3}>
          <MediaObject hSpace={Space.XSmall} inline>
            <Owner app={app} />
          </MediaObject>
        </Col>
      ) : null}
    </>
  );
};
DesktopColumns.displayName = "DesktopColumns";

const MobileColumns: React.FunctionComponent<{ app: IApp }> = ({ app }) => (
  <Col role="cell">
    <MediaObject hSpace={Space.Small}>
      <AppIcon app={app} size={40} />
      <Text size={Size.Medium} bold>
        {app.display_name}
      </Text>
      <Text size={Size.Medium} color={TextColor.Secondary}>
        {app.os}
      </Text>
    </MediaObject>
  </Col>
);
MobileColumns.displayName = "MobileColumns";

interface Action {
  to?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

export interface AppCardProps {
  app: IApp;
  type?: AppListType;
  hideOwner?: boolean;
  className?: string;
  showDialog?: (app: IApp) => void;
  visible?: boolean;
  showReleaseType?: boolean;
}

export const AppCard = withTranslation(["common", "management"])(
  observer(
    class AppCard extends React.Component<AppCardProps & WithTranslation, {}> {
      public static defaultProps = {
        hideOwner: false,
      };

      public render() {
        const { app, hideOwner, type, className, t, showDialog, visible, showReleaseType } = this.props;
        const { query } = locationStore;
        const testerApp = isTesterApp(app);
        const appUrl =
          app.isCreatedInCodePush && app.isAnUnconfiguredApp
            ? locationStore.getResolvedUrl(`/apps/${app.owner?.name}/${app.name}/migrate`, query as any)
            : locationStore.getUrlWithApp("", app);
        const wrapperClassName = classNames(type === AppListType.Grid ? styles.card : styles.row, className);
        const linkClassName = classNames(styles["full-link"]);
        const action = {} as Action;
        if (testerApp) {
          action.onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
            event.preventDefault();
            if (showDialog) {
              globalUIStore.setFocusReturnElement(document.activeElement);
              showDialog(app);
            }
          };
        } else {
          action.to = appUrl;
        }

        return type === AppListType.List || layoutStore.isMobile ? (
          <Row
            role="row"
            middle
            key={app.id}
            visible={visible}
            className={wrapperClassName}
            aria-label={app.display_name}
            data-test-class="app-card"
            mouseOnly
            tabIndex={-1}
          >
            {layoutStore.isMobile ? (
              <MobileColumns app={app} />
            ) : (
              <>
                <DesktopColumns
                  action={action}
                  showReleaseType={showReleaseType}
                  app={app}
                  testerApp={testerApp}
                  hideOwner={hideOwner}
                  t={t}
                />
                <div role="gridcell">
                  {!testerApp ? (
                    <Link to={action.to || ""} className={linkClassName} aria-label={app.display_name} tabIndex={-1}></Link>
                  ) : (
                    <FakeButton
                      onClick={action.onClick}
                      className={linkClassName}
                      aria-label={app.display_name}
                      tabIndex={-1}
                    ></FakeButton>
                  )}
                </div>
              </>
            )}
          </Row>
        ) : (
          this.getAppCard(app, t, testerApp, action, wrapperClassName, hideOwner)
        );
      }

      private getAppCard(
        app: IApp,
        t: i18next.TFunction,
        testerApp: boolean,
        action: Action,
        wrapperClassName: string,
        hideOwner: boolean | undefined
      ): JSX.Element {
        let ariaLabel = hideOwner
          ? `${app.display_name} for ${app.os}`
          : `${app.display_name} by ${this.getOwnerDisplayName(app)} for ${app.os}`;
        ariaLabel = testerApp ? ariaLabel + ", tester app" : ariaLabel;
        ariaLabel = !isValidReleaseType(app.release_type) ? ariaLabel : `${ariaLabel} ${app.release_type}`;
        const linkContent = (
          <div className={styles["card-contents"]}>
            <AppIcon app={app} size={60} className={styles.icon} />
            <div className={classNames(styles.text, { [styles["no-owner"]]: hideOwner })}>
              <Text size={Size.Medium} bold ellipsize>
                {app.display_name}
              </Text>
              {!hideOwner ? (
                <Text size={Size.Medium} color={TextColor.Secondary} ellipsize>
                  {this.getOwnerDisplayName(app)}
                </Text>
              ) : null}
            </div>
            <div className={styles.header}>
              {testerApp ? <TesterAppBadge label={t("management:testerApp")} /> : null}
              <Pill subtle>{app.os}</Pill>
              {isValidReleaseType(app.release_type) ? (
                <Pill subtle className={styles.release_typePill}>
                  {app.release_type}
                </Pill>
              ) : null}
            </div>
          </div>
        );

        return testerApp ? (
          <a
            className={classNames(styles.gridItem, wrapperClassName)}
            href=""
            onClick={action.onClick}
            role="button"
            aria-label={ariaLabel}
            data-test-class="app-card"
          >
            {linkContent}
          </a>
        ) : (
          <Link
            className={classNames(styles.gridItem, wrapperClassName)}
            to={action.to || ""}
            aria-label={ariaLabel}
            data-test-class="app-card"
          >
            {linkContent}
          </Link>
        );
      }

      private getOwnerDisplayName(app: IApp): string | undefined {
        return isDogfoodTesterApp(app) ? MicrosoftInternalGroupName : app.ownerFriendlyName;
      }
    }
  )
);
