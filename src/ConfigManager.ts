/**
 * システムの設定を管理するクラス
 */
export class ConfigManager {
    private readonly config: {[key: string]: any} = {
        pathToLog: "../../logs/latest.log"
    };

    /**
     * マネージャーが持っている設定値を返す。
     * @param key 取得する設定値のキーの名前
     * @return キーに対応する設定値。対応する設定値がなければundefinedを返す。
     */
    public getConfig(key: string): any {
        return this.config[key];
    }
}