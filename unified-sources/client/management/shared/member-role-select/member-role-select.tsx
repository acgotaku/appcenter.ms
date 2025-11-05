import * as React from "react";
import { t } from "@root/lib/i18n";
import { observer } from "mobx-react";
import { Select, Trigger, DropdownButton, Option, ButtonSize, IconItem } from "@root/shared";
import { CollaboratorRole, ALL_COLLABORATOR_ROLES } from "@lib/common-interfaces";
import { noop } from "lodash";
import { withTranslation, WithTranslation } from "react-i18next";
import { omit } from "lodash";

export interface MemberRoleSelectProps {
  role: CollaboratorRole;
  showDescriptions?: boolean;
  placeholder?: string;
  size?: ButtonSize;
  onChange: (value: CollaboratorRole) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

export const MemberRoleSelect = withTranslation("common")(
  observer(
    class MemberRoleSelect extends React.Component<MemberRoleSelectProps & WithTranslation, any> {
      public static defaultProps: MemberRoleSelectProps = {
        role: undefined as any,
        onChange: noop,
        size: ButtonSize.XSmall,
        showDescriptions: false,
        placeholder: t("access.role"),
      };

      private collaboratorRoleDescriptions: any;

      public UNSAFE_componentWillMount() {
        const { t } = this.props;
        this.collaboratorRoleDescriptions = {
          ["developer"]: {
            name: t("app.role.developer.name"),
            description: t("app.role.developer.description"),
          },
          ["manager"]: {
            name: t("app.role.manager.name"),
            description: t("app.role.manager.description"),
          },
          ["viewer"]: {
            name: t("app.role.viewer.name"),
            description: t("app.role.viewer.description"),
          },
        };
      }

      public render() {
        const {
          role,
          disabled,
          showDescriptions,
          placeholder,
          size,
          "aria-label": ariaLabel,
          ...passthrough
        }: Omit<typeof this.props, "i18n" | "onChange"> = omit(this.props, "i18n", "onChange");
        const roleData = this.collaboratorRoleDescriptions[role] || {};

        return (
          <Select
            aria-label={ariaLabel}
            placeholder={placeholder}
            disabled={disabled}
            value={role}
            onChange={(value: CollaboratorRole) => this._onChange(value)}
            minListWidth={showDescriptions ? 380 : undefined}
            deferRender
            {...passthrough}
          >
            <Trigger>
              <DropdownButton disabled={disabled} size={size}>
                <div data-test-id="member-role">{roleData.name || placeholder}</div>
              </DropdownButton>
            </Trigger>
            {ALL_COLLABORATOR_ROLES.map((role, key) => {
              return showDescriptions ? (
                <Option
                  key={key}
                  text={`${this.collaboratorRoleDescriptions[role].name}, ${this.collaboratorRoleDescriptions[role].description}`}
                  value={role}
                >
                  <IconItem
                    title={this.collaboratorRoleDescriptions[role].name}
                    description={this.collaboratorRoleDescriptions[role].description}
                  />
                </Option>
              ) : (
                <Option key={key} text={this.collaboratorRoleDescriptions[role].name} value={role} />
              );
            })}
          </Select>
        );
      }

      private _onChange(value: CollaboratorRole): void {
        const { onChange } = this.props;
        onChange(value);
      }
    }
  )
);
