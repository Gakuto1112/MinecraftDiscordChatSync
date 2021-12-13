const fs = require("fs");
let settings: { [key: string]: any } = { };
const colors: { [key: string]: string } = { black:"\u001b[30m", red: "\u001b[31m", green: "\u001b[32m", yellow: "\u001b[33m", blue: "\u001b[34m", magenta: "\u001b[35m", cyan: "\u001b[36m", white: "\u001b[37m", reset: "\u001b[0m" }; //標準出力に色を付ける制御文字

//設定ファイルの存在確認
if(fs.existsSync("Settings.json")) {
    settings = JSON.parse(fs.readFileSync("Settings.json", "utf-8"));
    console.log(settings);
} else {
    const settingsPattern: { [key: string]: any } = { "token": "" };
    fs.writeFileSync("Settings.json", JSON.stringify(settingsPattern))
    console.log(colors.yellow + "設定ファイルの「Settings.json」が存在しません。\n" + colors.reset + "「Settings.json」を生成しました。ファイルを開いて必要な情報を入力して下さい。");
    process.exit(0);
}