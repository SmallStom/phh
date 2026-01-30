from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from typing import List
from app.dependencies import get_current_user
from app.models.user import User
from app.core.upload import upload_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """上传图片"""
    try:
        result = await upload_service.save_image(
            file=file,
            tenant_id=str(current_user.tenant_id),
            user_id=str(current_user.id)
        )
        return {
            "success": True,
            "data": result
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image upload failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="图片上传失败"
        )


@router.post("/file")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """上传文件"""
    try:
        result = await upload_service.save_upload(
            file=file,
            tenant_id=str(current_user.tenant_id),
            user_id=str(current_user.id)
        )
        return {
            "success": True,
            "data": result
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File upload failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="文件上传失败"
        )


@router.post("/images")
async def upload_multiple_images(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    """批量上传图片"""
    results = []
    errors = []
    
    for file in files:
        try:
            result = await upload_service.save_image(
                file=file,
                tenant_id=str(current_user.tenant_id),
                user_id=str(current_user.id)
            )
            results.append(result)
        except HTTPException as e:
            errors.append({"filename": file.filename, "error": e.detail})
        except Exception as e:
            logger.error(f"Image upload failed: {e}")
            errors.append({"filename": file.filename, "error": "上传失败"})
    
    return {
        "success": len(errors) == 0,
        "data": results,
        "errors": errors if errors else None
    }
