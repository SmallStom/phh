import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  X,
  Send,
  ImagePlus,
  Loader2,
  Trash2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { aiAssistantApi, type ChatMessage } from '../../services/aiAssistantApi';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 检查 AI 状态
  useEffect(() => {
    if (isOpen) {
      checkAIStatus();
    }
  }, [isOpen]);

  // 滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const checkAIStatus = async () => {
    try {
      const status = await aiAssistantApi.getStatus();
      setAiEnabled(status.enabled);
    } catch (error) {
      setAiEnabled(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedImage) return;
    if (isLoading || isStreaming) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setError(null);

    // 添加用户消息
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: userMessage || '图片' },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      if (selectedImage) {
        // 发送带图片的消息
        try {
          const response = await aiAssistantApi.chatWithImage(
            userMessage,
            selectedImage,
            messages
          );

          if (response.success && response.content) {
            setMessages([
              ...newMessages,
              { role: 'assistant', content: response.content },
            ]);
          } else {
            setError(response.error || '发送失败');
          }
        } catch (error) {
          // 检查是否是模型不支持图片的错误
          const errorMsg = error instanceof Error ? error.message : '';
          if (errorMsg.includes('目前配置模型不支持图片')) {
            setError('目前配置模型不支持图片，请联系管理员充值');
          } else {
            setError(errorMsg || '发送失败');
          }
        } finally {
          // 无论成功失败，都停止加载状态
          setIsLoading(false);
        }

        // 清除图片
        setSelectedImage(null);
        setImagePreview(null);
      } else {
        // 使用流式响应
        setIsStreaming(true);
        let assistantContent = '';

        await aiAssistantApi.chatStream(
          { message: userMessage, conversation_history: messages },
          (chunk) => {
            assistantContent += chunk;
            // 实时更新消息
            setMessages((prev) => {
              const newMsgs = [...prev];
              const lastMsg = newMsgs[newMsgs.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                lastMsg.content = assistantContent;
              } else {
                newMsgs.push({ role: 'assistant', content: assistantContent });
              }
              return newMsgs;
            });
          },
          (errorMsg) => {
            setError(errorMsg);
            setIsStreaming(false);
            setIsLoading(false);
          },
          () => {
            setIsStreaming(false);
            setIsLoading(false);
          }
        );
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '发送失败');
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('只支持 JPEG、PNG、GIF、WebP 格式的图片');
        return;
      }

      // 验证文件大小（最大 5MB）
      if (file.size > 5 * 1024 * 1024) {
        setError('图片大小不能超过 5MB');
        return;
      }

      setSelectedImage(file);
      setError(null);

      // 创建预览
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setError(null);
    clearImage();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/30"
            onClick={onClose}
          />

          {/* 聊天窗口 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed right-4 bottom-4 z-[9999] w-[400px] h-[600px] bg-[var(--card-bg)] rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="bg-gradient-to-r from-terracotta-500 to-terracotta-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">AI 助手</h3>
                  <p className="text-xs text-white/70">
                    {aiEnabled ? (
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        在线
                      </span>
                    ) : (
                      '未配置'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearConversation}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="清空对话"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 消息区域 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
                  <Bot className="w-12 h-12 mb-4 opacity-30" />
                  <p className="text-sm">你好！我是 AI 助手</p>
                  <p className="text-xs mt-1">可以问我任何问题，或上传图片让我分析</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                        message.role === 'user'
                          ? 'bg-terracotta-500 text-white rounded-br-md'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-bl-md'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </motion.div>
                ))
              )}

              {/* 错误提示 */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center"
                >
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-full text-xs">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                </motion.div>
              )}

              {/* 加载动画 */}
              {isLoading && !isStreaming && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-[var(--bg-secondary)] px-4 py-3 rounded-2xl rounded-bl-md">
                    <Loader2 className="w-5 h-5 animate-spin text-terracotta-500" />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 图片预览 */}
            {imagePreview && (
              <div className="px-4 py-2 border-t border-[var(--border-color)]">
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-16 w-auto rounded-lg object-cover"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* 输入区域 */}
            <div className="p-4 border-t border-[var(--border-color)]">
              <div className="flex items-end gap-2">
                {/* 图片上传按钮 */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isStreaming || !aiEnabled}
                  className="p-2.5 text-[var(--text-muted)] hover:text-terracotta-500 hover:bg-terracotta-50 rounded-xl transition-colors disabled:opacity-50"
                >
                  <ImagePlus className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {/* 输入框 */}
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={aiEnabled ? '输入消息...' : 'AI 助手未配置'}
                    disabled={isLoading || isStreaming || !aiEnabled}
                    rows={1}
                    className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-terracotta-400 resize-none disabled:opacity-50"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                </div>

                {/* 发送按钮 */}
                <button
                  onClick={handleSendMessage}
                  disabled={
                    (!inputMessage.trim() && !selectedImage) ||
                    isLoading ||
                    !aiEnabled
                  }
                  className="p-2.5 bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
                AI 助手可能会产生不准确的信息，请核实重要信息
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
