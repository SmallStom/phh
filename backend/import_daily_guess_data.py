#!/usr/bin/env python3
"""
每日一猜题目数据导入脚本

使用方法:
1. 直接运行导入示例数据:
   python import_daily_guess_data.py

2. 从JSON文件导入:
   python import_daily_guess_data.py --file data.json

3. 指定日期范围导入:
   python import_daily_guess_data.py --start-date 2026-02-11 --days 30

JSON文件格式示例:
[
    {
        "date": "2026-02-11",
        "image_url": "https://example.com/image1.jpg",
        "correct_answers": ["故宫", "紫禁城", "故宫博物院"],
        "hint_keywords": ["建筑", "北京", "皇宫"],
        "difficulty": "medium",
        "crop_region": {"x": 30, "y": 20, "width": 40, "height": 40},
        "fun_fact": "故宫是中国明清两代的皇家宫殿，旧称紫禁城。"
    }
]
"""

import argparse
import json
import sys
from datetime import date, timedelta
from typing import List, Dict, Any


from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.daily_guess import DailyGuessItem


# 示例数据 - 可以替换为实际数据
# 使用可靠的图片URL，确保图片与答案匹配
SAMPLE_DATA = [
    {
        "date": "2026-02-11",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg/800px-Tour_Eiffel_Wikimedia_Commons.jpg",
        "correct_answers": ["埃菲尔铁塔", "巴黎铁塔", "Eiffel Tower"],
        "hint_keywords": ["法国", "巴黎", "地标", "铁"],
        "difficulty": "easy",
        "crop_region": {"x": 35, "y": 10, "width": 30, "height": 60},
        "fun_fact": "埃菲尔铁塔建于1889年，高324米，是巴黎最著名的地标之一。"
    },
    {
        "date": "2026-02-12",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/800px-Taj_Mahal_%28Edited%29.jpeg",
        "correct_answers": ["泰姬陵", "Taj Mahal"],
        "hint_keywords": ["印度", "白色", "陵墓", "圆顶"],
        "difficulty": "medium",
        "crop_region": {"x": 30, "y": 15, "width": 40, "height": 50},
        "fun_fact": "泰姬陵是莫卧儿皇帝沙贾汗为纪念爱妻而建的白色大理石陵墓。"
    },
    {
        "date": "2026-02-13",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Sydney_Opera_House_Sails.jpg/800px-Sydney_Opera_House_Sails.jpg",
        "correct_answers": ["悉尼歌剧院", "Sydney Opera House"],
        "hint_keywords": ["澳大利亚", "悉尼", "建筑", "贝壳"],
        "difficulty": "medium",
        "crop_region": {"x": 20, "y": 25, "width": 60, "height": 40},
        "fun_fact": "悉尼歌剧院的设计灵感来自于橘子瓣，于1973年正式开放。"
    },
    {
        "date": "2026-02-14",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/The_Great_Wall_of_China_at_Jinshanling-edit.jpg/800px-The_Great_Wall_of_China_at_Jinshanling-edit.jpg",
        "correct_answers": ["长城", "万里长城", "Great Wall"],
        "hint_keywords": ["中国", "古代", "防御", "山脉"],
        "difficulty": "easy",
        "crop_region": {"x": 10, "y": 30, "width": 80, "height": 30},
        "fun_fact": "长城总长度超过2万公里，是人类历史上最长的建筑工程。"
    },
    {
        "date": "2026-02-15",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/800px-Colosseo_2020.jpg",
        "correct_answers": ["罗马斗兽场", "斗兽场", "Colosseum"],
        "hint_keywords": ["意大利", "罗马", "古代", "圆形"],
        "difficulty": "medium",
        "crop_region": {"x": 25, "y": 20, "width": 50, "height": 50},
        "fun_fact": "罗马斗兽场建于公元72-80年，可容纳5-8万名观众。"
    },
    {
        "date": "2026-02-16",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Lady_Liberty_under_a_blue_sky_%28cropped%29.jpg/800px-Lady_Liberty_under_a_blue_sky_%28cropped%29.jpg",
        "correct_answers": ["自由女神像", "自由女神", "Statue of Liberty"],
        "hint_keywords": ["美国", "纽约", "雕像", "绿色"],
        "difficulty": "easy",
        "crop_region": {"x": 35, "y": 10, "width": 30, "height": 70},
        "fun_fact": "自由女神像是法国送给美国的礼物，于1886年揭幕。"
    },
    {
        "date": "2026-02-17",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/800px-Taj_Mahal_%28Edited%29.jpeg",
        "correct_answers": ["泰姬陵", "印度泰姬陵", "Taj Mahal"],
        "hint_keywords": ["印度", "白色", "陵墓", "爱情"],
        "difficulty": "medium",
        "crop_region": {"x": 30, "y": 20, "width": 40, "height": 50},
        "fun_fact": "泰姬陵被誉为世界新七大奇迹之一，是莫卧儿建筑的巅峰之作。"
    },
]


