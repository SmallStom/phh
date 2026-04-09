"""
百度 SEO 主动推送工具
当记录发布时自动将 URL 推送给百度爬虫，加快收录
"""

import httpx
import logging
from typing import Optional, List

logger = logging.getLogger(__name__)

# 百度主动推送 API 配置（从环境变量读取，上线时通过环境变量注入）
BAIDU_PUSH_URL = "http://data.zz.baidu.com/urls?site=ysypjf.cn&token=hbDel2phGIEicZ84"
# 备用 token（如果有）留空即可
BAIDU_PUSH_URL_ALT = ""

SITE_BASE_URL = "https://ysypjf.cn"


def get_record_url(record_id: str) -> str:
    """生成记录的永久 URL"""
    return f"{SITE_BASE_URL}/record/{record_id}"


def push_to_baidu(urls: List[str]) -> dict:
    """
    将 URL 列表推送给百度
    
    Args:
        urls: 要推送的 URL 列表
        
    Returns:
        dict: {"success": int, "remain": int, "not_same_site": int, "error": str}
    """
    if not urls:
        return {"success": 0, "remain": 0, "error": "no_urls"}
    
    body = "\n".join(urls)
    
    # 主 token 推送
    try:
        response = httpx.post(
            BAIDU_PUSH_URL,
            content=body,
            headers={"Content-Type": "text/plain"},
            timeout=10.0,
        )
        result = response.json()
        
        logger.info(
            f"百度推送结果: success={result.get('success')}, "
            f"remain={result.get('remain')}, urls={urls}"
        )
        
        return {
            "success": result.get("success", 0),
            "remain": result.get("remain", 0),
            "not_same_site": result.get("not_same_site", 0),
            "error": result.get("error", ""),
        }
    except httpx.TimeoutException:
        logger.warning(f"百度推送超时: {urls}")
        return {"success": 0, "remain": 0, "error": "timeout"}
    except Exception as e:
        logger.error(f"百度推送失败: {e}, urls={urls}")
        return {"success": 0, "remain": 0, "error": str(e)}


def push_record_to_baidu(record_id: str) -> dict:
    """推送单条记录 URL 到百度"""
    url = get_record_url(record_id)
    return push_to_baidu([url])


def push_homepage_to_baidu() -> dict:
    """推送首页，提示百度首页有更新"""
    return push_to_baidu([SITE_BASE_URL])
