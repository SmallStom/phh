# PHH Frontend

PHH（Personal History Hub）的前端应用，使用 React + TypeScript + Vite 构建。

## 技术栈

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
| Lucide React | 图标库 |
| date-fns | 日期处理 |

## 项目结构

```
src/
├── api/                     # API 调用封装
│   ├── client.ts            # Axios 客户端配置
│   ├── auth.ts              # 认证相关 API
│   ├── records.ts           # 记录相关 API
│   ├── experiences.ts       # 经历相关 API
│   ├── collections.ts       # 收藏相关 API
│   ├── tags.ts              # 标签相关 API
│   ├── likes.ts             # 点赞相关 API
│   ├── comments.ts          # 评论相关 API
│   └── notifications.ts     # 通知相关 API
├── components/              # React 组件
│   ├── layout/              # 布局组件
│   │   ├── Header.tsx       # 顶部导航栏
│   │   ├── Sidebar.tsx      # 侧边栏
│   │   └── Layout.tsx       # 主布局
│   ├── notifications/       # 通知组件
│   │   ├── NotificationBell.tsx     # 通知铃铛
│   │   └── NotificationCenter.tsx   # 通知中心
│   ├── RichTextEditor.tsx   # 富文本编辑器
│   ├── HtmlContent.tsx      # HTML 内容渲染
│   ├── TagInput.tsx         # 标签输入组件
│   ├── HotContent.tsx       # 热门内容
│   ├── CommentModal.tsx     # 评论弹窗
│   ├── LoginModal.tsx       # 登录弹窗
│   ├── LoadingState.tsx     # 加载状态
│   ├── EmptyState.tsx       # 空状态
│   └── Skeleton.tsx         # 骨架屏
├── hooks/                   # 自定义 Hook
│   └── useDraftSave.ts      # 草稿自动保存
├── pages/                   # 页面组件
│   ├── Home.tsx             # 首页（广场）
│   ├── Login.tsx            # 登录页面
│   ├── Register.tsx         # 注册页面
│   ├── RecordsList.tsx      # 记录列表
│   ├── RecordDetail.tsx     # 记录详情
│   ├── RecordEdit.tsx       # 记录编辑/新建
│   ├── TimelineView.tsx     # 时间轴视图
│   ├── ExperienceDetail.tsx # 经历详情
│   ├── ExperienceEdit.tsx   # 经历编辑/新建
│   ├── CollectionsGrid.tsx  # 收藏网格
│   ├── CollectionDetail.tsx # 收藏详情
│   ├── CollectionEdit.tsx   # 收藏编辑/新建
│   └── Search.tsx           # 搜索页面
├── store/                   # Zustand 状态管理
│   └── authStore.ts         # 认证状态
├── types/                   # TypeScript 类型定义
│   ├── auth.ts
│   ├── record.ts
│   ├── experience.ts
│   ├── collection.ts
│   ├── tag.ts
│   ├── like.ts
│   ├── comment.ts
│   └── notification.ts
├── services/                # 服务层
│   └── websocket.ts         # WebSocket 客户端
├── utils/                   # 工具函数
│   ├── dateUtils.ts         # 日期格式化
│   └── time.ts              # 时间处理
├── App.tsx                  # 应用主组件
├── main.tsx                 # 应用入口
├── App.css                  # 全局样式
└── index.css                # Tailwind 样式
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 http://localhost:5173 运行

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist` 目录

### 预览生产构建

```bash
npm run preview
```

## 主要功能

### 1. 认证系统

- 用户注册和登录
- JWT Token 认证
- 自动刷新 Token
- 登录状态持久化

### 2. 记录管理

- 富文本编辑器（TipTap）
- Markdown 格式渲染
- 支持草稿、发布、归档状态
- 自动保存草稿功能
- 标签管理
- 图片上传支持
- 记录编辑和删除

### 3. 经历管理

- 时间轴展示
- 从记录创建经历
- 经历编辑和删除
- 分类支持（工作、项目、教育、里程碑）

### 4. 收藏管理

- 网格展示
- 从记录/经历创建收藏
- 收藏编辑和删除
- 收藏标记功能

### 5. 广场互动

