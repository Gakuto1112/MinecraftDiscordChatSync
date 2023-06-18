import { PluginBase, LogType } from "../PluginBase";

/**
 * サーバーの起動/閉鎖時にDiscordにメッセージを送信するプラグイン
 */
export class ServerOpenClose extends PluginBase {
    public onNewLog(_time: Date, _sender: string, _logType: LogType, message: string): void {
        if(/^Done \(\d+\.\d{3}s\)! For help, type "help"$/.test(message)) {
            //サーバーの起動完了
            this.sendMessage(this.getLocale("bot.message.server_opened"));
        }
        else if(message.startsWith("Stopping server")) {
            //サーバー閉鎖
            this.sendMessage(this.getLocale("bot.message.server_closed"));
        }
    }
}