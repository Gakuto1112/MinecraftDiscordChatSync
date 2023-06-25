import readline from "readline";

/**
 * 標準入出力のユーティリティ関数群
 */

/**
 * 文字列を標準出力する。
 * @param message 出力対象の文字列（string型以外でも可）
 */
export function print(message: any): void {
    console.info(message);
}

/**
 * 文字列をヒントとして出力する。
 * @param message 出力対象の文字列
 */
export function hint(message: string): void {
    console.info(`\u001b[32m[HINT!] ${message}\u001b[0m`);
}

/**
 * 文字列を警告として出力する。
 * @param message 出力対象の文字列
 */
export function warn(message: string): void {
    console.warn(`\u001b[33m[WARNING!] ${message}\u001b[0m`);
}

/**
 * 文字列をエラーとして出力する。
 * @param message 出力対象の文字列
 */
export function error(message: string): void {
    console.error(`\u001b[31m[ERROR!] ${message}\u001b[0m`);
}

/**
 * 標準入力を1行受け付けて、入力した文字列を返す。
 * @returns 標準入力から入力された文字列1行
 */
export async function input(): Promise<string> {
    return new Promise((resolve: (value: string|PromiseLike<string>) => void) => {
        process.stdout.write("> ");
        const reader: readline.Interface = readline.createInterface({input: process.stdin});
        reader.addListener("line", (line: string) => {
            reader.close();
            resolve(line);
        });
    });
}