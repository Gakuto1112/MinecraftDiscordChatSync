import fs from "fs";
import iconv from "iconv-lite";
import { MinecraftDiscordChatSync } from "./MinecraftDiscordChatSync";

/**
 * 設定項目のインターフェース
 */
type ConfigEntry = {
    /** 設定値本体 */
    value: any;
    /** 設定値の検証を行う際に実行する関数 */
    verificationFunction: (valueToVerification: any) => VerificationResult;
}

/**
 * 設定値検証関数での戻り値
 */
type VerificationResult = {
    /** 入力された値 */
    isValid: boolean;
    /** エラー時に出すメッセージ（省略可） */
    message?: string;
}

/**
 * システムの設定を管理するクラス
 */
export class ConfigManager {
    /**
     * 設定を保持するフィールド
     */
    private readonly config: {[key: string]: ConfigEntry} = {
        pathToLog: {
            value: "../../logs/latest.log",
            verificationFunction: (value: any): VerificationResult => {
                if(typeof value == "string") {
                    return {
                        isValid: value.endsWith(".log"),
                        message: "The game log file must end with \".log\"."
                    }
                }
                else {
                    return {
                        isValid: false,
                        message: `The provided config value type "${typeof value}" does not match valid type "string".`
                    }
                }
            }
        },
        logCharCode: {
            value: "utf-8",
            verificationFunction: (value: any): VerificationResult => {
                if(typeof value == "string") {
                    return {
                        isValid: iconv.encodingExists(value),
                        message: `The provided character code "${value}" is invalid or not supported.`
                    }
                }
                else {
                    return {
                        isValid: false,
                        message: `The provided config value type "${typeof value}" does not match valid type "string".`
                    }
                }
            }
        },
        locale: {
            value: "en_us",
            verificationFunction: (value: any): VerificationResult => {
                return {
                    isValid: typeof value == "string",
                    message: `The provided config value type "${typeof value}" does not match valid type "string".`
                }
            }
        },
        token: {
            value: "",
            verificationFunction: (value: any): VerificationResult => {
                return {
                    isValid: typeof value == "string",
                    message: `The provided config value type "${typeof value}" does not match valid type "string".`
                }
            }
        },
        listenChannels: {
            value: [],
            verificationFunction: (value: any): VerificationResult => {
                if(value instanceof Array) {
                    for(const channel of value) {
                        if(typeof channel != "string") {
                            return {
                                isValid: false,
                                message: `One of the provided send channels value type "${typeof channel}" does not match valid type "string".`
                            }
                        }
                        else if(/[^\d]/.test(channel)) {
                            return {
                                isValid: false,
                                message: `One of the provided send channels value is invalid.`
                            }
                        }
                    }
                    return {
                        isValid: true
                    }
                }
                else {
                    return {
                        isValid: false,
                        message: `The provided config value type "${typeof value}" does not match valid type "object".`
                    }
                }
            }
        },
        sendChannels: {
            value: [],
            verificationFunction: (value: any): VerificationResult => {
                if(value instanceof Array) {
                    for(const channel of value) {
                        if(typeof channel != "string") {
                            return {
                                isValid: false,
                                message: `One of the provided send channels value type "${typeof channel}" does not match valid type "string".`
                            }
                        }
                        else if(/[^\d]/.test(channel)) {
                            return {
                                isValid: false,
                                message: `One of the provided send channels value is invalid.`
                            }
                        }
                    }
                    return {
                        isValid: true
                    }
                }
                else {
                    return {
                        isValid: false,
                        message: `The provided config value type "${typeof value}" does not match valid type "object".`
                    }
                }
            }
        },
        rConPort: {
            value: 25575,
            verificationFunction: (value: any): VerificationResult => {
                if(typeof value == "number") {
                    return {
                        isValid: (value as number) > 0 && (value as number) < 65536 && (value as number) % 1 == 0,
                        message: `The provided port number is invalid. It must be within 1 to 65535.`
                    }
                }
                else {
                    return {
                        isValid: false,
                        message: `The provided config value type "${typeof value}" does not match valid type "number".`
                    }
                }
            }
        },
        rConPassword: {
            value: "",
            verificationFunction: (value: any): VerificationResult => {
                return {
                    isValid: typeof value == "string",
                    message: `The provided config value type "${typeof value}" does not match valid type "string".`
                }
            }
        }
    };

