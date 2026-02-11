export interface GuessItem {
  id: string;
  imageUrl: string;
  cropRegion: {
    x: number; // 0-100 percentage
    y: number;
    width: number;
    height: number;
  };
  hintKeywords: string[]; // 提示关键词（看似是什么）
  correctKeywords: string[]; // 正确答案关键词
  difficulty: 'easy' | 'medium' | 'hard';
  funFact?: string; // 有趣的事实
}

// 游戏数据 - 30道题目
export const guessItems: GuessItem[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=800',
    cropRegion: { x: 40, y: 30, width: 20, height: 25 },
    hintKeywords: ['眼睛', '瞳孔', '黑色', '圆形'],
    correctKeywords: ['汽车', '车灯', '前灯', '车灯', '交通工具'],
    difficulty: 'easy',
    funFact: '这是汽车的前大灯，在特定角度下看起来就像一只眼睛在注视着你！'
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    cropRegion: { x: 35, y: 20, width: 30, height: 30 },
    hintKeywords: ['人脸', '侧脸', '轮廓', '鼻子', '人'],
    correctKeywords: ['山', '山脉', '山峰', '自然', '风景', '山丘'],
    difficulty: 'medium',
    funFact: '这是阿尔卑斯山脉的轮廓，大自然鬼斧神工，创造出如此像人脸的山峰！'
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    cropRegion: { x: 25, y: 35, width: 25, height: 20 },
    hintKeywords: ['毛', '毛发', '动物', '皮毛', '纹理'],
    correctKeywords: ['树皮', '树', '木头', '植物', '树干'],
    difficulty: 'medium',
    funFact: '这是老橡树的树皮纹理，岁月的痕迹让它看起来像动物的皮毛！'
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1534234828563-0254170f0060?w=800',
    cropRegion: { x: 30, y: 25, width: 40, height: 30 },
    hintKeywords: ['云', '天空', '白云', '棉花糖', '白色'],
    correctKeywords: ['爆米花', '玉米', '食物', '零食'],
    difficulty: 'easy',
    funFact: '这是一碗刚爆好的爆米花，蓬松的样子和云朵简直一模一样！'
  },
  {
    id: '5',
    imageUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800',
    cropRegion: { x: 20, y: 40, width: 35, height: 25 },
    hintKeywords: ['波浪', '海浪', '水', '蓝色', '海洋'],
    correctKeywords: ['山', '山脉', '山峰', '自然', '风景'],
    difficulty: 'hard',
    funFact: '这是清晨的山脉剪影，层层叠叠的样子像极了海浪！'
  },
  {
    id: '6',
    imageUrl: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800',
    cropRegion: { x: 45, y: 35, width: 15, height: 20 },
    hintKeywords: ['眼睛', '动物眼睛', '黑色', '瞳孔'],
    correctKeywords: ['葡萄', '水果', '紫葡萄', '食物'],
    difficulty: 'easy',
    funFact: '这是一颗饱满的紫葡萄，表面的光泽让它看起来像动物的眼睛！'
  },
  {
    id: '7',
    imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800',
    cropRegion: { x: 30, y: 30, width: 40, height: 35 },
    hintKeywords: ['星空', '星星', '宇宙', '银河', '夜空'],
    correctKeywords: ['沙子', '沙滩', '沙漠', '沙粒', '海滩'],
    difficulty: 'hard',
    funFact: '这是显微镜下的沙粒，每一颗都像一颗小小的星球！'
  },
  {
    id: '8',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    cropRegion: { x: 35, y: 20, width: 30, height: 40 },
    hintKeywords: ['头发', '发丝', '棕色', '毛发'],
    correctKeywords: ['草', '草地', '草坪', '植物', '草叶'],
    difficulty: 'medium',
    funFact: '这是清晨沾满露珠的草叶，细长的样子像极了头发！'
  },
  {
    id: '9',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    cropRegion: { x: 25, y: 25, width: 50, height: 40 },
    hintKeywords: ['太阳', '日落', '红色', '圆形', '火球'],
    correctKeywords: ['披萨', '食物', '意大利', '饼'],
    difficulty: 'easy',
    funFact: '这是一张刚出炉的披萨，金黄的芝士和红色的番茄酱像极了日落！'
  },
  {
    id: '10',
    imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800',
    cropRegion: { x: 40, y: 30, width: 20, height: 30 },
    hintKeywords: ['火焰', '火', '红色', '橙色', '燃烧'],
    correctKeywords: ['花', '花朵', '红花', '植物', '花瓣'],
    difficulty: 'medium',
    funFact: '这是一朵盛开的红色花朵，花瓣的形状像极了跳动的火焰！'
  },
  {
    id: '11',
    imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800',
    cropRegion: { x: 20, y: 20, width: 30, height: 30 },
    hintKeywords: ['雪花', '冰晶', '白色', '六边形', '冬天'],
    correctKeywords: ['盐', '食盐', '调料', '晶体'],
    difficulty: 'hard',
    funFact: '这是显微镜下的盐晶体，每一颗都是完美的几何形状！'
  },
  {
    id: '12',
    imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800',
    cropRegion: { x: 35, y: 40, width: 30, height: 25 },
    hintKeywords: ['嘴唇', '嘴巴', '红色', '粉色'],
    correctKeywords: ['花瓣', '花', '花朵', '玫瑰', '植物'],
    difficulty: 'easy',
    funFact: '这是玫瑰花瓣的特写，柔软的曲线像极了嘴唇！'
  },
  {
    id: '13',
    imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
    cropRegion: { x: 25, y: 25, width: 50, height: 40 },
    hintKeywords: ['森林', '树木', '绿色', '自然'],
    correctKeywords: ['西兰花', '蔬菜', '食物', '绿色'],
    difficulty: 'easy',
    funFact: '这是一颗西兰花，密集的小花蕾看起来就像一片微型森林！'
  },
  {
    id: '14',
    imageUrl: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800',
    cropRegion: { x: 40, y: 30, width: 25, height: 25 },
    hintKeywords: ['月亮', '月球', '圆形', '灰色', '夜晚'],
    correctKeywords: ['饼干', '曲奇', '食物', '零食'],
    difficulty: 'easy',
    funFact: '这是一块圆形的饼干，表面的纹理像极了月球表面！'
  },
  {
    id: '15',
    imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800',
    cropRegion: { x: 30, y: 35, width: 20, height: 20 },
    hintKeywords: ['眼睛', '瞳孔', '绿色', '眼球'],
    correctKeywords: ['露珠', '水滴', '露水', '水', '叶子'],
    difficulty: 'medium',
    funFact: '这是叶子上的露珠，倒映着周围的景色，像一颗绿色的眼睛！'
  },
  {
    id: '16',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    cropRegion: { x: 20, y: 30, width: 35, height: 30 },
    hintKeywords: ['羽毛', '鸟', '白色', '柔软'],
    correctKeywords: ['蒲公英', '花', '植物', '种子'],
    difficulty: 'medium',
    funFact: '这是蒲公英的种子，白色的绒毛像极了羽毛！'
  },
  {
    id: '17',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    cropRegion: { x: 35, y: 25, width: 30, height: 35 },
    hintKeywords: ['指纹', '纹路', '螺旋', '图案'],
    correctKeywords: ['木头', '年轮', '树', '树干'],
    difficulty: 'hard',
    funFact: '这是树木的年轮，一圈圈的生长痕迹像极了巨大的指纹！'
  },
  {
    id: '18',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    cropRegion: { x: 30, y: 30, width: 40, height: 35 },
    hintKeywords: ['大脑', '纹理', '灰色', '沟回'],
    correctKeywords: ['核桃', '坚果', '食物'],
    difficulty: 'medium',
    funFact: '这是核桃的剖面，复杂的纹理和人类大脑惊人地相似！'
  },
  {
    id: '19',
    imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800',
    cropRegion: { x: 25, y: 25, width: 30, height: 30 },
    hintKeywords: ['血管', '红色', '网络', '人体'],
    correctKeywords: ['树叶', '叶子', '叶脉', '植物'],
    difficulty: 'medium',
    funFact: '这是树叶的叶脉，分支的结构像极了人体的血管系统！'
  },
  {
    id: '20',
    imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
    cropRegion: { x: 40, y: 35, width: 25, height: 25 },
    hintKeywords: ['豹纹', '斑点', '动物', '黄色'],
    correctKeywords: ['香蕉', '水果', '食物'],
    difficulty: 'easy',
    funFact: '这是香蕉皮上的斑点，老化后的纹理像极了豹纹！'
  },
  {
    id: '21',
    imageUrl: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800',
    cropRegion: { x: 30, y: 30, width: 40, height: 30 },
    hintKeywords: ['洞穴', '入口', '黑暗', '隧道'],
    correctKeywords: ['贝壳', '海螺', '海洋', '贝壳'],
    difficulty: 'hard',
    funFact: '这是海螺壳的内部，螺旋的结构看起来像一个神秘的洞穴！'
  },
  {
    id: '22',
    imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800',
    cropRegion: { x: 35, y: 30, width: 30, height: 30 },
    hintKeywords: ['龙卷风', '漩涡', '旋转', '风暴'],
    correctKeywords: ['咖啡', '拿铁', '饮料', '拉花'],
    difficulty: 'medium',
    funFact: '这是咖啡拉花的特写，奶泡的漩涡像极了龙卷风！'
  },
  {
    id: '23',
    imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800',
    cropRegion: { x: 25, y: 25, width: 35, height: 35 },
    hintKeywords: ['城市', '建筑', '高楼', '密集'],
    correctKeywords: ['蜂巢', '蜜蜂', '六边形', '自然'],
    difficulty: 'hard',
    funFact: '这是蜂巢的特写，六边形的结构像极了密集的城市建筑群！'
  },
  {
    id: '24',
    imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800',
    cropRegion: { x: 40, y: 35, width: 25, height: 25 },
    hintKeywords: ['太阳', '光芒', '黄色', '发光'],
    correctKeywords: ['柠檬', '水果', '切片', '黄色'],
    difficulty: 'easy',
    funFact: '这是切开的柠檬，果肉和果皮的纹理像极了太阳的光芒！'
  },
  {
    id: '25',
    imageUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800',
    cropRegion: { x: 30, y: 30, width: 40, height: 30 },
    hintKeywords: ['河流', '蓝色', '流动', '水'],
    correctKeywords: ['道路', '公路', '马路', '交通'],
    difficulty: 'medium',
    funFact: '这是从高空俯瞰的公路，蜿蜒的样子像极了河流！'
  },
  {
    id: '26',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    cropRegion: { x: 35, y: 30, width: 30, height: 30 },
    hintKeywords: ['星球', '地球', '蓝色', '球体'],
    correctKeywords: ['弹珠', '玻璃球', '玩具', '玻璃'],
    difficulty: 'medium',
    funFact: '这是一颗玻璃弹珠，内部的纹理让它看起来像一颗微型星球！'
  },
  {
    id: '27',
    imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800',
    cropRegion: { x: 25, y: 35, width: 35, height: 25 },
    hintKeywords: ['蜘蛛网', '网状', '白色', '丝'],
    correctKeywords: ['裂纹', '玻璃', '破碎', '裂痕'],
    difficulty: 'hard',
    funFact: '这是破碎玻璃的裂纹，分叉的纹路像极了蜘蛛网！'
  },
  {
    id: '28',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    cropRegion: { x: 30, y: 30, width: 40, height: 30 },
    hintKeywords: ['珊瑚', '海洋', '粉色', '分支'],
    correctKeywords: ['菜花', '花菜', '蔬菜', '食物'],
    difficulty: 'medium',
    funFact: '这是一颗菜花，密集的小花蕾像极了珊瑚！'
  },
  {
    id: '29',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    cropRegion: { x: 35, y: 25, width: 30, height: 40 },
    hintKeywords: ['瀑布', '水流', '白色', '流动'],
    correctKeywords: ['窗帘', '纱帘', '白色', '布料'],
    difficulty: 'medium',
    funFact: '这是白色的纱帘，飘动的样子像极了瀑布！'
  },
  {
    id: '30',
    imageUrl: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800',
    cropRegion: { x: 40, y: 35, width: 25, height: 25 },
    hintKeywords: ['眼睛', '瞳孔', '黑色', '凝视'],
    correctKeywords: ['墨水', '墨滴', '水中', '扩散'],
    difficulty: 'hard',
    funFact: '这是墨水滴入水中的瞬间，扩散的墨汁像一只深邃的眼睛！'
  }
];

