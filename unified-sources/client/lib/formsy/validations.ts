export const VALIDATIONS = {
  USER_NAME: {
    matchRegexp: /^[a-zA-Z0-9-_.]+$/,
    maxLength: 100,
  },
};

export const VALIDATION_ERRORS = {
  USER_NAME: {
    matchRegexp: "Username can only contain letters, numbers, dashes, underscores, or periods.",
    maxLength: `Name should be ${VALIDATIONS.USER_NAME.maxLength} characters or less.`,
  },
};
