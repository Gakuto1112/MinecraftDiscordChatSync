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
/**
 * 設定値検証関数での戻り値
 */
export type VerificationResult = {
    /** 入力された値 */
    isValid: boolean;
    /** エラー時に出すメッセージ（省略可） */
    message?: string;
}
export type DiscordGuild = {
    /** サーバーID */
    id: string,
    /** サーバー表示名 */
    name: string
}
/**
 * Discordのロールに関する情報
 */
export type DiscordRole = {
    /** ロールID */
    id: string,
    /** ロール表示名 */
    name: string,
    /** ロール表示色 */
    color: string
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
    displayName: string,
    /** ユーザーがそのサーバー内で持っているロールの配列 */
    roles: DiscordRole[],
    /** サーバーでの名前の色のカラーコード */
    color: string,
    /** メッセージの送信者がボットかどうか */
    isBot: boolean
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
     * コンフィグマネージャーに設定項目を登録する。
     * @param keyName 設定項目のキーの名前
     * @param defaultValue 初期値
     * @param verificationFunction 設定値の検証用の関数
     */
    protected registerConfig(keyName: string, defaultValue: any, verificationFunction: (value: any) => VerificationResult) {
        MinecraftDiscordChatSync.config.registerConfig(keyName, defaultValue, verificationFunction);
    }

    /**
     * 設定値を取得する。
     * @param key 取得する設定値のキーの名前
     * @return キーに対応する設定値。対応する設定値がなければundefinedを返す。
     */
    protected getConfig(key: string): any {
        return MinecraftDiscordChatSync.config.getConfig(key);
    }

    /**
     * 現在の設定言語での、指定されたキー対応する文字列を返す。
     * @param key 対象のキーの名前。
     * @param replacer1 "%1$s"から置き換える文字列
     * @param replacer2 "%2$s"から置き換える文字列
     * @param replacer3 "%3$s"から置き換える文字列
     * @return 現在の設定言語のキーに対応する文字列。もし、現在の設定言語でキーに対応する文字列がなければデフォルトの言語（en_us）での文字列を返す。それもなければ、キーをそのまま返す。
     */
    protected getLocale(key: string, replacer1?: string, replacer2?: string, replacer3?: string): string {
        let localeString: string = MinecraftDiscordChatSync.locale.getLocale(key);
        if(replacer1) localeString = localeString.replace(/%1\$s/g, replacer1);
        if(replacer2) localeString = localeString.replace(/%2\$s/g, replacer2);
        if(replacer3) localeString = localeString.replace(/%3\$s/g, replacer3);
        return localeString;
    }

    protected readonly discord: {[key: string]: Function} = {
        /**
         * DiscordのSendChannelsの各チャンネルに向けてメッセージを送信する。
         * @param message 送信するメッセージ本文
         * @param embed メッセージの埋め込みコンテンツ
         */
        sendMessage: (message?: string, embed?: EmbedData): void => {
            if((message && message.length > 0) || embed) {
                if(typeof embed == "object") {
                    const embedObject = new discordJS.EmbedBuilder();
                    if(embed.title) embedObject.setTitle(embed.title);
                    if(embed.description) embedObject.setDescription(embed.description);
                    if(embed.author) embedObject.setAuthor({name: embed.author});
                    if(embed.imageURL) {
                        if(/^https?:\/\//.test(embed.imageURL)) embedObject.setThumbnail(embed.imageURL);
                        else MinecraftDiscordChatSync.logger.error("The image URL of embedded messages must start with \"https://\" or \"http://\".");
                    }
                    if(embed.color) {
                        if(!embed.color.startsWith("#")) {
                            let fullColor: string = "";
                            let errorFlag: boolean = false;
                            switch(embed.color.length) {
                                case 1:
                                    fullColor = embed.color[0].repeat(6);
                                    break;
                                case 2:
                                    fullColor = `${embed.color[0]}${embed.color[1]}`.repeat(3);
                                    break;
                                case 3:
                                    for(let i: number = 0; i < 3; i++) fullColor += embed.color[i].repeat(2);
                                    break;
                                case 6:
                                    fullColor = embed.color;
                                    break;
                                default:
                                    MinecraftDiscordChatSync.logger.error("The provided color code is invalid.");
                                    errorFlag = true;
                                    break;
                            }
                            if(errorFlag) return;
                            embedObject.setColor(`#${fullColor}`);
                        }
                        else {
                            MinecraftDiscordChatSync.logger.error("The provided color code is invalid. it must not start with \"#\".");
                            return;
                        }
                    }
                    MinecraftDiscordChatSync.bot.sendMessage(message, embedObject);
                }
                else MinecraftDiscordChatSync.bot.sendMessage(message);
            }
            else MinecraftDiscordChatSync.logger.warn("The message will not be sent to Discord because both message body and embed are empty.");
        },

        /**
         * サーバーのメンバーの情報を取得する。
         * @param guildId 取得対象のメンバーが所属するサーバーのID
         * @param userId 取得対象のメンバーのID
         * @returns 取得したメンバーの情報。引数が不正な場合はundefinedが返る。
         */
        getMember: (guildId: string, userId: string): DiscordUser|undefined => {
            return MinecraftDiscordChatSync.bot.getMember(guildId, userId);
        },

        /**
         * サーバーのロールの情報を取得する。
         * @param guildId 取得対象のロールが設定されているサーバーのID
         * @param roleId 取得対象のロールのID
         * @returns 取得したロールの情報。引数が不正な場合はundefinedが返る。
         */
        getRole: (guildId: string, roleId: string): DiscordRole|undefined => {
            return MinecraftDiscordChatSync.bot.getRole(guildId, roleId);
        },

        /**
         * サーバーのロールの情報を取得する。
         * @param guildId 取得対象のロールが設定されているサーバーのID
         * @param roleId 取得対象のロールのID
         * @returns 取得したロールの情報。引数が不正な場合はundefinedが返る。
         */
        getChannel: (guildId: string, channelId: string): DiscordChannel|undefined => {
            return MinecraftDiscordChatSync.bot.getChannel(guildId, channelId);
        }
    }

    protected readonly rcon: {[key: string]: Function} = {
        /**
         * RConを通じてサーバーにコマンドを送信する。
         * @param command 送信するマインクラフトのコマンド
         * @returns 送信したコマンドの実行結果。RCon上でエラーが発生したらnullが返される。
         */
        sendCommand: async (command: string): Promise<string|void> => {
            return await MinecraftDiscordChatSync.rCon.send(command);
        },

        /**
         * RConが接続済みかどうかを返す。
         * @returns RConでサーバーに接続済みかどうか
         */
        isConnected: (): boolean => {
            return MinecraftDiscordChatSync.rCon.isConnected();
        }
    }

    //イベント関数
    /**
     * システムの各種読み込みが完了した時のイベント
     */
    public onLoad(): void {}

    /**
     * 新しいログが検出された時のイベント
     * @param time ログが送信された時刻（日付は実行時の日時になる）
     * @param sender ログの送信元
     * @param logType ログのレベル
     * @param message ログの本文
     */
    public onNewLog(time: Date, sender: string, logType: LogType, message: string): void {}

    /**
     * 新しいログが検出された時のイベント。onNewLogとは異なり、ログを解釈せずそのまま出力する。
     * @param message ログの文
     */
    public onNewLogRaw(message: string): void {}

    /**
     * RConがサーバーに接続された時のイベント
     */
    public onRConOpen(): void {}

    /**
     * RConがサーバーから切断された時のイベント
     */
    public onRConClose(): void {}

    /**
     * ボットがDiscordにログインした時のイベント
     */
    public onDiscordLogin(): void {}

    /**
     * ListenChannelsのいずれかのチャンネルでメッセージを送信された時のイベント
     * @param guild 対象のサーバーの情報
     * @param channel 対象のチャンネルの上場
     * @param sender 送信者の情報
     * @param content 送信されたメッセージ本文
     * @param attachments メッセージの添付ファイルの情報
     */
    public onDiscordMessage(guild: DiscordGuild, channel: DiscordChannel, sender: DiscordUser, content: string, attachments: DiscordAttachment[]): void {}
}