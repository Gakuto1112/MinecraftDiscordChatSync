import discordJS from "discord.js";
import { MinecraftDiscordChatSync } from "./MinecraftDiscordChatSync";

export class BotManager {
    private readonly client: discordJS.Client = new discordJS.Client({intents: [discordJS.GatewayIntentBits.Guilds, discordJS.GatewayIntentBits.GuildMessages]});

    constructor() {
        this.client.addListener("ready", () => MinecraftDiscordChatSync.logger.info(`Succeeded to login as "${(this.client.user as discordJS.ClientUser).tag}".`));
    }

    /**
     * Botにログインする。
     */
    public login(): void {
        MinecraftDiscordChatSync.logger.info("Logging in to bot...");
        this.client.login(MinecraftDiscordChatSync.config.getConfig("token")).catch((error: any) => {
            if(error.code == "TokenInvalid") {
                //トークンが不正
                MinecraftDiscordChatSync.logger.error("Failed to login because provided token was invalid.");
            }
            else {
                //その他エラー
                MinecraftDiscordChatSync.logger.error("An error occurred during login.");
            }
            process.exit(1);
        });
    }
}