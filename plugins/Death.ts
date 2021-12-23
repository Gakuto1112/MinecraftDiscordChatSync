import { PluginBase } from "./PluginBase";
import { colors, sendMessageToDiscord } from "../MinecraftDiscordChatSync";

interface DeathMessageObject {
    regexp: RegExp;
	globalName: string;
    localName: string;
}

export class Plugin extends PluginBase {

    private deathMessages: DeathMessageObject[] = [];

	constructor() {
		super();
		const fs = require("fs");
		let data: string;
		try {
			data = fs.readFileSync("./plugins/data/death.tsv", "utf-8");
		}
        catch(error: any) {
            if(error.code == "ENOENT") console.error(colors.red + "\"./plugins/data/death.tsv\"が存在しません。" + colors.reset);
            else if(error.code == "EPERM") console.error(colors.red + "\"./plugins/data/death.tsv\"の読み取り権限がありません。" + colors.reset);
            else console.error(colors.red + "\"./plugins/data/death.tsv\"を読み取れません。エラーコード：" + error.code + colors.reset);
            process.exit(1);
        }
		data.split(/\r\n|\r|\r/).forEach((line: string, i: number) => {
			if(i >= 1) {
				const lineSplit = line.split("\t");
				this.deathMessages.push({ regexp: new RegExp("^" + lineSplit[0].replace("{victim}", ".+?").replace("{killer}", ".+?").replace("{weapon}", ".+?").replace("[", "\\[").replace("]", "\\]") + "{END}$"), globalName: lineSplit[0], localName: lineSplit[1] });
			}
		});
		this.deathMessages.reverse();
	}
    public onMinecraftMessage(time: Date, thread: string, messageType: string, message: string): void {
		const messageRemoveR: string = message.replace(/\r/, "");
		let processed: boolean = false;
		this.deathMessages.forEach((deathMessage: DeathMessageObject) => {
			if(deathMessage.regexp.test(messageRemoveR + "{END}") && !processed) {
				console.log(deathMessage.globalName);
				const globalNameSplit: string[] = deathMessage.globalName.split(" ");
				function getPlaceholderString(placeholder: string) {
					//プレイスホルダーに対応する文字列を返す。
					const messageRemoveRSplit = messageRemoveR.split(" ");
					let beforePlaceholderIndex: number;
					let afterPlaceholderIndex: number;
					let result: string = "";
					console.log(globalNameSplit.indexOf(placeholder) != globalNameSplit.length);
					if(globalNameSplit.indexOf(placeholder) != 0) beforePlaceholderIndex = messageRemoveRSplit.indexOf(globalNameSplit[globalNameSplit.indexOf(placeholder) - 1]) + 1;
					else beforePlaceholderIndex = 0;
					if(globalNameSplit.indexOf(placeholder) != globalNameSplit.length - 1) afterPlaceholderIndex = messageRemoveRSplit.indexOf(globalNameSplit[globalNameSplit.indexOf(placeholder) + 1]);
					else afterPlaceholderIndex = messageRemoveRSplit.length
					console.log(beforePlaceholderIndex);
					console.log(afterPlaceholderIndex);
					for(let i: number = beforePlaceholderIndex; i < afterPlaceholderIndex; i++) {
						result += " " + messageRemoveRSplit[i];
					}
					return result
				}
				//victim
				if(globalNameSplit.includes("{victim}")) {
					console.log(getPlaceholderString("{victim}"));
				}
				//killer
				if(globalNameSplit.includes("{killer}")) {
					console.log(getPlaceholderString("{killer}"));
				}
				//weapon
				if(globalNameSplit.includes("{weapon}")) {
					console.log(getPlaceholderString("{weapon}"));
				}
				processed = true;
			}
		});
    }
}