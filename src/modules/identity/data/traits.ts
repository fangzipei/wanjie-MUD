/**
 * 特性/词条数据
 * 
 * 使用说明：
 * - 按 ImpactLevel（影响等级）分类：legendary、epic、rare、uncommon、common
 * - 每个词条包含：名称、描述、等级、正向属性、负向属性
 * - 特性分为四类：出身（origin）、特性（trait）、性格（personality）、天赋（talent）
 * 
 * 扩展方式：
 * 1. 在对应品质的数组中添加新的词条
 * 2. 确保每个词条有正有负（传说品质可无负向）
 * 3. 名称和描述应与品质匹配
 */

import type { ImpactLevel, StatImpact, WorldType } from '@/shared/lib/types';

/**
 * 词条定义
 */
export interface TraitDefinition {
  name: string;           // 词条名称
  description: string;    // 词条描述
  level: ImpactLevel;     // 品质等级
  positiveAttrs: string[]; // 正向影响的属性
  negativeAttrs: string[]; // 负向影响的属性
}

/**
 * 品质数值配置
 * 
 * 说明：
 * - 每个品质有正向和负向数值范围
 * - 正向属性会获得该范围内的随机正值
 * - 负向属性会获得该范围内的随机负值
 */
export const QUALITY_CONFIG: Record<ImpactLevel, {
  positiveRange: [number, number];
  negativeRange: [number, number];
}> = {
  legendary: {
    // 传说品质：正向强，负向弱或无
    positiveRange: [8, 12],
    negativeRange: [-3, -1],
  },
  epic: {
    // 史诗品质：正向较强，负向较小
    positiveRange: [6, 10],
    negativeRange: [-4, -2],
  },
  rare: {
    // 稀有品质：正向中等，负向中等
    positiveRange: [4, 7],
    negativeRange: [-5, -3],
  },
  uncommon: {
    // 优秀品质：正向较小，负向较小
    positiveRange: [3, 5],
    negativeRange: [-5, -3],
  },
  common: {
    // 普通品质：正向小，负向小
    positiveRange: [2, 4],
    negativeRange: [-4, -2],
  },
};

/**
 * 出身词条库
 * 
 * 命名规范：
 * - 传说：天命所归、神脉觉醒等顶级出身
 * - 史诗：名门世家、隐世宗门等优越出身
 * - 稀有：武学世家、书香门第等良好出身
 * - 优秀：落魄贵族、山村猎户等普通出身
 * - 普通：山野村夫、市井小民等平凡出身
 */
