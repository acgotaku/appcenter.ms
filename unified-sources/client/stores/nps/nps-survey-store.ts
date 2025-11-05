import { safeLocalStorage } from "@root/lib/utils/safe-local-storage";

declare const window: any;

import { observable, action } from "mobx";
import { trim, noop } from "lodash";
import { IUser, OptimizelyFeatureNames } from "@lib/common-interfaces";
import { portalServer } from "../../lib/http";
import { NpsSurveyCheckStore } from "./nps-survey-check-store";
import { logger } from "../../lib/telemetry";
import { optimizelyStore } from "../optimizely-store";
import { NpsSurveyStatus } from "@lib/constants/nps";
import { differenceInHours } from "date-fns";

export interface INpsSurveyResponse {
  nextSurveyCheck: number;
}

export interface NpsSurveyStatusResponse {
  nextSurveyCheck: string;
}

export interface NpsSurveyProps {
  user: IUser;
  numOfApps: number;
}

export interface NpsSurveyRatingOption {
  text: string;
  value: string;
}

export class NpsSurveyStore {
  @observable
  private _isSurveyVisible: boolean = false;

  @observable
  private _selectedRating?: number;

  @observable
  private _isSurveyComplete: boolean = false;

  @observable
  private _comments: string = "";

  private _user?: IUser;
  private _numOfApps?: number;
  private _beaconName: string = "App Center";

  private _npsSurveyCheckStore = new NpsSurveyCheckStore();

  constructor() {
    this.resetSurvey();
  }

  get isSurveyVisible(): boolean {
    return this._isSurveyVisible;
  }

  @action
  public setSurveyVisible(value: boolean): void {
    this._isSurveyVisible = value;
  }

  get selectedRating(): number | undefined {
    return this._selectedRating;
  }

  get isSurveyComplete(): boolean {
    return this._isSurveyComplete;
  }

  @action
  public setSurveyComplete(value: boolean): void {
    this._isSurveyComplete = value;
  }

  @action
  public setSelectedRating(value: number) {
    this._selectedRating = value;
  }

  get beaconName(): string {
    return this._beaconName;
  }

  @action
  public setComments(value: string) {
    this._comments = value;
  }

  get comments(): string {
    return trim(this._comments || "");
  }

  private npsLastCheckDateLocalStorageKey = "NpsLastCheckDate";
  set npsLastCheckDateFromLocalStorage(value: Date | null) {
    safeLocalStorage.setItem(this.npsLastCheckDateLocalStorageKey, value ? value.toISOString() : "");
  }

  get npsLastCheckDateFromLocalStorage(): Date | null {
    const result = safeLocalStorage.getItem(this.npsLastCheckDateLocalStorageKey);
    return result ? new Date(result) : null;
  }

  /**
   * Tries to show the nps survey.
   *
   * To successfully show the survey, user should satisfy two conditions -
   * 1. User should have his/her next_nps_survey_date date in the past relative to "Today".
   * 2. User should have atleast 9 active days (active sessions) out of the last 28 days.
   *
   * If the criteria is satisfied, the survey is shown.
   *
   * If survey isn't shown, the server responds with a new `next_nps_survey_date`.
   * User's profile is updated with this new `next_nps_survey_date`.
   */
  @action
  public tryShowSurvey(surveyProps: NpsSurveyProps): void {
    const isInactive = !optimizelyStore.isFeatureEnabled(OptimizelyFeatureNames.portal_show_nps_survey);
    if (isInactive) {
      return;
    }

    if (this._isSurveyVisible) {
      console.error("Cannot show two Nps surveys at once.");
      return;
    }

    if (!surveyProps.user) {
      console.error("User is not provided.");
      return;
    }

    // Reset the survey
    this.resetSurvey();

    // Set survey properties
    this._user = surveyProps.user;
    this._numOfApps = surveyProps.numOfApps;

    if (this._npsSurveyCheckStore.isTodayGreaterThanNextSurveyCheckDate(this._user?.next_nps_survey_date)) {
      this._checkUserAndDisplaySurvey(this._user);
    } else {
      logger.info("NpsSurveyCheck", {
        status: "check-date-in-future",
        nextCheck: this._user.next_nps_survey_date,
      });
    }
  }

