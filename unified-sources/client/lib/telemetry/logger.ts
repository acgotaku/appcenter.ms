import { telemetry } from "./telemetry";

export type LogProperties = { [key: string]: string | string[] | number | boolean | undefined };

// Levels aligned with @appcenter/telemetry library. Critical and Fatal missing here.
enum LogLevel {
  Error = 3,
  Warn,
  Info,
  Verbose,
}

interface LogEmitter {
  (level: LogLevel, message: string, error: Error | undefined, properties: LogProperties): void;
}

const consoleEmitter: LogEmitter = (level: LogLevel, message: string, error: Error | undefined, properties: LogProperties): void => {
  let method = console.debug;

  switch (level) {
    case LogLevel.Info:
      method = console.info;
      break;
    case LogLevel.Warn:
      method = console.warn;
      break;
    case LogLevel.Error:
      method = console.error;
      break;
  }

  method.call(console, ...[message, error, properties].filter((arg) => !!arg));
};

const emitters: LogEmitter[] = [consoleEmitter];

function log(level: LogLevel, message: string, error: Error | undefined, properties: LogProperties | undefined) {
  emitters.forEach((emmiter) => emmiter(level, message, error, Object.assign({}, telemetry.commonProperties, properties)));
}

export namespace logger {
  /**
   * Console-only message
   *
   * Not sent to Geneva. Local debugging only.
   */
  export function verbose(message: string, properties?: LogProperties) {
    log(LogLevel.Verbose, message, undefined, properties);
  }

  /**
   * Event
   *
   * Use for significant events that you want to analyse in Geneva.
   */
  export function info(message: string, properties?: LogProperties) {
    log(LogLevel.Info, message, undefined, properties);
  }

  /**
   * Handled error
   *
   * Use for errors that should not involve DRI.
   */
  export function warn(message: string, error?: Error | undefined, properties?: LogProperties) {
    log(LogLevel.Warn, message, error, properties);
  }

  /**
   * Unhandled error
   *
   * Use for errors that should involve DRI.
   */
  export function error(message: string, error?: Error | undefined, properties?: LogProperties) {
    log(LogLevel.Error, message, error, properties);
  }
}
