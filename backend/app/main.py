from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from app.config import settings
from app.api import auth, records, experiences, collections, tags, likes, comments, admin, follows, upload, analytics, notifications, users, websocket, notification_settings, mentions, share
from fastapi.exceptions import RequestValidationError
import logging
import os

logger = logging.getLogger(__name__)

app = FastAPI(title="PHH - Personal History Hub", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(records.router)
app.include_router(experiences.router)
app.include_router(collections.router)
app.include_router(tags.router)
app.include_router(likes.router)
app.include_router(comments.router)
app.include_router(admin.router)
app.include_router(follows.router)
app.include_router(upload.router)
app.include_router(analytics.router)
app.include_router(notifications.router)
app.include_router(users.router)
app.include_router(websocket.router)
app.include_router(notification_settings.router)
app.include_router(mentions.router)
app.include_router(share.router)

# 挂载静态文件服务（上传的文件）
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error: {exc.errors()}")
    body = await request.body()
    logger.error(f"Request body: {body}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "body": body.decode('utf-8') if body else ""},
    )


@app.get("/")
async def root():
    return {"message": "Welcome to PHH - Personal History Hub API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
