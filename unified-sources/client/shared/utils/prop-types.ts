// Largely adapted from https://github.com/facebook/react/blob/b1b4a2fb252f26fe10d29ba60d85ff89a85ff3ec/src/isomorphic/classic/types/ReactPropTypes.js

import { Validator, Requireable } from "react";

const requireable = (typeChecker: Validator<any>): Requireable<any> => {
  (typeChecker as Requireable<any>).isRequired = (props: Object, propName: string, componentName: string, ...rest: any[]) => {
    const propValue = props[propName];
    if (propValue === null) {
      return new Error(`The prop \`${propName}\` is marked as required in \`${componentName}\`, but its value is \`null\`.`);
    } else if (typeof propValue === "undefined") {
      return new Error(`The prop \`${propName}\` is marked as required in \`${componentName}\`, but its value is \`undefined\`.`);
    }

    return (typeChecker as any)(props, propName, componentName, ...rest) as Error;
  };

  return typeChecker as Requireable<any>;
};

// Obviously incomplete; add keys as you need
const isArrayLike = (obj: any) =>
  typeof obj === "object" &&
  typeof obj.map === "function" &&
  typeof obj.indexOf === "function" &&
  typeof obj.find === "function" &&
  typeof obj.filter === "function" &&
  typeof obj.length === "number";

export const arrayLikeOf = (typeChecker: Validator<any>) =>
  requireable((props: Object, propName: string, componentName: string, ...rest: any[]) => {
    const propValue = props[propName];
    if (!isArrayLike(propValue)) {
      return new Error(`Invalid prop \`${propName}\` supplied to \`${componentName}\`; expected an array-like object.`);
    }

    for (let i = 0; i < propValue.length; i++) {
      const error = (typeChecker as Function)(propValue, i.toString(), componentName, ...rest);

      if (error instanceof Error) {
        return error;
      }
    }

    return null;
  });

export const exclusiveWith = (typeChecker: Validator<any>, exclusivePropName: string, onlyInvalidIfTruthy = false) =>
  requireable((props: Object, propName: string, componentName: string, ...rest: any[]) => {
    if (props.hasOwnProperty(propName)) {
      if ((onlyInvalidIfTruthy && props[exclusivePropName]) || (!onlyInvalidIfTruthy && props.hasOwnProperty(exclusivePropName))) {
        return new Error(
          `Invalid prop \`${propName}\` supplied to \`${componentName}\`; ${propName} cannot be used in conjunction with ${exclusivePropName}.`
        );
      }
    }

    return (typeChecker as Function)(props, propName, componentName, ...rest);
  });
