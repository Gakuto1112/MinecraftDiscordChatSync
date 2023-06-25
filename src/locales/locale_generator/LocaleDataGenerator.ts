import os from "os";
import fs from "fs";
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
 * ソースの言語データから"advancements.tsv"、"death.tsv"、"entity.tsv"を生成する。
 * @param src 言語データのパス
 * @param lang 生成対象の言語名
 * @param selfDefault ソース自身をデフォルトファイルとするかどうか
 */
function generateLocaleData(src: string, lang: string) {
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
    const defaultLangData = getLangData("./en_us.json");
    try {
        //進捗データの出力
        log("Generating \"advancements.tsv\"...");
        const advancements: fs.WriteStream = fs.createWriteStream(`../${lang}/advancements.tsv`);
        const advancementsKeys: string[] = Object.keys(defaultLangData).filter((key: string) => /^advancements\.\w+\.\w+\.title$/.test(key) && !/advancements\.\w+\.root\.title/.test(key));
        advancements.write("key\tglobal\tlocal_title\tlocal_description\n");
        advancementsKeys.forEach((key: string) => advancements.write(`${key}\t${defaultLangData[key]}\t${langData[key]}\t${langData[key.replace("title", "description")].replace(/\n/g, "\\n")}\n`));
        //死亡メッセージデータの出力
        log("Generating \"death.tsv\"...");
        const death: fs.WriteStream = fs.createWriteStream(`../${lang}/death.tsv`);
        const deathKeys: string[] = Object.keys(defaultLangData).filter((key: string) => /^death\.\w+\.\w+/.test(key) && key != "death.attack.badRespawnPoint.link");
        death.write("key\tglobal\tlocal\n");
        deathKeys.forEach((key: string) => death.write(`${key}\t${defaultLangData[key]}\t${langData[key]}\n`));
        //エンティティデータの出力
        log("Generating \"entity.tsv\"...");
        const entity: fs.WriteStream = fs.createWriteStream(`../${lang}/entity.tsv`);
        const entityKeys: string[] = Object.keys(defaultLangData).filter((key: string) => /^entity\.minecraft\.\w+$/.test(key) || key.startsWith("entity.minecraft.villager") || key == "death.attack.badRespawnPoint.link");
        entity.write("key\tglobal\tlocal\n");
        entityKeys.forEach((key: string) => entity.write(key == "death.attack.badRespawnPoint.link" ? `${key}\t[${defaultLangData[key]}]\t${langData[key]}\n` : `${key}\t${defaultLangData[key]}\t${langData[key]}\n`));
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
    log("Gathering index files...");
    let targetVersion: string = "";
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
            if(i == 0 && typeof version == "string") targetVersion = version;
            else targetVersion = await input();
            if(indexArray.includes(targetVersion)) break;
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
        process.exit(1);
    }
    log("Gathering available language data...");
    let targetLangHash: string = "";
    try {
        const indexData: {[key: string]: IndexEntry} = JSON.parse(fs.readFileSync(`${gamePath}/assets/indexes/${targetVersion}.json`, {encoding: "utf-8"})).objects;
        const langArray: {[key: string]: string} = {};
        for(const filePath in indexData) {
            if(/^minecraft\/lang\/.+\.json$/.test(filePath)) langArray[(filePath.match(/^minecraft\/lang\/(.+)\.json$/) as RegExpMatchArray)[1]] = indexData[filePath].hash;
        }
        print("Choose the language you want to generate data in below list.");
        hint("If you want to generate \"en_us\" (default locale), please press enter key without entering anything.");
        print(`[${Object.keys(langArray).join(", ")}]`);
        let targetLang: string;
        for(let i = 0; true; i++) {
            if(i == 0 && typeof lang == "string") targetLang = lang;
            else targetLang = await input();
            if(targetLang.length == 0) break;
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
        process.exit(1);
    }
    if(targetLangHash.length == 0) {
        //デフォルトロケール（en_us）での生成
        generateLocaleData("./en_us.json", "en_us");
        print("Generating completed!");
    }
}

main(process.argv[2], process.argv[3], process.argv[4]);