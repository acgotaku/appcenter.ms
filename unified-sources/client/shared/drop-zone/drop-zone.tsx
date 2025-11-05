import * as React from "react";
import { get, noop } from "lodash";
import { Keys } from "../utils/keys";
const classNames = require("classnames");
const css = require("./drop-zone.scss");

export interface DropZoneProps extends React.HTMLAttributes<HTMLElement> {
  disabled?: boolean;
  accept?: string;
  onDrop: (file: any) => void;
  onDragging?: (droppable: boolean) => void;
  offDragging?: () => void;
  label?: string; // for screenreaders
}

export interface DropZoneState {
  dragging: boolean;
  singleFile: boolean;
}

export class DropZone extends React.Component<DropZoneProps, DropZoneState> {
  public static defaultProps = {
    disabled: false,
    onDragging: noop,
    offDragging: noop,
    tabIndex: 0,
  };

  public input: HTMLInputElement | null = null;

  public showFilePicker() {
    if (this.input) {
      this.input.click();
    }
  }

  constructor(props: DropZoneProps) {
    super(props);
    this.state = { dragging: false, singleFile: false };
  }

  public render() {
    const { disabled, onDrop, onDragging, offDragging, className, accept, label, ...passthrough } = this.props;
    const dropZoneClassName = classNames(css["drop-zone"], className);

    return (
      <>
        <span
          role={disabled ? "" : "button"}
          className={dropZoneClassName}
          onClick={this.onClick}
          onKeyDown={this.onKeyDown}
          onDragLeave={this.onDrag}
          onDragOver={this.onDrag}
          onDrop={this.onDrop}
          aria-label={`upload ${label || ""}`} // we don't mention "dropzone" here as non-sighted users don't use mouse and so "button" is more meaningful for them
          {...passthrough}
        >
          {this.props.children}
        </span>
        <input
          data-test-id="drop-zone-input"
          accept={accept}
          className={css.input}
          type="file"
          ref={(x) => (this.input = x)}
          onChange={this.onDrop}
          onClick={this.onInputClick}
          tabIndex={-1}
          aria-hidden
        />
      </>
    );
  }

  /* Helpful Tips about retrieving the uploaded file:
   * - use `event.target` when the file was uploaded via <input> (i.e. the filepicker)
   * - use `event.dataTransfer` when the file was uploaded via <span> (i.e. drag/drop)
   *   o use `event.dataTransfer.items` pre-drop. you can access number of files but not file metadata or content
   *   o use `event.dataTransfer.files` post-drop. you can access file metadata (e.g. name, type)
   */

  public onClick = (event: React.MouseEvent<HTMLElement>) => {
    if (this.props.disabled) {
      return;
    }
    this.showFilePicker();
  };

  private onInputClick: React.MouseEventHandler<HTMLInputElement> = (event) => {
    event.stopPropagation();
  };

  public onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (this.props.disabled || (event.which !== Keys.Enter && event.which !== Keys.Space)) {
      return;
    }
    this.showFilePicker();
  };

  public onDrag = (event: any) => {
    event.stopPropagation();
    event.preventDefault();
    if (this.props.disabled) {
      return;
    }

    const dragging = ["dragenter", "dragover"].includes(event.type);
    // IE & Safari do not support DataTransfer.items (an instance of DataTransferItemList)
    const supportsDataTransferItemList = "DataTransferItemList" in window;
    const singleFile = get(event, "dataTransfer.items", []).length === 1;
    const droppable = dragging && (singleFile || !supportsDataTransferItemList);

    this.setState({ dragging, singleFile });
    dragging ? this.props.onDragging!(droppable) : this.props.offDragging!();
  };

  public onDrop = (event: any) => {
    event.preventDefault();
    if (this.props.disabled) {
      return;
    }

    // Check both `event.target.files` and `event.dataTransfer.files` because <span> and <input> both use this handler
    const files = get(event, "target.files", get(event, "dataTransfer.files", []));
    const singleFile = files.length === 1;
    const file = get(files, "0");

    this.setState({ dragging: false, singleFile: false });
    singleFile ? this.props.onDrop(file) : this.props.offDragging!();
  };
}
