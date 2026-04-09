-- 在线教育平台数据库表结构
-- 生成日期: 2026-04-07
-- 数据库: MySQL 8.0

-- =====================================================
-- 1. 用户表 (users)
-- =====================================================
CREATE TABLE IF NOT EXISTS `users` (
    `user_id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键，用户唯一标识',
    `username` varchar(50) NOT NULL COMMENT '用户名',
    `password` varchar(255) NOT NULL COMMENT '加密后的密码',
    `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
    `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
    `real_name` varchar(50) DEFAULT NULL COMMENT '真实姓名',
    `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
    `role` tinyint DEFAULT NULL COMMENT '角色：1学生/2教师/3管理员',
    `student_no` varchar(20) DEFAULT NULL COMMENT '学号（学生）',
    `teacher_no` varchar(20) DEFAULT NULL COMMENT '工号（教师）',
    `department` varchar(50) DEFAULT NULL COMMENT '院系',
    `major` varchar(50) DEFAULT NULL COMMENT '专业（学生）',
    `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态：0禁用/1启用',
    `created_at` datetime DEFAULT NULL COMMENT '创建时间',
    `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
    `last_login` datetime DEFAULT NULL COMMENT '最后登录时间',
    PRIMARY KEY (`user_id`),
    UNIQUE KEY `uk_username` (`username`),
    KEY `idx_role` (`role`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- =====================================================
-- 2. 课程分类表 (course_categories)
-- =====================================================
CREATE TABLE IF NOT EXISTS `course_categories` (
    `category_id` int NOT NULL AUTO_INCREMENT COMMENT '主键，分类唯一标识',
    `category_name` varchar(50) NOT NULL COMMENT '分类名称',
    `parent_id` int DEFAULT NULL COMMENT '父分类ID，NULL为顶级分类',
    `sort_order` int DEFAULT NULL COMMENT '排序序号',
    PRIMARY KEY (`category_id`),
    KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程分类表';

-- =====================================================
-- 3. 课程表 (courses)
-- =====================================================
CREATE TABLE IF NOT EXISTS `courses` (
    `course_id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键，课程唯一标识',
    `course_name` varchar(100) NOT NULL COMMENT '课程名称',
    `course_code` varchar(20) DEFAULT NULL COMMENT '课程代码',
    `teacher_id` bigint DEFAULT NULL COMMENT '授课教师ID',
    `category_id` int DEFAULT NULL COMMENT '分类ID',
    `description` text COMMENT '课程简介',
    `cover_image` varchar(255) DEFAULT NULL COMMENT '封面图URL',
    `difficulty` tinyint DEFAULT NULL COMMENT '难度：1入门/2初级/3中级/4高级',
    `credit` decimal(3,1) DEFAULT NULL COMMENT '学分',
    `hours` int DEFAULT NULL COMMENT '学时',
    `max_students` int DEFAULT NULL COMMENT '最大学生数',
    `semester` varchar(20) DEFAULT NULL COMMENT '学期（如2024春）',
    `status` tinyint DEFAULT NULL COMMENT '状态：0草稿/1待审核/2已发布/3已驳回/4已下架',
    `review_remark` varchar(500) DEFAULT NULL COMMENT '审核备注',
    `is_public` tinyint DEFAULT 1 COMMENT '是否公开：0否/1是',
    `join_type` tinyint DEFAULT 1 COMMENT '加入方式：1公开/2申请/3邀请码/4关闭',
    `invite_code` varchar(20) DEFAULT NULL COMMENT '邀请码',
    `start_time` datetime DEFAULT NULL COMMENT '开课时间',
    `end_time` datetime DEFAULT NULL COMMENT '结课时间',
    `created_at` datetime DEFAULT NULL COMMENT '创建时间',
    `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
    `published_at` datetime DEFAULT NULL COMMENT '发布时间',
    PRIMARY KEY (`course_id`),
    UNIQUE KEY `uk_course_code` (`course_code`),
    KEY `idx_teacher_id` (`teacher_id`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_status` (`status`),
    CONSTRAINT `fk_courses_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`user_id`),
    CONSTRAINT `fk_courses_category` FOREIGN KEY (`category_id`) REFERENCES `course_categories` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程表';

-- =====================================================
-- 4. 章节表 (chapters)
-- =====================================================
CREATE TABLE IF NOT EXISTS `chapters` (
    `chapter_id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键，章节唯一标识',
    `course_id` bigint DEFAULT NULL COMMENT '所属课程ID',
    `chapter_no` int DEFAULT NULL COMMENT '章节序号',
    `chapter_name` varchar(100) NOT NULL COMMENT '章节名称',
    `description` text COMMENT '章节描述',
    `is_required` tinyint DEFAULT 1 COMMENT '是否必修：0否/1是',
    `status` tinyint DEFAULT 1 COMMENT '状态：0禁用/1启用',
    `created_at` datetime DEFAULT NULL COMMENT '创建时间',
    PRIMARY KEY (`chapter_id`),
    KEY `idx_course_id` (`course_id`),
    KEY `idx_chapter_no` (`chapter_no`),
    CONSTRAINT `fk_chapters_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='章节表';

-- =====================================================
-- 5. 视频表 (videos)
-- =====================================================
CREATE TABLE IF NOT EXISTS `videos` (
    `video_id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键，视频唯一标识',
    `course_id` bigint DEFAULT NULL COMMENT '所属课程ID',
    `chapter_id` bigint DEFAULT NULL COMMENT '所属章节ID',
    `video_no` int DEFAULT NULL COMMENT '视频序号',
    `video_name` varchar(100) NOT NULL COMMENT '视频标题',
    `description` text COMMENT '视频描述',
    `video_url` varchar(255) DEFAULT NULL COMMENT '视频文件URL',
    `cover_image` varchar(255) DEFAULT NULL COMMENT '视频封面URL',
    `duration` int DEFAULT NULL COMMENT '视频时长（秒）',
    `file_size` bigint DEFAULT NULL COMMENT '文件大小（字节）',
    `format` varchar(10) DEFAULT NULL COMMENT '格式：MP4/AVI/MOV等',
    `resolution` varchar(20) DEFAULT NULL COMMENT '分辨率：如1920x1080',
    `status` tinyint DEFAULT 1 COMMENT '状态：0草稿/1已发布/2已下架',
    `view_count` int DEFAULT 0 COMMENT '播放次数',
    `created_at` datetime DEFAULT NULL COMMENT '创建时间',
    `published_at` datetime DEFAULT NULL COMMENT '发布时间',
    PRIMARY KEY (`video_id`),
    KEY `idx_course_id` (`course_id`),
    KEY `idx_chapter_id` (`chapter_id`),
    KEY `idx_video_no` (`video_no`),
    KEY `idx_status` (`status`),
    CONSTRAINT `fk_videos_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_videos_chapter` FOREIGN KEY (`chapter_id`) REFERENCES `chapters` (`chapter_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频表';

-- =====================================================
-- 6. 选课记录表 (course_enrollments)
-- =====================================================
CREATE TABLE IF NOT EXISTS `course_enrollments` (
    `enrollment_id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键，记录唯一标识',
    `course_id` bigint DEFAULT NULL COMMENT '课程ID',
    `student_id` bigint DEFAULT NULL COMMENT '学生ID',
    `status` tinyint DEFAULT 1 COMMENT '状态：0待审核/1已通过/2已拒绝/3已退课',
    `progress` decimal(5,2) DEFAULT 0.00 COMMENT '学习进度百分比',
    `enrolled_at` datetime DEFAULT NULL COMMENT '选课时间',
    `completed_at` datetime DEFAULT NULL COMMENT '完成时间',
    PRIMARY KEY (`enrollment_id`),
    KEY `idx_course_id` (`course_id`),
    KEY `idx_student_id` (`student_id`),
    KEY `idx_status` (`status`),
    UNIQUE KEY `uk_student_course` (`student_id`, `course_id`),
    CONSTRAINT `fk_enrollments_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_enrollments_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='选课记录表';

-- =====================================================
-- 7. 视频学习进度表 (video_progress)
-- =====================================================
CREATE TABLE IF NOT EXISTS `video_progress` (
    `progress_id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键，记录唯一标识',
    `video_id` bigint DEFAULT NULL COMMENT '视频ID',
    `student_id` bigint DEFAULT NULL COMMENT '学生ID',
    `current_time` int DEFAULT 0 COMMENT '当前观看位置（秒）',
    `duration` int DEFAULT NULL COMMENT '视频总时长（秒）',
    `progress_percent` decimal(5,2) DEFAULT 0.00 COMMENT '观看进度百分比',
    `is_completed` tinyint DEFAULT 0 COMMENT '是否完成：0否/1是',
    `watch_count` int DEFAULT 0 COMMENT '观看次数',
    `last_watch_at` datetime DEFAULT NULL COMMENT '最后观看时间',
    `created_at` datetime DEFAULT NULL COMMENT '记录创建时间',
    PRIMARY KEY (`progress_id`),
    KEY `idx_video_id` (`video_id`),
    KEY `idx_student_id` (`student_id`),
    KEY `idx_is_completed` (`is_completed`),
    UNIQUE KEY `uk_student_video` (`student_id`, `video_id`),
    CONSTRAINT `fk_progress_video` FOREIGN KEY (`video_id`) REFERENCES `videos` (`video_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_progress_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频学习进度表';

-- =====================================================
-- 8. 通知表 (notifications)
-- =====================================================
CREATE TABLE IF NOT EXISTS `notifications` (
    `notification_id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键，通知唯一标识',
    `title` varchar(100) NOT NULL COMMENT '通知标题',
    `content` text COMMENT '通知内容',
    `type` tinyint DEFAULT 1 COMMENT '类型：1系统公告/2课程通知',
    `course_id` bigint DEFAULT NULL COMMENT '课程ID（课程通知时填写）',
    `sender_id` bigint DEFAULT NULL COMMENT '发送者ID',
    `is_top` tinyint DEFAULT 0 COMMENT '是否置顶：0否/1是',
    `status` tinyint DEFAULT 1 COMMENT '状态：0禁用/1启用',
    `created_at` datetime DEFAULT NULL COMMENT '创建时间',
    PRIMARY KEY (`notification_id`),
    KEY `idx_course_id` (`course_id`),
    KEY `idx_type` (`type`),
    KEY `idx_status` (`status`),
    CONSTRAINT `fk_notifications_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_notifications_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

-- =====================================================
-- 9. 讨论表 (discussions)
-- =====================================================
CREATE TABLE IF NOT EXISTS `discussions` (
    `discussion_id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键，讨论唯一标识',
    `course_id` bigint NOT NULL COMMENT '课程ID',
    `user_id` bigint NOT NULL COMMENT '用户ID',
    `parent_id` bigint DEFAULT NULL COMMENT '父讨论ID，NULL为顶级讨论',
    `title` varchar(200) DEFAULT NULL COMMENT '讨论标题',
    `content` text NOT NULL COMMENT '讨论内容',
    `likes` int DEFAULT 0 COMMENT '点赞数',
    `is_top` tinyint DEFAULT 0 COMMENT '是否置顶：0否/1是',
    `status` tinyint DEFAULT 1 COMMENT '状态：0禁用/1启用',
    `created_at` datetime DEFAULT NULL COMMENT '创建时间',
    PRIMARY KEY (`discussion_id`),
    KEY `idx_course_id` (`course_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_status` (`status`),
    CONSTRAINT `fk_discussions_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_discussions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_discussions_parent` FOREIGN KEY (`parent_id`) REFERENCES `discussions` (`discussion_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='讨论表';

-- =====================================================
-- 10. 课程资料表 (materials)
-- =====================================================
CREATE TABLE IF NOT EXISTS `materials` (
    `material_id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键，资料唯一标识',
    `course_id` bigint NOT NULL COMMENT '课程ID',
    `file_name` varchar(100) NOT NULL COMMENT '文件名称',
    `file_url` varchar(255) NOT NULL COMMENT '文件URL',
    `file_size` bigint DEFAULT NULL COMMENT '文件大小（字节）',
    `file_type` varchar(50) DEFAULT NULL COMMENT '文件类型',
    `description` text COMMENT '文件描述',
    `uploaded_by` bigint DEFAULT NULL COMMENT '上传者ID',
    `download_count` int DEFAULT 0 COMMENT '下载次数',
    `status` tinyint DEFAULT 1 COMMENT '状态：0禁用/1启用',
    `created_at` datetime DEFAULT NULL COMMENT '创建时间',
    PRIMARY KEY (`material_id`),
    KEY `idx_course_id` (`course_id`),
    KEY `idx_uploaded_by` (`uploaded_by`),
    CONSTRAINT `fk_materials_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_materials_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程资料表';

-- =====================================================
-- 11. 实验表 (experiments)
-- =====================================================
CREATE TABLE IF NOT EXISTS `experiments` (
    `experiment_id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键，实验唯一标识',
    `course_id` bigint NOT NULL COMMENT '课程ID',
    `title` varchar(100) NOT NULL COMMENT '实验标题',
    `description` text COMMENT '实验描述',
    `task_file_url` varchar(255) DEFAULT NULL COMMENT '任务书文件URL',
    `deadline` datetime DEFAULT NULL COMMENT '截止时间',
    `total_score` decimal(5,1) DEFAULT 100.0 COMMENT '总分',
    `status` tinyint DEFAULT 1 COMMENT '状态：0禁用/1启用',
    `created_at` datetime DEFAULT NULL COMMENT '创建时间',
    PRIMARY KEY (`experiment_id`),
    KEY `idx_course_id` (`course_id`),
    CONSTRAINT `fk_experiments_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='实验表';

-- =====================================================
-- 12. 实验提交表 (experiment_submissions)
-- =====================================================
CREATE TABLE IF NOT EXISTS `experiment_submissions` (
    `submission_id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键，提交唯一标识',
    `experiment_id` bigint NOT NULL COMMENT '实验ID',
    `student_id` bigint NOT NULL COMMENT '学生ID',
    `report_file_url` varchar(255) NOT NULL COMMENT '报告文件URL',
    `report_content` text COMMENT '报告内容',
    `score` decimal(5,2) DEFAULT NULL COMMENT '得分',
    `feedback` text COMMENT '教师反馈',
    `status` tinyint DEFAULT 0 COMMENT '状态：0待批改/1已批改',
    `submitted_at` datetime DEFAULT NULL COMMENT '提交时间',
    `graded_at` datetime DEFAULT NULL COMMENT '批改时间',
    PRIMARY KEY (`submission_id`),
    KEY `idx_experiment_id` (`experiment_id`),
    KEY `idx_student_id` (`student_id`),
    UNIQUE KEY `uk_experiment_student` (`experiment_id`, `student_id`),
    CONSTRAINT `fk_submissions_experiment` FOREIGN KEY (`experiment_id`) REFERENCES `experiments` (`experiment_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_submissions_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='实验提交表';

-- =====================================================
-- 13. 考试表 (exams)
-- =====================================================
CREATE TABLE IF NOT EXISTS `exams` (
    `exam_id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键，考试唯一标识',
    `course_id` bigint NOT NULL COMMENT '课程ID',
    `title` varchar(100) NOT NULL COMMENT '考试标题',
    `description` text COMMENT '考试说明',
    `duration` int DEFAULT NULL COMMENT '考试时长（分钟）',
    `start_time` datetime DEFAULT NULL COMMENT '开始时间',
    `end_time` datetime DEFAULT NULL COMMENT '结束时间',
    `total_score` decimal(5,1) DEFAULT 100.0 COMMENT '总分',
    `pass_score` decimal(5,1) DEFAULT 60.0 COMMENT '及格分数',
    `status` tinyint DEFAULT 0 COMMENT '状态：0草稿/1已发布/2进行中/3已结束',
    `created_at` datetime DEFAULT NULL COMMENT '创建时间',
    PRIMARY KEY (`exam_id`),
    KEY `idx_course_id` (`course_id`),
    KEY `idx_status` (`status`),
    CONSTRAINT `fk_exams_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考试表';

-- =====================================================
-- 14. 考试题目表 (exam_questions)
-- =====================================================
CREATE TABLE IF NOT EXISTS `exam_questions` (
    `question_id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键，题目唯一标识',
    `exam_id` bigint NOT NULL COMMENT '考试ID',
    `question_type` tinyint NOT NULL COMMENT '题型：1单选/2多选/3判断',
    `question_text` text NOT NULL COMMENT '题目内容',
    `options` json DEFAULT NULL COMMENT '选项JSON',
    `correct_answer` varchar(255) DEFAULT NULL COMMENT '正确答案',
    `score` decimal(3,1) DEFAULT NULL COMMENT '分值',
    `sort_order` int DEFAULT NULL COMMENT '排序序号',
    PRIMARY KEY (`question_id`),
    KEY `idx_exam_id` (`exam_id`),
    KEY `idx_question_type` (`question_type`),
    CONSTRAINT `fk_questions_exam` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`exam_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考试题目表';

-- =====================================================
-- 15. 考试记录表 (exam_records)
-- =====================================================
CREATE TABLE IF NOT EXISTS `exam_records` (
    `record_id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键，记录唯一标识',
    `exam_id` bigint NOT NULL COMMENT '考试ID',
    `student_id` bigint NOT NULL COMMENT '学生ID',
    `answers` json DEFAULT NULL COMMENT '答题JSON',
    `score` decimal(5,1) DEFAULT NULL COMMENT '得分',
    `status` tinyint DEFAULT 0 COMMENT '状态：0进行中/1已提交',
    `start_time` datetime DEFAULT NULL COMMENT '开始考试时间',
    `submit_time` datetime DEFAULT NULL COMMENT '提交时间',
    PRIMARY KEY (`record_id`),
    KEY `idx_exam_id` (`exam_id`),
    KEY `idx_student_id` (`student_id`),
    UNIQUE KEY `uk_exam_student` (`exam_id`, `student_id`),
    CONSTRAINT `fk_records_exam` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`exam_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_records_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考试记录表';

-- =====================================================
-- 16. 评论表 (comments)
-- =====================================================
CREATE TABLE IF NOT EXISTS `comments` (
    `comment_id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键，评论唯一标识',
    `video_id` bigint NOT NULL COMMENT '视频ID',
    `user_id` bigint NOT NULL COMMENT '用户ID',
    `parent_id` bigint DEFAULT NULL COMMENT '父评论ID，NULL为顶级评论',
    `content` text NOT NULL COMMENT '评论内容',
    `likes` int DEFAULT 0 COMMENT '点赞数',
    `status` tinyint DEFAULT 1 COMMENT '状态：0禁用/1启用',
    `created_at` datetime DEFAULT NULL COMMENT '创建时间',
    PRIMARY KEY (`comment_id`),
    KEY `idx_video_id` (`video_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_status` (`status`),
    CONSTRAINT `fk_comments_video` FOREIGN KEY (`video_id`) REFERENCES `videos` (`video_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_comments_parent` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`comment_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- =====================================================
-- 初始化数据
-- =====================================================

-- 插入默认管理员账号 (密码: admin123)
INSERT INTO `users` (`username`, `password`, `real_name`, `role`, `status`, `created_at`) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '系统管理员', 3, 1, NOW());

-- 插入示例分类数据
INSERT INTO `course_categories` (`category_name`, `parent_id`, `sort_order`) VALUES
('计算机科学', NULL, 1),
('数学', NULL, 2),
('外语', NULL, 3),
('编程语言', 1, 1),
('数据科学', 1, 2),
('人工智能', 1, 3),
('高等数学', 2, 1),
('线性代数', 2, 2),
('英语', 3, 1),
('日语', 3, 2);

-- =====================================================
-- 完成
-- =====================================================
