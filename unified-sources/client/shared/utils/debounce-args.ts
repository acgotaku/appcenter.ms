type Unary<T> = (x?: T) => any;
type Reducer<T, U> = (reduced: U, entry: T, index: number, array: T[]) => U;
const keepLast = <T, U>(_: U, x: T) => (x as any) as U;

/**
 * Debounces a function, collecting arguments of debounced calls.
 * When the debounced function is finally invoked, all the arguments
 * from the debounced calls are made available to the debounced function
 * as the function’s only argument, processed through a reducer function.
 * For example, to log the sum of all numbers a debounced function is
 * called with over a period of one second, you could write
 *
 * const add = debounce(
 *   sum => console.log(sum), // the debounced function
 *   1000,                    // the idle time in ms before invoking
 *   (sum, x) => sum + x,     // the argument reducer
 *   0                        // the initial value fed to the reducer
 * );
 *
 * add(4);
 * add(10);
 * add(6);
 * add(5);
 * // After 1000ms, `25` is logged
 *
 * The default argument reducer simply keeps the argument from the last
 * call, just like a normal debounce function.
 */
export default <T, U>(fn: Unary<U>, delay: number, reducer: Reducer<T, U> = keepLast, initialValue?: U): Unary<T> => {
  const args: any[] = [];
  let timerId: NodeJS.Timer;
  const invoke = () => {
    // Invoke the debounced function, passing the reduced arguments
    fn(args.reduce(reducer));
    // Reset the queue of arguments back to an empty array
    args.length = 0;
  };

  return (x?: T) => {
    // Push the argument onto the queue to be reduced
    if (x != null) {
      args.push(x);
    }
    // Cancel the previously scheduled invocation since we’re still bouncing
    clearTimeout(timerId);
    // Schedule an invocation to occur after an period of no other calls.
    // This invocation will be cancelled if the function is called again
    // within `delay` milliseconds.
    timerId = setTimeout(invoke, delay);
  };
};
