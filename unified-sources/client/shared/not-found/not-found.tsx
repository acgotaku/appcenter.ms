import * as React from "react";
import { Link } from "react-router";

const css = require("./not-found.scss");
const notFoundImage = require("./404-error-illustration.svg");

export interface NotFoundProps {
  message?: string;
  styles?: any;
}
export class NotFound extends React.Component<NotFoundProps, {}> {
  public static defaultProps: NotFoundProps = {
    styles: css,
    message: "",
  };

  public render() {
    const { styles, message } = this.props;

    return (
      <div className={styles.container}>
        <img alt="error occurred" width="395.96" height="282.67" src={notFoundImage} />
        <h1 className={styles.h1}>Oops... Sorry we couldn't find what you were looking for.</h1>
        <p className={styles.p}>{message}</p>
        <Link to="/">
          <div className={styles.button}>Go to home</div>
        </Link>
      </div>
    );
  }
}
