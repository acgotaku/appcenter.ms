import { logger } from "@root/lib/telemetry";
import { portalServer } from "@root/lib/http";

export class OptimizelyUpdater {
  public start() {
    const INTERVAL = 30 * 60 * 1000; // 30 minutes
    const DATAFILE_PATH = "/optimizely/datafile/main";
    window.setInterval(async () => {
      logger.info("optimizely/datafile/update-by-interval");
      try {
        const dataFile: object = await portalServer.get<object>(DATAFILE_PATH);
        if (dataFile && Object.keys(dataFile).length > 0) {
          (window as any).initProps.optimizelyDataFile = dataFile;
        }
      } catch (e: any) {
        logger.warn("Error when trying to update Optimizely data file by interval", e);
      }
    }, INTERVAL);
  }
}

export const optimizelyUpdater = new OptimizelyUpdater();
