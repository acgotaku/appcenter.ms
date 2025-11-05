import * as React from "react";
import AutosizeInput from "react-input-autosize";
import { findDOMNode } from "react-dom";
import { t } from "@root/lib/i18n";
import { Icon, IconName } from "../icon";
import { IconSize } from "../common-interfaces";
import { Select } from "../select";
import { Item } from "../dropdown";
import { createAutocomplete } from "../autocomplete";
import { Option } from "../select/option";
import { Trigger } from "../trigger";
import { Pill } from "../pill";
import { IconTooltip } from "../tooltip";
import { DateRange } from "../utils/date-range";
import { QueryRule, QueryOperator, QueryProperty, QueryError } from "./types";
import { getDefaultInput, getMessage, getOperators } from "./utils";
import { animate } from "../utils/animate";
import { Easing } from "../utils/easings";
import { Keys } from "../utils/keys";
import { Color } from "../utils/color";
import { UnstyledButton } from "@root/shared";
import { AutocompleteComboboxWrapper } from "../autocomplete/autocomplete";
const Autocomplete = createAutocomplete<string>();
const tagStyles = require("../pill/pill.scss");
const BLUR_DELAY = 200;

export interface RuleProps {
  rule: QueryRule;
  properties: QueryProperty[];
  operators: QueryOperator[];
  propertyListWidth?: number;
  operatorListWidth?: number;
  onChange(rule: QueryRule, changes: Partial<QueryRule>): false | void;
  onRemove(rule: QueryRule): void;
  onFinishEditing(rule: QueryRule, error?: { code: QueryError; message: string }): void;
  styles: any;
}

type Refs = {
  rule?: HTMLDivElement;
  propertyTrigger?: HTMLElement;
  operatorTrigger?: HTMLElement;
  input?: HTMLElement;
  errorTooltip?: HTMLElement;
  removeButton?: HTMLElement;
};

export class Rule extends React.Component<RuleProps, {}> {
  private entered = false;
  private prevRule?: QueryRule;
  private blurTimer?: NodeJS.Timer;
  private animationId?: number;
  private ref: Refs = {};

  private captureRef = (which: keyof Refs) => (component: React.Component<any, any> | HTMLElement | null) => {
    const element = component && findDOMNode(component);
    if (element instanceof HTMLElement) {
      this.ref[which] = (which === "input" ? element.querySelector("input") : element) as HTMLDivElement;
    } else {
      this.ref[which] = undefined;
    }
  };

  private captureRule = this.captureRef("rule");
  private capturePropertyTrigger = this.captureRef("propertyTrigger");
  private captureOperatorTrigger = this.captureRef("operatorTrigger");
  private captureInput = this.captureRef("input");
  private errorTooltip = this.captureRef("errorTooltip");
  private removeButton = this.captureRef("removeButton");

  private onChangeProperty = (value: string) => {
    const { rule, properties, operators } = this.props;
    const property = properties.find((p) => p.name === value);

    if (property) {
      // Reset operator if the property propertyType changes
      const operator = property.types.includes(rule.operator.propertyType)
        ? rule.operator
        : getOperators(property.types, operators)[0];

      // Reset input if the inputType changes
      const input = rule.operator.inputType === operator.inputType ? rule.input : getDefaultInput(operator.inputType);

      // Auto-advance
      if (this.props.onChange(this.props.rule, { property, operator, input, error: undefined }) !== false) {
        setTimeout(() => this.ref.operatorTrigger && this.ref.operatorTrigger.click(), 0);
      }
    }
  };

  private onChangeOperator = (value: string) => {
    const { rule } = this.props;
    const operator = this.props.operators.find((o) => o.name === value);

    if (operator) {
      // In case of a boolean type, there's no input, so this is the last step
      // for defining the rule.
      if (operator.propertyType === Boolean) {
        const input = getDefaultInput(operator.inputType);
        this.props.onChange(rule, { operator, input, error: undefined });
        this.props.onFinishEditing(this.props.rule, this.getError());
        return;
      }

      // Reset input if the inputType changes
      const input =
        this.props.rule.operator.inputType === operator.inputType ? this.props.rule.input : getDefaultInput(operator.inputType);

      // Auto-advance
      if (this.props.onChange(rule, { operator, input, error: undefined }) !== false) {
        setTimeout(() => this.ref.input && this.ref.input.focus(), 0);
      }
    }
  };

