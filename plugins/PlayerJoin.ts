import { MessageEmbed } from "discord.js";
import { PluginBase } from "./PluginBase";
import { colors, settings, addEmbed, sendMessageToDiscord } from "../MinecraftDiscordChatSync";

export class Plugin extends PluginBase {

    constructor() {
        super();
        addEmbed("playerJoin");
    }

    public onMinecraftMessage(time: Date, thread: string, messageType: string, message: string): void {
        if(/^\w{2,16} joined the game/.test(message)) {
            const playerName = message.split(" ")[0];
            const messageContent: string = ":city_sunset: " + playerName + " がゲームに参加しました";
            if(settings.embeds.playerJoin == "true") {
                const embed = new MessageEmbed();
                embed.setTitle("ゲームに参加しました");
                embed.setAuthor(playerName);
                embed.setColor("#00FF00");
                const https = require("https");
                const uuidRequest = https.request("https://api.mojang.com/users/profiles/minecraft/" + playerName, (response: any) => {
                    if(response.statusCode == 200) {
                        response.on("data", (data: any) => {
                            embed.setThumbnail("https://minotar.net/helm/" + JSON.parse(data).id + "/64");
                            sendMessageToDiscord(messageContent, embed);
                        });
                    }
                    else {
                        console.warn(colors.yellow + "プレイヤー \"" + playerName + "\" のUUIDを取得できませんでした。" + colors.reset);
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