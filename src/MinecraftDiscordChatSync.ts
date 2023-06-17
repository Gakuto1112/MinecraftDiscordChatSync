import { Logger } from "./Logger";
import { ConfigManager } from "./ConfigManager";
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
    /**
     * ログ監視のインスタンス
     */
    public readonly logObserver: LogObserver = new LogObserver();
    /**
     * RConのインスタンス
     */
    public static readonly rConManager: RConManager = new RConManager();
    /**
     * プラグインマネージャーのインスタンス
     */
    public static readonly pluginManager: PluginManager = new PluginManager();
    /**
     * Discordボットを制御するインスタンス
     */
    private readonly bot: BotManager = new BotManager();

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
        await this.logObserver.observe();
        await MinecraftDiscordChatSync.pluginManager.loadPlugins();
        MinecraftDiscordChatSync.config.updateConfigFile();
        MinecraftDiscordChatSync.config.verifyConfig();
        if(this.rConInit) MinecraftDiscordChatSync.rConManager.connect();
        this.bot.login();
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