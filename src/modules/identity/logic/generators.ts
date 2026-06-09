import { evaluateCharacter, evaluateCharacters } from './characterEvaluation';
import { getTerminology } from '@/modules/narrative/logic/terminology';
import {
  ORIGIN_TRAITS,
  TRAIT_TRAITS,
  PERSONALITY_TRAITS,
  TALENT_TRAITS,
  selectRandomTrait,
  generateImpactDescription,
  calculateTotalImpact,
  QUALITY_CONFIG
} from './traits';
import { Character, World, CharacterStats, WorldType, ImpactfulTrait, ImpactLevel, StatImpact, WorldFaction } from '@/shared/lib/types';
import {
  generateWorldFactions,
  generateFactionDescription,
  generateFactionBackgroundDescription,
} from '@/modules/faction/data/factionData';
import {
  generateRealmSystem,
} from '@/modules/progression/data/realmData';
import type { RealmSystem } from '@/modules/progression/data/realmCore';
import {
  getRealmName,
  getPowerSystemDescription,
  getRealmMultiplier,
  getNextRealm,
  getNextMainRealmLevel,
  getMaxLevel,
  getExperienceForLevel,
  getStatBaseForLevel,
  getStatPotentialForLevel,
} from '@/modules/progression/data/realmCore';
import { getAvailableDifficultiesForRealm } from '@/modules/exploration/logic/adventureDifficulties';
import {
  WORLD_DATA,
  WORLD_COEFFICIENTS,
} from '@/modules/identity/data/worldData';
import {
  calculateWorldDifficultyCoefficient,
  getWorldDifficultyFromCoefficient,
  generateWorldDangers,
  generateWorldOpportunities,
  getWorldBaseCoefficient,
} from '@/modules/identity/data/worldSystem';
import { createRng } from '@/shared/utils/rng';

// 重新导出境界相关函数，供其他模块使用
export { 
  getRealmName,
  getPowerSystemDescription,
  getRealmMultiplier,
  getNextRealm,
  getNextMainRealmLevel,
  getAvailableDifficultiesForRealm,
  getMaxLevel,
  getExperienceForLevel,
  getStatBaseForLevel,
  getStatPotentialForLevel,
};
export type { RealmSystem };

// ID生成工具
export const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 随机数生成工具（支持可选 seed-based RNG）
const random = (min: number, max: number, rng: () => number = Math.random) =>
  Math.floor(rng() * (max - min + 1)) + min;
const randomItem = <T>(arr: T[], rng: () => number = Math.random): T =>
  arr[Math.floor(rng() * arr.length)];

// 姓名生成
const surnames = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'];
const maleNames = ['天行', '浩然', '子轩', '逸风', '玄青', '明远', '志远', '凌霄', '云飞', '无极', '星河', '破军', '苍穹', '玄机'];
const femaleNames = ['清雪', '梦璃', '紫嫣', '灵韵', '月华', '霜华', '诗涵', '雨萱', '若烟', '玉瑶', '诗韵', '凌霜', '明月', '紫霞'];

/**
 * 根据词条定义生成完整词条对象
 */
function generateTraitFromDefinition(
  definition: { name: string; description: string; level: ImpactLevel },
  impact: StatImpact
): ImpactfulTrait {
  const totalImpact = calculateTotalImpact(impact);
  const description = generateImpactDescription(impact);
  
  return {
    name: definition.name,
    description: definition.description,
    impact,
    totalImpact,
    level: definition.level,
  };
}

// 世界名称前缀和后缀
const worldPrefixes: Record<WorldType, string[]> = {
  '修仙': ['九天', '玄黄', '鸿蒙', '太古', '无极', '乾坤', '苍茫', '混沌'],
  '高武': ['神武', '天武', '武极', '霸武', '万武', '武帝', '圣武', '龙武'],
  '科技': ['星河', '银河', '星际', '星域', '星云', '星盟', '星联', '星环'],
  '魔幻': ['艾泽', '阿卡', '魔法', '元素', '神圣', '龙语', '精灵', '混沌'],
  '异能': ['觉醒', '异变', '超能', '进化', '变异', '新纪', '起源', '进化'],
  '仙侠': ['仙剑', '剑仙', '仙霞', '青云', '蓬莱', '昆仑', '蜀山', '仙云'],
  '武侠': ['江湖', '武林', '天机', '风云', '逍遥', '武道', '侠义', '乱世'],
  '末世': ['废土', '荒原', '末日', '辐射', '尘世', '残存', '重生', '末日']
};

