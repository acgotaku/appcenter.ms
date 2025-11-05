import * as React from "react";
import { withRouter, WithRouterProps } from "react-router";
import { PageTimerContext, pageTimerContextTypes } from "./context";
import { RouteUtils, metrics, logger } from "../../lib/telemetry";

const MEASURER_START_TIMEOUT = 1000;

export interface Measurement {
  timerId: NodeJS.Timer;
  startTime: number;
  measurerRegisteredTime?: number;
  state: "pending" | "completed" | "canceled";
}

@(withRouter as any)
export class Collector extends React.Component<Partial<WithRouterProps>> {
  public static displayName = "PageTimer.Collector";

  public static childContextTypes = pageTimerContextTypes;

  private measurements = new Map<string, Measurement>();

  private trackPage(props: WithRouterProps, renderTimeMs?: number, totalTimeMs?: number) {
    const { routes, location } = props;
    const routePath = RouteUtils.extractPathTempate(routes);
    const utmParams = Object.entries(props.location.query)
      .filter(([key, _]) => key.match(/^utm_/i))
      .reduce((utmParams, [key, value]) => ({ ...utmParams, [key]: value }), {});
    if (renderTimeMs) {
      logger.verbose(
        `PageTimer: Tracking page view for ${
          location.pathname
        } with ${renderTimeMs} ms of rendering time and ${totalTimeMs} ms of total time${
          Object.keys(utmParams).length > 0 ? ` and ${JSON.stringify(utmParams)} UTM parameters` : ""
        }`
      );

      logger.info("page-view", {
        routePath,
        wasCached: totalTimeMs === renderTimeMs,
        renderDuration: renderTimeMs,
        totalDuration: totalTimeMs || 0,
        ...utmParams,
      });

      metrics.emitMetric("portal-page-view-render-duration", renderTimeMs, { routePath });
      metrics.emitMetric("portal-page-view-total-duration", totalTimeMs || 0, { routePath });
    } else {
      logger.verbose(
        `PageTimer: Tracking page view for ${location.pathname} without duration data${
          Object.keys(utmParams).length > 0 ? ` and ${JSON.stringify(utmParams)} UTM parameters` : ""
        }`
      );

      logger.info("page-view", {
        routePath,
        ...utmParams,
      });
    }
  }

  private startMeasurement(props: WithRouterProps) {
    logger.verbose(`PageTimer: Starting measurements for ${props.location.pathname}`);
    this.measurements.set(props.location.pathname, {
      timerId: setTimeout(() => {
        logger.verbose(`PageTimer: Measurer never started for ${props.location.pathname}; will track page view without duration`);
        this.measurements.delete(props.location.pathname);
        this.trackPage(props);
      }, MEASURER_START_TIMEOUT),
      startTime: Date.now(),
      state: "pending",
    });
  }

  private endMeasurement = (path: string, endTime = Date.now()) => {
    const measurement = this.measurements.get(path);
    if (measurement && measurement.state === "pending") {
      clearTimeout(measurement.timerId);
      measurement.state = "completed";
      const renderDuration = (measurement.measurerRegisteredTime || endTime) - measurement.startTime;
      const totalDuration = endTime - measurement.startTime;
      this.trackPage(this.props as WithRouterProps, renderDuration, totalDuration);
    }
  };

  private cancelMeasurement = (path: string) => {
    const measurement = this.measurements.get(path);
    if (measurement) {
      measurement.state = "canceled";
      logger.verbose(`PageTimer: Canceled measurement for ${path}`);
    }
  };

  private unregisterReporter = (path: string) => {
    this.measurements.delete(path);
  };

  private delayTrackingUntilMeasurementFinished = (path: string, time = Date.now()) => {
    const measurement = this.measurements.get(path);
    if (measurement) {
      logger.verbose(`PageTimer: Measurer registered for ${path}`);
      measurement.measurerRegisteredTime = time;
      clearTimeout(measurement.timerId);
    }
  };

  public getChildContext(): PageTimerContext {
    return {
      pageTimerContext: {
        reportLoading: this.delayTrackingUntilMeasurementFinished,
        reportLoaded: this.endMeasurement,
        reportCanceled: this.cancelMeasurement,
        reporterUnmounted: this.unregisterReporter,
      },
    };
  }

  public componentDidMount() {
    this.startMeasurement(this.props as WithRouterProps);
  }

  public UNSAFE_componentWillUpdate(nextProps: WithRouterProps) {
    const { props } = this;
    if (props.location !== nextProps.location) {
      this.startMeasurement(nextProps);
    }
  }

  public render() {
    return this.props.children;
  }
}
