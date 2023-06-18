import { Logger } from "./Logger";
import { ConfigManager } from "./ConfigManager";
import { LocaleManager } from "./LocaleManager";
import { LogObserver } from "./LogObserver";
import { RConManager } from "./RconManager";
import { PluginManager } from "./PluginManager";
import { BotManager } from "./BotManager";

export class MinecraftDiscordChatSync {
    /**
     * ロガーのインスタンス
     */
    public static logger: Logger;
    /**
     * コンフィグマネージャーのインスタンス
     */
    public static readonly config: ConfigManager = new ConfigManager();
    public static readonly locale: LocaleManager = new LocaleManager();
    /**
     * ログ監視のインスタンス
     */
    public readonly log: LogObserver = new LogObserver();
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
     * システム開始時にRConに接続するかどうか
     */
    private readonly rConInit: boolean;

    constructor(logDebug: boolean, rConInit: boolean) {
        MinecraftDiscordChatSync.logger = new Logger(logDebug);
        this.rConInit = rConInit;
    }

    /**
     * メイン関数
     */
    public async main(): Promise<void> {
        MinecraftDiscordChatSync.config.readConfigFile();
        await MinecraftDiscordChatSync.plugin.loadPlugins();
        MinecraftDiscordChatSync.config.updateConfigFile();
        MinecraftDiscordChatSync.config.verifyConfig();
        MinecraftDiscordChatSync.locale.loadLocales();
        await this.log.observe();
        if(this.rConInit) MinecraftDiscordChatSync.rCon.connect();
        MinecraftDiscordChatSync.bot.login();
    }
}

//引数の確認
let logDebug: boolean = false;
let rConInit: boolean = false;
process.argv.forEach((arg: string, i: number) => {
    if(i >= 2) {
        switch(arg) {
            case "-d":
                logDebug = true;
                break;
            case "-r":
                rConInit = true;
                break;
        }
    }
});

const minecraftDiscordChatSync = new MinecraftDiscordChatSync(logDebug, rConInit);
minecraftDiscordChatSync.main();