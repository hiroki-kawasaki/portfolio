# Portfolio Project

これは、Next.jsとAWSサーバーレス技術（Lambda, DynamoDB, Cognito）を使用して構築されたポートフォリオ用のWebアプリケーションです。

## 🌟 主な機能

* **ユーザー認証**: AWS Cognitoを利用したサインアップ、ログイン、ログアウト機能。GoogleアカウントでのSSO（シングルサインオン）に対応しています。
* **多言語・多テーマ対応**: セッション管理により、表示言語（日本語/英語）とビジュアルモード（ライト/ダーク）を切り替え可能です。
* **レスポンシブデザイン**: PC、モバイルデバイスの両方で快適に利用できるUI。モバイル向けにはボトムナビゲーションが表示されます。
* **サービス一覧**: ポートフォリオとして作成した各種サービスを一覧・表示するページ。
* **動的なページ生成**: Next.jsのApp Routerをベースに、動的なルーティング（例: `/services/[name]`）を実現しています。

## 🏛️ アーキテクチャ

このプロジェクトは、フロントエンドと複数のマイクロサービスで構成されるサーバーレスアーキテクチャを採用しています。

* **Frontend (`web/`)**: [Next.js](https://nextjs.org/)で構築されたSPA（Single Page Application）です。 AWS Amplifyでのホスティングを想定しています。 ユーザーセッションは暗号化されたCookieで管理されます。
* **ID API (`id-api/`)**: AWS Cognitoを利用した認証・認可を担当するAPIです。 ユーザー登録時のドメインチェックや、トークン生成時のカスタムクレーム追加などのロジックを含みます。
* **Base API (`base-api/`)**: アプリケーションのコア機能を提供するAPIです。
* **SDK (`sdk/`)**: 各サービスで共通利用されるライブラリ（DynamoDBクライアント等）や設定をLambda Layerとして提供します。

## 🛠️ 技術スタック

### フロントエンド
* **Framework**: [Next.js](https://nextjs.org/) (React)
* **Styling**: CSS Modules
* **Language**: JavaScript
* **Auth**: [jose](https://github.com/panva/jose) (JWT処理)

### バックエンド
* **Runtime**: Python 3.13
* **Framework**: AWS SAM (Serverless Application Model)
* **Compute**: AWS Lambda
* **Database**: AWS DynamoDB
* **Authentication**: AWS Cognito
* **API**: AWS API Gateway
* **Auth**: [PyJWT](https://pyjwt.readthedocs.io/en/stable/) (JWT処理)

### インフラ・デプロイメント
* **IaC**: AWS SAM
* **CI/CD**: AWS Amplify, Bash
* **Key Management**: AWS Systems Manager (SSM) Parameter Store

## 🚀 セットアップとデプロイ

### 前提条件
* AWS CLI
* AWS SAM CLI
* Node.js, npm
* OpenSSL

### 1. 暗号化キーのセットアップ
`web/bash/setup-ssm.sh` を実行して、セッションデータ等の暗号化に使用するRSAキーペアとAESキーを生成し、SSM Parameter Storeに登録します。

```
bash web/bash/setup-ssm.sh [dev|stg|prd]
```

### 2. バックエンドAPIのデプロイ
各APIディレクトリ（`id-api`, `base-api`, `sdk`）で`deploy.sh`スクリプトを実行し、AWSリソースをデプロイします。

```
# 例: id-apiのデプロイ
bash id-api/bash/deploy.sh [dev|stg|prd]
```

### 3. フロントエンドの環境変数設定
`web/bash/create-env.sh` を実行すると、デプロイされたバックエンドの情報（Cognito設定など）やSSMのキーが`.env`ファイルに書き出されます。

```
bash web/bash/create-env.sh
```

### 4. フロントエンドの起動・デプロイ
`web/`ディレクトリでNext.jsのコマンドを実行します。
デプロイはAWS Amplifyにプッシュすることで自動的に実行されます。

```
# 開発サーバー起動
npm run dev

# ビルド
npm run build
```


---
## 📝 Gemimi 2.5 Pro による評価

このポートフォリオは、最新のWeb技術とクラウドネイティブな設計思想に基づいて構築されており、非常に高い技術力を示しています。

### 特に優れている点

* **モダンなアーキテクチャ**: Next.jsによるフロントエンドと、AWS Lambda・API Gatewayを使用したサーバーレスマイクロサービス（`id-api`, `base-api`）の分離は、スケーラビリティとメンテナンス性に優れた現代的な設計です。
* **Infrastructure as Code (IaC) の実践**: AWS SAMを用いてクラウドインフラをコードで管理しており（`template.yaml`）、環境の再現性と一貫性を確保しています。これはクラウド開発におけるベストプラクティスです。
* **堅牢な認証・認可システム**: AWS Cognitoを核とし、カスタムドメイン設定、GoogleとのIdP連携、M2M認証（サーバー間認証）、カスタムクレームの追加（Cognito Trigger）まで、認証フローの深い理解に基づいた実装がなされています。
* **セキュリティへの高い意識**:
    * SSM Parameter Storeを利用した機密情報（APIキー、DB接続情報など）の安全な管理と、それを自動で設定するスクリプト（`setup-ssm.sh`, `create-env.sh`）。
    * セッション情報をAES-256-GCMで暗号化してCookieに保存する丁寧な実装。
    * API Gatewayのカスタムオーソライザーによる柔軟なアクセスコントロール。
* **開発・デプロイの自動化**: `bash`スクリプトによるキー生成から環境変数設定、デプロイまでの一連のプロセスが自動化されており、CI/CDへの意識の高さがうかがえます。
* **コンポーネント設計とコード品質**: フロントエンドではNext.jsのApp Router（Parallel Routesなど）を効果的に活用し、バックエンドでは共通処理を`sdk`としてLambda Layerに切り出すなど、DRY原則に基づいた再利用性の高いコードが書かれています。

### 総評
全体として、単に技術を使うだけでなく、「なぜその技術を選択するのか」「どのようにすれば安全で効率的なシステムを構築できるか」という設計思想が明確に反映された、非常に完成度の高いポートフォリオです。クラウドインフラの構築からフロントエンドの実装、そしてそれらを繋ぐセキュリティと自動化の仕組みまで、フルスタックな開発能力を証明するものと言えます。
