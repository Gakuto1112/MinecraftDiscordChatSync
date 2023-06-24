import { DiscordAttachment, DiscordChannel, DiscordGuild, DiscordRole, DiscordUser, PluginBase, VerificationResult } from "../PluginBase";

/**
 * トークンの種類
 */
type TokenType = "root" | "text" | "bold" | "italic" | "underline" | "strike" | "spoiler" | "code_inline" | "code_block" | "quote" | "headline" | "link" | "mention_general" | "mention_user" | "mention_role" | "mention_channel";
/**
 * クリックイベントのアクションの種類
 */
type clickEventActionType = "open_url" | "open_file" | "run_command" | "suggest_command" | "change_page" | "copy_to_clipboard" | "show";
/**
 * ホバーイベントのアクションの種類
 */
type hoverEventActionType = "show_text" | "show_item" | "show_entity";
/**
 * 構文木のトークン
 */
type Token = {
    /** 候補ID。-1は確定トークン。0以上のIDは候補トークン。このトークンが有効化されれば文字装飾として処理、そうでなければただのテキストとして処理。 */
    candidateId: number,
    /** トークンの種類 */
    type: TokenType,
    /** トークンのシンボル。囲みトークン片方だけの場合のみ使用。 */
    symbol?: TokenSymbol,
    /** トークンの中身のテキスト。"text"トークン以外はundefined */
    text?: string,
    /** 子トークンの配列。子トークンを持たないトークンの場合はundefined。 */
    children?: Token[]
};
/**
 * waitingForEndTokenでの複数の囲みトークンがあるトークンの情報
 */
type CandidateToken = {
    /** 待機中の候補ID */
    id: number,
    /** シンボルでの判別が必要な場合に使用する。 */
    symbol?: string
};
/**
 * トークンのシンボル情報。シンボルの復元に使用する。
 */
type TokenSymbol = {
    /** トークンのシンボル */
    symbol: string,
    /** トークンの前にシンボルがあるならtrue。 */
    startToken?: boolean,
    /** トークンの後にシンボルがあるならtrue。 */
    endToken?: boolean
};
/**
 * トークンの正規表現の情報
 */
type TokenRegExp = {
    /** トークンにマッチするための正規表現 */
    regExp: RegExp,
    /** トークンの種類 */
    tokenType: TokenType,
    /** トークンのシンボル（シンボルで判別が必要なトークンのみ付与） */
    tokenSymbol: TokenSymbol,
    /** 囲みトークン片方だけの正規表現かどうか */
    halfBlock?: boolean
};
/**
 * 正規表現にマッチしたトークンの情報
 */
type TokenMatchData = {
    /** マッチオブジェクト */
    matchData: RegExpMatchArray,
    /** マッチしたトークン正規表現情報 */
    tokenRegExp: TokenRegExp
};
/**
 * tellrawコマンドの要素
 */
type TellrawElement = {
    /** テキスト */
    text: string,
    /** テキストに適用する文字装飾 */
    decorations: {[key: string]: boolean}
};
/**
 * マインクラフトのjsonフォーマット。必要なもののみ定義されている。
 */
type MinecraftJsonFormat = {
    /** 表示されるテキスト */
    text: string,
    /** テキストの文字色。マインクラフトの色名かカラーコードで指定する。レガシーフォーマットではカラーコード指定は利用出来ない。 */
    color?: string,
    /** テキストを太字にするかどうか */
    bold?: boolean,
    /** テキストをイタリック体にするかどうか */
    italic?: boolean,
    /** テキストに下線を引くかどうか */
    underlined?: boolean,
    /** テキストに打ち消し線を引くかどうか */
    strikethrough?: boolean,
    /** テキストを難読化するかどうか */
    obfuscated?: boolean,
    /** クリックイベント（テキストをクリックした時に発火するイベント） */
    clickEvent?: {
        /** アクション */
        action: clickEventActionType,
        /** アクションの引数 */
        value: string,
    },
    /** ホバーイベント（テキストにカーソルを当てた時に発火するイベント） */
    hoverEvent?: {
        /** アクション */
        action: hoverEventActionType,
        /** アクションの引数 */
        contents?: string,
        /** アクションの引数（レガシーフォーマットを使用する場合はこちらを使用する。） */
        value?: string
    }
}

