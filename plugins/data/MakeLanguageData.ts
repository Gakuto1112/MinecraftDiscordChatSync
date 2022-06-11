import {ReadStream} from "fs";

const fs = require("fs")
const colors: {[key: string]: string} = {black:"\u001b[30m", red: "\u001b[31m", green: "\u001b[32m", yellow: "\u001b[33m", blue: "\u001b[34m", magenta: "\u001b[35m", cyan: "\u001b[36m", white: "\u001b[37m", reset: "\u001b[0m"}; //標準出力に色を付ける制御文字

//言語データ格納変数
const globalAdvancementsName: {[key: string]: string} = {};
const globalEntityName: {[key: string]: string} = {};
const globalDeathName: {[key: string]: string} = {};
const localAdvancementsName: {[key: string]: string} = {};
const localAdvancementsDescription: {[key: string]: string} = {};
const localEntityName: {[key: string]: string} = {};
const localDeathName: {[key: string]: string} = {};

console.info("言語データ作成ツール");

//グローバル値の読み取り
let globalLanguageData: ReadStream;
let localLanguageData: ReadStream;
globalLanguageData = fs.createReadStream("en_us.json", "utf-8");
globalLanguageData.on("data", (chunk: string) => {
	chunk.split("\n").forEach((line: string) => {
		const lineSplit: string[] = line.split(":");
		const dataKey: string = lineSplit[0].slice(3, -1);
		let dataValue: string = "";
		if(typeof(lineSplit[1]) == "string") dataValue = lineSplit[1].slice(2, -2);
		if(dataKey.startsWith("advancements") && dataKey.endsWith("title") && !dataKey.includes("toast") && !dataKey.includes("root") && dataKey != "advancements.empty" && dataKey != "advancements.sad_label") globalAdvancementsName[dataKey.slice(0, -6)] = dataValue;
		else if(dataKey.startsWith("entity") && !dataKey.includes("predefined") && dataKey != "entity.notFound") globalEntityName[dataKey] = dataValue;
		else if(dataKey.startsWith("death") && !dataKey.startsWith("deathScreen")) globalDeathName[dataKey] = dataValue.replace("%1$s", "{victim}").replace("%2$s", "{killer}").replace("%3$s", "{weapon}");
	});
});
globalLanguageData.on("error", (error: any) => {
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

//ローカル値の読み取り
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
	localLanguageData.on("data", (chunk: string) => {
		chunk.split("\n").forEach((line: string) => {
			const lineSplit: string[] = line.split(":");
			const dataKey: string = lineSplit[0].slice(5, -1);
			let dataValue: string = "";
			if(typeof(lineSplit[1]) == "string") dataValue = lineSplit[1].slice(2, -2);
			if(dataKey.startsWith("advancements") && !dataKey.includes("toast") && !dataKey.includes("root") && dataKey != "advancements.empty" && dataKey != "advancements.sad_label") {
				if(dataKey.endsWith("title")) localAdvancementsName[dataKey.slice(0, -6)] = dataValue;
				else if(dataKey.endsWith("description")) localAdvancementsDescription[dataKey.slice(0, -12)] = dataValue;
			}
			else if(dataKey.startsWith("entity") && !dataKey.includes("predefined") && dataKey != "entity.notFound") localEntityName[dataKey] = dataValue;
			else if(dataKey.startsWith("death") && !dataKey.startsWith("deathScreen")) localDeathName[dataKey] = dataValue.replace("%1$s", "{victim}").replace("%2$s", "{killer}").replace("%3$s", "{weapon}");
		});
	});
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