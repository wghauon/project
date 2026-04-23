# 代码与数据库结构一致性分析报告

**分析时间**: 2026-04-23
**分析范围**: 前后端代码与数据库表结构对比

---

## 一、核心结论

### 🔴 重要发现

**代码遵循的是 SQL 文件定义，而非当前数据库表结构！**

当前数据库表缺少了 SQL 文件中定义的 3 个重要列，但代码中已经完整实现了对这些字段的使用，这将导致功能异常。

---

## 二、缺失列详情

### videos 表缺失的列

| 列名 | SQL 定义 | 代码中使用情况 | 影响程度 |
|------|---------|---------------|----------|
| `allow_comment` | tinyint DEFAULT 1 | ✅ 后端API + 前端UI | 🔴 高 |
| `allow_download` | tinyint DEFAULT 0 | ✅ 后端API + 前端UI | 🔴 高 |
| `permission` | varchar(20) DEFAULT 'public' | ✅ 后端API + 前端UI | 🔴 高 |

---

## 三、代码使用证据

### 1. 后端代码 (`server/router_handler/teacher.js`)

#### 更新视频接口 (第608-666行)
```javascript
exports.updateVideo = async (req, res) => {
  // 第611行：接收前端传来的权限字段
  const { video_name, description, chapter_id, video_no, status, allow_comment, allow_download, permission } = req.body
  
  // ... 省略其他代码 ...
  
  // 第641-652行：构建更新SQL，包含缺失的字段
  if (allow_comment !== undefined) {
    updates.push('allow_comment = ?')
    values.push(allow_comment ? 1 : 0)
  }
  if (allow_download !== undefined) {
    updates.push('allow_download = ?')
    values.push(allow_download ? 1 : 0)
  }
  if (permission !== undefined) {
    updates.push('permission = ?')
    values.push(permission)
  }
  
  // 第659行：执行更新SQL
  const sql = `UPDATE videos SET ${updates.join(', ')}, updated_at = NOW() WHERE video_id = ?`
  await db.execute(sql, values)
}
```

#### 获取视频详情接口 (第669-707行)
```javascript
exports.getVideoDetail = async (req, res) => {
  const [videos] = await db.execute(`
    SELECT 
      video_id,
      video_name,
      description,
      video_url,
      cover_image,
      duration,
      file_size,
      status,
      chapter_id,
      video_no,
      view_count,
      allow_comment,      -- ✅ 查询了缺失的列
      allow_download,     -- ✅ 查询了缺失的列
      permission,         -- ✅ 查询了缺失的列
      created_at,
      updated_at
    FROM videos 
    WHERE video_id = ?
  `, [video_id])
  // ...
}
```

### 2. 前端代码 (`demo/src/views/teacher/VideoEdit.vue`)

#### 数据模型定义 (第12-24行)
```javascript
const video = ref({
  video_name: '',
  description: '',
  chapter_id: '',
  video_no: 1,
  course_id: '',
  duration: 0,
  file_size: 0,
  status: 1,
  allow_comment: true,    // ✅ 默认允许评论
  allow_download: false,  // ✅ 默认不允许下载
  permission: 'public'    // ✅ 默认公开权限
})
```

#### 保存时提交数据 (第105-115行)
```javascript
const res = await updateVideo(videoId, {
  video_name: video.value.video_name,
  description: video.value.description,
  chapter_id: video.value.chapter_id,
  video_no: video.value.video_no,
  status: video.value.status,
  allow_comment: video.value.allow_comment,      // ✅ 提交到后端
  allow_download: video.value.allow_download,    // ✅ 提交到后端
  permission: video.value.permission,            // ✅ 提交到后端
  tags: tags.value
})
```

