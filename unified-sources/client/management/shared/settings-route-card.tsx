import * as React from "react";
import { Link } from "react-router";
import { Card, ClickableIcon, IconName, HeaderArea } from "@root/shared";
import { Grid, RowCol, GridSpacing } from "@root/shared/grid";
import { SETTINGS_CARD_HEADING_PREFIX } from "@lib/constants/dom";
import { replaceSpacesWithDashes } from "@root/lib/utils/strings";
const styles = require("./settings-route-card.scss");

export interface SettingsRouteCardProps {
  title: string;
  subtitle?: string;
  to: string;
  viewOnly?: boolean;
  editable?: boolean;
  onClick?(event: React.MouseEvent<HTMLElement>): void;
}

export class SettingsRouteCard extends React.Component<SettingsRouteCardProps, {}> {
  public render() {
    const { title, subtitle, to, viewOnly, editable, children, ...passthrough } = this.props;
    return (
      <Card
        className={styles.link}
        aria-labelledby={SETTINGS_CARD_HEADING_PREFIX + replaceSpacesWithDashes(title)}
        {...passthrough}
        header={
          <HeaderArea inline title={title} subtitle={subtitle}>
            {!viewOnly ? (
              <Link to={to}>
                <ClickableIcon
                  tabIndex={-1}
                  className={styles.icon}
                  icon={editable ? IconName.Edit : IconName.Info}
                  large={false}
                  data-test-class="edit-button"
                />
              </Link>
            ) : null}
          </HeaderArea>
        }
      >
        <Grid rowSpacing={GridSpacing.Medium}>{children ? <RowCol>{children}</RowCol> : null}</Grid>
      </Card>
    );
  }
}
