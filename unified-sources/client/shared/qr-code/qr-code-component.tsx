import * as React from "react";
import * as QRCode from "qrcode";

const DEFAULT_QRCODE_SIZE = 200;

export interface QRCodeComponentProps {
  encodingString: string;
  width?: number;
  height?: number;
}

export interface QRCodeComponentState {
  qrcodeUrl?: string;
}

export class QRCodeComponent extends React.Component<QRCodeComponentProps, QRCodeComponentState> {
  private currentEncodingString?: string;

  constructor(props: any) {
    super(props);
    this.state = {};
  }

  componentDidUpdate() {
    if (this.props.encodingString === this.currentEncodingString) {
      return;
    }

    this.currentEncodingString = this.props.encodingString;

    QRCode.toDataURL(this.currentEncodingString, (err, qrcode) => {
      if (err) {
        throw err;
      }

      this.setState({ qrcodeUrl: qrcode });
    });
  }

  public render(): JSX.Element {
    const { width, height } = this.props;
    const componentHeight = height || DEFAULT_QRCODE_SIZE;

    return (
      <div style={{ height: componentHeight }}>
        <img src={this.state.qrcodeUrl} width={width || DEFAULT_QRCODE_SIZE} height={componentHeight} role="presentation" />
      </div>
    );
  }
}
