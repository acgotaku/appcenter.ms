import { ReleaseModel } from "@root/data/distribute/models/release";

const sortByKey = (a, b) => {
  if (a > b) {
    return 1;
  }
  if (a < b) {
    return -1;
  }
  return 0;
};

export function sortData(data: ReleaseModel[], sortKey: string, multiplier: number) {
  return data.slice().sort((a, b) => {
    const [aValue, bValue] = (() => {
      switch (true) {
        case sortKey === "version":
          return [parseFloat(a.version), parseFloat(b.version)];
        default:
          return [a[sortKey], b[sortKey]];
      }
    })();
    return multiplier * sortByKey(aValue, bValue);
  });
}
