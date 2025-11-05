import { QueryOperator } from "./types";

export const number: QueryOperator[] = [
  {
    id: "num-eq",
    name: "=",
    description: "equal to",
    inputType: Number,
    propertyType: Number,
  },
  {
    id: "num-neq",
    name: "≠",
    description: "not equal to",
    inputType: Number,
    propertyType: Number,
  },
  {
    id: "num-gt",
    name: ">",
    description: "greater than",
    inputType: Number,
    propertyType: Number,
  },
  {
    id: "num-gte",
    name: "≥",
    description: "greater than or equal to",
    inputType: Number,
    propertyType: Number,
  },
  {
    id: "num-lt",
    name: "<",
    description: "less than",
    inputType: Number,
    propertyType: Number,
  },
  {
    id: "num-lte",
    name: "≤",
    description: "less than or equal to",
    inputType: Number,
    propertyType: Number,
  },
];

export const string: QueryOperator[] = [
  {
    id: "str-eq",
    name: "is",
    inputType: String,
    propertyType: String,
  },
  {
    id: "str-neq",
    name: "is not",
    inputType: String,
    propertyType: String,
  },
  {
    id: "str-contains",
    name: "contains",
    inputType: String,
    propertyType: String,
  },
  {
    id: "str-ncontains",
    name: "does not contain",
    inputType: String,
    propertyType: String,
  },
];

export const boolean: QueryOperator[] = [
  {
    id: "bool-true",
    name: "is true",
    inputType: undefined,
    propertyType: Boolean,
  },
  {
    id: "bool-false",
    name: "is false",
    inputType: undefined,
    propertyType: Boolean,
  },
];

export const date: QueryOperator[] = [
  {
    id: "date-today",
    name: "Today",
    inputType: undefined,
    propertyType: Date,
  },
  {
    id: "date-yesterday",
    name: "Yesterday",
    inputType: undefined,
    propertyType: Date,
  },
  {
    id: "date-last7days",
    name: "Last 7 days",
    inputType: undefined,
    propertyType: Date,
  },
  {
    id: "date-last28days",
    name: "Last 28 days",
    inputType: undefined,
    propertyType: Date,
  },
  {
    id: "date-last30days",
    name: "Last 30 days",
    inputType: undefined,
    propertyType: Date,
  },
  {
    id: "date-thismonth",
    name: "This month",
    inputType: undefined,
    propertyType: Date,
  },
  {
    id: "date-lastmonth",
    name: "Last month",
    inputType: undefined,
    propertyType: Date,
  },
];

export default [...number, ...string, ...boolean, ...date];
