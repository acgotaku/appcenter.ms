import * as React from "react";
import * as PropTypes from "prop-types";
import { observer } from "mobx-react";

export interface ConnectToPageScrollerProps {
  children?: (scrollElement: Element) => JSX.Element;
}

@observer
export class ConnectToPageScroller extends React.Component<ConnectToPageScrollerProps, {}> {
  public static propTypes = { children: PropTypes.func.isRequired };
  public static contextTypes = { pageContext: PropTypes.any };
  public context!: { pageContext: { scrollElement: Element } };

  public render() {
    const scrollElement = process.env.NODE_ENV === "test" ? document.documentElement : this.context.pageContext.scrollElement;
    return <div>{scrollElement && this.props.children ? this.props.children(scrollElement) : null}</div>;
  }
}