- 公开记录展示
- 点赞功能
- 评论功能
- 搜索功能
- 热门内容推荐

### 6. 通知系统

- 实时通知铃铛
- 通知列表
- 未读消息计数
- WebSocket 实时推送

### 7. 响应式设计

- 适配桌面和移动设备
- 优雅的 UI/UX 设计
- 流畅的交互动画
- 深色模式支持

## 环境变量

前端通过 Vite proxy 与后端通信。

在 `vite.config.ts` 中配置代理：

```typescript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    }
  }
}
```

环境变量类型定义在 `src/vite-env.d.ts`：

```typescript
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
}
```

## 路由说明

| 路径 | 页面 |
|------|------|
| `/` | 首页（广场） |
| `/login` | 登录 |
| `/register` | 注册 |
| `/records` | 记录列表 |
| `/records/new` | 新建记录 |
| `/records/:id` | 记录详情 |
| `/records/:id/edit` | 编辑记录 |
| `/records/:id/collections` | 记录收藏 |
| `/experiences` | 经历时间轴 |
| `/experiences/new` | 新建经历 |
| `/experiences/:id` | 经历详情 |
| `/experiences/:id/edit` | 编辑经历 |
| `/collections` | 收藏列表 |
| `/collections/new` | 新建收藏 |
| `/collections/:id` | 收藏详情 |
| `/collections/:id/edit` | 编辑收藏 |
| `/search` | 搜索 |

## 组件说明

### 布局组件

| 组件 | 说明 |
|------|------|
| Layout | 主布局容器 |
| Header | 顶部导航栏，包含通知铃铛 |
| Sidebar | 侧边栏导航 |

### 功能组件

| 组件 | 说明 |
|------|------|
| RichTextEditor | 富文本编辑器（TipTap） |
| HtmlContent | HTML/Markdown 内容渲染 |
| TagInput | 标签输入组件，支持回车添加、删除 |
| NotificationBell | 通知铃铛图标 |
| NotificationCenter | 通知中心面板 |
| CommentModal | 评论弹窗 |
| LoginModal | 登录弹窗 |

## Hooks 说明

### useDraftSave

自动保存草稿到 localStorage 的 Hook：

```typescript
// 记录草稿
const recordDraft = useRecordDraft(recordId);

// 经历草稿
const experienceDraft = useExperienceDraft(experienceId);

// 保存草稿
recordDraft.save({ title, content, tags, recordType });

// 清除草稿
recordDraft.clear();

// 检查是否有草稿
if (recordDraft.hasDraft) {
  const data = recordDraft.data;
}
```

### useWebSocket

WebSocket 连接 Hook：

```typescript
const { isConnected, lastMessage, sendMessage } = useWebSocket();

// 发送消息
sendMessage({ action: 'mark_read', notification_id: '123' });
```

## 状态管理

使用 Zustand 进行状态管理。

### authStore

```typescript
const { isAuthenticated, user, token, login, logout } = useAuthStore();
```

- 用户认证状态
- Token 管理
- 登录/登出方法
- 初始化认证

## 开发建议

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 React Hooks 规范
- 组件使用函数式组件
- 组件文件以 `.tsx` 结尾

### 样式规范

- 使用 Tailwind CSS 类名
- 保持样式一致性
- 响应式设计优先
- 使用 CSS 变量支持深色模式

```css
:root {
  --bg-primary: #fdfbf7;
  --text-primary: #2d2a26;
  --accent-color: #c55d3d;
}

.dark {
  --bg-primary: #1a1816;
  --text-primary: #f5f3ef;
}
```

### API 调用

- 使用封装好的 API 函数
- 统一错误处理
- 使用 Axios 拦截器自动添加 Token

```typescript
// API 请求拦截器自动添加 Authorization
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 构建部署

构建完成后，将 `dist` 目录部署到任何静态文件服务器（如 Nginx、Apache、Vercel、Netlify 等）。

## 注意事项

1. 所有 API 请求都会自动添加 Authorization Header
2. Token 过期会自动跳转到登录页
3. 草稿数据保存在 localStorage 中
4. 使用 Vite proxy 解决跨域问题
5. 通知支持 WebSocket 实时推送
