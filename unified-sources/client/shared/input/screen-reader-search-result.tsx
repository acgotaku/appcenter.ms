import * as React from "react";
import { debounce } from "lodash";
import { LiveRegion } from "@root/shared";
const css = require("./input.scss");
import { t } from "@root/lib/i18n";

export interface ScreenReaderSearchResultProps {
  resultsCount?: number;
  active?: boolean;
}

export interface ScreenReaderSearchResultState {
  screenReaderText: string;
}

export class ScreenReaderSearchResult extends React.Component<ScreenReaderSearchResultProps, ScreenReaderSearchResultState> {
  public static defaultProps = {
    resultsCount: 0,
    active: true,
  };

  public state = {
    screenReaderText: "",
  };

  public componentDidUpdate(prevProps: ScreenReaderSearchResultProps) {
    const { resultsCount: resultsPrev } = prevProps;
    const { resultsCount } = this.props;
    if ((resultsCount || resultsCount === 0) && resultsPrev !== resultsCount) {
      this.setState({ screenReaderText: "" });
      this.updateScreenReaderText(resultsCount);
    }
  }

  public componentWillUnmount() {
    this.updateScreenReaderText.cancel();
  }

  private updateScreenReaderText = debounce((results: number): void => {
    const screenReaderText = !!results
      ? t("common:input.search.resultsAnnouncement", { count: results })
      : t("common:input.search.noResultsAnnouncement");
    this.setState({ screenReaderText });
  }, 2000);

  public render() {
    const { screenReaderText } = this.state;
    const { active } = this.props;

    return (
      <LiveRegion active={active && screenReaderText.length !== 0} role="alert" className={css["searchbar-sr-text"]}>
        {screenReaderText}
      </LiveRegion>
    );
  }
}
