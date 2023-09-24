import * as logger from "@gakuto1112/nodejs-logger";

/**
 * "@gakuto1112/NodeJSLogger"をクラス化
 */
export class Logger {
    /**
     * Gets current module root path.
     * @returns Current root path
     */
    public getRootPath = logger.getRootPath;

    /**
     * Sets module root path. This is used to print relative path when outputting logs.
     * @param newPath New path to set
     * @throws {InvalidPathError} If specified path does not exist or is a file
     */
    public setRootPath = logger.setRootPath;

    /**
     * Gets whether to output colored logs or not.
     * @return Whether to output colored logs or not.
     */
    public getColoredLog = logger.getColoredLog;

    /**
     * Sets whether to output colored logs or not.
     * @param newValue New value
     */
    public setColoredLog = logger.setColoredLog;

    /**
     * Gets whether to output debug level logs or not.
     * @return Whether to output debug level logs or not
     */
    public getLogDebugLevel = logger.getLogDebugLevel;

    /**
     * Sets whether to output debug level logs or not.
     * @param newValue New value
     */
    public setLogDebugLevel = logger.setLogDebugLevel;

    /**
     * Outputs a log message. It won't be outputted if `logDebugLevel` is `false`. Log level: **DEBUG**
     * @param message A message to output
     */
    public debug = logger.debug;

    /**
     * Outputs an information message. Log level: **INFO**
     * @param message A message to output
     */
    public info = logger.info;

    /**
     * Outputs a warning message. Log level: **WARN**
     * @param message A message to output
     */
    public warn = logger.warn;

    /**
     * Outputs an error message. Log level: **ERROR**
     * @param message A message to output
     */
    public error = logger.error;
}