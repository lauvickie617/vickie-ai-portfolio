
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
      const error = await response.json();
      throw new Error(error.error || 'API请求失败');
    }

    const data: ChatResponse = await response.json();
    return data.response;
  } catch (error) {
    console.error("API Error:", error);
    return "抱歉，与AI服务通信时出现错误，请稍后再试。";
  }
};
