# PHH - Personal History Hub

一个支持个人记录、经历展示、兴趣收藏和广场互动的私人网站系统。

## 功能特性

### 核心功能

1. **个人记录**
   - 快速记录想法、日志、碎片内容
   - 内容允许不完整、可反复修改
   - 支持草稿、发布、归档状态
   - 后期可整理、演进为正式内容
   - 自动保存草稿功能

2. **个人经历展示**
   - 以时间轴形式展示做过的事情
   - 用于回顾与对外展示
   - 可由记录内容逐步沉淀而来
   - 支持工作、项目、教育、里程碑等分类

3. **兴趣整理 / 收藏**
   - 长期维护的兴趣、资源、收藏集合
   - 不只是链接，而是附带个人说明
   - 支持文章、视频、书籍、工具、资源等类型
   - 收藏标记功能

4. **广场互动**
   - 公开记录展示在广场
   - 点赞功能
   - 评论功能
   - 收藏功能
   - 搜索功能

5. **标签系统**
   - 支持为记录添加标签
   - 热门标签推荐
   - 标签搜索

### 设计原则

- **更新友好**：内容弱结构，支持快速新增、随时修改，不强制一次性整理
- **界面友好**：操作步骤少，首页即可快速记录，支持搜索与标签筛选
- **多租户隔离**：一套系统支持多个私人空间，不同租户数据完全隔离
- **前后端分离**：前端专注展示与交互，后端提供统一 API 服务
- **可持续演进**：允许从"记录"逐步升级为"展示内容"，不因早期设计限制后期扩展

## 技术栈

### 后端
- **框架**：FastAPI (Python 3.8+)
- **数据库**：PostgreSQL
- **ORM**：SQLAlchemy 2.0
- **数据库迁移**：Alembic
- **认证**：JWT (python-jose)
- **密码加密**：Passlib + Bcrypt

### 前端
- **框架**：React 18 + TypeScript
- **构建工具**：Vite
- **路由**：React Router v6
- **状态管理**：Zustand
- **HTTP客户端**：Axios
- **UI样式**：Tailwind CSS

## 项目结构

```
phh/
├── backend/                 # 后端项目
│   ├── app/
│   │   ├── api/            # API路由
│   │   │   ├── auth.py
│   │   │   ├── records.py
│   │   │   ├── experiences.py
│   │   │   ├── collections.py
│   │   │   ├── tags.py
│   │   │   ├── likes.py
│   │   │   └── comments.py
│   │   ├── models/         # 数据库模型
│   │   │   ├── base.py
│   │   │   ├── tenant.py
│   │   │   ├── user.py
│   │   │   ├── record.py
│   │   │   ├── experience.py
│   │   │   ├── collection.py
│   │   │   ├── tag.py
│   │   │   ├── content_tag.py
│   │   │   ├── like.py
│   │   │   └── comment.py
│   │   ├── schemas/        # Pydantic模式
│   │   │   ├── auth.py
│   │   │   ├── record.py
│   │   │   ├── experience.py
│   │   │   ├── collection.py
│   │   │   ├── tag.py
│   │   │   ├── like.py
│   │   │   └── comment.py
│   │   ├── core/           # 核心功能
│   │   │   ├── database.py
│   │   │   ├── security.py
│   │   │   └── tenant.py
│   │   ├── config.py       # 配置
│   │   ├── dependencies.py # 依赖注入
│   │   └── main.py         # 应用入口
│   ├── alembic/            # 数据库迁移
│   │   └── versions/        # 迁移版本
│   ├── venv/              # Python虚拟环境
│   ├── requirements.txt    # Python依赖
│   ├── alembic.ini        # Alembic配置
│   └── .env.example       # 环境变量示例
│
└── frontend/               # 前端项目
    ├── src/
    │   ├── api/            # API调用
    │   │   ├── client.ts
    │   │   ├── auth.ts
    │   │   ├── records.ts
    │   │   ├── experiences.ts
    │   │   ├── collections.ts
    │   │   ├── tags.ts
    │   │   ├── likes.ts
    │   │   └── comments.ts
    │   ├── components/     # 组件
    │   │   ├── layout/
    │   │   │   ├── Header.tsx
    │   │   │   ├── Sidebar.tsx
    │   │   │   ├── Layout.tsx
    │   │   │   └── LoginModal.tsx
    │   │   └── TagInput.tsx
    │   ├── hooks/          # 自定义Hook
    │   │   └── useDraftSave.ts
    │   ├── pages/          # 页面
    │   │   ├── Login.tsx
    │   │   ├── Register.tsx
    │   │   ├── Home.tsx
    │   │   ├── RecordsList.tsx
    │   │   ├── RecordDetail.tsx
    │   │   ├── RecordEdit.tsx
    │   │   ├── TimelineView.tsx
    │   │   ├── ExperienceDetail.tsx
    │   │   ├── ExperienceEdit.tsx
    │   │   ├── CollectionsGrid.tsx
    │   │   ├── CollectionDetail.tsx
    │   │   ├── CollectionEdit.tsx
    │   │   └── Search.tsx
    │   ├── store/          # 状态管理
    │   │   ├── authStore.ts
    │   │   └── uiStore.ts
    │   ├── types/          # TypeScript类型
    │   │   ├── auth.ts
    │   │   ├── record.ts
    │   │   ├── experience.ts
    │   │   ├── collection.ts
    │   │   ├── tag.ts
    │   │   ├── like.ts
    │   │   └── comment.ts
    │   ├── utils/          # 工具函数
    │   │   └── dateUtils.ts
    │   ├── App.tsx
    │   ├── App.css
    │   ├── main.tsx
    │   └── index.css
    ├── public/
    ├── dist/              # 构建输出
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

后端API文档将在 http://localhost:8000/docs 可用

### 3. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端应用将在 http://localhost:5173 可用

### 4. 首次使用

1. 访问 http://localhost:5173/register
2. 注册新账号（需要设置空间标识，用于访问你的私人空间）
3. 登录后即可开始使用

## API文档

启动后端服务后，访问 http://localhost:8000/docs 查看完整的API文档。

### 主要API端点

#### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户信息

#### 记录
- `GET /api/records` - 获取记录列表
- `POST /api/records` - 创建记录
- `GET /api/records/{id}` - 获取记录详情
- `PUT /api/records/{id}` - 更新记录
- `DELETE /api/records/{id}` - 删除记录
- `POST /api/records/{id}/publish` - 发布记录
- `GET /api/records/public` - 获取公开记录（广场）

#### 经历
- `GET /api/experiences` - 获取经历列表
- `POST /api/experiences` - 创建经历
- `GET /api/experiences/{id}` - 获取经历详情
- `PUT /api/experiences/{id}` - 更新经历
- `DELETE /api/experiences/{id}` - 删除经历
- `POST /api/experiences/from-record/{record_id}` - 从记录创建经历

#### 收藏
- `GET /api/collections` - 获取收藏列表
- `POST /api/collections` - 创建收藏
- `GET /api/collections/{id}` - 获取收藏详情
- `PUT /api/collections/{id}` - 更新收藏
- `DELETE /api/collections/{id}` - 删除收藏
- `POST /api/collections/{id}/favorite` - 切换收藏状态

#### 标签
- `GET /api/tags` - 获取标签列表
- `GET /api/tags/popular` - 获取热门标签
- `GET /api/tags/suggest` - 标签建议
- `POST /api/tags` - 创建标签

#### 点赞
- `POST /api/records/{id}/like` - 点赞
- `DELETE /api/records/{id}/like` - 取消点赞
- `GET /api/records/{id}/like/status` - 获取点赞状态

#### 评论
- `POST /api/records/{id}/comments` - 创建评论
- `GET /api/records/{id}/comments` - 获取评论列表
- `DELETE /api/comments/{id}` - 删除评论

## 数据库模型

### 核心表

- **tenants** - 租户表
- **users** - 用户表
- **records** - 记录表
- **experiences** - 经历表
- **collections** - 收藏表
- **tags** - 标签表
- **content_tags** - 内容标签关联表
- **likes** - 点赞表
- **comments** - 评论表

详细的数据库模型定义请参考 `backend/app/models/` 目录。

## 开发指南

### 后端开发

```bash
cd backend

