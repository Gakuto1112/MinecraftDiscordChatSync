import { PluginBase } from "./PluginBase";
import { colors, sendMessageToDiscord } from "../MinecraftDiscordChatSync";

export class Plugin extends PluginBase {

    private advancements: { [key: string]: string }[] = [];

    constructor() {
        super();
        const fs = require("fs");
        fs.access("./plugins/data/advancements.tsv", fs.constants.R_OK, (error: any) => {
            if(error) {
                if(error.code == "ENOENT") {
                    console.error(colors.red + "\"./plugins/data/advancements.tsv\"が存在しません。" + colors.reset);
                    process.exit(1);
                }
                else if(error.code == "EPERM") {
                    console.error(colors.red + "\"./plugins/data/advancements.tsv\"の読み取り権限がありません。" + colors.reset);
                    process.exit(1);
                }
                else {
                    console.error(colors.red + "\"./plugins/data/advancements.tsv\"を読み取れません。" + colors.reset);
                    process.exit(1);
                }
            }
            else {
                fs.readFileSync("./plugins/data/advancements.tsv", "utf-8").split("\r\n").forEach((line: string, i: number) => {
                    if(i >= 1) {
                        const record: { [key: string]: string } = { };
                        const lineSplit = line.split("\t");
                        record.advancement = lineSplit[0];
                        record.name = lineSplit[1];
                        record.description = lineSplit[2];
                        this.advancements.push(record);
                    }
                });
            }
        });
    }
    private convertAdvancements(str: string): { [key: string]: string } {
        const result: { [key: string]: string } = { };
        let advancementFind: boolean = false;
        this.advancements.forEach((advancement: { [key: string]: string }, i: number) => {
            if(str.startsWith(advancement.advancement)) {
                result.name = this.advancements[i].name;
                result.description = this.advancements[i].description;
                advancementFind = true;
            }
        });
        if(!advancementFind) {
            result.name = str;
            result.description = "情報がありません";
        }
        return result;
    }
    public onMinecraftMessage(time: Date, thread: string, messageType: string, message: string): void {
        if(/^\w{2,16} has made the advancement \[.+?\]/.test(message)) {
            sendMessageToDiscord(":third_place: " + message.split(" ")[0] + " は進捗 [" + this.convertAdvancements(message.match(/\[.+?\]/)![0].slice(1, -1)).name + "] を達成した");
        }
        else if(/^\w{2,16} has reached the goal \[.+?\]/.test(message)) {
            sendMessageToDiscord(":second_place: " + message.split(" ")[0] + " は目標 [" + this.convertAdvancements(message.match(/\[.+?\]/)![0].slice(1, -1)).name + "] を達成した");
        }
        else if(/^\w{2,16} has completed the challenge \[.+?\]/.test(message)) {
            sendMessageToDiscord(":first_place: " + message.split(" ")[0] + " は挑戦 [" + this.convertAdvancements(message.match(/\[.+?\]/)![0].slice(1, -1)).name + "] を完了した");
        }
    }
}