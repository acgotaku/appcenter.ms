import * as React from "react";
import * as classNames from "classnames/bind";
import { Block, BlockBorderRadius, MaterialShadow, BlockProps, BlockPadding } from "../block";
import { DialogProps, Dialog } from "./dialog";
const css = require("./scrollable-dialog.scss");
const cx = classNames.bind(css);

export interface ScrollableDialogProps extends DialogProps {
  header: BlockProps["header"];
  bottomBar?: JSX.Element;
  children: JSX.Element;
  fullHeight?: boolean;
  maxHeight?: number;
}

export class ScrollableDialog extends React.PureComponent<ScrollableDialogProps> {
  public render() {
    const { header, bottomBar, children, blockTagName, fullHeight, maxHeight, ...props } = this.props;
    const style = maxHeight
      ? { maxHeight: maxHeight - parseInt(css.topBarHeight, 10) - (bottomBar ? parseInt(css.bottomBarHeight, 10) : 0) }
      : undefined;

    return (
      <Dialog {...props}>
        {(overlayInjectedProps) => (
          <Block
            dividedHeader
            header={header}
            shadow={MaterialShadow.OverlayIntense}
            borderRadius={BlockBorderRadius.Large}
            padding={BlockPadding.Modal}
            tagName={blockTagName}
            {...overlayInjectedProps}
            className={cx(overlayInjectedProps.className, css.scrollableDialog, { fullHeight, withBottomBar: bottomBar })}
          >
            {(BlockPadding) => (
              <>
                <div className={css.scrollContainer} style={style}>
                  <BlockPadding>{children}</BlockPadding>
                </div>
                {bottomBar}
              </>
            )}
          </Block>
        )}
      </Dialog>
    );
  }
}