const worldSuffixes: Record<WorldType, string[]> = {
  '修仙': ['界', '域', '大陆', '仙境', '圣地', '虚境', '仙域', '灵界'],
  '高武': ['大陆', '世界', '星域', '位面', '境域', '武域', '界域', '天地'],
  '科技': ['联邦', '帝国', '联盟', '星域', '殖民地', '空间站', '世界', '网络'],
  '魔幻': ['大陆', '世界', '王国', '帝国', '森林', '领域', '位面', '圣地'],
  '异能': ['世界', '都市', '城市', '区域', '联邦', '国家', '特区', '基地'],
  '仙侠': ['界', '山', '门', '岛', '域', '境', '洞天', '福地'],
  '武侠': ['武林', '江湖', '世界', '大陆', '天下', '朝代', '年间', '之地'],
  '末世': ['之地', '废土', '荒原', '世界', '区域', '地带', '遗址', '避难区']
};

// 世界描述模板
const worldDescriptions: Record<WorldType, string[]> = {
  '修仙': ['灵气充沛的修真世界，仙门林立，强者如云', '大道三千，皆可成仙，万族争锋', '仙道昌盛，丹药法宝百花齐放'],
  '高武': ['武道至上，以武入道，强者可碎虚空', '武道文明璀璨，血脉觉醒者天赋异禀', '热血激荡，拳破苍穹，力压万古'],
  '科技': ['星际文明时代，科技与基因进化并行', '未来科幻，飞船穿梭银河，AI与人类共存', '赛博朋克，虚拟与现实边界模糊'],
  '魔幻': ['魔法文明鼎盛，元素之力充盈天地', '众神遗落，精灵巨龙共存', '魔法与剑，冒险者追寻传奇'],
  '异能': ['觉醒者遍布的现代都市，异能改变命运', '全球异变，觉醒者主导一切', '基因突变，超能力成为常态'],
  '仙侠': ['剑仙纵横，御剑乘风，逍遥天地', '仙魔争锋，道魔两立，纷争不断', '三界交汇，人仙魔共存'],
  '武侠': ['江湖恩怨，门派林立，快意恩仇', '武道传承，绝世武功人人争夺', '庙堂与江湖交织，侠之大者'],
  '末世': ['灾变后的废土世界，变异生物横行', '文明崩塌，异能与科技并存', '末日生存，弱肉强食是唯一法则']
};

// 生成基础属性（所有角色相同的基础值）
// 新结构：固定属性包含基础值50，成长属性初始为0
function generateBaseStats(): CharacterStats {
  const base = 50;
  return {
    base: {
      体质: base,
      灵根: base,
      悟性: base,
      幸运: base,
      意志: base,
    },
    growth: {
      体质: 0,
      灵根: 0,
      悟性: 0,
      幸运: 0,
      意志: 0,
    },
  };
}

// 应用影响（只修改固定属性）
function applyImpact(stats: CharacterStats, impact: StatImpact): CharacterStats {
  return {
    base: {
      体质: stats.base.体质 + (impact.体质 || 0),
      灵根: stats.base.灵根 + (impact.灵根 || 0),
      悟性: stats.base.悟性 + (impact.悟性 || 0),
      幸运: stats.base.幸运 + (impact.幸运 || 0),
      意志: stats.base.意志 + (impact.意志 || 0),
    },
    growth: { ...stats.growth },
  };
}

// 计算多个影响的总和
function sumImpacts(impacts: StatImpact[]): StatImpact {
  const result: StatImpact = { 体质: 0, 灵根: 0, 悟性: 0, 幸运: 0, 意志: 0 };
  for (const impact of impacts) {
    result.体质 = (result.体质 || 0) + (impact.体质 || 0);
    result.灵根 = (result.灵根 || 0) + (impact.灵根 || 0);
    result.悟性 = (result.悟性 || 0) + (impact.悟性 || 0);
    result.幸运 = (result.幸运 || 0) + (impact.幸运 || 0);
    result.意志 = (result.意志 || 0) + (impact.意志 || 0);
  }
  return result;
}