#### UI界面 (第294-327行)
```vue
<!-- 允许评论开关 -->
<div class="switch-group">
  <div class="switch-label">
    允许评论
    <span class="sub">学生可以在视频下方发表评论</span>
  </div>
  <label class="switch">
    <input type="checkbox" v-model="video.allow_comment" />
    <span class="slider"></span>
  </label>
</div>

<!-- 允许下载开关 -->
<div class="switch-group">
  <div class="switch-label">
    允许下载
    <span class="sub">允许学生下载该视频</span>
  </div>
  <label class="switch">
    <input type="checkbox" v-model="video.allow_download" />
    <span class="slider"></span>
  </label>
</div>

<!-- 学习权限选择 -->
<div class="form-group" style="margin-top: 20px">
  <label class="form-label">学习权限</label>
  <select class="form-select" v-model="video.permission">
    <option value="public">公开 - 所有学生可见</option>
    <option value="enrolled">选课学生 - 仅选课学生可见</option>
    <option value="vip">VIP专享 - 付费学生可见</option>
  </select>
</div>
```

---

## 四、功能影响分析

### 当前问题

由于数据库表缺少这3个列，将导致以下问题：

1. **更新视频时出错** - 当教师编辑视频并保存权限设置时，后端会尝试更新不存在的列，导致 SQL 错误

2. **获取视频详情时字段缺失** - 前端期望获取 `allow_comment`, `allow_download`, `permission` 字段，但数据库返回的数据中不包含这些字段

3. **权限控制功能完全失效** - 视频的评论权限、下载权限、观看权限控制功能无法正常工作

### 用户可见的表现

- 教师在视频编辑页面设置"允许评论"、"允许下载"、"学习权限"后，保存时可能会报错
- 即使保存成功，设置也不会被记录
- 学生端无法根据权限设置进行相应的限制（如不能评论、不能下载等）

---

## 五、其他表字段使用检查

### ✅ 正常使用的表字段

通过代码扫描，以下表的字段在代码中都有正确使用：
- `users` - 所有字段正常使用
- `courses` - 所有字段正常使用（包括 `join_type`, `invite_code`）
- `chapters` - 字段正常使用
- `videos` - 除缺失的3个字段外，其他字段正常使用

### 🟡 注意点

- `video_list` 查询接口（第240-267行）没有查询缺失的3个字段，这是因为列表页不需要显示这些详细信息
- 只有视频详情和编辑接口需要这些字段

---

## 六、修复优先级建议

### 🔴 紧急（立即修复）

1. **添加缺失列到 videos 表**
   ```sql
   ALTER TABLE `videos` 
   ADD COLUMN `allow_comment` tinyint DEFAULT 1 COMMENT '是否允许评论：0否/1是',
   ADD COLUMN `allow_download` tinyint DEFAULT 0 COMMENT '是否允许下载：0否/1是',
   ADD COLUMN `permission` varchar(20) DEFAULT 'public' COMMENT '学习权限：public公开/enrolled选课/vip付费';
   ```

### 🟡 建议修复

2. **设置正确的默认值**
   - 为 `courses.join_type` 设置默认值为 1
   - 为其他缺失默认值的列设置默认值

3. **添加外键约束**
   - 添加 `knowledge_bases`, `kb_documents`, `ai_chat_sessions` 等表的外键约束
   - 注意：添加外键前需要确保数据一致性

---

## 七、代码一致性评估

| 评估项 | 结果 | 说明 |
|--------|------|------|
| 代码与 SQL 文件一致性 | ✅ 一致 | 代码按 SQL 文件定义开发 |
| 代码与数据库一致性 | 🔴 不一致 | 数据库缺少必要列 |
| 前端与后端一致性 | ✅ 一致 | 接口定义匹配 |
| 功能完整性 | 🔴 不完整 | 因数据库缺失导致功能异常 |

---

## 八、结论

**代码是正确的，遵循了 SQL 文件的规范定义。问题在于数据库表结构没有按照 SQL 文件完整创建。**

建议立即执行数据库结构修复，以确保视频权限控制功能正常工作。

---

*报告生成完成*
