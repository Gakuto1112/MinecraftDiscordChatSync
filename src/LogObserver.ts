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
        const logPath: string = MinecraftDiscordChatSync.config.getConfig("pathToLog");
        if(!fs.existsSync(logPath)) {
            try {
                const logDirPath = logPath.replace(/[^\/]+$/, "");
                if(!fs.existsSync(logDirPath)) fs.mkdirSync(logDirPath);
                fs.writeFileSync(logPath, "", {encoding: "utf-8"});
                MinecraftDiscordChatSync.logger.info("Created initial log file.");
            }
            catch(error: any) {
                if(error.code == "EPERM") {
                    //ログファイルへの書き込み権限がない
                    MinecraftDiscordChatSync.logger.error("No permission to write initial log file.");
                }
                else {
                    //その他エラー
                    MinecraftDiscordChatSync.logger.error(`An error occurred while writing initial log file.\n${error.stack}`);
                }
            }
        }
        await this.readLog(() => {});
        fs.watchFile(logPath, {persistent: true, interval: MinecraftDiscordChatSync.config.getConfig("logInterval") as number}, async (current: fs.Stats, previous: fs.Stats) => {
            if(current.ino > 0) {
                if(current.size < previous.size) this.linesPrev = 0;
                await this.readLog((line: string) => {
                    MinecraftDiscordChatSync.plugin.plugins.forEach((plugin: PluginBase) => {
                        try {
                            plugin.onNewLogRaw(line);
                        }
                        catch(error: any) {
                            MinecraftDiscordChatSync.logger.error(`An error occurred while executing "onNewLogRaw()".\n${error.stack}`);
                        }
                    });
                    const logData: RegExpMatchArray|null = line.match(/^(\[.*\]\s)*\[.*(\d{2}:\d{2}:\d{2}).*\]\s(\[.*\]\s)*\[(.+)\/(INFO|WARN|ERROR|FATAL)\](\s\[.*\])*:\s(.+)/);
                    if(logData != null) {
                        const dateParse: RegExpMatchArray = (logData[2].match(/^(\d{2}):(\d{2}):(\d{2})$/) as RegExpMatchArray);
                        const date: Date = new Date();
                        date.setHours(Number(dateParse[1]), Number(dateParse[2]), Number(dateParse[3]));
                        if((/^RCON running on (\d{1,3}\.){3}\d{1,3}:\d{1,5}$/.test(logData[7]))) MinecraftDiscordChatSync.rCon.connect();
                        else if(logData[7].startsWith("Stopping server")) MinecraftDiscordChatSync.rCon.disconnect();
                        MinecraftDiscordChatSync.plugin.plugins.forEach((plugin: PluginBase) => {
                            try {
                                plugin.onNewLog(date, logData[4], logData[5].toLowerCase() as LogType, logData[7]);
                            }
                            catch(error: any) {
                                MinecraftDiscordChatSync.logger.error(`An error occurred while executing "onNewLog()".\n${error.stack}`);
                            }
                        });
                    }
                    MinecraftDiscordChatSync.logger.debug(line);
                });    
            }
            else MinecraftDiscordChatSync.logger.error("Could not find the log. This can be occurred rarely even if settings of the system are fine because this system tried to read the log while the game server re-creates it. You don't worry about this error if this system is working well.");
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
                MinecraftDiscordChatSync.logger.error(`An error occurred while reading log file.\n${error.stack}`);
            }
            process.exit(1);
        }
    }
}