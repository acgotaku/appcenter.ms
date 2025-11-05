import * as React from "react";
import { pageTimerContextTypes, PageTimerContext } from "./context";

export interface ReporterProps {
  path: string;
  loading: boolean;
  children?: never;
}

export class Reporter extends React.Component<ReporterProps> {
  public static contextTypes = pageTimerContextTypes;
  public context!: PageTimerContext;

  public componentDidUpdate(prevProps: ReporterProps) {
    if (this.context.pageTimerContext) {
      if (!prevProps.loading && this.props.loading) {
        this.context.pageTimerContext.reportLoading(this.props.path);
      } else if (prevProps.loading && !this.props.loading) {
        this.context.pageTimerContext.reportLoaded(this.props.path);
      } else if (prevProps.path !== this.props.path) {
        if (this.props.loading) {
          this.context.pageTimerContext.reportCanceled(this.props.path);
        } else {
          this.context.pageTimerContext.reportLoaded(this.props.path);
        }
      } else {
        // Everything is the same, which means we were already rendered and loaded.
        // That probably means that the page rerendered for some boring reason,
        // but it could have been because of a route change, so we’ll report that
        // we finished loading. If it was because of a route change, the collector
        // will have started measurements, and will appreciate this callback.
        // Otherwise, it will just ignore it.
        this.context.pageTimerContext.reportLoaded(this.props.path);
      }
    }
  }

  public componentDidMount() {
    const time = Date.now();
    // Give requests a brief moment to start, e.g. if they’re fired in a
    // sibling’s `componentDidMount`, the `loading` prop will appear `false`
    // here, but will be `true` inside the `setTimeout`.
    if (!this.props.loading) {
      setTimeout(() => {
        if (this.context.pageTimerContext) {
          if (this.props.loading) {
            this.context.pageTimerContext.reportLoading(this.props.path, time);
          } else {
            this.context.pageTimerContext.reportLoaded(this.props.path, time);
          }
        }
      }, 0);
    } else {
      this.context.pageTimerContext.reportLoading(this.props.path, time);
    }
  }

  public componentWillUnmount() {
    if (this.context.pageTimerContext) {
      if (this.props.loading) {
        this.context.pageTimerContext.reportCanceled(this.props.path);
      }
      this.context.pageTimerContext.reporterUnmounted(this.props.path);
    }
  }

  public render() {
    return null;
  }
}
