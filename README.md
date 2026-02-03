# PHH - Personal History Hub

一个支持个人记录、经历展示、兴趣收藏和广场互动的私人网站系统。

## 功能特性

### 核心功能

1. **个人记录**
   - 使用富文本编辑器快速记录想法、日志、碎片内容
   - 内容允许不完整、可反复修改
   - 支持草稿、发布、归档状态
   - 自动保存草稿功能
   - Markdown 格式渲染支持

2. **个人经历展示**
   - 以时间轴形式展示做过的事情
   - 用于回顾与对外展示
   - 可由记录内容逐步沉淀而来
   - 支持工作、项目、教育、里程碑等分类

3. **兴趣整理与收藏**
   - 长期维护的兴趣、资源、收藏集合
   - 不只是链接，而是附带个人说明
   - 支持文章、视频、书籍、工具、资源等类型
   - 收藏标记功能

4. **广场互动**
   - 公开记录展示在广场
   - 点赞功能（实时 WebSocket 通知）
   - 评论功能
   - 收藏功能
   - 搜索功能

5. **通知系统**
   - 点赞通知
   - 评论通知
   - 关注通知
   - 实时 WebSocket 推送

6. **标签系统**
   - 支持为记录添加标签
   - 热门标签推荐
   - 标签搜索

### 设计原则

- **更新友好**：内容弱结构，支持快速新增、随时修改，不强制一次性整理
- **界面友好**：操作步骤少，首页即可快速记录，支持搜索与标签筛选
- **多租户隔离**：一套系统支持多个私人空间，不同租户数据完全隔离
- **前后端分离**：前端专注展示与交互，后端提供统一 API 服务
- **可持续演进**：允许从「记录」逐步升级为「展示内容」，不因早期设计限制后期扩展

## 技术栈

### 后端

| 技术 | 用途 |
|------|------|
| FastAPI | Python Web 框架 |
| PostgreSQL | 主数据库 |
| SQLAlchemy 2.0 | ORM |
| Alembic | 数据库迁移 |
| python-jose | JWT 认证 |
| Passlib + Bcrypt | 密码加密 |
| WebSocket | 实时通知 |

### 前端

| 技术 | 用途 |
|------|------|
| React 18 | UI 框架 |
| TypeScript | 类型安全 |
| Vite | 构建工具 |
| React Router v6 | 路由 |
| Zustand | 状态管理 |
| Axios | HTTP 客户端 |
| Tailwind CSS | UI 样式 |
| TipTap | 富文本编辑器 |
| Framer Motion | 动画效果 |

## 项目结构

```
phh/
├── backend/                    # 后端项目
│   ├── app/
│   │   ├── api/               # API 路由
│   │   │   ├── auth.py        # 认证接口
│   │   │   ├── records.py     # 记录接口
│   │   │   ├── experiences.py # 经历接口
│   │   │   ├── collections.py # 收藏接口
│   │   │   ├── tags.py        # 标签接口
│   │   │   ├── likes.py       # 点赞接口
│   │   │   ├── comments.py    # 评论接口
│   │   │   ├── notifications.py # 通知接口
│   │   │   └── users.py       # 用户接口
│   │   ├── models/            # 数据库模型
│   │   │   ├── base.py
│   │   │   ├── tenant.py
│   │   │   ├── user.py
│   │   │   ├── record.py
│   │   │   ├── experience.py
│   │   │   ├── collection.py
│   │   │   ├── tag.py
│   │   │   ├── content_tag.py
│   │   │   ├── like.py
│   │   │   ├── comment.py
│   │   │   ├── notification.py
│   │   │   └── content_tag.py
│   │   ├── schemas/           # Pydantic 模型
│   │   │   ├── auth.py
│   │   │   ├── record.py
│   │   │   ├── experience.py
│   │   │   ├── collection.py
│   │   │   ├── tag.py
│   │   │   ├── like.py
│   │   │   ├── comment.py
│   │   │   └── notification.py
│   │   ├── core/              # 核心功能
│   │   │   ├── database.py
│   │   │   ├── security.py
│   │   │   ├── tenant.py
│   │   │   ├── notification.py
│   │   │   └── analytics.py
│   │   ├── config.py          # 配置
│   │   ├── dependencies.py    # 依赖注入
│   │   └── main.py            # 应用入口
│   ├── alembic/               # 数据库迁移
│   │   └── versions/          # 迁移版本
│   ├── requirements.txt       # Python 依赖
│   ├── alembic.ini            # Alembic 配置
│   └── .env.example           # 环境变量示例
│
└── frontend/                   # 前端项目
    ├── src/
    │   ├── api/               # API 调用
    │   │   ├── client.ts      # Axios 客户端
    │   │   ├── auth.ts
    │   │   ├── records.ts
    │   │   ├── experiences.ts
    │   │   ├── collections.ts
    │   │   ├── tags.ts
    │   │   ├── likes.ts
    │   │   ├── comments.ts
    │   │   └── notifications.ts
    │   ├── components/        # React 组件
    │   │   ├── layout/        # 布局组件
    │   │   │   ├── Header.tsx
    │   │   │   ├── Sidebar.tsx
    │   │   │   └── Layout.tsx
    │   │   ├── notifications/ # 通知组件
    │   │   │   ├── NotificationBell.tsx
    │   │   │   └── NotificationCenter.tsx
    │   │   ├── RichTextEditor.tsx    # 富文本编辑器
    │   │   ├── HtmlContent.tsx       # HTML 内容渲染
    │   │   ├── TagInput.tsx          # 标签输入
    │   │   └── ...
    │   ├── hooks/             # 自定义 Hook
    │   │   └── useDraftSave.ts       # 草稿自动保存
    │   ├── pages/             # 页面组件
    │   │   ├── Home.tsx               # 首页（广场）
    │   │   ├── RecordsList.tsx        # 记录列表
    │   │   ├── RecordDetail.tsx       # 记录详情
    │   │   ├── RecordEdit.tsx         # 记录编辑
    │   │   ├── ExperienceEdit.tsx     # 经历编辑
    │   │   ├── CollectionsGrid.tsx    # 收藏网格
    │   │   ├── Login.tsx              # 登录
    │   │   ├── Register.tsx           # 注册
    │   │   └── ...
    │   ├── store/             # Zustand 状态管理
    │   │   └── authStore.ts
    │   ├── types/             # TypeScript 类型定义
    │   │   ├── record.ts
    │   │   ├── experience.ts
    │   │   └── ...
    │   ├── services/          # 服务
    │   │   └── websocket.ts   # WebSocket 客户端
    │   ├── utils/             # 工具函数
    │   │   ├── dateUtils.ts
    │   │   └── time.ts
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── tailwind.config.js
```

