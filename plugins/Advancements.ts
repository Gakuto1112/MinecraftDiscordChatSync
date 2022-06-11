import { MessageEmbed } from "discord.js";
import { PluginBase } from "./PluginBase";
import { colors, settings, addEmbed, sendMessageToDiscord } from "../MinecraftDiscordChatSync";

interface AdvancementObject {
    id: string;
    name: string;
    description: string;
}

export class Plugin extends PluginBase {
    private advancements: AdvancementObject[] = [];

    constructor() {
        super();
        addEmbed("advancements");
        const fs = require("fs");
        let data: string;
        try {
            data = fs.readFileSync("./plugins/data/advancements.tsv", "utf-8");
        }
        catch(error: any) {
            if(error.code == "ENOENT") console.error(colors.red + "「./plugins/data/advancements.tsv」が存在しません。" + colors.reset);
            else if(error.code == "EPERM") console.error(colors.red + "「./plugins/data/advancements.tsv」の読み取り権限がありません。" + colors.reset);
            else console.error(colors.red + "「./plugins/data/advancements.tsv」を読み取れません。エラーコード：" + error.code + colors.reset);
            throw Error();
        }
        data.split(/\n/).forEach((line: string, i: number) => {
            if(i >= 1) {
                const record: AdvancementObject = { id: "",  name: "", description: "" };
                const lineSplit = line.split("\t");
                record.id = lineSplit[0].replace(/\\"/g, "\"");
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
        const advancementLogs: RegExp[] = [/^\w{2,16} has made the advancement \[.+?\]/, /^\w{2,16} has reached the goal \[.+?\]/, /^\w{2,16} has completed the challenge \[.+?\]/];
        advancementLogs.forEach((advancementLog: RegExp, i: number) => {
            if(advancementLog.test(message)) {
                const targetAdvancement: AdvancementObject = this.convertAdvancements(message.match(/(?<=\[).*?(?=\])/)![0]);
                let messageContent: string = "";
                switch(i) {
                    case 0:
                        messageContent = ":third_place: " + message.split(" ")[0] + " は進捗 [" + targetAdvancement.name + "] を達成した";
                        break;
                    case 1:
                        messageContent = ":second_place: " + message.split(" ")[0] + " は目標 [" + targetAdvancement.name + "] を達成した";
                        break;
                    case 2:
                        messageContent = ":first_place: " + message.split(" ")[0] + " は挑戦 [" + targetAdvancement.name + "] を完了した";
                }
                if(settings.embeds.advancements) {
                    const embed = new MessageEmbed();
                    embed.setTitle(targetAdvancement.name);
                    embed.setDescription(targetAdvancement.description);
                    switch(i) {
                        case 0:
                            embed.setColor("#B87333");
                            break;
                        case 1:
                            embed.setColor("#C0C0C0");
                            break;
                        case 2:
                            embed.setColor("#E6B422");
                            break;
                    }
                    sendMessageToDiscord(messageContent, embed);
                }
                else {
                    sendMessageToDiscord(messageContent);
                }
            }
        });
    }
}