import * as React from "react";
import * as PropTypes from "prop-types";
import { EmptyState } from "@root/shared";
import { t } from "@root/lib/i18n";
import { ParagraphProps } from "@root/shared/typography";
import { EmptyStateButtonType } from "@root/shared/empty-state";

const image = require("./coming-soon.svg");

export interface ComingSoonProps {
  title: string;
  subtitle: string | ((subtitleProps: ParagraphProps) => JSX.Element);
  roadmapLink?: string;
  onClick?(): void;
  imgSrc?: string;
}

export class ComingSoon extends React.Component<ComingSoonProps, {}> {
  public static propTypes: React.WeakValidationMap<ComingSoonProps> = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
    roadmapLink: PropTypes.string,
    imgSrc: PropTypes.string,
  };

  public static defaultProps = {
    imgSrc: image,
  };

  public render() {
    const { title, subtitle, roadmapLink, imgSrc, onClick } = this.props;
    return (
      <EmptyState
        title={title}
        subtitle={subtitle}
        imgSrc={imgSrc}
        buttonText={t("comingSoon.roadmapButton")}
        hideButton={!roadmapLink && !onClick}
        href={roadmapLink}
        onClick={onClick}
        buttonType={EmptyStateButtonType.ExternalLink}
      />
    );
  }
}
