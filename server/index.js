/**
 * Express后端服务器
 * 提供Chat API和File Search Store管理
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendMessageWithRAG } from './services/gemini.js'; // 静态导入

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 仅在本地开发时手动加载环境变量
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: path.join(__dirname, '.env') });
}

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
    origin: true, // 允许所有来源，解决Vercel部署后的CORS问题
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 获取File Search Store名称 - Vercel会自动注入环境变量
const FILE_SEARCH_STORE_NAME = process.env.FILE_SEARCH_STORE_NAME || null;

/**
 * POST /api/chat
 * 接收用户消息，返回AI回复
 */
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                error: '请提供有效的消息内容'
            });
        }

        console.log(`收到消息: "${message.substring(0, 50)}..."`);

        const response = await sendMessageWithRAG(
            message,
            history,
            FILE_SEARCH_STORE_NAME
        );

        res.json({
            response,
            timestamp: Date.now()
        });
    } catch (error) {
        // 详细错误日志
        console.error('Chat API Error:', {
            message: error.message,
            stack: error.stack,
            cause: error.cause
        });

        // 区分不同类型的错误返回
        const statusCode = error.status || 500;
        let errorMessage = error.message || 'AI服务暂时不可用';

        // 如果是 Vercel 部署环境，给出更明确的提示
        if (!process.env.GEMINI_API_KEY) {
            errorMessage = '服务端配置错误: 缺少 GEMINI_API_KEY';
        } else if (error.message && error.message.includes('API key')) {
            errorMessage = 'Vercel环境变量无效: GEMINI_API_KEY';
        } else if (error.message && error.message.includes('quota')) {
            errorMessage = 'API配额超限 (429 Resource Exhausted)';
        }

        res.status(statusCode).json({
            error: errorMessage,
            timestamp: Date.now(),
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * GET /api/health
 * 健康检查端点
 */
// 健康检查端点
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        hasApiKey: !!process.env.GEMINI_API_KEY,
        hasFileSearchStore: !!FILE_SEARCH_STORE_NAME,
        timestamp: Date.now(),
        version: '1.0.1-debug' // 增加版本号方便验证部署状态
    });
});

/**
 * GET /api/store-info
 * 获取当前File Search Store信息
 */
app.get('/api/store-info', (req, res) => {
    res.json({
        configured: !!FILE_SEARCH_STORE_NAME,
        storeName: FILE_SEARCH_STORE_NAME || null
    });
});

// 仅在本地开发时启动服务器
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════════╗
║   Vickie Portfolio Backend                      ║
║   服务器运行在: http://localhost:${PORT}           ║
╠════════════════════════════════════════════════╣
║   File Search Store: ${FILE_SEARCH_STORE_NAME ? '已配置 ✓' : '未配置 ✗'}                ║
╚════════════════════════════════════════════════╝
      `);

        if (!FILE_SEARCH_STORE_NAME) {
            console.log('提示: 运行 npm run setup-store 来创建File Search Store并上传文档');
        }
    });
}

// 导出app供Vercel使用
export default app;
