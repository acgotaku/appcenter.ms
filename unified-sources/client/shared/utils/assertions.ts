export const assertUnreachable = (arg: never) => {
  throw new Error(
    `Argument was typed \`never\` but this assertion was reached. That means the argument’s value at runtime did not match its expected type at compile time. The value was \`${
      arg as any
    }\`.`
  );
};

export const assertConstantProps = <P extends {}>(props1: P, props2: P, ...constantProps: (keyof P)[]) => {
  if (process.env.NODE_ENV !== "production") {
    constantProps.forEach((k) => {
      if (props1[k] !== props2[k]) {
        throw new Error(
          `Changing prop \`${k.toString()}\` while rendered is not supported. You must choose a constant value. ` +
            `Its value changed from \`${props1[k]}\` to \`${props2[k]}\`.`
        );
      }
    });
  }
};
