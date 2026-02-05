# Red Bookmark

读书笔记与书签管理应用，支持微信小程序和 Web 端。

## 项目结构

```
archival-bookshelf/
├── miniprogram/     # 微信小程序
│   ├── pages/       # 页面
│   ├── components/  # 组件
│   ├── cloudfunctions/  # 云函数
│   └── ...
├── web/             # Web 端
│   ├── pages/       # 页面
│   ├── components/  # 组件
│   └── ...
└── README.md
```

## 微信小程序

使用微信开发者工具打开 `miniprogram` 文件夹。

### 功能
- 书籍管理（添加、编辑、分类标签）
- 书签管理（OCR 识别、批量导入）
- 书签卡片导出
- 分享功能

### 云开发
需要开通微信云开发，创建以下数据库集合：
- `volumes` - 书籍
- `marks` - 书签

## Web 端

```bash
cd web
npm install
npm run dev
```
