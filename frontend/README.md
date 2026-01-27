# PHH Frontend

PHH (Personal History Hub) 的前端应用，使用 React + TypeScript + Vite 构建。

## 技术栈

- **框架**：React 18 + TypeScript
- **构建工具**：Vite
- **路由**：React Router v6
- **状态管理**：Zustand
- **HTTP客户端**：Axios
- **UI样式**：Tailwind CSS

## 项目结构

```
src/
├── api/                # API调用封装
│   ├── client.ts        # Axios客户端配置
│   ├── auth.ts         # 认证相关API
│   ├── records.ts      # 记录相关API
│   ├── experiences.ts  # 经历相关API
│   ├── collections.ts   # 收藏相关API
│   ├── tags.ts        # 标签相关API
│   ├── likes.ts       # 点赞相关API
│   └── comments.ts     # 评论相关API
├── components/         # React组件
│   ├── layout/        # 布局组件
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Layout.tsx
│   │   └── LoginModal.tsx
│   └── TagInput.tsx  # 标签输入组件
├── hooks/             # 自定义Hook
│   └── useDraftSave.ts # 草稿自动保存Hook
├── pages/             # 页面组件
│   ├── Home.tsx               # 首页（广场）
│   ├── RecordsList.tsx         # 记录列表
│   ├── RecordDetail.tsx        # 记录详情
│   ├── RecordEdit.tsx          # 记录编辑/新建
│   ├── TimelineView.tsx        # 时间轴视图
│   ├── ExperienceDetail.tsx     # 经历详情
│   ├── ExperienceEdit.tsx       # 经历编辑/新建
│   ├── CollectionsGrid.tsx      # 收藏网格
│   ├── CollectionDetail.tsx     # 收藏详情
│   ├── CollectionEdit.tsx       # 收藏编辑/新建
│   ├── Search.tsx             # 搜索页面
│   ├── Login.tsx              # 登录页面
│   └── Register.tsx           # 注册页面
├── store/             # Zustand状态管理
│   ├── authStore.ts    # 认证状态
│   └── uiStore.ts      # UI状态
├── types/             # TypeScript类型定义
│   ├── auth.ts
│   ├── record.ts
│   ├── experience.ts
│   ├── collection.ts
│   ├── tag.ts
│   ├── like.ts
│   └── comment.ts
├── utils/             # 工具函数
│   └── dateUtils.ts   # 日期格式化
├── App.tsx            # 应用主组件
├── main.tsx           # 应用入口
├── App.css            # 全局样式
└── index.css          # Tailwind样式
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

构建产物将输出到 `dist` 目录。

### 预览生产构建

```bash
npm run preview
```

### 类型检查

```bash
npm run type-check
```

## 主要功能

### 1. 认证系统
- 用户注册和登录
- JWT Token 认证
- 自动刷新 Token
- 登录状态持久化

### 2. 记录管理
- 快速记录想法、日志
- 支持草稿、发布、归档状态
- 自动保存草稿功能
- 标签管理
- 记录编辑和删除

### 3. 经历管理
- 时间轴展示
- 从记录创建经历
- 经历编辑和删除

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
- 热门标签推荐

### 6. 响应式设计
- 适配桌面和移动设备
- 优雅的UI/UX设计
- 流畅的交互动画

## 环境变量

前端通过 Vite proxy 与后端通信，无需额外配置环境变量。

后端 API 地址配置在 `vite.config.ts` 中：

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

## 路由说明

- `/` - 首页（广场）
- `/login` - 登录
- `/register` - 注册
- `/records` - 记录列表
- `/records/new` - 新建记录
- `/records/:id` - 记录详情
- `/records/:id/edit` - 编辑记录
- `/experiences` - 经历时间轴
- `/experiences/new` - 新建经历
- `/experiences/:id` - 经历详情
- `/experiences/:id/edit` - 编辑经历
- `/collections` - 收藏列表
- `/collections/new` - 新建收藏
- `/collections/:id` - 收藏详情
- `/collections/:id/edit` - 编辑收藏
- `/search` - 搜索

## 组件说明

### 布局组件
- **Layout** - 主布局容器
- **Header** - 顶部导航栏
- **Sidebar** - 侧边栏导航
- **LoginModal** - 登录弹窗

### 功能组件
- **TagInput** - 标签输入组件，支持回车添加、删除标签

## Hooks 说明

### useDraftSave
自动保存草稿到 localStorage 的 Hook：

```typescript
const draft = useRecordDraft();

// 保存草稿
draft.save({ title, content, tags, recordType });

// 清除草稿
draft.clear();

// 检查是否有草稿
if (draft.hasDraft) {
  // 恢复草稿
  const data = draft.data;
}
```

## 状态管理

使用 Zustand 进行状态管理：

### authStore
- 用户认证状态
- Token 管理
- 登录/登出方法

### uiStore
- UI 相关状态
- 全局加载状态
- 提示信息管理

## 开发建议

1. **代码规范**
   - 使用 TypeScript 严格模式
   - 遵循 React Hooks 规范
   - 组件使用函数式组件

2. **样式规范**
   - 使用 Tailwind CSS 类名
   - 保持样式一致性
   - 响应式设计优先

3. **API 调用**
   - 使用封装好的 API 函数
   - 统一错误处理
   - 使用 Axios 拦截器处理 Token

## 构建部署

构建完成后，将 `dist` 目录部署到任何静态文件服务器（如 Nginx、Apache 等）。

## 注意事项

1. 所有 API 请求都会自动添加 Authorization Header
2. Token 过期会自动跳转到登录页
3. 草稿数据保存在 localStorage 中
4. 使用 Vite proxy 解决跨域问题
