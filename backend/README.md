# PHH Backend

PHH（Personal History Hub）的后端服务，使用 FastAPI + PostgreSQL 构建。

## 技术栈

| 技术 | 用途 | 版本要求 |
|------|------|----------|
| FastAPI | Python Web 框架 | 0.100+ |
| Uvicorn | ASGI 服务器 | - |
| SQLAlchemy 2.0 | ORM | 2.0+ |
| PostgreSQL | 主数据库 | 12+ |
| Alembic | 数据库迁移 | - |
| python-jose | JWT 认证 | - |
| Passlib | 密码加密 | - |
| Bcrypt | 哈希算法 | - |
| WebSocket | 实时通信 | - |
| python-multipart | 文件上传 | - |

## 项目结构

```
backend/
├── app/
│   ├── api/                    # API 路由
│   │   ├── auth.py             # 认证接口
│   │   ├── records.py          # 记录接口
│   │   ├── experiences.py      # 经历接口
│   │   ├── collections.py      # 收藏接口
│   │   ├── tags.py             # 标签接口
│   │   ├── likes.py            # 点赞接口
│   │   ├── comments.py         # 评论接口
│   │   ├── notifications.py    # 通知接口
│   │   ├── users.py            # 用户接口
│   │   ├── search.py           # 搜索接口
│   │   └── __init__.py
│   ├── models/                 # 数据库模型
│   │   ├── base.py             # 基础模型
│   │   ├── tenant.py           # 租户模型
│   │   ├── user.py             # 用户模型
│   │   ├── record.py           # 记录模型
│   │   ├── experience.py       # 经历模型
│   │   ├── collection.py       # 收藏模型
│   │   ├── tag.py              # 标签模型
│   │   ├── content_tag.py      # 内容标签关联
│   │   ├── like.py             # 点赞模型
│   │   ├── comment.py          # 评论模型
│   │   ├── notification.py     # 通知模型
│   │   └── __init__.py
│   ├── schemas/                # Pydantic 模型
│   │   ├── auth.py             # 认证模式
│   │   ├── record.py           # 记录模式
│   │   ├── experience.py       # 经历模式
│   │   ├── collection.py       # 收藏模式
│   │   ├── tag.py              # 标签模式
│   │   ├── like.py             # 点赞模式
│   │   ├── comment.py          # 评论模式
│   │   ├── notification.py     # 通知模式
│   │   ├── user.py             # 用户模式
│   │   └── __init__.py
│   ├── core/                   # 核心功能
│   │   ├── database.py         # 数据库连接
│   │   ├── security.py         # 安全相关
│   │   ├── tenant.py           # 租户管理
│   │   ├── notification.py     # 通知服务
│   │   ├── analytics.py        # 统计服务
│   │   └── __init__.py
│   ├── config.py               # 应用配置
│   ├── dependencies.py         # 依赖注入
│   ├── main.py                 # 应用入口
│   └── __init__.py
├── alembic/                    # 数据库迁移
│   ├── versions/               # 迁移版本文件
│   ├── env.py                  # Alembic 环境配置
│   └── script.py.mako
├── requirements.txt            # Python 依赖
├── alembic.ini                 # Alembic 配置
└── .env.example                # 环境变量示例
```

## 快速开始

### 前置要求

- Python 3.8+
- PostgreSQL 12+
- pip

### 1. 创建虚拟环境

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库配置
DATABASE_URL=postgresql://username:password@localhost:5432/phh

# JWT 配置
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# 应用配置
DEBUG=true
```

### 4. 初始化数据库

```bash
# 创建迁移脚本
alembic revision --autogenerate -m "init"

# 应用迁移
alembic upgrade head
```

### 5. 启动服务器

```bash
# 开发模式（支持热重载）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 生产模式
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 6. 访问 API 文档

启动后访问：http://localhost:8000/docs

## 主要 API 端点

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/logout | 登出 |
| GET | /api/auth/me | 获取当前用户 |
| PUT | /api/auth/password | 修改密码 |

