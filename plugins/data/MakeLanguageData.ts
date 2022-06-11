import {ReadStream} from "fs";

const fs = require("fs")
const colors: { [key: string]: string } = { black:"\u001b[30m", red: "\u001b[31m", green: "\u001b[32m", yellow: "\u001b[33m", blue: "\u001b[34m", magenta: "\u001b[35m", cyan: "\u001b[36m", white: "\u001b[37m", reset: "\u001b[0m" }; //標準出力に色を付ける制御文字

console.info("言語データ作成ツール");

//ファイルの存在確認
let englishLanguageData: ReadStream;
let localLanguageData: ReadStream;
englishLanguageData = fs.createReadStream("en_us.json", "utf-8");
englishLanguageData.on("error", (error: any) => {
	switch(error.errno) {
		case -4058:
			console.error(colors.red + "en_us.jsonが見つかりません。" + colors.reset);
			break;
		case -4048:
			console.error(colors.red + "en_us.jsonの読み取り権限がありません。" + colors.reset);
			break;
		default:
			console.error(colors.red + "en_us.jsonの読み取り中にエラーが発生しました。" + colors.reset + "\n" + error.message);
			break;
	}
	process.exit(1);
});
fs.readdir("./", (error: any, files: string[]) => {
	const localLanguageDataNameCandidate: string[] = files.filter((fileName: string) => {
		return /[a-z]{2}_[a-z]{2}\.json/.test(fileName) && fileName != "en_us.json";
	});
	switch(localLanguageDataNameCandidate.length) {
		case 0:
			console.error(colors.red + "ローカル言語データの候補が見つかりません。" + colors.reset);
			process.exit(1);
			break;
		case 1:
			break;
		default:
			console.error(colors.red + "ローカル言語データの候補が複数見つかりました。" + colors.reset + "ローカル言語データは1つにして下さい。なお、en_us.jsonはローカル言語データに含まれません。");
			process.exit(1);
			break;
	}
	localLanguageData = fs.createReadStream(localLanguageDataNameCandidate[0], "utf-8");
	localLanguageData.on("error", (error: any) => {
		switch(error.errno) {
			case -4058:
				console.error(colors.red + localLanguageDataNameCandidate[0] + "が見つかりません。" + colors.reset);
				break;
			case -4048:
				console.error(colors.red + localLanguageDataNameCandidate[0] + "の読み取り権限がありません。" + colors.reset);
				break;
			default:
				console.error(colors.red + localLanguageDataNameCandidate[0] + "の読み取り中にエラーが発生しました。" + colors.reset + "\n" + error.message);
				break;
		}
		process.exit(1);
	});
});