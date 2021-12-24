import { Message } from "discord.js";
import { sendRconCommand } from "../MinecraftDiscordChatSync";
import { PluginBase } from "./PluginBase";

export class Plugin extends PluginBase {

	public onDiscordMessage(message: Message): void {
		console.log(message.member!.displayName);
		console.log(message.member!.displayHexColor);
		console.log(message.author.tag);
		const messageSplit: string[] = message.content.split("\n");
		messageSplit.forEach((messageLine: string) => {
			console.log(messageLine);
		});
	}
}