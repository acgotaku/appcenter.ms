import * as React from "react";
import { Grid, GridProps, GridSpacing, Row } from "../grid/index";
import { Primitive } from "@lib/common-interfaces";
import { noop } from "lodash";
import { wrapPrimitive } from "@root/shared/utils/wrapPrimitive";

export const ActionList: React.FunctionComponent<GridProps> = (props) => (
  <Grid {...props} padded>
    {props.children}
  </Grid>
);

interface SingleSelectActionListProps {
  value?: Primitive;
  name: String;
  onChange?(value: Primitive, event: React.ChangeEvent<HTMLInputElement>): void;
  [key: string]: any;
}

export class SingleSelectActionList extends React.Component<SingleSelectActionListProps, {}> {
  public static defaultProps = {
    onChange: noop,
  };

  private onChangeHandler = (value: Primitive) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (this.props.onChange) {
      this.props.onChange(value, event);
    }
  };

  private getChecked = (child: React.ReactElement<any>) => {
    return child.props.value === this.props.value;
  };

  public cloneActionItem = (child: React.ReactElement<any>) => {
    const actionItem: any = {
      checked: this.getChecked(child),
      name: this.props.name,
      onChange: this.onChangeHandler(child.props.value),
      value: child.props.value,
    };
    return actionItem;
  };

  public renderActionItems = () => {
    const children = this.props.children;
    return React.Children.map(children, (child: React.ReactChild) => {
      return React.cloneElement(wrapPrimitive(child), this.cloneActionItem(wrapPrimitive(child)));
    });
  };

  public render() {
    const { onChange, value, ...passthrough } = this.props;

    return (
      <Grid rowSpacing={GridSpacing.Large} {...passthrough} padded>
        {this.renderActionItems()}
      </Grid>
    );
  }
}

export class HorizontalSingleSelectActionList extends SingleSelectActionList {
  public render() {
    const { onChange, value, ...passthrough } = this.props;

    return (
      <Grid rowSpacing={GridSpacing.None} {...passthrough}>
        <Row columnSpacing={GridSpacing.None}>{this.renderActionItems()}</Row>
      </Grid>
    );
  }
}
