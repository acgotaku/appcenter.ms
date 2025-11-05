import * as React from "react";
import * as PropTypes from "prop-types";
import * as shallowEqual from "shallowequal";
import { sortedIndex, omit } from "lodash";
import { WrapperChildProps, LeftInjectedProps } from "./types";
import { transitionListener } from "../transition-listener";
import { easeOutCubic } from "../utils/easings";
import debounce from "../utils/debounce-args";
const css = require("./vertical-tabs.scss");
// When you scroll to a section, what point do you actually scroll to?
// Putting the start of the section at the very top of the container
// looks disconcerting, like somebody standing way too close to the edge
// of a cliff. It’s much more comfortable to put some margin between the
// top of the container and the active section.
const SCROLL_TO_OFFSET = -20;

// These things don’t matter to Left
const ignoredProps: (keyof WrapperChildProps)[] = ["activeTab", "onClickTab", "onScrollIntoSection", "forceScrollId"];

export interface LeftProps {
  children?: (sectionProps: LeftInjectedProps) => React.ReactElement<any>;
  styles?: {
    transitionDuration: string;
    left: string;
    [key: string]: string;
  };
}

export const Left = transitionListener(
  class Left extends React.Component<LeftProps & WrapperChildProps & React.HTMLAttributes<HTMLElement>, {}> {
    public static displayName = "VerticalTabs.Left";
    public static propTypes = { children: PropTypes.func.isRequired };
    public static defaultProps = { styles: css };
    private animationId?: number;
    private animating = false;
    private scrollingIntoSection = false; // See `componentWillReceiveProps`
    private element: HTMLDivElement | null = null; // container HTMLElement
    private sections: HTMLElement[] = []; // section HTMLElements
    private sectionOffsets: number[] = [0]; // actual offsetTop of each section
    private activeOffsets: number[] = []; // scrollTop at which each section should be considered active
    private clientTop: number = 0; // container’s distance from the top of the viewport
    private offsetHeight: number = 0; // container’s offsetHeight
    private scrollHeight: number = 0; // container’s scrollHeight

    private get maxScrollTop() {
      return this.scrollHeight - this.offsetHeight;
    }

    private get activeOffsetRatio() {
      return this.maxScrollTop / this.scrollHeight;
    }

    private get scrollPaneTop() {
      if (this.element && this.element.firstChild) {
        return (this.element.firstChild as HTMLDivElement).getBoundingClientRect().top - this.clientTop;
      }
      return 0;
    }

    // Debounce, and eventually run with the smallest index from all pending calls
    private onChangeSectionHeight = debounce<number, number>(
      (index?: number) => {
        // Debouncing introduces the possibility that the component will be unmounted before the function runs.
        // If that happens, `this.element` will be undefined, and there’s no point in continuing here.
        if (this.element && index != null) {
          this.sections.slice(index + 1).forEach((s, i) => {
            // recalculating offset should consider current scroll position
            this.sectionOffsets[i + index + 1] = s ? s.getBoundingClientRect().top - this.scrollPaneTop : 0;
          });

          this.recalculateOffsets();
          this.onScroll();
        }
      },
      250,
      (x, y) => Math.min(x, y)
    );

    private onScroll = () => {
      if (!this.animating) {
        const activeSection = this.element && Math.max(0, sortedIndex(this.activeOffsets, this.element.scrollTop) - 1);
        if (activeSection != null && activeSection !== this.props.activeTab) {
          this.scrollingIntoSection = true; // See `componentWillReceiveProps`
          if (this.props.onScrollIntoSection) {
            this.props.onScrollIntoSection(activeSection);
          }
        }
      }
    };

    private recalculateOffsets = () => {
      if (this.element) {
        this.scrollHeight = this.element.scrollHeight;
        this.offsetHeight = this.element.offsetHeight;
        this.activeOffsets = this.sectionOffsets.map((o) => o * this.activeOffsetRatio);
      }
    };

    private onRenderSection = (section: HTMLElement, index: number) => {
      this.sections[index] = section;
    };

    private scroll = (to: number, duration: number) => {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }

      if (this.element) {
        const start = this.element.scrollTop;
        const steps = Math.round((duration / 1000) * 60); // 60 fps
        this.animating = true;
        let i = 0;

        const step = () => {
          this.element!.scrollTop = easeOutCubic(i++, start, to, steps);
          if (i < steps) {
            this.animationId = requestAnimationFrame(step);
          } else {
            this.animating = false;
          }
        };

        this.animationId = requestAnimationFrame(step);
      }
    };

    public componentDidEnter() {
      window.addEventListener("resize", this.recalculateOffsets);
      // calculating initial offset from scroll pane to container (~10px)
      if (this.element) {
        this.clientTop =
          (this.element.firstChild as HTMLDivElement).getBoundingClientRect().top - this.element.getBoundingClientRect().top;
      }
      this.onChangeSectionHeight(0);
    }

    public UNSAFE_componentWillReceiveProps(nextProps: WrapperChildProps) {
      if (nextProps.activeTab !== this.props.activeTab || nextProps.forceScrollId !== this.props.forceScrollId) {
        // `activeTab` can change for two reasons:
        // 1) this element scrolled into a new section (see `onScroll`), or
        // 2) a tab was clicked.
        // If it’s #2, we want to scroll into the section that was just clicked.
        // If it’s #1, we don’t want to do anything. So, the variable
        // `scrollingIntoSection` is maintained in order to tell the difference.
        if (!this.scrollingIntoSection) {
          const scrollTo =
            nextProps.activeTab != null
              ? Math.max(0, Math.min(this.sectionOffsets[nextProps.activeTab] + SCROLL_TO_OFFSET, this.maxScrollTop))
              : null;
          if (scrollTo !== null) {
            this.scroll(scrollTo, parseInt(this.props.styles!.transitionDuration, 10));
          }
        } else {
          this.scrollingIntoSection = false;
        }
      }
    }

    public shouldComponentUpdate(nextProps: WrapperChildProps) {
      return !shallowEqual(omit(nextProps, ignoredProps), omit(this.props, ignoredProps));
    }

    public componentWillUnmount() {
      window.removeEventListener("resize", this.recalculateOffsets);
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
    }

    public render() {
      const { className, styles, children, ...props } = this.props;
      const passthrough = omit(props, ignoredProps);
      return (
        <div ref={(x) => (this.element = x)} className={[className, styles!.left].join(" ")} onScroll={this.onScroll} {...passthrough}>
          {children &&
            children({
              onChangeHeight: this.onChangeSectionHeight,
              onRender: this.onRenderSection,
            })}
        </div>
      );
    }
  }
);
