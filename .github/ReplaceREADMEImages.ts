import fs from "fs";
import readline from "readline";

async function main(): Promise<void> {
    return new Promise((resolve: (value: void) => void) => {
        const reader: readline.Interface = readline.createInterface({input: fs.createReadStream("./README.md")});
        const writer: fs.WriteStream = fs.createWriteStream("../README.md");
        let lineCount: number = 0;
        reader.addListener("line", (line: string) => {
            if(lineCount++ >= 2) {
                let replacedLine: string = line;
                line.match(/(?<=!\[.+\]\().+(?=\))/g)?.forEach((fileName: string) => replacedLine = replacedLine.replace(fileName, `https://raw.githubusercontent.com/Gakuto1112/MinecraftDiscordChatSync/main/.github/README_images/${fileName.substring(16, fileName.length)}`));
                writer.write(`${replacedLine}\n`);        
            }
        });
        reader.addListener("close", () => {
            resolve();
        });
    });
}

main();