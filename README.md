# buy-again

buy-againは、過去に買った商品の印象を端末内に残す個人用メモアプリです。

店頭でバーコードを読み取り、「また買う」か「二度と買わない」かを数秒で確認できます。

## MVPの範囲

- 商品名、バーコード、写真、評価、自由メモを登録できます。
- カメラでバーコードを読み取り、登録済みの商品を検索できます。
- 未登録のバーコードは、番号を入力済みの新規登録画面へ進みます。
- 商品名検索と評価フィルタを使って一覧を絞り込めます。
- 商品詳細から編集と削除ができます。
- データはSQLiteに保存し、バックエンドやログインは使用しません。

AdMob、ログイン、クラウド同期、課金機能はMVPの対象外です。

## 品質確認で反映した内容

- 商品登録、編集、削除、バーコード検索、評価フィルタを独立したテストで確認しています。
- 同じバーコードの商品は新規登録できません。
- 編集時に別の商品と同じバーコードへ変更する操作も拒否します。
- バーコードの連続読み取りは、画面遷移が完了するまで一度だけ処理します。
- 選択した写真はアプリ専用のDocument領域へコピーしてから記録します。
- SQLiteの初期化または読み込みに失敗した場合は、再試行できるエラー画面を表示します。
- ホーム画面は商品0件時と小さい画面で縦にスクロールできます。
- ホーム、商品一覧、詳細、登録、編集、スキャン画面でSafe Areaを考慮しています。

## 技術構成

- React Native
- Expo SDK 57
- TypeScript
- Expo Router
- expo-sqlite
- Zustand
- expo-camera
- expo-image-picker
- expo-file-system
- Jest with jest-expo
- ESLint via Expo
- Prettier

## 起動方法

Node.jsのLTS版を用意してください。

依存関係をインストールします。

```bash
npm install
```

開発サーバーを起動します。

```bash
npm start
```

Webで確認する場合は、開発サーバー起動後に`w`を押すか、次のコマンドを実行します。

```bash
npm run web
```

## iOSで実行する

MacとXcodeがある場合は、次のコマンドでiOSシミュレータを起動できます。

```bash
npm run ios
```

iOS実機では、同じネットワークに接続した端末でExpo Goを開き、ターミナルに表示されたQRコードを読み取ります。

カメラを使うため、初回起動時にカメラへのアクセスを許可してください。

WindowsからiPhoneを確認する場合も、Expo Goなら同じ手順で実行できます。

Windows PCとiPhoneを同じネットワークへ接続し、iPhoneのExpo Goで`npx expo start`が表示するQRコードを読み取ってください。

LAN接続でQRコードを開けない場合は、次のコマンドでトンネル接続を使います。

```bash
npx expo start --tunnel
```

WindowsではXcodeを実行できないため、`npm run ios`や`npx expo run:ios`でiOSのネイティブビルドを作ることはできません。

アプリ固有のiOSネイティブ設定を含むDevelopment BuildをWindowsから確認する場合は、EAS Buildを使います。

Apple Developerアカウントを用意し、EAS CLIへログインしたうえで、次のコマンドを実行します。

```bash
npm install --global eas-cli
eas login
eas build:configure
eas build --profile development --platform ios
```

ビルド完了後に表示されるリンクからiPhoneへDevelopment Buildをインストールします。

iOSのDevelopment BuildはApple Developerの署名と端末登録が必要です。

## Androidで実行する

Android Studioとエミュレータを用意した場合は、次のコマンドで実行できます。

```bash
npm run android
```

Android実機では、同じネットワークに接続した端末でExpo Goを開き、ターミナルに表示されたQRコードを読み取ります。

カメラを使うため、初回起動時にカメラへのアクセスを許可してください。

### Expo Goで確認できる範囲

Expo Goでは、次の実機確認ができます。

- 商品の登録、編集、削除
- SQLiteへの保存とアプリ再起動後の読み込み
- カメラ権限、バーコード読み取り、未登録バーコードの登録
- 写真アクセス権限、写真選択、選択写真の表示
- 商品名検索、評価フィルタ、空状態、長い文字列
- Android戻るボタン、キーボード表示時のレイアウト

