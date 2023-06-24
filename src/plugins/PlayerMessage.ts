import { LogType, PluginBase } from "../PluginBase";

/**
 * ゲームサーバー内でプレイヤーが発言した際にDiscordにメッセージを送信するプラグイン
 */
export class PlayerMessage extends PluginBase {
    public onNewLog(_time: Date, _sender: string, _logType: LogType, message: string): void {
        if(/^<\w{3,16}> .+$/.test(message)) {
            const chatData: RegExpMatchArray = (message.match(/^<(\w{3,16})> (.+)$/) as RegExpMatchArray);
            this.discord.sendMessage(this.getLocale("bot.message.chat", chatData[1], chatData[2]));
            this.logger.info(`[Minecraft] <${chatData[1]}> ${chatData[2]}`);
        }
    }
}