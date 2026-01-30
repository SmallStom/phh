"""
初始化演示数据脚本
用于生产环境初始化一些示例记录
"""
import asyncio
import asyncpg
import os
import sys
from datetime import datetime, timedelta
import uuid

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import settings

# 示例记录数据
DEMO_RECORDS = [
    {
        "title": "今日份的小确幸",
        "content": "早上出门的时候，发现小区的樱花开了，粉粉嫩嫩的特别好看。路过咖啡店时，店员小姐姐还多送了我一块曲奇饼干，说今天是我常来买的第100天。生活中的这些小美好，真的能让心情变得超级好！🌸☕",
        "record_type": "note",
        "tags": ["生活", "小确幸", "樱花"],
        "image_urls": [
            "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800",
            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800"
        ]
    },
    {
        "title": "周末徒步日记",
        "content": "今天和朋友去了郊外的青山徒步，全程12公里，虽然有点累但是风景真的太美了！山顶的云海简直像仙境一样，还遇到了一群可爱的小松鼠。下次一定要带上帐篷来露营！🏔️🐿️",
        "record_type": "log",
        "tags": ["徒步", "户外", "周末", "风景"],
        "image_urls": [
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
            "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800"
        ]
    },
    {
        "title": "读完《百年孤独》有感",
        "content": "终于读完了马尔克斯的《百年孤独》，布恩迪亚家族七代人的传奇故事让我深深震撼。孤独是人类的宿命，但爱与记忆可以穿越时空。书中那句'生命中真正重要的不是你遭遇了什么，而是你记住了什么，以及你如何铭记'让我思考了很久。📖✨",
        "record_type": "idea",
        "tags": ["读书", "思考", "文学"],
        "image_urls": [
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800"
        ]
    },
    {
        "title": "学会做红烧肉啦！",
        "content": "今天跟着视频学做了红烧肉，虽然过程有点复杂，要炒糖色、要小火慢炖，但是成品真的超级香！肥而不腻，入口即化，配上一碗白米饭简直绝了。妈妈视频的时候都说看起来很有食欲，下次回家做给她吃！🍖🍚",
        "record_type": "note",
        "tags": ["美食", "烹饪", "生活"],
        "image_urls": [
            "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800"
        ]
    },
    {
        "title": "深夜加班的感悟",
        "content": "又是一个加班到深夜的日子，看着窗外的城市灯火，突然觉得自己也是这繁华都市中的一盏灯。虽然辛苦，但想到自己的努力能让产品变得更好，让用户更满意，就觉得一切都值得。加油，打工人！💪🌃",
        "record_type": "idea",
        "tags": ["工作", "感悟", "生活"],
        "image_urls": [
            "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
            "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"
        ]
    },
    {
        "title": "带猫咪去体检",
        "content": "今天带家里的橘猫'橘子'去做年度体检，虽然一路上它都在抗议（喵喵叫了一路），但检查结果一切正常，医生说它很健康，就是需要控制一下体重了哈哈。回家奖励了它一根猫条，现在正躺在阳光下睡大觉呢。🐱💕",
        "record_type": "log",
        "tags": ["宠物", "猫咪", "日常"],
        "image_urls": [
            "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800",
            "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800"
        ]
    },
    {
        "title": "雨后的彩虹",
        "content": "下午突然下了一场大雨，本来以为今天就这样了，没想到雨停后竟然出现了双彩虹！赶紧跑到天台拍了几张照片，真的太美了。生活中总会有意想不到的惊喜，就像这场雨后的彩虹一样。🌈🌧️",
        "record_type": "note",
        "tags": ["风景", "彩虹", "自然"],
        "image_urls": [
            "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800",
            "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800"
        ]
    },
    {
        "title": "学习摄影的第一个月",
        "content": "入手相机已经一个月了，从最开始只会按快门，到现在慢慢学会了调光圈、快门速度、ISO。虽然拍出来的照片还比不上大神们，但比起第一天已经进步很多了。摄影让我学会了用不同的角度观察世界，发现生活中的美。📷🎨",
        "record_type": "log",
        "tags": ["摄影", "学习", "成长"],
        "image_urls": [
            "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800",
            "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800",
            "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800"
        ]
    },
    {
        "title": "和老友的聚会",
        "content": "大学毕业三年了，今天和几个室友终于聚到了一起。大家都有了不同的生活，有人结婚了，有人创业了，有人还在追寻梦想。但坐在一起聊天的时候，仿佛又回到了那个一起熬夜打游戏的宿舍时光。友谊万岁！🍻👫",
        "record_type": "note",
        "tags": ["友情", "聚会", "回忆"],
        "image_urls": [
            "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800",
            "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800"
        ]
    },
    {
        "title": "清晨的冥想时光",
        "content": "最近开始尝试每天早上冥想15分钟，虽然一开始总是静不下来，脑子里各种杂念纷飞。但坚持了两周后，慢慢能找到那种平静的感觉了。感觉整个人都变得更有耐心，工作效率也提高了不少。推荐给压力大的朋友们！🧘‍♀️🌿",
        "record_type": "idea",
        "tags": ["冥想", "健康", "自律"],
        "image_urls": [
            "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
            "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800"
        ]
    }
]


