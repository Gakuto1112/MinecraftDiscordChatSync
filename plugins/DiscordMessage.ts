import { Message, NewsChannel, TextChannel } from "discord.js";
import { minecraftVersions, settings, getChannelName, sendRconCommand } from "../MinecraftDiscordChatSync";
import { PluginBase } from "./PluginBase";

export class Plugin extends PluginBase {

	public onDiscordMessage(message: Message): void {
		let userColor: string;
		if(settings.discordMessageDisplay.displayRoleColor == "true" && minecraftVersions.indexOf(settings.minecraftVersion) >= 14) {
			if(message.member!.displayHexColor == "#000000") userColor = "white";
			else userColor = message.member!.displayHexColor;
		}
		else userColor = "yellow";
		let hoverContentName: string;
		if(minecraftVersions.indexOf(settings.minecraftVersion) >= 14) hoverContentName = "contents";
		else hoverContentName = "value";
		let channelName: string;
		if(message.channel instanceof TextChannel || message.channel instanceof NewsChannel) channelName = message.channel.name;
		else return
		const messageSplit: string[] = message.content.split("\n");
		messageSplit.forEach((messageLine: string, i: number) => {
			let messageToSend: string;
			if(settings.discordMessageDisplay.showChannelName == "true") {
				messageToSend = "tellraw @a [ { \"text\": \"<\" }, { \"text\": \"" + message.member!.displayName + "\", \"color\": \"" + userColor + "\", \"hoverEvent\": { \"action\": \"show_text\", \"contents\": \"" + message.author.tag + "\" } }, { \"text\": \" @\", \"hoverEvent\": { \"action\": \"show_text\", \"contents\": \"" + message.author.tag + "\" } }, { \"text\": \"" + channelName + "\", \"color\": \"aqua\", \"hoverEvent\": { \"action\": \"show_text\", \"contents\": \"" + message.author.tag + "\" } }, { \"text\": \"> " + messageLine + "\" } ]";
				if(messageSplit.length >= 2) messageToSend = messageToSend.replace(/{ "text": "> /, "{ \"text\": \" #" + (i + 1) + "\", \"color\": \"gold\", \"hoverEvent\": { \"action\": \"show_text\", \"contents\": \"" + message.author.tag + "\" } }, { \"text\": \"> ");
			}
			else {
				messageToSend = "tellraw @a [ { \"text\": \"<\" }, { \"text\": \"" + message.member!.displayName + "\", \"color\": \"" + userColor + "\", \"hoverEvent\": { \"action\": \"show_text\", \"contents\": \"" + message.author.tag + " @" + channelName + "\" } }, { \"text\": \"> " + messageLine + "\" } ]";
				messageToSend = messageToSend.replace(/{ "text": "> /, "{ \"text\": \" #" + (i + 1) + "\", \"color\": \"gold\", \"hoverEvent\": { \"action\": \"show_text\", \"contents\": \"" + message.author.tag + " @" + channelName + "\" } }, { \"text\": \"> ");
			}
			sendRconCommand(messageToSend);
		});
	}
}