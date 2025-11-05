import * as React from "react";
import * as PropTypes from "prop-types";
import { Tab, TabProps } from "./tab";
import { MediaObject } from "../media-object/media-object";
import { omit, initial, noop } from "lodash";
import { Stretch } from "../stretch";
import { Keys } from "../utils/keys";
import * as classNames from "classnames/bind";
const css = require("./tabs.scss");

export interface TabsProps extends React.HTMLAttributes<HTMLElement> {
  centered?: boolean;
  sequential?: boolean;
  pageDivider?: boolean;
  onSelect?(index: any): void;
  selectedIndex: number;
  title?: string;
  separateLast?: boolean;
  tall?: boolean;
  role?: string;
  styles?: { [key: string]: string };
  tabs?: TabProps[];
  renderTab?: Function;
}

type DefaultProps = {
  styles: { [key: string]: string };
  onSelect(index: any): void;
  role: string;
  renderTab: Function;
};

type TabsPropsWithDefaultProps = TabsProps & DefaultProps;

export class Tabs extends React.Component<TabsProps, {}> {
  public context!: { inModal: boolean };

  public static defaultProps = {
    styles: css,
    onSelect: noop,
    role: "tablist",
    renderTab: (tab, index, tabProps) => (
      <Tab {...tabProps} {...omit(tab, "title")}>
        {tab.title}
      </Tab>
    ),
  };
  public static contextTypes = { inModal: PropTypes.bool };

  public tabsAnchor: HTMLDivElement | null = null;

  private onSelect(index: number) {
    if (index === this.props.selectedIndex) {
      return;
    }
    this.props.onSelect!(index);
  }

  private handleKeyDown(index: number, event: React.KeyboardEvent<HTMLElement>): void {
    const keyCode = event.keyCode;
    switch (keyCode) {
      case Keys.Enter:
      case Keys.Space:
        this.onSelect(index);
        break;
      case Keys.Home:
        this.selectFirstTab();
        break;
      case Keys.End:
        this.selectLastTab();
        break;
      case Keys.Left:
      case Keys.Right:
        this.onArrowKeyDown(index, keyCode);
        break;
      default:
        return;
    }
  }

  private selectFirstTab(): void {
    this.onSelect(0);
  }

  private selectLastTab(): void {
    const tabsCount = React.Children.count(this.props.children);
    this.onSelect(tabsCount - 1);
  }

  private getDirection(keyCode: number): number {
    switch (keyCode) {
      case Keys.Left:
        return -1;
      case Keys.Right:
        return 1;
      default:
        return 0;
    }
  }

  private onArrowKeyDown(index: number, keyCode: number): void {
    const tabsCount = React.Children.count(this.props.children);
    const direction = this.getDirection(keyCode);
    if (index + direction >= tabsCount) {
      this.selectFirstTab();
    } else if (index + direction < 0) {
      this.selectLastTab();
    } else {
      this.onSelect(index + direction);
    }
  }

  private getTabProps(index: number) {
    return {
      key: `tab-${index}`,
      indicators: this.props.sequential,
      onClick: () => this.onSelect(index),
      onKeyDown: (event) => this.handleKeyDown(index, event),
      selected: index === this.props.selectedIndex,
      title: this.props.title,
    };
  }

  private renderTitle() {
    const { title, styles } = this.props;
    return (
      <MediaObject className={styles!["title-container"]} textOnly={true} id={`tablist-${title}`}>
        <h1 className={styles!.title}>{title}</h1>
      </MediaObject>
    );
  }

  private compatRenderTab(child, index: number) {
    return React.cloneElement(child, this.getTabProps(index));
  }

  private renderTabs() {
    const { tabs } = this.props;
    if (tabs) {
      return tabs.filter((tab) => tab).map((tab, index) => this.props.renderTab!(tab, index, this.getTabProps(index)));
    } else {
      return React.Children.toArray(this.props.children)
        .filter((child) => child)
        .map((child, index) => this.compatRenderTab(child, index));
    }
  }

  public render() {
    const { centered, tall, pageDivider, title, styles, separateLast, role, ...props } = this.props as TabsPropsWithDefaultProps;
    const { inModal } = this.context;
    const { renderTab, sequential, selectedIndex, className: classNameFromProps, ...passthrough } = props;
    const className = classNames.call(styles, classNameFromProps, "tabs", { centered, tall, inModal });
    const tabs = this.renderTabs();
    return (
      <div {...passthrough} className={pageDivider ? styles["page-divider"] : undefined} ref={(ref) => (this.tabsAnchor = ref)}>
        {title ? this.renderTitle() : null}
        <div className={className} role={role || undefined}>
          {separateLast ? (
            <Stretch className={styles.stretch}>
              <div className={styles.firstTabs}>{initial(tabs)}</div>
              {tabs[tabs.length - 1]}
            </Stretch>
          ) : (
            tabs
          )}
        </div>
      </div>
    );
  }
}
