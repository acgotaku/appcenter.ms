import { IconName, StatusIconState } from "@lib/constants";
import { IAHBuild, BuildStatus, BuildResult } from "@root/data/build";

export namespace BuildStatusIconState {
  export function forBuild(build: IAHBuild | undefined): StatusIconState {
    if (!build) {
      return StatusIconState.None;
    }

    switch (build.status) {
      case BuildStatus.Completed:
        {
          switch (build.result) {
            case BuildResult.Succeeded:
            case BuildResult.PartiallySucceeded:
              return StatusIconState.Succeeded;
            case BuildResult.Failed:
              return StatusIconState.Failed;
            case BuildResult.Canceled:
              return StatusIconState.Canceled;
          }
        }
        break;
      case BuildStatus.InProgress:
        return StatusIconState.InProgress;
      case BuildStatus.Queued:
        return StatusIconState.Queued;
      case BuildStatus.Cancelling:
        return StatusIconState.Canceled;
    }

    return StatusIconState.None;
  }

  export function toIconName(state: StatusIconState): IconName {
    if (!state) {
      return IconName.StatusEmpty;
    }

    switch (state) {
      case StatusIconState.Queued:
        return IconName.StatusQueued;
      case StatusIconState.InProgress:
        return IconName.StatusRunning;
      case StatusIconState.Canceled:
        return IconName.StatusNone;
      case StatusIconState.Failed:
        return IconName.StatusFailed;
      case StatusIconState.Succeeded:
        return IconName.StatusPassed;
      case StatusIconState.Distributed:
        return IconName.StatusPassed;
      case StatusIconState.Error:
        return IconName.StatusError;
      default:
        return IconName.StatusEmpty;
    }
  }

  export function toCommitIconName(state: StatusIconState, hasDifferentStatus: boolean): IconName {
    if (!state || !hasDifferentStatus) {
      return IconName.StatusCommit;
    }

    switch (state) {
      case StatusIconState.Queued:
        return IconName.StatusCommitQueued;
      case StatusIconState.InProgress:
        return IconName.StatusCommitRunning;
      case StatusIconState.Canceled:
        return IconName.StatusCommitNone;
      case StatusIconState.Failed:
        return IconName.StatusCommitFailed;
      case StatusIconState.Succeeded:
        return IconName.StatusCommitBuilt;
      case StatusIconState.Error:
        return IconName.StatusCommitCrashed;
      default:
        return IconName.StatusCommitEmpty;
    }
  }
}
