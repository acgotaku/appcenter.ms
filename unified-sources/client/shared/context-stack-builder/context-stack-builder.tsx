import * as React from "react";
import { compact } from "lodash";

type OptionalGeneric<T> = T | undefined;

export interface CollectorProps<T> {
  onStackChange: (stack: OptionalGeneric<T>[]) => void;
}

export interface ReporterProps<T> {
  value: T;
  children?: never;
}

export type ContextStackBuilderOptions<T> = {
  isEqual?: (prevValue: T, nextValue: T) => boolean;
  displayName?: string;
};

type CollectorContext<T> = {
  onValueChange: (index: number, value: T) => void;
  onRemoveValue: (index: number) => void;
};

interface InnerReporterProps<T> extends ReporterProps<T>, CollectorContext<T> {
  index: number;
}

const isReferentiallyEqual = (a, b) => a === b;
const throwMissingCollectorError = () => {
  throw new Error("StackBuilder.Value must be used inside a " + "StackBuilder.Collector and a StackBuilder.Boundary");
};

export function createContextStackBuilder<T>({
  isEqual = isReferentiallyEqual,
  displayName = "ContextStackBuilder",
}: ContextStackBuilderOptions<T> = {}) {
  const CollectorContext = React.createContext<CollectorContext<T>>({
    onValueChange: throwMissingCollectorError,
    onRemoveValue: throwMissingCollectorError,
  });

  const BoundaryContext = React.createContext(0);

  class Collector extends React.Component<CollectorProps<T>> {
    static displayName = `${displayName}.Collector`;
    private stack: OptionalGeneric<T>[] = [];

    private providerValue: CollectorContext<T> = {
      onValueChange: (index, value) => {
        const stack = [...this.stack];
        stack[index] = value;
        this.stack = stack;
        this.props.onStackChange(compact(this.stack));
      },
      onRemoveValue: (index) => {
        this.stack = [...this.stack];
        this.stack[index] = undefined;
        this.props.onStackChange(compact(this.stack));
      },
    };

    render() {
      return <CollectorContext.Provider value={this.providerValue}>{this.props.children}</CollectorContext.Provider>;
    }
  }

  const Boundary: React.SFC = ({ children }) => (
    <BoundaryContext.Consumer>
      {(index) => <BoundaryContext.Provider value={index + 1}>{children}</BoundaryContext.Provider>}
    </BoundaryContext.Consumer>
  );
  Boundary.displayName = `${displayName}.Boundary`;

  class InnerReporter extends React.PureComponent<InnerReporterProps<T>> {
    componentDidMount() {
      this.props.onValueChange(this.props.index, this.props.value);
    }
    componentDidUpdate(prevProps: InnerReporterProps<T>) {
      if (!isEqual(prevProps.value, this.props.value) || this.props.index !== prevProps.index) {
        this.props.onValueChange(this.props.index, this.props.value);
      }
    }
    componentWillUnmount() {
      this.props.onRemoveValue(this.props.index);
    }
    render() {
      return null;
    }
  }

  const Value: React.SFC<ReporterProps<T>> = ({ value }) => (
    <CollectorContext.Consumer>
      {({ onValueChange, onRemoveValue }) => (
        <BoundaryContext.Consumer>
          {(index) => <InnerReporter value={value} index={index} onValueChange={onValueChange} onRemoveValue={onRemoveValue} />}
        </BoundaryContext.Consumer>
      )}
    </CollectorContext.Consumer>
  );
  Value.displayName = `${displayName}.Value`;

  return {
    Collector,
    Boundary,
    Value,
  };
}
