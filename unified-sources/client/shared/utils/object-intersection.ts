import { eq, intersection } from "lodash";

export const objectIntersection = <T extends {}>(objects: T[], isEqual: (a: T, b: T) => boolean = eq) => {
  // const commonKeys = intersection(...objects.map(o => Object.keys(o)));
  return (
    objects.slice(1).reduce<{ result: Partial<T>; commonKeys: string[] }>(
      (hash, obj) => {
        if (!hash.commonKeys.length) {
          return hash;
        }

        const keys = Object.keys(obj);
        const commonKeys = intersection(hash.commonKeys, keys);
        hash.commonKeys = commonKeys;
        hash.result = commonKeys.reduce((result, key) => {
          if (isEqual(obj[key], hash.result[key])) {
            result[key] = hash.result[key];
          }
          return result;
        }, {});
        return hash;
      },
      {
        result: objects[0],
        commonKeys: Object.keys(objects[0] || {}),
      }
    ).result || {}
  );
};
