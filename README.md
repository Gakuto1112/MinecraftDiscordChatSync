# MinecraftDiscordチャット同期Botアプリケーション
Minecraft（Java Edition）と[Discord](https://discord.com/)のチャットを同期するボットのアプリケーションです。ゲームに参加していないプレイヤーもDiscordを通じてゲーム内プレイヤーと会話できます。サーバーにはModやプラグインは必要なく、バニラサーバーやForgeサーバーにそのまま使用できます。

![MinecraftとDiscordの相互連携](https://user-images.githubusercontent.com/90630001/147385286-577b2062-f91e-49a8-b991-e0e910c53a4b.jpg)

## 機能紹介
### Minecraft → Discord
MinecraftからDiscordへは以下のものが送信されます。
- プレイヤーのチャット
- サーバー起動のお知らせ
- サーバー閉鎖のお知らせ
- プレイヤー参加のお知らせ
  - 埋め込みメッセージ付き（設定で非表示可）
- プレイヤー退出のお知らせ
  - 埋め込みメッセージ付き（設定で非表示可）
- 進捗達成のお知らせ
  - 埋め込みメッセージ付き（設定で非表示可）
- プレイヤー死亡のお知らせ

![ボットのお知らせ紹介](https://user-images.githubusercontent.com/90630001/147385279-a7d5da70-391b-48e1-acdb-81686ec8e1ab.jpg)

### Discord → Minecraft
![Discord → Minecraftのチャットの例](https://user-images.githubusercontent.com/90630001/147386057-c21c29b1-e3a1-4914-8f35-3ecffa51b9e1.jpg)
- 指定されたチャンネルにメッセージが送信された時に、ゲーム内にも同様のメッセージが送信されます。
- 名前はサーバーでの表示名になります。カーソルを合わせるとユーザーのタグが表示されます。![ユーザータグ](https://user-images.githubusercontent.com/90630001/147386151-9cf3f6db-b092-413a-96dd-dcd197253e5e.png)
- 名前の色はユーザーのロールカラーになります（1.16～、設定で無効化可）。
- ユーザーが発言したチャンネル名が表示されます（設定で非表示可、非表示にした場合は、カーソルを合わるとユーザータグと共に表示されます）。
- メッセージにURLが含まれている場合は、クリックしてURLにアクセスできる状態になります。
- メッセージに添付ファイルが存在する場合は、添付ファイルも表示できます（設定で非表示可）。

### サーバー管理者向け
- サーバーにModやプラグインを導入する必要はありません。そのままのバニラサーバー、Modサーバーで使用できます。
- 設定で一部機能を無効にできます。
- このアプリケーションはプラグインベースで設計しているので、既存の機能を削除したり、新たな機能を追加できます。

## 使用方法
1. このアプリケーションを実行するには「Node.js（v16.13.1[^1]）」が必要です。[こちら](https://nodejs.org/ja/)からインストールして下さい。  
2. このアプリケーションのデータをダウンロードします。このページ上部の緑色の「**Code**」から「**Download ZIP**」をクリックするとzipファイルをダウンロードできます。また、このレポジトリをクローンしてもダウンロードできます（gitユーザー向け）。
   - データの保存先は、「**該当のサーバーの実行ファイルが存在するディレクトリに新たなフォルダを作ってその中に保存する**」のが好ましいです。
```
（ディレクトリ構造の例） 
Server/
  ├ MinecraftDiscordChatSync/     ←このフォルダを作る
  │ ├ plugins/
  │ │ └ ...
  │ ├ .gitignore
  | ├ MinecraftDiscordChatSync.ts     ←このアプリケーションのメインソースファイル
  | ├ README.md
  | ├ package-lock.json
  | └ package.json
  ├ server.jar      ←サーバー実行ファイル
  ├ server.properties
  └ ...
```
3. Windowsなら「コマンドプロンプト」または「Power Shell」を、MacOSなら「ターミナル」を開きます。
4. 以下のコマンドで、アプリケーションのディレクトリまで移動します。
   - ディレクトリまでのパスはお使いの環境に合わせて変更して下さい。
```
cd C:\..\Server\MinecraftDiscordChatSync\
```
5. 以下のコマンドを1つずつ入力して必要なモジュールをインストールします。

| モジュール名 | バージョン[^1] | 説明 | コマンド |
| --- | --- | --- | --- |
| [chokidar](https://www.npmjs.com/package/chokidar) | 3.5.2 | ファイルの監視 |  ```npm install chokidar``` |
| [discord.js](https://www.npmjs.com/package/discord.js) | 13.3.1 | Discordのボットを操作 |  ```npm install discord.js``` |
| [iconv](https://www.npmjs.com/package/iconv) | 3.0.1 | 異なる文字コードへの変換 | ```npm install iconv``` |
| [rcon-client](https://www.npmjs.com/package/rcon-client) | 4.2.3 | Rconの操作 | ```npm install rcon-client``` |
  
6. 以下のコマンドを入力してアプリケーションを実行します。
```
ts-node MinecraftDiscordChatSync.ts
```
7. 初期起動時は以下のようなメッセージが表示されます。
```
設定ファイル「Settings.json」が存在しません。
「Settings.json」を生成しました。ファイルを開いて必要な情報を入力して下さい。
```
初期生成される「Settings.json」（以下、設定ファイル）は以下のようになっています。
```json
  {
    "minecraftVersion": "1.18.1",
    "pathToLogFile": "./logs/latest.log",
    "logEncode": "utf-8",
    "timeOffset": 9,
    "embeds": {
        "advancements": "true",
        "playerJoin": "true",
        "playerLeave": "true"
    },
    "rconPort": 25575,
    "rconPassword": "",
    "token": "<Botのトークン>",
    "botSendChannels": [
        "<チャンネルID>"
    ],
    "botWatchChannels": [
        "<チャンネルID>"
    ],
    "discordMessageDisplay": {
        "ignoreBots": "true",
        "displayRoleColor": "true",
        "showChannelName": "true",
        "showAttachments": "true"
    }
}
  ```

8. 生成された設定ファイルを編集して必要な情報を設定します。

| 項目 | 説明 | 初期値 | 有効な設定値 |
| --- | --- | --- | --- |
| minecraftVersion | 実行するマインクラフトサーバーのバージョンです。設定されたバージョンによって、Rconで送信されるコマンドが変化します。希望のバージョンが存在しない場合は、最寄りのバージョンを選択してください（正しく動作しない場合があります）。 | 1.18.1 | string（1.12 ~ 1.18のリリースバージョン）
| pathToLogFile | カレントディレクトリから見た「latest.log」までのパスを設定して下さい。 | ./logs/latest.log | string |
| logEncode | ログファイルの文字コード。Windowsの場合、非ASCII文字が文字化けする場合があります。その場合は「shift-jis」に変更してみて下さい。 | utf-8 | string（「utf-8」か「shift-jis」のいずれか） |
| timeOffset | 世界標準時（GMT）から見た時差（時）。日本で使用する場合は変更不要です。 | 9 | number |
| embeds | ボットの各メッセージで埋め込みメッセージを表示するかのどうかの設定です。falseの場合は埋め込みメッセージは表示されません。詳細は下記を見て下さい。 | | |
| rconPort | Rconのポート番号です。サーバーと同じ設定にして下さい。 | 25575 | number（0~65535） |
| rconPassword | Rconのパスワードです。サーバーと同じ設定にして下さい。 | | string |
| token | ボットのトークン。 | | string |
| botSendChannels | ボットがメッセージを送信するチャンネルです。設定するチャンネルIDを列挙して下さい。 | | string[]（数字以外の文字はエラーになります。） |
| botWatchChannels | ゲーム内にDiscordのメッセージを送信する対象のチャンネルです。設定するチャンネルIDを列挙して下さい。 | | string[]（数字以外の文字はエラーになります。） |
| discordMessageDisplay | Discordからゲーム内へメッセージを送信する際の各種設定です。詳細は下記を見て下さい。 | | |

**embeds**

| 項目 | 説明 | 初期値 | 有効な設定値 |
| --- | --- | --- | --- |
| advancements | 進捗達成時のメッセージに埋め込みメッセージを表示するかどうかです。 | true | boolean |
| playerJoin | プレイヤー参加時のメッセージに埋め込みメッセージを表示するかどうかです。 | true | boolean |
| advancements | プレイヤー退出時のメッセージに埋め込みメッセージを表示するかどうかです。 | true | boolean |

**discordMessageDisplay**

| 項目 | 説明 | 初期値 | 有効な設定値 |
| --- | --- | --- | --- |
| ignoreBots | 他のボットのメッセージを無視するかどうかです。trueにすると他のボットのメッセージをゲーム内に表示しません。falseにしても自身のメッセージは無視します。 | true | boolean |
| displayRoleColor | Discordからのメッセージでユーザー名の色をロールカラーにするかどうかです。初期カラーは白色になります。falseかバージョンが1.16以前の場合は黄色になります。 | true | boolean |
| showChannelName | ユーザー名と共にチャンネル名が表示されるかどうかです。trueにするとユーザー名と共に発言元のチャンネル名が表示されます。 | true | boolean |
| showAttachments | 添付ファイルのメッセージをゲーム内に表示するかどうかです。trueにするとDiscordの添付ファイルへのリンクをゲーム内に表示します。 | true | boolean |

[^1]: バージョンは開発時に使用したバージョンを表示しています。表示されているバージョンでなくても動作する場合もあります。
