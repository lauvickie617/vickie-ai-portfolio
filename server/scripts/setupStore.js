/**
 * File Search Store初始化脚本
 * 运行: npm run setup-store
 * 
 * 该脚本会：
 * 1. 创建新的File Search Store
 * 2. 上传data目录下的所有文档
 * 3. 将Store名称保存到.env文件
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const ENV_FILE = path.join(__dirname, '..', '.env');

// 先加载环境变量
dotenv.config({ path: ENV_FILE });

// 然后再导入gemini服务（需要API_KEY已加载）
const { createFileSearchStore, uploadFileToStore } = await import('../services/gemini.js');

// 支持的文件类型
const SUPPORTED_EXTENSIONS = ['.txt', '.pdf', '.docx', '.doc', '.md', '.json'];

async function setup() {
    console.log('═══════════════════════════════════════════');
    console.log(' File Search Store 初始化工具');
    console.log('═══════════════════════════════════════════\n');

    // 检查API密钥
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'PLACEHOLDER_API_KEY') {
        console.log('⚠️  错误：请先在 .env 文件中配置有效的 GEMINI_API_KEY');
        process.exit(1);
    }

    // 检查data目录
    if (!fs.existsSync(DATA_DIR)) {
        console.log(`创建data目录: ${DATA_DIR}`);
        fs.mkdirSync(DATA_DIR, { recursive: true });
        console.log('\n⚠️  请将您的知识库文档放入 server/data/ 目录，然后重新运行此脚本。');
        console.log('支持的文件格式:', SUPPORTED_EXTENSIONS.join(', '));
        process.exit(0);
    }

    // 获取所有支持的文件（排除README.md）
    const files = fs.readdirSync(DATA_DIR)
        .filter(file => {
            const ext = path.extname(file).toLowerCase();
            return SUPPORTED_EXTENSIONS.includes(ext) && file !== 'README.md';
        });

    if (files.length === 0) {
        console.log('⚠️  data目录中没有找到支持的文档文件。');
        console.log('支持的文件格式:', SUPPORTED_EXTENSIONS.join(', '));
        console.log(`目录路径: ${DATA_DIR}`);
        process.exit(1);
    }

    console.log(`找到 ${files.length} 个文档:\n`);
    files.forEach((file, i) => console.log(`  ${i + 1}. ${file}`));
    console.log('');

    // 创建File Search Store
    console.log('正在创建 File Search Store...');
    const storeName = `vickie-portfolio-${Date.now()}`;
    const store = await createFileSearchStore(storeName);

    console.log(`✓ Store创建成功: ${store.name}\n`);

    // 上传所有文件
    console.log('开始上传文档...\n');
    for (const file of files) {
        const filePath = path.join(DATA_DIR, file);
        console.log(`  上传中: ${file}`);
        try {
            await uploadFileToStore(filePath, store.name, file);
            console.log(`  ✓ 完成: ${file}\n`);
        } catch (error) {
            console.error(`  ✗ 失败: ${file} - ${error.message}\n`);
        }
    }

    // 更新.env文件
    console.log('更新环境变量...');
    let envContent = '';
    if (fs.existsSync(ENV_FILE)) {
        envContent = fs.readFileSync(ENV_FILE, 'utf-8');
        // 替换或添加FILE_SEARCH_STORE_NAME
        if (envContent.includes('FILE_SEARCH_STORE_NAME=')) {
            envContent = envContent.replace(
                /FILE_SEARCH_STORE_NAME=.*/,
                `FILE_SEARCH_STORE_NAME=${store.name}`
            );
        } else {
            envContent += `\nFILE_SEARCH_STORE_NAME=${store.name}`;
        }
    } else {
        envContent = `GEMINI_API_KEY=${process.env.GEMINI_API_KEY || ''}\nFILE_SEARCH_STORE_NAME=${store.name}\nPORT=3001`;
    }
    fs.writeFileSync(ENV_FILE, envContent);

    console.log('\n═══════════════════════════════════════════');
    console.log(' ✓ 初始化完成!');
    console.log('═══════════════════════════════════════════');
    console.log(`\nFile Search Store: ${store.name}`);
    console.log('已保存到 .env 文件\n');
    console.log('现在可以运行 npm run dev 启动服务器');
}

setup().catch(error => {
    console.error('初始化失败:', error);
    process.exit(1);
});
