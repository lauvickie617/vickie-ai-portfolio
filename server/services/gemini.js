/**
 * Gemini RAG服务
 * 使用File Search API实现检索增强生成
 */

import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT } from '../config/prompts.js';

// 初始化Gemini客户端
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * 发送消息到Gemini，使用RAG进行回答
 * @param {string} userMessage - 用户消息
 * @param {Array} history - 对话历史
 * @param {string} fileSearchStoreName - File Search Store名称
 * @returns {Promise<string>} - AI回复
 */
export async function sendMessageWithRAG(userMessage, history = [], fileSearchStoreName) {
    try {
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
        console.error('Gemini API错误:', error);
        throw new Error('AI服务暂时不可用，请稍后再试。');
    }
}

/**
 * 创建File Search Store
 * @param {string} displayName - Store显示名称
 * @returns {Promise<Object>} - 创建的Store对象
 */
export async function createFileSearchStore(displayName) {
    try {
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
