import { MessageEmbed } from "discord.js";
import { PluginBase } from "./PluginBase";
import { colors, addEmbed, getSettings, sendMessageToDiscord } from "../MinecraftDiscordChatSync";

export class Plugin extends PluginBase {

    private settings: any = undefined;

    constructor() {
        super();
        addEmbed("playerLeave");
    }
    public onMinecraftMessage(time: Date, thread: string, messageType: string, message: string): void {
        if(/^\w{3,16} left the game/.test(message)) {
            if(typeof(this.settings) == "undefined") {
                this.settings = getSettings();
            }
            const playerName = message.split(" ")[0];
            const messageContent: string = ":night_with_stars: " + playerName + " がゲームから退出しました";
            if(this.settings.embeds.playerLeave == "true") {
                const embed = new MessageEmbed();
                embed.setTitle("ゲームから退出しました");
                embed.setAuthor(playerName);
                embed.setColor("#FF0000");
                const https = require("https");
                const uuidRequest = https.request("https://api.mojang.com/users/profiles/minecraft/" + playerName, (response: any) => {
                    if(response.statusCode == 200) {
                        response.on("data", (data: any) => {
                            embed.setThumbnail("https://minotar.net/helm/" + JSON.parse(data).id + "/64");
                            embed.setTimestamp();
                            sendMessageToDiscord(messageContent, embed);
                        });
                    }
                    else {
                        console.warn(colors.yellow + "プレイヤー \"" + playerName + "\" のUUIDを取得できませんでした。" + colors.reset);
                        embed.setTimestamp();
                        sendMessageToDiscord(messageContent, embed);
                    }
                });
                uuidRequest.end();
            }
            else {
                sendMessageToDiscord(messageContent);
            }
        }
    }
}