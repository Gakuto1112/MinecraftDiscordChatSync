import { PluginBase } from "./plugins/PluginBase";

const fs = require("fs");
const { Client, Intents } = require("discord.js");
const chokidar = require("chokidar");
const iconv = require("iconv").Iconv;
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
let settings: { [key: string]: any } = { }; //設定ファイルからの設定情報
let logLines: number; //読み取ったログファイルの行数
export const colors: { [key: string]: string } = { black:"\u001b[30m", red: "\u001b[31m", green: "\u001b[32m", yellow: "\u001b[33m", blue: "\u001b[34m", magenta: "\u001b[35m", cyan: "\u001b[36m", white: "\u001b[37m", reset: "\u001b[0m" }; //標準出力に色を付ける制御文字

//Botにメッセージを送信させる。
export function sendMessageToDiscord(message: string) {
    settings.botSendChannels.forEach((channel: number) => {
        client.channels.cache.get(channel).send(message);
    });
}

//ログの読み取り
function readLog(): Promise<string> {
    return new Promise((resolve, reject) => {
        const iconvConvert = new iconv(settings.logEncode, "utf-8");
        fs.readFile(settings.pathToLogFile, (error: string, body: Buffer) => {
            resolve(iconvConvert.convert(body).toString());
        });
    });
}

//設定ファイルの存在確認
try {
    settings = JSON.parse(fs.readFileSync("Settings.json", "utf-8"));
}
catch(error: any) {
    if(error.code == "ENOENT") {
        console.error(colors.red + "設定ファイル「Settings.json」が存在しません。" + colors.reset);
        const settingsPattern: { [key: string]: any } = { "pathToLogFile": "", "logEncode": "", "timeOffset": 0, "token": "", "botSendChannel": [] };
        try {
            fs.writeFileSync("Settings.json", JSON.stringify(settingsPattern, null, 4));
        }
        catch(error: any) {
            if(error.code == "EPERM") console.error(colors.red + "設定ファイル「Settings.json」を生成しようと試みましたが、書き込み権限がないので生成できません。ディレクトリに書き込み権限を設定してもう一度お試し下さい。" + colors.reset);
            else console.error(colors.red + "設定ファイル「Settings.json」を生成しようと試みましたが、生成できません。エラーコード：" + error.code + colors.reset);
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
        console.error(colors.red + "設定ファイル「Settings.json」を読み取れません。エラーコード：" + error.code + colors.reset);
        process.exit(1);
    }
}
//設定ファイルの検証
//ログファイルへのパス
if(typeof(settings.pathToLogFile) != "string" || !fs.existsSync(settings.pathToLogFile) || !settings.pathToLogFile.endsWith("latest.log")) {
    console.error(colors.red + "ログファイルへのパスが正しくありません。ログファイルへのパスは「~latest.log」である必要があります。また、ログファイルへの絶対パス・相対パスが正しいかも確かめて下さい。" + colors.reset);
    process.exit(1);
}
//ログファイルの文字コード
else if(typeof(settings.logEncode) != "string") {
    console.error(colors.red + "文字コードの指定が正しくありません。" + colors.reset);
    process.exit(1);
}
settings.logEncode = settings.logEncode.toLowerCase();
const validEncode: string[] = ["utf-8", "shift-jis"];
if(validEncode.indexOf(settings.logEncode) == -1) {
    console.error(colors.red + "指定した文字コードはサポートされていません。サポートされている文字コードは " + validEncode.join(", ") + " です。" + colors.reset);
    process.exit(1);
}
//時差
else if(typeof(settings.timeOffset) != "number") {
    console.error(colors.red + "時差の指定が正しくありません。" + colors.reset);
    process.exit(1);
}
//トークン
else if(typeof(settings.token) != "string") {
    console.error(colors.red + "トークンの設定が正しくありません。" + colors.reset);
    process.exit(1);
}

//プラグインファイルの読み取りとインスタンス化
const plugins: PluginBase[] = [];
fs.readdir("./plugins", (error: string, files: string[]) => {
    files.forEach((file: string) => {
        const ignoreFiles: string[] = ["PluginBase.ts"];
        if(file.endsWith(".ts") && !ignoreFiles.includes(file)) {
            import("./plugins/" + file.split(".")[0]).then((plugin) => {
                const pluginClass: PluginBase = new plugin.Plugin();
                plugins.push(pluginClass);
            });
        }
    });
});

//ログファイルの読み取り
const watcher = chokidar.watch(settings.pathToLogFile, { ignored:/[\/\\]\./, persistent:true, usePolling:true });

//ログファイルの初期処理
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
            if(/^\[\d{2}:\d{2}:\d{2}\] \[.+\/[A-Z]+\]: /.test(logBodies[i])) {
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
                    plugin.onMinecraftMessage(messageTime, processInfo[0], processInfo[1], messageBodyPart.join(": "));
                });
            }
        }
        logLines = logBodies.length;
    });
});

//Botへのログイン
client.login(settings.token).catch((error: any) => {
    const errorName: string = error.name;
    if(errorName == "Error [TOKEN_INVALID]") console.error(colors.red + "トークンが無効です。正しいトークンが設定されているか確認して下さい。" + colors.reset);
    else if(errorName == "Error [DISALLOWED_INTENTS]") console.error(colors.red + "インテントが無効または許可されていません。開発者ページからインテントが有効か確認して下さい。ただし、100を超えるサーバーで使用されるBotの場合は、インテントの有効化に審査が必要となります。" + colors.reset);
    process.exit(1);
});

//Botがログインした時のイベント
client.on("ready", () => {
    console.info(colors.green + client.user.tag + colors.reset + " でログインしました。");
});