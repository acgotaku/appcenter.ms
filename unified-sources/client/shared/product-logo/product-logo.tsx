import * as React from "react";
const classNames = require("classnames/bind");
const css = require("./product-logo.scss");
const cx = classNames.bind(css);

export interface ProductLogoProps extends React.HTMLAttributes<HTMLElement> {
  invert?: boolean;
}

export class ProductLogo extends React.PureComponent<ProductLogoProps, {}> {
  public render() {
    const { invert, ...passthrough } = this.props;
    const classNames = cx("logo", this.props.className, { invert });
    // eslint-disable-next-line security/detect-non-literal-require
    const InlinedSVG = require(`!svg-react-loader!./product-logo.svg`);

    return (
      <div {...passthrough} className={classNames}>
        <InlinedSVG />
      </div>
    );
  }
}
