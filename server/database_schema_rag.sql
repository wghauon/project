-- =====================================================
-- RAG知识库功能数据库表结构扩展
-- 生成日期: 2026-04-20
-- 数据库: MySQL 8.0
-- =====================================================

-- =====================================================
-- 19. 个人知识库表 (knowledge_bases)
-- =====================================================
CREATE TABLE IF NOT EXISTS `knowledge_bases` (
    `kb_id` bigint NOT NULL AUTO_INCREMENT COMMENT '知识库ID',
    `user_id` bigint NOT NULL COMMENT '所属用户ID',
    `name` varchar(100) NOT NULL COMMENT '知识库名称',
    `description` text COMMENT '知识库描述',
    `icon` varchar(50) DEFAULT '📚' COMMENT '图标',
    `color` varchar(20) DEFAULT '#667eea' COMMENT '主题色',
    `status` tinyint DEFAULT 1 COMMENT '状态：0禁用/1启用',
    `doc_count` int DEFAULT 0 COMMENT '文档数量',
    `total_chunks` int DEFAULT 0 COMMENT '总文本块数',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`kb_id`),
    KEY `idx_user_id` (`user_id`),
    CONSTRAINT `fk_kb_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='个人知识库表';

-- =====================================================
-- 20. 知识库文档表 (kb_documents)
-- =====================================================
CREATE TABLE IF NOT EXISTS `kb_documents` (
    `doc_id` bigint NOT NULL AUTO_INCREMENT COMMENT '文档ID',
    `kb_id` bigint NOT NULL COMMENT '所属知识库ID',
    `user_id` bigint NOT NULL COMMENT '上传用户ID',
    `file_name` varchar(255) NOT NULL COMMENT '原始文件名',
    `file_type` varchar(20) NOT NULL COMMENT '文件类型：pdf/doc/docx/txt/md',
    `file_size` bigint NOT NULL COMMENT '文件大小(字节)',
    `file_url` varchar(500) NOT NULL COMMENT '文件存储路径',
    `content_text` longtext COMMENT '提取的文本内容(前10000字符预览)',
    `chunk_count` int DEFAULT 0 COMMENT '分块数量',
    `status` tinyint DEFAULT 0 COMMENT '状态：0待解析/1解析中/2已完成/3失败',
    `error_msg` text COMMENT '错误信息',
    `parsed_at` datetime DEFAULT NULL COMMENT '解析完成时间',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    PRIMARY KEY (`doc_id`),
    KEY `idx_kb_id` (`kb_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_status` (`status`),
    CONSTRAINT `fk_doc_kb` FOREIGN KEY (`kb_id`) REFERENCES `knowledge_bases` (`kb_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_doc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识库文档表';

-- =====================================================
-- 21. AI对话会话扩展表 (ai_chat_sessions)
-- =====================================================
CREATE TABLE IF NOT EXISTS `ai_chat_sessions` (
    `session_id` bigint NOT NULL AUTO_INCREMENT COMMENT '会话ID',
    `user_id` bigint NOT NULL COMMENT '用户ID',
    `conversation_id` varchar(50) NOT NULL COMMENT '对话ID',
    `kb_id` bigint DEFAULT NULL COMMENT '绑定的知识库ID(可选)',
    `mode` tinyint DEFAULT 1 COMMENT '对话模式：1通用模式/2知识库模式',
    `title` varchar(100) DEFAULT NULL COMMENT '会话标题',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`session_id`),
    UNIQUE KEY `uk_conversation` (`conversation_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_kb_id` (`kb_id`),
    CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_session_kb` FOREIGN KEY (`kb_id`) REFERENCES `knowledge_bases` (`kb_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI对话会话表';

-- =====================================================
-- 完成
-- =====================================================
