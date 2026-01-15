/**
 * Express后端服务器
 * 提供Chat API和File Search Store管理
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 先加载环境变量（必须在导入gemini模块之前）
dotenv.config({ path: path.join(__dirname, '.env') });

// 然后再导入gemini服务（需要API_KEY已加载）
const { sendMessageWithRAG } = await import('./services/gemini.js');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());

// 获取File Search Store名称
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
        console.error('Chat API错误:', error);
        res.status(500).json({
            error: error.message || 'AI服务暂时不可用'
        });
    }
});

/**
 * GET /api/health
 * 健康检查端点
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        hasFileSearchStore: !!FILE_SEARCH_STORE_NAME,
        timestamp: Date.now()
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
