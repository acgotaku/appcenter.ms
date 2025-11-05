import * as React from "react";
import * as PropTypes from "prop-types";
import { debounce } from "lodash";
import { SectionProps } from "./types";
import { transitionListener } from "../transition-listener";
// Unsafe import alert: this isn’t strictly public API,
// so it could theoretically move or be removed in point releases.
import createDetectElementResize from "react-virtualized/dist/commonjs/vendor/detectElementResize";
const { addResizeListener, removeResizeListener } = createDetectElementResize();

export const Section = transitionListener(
  class Section extends React.PureComponent<SectionProps & React.HTMLAttributes<HTMLElement>, {}> {
    public static displayName = "VerticalTabs.Section";
    public static propTypes: React.ValidationMap<SectionProps> = {
      index: PropTypes.number.isRequired,
      onRender: PropTypes.func.isRequired,
      onChangeHeight: PropTypes.func.isRequired,
    };

    private element?: HTMLElement;
    private height?: number;
    private entered = false;

    private measure = debounce(() => {
      const newHeight = this.element && this.element.offsetHeight;
      if (newHeight != null && newHeight !== this.height) {
        this.props.onChangeHeight(this.props.index);
        this.height = newHeight;
      }
    }, 250);

    private captureRef = (element: HTMLDivElement) => {
      if (element !== this.element) {
        this.element = element;
        this.props.onRender(element, this.props.index);
      }
    };

    public componentDidEnter() {
      if (this.element) {
        addResizeListener(this.element, this.measure);
      }
      this.entered = true;
    }

    public componentWillUnmount() {
      if (this.entered) {
        removeResizeListener(this.element, this.measure);
      }
    }

    public render() {
      const { children } = this.props;
      const { index, onRender, onChangeHeight, ...passthrough } = this.props;
      return (
        <div {...passthrough} ref={this.captureRef}>
          {children}
        </div>
      );
    }
  }
);
