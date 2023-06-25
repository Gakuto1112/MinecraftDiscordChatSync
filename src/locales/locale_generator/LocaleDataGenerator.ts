import os from "os";
import fs from "fs";
import { error, hint, input, log, print } from "./ConsoleUtils";

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
        else gamePath = (await input()).replace(/\\/g, "/");
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
    log("Gathering index files...");
    let targetVersion: string;
    try {
        const indexArray: string[] = fs.readdirSync(`${gamePath}/assets/indexes`, {withFileTypes: true}).map((value: fs.Dirent) => value.name.substring(0, value.name.length - 5)).sort((a: string, b: string) => {
            function splitVersion(stringToCheck: string): number[] {
                const split: string[] = stringToCheck.split(".");
                const versionNumbers: number[] = [];
                for(let i = 0; i < 2; i++) versionNumbers.push(typeof split[i] == "string" ? (Number(split[i]) ? Number(split[i]) : 0) : 0);
                return versionNumbers;
            }
            const versionA: number[] = splitVersion(a);
            const versionB: number[] = splitVersion(b);
            return versionA[0] == versionB[0] ? versionA[1] - versionB[1] : versionA[0] - versionB[0];
        });
        print("Choose the index version you want to use in below list.");
        print(`[${indexArray.join(", ")}]`);
        hint(`The higher index version, the newer game version supported. If you play latest Minecraft version, please enter "${indexArray[indexArray.length - 1]}".`);
        for(let i = 0; true; i++) {
            if(i == 0 && typeof version == "string") targetVersion = version;
            else targetVersion = await input();
            if(indexArray.includes(targetVersion)) break;
            else error("Specified version value does not exist in the list! Please choose in above list.");
        }
    }
    catch(error: any) {
        if(error.code == "ENOENT") {
            //ディレクトリが存在しない
            error(`"${gamePath}/assets/indexes" does not exist! Make sure you specified correct game path and downloaded game data.`);
        }
        else if(error.code == "EPERM") {
            //ディレクトリの読み取り権限ない
            error(`No permission to read "${gamePath}/assets/indexes" directory! This tool cannot get needed information.`);
        }
        else {
            //その他エラー
            error(`An error occurred while analyzing "${gamePath}/assets/indexes" directory!\n${error.stack}`);
        }
        process.exit(1);
    }
}

main(process.argv[2], process.argv[3], process.argv[4]);