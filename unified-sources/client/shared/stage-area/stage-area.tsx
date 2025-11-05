import * as React from "react";
import * as PropTypes from "prop-types";
import { omit } from "lodash";
const classNames = require("classnames/bind");
const css = require("./stage-area.scss");

/**
 * @deprecated
 * Use a Card in the page content instead.
 */
export class StageArea extends React.Component<React.HTMLAttributes<HTMLElement> & { styles?: any }, {}> {
  public context!: { inModal: boolean };
  public static defaultProps = { styles: css };
  public static contextTypes = { inModal: PropTypes.bool };
  public render() {
    const { styles, className } = this.props;
    const { inModal } = this.context;
    return (
      <div {...omit(this.props, "styles")} className={classNames.call(styles, className, "stage-area", { inModal })}>
        {this.props.children}
      </div>
    );
  }
}
