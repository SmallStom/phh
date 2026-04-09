"""
SEO API 路由 - 提供 sitemap.xml 和 robots.txt 的动态接口
"""

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.core.database import get_db
from app.models.record import Record, RecordStatus
from app.models.experience import Experience

router = APIRouter()

SITE_URL = "https://ysypjf.cn"


@router.get("/sitemap.xml")
async def sitemap(db: Session = Depends(get_db)):
    """生成 sitemap.xml，包含静态页面和动态内容"""
    urls = []
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # 静态页面
    static_pages = [
        {"path": "/", "priority": "1.0", "changefreq": "daily"},
        {"path": "/records", "priority": "0.8", "changefreq": "daily"},
        {"path": "/experiences", "priority": "0.7", "changefreq": "weekly"},
        {"path": "/collections", "priority": "0.7", "changefreq": "weekly"},
        {"path": "/search", "priority": "0.5", "changefreq": "daily"},
    ]

    for page in static_pages:
        urls.append(f"""  <url>
    <loc>{SITE_URL}{page['path']}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>{page['changefreq']}</changefreq>
    <priority>{page['priority']}</priority>
  </url>""")

    # 动态内容 - 公开记录（最多100条）
    try:
        records = (
            db.query(Record)
            .filter(Record.status == RecordStatus.PUBLISHED, Record.is_public == True)
            .order_by(Record.published_at.desc())
            .limit(100)
            .all()
        )
        for record in records:
            lastmod = today
            if record.updated_at:
                lastmod = record.updated_at.strftime("%Y-%m-%d")
            elif record.created_at:
                lastmod = record.created_at.strftime("%Y-%m-%d")
            urls.append(f"""  <url>
    <loc>{SITE_URL}/records/{record.id}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>""")
    except Exception:
        pass

    # 动态内容 - 经历（最多50条）
    try:
        experiences = (
            db.query(Experience)
            .order_by(Experience.start_date.desc())
            .limit(50)
            .all()
        )
        for exp in experiences:
            lastmod = today
            if exp.updated_at:
                lastmod = exp.updated_at.strftime("%Y-%m-%d")
            elif exp.created_at:
                lastmod = exp.created_at.strftime("%Y-%m-%d")
            urls.append(f"""  <url>
    <loc>{SITE_URL}/experiences/{exp.id}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>""")
    except Exception:
        pass

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{"".join(urls)}
</urlset>"""

    return Response(
        content=xml,
        media_type="application/xml",
        headers={"Cache-Control": "public, max-age=3600"}
    )


@router.get("/robots.txt")
async def robots():
    """返回 robots.txt"""
    content = """User-agent: *
Allow: /
Disallow: /api/
Disallow: /ws/
Disallow: /login
Disallow: /register
Disallow: /profile
Disallow: /records/new
Disallow: /experiences/new
Disallow: /collections/new
Disallow: /settings/

# Sitemap
Sitemap: https://ysypjf.cn/sitemap.xml

# 百度爬虫
User-agent: Baiduspider
Allow: /
Disallow: /api/
Disallow: /ws/
Sitemap: https://ysypjf.cn/sitemap.xml

# Google 爬虫
User-agent: Googlebot
Allow: /
Disallow: /api/
Disallow: /ws/
Sitemap: https://ysypjf.cn/sitemap.xml
"""
    return Response(
        content=content,
        media_type="text/plain",
        headers={"Cache-Control": "public, max-age=86400"}
    )