async def init_demo_data():
    """初始化演示数据"""
    conn = await asyncpg.connect(settings.DATABASE_URL)
    
    try:
        # 获取第一个用户作为作者
        user = await conn.fetchrow("SELECT id, tenant_id FROM users LIMIT 1")
        if not user:
            print("错误：没有用户，请先创建用户")
            return
        
        user_id = user['id']
        tenant_id = user['tenant_id']
        
        print(f"使用用户 ID: {user_id}")
        
        # 获取或创建标签
        tag_map = {}
        all_tags = set()
        for record in DEMO_RECORDS:
            all_tags.update(record['tags'])
        
        for tag_name in all_tags:
            tag = await conn.fetchrow(
                "SELECT id FROM tags WHERE name = $1",
                tag_name
            )
            if tag:
                tag_map[tag_name] = str(tag['id'])
            else:
                # 创建新标签
                new_tag_id = uuid.uuid4()
                await conn.execute(
                    """INSERT INTO tags (id, tenant_id, name, created_at, updated_at)
                       VALUES ($1, $2, $3, NOW(), NOW())""",
                    new_tag_id, tenant_id, tag_name
                )
                tag_map[tag_name] = str(new_tag_id)
                print(f"创建标签: {tag_name}")
        
        # 创建记录
        for i, record_data in enumerate(DEMO_RECORDS):
            # 生成不同的时间（最近10天内）
            days_ago = i % 10
            hours_ago = (i * 2) % 24
            created_at = datetime.now() - timedelta(days=days_ago, hours=hours_ago)
            
            record_id = uuid.uuid4()
            
            # 插入记录
            await conn.execute(
                """INSERT INTO records 
                   (id, tenant_id, user_id, title, content, record_type, status,
                    is_public, image_urls, published_at,
                    created_at, updated_at)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)""",
                record_id,
                tenant_id,
                user_id,
                record_data['title'],
                record_data['content'],
                record_data['record_type'],
                'published',  # status
                True,  # is_public
                record_data['image_urls'],  # image_urls (PostgreSQL array)
                created_at,  # published_at
                created_at,
                created_at
            )
            
            # 关联标签
            for tag_name in record_data['tags']:
                tag_id = tag_map.get(tag_name)
                if tag_id:
                    content_tag_id = uuid.uuid4()
                    await conn.execute(
                        """INSERT INTO content_tags 
                           (id, tenant_id, tag_id, content_type, content_id, created_at)
                           VALUES ($1, $2, $3, $4, $5, $6)""",
                        content_tag_id,
                        tenant_id,
                        uuid.UUID(tag_id),
                        'record',
                        record_id,
                        created_at
                    )
            
            print(f"创建记录: {record_data['title']} ({len(record_data['image_urls'])} 张图片)")
        
        print(f"\n✅ 成功创建 {len(DEMO_RECORDS)} 条演示记录！")
        
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(init_demo_data())
