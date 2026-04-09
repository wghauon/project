# 在线教育平台功能规格说明书

## 1. 项目概述

基于 Node.js + Vue + MySQL 8.0 开发的仿学习通在线教育平台，面向学生、教师、管理员三类用户。

### 技术栈
- **前端**: Vue 3 + Vite + Pinia + Vue Router
- **后端**: Node.js + Express
- **数据库**: MySQL 8.0
- **样式**: 原生 CSS，不使用 Element Plus 等 UI 库，保持风格一致性

### 设计风格
- 主色调: `#667eea` (紫色) 到 `#764ba2` (深紫) 渐变
- 背景色: `#f5f7fa` (浅灰)
- 卡片圆角: `12px`
- 按钮圆角: `8px`
- 阴影: `0 4px 12px rgba(0,0,0,0.08)`

---

## 2. 当前实现状态分析

### 2.1 已实现功能

| 功能模块 | 实现状态 | 问题说明 |
|---------|---------|---------|
| 用户注册 | ✅ 已实现 | 缺少密码加密、表单验证不完善 |
| 用户登录 | ✅ 已实现 | 缺少密码加密比对、缺少记住密码功能 |
| 课程创建 | ✅ 已实现 | 缺少分类联动、权限设置未保存到数据库 |
| 视频上传 | ✅ 已实现 | 分片上传功能完成，但表单信息不完整 |

### 2.2 发现的问题

1. **安全问题**: 密码明文存储，未使用 bcrypt 加密
2. **数据库字段缺失**: 
   - courses 表缺少 `is_public`, `max_students`, `semester`, `start_time`, `end_time` 等字段
   - 缺少课程资料表、通知表、讨论表、实验表、考试表等
3. **前端问题**: 
   - CreateCourse.vue 中权限设置使用原生 radio，未绑定数据
   - VideoUpload.vue 中章节选择被注释
4. **API 问题**: 
   - 登录接口返回的 role 未在响应中体现
   - 缺少课程分类的完整 CRUD

---

## 3. 功能模块详细规格

### 3.1 公共模块

#### 3.1.1 登录页面 (/login)
- **功能**: 用户登录
- **角色**: 学生(1)、教师(2)、管理员(3)
- **表单字段**: 用户名、密码、角色选择
- **交互**: 角色切换高亮、登录成功后跳转到对应首页
- **API**: POST /api/login

#### 3.1.2 注册页面 (/register)
- **功能**: 用户注册
- **角色**: 学生(1)、教师(2)
- **表单字段**: 用户名、真实姓名、学号/工号、手机号、邮箱、密码、确认密码、院系
- **验证**: 密码长度6-20位、手机号格式、邮箱格式
- **API**: POST /api/register

#### 3.1.3 首页/课程广场 (/)
- **功能**: 展示所有公开课程
- **筛选**: 按分类、难度、状态筛选
- **搜索**: 课程名称搜索
- **卡片展示**: 封面、课程名、教师、学生数、评分

---

### 3.2 学生端模块

#### 3.2.1 我的课程 (/student/my-courses)
- **功能**: 展示学生已加入的课程
- **标签页**: 全部、进行中、已结束
- **卡片信息**: 课程封面、名称、教师、学习进度百分比
- **操作**: 继续学习、查看详情

#### 3.2.2 课程学习 (/student/course-study/:courseId)
- **功能**: 视频播放学习
- **布局**: 左侧视频播放区 + 右侧章节列表 + 下方评论区
- **视频播放**: 支持进度记录、倍速播放
- **章节列表**: 展示课程所有章节和视频，标记已完成
- **学习资料**: 可下载教师上传的资料
- **评论功能**: 发布评论、回复评论、点赞
- **点赞功能**: 视频点赞

#### 3.2.3 考试中心 (/student/exams)
- **功能**: 展示待考试和已完成的考试
- **考试页面**: 倒计时、单选/多选/判断题、自动提交
- **成绩查看**: 答题结果、正确答案、得分

#### 3.2.4 实验任务 (/student/experiments)
- **功能**: 查看实验任务书、上传实验报告
- **状态**: 待完成、已提交、已批改

#### 3.2.5 流程图工具 (/student/flowchart)
- **功能**: 在线绘制流程图
- **工具**: 拖拽式节点、连接线、保存/导出图片

#### 3.2.6 通知中心 (/student/notifications)
- **功能**: 查看课程通知和系统公告
- **标记**: 已读/未读

#### 3.2.7 讨论区 (/student/discussions)
- **功能**: 参与课程讨论
- **操作**: 发起讨论、回复、点赞

---

### 3.3 教师端模块

