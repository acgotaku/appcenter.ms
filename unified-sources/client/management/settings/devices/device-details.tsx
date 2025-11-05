import * as React from "react";
import { observer } from "mobx-react";
import {
  Action,
  DeviceCard,
  DeviceCardSize,
  IconName,
  IconTooltip,
  IconSize,
  Menu,
  Modalify,
  Page,
  PanelInjectedProps,
  PanelOutlet,
  Paragraph,
  Size,
  TextColor,
  Trigger,
  PageHeader,
} from "@root/shared";
import { locationStore, notFoundStore } from "@root/stores";
import { devicesUIStore } from "./devices-ui-store";
import { withTranslation, WithTranslation } from "react-i18next";
import { RouteComponentProps } from "react-router";
import { DeleteDeviceDialog } from "./delete-device-dialog";

const styles = require("./device-details.scss");

type DeviceDetailsProps = WithTranslation & PanelInjectedProps & RouteComponentProps<any, any>;

export const DeviceDetails = Modalify(
  withTranslation(["devices"])(
    observer(
      class DeviceDetails extends React.Component<DeviceDetailsProps, {}> {
        public UNSAFE_componentWillMount() {
          const deviceUdid = this.props.params["device_udid"];
          devicesUIStore.getDevice(deviceUdid);
        }

        public UNSAFE_componentWillUpdate(nextProps, nextState) {
          const { device_udid } = nextProps.params;
          if (!devicesUIStore.isFetching && !devicesUIStore.has(device_udid)) {
            notFoundStore.notify404();
            return;
          }
        }

        public render() {
          const { t } = this.props;
          const { isFetching, isVisible, getDeviceThumbnail } = devicesUIStore;
          const deviceUdid = this.props.params["device_udid"];
          const device = devicesUIStore.getDevice(deviceUdid);
          const locale = "en-us";

          return (
            <Page
              supportsMobile
              role="dialog"
              name={t("management:devices.modal.name")}
              aria-label="Device details"
              header={
                <PageHeader title={device?.deviceName} loading={isFetching}>
                  {!isFetching && (
                    <Menu>
                      <Trigger>
                        <IconTooltip clickable icon={IconName.More} size={IconSize.XSmall}>
                          {t("management:moreButtonText")}
                        </IconTooltip>
                      </Trigger>
                      <Action text={t("management:devices.copyUdid")} clipboardData={deviceUdid} />
                      <Action danger text={t("common:button.delete")} onClick={() => devicesUIStore.setupDeleteDevice(deviceUdid)} />
                    </Menu>
                  )}
                </PageHeader>
              }
            >
              <div aria-live="assertive">
                {isFetching || !device ? (
                  <div className={styles.deviceHeader}>
                    <div className={styles.deviceImgSkeleton} />
                    <div className={styles.deviceInfoSkeleton}>
                      <div className={styles.deviceInfoTextSkeleton} />
                      <div className={styles.deviceInfoTextSkeleton} />
                      <div className={styles.deviceInfoTextSkeleton} />
                    </div>
                  </div>
                ) : (
                  <div className={styles.deviceHeader}>
                    <div className={styles.deviceImg}>
                      <DeviceCard
                        key={`deviceDetails-${device.udid}`}
                        signatureFrame={getDeviceThumbnail(device)}
                        signatureFrameAltText={`${device.deviceName} ${t("management:devices.osVersion")} ${device.osVersion}`}
                        size={DeviceCardSize.Large}
                      />
                    </div>
                    <div className={styles.deviceInfo}>
                      <Paragraph size={Size.Large}>
                        {device.manufacturer} {device.deviceName}
                      </Paragraph>
                      <Paragraph size={Size.Medium} color={TextColor.Secondary}>{`${t(
                        "management:devices.registeredOn"
                      )} ${device.registeredOn!.toLocaleString(locale, { month: "long", day: "numeric" })}`}</Paragraph>
                      <Paragraph size={Size.Small}>{device.udid}</Paragraph>
                    </div>
                    <DeleteDeviceDialog visible={isVisible} onConfirm={this.closeDetails} />
                  </div>
                )}
              </div>
              <PanelOutlet>{this.props.children}</PanelOutlet>
            </Page>
          );
        }

        private closeDetails = (): void => {
          locationStore.goUp();
        };
      }
    )
  )
);
