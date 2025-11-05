//
// Abstract class and data structures for dealing with
// external data - data loaded asynchronously, where
// we need to track if it's been loaded, and if the load
// succeeded.
//
// External data is in one of three states:
//
//  - Pending: the data has been requested and we're waiting for a result
//  - Loaded: The data has been recieved and is available
//  - Failed: The retrieval has failed, error information is available.
//

import { observable, action, computed, runInAction } from "mobx";
import { noop } from "lodash";

export enum ExternalDataState {
  Idle,
  Pending,
  Loaded,
  Failed,
}

export interface ExternalData<T> {
  state: ExternalDataState;
  data?: T;
  error?: ExternalDataError;
}

export interface ExternalDataError extends Error {
  status?: number;
}

//
// ExternalDataStore is exposes a class with a 'state' field.
// The object looks like this in the various states:
//
// Pending: { state: 'pending' }
// Loaded:  { state: 'loaded', data: ... }
// Failed:  { state: 'failed', error: <JS Error object> }
//
/**
 * DO NOT USE THIS TYPE! This is a legacy class and should NOT be used for any new work. Your PR will be rejected if you create a new implementation of ExternalDataStore.
 *
 * Please contact the Core UX team on Slack (#appcenter-portal) if you have further questions.
 *
 * @deprecated
 * Use the Data Layer instead, more info here: https://dev.azure.com/msmobilecenter/Mobile-Center/_git/appcenter?path=%2Fux%2Fportal%2Fclient%2Fdata%2FREADME.md&version=GBmaster
 */
export abstract class DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<T> implements ExternalData<T> {
  @observable
  public state: ExternalDataState;

  @observable
  public data?: T;

  @observable
  public error?: ExternalDataError;

  constructor(initialState = ExternalDataState.Pending) {
    this.state = initialState;
  }

  @computed
  get isPending() {
    return this.state === ExternalDataState.Pending;
  }

  @computed
  get isLoaded() {
    return this.state === ExternalDataState.Loaded;
  }

  @computed
  get isFailed() {
    return this.state === ExternalDataState.Failed;
  }

  @action
  protected setState(state: ExternalDataState) {
    this.state = state;
  }

  /**
   * Optionaly convenience method for loading the data asynchronously and updating
   * the state correctly. Alternatively you can implement this logic yourself
   *
   * @param {Promise<T>} [dataPromise] The promise you want state updated for.
   * @param {Function} [transform] The function to pass the results of the Promise to.
   *   The return value of this function will be assigned to `data`.
   * @returns {Promise<T>}
   */
  @action
  protected load(dataPromise: Promise<T>, transform?: (result: T) => T): Promise<T> {
    this.state = ExternalDataState.Pending;
    this.data = undefined;
    this.error = undefined;
    return dataPromise
      .then((result: T) => {
        runInAction(() => {
          if (this.state === ExternalDataState.Pending) {
            if (transform) {
              this.data = transform(result);
            } else {
              this.data = result;
            }
            this.state = ExternalDataState.Loaded;
          }
        });

        return result;
      })
      .catch(
        action((err: Error) => {
          if (this.state === ExternalDataState.Pending) {
            this.state = ExternalDataState.Failed;
            this.error = err;
          }
          throw err;
        })
      );
  }

  /**
   * Alias of load() that does not return/throw
   *
   * Method load() mixes two patterns. It modifies observeable data but also returns/throws. Most of the
   * callers do not handle the response, resulting into unhandled rejections flooding our telemetry.
   *
   * Method loadVoid() wraps load() and does not return/throw.
   * We are migrating callers of load() one by one. Once everything is migrated, loadVoid() will become load().
   */
  protected loadVoid(dataPromise: Promise<T>, transform?: (result: T) => T): Promise<void> {
    return this.load(dataPromise, transform).then(noop).catch(noop);
  }

  /**
   * Optionaly convenience method for loading the data asynchronously and updating
   * the state correctly. Alternatively you can implement this logic yourself
   *
   * Differs from `load` in that it does not reset the state to Pending and clear the `data`.
   *
   * @param {Promise<T>} [dataPromise] The promise you want state updated for.
   * @param {Function} [transform] The function to pass the results of the Promise to.
   *   The return value of this function will be assigned to `data`.
   * @returns {Promise<T>}
   */
  @action
  protected loadInBackground(dataPromise: Promise<T>, transform?: (result: T) => T): Promise<T> {
    return dataPromise
      .then((result: T) => {
        runInAction(() => {
          if (transform) {
            this.data = transform(result);
          } else {
            this.data = result;
          }
          this.state = ExternalDataState.Loaded;
          this.error = undefined;
        });

        return this.data!;
      })
      .catch(
        action((err: Error) => {
          this.state = ExternalDataState.Failed;
          this.error = err;
          throw err;
        })
      );
  }

  /**
   * Alias of loadInBackground() that does not return/throw
   *
   * Method loadInBackground() mixes two patterns. It modifies observeable data but also returns/throws. Most of the
   * callers do not handle the response, resulting into unhandled rejections flooding our telemetry.
   *
   * Method loadInBackgroundVoid() wraps loadInBackground() and does not return/throw.
   * We are migrating callers of loadInBackground() one by one. Once everything is migrated, loadInBackgroundVoid() will become loadInBackground().
   */
  protected loadInBackgroundVoid(dataPromise: Promise<T>, transform?: (result: T) => T): Promise<void> {
    return this.loadInBackground(dataPromise, transform).then(noop).catch(noop);
  }
}
