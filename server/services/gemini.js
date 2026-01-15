/**
 * Gemini RAG服务
 * 使用File Search API实现检索增强生成
 */

import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT } from '../config/prompts.js';

// 初始化Gemini客户端 (延迟初始化以确保环境变量已加载)
const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('未配置 GEMINI_API_KEY');
    }
    return new GoogleGenAI({ apiKey });
};

/**
 * 发送消息到Gemini，使用RAG进行回答
 * @param {string} userMessage - 用户消息
 * @param {Array} history - 对话历史
 * @param {string} fileSearchStoreName - File Search Store名称
 * @returns {Promise<string>} - AI回复
 */
export async function sendMessageWithRAG(userMessage, history = [], fileSearchStoreName) {
    try {
        const ai = getAiClient();

        // 构建对话内容
        const contents = [
            ...history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            })),
            { role: 'user', parts: [{ text: userMessage }] }
        ];

        // 配置File Search工具（如果有Store）
        const tools = fileSearchStoreName ? [
            {
                fileSearch: {
                    fileSearchStoreNames: [fileSearchStoreName]
                }
            }
        ] : [];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                temperature: 0.7,
                topP: 0.95,
                tools
            }
        });

        // 提取文本，忽略grounding metadata和citations
        const text = response.text || "抱歉，我无法处理这个请求。";

        return text;
    } catch (error) {
        console.error('Gemini API 详细错误:', JSON.stringify(error, null, 2));
        // 直接抛出原始错误，让上层处理具体的错误信息
        throw error;
    }
}

/**
 * 创建File Search Store
 * @param {string} displayName - Store显示名称
 * @returns {Promise<Object>} - 创建的Store对象
 */
export async function createFileSearchStore(displayName) {
    try {
        const ai = getAiClient();
        const store = await ai.fileSearchStores.create({
            config: { displayName }
        });
        console.log('File Search Store创建成功:', store.name);
        return store;
    } catch (error) {
        console.error('创建File Search Store失败:', error);
        throw error;
    }
}

/**
 * 上传文件到File Search Store
 * @param {string} filePath - 文件路径
 * @param {string} fileSearchStoreName - Store名称
 * @param {string} displayName - 文件显示名称
 * @returns {Promise<void>}
 */
export async function uploadFileToStore(filePath, fileSearchStoreName, displayName) {
    // MIME类型映射
    const mimeTypes = {
        '.txt': 'text/plain',
        '.md': 'text/markdown',
        '.pdf': 'application/pdf',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.doc': 'application/msword',
        '.json': 'application/json'
    };

    const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
    const mimeType = mimeTypes[ext] || 'text/plain';

    try {
        const ai = getAiClient();
        let operation = await ai.fileSearchStores.uploadToFileSearchStore({
            file: filePath,
            fileSearchStoreName,
            config: {
                displayName,
                mimeType
            }
        });

        // 等待上传完成
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            operation = await ai.operations.get({ operation });
            console.log(`上传进度: ${displayName}...`);
        }

        console.log(`文件上传成功: ${displayName}`);
    } catch (error) {
        console.error(`上传文件失败 ${displayName}:`, error);
        throw error;
    }
}

/**
 * 列出所有File Search Stores
 * @returns {Promise<Array>}
 */
export async function listFileSearchStores() {
    try {
        const ai = getAiClient();
        const stores = await ai.fileSearchStores.list();
        return stores;
    } catch (error) {
        console.error('列出File Search Stores失败:', error);
        return [];
    }
}

export default {
    sendMessageWithRAG,
    createFileSearchStore,
    uploadFileToStore,
    listFileSearchStores
};