# 运行测试
pytest

# 创建新的数据库迁移
alembic revision --autogenerate -m "description"

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

# 预览生产构建
npm run preview

# 类型检查
npm run type-check
```

## 部署

### Docker 部署（推荐）

使用 Docker Compose 可以快速部署整个应用，包括 PostgreSQL 数据库。

#### 1. 环境准备

确保已安装 Docker 和 Docker Compose。

#### 2. 配置环境变量

```bash
# 复制环境变量示例文件
cp .env.example .env

# 根据需要修改 .env 文件中的配置
```

#### 3. 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

服务将在以下端口运行：
- 前端：http://localhost:3000
- 后端：http://localhost:8000
- 数据库：localhost:5432

#### 4. 初始化数据库

```bash
# 进入后端容器
docker-compose exec backend bash

# 运行数据库迁移
alembic upgrade head

# 退出容器
exit
```

#### 5. 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除所有数据（包括数据库）
docker-compose down -v
```

#### 6. 重新构建

```bash
# 重新构建并启动
docker-compose up -d --build

# 只重新构建特定服务
docker-compose up -d --build backend
```

### 手动部署

#### 后端部署

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 初始化数据库
alembic upgrade head

# 启动服务器
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### 前端部署

构建静态文件并部署到任何静态文件服务器：

```bash
cd frontend
npm install
npm run build
# dist 目录包含构建后的静态文件
```

可以将 dist 目录部署到 Nginx、Apache 或其他静态文件服务器。

### 生产环境建议

1. **修改 SECRET_KEY**：在生产环境中使用强随机密钥
2. **数据库密码**：使用强密码并修改默认配置
3. **HTTPS**：使用反向代理（如 Nginx）配置 SSL/TLS
4. **环境变量**：使用环境变量管理敏感配置
5. **日志管理**：配置日志收集和监控
6. **备份**：定期备份数据库

## 功能亮点

### 自动保存草稿
- 新建记录时自动保存草稿到本地
- 页面刷新后可恢复草稿内容
- 取消时提示是否保存草稿

### 广场互动
- 公开记录展示在广场
- 支持点赞和评论
- 实时更新点赞数和评论数
- 草稿记录不显示互动功能

### 标签系统
- 支持为记录添加多个标签
- 热门标签推荐
- 标签搜索和过滤

### 响应式设计
- 适配桌面和移动设备
- 优雅的UI/UX设计
- 流畅的交互动画

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过 Issue 联系。
