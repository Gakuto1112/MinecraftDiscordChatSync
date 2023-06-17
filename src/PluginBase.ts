import { Logger } from "./Logger";
import { MinecraftDiscordChatSync } from "./MinecraftDiscordChatSync";

export type LogType = "info" | "warn" | "error" | "fatal";

/**
 * 全てのプラグインの基礎となる抽象クラス
 */
export abstract class PluginBase {
    //ラッパー関数
    protected readonly logger: Logger = MinecraftDiscordChatSync.logger;

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
     * ボットがDiscordにログインした時のイベント
     */
    public onDiscordLogin() {}
}