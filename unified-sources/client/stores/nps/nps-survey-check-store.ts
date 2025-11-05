import { NpsSurveyCheckResponse } from "@lib/common-interfaces";
import { portalServer } from "../../lib/http";
import { Utils } from "@root/lib/http/utils";

export class NpsSurveyCheckStore {
  /**
   * Checks to see if nextSurveyCheckDate is greater than today
   */
  public isTodayGreaterThanNextSurveyCheckDate(nextSurveyCheckDate?: string): boolean {
    if (!nextSurveyCheckDate) {
      return true;
    }

    const today = Date.now().valueOf();
    const nextSurveyCheck = new Date(nextSurveyCheckDate).valueOf();
    if (today < nextSurveyCheck) {
      return false;
    }

    return true;
  }

  /**
   * Evaluates whether the given user should be shown the NPS survey
   */
  public checkUser(): Promise<NpsSurveyCheckResponse> {
    return portalServer.get<NpsSurveyCheckResponse>("/can_show_survey", {
      noBifrostToken: true,
      params: { nocache: Utils.randomCacheBusterValue() },
    });
  }
}