def load_data_from_file(file_path: str) -> List[Dict[str, Any]]:
    """从JSON文件加载数据"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def validate_item(item: Dict[str, Any]) -> bool:
    """验证数据项是否有效"""
    required_fields = ['date', 'image_url', 'correct_answers', 'crop_region']
    
    for field in required_fields:
        if field not in item:
            print(f"错误: 缺少必填字段 '{field}'")
            return False
    
    # 验证crop_region格式
    crop = item['crop_region']
    if not all(k in crop for k in ['x', 'y', 'width', 'height']):
        print("错误: crop_region 必须包含 x, y, width, height")
        return False
    
    return True


def import_data(db: Session, data: List[Dict[str, Any]], skip_existing: bool = True) -> Dict[str, int]:
    """
    导入数据到数据库
    
    Args:
        db: 数据库会话
        data: 要导入的数据列表
        skip_existing: 如果日期已存在是否跳过
        
    Returns:
        统计信息
    """
    stats = {
        'total': len(data),
        'success': 0,
        'skipped': 0,
        'failed': 0
    }
    
    for item in data:
        try:
            # 验证数据
            if not validate_item(item):
                stats['failed'] += 1
                continue
            
            # 检查是否已存在
            existing = db.query(DailyGuessItem).filter(
                DailyGuessItem.date == item['date']
            ).first()
            
            if existing:
                if skip_existing:
                    print(f"跳过: {item['date']} 已存在")
                    stats['skipped'] += 1
                    continue
                else:
                    # 更新现有记录
                    existing.image_url = item['image_url']
                    existing.correct_answers = item['correct_answers']
                    existing.hint_keywords = item.get('hint_keywords', [])
                    existing.difficulty = item.get('difficulty', 'medium')
                    existing.crop_region = item['crop_region']
                    existing.fun_fact = item.get('fun_fact', '')
                    existing.is_active = item.get('is_active', True)
                    print(f"更新: {item['date']}")
            else:
                # 创建新记录
                new_item = DailyGuessItem(
                    date=item['date'],
                    image_url=item['image_url'],
                    correct_answers=item['correct_answers'],
                    hint_keywords=item.get('hint_keywords', []),
                    difficulty=item.get('difficulty', 'medium'),
                    crop_region=item['crop_region'],
                    fun_fact=item.get('fun_fact', ''),
                    is_active=item.get('is_active', True)
                )
                db.add(new_item)
                print(f"导入: {item['date']} - {item['correct_answers'][0]}")
            
            db.commit()
            stats['success'] += 1
            
        except Exception as e:
            db.rollback()
            print(f"错误: 导入 {item.get('date', 'unknown')} 失败: {str(e)}")
            stats['failed'] += 1
    
    return stats


def generate_sample_data(start_date: str, days: int) -> List[Dict[str, Any]]:
    """生成指定日期范围的示例数据"""
    base_date = date.fromisoformat(start_date)
    data = []
    
    # 循环使用SAMPLE_DATA
    for i in range(days):
        current_date = base_date + timedelta(days=i)
        sample = SAMPLE_DATA[i % len(SAMPLE_DATA)].copy()
        sample['date'] = current_date.isoformat()
        data.append(sample)
    
    return data


def main():
    parser = argparse.ArgumentParser(description='导入每日一猜题目数据')
    parser.add_argument('--file', '-f', type=str, help='JSON数据文件路径')
    parser.add_argument('--start-date', type=str, help='开始日期 (YYYY-MM-DD)')
    parser.add_argument('--days', type=int, default=7, help='生成天数')
    parser.add_argument('--force', action='store_true', help='强制更新已存在的记录')
    parser.add_argument('--sample', action='store_true', help='使用示例数据')
    
    args = parser.parse_args()
    
    # 准备数据
    if args.file:
        print(f"从文件加载数据: {args.file}")
        data = load_data_from_file(args.file)
    elif args.start_date:
        print(f"生成 {args.days} 天的示例数据，从 {args.start_date} 开始")
        data = generate_sample_data(args.start_date, args.days)
    else:
        print("使用默认示例数据")
        data = SAMPLE_DATA
    
    print(f"\n准备导入 {len(data)} 条数据...\n")
    
    # 导入数据
    db = SessionLocal()
    try:
        stats = import_data(db, data, skip_existing=not args.force)
        
        print("\n" + "="*50)
        print("导入完成!")
        print(f"总计: {stats['total']}")
        print(f"成功: {stats['success']}")
        print(f"跳过: {stats['skipped']}")
        print(f"失败: {stats['failed']}")
        print("="*50)
        
    finally:
        db.close()


if __name__ == "__main__":
    main()
