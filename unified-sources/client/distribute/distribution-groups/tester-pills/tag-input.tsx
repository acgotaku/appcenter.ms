import * as React from "react";
import * as memoize from "memoizee";
import AutosizeInput from "react-input-autosize";
import { Card, Changeable, Icon, IconName, Keys, canMoveSelectionLeft, mergeRefs } from "@root/shared";
import { compact, escapeRegExp } from "lodash";
import { ArrowKeyFocuser } from "@root/shared/hooks/use-arrow-key-focus";

const styles = require("./tag-input.scss");

export interface TagInputInjectedInputProps extends Changeable {
  "data-akf-default"?: true;
  "data-tag-input-input"?: true;
}

export interface TagInputInjectedTagProps {
  tabIndex: number;
  role: string;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
}

export interface TagInputProps<T> {
  tags: T[];
  delimiter: string[];
  renderTag: (props: TagInputInjectedTagProps, tag: T, index: number) => JSX.Element;
  renderInput: (
    Input: React.ComponentType<React.InputHTMLAttributes<HTMLInputElement>>,
    props: TagInputInjectedInputProps,
    afterAutocomplete: () => void
  ) => JSX.Element;
  onAddTag: (value: string) => void | false;
  onDeleteTag: (info: { index: number; tag: T }) => void;
  onComplete: (inputValue: string) => void;
}

export interface TagInputState {
  value: string;
  isFocused: boolean;
}

const getDelimiterRegExp = memoize((...delimiters: string[]) => new RegExp(`[${delimiters.map(escapeRegExp)}]+`), { max: 1 });

const Focusable = React.forwardRef(function Focusable(props: React.HTMLAttributes<HTMLElement>, ref: React.Ref<HTMLDivElement>) {
  return (
    <ArrowKeyFocuser orientation="horizontal">
      {(arrowKeyFocusProps) => (
        <div className={styles["pills-container"]} {...props} {...arrowKeyFocusProps} ref={mergeRefs(ref, arrowKeyFocusProps.ref)}>
          {props.children}
        </div>
      )}
    </ArrowKeyFocuser>
  );
});
Focusable.displayName = "TagInput.Focusable";

const Input = React.forwardRef(function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>, ref) {
  return <AutosizeInput ref={ref} className={[className, styles.autosizeInput].join(" ")} {...props} />;
});
Input.displayName = "TagInput.Input";

export class TagInput<T> extends React.Component<TagInputProps<T>, TagInputState> {
  private blurTimer?: NodeJS.Timer;
  private inputWrapperRef = React.createRef<HTMLDivElement>();
  state = {
    value: "",
    isFocused: false,
  };

  private get delimiter() {
    return getDelimiterRegExp(...this.props.delimiter);
  }

  private getNewTags(input: string) {
    const didMatch = this.delimiter.exec(input);
    const matches = input.split(this.delimiter);
    if (didMatch) {
      return compact(
        matches.map((match) => {
          if (match && match.trim()) {
            return match.trim();
          }
        })
      );
    }

    return [];
  }

  public submit() {
    const { onComplete } = this.props;
    onComplete(this.state.value);
    this.clearInput();
  }

  private onChangeInput: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const newTags = this.getNewTags(event.target.value);
    if (newTags.length) {
      const rejectedTags: string[] = [];
      newTags.forEach((tag) => {
        if (this.props.onAddTag(tag as any) === false) {
          rejectedTags.push(tag as any);
        }
      });

      if (!rejectedTags.length) {
        this.clearInput();
        return;
      }
      if (rejectedTags.length < newTags.length) {
        this.setState({ value: rejectedTags.join(this.props.delimiter[0]) });
        return;
      }
    }

    this.setState({ value: event.target.value });
  };

  private clearInput = () => {
    this.setState({
      value: "",
    });
  };

  private onClick: React.MouseEventHandler<HTMLElement> = () => {
    // Wait for a moment to see if something else focusable in there was clicked,
    // then if not, focus the input.
    setTimeout(() => {
      if (!this.state.isFocused && this.inputWrapperRef.current) {
        const input = this.inputWrapperRef.current.querySelector("[data-tag-input-input]");
        if (input instanceof HTMLElement) {
          input.focus();
        }
      }
    }, 0);
  };

  private onFocus: React.FocusEventHandler<HTMLElement> = () => {
    clearTimeout(this.blurTimer!);
    this.setState({ isFocused: true });
  };

  private onBlur: React.FocusEventHandler<HTMLElement> = () => {
    this.blurTimer = setTimeout(() => this.setState({ isFocused: false }), 0);
  };

  // Do things when we press certain keys
  private onKeyDown: React.KeyboardEventHandler<HTMLElement> = (event) => {
    const { onComplete, onDeleteTag } = this.props;
    if (event.which === Keys.Enter) {
      onComplete(this.state.value);
      this.clearInput();
      event.preventDefault();
    } else if (event.target instanceof HTMLInputElement && event.which === Keys.Backspace && !canMoveSelectionLeft(event.target)) {
      const index = this.props.tags.length - 1;
      onDeleteTag({ tag: this.props.tags[index], index });
    }
  };

  private onTagKeyDown = (event: React.KeyboardEvent<HTMLElement>, index: number) => {
    const { onDeleteTag } = this.props;
    // Handle deletion of focused tags
    if (event.which === Keys.Delete || event.which === Keys.Backspace) {
      onDeleteTag({ tag: this.props.tags[index], index });
    }
  };

  public render() {
    const { tags, renderTag, renderInput } = this.props;
    const { isFocused } = this.state;

    return (
      <Card
        bordered
        className={isFocused ? styles.focused : styles.root}
        onFocus={this.onFocus}
        onBlur={this.onBlur}
        onClick={this.onClick}
        tagName="div"
      >
        {(BlockPadding) => (
          <BlockPadding className={styles.container} onKeyDown={this.onKeyDown}>
            <Icon className={styles.icon} icon={IconName.AddUser} />
            <Focusable>
              {tags.map((tag, index) =>
                renderTag(
                  {
                    tabIndex: 0,
                    role: "button",
                    onKeyDown: (event) => this.onTagKeyDown(event, index),
                  },
                  tag,
                  index
                )
              )}
              <div className={styles.inputWrapper} ref={this.inputWrapperRef}>
                {renderInput(
                  Input,
                  {
                    onChange: this.onChangeInput,
                    value: this.state.value,
                    "data-akf-default": true,
                    "data-tag-input-input": true,
                  },
                  this.clearInput
                )}
              </div>
            </Focusable>
          </BlockPadding>
        )}
      </Card>
    );
  }
}
