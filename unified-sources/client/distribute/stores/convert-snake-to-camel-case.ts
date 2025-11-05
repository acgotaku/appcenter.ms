import { forEach, isPlainObject, camelCase } from "lodash";

/**
 * This is a type alias for `any` that should only be used in situations when
 * result from a API gateway call are automatically converted from snake_case to
 * camelCase, to better recognize what to fix later and indicate this is a workaround.
 */
export type caseConvertedAny = any;
const maxDepth = 15;

/**
 * Converts all keys of an object or objects in an array from snake_case to camelCase,
 * recursively. This is intended only as a temporary workaround to get ready to switch
 * to the new data stores.
 * @param snakeObject The snake_case object to convert
 */
export function convertSnakeToCamelCase<T>(snakeObject: Object | Object[], depth: number = 0): T {
  const camelCaseObject = snakeObject && Array.isArray(snakeObject) ? [] : {};
  forEach(snakeObject, (value, key) => {
    if (!shouldIgnoreChildren(key!) && checkDepth(depth) && (isPlainObject(value) || Array.isArray(value))) {
      value = convertSnakeToCamelCase(value, depth + 1);
    }
    camelCaseObject[camelCase(key)] = value;
  });
  return camelCaseObject as T;
}

function shouldIgnoreChildren(key: string): boolean {
  return key === "distribution_groups";
}

function checkDepth(depth: number): boolean {
  if (depth <= maxDepth) {
    return true;
  }

  console.warn("Recursion depth is too deep while converting snake_case to camelCase in releases stores");
  return false;
}
