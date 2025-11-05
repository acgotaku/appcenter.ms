import * as React from "react";
import * as PropTypes from "prop-types";
import { Icon, IconName } from "../icon/icon";
import { IconSize } from "../common-interfaces";
import { Color } from "../utils/color";

const css = require("./device-signature-modal.scss");

/**
 * Device frame size
 */
export enum DeviceFrameSize {
  Tiny,
  Small,
  Medium,
  Large,
  XLarge,
  Full,
  Fit,
  FitHeight,
}

/*
 * Props passed to a DeviceSignatureModal component
 */
export interface DeviceSignatureModalProps extends React.HTMLAttributes<HTMLElement> {
  formFactor?: string;
  signatureFrame: string;
  size: DeviceFrameSize;
  alt?: string;
  role?: string;
  styles?: any;
}

/*
 * DeviceSignatureModal component
 */
export class DeviceSignatureModal extends React.PureComponent<DeviceSignatureModalProps, {}> {
  public state = {
    imageLoaded: false,
    imageStyles: {
      opacity: 0,
    },
  };

  public static defaultProps = {
    styles: css,
  };

  public static propTypes: React.ValidationMap<DeviceSignatureModalProps> = {
    signatureFrame: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
  };

  public handleImageLoaded(event: any) {
    this.setState({
      imageLoaded: true,
      imageStyles: {
        opacity: 1,
      },
    });

    if (this.props.onLoad) {
      this.props.onLoad(event);
    }
  }

  public render() {
    const { formFactor, signatureFrame, size, styles, alt, role } = this.props;
    // If the image is supposed to be presentation role, for some reason we have to make the container
    // div be role presentation as well. Otherwise, the div will get focus when within a table.
    const divRole = role === "presentation" ? role : undefined;
    return (
      <div className={styles.container} role={divRole}>
        {!this.state.imageLoaded ? (
          <Icon icon={IconName.Loading} color={Color.Gray} size={IconSize.XSmall} className={styles.spinner} />
        ) : null}
        <img
          src={signatureFrame}
          className={styles[DeviceFrameSize[size].toLowerCase()]}
          onLoad={(e) => this.handleImageLoaded(e)}
          style={this.state.imageStyles}
          data-form-factor={formFactor}
          alt={alt || ""}
          role={role}
        />
      </div>
    );
  }
}