#### 3.3.1 我的教学 (/teacher/my-teaching)
- **功能**: 教师课程概览
- **统计卡片**: 在授课程数、学生总数、待批改作业、新讨论
- **课程列表**: 课程卡片展示，快捷管理入口

#### 3.3.2 创建课程 (/teacher/create-course)
- **功能**: 创建新课程
- **表单字段**:
  - 课程封面（图片上传）
  - 课程名称、分类、类型、难度
  - 课程简介
  - 开课/结课时间
  - 预计课时、学分
  - 加入权限（公开/申请/邀请码/暂不开放）
- **API**: POST /teacher/upload

#### 3.3.3 课程管理 (/teacher/course-manage/:courseId)
- **布局**: 左侧菜单 + 右侧内容区
- **子功能**:
  - **章节管理**: 添加/编辑/删除章节，添加课时
  - **视频管理**: 上传/编辑/删除视频，查看播放数据
  - **资料管理**: 上传/删除课程资料
  - **作业管理**: 发布/编辑/删除作业，查看提交
  - **通知管理**: 发布/编辑/删除课程通知
  - **讨论管理**: 查看/回复/删除讨论
  - **实验管理**: 发布实验任务，查看实验报告
  - **数据统计**: 学生学习数据、视频观看数据

#### 3.3.4 视频上传 (/teacher/video-upload/:courseId)
- **功能**: 分片上传大视频文件
- **步骤**: 选择文件 → 填写信息 → 上传处理 → 完成
- **表单字段**: 视频标题、所属章节、视频简介、封面
- **技术**: 分片上传、断点续传、合并文件

#### 3.3.5 考试管理 (/teacher/exam-manage)
- **功能**: 创建和管理考试
- **题型**: 单选题、多选题、判断题
- **自动批改**: 客观题自动计算分数
- **发布**: 设置考试时间、时长、参与班级

#### 3.3.6 学生管理 (/teacher/student-manage)
- **功能**: 管理课程学生
- **操作**: 查看学生列表、审核加入申请、移除学生
- **统计**: 学习进度、成绩统计

---

### 3.4 管理员端模块

#### 3.4.1 仪表盘 (/admin/dashboard)
- **功能**: 系统数据概览
- **统计**: 用户总数、课程总数、视频总数、今日活跃

#### 3.4.2 系统公告 (/admin/announcements)
- **功能**: 发布/编辑/删除系统公告
- **字段**: 标题、内容、发布时间、置顶

#### 3.4.3 课程审核 (/admin/course-review)
- **功能**: 审核教师创建的课程
- **操作**: 通过/驳回，填写审核备注

#### 3.4.4 用户管理 (/admin/user-manage)
- **功能**: 管理系统用户
- **操作**: 创建账号、修改密码、注销账号、启用/禁用

#### 3.4.5 数据导出 (/admin/data-export)
- **功能**: 导出系统数据
- **类型**: 用户数据、课程数据、学习数据

---

## 4. 数据库表结构补充

### 4.1 需要新增/修改的表

#### 修改 courses 表
```sql
-- 新增字段
ALTER TABLE courses ADD COLUMN start_time datetime DEFAULT NULL COMMENT '开课时间';
ALTER TABLE courses ADD COLUMN end_time datetime DEFAULT NULL COMMENT '结课时间';
ALTER TABLE courses ADD COLUMN join_type tinyint DEFAULT 1 COMMENT '加入方式：1公开/2申请/3邀请码/4关闭';
ALTER TABLE courses ADD COLUMN invite_code varchar(20) DEFAULT NULL COMMENT '邀请码';
```

#### 新增通知表 (notifications)
```sql
CREATE TABLE notifications (
    notification_id bigint NOT NULL AUTO_INCREMENT,
    title varchar(100) NOT NULL,
    content text,
    type tinyint DEFAULT 1 COMMENT '1系统公告/2课程通知',
    course_id bigint DEFAULT NULL,
    sender_id bigint DEFAULT NULL,
    created_at datetime DEFAULT NULL,
    PRIMARY KEY (notification_id)
);
```

#### 新增讨论表 (discussions)
```sql
CREATE TABLE discussions (
    discussion_id bigint NOT NULL AUTO_INCREMENT,
    course_id bigint NOT NULL,
    user_id bigint NOT NULL,
    parent_id bigint DEFAULT NULL COMMENT '父讨论ID，NULL为顶级',
    title varchar(200) DEFAULT NULL,
    content text NOT NULL,
    likes int DEFAULT 0,
    created_at datetime DEFAULT NULL,
    PRIMARY KEY (discussion_id)
);
```

