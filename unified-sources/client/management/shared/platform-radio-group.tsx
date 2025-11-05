import * as React from "react";
import { observer } from "mobx-react";
import { RadioGroupProps, Formsy, Radio, Pill } from "@root/shared";
import { PLATFORM, IPlatform } from "@lib/common-interfaces/app";
import { withTranslation, WithTranslation } from "react-i18next";
import { getAvailablePlatforms, isPlatformInPreview } from "@root/lib/utils/app-platform";

const styles = require("./platform-radio-group.scss");

export interface PlatformRadioGroupProps extends RadioGroupProps {
  os: string;
  onChange?: (platform: PLATFORM) => void;
}

export const PlatformRadioGroup = withTranslation("management")(
  observer(
    class PlatformRadioGroup extends React.Component<PlatformRadioGroupProps & WithTranslation, {}> {
      public render() {
        const { t, os, ...passthrough } = this.props;
        return (
          <Formsy.RadioGroup {...passthrough}>
            {getAvailablePlatforms(os).map((platform: IPlatform, index: number) => {
              return (
                <Radio key={index} value={platform.value}>
                  {platform.displayName}
                  {isPlatformInPreview(platform.value) ? <Pill className={styles["preview"]}>{t("common:preview")}</Pill> : null}
                </Radio>
              );
            })}
          </Formsy.RadioGroup>
        );
      }
    }
  )
);
