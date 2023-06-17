import { Logger } from "./Logger";
import { ConfigManager } from "./ConfigManager";
import { LogObserver } from "./LogObserver";
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
     * プラグインマネージャーのインスタンス
     */
    public static readonly pluginManager: PluginManager = new PluginManager();
    /**
     * Discordボットを制御するインスタンス
     */
    private readonly bot: BotManager = new BotManager();

    constructor(logDebug: boolean) {
        MinecraftDiscordChatSync.logger = new Logger(logDebug);
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
        this.bot.login();
    }
}

//引数の確認
let logDebug: boolean = false;
process.argv.forEach((arg: string, i: number) => {
    if(i >= 2) {
        switch(arg) {
            case "-d":
                logDebug = true;
                break;
        }
    }
});

const minecraftDiscordChatSync = new MinecraftDiscordChatSync(logDebug);
minecraftDiscordChatSync.main();