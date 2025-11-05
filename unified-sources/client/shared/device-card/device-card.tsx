import * as React from "react";
import { Text, Size, TextColor } from "../typography";
import { Grid, Row, Col, GridSpacing } from "../grid";
import { DeviceSignatureModal, DeviceFrameSize } from "./device-signature-modal";

const css = require("./device-card.scss");

export enum DeviceCardSize {
  Small,
  Medium,
  Large,
  XLarge,
}

/*
 * Props passed to a DeviceCard component
 */
export interface DeviceCardProps extends React.HTMLAttributes<HTMLElement> {
  signatureFrame?: string;
  name?: string;
  manufacturer?: string;
  osVersion?: string;
  udid?: string;
  formFactor?: string;
  size?: DeviceCardSize;
  signatureFrameAltText?: string;
  styles?: any;
}

/*
 * DeviceCard component
 */
export class DeviceCard extends React.PureComponent<DeviceCardProps, {}> {
  public static defaultProps = {
    size: DeviceCardSize.Medium,
    styles: css,
  };

  public render() {
    const { signatureFrame, signatureFrameAltText, name, manufacturer, size, osVersion, udid, styles, formFactor } = this.props;

    const deviceSignatureModalProps = {
      formFactor: formFactor,
      signatureFrame: signatureFrame,
      alt: signatureFrameAltText,
      role: !!signatureFrameAltText ? undefined : "presentation",
      size: (() => {
        switch (size) {
          case DeviceCardSize.Small:
            return DeviceFrameSize.Tiny;
          case DeviceCardSize.Medium:
            return DeviceFrameSize.Medium;
          case DeviceCardSize.Large:
            return DeviceFrameSize.Fit;
          case DeviceCardSize.XLarge:
            return DeviceFrameSize.FitHeight;
          default:
            return DeviceFrameSize.Medium;
        }
      })(),
    };

    return (
      <Grid rowSpacing={GridSpacing.XSmall} className={styles.grid}>
        <Row middle={true} columnSpacing={GridSpacing.XXSmall} className={styles[DeviceCardSize[size!].toLowerCase()]}>
          {signatureFrame ? (
            <Col className={styles.img}>
              <DeviceSignatureModal {...deviceSignatureModalProps} signatureFrame={signatureFrame} />
            </Col>
          ) : null}
          <Col className={styles.data}>
            <Text size={Size.Medium} color={TextColor.Secondary}>
              {manufacturer}
            </Text>
            <Text size={Size.Medium}>{name}</Text>
            <Text size={Size.Medium} color={TextColor.Secondary}>
              {osVersion}
            </Text>
            {udid ? <Text size={Size.Medium}>{udid}</Text> : null}
          </Col>
        </Row>
      </Grid>
    );
  }
}
