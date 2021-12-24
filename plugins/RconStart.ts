import { PluginBase } from "./PluginBase";
import { rcon } from "../MinecraftDiscordChatSync";

export class Plugin extends PluginBase {
    public onMinecraftMessage(time: Date, thread: string, messageType: string, message: string): void {
        if(/^RCON running on (\d{1,3}\.){3}\d{1,3}:\d{1,5}/.test(message)) {
			rcon.connect();
        }
    }
}