export function spliceRows<T>(originalRows: T[], newRows: T[], startIndex: number) {
  const newArray = originalRows.slice();
  newArray.length = Math.max(newArray.length, startIndex);
  newArray.splice(startIndex, newRows.length, ...newRows);
  return newArray;
}
