import * as React from "react";
import { uniqueId } from "lodash";
import { findDOMNode } from "react-dom";
import { ClickableIcon } from "../button/button";
import { notifyScreenReader } from "@root/stores/notification-store";
import { IconSize, IconArea, IconName, Icon } from "../icon/icon";
import { Color, isWindows } from "../utils";
import { DropZone } from "../drop-zone/drop-zone";
import { ImageLike } from "../common-interfaces";
import { ProgressBar } from "./progress-bar";
import { IDragDropUploadHandlerStore, ProgressBarStatus, UploadStatus } from "@root/lib/drag-drop-upload";
import { observable, action } from "mobx";
import { observer } from "mobx-react";
import { t } from "@root/lib/i18n";
const classNames = require("classnames");
const css = require("./drag-drop-upload.scss");

export enum DragDropUploadVariant {
  Inset,
  Card,
}

export interface DragDropUploadProps extends React.HTMLAttributes<HTMLElement> {
  handler: IDragDropUploadHandlerStore;
  title?: string;
  subtitle?: string;
  variant?: DragDropUploadVariant;
  icon?: IconName | ImageLike;
  accept?: string;
  deferredUpload?: () => boolean;
  styles?: any;
  isAppleConnect?: boolean;
}

@observer
export class DragDropUpload extends React.Component<DragDropUploadProps, {}> {
  public static defaultProps = { styles: css };

  public dropZone: DropZone | null = null;
  public actionIcon: HTMLElement | null = null;

  @observable private dragging = false;
  @observable private droppable = false;

  public labelId = uniqueId("dnd-upload-label");
  public a11yProps = isWindows ? { "aria-labelledby": this.labelId } : { "aria-describedby": this.labelId };

  public UNSAFE_componentWillUpdate(nextProps: DragDropUploadProps) {
    const {
      handler: { uploadStatus, file, errorMessage },
    } = nextProps;
    const uploadFailed = [
      UploadStatus.UploadFailedPost,
      UploadStatus.UploadFailedBlocks,
      UploadStatus.UploadFailedPatch,
      UploadStatus.UploadFailed,
    ].includes(uploadStatus!);
    if (uploadStatus === UploadStatus.UploadSuccessful) {
      notifyScreenReader({ message: t("common:dragDropUpload.onSuccess", file), delay: 1500 });
    } else if (uploadFailed) {
      notifyScreenReader({ message: errorMessage || t("common:dragDropUpload.onFailure"), delay: 1500 });
    }
  }

  public componentDidMount() {
    if (!this.props.handler.file) {
      setTimeout(() => this.focusDropZone(), 0); // wait until next react cycle before focusing - this is necessary in order for focusReturn in globalUIStore to function properly
    }
  }

  @action public onDragging = (droppable: boolean) => {
    this.dragging = true;
    this.droppable = droppable;
  };

  @action public offDragging = () => {
    this.dragging = false;
    this.droppable = false;
  };

  @action public onDrop = (file: { name: string; [key: string]: any }) => {
    this.reset();

    if (this.props.handler.initUpload) {
      this.props.handler.initUpload(file);
    }

    if (!(this.props.deferredUpload && this.props.deferredUpload())) {
      this.props.handler.upload(file, !this.props.isAppleConnect);
    }

    // Focus actionIcon
    //
    // In Edge, after launching the file selection dialog by pressing “Enter”
    // and selecting a file, another Enter key press is inexplicably triggered.
    // If the cancel button is focused when that happens, of course, it gets
    // clicked and `onReset` will be called, immediately cancelling the file
    // upload. Infuriatingly, a zero-length timeout is not long enough, so I
    // just picked 300 ms as a “long enough to matter for computers but short
    // enough to not be jarring to a human” value.
    setTimeout(
      () => {
        if (this.actionIcon) {
          this.actionIcon.focus();
        }
      },
      isWindows ? 300 : 0
    );
  };

  @action public onReset = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Clear local observables
    this.reset(event);

    this.focusDropZone();

