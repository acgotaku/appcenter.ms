import { computed, observable, action, runInAction } from "mobx";
import { noop } from "lodash";

enum RequestState {
  Pending,
  Loaded,
  Failed,
}

interface ResourceRequestHandlers<DataT> {
  success: ((data: DataT | undefined) => void)[];
  failure: ((data: Error | undefined) => void)[];
}

export class ResourceRequest<DataT, PromiseT = DataT> {
  @observable private state = RequestState.Pending;
  private handlers: ResourceRequestHandlers<DataT> = { success: [], failure: [] };

  /**
   * If you're using this, you're probably doing something wrong! Use `data` and `error` and `onSuccess` and `onFailure` instead!
   */
  public promise: Promise<PromiseT>;

  /** The error from the request, if it failed. */
  @observable public error?: Error;

  /**
   * Creates a ResourceRequest.
   * @param promise The Promise representing the request’s state.
   * @param getData A getter for the observable data encapsulated by the request, to be called by the `request.data` computed property.
   * @param setData A Node-style callback invoked when the Promise has settled, called with (error, data) from the Promise’s rejection or resolution. Usually, this function is used to set the observable returned by `getData`.
   */
  constructor(
    promise: Promise<PromiseT>,
    private getData: (() => DataT) | undefined,
    setData: (error: Error | null, data: PromiseT | null) => void
  ) {
    this.promise = promise;
    promise.then(
      action((data: PromiseT) => {
        setData(null, data);
        this.state = RequestState.Loaded;
        this.handlers.success?.forEach((callback) => callback(this.data));
      }),
      action((error: Error) => {
        setData(error, null);
        this.error = error;
        this.state = RequestState.Failed;
        this.handlers.failure.forEach((callback) => callback(this.error));
      })
    );
  }

  // Chainable success/failure callbacks. We can’t use Promises
  // because chained Promise callbacks execute asynchronously,
  // therefore inside separate MobX transactions. This ensures
  // that all reactions can occur synchronously in a single
  // transaction.

  /**
   * For a pending request, pushes a callback onto a queue to be executed
   * when the request successfully completes. For a request that already
   * succeeded, the callback is executed immediately. Callbacks are
   * passed the data from the request.
   */
  public onSuccess(callback: (data: DataT | undefined) => void) {
    if (this.isPending) {
      this.handlers.success.push(callback);
    } else if (this.isLoaded) {
      runInAction(() => callback(this.data));
    }

    return this;
  }

  /**
   * For a pending request, pushes a callback onto a queue to be executed
   * when the request fails. For a request that has already failed, the
   * callback is executed immediately. Callbacks are passed the error
   * from the request.
   */
  public onFailure(callback: (error: Error | undefined) => void) {
    if (this.isPending) {
      this.handlers.failure.push(callback);
    } else if (this.isFailed) {
      runInAction(() => callback(this.error));
    }

    return this;
  }

  /** Whether the request is in flight; i.e., if the Promise is pending. */
  @computed public get isPending() {
    return this.state === RequestState.Pending;
  }
  /** Whether the request has failed; i.e., if the Promise was rejected. */
  @computed public get isFailed() {
    return this.state === RequestState.Failed;
  }
  /** Whether the request has succeeded; i.e., if the Promise was fulfilled. */
  @computed public get isLoaded() {
    return this.state === RequestState.Loaded;
  }
  /** The data encapsulated by the request. */
  @computed public get data() {
    return this.getData && this.getData();
  }

  public static all<T, U = T>(requests: ResourceRequest<T, U>[]) {
    return new ResourceRequest<T[], U[]>(Promise.all(requests.map((r) => r.promise)), () => requests.map((r) => r.getData!()), noop);
  }
}
