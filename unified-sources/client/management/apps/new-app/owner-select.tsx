import * as React from "react";
import {
  Select,
  Option,
  OrganizationIcon,
  Gravatar,
  Trigger,
  DropdownButton,
  IconItem,
  MediaObject,
  Space,
  Text,
  Size,
  UserInitialsAvatar,
} from "@root/shared";
import { IUser, IAppOwner } from "@lib/common-interfaces";

const styles = require("./owner-select.scss");

type Owner = {
  name: IAppOwner["name"];
  email?: IAppOwner["email"];
  display_name?: IAppOwner["display_name"];
};

export interface OwnerSelectProps {
  label: string;
  currentUser: IUser;
  owners: Owner[];
  value: Owner;
  onChange: (value: Owner) => void;
  portaled?: boolean;
}

export class OwnerSelect extends React.Component<OwnerSelectProps, {}> {
  public render() {
    const { owners, value, label, portaled } = this.props;

    return (
      <div>
        <span className={styles["label"]} id="owner-label">
          {label}
        </span>
        <Select
          data-test-id="owner-select"
          aria-label={label}
          name="owner"
          className={styles.select}
          value={value.name}
          onChange={this.onChange}
          minListWidth={300}
          portaled={portaled}
          backdropClassName={portaled ? styles.backdrop : null}
        >
          <Trigger>
            <DropdownButton input className={styles.trigger}>
              <MediaObject hSpace={Space.XXSmall}>
                {this.iconElement(value)}
                <Text ellipsize size={Size.Medium}>
                  {this.displayString(value)}
                </Text>
              </MediaObject>
            </DropdownButton>
          </Trigger>
          {owners.map((o) => {
            return (
              <Option key={o.name} value={o.name} text={this.displayString(o)}>
                <IconItem title={this.displayString(o)} icon={this.iconElement(o)} inline />
              </Option>
            );
          })}
        </Select>
      </div>
    );
  }

  /**
   * Handles the change of selection of the Owner.
   */
  private onChange = (value: string[] | string): void => {
    const { onChange, owners } = this.props;

    if (typeof onChange !== "function") {
      return;
    } else {
      onChange(this.findOwner(owners, value as string));
    }
  };

  /**
   * Finds the owner using the name.
   */
  private findOwner(owners: Owner[], name: string): Owner {
    if (!owners || !name || owners.length === 0) {
      return undefined as any;
    }

    return owners.find((o) => {
      return o.name === name;
    })!;
  }

  /**
   * Get owner's icon.
   */
  private iconElement(owner: Owner): JSX.Element {
    const { currentUser } = this.props;

    return currentUser.name === owner.name ? ( // If it's the current user, show the Gravatar
      // TODO: Switch to 24px after https://ghe-us.microsoft.com/mobile-services/mobile-center-portal/issues/3208 is fixed.
      <Gravatar email={owner.email} size={20} fallback={<UserInitialsAvatar initialsName={owner.name} size={20} />} />
    ) : (
      <OrganizationIcon className={styles.icon} organization={owner} size={20} />
    );
  }

  /**
   * Get owner's display string
   */
  private displayString(owner: Owner): string {
    return owner.display_name || owner.name;
  }
}
