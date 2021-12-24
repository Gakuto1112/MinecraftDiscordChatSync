import { PluginBase } from "./PluginBase";
import { colors, rcon } from "../MinecraftDiscordChatSync";

export class Plugin extends PluginBase {
    public onMinecraftMessage(time: Date, thread: string, messageType: string, message: string): void {
        if(/^RCON running on (\d{1,3}\.){3}\d{1,3}:\d{1,5}/.test(message)) {
			rcon.connect().then(() => {
				console.info("Rconを接続しました。");
			}).catch((error: any) => {
				if(error.message.startsWith("connect ECONNREFUSED")) console.error(colors.red + "Rconの接続が拒否されました。" + colors.reset);
				else if(error.message == "Authentication failed") console.error(colors.red + "Rconの認証に失敗しました。パスワードが間違っている可能性があります。" + colors.reset);
				else console.error(colors.red + "Rconの接続に失敗しました。エラーメッセージ：" + error.message + colors.reset);
				console.error(colors.red + "Rconが接続されていません！Rconの設定を確認して下さい。" + colors.reset + "このままでも マインクラフト -> Discord の送信は出来ますが、 Discord -> マインクラフト の送信はできません。");
			});
        }
    }
}