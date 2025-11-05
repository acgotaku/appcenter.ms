import * as React from "react";
import { browserHistory, LinkProps } from "react-router";
import { Omit } from "@lib/common-interfaces/omit";
import { Keys } from "../utils";
import { HTMLTagNames } from "@lib/common-interfaces/html-tag-names";

const isModifiedEvent = (event) => !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);

interface DefaultProps {
  tagName: string;
}

type LinkPropsWithDefaultProps = LinkProps & DefaultProps;

export interface FakeLinkProps extends Omit<LinkProps, "to"> {
  to?: string;
  href?: string;
  replace?: boolean;
  tagName?: HTMLTagNames;
}

export class FakeLink extends React.Component<FakeLinkProps> {
  public static defaultProps: Partial<FakeLinkProps> = {
    tagName: "div",
  };

  private navigate(event: React.SyntheticEvent<HTMLElement>) {
    event.preventDefault();

    if (this.props.href) {
      window.location.href = this.props.href;
    }

    if (this.props.replace && this.props.to) {
      browserHistory.replace(this.props.to);
    } else if (this.props.to) {
      browserHistory.push(this.props.to);
    }
  }

  // See `react-router-dom`’s `Link` module:
  // https://github.com/ReactTraining/react-router/blob/master/packages/react-router-dom/modules/Link.js#L35-L56
  private onClick: React.MouseEventHandler<HTMLElement> = (event) => {
    if (this.props.onClick) {
      this.props.onClick(event);
    }

    if (
      !event.defaultPrevented && // onClick prevented default
      event.button === 0 && // ignore right clicks
      !this.props.target && // let browser handle "target=_blank" etc.
      !isModifiedEvent(event) && // ignore clicks with modifier keys
      this.props.to
    ) {
      this.navigate(event);
    }
  };

  private onKeyDown: React.KeyboardEventHandler<HTMLElement> = (event) => {
    if (this.props.onKeyDown) {
      this.props.onKeyDown(event);
    }

    if (event.which === Keys.Enter) {
      this.navigate(event);
    }
  };

  private handlers = {
    onClick: this.onClick,
    onKeyDown: this.onKeyDown,
  };

  public render() {
    const { tagName: TagName, ...props } = this.props as LinkPropsWithDefaultProps;
    return <TagName role="link" tabIndex={0} {...props} {...this.handlers} />;
  }
}
