import * as React from "react";
import { layoutStore } from "@root/stores";
import { observer } from "mobx-react";
const classNames = require("classnames");
const styles = require("./filler.scss");

const filler = observer((props: React.HTMLAttributes<HTMLElement> & { showLineWhenMobile?: boolean }) => {
  const { isMobile } = layoutStore;
  const { className, showLineWhenMobile } = props;
  return (
    <div className={classNames(styles.filler, { [styles.mobile]: isMobile, [styles.hideLine]: !showLineWhenMobile }, className)} />
  );
});

export default filler;