// 根据日期获取今日题目
export const getTodayItem = (): GuessItem => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const index = dayOfYear % guessItems.length;
  return guessItems[index];
};

// 检查答案是否匹配
export const checkAnswer = (userAnswer: string, item: GuessItem): { isCorrect: boolean; similarity: number } => {
  const normalizedUserAnswer = userAnswer.toLowerCase().trim();
  
  // 检查正确答案关键词
  for (const keyword of item.correctKeywords) {
    if (normalizedUserAnswer.includes(keyword.toLowerCase())) {
      return { isCorrect: true, similarity: 100 };
    }
  }
  
  // 检查提示关键词（如果用户猜的是提示内容，给部分分数）
  for (const keyword of item.hintKeywords) {
    if (normalizedUserAnswer.includes(keyword.toLowerCase())) {
      return { isCorrect: false, similarity: 30 };
    }
  }
  
  return { isCorrect: false, similarity: 0 };
};

// 计算得分
export const calculateScore = (attempts: number, usedHint: boolean): number => {
  let baseScore = 100;
  
  // 根据尝试次数扣分
  baseScore -= (attempts - 1) * 20;
  
  // 使用提示扣分
  if (usedHint) {
    baseScore -= 30;
  }
  
  return Math.max(baseScore, 10);
};