## 快速开始

### 前置要求

- Python 3.8+
- Node.js 18+
- PostgreSQL 12+

### 1. 克隆项目

```bash
git clone <repository-url>
cd phh
```

### 2. 后端设置

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置数据库连接等配置

# 初始化数据库
alembic upgrade head

# 启动后端服务器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端 API 文档：http://localhost:8000/docs

### 3. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端应用：http://localhost:5173

### 4. 首次使用

1. 访问 http://localhost:5173/register
2. 注册新账号
3. 登录后即可开始使用

## 主要 API 端点

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/logout | 登出 |
| GET | /api/auth/me | 获取当前用户 |

### 记录

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/records | 获取记录列表 |
| POST | /api/records | 创建记录 |
| GET | /api/records/{id} | 获取记录详情 |
| PUT | /api/records/{id} | 更新记录 |
| DELETE | /api/records/{id} | 删除记录 |
| POST | /api/records/{id}/publish | 发布记录 |
| GET | /api/records/public | 获取公开记录（广场） |

### 经历

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/experiences | 获取经历列表 |
| POST | /api/experiences | 创建经历 |
| GET | /api/experiences/{id} | 获取经历详情 |
| PUT | /api/experiences/{id} | 更新经历 |
| DELETE | /api/experiences/{id} | 删除经历 |

### 收藏

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/collections | 获取收藏列表 |
| POST | /api/collections | 创建收藏 |
| GET | /api/collections/{id} | 获取收藏详情 |
| PUT | /api/collections/{id} | 更新收藏 |
| DELETE | /api/collections/{id} | 删除收藏 |
| POST | /api/collections/collect/{type}/{id} | 收藏内容 |
| DELETE | /api/collections/uncollect/{type}/{id} | 取消收藏 |

### 标签

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/tags | 获取标签列表 |
| GET | /api/tags/popular | 获取热门标签 |
| POST | /api/tags | 创建标签 |

### 点赞

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/likes/records/{id} | 点赞记录 |
| DELETE | /api/likes/records/{id} | 取消点赞 |
| GET | /api/likes/status/{type}/{id} | 获取点赞状态 |

### 评论

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/comments/{type}/{id} | 创建评论 |
| GET | /api/comments/{type}/{id} | 获取评论列表 |
| DELETE | /api/comments/{id} | 删除评论 |

### 通知

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/notifications | 获取通知列表 |
| GET | /api/notifications/unread-count | 获取未读数 |
| POST | /api/notifications/{id}/read | 标记已读 |
| POST | /api/notifications/read-all | 全部已读 |

## 数据库模型

### 核心表

| 表名 | 说明 |
|------|------|
| tenants | 租户表 |
| users | 用户表 |
| records | 记录表 |
| experiences | 经历表 |
| collections | 收藏表 |
| tags | 标签表 |
| content_tags | 内容标签关联表 |
| likes | 点赞表 |
| comments | 评论表 |
| notifications | 通知表 |

## 开发指南

### 后端开发

```bash
cd backend

# 运行测试
pytest

# 创建新的数据库迁移
alembic revision --autogenerate -m "描述"

# 应用迁移
alembic upgrade head
```

### 前端开发

```bash
cd frontend

# 运行开发服务器
npm run dev

# 构建生产版本
npm run build

# 类型检查
npm run type-check
```

## 部署

### Docker 部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

服务端口：
- 前端：http://localhost:3000
- 后端：http://localhost:8000
- 数据库：localhost:5432

### 手动部署

**后端**

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**前端**

```bash
cd frontend
npm install
npm run build
# 部署 dist 目录到静态文件服务器
```

### 生产环境建议

1. 修改 `SECRET_KEY` 为强随机密钥
2. 使用强数据库密码
3. 配置 HTTPS
4. 使用环境变量管理敏感配置
5. 配置日志收集和监控
6. 定期备份数据库

## 功能亮点

### 实时通知
- 点赞、评论实时推送
- WebSocket 长连接
- 未读消息计数

### 自动保存草稿
- 新建记录时自动保存草稿
- 页面刷新后可恢复
- 本地存储支持

### 富文本编辑
- TipTap 编辑器
- Markdown 格式支持
- 粗体、斜体、标题、链接

### 响应式设计
- 适配桌面和移动设备
- 优雅的 UI/UX 设计
- 流畅的交互动画

## 许可证

MIT License
