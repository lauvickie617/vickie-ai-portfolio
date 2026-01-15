
/**
 * Gemini API 服务
 * 通过后端API进行RAG查询
 */

interface HistoryMessage {
  role: string;
  parts: { text: string }[];
}

interface ChatResponse {
  response: string;
  timestamp: number;
}

const API_BASE_URL = '/api';

export const sendMessageToGemini = async (
  userMessage: string,
  history: HistoryMessage[]
): Promise<string> => {
  try {
    // 转换历史格式
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.parts[0]?.text || ''
    }));

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        history: formattedHistory
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `请求失败: ${response.status}`);
    }

    const data: ChatResponse = await response.json();
    return data.response;
  } catch (error: any) {
    console.error("API Error:", error);
    // 返回具体错误信息
    return `Error: ${error.message || "Connection to AI service failed."}`;
  }
};
