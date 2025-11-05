import createActionComponent, { ActionProps } from "./create-action-component";

export type ActionTextProps = ActionProps<React.ButtonHTMLAttributes<HTMLButtonElement>>;

/**
 * ActionText is a simple stylistic wrapper around the Text component from `shared/typography`.
 * It renders text in the default link color (blue) with an underline and a pointer cursor, unless override props are applied.
 */
export const ActionText = createActionComponent<ActionTextProps>("button");
ActionText.displayName = "ActionText";
