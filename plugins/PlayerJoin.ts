import { PluginBase } from "./PluginBase";
import { addEmbed, sendMessageToDiscord } from "../MinecraftDiscordChatSync";

export class Plugin extends PluginBase {
    constructor() {
        super();
        addEmbed("playerJoin");
    }
    public onMinecraftMessage(time: Date, thread: string, messageType: string, message: string): void {
        if(/^\w{2,16} joined the game/.test(message)) {
            sendMessageToDiscord(":city_sunset: " + message.split(" ")[0] + " がゲームに参加しました");
        }
    }
}