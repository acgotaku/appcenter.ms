import * as React from "react";
import { omit, noop } from "lodash";
import { InputProps, InputState, Input } from "./input";
import { t } from "@root/lib/i18n";
import { ScreenReaderSearchResult } from "./screen-reader-search-result";

export interface SearchInputProps extends InputProps {
  resultsCount?: number;
  setRef?: React.RefObject<Input<any>>;
}

/**
 * @deprecated
 * Use SearchInput or BorderlessSearchInput, typically in the header area of the Card
 * that contains the content you’re searching.
 */
export class SearchInput extends React.Component<SearchInputProps, InputState> {
  public static displayName = "SearchInput";
  public static defaultProps = {
    resultsCount: 0,
    setRef: noop,
  };

  public render() {
    const { setRef, resultsCount } = this.props;
    const passthrough = omit(this.props, "setRef", "resultsCount");

    return (
      <>
        <Input
          aria-label={t("common:input.search.searchApps")}
          role="search"
          data-test-id="search-text-box"
          ref={setRef as any}
          {...passthrough}
        />
        <ScreenReaderSearchResult resultsCount={resultsCount} />
      </>
    );
  }
}
