import * as React from "react";
import { Link } from "react-router";
import { observer } from "mobx-react";
import * as PropTypes from "prop-types";
import { NavigationList } from "../list";
import { locationStore } from "@root/stores/location-store";
import { Grid, RowCol } from "../grid";
import { ListVirtualization } from "../list";
import { Text, Size } from "../typography";
import { PanelPosition } from "../panels/panel-position";

import * as styles from "./secondary-navigation.scss";

export interface ISecondaryNavigationItem {
  title: string;
  route: string;
}

export interface SecondaryNavigationProps {
  items: ISecondaryNavigationItem[];
}

@observer
export class SecondaryNavigation extends React.Component<SecondaryNavigationProps, {}> {
  public static defaultProps = {
    items: [],
  };

  public static childContextTypes = { panelPosition: PropTypes.number };

  public getChildContext() {
    return { panelPosition: PanelPosition.Secondary };
  }

  public render() {
    const { items } = this.props;
    const { pathname } = locationStore;

    return (
      <NavigationList
        items={items}
        virtualize={ListVirtualization.Never}
        activeItem={(i) => !!pathname && pathname.startsWith(i.route)}
        renderContainer={(props) => <Grid padded {...props} />}
        renderItem={(item, props) => (
          <RowCol {...props} className={styles.navLinkWrapper} role="listitem" data-test-id="user-settings-item">
            <Link {...props} className={styles.navLink} to={item.route}>
              <Text className={styles.linkText} size={Size.Medium} ellipsize>
                {item.title}
              </Text>
            </Link>
          </RowCol>
        )}
      />
    );
  }
}
