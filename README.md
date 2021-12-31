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
 （ディレクトリ構造の例）![147386151-9cf3f6db-b092-413a-96dd-dcd197253e5e](https://user-images.githubusercontent.com/90630001/147825953-68ef7f73-b904-4c38-be77-3a4906688fdf.png)

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

[^1]: バージョンは開発時に使用したバージョンを表示しています。表示されているバージョンでなくても動作する場合もあります。
