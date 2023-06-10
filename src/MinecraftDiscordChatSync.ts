import { Logger } from "./Logger";
import { LuaManager } from "./LuaManager";

export class MinecraftDiscordChatSync {
    /**
     * ロガーのインスタンス
     */
    public static logger: Logger;
    /**
     * Luaマネージャーのインスタンス
     */
    private readonly luaManager: LuaManager = new LuaManager();

    constructor(logDebug: boolean) {
        MinecraftDiscordChatSync.logger = new Logger(logDebug);
    }

    /**
     * メイン関数
     */
    public async main() {
        await this.luaManager.createLuaEnvironment();
        this.luaManager.runLua();
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