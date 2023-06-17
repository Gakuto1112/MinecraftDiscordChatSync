import { Logger } from "./Logger";
import { ConfigManager } from "./ConfigManager";
import { LogObserver } from "./LogObserver";
import { LuaManager } from "./LuaManager";
import { BotManager } from "./BotManager";

/**
 * Luaに登録するイベント名
 */
type EventName = "onDiscordLogin";

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
     * Luaマネージャーのインスタンス
     */
    private readonly lua: LuaManager = new LuaManager();
    /**
     * Discordボットを制御するインスタンス
     */
    private readonly bot: BotManager = new BotManager();

    public static readonly eventCallbacks: {[key in EventName]: Function[]} = {
        onDiscordLogin: []
    };

    constructor(logDebug: boolean) {
        MinecraftDiscordChatSync.logger = new Logger(logDebug);
    }

    /**
     * Luaにグローバル変数各種を登録する。
     */
    private addGlobals() {
        //イベント登録関数
        this.lua.setGlobal("events", {
            onDiscordLogin: {
                register: (callback: () => void) => MinecraftDiscordChatSync.eventCallbacks["onDiscordLogin"].push(callback)
            }
        });
    }

    /**
     * メイン関数
     */
    public async main(): Promise<void> {
        MinecraftDiscordChatSync.config.readConfigFile();
        await this.logObserver.observe();
        await this.lua.createLuaEnvironment();
        this.addGlobals();
        this.lua.runLua();
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