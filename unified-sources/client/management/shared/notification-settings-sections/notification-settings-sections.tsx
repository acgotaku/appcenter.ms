import * as React from "react";
import { observer } from "mobx-react";
import { Col, Text, Select, Option, Checkbox, Size } from "@root/shared";
import { Grid, RowCol, GridSpacing, Row } from "@root/shared/grid";
import { Title } from "@root/shared/typography";
import { SettingType, SettingsSection, Setting } from "@root/data/management";
import { withTranslation, WithTranslation } from "react-i18next";
import { layoutStore } from "@root/stores/layout-store";
import { SelectSetting, CheckboxSetting } from "../../app-settings/notifications/data/notifications-model";
const styles = require("./notification-settings-sections.scss");

export interface NotificationSettingsSectionsProps {
  sections: SettingsSection<SelectSetting | CheckboxSetting>[];
  disabled: boolean;
  onCheckChange: (event: React.ChangeEvent<any>, setting: Setting<SettingType.Checkbox, boolean>) => void;
  onSelectChange: (value: string, setting: Setting<SettingType.Select, string>) => void;
}

export const NotificationSettingsSections = withTranslation("management")(
  observer(
    class NotificationSettingsSections extends React.Component<NotificationSettingsSectionsProps & WithTranslation, {}> {
      public render() {
        const { sections, disabled, onCheckChange, onSelectChange, t } = this.props;
        return sections.map((section, index) => {
          const firstSetting = section.settings[0];
          return (
            <RowCol key={section.title} className={index !== sections.length - 1 ? styles.bottomline : null}>
              <Grid rowSpacing={GridSpacing.XSmall}>
                <Row middle>
                  <Col>
                    <Title size={Size.Small}>{section.title}</Title>
                  </Col>
                </Row>
                <Row>
                  {firstSetting.type === SettingType.Checkbox && (
                    <Col>
                      <Checkbox
                        onChange={(event) => onCheckChange(event, firstSetting)}
                        checked={firstSetting.displayValues[firstSetting.selectedIndex]}
                        disabled={disabled}
                      >
                        {firstSetting.label}
                      </Checkbox>
                    </Col>
                  )}
                </Row>
                {section.settings.slice(firstSetting.type === SettingType.Checkbox ? 1 : 0).map((setting) => (
                  <>
                    <Row key={setting.label} middle>
                      <Col>
                        {setting.type === SettingType.Select ? (
                          <Text.asLabel size={Size.Medium} htmlFor={setting.id}>
                            {setting.label}
                          </Text.asLabel>
                        ) : null}
                      </Col>
                    </Row>
                    <Row>
                      <Col width={layoutStore.isMobile ? 12 : 8}>
                        {setting.type === SettingType.Select ? (
                          <Select
                            input
                            minListWidth={260}
                            onChange={(value: string) => onSelectChange(value, setting)}
                            value={setting.displayValues[setting.selectedIndex]}
                            disabled={disabled}
                            aria-label={setting.label}
                            id={setting.id}
                            data-test-id={setting.id}
                            className={styles.selectContainer}
                            triggerClassName={styles.select}
                          >
                            {setting.displayValues.map((text) => (
                              <Option key={text} value={text} text={t(`management:notifications.buildSettings.${text}`)} />
                            ))}
                          </Select>
                        ) : (
                          <Checkbox
                            onChange={(event) => onCheckChange(event, setting)}
                            checked={setting.displayValues[setting.selectedIndex]}
                            disabled={disabled}
                          >
                            {setting.label}
                          </Checkbox>
                        )}
                      </Col>
                    </Row>
                  </>
                ))}
              </Grid>
            </RowCol>
          );
        });
      }
    }
  )
);
