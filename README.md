# xwin-bergamot

エックスウィン株式会社サイトの英語版（作業用リポジトリ）。

- 現状: `xwin-strawberry` の日本語版を完全複製した状態
- 構成: 素の静的サイト（HTML + `style.css` + 画像）。ビルド不要
- ページ: `index` / `about` / `news` / `contact` / `service-management` / `service-data` / `service-digital-asset`

## ローカル確認

```
npm run dev      # http://localhost:3200
```

## デプロイ

Netlify（`netlify.toml` で publish = リポジトリルート）。

```
npx netlify-cli deploy --prod --dir=.
```
