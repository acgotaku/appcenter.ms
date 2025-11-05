import { action, observable } from "mobx";

export enum BuildLogState {
  Pending,
  Interrupted,
  Completed,
  Failure,
}

interface BuildLogData {
  logLines: string[];
  state: BuildLogState;
}

/**
 * BuildLogsStore stores build logs from WebSocket connection
 */
export class BuildLogsStore {
  private readonly _buildLogs = observable.map<string, BuildLogData>({}, { deep: false });

  @action
  public appendBuildLog(buildId: number, logLines: string[]): void {
    if (!this._buildLogs.has(String(buildId))) {
      this._buildLogs.set(String(buildId), observable.object({ logLines: [], state: BuildLogState.Pending }, {}, { deep: false }));
    }
    const data = this._buildLogs.get(String(buildId));
    if (data) {
      data.logLines = data.logLines.concat(logLines);
    }
  }

  @action
  public setLogState(buildId: number, state: BuildLogState): void {
    if (!this._buildLogs.has(String(buildId))) {
      return;
    }
    const logData = this._buildLogs.get(String(buildId));
    if (logData) {
      logData.state = state;
    }
  }

  @action
  public assignBuildLog(buildId: number, logLines: string[], state: BuildLogState = BuildLogState.Completed): void {
    this.invalidateBuildLog(buildId);
    this.appendBuildLog(buildId, logLines);
    this.setLogState(buildId, state);
  }

  @action
  public invalidateBuildLog(buildId: number): void {
    this._buildLogs.delete(String(buildId));
  }

  public hasBuildLog(buildId: number): boolean {
    return this._buildLogs.has(String(buildId));
  }

  public getBuildLog(buildId: number): string[] {
    if (!this.hasBuildLog(buildId)) {
      return [];
    }
    const buildLog = this._buildLogs.get(String(buildId));
    return buildLog ? buildLog.logLines : [];
  }

  public isBuildLogCompleted(buildId: number): boolean | undefined {
    if (!this.hasBuildLog(buildId)) {
      return;
    }
    const buildLog = this._buildLogs.get(String(buildId));
    return buildLog && buildLog.state === BuildLogState.Completed;
  }

  public isBuildLogFailed(buildId: number): boolean | undefined {
    if (!this.hasBuildLog(buildId)) {
      return;
    }
    const buildLog = this._buildLogs.get(String(buildId));
    return buildLog && buildLog.state === BuildLogState.Failure;
  }

  public getLogState(buildId: number): BuildLogState | undefined {
    if (!this.hasBuildLog(buildId)) {
      return;
    }
    const buildLog = this._buildLogs.get(String(buildId));
    return buildLog && buildLog.state;
  }
}
