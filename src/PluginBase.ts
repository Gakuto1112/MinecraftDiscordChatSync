import discordJS from "discord.js";
import { MinecraftDiscordChatSync } from "./MinecraftDiscordChatSync";
import { Logger } from "./Logger";

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
 * Discordの埋め込みメッセージを作成する為のデータ
 */
export type EmbedData = {
    /** タイトル */
    title?: string,
    /** 本文 */
    description?: string,
    /** 作者（このボット以外も可） */
    author?: string,
    /** 画像のURL */
    imageURL?: string,
    /** 左端の色。RGB Hex値で指定する（"#"は不要）。 */
    color?: string
}

/**
 * 全てのプラグインの基礎となる抽象クラス
 */
export abstract class PluginBase {
    //ラッパー関数
    protected readonly logger: Logger = MinecraftDiscordChatSync.logger;

    /**
     * 現在の設定言語での、指定されたキー対応する文字列を返す。
     * @param key 対象のキーの名前。
     * @return 現在の設定言語のキーに対応する文字列。もし、現在の設定言語でキーに対応する文字列がなければデフォルトの言語（en_us）での文字列を返す。それもなければ、キーをそのまま返す。
     */
    protected getLocale(key: string): string {
        return MinecraftDiscordChatSync.locale.getLocale(key);
    }

    /**
     * DiscordのSendChannelsの各チャンネルに向けてメッセージを送信する。
     * @param message 送信するメッセージ本文
     * @param embed メッセージの埋め込みコンテンツ
     */
    protected sendMessage(message?: string, embed?: EmbedData): void {
        if((message && message.length > 0) || embed) {
            if(typeof embed == "object") {
                const embedObject = new discordJS.EmbedBuilder();
                if(embed.title) embedObject.setTitle(embed.title);
                if(embed.description) embedObject.setDescription(embed.description);
                if(embed.author) embedObject.setAuthor({name: embed.author});
                if(embed.imageURL) {
                    if(/^https?:\/\//.test(embed.imageURL)) embedObject.setImage(embed.imageURL);
                    else MinecraftDiscordChatSync.logger.error("The image URL of embedded messages must start with \"https://\" or \"http://\".");
                }
                if(embed.color) embedObject.setColor(`#${embed.color}`);
                MinecraftDiscordChatSync.bot.sendMessage(message, embedObject);
            }
            else MinecraftDiscordChatSync.bot.sendMessage(message);
        }
        else MinecraftDiscordChatSync.logger.warn("The message will not be sent to Discord because both message body and embed are empty.");
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