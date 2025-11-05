import * as React from "react";
import { RouteComponentProps } from "react-router";
import * as memoize from "memoizee";
import { isPanel } from "./panel";

const errorOnTranslatedComponent =
  process.env.NODE_ENV === "production"
    ? null
    : memoize(
        (Component: React.ComponentClass<any> | React.SFC<any>, wrapperName: string) => {
          throw new Error(
            `\`${Component.displayName || Component.name}\` was wrapped in @translate after @${wrapperName}. ` +
              `This causes some funny problems. To be safe, always make @${wrapperName} the outer-most decorator ` +
              `on your components. E.g.\n\n` +
              `// BAD:\n` +
              `@withTranslation(['common'])\n` +
              `@${wrapperName}\n` +
              `export class Collaborators extends React.Component<{}, {}>\n\n` +
              `// GOOD:\n` +
              `@${wrapperName}\n` +
              `@withTranslation(['common'])\n` +
              `export class Collaborators extends React.Component<{}, {}>\n\n`
          );
        },
        { length: 1 }
      );

const errorOnWithRouterComponent =
  process.env.NODE_ENV === "production"
    ? null
    : memoize(
        (Component: React.ComponentClass<any> | React.SFC<any>, wrapperName: string) => {
          throw new Error(
            `\`${Component.displayName || Component.name}\` was wrapped in @withRouter in addition to @${wrapperName}. ` +
              `This causes some funny problems, so Panelify passes your component \`router\` as a prop. ` +
              `You should remove \`withRouter\`, but can still continue to use \`this.props.router\`.`
          );
        },
        { length: 1 }
      );

export function checkForTranslatedComponents(routes: RouteComponentProps<any, any>["routes"], wrapperName: string) {
  if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
    routes.forEach((route) => {
      if (route.component && isPanel(route.component) && route.component.prototype["onI18nChanged"]) {
        errorOnTranslatedComponent!(route.component, wrapperName);
      }
    });
  }
}

export function checkForWithRouterComponent(Component: React.ComponentType<any>, wrapperName: string) {
  if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
    if (
      (Component.displayName && Component.displayName.startsWith("withRouter(")) ||
      (Component.prototype && Component.prototype["@@contextSubscriber/router/handleContextUpdate"])
    ) {
      errorOnWithRouterComponent!(Component, wrapperName);
    }
  }
}
