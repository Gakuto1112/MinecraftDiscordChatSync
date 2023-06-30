import fs from "fs";
import { MinecraftDiscordChatSync } from "./MinecraftDiscordChatSync";
import { PluginBase } from "./PluginBase";

/**
 * プラグインを管理するクラス
 */
export class PluginManager {
    /**
     * 読み込んだプラグインを保持する変数
     */
    public readonly plugins: PluginBase[] = [];
    /**
     * プラグインを読み込んだかどうか
     */
    private pluginLoaded: boolean = false;

    public async loadPlugins() {
        if(!this.pluginLoaded) {
            MinecraftDiscordChatSync.logger.info("Loading plugins...");
            try {
                const entries: fs.Dirent[] = fs.readdirSync("./node_modules/@gakuto1112/minecraft-discord-chat-sync/out/plugins/", {withFileTypes: true});
                for(const entry of entries) {
                    if(entry.isFile()) {
                        if(entry.name.toLowerCase().endsWith(".js")) {
                            try {
                                const plugin = await import(`./plugins/${entry.name}`);
                                Object.keys(plugin).forEach((className: string) => {
                                    try {
                                        this.plugins.push(new plugin[className]());
                                        MinecraftDiscordChatSync.logger.debug(`Loaded "${className}".`);
                                    }
                                    catch(importError: any) {
                                        MinecraftDiscordChatSync.logger.error(`An error occurred while importing "${className}". Skipping.\n${importError.stack}`);
                                    }
                                });
                            }
                            catch(pluginError: any) {
                                if(pluginError.code == "EPERM") {
                                    //ファイルの読み取り権限なし
                                    MinecraftDiscordChatSync.logger.error(`No permission to read "${entry.name}". Skipping.`);
                                }
                                else {
                                    //その他エラー
                                    MinecraftDiscordChatSync.logger.error(`An error occurred while reading "${entry.name}". Skipping.\n${pluginError.stack}`);
                                }
                            }
                        }
                    }
                }
            }
            catch(error: any) {
                if(error.code == "ENOENT") {
                    //ディレクトリが存在しない
                    MinecraftDiscordChatSync.logger.error("\"plugins/\" directory does not exist.");
                }
                else if(error.code == "EPERM") {
                    //ディレクトリの読み取り権限ない
                    MinecraftDiscordChatSync.logger.error("No permission to read \"plugins/\" directory.");
                }
                else {
                    //その他エラー
                    MinecraftDiscordChatSync.logger.error(`An error occurred while reading "plugins/" directory.\n${error.stack}`);
                }
                process.exit(1);
            }
            this.pluginLoaded = true;
        }
        else MinecraftDiscordChatSync.logger.warn("Plugins have already been loaded.");
    }
}