import fs from "fs";
import readline from "readline";
import { EmbedData, LogType, PluginBase } from "../PluginBase";

/**
 * 進捗データ
 */
type AdvancementData = {
    /** 設定言語での進捗名 */
    localName: string,
    /** 進捗の説明 */
    description: string
};

/**
 * 実績メッセージの種類
 */
type MessageType = "advancement" | "goal" | "challenge";

/**
 * パラメータで渡す実績データ
 */
type AdvancementParamData = {
    /** 取得したプレイヤーの名前 */
    player: string,
    /** 進捗の名前 */
    name: string,
    /** 進捗の種類（進捗・目標・挑戦） */
    type: MessageType
}

/**
 * 進捗達成時にDiscordにメッセージを送信するプラグイン
 */
export class Advancements extends PluginBase {
    private readonly advancementData: {[key: string]: AdvancementData} = {};
    private readonly advancementQueue: AdvancementParamData[] = []; //データ読み込み中に実績取得ログを検出したらここに一時保持される。
    private isLoading: boolean = true; //データ読み込み中かどうか

    private sendAdvancementMessage(advancement: AdvancementParamData) {
        let embed: EmbedData;
        const normalizedAdvancementName: string = advancement.name.replace(/"/g, "\\\"");
        const knownAdvancement: boolean = typeof this.advancementData[normalizedAdvancementName] == "object";
        if(knownAdvancement) embed = {
            title: this.advancementData[normalizedAdvancementName].localName,
            description: this.advancementData[normalizedAdvancementName].description
        }
        else embed = {
            title: advancement.name,
            description: this.getLocale("bot.embed.unknown_advancement.description")
        }
        switch(advancement.type) {
            case "advancement":
                embed.color = "b87333";
                this.sendMessage(this.getLocale("bot.message.advancement.advancement", advancement.player, knownAdvancement ? this.advancementData[normalizedAdvancementName].localName : advancement.name), embed);
                this.logger.info(`${advancement.player} has made the advancement [${advancement.name}].`);
                break;
            case "goal":
                embed.color = "c0";
                this.sendMessage(this.getLocale("bot.message.advancement.goal", advancement.player, knownAdvancement ? this.advancementData[normalizedAdvancementName].localName : advancement.name), embed);
                this.logger.info(`${advancement.player} has reached the goal [${advancement.name}].`);
                break;
            case "challenge":
                embed.color = "e6b422";
                this.sendMessage(this.getLocale("bot.message.advancement.challenge", advancement.player, knownAdvancement ? this.advancementData[normalizedAdvancementName].localName : advancement.name), embed);
                this.logger.info(`${advancement.player} has completed the challenge [${advancement.name}].`);
                break;
        }
    }

    public async onLoad(): Promise<void> {
        this.logger.info("Loading advancements data...");
        const locale: string = this.getConfig("locale");
        let readCount: number = 0;
        try {
            for await (const line of readline.createInterface({input: fs.createReadStream(`./locales/${locale}/advancements.tsv`, {encoding: "utf-8"})})) {
                if(readCount++ >= 1) {
                    const tsv: string[] = line.split("\t");
                    this.advancementData[tsv[0]] = {
                        localName: tsv[1],
                        description: tsv[2]
                    }
                }
            }
        }
        catch(error: any) {
            if(error.code == "ENOENT") {
                //進捗ファイルがない
                this.logger.error(`The advancement file (/locales/${locale}/advancement.tsv) does not exist.`);
            }
            else if(error.code == "EPERM") {
                //進捗ファイルの読み取り権限がない
                this.logger.error(`No permission to read advancement file (/locales/${locale}/advancement.tsv).`);
            }
            else {
                //その他エラー
                this.logger.error(`An error occurred while reading advancement file (/locales/${locale}/advancement.tsv).\n${error}`);
            }
            process.exit(1);
        }
        this.logger.info("Finished loading advancements data.");
        while(this.advancementQueue.length > 0) this.sendAdvancementMessage((this.advancementQueue.shift() as AdvancementParamData));
        this.isLoading = false;
    }

    public onNewLog(_time: Date, _sender: string, _logType: LogType, message: string): void {
        if(/^\w{2,16} has made the advancement \[.+?\]$/.test(message)) {
            //進捗達成
            const logData: RegExpMatchArray = (message.match(/^(\w{2,16}) has made the advancement \[(.+?)\]$/) as RegExpMatchArray);
            const param: AdvancementParamData = {
                player: logData[1],
                name: logData[2],
                type: "advancement"
            }
            if(this.isLoading) this.advancementQueue.push(param);
            else this.sendAdvancementMessage(param);
        }
        else if(/^\w{2,16} has reached the goal \[.+?\]$/.test(message)) {
            //目標達成
            const logData: RegExpMatchArray = (message.match(/^(\w{2,16}) has reached the goal \[(.+?)\]$/) as RegExpMatchArray);
            const param: AdvancementParamData = {
                player: logData[1],
                name: logData[2],
                type: "goal"
            }
            if(this.isLoading) this.advancementQueue.push(param);
            else this.sendAdvancementMessage(param);
        }
        else if(/^\w{2,16} has completed the challenge \[.+?\]$/.test(message)) {
            //挑戦達成
            const logData: RegExpMatchArray = (message.match(/^(\w{2,16}) has completed the challenge \[(.+?)\]$/) as RegExpMatchArray);
            const param: AdvancementParamData = {
                player: logData[1],
                name: logData[2],
                type: "challenge"
            }
            if(this.isLoading) this.advancementQueue.push(param);
            else this.sendAdvancementMessage(param);
        }
    }
}