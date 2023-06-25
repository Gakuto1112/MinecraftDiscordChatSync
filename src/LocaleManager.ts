import fs from "fs";
import readline from "readline";
import { MinecraftDiscordChatSync } from "./MinecraftDiscordChatSync";

/**
 * ボットの表示言語を管理するクラス
 */
export class LocaleManager {
    /**
     * 言語データを保持する変数
     */
    private readonly localeData: {[key: string]: {[key: string]: string}} = {};

    /**
     * 言語ファイルを読み込む。
     * @param localeName 対象の言語名
     */
    private async loadLocaleFile(localeName: string): Promise<void> {
        let readCount: number = 0;
        this.localeData[localeName] = {};
        for await (const line of readline.createInterface({input: fs.createReadStream(`./locales/${localeName}/${localeName}.tsv`, {encoding: "utf-8"})})) {
            if(readCount++ >= 1) {
                const tsv: string[] = line.split("\t");
                this.localeData[localeName][tsv[0]] = typeof tsv[1] == "string" && !/^['"]{2}$/.test(tsv[1]) ? tsv[1] : "";
            }
        }
    }

    /**
     * 言語データをファイルから読み込む。読み込むのは英語と設定言語のみ。
     */
    public async loadLocales(): Promise<void> {
        MinecraftDiscordChatSync.logger.info("Loading locale data...");
        try {
            await this.loadLocaleFile("en_us");
        }
        catch(error: any) {
            if(error.code == "ENOENT") {
                //デフォルトの言語ファイルがない
                MinecraftDiscordChatSync.logger.error("The default locale file (/locales/en_us/en_us.tsv) does not exist.");
            }
            else if(error.code == "EPERM") {
                //デフォルトの言語ファイルの読み取り権限がない
                MinecraftDiscordChatSync.logger.error("No permission to read default locale file (/locales/en_us/en_us.tsv).");
            }
            else {
                //その他エラー
                MinecraftDiscordChatSync.logger.error(`An error occurred while reading default locale file (/locales/en_us/en_us.tsv).\n${error.stack}`);
            }
            process.exit(1);
        }
        const currentLocale: string = MinecraftDiscordChatSync.config.getConfig("locale");
        if(currentLocale != "en_us") {
            try {
                await this.loadLocaleFile(currentLocale);
            }
            catch(error: any) {
                if(error.code == "ENOENT") {
                    //現在の言語ファイルがない
                    MinecraftDiscordChatSync.logger.error(`The current locale file (/locales/${currentLocale}/${currentLocale}.tsv) does not exist.`);
                }
                else if(error.code == "EPERM") {
                    //現在の言語ファイルの読み取り権限がない
                    MinecraftDiscordChatSync.logger.error(`No permission to read current locale file (/locales/${currentLocale}/${currentLocale}.tsv).`);
                }
                else {
                    //その他エラー
                    MinecraftDiscordChatSync.logger.error(`An error occurred while reading current locale file (/locales/${currentLocale}/${currentLocale}.tsv).\n${error.stack}`);
                }
                MinecraftDiscordChatSync.logger.warn("Failed to load current locale data! \"en_us\" locale will be used instead.");
            }
        }
        MinecraftDiscordChatSync.logger.info("Finished loading locale data.");
        MinecraftDiscordChatSync.proceedLoadCount();
    }

    /**
     * 現在の設定言語での、指定されたキー対応する文字列を返す。
     * @param key 対象のキーの名前。
     * @return 現在の設定言語のキーに対応する文字列。もし、現在の設定言語でキーに対応する文字列がなければデフォルトの言語（en_us）での文字列を返す。それもなければ、キーをそのまま返す。
     */
    public getLocale(key: string): string {
        const currentLocale: string = MinecraftDiscordChatSync.config.getConfig("locale");
        if(currentLocale != "en_us" && typeof this.localeData[currentLocale][key] == "string") return this.localeData[currentLocale][key];
        else if(typeof this.localeData["en_us"][key] == "string") return this.localeData["en_us"][key];
        else return key;
    }
}