#### 新增课程资料表 (materials)
```sql
CREATE TABLE materials (
    material_id bigint NOT NULL AUTO_INCREMENT,
    course_id bigint NOT NULL,
    file_name varchar(100) NOT NULL,
    file_url varchar(255) NOT NULL,
    file_size bigint DEFAULT NULL,
    file_type varchar(50) DEFAULT NULL,
    uploaded_by bigint DEFAULT NULL,
    created_at datetime DEFAULT NULL,
    PRIMARY KEY (material_id)
);
```

#### 新增实验表 (experiments)
```sql
CREATE TABLE experiments (
    experiment_id bigint NOT NULL AUTO_INCREMENT,
    course_id bigint NOT NULL,
    title varchar(100) NOT NULL,
    description text,
    task_file_url varchar(255) DEFAULT NULL,
    deadline datetime DEFAULT NULL,
    created_at datetime DEFAULT NULL,
    PRIMARY KEY (experiment_id)
);
```

#### 新增实验提交表 (experiment_submissions)
```sql
CREATE TABLE experiment_submissions (
    submission_id bigint NOT NULL AUTO_INCREMENT,
    experiment_id bigint NOT NULL,
    student_id bigint NOT NULL,
    report_file_url varchar(255) NOT NULL,
    score decimal(5,2) DEFAULT NULL,
    feedback text,
    status tinyint DEFAULT 0 COMMENT '0待批改/1已批改',
    submitted_at datetime DEFAULT NULL,
    PRIMARY KEY (submission_id)
);
```

#### 新增考试表 (exams)
```sql
CREATE TABLE exams (
    exam_id bigint NOT NULL AUTO_INCREMENT,
    course_id bigint NOT NULL,
    title varchar(100) NOT NULL,
    description text,
    duration int DEFAULT NULL COMMENT '考试时长（分钟）',
    start_time datetime DEFAULT NULL,
    end_time datetime DEFAULT NULL,
    total_score decimal(5,1) DEFAULT NULL,
    status tinyint DEFAULT 0 COMMENT '0草稿/1已发布/2进行中/3已结束',
    created_at datetime DEFAULT NULL,
    PRIMARY KEY (exam_id)
);
```

#### 新增考试题目表 (exam_questions)
```sql
CREATE TABLE exam_questions (
    question_id bigint NOT NULL AUTO_INCREMENT,
    exam_id bigint NOT NULL,
    question_type tinyint NOT NULL COMMENT '1单选/2多选/3判断',
    question_text text NOT NULL,
    options json DEFAULT NULL COMMENT '选项JSON',
    correct_answer varchar(255) DEFAULT NULL,
    score decimal(3,1) DEFAULT NULL,
    sort_order int DEFAULT NULL,
    PRIMARY KEY (question_id)
);
```

#### 新增考试记录表 (exam_records)
```sql
CREATE TABLE exam_records (
    record_id bigint NOT NULL AUTO_INCREMENT,
    exam_id bigint NOT NULL,
    student_id bigint NOT NULL,
    answers json DEFAULT NULL COMMENT '答题JSON',
    score decimal(5,1) DEFAULT NULL,
    status tinyint DEFAULT 0 COMMENT '0进行中/1已提交',
    start_time datetime DEFAULT NULL,
    submit_time datetime DEFAULT NULL,
    PRIMARY KEY (record_id)
);
```

#### 新增评论表 (comments)
```sql
CREATE TABLE comments (
    comment_id bigint NOT NULL AUTO_INCREMENT,
    video_id bigint NOT NULL,
    user_id bigint NOT NULL,
    parent_id bigint DEFAULT NULL COMMENT '父评论ID',
    content text NOT NULL,
    likes int DEFAULT 0,
    created_at datetime DEFAULT NULL,
    PRIMARY KEY (comment_id)
);
```

---

## 5. API 接口规格

### 5.1 用户模块

| 接口 | 方法 | 路径 | 描述 |
|-----|------|------|------|
| 注册 | POST | /api/register | 用户注册 |
| 登录 | POST | /api/login | 用户登录 |
| 获取用户信息 | GET | /api/user/info | 获取当前用户信息 |
| 修改密码 | POST | /api/user/password | 修改密码 |

### 5.2 课程模块

| 接口 | 方法 | 路径 | 描述 |
|-----|------|------|------|
| 创建课程 | POST | /teacher/upload | 创建课程 |
| 课程列表 | GET | /teacher/course_list | 获取教师课程列表 |
| 课程详情 | GET | /teacher/course_detail | 获取课程详情 |
| 更新课程 | PUT | /teacher/course/:id | 更新课程信息 |
| 删除课程 | DELETE | /teacher/course/:id | 删除课程 |
| 公开课程列表 | GET | /api/courses | 获取公开课程列表 |
| 加入课程 | POST | /api/course/join | 学生加入课程 |

