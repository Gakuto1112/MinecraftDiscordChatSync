import { Message, MessageEmbed } from "discord.js";
import { Rcon } from "rcon-client";
import { PluginBase } from "./plugins/PluginBase";

const fs = require("fs");
const { Client, Intents } = require("discord.js");
const chokidar = require("chokidar");
const iconv = require("iconv").Iconv;
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
export const minecraftVersions: string[] = ["1.12", "1.12.1", "1.12.2", "1.13", "1.13.1", "1.13.2", "1.14", "1.14.1", "1.14.2", "1.14.3", "1.14.4", "1.15", "1.15.1", "1.15.2", "1.16", "1.16.1", "1.16.2", "1.16.3", "1.16.4", "1.16.5", "1.17", "1.17.1", "1.18", "1.18.1", "1.18.2", "1.19"];
export const colors: { [key: string]: string } = { black:"\u001b[30m", red: "\u001b[31m", green: "\u001b[32m", yellow: "\u001b[33m", blue: "\u001b[34m", magenta: "\u001b[35m", cyan: "\u001b[36m", white: "\u001b[37m", reset: "\u001b[0m" }; //標準出力に色を付ける制御文字

//Embed設定を追加
export function addEmbed(embedName: string): void {
    if(embeds.includes(embedName)) {
        console.error(colors.red + "「" + embedName + "」という名前のEmbedは既に存在します。" + colors.reset);
        process.exit(1);
    }
    embeds.push(embedName);
}

//Botにメッセージを送信させる。
export function sendMessageToDiscord(message: string, messageEmbed: MessageEmbed | undefined = undefined): void {
    settings.botSendChannels.forEach((channel: string) => {
        try {
            if(typeof(messageEmbed) == "undefined") {
                client.channels.cache.get(channel).send(message);
            }
            else {
                client.channels.cache.get(channel).send({content: message, embeds: [messageEmbed] });
            }
        }
        catch {
            console.error(colors.red + "チャンネルID「" + channel + "」を持つチャンネルにメッセージを送信できません。" + colors.reset);
        }
    });
}

//Rcon接続
export function connectRcon(): void {
    console.info("Rconを接続します...");
    rcon.connect().then(() => {
        console.info("Rconを接続しました。");
    }).catch((error: any) => {
        if(error.message.startsWith("connect ECONNREFUSED")) console.error(colors.red + "Rconの接続が拒否されました。" + colors.reset);
        else if(error.message == "Already connected or connecting") console.info(colors.red + "既にRconは接続済みか接続中です。" + colors.reset);
        else {
            if(error.message == "Authentication failed") console.error(colors.red + "Rconの認証に失敗しました。パスワードが間違っている可能性があります。" + colors.reset);
            else console.error(colors.red + "Rconの接続に失敗しました。エラーメッセージ：" + error.message + colors.reset);
            console.warn(colors.red + "Rconが接続されていません！Rconの設定を確認して下さい。" + colors.reset + "このままでも マインクラフト -> Discord の送信はできますが、 Discord -> マインクラフト の送信はできません。");
        }
    });
}

//Rconによるリモートコマンド実行
export function sendRconCommand(command: string): Promise<string | null> {
    return new Promise((resolve) => {
        rcon.send(command).then((response: string) => {
            resolve(response);
        }).catch((error: any) => {
            if(error.message == "Not connected") console.log(colors.red + "Rconが接続されていません。" + colors.reset);
            else {
                console.error(colors.red + "コマンドの送信に失敗しました。" + colors.reset);
                if(showErrorStack) console.info(error.stack);
            }
            resolve(null);
        });
    });
}

//ログの読み取り
function readLog(): Promise<string> {
    return new Promise((resolve) => {
        const iconvConvert = new iconv(settings.logEncode, "utf-8");
        fs.readFile(settings.pathToLogFile, (error: string, body: Buffer) => {
            resolve(iconvConvert.convert(body).toString());
        });
    });
}

//引数の確認
let initRconConnect: boolean = false; //最初にRcon接続するフラグ
let showErrorStack: boolean = false; //エラースタックトレースするかどうかのフラグ
process.argv.forEach((arg: string, i: number) => {
    if(i >= 2) {
        switch(arg) {
            case "-r":
                initRconConnect = true;
                break;
            case "-e":
                showErrorStack = true;
                break;
        }
    }
});

