import * as React from "react";
import { Button, Card, PrimaryButton } from "@root/shared";
import { CSSTransitionGroup } from "react-transition-group";
const css = require("./info-banner.scss");

export interface InfoBannerProps {
  title?: string;
  description: string;
  image?: string;
  visible: boolean;
  readMoreLink?: string;
  confirmButton?: string;
  dismissButton?: string;
  learnMoreButton?: string;
  readMoreText?: string;
  onDismiss?: () => void;
  onConfirm?: () => void;
  onLearnMore?: () => void;
  onReadMoreClick?: () => void;
  styles?: any;
  bannerBlue?: boolean;
}

/**
 * Component that displays an information banner. Usually displayed at the top of the page.
 */
export class InfoBanner extends React.Component<InfoBannerProps, {}> {
  public static defaultProps = { styles: css };

  public render() {
    const {
      image,
      title,
      description,
      readMoreText,
      readMoreLink,
      confirmButton,
      dismissButton,
      learnMoreButton,
      onDismiss,
      onConfirm,
      onLearnMore,
      styles,
      bannerBlue,
      visible,
      onReadMoreClick,
    } = this.props;

    return (
      <CSSTransitionGroup
        transitionName={{
          enter: styles.enter,
          enterActive: styles["enter-active"],
          leave: styles.leave,
          leaveActive: styles["leave-active"],
          appear: styles.appear,
          appearActive: styles["appear-active"],
        }}
        transitionAppear={true}
        transitionLeave={true}
        transitionEnterTimeout={700}
        transitionLeaveTimeout={700}
        transitionAppearTimeout={700}
      >
        {visible ? (
          <Card className={bannerBlue ? styles["blue-banner"] : styles["info-banner"]}>
            <div className={styles.container}>
              {image ? <img alt="" role="presentation" className={styles.image} src={image} /> : null}
              <div className={styles.content}>
                <div className={styles.title}>{title}</div>
                <div className={styles.description}>
                  {description}
                  {readMoreText && readMoreLink ? (
                    <span>
                      <a className={styles.hyperlink} href={readMoreLink} target="_blank" onClick={onReadMoreClick}>
                        {readMoreText}
                      </a>
                      .
                    </span>
                  ) : (
                    ""
                  )}
                </div>
              </div>
              {dismissButton && onDismiss ? (
                <div className={styles.link}>
                  <Button onClick={() => onDismiss()}>{dismissButton}</Button>
                </div>
              ) : null}
              {confirmButton && onConfirm ? (
                <div className={styles.link}>
                  <PrimaryButton onClick={() => onConfirm()}>{confirmButton}</PrimaryButton>
                </div>
              ) : null}
              {learnMoreButton && onLearnMore ? (
                <div className={styles.link}>
                  <PrimaryButton onClick={() => onLearnMore()}>{learnMoreButton}</PrimaryButton>
                </div>
              ) : null}
            </div>
          </Card>
        ) : null}
      </CSSTransitionGroup>
    );
  }
}
