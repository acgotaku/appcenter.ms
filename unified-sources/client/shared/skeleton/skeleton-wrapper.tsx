import * as React from "react";
import * as md5 from "md5";
import { safeLocalStorage } from "@root/lib/utils/safe-local-storage";
import { PathContext } from "@root/shared/path";

export interface SkeletonWrapperProps {
  /** Whether data is currently being fetched. */
  loading: boolean;
  /**
   * Represents the results of a request for data after it has been resolved.
   * Used to guess whether and how many results are likely to be loaded during
   * the next request. If fetching a collection of data, provide the length of
   * the array fetched. If fetching a single object, provide `true` to indicate
   * that meaningful data was present; false to indicate otherwise.
   */
  results?: number | boolean;
  /**
   * SkeletonWrapper will always use a hash of the path of the page that it’s
   * rendered on as a key in localStorage, but if you need to distinguish between
   * two SkeletonWrappers that share the same path, you can add an additional
   * part to the key of one or both SkeletonWrappers with `id`.
   */
  id?: string;
  /**
   * A render function for the UI that will either display skeletons or be hidden.
   * The most recent value of `results` from localStorage, if a number, will be
   * provided on an object argument as `estimatedLength`.
   */
  children: JSX.Element | ((hints: { estimatedLength: number }) => JSX.Element);
}

/**
 * Wraps a section of UI that might display skeleton UI while loading.
 * SkeletonWrapper will not render anything while loading unless it thinks
 * there’s a high chance that data will be displayed after loading (as opposed
 * to an empty state). It saves a key to localStorage with the status of the
 * most recent data loaded for the page where it’s rendered. If the most recent
 * call had data, skeletons will be displayed. If the most recent call resulted
 * in no data (an error or empty set of data was returned), nothing will be
 * displayed. If there was no recent call status in localStorage, nothing will
 * be displayed.
 */
export class SkeletonWrapper extends React.Component<SkeletonWrapperProps> {
  public context!: string;
  static contextType = PathContext;
  static defaultProps = {
    appendKey: "",
  };

  private get localStorageKey(): string {
    return `sw:${md5(this.context + this.props.id)}`;
  }

  private get estimatedLength(): number {
    const lastResults = safeLocalStorage.getItem(this.localStorageKey);
    if (lastResults) {
      let count: number | undefined;
      try {
        count = parseInt(lastResults, 10);
      } catch {
        // stupid linter
      }
      return typeof count === "number" ? count : 1;
    }

    return 0;
  }

  componentDidUpdate(prevProps: SkeletonWrapperProps) {
    if (!this.props.loading) {
      if (prevProps.loading || prevProps.results !== this.props.results) {
        const { results } = this.props;
        safeLocalStorage.setItem(this.localStorageKey, (results || "0").toString());
      }
    }
  }

  render() {
    const { loading, children } = this.props;
    const { estimatedLength } = this;
    return !loading || estimatedLength ? (typeof children === "function" ? children({ estimatedLength }) : children) || null : null;
  }
}
