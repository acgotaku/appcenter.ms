import { useState } from "react";

export function useFocus(
  initialIsFocused?: boolean,
  props: Pick<React.HTMLAttributes<HTMLElement>, "onFocus" | "onBlur"> = {}
): [boolean, Pick<React.HTMLAttributes<HTMLElement>, "onFocus" | "onBlur">] {
  const [isFocused, setIsFocused] = useState(initialIsFocused);
  const { onFocus, onBlur } = props;
  return [
    !!isFocused,
    {
      onFocus: (event) => {
        setIsFocused(true);
        if (onFocus) {
          onFocus(event);
        }
      },
      onBlur: (event) => {
        setIsFocused(false);
        if (onBlur) {
          onBlur(event);
        }
      },
    },
  ];
}
