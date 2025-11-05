import * as React from "react";
import { useState } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { logger } from "@root/lib/telemetry";
import { Formsy, Item, Trigger, DropdownButton, Text, Size, TextColor, Autofocus, Space, UnstyledButton } from "@root/shared";
import { Select } from "@root/shared/select/v2/select";
import { VALIDATIONS, VALIDATION_ERRORS } from "@root/management/utils/formsy/validations";

export interface CustomSuggestionProps {
  items: string[];
  value: string;
  onChange: (value: string) => void;
}

export interface CustomSuggestionState {
  input: boolean;
  autoFocus?: boolean;
}

const styles = require("./custom-suggestion-input.scss");

const CustomValue = "Custom";

const getItemText = (item: string) => (item === CustomValue ? "Custom..." : item);

export const CustomSuggestionInput = withTranslation(["management"])((props: CustomSuggestionProps & WithTranslation) => {
  const { t, onChange, value, items } = props;
  // @ts-ignore. [Should fix it in the future] Strict error.
  const [state, setState] = useState<CustomSuggestionState>({
    autoFocus: false,
    input: !!value && !items.includes(value),
  });

  const setSelectMode = () => {
    setState({ input: false, autoFocus: true });
    onChange("");
  };

  const onSelect = (value: string) => {
    logger.info("app/custom-suggestion-input/selected", {
      value,
    });
    if (value === CustomValue) {
      setState({ input: true, autoFocus: true });
      onChange("");
    } else {
      onChange(value);
    }
  };

  return state.input ? (
    <>
      <Autofocus focus={state.autoFocus!}>
        <Formsy.Input
          autoFocus={state.autoFocus}
          label={`${t("management:common.appReleaseType")}:`}
          type="text"
          name="release type"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder={t("management:common.appReleaseTypePlaceholder")}
          autoCorrect="none"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck="false"
          validations={VALIDATIONS.RELEASE_TYPE}
          validationErrors={VALIDATION_ERRORS.APP_RELEASE_TYPE}
          data-test-id="new-app-input-environment"
        />
      </Autofocus>
      <UnstyledButton onClick={setSelectMode}>
        <Text underline size={Size.Medium} spaceAbove={Space.XXSmall} color={TextColor.Secondary}>
          {t("management:common.appReleaseTypeReset")}
        </Text>
      </UnstyledButton>
    </>
  ) : (
    <>
      <span id="custom-suggestion-label" className={styles.label}>
        {t("management:common.appReleaseType")}:
      </span>
      <Autofocus focus={state.autoFocus!}>
        <Select
          className={styles.select}
          data-test-id="custom-suggestion-input"
          value={value}
          onSelectOption={onSelect}
          items={items.concat(CustomValue)}
          renderItem={(item: string) => <Item title={getItemText(item)} />}
          getText={getItemText}
          getValue={(item: string) => item}
          renderTrigger={() => (
            <Trigger>
              <DropdownButton aria-label={t("management:common.appReleaseType")} input className={styles.select}>
                {value ? (
                  value
                ) : (
                  <Text size={Size.Medium} color={TextColor.Secondary}>
                    {t("management:common.appReleaseTypePlaceholder")}
                  </Text>
                )}
              </DropdownButton>
            </Trigger>
          )}
        />
      </Autofocus>
    </>
  );
});
