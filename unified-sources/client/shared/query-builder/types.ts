import { DateRange } from "../utils/date-range";

export type QueryPropertyType = typeof Number | typeof String | typeof Boolean | typeof Date;
export type QueryInputType = typeof Number | typeof String | typeof DateRange;

export interface QueryProperty {
  id: string;
  name: string;
  types: QueryPropertyType[];
  completions?: string[];
  loadingCompletions?: boolean;
}

export interface QueryOperator {
  id: string;
  name: string;
  description?: string;
  propertyType: QueryPropertyType;
  inputType?: QueryInputType;
}

export interface QueryRule {
  id: string | number;
  property: QueryProperty;
  operator: QueryOperator;
  input?: string | DateRange;
  error?: string;
}

export enum QueryError {
  ValueMustBePresent,
  ValueMustBeNumber,
}
