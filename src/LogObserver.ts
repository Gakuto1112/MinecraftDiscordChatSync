import fs from "fs";
import readline from "readline";
import iconv from "iconv";
import { MinecraftDiscordChatSync } from "./MinecraftDiscordChatSync";
import { PluginBase, LogType } from "./PluginBase";

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
            const stringConverter: iconv.Iconv = new iconv.Iconv(process.platform == "win32" ? "shift-jis" : "utf-8", "utf-8");
            await this.readLog((line: string) => {
                const logRaw: string = stringConverter.convert(line).toString();
                MinecraftDiscordChatSync.pluginManager.plugins.forEach((plugin: PluginBase) => {
                    try {
                        plugin.onNewLogRaw(line);
                    }
                    catch(error: any) {
                        MinecraftDiscordChatSync.logger.error(`An error occurred while executing "onNewLogRaw()".\n${error}`);
                    }
                });
                const logData: RegExpMatchArray|null = logRaw.match(/^\[(\d{2}:\d{2}:\d{2})\] \[(.+)\/([A-Z]+)\]: (.+)/);
                if(logData != null) {
                    const dateParse: RegExpMatchArray = (logData[1].match(/^(\d{2}):(\d{2}):(\d{2})$/) as RegExpMatchArray);
                    const date: Date = new Date();
                    date.setHours(Number(dateParse[1]), Number(dateParse[2]), Number(dateParse[3]));
                    MinecraftDiscordChatSync.pluginManager.plugins.forEach((plugin: PluginBase) => {
                        try {
                            plugin.onNewLog(date, logData[2], logData[3] as LogType, logData[4]);
                        }
                        catch(error: any) {
                            MinecraftDiscordChatSync.logger.error(`An error occurred while executing "onNewLog()".\n${error}`);
                        }
                    });
                }
                MinecraftDiscordChatSync.logger.debug(`New log: ${logRaw}`);
            });
        });
    }

    /**
     * ログファイルを読む。前回からの差分のみ読む。
     * @param lineFunction 読み込んだログ各行に対して実行する関数
     */
    private async readLog(lineFunction: (line: string) => void): Promise<void> {
        let readLines: number = 0; //今回の読み込みで既に読んだ行数
        for await (const line of readline.createInterface({input: fs.createReadStream(MinecraftDiscordChatSync.config.getConfig("pathToLog"))})) {
            if(readLines++ >= this.linesPrev) lineFunction(line);
        }
        this.linesPrev = readLines;
    }
}