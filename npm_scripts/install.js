/**
 * npm postinstall時に実行される関数
 */
function main() {
    if(process.cwd() != process.env.INIT_CWD) {
        try {
            require("fs").cpSync("./locales", `${process.env.INIT_CWD}/locales`, {recursive: true});
        }
        catch(error) {
            if(error.code == "ENOENT") {
                //ソースが存在しない
                throw new Error("Cannot find locale files!");
            }
            else if(error.code == "EPERM") {
                //ディレクトリの読み取り権限ない
                throw new Error("Cannot read or copy locale files!");
            }
            else {
                //その他エラー
                throw new Error(`An error occurred while copying locale data!\n${error.stack}`);
            }
        }    
    }
}

main();