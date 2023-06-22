import { Rcon } from "rcon-client";
import { MinecraftDiscordChatSync } from "./MinecraftDiscordChatSync";
import { PluginBase } from "./PluginBase";

export class RConManager {
    /**
     * RConのインスタンス。未接続時はundefinedになる。
     */
    private rCon: Rcon|undefined;

    /**
     * RConをサーバーに接続する。
     */
    public async connect(): Promise<void> {
        if(this.rCon == undefined) {
            MinecraftDiscordChatSync.logger.info("Connecting RCon...");
            this.rCon = new Rcon({host: "localhost", port: MinecraftDiscordChatSync.config.getConfig("rConPort"), password: MinecraftDiscordChatSync.config.getConfig("rConPassword")});
            this.rCon.on("connect", () => {
                MinecraftDiscordChatSync.plugin.plugins.forEach((plugin: PluginBase) => {
                    try {
                        plugin.onRConOpen();
                    }
                    catch(error: any) {
                        MinecraftDiscordChatSync.logger.error(`An error occurred while executing "onRConOpen()".\n${error.stack}`);
                    }
                });
                MinecraftDiscordChatSync.logger.info("RCon connected.");
            });
            this.rCon.on("end", () => {
                MinecraftDiscordChatSync.plugin.plugins.forEach((plugin: PluginBase) => {
                    try {
                        plugin.onRConClose();
                    }
                    catch(error: any) {
                        MinecraftDiscordChatSync.logger.error(`An error occurred while executing "onRConClose()".\n${error.stack}`);
                    }
                });
                MinecraftDiscordChatSync.logger.info("RCon connection closed.");
            });
            try {
                await (this.rCon as Rcon).connect();
            }
            catch(error: any) {
                if(error.message == "Already connected or connecting") {
                    MinecraftDiscordChatSync.logger.warn("Rcon has already connected.");
                }
                else {
                    if(error.code == "ECONNREFUSED") MinecraftDiscordChatSync.logger.error("RCon connection refused.");
                    else if(error.message == "Authentication failed") MinecraftDiscordChatSync.logger.error("RCon authentication failed.");
                    else MinecraftDiscordChatSync.logger.error(`An error occurred during RCon connection.\n${error.stack}`);
                    MinecraftDiscordChatSync.logger.warn("RCON IS NOT CONNECTED! You can still send message from Minecraft to Discord, but cannot send from Discord to Minecraft, or sending commands to the server.");
                    this.rCon = undefined;
                }
            }
        }
        else MinecraftDiscordChatSync.logger.warn("Rcon has already connected.");
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
        }
        else MinecraftDiscordChatSync.logger.error("RCon is not connected.");
    }
}