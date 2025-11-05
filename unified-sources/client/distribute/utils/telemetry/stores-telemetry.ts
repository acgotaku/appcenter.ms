import { StoresTelemetryProperty } from "./stores-telemetry-property";
import { logger } from "@root/lib/telemetry";

export class StoresTelemetry {
  public static track(event: string, storeType?: string, storeTrack?: string, otherProps?: any) {
    let commonProps: StoresTelemetryProperty = { type: storeType };
    if (storeTrack) {
      commonProps = Object.assign(commonProps, { track: storeTrack });
    }
    const props: StoresTelemetryProperty = Object.assign(commonProps, otherProps);
    logger.info(event, props);
  }
}
