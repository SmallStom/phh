from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.record import Record
from app.models.comment import Comment
from app.schemas.comment import CommentCreate, CommentResponse, CommentListResponse
from app.core.notification import notification_service
from app.core.analytics import analytics_service
from app.utils.mention import process_mentions
from app.models.notification import NotificationType
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/records", tags=["comments"])


def build_comment_tree(comments: list, parent_id: str = None, depth: int = 0, max_depth: int = 3) -> list:
    """构建评论树结构"""
    if depth >= max_depth:
        return []
    
    result = []
    for comment in comments:
        if str(comment.parent_id) == str(parent_id) if parent_id else comment.parent_id is None:
            comment_dict = CommentResponse.model_validate(comment).model_dump()
            # 递归获取子评论
            children = build_comment_tree(comments, str(comment.id), depth + 1, max_depth)
            comment_dict['replies'] = children
            comment_dict['reply_count'] = len(children)
            result.append(CommentResponse(**comment_dict))
    return result


@router.post("/{record_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    record_id: str,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Record).options(
        joinedload(Record.user)
    ).filter(
        Record.id == record_id,
        Record.is_public == True
    ).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found or not public"
        )
    
    # 如果是回复评论，验证父评论是否存在
    parent_comment = None
    if comment_data.parent_id:
        parent_comment = db.query(Comment).filter(
            Comment.id == comment_data.parent_id,
            Comment.record_id == record_id
        ).first()
        
        if not parent_comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent comment not found"
            )
    
    comment = Comment(
        tenant_id=current_user.tenant_id,
        record_id=record_id,
        user_id=current_user.id,
        content=comment_data.content,
        parent_id=comment_data.parent_id,
        reply_to_user_id=comment_data.reply_to_user_id
    )
    
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    # 更新热门排行
    analytics_service._update_hot_ranking("record", record_id, 3)
    
    # 发送站内通知
    try:
        # 通知记录作者（如果不是自己评论）
        if record.user and record.user.id != current_user.id:
            # 如果是回复评论，且不是回复给记录作者，则不通知记录作者
            if not comment_data.parent_id or str(comment_data.reply_to_user_id) == str(record.user.id):
                notification_service.notify_comment(
                    db=db,
                    recipient_id=str(record.user.id),
                    sender_id=str(current_user.id),
                    sender_name=current_user.username,
                    content_type="记录",
                    content_title=record.title or "无标题",
                    comment_content=comment_data.content,
                    content_id=record_id
                )
        
        # 如果是回复评论，通知被回复的用户（如果不是自己）
        if comment_data.reply_to_user_id and str(comment_data.reply_to_user_id) != str(current_user.id):
            notification_service.notify_comment_reply(
                db=db,
                recipient_id=comment_data.reply_to_user_id,
                sender_id=str(current_user.id),
                sender_name=current_user.username,
                content_type="记录",
                content_title=record.title or "无标题",
                comment_content=comment_data.content,
                content_id=record_id,
                parent_comment_id=comment_data.parent_id
            )
    except Exception as e:
        logger.error(f"Failed to create comment notification: {e}")
    
    # 处理 @提及
    try:
        mentioned_user_ids = process_mentions(
            db=db,
            content=comment_data.content,
            sender_id=str(current_user.id),
            content_type="record",
            content_id=record_id,
            comment_id=str(comment.id)
        )
        
        # 发送提及通知
        for user_id in mentioned_user_ids:
            notification_service.create_notification(
                db=db,
                recipient_id=user_id,
                type=NotificationType.MENTION,
                title=f"{current_user.username} 在评论中提到了你",
                content=f"在《{record.title or '无标题'}》中: {comment_data.content[:50]}{'...' if len(comment_data.content) > 50 else ''}",
                sender_id=str(current_user.id),
                resource_type="record",
                resource_id=record_id,
                comment_id=str(comment.id)  # 添加评论ID用于跳转
            )
    except Exception as e:
        logger.error(f"Failed to process mentions: {e}")
    
    return CommentResponse.model_validate(comment)


@router.get("/{record_id}/comments", response_model=CommentListResponse)
async def get_comments(
    record_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    parent_id: Optional[str] = Query(None, description="筛选特定评论的回复"),
    db: Session = Depends(get_db)
):
    record = db.query(Record).filter(
        Record.id == record_id,
        Record.is_public == True
    ).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found or not public"
        )
    
    query = db.query(Comment).options(
        joinedload(Comment.user),
        joinedload(Comment.reply_to_user)
    ).filter(
        Comment.record_id == record_id,
        Comment.is_deleted == False  # 过滤掉已删除的评论
    )
    
    # 如果指定了 parent_id，只获取该评论的回复
    if parent_id:
        query = query.filter(Comment.parent_id == parent_id)
    else:
        # 默认只获取顶级评论
        query = query.filter(Comment.parent_id.is_(None))
    
    total = query.count()
    comments = query.order_by(Comment.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    # 获取这些评论的回复数量
    comment_responses = []
    for comment in comments:
        response = CommentResponse.model_validate(comment)
        # 计算回复数量（只统计未删除的回复）
        reply_count = db.query(Comment).filter(Comment.parent_id == comment.id, Comment.is_deleted == False).count()
        response.reply_count = reply_count
        comment_responses.append(response)
    
    return CommentListResponse(
        data=comment_responses,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{record_id}/comments/{comment_id}/replies", response_model=CommentListResponse)
async def get_comment_replies(
    record_id: str,
    comment_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """获取某条评论的回复列表"""
    record = db.query(Record).filter(
        Record.id == record_id,
        Record.is_public == True
    ).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found or not public"
        )
    
    # 验证父评论是否存在
    parent_comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.record_id == record_id
    ).first()
    
    if not parent_comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    query = db.query(Comment).options(
        joinedload(Comment.user),
        joinedload(Comment.reply_to_user)
    ).filter(
        Comment.record_id == record_id,
        Comment.parent_id == comment_id,
        Comment.is_deleted == False  # 过滤掉已删除的评论
    )
    
    total = query.count()
    comments = query.order_by(Comment.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    return CommentListResponse(
        data=[CommentResponse.model_validate(comment) for comment in comments],
        total=total,
        page=page,
        page_size=page_size
    )


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.user_id == current_user.id
    ).first()
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # 软删除：标记为已删除，但保留内容
    comment.is_deleted = True
    comment.content = "[已删除]"
    db.commit()
    
    return None