// 生成随机角色
export function generateCharacter(id: number): Character {
  const gender = randomItem(['男', '女'] as const);
  const name = randomItem(surnames) + (gender === '男' ? randomItem(maleNames) : randomItem(femaleNames));
  
  // 使用新的词条系统生成词条
  const originResult = selectRandomTrait(ORIGIN_TRAITS);
  const traitResult = selectRandomTrait(TRAIT_TRAITS);
  const personalityResult = selectRandomTrait(PERSONALITY_TRAITS);
  const talentResult = selectRandomTrait(TALENT_TRAITS);
  
  // 生成完整词条对象
  const origin = generateTraitFromDefinition(originResult.definition, originResult.impact);
  const trait = generateTraitFromDefinition(traitResult.definition, traitResult.impact);
  const personality = generateTraitFromDefinition(personalityResult.definition, personalityResult.impact);
  const talent = generateTraitFromDefinition(talentResult.definition, talentResult.impact);
  
  // 计算总影响
  const totalImpact = sumImpacts([origin.impact, trait.impact, personality.impact, talent.impact]);
  const totalPower = Object.values(totalImpact).reduce((sum, v) => sum + (v || 0), 0);
  
  // 生成属性（基础值 + 词条影响）
  let stats = generateBaseStats();
  stats = applyImpact(stats, origin.impact);
  stats = applyImpact(stats, trait.impact);
  stats = applyImpact(stats, personality.impact);
  stats = applyImpact(stats, talent.impact);
  
  // 基础角色对象
  const baseCharacter: Character = {
    id,
    name,
    gender,
    age: random(14, 25),
    origin,
    trait,
    personality,
    talent,
    background: '',
    stats,
    totalPower,
  };
  
  // 计算多维度评分和角色定位
  return evaluateCharacter(baseCharacter);
}

// 生成8个随机角色（随机男女比例）
export function generateCharacters(): Character[] {
  // 随机男女比例 (1-7男，其余女)
  const maleCount = random(1, 7);
  const femaleCount = 8 - maleCount;
  
  // 生成足够多的候选角色
  const maleCandidates: Character[] = [];
  const femaleCandidates: Character[] = [];
  
  for (let i = 0; i < 32; i++) {
    const char = generateCharacter(i + 1);
    if (char.gender === '男') {
      maleCandidates.push(char);
    } else {
      femaleCandidates.push(char);
    }
  }
  
  // 选择指定数量的男女人物
  const selectedMales = maleCandidates.slice(0, maleCount);
  const selectedFemales = femaleCandidates.slice(0, femaleCount);
  const selected = [...selectedMales, ...selectedFemales];
  
  // 重新分配ID
  return selected.map((c, i) => ({ ...c, id: i + 1 }));
}

// 世界类型列表
const worldTypes: WorldType[] = ['修仙', '高武', '科技', '魔幻', '异能', '仙侠', '武侠', '末世'];

// 获取世界术语（兼容旧代码）
export function getWorldTerms(worldType: WorldType) {
  return getTerminology(worldType);
}

// 生成世界（seed 即为 world.id，用作 createRng 的种子，确保确定性）
export function generateWorld(seed: number, ascensionCount: number = 0): World {
  const rng = createRng(seed);
  const type = worldTypes[Math.abs(seed) % worldTypes.length];
  const name = randomItem(worldPrefixes[type], rng) + randomItem(worldSuffixes[type], rng);
  const description = randomItem(worldDescriptions[type], rng);

  // 生成境界系统
  const realmSystem = generateRealmSystem(type);
  const powerSystem = getPowerSystemDescription(realmSystem);

  // 生成势力列表
  const factions = generateWorldFactions(type);
  const majorForces = generateFactionDescription(type, factions);

  // 计算难度系数
  const baseCoefficient = getWorldBaseCoefficient(type);
  const actualCoefficient = calculateWorldDifficultyCoefficient(baseCoefficient, ascensionCount);
  const difficulty = getWorldDifficultyFromCoefficient(actualCoefficient);

  // 生成危险和机缘（传入 RNG 确保确定性）
  const dangers = generateWorldDangers(type, actualCoefficient, rng);
  const opportunities = generateWorldOpportunities(type, actualCoefficient, dangers, rng);

  // ratingScore 由用户通过评价反馈设置，生成时默认为 0
  const ratingScore = 0;

  return {
    id: seed,
    name,
    type,
    description,
    powerSystem,
    realmSystem,
    majorForces,
    factions,
    baseCoefficient,
    actualCoefficient,
    difficulty,
    dangers,
    opportunities,
    ratingScore,
  };
}

/** 默认世界种子（对应 8 种世界类型各一个） */
export const DEFAULT_WORLD_SEEDS: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7];

/**
 * 按种子列表生成世界
 *
 * @param seeds - 世界种子列表（每个种子确定生成一个世界）
 * @param ascensionCount - 飞升次数（影响难度系数）
 * @returns 生成的世界列表
 */
export function generateWorlds(seeds: number[] = [...DEFAULT_WORLD_SEEDS], ascensionCount: number = 0): World[] {
  return seeds.map(seed => generateWorld(seed, ascensionCount));
}

