import * as React from "react";
import { Observer, observer } from "mobx-react";
import { t } from "@root/lib/i18n";
import * as mergeProps from "merge-props";
import { TagInput, TagInputProps } from "@root/distribute/distribution-groups/tester-pills/tag-input";
import { Pill, Color, Autocomplete, Action, IconSize, Item, IconName } from "@root/shared";
import { IUser } from "@lib/common-interfaces";
import { AddTesterPillsInputUIStore, Tag } from "./add-tester-pills-input-ui-store";
import { IDistributionGroupUser } from "@root/distribute/models/distribution-group-user";
import { DistributionGroupDetailsStrings } from "@root/distribute/utils/strings";
import validations from "@root/shared/formsy/validation-rules";
import { notify } from "@root/stores";
import { AddTesterStore, IAddTesterInputStore } from "../../../shell/add-tester-input/add-tester-input";
import { AutocompleteComboboxWrapper } from "@root/shared/autocomplete/autocomplete";
const classNames = require("classnames");
const styles = require("./add-tester-pills-input.scss");

export interface AddTesterPillsInputProps {
  disabled?: boolean;
  addTesterStore: AddTesterStore;
  addTesterInputStore: IAddTesterInputStore;
  placeholderText: string;
  showAadGroups: boolean;
  label?: string; // for screenreaders only
}

@observer
export class AddTesterPillsInput extends React.Component<AddTesterPillsInputProps, {}> {
  private addTesterStore: AddTesterStore = this.props.addTesterStore;
  private testerInputStore: IAddTesterInputStore = this.props.addTesterInputStore;
  private store: AddTesterPillsInputUIStore = new AddTesterPillsInputUIStore();
  private tagInputRef: React.RefObject<TagInput<any>> = React.createRef<TagInput<any>>();

  displayTesterToastNotification(added: number, name?: string): void {
    if (added === 0) {
      return;
    }
    notify({
      persistent: false,
      message: t("distribute:testers.testerAdded", { count: added, others: added - 1, displayName: name }),
    });
  }
  externalSubmit() {
    this.tagInputRef.current!.submit();
  }

  private onInputChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const { value } = event.target;
    if (value && this.props.showAadGroups) {
      this.testerInputStore.searchGroupsDebounced(value);
    }
    this.addTesterStore.setAddTesterErrorMessage("");
  };

  autocompleteItemSelected(tester: IUser): void {
    if (!tester.display_name) {
      tester.display_name = tester.email;
    }
    this.store.addTag({
      isUser: !tester.aad_group_id,
      ...tester,
    });
  }

  private onAddTag(value: string): false | void {
    if (this.validateTag(value)) {
      this.store.addTag({
        isUser: true,
        display_name: value,
        email: value,
      });
    } else {
      return false;
    }
  }

  private submitTags(inputValue: string) {
    let added = 0;
    let currentName = "";
    const trimmedValue = inputValue.trim();
    if (trimmedValue) {
      this.onAddTag(trimmedValue);
    }
    this.store.tags.forEach((tester) => {
      if (tester.aad_group_id || tester.email !== "") {
        if (!tester.aad_group_id && this.addTesterStore.addTesterOrGroup(tester)) {
          currentName = tester.display_name!;
          added++;
        } else if (tester.aad_group_id && this.addTesterStore.addTesterOrGroup(tester)) {
          currentName = tester.display_name!;
          added++;
        }
      }
    });
    if (added) {
      this.displayTesterToastNotification(added, currentName);
    }
    this.store.clear();

    if (!this.validateTag(trimmedValue)) {
      notify({
        persistent: false,
        message: t("distribute:testers.testerInvalidInput"),
      });
    }
  }

  private validateTag(value: string) {
    return validations.isEmail(null, value);
  }

  render() {
    const { placeholderText, label } = this.props;
    const renderPillInput: TagInputProps<Tag>["renderInput"] = (Input, { value, ...props }, afterAutocomplete) => {
      return (
        <Autocomplete
          value={value}
          items={Array.from(this.testerInputStore.autocompleteItems)}
          renderItem={(user: IDistributionGroupUser) => (
            <Action text={user.name!} key={user.email}>
              <Item
                email={user.aad_group_id ? undefined : user.email}
                name={user.display_name}
                icon={user.aad_group_id ? IconName.AadGroup : undefined}
                iconSize={IconSize.Medium}
                iconColor={Color.White}
                description={user.aad_group_id ? DistributionGroupDetailsStrings.AADGroupDefaultDescription : user.email}
                data-test-class="autocomplete-list-item"
              />
            </Action>
          )}
          onSelectItem={(user) => {
            this.autocompleteItemSelected(user);
            afterAutocomplete();
          }}
          searchOptions={{
            keys: ["display_name", "email", "displayName"],
            findAllMatches: true,
            threshold: 0.4,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 1,
          }}
        >
          <AutocompleteComboboxWrapper>
            <Input
              aria-label={`${label ? label : placeholderText}`}
              placeholder={placeholderText}
              className={styles.input}
              {...mergeProps(props, { onChange: this.onInputChange })}
              value={value}
              data-test-id="add-tester-input"
            />
          </AutocompleteComboboxWrapper>
        </Autocomplete>
      );
    };
    return (
      <TagInput
        ref={this.tagInputRef}
        delimiter={["; ", ",\r\n"]}
        tags={this.store.tags}
        renderTag={(props, tag, index) => (
          <Pill
            color={Color.Gray}
            closeButton
            onClickClose={() => {
              this.store.deleteTag(tag);
            }}
            {...props}
            className={classNames(styles.pill)}
            key={`email-tag-${this.store.tags.indexOf(tag)}`}
          >
            {tag.display_name}
          </Pill>
        )}
        renderInput={(...args) => <Observer>{() => renderPillInput(...args)}</Observer>}
        onAddTag={(value) => {
          return this.onAddTag(value);
        }}
        onDeleteTag={({ tag }) => {
          this.store.deleteTag(tag);
        }}
        onComplete={(inputValue) => {
          this.submitTags(inputValue);
        }}
      />
    );
  }
}
