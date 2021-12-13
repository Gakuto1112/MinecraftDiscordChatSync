const fs = require("fs");
const {Client, Intents } = require("discord.js");
const client = new Client({ intents: Object.keys(Intents.FLAGS) });
let settings: { [key: string]: any } = { };
const colors: { [key: string]: string } = { black:"\u001b[30m", red: "\u001b[31m", green: "\u001b[32m", yellow: "\u001b[33m", blue: "\u001b[34m", magenta: "\u001b[35m", cyan: "\u001b[36m", white: "\u001b[37m", reset: "\u001b[0m" }; //標準出力に色を付ける制御文字

//設定ファイルの存在確認
if(fs.existsSync("Settings.json")) {
    settings = JSON.parse(fs.readFileSync("Settings.json", "utf-8"));
} else {
    const settingsPattern: { [key: string]: any } = { "token": "" };
    fs.writeFileSync("Settings.json", JSON.stringify(settingsPattern, null, 4))
    console.log(colors.yellow + "設定ファイルの「Settings.json」が存在しません。\n" + colors.reset + "「Settings.json」を生成しました。ファイルを開いて必要な情報を入力して下さい。");
    process.exit(0);
}

//Botへのログイン
client.login(settings.token).catch((error: any) => {
    const errorName: string = error.name;
    if(errorName == "Error [TOKEN_INVALID]") console.log(colors.red + "トークンが無効です。正しいトークンが設定されているか確認して下さい。" + colors.reset);
    else if(errorName == "Error [DISALLOWED_INTENTS]") console.log(colors.red + "インテントが無効または許可されていません。開発者ページからインテントが有効か確認して下さい。ただし、100を超えるサーバーで使用されるBotの場合は、インテントの有効化に審査が必要となります。" + colors.reset);
    process.exit(1);
});