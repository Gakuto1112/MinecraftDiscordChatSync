import { PluginBase } from "./PluginBase";
import { colors, sendMessageToDiscord } from "../MinecraftDiscordChatSync";

interface DeathMessageObject {
    regexp: RegExp;
	globalName: string;
    localName: string;
}
interface EntityObject {
	globalName: string;
	localName: string;
}

export class Plugin extends PluginBase {
    private deathMessages: DeathMessageObject[] = [];
	private entities: EntityObject[] = [];

	constructor() {
		super();
		this.readTsv("./plugins/data/death.tsv").forEach((line: string, i: number) => {
			if(i >= 1) {
				const lineSplit = line.split("\t");
				this.deathMessages.push({ regexp: new RegExp("^" + lineSplit[0].replace("{victim}", ".+?").replace("{killer}", ".+?").replace("{weapon}", ".+?").replace("[", "\\[").replace("]", "\\]") + "{END}$"), globalName: lineSplit[0], localName: lineSplit[1] });
			}
		});
		this.deathMessages.reverse();
		this.readTsv("./plugins/data/entity.tsv").forEach((line: string, i: number) => {
			if(i >= 1) {
				const lineSplit = line.split("\t");
				this.entities.push({ globalName: lineSplit[0], localName: lineSplit[1] });
			}
		});
	}

	private readTsv(path: string): string[]{
		//tsvファイルの読み込んで返す
		const fs = require("fs");
		let data: string;
		try {
			data = fs.readFileSync(path, "utf-8");
		}
        catch(error: any) {
            if(error.code == "ENOENT") console.error(colors.red + "「" + path + "」が存在しません。" + colors.reset);
            else if(error.code == "EPERM") console.error(colors.red + "「" + path + "」の読み取り権限がありません。" + colors.reset);
            else console.error(colors.red + "「" + path + "」を読み取れません。エラーコード：" + error.code + colors.reset);
            throw Error();
        }
		return data.split(/\r\n|\r|\r/);
	}
    public onMinecraftMessage(time: Date, thread: string, messageType: string, message: string): void {
		if(!/\[\'.+\'\/\d+, l=\'.+\[.+\]\', x=-?\d+\.\d{1,2}, y=-?\d+\.\d{1,2}, z=-?\d+\.\d{1,2}\] died/.test(message)) {
			const messageRemoveR: string = message.replace(/\r/, "");
			let processed: boolean = false;
			this.deathMessages.forEach((deathMessage: DeathMessageObject) => {
				if(deathMessage.regexp.test(messageRemoveR + "{END}") && !processed) {
					const globalNameSplit: string[] = deathMessage.globalName.split(" ");
					let victim: string = "";
					let killer: string = "";
					let weapon: string = "";
					function getPlaceholderString(placeholder: string): string {
						//プレイスホルダーに対応する文字列を返す。
						const messageRemoveRSplit = messageRemoveR.split(" ");
						let beforePlaceholderIndex: number;
						let afterPlaceholderIndex: number;
						const result: string[] = [];
						if(globalNameSplit.indexOf(placeholder) != 0) beforePlaceholderIndex = messageRemoveRSplit.indexOf(globalNameSplit[globalNameSplit.indexOf(placeholder) - 1]) + 1;
						else beforePlaceholderIndex = 0;
						if(globalNameSplit.indexOf(placeholder) != globalNameSplit.length - 1) afterPlaceholderIndex = messageRemoveRSplit.indexOf(globalNameSplit[globalNameSplit.indexOf(placeholder) + 1]);
						else afterPlaceholderIndex = messageRemoveRSplit.length
						for(let i: number = beforePlaceholderIndex; i < afterPlaceholderIndex; i++) {
							result.push(messageRemoveRSplit[i]);
						}
						return result.join(" ");
					}
					//victim
					if(globalNameSplit.includes("{victim}")) {
						victim = getPlaceholderString("{victim}");
					}
					//killer
					if(globalNameSplit.includes("{killer}")) {
						killer = getPlaceholderString("{killer}");
						this.entities.forEach((entity: EntityObject) => {
							if(entity.globalName == killer) killer = entity.localName;
						});
					}
					//weapon
					if(globalNameSplit.includes("{weapon}")) {
						weapon = getPlaceholderString("{weapon}");
					}
					sendMessageToDiscord(":skull: " + deathMessage.localName.replace("{victim}", victim).replace("{killer}", killer).replace("{weapon}", weapon));
					processed = true;
				}
			});
		}
    }
}