//プラグインファイルの読み取りとインスタンス化
const embeds: string[] = [];
let pluginLoadAttempt: number = 0;
function loadPlugin(): Promise<PluginBase[]> {
    return new Promise((resolve) => {
        console.info("プラグインを読み込んでいます...");
        console.group("読み込まれたプラグイン");
        fs.readdir("./plugins", (error: string, files: string[]) => {
            const result: PluginBase[] = [];
            const ignoreFiles: string[] = ["PluginBase.ts"];
            files.forEach((file: string) => {
                if(file.endsWith(".ts") && !ignoreFiles.includes(file)) {
                    import("./plugins/" + file.split(".")[0]).then((plugin) => {
                        try {
                            const pluginClass: PluginBase = new plugin.Plugin();
                            result.push(pluginClass);
                            console.info("- ["+ colors.green + "正常" + colors.reset + "] -> " + file);
                            resolve(result);
                        }
                        catch(error: any) {
                            console.error("- ["+ colors.red + "エラー" + colors.reset + "] -> " + colors.red + file + colors.reset);
                            if(showErrorStack) console.info(error.stack);
                        }
                        finally {
                            pluginLoadAttempt++;
                        }
                    });
                }
            });
        });
    });
}

let plugins: PluginBase[];
export let settings: { [key: string]: any } = { }; //設定ファイルからの設定情報
export let rcon: Rcon;

