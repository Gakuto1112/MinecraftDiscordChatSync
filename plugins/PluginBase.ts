import { Message } from "discord.js";

export abstract class PluginBase {
    public onMinecraftMessage(time: Date, thread: string, messageType: string, message: string) { }
    public onDiscordMessage(message: Message) { }
}