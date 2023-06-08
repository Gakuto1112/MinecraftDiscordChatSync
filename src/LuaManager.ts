import fs from "fs";
import wasmoon from "wasmoon"
import { LuaNotInitializedError } from "./errors/LuaNotInitializedError";

/**
 * プラグイン向けのLuaを管理するマネージャークラス
 */
class LuaManager {
    /**
     * Luaの実行環境のオブジェクト。undefinedならcreateLuaEnvironment()の呼び出しが必要。
     */
    private luaEnvironment: wasmoon.LuaEngine|undefined = undefined;

    /**
     * Luaの実行環境を生成する。
     */
    public async createLuaEnvironment() {
        if(!this.luaEnvironment) this.luaEnvironment = await new wasmoon.LuaFactory().createEngine();
    }

    /**
     * `./plugins/`配下のLuaファイルを実行する。この関数を実行する前に必ず"LuaManager.createLuaEnvironment()"を実行すること。
     * @throws {@link LuaNotInitializedError} Lua実行環境が初期化される前に関数を呼び出すと発生するエラー
     */
    public runLua() {
        if(this.luaEnvironment) {
            /**
             * `./plugins/`配下にあるLuaファイルのパスの配列を取得する。
             * @param path 検索するディレクトリのパス。省略で"./plugins/"を参照する。再帰処理用。
             * @returns Luaファイルのパスの配列
             */
            function getLuaFilePaths(path?: fs.Dirent): string[] {
                let luaFileList: string[] = [];
                //TODO: ログ機能を作成してからエラーハンドリング
                const entries: fs.Dirent[] = fs.readdirSync(path ? `${path.path}${path.name}/` : "./plugins/", {withFileTypes: true});
                entries.forEach((entry: fs.Dirent) => {
                    if(entry.isFile()) {
                        if(entry.name.toLowerCase().endsWith(".lua")) luaFileList.push(`${entry.path}${entry.name}`);
                    }
                    else luaFileList = luaFileList.concat(getLuaFilePaths(entry));
                });
                return luaFileList;
            }

            getLuaFilePaths().forEach((luaFilePath: string) => {
                //TODO: ログ機能を作成してからエラーハンドリング
                this.luaEnvironment?.doStringSync(fs.readFileSync(luaFilePath, {encoding: "utf-8"}));
            });
        }
        else throw new LuaNotInitializedError();
    }
}

//単体デバッグ用
async function main() {
    const luaManager: LuaManager = new LuaManager();
    await luaManager.createLuaEnvironment();
    luaManager.runLua();
}

main();