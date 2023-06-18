import discordJS from "discord.js";
import { MinecraftDiscordChatSync } from "./MinecraftDiscordChatSync";
import { PluginBase } from "./PluginBase";

export class BotManager {
    private readonly client: discordJS.Client = new discordJS.Client({intents: [discordJS.GatewayIntentBits.Guilds, discordJS.GatewayIntentBits.GuildMessages, discordJS.GatewayIntentBits.MessageContent]});

    constructor() {
        this.client.addListener("ready", () => {
            MinecraftDiscordChatSync.logger.info(`Succeeded to login as "${(this.client.user as discordJS.ClientUser).tag}".`);
            MinecraftDiscordChatSync.plugin.plugins.forEach((plugin: PluginBase) => {
                try {
                    plugin.onDiscordLogin();
                }
                catch(error: any) {
                    MinecraftDiscordChatSync.logger.error(`An error occurred while executing "onDiscordLogin()".\n${error}`);
                }
            });
        });
        this.client.addListener("messageCreate", (message: discordJS.Message) => {
            if(message.channel instanceof discordJS.TextChannel && message.guild instanceof discordJS.Guild && message.member instanceof discordJS.GuildMember && (MinecraftDiscordChatSync.config.getConfig("listenChannels") as string[]).includes(message.channel.id) && message.author.id != (this.client.user as discordJS.ClientUser).id) {
                MinecraftDiscordChatSync.logger.info(`[${(message.guild as discordJS.Guild).name}@${message.channel.name}] [attachments: ${message.attachments.size}] <${(message.member as discordJS.GuildMember).displayName}> ${message.content}`);
                MinecraftDiscordChatSync.plugin.plugins.forEach((plugin: PluginBase) => {
                    try {
                        plugin.onDiscordMessage({
                            id: (message.guild as discordJS.Guild).id,
                            name: (message.guild as discordJS.Guild).name
                        }, {
                            id: message.channel.id,
                            name: (message.channel as discordJS.TextChannel).name
                        }, {
                            id: message.author.id,
                            name: message.author.username, //TODO: DiscordJSが更新されたらここをdisplayNameに置き換える（一意の名前への以降への対応）
                            displayName: (message.member as discordJS.GuildMember).displayName
                        }, message.content, message.attachments.map((attachment: discordJS.Attachment) => ({
                            id: attachment.id,
                            name: attachment.name,
                            url: attachment.url
                        })));
                    }
                    catch(error: any) {
                        MinecraftDiscordChatSync.logger.error(`An error occurred while executing "onDiscordLogin()".\n${error}`);
                    }
                });
            }
        });
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
                MinecraftDiscordChatSync.logger.error(`An error occurred during login.\n${error}`);
            }
            process.exit(1);
        });
    }

    /**
     * 送信チャンネルに向けてメッセージを送信する。messageが空文字かつembedが指定されていない場合はメッセージは送信されない。
     * @param message 送信するメッセージ本文
     * @param embed メッセージの埋め込みコンテンツ
     */
    public sendMessage(message?: string, embed?: discordJS.EmbedBuilder): void {
        if((message && message.length > 0) || embed) {
            const messageContent: discordJS.BaseMessageOptions = {};
            if(message && message.length > 0) messageContent.content = message;
            if(embed) messageContent.embeds = [embed];
            (MinecraftDiscordChatSync.config.getConfig("sendChannels") as string[]).forEach((channelId: string) => {
                const channel: discordJS.Channel|undefined = this.client.channels.cache.get(channelId);
                if(channel instanceof discordJS.TextChannel) channel.send(messageContent).then(() => MinecraftDiscordChatSync.logger.debug(`Sent message "${message}" to channel "${channelId}".`)).catch((error: any) => MinecraftDiscordChatSync.logger.error(`An error occurred while sending message to channel "${channelId}".\n${error}`));
            });
        }
        else MinecraftDiscordChatSync.logger.warn("The message will not be sent to Discord because both message body and embed are empty.");
    }
}