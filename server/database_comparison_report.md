# 数据库结构对比报告

**生成时间**: 2026-04-23
**对比对象**: 
- 当前 MySQL 数据库
- database_schema.sql (主表结构)
- database_schema_rag.sql (RAG知识库扩展)

---

## 一、表数量对比

| 来源 | 表数量 |
|------|--------|
| SQL 文件合计 | 21 张表 |
| 当前数据库 | 21 张表 |

**结论**: ✅ 表数量一致

---

## 二、表清单对比

### ✅ 存在的表 (21张)
1. ai_chat_history
2. ai_chat_sessions
3. chapters
4. comments
5. course_categories
6. course_enrollments
7. courses
8. discussions
9. exam_questions
10. exam_records
11. exams
12. experiment_submissions
13. experiments
14. kb_documents
15. knowledge_bases
16. materials
17. notifications
18. refresh_tokens
19. users
20. video_progress
21. videos

---

## 三、详细差异分析

### 🔴 1. videos 表 - 列缺失 (重要)

| 缺失列 | SQL定义 | 说明 |
|--------|---------|------|
| `allow_comment` | tinyint DEFAULT 1 | 是否允许评论：0否/1是 |
| `allow_download` | tinyint DEFAULT 0 | 是否允许下载：0否/1是 |
| `permission` | varchar(20) DEFAULT 'public' | 学习权限：public公开/enrolled选课/vip付费 |

**影响**: 视频权限控制功能可能无法正常使用

---

### 🟡 2. 列默认值差异

#### courses 表
| 列名 | SQL 文件定义 | 数据库当前值 | 建议 |
|------|-------------|-------------|------|
| `join_type` | DEFAULT 1 | NULL | 应设置为 1 |

#### course_enrollments 表
| 列名 | SQL 文件定义 | 数据库当前值 | 建议 |
|------|-------------|-------------|------|
| `status` | DEFAULT 1 | NULL | 应设置为 1 |
| `progress` | DEFAULT 0.00 | NULL | 应设置为 0.00 |

#### video_progress 表
| 列名 | SQL 文件定义 | 数据库当前值 | 建议 |
|------|-------------|-------------|------|
| `current_time` | DEFAULT 0 | NULL | 应设置为 0 |
| `progress_percent` | DEFAULT 0.00 | NULL | 应设置为 0.00 |
| `is_completed` | DEFAULT 0 | NULL | 应设置为 0 |
| `watch_count` | DEFAULT 0 | NULL | 应设置为 0 |

#### chapters 表
| 列名 | SQL 文件定义 | 数据库当前值 | 建议 |
|------|-------------|-------------|------|
| `is_required` | DEFAULT 1 | NULL | 应设置为 1 |
| `status` | DEFAULT 1 | NULL | 应设置为 1 |

---

### 🔴 3. 外键约束缺失 (重要)

以下外键约束在 SQL 文件中定义，但在数据库中**不存在**：

#### knowledge_bases 表
```sql
CONSTRAINT `fk_kb_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
```

#### kb_documents 表
```sql
CONSTRAINT `fk_doc_kb` FOREIGN KEY (`kb_id`) REFERENCES `knowledge_bases` (`kb_id`) ON DELETE CASCADE
CONSTRAINT `fk_doc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
```

#### ai_chat_sessions 表
```sql
CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
CONSTRAINT `fk_session_kb` FOREIGN KEY (`kb_id`) REFERENCES `knowledge_bases` (`kb_id`) ON DELETE SET NULL
```

#### discussions 表
```sql
CONSTRAINT `fk_discussions_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE
CONSTRAINT `fk_discussions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
CONSTRAINT `fk_discussions_parent` FOREIGN KEY (`parent_id`) REFERENCES `discussions` (`discussion_id`) ON DELETE CASCADE
```

#### notifications 表
```sql
CONSTRAINT `fk_notifications_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE
CONSTRAINT `fk_notifications_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
```

