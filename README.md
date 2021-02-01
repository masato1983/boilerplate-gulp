- 新しいプロジェクトを開始する場合、GitHubからクローンする

```
git clone git@github.com:masato1983/boilerplate.git new-project-name
```

- プロジェクトのディレクトリに移動する
```
cd new-project-name
```

- ボイラープレートのGitを削除する
```
rm -rf .git
```

- 新しいプロジェクトとしてGitを初期化する
```
git init
```

- パッケージをインストールする
```
npm install
```

- デバッグ時は、`google chrome`の検証ツールの`Network`で、`Disable cache`にチェックを入れておく事