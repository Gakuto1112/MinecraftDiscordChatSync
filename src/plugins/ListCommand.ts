import { DiscordCommand, PluginBase } from "../PluginBase";

/**
 * サーバーに参加中のプレイヤーの一覧を返す"list"コマンドを管理するクラス
 */
export class ListCommand extends PluginBase {
    public onLoad(): void {
        this.discord.registerCommand("list", this.getLocale("bot.command.list.desc"));
    }

    public async onDiscordCommand(command: DiscordCommand): Promise<void> {
        if(command.name == "list") {
            if(this.rcon.isConnected()) {
                const listInfo: string = await this.rcon.sendCommand("list");
                const listCommandData: RegExpMatchArray = listInfo.match(/^There are (\d+) of a max of (\d+) players? online: (.+)?$/) as RegExpMatchArray;
                command.reply(this.getLocale("bot.command.list.reply", listCommandData[1], listCommandData[2], typeof listCommandData[3] == "string" ? listCommandData[3] : ""));
            }
            else await command.reply(this.getLocale("bot.command.list.reply_error"));
        }
    }
}