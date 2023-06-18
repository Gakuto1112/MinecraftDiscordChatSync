import fs from "fs";
import iconv from "iconv-lite";
import { MinecraftDiscordChatSync } from "./MinecraftDiscordChatSync";
import { PluginBase, LogType } from "./PluginBase";
import { resolve } from "path";

/**
 * ログの更新を監視する
 */
export class LogObserver {
    /**
     * 前回読み取った際のログの行数
     */
    private linesPrev: number = 0;

    /**
     * ログファイルの監視を開始する。
     */
    public async observe(): Promise<void> {
        MinecraftDiscordChatSync.logger.info("Started log observation.");
        await this.readLog(() => {});
        fs.watchFile(MinecraftDiscordChatSync.config.getConfig("pathToLog"), {persistent: true, interval: 100}, async (current: fs.Stats, previous: fs.Stats) => {
            if(current.size < previous.size) this.linesPrev = 0;
            await this.readLog((line: string) => {
                MinecraftDiscordChatSync.plugin.plugins.forEach((plugin: PluginBase) => {
                    try {
                        plugin.onNewLogRaw(line);
                    }
                    catch(error: any) {
                        MinecraftDiscordChatSync.logger.error(`An error occurred while executing "onNewLogRaw()".\n${error}`);
                    }
                });
                const logData: RegExpMatchArray|null = line.match(/^\[(\d{2}:\d{2}:\d{2})\] \[(.+)\/([A-Z]+)\]: (.+)/);
                if(logData != null) {
                    const dateParse: RegExpMatchArray = (logData[1].match(/^(\d{2}):(\d{2}):(\d{2})$/) as RegExpMatchArray);
                    const date: Date = new Date();
                    date.setHours(Number(dateParse[1]), Number(dateParse[2]), Number(dateParse[3]));
                    if((/^RCON running on (\d{1,3}\.){3}\d{1,3}:\d{1,5}$/.test(logData[4]))) MinecraftDiscordChatSync.rCon.connect();
                    else if(logData[4].startsWith("Stopping server")) MinecraftDiscordChatSync.rCon.disconnect();
                    MinecraftDiscordChatSync.plugin.plugins.forEach((plugin: PluginBase) => {
                        try {
                            plugin.onNewLog(date, logData[2], logData[3] as LogType, logData[4]);
                        }
                        catch(error: any) {
                            MinecraftDiscordChatSync.logger.error(`An error occurred while executing "onNewLog()".\n${error}`);
                        }
                    });
                }
                MinecraftDiscordChatSync.logger.debug(line);
            });
        });
    }

    /**
     * ログファイルを読む。前回からの差分のみ読む。
     * @param lineFunction 読み込んだログ各行に対して実行する関数
     */
    private async readLog(lineFunction: (line: string) => void): Promise<void> {
        const destinationCharCode: string = MinecraftDiscordChatSync.config.getConfig("logCharCode");
        try {
            let readLines: number = 0; //今回の読み込みで既に読んだ行数
            const readStream = fs.createReadStream(MinecraftDiscordChatSync.config.getConfig("pathToLog"));
            let tempLogBuffer: Buffer = Buffer.alloc(2048);
            let bufferPointer: number = 0; //次に書き込むべきバッファーのインデックスを示す。
            readStream.addListener("data", (chunk: Buffer) => {
                chunk.forEach((charValue: number, index: number) => {
                    if(charValue == 0x0a || (charValue == 0x0d && chunk[index + 1] != 0x0a)) {
                        //改行コード（0x0a = \n, 0x0d = \r）
                        if(readLines++ >= this.linesPrev) lineFunction(iconv.decode(tempLogBuffer, destinationCharCode));
                        tempLogBuffer = Buffer.alloc(2048);
                        bufferPointer = 0;
                    }
                    else tempLogBuffer[bufferPointer++] = charValue;
                });
            });
            readStream.addListener("end", () => {
                this.linesPrev = readLines;
                resolve();
            });
        }
        catch(error: any) {
            if(error.code == "ENOENT") {
                //ログファイルがない
                MinecraftDiscordChatSync.logger.error("Log file does not exist.");
                process.exit(1);
            }
            else if(error.code == "EPERM") {
                //ログファイルの読み取り権限がない
                MinecraftDiscordChatSync.logger.error("No permission to read log file.");
            }
            else {
                //その他エラー
                MinecraftDiscordChatSync.logger.error(`An error occurred while reading log file.\n${error}`);
            }
            process.exit(1);
        }
    }
}