    /**
     * 新しい設定値が追加されたどうか（設定ファイルへの出力の可否判断に使用する）
     */
    private configAdded: boolean = false;

    /**
     * 設定ファイルに設定値を書き込む。
     */
    private writeConfigFile(): void {
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
    }

    /**
     * コンフィグマネージャーに設定項目を登録する。readConfigFile()が呼ばれる前に読んだ方が良い。
     * @param keyName 設定項目のキーの名前
     * @param defaultValue 初期値
     * @param verificationFunction 設定値の検証用の関数
     */
    public registerConfig(keyName: string, defaultValue: any, verificationFunction: (valueToVerification: any) => VerificationResult): void {
        if(this.config[keyName]) this.config[keyName].verificationFunction = verificationFunction;
        else {
            this.config[keyName] = {
                value: defaultValue,
                verificationFunction: verificationFunction
            };
            this.configAdded = true;
            MinecraftDiscordChatSync.logger.debug(`Set new config key "${keyName}" value.`);
        }
    }

    /**
     * コンフィグファイルを読み込んで初期値を上書きする。
     */
    public readConfigFile() {
        MinecraftDiscordChatSync.logger.info("Started reading config file.")
        try {
            const configString: string = fs.readFileSync("../config.json", {encoding: "utf-8"});
            try {
                const newConfig: {[key: string]: any} = JSON.parse(configString);
                Object.keys(newConfig).forEach((key: string) => {
                    if(this.config[key]) this.config[key].value = newConfig[key];
                    else this.config[key] = {
                        value: newConfig[key],
                        verificationFunction: () => {
                            return {
                                isValid: true
                            }
                        }
                    };
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
                    MinecraftDiscordChatSync.logger.error(`An error occurred while parsing config file.\n${jsonError}`);
                }
                process.exit(1);
            }
        }
        catch(readError: any) {
            if(readError.code == "ENOENT") {
                //設定ファイルがない
                MinecraftDiscordChatSync.logger.warn("The config file does not exist. This system will generate a new config file with default values automatically.");
                this.writeConfigFile();
                MinecraftDiscordChatSync.logger.info("Created a new config file. Please fill out it and then, run this system again.");
                process.exit(0);
            }
            else if(readError.code == "EPERM") {
                //設定ファイルの読み取り権限がない
                MinecraftDiscordChatSync.logger.error("No permission to read config file.");
            }
            else {
                //その他エラー
                MinecraftDiscordChatSync.logger.error(`An error occurred while reading config file.\n${readError}`);
            }
            process.exit(1);
        }
        MinecraftDiscordChatSync.logger.info("Finished reading config file.");
    }

    /**
     * 設定ファイルを更新する必要がある場合は設定ファイルを上書きする。
     */
    public updateConfigFile() {
        MinecraftDiscordChatSync.logger.info("Checking new config addition...");
        if(this.configAdded) {
            MinecraftDiscordChatSync.logger.info("New config values detected. Updating config file...");
            this.writeConfigFile();
            MinecraftDiscordChatSync.logger.info("Finished Updating config file.");
        }
    }

    /**
     * 設定値を検証して、設定値が有効な値かを検証する。
     */
    public verifyConfig() {
        MinecraftDiscordChatSync.logger.info("Started config verification.");
        let verificationErrors: number = 0;
        Object.keys(this.config).forEach((key: string) => {
            const result: VerificationResult = this.config[key].verificationFunction(this.config[key].value);
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