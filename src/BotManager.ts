import discordJS from "discord.js";
import { MinecraftDiscordChatSync } from "./MinecraftDiscordChatSync";
import { DiscordChannel, DiscordRole, DiscordUser, PluginBase } from "./PluginBase";

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
                    MinecraftDiscordChatSync.logger.error(`An error occurred while executing "onDiscordLogin()".\n${error.stack}`);
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
                            displayName: (message.member as discordJS.GuildMember).displayName,
                            roles: (message.member as discordJS.GuildMember).roles.cache.map((role: discordJS.Role) => {
                                return {
                                    id: role.id,
                                    name: role.name,
                                    color: role.hexColor
                                }
                            }),
                            color: (message.member as discordJS.GuildMember).displayHexColor,
                            isBot: message.author.bot
                        }, message.content, message.attachments.map((attachment: discordJS.Attachment) => ({
                            id: attachment.id,
                            name: attachment.name,
                            url: attachment.url
                        })));
                    }
                    catch(error: any) {
                        MinecraftDiscordChatSync.logger.error(`An error occurred while executing "onDiscordLogin()".\n${error.stack}`);
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
                MinecraftDiscordChatSync.logger.error(`An error occurred during login.\n${error.stack}`);
            }
            process.exit(1);
        });
    }

    /**
     * サーバーのメンバーの情報を取得する。
     * @param guildId 取得対象のメンバーが所属するサーバーのID
     * @param userId 取得対象のメンバーのID
     * @returns 取得したメンバーの情報。引数が不正な場合はundefinedが返る。
     */
    public getMember(guildId: string, userId: string): DiscordUser|undefined {
        if(!/\D/.test(guildId) || !/\D/.test(userId)) {
            const member: discordJS.GuildMember = (this.client.guilds.cache.get(guildId) as discordJS.Guild).members.cache.get(userId) as discordJS.GuildMember;
            return {
                id: member.id,
                name: member.client.user.id,
                displayName: member.displayName,
                roles: member.roles.cache.map((role: discordJS.Role) => {
                    return {
                        id: role.id,
                        name: role.name,
                        color: role.hexColor
                    }
                }),
                color: member.displayHexColor,
                isBot: member.client.user.bot
            }
        }
        else MinecraftDiscordChatSync.logger.error(`The provided guild id "${guildId}" or user id "${userId}" is invalid.`);
    }

    /**
     * サーバーのロールの情報を取得する。
     * @param guildId 取得対象のロールが設定されているサーバーのID
     * @param roleId 取得対象のロールのID
     * @returns 取得したロールの情報。引数が不正な場合はundefinedが返る。
     */
    public getRole(guildId: string, roleId: string): DiscordRole|undefined {
        if(!/\D/.test(guildId) || !/\D/.test(roleId)) {
            const role: discordJS.Role = (this.client.guilds.cache.get(guildId) as discordJS.Guild).roles.cache.get(roleId) as discordJS.Role;
            return {
                id: role.id,
                name: role.name,
                color: role.hexColor
            }
        }
        else MinecraftDiscordChatSync.logger.error(`The provided guild id "${guildId}" or role id "${roleId}" is invalid.`);
    }

    /**
     * サーバーのチャンネルの情報を取得する。
     * @param guildId 取得対象のチャンネルがあるサーバーのID
     * @param channelId 取得対象のチャンネルのID
     * @returns 取得したチャンネルの情報。引数が不正な場合はundefinedが返る。
     */
    public getChannel(guildId: string, channelId: string): DiscordChannel|undefined {
        if(!/\D/.test(guildId) || !/\D/.test(channelId)) {
            const channel: discordJS.GuildBasedChannel = (this.client.guilds.cache.get(guildId) as discordJS.Guild).channels.cache.get(channelId) as discordJS.GuildBasedChannel;
            return {
                id: channel.id,
                name: channel.name
            }
        }
        else MinecraftDiscordChatSync.logger.error(`The provided guild id "${guildId}" or channel id "${channelId}" is invalid.`);
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
                if(channel instanceof discordJS.TextChannel) channel.send(messageContent).then(() => MinecraftDiscordChatSync.logger.debug(`Sent message "${message}" to channel "${channelId}".`)).catch((error: any) => MinecraftDiscordChatSync.logger.error(`An error occurred while sending message to channel "${channelId}".\n${error.stack}`));
            });
        }
        else MinecraftDiscordChatSync.logger.warn("The message will not be sent to Discord because both message body and embed are empty.");
    }
}