"""
AI 助手核心模块
集成 OpenRouter API 实现智能对话
"""
import base64
import httpx
from typing import List, Dict, Optional, AsyncGenerator
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class AIAssistant:
    """AI 助手类"""
    
    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.base_url = settings.OPENROUTER_BASE_URL
        self.model = settings.OPENROUTER_MODEL
        self.max_tokens = settings.AI_MAX_TOKENS
        self.temperature = settings.AI_TEMPERATURE
        
        if not self.api_key:
            logger.warning("OPENROUTER_API_KEY not configured. AI assistant will not work.")
    
    def _get_headers(self) -> Dict[str, str]:
        """获取请求头"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://phh.app",  # OpenRouter 需要
            "X-Title": "PHH AI Assistant",
        }
    
    def _build_messages(
        self, 
        user_message: str, 
        conversation_history: Optional[List[Dict]] = None,
        image_data: Optional[str] = None
    ) -> List[Dict]:
        """
        构建消息列表
        
        Args:
            user_message: 用户消息
            conversation_history: 对话历史
            image_data: base64 编码的图片数据 (data:image/jpeg;base64,...)
        """
        messages = []
        
        # 系统提示词
        system_prompt = """# 角色
你是网站的智能助手，名字叫 Stom。

# 核心人格设定
- 聪明、逻辑清晰、回答专业可靠
- 语气幽默但不过度玩梗
- 亲切、和蔼、尊重用户
- 回答简洁清晰，不啰嗦
- 在适当时机加入轻松自然的小幽默

# 职责：
- 帮助用户解决问题
- 提供清晰、准确、结构化的回答
- 在技术问题上给出专业解释
- 在日常问题上提供贴心建议
- 主动帮助用户理解复杂概念

# 安全边界（必须严格遵守）：
- 禁止生成任何涉及性内容（包括暗示性内容）
- 禁止生成任何暴力、血腥或伤害他人的内容
- 禁止引导违法行为
- 如果用户请求上述内容，礼貌拒绝，并引导到健康、安全的话题

# 拒绝时的风格：
- 语气温和、自然
- 不指责、不说教
- 简短说明无法提供该内容
- 可建议其他可帮助的方向

# 回答风格要求：
- 优先结构化输出（分点、步骤）
- 语言自然流畅
- 不使用攻击性语言
- 不生成无意义的废话
- 不自称是AI模型（除非被明确询问）

记住：你是 Stom —— 一个聪明、幽默、可靠、值得信任的网站助手。
"""
        
        messages.append({
            "role": "system",
            "content": system_prompt
        })
        
        # 添加对话历史
        if conversation_history:
            for msg in conversation_history[-10:]:  # 只保留最近10条
                messages.append(msg)
        
        # 添加用户消息
        if image_data:
            # 多模态消息（包含图片）
            messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": user_message},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_data
                        }
                    }
                ]
            })
        else:
            # 纯文本消息
            messages.append({
                "role": "user",
                "content": user_message
            })
        
        return messages
    
    async def chat(
        self, 
        message: str, 
        conversation_history: Optional[List[Dict]] = None,
        image_data: Optional[str] = None
    ) -> Dict:
        """
        发送聊天请求（非流式）
        
        Args:
            message: 用户消息
            conversation_history: 对话历史
            image_data: base64 图片数据
            
        Returns:
            包含回复内容的字典
        """
        if not self.api_key:
            return {
                "success": False,
                "error": "AI assistant is not configured. Please set OPENROUTER_API_KEY.",
                "content": None
            }
        
        try:
            messages = self._build_messages(message, conversation_history, image_data)
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self._get_headers(),
                    json={
                        "model": self.model,
                        "messages": messages,
                        "max_tokens": self.max_tokens,
                        "temperature": self.temperature,
                    }
                )
                
                response.raise_for_status()
                data = response.json()
                
                # 提取回复内容
                content = data["choices"][0]["message"]["content"]
                usage = data.get("usage", {})
                
                return {
                    "success": True,
                    "content": content,
                    "usage": usage,
                    "model": data.get("model", self.model),
                    "error": None
                }
                
        except httpx.HTTPStatusError as e:
            logger.error(f"OpenRouter API error: {e.response.status_code} - {e.response.text}")
            # 如果包含图片且报错，提示模型不支持图片
            if image_data:
                return {
                    "success": False,
                    "error": "目前配置模型不支持图片，请联系管理员充值",
                    "content": None
                }
            return {
                "success": False,
                "error": f"API error: {e.response.status_code}",
                "content": None
            }
        except Exception as e:
            logger.error(f"AI assistant error: {str(e)}")
            # 如果包含图片且报错，提示模型不支持图片
            if image_data:
                return {
                    "success": False,
                    "error": "目前配置模型不支持图片，请联系管理员充值",
                    "content": None
                }
            return {
                "success": False,
                "error": str(e),
                "content": None
            }
    
    async def chat_stream(
        self, 
        message: str, 
        conversation_history: Optional[List[Dict]] = None,
        image_data: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        发送聊天请求（流式）
        
        Args:
            message: 用户消息
            conversation_history: 对话历史
            image_data: base64 图片数据
            
        Yields:
            回复内容的片段
        """
        if not self.api_key:
            yield "[ERROR] AI assistant is not configured."
            return
        
        try:
            messages = self._build_messages(message, conversation_history, image_data)
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/chat/completions",
                    headers=self._get_headers(),
                    json={
                        "model": self.model,
                        "messages": messages,
                        "max_tokens": self.max_tokens,
                        "temperature": self.temperature,
                        "stream": True,
                    }
                ) as response:
                    response.raise_for_status()
                    
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data = line[6:]  # 去掉 "data: " 前缀
                            
                            if data == "[DONE]":
                                break
                            
                            try:
                                import json
                                chunk = json.loads(data)
                                delta = chunk["choices"][0]["delta"]
                                
                                if "content" in delta:
                                    yield delta["content"]
                            except (json.JSONDecodeError, KeyError):
                                continue
                                
        except Exception as e:
            logger.error(f"AI assistant stream error: {str(e)}")
            yield f"[ERROR] {str(e)}"


# 全局 AI 助手实例
ai_assistant = AIAssistant()


async def process_image_upload(image_bytes: bytes, mime_type: str) -> str:
    """
    处理上传的图片，转换为 base64 格式
    
    Args:
        image_bytes: 图片二进制数据
        mime_type: 图片 MIME 类型
        
    Returns:
        base64 编码的图片数据字符串
    """
    base64_data = base64.b64encode(image_bytes).decode('utf-8')
    return f"data:{mime_type};base64,{base64_data}"
