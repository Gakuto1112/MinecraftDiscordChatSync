import { Logger } from "./Logger";
import { ConfigManager } from "./ConfigManager";
import { LuaManager } from "./LuaManager";

export class MinecraftDiscordChatSync {
    /**
     * ロガーのインスタンス
     */
    public static logger: Logger;
    /**
     * コンフィグマネージャーのインスタンス
     */
    private static readonly config: ConfigManager = new ConfigManager();
    /**
     * Luaマネージャーのインスタンス
     */
    private readonly lua: LuaManager = new LuaManager();

    constructor(logDebug: boolean) {
        MinecraftDiscordChatSync.logger = new Logger(logDebug);
    }

    /**
     * メイン関数
     */
    public async main() {
        await this.lua.createLuaEnvironment();
        this.lua.runLua();
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