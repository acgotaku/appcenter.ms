import * as React from "react";
import { Observer } from "mobx-react";

export function createObservableContext<T>(defaultValue: T, calculateChangedBits?: (prev: T, next: T) => number) {
  const Context = React.createContext<T>(defaultValue, calculateChangedBits);
  const ObservableConsumer = ({ children }: React.ConsumerProps<T>) => {
    return <Context.Consumer>{(value) => <Observer>{() => children(value)}</Observer>}</Context.Consumer>;
  };
  return { Provider: Context.Provider, Consumer: ObservableConsumer };
}
