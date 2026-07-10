# 按行业推荐一本书

基于小红书评论文本书目候选，按行业与阅读目标给出一条可立即开始的阅读建议。

技术栈：React + Vite + 本地 CSS。

## 本地运行

```sh
npm install
npm run dev
```

## 构建与验证

```sh
npm run lint
npm run build
```

## 数据说明

推荐映射来自相邻项目 `xhs-book-comments` 中已解析的 578 条唯一评论和 170 条书目候选。样本未覆盖全部评论，且部分候选来自评论区汇总，不构成专业领域的完整必读书单。

## 发布

发布地址：`https://holynova.github.io/industry-book-recommender/`。

推送到 `main` 后，GitHub Actions 会自动构建并发布 `dist/`。
