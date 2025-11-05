import * as React from "react";
import { reaction, Lambda } from "mobx";
import { StandaloneModalProps, StandaloneModal } from "./standalone-modal";
import { Changeable } from "../../common-interfaces";
import { MobileSearchInput } from "../../input";
import { Page } from "../../page";
import { Grid, GridSpacing, RowCol } from "../../grid";
import { layoutStore } from "@root/stores";
import { Omit } from "@lib/common-interfaces";
import { UpdateBlocker } from "@root/shared/update-blocker";
import { PageHeader } from "../../header-area";
import { noop } from "lodash";
const css = require("./search-modal.scss");

export interface SearchModalProps extends Omit<StandaloneModalProps, "children">, Changeable<HTMLInputElement> {
  title: string;
  resultsCount: number;
  placeholder?: string;
  searching?: boolean;
  renderSearchInput?: (
    inputProps: Changeable<HTMLInputElement> & Pick<SearchModalProps, "resultsCount" | "placeholder">
  ) => React.ReactNode;
  children?: React.ReactNode;
}

/**
 * A simple variant of StandaloneModal. It only renders when the mobile feature flag is turned on,
 * and it includes a search field (which can be customized if needed by the `renderSearchInput` prop).
 * Below the search field, it renders its children, which should be an array of Grid Rows (or
 * components which eventually render a Row as a root element).
 *
 * @example
 * <SearchModal value={query} onChange={updateQuery} title="Search apps" resultsCount={searchResults.length}>
 *   {searchResults.map((app) => <AppRow {...app} />)}
 * </SearchModal>
 */
export class SearchModal extends React.Component<SearchModalProps> {
  static displayName = "SearchModal";
  static defaultProps = {
    renderSearchInput: (props) => <MobileSearchInput {...props} />,
  };

  private dispose?: Lambda;

  componentDidMount() {
    this.dispose = reaction(
      () => layoutStore.isMobile,
      () => {
        if (!layoutStore.isMobile) {
          this.props.onRequestClose();
        }
      }
    );
  }

  componentWillUnmount() {
    this.dispose!();
  }

  render() {
    const {
      renderSearchInput,
      value,
      onChange,
      placeholder,
      resultsCount,
      title,
      children,
      searching,
      onRequestClose,
      ...props
    } = this.props;

    return (
      <StandaloneModal onRequestClose={noop} {...props}>
        <UpdateBlocker active={!props.visible}>
          <Page header={<PageHeader title={title} closeButton={true} onClickClose={onRequestClose} />} supportsMobile>
            <Grid rowSpacing={GridSpacing.XSmall}>
              <RowCol>{renderSearchInput!({ value, onChange, placeholder, resultsCount })}</RowCol>
              <RowCol visible={value.trim().length > 0 && !searching}>
                <Grid padded bordered rowSpacing={GridSpacing.Small} className={css.antiModalPadding}>
                  {children}
                </Grid>
              </RowCol>
            </Grid>
          </Page>
        </UpdateBlocker>
      </StandaloneModal>
    );
  }
}
