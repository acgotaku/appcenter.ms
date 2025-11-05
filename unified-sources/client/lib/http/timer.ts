import { metrics, logger } from "../telemetry";

/**
 * Contract for a Lap used by the Timer.
 */
export interface Lap {
  startInMs: number;
  endInMs?: number;
}

export interface RequestTelemetryProperties {
  method: string;
  routePath: string;
  statusCode: string;
  duration: number;
  correlationId: string;
}

/*
 * Times an action which returns a Promise
 */
export class Timer {
  /**
   * Time the given action.
   * Action should be a function returning a Promise.
   */
  public static startLap(): Lap {
    return { startInMs: new Date().getTime() };
  }

  public static endLapAndTrack(lap: Lap, properties: RequestTelemetryProperties): void {
    lap.endInMs = new Date().getTime();

    const duration = lap.endInMs - lap.startInMs;
    const name = `${properties.method} ${properties.routePath}`;

    logger.info("outbound-request-log", {
      name,
      statusCode: properties.statusCode,
      duration,
      correlationId: properties.correlationId,
    });

    metrics.emitMetric("portal-outbound-request-duration", duration, { name, statusCode: properties.statusCode });
  }
}