Expo GoはExpo Go自身のネイティブコンテナで動作します。

`app.json`に記載したアプリ固有の権限文言や、公開用アプリと同じネイティブ設定までは確認できません。

### Android Development Buildで確認する範囲

Development Buildでは、アプリ固有のネイティブ設定、権限文言、クリーンインストール後の初期化、公開用バイナリに近い動作を確認します。

Android StudioとAndroid SDKをWindows PCへインストールし、実機の開発者向けオプションとUSBデバッグを有効にしてください。

ローカルでDevelopment Buildを作る場合は、次のコマンドを実行します。

```bash
npx expo install expo-dev-client
npx expo run:android
```

EAS Buildで作成する場合は、次のコマンドを実行します。

```bash
npm install --global eas-cli
eas login
eas build:configure
eas build --profile development --platform android
```

生成されたAndroidのDevelopment Buildを実機へインストールし、Metroは次のコマンドで起動します。

```bash
npx expo start --dev-client
```

Expo Goで確認した項目も、公開前にはAndroid Development Buildで再確認してください。

## 実機確認のチェックリスト

### Android

- [ ] Expo Goで起動し、ホーム画面が表示される。
- [ ] Android Development Buildで起動し、アプリ固有の権限文言が表示される。
- [ ] 商品を登録し、アプリを終了して再起動しても商品が残っている。
- [ ] 商品を編集し、変更後に一覧と詳細へ反映される。
- [ ] 商品を削除し、一覧から消える。
- [ ] 登録済みバーコードを一度読み取り、「また買う」または「二度と買わない」がすぐ表示される。
- [ ] 同じバーコードを連続して読み取っても、画面が多重遷移しない。
- [ ] 未登録バーコードを読み取り、新規登録画面へ遷移する。
- [ ] カメラ権限を拒否した場合に説明と再試行ボタンが表示される。
- [ ] 写真アクセス権限を拒否した場合にフォームへ戻り、登録操作を続けられる。
- [ ] 写真を登録し、アプリを再起動しても写真が表示される。
- [ ] Android戻るボタンで、スキャン、詳細、登録、編集の各画面から前の画面へ戻れる。
- [ ] 商品名検索と4種類の評価フィルタが正しく動作する。
- [ ] 商品0件時に登録ボタンまでスクロールして押せる。
- [ ] 長い商品名と長いメモが画面からはみ出さず、スクロールして確認できる。
- [ ] キーボード表示中に商品名とメモを入力でき、保存ボタンまで移動できる。
- [ ] ノッチ、ステータスバー、ナビゲーションバー、ホームインジケータと画面要素が重ならない。
- [ ] 端末の空き容量が少ない状態などでSQLiteエラーが起きた場合、再試行画面が表示される。

### iPhone

- [ ] Windows PCの`npx expo start`へiPhoneのExpo Goから接続できる。
- [ ] LAN接続できない場合に`npx expo start --tunnel`で接続できる。
- [ ] iPhoneのカメラ権限を拒否した場合に説明と再試行ボタンが表示される。
- [ ] 登録済みバーコードを読み取り、既存商品の評価とメモが表示される。
- [ ] 同じバーコードの連続読み取りで多重遷移しない。
- [ ] 写真アクセス権限を拒否した場合に登録操作を続けられる。
- [ ] 写真を登録し、アプリ再起動後も表示される。
- [ ] キーボード、Safe Area、長い商品名、長いメモを確認する。
- [ ] iOSのDevelopment Buildを確認する場合は、EAS Buildで作成した実機用ビルドを使用する。

## 品質チェック

型チェックを実行します。

```bash
npm run typecheck
```

テストを実行します。

```bash
npm test
```

Lintを実行します。

```bash
npm run lint
```

Prettierを実行し、続けて差分がないことを確認します。

```bash
npm run format
npx prettier --check .
```

Expoの依存関係と設定を確認します。

```bash
npx expo-doctor
```

## 静的レビュー結果

