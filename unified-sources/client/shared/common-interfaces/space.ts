const variables = require("../styles/variables.scss");
const utils = require("../styles/utils.scss");

/**
 * Standard spacings from the App Center Design Template
 */
export enum Space {
  /** 4px */
  XXSmall = 1,
  /** 8px */
  XSmall,
  /** 16px */
  Small,
  /** 20px */
  Medium,
  /** 24px */
  XMedium,
  /** 32px */
  Large,
  /** 40px */
  XLarge,
  /** 60px */
  XXLarge,
}

export const spaceValues: { [K in Space]: number } = {
  [Space.XXSmall]: parseInt(variables.spaceXXS, 0),
  [Space.XSmall]: parseInt(variables.spaceXS, 0),
  [Space.Small]: parseInt(variables.spaceS, 0),
  [Space.Medium]: parseInt(variables.spaceM, 0),
  [Space.XMedium]: parseInt(variables.spaceXM, 0),
  [Space.Large]: parseInt(variables.spaceL, 0),
  [Space.XLarge]: parseInt(variables.spaceXL, 0),
  [Space.XXLarge]: parseInt(variables.spaceXXL, 0),
};

export const spaceAboveClassNames: { [K in Space]: string } = {
  [Space.XXSmall]: utils["space-xxs-above"],
  [Space.XSmall]: utils["space-xs-above"],
  [Space.Small]: utils["space-s-above"],
  [Space.Medium]: utils["space-m-above"],
  [Space.XMedium]: utils["space-xm-above"],
  [Space.Large]: utils["space-l-above"],
  [Space.XLarge]: utils["space-xl-above"],
  [Space.XXLarge]: utils["space-xxl-above"],
};

export const spaceBelowClassNames: { [K in Space]: string } = {
  [Space.XXSmall]: utils["space-xxs-below"],
  [Space.XSmall]: utils["space-xs-below"],
  [Space.Small]: utils["space-s-below"],
  [Space.Medium]: utils["space-m-below"],
  [Space.XMedium]: utils["space-xm-below"],
  [Space.Large]: utils["space-l-below"],
  [Space.XLarge]: utils["space-xl-below"],
  [Space.XXLarge]: utils["space-xxl-below"],
};

export const spaceLeftClassNames: { [K in Space]: string } = {
  [Space.XXSmall]: utils["space-xxs-left"],
  [Space.XSmall]: utils["space-xs-left"],
  [Space.Small]: utils["space-s-left"],
  [Space.Medium]: utils["space-m-left"],
  [Space.XMedium]: utils["space-xm-left"],
  [Space.Large]: utils["space-l-left"],
  [Space.XLarge]: utils["space-xl-left"],
  [Space.XXLarge]: utils["space-xxl-left"],
};
