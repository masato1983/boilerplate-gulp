- 新しいプロジェクトを開始する場合、GitHub からクローンする

```
git clone git@github.com:masato1983/boilerplate.git new-project-name
```

- プロジェクトのディレクトリに移動する

```
cd new-project-name
```

- ボイラープレートの Git を削除する

```
rm -rf .git
```

- 新しいプロジェクトとして Git を初期化する

```
git init
```

- パッケージをインストールする

```
npm install
```

- `package.json`の`"name"`と`"description"`を適切な名前と文章に変更する

- イニシャルコミットを実行する（コミットメッセージ例）

```
build(project): Initial commit - download boilerplate-gulp
```

- ブランチ名を、`master`から`main`に変更する

```
git branch -M main
```

- リモートリポジトリにプッシュする

```
git remote add origin git@github.com:masato1983/hoge.git
```

```
git push -u origin main
```

- デバッグ時は、`google chrome`の検証ツールの`Network`で、`Disable cache`にチェックを入れておく事
