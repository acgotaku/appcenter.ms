import * as React from "react";
import * as Fuse from "fuse.js";
import * as memoize from "memoizee";
import { Changeable } from "../common-interfaces";
import { requestIdleCallback } from "@root/lib/utils/request-idle-callback";
import { debounce } from "lodash";

export interface SearchControllerProps<T extends object> extends Partial<Changeable<HTMLInputElement>> {
  /** The array of items to search. */
  items: T[];
  /** The key names whose values should be compared with the search query. */
  searchKeys: Extract<keyof T, string>[];
  /**
   * A render function that receives the filtered results and returns UI to be rendered with those results.
   * @param inputProps `value` and `onChange` for the input field that should contain the search query.
   * @param results The results filtered from `items`.
   */
  children(controls: { inputProps: Changeable<HTMLInputElement>; searching: boolean; results: T[] }): JSX.Element;
}

export type SearchControllerState<T> = {
  value?: string;
  asyncResults: T[];
  searching: boolean;
};

/**
 * A state container for the interactive searching of a list. It takes an array of items to search
 * and a render function which is passed `value` and `onChange` to control a search input, and an
 * output array of filtered items. The filtered result is updated asynchronously to provide a more
 * responsive feel while typing in the input.
 *
 * @example
 * <SearchController items={users} searchKeys={['name', 'email']}>
 *   {({ inputProps, results }) => (
 *     <Input {...inputProps} />
 *     <Grid>
 *       {results.map((user) => <UserRow {...user} />)}
 *     </Grid>
 *   )}
 * </SearchController>
 */
export class SearchController<T extends object> extends React.Component<SearchControllerProps<T>, SearchControllerState<T>> {
  state = {
    value: this.isControlled ? undefined : "",
    asyncResults: this.props.items,
    searching: true,
  };

  private get isControlled() {
    return "value" in this.props;
  }

  private getValue(props: SearchControllerProps<T> = this.props, state: SearchControllerState<T> = this.state) {
    return this.isControlled ? props.value : state.value;
  }

  private get searchValue() {
    const value = this.getValue(this.props);
    return value && value.trim();
  }

  private onChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    if (!this.isControlled) {
      this.setState({ value: event.target.value, searching: true });
    }

    if (this.props.onChange) {
      this.props.onChange(event);
    }
  };

  private setResults = debounce(() => {
    const { items, searchKeys } = this.props;
    this.setState({
      asyncResults: this.searchValue ? this.getFuse(items, searchKeys).search(this.searchValue) : items,
      searching: false,
    });
  }, 250);

  componentDidMount() {
    this.setResults();
  }

  componentDidUpdate(prevProps: SearchControllerProps<T>, prevState: SearchControllerState<T>) {
    const { items, searchKeys } = this.props;
    if (this.getValue(prevProps, prevState) !== this.getValue() || prevProps.items !== items || prevProps.searchKeys !== searchKeys) {
      requestIdleCallback(
        () => {
          this.setResults();
        },
        {
          timeout: 100,
        }
      );
    }
  }

  private getFuse = memoize(
    (items: SearchControllerProps<T>["items"], searchKeys: SearchControllerProps<T>["searchKeys"]) => {
      return new Fuse(items, {
        shouldSort: false,
        threshold: 0.2,
        distance: 200, // a distance of 200 means the matching algorithm will give-up after (threshold * distance) 40 characters
        findAllMatches: true,
        keys: searchKeys,
        tokenize: true,
      });
    },
    { max: 1 }
  );

  render() {
    const { children } = this.props;
    const { searching } = this.state;
    const { onChange } = this;
    const value = this.getValue();
    return children({
      inputProps: { value: value!, onChange },
      searching,
      results: this.state.asyncResults,
    });
  }
}
