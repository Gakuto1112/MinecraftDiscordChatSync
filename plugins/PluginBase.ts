import { MessageType } from "../MinecraftDiscordChatSync";

export abstract class PluginBase {
    public onMinecraftMessage(time: Date, thread: string, messageType: MessageType, message: string) { }
}