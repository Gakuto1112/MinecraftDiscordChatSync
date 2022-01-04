import { Message, MessageAttachment, NewsChannel, TextChannel } from "discord.js";
import { minecraftVersions, settings, sendRconCommand } from "../MinecraftDiscordChatSync";
import { PluginBase } from "./PluginBase";

export class Plugin extends PluginBase {

	public onDiscordMessage(message: Message): void {
		let hoverContentName: string;
		if(minecraftVersions.indexOf(settings.minecraftVersion) >= 14) hoverContentName = "contents";
		else hoverContentName = "value";
		let channelName: string;
		if(message.channel instanceof TextChannel || message.channel instanceof NewsChannel) channelName = message.channel.name;
		else return
		if(message.content != "") {
			let userColor: string;
			if(settings.discordMessageDisplay.displayRoleColor == "true" && minecraftVersions.indexOf(settings.minecraftVersion) >= 14) {
				if(message.member!.displayHexColor == "#000000") userColor = "white";
				else userColor = message.member!.displayHexColor;
			}
			else userColor = "yellow";
			//パース処理
			let messageContentTemp: string = message.content;
			if(messageContentTemp.startsWith("> ")) messageContentTemp = messageContentTemp.slice(2);
			const textParseObject: { [key: string]: any }[] = [{ text: messageContentTemp }];
			for(let i: number = 0; i < textParseObject.length; i++) {
				const tokenChunkArray: (RegExpMatchArray | null)[] = [textParseObject[i]["text"].match(/\*\*(.+?)\*\*/s), textParseObject[i]["text"].match(/\*(.+?)\*/s), textParseObject[i]["text"].match(/~~(.+?)~~/s), textParseObject[i]["text"].match(/`(.+?)`/s), textParseObject[i]["text"].match(/\|\|(.+?)\|\|/s), textParseObject[i]["text"].match(/https?:\/\/[\w\-./?%&=~]{2,}/)];
				const tokenIndexArray: number[] = [];
				tokenChunkArray.forEach((tokenChunk: RegExpMatchArray | null, j: number) => {
					if(tokenChunk != null && tokenChunk!.index != undefined) {
						tokenIndexArray.push(tokenChunk.index);
					}
					else tokenIndexArray.push(messageContentTemp.length);
				});
				let minIndex: number = tokenIndexArray[0];
				tokenIndexArray.forEach((tokenIndex: number, j: number) => {
					if(j >= 1 && tokenIndex < minIndex) minIndex = tokenIndex;
				});
				if(minIndex < messageContentTemp.length) {
					const targetIndex: number = tokenIndexArray.indexOf(minIndex);
					if(tokenIndexArray[targetIndex] != null) {
						let chunkEndOffset: number = 0;
						if(targetIndex <= 4) {
							let token: string = "";
							switch(targetIndex) {
								case 0:
								case 1:
									token = "*";
									break;
								case 2:
									token = "~";
									break;
								case 3:
									token = "`";
									break;
								case 4:
									token = "|";
									break;
							}
							while(textParseObject[i]["text"][minIndex + tokenChunkArray[targetIndex]![0].length + chunkEndOffset] == token) {
								chunkEndOffset++;
								console.log(chunkEndOffset);
							}
						}
						textParseObject.splice(i + 1, 0, Object.assign({ }, textParseObject[i]), Object.assign({ }, textParseObject[i]));
						textParseObject[i]["text"] = textParseObject[i]["text"].slice(0, minIndex);
						textParseObject[i + 1]["text"] = textParseObject[i + 1]["text"].slice(minIndex, minIndex + tokenChunkArray[targetIndex]![0].length + chunkEndOffset);
						textParseObject[i + 2]["text"] = textParseObject[i + 2]["text"].slice(minIndex + tokenChunkArray[targetIndex]![0].length + chunkEndOffset);
						switch(tokenIndexArray.indexOf(minIndex)) {
							case 0:
								textParseObject[i + 1]["text"] = textParseObject[i + 1]["text"].slice(2, -2);
								textParseObject[i + 1]["bold"] = "true";
								break;
							case 1:
								textParseObject[i + 1]["text"] = textParseObject[i + 1]["text"].slice(1, -1);
								textParseObject[i + 1]["italic"] = "true";
								break;
							case 2:
								textParseObject[i + 1]["text"] = textParseObject[i + 1]["text"].slice(2, -2);
								textParseObject[i + 1]["strike"] = "true";
								break;
							case 3:
								textParseObject[i + 1]["text"] = textParseObject[i + 1]["text"].slice(1, -1);
								break;
							case 4:
								textParseObject[i + 1]["text"] = textParseObject[i + 1]["text"].slice(2, -2);
								textParseObject[i + 1]["obfuscated"] = "true";
								textParseObject[i + 1]["hoverEvent"] = { action: "show_text", [hoverContentName]: textParseObject[i + 1]["text"] };
								break;
							case 5:
								textParseObject[i + 1]["color"] = "blue";
								textParseObject[i + 1]["underlined"] = "true";
								textParseObject[i + 1]["hoverEvent"] = { action: "show_text", [hoverContentName]: "クリックして開く" };
								textParseObject[i + 1]["clickEvent"] = { action: "open_url", "value": textParseObject[i + 1]["text"] };
								i++;
								break
						}
					}
				}
			}
			//改行文字ごとに区切る
			const messageArray: { [key: string]: any }[][] = [textParseObject];
			let newLineFlag: boolean = false;
			do {
				newLineFlag = false;
				const lastMessageArrayElement = JSON.parse(JSON.stringify(messageArray[messageArray.length - 1]));
				for(let i: number = 0; i < lastMessageArrayElement.length; i++) {
					if(/\r\n|\n|\r/.test(lastMessageArrayElement[i]["text"])) {
						newLineFlag = true;
						messageArray.push(JSON.parse(JSON.stringify(lastMessageArrayElement)));
						messageArray[messageArray.length - 2][i]["text"] = messageArray[messageArray.length - 2][i]["text"].split(/\r\n|\n|\r/)[0];
						messageArray[messageArray.length - 2] = messageArray[messageArray.length - 2].splice(0, i + 1);
						messageArray[messageArray.length - 1][i]["text"] = messageArray[messageArray.length - 1][i]["text"].split(/\r\n|\n|\r/).splice(1).join("\n");
						messageArray[messageArray.length - 1] = messageArray[messageArray.length - 1].splice(i, messageArray.length);
						break;
					}
				}
			}
			while (newLineFlag);
			messageArray.forEach((messageLine: { [key: string]: any }[], i: number) => {
				const tellrawObject: (string | { [key: string]: any })[] = ["", { text: "<" }];
				if(settings.discordMessageDisplay.showChannelName == "true") {
					tellrawObject.push({ text: message.member!.displayName, color: userColor, hoverEvent: { action: "show_text", [hoverContentName]: message.author.tag } }, { text: "@", hoverEvent: { action: "show_text", [hoverContentName]: message.author.tag } }, { text: channelName, color: "aqua", hoverEvent: { action: "show_text", [hoverContentName]: message.author.tag } }, { text: "> " });
					if(messageArray.length >= 2) tellrawObject.splice(5, 0, { text: "#" + (i + 1), color: "gold", hoverEvent: { action: "show_text", [hoverContentName]: message.author.tag } });
				}
				else {
					tellrawObject.push({ text: "<" }, { text: message.member!.displayName, color: userColor, hoverEvent: { action: "show_text", [hoverContentName]: message.author.tag + " @" + channelName } }, { text: "> " });
					if(messageArray.length >= 2) tellrawObject.splice(3, 0, { text: "#" + (i + 1), color: "gold", hoverEvent: { action: "show_text", [hoverContentName]: message.author.tag } });
				}
				messageLine.forEach((messageChunk: { [key: string]: any }) => tellrawObject.push(messageChunk));
				tellrawObject.push("");
				sendRconCommand("tellraw @a " + JSON.stringify(tellrawObject));
			});
		}
		//添付ファイル表示
		if(settings.discordMessageDisplay.showAttachments == "true") message.attachments.forEach((attachment: MessageAttachment) => sendRconCommand("tellraw @a " + JSON.stringify(["", { text: message.member!.displayName, color: "gray", hoverEvent: { action: "show_text", [hoverContentName]: message.author.tag + " @" + channelName } }, { text: "のメッセージには", color: "gray" }, { text: "[" + attachment.name + "]", color: "gray", hoverEvent: { action: "show_text", [hoverContentName]: "クリックして開く" }, clickEvent: { action: "open_url", value: attachment.url } }, { text: "が添付されています", color: "gray" }, ""])));
	}
}