loadPlugin().then((resolve: PluginBase[]) => {
    plugins = resolve;
    console.groupEnd();
    if(pluginLoadAttempt == plugins.length) console.info("全てのプラグインが正常に読み込まれました。");
    else console.warn(colors.yellow + "一部のプラグインが正常に読み込まれませんでした。" + colors.reset);
    console.info("設定ファイル検証をしています...");
    //設定ファイルの存在確認
    try {
        settings = JSON.parse(fs.readFileSync("Settings.json", "utf-8"));
    }
    catch(error: any) {
        if(error.code == "ENOENT") {
            console.error(colors.red + "設定ファイル「Settings.json」が存在しません。" + colors.reset);
            const embedField: { [key: string]: boolean } = { };
            embeds.forEach((embed: string) => {
                embedField[embed] = true;
            });
            const settingsPattern: { [key: string]: any } = { minecraftVersion: "1.19", pathToLogFile: "../logs/latest.log", logEncode: "utf-8", timeOffset: 9, embeds: embedField, rconPort: 25575, rconPassword: "", token: "<Botのトークン>", botSendChannels: ["<チャンネルID>"], botWatchChannels: ["<チャンネルID>"], discordMessageDisplay: { ignoreBots: true, displayRoleColor: true, showChannelName: true, useRichText: true, showAttachments: true } };
            try {
                fs.writeFileSync("Settings.json", JSON.stringify(settingsPattern, null, 4));
            }
            catch(error: any) {
                if(error.code == "EPERM") console.error(colors.red + "設定ファイル「Settings.json」を生成しようと試みましたが、書き込み権限がないので生成できません。ディレクトリに書き込み権限を設定してもう一度お試し下さい。" + colors.reset);
                else {
                    console.error(colors.red + "設定ファイル「Settings.json」を生成しようと試みましたが、生成できませんでした。");
                    if(showErrorStack) console.info(error.stack);
                }
                process.exit(1);
            }
            console.info("「Settings.json」を生成しました。ファイルを開いて必要な情報を入力して下さい。");
            process.exit(0);
        }
        else if(error.code == "EPERM") {
            console.error(colors.red + "設定ファイル「Settings.json」の読み取り権限がありません。" + colors.reset);
            process.exit(1);
        }
        else if(error instanceof SyntaxError) {
            console.error(colors.red + "設定ファイル「Settings.json」のjson構文が不正です。" + colors.reset);
            process.exit(1);
        }
        else {
            console.error(colors.red + "設定ファイル「Settings.json」を読み取れません。" + colors.reset);
            if(showErrorStack) console.info(error.stack);
            process.exit(1);
        }
    }
    //設定ファイルの検証
    //設定ファイルの検証時のエラー時の関数
    let errorFlag = false;
    function settingsError(message: string): void {
        console.error(colors.red + message + colors.reset);
        errorFlag = true;
    }
    //ログファイルへのパス
    if(typeof(settings.pathToLogFile) != "string" || !fs.existsSync(settings.pathToLogFile) || !settings.pathToLogFile.endsWith("latest.log")) settingsError(colors.red + "ログファイルへのパスが不正です。ログファイルへのパスは「~latest.log」である必要があります。また、ログファイルへの絶対パス・相対パスが正しいかも確かめて下さい。" + colors.reset);
    //ログファイルの文字コード
    if(typeof(settings.logEncode) != "string") settingsError("文字コードの指定が不正です。");
    const validEncode: string[] = ["utf-8", "shift-jis"];
    if(validEncode.indexOf(settings.logEncode) == -1) settingsError("指定した文字コードはサポートされていません。サポートされている文字コードは " + validEncode.join(", ") + " です。");
    //マインクラフトのバージョン
    if(typeof(settings.minecraftVersion) == "string") {
        if(!minecraftVersions.includes(settings.minecraftVersion)) settingsError("マインクラフトのバージョンが不正です。対応しているバージョンは以下の通りです。\n\n" + minecraftVersions.join(", ") + "\n\n存在していないバージョンを指定したい場合は、最寄りのバージョンを指定して下さい（バージョンによってはボットの機能が正しく機能しない場合があります）。");
    }
    else settingsError("マインクラフトのバージョンが不正です。");
    //時差
    if(typeof(settings.timeOffset) != "number") settingsError("時差の指定が不正です。");
    //Embed設定
    if(typeof(settings.embeds) == "object") {
        embeds.forEach((embed: string) => {
            if(!(embed in settings.embeds)) settingsError("Embed「" + embed + "」がありません。");
        });
        Object.keys(settings.embeds).forEach((key: string) => {
            if(typeof(settings.embeds[key]) != "boolean") settingsError("Embed「" + key + "」が不正です。");
        });
    }
    else settingsError("「embeds」の指定が不正です。");
    //Rconポート
    if(typeof(settings.rconPort) == "number") {
        if(!Number.isInteger(settings.rconPort) || settings.rconPort < 1 || settings.rconPort > 65535) settingsError("Rconのポート番号が不正です。ポート番号は1~65535の整数値で指定する必要があります。");
    }
    else settingsError("Rconのポート番号が不正です。");
    //Rconパスワード
    if(typeof(settings.rconPassword) != "string") settingsError("Rconのパスワードが不正です。");
    //トークン
    if(typeof(settings.token) != "string") settingsError("トークンの設定が不正です。");
    //送信用チャンネルID
    settings.botSendChannels.forEach((channel: string | number) => {
        if(typeof(channel) == "number") settingsError("チャンネルIDは文字列で指定して下さい。対象チャンネルID：" + channel);
        else if(/[^\d]/.test(channel)) settingsError("チャンネルIDが不正です。対象チャンネルID：" + channel);
    });
    //受信用チャンネルID
    settings.botWatchChannels.forEach((channel: string | number) => {
        if(typeof(channel) == "number") settingsError("チャンネルIDは文字列で指定して下さい。対象チャンネルID：" + channel);
        else if(/[^\d]/.test(channel)) settingsError("チャンネルIDが不正です。対象チャンネルID：" + channel);
    });
    //Discordメッセージをゲーム内で表示させる際の設定
    if(typeof(settings.discordMessageDisplay == "object")) {
        ["ignoreBots", "displayRoleColor", "showChannelName", "useRichText" , "showAttachments"].forEach((element: string) => {
            if(!(element in settings.discordMessageDisplay)) settingsError("Discordメッセージ設定「" + element + "」がありません。");
        });
        Object.keys(settings.discordMessageDisplay).forEach((key: string) => {
            if(typeof(settings.discordMessageDisplay[key]) != "boolean") settingsError("Discordメッセージ設定「" + key + "」が不正です。");
        });
    }
    if(errorFlag) {
        console.info("設定ファイルを検証したところ、エラーが見つかりました。修正して下さい。");
        process.exit(1); //エラーフラグがtrueならプログラム終了
    }
    else console.info("設定ファイルを検証しました。エラーは見つかりませんでした。");

    //Rconクラス
    rcon = new Rcon({ host: "localhost", port: settings.rconPort, password: settings.rconPassword });

    //Rcon接続（引数に「-r」が提供されたときのみ）
    if(initRconConnect) connectRcon();

    //ログファイルの読み取り
    const watcher = chokidar.watch(settings.pathToLogFile, { ignored: /[\/\\]\./, persistent: true, usePolling: true });

    //ログファイルの初期処理
    let logLines: number; //読み取ったログファイルの行数
    watcher.on("ready", () => {
        readLog().then((resolve) => {
            logLines = resolve.split("\n").length;
        });
    });

    //ログファイル更新時の処理
    watcher.on("change", () => {
        readLog().then((resolve) => {
            const logBodies: string[] = resolve.split("\n");
            if(logBodies.length < logLines) {
                logLines = logBodies.length;
                return;
            }
            for(let i: number = logLines - 1; i < logBodies.length - 1; i++) {
                //差分読み取りしたログの処理
                if(logBodies[i].startsWith("[")) {
                    const squareBracketString: string[] | null = logBodies[i].match(/(?<=\[).*?(?=\])/g);
                    const messageTime: Date = new Date();
                    const messageTimeParse = squareBracketString![0].split(":");
                    messageTime.setHours(Number(messageTimeParse[0]) +  Math.floor(settings.timeOffset));
                    messageTime.setMinutes(Number(messageTimeParse[1]) + (settings.timeOffset % 1) * 60);
                    messageTime.setSeconds(Number(messageTimeParse[2]));
                    const processInfo: string[] = squareBracketString![1].split("/");
                    const messageBodyPart: string[] = [];
                    logBodies[i].split(": ").forEach((part: string, j: number) => {
                        if(j >= 1) {
                            messageBodyPart.push(part);
                        }
                    });
                    plugins.forEach((plugin: PluginBase) => {
                        try {
                            plugin.onMinecraftMessage(messageTime, processInfo[0], processInfo[1], messageBodyPart.join(": "));
                        }
                        catch(error: any) {
                            if(showErrorStack) console.error(colors.red + "プラグイン実行中にエラーが発生しました。以下、エラーログです。\n" + colors.reset + error.stack);
                            else console.error(colors.red + "プラグイン実行中にエラーが発生しました。");
                        }
                    });
                }
            }
            logLines = logBodies.length;
        });
    });

    //Botへのログイン
    console.info("Botにログインしています...");
    client.login(settings.token).catch((error: any) => {
        const errorName: string = error.name;
        if(errorName == "Error [TOKEN_INVALID]") console.error(colors.red + "トークンが無効です。正しいトークンが設定されているか確認して下さい。" + colors.reset);
        else if(errorName == "Error [DISALLOWED_INTENTS]") console.error(colors.red + "インテントが無効または許可されていません。開発者ページからインテントが有効か確認して下さい。ただし、100を超えるサーバーで使用されるBotの場合は、インテントの有効化に審査が必要となります。" + colors.reset);
        process.exit(1);
    });

    //Botがログインした時のイベント
    let botUserId: string;
    client.on("ready", () => {
        console.info(colors.green + client.user.tag + colors.reset + " でログインしました。\n終了するにはウィンドウを閉じるか、「Ctrl + C」を押して下さい。");
        botUserId = client.user.id;
    });
    client.on("messageCreate",(message: Message) => {
        settings.botWatchChannels.forEach((botWatchChannel: string) => {
            if(botWatchChannel == message.channel.id) {
                if((settings.discordMessageDisplay.ignoreBots && !message.author.bot) || (settings.discordMessageDisplay.ignoreBots == "false" && message.author.id != botUserId)) {
                    plugins.forEach((plugin: PluginBase) => {
                        try {
                            plugin.onDiscordMessage(message);
                        }
                        catch(error: any) {
                            console.error(colors.red + "プラグイン実行中にエラーが発生しました。以下、エラーログです。\n" + colors.reset + error.stack);
                        }
                    });
                }
            }
        });
    });
});