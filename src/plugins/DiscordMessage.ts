import { DiscordAttachment, DiscordChannel, DiscordGuild, DiscordUser, PluginBase, VerificationResult } from "../PluginBase";

/**
 * トークンの種類
 */
type TokenType = "text" | "bold" | "italic" | "underline" | "strike" | "spoiler" | "code_inline" | "code_block" | "quote" | "link";
/**
 * 構文木のトークン
 */
type Token = {
    /** 候補ID。-1は確定トークン。0以上のIDは候補トークン。このトークンが有効化されれば文字装飾として処理、そうでなければただのテキストとして処理。 */
    candidateId: number,
    /** トークンの種類 */
    tokenType: TokenType,
    /** トークンの中身のテキスト。"text"トークン以外はundefined */
    text?: string,
    /** 子トークンの配列。子トークンを持たないトークンの場合はundefined。 */
    children?: Token[]
};
/**
 * waitingForEndTokenでの複数の囲みトークンがあるトークンの情報
 */
type CandidateToken = {
    id: number,
    token?: string
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
                const waitingForEndToken: { //終了トークン待ちの囲みトークン。-1は終了待ちではない。それ以外は該当のIDでの終了トークン待ち。
                    bold: number,
                    italic: CandidateToken,
                    underline: number,
                    strike: number,
                    spoiler: number,
                    code_inline: CandidateToken,
                    code_block: number,
                } = {
                    bold: -1,
                    italic: {
                        id: -1
                    },
                    underline: -1,
                    strike: -1,
                    spoiler: -1,
                    code_inline: {
                        id: -1
                    },
                    code_block: -1
                }
                let nextId: number = 0; //次に割り振るID
                content.split("\n").forEach((line: string, index: number) => {
                    ast.push({
                        candidateId: -1,
                        tokenType: "text",
                        children: []
                    });
                    if(/^> +\S+$/.test(line)) {
                        (ast[index].children as Token[]).push({
                            candidateId: -1,
                            tokenType: "quote",
                            children: []
                        });
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
                            regExp: /(https?:\/\/\S{2,})/,
                            tokenType: "link",
                            halfBlock: false
                        });
                        if(waitingForEndToken.code_block == -1) {
                            tokenRegexArray.push({
                                regExp: /(?<!\\)`{3}(.+?[^\\])`{3}/,
                                tokenType: "code_block",
                                halfBlock: false
                            });
                            halfBlockRegexArray.push({
                                regExp: /(?<!\\)`{3}(.*?)$/,
                                tokenType: "code_block",
                                halfBlock: true
                            });
                        }
                        else halfBlockRegexArray.push({
                            regExp: /^(.*?)(?<!\\)`{3}/,
                            tokenType: "code_block",
                            halfBlock: true
                        });
                        if(waitingForEndToken.bold == -1) {
                            tokenRegexArray.push({
                                regExp: /(?<!\\)\*{2}(.+?[^\\])\*{2}/,
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
                        if(waitingForEndToken.underline == -1) {
                            tokenRegexArray.push({
                                regExp: /(?<!\\)_{2}(.+?[^\\])_{2}/,
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
                        if(waitingForEndToken.strike == -1) {
                            tokenRegexArray.push({
                                regExp: /(?<!\\)~{2}(.+?[^\\])~{2}/,
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
                        if(waitingForEndToken.code_inline.id == -1) {
                            tokenRegexArray = tokenRegexArray.concat([
                                {
                                    regExp: /(?<!\\)`{2}(.+?[^\\])`{2}/,
                                    tokenType: "code_inline",
                                    tokenSymbol: "``",
                                    halfBlock: false
                                },
                                {
                                    regExp: /(?<!\\)`(.+?[^\\])`/,
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
                        else if(waitingForEndToken.code_inline.token == "``") halfBlockRegexArray.push({
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
                                    regExp: /(?<!\\)\*(.+?[^\\])\*/,
                                    tokenType: "italic",
                                    tokenSymbol: "*",
                                    halfBlock: false
                                },
                                {
                                    regExp: /(?<!\\)_(.+?[^\\])_/,
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
                        else if(waitingForEndToken.italic.token == "*") halfBlockRegexArray.push({
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
                                regExp: /(?<!\\)`(.+?[^\\])`/,
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
                        else if(waitingForEndToken.code_inline.token == "``") halfBlockRegexArray.push({
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
                                        tokenType: "text",
                                        text: remainLine.substring(0, earliestToken.matchData.index)
                                    });
                                    remainLine = remainLine.substring((earliestToken.matchData.index as number), remainLine.length);
                                }
                                switch(earliestToken.tokenRegExp.tokenType) {
                                    case "bold":
                                        let token: Token;
                                        if(earliestToken.tokenRegExp.halfBlock) {
                                            waitingForEndToken.bold = waitingForEndToken.bold == -1 ? nextId++ : -1;
                                            token = {
                                                candidateId: waitingForEndToken.bold,
                                                tokenType: "bold",
                                                children: []
                                            }
                                        }
                                        else {
                                            token = {
                                                candidateId: -1,
                                                tokenType: "bold",
                                                children: []
                                            }
                                        }
                                        (parentToken.children as Token[]).push(token);
                                        tokenize(earliestToken.matchData[1], token);
                                        remainLine = remainLine.replace(earliestToken.matchData[0], "");
                                        break;
                                }
                            }
                            //トークンが見つからなかった場合、残りを"text"トークンとして処理
                            else {
                                (parentToken.children as Token[]).push({
                                    candidateId: -1,
                                    tokenType: "text",
                                    text: remainLine
                                });
                                remainLine = "";
                            }
                        }
                    }
                    tokenize(line, ast[index]);
                });
            }
        }
    }
}