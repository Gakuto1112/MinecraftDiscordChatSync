/**
 * ログの標準出力ライブラリ
 */
export class Logger {
    /**
     * 現在の日付時刻を示す文字列を返す。
     * @returns 現在の日付時刻を示す文字列
     */
    private static getDateTimeString(): string {
        return new Date().toLocaleString();
    }

    /**
     * ログ関数の呼び出し元のファイルパスを取得する。
     * @returns ログ関数の呼び出し元のファイルパス。パスが取得できなかったらundefinedを返す。
     *
     */
    private static getCallerFilePath(): string|undefined {
        const error: Error = new Error();
        if(error.stack) {
            const filePath = error.stack.split("\n")[3].replace(/\\/g, "/").match(new RegExp(`(?<=\\(${process.cwd().replace(/\\/g, "/")}).+(?=:\\d+:\\d+\\))`));
            if(filePath) return filePath.toString();
        }
    }

    /**
     * 標準出力にログを出力する。ログレベル：標準
     * @param message 出力するメッセージ
     */
    public static info(message: string): void {
        console.info(`[${Logger.getDateTimeString()}] [${Logger.getCallerFilePath()}] [\u001b[32mINFO\u001b[0m]: ${message}`);
    }

    /**
     * 標準出力にログを出力する。ログレベル：警告
     * @param message 出力するメッセージ
     */
    public static warn(message: string): void {
        console.info(`[${Logger.getDateTimeString()}] [${Logger.getCallerFilePath()}] [\u001b[33mWARN\u001b[0m]: ${message}`);
    }

    /**
     * 標準出力にログを出力する。ログレベル：エラー
     * @param message 出力するメッセージ
     */
    public static error(message: string): void {
        console.info(`[${Logger.getDateTimeString()}] [${Logger.getCallerFilePath()}] [\u001b[31mERROR\u001b[0m]: ${message}`);
    }
}