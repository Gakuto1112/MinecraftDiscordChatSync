import { LogType, PluginBase } from "../PluginBase";

/**
 * Mojang APIで取得したプレイヤー情報
 */
type PlayerData = {
    /** プレイヤーの一意のID（UUID） */
    id: string,
    /** 現在のプレイヤーの名前 */
    name: string
}

/**
 * プレイヤーの参加/退出時にDiscordにメッセージを送信するプラグイン
 */
export class PlayerJoinLeave extends PluginBase {
    /**
     * プレイヤーの名前から外部サービスを経由してプレイヤーのアバター画像（スキンの顔）のURLを取得する。
     * @param playerName 対象のプレイヤーの名前
     */
    private async getPlayerAvatarURL(playerName: string): Promise<string|undefined> {
        if(/^\w{3,16}$/.test(playerName)) {
            const response: Response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${playerName}`);
            if(response.status == 200) return `https://minotar.net/helm/${(await response.json() as PlayerData).id}/64`;
            else this.logger.error(`The request returned with code "${response.status} ${response.statusText}".`);
        }
        else this.logger.error(`The provided player name "${playerName}" does not conform to Minecraft's player name rules.`);
    }

    public async onNewLog(_time: Date, _sender: string, _logType: LogType, message: string): Promise<void> {
        if(/^\w{3,16} (\(formerly known as \w{3,16}\) )?joined the game$/.test(message)) {
            //プレイヤー参加
            const playerName: string = (message.match(/^(\w{3,16}) (\(formerly known as \w{3,16}\) )?joined the game$/) as RegExpMatchArray)[1];
            this.discord.sendMessage(this.getLocale("bot.message.player_join", playerName), {
                title: this.getLocale("bot.embed.player_join.title"),
                author: playerName,
                imageURL: await this.getPlayerAvatarURL(playerName),
                color: "0f0"
            });
            this.logger.info(`Player "${playerName}" joined the game.`);
        }
        else if(/^\w{3,16} left the game$/.test(message)) {
            //プレイヤー退出
            const playerName: string = (message.match(/^(\w{3,16}) left the game$/) as RegExpMatchArray)[1];
            this.discord.sendMessage(this.getLocale("bot.message.player_leave", playerName), {
                title: this.getLocale("bot.embed.player_leave.title"),
                author: playerName,
                imageURL: await this.getPlayerAvatarURL(playerName),
                color: "f00"
            });
            this.logger.info(`Player "${playerName}" left the game.`);
        }
    }
}