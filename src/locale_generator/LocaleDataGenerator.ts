import os from "os";
import fs from "fs";
import unzipper from "unzipper";
import { error, hint, input, log, print } from "./ConsoleUtils";

/**
 * インデックスファイルのエントリーデータ
 */
type IndexEntry = {
    /** ファイルのハッシュ値 */
    hash: string,
    /** ファイルサイズ */
    size: number
}

/**
 * 一時的に生成したen_us.jsonを削除する。
 */
function deleteTemporaryEnUs(): void {
    try {
        fs.unlinkSync("./locales/en_us.json");
    }
    catch(caughtError: any) {
        if(caughtError.code == "EPERM") {
            //ファイルの削除権限がない
            error("No permission to delete temporary \"en_us.json\"!");
        }
        else {
            //その他エラー
            error(`An error occurred while deleting temporary \"en_us.json\"!\n${caughtError.stack}`);
        }
    }
}

/**
 * ソースの言語データから"advancements.tsv"、"death.tsv"、"entity.tsv"を生成する。
 * @param src 言語データのパス
 * @param lang 生成対象の言語名
 * @param selfDefault ソース自身をデフォルトファイルとするかどうか
 */
function generateLocaleData(src: string, lang: string): void {
    function getLangData(langSrc: string): {[key: string]: string} {
        try {
            return JSON.parse(fs.readFileSync(langSrc, {encoding: "utf-8"}));
        }
        catch(caughtError: any) {
            if(caughtError.code == "ENOENT") {
                //ファイルが存在しない
                error("Provided source file does not exist!");
            }
            else if(caughtError.code == "EPERM") {
                //ファイルの読み取り権限ない
                error("No permission to read source file!");
            }
            else if(caughtError instanceof SyntaxError) {
                //json構文エラー
                error("Failed to analyze index file due to syntax error!");
            }
            else {
                //その他エラー
                error(`An error occurred while reading source file!\n${caughtError.stack}`);
            }
            process.exit(1);
        }
    }

    log("Loading target lang data...");
    const langData: {[key: string]: string} = getLangData(src);
    log("Loading default lang data...");
    const defaultLangData = getLangData("./locales/en_us.json");
    try {
        if(!fs.existsSync(`./locales/${lang}/`)) fs.mkdirSync(`./locales/${lang}/`);
        //進捗データの出力
        log("Generating \"advancements.tsv\"...");
        const advancements: fs.WriteStream = fs.createWriteStream(`./locales/${lang}/advancements.tsv`);
        const advancementsKeys: string[] = Object.keys(defaultLangData).filter((key: string) => /^advancements\.\w+\.\w+\.title$/.test(key) && !/advancements\.\w+\.root\.title/.test(key));
        advancements.write("global\tlocal_title\tlocal_description\n");
        advancementsKeys.forEach((key: string) => advancements.write(`${defaultLangData[key].replace(/"/g, "\\\"")}\t${langData[key]}\t${langData[key.replace("title", "description")].replace(/\n/g, "\\n")}\n`));
        //死亡メッセージデータの出力
        log("Generating \"death.tsv\"...");
        const death: fs.WriteStream = fs.createWriteStream(`./locales/${lang}/death.tsv`);
        const deathKeys: string[] = Object.keys(defaultLangData).filter((key: string) => /^death\.\w+\.\w+/.test(key) && key != "death.attack.badRespawnPoint.link");
        death.write("global\tlocal\n");
        deathKeys.forEach((key: string) => death.write(`${defaultLangData[key]}\t${langData[key]}\n`));
        //エンティティデータの出力
        log("Generating \"entity.tsv\"...");
        const entity: fs.WriteStream = fs.createWriteStream(`./locales/${lang}/entity.tsv`);
        const entityKeys: string[] = Object.keys(defaultLangData).filter((key: string) => /^entity\.minecraft\.\w+$/.test(key) || key.startsWith("entity.minecraft.villager") || key == "death.attack.badRespawnPoint.link");
        entity.write("global\tlocal\n");
        entityKeys.forEach((key: string) => entity.write(key == "death.attack.badRespawnPoint.link" ? `[${defaultLangData[key]}]\t${langData[key]}\n` : `${defaultLangData[key]}\t${langData[key]}\n`));
    }
    catch(caughtError: any) {
        if(caughtError.code == "EPERM") {
            //ファイルの書き込み権限ない
            error("No permission to write destination file!");
        }
        else {
            //その他エラー
            error(`An error occurred while writing destination file!\n${caughtError.stack}`);
        }
        process.exit(1);
    }
}

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
    let defaultGamePath: string = "";
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
    log("Gathering game version files...");
    let targetGameVersion: string = "";
    try {
        const gameVersions: string[] = fs.readdirSync(`${gamePath}/versions`, {withFileTypes: true}).map((value: fs.Dirent) => value.name).filter((value: string) => fs.existsSync(`${gamePath}/versions/${value}/${value}.jar`));
        print("Choose the game version you want to use in below list.");
        hint("If the version which you want to use does not exist, you need to launch game with the version once.");
        print(`[${gameVersions.join(", ")}]`);
        for(let i = 0; true; i++) {
            if(i == 0 && typeof version == "string") targetGameVersion = version;
            else targetGameVersion = await input();
            if(gameVersions.includes(targetGameVersion)) break;
            else error("Specified version value does not exist in the list! Please choose in above list.");
        }
    }
    catch(caughtError: any) {
        if(caughtError.code == "ENOENT") {
            //ディレクトリが存在しない
            error(`"${gamePath}/versions" does not exist! Make sure you specified correct game path and downloaded game data.`);
        }
        else if(caughtError.code == "EPERM") {
            //ディレクトリの読み取り権限ない
            error(`No permission to read "${gamePath}/versions" directory! This tool cannot get needed information.`);
        }
        else {
            //その他エラー
            error(`An error occurred while analyzing "${gamePath}/versions" directory!\n${caughtError.stack}`);
        }
        process.exit(1);
    }
    log("Preparing temporary \"en_us.json\"...");
    for await (const entity of fs.createReadStream(`${gamePath}/versions/${targetGameVersion}/${targetGameVersion}.jar`).pipe(unzipper.Parse({forceStream: true}))) {
        if(entity.path == "assets/minecraft/lang/en_us.json") {
            try {
                entity.pipe(fs.createWriteStream("./locales/en_us.json"));
            }
            catch(caughtError: any) {
                if(caughtError.code == "EPERM") {
                    //ファイルの書き込み権限ない
                    error("No permission to write temporary \"en_us.json\"!");
                }
                else {
                    //その他エラー
                    error(`An error occurred while writing temporary \"en_us.json\"!\n${caughtError.stack}`);
                }
                process.exit(1);
            }
            break;
        }
        else entity.autodrain();
    }
    log("Gathering index files...");
    let targetIndexVersion: string = "";
    try {
        const indexArray: string[] = fs.readdirSync(`${gamePath}/assets/indexes`, {withFileTypes: true}).map((value: fs.Dirent) => value.name.substring(0, value.name.length - 5)).filter((value: string) => Number(value)).sort((a: string, b: string) => {
            function splitVersion(stringToCheck: string): number[] {
                const split: string[] = stringToCheck.split(".");
                const versionNumbers: number[] = [];
                for(let i = 0; i < 2; i++) versionNumbers.push(typeof split[i] == "string" ? Number(split[i]) : 0);
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
            if(i == 0 && typeof version == "string") targetIndexVersion = version;
            else targetIndexVersion = await input();
            if(indexArray.includes(targetIndexVersion)) break;
            else error("Specified version value does not exist in the list! Please choose in above list.");
        }
    }
    catch(caughtError: any) {
        if(caughtError.code == "ENOENT") {
            //ディレクトリが存在しない
            error(`"${gamePath}/assets/indexes" does not exist! Make sure you specified correct game path and downloaded game data.`);
        }
        else if(caughtError.code == "EPERM") {
            //ディレクトリの読み取り権限ない
            error(`No permission to read "${gamePath}/assets/indexes" directory! This tool cannot get needed information.`);
        }
        else {
            //その他エラー
            error(`An error occurred while analyzing "${gamePath}/assets/indexes" directory!\n${caughtError.stack}`);
        }
        deleteTemporaryEnUs();
        process.exit(1);
    }
    log("Gathering available language data...");
    let targetLang: string = "";
    let targetLangHash: string = "";
    try {
        const indexData: {[key: string]: IndexEntry} = JSON.parse(fs.readFileSync(`${gamePath}/assets/indexes/${targetIndexVersion}.json`, {encoding: "utf-8"})).objects;
        const langArray: {[key: string]: string} = {};
        for(const filePath in indexData) {
            if(/^minecraft\/lang\/.+\.json$/.test(filePath)) langArray[(filePath.match(/^minecraft\/lang\/(.+)\.json$/) as RegExpMatchArray)[1]] = indexData[filePath].hash;
        }
        print("Choose the language you want to generate data in below list.");
        hint("If you want to generate \"en_us\" (default locale), please press enter key without entering anything.");
        print(`[${Object.keys(langArray).join(", ")}]`);
        for(let i = 0; true; i++) {
            if(i == 0 && typeof lang == "string") targetLang = lang;
            else targetLang = await input();
            if(targetLang.length == 0) {
                targetLang = "en_us";
                break;
            }
            else if(Object.keys(langArray).includes(targetLang)) {
                targetLangHash = langArray[targetLang];
                break;
            }
            else error("Specified language does not exist in the list! Please choose in above list.");
        }
    }
    catch(caughtError: any) {
        if(caughtError.code == "EPERM") {
            //インデックスファイルの読み取り権限がない
            error("No permission to read index file! This tool cannot get needed information.");
        }
        else if(caughtError instanceof SyntaxError) {
            //json構文解析失敗
            error("Failed to analyze index file due to syntax error! The index file might be broken.");
        }
        else {
            //その他エラー
            error(`An error occurred while analyzing index file!\n${caughtError.stack}`);
        }
        deleteTemporaryEnUs();
        process.exit(1);
    }
    generateLocaleData(targetLangHash.length == 0 ? "./locales/en_us.json" : `${gamePath}/assets/objects/${targetLangHash.substring(0, 2)}/${targetLangHash}`, targetLang);
    deleteTemporaryEnUs();
    print("Generating completed!");
    if(!fs.existsSync(`./locales/${targetLang}/${targetLang}.tsv`)) {
        log("Copying system locale data...");
        try {
            fs.copyFileSync("./locales/en_us/en_us.tsv", `./locales/${targetLang}/${targetLang}.tsv`);
        }
        catch(caughtError: any) {
            if(caughtError.code == "ENOENT") {
                //ソースが存在しない
                error("\"./locales/en_us/en_us.tsv\" does not exist! This system cannot copy locale date for your language.");
            }
            else if(caughtError.code == "EPERM") {
                //ディレクトリの読み取り権限ない
                error(`Cannot copy locale data due to permission error! This system cannot copy locale date for your language.`);
            }
            else {
                //その他エラー
                error(`An error occurred while copying locale data!\n${caughtError.stack}`);
            }
            deleteTemporaryEnUs();
            process.exit(1);
        }
    }
}

main(process.argv[2], process.argv[3], process.argv[4]);