const fs = require("fs");
const { Client } = require("discord.js");
const chokidar = require("chokidar");
const client = new Client({ intents: ["GUILD_MESSAGES"] });
let settings: { [key: string]: any } = { };
const colors: { [key: string]: string } = { black:"\u001b[30m", red: "\u001b[31m", green: "\u001b[32m", yellow: "\u001b[33m", blue: "\u001b[34m", magenta: "\u001b[35m", cyan: "\u001b[36m", white: "\u001b[37m", reset: "\u001b[0m" }; //標準出力に色を付ける制御文字

//設定ファイルの存在確認
if(fs.existsSync("Settings.json")) {
    settings = JSON.parse(fs.readFileSync("Settings.json", "utf-8"));
    //設定ファイルの検証
    if(typeof(settings.pathToLogFile) != "string" || !fs.existsSync(settings.pathToLogFile) || !settings.pathToLogFile.endsWith("latest.log")) {
        console.error(colors.red + "ログファイルへのパスが正しくありません。ログファイルへのパスは「~latest.log」である必要があります。また、ログファイルへの絶対パス・相対パスが正しいかも確かめて下さい。" + colors.reset);
        process.exit(1);
    }
    else if(typeof(settings.token) != "string") {
        console.error(colors.red + "トークンの設定が正しくありません。" + colors.reset);
        process.exit(1);
    }
} else {
    const settingsPattern: { [key: string]: any } = { "pathToLogFile": "", "token": "" };
    fs.writeFileSync("Settings.json", JSON.stringify(settingsPattern, null, 4))
    console.error(colors.yellow + "設定ファイルの「Settings.json」が存在しません。" + colors.reset);
    console.info("「Settings.json」を生成しました。ファイルを開いて必要な情報を入力して下さい。");
    process.exit(0);
}

//ログファイルの読み取り
const watcher = chokidar.watch(settings.pathToLogFile, { ignored:/[\/\\]\./, persistent:true, usePolling:true });

//Botへのログイン
client.login(settings.token).catch((error: any) => {
    const errorName: string = error.name;
    if(errorName == "Error [TOKEN_INVALID]") console.error(colors.red + "トークンが無効です。正しいトークンが設定されているか確認して下さい。" + colors.reset);
    else if(errorName == "Error [DISALLOWED_INTENTS]") console.error(colors.red + "インテントが無効または許可されていません。開発者ページからインテントが有効か確認して下さい。ただし、100を超えるサーバーで使用されるBotの場合は、インテントの有効化に審査が必要となります。" + colors.reset);
    process.exit(1);
});

//Botがログインした時のイベント
client.on("ready", () => {
    console.info(colors.green + client.user.tag + colors.reset + " でログインしました。")
});