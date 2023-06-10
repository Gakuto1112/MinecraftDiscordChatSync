import { Logger } from "./Logger";
import { ConfigManager } from "./ConfigManager";
import { LuaManager } from "./LuaManager";
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
     * Luaマネージャーのインスタンス
     */
    private readonly lua: LuaManager = new LuaManager();
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
    public async main() {
        await this.lua.createLuaEnvironment();
        this.lua.runLua();
        MinecraftDiscordChatSync.config.readConfigFile();
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