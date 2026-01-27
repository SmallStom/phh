from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.api import auth, records, experiences, collections, tags, likes, comments
from fastapi.exceptions import RequestValidationError
import logging

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