#### materials 表
```sql
CONSTRAINT `fk_materials_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE
CONSTRAINT `fk_materials_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
```

#### experiments 表
```sql
CONSTRAINT `fk_experiments_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE
```

#### experiment_submissions 表
```sql
CONSTRAINT `fk_submissions_experiment` FOREIGN KEY (`experiment_id`) REFERENCES `experiments` (`experiment_id`) ON DELETE CASCADE
CONSTRAINT `fk_submissions_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
```

#### exams 表
```sql
CONSTRAINT `fk_exams_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE
```

#### exam_questions 表
```sql
CONSTRAINT `fk_questions_exam` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`exam_id`) ON DELETE CASCADE
```

#### exam_records 表
```sql
CONSTRAINT `fk_records_exam` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`exam_id`) ON DELETE CASCADE
CONSTRAINT `fk_records_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
```

#### comments 表
```sql
CONSTRAINT `fk_comments_video` FOREIGN KEY (`video_id`) REFERENCES `videos` (`video_id`) ON DELETE CASCADE
CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
CONSTRAINT `fk_comments_parent` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`comment_id`) ON DELETE CASCADE
```

---

### 🟡 4. 索引差异

#### ai_chat_history 表
- **SQL 文件有**: KEY `idx_user_conversation` (`user_id`,`conversation_id`)
- **数据库实际**: 有 idx_user_conversation 索引，但只有 user_id 列
- **差异**: 缺少 conversation_id 列的组合索引

---

### 🟡 5. 字段长度/类型差异

#### refresh_tokens 表
| 列名 | SQL 定义 | 数据库实际 | 差异 |
|------|---------|-----------|------|
| `user_id` | int | int | 一致 |
| `token` | varchar(500) | varchar(500) | 一致 |
| **注释** | 有详细注释 | **无注释** | ⚠️ 注释缺失 |

#### ai_chat_history 表
| 列名 | SQL 定义 | 数据库实际 | 差异 |
|------|---------|-----------|------|
| `user_id` | int | int | 一致 |
| `conversation_id` | varchar(50) | varchar | 类型信息未显示完整 |

---

## 四、总结

### 🔴 严重问题 (需立即修复)
1. **videos 表缺少 3 个列**: `allow_comment`, `allow_download`, `permission`
2. **大量外键约束缺失**: 影响数据完整性和级联删除功能

### 🟡 中等问题 (建议修复)
1. **多个表的默认值未设置**: 可能导致新记录状态异常
2. **部分索引不完整**: ai_chat_history 的组合索引缺失 conversation_id

### ✅ 正常情况
1. 所有表都存在
2. 主键索引完整
3. 大部分列定义一致

---

## 五、修复建议 SQL

```sql
-- 1. 修复 videos 表 - 添加缺失列
ALTER TABLE `videos` 
ADD COLUMN `allow_comment` tinyint DEFAULT 1 COMMENT '是否允许评论：0否/1是',
ADD COLUMN `allow_download` tinyint DEFAULT 0 COMMENT '是否允许下载：0否/1是',
ADD COLUMN `permission` varchar(20) DEFAULT 'public' COMMENT '学习权限：public公开/enrolled选课/vip付费';

-- 2. 修复默认值
ALTER TABLE `courses` ALTER COLUMN `join_type` SET DEFAULT 1;
ALTER TABLE `course_enrollments` ALTER COLUMN `status` SET DEFAULT 1;
ALTER TABLE `course_enrollments` ALTER COLUMN `progress` SET DEFAULT 0.00;
ALTER TABLE `chapters` ALTER COLUMN `is_required` SET DEFAULT 1;
ALTER TABLE `chapters` ALTER COLUMN `status` SET DEFAULT 1;

-- 3. 添加外键约束 (示例，需要确认数据完整性后执行)
-- 建议先清理不一致数据后再添加外键
```

---

*报告生成完成*
