import * as React from "react";
import { noop } from "lodash";
import { Button, ButtonSize, ButtonProps } from "@root/shared";
import { LiveRegion } from "../live-region";
import { Color, ButtonColor } from "../utils";
import { ParagraphProps, TitleProps, Size, Space, TextColor, Paragraph, Title } from "@root/shared/typography";
import { ErrorBlock } from "@root/shared";
const classNames = require("classnames");
const css = require("./empty-state.scss");

const img = require("./empty.svg");

export enum EmptyStateImageSize {
  Regular,
  Large,
  Huge,
}

export enum EmptyStateButtonType {
  Button,
  Link,
  ExternalLink,
}

const imageSizes: { [K in EmptyStateImageSize]: "regular" | "large" | "huge" } = {
  [EmptyStateImageSize.Regular]: "regular",
  [EmptyStateImageSize.Large]: "large",
  [EmptyStateImageSize.Huge]: "huge",
};

export interface EmptyStateProps {
  title?: string | ((titleProps: TitleProps) => JSX.Element);
  subtitle?: string | ((subtitleProps: ParagraphProps) => JSX.Element);
  buttonText?: string;
  buttonColor?: ButtonColor;
  buttonSize?: ButtonSize;
  buttonProgress?: boolean;
  buttonType?: EmptyStateButtonType;
  errorMessage?: string;
  onClick?(event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>): void;
  imgSrc?: string;
  renderImage?: () => JSX.Element;
  className?: string;
  styles?: any;
  to?: any;
  href?: string;
  hideButton?: boolean;
  hideImage?: boolean;
  imageSize?: EmptyStateImageSize;
  "data-test-id"?: string;
  renderPrimaryButton?: (primaryButtonProps: ButtonProps) => JSX.Element;
  renderSecondaryButton?: (secondaryButtonProps: ButtonProps) => JSX.Element;
}

export class EmptyState extends React.Component<EmptyStateProps, {}> {
  public static defaultProps = {
    title: "Collecting Data…",
    subtitle: "App Center is awaiting analytics data from your apps",
    buttonText: "Learn more",
    buttonColor: Color.Blue,
    buttonProgress: false,
    buttonSize: ButtonSize.Small,
    buttonType: EmptyStateButtonType.Button,
    errorMessage: null,
    onClick: noop,
    imgSrc: img,
    renderImage: null,
    hideButton: false,
    hideImage: false,
    styles: css,
    "data-test-id": null,
  };

  public render() {
    const {
      styles,
      hideButton,
      hideImage,
      title,
      subtitle,
      imageSize,
      buttonType,
      buttonSize,
      renderPrimaryButton,
      renderSecondaryButton,
    } = this.props;
    const props = this.props;
    const imageClass = imageSize
      ? styles[`${imageSizes[imageSize]}-image`]
      : styles[`${imageSizes[EmptyStateImageSize.Regular]}-image`];
    const buttonDataTestId = props["data-test-id"] !== null ? props["data-test-id"] + "-button" : null;

    const renderedButton = (() => {
      return buttonType !== EmptyStateButtonType.Button ? (
        <a
          data-test-id={buttonDataTestId}
          href={props.href}
          onClick={props.onClick}
          target={buttonType === EmptyStateButtonType.ExternalLink ? "_blank" : undefined}
        >
          {props.buttonText}
        </a>
      ) : (
        <Button
          data-test-id={buttonDataTestId}
          size={buttonSize}
          color={props.buttonColor}
          progress={props.buttonProgress}
          to={props.to}
          onClick={props.onClick}
          href={props.href}
        >
          {props.buttonText}
        </Button>
      );
    })();

    const titleProps: TitleProps = { bold: false, size: Size.Large, color: TextColor.Primary, spaceBelow: Space.XSmall };
    const renderedTitle = (() => {
      if (typeof title === "string") {
        return <Title {...titleProps}>{title}</Title>;
      } else {
        return title!(titleProps);
      }
    })();

    const subtitleProps: ParagraphProps = { size: Size.Medium, color: TextColor.Secondary, spaceBelow: Space.Medium };
    const renderedSubtitle = (() => {
      if (typeof subtitle === "string") {
        return <Paragraph {...subtitleProps}>{subtitle}</Paragraph>;
      } else {
        return subtitle!(subtitleProps);
      }
    })();

    const primaryButtonProps: ButtonProps = { color: Color.Blue, size: ButtonSize.Normal };
    const renderedPrimaryButton = (() => {
      if (renderPrimaryButton) {
        return renderPrimaryButton!(primaryButtonProps);
      }
    })();

    const secondaryButtonProps: ButtonProps = { size: ButtonSize.Normal };
    const renderedSecondaryButton = (() => {
      // Render secondary button only if primary button is present
      if (renderPrimaryButton && renderSecondaryButton) {
        return renderSecondaryButton!(secondaryButtonProps);
      }
    })();

    const renderedImage = (() => {
      if (!hideImage && props.renderImage && typeof props.renderImage === "function") {
        return props.renderImage();
      }
      if (!hideImage && props.imgSrc && typeof props.imgSrc === "string") {
        return <img alt="" role="presentation" className={imageClass} src={props.imgSrc} />;
      }
      return null;
    })();

    return (
      <LiveRegion
        role="alert"
        className={classNames(this.props.className, styles["empty-state"])}
        data-test-id={this.props["data-test-id"]}
      >
        {renderedImage}
        {renderedTitle}
        {renderedSubtitle}
        <div className={styles["button-row"]}>
          {!hideButton && !renderPrimaryButton ? renderedButton : null /* Backwards compatible button */}
          {!hideButton ? renderedPrimaryButton : null}
          {!hideButton ? renderedSecondaryButton : null}
        </div>
        {props.errorMessage ? (
          <ErrorBlock data-test-id={props["data-test-id"] !== null ? props["data-test-id"] + "-error-block" : null}>
            {props.errorMessage}
          </ErrorBlock>
        ) : null}
      </LiveRegion>
    );
  }
}
