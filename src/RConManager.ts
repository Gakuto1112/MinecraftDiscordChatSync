import { Rcon } from "rcon-client";
import { MinecraftDiscordChatSync } from "./MinecraftDiscordChatSync";
import { PluginBase } from "./PluginBase";

export class RConManager {
    private rCon: Rcon|undefined;

    /**
     * RConをサーバーに接続する。
     */
    public async connect(): Promise<void> {
        this.rCon = new Rcon({host: "localhost", port: MinecraftDiscordChatSync.config.getConfig("rConPort"), password: MinecraftDiscordChatSync.config.getConfig("rConPassword")});
        try {
            await (this.rCon as Rcon).connect();
            MinecraftDiscordChatSync.pluginManager.plugins.forEach((plugin: PluginBase) => {
                try {
                    plugin.onRConOpen();
                }
                catch(error: any) {
                    MinecraftDiscordChatSync.logger.error("An error occurred while executing \"onRConOpen()\"");
                    MinecraftDiscordChatSync.logger.debug(error);
                }
            });
            MinecraftDiscordChatSync.logger.info("Connected to the server with RCon.");
        }
        catch(error: any) {
            if(error.code == "ECONNREFUSED") {
                MinecraftDiscordChatSync.logger.error("RCon connection refused.");
            }
            else if(error.message == "Authentication failed") {
                MinecraftDiscordChatSync.logger.error("RCon authentication failed.");
            }
            else if(error.message == "Already connected or connecting") {
                MinecraftDiscordChatSync.logger.warn("Rcon have already been connected.")
            }
            else {
                MinecraftDiscordChatSync.logger.error(`An error occurred during RCon connection.\n${error}`);
            }
        }
    }

    /**
     * サーバーにコマンドを送信する。
     * @param command 送信するマインクラフトのコマンド
     */
    public async send(command: string): Promise<string|void> {
        if(this.rCon != undefined) return await this.rCon.send(command);
        else MinecraftDiscordChatSync.logger.error("RCon is not connected.");
    }

    /**
     * RConを切断する。
     */
    public async disconnect(): Promise<void> {
        if(this.rCon != undefined) {
            await this.rCon.end();
            this.rCon = undefined;
            MinecraftDiscordChatSync.pluginManager.plugins.forEach((plugin: PluginBase) => {
                try {
                    plugin.onRConClose();
                }
                catch(error: any) {
                    MinecraftDiscordChatSync.logger.error("An error occurred while executing \"onRConClose()\"");
                    MinecraftDiscordChatSync.logger.debug(error);
                }
            });
            MinecraftDiscordChatSync.logger.info("RCon connection closed.");
        }
        else MinecraftDiscordChatSync.logger.error("RCon is not connected.");
    }
}