import * as React from "react";
import {
  Title,
  Paragraph,
  TextAlignment,
  Size,
  TextColor,
  Copy,
  ClickableIcon,
  Icon,
  IconName,
  IconSize,
  Autofocus,
} from "@root/shared";
import { Grid, Col, Row, RowCol, GridSpacing } from "@root/shared/grid";
import { IApp } from "@lib/common-interfaces/app";
import { QRCodeComponent } from "./qr-code-component";
import { DistributionGroup, getGroupInstallUrl } from "@root/data/distribute/models/distribution-group";
import { withTranslation, WithTranslation } from "react-i18next";
import { locationStore } from "@root/stores";
import { Release } from "@root/distribute/models/release";
import { ReleaseDetailsUIStore } from "@root/distribute/release-details/release-details-ui-store";
import { CategoryName } from "@lib/common-interfaces";

const css = require("./qr-code-app-info.scss");

export interface QRCodeAppInfoProps {
  app?: IApp;
  group?: DistributionGroup;
  release?: Release;
}

export const QRCodeAppInfo = withTranslation(["common"])(
  class QRCodeAppInfo extends React.Component<QRCodeAppInfoProps & WithTranslation, {}> {
    public render(): JSX.Element {
      const { app, group, release, t } = this.props;
      const copiedUrl = this.getCopiedUrl(app, group, release);

      return (
        <Grid rowSpacing={GridSpacing.XXSmall} className={css.grid}>
          {[CategoryName.FirstParty, CategoryName.ThirdParty].includes(
            app?.application_category?.category_name || CategoryName.None
          ) ? (
            <>
              <RowCol>
                <Title align={TextAlignment.Center} size={Size.Medium} className={css.title}>
                  {t!("app.qrCodeInfo.title", { name: app?.display_name })}
                </Title>
              </RowCol>
              <RowCol>
                <Paragraph align={TextAlignment.Center} color={TextColor.Secondary} size={Size.Medium}>
                  {t!("app.qrCodeInfo.os", app)}
                </Paragraph>
              </RowCol>
              <RowCol center>
                <QRCodeComponent encodingString={copiedUrl} />
              </RowCol>
              <RowCol>
                <Paragraph align={TextAlignment.Center} size={Size.Medium}>
                  {t!("app.qrCodeInfo.inviteToScan")}
                </Paragraph>
              </RowCol>
              <Row>
                <Col className={css.linkCell}>
                  <Paragraph align={TextAlignment.Center} size={Size.Medium} color={TextColor.Secondary} ellipsize>
                    <Autofocus focus={true}>
                      <a href={copiedUrl} target="_blank" className={css.installLink}>
                        {copiedUrl}
                      </a>
                    </Autofocus>
                  </Paragraph>
                  <Copy clipboardData={copiedUrl} copiedMessage={t!("app.qrCodeInfo.copiedMessage")}>
                    <ClickableIcon
                      aria-label={t!("app.qrCodeInfo.copyBtnLabel")}
                      icon={<Icon icon={IconName.Copy} size={IconSize.XSmall} />}
                    />
                  </Copy>
                </Col>
              </Row>
            </>
          ) : (
            <>
              <RowCol>
                <Title align={TextAlignment.Center} size={Size.Medium} className={css.title}>
                  {t!("app.qrCodeInfo.title", { name: app?.display_name })}
                </Title>
              </RowCol>
              <RowCol>
                <Paragraph align={TextAlignment.Center} size={Size.Medium}>
                  "This application does not support distribution."
                </Paragraph>
              </RowCol>
            </>
          )}
        </Grid>
      );
    }

    private getCopiedUrl(app?: IApp, group?: DistributionGroup, release?: Release): string {
      const releaseDetailsUIStore = new ReleaseDetailsUIStore();

      if (group && group.is_public) {
        return getGroupInstallUrl(app, group);
      } else if (release) {
        return releaseDetailsUIStore.getInstallPortalUrlWithRelease("", app, release);
      } else {
        return locationStore.getInstallPortalUrlWithApp("", app);
      }
    }
  }
);
