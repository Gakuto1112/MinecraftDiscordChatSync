import { PluginBase } from "./PluginBase";
import { sendMessageToDiscord } from "../MinecraftDiscordChatSync";

export class Plugin extends PluginBase {
    public onMinecraftMessage(time: Date, thread: string, messageType: string, message: string): void {
        if(/^\w{3,16} left the game/.test(message)) {
            sendMessageToDiscord(":night_with_stars: " + message.split(" ")[0] + " がゲームから退出しました");
        }
    }
}