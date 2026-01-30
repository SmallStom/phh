import os
import uuid
import shutil
from pathlib import Path
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException, status
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class UploadService:
    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        
        # 创建子目录
        self.images_dir = self.upload_dir / "images"
        self.files_dir = self.upload_dir / "files"
        self.images_dir.mkdir(exist_ok=True)
        self.files_dir.mkdir(exist_ok=True)
    
    def _generate_filename(self, original_filename: str) -> str:
        ext = Path(original_filename).suffix.lower()
        unique_name = f"{uuid.uuid4().hex}{ext}"
        return unique_name
    
    def _get_content_type(self, filename: str) -> str:
        ext = Path(filename).suffix.lower()
        content_type_map = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
            '.json': 'application/json',
            '.md': 'text/markdown',
        }
        return content_type_map.get(ext, 'application/octet-stream')
    
    def _is_allowed_file(self, content_type: str, filename: str) -> Tuple[bool, str]:
        if content_type in settings.ALLOWED_IMAGE_TYPES:
            return True, "image"
        if content_type in settings.ALLOWED_FILE_TYPES:
            return True, "file"
        
        # 根据扩展名再检查一次
        ext = Path(filename).suffix.lower()
        image_exts = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
        file_exts = ['.pdf', '.txt', '.json', '.md']
        
        if ext in image_exts:
            return True, "image"
        if ext in file_exts:
            return True, "file"
        
        return False, ""
    
    async def save_upload(
        self,
        file: UploadFile,
        tenant_id: str,
        user_id: str
    ) -> dict:
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="文件名不能为空"
            )
        
        # 检查文件大小
        content = await file.read()
        file_size = len(content)
        
        if file_size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"文件大小超过限制 ({settings.MAX_UPLOAD_SIZE / 1024 / 1024}MB)"
            )
        
        # 检查文件类型
        content_type = file.content_type or self._get_content_type(file.filename)
        is_allowed, file_category = self._is_allowed_file(content_type, file.filename)
        
        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"不支持的文件类型: {content_type}"
            )
        
        # 生成唯一文件名
        unique_filename = self._generate_filename(file.filename)
        
        # 按租户和用户组织目录
        if file_category == "image":
            save_dir = self.images_dir / str(tenant_id) / str(user_id)
        else:
            save_dir = self.files_dir / str(tenant_id) / str(user_id)
        
        save_dir.mkdir(parents=True, exist_ok=True)
        file_path = save_dir / unique_filename
        
        # 保存文件
        with open(file_path, "wb") as f:
            f.write(content)
        
        # 构建访问URL
        relative_path = file_path.relative_to(self.upload_dir)
        file_url = f"/uploads/{relative_path.as_posix()}"
        
        logger.info(f"File uploaded: {file_url} ({file_size} bytes)")
        
        return {
            "filename": file.filename,
            "url": file_url,
            "size": file_size,
            "content_type": content_type,
            "category": file_category
        }
    
    async def save_image(
        self,
        file: UploadFile,
        tenant_id: str,
        user_id: str
    ) -> dict:
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="文件名不能为空"
            )
        
        content = await file.read()
        file_size = len(content)
        
        if file_size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"文件大小超过限制 ({settings.MAX_UPLOAD_SIZE / 1024 / 1024}MB)"
            )
        
        content_type = file.content_type or self._get_content_type(file.filename)
        
        if content_type not in settings.ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"不支持的图片类型: {content_type}"
            )
        
        unique_filename = self._generate_filename(file.filename)
        save_dir = self.images_dir / str(tenant_id) / str(user_id)
        save_dir.mkdir(parents=True, exist_ok=True)
        file_path = save_dir / unique_filename
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        relative_path = file_path.relative_to(self.upload_dir)
        file_url = f"/uploads/{relative_path.as_posix()}"
        
        logger.info(f"Image uploaded: {file_url} ({file_size} bytes)")
        
        return {
            "filename": file.filename,
            "url": file_url,
            "size": file_size,
            "content_type": content_type
        }
    
    def delete_file(self, file_url: str) -> bool:
        try:
            # 从URL解析文件路径
            if file_url.startswith("/uploads/"):
                relative_path = file_url.replace("/uploads/", "")
                file_path = self.upload_dir / relative_path
                
                if file_path.exists():
                    file_path.unlink()
                    logger.info(f"File deleted: {file_url}")
                    return True
            
            return False
        except Exception as e:
            logger.error(f"Failed to delete file {file_url}: {e}")
            return False
    
    def get_file_path(self, file_url: str) -> Optional[Path]:
        if file_url.startswith("/uploads/"):
            relative_path = file_url.replace("/uploads/", "")
            file_path = self.upload_dir / relative_path
            if file_path.exists():
                return file_path
        return None


# 全局上传服务实例
upload_service = UploadService()
