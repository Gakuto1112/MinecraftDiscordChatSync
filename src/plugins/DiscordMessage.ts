import { DiscordAttachment, DiscordChannel, DiscordGuild, DiscordUser, PluginBase, VerificationResult } from "../PluginBase";

/**
 * トークンの種類
 */
type TokenType = "root" | "text" | "bold" | "italic" | "underline" | "strike" | "spoiler" | "code_inline" | "code_block" | "quote" | "link";
/**
 * 構文木のトークン
 */
type Token = {
    /** 候補ID。-1は確定トークン。0以上のIDは候補トークン。このトークンが有効化されれば文字装飾として処理、そうでなければただのテキストとして処理。 */
    candidateId: number,
    /** トークンの種類 */
    type: TokenType,
    /** トークンのシンボル。囲みトークン片方だけの場合のみ使用。 */
    symbol?: string,
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
 * トークンの正規表現の情報
 */
type TokenRegExp = {
    /** トークンにマッチするための正規表現 */
    regExp: RegExp,
    /** トークンの種類 */
    tokenType: TokenType,
    /** トークンのシンボル（シンボルで判別が必要なトークンのみ付与） */
    tokenSymbol?: string,
    /** 囲みトークン片方だけの正規表現かどうか */
    halfBlock: boolean
}
/**
 * 正規表現にマッチしたトークンの情報
 */
type TokenMatchData = {
    /** マッチオブジェクト */
    matchData: RegExpMatchArray,
    /** マッチしたトークン正規表現情報 */
    tokenRegExp: TokenRegExp
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

    public onDiscordMessage(guild: DiscordGuild, channel: DiscordChannel, sender: DiscordUser, content: string, attachments: DiscordAttachment[]): void {
        if(!sender.isBot) {
            if(content != "") {
                const userColor: string = this.getConfig("plugins.discord_message.use_legacy_format") ? "yellow" : (sender.color == "#000000" ? "white" : sender.color);
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
                    let initialToken: Token = {
                        candidateId: -1,
                        type: "root",
                        children: []
                    };
                    ast.push(initialToken);
                    if(/^> +\S+$/.test(line)) {
                        initialToken = {
                            candidateId: -1,
                            type: "quote",
                            children: []
                        };
                        (ast[index].children as Token[]).push(initialToken);
                    }

                    /**
                     * トークン化する。
                     * @param discordMessage トークン化するDiscordのメッセージ
                     * @param parentToken 親トークン。トークン化したトークンはこの親トークンの子になる。
                     */
                    function tokenize(discordMessage: string, parentToken: Token): void {
                        //トークン探索用正規表現の準備
                        let tokenRegexArray: TokenRegExp[] = [];
                        let halfBlockRegexArray: TokenRegExp[] = []; //囲みトークン片方だけの正規表現配列
                        tokenRegexArray.push({
                            regExp: /http(s?:\/\/\S{2,})/,
                            tokenType: "link",
                            halfBlock: false
                        });
                        if(waitingForEndToken.code_block.id == -1) {
                            tokenRegexArray = tokenRegexArray.concat([
                                {
                                    regExp: /(?<!\\)`{3}(.*?[^\\])`{3}/,
                                    tokenType: "code_block",
                                    halfBlock: false
                                },
                                {
                                    regExp: /(?<!\\)`{3}(.*?)$/,
                                    tokenType: "code_block",
                                    halfBlock: true
                                }
                            ]);
                        }
                        else tokenRegexArray.push({
                            regExp: /^(.*?)(?<!\\)`{3}/,
                            tokenType: "code_block",
                            halfBlock: true
                        });
                        if(waitingForEndToken.bold.id == -1) {
                            tokenRegexArray.push({
                                regExp: /(?<!\\)\*{2}(.*?[^\\])\*{2}/,
                                tokenType: "bold",
                                halfBlock: false
                            });
                            halfBlockRegexArray.push({
                                regExp: /(?<!\\)\*{2}(.*?)$/,
                                tokenType: "bold",
                                halfBlock: true
                            });
                        }
                        else halfBlockRegexArray.push({
                            regExp: /^(.*?)(?<!\\)\*{2}/,
                            tokenType: "bold",
                            halfBlock: true
                        });
                        if(waitingForEndToken.underline.id == -1) {
                            tokenRegexArray.push({
                                regExp: /(?<!\\)_{2}(.*?[^\\])_{2}/,
                                tokenType: "underline",
                                halfBlock: false
                            });
                            halfBlockRegexArray.push({
                                regExp: /(?<!\\)_{2}(.*?)$/,
                                tokenType: "underline",
                                halfBlock: true
                            });
                        }
                        else halfBlockRegexArray.push({
                            regExp: /^(.*?)(?<!\\)_{2}/,
                            tokenType: "underline",
                            halfBlock: true
                        });
                        if(waitingForEndToken.strike.id == -1) {
                            tokenRegexArray.push({
                                regExp: /(?<!\\)~{2}(.*?[^\\])~{2}/,
                                tokenType: "strike",
                                halfBlock: false
                            });
                            halfBlockRegexArray.push({
                                regExp: /(?<!\\)~{2}(.*?)$/,
                                tokenType: "strike",
                                halfBlock: true
                            });
                        }
                        else halfBlockRegexArray.push({
                            regExp: /^(.*?)(?<!\\)~{2}/,
                            tokenType: "strike",
                            halfBlock: true
                        });
                        if(waitingForEndToken.spoiler.id == -1) {
                            tokenRegexArray.push({
                                regExp: /(?<!\\)\|{2}(.*?[^\\])\|{2}/,
                                tokenType: "spoiler",
                                halfBlock: false
                            });
                            halfBlockRegexArray.push({
                                regExp: /(?<!\\)\|{2}(.*?)$/,
                                tokenType: "spoiler",
                                halfBlock: true
                            });
                        }
                        else halfBlockRegexArray.push({
                            regExp: /^(.*?)(?<!\\)\|{2}/,
                            tokenType: "spoiler",
                            halfBlock: true
                        });
                        if(waitingForEndToken.code_inline.id == -1) {
                            tokenRegexArray = tokenRegexArray.concat([
                                {
                                    regExp: /(?<!\\)`{2}(.*?[^\\])`{2}/,
                                    tokenType: "code_inline",
                                    tokenSymbol: "``",
                                    halfBlock: false
                                },
                                {
                                    regExp: /(?<!\\)`(.*?[^\\])`/,
                                    tokenType: "code_inline",
                                    tokenSymbol: "`",
                                    halfBlock: false
                                }
                            ]);
                            halfBlockRegexArray = halfBlockRegexArray.concat([
                                {
                                    regExp: /(?<!\\)`{2}(.*?)$/,
                                    tokenType: "code_inline",
                                    tokenSymbol: "``",
                                    halfBlock: true
                                },
                                {
                                    regExp: /(?<!\\)`(.*?)$/,
                                    tokenType: "code_inline",
                                    tokenSymbol: "`",
                                    halfBlock: true
                                },
                            ]);
                        }
                        else if(waitingForEndToken.code_inline.symbol == "``") halfBlockRegexArray.push({
                            regExp: /^(.*?)(?<!\\)`{2}/,
                            tokenType: "code_inline",
                            tokenSymbol: "``",
                            halfBlock: true
                        });
                        else halfBlockRegexArray.push({
                            regExp: /^(.*?)(?<!\\)`/,
                            tokenType: "code_inline",
                            tokenSymbol: "`",
                            halfBlock: true
                        });
                        if(waitingForEndToken.italic.id == -1) {
                            tokenRegexArray = tokenRegexArray.concat([
                                {
                                    regExp: /(?<!\\)\*(.*?[^\\])\*/,
                                    tokenType: "italic",
                                    tokenSymbol: "*",
                                    halfBlock: false
                                },
                                {
                                    regExp: /(?<!\\)_(.*?[^\\])_/,
                                    tokenType: "italic",
                                    tokenSymbol: "_",
                                    halfBlock: false
                                }
                            ]);
                            halfBlockRegexArray = halfBlockRegexArray.concat([
                                {
                                    regExp: /(?<!\\)\*(.*?)$/,
                                    tokenType: "italic",
                                    tokenSymbol: "*",
                                    halfBlock: true
                                },
                                {
                                    regExp: /(?<!\\)_(.*?)$/,
                                    tokenType: "italic",
                                    tokenSymbol: "_",
                                    halfBlock: true
                                }
                            ]);
                        }
                        else if(waitingForEndToken.italic.symbol == "*") halfBlockRegexArray.push({
                            regExp: /^(.*?)(?<!\\)\*/,
                            tokenType: "italic",
                            tokenSymbol: "*",
                            halfBlock: true
                        });
                        else halfBlockRegexArray.push({
                            regExp: /^(.*?)(?<!\\)_/,
                            tokenType: "italic",
                            tokenSymbol: "_",
                            halfBlock: true
                        });
                        if(waitingForEndToken.code_inline.id == -1) {
                            tokenRegexArray.push({
                                regExp: /(?<!\\)`(.*?[^\\])`/,
                                tokenType: "code_inline",
                                tokenSymbol: "`",
                                halfBlock: false
                            });
                            halfBlockRegexArray.push({
                                regExp: /(?<!\\)`(.*?)$/,
                                tokenType: "code_inline",
                                tokenSymbol: "`",
                                halfBlock: true
                            });
                        }
                        else if(waitingForEndToken.code_inline.symbol == "``") halfBlockRegexArray.push({
                            regExp: /^(.*?)(?<!\\)`{2}/,
                            tokenType: "code_inline",
                            tokenSymbol: "``",
                            halfBlock: true
                        });
                        tokenRegexArray = tokenRegexArray.concat(halfBlockRegexArray);
                        //トークンの探索
                        let remainLine: string = discordMessage; //未処理の文字列
                        while(remainLine.length > 0) {
                            let earliestToken: TokenMatchData|undefined = undefined; //入力された文字列内で最も左に位置するトークン
                            for(const tokenRegexData of tokenRegexArray) {
                                const matchData = remainLine.match(tokenRegexData.regExp);
                                if(matchData) {
                                    if(earliestToken == undefined || (matchData.index as number) < ((earliestToken as TokenMatchData).matchData.index as number)) {
                                        earliestToken = {
                                            matchData: matchData,
                                            tokenRegExp: tokenRegexData
                                        };
                                        if(earliestToken.matchData.index == 0) break;
                                    }
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
                                    remainLine = remainLine.substring((earliestToken.matchData.index as number), remainLine.length);
                                }
                                if(earliestToken.tokenRegExp.halfBlock) {
                                    if(waitingForEndToken[earliestToken.tokenRegExp.tokenType].id == -1) {
                                        waitingForEndToken[earliestToken.tokenRegExp.tokenType].id = nextId;
                                        if(["italic", "code_inline"].includes(earliestToken.tokenRegExp.tokenType)) waitingForEndToken[earliestToken.tokenRegExp.tokenType].symbol = earliestToken.tokenRegExp.tokenSymbol;
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
                                tokenize(earliestToken.matchData[1], token)
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
                    tokenize(line.replace(/^> /, ""), initialToken);
                    for(const tokenType in waitingForEndToken) {
                        if(waitingForEndToken[tokenType].id > -1 && !candidateStartIds.includes(waitingForEndToken[tokenType].id)) {
                            const token: Token = {
                                candidateId: waitingForEndToken[tokenType].id,
                                type: (tokenType as TokenType),
                                symbol: waitingForEndToken[tokenType].symbol,
                                children: (initialToken.children as Token[]).concat()
                            }
                            initialToken.children = [token];
                        }
                    }
                });
            }
        }
    }
}