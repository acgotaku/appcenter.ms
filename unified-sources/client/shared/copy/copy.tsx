import * as React from "react";
import * as PropTypes from "prop-types";
import { omit } from "lodash";
const css = require("./copy.scss");
import { t } from "@root/lib/i18n";
import { notificationStore } from "@root/stores/notification-store";

export interface CopyProps extends React.HTMLAttributes<HTMLElement> {
  clipboardData: string | (() => string) | null;
  onCopied?(): void;
  styles?: any;
  copiedMessage?: string;
}
const copyProps: React.WeakValidationMap<CopyProps> = {
  clipboardData: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  onCopied: PropTypes.func,
  copiedMessage: PropTypes.string,
};
const copyKeys = Object.keys(copyProps);
export class Copy extends React.Component<CopyProps, {}> {
  public static propTypes = copyProps;
  public static defaultProps = {
    clipboardData: "",
    styles: css,
  };
  public selectable: HTMLSpanElement | null = null;

  public notifyCopied() {
    // Translations are not available at class creation time, since
    // copiedMessage value can be undefined lets provide default value:
    const { copiedMessage = t("common:state.copied") } = this.props;
    if (copiedMessage) {
      notificationStore.notify({
        persistent: false,
        message: copiedMessage,
      });
    }
  }

  public handleClick = (event: React.MouseEvent<HTMLElement>) => {
    /* this.props.clipboardData (Function) uses DOM APIs to get value of
     * an HTMLInputElement every time it is invoked. For performance,
     * we should minimize the number of invocations. Setting the child
     * of this.selectable (HTMLSpanElement) to this.props.clipboardData()
     * in the render function will result in a performance hit, even if the
     * user never clicks the CopyButton. We can avoid this by delaying
     * the invocation of this.props.clipboardData until this click handler.
     * This requires us to use DOM APIs to set this.selectable’s contents.
     */
    if (typeof this.props.clipboardData === "function" && this.selectable) {
      // tslint:disable-next-line:no-inner-html
      this.selectable.innerHTML = this.props.clipboardData();
    }
    const range = document.createRange();
    if (this.selectable) {
      range.selectNodeContents(this.selectable);
    }
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    document.execCommand("copy");
    this.notifyCopied();
    // Callback
    if (typeof this.props.onCopied === "function") {
      this.props.onCopied();
    }
  };

  public render() {
    const passthrough = omit(this.props, ...copyKeys, "icon", "styles");
    /* tslint:disable:react-a11y-event-has-role */
    return (
      <span {...passthrough} onClick={this.handleClick}>
        <pre aria-hidden={true} tabIndex={-1} className={this.props.styles.selectable} ref={(x) => (this.selectable = x)}>
          {typeof this.props.clipboardData === "string" ? this.props.clipboardData : null}
        </pre>
        {this.props.children}
      </span>
    );
  }
}