  private onChangeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    this.props.onChange(this.props.rule, { input: value, error: undefined });
  };

  private onSelectCompletion = (input: string) => {
    this.props.onChange(this.props.rule, { input, error: undefined });
  };

  private onRemove = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    this.props.onRemove(this.props.rule);
  };

  private onBlur = () => {
    this.blurTimer = setTimeout(() => {
      const { rule } = this.props;
      const { prevRule = {} as QueryRule } = this;
      const error = this.getError();
      this.prevRule = undefined;
      if (error || prevRule.property !== rule.property || prevRule.operator !== rule.operator || prevRule.input !== rule.input) {
        this.props.onFinishEditing(rule, error);
      }

      const triggerEl = this.ref.errorTooltip && (this.ref.errorTooltip.firstChild as HTMLElement);
      if (triggerEl && document.activeElement === triggerEl) {
        if (!error) {
          // skip tooltip focus if there is no error
          if (this.ref.removeButton) {
            this.ref.removeButton.focus();
          }
        } else {
          // fix tooltip not being announced in Edge/Firefox
          triggerEl.blur();
          setTimeout(() => triggerEl.focus());
        }
      }
    }, BLUR_DELAY);
  };

  private onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.which === Keys.Enter) {
      this.props.onFinishEditing(this.props.rule, this.getError());
    }
  };

  private onFocus = () => {
    clearTimeout(this.blurTimer!);
    if (!this.prevRule) {
      this.prevRule = { ...this.props.rule };
    }
  };

  private onEnter = () => {
    const { rule } = this.ref;
    this.entered = true;
    if (rule) {
      rule.style.removeProperty("height");
      rule.style.removeProperty("overflow");
      rule.style.removeProperty("visibility");
      rule.style.removeProperty("position");
    }
  };

  private getError = () => {
    const { rule } = this.props;
    const { input } = rule;

    // typeof should be redundant, but is included for TS destructuring
    if (rule.operator.inputType === Number && typeof input === "string") {
      const isValid = !isNaN(parseFloat(input));
      return isValid
        ? undefined
        : {
            code: QueryError.ValueMustBeNumber,
            message: getMessage(QueryError.ValueMustBeNumber),
          };
    } else if (rule.operator.inputType) {
      const isValid = input instanceof DateRange ? input.isValid() : Boolean(input && input.trim().length);
      return isValid
        ? undefined
        : {
            code: QueryError.ValueMustBePresent,
            message: getMessage(QueryError.ValueMustBePresent),
          };
    }
  };

  private renderInput = () => {
    const { rule, styles } = this.props;
    switch (rule.operator.inputType) {
      case Number:
      case String:
        const focusHandlers = { onFocus: this.onFocus, onBlur: this.onBlur };
        const inputValue = rule.input;
        const placeholderText = rule.operator.inputType === Number ? "Enter number" : "Enter value";
        const inputElement = (
          <AutosizeInput
            ref={this.captureInput}
            type={rule.operator.inputType === Number ? "number" : "text"}
            placeholder={placeholderText}
            className={rule.error ? styles.inputError : styles.input}
            value={inputValue}
            onChange={this.onChangeInput}
            onKeyDown={this.onKeyDown}
            aria-required="true"
            step="any"
            aria-label={placeholderText}
            {...(rule.property.completions ? {} : focusHandlers)}
          />
        );

        return rule.property.completions ? (
          <Autocomplete
            data-test-id="rule-value"
            value={typeof inputValue === "string" ? inputValue : ""} // I know it’s a string but need to convince TypeScript
            items={rule.property.completions}
            openOnFocus={true}
            showMatchesOnEmpty={true}
            spinning={rule.property.loadingCompletions}
            onSelectItem={this.onSelectCompletion}
            aria-required="true"
            {...focusHandlers}
          >
            <AutocompleteComboboxWrapper>{inputElement}</AutocompleteComboboxWrapper>
          </Autocomplete>
        ) : (
          <span className={styles.inputRuleItem}>{inputElement}</span>
        );

      case DateRange:
        return null; // TODO

      default:
        return null;
    }
  };

  public componentWillAppear = (callback: Function) => {
    this.onEnter();
    callback();
  };

  public componentWillEnter = (callback: Function) => {
    const { rule } = this.ref;
    if (rule) {
      animate({
        startValue: 0,
        endValue: rule.offsetHeight,
        duration: 120,
        easing: Easing.OutCubic,
        executeStep: (value) => (rule.style.height = value + "px"),
        onScheduleFrame: (frameId) => (this.animationId = frameId),
        onFirstRun: () => {
          rule.style.visibility = "visible";
          rule.style.position = "relative";
        },
        done: () => {
          this.onEnter();
          if (this.ref.propertyTrigger) {
            this.ref.propertyTrigger.click();
          }
          callback();
        },
      });
    }
  };

  public componentWillLeave = (callback: Function) => {
    const { rule } = this.ref;
    if (rule) {
      rule.style.overflow = "hidden";
      animate({
        startValue: rule.offsetHeight,
        endValue: 0,
        duration: 120,
        easing: Easing.OutCubic,
        executeStep: (value) => (rule.style.height = value + "px"),
        onScheduleFrame: (frameId) => (this.animationId = frameId),
        done: () => {
          if (this.onEnter) {
            this.onEnter();
          }
          if (this.ref.propertyTrigger) {
            this.ref.propertyTrigger.click();
          }
          callback();
        },
      });
    }
  };

  public componentWillUnmount() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  public render() {
    const { rule, properties, operators, styles, propertyListWidth, operatorListWidth } = this.props;
    return (
      <div
        className={styles.rule}
        ref={this.captureRule}
        style={this.entered ? undefined : { visibility: "hidden", position: "absolute", overflow: "hidden" }}
      >
        <div className={styles.ruleItems}>
          <span className={styles.ruleItem}>
            <Select
              data-test-id="rule-property"
              aria-label={t("common:queryBuilder.rules.property")}
              compact
              value={rule.property.name}
              onChange={this.onChangeProperty}
              onBlur={this.onBlur}
              onFocus={this.onFocus}
              minListWidth={propertyListWidth || 170}
            >
              <Trigger activeClassName={tagStyles.active}>
                <Pill ref={this.capturePropertyTrigger}>{rule.property.name}</Pill>
              </Trigger>
              {properties.map((p) => (
                <Option key={p.name} value={p.name} text={p.name} />
              ))}
            </Select>
          </span>
          <span className={styles.ruleItem} key={rule.operator.name}>
            <Select
              data-test-id="rule-operator"
              aria-label={t("common:queryBuilder.rules.operator")}
              compact
              value={rule.operator.name}
              onChange={this.onChangeOperator}
              onBlur={this.onBlur}
              onFocus={this.onFocus}
              minListWidth={operatorListWidth || (rule.property.types.includes(Number) ? 240 : 170)}
            >
              <Trigger activeClassName={tagStyles.active}>
                <Pill ref={this.captureOperatorTrigger}>{rule.operator.name}</Pill>
              </Trigger>
              {getOperators(rule.property.types, operators).map((o) => (
                <Option key={o.name} value={o.name} text={o.name}>
                  <Item inline title={o.name} description={o.description} />
                </Option>
              ))}
            </Select>
          </span>
          {this.renderInput()}
        </div>
        <div className={styles.ruleRight}>
          <IconTooltip
            aria-label={rule.error}
            icon={IconName.StatusError}
            ref={this.errorTooltip}
            color={Color.Red}
            className={rule.error ? styles.error : styles.errorHidden}
            aria-hidden={!rule.error}
            tabIndex={!rule.error ? -1 : 0}
          >
            {rule.error}
          </IconTooltip>
          <UnstyledButton
            aria-label={t("common:queryBuilder.rules.remove")}
            onClick={this.onRemove}
            ref={this.removeButton}
            className={styles.removeButton}
          >
            <Icon icon={IconName.Remove} size={IconSize.Small} />
          </UnstyledButton>
        </div>
      </div>
    );
  }
}
