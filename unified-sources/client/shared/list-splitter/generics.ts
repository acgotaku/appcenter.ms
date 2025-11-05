import { ListSplitter, ListSplitterProps } from "./list-splitter";

export function createListSplitter<ItemT, GroupPropsT = React.HTMLAttributes<HTMLElement>>() {
  type TypedListSplitter = new (props: ListSplitterProps<ItemT, GroupPropsT>, context?: any) => ListSplitter<ItemT, GroupPropsT>;
  return ListSplitter as TypedListSplitter;
}
