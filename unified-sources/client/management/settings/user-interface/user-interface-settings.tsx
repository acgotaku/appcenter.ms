import * as React from "react";
import {
  Page,
  Panelify,
  PanelInjectedProps,
  Toggle,
  Card,
  HeaderArea,
  HorizontalSingleSelectActionList,
  HorizontalSingleSelectActionItem,
  PageHeader,
} from "@root/shared";
import { Grid, Row, Col, RowCol } from "@root/shared/grid";
import { Paragraph, Size, Space, TextAlignment } from "@root/shared/typography";
import { observer } from "mobx-react";
import { withTranslation, WithTranslation } from "react-i18next";
import { RouteComponentProps } from "react-router";
import { InterfaceSettingsStoreContext } from "@root/management/settings/user-interface/user-interface-settings-ui-store";

const styles = require("./user-interface-settings.scss");
const lightThemeImgSrc = require("../light-theme-thumb.svg");
const darkThemeImgSrc = require("../dark-theme-thumb.svg");

export const UserInterfaceSettings = Panelify(
  withTranslation(["common", "management"])(
    observer(
      class UserInterfaceSettings extends React.Component<
        PanelInjectedProps & WithTranslation & RouteComponentProps<any, any>,
        { isChecked: boolean }
      > {
        constructor(props) {
          super(props);
        }

        public render() {
          const { t } = this.props;

          return (
            <Page supportsMobile header={<PageHeader title={t("management:userInterface.title")} />}>
              <InterfaceSettingsStoreContext.Consumer>
                {({ themeValue, supportsAutoTheme, isAutoSelected, updateToggle, selectThemeOption }) => (
                  <Grid>
                    {supportsAutoTheme ? (
                      <RowCol>
                        <Card
                          header={
                            <HeaderArea id="AutoTheming" title={"Auto-Theming"} subtitle={"Use your device system theme"}>
                              <Toggle aria-labelledby="AutoTheming" checked={isAutoSelected} onChange={updateToggle}>
                                {isAutoSelected ? t("state.on") : t("state.off")}
                              </Toggle>
                            </HeaderArea>
                          }
                        ></Card>
                      </RowCol>
                    ) : null}

                    {!isAutoSelected ? (
                      <RowCol>
                        <Card header={<HeaderArea title={"Theme"} />}>
                          <div className={styles["theme-list"]}>
                            <HorizontalSingleSelectActionList name="theme-list" value={themeValue} onChange={selectThemeOption}>
                              <HorizontalSingleSelectActionItem
                                className={[styles["theme-item"], themeValue === "light" ? styles["theme-checked"] : ""].join(" ")}
                                value={"light"}
                              >
                                <Col width={160}>
                                  <img alt="Light Theme" src={lightThemeImgSrc} className={styles["theme-thumb"]} />
                                </Col>
                              </HorizontalSingleSelectActionItem>

                              <HorizontalSingleSelectActionItem
                                className={[styles["theme-item"], themeValue === "dark" ? styles["theme-checked"] : ""].join(" ")}
                                value={"dark"}
                              >
                                <Col width={160}>
                                  <img alt="Dark Theme" src={darkThemeImgSrc} className={styles["theme-thumb"]} />
                                </Col>
                              </HorizontalSingleSelectActionItem>
                            </HorizontalSingleSelectActionList>
                            <Grid>
                              <Row>
                                <Col>
                                  <Paragraph size={Size.Medium} spaceAbove={Space.Small} align={TextAlignment.Center}>
                                    Light
                                  </Paragraph>
                                </Col>
                                <Col>
                                  <Paragraph size={Size.Medium} spaceAbove={Space.Small} align={TextAlignment.Center}>
                                    Dark
                                  </Paragraph>
                                </Col>
                              </Row>
                            </Grid>
                          </div>
                        </Card>
                      </RowCol>
                    ) : null}
                  </Grid>
                )}
              </InterfaceSettingsStoreContext.Consumer>
            </Page>
          );
        }
      }
    )
  )
);