/**
 * 生成背景故事
 * 串联角色背景、特性、天赋、性格，以及世界危机和机遇
 * 约500字，分段展示
 */
export function generateBackstory(character: Character, world: World): string {
  // 根据世界类型选择故事风格
  const worldStyle: Record<string, string> = {
    '修仙': '灵气',
    '高武': '武道',
    '科技': '科技',
    '魔幻': '魔法',
    '异能': '异能',
    '仙侠': '剑气',
    '武侠': '江湖',
    '末世': '废土',
  };
  
  const style = worldStyle[world.type] || '灵气';
  
  // 开篇：出身背景
  const openingTemplates = [
    `${character.name}出生于${world.name}的${character.origin.name}。\n\n${character.origin.description}，这样的出身给了${character.name}与众不同的起点。在这个${world.description.slice(0, 20)}的世界里，每一个生命都在书写着自己的传奇。`,
    
    `在${world.name}的广袤大地上，${character.name}的诞生便注定不凡。\n\n${character.origin.name}的血脉流淌在${character.name}的身体里，${character.origin.description}。这片土地上的${style}充盈，却也危机四伏，每一个成长的日子都是对命运的考验。`,
  ];
  
  // 成长经历：特性与性格
  const growthTemplates = [
    `随着年龄渐长，${character.name}展现出了${character.trait.name}的特质。\n\n${character.trait.description}。这种与生俱来的特质，让${character.name}在同龄人中脱颖而出。而${character.personality.name}的性格，更是让${character.name}在面对困境时总能找到属于自己的道路——${character.personality.description}。`,
    
    `岁月流转，${character.name}逐渐展现出独特的天赋。\n\n${character.trait.name}，这是命运赐予${character.name}的礼物——${character.trait.description}。而那${character.personality.name}的性格，让${character.name}在${world.type}的道路上走得更加坚定。旁人都说，这个${character.age}岁的${character.gender}子，将来必成大器。`,
  ];
  
  // 天赋觉醒
  const talentTemplates = [
    `然而，真正改变${character.name}命运的，是${character.talent.name}的觉醒。\n\n${character.talent.description}。从那一刻起，${character.name}的世界彻底改变了。${style}在体内流转，隐约感受到了更高层次的力量在召唤。`,
    
    `在${character.age}岁那年，一个偶然的契机让${character.name}觉醒了${character.talent.name}。\n\n${character.talent.description}。这个天赋的觉醒，让${character.name}看到了更广阔的天地，也让命运的齿轮开始转动。`,
  ];
  
  // 构建危险描述
  const dangerDescriptions = world.dangers.length > 0
    ? world.dangers.map(d => d.name + '：' + d.description).join('；')
    : '此方天地安宁祥和';
  
  // 构建机缘描述
  const opportunityDescriptions = world.opportunities.length > 0
    ? world.opportunities.map(o => o.name + '：' + o.description).join('；')
    : '静待有缘人发现';
  
  // 世界背景与抉择
  const worldContextTemplates = [
    `如今，${character.name}站在了人生的十字路口。\n\n${world.name}正经历着巨变——${dangerDescriptions}。然而，危机之中也孕育着转机，${opportunityDescriptions}。\n\n在这${world.type}昌盛的时代，${character.name}必须做出选择：是随波逐流，还是逆天改命？`,
    
    `这个世界从不缺少传奇。\n\n在${world.name}，${world.powerSystem}的力量体系主宰着一切。\n\n${generateFactionBackgroundDescription(world.type, world.factions)}\n\n${character.name}深知，想要在这片天地立足，唯有不断变强。\n\n${dangerDescriptions}的威胁如同悬在头顶的利剑，但${opportunityDescriptions}的传说也在世间流传。选择，往往比努力更重要。`,
  ];
  
  // 结尾：展望未来
  const endingTemplates = [
    `修行之路漫漫，${character.name}的故事才刚刚开始。\n\n在这条通往巅峰的道路上，有无数的选择等待着${character.name}去面对。而每一个选择，都将决定${character.name}最终的命运。是成为传说，还是湮没于历史，一切都将由${character.name}自己书写。`,
    
    `命运已经向${character.name}敞开了大门。\n\n前方是未知的旅途，身后是无法回头的过往。${character.name}深吸一口气，踏出了第一步。这个${world.type}的世界，即将见证一个新传奇的诞生。\n\n故事，从此开始。`,
  ];
  
  // 组合故事
  const story = [
    randomItem(openingTemplates),
    randomItem(growthTemplates),
    randomItem(talentTemplates),
    randomItem(worldContextTemplates),
    randomItem(endingTemplates),
  ].join('\n\n');
  
  return story;
}
