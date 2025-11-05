import * as React from "react";
import { observer } from "mobx-react";
import { Dialog, TextArea, PrimaryButton, ClickableIcon, IconName } from "@root/shared";
import { npsSurveyStore } from "../../stores/nps/nps-survey-store";
import { NpsRating } from "../../shared/nps-rating/nps-rating";
import { optimizelyStore } from "@root/stores/optimizely-store";
import { OptimizelyFeatureNames } from "@lib/common-interfaces";

const classNames = require("classnames");
const styles = require("./nps-survey.scss");

export interface NpsSurveyProps {
  fadeIn?: boolean;
}

@observer
export class NpsSurvey extends React.Component<NpsSurveyProps, {}> {
  private _textArea: any;
  public static displayName: string = "NpsSurvey";

  public static defaultProps: NpsSurveyProps = {
    fadeIn: true,
  };

  public componentWillUnmount() {
    npsSurveyStore.resetSurvey();
  }

  public render() {
    const { fadeIn } = this.props;
    const { initProps } = window as any;
    const { csrfToken } = initProps;

    if (!optimizelyStore.isFeatureEnabled(OptimizelyFeatureNames.portal_show_nps_survey)) {
      return null;
    }

    return (
      <Dialog
        className={classNames(styles.large, { [styles["fade-in"]]: fadeIn })}
        visible={npsSurveyStore.isSurveyVisible}
        onRequestClose={() => this._onRequestClose()}
        title={`How likely are you to recommend ${npsSurveyStore.beaconName} to friends or colleagues?`}
      >
        <div className={classNames(styles.hidden, { [styles["message-container"]]: npsSurveyStore.isSurveyComplete })}>
          <div className={styles["message"]}>Thanks for your feedback!</div>
        </div>

        <div className={classNames({ [styles["not-visible"]]: npsSurveyStore.isSurveyComplete })}>
          <ClickableIcon
            className={styles["close"]}
            icon={IconName.Close}
            // @ts-ignore
            onClick={() => npsSurveyStore.rejectSurvey(csrfToken) && this._textArea.resetValue()}
          />

          <div className={styles["question"]} id="q1-label">
            How likely are you to recommend <span>{npsSurveyStore.beaconName} to friends or colleagues?</span>
          </div>
          <NpsRating
            aria-labelledby="q1-label"
            value={npsSurveyStore.selectedRating!}
            onChange={(rating: number) => this._onRatingChange(rating)}
          />
          <div className={styles["comments"]}>
            <TextArea
              placeholder="Why do you feel this way?"
              onChange={(event) => this._onCommentsChange(event)}
              ref={(c) => (this._textArea = c)}
            />
          </div>
          <div className={styles["dialog-buttons"]}>
            <PrimaryButton
              disabled={this._isSubmitDisabled()}
              // @ts-ignore
              onClick={() => npsSurveyStore.acceptSurvey(csrfToken) && this._textArea.resetValue()}
            >
              Submit
            </PrimaryButton>
          </div>
        </div>
      </Dialog>
    );
  }

  /**
   * Handle the onChange for the ratings Select input.
   */
  private _onRatingChange(value: number): void {
    npsSurveyStore.setSelectedRating(value);
    setTimeout(() => this._textArea.textarea.focus(), 100);
  }

  /**
   * Handle the onChange for  comments TextArea
   */
  private _onCommentsChange(event: React.FormEvent<HTMLTextAreaElement>): void {
    const comments = event.currentTarget.value;
    npsSurveyStore.setComments(comments);
  }

  /**
   * Handle the action of closing the dialog when clicked on the backdrop.
   */
  private _onRequestClose(): void {
    if (npsSurveyStore.isSurveyComplete) {
      npsSurveyStore.setSurveyVisible(false);
    }
  }

  private _isSubmitDisabled(): boolean {
    return npsSurveyStore.selectedRating === null || npsSurveyStore.selectedRating === undefined || !npsSurveyStore.comments;
  }
}
