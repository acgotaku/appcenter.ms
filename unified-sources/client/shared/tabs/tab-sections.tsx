import * as React from "react";
import * as PropTypes from "prop-types";
import { TabSection } from "./tab-section";
const classNames = require("classnames");
const css = require("./tab-sections.scss");

export interface TabSectionsProps extends React.HTMLAttributes<HTMLElement> {
  selectedIndex: number;
  styles?: any;
}

export class TabSections extends React.PureComponent<TabSectionsProps, {}> {
  public static propTypes: React.ValidationMap<TabSectionsProps> = {
    selectedIndex: PropTypes.number.isRequired,
  };

  public static defaultProps = { styles: css };

  public state = {
    animatedRight: false,
  };

  public UNSAFE_componentWillReceiveProps(nextProps: any) {
    this.setState({
      animatedRight: nextProps.selectedIndex < this.props.selectedIndex,
    });
  }

  private cloneChild = (child: any, index?: number) => {
    if (child.type === TabSection) {
      return React.cloneElement(child, {
        key: child.key || index,
        selected: index === this.props.selectedIndex,
      });
    } else {
      throw new TypeError("Child must be a TabSection Component");
    }
  };

  public render() {
    const { styles, selectedIndex, ...passthrough } = this.props;
    const className = classNames(this.props.className, styles["tab-section-container"]);

    return (
      <div {...passthrough} className={className}>
        {React.Children.toArray(this.props.children).map(this.cloneChild)}
      </div>
    );
  }
}
