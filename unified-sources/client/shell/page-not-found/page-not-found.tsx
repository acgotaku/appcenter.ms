import * as React from "react";
import { NotFound } from "@root/shared";
import { notFoundStore } from "../../stores/not-found-store";

const styles = require("./page-not-found.scss");

export interface PageNotFoundProps {
  // Nothing to add here yet.
}

export class PageNotFound extends React.Component<PageNotFoundProps, {}> {
  public render() {
    return (
      <div className={styles.container}>
        <NotFound message={notFoundStore.notFoundProps.message} />
      </div>
    );
  }
}
