import re
from typing import List, Tuple
from sqlalchemy.orm import Session
from app.models.user import User


def parse_mentions(content: str) -> List[str]:
    """
    解析文本中的 @用户名 提及
    
    Args:
        content: 文本内容
        
    Returns:
        List[str]: 被提及的用户名列表（不包含@符号）
    """
    # 匹配 @用户名，用户名可以包含字母、数字、下划线、中文
    pattern = r'@([\w\u4e00-\u9fff]+)'
    mentions = re.findall(pattern, content)
    return list(set(mentions))  # 去重


def get_users_by_usernames(db: Session, usernames: List[str]) -> List[User]:
    """
    根据用户名列表获取用户对象
    
    Args:
        db: 数据库会话
        usernames: 用户名列表
        
    Returns:
        List[User]: 用户对象列表
    """
    if not usernames:
        return []
    
    users = db.query(User).filter(
        User.username.in_(usernames)
    ).all()
    
    return users


def process_mentions(
    db: Session,
    content: str,
    sender_id: str,
    content_type: str,
    content_id: str,
    comment_id: str = None
) -> List[str]:
    """
    处理文本中的提及，创建提及记录
    
    Args:
        db: 数据库会话
        content: 文本内容
        sender_id: 发送者ID
        content_type: 内容类型（record/experience/collection）
        content_id: 内容ID
        comment_id: 评论ID（可选）
        
    Returns:
        List[str]: 被提及的用户ID列表
    """
    from app.models.mention import Mention
    
    # 解析提及的用户名
    usernames = parse_mentions(content)
    if not usernames:
        return []
    
    # 获取用户对象
    users = get_users_by_usernames(db, usernames)
    
    mentioned_user_ids = []
    
    for user in users:
        # 不给自己创建提及
        if str(user.id) == sender_id:
            continue
            
        # 检查是否已经存在相同的提及
        existing = db.query(Mention).filter(
            Mention.sender_id == sender_id,
            Mention.recipient_id == user.id,
            Mention.content_type == content_type,
            Mention.content_id == content_id,
            Mention.comment_id == comment_id
        ).first()
        
        if not existing:
            mention = Mention(
                sender_id=sender_id,
                recipient_id=user.id,
                content_type=content_type,
                content_id=content_id,
                comment_id=comment_id
            )
            db.add(mention)
            mentioned_user_ids.append(str(user.id))
    
    db.commit()
    return mentioned_user_ids