export class DiscordMessage extends PluginBase {
    constructor() {
        super();
        this.registerConfig("plugins.discord_message.use_legacy_format", false, (value: any): VerificationResult => {
            return {
                isValid: typeof value == "boolean",
                message: `The provided config value type "${typeof value}" does not match valid type "boolean".`
            }
        });
    }

    public async onDiscordMessage(guild: DiscordGuild, channel: DiscordChannel, sender: DiscordUser, content: string, attachments: DiscordAttachment[]): Promise<void> {
        if(this.rcon.isConnected() && !sender.isBot) {
            const legacyFormat: boolean = this.getConfig("plugins.discord_message.use_legacy_format"); //レガシーフォーマットを使用するかどうか
            if(content.length > 0) {
                const ast: Token[] = [];
                //終了トークン待ちの囲みトークン。-1は終了待ちではない。それ以外は該当のIDでの終了トークン待ち。
                const waitingForEndToken: {[key: string]: CandidateToken} = {
                    bold: {
                        id: -1
                    },
                    italic: {
                        id: -1
                    },
                    underline: {
                        id: -1
                    },
                    strike: {
                        id: -1
                    },
                    spoiler: {
                        id: -1
                    },
                    code_inline: {
                        id: -1
                    },
                    code_block: {
                        id: -1
                    }
                }
                const candidateEnabled: number[] = []; //有効になった候補IDの配列
                let nextId: number = 0; //次に割り振るID
                content.split("\n").forEach((line: string, index: number) => {
                    const candidateStartIds: number[] = []; //この行で始まった候補IDの配列
                    ast.push({
                        candidateId: -1,
                        type: "root",
                        children: []
                    });
                    //トークン探索用正規表現の準備
                    let tokenRegexArray: TokenRegExp[] = [];
                    let halfBlockRegexArray: TokenRegExp[] = []; //囲みトークン片方だけの正規表現配列
                    tokenRegexArray = tokenRegexArray.concat([
                        {
                            regExp: /^[^\S]*> +(.+)$/,
                            tokenType: "quote",
                            tokenSymbol: {
                                symbol: "> ",
                                startToken: true
                            }
                        },
                        {
                            regExp: /^[^\S]*#{1,3} +(.+)$/,
                            tokenType: "headline",
                            tokenSymbol: {
                                symbol: "# ",
                                startToken: true
                            }
                        },
                        {
                            regExp: /http(s?:\/\/\S{2,})/,
                            tokenType: "link",
                            tokenSymbol: {
                                symbol: "http",
                                startToken: true
                            }
                        },
                        {
                            regExp: /@(here|everyone)/,
                            tokenType: "mention_general",
                            tokenSymbol: {
                                symbol: "@",
                                startToken: true
                            }
                        },
                        {
                            regExp: /<@(\d+)>/,
                            tokenType: "mention_user",
                            tokenSymbol: {
                                symbol: "<@",
                                startToken: true
                            }
                        },
                        {
                            regExp: /<@&(\d+)>/,
                            tokenType: "mention_role",
                            tokenSymbol: {
                                symbol: "<@&",
                                startToken: true
                            }
                        },
                        {
                            regExp: /<#(\d+)>/,
                            tokenType: "mention_channel",
                            tokenSymbol: {
                                symbol: "<#",
                                startToken: true
                            }
                        }
                    ]);
                    if(waitingForEndToken.code_block.id == -1) {
                        tokenRegexArray = tokenRegexArray.concat([
                            {
                                regExp: /(?<!\\)`{3}(.*?[^\\])`{3}/,
                                tokenType: "code_block",
                                tokenSymbol: {
                                    symbol: "```",
                                    startToken: true,
                                    endToken: true
                                }
                            },
                            {
                                regExp: /(?<!\\)`{3}(.*?)$/,
                                tokenType: "code_block",
                                tokenSymbol: {
                                    symbol: "```",
                                    startToken: true
                                },
                                halfBlock: true
                            }
                        ]);
                    }
                    else tokenRegexArray.push({
                        regExp: /^(.*?)(?<!\\)`{3}/,
                        tokenType: "code_block",
                        tokenSymbol: {
                            symbol: "```",
                            endToken: true
                        },
                        halfBlock: true
                    });
                    if(waitingForEndToken.bold.id == -1) {
                        tokenRegexArray.push({
                            regExp: /(?<!\\)\*{2}(.*?[^\\])\*{2}/,
                            tokenType: "bold",
                            tokenSymbol: {
                                symbol: "**",
                                startToken: true,
                                endToken: true
                            }
                        });
                        halfBlockRegexArray.push({
                            regExp: /(?<!\\)\*{2}(.*?)$/,
                            tokenType: "bold",
                            tokenSymbol: {
                                symbol: "**",
                                startToken: true
                            },
                            halfBlock: true
                        });
                    }
                    else halfBlockRegexArray.push({
                        regExp: /^(.*?)(?<!\\)\*{2}/,
                        tokenType: "bold",
                        tokenSymbol: {
                            symbol: "**",
                            endToken: true
                        },
                        halfBlock: true
                    });
                    if(waitingForEndToken.underline.id == -1) {
                        tokenRegexArray.push({
                            regExp: /(?<!\\)_{2}(.*?[^\\])_{2}/,
                            tokenType: "underline",
                            tokenSymbol: {
                                symbol: "__",
                                startToken: true,
                                endToken: true
                            }
                        });
                        halfBlockRegexArray.push({
                            regExp: /(?<!\\)_{2}(.*?)$/,
                            tokenType: "underline",
                            tokenSymbol: {
                                symbol: "__",
                                startToken: true
                            },
                            halfBlock: true
                        });
                    }
                    else halfBlockRegexArray.push({
                        regExp: /^(.*?)(?<!\\)_{2}/,
                        tokenType: "underline",
                        tokenSymbol: {
                            symbol: "__",
                            endToken: true
                        },
                        halfBlock: true
                    });
                    if(waitingForEndToken.strike.id == -1) {
                        tokenRegexArray.push({
                            regExp: /(?<!\\)~{2}(.*?[^\\])~{2}/,
                            tokenType: "strike",
                            tokenSymbol: {
                                symbol: "~~",
                                startToken: true,
                                endToken: true
                            }
                        });
                        halfBlockRegexArray.push({
                            regExp: /(?<!\\)~{2}(.*?)$/,
                            tokenType: "strike",
                            tokenSymbol: {
                                symbol: "~~",
                                startToken: true
                            },
                            halfBlock: true
                        });
                    }
                    else halfBlockRegexArray.push({
                        regExp: /^(.*?)(?<!\\)~{2}/,
                        tokenType: "strike",
                        tokenSymbol: {
                            symbol: "~~",
                            endToken: true
                        },
                        halfBlock: true
                    });
                    if(waitingForEndToken.spoiler.id == -1) {
                        tokenRegexArray.push({
                            regExp: /(?<!\\)\|{2}(.*?[^\\])\|{2}/,
                            tokenType: "spoiler",
                            tokenSymbol: {
                                symbol: "||",
                                startToken: true,
                                endToken: true
                            }
                        });
                        halfBlockRegexArray.push({
                            regExp: /(?<!\\)\|{2}(.*?)$/,
                            tokenType: "spoiler",
                            tokenSymbol: {
                                symbol: "||",
                                startToken: true
                            },
                            halfBlock: true
                        });
                    }
                    else halfBlockRegexArray.push({
                        regExp: /^(.*?)(?<!\\)\|{2}/,
                        tokenType: "spoiler",
                        tokenSymbol: {
                            symbol: "||",
                            endToken: true
                        },
                        halfBlock: true
                    });
                    if(waitingForEndToken.code_inline.id == -1) {
                        tokenRegexArray = tokenRegexArray.concat([
                            {
                                regExp: /(?<!\\)`{2}(.*?[^\\])`{2}/,
                                tokenType: "code_inline",
                                tokenSymbol: {
                                    symbol: "``",
                                    startToken: true,
                                    endToken: true
                                }
                            },
                            {
                                regExp: /(?<!\\)`(.*?[^\\])`/,
                                tokenType: "code_inline",
                                tokenSymbol: {
                                    symbol: "`",
                                    startToken: true,
                                    endToken: true
                                }
                            }
                        ]);
                        halfBlockRegexArray = halfBlockRegexArray.concat([
                            {
                                regExp: /(?<!\\)`{2}(.*?)$/,
                                tokenType: "code_inline",
                                tokenSymbol: {
                                    symbol: "``",
                                    startToken: true
                                },
                                halfBlock: true
                            },
                            {
                                regExp: /(?<!\\)`(.*?)$/,
                                tokenType: "code_inline",
                                tokenSymbol: {
                                    symbol: "`",
                                    startToken: true
                                },
                                halfBlock: true
                            },
                        ]);
                    }
                    else if(waitingForEndToken.code_inline.symbol == "``") halfBlockRegexArray.push({
                        regExp: /^(.*?)(?<!\\)`{2}/,
                        tokenType: "code_inline",
                        tokenSymbol: {
                            symbol: "``",
                            endToken: true
                        },
                        halfBlock: true
                    });
                    else halfBlockRegexArray.push({
                        regExp: /^(.*?)(?<!\\)`/,
                        tokenType: "code_inline",
                        tokenSymbol: {
                            symbol: "`",
                            endToken: true
                        },
                        halfBlock: true
                    });
                    if(waitingForEndToken.italic.id == -1) {
                        tokenRegexArray = tokenRegexArray.concat([
                            {
                                regExp: /(?<!\\)\*(.*?[^\\])\*/,
                                tokenType: "italic",
                                tokenSymbol: {
                                    symbol: "*",
                                    startToken: true,
                                    endToken: true
                                }
                            },
                            {
                                regExp: /(?<!\\)_(.*?[^\\])_/,
                                tokenType: "italic",
                                tokenSymbol: {
                                    symbol: "_",
                                    startToken: true,
                                    endToken: true
                                }
                            }
                        ]);
                        halfBlockRegexArray = halfBlockRegexArray.concat([
                            {
                                regExp: /(?<!\\)\*(.*?)$/,
                                tokenType: "italic",
                                tokenSymbol: {
                                    symbol: "*",
                                    startToken: true
                                },
                                halfBlock: true
                            },
                            {
                                regExp: /(?<!\\)_(.*?)$/,
                                tokenType: "italic",
                                tokenSymbol: {
                                    symbol: "_",
                                    startToken: true
                                },
                                halfBlock: true
                            }
                        ]);
                    }
                    else if(waitingForEndToken.italic.symbol == "*") halfBlockRegexArray.push({
                        regExp: /^(.*?)(?<!\\)\*/,
                        tokenType: "italic",
                        tokenSymbol: {
                            symbol: "*",
                            endToken: true
                        },
                        halfBlock: true
                    });
                    else halfBlockRegexArray.push({
                        regExp: /^(.*?)(?<!\\)_/,
                        tokenType: "italic",
                        tokenSymbol: {
                            symbol: "_",
                            endToken: true
                        },
                        halfBlock: true
                    });
                    if(waitingForEndToken.code_inline.id == -1) {
                        tokenRegexArray.push({
                            regExp: /(?<!\\)`(.*?[^\\])`/,
                            tokenType: "code_inline",
                            tokenSymbol: {
                                symbol: "`",
                                startToken: true,
                                endToken: true
                            }
                        });
                        halfBlockRegexArray.push({
                            regExp: /(?<!\\)`(.*?)$/,
                            tokenType: "code_inline",
                            tokenSymbol: {
                                symbol: "`",
                                startToken: true
                            },
                            halfBlock: true
                        });
                    }
                    tokenRegexArray = tokenRegexArray.concat(halfBlockRegexArray);

                    /**
                     * トークン化する。
                     * @param discordMessage トークン化するDiscordのメッセージ
                     * @param parentToken 親トークン。トークン化したトークンはこの親トークンの子になる。
                     * @param matchLineHeadToken 行頭のトークンを発見するかどうか
                     */
                    function tokenize(discordMessage: string, parentToken: Token, matchLineHeadToken: boolean): void {
                        //トークンの探索
                        let remainLine: string = discordMessage; //未処理の文字列
                        let lineHeadTokenEnabled: boolean = matchLineHeadToken; //行頭トークンを有効にするかどうか
                        while(remainLine.length > 0) {
                            let earliestToken: TokenMatchData|undefined = undefined; //入力された文字列内で最も左に位置するトークン
                            for(const tokenRegexData of tokenRegexArray) {
                                const matchData = remainLine.match(tokenRegexData.regExp);
                                if(matchData && (earliestToken == undefined || (matchData.index as number) < ((earliestToken as TokenMatchData).matchData.index as number)) && ((tokenRegexData.tokenType != "quote" && tokenRegexData.tokenType != "headline") || lineHeadTokenEnabled)) {
                                    earliestToken = {
                                        matchData: matchData,
                                        tokenRegExp: tokenRegexData
                                    };
                                    if(earliestToken.matchData.index == 0) break;
                                }
                            }
                            //見つけたトークンの処理
                            if(earliestToken) {
                                if((earliestToken.matchData.index as number) > 0) {
                                    (parentToken.children as Token[]).push({
                                        candidateId: -1,
                                        type: "text",
                                        text: remainLine.substring(0, earliestToken.matchData.index)
                                    });
                                    remainLine = remainLine.substring(earliestToken.matchData.index as number, remainLine.length);
                                    lineHeadTokenEnabled = false;
                                }
                                if(earliestToken.tokenRegExp.halfBlock) {
                                    if(waitingForEndToken[earliestToken.tokenRegExp.tokenType].id == -1) {
                                        waitingForEndToken[earliestToken.tokenRegExp.tokenType].id = nextId;
                                        candidateStartIds.push(nextId++);
                                    }
                                    else {
                                        candidateEnabled.push(waitingForEndToken[earliestToken.tokenRegExp.tokenType].id);
                                        waitingForEndToken[earliestToken.tokenRegExp.tokenType].id = -1
                                    }
                                }
                                const token: Token = {
                                    candidateId: typeof waitingForEndToken[earliestToken.tokenRegExp.tokenType] == "object" ? waitingForEndToken[earliestToken.tokenRegExp.tokenType].id : -1,
                                    type: earliestToken.tokenRegExp.tokenType,
                                    symbol: earliestToken.tokenRegExp.tokenSymbol,
                                    children: []
                                };
                                (parentToken.children as Token[]).push(token);
                                lineHeadTokenEnabled = lineHeadTokenEnabled && (token.type == "quote" || token.type == "headline");
                                tokenize(earliestToken.matchData[1], token, lineHeadTokenEnabled);
                                remainLine = remainLine.replace(earliestToken.matchData[0], "");
                            }
                            //トークンが見つからなかった場合、残りを"text"トークンとして処理
                            else {
                                (parentToken.children as Token[]).push({
                                    candidateId: -1,
                                    type: "text",
                                    text: remainLine
                                });
                                remainLine = "";
                            }
                        }
                    }
                    tokenize(line, ast[index], true);
                    //全体を候補トークンで囲む処理
                    for(const tokenType in waitingForEndToken) {
                        if(waitingForEndToken[tokenType].id > -1 && !candidateStartIds.includes(waitingForEndToken[tokenType].id)) {
                            const token: Token = {
                                candidateId: waitingForEndToken[tokenType].id,
                                type: tokenType as TokenType,
                                symbol: {
                                    symbol: waitingForEndToken[tokenType].symbol as string,
                                },
                                children: (ast[index].children as Token[]).concat()
                            }
                            ast[index].children = [token];
                        }
                    }
                });
                /**
                 * 抽象構文木（AST）を配列に変換する。
                 * @param token 配列に変換するASTの根
                 * @param asTextToken トークンシンボルを復元してただのテキストシンボルとして処理するかどうか
                 */
                function astToArray(token: Token, asTextToken?: boolean): TellrawElement[] {
                    if(token.children) {
                        let result: TellrawElement[] = [];
                        token.children.forEach((child: Token) => {
                            const outputAsText: boolean = asTextToken || (child.candidateId > -1 && !candidateEnabled.includes(child.candidateId)) || token.type == "code_inline" || token.type == "code_block" || child.type == "link";
                            const childArray: TellrawElement[] = astToArray(child, outputAsText);
                            if(outputAsText && child.type != "text") {
                                let text: string = (child.symbol as TokenSymbol).startToken ? (child.symbol as TokenSymbol).symbol : "";
                                childArray.forEach((childElement: TellrawElement) => text += childElement.text);
                                if((child.symbol as TokenSymbol).endToken) text += (child.symbol as TokenSymbol).symbol;
                                if(text != (child.symbol as TokenSymbol).symbol) {
                                    const textElement: TellrawElement = {
                                        text: text,
                                        decorations: {}
                                    }
                                    if(token.type != "root") textElement.decorations[token.type] = true;
                                    if(child.type == "code_inline" || child.type == "code_block" || child.type == "link") textElement.decorations[child.type] = true;
                                    if(result.length > 0 && JSON.stringify(textElement.decorations) == JSON.stringify(result[result.length - 1].decorations)) result[result.length - 1].text += textElement.text;
                                    else result.push(textElement);
                                }
                            }
                            else {
                                if(token.type != "root") childArray.forEach((childElement: TellrawElement) => childElement.decorations[token.type] = true);
                                result = result.concat(childArray);
                            }
                        });
                        return result;
                    }
                    else{
                        return [{
                            text: token.text as string,
                            decorations: {}
                        }];
                    }
                }
                const messageHeader: (MinecraftJsonFormat|string)[] = [
                    "<",
                    {
                        text: sender.displayName,
                        color: legacyFormat ? "yellow" : (sender.color == "#000000" ? "white" : sender.color),
                        hoverEvent: {
                            action: "show_text",
                            contents: legacyFormat ? undefined : channel.name,
                            value: legacyFormat ? channel.name : undefined
                        }
                    }
                ]; //tellrawメッセージのヘッダー（Discord名、ユーザタグ、チャンネル名）
                let messageCount: number = 1; //メッセージの送信階数（1から始まるので注意！！）
                for(const root of ast) {
                    //ASTをtellraw用に分解する。
                    const messageElements: TellrawElement[] = astToArray(root);
                    //tellrawコマンドを組み立てる。
                    const tellrawData: (MinecraftJsonFormat|string)[] = messageHeader.concat();
                    if(ast.length > 1) {
                        tellrawData.push({
                            text: ` #${messageCount++}`,
                            color: "gold"
                        });
                    }
                    tellrawData.push("> ");
                    if(messageElements.find((element: TellrawElement) => element.decorations.quote)) {
                        tellrawData.push({
                            text: "||  ",
                            color: "gray"
                        });
                    }
                    for(const element of messageElements) {
                        const tellrawElement: MinecraftJsonFormat = {
                            text: element.text
                        };
                        tellrawElement.bold = element.decorations.headline || element.decorations.bold;
                        tellrawElement.italic = element.decorations.italic;
                        tellrawElement.underlined = element.decorations.underline;
                        tellrawElement.strikethrough = element.decorations.strike;
                        if(element.decorations.quote) tellrawElement.color = "gray";
                        if(element.decorations.spoiler) {
                            tellrawElement.obfuscated = true;
                            tellrawElement.hoverEvent = {
                                action: "show_text",
                                contents: legacyFormat ? undefined : element.text,
                                value: legacyFormat ? element.text : undefined
                            };
                        }
                        if(element.decorations.link) {
                            tellrawElement.color = "blue";
                            tellrawElement.underlined = true;
                            tellrawElement.clickEvent = {
                                action: "open_url",
                                value: element.text
                            };
                            const linkOpenMessage: string = this.getLocale("tellraw.hover.open_url");
                            tellrawElement.hoverEvent = {
                                action: "show_text",
                                contents: legacyFormat ? undefined : linkOpenMessage,
                                value: legacyFormat ? linkOpenMessage : undefined
                            }
                        }
                        if(element.decorations.mention_general) {
                            tellrawElement.text = `@${tellrawElement.text}`;
                            tellrawElement.color = "aqua";
                        }
                        if(element.decorations.mention_user) {
                            tellrawElement.text = `@${this.discord.getMember(guild.id, tellrawElement.text).displayName}`;
                            tellrawElement.color = "aqua";
                        }
                        if(element.decorations.mention_role) {
                            const role: DiscordRole = this.discord.getRole(guild.id, tellrawElement.text);
                            tellrawElement.text = `@${role.name}`;
                            tellrawElement.color = legacyFormat || role.color == "#000000" ? "aqua" : role.color;
                        }
                        if(element.decorations.mention_channel) {
                            const channel: DiscordChannel = this.discord.getChannel(guild.id, tellrawElement.text)
                            tellrawElement.text = `#${channel.name}`;
                            tellrawElement.color = "aqua";
                            tellrawElement.clickEvent = {
                                action: "open_url",
                                value: `https://discord.com/channels/${guild.id}/${channel.id}`
                            };
                            const linkOpenMessage: string = this.getLocale("tellraw.hover.open_channel", `#${channel.name}`);
                            tellrawElement.hoverEvent = {
                                action: "show_text",
                                contents: legacyFormat ? undefined : linkOpenMessage,
                                value: legacyFormat ? linkOpenMessage : undefined
                            }
                        }
                        tellrawData.push(tellrawElement);
                    }
                    await this.rcon.sendCommand(`tellraw @a ${JSON.stringify(tellrawData)}`);
                }
            }
            if(attachments.length > 0) {
                const linkOpenMessage: string = this.getLocale("tellraw.hover.open_url");
                const tellrawData: (MinecraftJsonFormat|string)[] = [
                    {
                        text: this.getLocale("tellraw.text.attachments_before", sender.displayName),
                        color: "gray"
                    }
                ];
                attachments.forEach((attachment: DiscordAttachment, index: number) => {
                    tellrawData.push({
                        text: `[${attachment.name}]`,
                        color: "gray",
                        clickEvent: {
                            action: "open_url",
                            value: attachment.url
                        },
                        hoverEvent: {
                            action: "show_text",
                            contents: legacyFormat ? undefined : linkOpenMessage,
                            value: legacyFormat ? linkOpenMessage : undefined
                        }
                    });
                    if(index < attachments.length -1) tellrawData.push(", ");
                });
                tellrawData.push({
                    text: this.getLocale("tellraw.text.attachments_after"),
                    color: "gray"
                });
                await this.rcon.sendCommand(`tellraw @a ${JSON.stringify(tellrawData)}`);
            }
        }
    }
}