import { PluginBase } from "./PluginBase";
import { sendMessageToDiscord } from "../MinecraftDiscordChatSync";

export class Plugin extends PluginBase {
    public onMinecraftMessage(time: Date, thread: string, messageType: string, message: string): void {
        if(/^Done \(\d+\.\d{3}s\)! For help, type "help"/.test(message)) sendMessageToDiscord(":white_check_mark: サーバーが起動しました");
    }
}