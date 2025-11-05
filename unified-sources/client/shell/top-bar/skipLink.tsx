import * as React from "react";

import { Button } from "@root/shared";

export const SkipLink = () => {
  return (
    <Button hiddenUntilFocus={true} href="#layout-viewport">
      Skip to content
    </Button>
  );
};
