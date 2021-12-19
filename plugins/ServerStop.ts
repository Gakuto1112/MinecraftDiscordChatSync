import { PluginBase } from "./PluginBase";
import { sendMessageToDiscord } from "../MinecraftDiscordChatSync";

export class Plugin extends PluginBase {
    public onMinecraftMessage(time: Date, thread: string, messageType: string, message: string): void {
        if(message.startsWith("Stopping server")) {
            sendMessageToDiscord(":no_entry: サーバーが閉鎖されました");
        }
    }
}