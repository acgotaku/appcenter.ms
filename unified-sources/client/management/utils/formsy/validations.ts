import { trim } from "lodash";

export const emptyString = (values: any, value: any) => {
  if (!value) {
    return false;
  }

  return trim(value).length > 0;
};
const validString = /^[a-zA-Z0-9-_.]+$/;

/**
 * Validations
 */
export const VALIDATIONS = {
  APP_DISPLAY_NAME: {
    emptyString: emptyString,
    maxLength: 100,
    minLength: 1,
    matchRegexp: /([^\.]{1,2}|\.{3,})(.|\d)*/, // Everything except '.' or '..'.
  },
  RELEASE_TYPE: {
    maxLength: 100,
    matchRegexp: /^$|^[A-Z0-9][a-z0-9]*$/,
  },
  APP_DESCRIPTION: {
    maxLength: 255,
  },
  ORG_NAME: {
    emptyString: emptyString,
    matchRegexp: validString,
    maxLength: 100,
    minLength: 1,
  },
  ORG_DISPLAY_NAME: {
    emptyString: emptyString,
    maxLength: 255,
    minLength: 1,
  },
  TEAM_DISPLAY_NAME: {
    emptyString: emptyString,
    maxLength: 75,
    minLength: 1,
    matchRegexp: /([^\.]{1,2}|\.{3,})(.|\d)*/, //Everything except . or ..
  },
  DISTRIBUTION_GROUP_DISPLAY_NAME: {
    emptyString: emptyString,
    matchRegexp: /(^[^.].*)|(^[.].+)/,
    maxLength: 255,
    minLength: 1,
  },
  USER_DISPLAY_NAME: {
    emptyString: emptyString,
    maxLength: 100,
  },
  API_TOKEN_DESCRIPTION: {
    emptyString: emptyString,
    maxLength: 100,
  },
  SERVICE_TREE_ID: {
    matchRegexp: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  },
};

export const VALIDATION_ERRORS = {
  APP_DISPLAY_NAME: {
    maxLength: `Name should be ${VALIDATIONS.APP_DISPLAY_NAME.maxLength} characters or less.`,
    minLength: `Name should be at least ${VALIDATIONS.APP_DISPLAY_NAME.minLength} characters.`,
    emptyString: "Name cannot be empty.",
    matchRegexp: "Name is invalid.",
  },
  APP_RELEASE_TYPE: {
    maxLength: `Release type should be ${VALIDATIONS.RELEASE_TYPE.maxLength} characters or less.`,
    matchRegexp: `Release type must be a single word starting with a capital letter or number, followed by lowercase.`,
  },
  APP_DESCRIPTION: {
    maxLength: `Description should be ${VALIDATIONS.APP_DESCRIPTION.maxLength} characters or less.`,
  },
  ORG_NAME: {
    emptyString: "Name is invalid.",
    matchRegexp: "Name may only contain alphanumeric characters, dashes, periods, or underscores.",
    maxLength: `Name should be ${VALIDATIONS.ORG_NAME.maxLength} characters or less.`,
    minLength: `Name should be at least ${VALIDATIONS.ORG_NAME.minLength} char.`,
  },
  ORG_URL: {
    emptyString: "URL is invalid.",
    matchRegexp: "URL may only contain alphanumeric characters, dashes, periods, or underscores.",
    maxLength: `Organization name in the URL should be ${VALIDATIONS.ORG_NAME.maxLength} characters or less.`,
    minLength: `Organization name in the URL should be at least ${VALIDATIONS.ORG_NAME.minLength} char.`,
  },
  ORG_DISPLAY_NAME: {
    maxLength: `Name should be ${VALIDATIONS.ORG_DISPLAY_NAME.maxLength} characters or less.`,
    minLength: `Name should be at least ${VALIDATIONS.ORG_DISPLAY_NAME.minLength} characters.`,
    emptyString: "Name cannot be empty.",
  },
  TEAM_DISPLAY_NAME: {
    emptyString: "Name cannot be empty.",
    maxLength: `Name should be ${VALIDATIONS.TEAM_DISPLAY_NAME.maxLength} characters or less.`,
    minLength: `Name should be at least ${VALIDATIONS.TEAM_DISPLAY_NAME.minLength} characters.`,
    matchRegexp: `Name is invalid.`,
  },
  DISTRIBUTION_GROUP_DISPLAY_NAME: {
    emptyString: "Name cannot be empty.",
    trailingSpaces: "Name cannot have trailing spaces.",
    matchRegexp: "Name is invalid.",
    maxLength: `Name should be ${VALIDATIONS.DISTRIBUTION_GROUP_DISPLAY_NAME.maxLength} characters or less.`,
    minLength: `Name should be at least ${VALIDATIONS.DISTRIBUTION_GROUP_DISPLAY_NAME.minLength} characters.`,
  },
  USER_DISPLAY_NAME: {
    emptyString: "Name cannot be empty.",
    maxLength: `Name should be ${VALIDATIONS.USER_DISPLAY_NAME.maxLength} characters or less.`,
  },
  API_TOKEN_DESCRIPTION: {
    emptyString: "Description cannot be empty.",
    maxLength: `Description should be ${VALIDATIONS.USER_DISPLAY_NAME.maxLength} characters or less.`,
  },
  SERVICE_TREE_ID: {
    matchRegexp: `Service Tree ID must be valid GUID.`,
  },
};
