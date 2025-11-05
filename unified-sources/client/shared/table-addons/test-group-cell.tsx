import * as React from "react";
import * as PropTypes from "prop-types";
import { Icon, IconName, IconSize, Color } from "../";
import { TestStatus } from "@lib/common-interfaces";
import { TextCell } from "../table/text-cell";

const css = require("./test-group-cell.scss");

export interface TestGroupCellProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  status: TestStatus;
  styles?: { [key: string]: string };
}

type DefaultProps = {
  styles: { [key: string]: string };
};

type TestGroupCellPropsWithDefaultProps = TestGroupCellProps & DefaultProps;

const statusIcon: { [key: number]: IconName } = {
  [TestStatus.Passed]: IconName.StatusPassed,
  [TestStatus.Failed]: IconName.StatusCrashed,
  [TestStatus.Skipped]: IconName.StatusFailed,
};

const statusColor: { [key: number]: Color } = {
  [TestStatus.Passed]: Color.Green,
  [TestStatus.Failed]: Color.Red,
  [TestStatus.Skipped]: Color.Amber,
};

export class TestGroupCell extends React.PureComponent<TestGroupCellProps, {}> {
  public static propTypes: React.ValidationMap<TestGroupCellProps> = {
    title: PropTypes.string.isRequired,
    status: PropTypes.number.isRequired,
  };

  public static defaultProps = { styles: css };

  public render() {
    const { title, status, styles, className, ...passthrough } = this.props as TestGroupCellPropsWithDefaultProps;
    const classNames = [styles["cell"], className].join(" ");

    return (
      <TextCell {...passthrough} className={classNames}>
        <Icon icon={statusIcon[status]} size={IconSize.XSmall} color={statusColor[status]} className={styles["icon"]} />
        <span className={styles["title"]}>{title || "Default Feature"}</span>
      </TextCell>
    );
  }
}
