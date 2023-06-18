import { Logger } from "./Logger";
import { MinecraftDiscordChatSync } from "./MinecraftDiscordChatSync";

/**
 * ゲームログの種類
 */
export type LogType = "info" | "warn" | "error" | "fatal";
/**
 * Discordのサーバーに関する情報
 */
export type DiscordGuild = {
    /** サーバーID */
    id: string,
    /** サーバー表示名 */
    name: string
}
/**
 * Discordのチャンネルに関する情報
 */
export type DiscordChannel = {
    /** チャンネルID */
    id: string,
    /** チャンネル名 */
    name: string
}
/**
 * Discordのユーザーに関する情報
 */
export type DiscordUser = {
    /** ユーザーID */
    id: string,
    /** ユーザー名 */
    name: string,
    /** サーバーでのユーザーの表示名 */
    displayName: string
}
/**
 * Discordのメッセージの添付ファイルに関する情報
 */
export type DiscordAttachment = {
    /** 添付ファイルID */
    id: string,
    /** 添付ファイル名 */
    name: string,
    /** 添付ファイルのURL */
    url: string
}

/**
 * 全てのプラグインの基礎となる抽象クラス
 */
export abstract class PluginBase {
    //ラッパー関数
    protected readonly logger: Logger = MinecraftDiscordChatSync.logger;

    /**
     * DiscordのSendChannelsの各チャンネルに向けてメッセージを送信する。
     * @param message 送信するメッセージ本文
     */
    protected sendMessage(message: string): void {
        MinecraftDiscordChatSync.bot.sendMessage(message);
    }

    /**
     * RConを通じてサーバーにコマンドを送信する。
     * @param command 送信するマインクラフトのコマンド
     * @returns 送信したコマンドの実行結果。RCon上でエラーが発生したらnullが返される。
     */
    protected async sendCommand(command: string): Promise<string|void> {
        return await MinecraftDiscordChatSync.rCon.send(command);
    }

    //イベント関数
    /**
     * 新しいログが検出された時のイベント
     * @param time ログが送信された時刻（日付は実行時の日時になる）
     * @param sender ログの送信元
     * @param logType ログのレベル
     * @param message ログの本文
     */
    public onNewLog(time: Date, sender: string, logType: LogType, message: string) {}

    /**
     * 新しいログが検出された時のイベント。onNewLogとは異なり、ログを解釈せずそのまま出力する。
     * @param message ログの文
     */
    public onNewLogRaw(message: string) {}

    /**
     * RConがサーバーに接続された時のイベント
     */
    public onRConOpen() {}

    /**
     * RConがサーバーから切断された時のイベント
     */
    public onRConClose() {}

    /**
     * ボットがDiscordにログインした時のイベント
     */
    public onDiscordLogin() {}

    /**
     * ListenChannelsのいずれかのチャンネルでメッセージを送信された時のイベント
     * @param guild 対象のサーバーの情報
     * @param channel 対象のチャンネルの上場
     * @param sender 送信者の情報
     * @param content 送信されたメッセージ本文
     * @param attachments メッセージの添付ファイルの情報
     */
    public onDiscordMessage(guild: DiscordGuild, channel: DiscordChannel, sender: DiscordUser, content: string, attachments: DiscordAttachment[]) {}
}