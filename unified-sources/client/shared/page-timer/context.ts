import * as PropTypes from "prop-types";

export interface PageTimerContext {
  pageTimerContext: {
    reportLoading: (path: string, time?: number) => void;
    reportLoaded: (path: string, time?: number) => void;
    reportCanceled: (path: string) => void;
    reporterUnmounted: (path: string) => void;
  };
}

export const pageTimerContextTypes = {
  pageTimerContext: PropTypes.any,
};