  /**
   * Reject the survey.
   */
  public rejectSurvey(csrfToken: string): Promise<void> {
    this.setSurveyVisible(false);

    return this._respondToSurvey(this._user!, csrfToken, NpsSurveyStatus.REJECTED)
      .then((response) => {
        logger.info("NpsSurveyRejected", {
          npsBeaconName: this._beaconName,
          nextCheck: response.nextSurveyCheck,
          optimizelyEnabledFeatures: this.optimizelyEnabledFeatures,
        });
      })
      .catch(noop);
  }

  /**
   * Accept the survey.
   */
  public acceptSurvey(csrfToken: string): Promise<void> {
    this.setSurveyComplete(true);

    return this._respondToSurvey(this._user!, csrfToken, NpsSurveyStatus.ACCEPTED)
      .then((response) => {
        const rating = this._selectedRating && this._selectedRating > 10 ? 10 : this._selectedRating;

        const props = {
          npsBeacon: this._beaconName,
          comment: this.comments,
          optimizelyEnabledFeatures: this.optimizelyEnabledFeatures,
          rating,
          apps: this._numOfApps,
          nextCheck: response.nextSurveyCheck,
        };

        // Track Nps survey data and an accepted event.
        logger.info("NpsSurveyData", props);
      })
      .catch(noop)
      .finally(() => {
        setTimeout(() => this.setSurveyVisible(false), 1500);
      });
  }

  private get optimizelyEnabledFeatures(): string {
    const enabledFeatures = optimizelyStore.getEnabledFeatures();
    if (Array.isArray(enabledFeatures)) {
      return enabledFeatures.join(", ");
    }
    return "";
  }

  /**
   * Check the user for eligibility and display the survey if eligible.
   */
  private _checkUserAndDisplaySurvey(user: IUser): void {
    // stop gap to avoid showing the survey more than once in all browser sessions using localStorage
    if (
      this.npsLastCheckDateFromLocalStorage &&
      Math.abs(differenceInHours(new Date(), this.npsLastCheckDateFromLocalStorage)) <= 24
    ) {
      logger.info("NpsSurveyCheck", {
        status: "skip-local-24-hours",
        nextCheck: this._user?.next_nps_survey_date,
      });
      console.log("Not showing NPS. Already showed once in the last 24 hours.");
      return;
    }

    this.npsLastCheckDateFromLocalStorage = new Date();

    this._npsSurveyCheckStore
      .checkUser()
      .then((response) => {
        const surveyDateProps = { nextCheck: response.nextSurveyCheck, lastCheck: user.next_nps_survey_date };
        // Show if we can.
        if (response.canShowSurvey) {
          this.setSurveyVisible(true);
        }
        logger.info("NpsSurveyCheck", { ...surveyDateProps, status: response.canShowSurvey ? "show-survey" : "not-eligible" });
        // Update the nextSurveyCheck for the current user in the store.
        this._updateUserNextNpsSurveyCheck(user, response.nextSurveyCheck);
      })
      .catch(noop);
  }

  /**
   * Respond to the survey with the given status.
   */
  private _respondToSurvey(user: IUser, csrfToken: string, status: NpsSurveyStatus): Promise<NpsSurveyStatusResponse> {
    return portalServer
      .post<NpsSurveyStatusResponse>("/survey/status", {
        body: {
          status: status,

          // see: https://github.com/expressjs/csurf
          _csrf: csrfToken,
        },
        noBifrostToken: true,
      })
      .then((response: NpsSurveyStatusResponse) => {
        this._updateUserNextNpsSurveyCheck(user, response.nextSurveyCheck);
        return response;
      });
  }

  /**
   * Resets the survey data.
   */
  @action
  public resetSurvey(): void {
    this._user = undefined;
    this._numOfApps = undefined;
    this._comments = "";
    this._selectedRating = undefined;
    this._isSurveyVisible = false;
    this._isSurveyComplete = false;
    this._npsSurveyCheckStore = new NpsSurveyCheckStore();
  }

  /**
   * Updates the user's next_nps_survey_date to the given value
   */
  @action
  private _updateUserNextNpsSurveyCheck(user: IUser, nextSurveyCheck: string) {
    user.next_nps_survey_date = nextSurveyCheck;
  }
}

export const npsSurveyStore = new NpsSurveyStore();
