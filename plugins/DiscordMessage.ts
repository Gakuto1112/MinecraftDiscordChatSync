import { Message, NewsChannel, TextChannel } from "discord.js";
import { minecraftVersions, settings, getChannelName, sendRconCommand } from "../MinecraftDiscordChatSync";
import { PluginBase } from "./PluginBase";

export class Plugin extends PluginBase {

	public onDiscordMessage(message: Message): void {
		console.log(message.member!.displayName);
		console.log(message.member!.displayHexColor);
		console.log(message.author.tag);
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
		message.content.split("\n").forEach((messageLine: string) => {
			let messageToSend: string;
			if(settings.discordMessageDisplay.showChannelName == "true") messageToSend = "tellraw @a [{ \"text\": \"<\" }, { \"text\": \"" + message.member!.displayName + "\", \"color\": \"" + userColor + "\", \"hoverEvent\": { \"action\": \"show_text\", \"contents\": \"" + message.author.tag + "\" } }, { \"text\": \" @\", \"hoverEvent\": { \"action\": \"show_text\", \"contents\": \"" + message.author.tag + "\" } }, { \"text\": \"" + channelName + "\", \"color\": \"aqua\", \"hoverEvent\": { \"action\": \"show_text\", \"contents\": \"" + message.author.tag + "\" } }, { \"text\": \"> " + messageLine + "\" } ]";
			else messageToSend = "tellraw @a [{ \"text\": \"<\" }, { \"text\": \"" + message.member!.displayName + "\", \"color\": \"" + userColor + "\", \"hoverEvent\": { \"action\": \"show_text\", \"contents\": \"" + message.author.tag + " @" + channelName + "\" } }, { \"text\": \"> " + messageLine + "\" } ]";
			console.log(messageToSend);
		});
	}
}