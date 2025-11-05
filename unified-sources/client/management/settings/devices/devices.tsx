import * as React from "react";
import { observer } from "mobx-react";
import {
  EmptyState,
  NotificationType,
  Page,
  Panelify,
  PanelInjectedProps,
  PanelOutlet,
  PageHeader,
  Table,
  Row,
  Cell,
  RowHeight,
  MediaObject,
  PrimaryButton,
  Pill,
  Color,
  IconName,
  ButtonSize,
  MessageBar,
  SummaryCell,
} from "@root/shared";
import { Text, Size, TextColor } from "@root/shared/typography";
import { devicesUIStore } from "./devices-ui-store";
import { withTranslation, WithTranslation } from "react-i18next";
import { userStore, compatibilityStore, layoutStore } from "@root/stores";
import getDeviceThumbnail from "@root/install-beacon/utils/device-to-image-helper";

const noDevices = require("./assets/devices.svg");
const styles = require("./devices.scss");

export interface DevicesProps extends PanelInjectedProps {
  // Nothing to add here yet.
}

export const Devices = Panelify(
  withTranslation(["devices"])(
    observer(
      class Devices extends React.Component<DevicesProps & WithTranslation, {}> {
        public UNSAFE_componentWillMount() {
          devicesUIStore.fetch(userStore.currentUser.id!);
        }

        public render() {
          const { t } = this.props;
          const {
            collectionNotification,
            devices,
            registerDevice,
            currentDeviceUdid,
            currentDeviceIsRegistered,
            isFetchingProfile,
            isFetching,
          } = devicesUIStore;
          return (
            <Page supportsMobile header={<PageHeader title={t("management:devices.title")} loading={isFetching} />}>
              {collectionNotification ? (
                <MessageBar type={NotificationType.Error}>{devicesUIStore.collectionNotification!.message}</MessageBar>
              ) : null}
              {!isFetching && devices.length === 0 ? (
                <EmptyState
                  imgSrc={noDevices}
                  title={t("management:devices.emptyState.title")}
                  subtitle={t("management:devices.emptyState.subtitle")}
                  hideButton
                />
              ) : (
                <Table
                  title={"Registered devices"}
                  titleAriaHidden={false}
                  aria-label={"My devices. Registered devices."}
                  columns={[{ title: "Device", width: 1.0 }]}
                  data={devices}
                  eventualRowCount={devices.length || 4}
                  toolbar={
                    !compatibilityStore.isSafariBrowser || currentDeviceIsRegistered ? null : layoutStore.isMobile ? (
                      <PrimaryButton
                        size={ButtonSize.Small}
                        onClick={registerDevice}
                        disabled={isFetchingProfile}
                        icon={IconName.Add}
                        aria-label={"Register device"}
                      />
                    ) : (
                      ((
                        <PrimaryButton size={ButtonSize.Small} onClick={registerDevice} disabled={isFetchingProfile}>
                          Register device
                        </PrimaryButton>
                      ) as any)
                    )
                  }
                  rowHeight={RowHeight.MultiLine}
                  renderRow={(device, props) => (
                    <Row {...props} to={`/settings/devices/${device.udid}`}>
                      <Cell>
                        <MediaObject>
                          <div className={styles.deviceIcon}>
                            <img src={getDeviceThumbnail(device)} alt={device.displayName} />
                          </div>
                          <div>
                            <Text bold size={Size.Medium}>
                              {device.displayName}
                            </Text>
                            {device.udid === currentDeviceUdid ? (
                              <Pill className={styles.currentDevice} subtle={true} color={Color.Blue}>
                                Current device
                              </Pill>
                            ) : null}
                          </div>
                          <Text size={Size.Small} ellipsize color={TextColor.Secondary}>
                            {device.udid}
                          </Text>
                        </MediaObject>
                      </Cell>
                    </Row>
                  )}
                  renderPlaceholderRow={(props) => {
                    return (
                      <Row {...props}>
                        <SummaryCell skeleton title={"title"} subtitle={"subtitle"} icon={IconName.Default} />
                      </Row>
                    );
                  }}
                />
              )}
              <PanelOutlet>{this.props.children}</PanelOutlet>
            </Page>
          );
        }
      }
    )
  )
);
