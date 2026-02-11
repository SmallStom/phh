import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// 处理 API_URL，如果已经以 /api 结尾，则不再添加
const BASE_URL = API_URL.endsWith('/api') ? `${API_URL}/ai-assistant` : `${API_URL}/api/ai-assistant`;

// 创建 axios 实例
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 类型定义
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  conversation_history?: ChatMessage[];
}

export interface ChatResponse {
  success: boolean;
  content?: string;
  error?: string;
  model?: string;
}

export interface AIStatus {
  enabled: boolean;
  model?: string;
}

// API 函数
export const aiAssistantApi = {
  /**
   * 获取 AI 助手状态
   */
  getStatus: async (): Promise<AIStatus> => {
    const response = await api.get('/status');
    return response.data;
  },

  /**
   * 发送聊天消息（非流式）
   */
  chat: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post('/chat', request);
    return response.data;
  },

  /**
   * 发送聊天消息（流式）
   */
  chatStream: async (
    request: ChatRequest,
    onMessage: (chunk: string) => void,
    onError?: (error: string) => void,
    onComplete?: () => void
  ): Promise<void> => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Stream request failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              onComplete?.();
              return;
            }

            if (data.startsWith('[ERROR]')) {
              onError?.(data.slice(7).trim());
              return;
            }

            onMessage(data);
          }
        }
      }

      onComplete?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Stream error';
      onError?.(errorMessage);
    }
  },

  /**
   * 发送带图片的聊天消息
   */
  chatWithImage: async (
    message: string,
    image: File,
    conversation_history?: ChatMessage[]
  ): Promise<ChatResponse> => {
    const formData = new FormData();
    formData.append('message', message);
    formData.append('image', image);
    
    if (conversation_history) {
      formData.append('conversation_history', JSON.stringify(conversation_history));
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/chat/with-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Image upload failed');
    }

    return response.json();
  },
};

export default aiAssistantApi;