### 记录接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/records | 获取记录列表 |
| POST | /api/records | 创建记录 |
| GET | /api/records/{id} | 获取记录详情 |
| PUT | /api/records/{id} | 更新记录 |
| DELETE | /api/records/{id} | 删除记录 |
| POST | /api/records/{id}/publish | 发布记录 |
| POST | /api/records/{id}/archive | 归档记录 |
| GET | /api/records/public | 获取公开记录（广场） |
| GET | /api/records/{id}/similar | 获取相似记录 |

### 经历接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/experiences | 获取经历列表 |
| POST | /api/experiences | 创建经历 |
| GET | /api/experiences/{id} | 获取经历详情 |
| PUT | /api/experiences/{id} | 更新经历 |
| DELETE | /api/experiences/{id} | 删除经历 |
| POST | /api/experiences/from-record/{record_id} | 从记录创建经历 |
| GET | /api/experiences/timeline | 获取时间轴视图 |

### 收藏接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/collections | 获取收藏列表 |
| POST | /api/collections | 创建收藏 |
| GET | /api/collections/{id} | 获取收藏详情 |
| PUT | /api/collections/{id} | 更新收藏 |
| DELETE | /api/collections/{id} | 删除收藏 |
| POST | /api/collections/collect/{type}/{id} | 收藏内容 |
| DELETE | /api/collections/uncollect/{type}/{id} | 取消收藏 |
| GET | /api/collections/my | 获取我的收藏 |

### 标签接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/tags | 获取标签列表 |
| GET | /api/tags/popular | 获取热门标签 |
| GET | /api/tags/suggest | 标签建议 |
| POST | /api/tags | 创建标签 |
| DELETE | /api/tags/{id} | 删除标签 |

### 点赞接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/likes/records/{id} | 点赞记录 |
| DELETE | /api/likes/records/{id} | 取消点赞 |
| POST | /api/likes/comments/{id} | 点赞评论 |
| DELETE | /api/likes/comments/{id} | 取消点赞评论 |
| GET | /api/likes/status/{type}/{id} | 获取点赞状态 |
| GET | /api/likes/count/{type}/{id} | 获取点赞数 |

### 评论接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/comments/{type}/{id} | 创建评论 |
| GET | /api/comments/{type}/{id} | 获取评论列表 |
| PUT | /api/comments/{id} | 更新评论 |
| DELETE | /api/comments/{id} | 删除评论 |

### 通知接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/notifications | 获取通知列表 |
| GET | /api/notifications/unread-count | 获取未读数 |
| POST | /api/notifications/{id}/read | 标记已读 |
| POST | /api/notifications/read-all | 全部已读 |
| DELETE | /api/notifications/{id} | 删除通知 |
| GET | /api/notifications/settings | 获取通知设置 |
| PUT | /api/notifications/settings | 更新通知设置 |

### 用户接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/users/profile | 获取用户资料 |
| PUT | /api/users/profile | 更新用户资料 |
| GET | /api/users/{id} | 获取用户信息 |
| GET | /api/users/{id}/records | 获取用户记录 |

### 搜索接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/search | 综合搜索 |
| GET | /api/search/records | 搜索记录 |
| GET | /api/search/experiences | 搜索经历 |
| GET | /api/search/collections | 搜索收藏 |

## 数据库模型

### 核心模型

#### Tenants（租户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | String | 租户名称 |
| slug | String | 唯一标识符 |
| created_at | DateTime | 创建时间 |

#### Users（用户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| tenant_id | UUID | 租户 ID |
| email | String | 邮箱（唯一） |
| username | String | 用户名 |
| hashed_password | String | 加密密码 |
| avatar | String | 头像 URL |
| bio | String | 个人简介 |
| is_active | Boolean | 是否激活 |
| created_at | DateTime | 创建时间 |

#### Records（记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 作者 ID |
| title | String | 标题 |
| content | Text | 内容（HTML 格式） |
| record_type | Enum | 类型（碎碎念、日志、想法） |
| status | Enum | 状态（草稿、已发布、已归档） |
| is_public | Boolean | 是否公开 |
| view_count | Integer | 浏览次数 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

