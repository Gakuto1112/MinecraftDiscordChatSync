import fs from "fs";
import { MinecraftDiscordChatSync } from "./MinecraftDiscordChatSync";

/**
 * 設定項目のインターフェース
 */
interface configEntry {
    /** 設定値本体 */
    value: any;
    /** 設定値の検証を行う際に実行する関数 */
    verificationFunction: (valueToVerification: any) => verificationResult;
}

/**
 * 設定値検証関数での戻り値
 */
interface verificationResult {
    /** 入力された値 */
    isValid: boolean;
    /** エラー時に出すメッセージ（省略可） */
    message?: string;
}

/**
 * システムの設定を管理するクラス
 */
export class ConfigManager {
    private readonly config: {[key: string]: configEntry} = {
        pathToLog: {
            value: "../../logs/latest.log",
            verificationFunction: (value: any): verificationResult => {
                return {
                    isValid: typeof value == "string",
                    message: `The provided config value type "${typeof value}" does not match valid type "string".`
                }
            }
        },
        token: {
            value: "",
            verificationFunction: (value: any): verificationResult => {
                return {
                    isValid: typeof value == "string",
                    message: `The provided config value type "${typeof value}" does not match valid type "string".`
                }
            }
        }
    };

    /**
     * コンフィグマネージャーに設定項目を登録する。readConfigFile()が呼ばれる前に読んだ方が良い。
     * @param keyName 設定項目のキーの名前
     * @param defaultValue 初期値
     * @param verificationFunction 設定値の検証用の関数
     */
    public registerConfig(keyName: string, defaultValue: any, verificationFunction: (valueToVerification: any) => verificationResult): void {
        if(this.config[keyName]) MinecraftDiscordChatSync.logger.warn(`Config key "${keyName}" already exists. This system will override this config value.`);
        this.config[keyName] = {
            value: defaultValue,
            verificationFunction: verificationFunction
        };
        MinecraftDiscordChatSync.logger.debug(`Set new config key "${keyName}" value.`);
    }

    /**
     * コンフィグファイルを読み込んで設定値を上書きする。
     */
    public readConfigFile() {
        MinecraftDiscordChatSync.logger.info("Started reading config file.")
        try {
            const configString: string = fs.readFileSync("../config.json", {encoding: "utf-8"});
            try {
                const newConfig: {[key: string]: any} = JSON.parse(configString);
                Object.keys(newConfig).forEach((key: string) => {
                    this.config[key].value = newConfig[key];
                    MinecraftDiscordChatSync.logger.debug(`Set config key "${key}" value from config file.`);
                });
            }
            catch(jsonError: any) {
                if(jsonError instanceof SyntaxError) {
                    //json構文エラー
                    MinecraftDiscordChatSync.logger.error("Cannot read config because there is a syntax error in config file.");
                }
                else {
                    //その他エラー
                    MinecraftDiscordChatSync.logger.error("An error occurred while parsing config file.");
                }
                process.exit(1);
            }
        }
        catch(readError: any) {
            if(readError.code == "ENOENT") {
                //設定ファイルがない
                MinecraftDiscordChatSync.logger.warn("The config file does not exist. This system will generate a new config file with default values automatically.");
                const configData: {[key: string]: string} = {};
                Object.keys(this.config).forEach((key: string) => configData[key] = this.config[key].value);
                try {
                    fs.writeFileSync("../config.json", JSON.stringify(configData, undefined, 4));
                }
                catch(writeError: any) {
                    if(writeError.code == "EPERM") {
                        //書き込み権限がない
                        MinecraftDiscordChatSync.logger.error("Creating a new file was canceled because of no permission.");
                    }
                    else {
                        //その他エラー
                        MinecraftDiscordChatSync.logger.error("Creating a new file was canceled because of an error.");
                    }
                    process.exit(1);
                }
                MinecraftDiscordChatSync.logger.info("Created a new config file. Please fill out it and then, run this system again.");
                process.exit(0);
            }
            else if(readError.code == "EPERM") {
                //設定ファイルの読み取り権限がない
                MinecraftDiscordChatSync.logger.warn("No permission to read config file.");
            }
            else {
                //その他エラー
                MinecraftDiscordChatSync.logger.warn("An error occurred while reading config file.");
            }
            process.exit(1);
        }
        MinecraftDiscordChatSync.logger.info("Finished reading config file.");
    }

    /**
     * 設定値を検証して、設定値が有効な値かを検証する。
     */
    public verifyConfig() {
        MinecraftDiscordChatSync.logger.info("Started config verification.");
        let verificationErrors: number = 0;
        Object.keys(this.config).forEach((key: string) => {
            const result: verificationResult = this.config[key].verificationFunction(this.config[key].value);
            if(result.isValid) MinecraftDiscordChatSync.logger.debug(`[${key}] OK`);
            else {
                if(result.message) MinecraftDiscordChatSync.logger.error(`[${key}] ${result.message}`);
                else MinecraftDiscordChatSync.logger.error(`[${key}] Verification failed.`);
                verificationErrors++;
            }
        });
        if(verificationErrors == 0) MinecraftDiscordChatSync.logger.info("Finished config verification. No error was found.");
        else {
            if(verificationErrors == 1) MinecraftDiscordChatSync.logger.error("An error was found in the config. Please fix it.");
            else MinecraftDiscordChatSync.logger.error(`${verificationErrors} errors were found in the config. Please fix them.`);
            process.exit(1);
        }
    }

    /**
     * マネージャーが持っている設定値を返す。
     * @param key 取得する設定値のキーの名前
     * @return キーに対応する設定値。対応する設定値がなければundefinedを返す。
     */
    public getConfig(key: string): any {
        return this.config[key].value;
    }
}