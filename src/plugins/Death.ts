import fs from "fs";
import readline from "readline";
import { PluginBase } from "../PluginBase";

/**
 * 死亡メッセージのデータ
 */
type DeathMessageData = {
    /** 死亡メッセージを正規表現にしたもの */
    regExp: RegExp,
    /** 設定言語での死亡メッセージ */
    messageLocal: string
}

/**
 * プレイヤーが死んでしまった時にDiscordにメッセージを送信するプラグイン
 */
export class Death extends PluginBase {
    private readonly deathMessageMap: {[key: string]: any} = {};
    private isLoading: boolean = true; //データ読み込み中かどうか

    public async onLoad(): Promise<void> {
        this.logger.info("Loading death message data...");
        const locale: string = this.getConfig("locale");
        let readCount: number = 0;
        try {
            for await (const line of readline.createInterface({input: fs.createReadStream(`./locales/${locale}/death.tsv`, {encoding: "utf-8"})})) {
                if(readCount++ >= 1) {
                    const tsv: string[] = line.split("\t");
                    let currentPos = this.deathMessageMap;
                    const deathMessageChunks: string[] = tsv[0].split(" ");
                    deathMessageChunks.forEach((deathMessageChunk: string, index: number) => {
                        if(!/%[1-3]\$s/g.test(deathMessageChunk)) {
                            if(!currentPos[deathMessageChunk]) currentPos[deathMessageChunk] = {};
                            currentPos = currentPos[deathMessageChunk];
                        }
                        if(index == deathMessageChunks.length - 1) currentPos._data = {
                            regExp: new RegExp(tsv[0].replace(/%1\$s/g, "\\w{2,16}").replace(/%[23]\$s/g, ".+")),
                            messageLocal: tsv[1]
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
                this.logger.error(`An error occurred while reading death message file (/locales/${locale}/death.tsv).\n${error}`);
            }
            process.exit(1);
        }
    }
}