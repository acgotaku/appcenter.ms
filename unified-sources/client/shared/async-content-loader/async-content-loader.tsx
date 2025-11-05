import * as React from "react";
import { Markdown } from "../markdown";
import { identity } from "lodash";

export interface AsyncContentLoadedProps {
  completedCallback?: () => void;
}

export interface AsyncContentLoaderProps extends AsyncContentLoadedProps {
  moduleProvider?: () => Promise<any>;
  transform?: (content: string) => string;
}
export interface AsyncContentLoaderState {
  content?: string;
}

export class AsyncContentLoader extends React.PureComponent<AsyncContentLoaderProps, AsyncContentLoaderState> {
  public state = {
    content: undefined,
  };

  public static defaultProps: AsyncContentLoaderProps = {
    moduleProvider: undefined,
    transform: identity,
    completedCallback: identity,
  };

  public UNSAFE_componentWillMount() {
    const { moduleProvider, transform, completedCallback } = this.props;
    if (!this.state.content && moduleProvider) {
      moduleProvider().then(({ content }) => {
        if (transform) {
          this.setState({ content: transform(content) }, completedCallback);
        }
      });
    }
  }

  public render() {
    let content: string | undefined;

    if (typeof this.state.content === "string") {
      content = this.state.content;
    }

    return <div>{content ? <Markdown children={content} copyableCode={true} /> : null}</div>;
  }
}
