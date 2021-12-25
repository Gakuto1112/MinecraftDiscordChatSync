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
				let messageToSend: string;
				if(settings.discordMessageDisplay.showChannelName == "true") {
					messageToSend = "tellraw @a [{ \"text\": \"<\" }, { \"text\": \"" + message.member!.displayName + "\", \"color\": \"" + userColor + "\", \"hoverEvent\": { \"action\": \"show_text\", \"" + hoverContentName + "\": \"" + message.author.tag + "\" } }, { \"text\": \" @\", \"hoverEvent\": { \"action\": \"show_text\", \"" + hoverContentName + "\": \"" + message.author.tag + "\" } }, { \"text\": \"" + channelName + "\", \"color\": \"aqua\", \"hoverEvent\": { \"action\": \"show_text\", \"" + hoverContentName + "\": \"" + message.author.tag + "\" } }, { \"text\": \"> " + messageLine + "\" }]";
					if(messageSplit.length >= 2) messageToSend = messageToSend.replace(/{ "text": "> /, "{ \"text\": \" #" + (i + 1) + "\", \"color\": \"gold\", \"hoverEvent\": { \"action\": \"show_text\", \"" + hoverContentName + "\": \"" + message.author.tag + "\" } }, { \"text\": \"> ");
				}
				else {
					messageToSend = "tellraw @a [{ \"text\": \"<\" }, { \"text\": \"" + message.member!.displayName + "\", \"color\": \"" + userColor + "\", \"hoverEvent\": { \"action\": \"show_text\", \"" + hoverContentName + "\": \"" + message.author.tag + " @" + channelName + "\" } }, { \"text\": \"> " + messageLine + "\" }]";
					messageToSend = messageToSend.replace(/{ "text": "> /, "{ \"text\": \" #" + (i + 1) + "\", \"color\": \"gold\", \"hoverEvent\": { \"action\": \"show_text\", \"" + hoverContentName + "\": \"" + message.author.tag + " @" + channelName + "\" } }, { \"text\": \"> ");
				}
				messageToSend = messageToSend.replace(/https?:\/\/[\w\-./?%&=~]{2,}/g, "\" }, { \"text\": \"$&\", \"underlined\": \"true\", \"color\": \"blue\", \"hoverEvent\": { \"action\": \"show_text\", \"" + hoverContentName + "\": \"クリックして開く\" }, \"clickEvent\": { \"action\": \"open_url\", \"value\": \"$&\" } }, { \"text\": \"")
				sendRconCommand(messageToSend);
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