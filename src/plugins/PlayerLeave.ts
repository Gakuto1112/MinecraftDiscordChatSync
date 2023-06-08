import { MessageEmbed, EmbedAuthorData } from "discord.js";
import { PluginBase } from "./PluginBase";
import { colors, settings, addEmbed, sendMessageToDiscord } from "../MinecraftDiscordChatSync";

export class Plugin extends PluginBase {
    constructor() {
        super();
        addEmbed("playerLeave");
    }

    public onMinecraftMessage(time: Date, thread: string, messageType: string, message: string): void {
        if(/^\w{3,16} left the game/.test(message)) {
            const playerName = message.split(" ")[0];
            const messageContent: string = ":night_with_stars: " + playerName + " がゲームから退出しました";
            if(settings.embeds.playerLeave) {
                const embed = new MessageEmbed();
                embed.setTitle("ゲームから退出しました");
                const author: EmbedAuthorData = { name: playerName };
                embed.setAuthor(author);
                embed.setColor("#FF0000");
                const https = require("https");
                const uuidRequest = https.request("https://api.mojang.com/users/profiles/minecraft/" + playerName, (response: any) => {
                    if(response.statusCode == 200) {
                        response.on("data", (data: any) => {
                            embed.setThumbnail("https://minotar.net/helm/" + JSON.parse(data).id + "/64");
                            sendMessageToDiscord(messageContent, embed);
                        });
                    }
                    else {
                        console.warn(colors.yellow + "プレイヤー「" + playerName + "」のUUIDを取得できませんでした。" + colors.reset);
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