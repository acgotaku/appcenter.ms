import * as React from "react";
import { Link } from "react-router";
import { Icon, IconName, IconSize, Color } from "../";
import { TestStatus } from "@lib/common-interfaces";
import { TextCell } from "../table/text-cell";
import { TestCellTitle } from "./test-cell-title";

const css = require("./test-row-cell.scss");
const { createElement } = React;

export interface TestCellProps extends React.HTMLAttributes<HTMLElement> {
  active: boolean;
  narrow: boolean;
  title: string;
  status: TestStatus;
  grouped?: boolean;
  useHighlight?: boolean;
  activeStep?: string | number;
  steps?: {
    id: string | number;
    runIndex: number;
    showScenarioOutline: boolean;
    title: string;
    status: TestStatus;
    to?: string;
    onClick?(event: MouseEvent): void;
  }[];
  styles?: { [key: string]: string };
}

type DefaultProps = {
  styles: { [key: string]: string };
  useHighlight: boolean;
};

type TestCellPropsWithDefaultProps = TestCellProps & DefaultProps;

const statusIcon: { [key: number]: IconName } = {
  [TestStatus.Passed]: IconName.Check,
  [TestStatus.Failed]: IconName.CrashFilled,
  [TestStatus.Skipped]: IconName.CloseSmall,
};

const statusColor: { [key: number]: Color } = {
  [TestStatus.Passed]: Color.Green,
  [TestStatus.Failed]: Color.Red,
  [TestStatus.Skipped]: Color.Amber,
};

const statusName: { [key: number]: string } = {
  [TestStatus.Passed]: "passed",
  [TestStatus.Failed]: "failed",
  [TestStatus.Skipped]: "skipped",
};

export class TestCell extends React.PureComponent<TestCellProps, {}> {
  public static defaultProps = { styles: css, useHighlight: false };

  public render() {
    const { styles, className } = this.props as TestCellPropsWithDefaultProps;
    const { active, title, status, grouped, narrow, steps, activeStep, useHighlight, ...passthrough } = this.props;
    const classNames = [styles["cell"], className].join(" ");

    return (
      <TextCell {...passthrough} className={classNames} link={narrow ? !active : true}>
        <div className={styles["test"]}>
          <Icon
            icon={statusIcon[status]}
            size={IconSize.XSmall}
            color={statusColor[status]}
            className={styles[grouped ? "icon-in-group" : "icon"]}
          />
          <span className={styles["title"]}>{title || "Default Scenario"}</span>
        </div>
        {narrow && active ? (
          <div className={styles["steps"]} data-test-id="test-report-steps">
            {steps &&
              steps.map((s) => [
                s.showScenarioOutline ? (
                  <div key="0" className={styles["scenario"]}>
                    Scenario {s.runIndex + 1}
                  </div>
                ) : undefined,
                createElement(
                  s.to || s.onClick ? (Link as any) : "div",
                  {
                    key: s.id,
                    className: styles[activeStep === s.id ? "active-step" : "step"],
                    to: s.to || s.onClick ? s.to || "#" : undefined,
                    "data-test-id": `test-report-step-${s.id}`,
                  },
                  [
                    <Icon
                      key="1"
                      icon={statusIcon[s.status]}
                      color={statusColor[s.status]}
                      size={IconSize.XXSmall}
                      data-status={statusName[s.status]}
                    />,
                    <TestCellTitle key="2" title={s.title} useHighlight={useHighlight} />,
                  ]
                ),
              ])}
          </div>
        ) : null}
      </TextCell>
    );
  }
}