    // Call handler’s reset
    if (this.props.handler.reset) {
      this.props.handler.reset();
    }
  };

  private focusDropZone() {
    // return focus to DropZone
    if (this.dropZone) {
      const dropZone = findDOMNode(this.dropZone) as HTMLElement;
      if (dropZone) {
        dropZone.focus();
      }
    }
  }

  @action public reset = (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.dragging = false;
    this.droppable = false;
    if (this.dropZone && this.dropZone.input) {
      this.dropZone.input.value = "";
    }
  };

  public render() {
    const { dragging, droppable } = this;
    const { handler, title, variant, children, styles } = this.props;
    const { uploadPercent, uploadStatus, file, errorMessage, progressBarStatus } = handler;

    const hasFile = [UploadStatus.UploadStarted, UploadStatus.UploadProcessing, UploadStatus.UploadSuccessful].includes(uploadStatus!);
    const failed = [
      UploadStatus.UploadFailedPost,
      UploadStatus.UploadFailedBlocks,
      UploadStatus.UploadFailedPatch,
      UploadStatus.UploadFailed,
    ].includes(uploadStatus!);
    const dragDropUploadClassName = classNames(
      styles["drag-drop-upload"],
      styles[variant === DragDropUploadVariant.Card ? "card" : "inset"],
      {
        [styles.droppable]: dragging && droppable,
        [styles.disabled]: !failed && dragging && !droppable,
        [styles.uploading]: uploadStatus === UploadStatus.UploadStarted || uploadStatus === UploadStatus.UploadProcessing,
        [styles.uploaded]: uploadStatus === UploadStatus.UploadSuccessful,
        [styles.failed]: failed,
        [styles["has-icon"]]: this.props.icon,
      }
    );
    const dropZoneTabIndex = hasFile ? -1 : 0;

    const fileIconColor = hasFile ? { color: Color.Blue } : {};
    const fileIcon =
      typeof this.props.icon === "string" ? (
        <Icon
          className={styles["file-icon"]}
          icon={this.props.icon}
          size={IconSize.Large}
          area={IconArea.Compact}
          {...fileIconColor}
        />
      ) : (
        this.props.icon || null
      );
    const subtitle = (() => {
      switch (true) {
        case !failed && !!file:
          return file!.name;
        case failed && dragging && droppable:
          return this.props.subtitle;
        case failed:
          return errorMessage || "Upload failed, please try again";
        default:
          return this.props.subtitle;
      }
    })();
    const actionIcon = <Icon icon={IconName[hasFile ? "Close" : "Upload"]} size={IconSize.XSmall} />;
    const actionHandler = hasFile ? { onClick: this.onReset } : {};
    const actionTabIndex = hasFile ? 0 : -1;

    return (
      <div className={dragDropUploadClassName} role="group">
        <DropZone
          accept={this.props.accept}
          className={styles["drop-zone"]}
          onDragging={this.onDragging}
          offDragging={this.offDragging}
          onDrop={this.onDrop}
          ref={(x) => (this.dropZone = x)}
          disabled={hasFile}
          tabIndex={dropZoneTabIndex}
          {...this.a11yProps}
        >
          {fileIcon}
          <div className={styles.column}>
            <div className={styles.row}>
              <div id={this.labelId} className={styles.header}>
                <div className={styles.title}>{title}</div>
                <div className={styles.subtitle} aria-live="assertive">
                  {subtitle}
                </div>
              </div>
              {uploadStatus !== UploadStatus.UploadProcessing ? (
                hasFile ? (
                  <ClickableIcon
                    data-test-id="asset-action-button"
                    role="button"
                    aria-label="Remove file"
                    className={styles["action-icon"]}
                    icon={actionIcon}
                    tabIndex={actionTabIndex}
                    ref={(x) => (this.actionIcon = findDOMNode(x as ClickableIcon) as HTMLElement)}
                    {...actionHandler}
                  />
                ) : (
                  actionIcon
                )
              ) : null}
            </div>
            {uploadStatus === UploadStatus.UploadSuccessful ? children : null}
          </div>
        </DropZone>
        <ProgressBar
          className={styles["progress-bar"]}
          progress={uploadPercent}
          status={uploadStatus === UploadStatus.UploadProcessing ? ProgressBarStatus.Indeterminate : progressBarStatus}
        />
      </div>
    );
  }
}

export { IDragDropUploadHandlerStore, ProgressBarStatus, UploadStatus };
