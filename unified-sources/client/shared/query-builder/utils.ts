import * as memoize from "memoizee";
import { QueryRule, QueryProperty, QueryOperator, QueryPropertyType, QueryInputType, QueryError } from "./types";
import { DateRange } from "../utils/date-range";

const getPropertyTypeOperators = memoize((propertyType: QueryPropertyType, operators: QueryOperator[]) => {
  return operators.filter((o) => o.propertyType === propertyType);
});

export function getOperators(propertyTypes: QueryPropertyType[], operators: QueryOperator[]) {
  return propertyTypes.reduce(
    (all: QueryOperator[], propertyType) => [...all, ...getPropertyTypeOperators(propertyType, operators)],
    []
  );
}

export function getFirstUnusedProperty(rules: QueryRule[], properties: QueryProperty[]) {
  const usedProperties = rules.map((r) => r.property);
  return properties.find((p) => !usedProperties.includes(p)) || properties[0];
}

export function getDefaultInput(inputType?: QueryInputType) {
  switch (inputType) {
    case DateRange:
      return new DateRange();
    case Number:
      return "";
    case String:
      return "";
    default:
      return undefined;
  }
}

export function getMessage(error: QueryError) {
  switch (error) {
    case QueryError.ValueMustBePresent:
      return "Value can’t be empty";
    case QueryError.ValueMustBeNumber:
      return "Value must be a number";
    default:
      console.warn(
        `No error message is defined for QueryError code ${error}. Ensure that a user-friendly message is defined for every value of QueryError.`
      );
      return "Value is invalid";
  }
}
