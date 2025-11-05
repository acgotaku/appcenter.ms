import * as React from "react";
import * as PropTypes from "prop-types";
import { TransitionGroup } from "react-transition-group";
import { observer } from "mobx-react";
import { t } from "@root/lib/i18n";
import { noop, uniqueId } from "lodash";
import { Rule } from "./rule";
import operators from "./operators";
import { Icon, IconName } from "../icon/icon";
import { IconSize } from "../common-interfaces";
import { DateRange } from "../utils/date-range";
import { arrayLikeOf } from "../utils/prop-types";
import { QueryRule, QueryOperator, QueryProperty, QueryError } from "./types";
import { getFirstUnusedProperty, getOperators, getDefaultInput } from "./utils";
import { UnstyledButton } from "../unstyled-button/unstyled-button";
import { FakeButton } from "../fake-button";
const css = require("./query-builder.scss");

export interface QueryBuilderProps extends React.HTMLAttributes<HTMLElement> {
  operators?: QueryOperator[];
  properties: QueryProperty[];
  propertyListWidth?: number;
  operatorListWidth?: number;
  rules: QueryRule[];
  onAddRule(rule: QueryRule): void;
  onRemoveRule(rule: QueryRule): void;
  onChangeRule(rule: QueryRule, changes: Partial<QueryRule>): false | void;
  onFinishEditingRule?(rule: QueryRule, error?: { code: QueryError; message: string }): void;
  styles?: { [key: string]: string };
  hideAddButton?: boolean;
}

type DefaultProps = {
  operators: QueryOperator[];
  onFinishEditingRule(rule: QueryRule, error?: { code: QueryError; message: string }): void;
  styles: { [key: string]: string };
};

type QueryBuilderPropsWithDefaultProps = QueryBuilderProps & DefaultProps;

const propertyTypePropType = PropTypes.oneOf([Number, String, Boolean, Date]);

const operatorPropType = PropTypes.shape({
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  inputType: PropTypes.oneOf([Number, String, DateRange]),
  propertyType: propertyTypePropType.isRequired,
});

const propertyPropType = PropTypes.shape({
  name: PropTypes.string.isRequired,
  types: arrayLikeOf(propertyTypePropType).isRequired,
});

const rulePropType = PropTypes.shape({
  property: propertyPropType.isRequired,
  operator: operatorPropType.isRequired,
  input: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(DateRange)]),
  error: PropTypes.string,
});

export class QueryBuilder extends React.Component<QueryBuilderProps, {}> {
  public static Observer: typeof QueryBuilder;
  public static Rule = Rule;

  // Using custom `arrayLikeOf` validator since we’d like
  // to accept MobX observable arrays as inputs, which are
  // not actually arrays (Array.isArray returns false).
  public static propTypes: React.WeakValidationMap<QueryBuilderProps> = {
    operators: arrayLikeOf(operatorPropType).isRequired,
    properties: arrayLikeOf(propertyPropType).isRequired,
    propertyListWidth: PropTypes.number,
    operatorListWidth: PropTypes.number,
    rules: arrayLikeOf(rulePropType).isRequired,
    onAddRule: PropTypes.func.isRequired,
    onRemoveRule: PropTypes.func.isRequired,
    onChangeRule: PropTypes.func.isRequired,
    onFinishEditingRule: PropTypes.func.isRequired,
  };

  public static defaultProps = {
    operators,
    onFinishEditingRule: noop,
    styles: css,
  };

  private get isEmpty() {
    return !this.props.rules.length;
  }

  private addRule = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    const { onAddRule, rules, properties, operators } = this.props as QueryBuilderPropsWithDefaultProps;
    const property = getFirstUnusedProperty(rules, properties);
    const operator = getOperators(property.types, operators)[0];
    const input = getDefaultInput(operator.inputType);
    onAddRule({ property, operator, input, id: uniqueId("rule-"), error: undefined });
  };

  public render() {
    const {
      styles,
      operators,
      properties,
      propertyListWidth,
      operatorListWidth,
      rules,
      onChangeRule,
      onAddRule,
      onRemoveRule,
      onFinishEditingRule,
      hideAddButton,
      ...passthrough
    } = this.props as QueryBuilderPropsWithDefaultProps;
    const rulePassthrough = { operators, properties, propertyListWidth, operatorListWidth };
    const { Rule } = this.constructor as typeof QueryBuilder; // May be `Rule` or `observer(Rule)` (see comments below class)

    return (
      <div {...passthrough}>
        <TransitionGroup>
          {rules.map((rule, i) => (
            <Rule
              key={rule.id}
              rule={rule}
              onChange={onChangeRule}
              onRemove={onRemoveRule}
              onFinishEditing={onFinishEditingRule}
              styles={styles}
              {...rulePassthrough}
            />
          ))}
        </TransitionGroup>
        {hideAddButton ? null : (
          <FakeButton
            data-test-id="add-rule-button"
            aria-label={t("common:queryBuilder.rules.add")}
            className={this.isEmpty ? styles.empty : styles.add}
            onClick={this.addRule}
            tabIndex={this.isEmpty ? 0 : undefined}
            role={this.isEmpty ? "button" : undefined}
          >
            <div className={styles.addRuleText}>
              <span id="add-rule">Add rule</span>
            </div>
            <UnstyledButton
              aria-labelledby="add-rule"
              className={styles.addRuleButton}
              tabIndex={this.isEmpty ? -1 : 0}
              onClick={noop}
            >
              <Icon icon={IconName.Add} size={IconSize.Small} />
            </UnstyledButton>
          </FakeButton>
        )}
      </div>
    );
  }
}

// Provide MobX observer-wrapped classes for convenience.
// This way, data can be plain JS objects and updated immutably,
const Observer = observer(QueryBuilder);
// or it can be MobX observables and updated by mutation.
// When QueryBuilder renders a Rule, it will access it off of
// `this.constructor.Rule` so that QueryBuilder renders Rule,
// but observer(QueryBuilder) renders observer(Rule).
Observer.Rule = observer(Rule);
// This seems like a nice place to export the observer-wrapped
// variant. And with TS 2.3, IntelliSense will actually work:
// https://github.com/Microsoft/TypeScript/issues/12989
QueryBuilder.Observer = Observer;
