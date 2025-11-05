import * as React from "react";
import { debounce, uniqueId } from "lodash";
import { t } from "@root/lib/i18n";
// Unsafe import alert: this isn’t strictly public API,
// so it could theoretically move or be removed in point releases.
import createDetectElementResize from "react-virtualized/dist/commonjs/vendor/detectElementResize";
import { notifyScreenReader } from "@root/stores/notification-store";
import { Overlay, OverlayProps, OverlayTransition } from "../overlay";
import { Block, BlockBorderRadius, MaterialShadow, BlockProps } from "../block";
import { globalUIStore } from "@root/stores";
import { Omit } from "@lib/common-interfaces";
const classNames = require("classnames");
const css = require("./dialog.scss");
const { addResizeListener, removeResizeListener } = createDetectElementResize();

const VERTICAL_OFFSET = 0;

export interface DialogProps extends Omit<OverlayProps, "onRequestClose"> {
  title?: string;
  width?: number;
  onRequestClose?(event: MouseEvent | KeyboardEvent): void;
  willChangeHeight?: boolean;
  styles?: any;
  hero?: BlockProps["hero"];
  heroBackground?: BlockProps["heroBackground"];
  header?: BlockProps["header"];
  dividedHeader?: BlockProps["dividedHeader"];
  blockTagName?: BlockProps["tagName"];
  loading?: BlockProps["loading"];
}

export class Dialog extends React.PureComponent<DialogProps, { overlayElementHeight?: number }> {
  public static defaultProps = {
    styles: css,
    width: 520,
  };

  private id = uniqueId("dialog-");
  private overlayElement?: HTMLElement;
  public state: { overlayElementHeight?: number } = {};

  private measure = () => {
    if (this.overlayElement) {
      const newHeight = this.overlayElement.offsetHeight;
      if (newHeight !== this.state.overlayElementHeight) {
        const rects = this.overlayElement.getClientRects();
        if (rects.length) {
          this.setState({ overlayElementHeight: rects[0].height });
        }
      }
    }
  };

  private debouncedMeasure = debounce(this.measure, 250, { leading: true });

  private onOverlayEnter = (overlay: HTMLElement) => {
    const { title, willChangeHeight } = this.props;
    const prevOverlayElement = this.overlayElement;
    const overlayElementIsNew = overlay !== prevOverlayElement;
    this.overlayElement = overlay;

    if (willChangeHeight) {
      if (overlayElementIsNew && prevOverlayElement) {
        removeResizeListener(prevOverlayElement, this.debouncedMeasure);
      }
      addResizeListener(overlay, this.debouncedMeasure);
    }
    const rects = overlay.getClientRects();
    if (rects.length) {
      this.setState({ overlayElementHeight: rects[0].height });
    }

    if (title) {
      notifyScreenReader({ message: `${title}, ${t("common:page.dialog.title")}`, delay: 200 });
    }

    globalUIStore.setDialogOrPopoverOpen(this.id);
  };

  private onOverlayExited = () => {
    globalUIStore.setDialogOrPopoverClosed(this.id);
    if (this.props.onExited) {
      this.props.onExited();
    }
  };

  private get positionStyle(): React.CSSProperties {
    const { style, width } = this.props;
    const { overlayElementHeight } = this.state;
    const widthStyle = { width, marginLeft: -width! / 2 };
    if (typeof overlayElementHeight !== "number") {
      return { ...style, ...widthStyle };
    }

    return {
      ...style,
      ...widthStyle,
      marginTop: -overlayElementHeight / 2 + VERTICAL_OFFSET,
    };
  }

  public componentDidMount() {
    window.addEventListener("resize", this.measure);
  }

  public UNSAFE_componentWillUpdate(nextProps: DialogProps) {
    if (nextProps.willChangeHeight !== this.props.willChangeHeight) {
      throw new Error("Changing `willChangeHeight` during the life of a Dialog is not supported.");
    }
  }

  public componentWillUnmount() {
    globalUIStore.setDialogOrPopoverClosed(this.id);
    window.removeEventListener("resize", this.measure);
    if (this.props.willChangeHeight) {
      removeResizeListener(this.overlayElement, this.measure);
    }
  }

  public onClose(event: MouseEvent | KeyboardEvent) {
    this.props.onRequestClose?.(event);
  }

  public render() {
    const {
      width,
      onRequestClose,
      willChangeHeight,
      hero,
      header,
      dividedHeader,
      blockTagName,
      loading,
      styles,
      children,
      role,
      ...props
    } = this.props;
    const className = classNames(this.props.className, styles.dialog);

    return (
      <Overlay
        transitionOut={OverlayTransition.Fade}
        {...props}
        role={role ? role : "dialog"}
        backdrop
        onRequestClose={(e: MouseEvent | KeyboardEvent) => this.props.onRequestClose?.(e)}
        onEnter={this.onOverlayEnter}
        onExited={this.onOverlayExited}
        className={className}
        style={this.positionStyle}
      >
        {typeof children === "function"
          ? children
          : (overlayInjectedProps) => (
              <Block
                shadow={MaterialShadow.OverlayIntense}
                borderRadius={BlockBorderRadius.Large}
                tagName={blockTagName}
                header={header}
                hero={hero}
                loading={loading}
                {...overlayInjectedProps}
              >
                {children}
              </Block>
            )}
      </Overlay>
    );
  }
}
