import { PluginBase } from "./PluginBase";
import { colors, sendMessageToDiscord } from "../MinecraftDiscordChatSync";

interface AdvancementObject {
    id: string;
    name: string;
    description: string;
}

export class Plugin extends PluginBase {

    private advancements: AdvancementObject[] = [];

    constructor() {
        super();
        const fs = require("fs");
        let data: string;
        try {
            data = fs.readFileSync("./plugins/data/advancements.tsv", "utf-8");
        }
        catch(error: any) {
            if(error.code == "ENOENT") console.error(colors.red + "\"./plugins/data/advancements.tsv\"が存在しません。" + colors.reset);
            else if(error.code == "EPERM") console.error(colors.red + "\"./plugins/data/advancements.tsv\"の読み取り権限がありません。" + colors.reset);
            else console.error(colors.red + "\"./plugins/data/advancements.tsv\"を読み取れません。エラーコード：" + error.code + colors.reset);
            process.exit(1);
        }
        data.split("\r\n").forEach((line: string, i: number) => {
            if(i >= 1) {
                const record: AdvancementObject = { id: "",  name: "", description: "" };
                const lineSplit = line.split("\t");
                record.id = lineSplit[0];
                record.name = lineSplit[1];
                record.description = lineSplit[2];
                this.advancements.push(record);
            }
        });
    }
    private convertAdvancements(str: string): AdvancementObject {
        const result: AdvancementObject = { id: "",  name: "", description: "" };
        let advancementFind: boolean = false;
        this.advancements.forEach((advancement: AdvancementObject, i: number) => {
            if(advancement.id == str) {
                result.id = str;
                result.name = this.advancements[i].name;
                result.description = this.advancements[i].description;
                advancementFind = true;
            }
        });
        if(!advancementFind) {
            result.id = result.name = str;
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