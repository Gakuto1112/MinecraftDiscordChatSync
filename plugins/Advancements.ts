import { PluginBase } from "./PluginBase";
import { sendMessageToDiscord } from "../MinecraftDiscordChatSync";

export class Plugin extends PluginBase {
    constructor() {
        super();
        
    }
    public onMinecraftMessage(time: Date, thread: string, messageType: string, message: string): void {
        if(/^\w{2,16} has made the advancement/.test(message)) {
            const messageSplit: string[] = message.split(" ");
            if(messageSplit.length >= 2) {
                sendMessageToDiscord(":speech_balloon: <" + messageSplit[0].slice(1, -1) + "> " + messageSplit.slice(1).join(" "));
            }
        }
    }
}