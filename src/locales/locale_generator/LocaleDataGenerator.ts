import os from "os";
import fs from "fs";
import { error, hint, input, print } from "./ConsoleUtils";

/**
 * メイン関数
 * @param path ゲームパスの初期入力値
 * @param version バージョン名の初期入力値
 * @param lang 言語名の初期入力値
 */
async function main(path?: string, version?: string, lang?: string): Promise<void> {
    print("Locale Data Generate Tool");
    hint("This tool will generate \"advancements.tsv\", \"death.tsv\", and \"entity.tsv\", which are needed to use this system with your language.");
    print("Enter the your \".minecraft\" path.");
    let defaultGamePath: string;
    switch(process.platform) {
        case "win32":
            defaultGamePath = `C:\\Users\\${os.userInfo().username}\\AppData\\Roaming\\.minecraft`;
            hint(`For Windows, the default location is "${defaultGamePath}".`);
            break;
        case "darwin":
            defaultGamePath = `/Users/${os.userInfo().username}/Library/Application Support/minecraft`;
            hint(`For MacOS, the default location is "${defaultGamePath}".`);
            break;
        case "linux":
            defaultGamePath = `/home/${os.userInfo().username}/.minecraft`;
            hint(`For Linux, the default location is "${defaultGamePath}".`);
            break;
        default:
            defaultGamePath = "";
            break;
    }
    print("If you leave blank, the default path will be used.");
    let gamePath: string;
    for(let i = 0; true; i++) {
        if(i == 0 && typeof path == "string") gamePath = path;
        else gamePath = await input();
        if(gamePath.length == 0) {
            if(defaultGamePath.length > 0) gamePath = defaultGamePath;
            else {
                error("I'm sorry. I can't distinguish default path. I'm sorry to trouble you but please enter the path to \".minecraft\".");
                continue;
            }
        }
        if(fs.existsSync(gamePath)) break;
        else error("Specified path does not exist! Please make sure the path exists.");
    }
}

main(process.argv[2], process.argv[3], process.argv[4]);