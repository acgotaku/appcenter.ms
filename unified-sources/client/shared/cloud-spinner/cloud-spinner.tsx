import * as React from "react";

const styles = require("./cloud-spinner.scss");
const loadingCircle = require("./loading-circle.svg");
const loadingCloud = require("./loading-cloud.svg");

export const CloudSpinner: React.FunctionComponent = () => (
  <div className={styles.spinner}>
    <img className={styles.circle} src={loadingCircle} />
    <img className={styles.cloud} src={loadingCloud} />
  </div>
);
