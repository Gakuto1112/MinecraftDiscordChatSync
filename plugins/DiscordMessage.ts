import { Message, MessageAttachment, NewsChannel, TextChannel } from "discord.js";
import { minecraftVersions, settings, sendRconCommand } from "../MinecraftDiscordChatSync";
import { PluginBase } from "./PluginBase";

export class Plugin extends PluginBase {

	public onDiscordMessage(message: Message): void {
		let hoverContentName: string;
		if(minecraftVersions.indexOf(settings.minecraftVersion) >= 14) hoverContentName = "contents";
		else hoverContentName = "value";
		let channelName: string;
		if(message.channel instanceof TextChannel || message.channel instanceof NewsChannel) channelName = message.channel.name;
		else return
		if(message.content != "") {
			let userColor: string;
			if(settings.discordMessageDisplay.displayRoleColor == "true" && minecraftVersions.indexOf(settings.minecraftVersion) >= 14) {
				if(message.member!.displayHexColor == "#000000") userColor = "white";
				else userColor = message.member!.displayHexColor;
			}
			else userColor = "yellow";
			const messageSplit: string[] = message.content.split("\n");
			messageSplit.forEach((messageLine: string, i: number) => {
				const tellrawObject: any[] = ["", { text: "<" }];
				if(settings.discordMessageDisplay.showChannelName == "true") {
					tellrawObject.push({ text: message.member!.displayName, color: userColor, hoverEvent: { action: "show_text", [hoverContentName]: message.author.tag } }, { text: "@", hoverEvent: { action: "show_text", [hoverContentName]: message.author.tag } }, { text: channelName, color: "aqua", hoverEvent: { action: "show_text", [hoverContentName]: message.author.tag } }, { text: "> " }, { text: messageLine });
					if(messageSplit.length >= 2) tellrawObject.splice(5, 0, { text: "#" + (i + 1), color: "gold", hoverEvent: { action: "show_text", [hoverContentName]: message.author.tag } });
				}
				else {
					tellrawObject.push({ text: "<" }, { text: message.member!.displayName, color: userColor, hoverEvent: { action: "show_text", [hoverContentName]: message.author.tag + " @" + channelName } }, { text: "> " }, { text: messageLine });
					if(messageSplit.length >= 2) tellrawObject.splice(3, 0, { text: "#" + (i + 1), color: "gold", hoverEvent: { action: "show_text", [hoverContentName]: message.author.tag } });
				}
				console.log(tellrawObject);
				tellrawObject.push("");
				console.log("tellraw @a " + JSON.stringify(tellrawObject));
				sendRconCommand("tellraw @a " + JSON.stringify(tellrawObject));
			});
		}
		//添付ファイル表示
		if(settings.discordMessageDisplay.showAttachments == "true") {
			message.attachments.forEach((attachment: MessageAttachment) => {
				sendRconCommand("tellraw @a [\"\", { \"text\": \"" + message.member!.displayName + "\", \"color\": \"gray\", \"hoverEvent\": { \"action\": \"show_text\", \"" + hoverContentName + "\": \"" + message.author.tag + " @" + channelName + "\" } }, { \"text\": \"のメッセージには\", \"color\": \"gray\" }, { \"text\": \"[" + attachment.name + "]\", \"color\": \"gray\", \"hoverEvent\": { \"action\": \"show_text\", \"" + hoverContentName + "\": \"クリックして開く\" }, \"clickEvent\": { \"action\": \"open_url\", \"value\": \"" + attachment.url + "\" } }, { \"text\": \"が添付されています\", \"color\": \"gray\" }]");
			});
		}
	}
}