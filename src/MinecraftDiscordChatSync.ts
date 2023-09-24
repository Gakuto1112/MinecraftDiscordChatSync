import { Logger } from "./Logger";
import { ConfigManager } from "./ConfigManager";
import { LocaleManager } from "./LocaleManager";
import { LogObserver } from "./LogObserver";
import { RConManager } from "./RConManager";
import { PluginManager } from "./PluginManager";
import { BotManager } from "./BotManager";
import { PluginBase } from "./PluginBase";

/**
 * アプリケーションの動作モード
 */
type RunningMode = "DIRECT" | "MODULE";

export class MinecraftDiscordChatSync {
    /**
     * ロガーのインスタンス
     */
    public static readonly logger: Logger = new Logger();
    /**
     * コンフィグマネージャーのインスタンス
     */
    public static readonly config: ConfigManager = new ConfigManager();
    /**
     * 言語マネージャーのインデックス
     */
    public static readonly locale: LocaleManager = new LocaleManager();
    /**
     * ログ監視のインスタンス
     */
    public static readonly log: LogObserver = new LogObserver();
    /**
     * RConのインスタンス
     */
    public static readonly rCon: RConManager = new RConManager();
    /**
     * プラグインマネージャーのインスタンス
     */
    public static readonly plugin: PluginManager = new PluginManager();
    /**
     * Discordボットを制御するインスタンス
     */
    public static readonly bot: BotManager = new BotManager();

    /**
     * システムの動作モード
     */
    private static runningMode: RunningMode;
    /**
     * システムの読み込みカウンター
     */
    private static loadCount: number = 0;
    /**
     * システム開始時にRConに接続するかどうか
     */
    private static rConInit: boolean;

    constructor(colorLog: boolean, logDebug: boolean, rConInit: boolean) {
        MinecraftDiscordChatSync.runningMode = require.main == module ? "DIRECT" : "MODULE";
        MinecraftDiscordChatSync.logger.setColoredLog(colorLog);
        MinecraftDiscordChatSync.logger.setLogDebugLevel(logDebug);
        MinecraftDiscordChatSync.rConInit = rConInit;
    }

    /**
     * システムの動作モードを返す。
     * @returns システムの動作モード
     */
    public static getRunningMode(): RunningMode {
        return this.runningMode;
    }

    /**
     * 読み込みカウントを進めて、全てを読み込んだら読み込み完了フェーズに移行する。
     */
    public static async proceedLoadCount(): Promise<void> {
        if(++this.loadCount == 4) {
            this.logger.info("Finished loading.");
            this.plugin.plugins.forEach((plugin: PluginBase) => {
                try {
                    plugin.onLoad();
                }
                catch(error: any) {
                    this.logger.error(`An error occurred while executing "onLoad()".\n${error.stack}`);
                }
            });
            await this.log.observe();
            if(this.rConInit) this.rCon.connect();
            this.bot.login();
        }
        else this.logger.debug(`Loading phase ${this.loadCount} of 4...`);
    }

    /**
     * システムが初期読み込み中かどうか返す。
     * @returns システムが初期読み込み中かどうか
     */
    public static getIsLoading(): boolean {
        return this.loadCount < 4;
    }

    /**
     * メイン関数
     */
    public async main(): Promise<void> {
        await MinecraftDiscordChatSync.logger.setRootPath(`${process.cwd()}${MinecraftDiscordChatSync.getRunningMode() == "MODULE" ? "/node_modules/@gakuto1112/minecraft-discord-chat-sync/out" : "/out"}`);
        await MinecraftDiscordChatSync.plugin.loadPlugins();
        MinecraftDiscordChatSync.config.readConfigFile();
        MinecraftDiscordChatSync.config.updateConfigFile();
        MinecraftDiscordChatSync.config.verifyConfig();
        MinecraftDiscordChatSync.locale.loadLocales();
    }
}

//引数の確認
let colorLog: boolean = false;
let logDebug: boolean = false;
let rConInit: boolean = false;
process.argv.forEach((arg: string, i: number) => {
    if(i >= 2) {
        switch(arg) {
            case "-c":
                colorLog = true;
                break;
            case "-d":
                logDebug = true;
                break;
            case "-r":
                rConInit = true;
                break;
        }
    }
});

const minecraftDiscordChatSync = new MinecraftDiscordChatSync(colorLog, logDebug, rConInit);
minecraftDiscordChatSync.main();