### 5.3 视频模块

| 接口 | 方法 | 路径 | 描述 |
|-----|------|------|------|
| 视频列表 | GET | /teacher/video_list | 获取课程视频列表 |
| 视频详情 | GET | /teacher/video_url | 获取视频播放URL |
| 检查分片 | GET | /teacher/chunk_exist | 检查分片是否存在 |
| 上传分片 | POST | /teacher/chunk | 上传视频分片 |
| 合并分片 | POST | /teacher/chunkMerge | 合并视频分片 |
| 删除视频 | DELETE | /teacher/video/:id | 删除视频 |
| 更新视频 | PUT | /teacher/video/:id | 更新视频信息 |

### 5.4 章节模块

| 接口 | 方法 | 路径 | 描述 |
|-----|------|------|------|
| 章节列表 | GET | /api/chapters | 获取课程章节列表 |
| 创建章节 | POST | /teacher/chapter | 创建章节 |
| 更新章节 | PUT | /teacher/chapter/:id | 更新章节 |
| 删除章节 | DELETE | /teacher/chapter/:id | 删除章节 |

### 5.5 讨论模块

| 接口 | 方法 | 路径 | 描述 |
|-----|------|------|------|
| 讨论列表 | GET | /api/discussions | 获取讨论列表 |
| 创建讨论 | POST | /api/discussion | 创建讨论 |
| 回复讨论 | POST | /api/discussion/reply | 回复讨论 |
| 点赞讨论 | POST | /api/discussion/like | 点赞讨论 |

### 5.6 通知模块

| 接口 | 方法 | 路径 | 描述 |
|-----|------|------|------|
| 通知列表 | GET | /api/notifications | 获取通知列表 |
| 创建通知 | POST | /teacher/notification | 创建通知 |
| 删除通知 | DELETE | /teacher/notification/:id | 删除通知 |

### 5.7 考试模块

| 接口 | 方法 | 路径 | 描述 |
|-----|------|------|------|
| 考试列表 | GET | /api/exams | 获取考试列表 |
| 创建考试 | POST | /teacher/exam | 创建考试 |
| 添加题目 | POST | /teacher/exam/question | 添加考试题目 |
| 提交答卷 | POST | /api/exam/submit | 提交考试答卷 |
| 考试结果 | GET | /api/exam/result | 获取考试结果 |

---

## 6. 路由结构

```
/                    # 首页/课程广场
/login               # 登录
/register            # 注册

/student             # 学生端首页
/student/my-courses  # 我的课程
/student/course-study/:courseId  # 课程学习
/student/exams       # 考试中心
/student/experiments # 实验任务
/student/flowchart   # 流程图工具
/student/notifications # 通知中心
/student/discussions # 讨论区

/teacher             # 教师端首页
/teacher/my-teaching # 我的教学
/teacher/create-course # 创建课程
/teacher/course-manage/:courseId # 课程管理
/teacher/video-upload/:courseId # 视频上传
/teacher/exam-manage # 考试管理
/teacher/student-manage # 学生管理

/admin               # 管理员端首页
/admin/dashboard     # 仪表盘
/admin/announcements # 系统公告
/admin/course-review # 课程审核
/admin/user-manage   # 用户管理
/admin/data-export   # 数据导出
```

---

## 7. 组件清单

### 7.1 布局组件
- `TeacherNavigator` - 教师端顶部导航
- `StudentNavigator` - 学生端顶部导航
- `AdminNavigator` - 管理员端顶部导航
- `TeacherSideMenu` - 教师端侧边菜单

### 7.2 通用组件
- `CourseCard` - 课程卡片
- `VideoItem` - 视频项
- `ChapterItem` - 章节项
- `SearchBox` - 搜索框

### 7.3 新增组件
- `VideoPlayer` - 视频播放器
- `CommentList` - 评论列表
- `DiscussionItem` - 讨论项
- `ExamTimer` - 考试倒计时
- `FlowchartEditor` - 流程图编辑器
- `MaterialList` - 资料列表
- `NotificationItem` - 通知项

---

## 8. 安全要求

1. **密码加密**: 使用 bcrypt 进行密码加密存储
2. **JWT 认证**: 所有需要登录的接口需验证 token
3. **SQL 注入防护**: 使用参数化查询
4. **XSS 防护**: 对用户输入进行过滤
5. **文件上传限制**: 限制文件类型和大小

---

## 9. 性能要求

1. **视频上传**: 支持分片上传、断点续传
2. **图片优化**: 课程封面压缩处理
3. **数据分页**: 列表数据分页加载
4. **懒加载**: 视频列表、图片懒加载

---

## 10. 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
