import * as React from "react";
import { reaction, Reaction } from "mobx";

export interface AutoFetchOptions {
  /**
   * The name of the method to be called on the component instance when data needs to be fetched.
   * Defaults to 'fetchData'.
   **/
  methodName?: string;
  /**
   * Whether to track observables accessed inside the provided method and re-run why they change.
   * If your component is an `@observer`, props and state will be observables that can be tracked here.
   * Useful if you want to refetch data based on, e.g., a URL param in `this.props.params`.
   * Defaults to true.
   **/
  rerunOnObservableChanges?: boolean;
  /**
   * By default, autoFetch will throw an error if you try to access the component’s `props` or
   * `state` directly in the fetch method, because changes to these are not granular, so any update
   * will re-trigger the fetch method. In almost every case, you intend to observe a particular
   * value from props or state instead of the whole object. The easiest way to do so is to create
   * one or more computed properties that return a value from `this.props` or from `this.state`.
   * In the unlikely event that you do want to observe props or state as a whole, you can enable
   * this flag to prevent the error from being thrown.
   **/
  allowDirectAccessToPropsAndState?: boolean;
}

export interface AutofetchStore {
  getGlobalCacheKey(): any;
}

/**
 * Automatically calls a method on the decorated component instance during `componentWillMount`,
 * when a store’s global cache key changes, and/or when the observables accessed inside that method
 * change. Use to fetch the required data for a page, and to re-fetch automatically when the
 * parameters that define the scope of that data change.
 * @param store The data store to watch for global cache key changes. Can be omitted with `null` if you don’t have a store, and are only using the decorator to track observable changes.
 * @param options Allows you to customize the name of the method that gets called and whether to re-run on observable changes.
 *
 * @example
 * import { expr } from 'mobx-utils';
 * import { crashStore } from '@root/data/crashes';
 *
 * @autofetch(crashStore)
 * @observer
 * export class Crashes extends React.Component<RouteComponentProps<any, any>, {}> {
 *   fetchData() {
 *     crashStore.fetchAll({ groupId: expr(() => this.props.params.group_id) });
 *   }
 * }
 */
export const autofetch = (store?: AutofetchStore, options: AutoFetchOptions = {}) => (WrappedComponent: React.ComponentClass<any>) => {
  const displayName = WrappedComponent.displayName || WrappedComponent.name;
  if (!WrappedComponent["isMobXReactObserver"]) {
    throw new Error(
      `Invariant violation: \`@autofetch\` was used to decorate \`${displayName}\`, ` +
        `but \`${displayName}\` is not decorated with \`@observer\` (or another decorator ` +
        `prevented autofetch from detecting it). Ensure that \`${displayName}\` is an ` +
        `observer, or if it already is, move \`@autofetch\` down to be the decorator ` +
        `immediately above \`@observer\`.`
    );
  }

  return class AutoFetchWrapper extends WrappedComponent {
    public static displayName = displayName;
    private methodReactionDisposer?: Function;
    private cacheReactionDisposer?: Function;

    public UNSAFE_componentWillMount() {
      const { methodName = "fetchData", rerunOnObservableChanges = true } = options;

      if (typeof super["UNSAFE_componentWillMount"] === "function") {
        super["UNSAFE_componentWillMount"]!.call(this);
      }

      const methodType = typeof this[methodName];
      if (methodType === "function") {
        // Re-run any time any of the parameters accessed within the fetch method.
        if (rerunOnObservableChanges) {
          const methodReaction = new Reaction(`${AutoFetchWrapper.displayName}.${methodName}()`, () => {
            methodReaction.track(this[methodName].bind(this));
            if (
              process.env.NODE_ENV !== "production" &&
              !options.allowDirectAccessToPropsAndState &&
              methodReaction.observing.find((o) => o.name === "reactive props" || o.name === "reactive state")
            ) {
              throw new Error(
                `Invariant violation: ${methodReaction.name} is tracking \`this.props\` or \`this.state\`. ` +
                  `You almost definitely meant to track a specific property from props or state, not the objects ` +
                  `as a whole. The easiest way to do so is to move accessors of \`this.props\` and \`this.state\` ` +
                  `to computed properties. See https://aka.ms/hfpnlz for details.`
              );
            }
          });

          methodReaction.runReaction();
          this.methodReactionDisposer = methodReaction.getDisposer();
        } else {
          // Call the method once.
          this[methodName].call(this);
        }

        // Re-run any time the global cache key of the store changes.
        // The setTimeout ensures that the cache gets cleared by the store before running again.
        if (store) {
          this.cacheReactionDisposer = reaction(
            () => store.getGlobalCacheKey && store.getGlobalCacheKey(),
            () => setTimeout(() => this[methodName].call(this))
          );
        }
      } else {
        throw new Error(
          `${displayName} expected \`${methodName}\` to be a function, but was ${
            this[methodName] ? methodType : `\`${this[methodName]}\``
          }.`
        );
      }
    }

    public componentWillUnmount() {
      if (this.methodReactionDisposer) {
        this.methodReactionDisposer();
      }
      if (this.cacheReactionDisposer) {
        this.cacheReactionDisposer();
      }

      if (typeof super["componentWillUnmount"] === "function") {
        super["componentWillUnmount"]!.call(this);
      }
    }
  };
};
