import * as React from "react";
import { TabProps } from "./tab";
import { Tabs, TabsProps } from "./tabs";
import { notifyScreenReader } from "@root/stores/notification-store";
import { t } from "@root/lib/i18n";

export interface WizardTabsProps extends TabsProps {
  tabs: TabProps[];
}

export class WizardTabs extends React.Component<WizardTabsProps, {}> {
  public static defaultProps = {
    sequential: true,
    renderTab: Tabs.defaultProps!.renderTab,
  };

  componentDidMount() {
    this.notifyTabChanged(this.getNotificationMessage(this.props));
  }

  public UNSAFE_componentWillUpdate(nextProps) {
    const { selectedIndex, title } = this.props;
    const tabs = this.getTabs(this.props);
    const nextTabs = this.getTabs(nextProps);
    if (
      nextProps.selectedIndex !== selectedIndex ||
      nextProps.title !== title ||
      this.getTabTitle(nextProps.selectedIndex, nextTabs) !== this.getTabTitle(selectedIndex, tabs)
    ) {
      this.notifyTabChanged(this.getNotificationMessage(nextProps));
    }
  }

  public getTabs(props: WizardTabsProps) {
    return (props.tabs || []).filter((tab) => tab);
  }

  public getTabTitle(tabIndex: number, tabs: TabProps[]) {
    return tabs[tabIndex] ? tabs[tabIndex].title : "";
  }

  public getNotificationMessage(props: WizardTabsProps) {
    const tabs = this.getTabs(props);
    const tabTitle = this.getTabTitle(props.selectedIndex, tabs);
    const { sequential, title = "" } = props;
    const message = `${title}${title ? ": " + tabTitle : tabTitle}${sequential ? "," : ""}`;
    const steps = props.sequential
      ? t("common:tabs.wizard-tabs-announcement.steps", { current: props.selectedIndex + 1, last: tabs.length })
      : "";
    return t("common:tabs.wizard-tabs-announcement.message", { message, steps });
  }

  public notifyTabChanged(message: string) {
    notifyScreenReader({
      message: message,
      delay: 100,
    });
  }

  public getTabProps(index: number, props) {
    return {
      ...props,
      disabled: this.props.sequential,
      onClick: this.props.sequential ? null : props.onClick,
      onKeyDown: this.props.sequential ? null : props.onKeyDown,
      title: this.props.title,
      tabIndex: this.props.sequential ? -1 : props.tabIndex,
      "aria-current": this.props.selectedIndex === index ? "step" : null,
      // reset aria attributes since wizard tabs are not interactive
      "aria-selected": null,
      "aria-disabled": null,
    };
  }

  public renderTab = (tab, index: number, props) => {
    return this.props.renderTab!(tab, index, this.getTabProps(index, props));
  };

  public render() {
    /* eslint-disable jsx-a11y/aria-role */
    return <Tabs {...this.props} renderTab={this.renderTab} role={this.props.role || ""} />;
  }
}
