import fs from "fs";
import readline from "readline";
import { LogType, PluginBase } from "../PluginBase";

/**
 * 死亡メッセージのマップ要素
 */
type DeathMessageMap = {
    /** 次のマップデータ */
    map: {[key: string]: DeathMessageMap},
    /** 死亡メッセージのデータ */
    data?: DeathMessageLocale
};

/**
 * 死亡メッセージの言語データ
 */
type DeathMessageLocale = {
    /** グローバル（英語）での死亡メッセージ */
    global: string,
    /** 設定言語での死亡メッセージ */
    local: string
};

/**
 * プレイヤーが死んでしまった時にDiscordにメッセージを送信するプラグイン
 */
export class Death extends PluginBase {
    private readonly deathMessageMap: DeathMessageMap = {
        map: {}
    };
    private readonly entityData: {[key: string]: string} = {};
    private readonly deathMessageQueue: string[] = []; //データ読み込み中に死亡ログの候補を検出したらここに一時保持される。
    private isLoading: boolean = true; //データ読み込み中かどうか

    /**
     * 死亡メッセージを解析し、死亡メッセージだと判断したらDiscordにメッセージを送信する。
     * @param deathMessage 解析対象の死亡メッセージ
     */
    private sendDeathMessage(deathMessage: string) {
        const replacers: string[] = ["", "", ""];
        let replacerPos: number = 0;
        let currentPos: DeathMessageMap = this.deathMessageMap;
        let mapAdvancedPrev: boolean = false;
        deathMessage.split(" ").forEach((chunk: string) => {
            if(currentPos.map[chunk]) {
                currentPos = currentPos.map[chunk];
                if(!mapAdvancedPrev) {
                    replacerPos++;
                    mapAdvancedPrev = true;
                }
            }
            else {
                replacers[replacerPos] += `${replacers[replacerPos] == "" ? "" : " "}${chunk}`;
                mapAdvancedPrev = false;
            }
        });
        if(currentPos.data) {
            const deathMessage: DeathMessageLocale = {
                global: currentPos.data.global,
                local: currentPos.data.local
            }
            const entityName: string = this.entityData[replacers[1]] ? this.entityData[replacers[1]] : replacers[1];
            this.sendMessage(this.getLocale("bot.message.death", deathMessage.local.replace(/%1\$s/g, replacers[0]).replace(/%2\$s/g, entityName).replace(/%3\$s/g, replacers[2])));
            this.logger.info(deathMessage.global.replace(/%1\$s/g, replacers[0]).replace(/%2\$s/g, replacers[1]).replace(/%3\$s/g, replacers[2]));
        }
    }

    public async onLoad(): Promise<void> {
        this.logger.info("Loading death message data...");
        const locale: string = this.getConfig("locale");
        let readCount: number = 0;
        try {
            for await (const line of readline.createInterface({input: fs.createReadStream(`./locales/${locale}/death.tsv`, {encoding: "utf-8"})})) {
                if(readCount++ >= 1) {
                    const tsv: string[] = line.split("\t");
                    let currentPos: DeathMessageMap = this.deathMessageMap;
                    const deathMessageChunks: string[] = tsv[0].split(" ");
                    deathMessageChunks.forEach((deathMessageChunk: string, index: number) => {
                        if(!/%[1-3]\$s/g.test(deathMessageChunk)) {
                            if(!currentPos.map[deathMessageChunk]) currentPos.map[deathMessageChunk] = {
                                map: {}
                            };
                            currentPos = currentPos.map[deathMessageChunk];
                        }
                        if(index == deathMessageChunks.length - 1) currentPos.data = {
                            global: tsv[0],
                            local: tsv[1]
                        }
                    });
                }
            }
        }
        catch(error: any) {
            if(error.code == "ENOENT") {
                //死亡メッセージファイルがない
                this.logger.error(`The death message file (/locales/${locale}/death.tsv) does not exist.`);
            }
            else if(error.code == "EPERM") {
                //死亡メッセージファイルの読み取り権限がない
                this.logger.error(`No permission to read death message file (/locales/${locale}/death.tsv).`);
            }
            else {
                //その他エラー
                this.logger.error(`An error occurred while reading death message file (/locales/${locale}/death.tsv).\n${error.stack}`);
            }
            process.exit(1);
        }
        this.logger.info("Finished loading death message data.");
        this.logger.info("Loading entity data...");
        try {
            for await (const line of readline.createInterface({input: fs.createReadStream(`./locales/${locale}/entity.tsv`, {encoding: "utf-8"})})) {
                if(readCount++ >= 1) {
                    const tsv: string[] = line.split("\t");
                    this.entityData[tsv[0]] = tsv[1];
                }
            }
        }
        catch(error: any) {
            if(error.code == "ENOENT") {
                //エンティティファイルがない
                this.logger.error(`The entity file (/locales/${locale}/entity.tsv) does not exist.`);
            }
            else if(error.code == "EPERM") {
                //エンティティファイルの読み取り権限がない
                this.logger.error(`No permission to read entity file (/locales/${locale}/entity.tsv).`);
            }
            else {
                //その他エラー
                this.logger.error(`An error occurred while reading entity file (/locales/${locale}/entity.tsv).\n${error.stack}`);
            }
            process.exit(1);
        }
        this.logger.info("Finished loading entity data.");
        while(this.deathMessageQueue.length > 0) this.sendDeathMessage((this.deathMessageQueue.shift() as string));
        this.isLoading = false;
    }

    public onNewLog(_time: Date, _sender: string, _logType: LogType, message: string): void {
        if(/^\w{3,16} .+$/.test(message) && !/^\w{3,16} (.* )?\w{3}\['.+'\/\d{3}, l='.+', x=[\d.-]+, y=[\d.-]+, z=[\d.-]+\] .+$/.test(message) && !/^\w{3,16} (\(formerly known as \w{3,16}\) )?joined the game$/.test(message) && !/^\w{3,16} left the game$/.test(message)) {
            if(this.isLoading) this.deathMessageQueue.push(message);
            else this.sendDeathMessage(message);
        }
    }
}