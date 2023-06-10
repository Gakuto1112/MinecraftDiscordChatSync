import fs from "fs";
import wasmoon from "wasmoon"
import { MinecraftDiscordChatSync } from "./MinecraftDiscordChatSync";
import { LuaNotInitializedError } from "./errors/LuaNotInitializedError";

/**
 * プラグイン向けのLuaを管理するマネージャークラス
 */
export class LuaManager {
    /**
     * Luaの実行環境のオブジェクト。undefinedならcreateLuaEnvironment()の呼び出しが必要。
     */
    private luaEnvironment: wasmoon.LuaEngine|undefined = undefined;

    /**
     * Luaの実行環境を生成する。
     */
    public async createLuaEnvironment() {
        if(!this.luaEnvironment) {
            this.luaEnvironment = await new wasmoon.LuaFactory().createEngine();
            MinecraftDiscordChatSync.logger.debug("Created lua environment");
        }
    }

    /**
     * Lua環境下におけるグローバル変数を設定する。この関数を実行する前に必ず"LuaManager.createLuaEnvironment()"を実行すること。
     * @param name 設定するグローバル値の名前
     * @param value 設定するグローバル値
     * @throws {@link LuaNotInitializedError} Lua実行環境が初期化される前に関数を呼び出すと発生するエラー
     */
    public setGlobal(name: string, value: any) {
        if(this.luaEnvironment) {
            this.luaEnvironment.global.set(name, value);
            MinecraftDiscordChatSync.logger.debug(`Set global variable "${name}" to "${value}"`);
        }
        else throw new LuaNotInitializedError();
    }

    /**
     * `./plugins/`配下のLuaファイルを実行する。この関数を実行する前に必ず"LuaManager.createLuaEnvironment()"を実行すること。
     * @throws {@link LuaNotInitializedError} Lua実行環境が初期化される前に関数を呼び出すと発生するエラー
     */
    public runLua() {
        MinecraftDiscordChatSync.logger.debug("Lua execution started");
        if(this.luaEnvironment) {
            /**
             * `./plugins/`配下にあるLuaファイルのパスの配列を取得する。
             * @param path 検索するディレクトリのパス。省略で"./plugins/"を参照する。再帰処理用。
             * @returns Luaファイルのパスの配列
             */
            function getLuaFilePaths(path?: fs.Dirent): string[] {
                let luaFileList: string[] = [];
                try {
                    const entries: fs.Dirent[] = fs.readdirSync(path ? `${path.path}${path.name}/` : "./plugins/", {withFileTypes: true});
                    entries.forEach((entry: fs.Dirent) => {
                        if(entry.isFile()) {
                            if(entry.name.toLowerCase().endsWith(".lua")) luaFileList.push(`${entry.path}${entry.name}`);
                        }
                        else luaFileList = luaFileList.concat(getLuaFilePaths(entry));
                    });
                }
                catch(error: any) {
                    if(error.code == "ENOENT") {
                        //ディレクトリが存在しない
                        MinecraftDiscordChatSync.logger.error("\"plugins/\" directory does not exist");
                    }
                    else if(error.code == "EPERM") {
                        //ディレクトリの読み取り権限ない
                        MinecraftDiscordChatSync.logger.error("No permission to read \"plugins/\" directory");
                    }
                    else {
                        //その他エラー
                        MinecraftDiscordChatSync.logger.error("An error occurred while reading \"plugins/\" directory");
                    }
                    process.exit(1);
                }
                return luaFileList;
            }

            getLuaFilePaths().forEach((luaFilePath: string) => {
                try {
                    MinecraftDiscordChatSync.logger.debug(`Running "${luaFilePath.replace("./plugins/", "")}"...`);
                    (this.luaEnvironment as wasmoon.LuaEngine).doStringSync(fs.readFileSync(luaFilePath, {encoding: "utf-8"}));
                }
                catch(error: any) {
                    if(error.code == "EPERM") {
                        //ファイルの読み取り権限なし
                        MinecraftDiscordChatSync.logger.warn(`No permission to read "${luaFilePath.replace("./plugins/", "")}". This file will be skipped`);
                    }
                    else if(!error.code) {
                        //Luaエラー
                        MinecraftDiscordChatSync.logger.error(`${luaFilePath.replace("./plugins/", "")}: ${error.message}`);
                        process.exit(2);
                    }
                    else {
                        //その他エラー
                        MinecraftDiscordChatSync.logger.error("An error occurred while reading/running lua files");
                        process.exit(2);
                    }
                }
            });
            this.luaEnvironment.global.close(); //クローズ忘れないで～
        }
        else throw new LuaNotInitializedError();
    }
}