export const ORIGIN_TRAITS: Record<ImpactLevel, TraitDefinition[]> = {
  legendary: [
    { name: '天命所归', description: '命格尊贵，万法护佑', level: 'legendary', positiveAttrs: ['幸运', '灵根', '悟性'], negativeAttrs: [] },
    { name: '神脉觉醒', description: '远古神族血脉，天赋无双', level: 'legendary', positiveAttrs: ['体质', '灵根', '悟性'], negativeAttrs: [] },
    { name: '天骄降世', description: '天生异象，神魂不凡', level: 'legendary', positiveAttrs: ['灵根', '悟性', '幸运'], negativeAttrs: [] },
  ],
  epic: [
    { name: '名门世家', description: '底蕴深厚，资源丰富', level: 'epic', positiveAttrs: ['灵根', '悟性'], negativeAttrs: ['意志'] },
    { name: '隐世宗门', description: '传承悠久，道法通玄', level: 'epic', positiveAttrs: ['灵根', '悟性'], negativeAttrs: ['幸运'] },
    { name: '仙门遗脉', description: '先祖曾为仙门长老', level: 'epic', positiveAttrs: ['灵根', '幸运'], negativeAttrs: ['体质'] },
    { name: '皇族贵胄', description: '帝王血脉，气运加身', level: 'epic', positiveAttrs: ['幸运', '悟性'], negativeAttrs: ['意志'] },
  ],
  rare: [
    { name: '武学世家', description: '家传武学，根基扎实', level: 'rare', positiveAttrs: ['体质', '意志'], negativeAttrs: ['悟性'] },
    { name: '书香门第', description: '饱读诗书，聪慧过人', level: 'rare', positiveAttrs: ['悟性', '灵根'], negativeAttrs: ['体质'] },
    { name: '商贾之家', description: '耳濡目染，机敏过人', level: 'rare', positiveAttrs: ['幸运', '悟性'], negativeAttrs: ['体质'] },
    { name: '江湖世家', description: '行走江湖，见多识广', level: 'rare', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['灵根'] },
  ],
  uncommon: [
    { name: '落魄贵族', description: '曾经的荣耀，如今的落寞', level: 'uncommon', positiveAttrs: ['悟性', '意志'], negativeAttrs: ['幸运', '体质'] },
    { name: '山村猎户', description: '山野求生，体魄强健', level: 'uncommon', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根', '悟性'] },
    { name: '小商小贩', description: '市井谋生，精打细算', level: 'uncommon', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['体质', '悟性'] },
    { name: '工匠后代', description: '手艺传家，务实本分', level: 'uncommon', positiveAttrs: ['意志', '体质'], negativeAttrs: ['灵根', '幸运'] },
  ],
  common: [
    { name: '山野村夫', description: '朴实无华，吃苦耐劳', level: 'common', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根', '悟性'] },
    { name: '市井小民', description: '市井谋生，机变灵活', level: 'common', positiveAttrs: ['幸运', '悟性'], negativeAttrs: ['体质', '意志'] },
    { name: '农户子弟', description: '勤劳朴素，踏实肯干', level: 'common', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根', '幸运'] },
    { name: '渔民之子', description: '风浪中成长，坚韧不拔', level: 'common', positiveAttrs: ['体质', '幸运'], negativeAttrs: ['悟性', '灵根'] },
  ],
};

/**
 * 特性词条库
 */
export const TRAIT_TRAITS: Record<ImpactLevel, TraitDefinition[]> = {
  legendary: [
    { name: '天命之子', description: '命运眷顾，机缘不断', level: 'legendary', positiveAttrs: ['幸运', '体质', '灵根'], negativeAttrs: [] },
    { name: '逆天改命', description: '我命由我不由天', level: 'legendary', positiveAttrs: ['意志', '悟性', '灵根'], negativeAttrs: [] },
    { name: '大道眷恋', description: '天地灵气自动归附', level: 'legendary', positiveAttrs: ['灵根', '悟性', '幸运'], negativeAttrs: [] },
  ],
  epic: [
    { name: '血脉觉醒', description: '远古血脉，潜力无限', level: 'epic', positiveAttrs: ['体质', '灵根'], negativeAttrs: ['意志'] },
    { name: '悟性超凡', description: '一目十行，举一反三', level: 'epic', positiveAttrs: ['悟性', '灵根'], negativeAttrs: ['体质'] },
    { name: '灵根纯净', description: '天赋异禀，修炼神速', level: 'epic', positiveAttrs: ['灵根', '悟性'], negativeAttrs: ['体质'] },
    { name: '气运惊人', description: '奇遇不断，机缘天成', level: 'epic', positiveAttrs: ['幸运', '悟性'], negativeAttrs: ['意志'] },
  ],
  rare: [
    { name: '逆境成长', description: '愈挫愈勇，突破极限', level: 'rare', positiveAttrs: ['意志', '体质'], negativeAttrs: ['幸运'] },
    { name: '坚韧不拔', description: '百折不挠，意志如铁', level: 'rare', positiveAttrs: ['意志', '体质'], negativeAttrs: ['幸运'] },
    { name: '体质异禀', description: '钢筋铁骨，力大无穷', level: 'rare', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根'] },
    { name: '心性坚韧', description: '心境如铁，难以动摇', level: 'rare', positiveAttrs: ['意志', '悟性'], negativeAttrs: ['幸运'] },
  ],
  uncommon: [
    { name: '勤奋刻苦', description: '笨鸟先飞，勤能补拙', level: 'uncommon', positiveAttrs: ['意志', '悟性'], negativeAttrs: ['幸运', '体质'] },
    { name: '谨慎行事', description: '三思后行，稳重可靠', level: 'uncommon', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['体质', '悟性'] },
    { name: '思维敏捷', description: '头脑灵活，反应迅速', level: 'uncommon', positiveAttrs: ['悟性', '幸运'], negativeAttrs: ['体质', '意志'] },
    { name: '机缘平平', description: '无特殊天赋，需加倍努力', level: 'uncommon', positiveAttrs: ['意志', '体质'], negativeAttrs: ['灵根', '幸运'] },
  ],
  common: [
    { name: '凡人之躯', description: '普普通通，稳扎稳打', level: 'common', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根', '幸运'] },
    { name: '资质一般', description: '天赋平平，后天补足', level: 'common', positiveAttrs: ['意志', '悟性'], negativeAttrs: ['灵根', '幸运'] },
    { name: '体格健壮', description: '身体不错，其他一般', level: 'common', positiveAttrs: ['体质', '幸运'], negativeAttrs: ['灵根', '悟性'] },
    { name: '运气尚可', description: '机缘一般，努力为先', level: 'common', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['灵根', '体质'] },
  ],
};

/**
 * 性格词条库
 */
export const PERSONALITY_TRAITS: Record<ImpactLevel, TraitDefinition[]> = {
  legendary: [
    { name: '道心通明', description: '心如明镜，万法归一', level: 'legendary', positiveAttrs: ['悟性', '意志', '灵根'], negativeAttrs: [] },
    { name: '天命所钟', description: '命运女神的宠儿', level: 'legendary', positiveAttrs: ['幸运', '悟性', '意志'], negativeAttrs: [] },
    { name: '心如止水', description: '波澜不惊，万物不扰', level: 'legendary', positiveAttrs: ['意志', '悟性', '灵根'], negativeAttrs: [] },
  ],
  epic: [
    { name: '沉稳内敛', description: '深思熟虑，厚积薄发', level: 'epic', positiveAttrs: ['悟性', '意志'], negativeAttrs: ['幸运'] },
    { name: '光明磊落', description: '坦荡正直，心怀正气', level: 'epic', positiveAttrs: ['意志', '幸运'], negativeAttrs: ['悟性'] },
    { name: '热情开朗', description: '广结善缘，贵人相助', level: 'epic', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['灵根'] },
    { name: '孤僻高傲', description: '独来独往，心无旁骛', level: 'epic', positiveAttrs: ['灵根', '悟性'], negativeAttrs: ['幸运'] },
  ],
  rare: [
    { name: '热血冲动', description: '勇往直前，无所畏惧', level: 'rare', positiveAttrs: ['体质', '幸运'], negativeAttrs: ['悟性'] },
    { name: '腹黑深沉', description: '城府极深，步步为营', level: 'rare', positiveAttrs: ['悟性', '幸运'], negativeAttrs: ['体质'] },
    { name: '单纯善良', description: '赤子之心，福泽深厚', level: 'rare', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['悟性'] },
    { name: '谨慎多疑', description: '步步为营，不轻信人', level: 'rare', positiveAttrs: ['意志', '幸运'], negativeAttrs: ['体质'] },
  ],
  uncommon: [
    { name: '优柔寡断', description: '犹豫不决，但思虑周全', level: 'uncommon', positiveAttrs: ['悟性', '意志'], negativeAttrs: ['幸运', '体质'] },
    { name: '急功近利', description: '急于求成，行动力强', level: 'uncommon', positiveAttrs: ['幸运', '体质'], negativeAttrs: ['意志', '悟性'] },
    { name: '胆小谨慎', description: '小心谨慎，善于避险', level: 'uncommon', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['体质', '悟性'] },
    { name: '孤僻冷漠', description: '独来独往，专注修行', level: 'uncommon', positiveAttrs: ['意志', '灵根'], negativeAttrs: ['幸运', '悟性'] },
  ],
  common: [
    { name: '平凡性格', description: '性格平和，中规中矩', level: 'common', positiveAttrs: ['意志', '幸运'], negativeAttrs: ['体质', '悟性'] },
    { name: '随遇而安', description: '不强求，顺其自然', level: 'common', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['灵根', '体质'] },
    { name: '朴实无华', description: '踏实本分，稳重可靠', level: 'common', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根', '幸运'] },
    { name: '心思细腻', description: '观察入微，善于学习', level: 'common', positiveAttrs: ['悟性', '幸运'], negativeAttrs: ['体质', '意志'] },
  ],
};

/**
 * 天赋词条库
 */
export const TALENT_TRAITS: Record<ImpactLevel, TraitDefinition[]> = {
  legendary: [
    { name: '先天道体', description: '灵气亲和，修炼如虎添翼', level: 'legendary', positiveAttrs: ['灵根', '悟性', '体质'], negativeAttrs: [] },
    { name: '神识通天', description: '精神超凡，感知敏锐', level: 'legendary', positiveAttrs: ['悟性', '意志', '灵根'], negativeAttrs: [] },
    { name: '剑道通神', description: '剑道天赋，举世无双', level: 'legendary', positiveAttrs: ['悟性', '灵根', '意志'], negativeAttrs: [] },
  ],
  epic: [
    { name: '先天灵体', description: '灵气亲和，修炼神速', level: 'epic', positiveAttrs: ['灵根', '悟性'], negativeAttrs: ['体质'] },
    { name: '神识强大', description: '精神超凡，感知敏锐', level: 'epic', positiveAttrs: ['悟性', '意志'], negativeAttrs: ['体质'] },
    { name: '剑道通灵', description: '剑道天赋，举世无双', level: 'epic', positiveAttrs: ['悟性', '灵根'], negativeAttrs: ['体质'] },
    { name: '气运惊人', description: '奇遇不断，机缘天成', level: 'epic', positiveAttrs: ['幸运', '悟性'], negativeAttrs: ['意志'] },
  ],
  rare: [
    { name: '血脉觉醒', description: '远古血脉，潜力无限', level: 'rare', positiveAttrs: ['体质', '灵根'], negativeAttrs: ['悟性'] },
    { name: '体魄强横', description: '铜皮铁骨，恢复惊人', level: 'rare', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根'] },
    { name: '坚韧意志', description: '突破瓶颈，势如破竹', level: 'rare', positiveAttrs: ['意志', '悟性'], negativeAttrs: ['幸运'] },
    { name: '修行资质', description: '修行资质不错', level: 'rare', positiveAttrs: ['灵根', '悟性'], negativeAttrs: ['体质'] },
  ],
  uncommon: [
    { name: '修行天赋', description: '有一点修行天赋', level: 'uncommon', positiveAttrs: ['灵根', '悟性'], negativeAttrs: ['体质', '幸运'] },
    { name: '意志坚定', description: '意志还算坚定', level: 'uncommon', positiveAttrs: ['意志', '体质'], negativeAttrs: ['灵根', '幸运'] },
    { name: '体魄不错', description: '身体还算健康', level: 'uncommon', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根', '悟性'] },
    { name: '悟性尚可', description: '理解能力不错', level: 'uncommon', positiveAttrs: ['悟性', '幸运'], negativeAttrs: ['体质', '灵根'] },
  ],
  common: [
    { name: '天赋平庸', description: '普普通通，需努力', level: 'common', positiveAttrs: ['意志', '体质'], negativeAttrs: ['灵根', '幸运'] },
    { name: '资质一般', description: '资质一般，后天补足', level: 'common', positiveAttrs: ['意志', '幸运'], negativeAttrs: ['灵根', '体质'] },
    { name: '体格正常', description: '身体健康，正常水平', level: 'common', positiveAttrs: ['体质', '幸运'], negativeAttrs: ['灵根', '悟性'] },
    { name: '运气平平', description: '机缘一般，努力为先', level: 'common', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['灵根', '体质'] },
  ],
};

/**
 * 属性列表
 */

// ============================================
// 世界差异化词条池
// ============================================

/**
 * 科技世界出身词条
 */
const TECH_ORIGIN: Record<ImpactLevel, TraitDefinition[]> = {
  legendary: [
    { name: '觉醒先驱', description: '首批觉醒者，拥有最强大的超能力基因', level: 'legendary', positiveAttrs: ['灵根', '悟性', '体质'], negativeAttrs: [] },
    { name: '造物主计划', description: '政府秘密实验的完美产物', level: 'legendary', positiveAttrs: ['体质', '灵根', '意志'], negativeAttrs: [] },
    { name: '数据原生', description: '人机融合的第一代成功案例', level: 'legendary', positiveAttrs: ['悟性', '灵根', '幸运'], negativeAttrs: [] },
  ],
  epic: [
    { name: '财阀继承人', description: '控制着星际能源的家族后裔', level: 'epic', positiveAttrs: ['幸运', '悟性'], negativeAttrs: ['体质'] },
    { name: '联邦军官', description: '从小接受军事化训练', level: 'epic', positiveAttrs: ['体质', '意志'], negativeAttrs: ['幸运'] },
    { name: 'AI研究者', description: '前沿AI实验室的核心成员', level: 'epic', positiveAttrs: ['悟性', '灵根'], negativeAttrs: ['意志'] },
    { name: '宇宙殖民者', description: '在异星殖民地长大，适应力极强', level: 'epic', positiveAttrs: ['体质', '幸运'], negativeAttrs: ['悟性'] },
  ],
  rare: [
    { name: '机械工程师', description: '精通义体维修与改造', level: 'rare', positiveAttrs: ['悟性', '灵根'], negativeAttrs: ['体质'] },
    { name: '星际商人', description: '穿梭星际，见多识广', level: 'rare', positiveAttrs: ['幸运', '悟性'], negativeAttrs: ['意志'] },
    { name: '黑客出身', description: '潜入系统如入无人之境', level: 'rare', positiveAttrs: ['悟性', '幸运'], negativeAttrs: ['体质'] },
    { name: '佣兵队长', description: '以战养战，战力强悍', level: 'rare', positiveAttrs: ['体质', '意志'], negativeAttrs: ['悟性'] },
  ],
  uncommon: [
    { name: '下层区居民', description: '在城市的阴影中长大', level: 'uncommon', positiveAttrs: ['意志', '幸运'], negativeAttrs: ['灵根', '体质'] },
    { name: '实验室助手', description: '见证了无数实验的失败与成功', level: 'uncommon', positiveAttrs: ['悟性', '意志'], negativeAttrs: ['幸运', '体质'] },
    { name: '矿场工人', description: '在外星矿场练就了强健体魄', level: 'uncommon', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根', '悟性'] },
    { name: '网络主播', description: '靠直播冒险赚钱生活', level: 'uncommon', positiveAttrs: ['幸运', '悟性'], negativeAttrs: ['体质', '意志'] },
  ],
  common: [
    { name: '城市平民', description: '普通的星际都市居民', level: 'common', positiveAttrs: ['幸运', '悟性'], negativeAttrs: ['体质', '意志'] },
    { name: '农场工人', description: '辛苦劳作的殖民地农民', level: 'common', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根', '悟性'] },
    { name: '失业者', description: '被自动化取代的工人', level: 'common', positiveAttrs: ['意志', '幸运'], negativeAttrs: ['灵根', '体质'] },
  ],
};

/** 科技世界天赋词条 */
const TECH_TALENT: Record<ImpactLevel, TraitDefinition[]> = {
  legendary: [
    { name: '量子心智', description: '大脑可以进行量子计算', level: 'legendary', positiveAttrs: ['悟性', '灵根', '意志'], negativeAttrs: [] },
    { name: '纳米共生', description: '体内寄宿着万亿纳米机器人', level: 'legendary', positiveAttrs: ['体质', '灵根', '悟性'], negativeAttrs: [] },
    { name: 'AI同调', description: '可以与任何AI系统完美同步', level: 'legendary', positiveAttrs: ['灵根', '悟性', '幸运'], negativeAttrs: [] },
  ],
  epic: [
    { name: '基因优化', description: '胚胎时期就进行了基因编辑', level: 'epic', positiveAttrs: ['体质', '灵根'], negativeAttrs: ['意志'] },
    { name: '赛博义体', description: '高等级义体改造人', level: 'epic', positiveAttrs: ['体质', '意志'], negativeAttrs: ['悟性'] },
    { name: '黑客天赋', description: '天生的代码掌控者', level: 'epic', positiveAttrs: ['悟性', '灵根'], negativeAttrs: ['体质'] },
    { name: '机械亲和', description: '对机械有着直觉般的理解', level: 'epic', positiveAttrs: ['悟性', '幸运'], negativeAttrs: ['意志'] },
  ],
  rare: [
    { name: '快速学习', description: '新技能掌握速度惊人', level: 'rare', positiveAttrs: ['悟性', '意志'], negativeAttrs: ['体质'] },
    { name: '精准枪法', description: '枪械使用天赋异禀', level: 'rare', positiveAttrs: ['幸运', '体质'], negativeAttrs: ['悟性'] },
    { name: '电路直觉', description: '能凭直觉理解复杂电路', level: 'rare', positiveAttrs: ['灵根', '悟性'], negativeAttrs: ['意志'] },
    { name: '危机预感', description: '能在危险来临时提前感知', level: 'rare', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['体质'] },
  ],
  uncommon: [
    { name: '操作熟练', description: '大部分机器都能快速上手', level: 'uncommon', positiveAttrs: ['悟性', '灵根'], negativeAttrs: ['体质', '幸运'] },
    { name: '体能尚可', description: '通过了基础体检标准', level: 'uncommon', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根', '悟性'] },
    { name: '生存本能', description: '在危险中更容易活下来', level: 'uncommon', positiveAttrs: ['幸运', '体质'], negativeAttrs: ['悟性', '意志'] },
    { name: '数据分析', description: '擅长从数据中发现规律', level: 'uncommon', positiveAttrs: ['悟性', '幸运'], negativeAttrs: ['体质', '灵根'] },
  ],
  common: [
    { name: '普通公民', description: '没有特殊才能的普通人', level: 'common', positiveAttrs: ['意志', '体质'], negativeAttrs: ['灵根', '幸运'] },
    { name: '基础训练', description: '完成了基础战斗训练', level: 'common', positiveAttrs: ['体质', '幸运'], negativeAttrs: ['灵根', '悟性'] },
    { name: '业余兴趣', description: '有一点编程和机械的业余爱好', level: 'common', positiveAttrs: ['悟性', '意志'], negativeAttrs: ['体质', '幸运'] },
  ],
};

/** 魔幻世界出身词条 */
const MAGIC_ORIGIN: Record<ImpactLevel, TraitDefinition[]> = {
  legendary: [
    { name: '神裔血脉', description: '远古神祇的直系后裔', level: 'legendary', positiveAttrs: ['灵根', '悟性', '幸运'], negativeAttrs: [] },
    { name: '龙族契约', description: '出生就与远古巨龙缔结了契约', level: 'legendary', positiveAttrs: ['体质', '灵根', '意志'], negativeAttrs: [] },
    { name: '星界降生', description: '在星界潮汐中降生的特殊灵魂', level: 'legendary', positiveAttrs: ['悟性', '灵根', '体质'], negativeAttrs: [] },
  ],
  epic: [
    { name: '贵族世家', description: '王国最古老的魔法世家', level: 'epic', positiveAttrs: ['幸运', '悟性'], negativeAttrs: ['意志'] },
    { name: '法师议会', description: '魔法议会的嫡系传人', level: 'epic', positiveAttrs: ['灵根', '悟性'], negativeAttrs: ['体质'] },
    { name: '精灵血统', description: '母亲或父亲是高等精灵', level: 'epic', positiveAttrs: ['灵根', '幸运'], negativeAttrs: ['体质'] },
    { name: '屠龙者后裔', description: '祖先曾独自斩杀恶龙', level: 'epic', positiveAttrs: ['体质', '意志'], negativeAttrs: ['幸运'] },
  ],
  rare: [
    { name: '学院派', description: '魔法学院系统教育的产物', level: 'rare', positiveAttrs: ['悟性', '灵根'], negativeAttrs: ['体质'] },
    { name: '流浪法师', description: '跟着师父走遍大陆', level: 'rare', positiveAttrs: ['意志', '幸运'], negativeAttrs: ['悟性'] },
    { name: '佣兵之子', description: '冒险者公会里长大', level: 'rare', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根'] },
    { name: '教会孤儿', description: '被教会收养，信仰虔诚', level: 'rare', positiveAttrs: ['意志', '幸运'], negativeAttrs: ['悟性'] },
  ],
  uncommon: [
    { name: '铁匠学徒', description: '铁匠铺里练就了强健臂力', level: 'uncommon', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根', '幸运'] },
    { name: '草药商贩', description: '采药卖药为生', level: 'uncommon', positiveAttrs: ['幸运', '悟性'], negativeAttrs: ['体质', '意志'] },
    { name: '农夫之子', description: '日出而作日落而息', level: 'uncommon', positiveAttrs: ['体质', '意志'], negativeAttrs: ['悟性', '灵根'] },
    { name: '旅店伙计', description: '见过来自大陆各处的旅行者', level: 'uncommon', positiveAttrs: ['幸运', '悟性'], negativeAttrs: ['体质', '意志'] },
  ],
  common: [
    { name: '贫民窟孤儿', description: '在街头艰难求生', level: 'common', positiveAttrs: ['意志', '幸运'], negativeAttrs: ['灵根', '体质'] },
    { name: '渔村少年', description: '海边长大的普通孩子', level: 'common', positiveAttrs: ['体质', '幸运'], negativeAttrs: ['灵根', '悟性'] },
    { name: '矿工后代', description: '地下矿洞里的劳工家庭', level: 'common', positiveAttrs: ['体质', '意志'], negativeAttrs: ['悟性', '灵根'] },
  ],
};

/** 魔幻世界天赋词条 */
const MAGIC_TALENT: Record<ImpactLevel, TraitDefinition[]> = {
  legendary: [
    { name: '元素之主', description: '四大元素皆听从号令', level: 'legendary', positiveAttrs: ['灵根', '悟性', '意志'], negativeAttrs: [] },
    { name: '龙裔血脉', description: '体内流淌着远古巨龙的血液', level: 'legendary', positiveAttrs: ['体质', '灵根', '意志'], negativeAttrs: [] },
    { name: '先知之眼', description: '能窥见命运的脉络', level: 'legendary', positiveAttrs: ['悟性', '幸运', '灵根'], negativeAttrs: [] },
  ],
  epic: [
    { name: '魔力充盈', description: '天生拥有庞大的魔力池', level: 'epic', positiveAttrs: ['灵根', '悟性'], negativeAttrs: ['体质'] },
    { name: '魔法共鸣', description: '施法时魔力消耗减半', level: 'epic', positiveAttrs: ['灵根', '意志'], negativeAttrs: ['幸运'] },
    { name: '召唤天赋', description: '异界生物愿意回应你的召唤', level: 'epic', positiveAttrs: ['幸运', '灵根'], negativeAttrs: ['体质'] },
    { name: '神术亲和', description: '祈祷更容易得到神灵回应', level: 'epic', positiveAttrs: ['意志', '幸运'], negativeAttrs: ['悟性'] },
  ],
  rare: [
    { name: '火系专精', description: '火焰魔法威力额外+20%', level: 'rare', positiveAttrs: ['灵根', '体质'], negativeAttrs: ['悟性'] },
    { name: '冰系专精', description: '冰霜魔法消耗减少30%', level: 'rare', positiveAttrs: ['灵根', '意志'], negativeAttrs: ['幸运'] },
    { name: '剑术天赋', description: '无论什么武器都能快速掌握', level: 'rare', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根'] },
    { name: '炼金直觉', description: '能感知材料的魔法属性', level: 'rare', positiveAttrs: ['悟性', '幸运'], negativeAttrs: ['体质'] },
  ],
  uncommon: [
    { name: '魔法感知', description: '能微弱感知周围的魔力波动', level: 'uncommon', positiveAttrs: ['灵根', '悟性'], negativeAttrs: ['体质', '幸运'] },
    { name: '语言天赋', description: '学习新语言速度飞快', level: 'uncommon', positiveAttrs: ['悟性', '幸运'], negativeAttrs: ['体质', '意志'] },
    { name: '夜视能力', description: '黑暗中也看得清楚', level: 'uncommon', positiveAttrs: ['幸运', '体质'], negativeAttrs: ['灵根', '悟性'] },
    { name: '草药知识', description: '认识大部分常见药草', level: 'uncommon', positiveAttrs: ['悟性', '意志'], negativeAttrs: ['体质', '幸运'] },
  ],
  common: [
    { name: '无魔力天赋', description: '普通的魔力感知能力', level: 'common', positiveAttrs: ['意志', '体质'], negativeAttrs: ['灵根', '幸运'] },
    { name: '粗浅武艺', description: '会一点基础的防身剑术', level: 'common', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根', '悟性'] },
    { name: '旅行经验', description: '走过不少地方有点阅历', level: 'common', positiveAttrs: ['幸运', '悟性'], negativeAttrs: ['体质', '意志'] },
  ],
};

// 特质和性格词条：科技/魔幻/末世复用修仙的 TRAIT_TRAITS 和 PERSONALITY_TRAITS（这些词条不包含修仙特有概念）

/** 末世世界出身词条 */
const WASTELAND_ORIGIN: Record<ImpactLevel, TraitDefinition[]> = {
  legendary: [
    { name: '避难所领袖', description: '最大避难所的统治家族', level: 'legendary', positiveAttrs: ['意志', '悟性', '幸运'], negativeAttrs: [] },
    { name: '变异先驱', description: '最早成功完成变异的先驱者', level: 'legendary', positiveAttrs: ['体质', '灵根', '意志'], negativeAttrs: [] },
    { name: '灾前遗民', description: '从旧文明时代存活至今的冷冻者', level: 'legendary', positiveAttrs: ['悟性', '灵根', '幸运'], negativeAttrs: [] },
  ],
  epic: [
    { name: '掠夺者首领', description: '废土最强掠夺者部落的王族', level: 'epic', positiveAttrs: ['体质', '意志'], negativeAttrs: ['悟性'] },
    { name: '科学官后代', description: '掌握着战前科技的家族', level: 'epic', positiveAttrs: ['悟性', '灵根'], negativeAttrs: ['体质'] },
    { name: '商队领袖', description: '控制着废土贸易路线的家族', level: 'epic', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['体质'] },
    { name: '幸存者营地', description: '在废土中建立安全区的家族', level: 'epic', positiveAttrs: ['意志', '幸运'], negativeAttrs: ['灵根'] },
  ],
  rare: [
    { name: '废土猎人', description: '专精猎杀变异生物', level: 'rare', positiveAttrs: ['体质', '意志'], negativeAttrs: ['悟性'] },
    { name: '机械师', description: '擅长修理战前机械', level: 'rare', positiveAttrs: ['悟性', '灵根'], negativeAttrs: ['体质'] },
    { name: '拾荒者', description: '在废墟中寻找有价值的东西', level: 'rare', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['体质'] },
    { name: '守夜人', description: '保护营地免受夜间袭击', level: 'rare', positiveAttrs: ['体质', '幸运'], negativeAttrs: ['悟性'] },
  ],
  uncommon: [
    { name: '流民', description: '从一个聚居地流浪到另一个', level: 'uncommon', positiveAttrs: ['意志', '幸运'], negativeAttrs: ['体质', '灵根'] },
    { name: '矿井奴隶', description: '被掠夺者强迫开采矿物的奴隶', level: 'uncommon', positiveAttrs: ['体质', '意志'], negativeAttrs: ['悟性', '灵根'] },
    { name: '逃兵', description: '从掠夺者军队中逃出的士兵', level: 'uncommon', positiveAttrs: ['幸运', '体质'], negativeAttrs: ['意志', '悟性'] },
    { name: '农夫', description: '在受保护的土地上种田为生', level: 'uncommon', positiveAttrs: ['体质', '意志'], negativeAttrs: ['幸运', '悟性'] },
  ],
  common: [
    { name: '废土孤儿', description: '无依无靠独自求生', level: 'common', positiveAttrs: ['意志', '幸运'], negativeAttrs: ['灵根', '体质'] },
    { name: '残存者', description: '辐射区的幸存者', level: 'common', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根', '悟性'] },
    { name: '地下居民', description: '住在地铁隧道的普通人', level: 'common', positiveAttrs: ['意志', '体质'], negativeAttrs: ['幸运', '灵根'] },
  ],
};

/** 末世世界天赋词条 */
const WASTELAND_TALENT: Record<ImpactLevel, TraitDefinition[]> = {
  legendary: [
    { name: '完美适应', description: '任何环境都阻挡不了你', level: 'legendary', positiveAttrs: ['体质', '意志', '灵根'], negativeAttrs: [] },
    { name: '辐射共生', description: '辐射不再是威胁而是能量', level: 'legendary', positiveAttrs: ['灵根', '体质', '意志'], negativeAttrs: [] },
    { name: '战前改造', description: '体内有战前顶级基因改造', level: 'legendary', positiveAttrs: ['悟性', '灵根', '体质'], negativeAttrs: [] },
  ],
  epic: [
    { name: '变异强化', description: '变异使你的肌肉异常发达', level: 'epic', positiveAttrs: ['体质', '意志'], negativeAttrs: ['悟性'] },
    { name: '毒抗体质', description: '大部分毒素对你无效', level: 'epic', positiveAttrs: ['体质', '灵根'], negativeAttrs: ['幸运'] },
    { name: '夜视变异', description: '最黑的夜也看得一清二楚', level: 'epic', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['体质'] },
    { name: '再生能力', description: '伤口愈合速度是常人3倍', level: 'epic', positiveAttrs: ['体质', '意志'], negativeAttrs: ['悟性'] },
  ],
  rare: [
    { name: '追踪本能', description: '能追踪数公里外的猎物', level: 'rare', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['灵根'] },
    { name: '战斗直觉', description: '战斗时反应速度超常', level: 'rare', positiveAttrs: ['体质', '悟性'], negativeAttrs: ['幸运'] },
    { name: '机械天赋', description: '旧机器到你手里就能启动', level: 'rare', positiveAttrs: ['悟性', '灵根'], negativeAttrs: ['体质'] },
    { name: '皮革硬皮', description: '皮肤比普通人厚一倍', level: 'rare', positiveAttrs: ['体质', '意志'], negativeAttrs: ['悟性'] },
  ],
  uncommon: [
    { name: '方向感强', description: '在废土中从不迷路', level: 'uncommon', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['体质', '灵根'] },
    { name: '耐饿体质', description: '比常人更能忍受饥饿', level: 'uncommon', positiveAttrs: ['体质', '意志'], negativeAttrs: ['悟性', '幸运'] },
    { name: '灵敏嗅觉', description: '能嗅到数公里外的水源', level: 'uncommon', positiveAttrs: ['幸运', '悟性'], negativeAttrs: ['体质', '意志'] },
    { name: '快速奔跑', description: '逃跑速度比一般人快', level: 'uncommon', positiveAttrs: ['体质', '幸运'], negativeAttrs: ['悟性', '灵根'] },
  ],
  common: [
    { name: '基础生存', description: '掌握了基本的生存技能', level: 'common', positiveAttrs: ['意志', '体质'], negativeAttrs: ['灵根', '幸运'] },
    { name: '警觉本能', description: '对危险稍有警觉', level: 'common', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['体质', '悟性'] },
    { name: '粗浅格斗', description: '会一点打架的技巧', level: 'common', positiveAttrs: ['体质', '意志'], negativeAttrs: ['悟性', '灵根'] },
  ],
};

// ============================================
// 世界词条定义汇总
// ============================================

/** 修仙世界（默认）词条池 */
const CULTIVATION_TRAIT_POOL = {
  origin: ORIGIN_TRAITS,
  trait: TRAIT_TRAITS,
  personality: PERSONALITY_TRAITS,
  talent: TALENT_TRAITS,
};

/** 科技世界词条池 */
const TECH_TRAIT_POOL = {
  origin: TECH_ORIGIN,
  trait: TRAIT_TRAITS,     // 特质复用修仙（不含修仙概念）
  personality: PERSONALITY_TRAITS, // 性格复用
  talent: TECH_TALENT,
};

/** 魔幻世界词条池 */
const MAGIC_TRAIT_POOL = {
  origin: MAGIC_ORIGIN,
  trait: TRAIT_TRAITS,
  personality: PERSONALITY_TRAITS,
  talent: MAGIC_TALENT,
};

/** 末世世界词条池 */
const WASTELAND_TRAIT_POOL = {
  origin: WASTELAND_ORIGIN,
  trait: TRAIT_TRAITS,
  personality: PERSONALITY_TRAITS,
  talent: WASTELAND_TALENT,
};

/** 世界词条定义映射 */
export const WORLD_TRAIT_DEFINITIONS: Record<WorldType, {
  origin: Record<ImpactLevel, TraitDefinition[]>;
  trait: Record<ImpactLevel, TraitDefinition[]>;
  personality: Record<ImpactLevel, TraitDefinition[]>;
  talent: Record<ImpactLevel, TraitDefinition[]>;
}> = {
  '修仙': CULTIVATION_TRAIT_POOL,
  '仙侠': CULTIVATION_TRAIT_POOL,
  '高武': CULTIVATION_TRAIT_POOL,
  '武侠': CULTIVATION_TRAIT_POOL,
  '异能': CULTIVATION_TRAIT_POOL,
  '科技': TECH_TRAIT_POOL,
  '魔幻': MAGIC_TRAIT_POOL,
  '末世': WASTELAND_TRAIT_POOL,
};

export const ALL_ATTRS = ['体质', '灵根', '悟性', '幸运', '意志'] as const;
export type AttrName = typeof ALL_ATTRS[number];
