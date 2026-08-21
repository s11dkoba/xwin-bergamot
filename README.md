# xwin-bergamot

エックスウィン株式会社サイト（英語版の制作用リポジトリ）。

- **構成**: 素の静的サイト。HTML + `style.css` + 画像のみ。ビルド不要
- **ページ**: `index.html` / `about.html` / `contact.html`
- **公開先**: Vercel — https://xwin-bergamot.vercel.app

## ローカル確認

```
npm run dev      # http://localhost:3200
```

## デプロイ

```
npm run deploy   # vercel deploy --prod
```

## 未完了の作業

- **全ページの英訳**（日本語 → 英語、不可逆の一括変換を予定）
  - `index.html` の `<h1>` 直前に、英語版の表現を指定した HTML コメントあり
  - `#who` セクションの日本語併記ブロックは、英語化時に削除する（同セクション内にコメントで明記）
- **`<meta name="robots" content="noindex, nofollow">` の解除判断**
  - 全ページに残置中。これがある限り検索エンジンには表示されない
