import * as React from "react";
import * as classNames from "classnames/bind";
import { DropZone } from "../drop-zone";
import { Icon, IconName } from "../icon";
import { Menu, Action } from "../menu";
import { Trigger } from "../trigger";
import { TextColor } from "../utils";
import { CircleProgressIcon } from "../circle-progress-icon";
import { DropZoneProps } from "../drop-zone/drop-zone";
import { IdleRenderer } from "../idle-renderer";
import { noop } from "lodash";
const css = require("./image-uploader.scss");
const cx = classNames.bind(css);

export interface ImageUploaderProps extends Pick<DropZoneProps, "accept" | "disabled"> {
  hasImage: boolean;
  onDelete(): void;
  onSelect(file: File): void;
  uploadProgress?: number | null | "indeterminate";
  round?: boolean;
  roundedSquare?: boolean;
  label?: string; // dropzone label for screenreaders
}

export class ImageUploader extends React.Component<ImageUploaderProps> {
  private dropZone = React.createRef<DropZone>();

  private showFilePicker = () => {
    if (this.dropZone && this.dropZone.current) {
      this.dropZone.current.showFilePicker();
    }
  };

  private renderDropZone() {
    const { round, roundedSquare, uploadProgress, onSelect, onDelete, hasImage, label, ...props } = this.props;
    return (
      <DropZone
        disabled={uploadProgress != null}
        {...props}
        ref={this.dropZone}
        onDrop={onSelect}
        className={css.imageUploader}
        {...(hasImage ? { onClick: noop } : null)}
        label={label}
      >
        {this.props.children}
        <div className={cx("overlay", { round, roundedSquare, disabled: !!uploadProgress })}>
          {uploadProgress != null ? (
            <CircleProgressIcon progress={typeof uploadProgress === "number" ? uploadProgress : undefined} />
          ) : (
            <IdleRenderer delay={50} delayInitialRender delayUpdates={false}>
              <Icon color={TextColor.White} icon={hasImage ? IconName.Edit : IconName.Upload} className={css.editIcon} />
            </IdleRenderer>
          )}
        </div>
      </DropZone>
    );
  }

  public render() {
    const { onDelete, hasImage } = this.props;
    return hasImage ? (
      <Menu data-test-id="image-uploader-menu">
        <Trigger activeClassName={css.openMenu}>
          <div>{this.renderDropZone()}</div>
        </Trigger>
        <Action text="Change Icon" onClick={this.showFilePicker} />
        <Action text="Delete Icon" onClick={onDelete} danger />
      </Menu>
    ) : (
      this.renderDropZone()
    );
  }
}