ネイティブ実機での最終確認前に、次の実装を確認しています。

| 確認項目                 | 現在の実装                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| expo-sqliteの初期化      | `SQLiteProvider`の`onInit`からマイグレーションを実行します。                                   |
| SQLiteのマイグレーション | `withTransactionAsync`内でテーブルとインデックスを作成し、未知のDBバージョンはエラーにします。 |
| アプリ再起動後の永続化   | ネイティブは`buy-again.db`へ保存します。Webは確認用にlocalStorageを使います。                  |
| カメラ権限拒否           | 説明を表示し、再要求できない場合は端末設定を開きます。                                         |
| 写真アクセス権限拒否     | エラーをフォーム内に表示し、再要求できない場合は端末設定を開きます。                           |
| バーコード連続読み取り   | `useRef`の同期ガードで検索と遷移を一度だけ処理します。                                         |
| 同じバーコードの複数登録 | Repositoryで新規登録と編集時の重複を拒否します。                                               |
| 写真URIの再起動後有効性  | 選択写真をDocument領域へコピーしてからURIを保存します。                                        |
| Android戻るボタン        | Expo Routerのスタックとモーダルの標準戻る動作を利用します。                                    |
| キーボード表示           | 登録と編集を`KeyboardAvoidingView`と`ScrollView`で構成します。                                 |
| Safe Area                | 各画面、タブバー、スキャン画面で上下のインセットを反映します。                                 |
| 長い商品名とメモ         | 商品名は120文字で検証し、一覧では省略表示、詳細とフォームではスクロール表示します。            |
| 商品0件時                | ホームと商品一覧に空状態と登録導線があります。                                                 |
| SQLiteエラー             | 初期化と初回読み込みの失敗は再試行画面にし、操作中の失敗は各画面で表示します。                 |

上表はソースコードとWebバンドルによる静的確認の結果です。

カメラ、OS権限、SQLiteネイティブ実装、端末再起動後の写真表示は、下の実機チェックリストを完了するまで未確認として扱います。

## ディレクトリ構成

```text
src/
  app/
    (tabs)/             ホームと商品一覧のタブ画面
    add.tsx             商品登録画面
    scan.tsx            バーコードスキャン画面
    product/[id].tsx    商品詳細画面
    product/edit/[id].tsx
                        商品編集画面
  components/
    ui.tsx              共通UIと評価表示
    product-form.tsx    登録と編集で共有するフォーム
  constants/
    theme.ts            色、余白、角丸のデザイントークン
  data/
    database.ts         SQLiteの初期化とマイグレーション
    database.web.ts     Web確認用の永続化フォールバック
    product-repository.ts
                        商品データの読み書き
    product-repository.test.ts
                        商品操作とフィルタの独立テスト
  domain/
    product.ts          商品型、評価、入力検証、フィルタ
  store/
    product-store.ts    Zustandの状態管理
  services/
    image-storage.native.ts
                        写真を端末内の永続領域へ保存
```

## 設計意図

UIは店頭での視認性を優先し、深い階層や過剰なアニメーションを避けています。

評価の色を一覧、詳細、ホームの集計で統一し、判断に必要な情報を探す時間を減らしています。

SQLiteの行データはRepositoryでドメイン型に変換し、画面からSQLを直接呼び出さない構造にしています。

iOSとAndroidではSQLiteを使います。

Webは画面確認用としてlocalStorageのフォールバックを使うため、Webの保存データは実機のSQLiteデータとは共有されません。

選択写真はキャッシュ領域のURIをそのままSQLiteへ保存せず、アプリ専用のDocument領域へコピーしてからURIを保存します。

将来同期機能を追加する場合も、RepositoryとStoreの境界を保ったままデータ源を拡張できます。

## TODO

- バーコードの公開商品データベース連携
- iCloudやGoogle Driveなどを使った端末間同期
- エクスポートとインポート
- 商品写真の端末内キャッシュ整理
- 実機でのカメラ読み取り確認と端末別の表示調整
- CIでのLint、型チェック、テスト自動化