#### Experiences（经历表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 作者 ID |
| title | String | 标题 |
| description | Text | 描述 |
| experience_type | Enum | 类型（工作、项目、教育、里程碑） |
| start_date | Date | 开始日期 |
| end_date | Date | 结束日期 |
| is_current | Boolean | 是否正在进行 |
| organization | String | 组织/公司 |
| location | String | 地点 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

#### Collections（收藏表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 作者 ID |
| title | String | 标题 |
| description | Text | 描述 |
| url | String | 资源 URL |
| collection_type | Enum | 类型（文章、视频、书籍、工具、资源） |
| image_url | String | 封面图 |
| tags | Array | 标签列表 |
| is_favorite | Boolean | 是否收藏 |
| created_at | DateTime | 创建时间 |

#### Tags（标签表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| tenant_id | UUID | 租户 ID |
| name | String | 标签名 |
| slug | String | 标签 slug |
| usage_count | Integer | 使用次数 |
| created_at | DateTime | 创建时间 |

#### Likes（点赞表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 ID |
| target_type | Enum | 目标类型（record、comment） |
| target_id | UUID | 目标 ID |
| created_at | DateTime | 创建时间 |

#### Comments（评论表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 ID |
| target_type | Enum | 目标类型（record） |
| target_id | UUID | 目标 ID |
| content | String | 评论内容 |
| parent_id | UUID | 父评论 ID |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

#### Notifications（通知表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 接收用户 ID |
| notification_type | Enum | 类型（like、comment、follow） |
| target_type | Enum | 目标类型 |
| target_id | UUID | 目标 ID |
| actor_id | UUID | 触发用户 ID |
| content | String | 通知内容 |
| is_read | Boolean | 是否已读 |
| created_at | DateTime | 创建时间 |

## 开发指南

### 添加新模型

1. 在 `app/models/` 创建模型文件
2. 在 `app/schemas/` 创建 Pydantic 模式
3. 在 `app/api/` 创建 API 路由
4. 注册到 `app/main.py`

### 数据库迁移

```bash
# 创建迁移
alembic revision --autogenerate -m "描述"

# 应用迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1

# 查看迁移历史
alembic history
```

### 运行测试

```bash
# 运行所有测试
pytest

# 运行指定测试
pytest tests/test_auth.py

# 生成覆盖率报告
pytest --cov=app --cov-report=html
```

### 代码规范

```bash
# 代码格式化
black .

# 导入排序
isort .

# 类型检查
mypy .
```

## 认证与安全

### JWT Token

```python
from app.core.security import create_access_token

token = create_access_token(data={"sub": user_id})
```

### 密码加密

```python
from app.core.security import get_password_hash, verify_password

hashed = get_password_hash(password)
verify = verify_password(password, hashed)
```

### 当前用户依赖

```python
from app.dependencies import get_current_user

@router.get("/me")
async def get_me(current_user = Depends(get_current_user)):
    return current_user
```

## WebSocket 实时通知

### 连接 WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/notifications');

ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  console.log('收到通知:', notification);
};
```

### 后端推送通知

```python
from app.core.notification import NotificationService

await NotificationService.send_to_user(
    user_id=user_id,
    notification_type="like",
    target_type="record",
    target_id=record_id,
    actor_id=actor_id
)
```

## 部署

### 使用 Gunicorn

```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 使用 Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name localhost;

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 生产环境配置

```env
# 数据库
DATABASE_URL=postgresql://user:pass@localhost:5432/phh

# JWT
SECRET_KEY=<强随机密钥>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# 应用
DEBUG=false
```

## 注意事项

1. 所有 API 都需要认证（除登录、注册外）
2. Token 放在 Header：`Authorization: Bearer <token>`
3. 数据库连接使用异步驱动
4. WebSocket 连接需要认证 Token
5. 文件上传大小限制：10MB
