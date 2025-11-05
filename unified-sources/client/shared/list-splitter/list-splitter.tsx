import * as React from "react";
import * as PropTypes from "prop-types";
import * as shallowEqual from "shallowequal";
import { chunk } from "lodash";
import { HTMLTagNames } from "@lib/common-interfaces/html-tag-names";

export interface ListSplitterProps<ItemT, GroupPropsT> extends React.HTMLAttributes<HTMLDivElement> {
  list: ItemT[];
  groupSize: number;
  groupComponent?: React.ComponentClass<GroupPropsT> | React.StatelessComponent<GroupPropsT> | HTMLTagNames;
  groupProps?: GroupPropsT;
  children(item: ItemT, index?: number, indexInGroup?: number): React.ReactNode | JSX.Element;
}

export interface ListSplitterGroupProps extends React.HTMLAttributes<HTMLElement> {
  list: any[];
  offset: number;
  component?: ListSplitterProps<any, any>["groupComponent"];
  renderItem: ListSplitterProps<any, any>["children"];
}

export class ListSplitterGroup extends React.Component<ListSplitterGroupProps, {}> {
  public static defaultProps = { component: "div" };

  public shouldComponentUpdate(nextProps: ListSplitterGroupProps) {
    const oldList = this.props.list;
    if (nextProps.list === oldList) {
      return false;
    }

    if (nextProps.list.length !== oldList.length) {
      return true;
    }

    return !shallowEqual(oldList, nextProps.list);
  }

  public render() {
    const { list, renderItem, offset, component, ...props } = this.props;
    return React.createElement(
      component as any,
      props,
      list.map((item, index) => renderItem(item, offset + index, index))
    );
  }
}

export class ListSplitter<T = any, GroupPropsT = React.HTMLAttributes<HTMLElement>> extends React.PureComponent<
  ListSplitterProps<T, GroupPropsT>,
  {}
> {
  public static propTypes: React.ValidationMap<ListSplitterProps<any, any>> = {
    list: PropTypes.array.isRequired,
    groupSize: PropTypes.number.isRequired,
    groupProps: PropTypes.object,
    children: PropTypes.func.isRequired,
  };

  public render() {
    const { list, groupSize, groupProps, groupComponent, children, ...props } = this.props;
    return (
      <div {...props}>
        {chunk(list, groupSize).map((group, index) => (
          <ListSplitterGroup
            {...groupProps}
            key={index}
            component={groupComponent}
            offset={index * groupSize}
            list={group}
            renderItem={children}
          />
        ))}
      </div>
    );
  }
}
