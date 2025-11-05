import * as React from "react";
import { findDOMNode } from "react-dom";
import * as PropTypes from "prop-types";
import { observer } from "mobx-react";
import {
  Page,
  TopBar,
  ButtonContainer,
  PrimaryButton,
  BackButton,
  TabSections,
  TabSectionsProps,
  TabSection,
  TabSectionProps,
  WizardTabs,
  NextButton,
  PanelOutlet,
  Color,
  Autofocus,
  PageProps,
  FooterArea,
  PageHeader,
} from "@root/shared";
import { globalUIStore, NavigationMode } from "@root/stores/global-ui-store";

const css = require("./wizard.scss");

export interface WizardRenderProps {
  [key: string]: (props: any) => JSX.Element;
}

export interface WizardProps extends PageProps {
  renderHeader: (props: WizardRenderProps) => React.ReactElement<any>;
  renderFooter?: (props: WizardRenderProps) => React.ReactElement<any>;
  children?:
    | React.ReactNode
    | ((TabSections: React.ComponentClass<TabSectionsProps>, TabSection: React.ComponentClass<TabSectionProps>) => React.ReactNode);
  childrenPassthrough?: React.ReactNode;
  step: number;
  loading?: boolean;
}

export interface WizardState {
  shouldFocusContent: boolean;
}

@observer
export class Wizard extends React.Component<WizardProps, WizardState> {
  public backBtnRef: React.RefObject<BackButton>;
  public nextBtnRef: React.RefObject<NextButton>;
  public doneBtnRef: React.RefObject<PrimaryButton>;

  constructor(props: WizardProps) {
    super(props);

    this.backBtnRef = React.createRef();
    this.nextBtnRef = React.createRef();
    this.doneBtnRef = React.createRef();

    this.state = {
      shouldFocusContent: false,
    };
  }

  public static childContextTypes: React.ValidationMap<any> = {
    inWizard: PropTypes.bool,
  };

  public getChildContext() {
    return { inWizard: true };
  }

  public UNSAFE_componentWillReceiveProps(nextProps: WizardProps) {
    if (nextProps.step !== this.props.step) {
      this.setState({ shouldFocusContent: false });
    }
  }

  public componentDidUpdate(prevProps: WizardProps) {
    if (globalUIStore.navigationMode === NavigationMode.Keyboard && this.props.renderFooter) {
      const backBtn = this.backBtnRef.current && (findDOMNode(this.backBtnRef.current) as HTMLButtonElement);
      const nextBtn = this.nextBtnRef.current && (findDOMNode(this.nextBtnRef.current) as HTMLButtonElement);
      const doneBtn = this.doneBtnRef.current && (findDOMNode(this.doneBtnRef.current) as HTMLButtonElement);
      const nextBtnDisabled = this.nextBtnRef.current && this.nextBtnRef.current.props.disabled;
      const doneBtnDisabled = this.doneBtnRef.current && this.doneBtnRef.current.props.disabled;
      if (prevProps.step !== this.props.step) {
        if (nextBtn && !nextBtnDisabled) {
          nextBtn.focus();
        } else if (nextBtn && nextBtnDisabled) {
          this.setState({ shouldFocusContent: true });
          // On last step focus content if Done button disabled, else focus Back button
        } else if (doneBtn && doneBtnDisabled && !this.state.shouldFocusContent) {
          this.setState({ shouldFocusContent: true });
        } else if (backBtn && doneBtn && !doneBtnDisabled) {
          backBtn.focus();
        }
        // Step already changed and loading is finished
      } else if (prevProps.loading === true && this.props.loading === false) {
        // Scenario where button disabled manually, e.g. user should choose option to proceed
        if (nextBtn && nextBtnDisabled) {
          this.setState({ shouldFocusContent: true });
        } else if (nextBtn) {
          nextBtn.focus();
        }
      }
    }
  }

  public render() {
    const { shouldFocusContent } = this.state;
    const { children, renderHeader, renderFooter, childrenPassthrough, ...props } = this.props;
    const { step, loading, ...passthrough } = props;

    const childContent = typeof children === "function" ? (children as Function)(TabSections, TabSection) : children;
    const topBarProps = { loading };
    const wizardTabsProps = { selectedIndex: step };

    return (
      <Page
        {...passthrough}
        topBar={renderHeader({
          TopBar: (props) => <TopBar {...topBarProps} {...props} />,
          PageHeader: (props) => <PageHeader {...topBarProps} {...props} />,
          WizardTabs: (props) => <WizardTabs {...wizardTabsProps} {...props} />,
        })}
        footer={
          renderFooter ? (
            <FooterArea alignRight>
              {renderFooter({
                ButtonContainer: (props) => <ButtonContainer {...props} />,
                BackButton: (props) => <BackButton ref={this.backBtnRef} {...props} />,
                NextButton: (props) => <NextButton ref={this.nextBtnRef} color={Color.Blue} progress={loading} {...props} />,
                DoneButton: (props) => <PrimaryButton ref={this.doneBtnRef} progress={loading} {...props} />,
              })}
            </FooterArea>
          ) : null
        }
      >
        <Autofocus className={css.autocompleteContainer} focus={shouldFocusContent}>
          {childContent}
        </Autofocus>
        {childrenPassthrough ? <PanelOutlet>{childrenPassthrough}</PanelOutlet> : null}
      </Page>
    );
  }
}
