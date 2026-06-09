/**
 * 核心数据迁移脚本
 *
 * 将现有的 TS 硬编码数据转换为 mods/wanjie-core/data/ 下的 JSON 文件。
 *
 * 用法：
 *   npx tsx scripts/migrate-core-data.ts
 *
 * 生成的文件：
 *   mods/wanjie-core/data/worlds.json
 *   mods/wanjie-core/data/dangers.json
 *   mods/wanjie-core/data/opportunities.json
 */
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// 辅助函数
// ============================================

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  ✓ ${path.basename(filePath)}`);
}

// ============================================
// 数据内联（从 TS 源码复制，格式化为 JSON）
// ============================================

const WORLDS = {
  '修仙': {
    id: '修仙',
    name: '修仙世界',
    description: '灵气充沛，仙门林立，修士们追求长生大道，适合初入万界的修行者',
    baseCoefficient: 1.0,
    namePrefixes: ['青云', '紫霄', '太虚', '玄天', '昆仑', '蓬莱'],
    nameSuffixes: ['界', '域', '天', '境', '州'],
    descriptions: [
      '灵气充沛，仙门林立，修士们追求长生大道，适合初入万界的修行者',
      '宗门遍布，灵脉纵横，是修仙者的圣地，万界之旅的起点',
      '仙气缥缈，洞天福地众多，传说中有仙人飞升之地，万物皆可修炼',
    ],
    powerSystems: [
      '炼气化神，以灵力为根基，追求天人合一',
      '道法自然，感悟天地法则，证得大道',
    ],
    majorForces: [
      '五大仙门各据一方，暗流涌动',
      '三宗两门一阁，势力错综复杂',
      '十大宗门并立，争夺灵脉资源',
    ],
  },
  '高武': {
    id: '高武',
    name: '高武世界',
    description: '武道昌盛，强者如云，武者以力证道',
    baseCoefficient: 1.3,
    namePrefixes: ['苍龙', '玄武', '白虎', '朱雀', '麒麟', '神凤'],
    nameSuffixes: ['大陆', '域', '疆', '界', '州'],
    descriptions: [
      '武道昌盛，强者如云，武者以力证道',
      '气血沸腾，武道通神，是武者的天堂',
      '宗门林立，武道传承源远流长',
    ],
    powerSystems: [
      '以武入道，炼体化神，追求武道巅峰',
      '气血如龙，突破极限，成就武神之躯',
    ],
    majorForces: [
      '三大武道圣地统领天下',
      '五族联盟与武道宗门对峙',
      '皇朝与宗门势力交织',
    ],
  },
  '科技': {
    id: '科技',
    name: '科技世界',
    description: '科技高度发达，星际航行已是常态',
    baseCoefficient: 1.2,
    namePrefixes: ['星际', '银河', '机械', '赛博', '量子', '虚空'],
    nameSuffixes: ['联邦', '帝国', '联盟', '领域', '世界'],
    descriptions: [
      '科技高度发达，星际航行已是常态',
      '机械与人工智能共存，赛博文明繁荣',
      '量子科技突破，人类征服星辰大海',
    ],
    powerSystems: [
      '基因改造与机械飞升，科技改变命运',
      '纳米技术与AI融合，追求永生之道',
    ],
    majorForces: [
      '三大星际财团掌控资源',
      '联邦政府与反叛军对峙',
      'AI联盟与人类政权共存',
    ],
  },
  '魔幻': {
    id: '魔幻',
    name: '魔幻世界',
    description: '魔法元素充盈，法师与龙共存',
    baseCoefficient: 1.1,
    namePrefixes: ['艾泽', '诺瓦', '奥兰', '神秘', '永恒', '圣光'],
    nameSuffixes: ['大陆', '王国', '领域', '森林', '帝国'],
    descriptions: [
      '魔法元素充盈，法师与龙共存',
      '精灵与矮人世代居住，魔法文明辉煌',
      '诸神的恩赐洒满大地，魔法至上的世界',
    ],
    powerSystems: [
      '元素魔法与奥术之力，法师追求真理',
      '神术与魔法并存，信仰与知识同行',
    ],
    majorForces: [
      '魔法议会统领各元素学派',
      '三大帝国与精灵联盟对峙',
      '教会与法师协会分庭抗礼',
    ],
  },
  '异能': {
    id: '异能',
    name: '异能世界',
    description: '异能觉醒者遍布都市，隐藏在普通人之中',
    baseCoefficient: 1.2,
    namePrefixes: ['觉醒', '变异', '超凡', '进化', '源能', '异变'],
    nameSuffixes: ['都市', '世界', '领域', '区', '城'],
    descriptions: [
      '异能觉醒者遍布都市，隐藏在普通人之中',
      '源能爆发，异能者改变世界格局',
      '变异与进化并行，人类站在进化十字路口',
    ],
    powerSystems: [
      '基因觉醒与异能开发，突破人类极限',
      '源能觉醒，探索心灵深处的力量',
    ],
    majorForces: [
      '异能管理局与反抗组织对立',
      '三大财团暗中操控异能者',
      '国际异能联盟维稳全球',
    ],
  },
  '仙侠': {
    id: '仙侠',
    name: '仙侠世界',
    description: '剑气纵横，侠客仗剑行走天涯',
    baseCoefficient: 1.3,
    namePrefixes: ['剑气', '仙云', '凌霄', '飞剑', '天剑', '灵剑'],
    nameSuffixes: ['山', '峰', '门', '境', '界'],
    descriptions: [
      '剑气纵横，侠客仗剑行走天涯',
      '仙剑传说流传千古，剑修追求剑道巅峰',
      '剑意凌霄，万剑归宗的剑道圣地',
    ],
    powerSystems: [
      '以剑入道，剑心通明，追求剑道极致',
      '御剑乘风，剑意化形，成就剑仙之路',
    ],
    majorForces: [
      '五大剑派统领剑道',
      '剑阁与剑宗分庭抗礼',
      '散修联盟与宗门共存',
    ],
  },
  '武侠': {
    id: '武侠',
    name: '武侠世界',
    description: '江湖恩怨，侠骨柔情，武林中人快意恩仇',
    baseCoefficient: 1.0,
    namePrefixes: ['江湖', '武当', '少林', '华山', '峨眉', '昆仑'],
    nameSuffixes: ['派', '门', '帮', '会', '盟'],
    descriptions: [
      '江湖恩怨，侠骨柔情，武林中人快意恩仇',
      '门派林立，武功秘籍传承千年',
      '义薄云天，侠之大者为国为民',
    ],
    powerSystems: [
      '内外兼修，武道通神，成就一代宗师',
      '以武会友，侠义为先，行走江湖',
    ],
    majorForces: [
      '六大门派统领武林',
      '朝廷与江湖势力交织',
      '帮派联盟与隐世宗门并存',
    ],
  },
  '末世': {
    id: '末世',
    name: '末世世界',
    description: '文明崩塌，变异横行，幸存者挣扎求生',
    baseCoefficient: 1.5,
    namePrefixes: ['废土', '荒芜', '末世', '崩坏', '毁灭', '残存'],
    nameSuffixes: ['世界', '之地', '废墟', '区域', '疆域'],
    descriptions: [
      '文明崩塌，变异横行，幸存者挣扎求生',
      '废土之上，适者生存，人性与兽性交织',
      '核战后的人类文明，在废墟中寻找希望',
    ],
    powerSystems: [
      '变异进化，适应废土，成为新时代的霸主',
      '科技残存，基因改造，在末世中崛起',
    ],
    majorForces: [
      '幸存者联盟与掠夺者对峙',
      '变异生物与人类争夺领地',
      '避难所联盟掌控资源',
    ],
  },
};

// ============================================
// 危险效果数据（来自 worldEffectsData.ts）
// ============================================

const DANGERS = [
  // 1级危险（轻微）
  {
    id: 'weak_lingqi',
    type: 'stat_debuff',
    name: '灵气稀薄',
    description: '此方天地灵气稀薄，修炼效率降低',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: { statModifications: { 灵根: -1 } },
    duration: -1,
    dispellable: false,
    dangerLevel: 1,
  },
  {
    id: 'chaotic_elements',
    type: 'stat_debuff',
    name: '元素紊乱',
    description: '元素之力紊乱，战斗能力略微下降',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: { statModifications: { 体质: -1 } },
    duration: -1,
    dispellable: false,
    dangerLevel: 1,
  },
  {
    id: 'restless_mind',
    type: 'stat_debuff',
    name: '心神不宁',
    description: '此地磁场异常，心神难以安定',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: { statModifications: { 悟性: -1 } },
    duration: -1,
    dispellable: false,
    dangerLevel: 1,
  },
  // 2级危险（中等）
  {
    id: 'demon_erosion',
    type: 'resource_drain',
    name: '魔气侵蚀',
    description: '魔气弥漫，每回合损失少量生命',
    triggerCondition: { type: 'on_turn', chance: 0.3 },
    effect: { resourceModifications: { hp: -5 } },
    duration: 0,
    dispellable: true,
    dangerLevel: 2,
  },
  {
    id: 'spirit_drain',
    type: 'resource_drain',
    name: '灵力枯竭',
    description: '灵力流失加剧，每回合损失法力',
    triggerCondition: { type: 'on_turn', chance: 0.25 },
    effect: { resourceModifications: { mp: -8 } },
    duration: 0,
    dispellable: true,
    dangerLevel: 2,
  },
  {
    id: 'weak_enemies',
    type: 'enemy_buff',
    name: '敌强我弱',
    description: '此地敌人实力略胜一筹',
    triggerCondition: { type: 'on_battle_start', chance: 1.0 },
    effect: { enemyBuffs: { attackBonus: 0.1, defenseBonus: 0.1 } },
    duration: 0,
    dispellable: false,
    dangerLevel: 2,
  },
  {
    id: 'reduced_insight',
    type: 'stat_debuff',
    name: '悟性压制',
    description: '天机混乱，领悟效率下降',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: { statModifications: { 悟性: -2, 灵根: -1 } },
    duration: -1,
    dispellable: false,
    dangerLevel: 2,
  },
  // 3级危险（严重）
  {
    id: 'enemy_territory',
    type: 'enemy_buff',
    name: '敌人领地',
    description: '此处为敌人领地，敌人战斗力提升20%',
    triggerCondition: { type: 'on_battle_start', chance: 1.0 },
    effect: { enemyBuffs: { attackBonus: 0.2, defenseBonus: 0.15, hpBonus: 0.15 } },
    duration: 0,
    dispellable: false,
    dangerLevel: 3,
  },
  {
    id: 'cursed_ground',
    type: 'resource_drain',
    name: '诅咒之地',
    description: '受到诅咒，每回合损失生命和法力',
    triggerCondition: { type: 'on_turn', chance: 0.4 },
    effect: { resourceModifications: { hp: -8, mp: -5 } },
    duration: 0,
    dispellable: true,
    dangerLevel: 3,
  },
  {
    id: 'exp_reduction',
    type: 'special_mechanic',
    name: '天道压制',
    description: '此方天道排斥外来者，经验获取减少20%',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: { specialEffects: { type: 'reduced_exp', value: 0.2 } },
    duration: -1,
    dispellable: false,
    dangerLevel: 3,
  },
];

// ============================================
// 机缘效果数据
// ============================================

const OPPORTUNITIES = [
  // 1级机缘（常见）
  {
    id: 'abundant_lingqi',
    type: 'stat_buff',
    name: '灵气充沛',
    description: '此地灵气充沛，修炼效率提升',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: { statModifications: { 灵根: 2 } },
    duration: -1,
    opportunityLevel: 1,
    conflictsWith: ['weak_lingqi'],
  },
  {
    id: 'harmonious_elements',
    type: 'stat_buff',
    name: '元素和谐',
    description: '元素之力和谐，战斗能力略微提升',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: { statModifications: { 体质: 2 } },
    duration: -1,
    opportunityLevel: 1,
  },
  {
    id: 'clear_mind',
    type: 'stat_buff',
    name: '心神清明',
    description: '此地磁场温和，心神安定',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: { statModifications: { 悟性: 2 } },
    duration: -1,
    opportunityLevel: 1,
  },
];

// ============================================
// 生成 JSON 文件
// ============================================

function main() {
  const dataDir = path.resolve(__dirname, '../mods/wanjie-core/data');
  ensureDir(dataDir);

  console.log('\n📦 生成核心数据 JSON 文件...\n');

  // worlds.json
  const worldList = Object.values(WORLDS);
  writeJson(path.join(dataDir, 'worlds.json'), { worlds: worldList });

  // dangers.json
  writeJson(path.join(dataDir, 'dangers.json'), { dangers: DANGERS });

  // opportunities.json
  writeJson(path.join(dataDir, 'opportunities.json'), { opportunities: OPPORTUNITIES });

  // realms.json — 使用简化格式，每个世界类型一个 key
  const realms: Record<string, unknown> = {
    '修仙': {
      mainRealmName: '修仙境界',
      subRealmName: '品阶',
      tiers: [
        { name: '炼气期', subRealms: ['一阶', '二阶', '三阶', '四阶', '五阶', '六阶', '七阶', '八阶', '九阶', '十阶'], levelRange: [1, 10] },
        { name: '筑基期', subRealms: ['一重', '二重', '三重', '四重', '五重', '六重', '七重', '八重', '九重', '十重'], levelRange: [11, 20] },
        { name: '金丹期', subRealms: ['一转', '二转', '三转', '四转', '五转', '六转', '七转', '八转', '九转', '十转'], levelRange: [21, 30] },
        { name: '元婴期', subRealms: ['一层', '二层', '三层', '四层', '五层', '六层', '七层', '八层', '九层', '十层'], levelRange: [31, 40] },
        { name: '化神期', subRealms: ['初期', '中期', '后期', '巅峰', '圆满', '大成', '入圣', '超凡', '脱俗', '归真'], levelRange: [41, 50] },
      ],
      subRealmMultiplier: 1.05,
      tierJumpMultiplier: 1.30,
    },
  };
  // Copy the cultivation realm system for all world types with different names
  const realmNames: Record<string, [string, string]> = {
    '修仙': ['修仙境界', '品阶'],
    '高武': ['武道境界', '重境'],
    '科技': ['进化等级', '级'],
    '魔幻': ['魔法位阶', '环'],
    '异能': ['觉醒等级', '阶'],
    '仙侠': ['剑道境界', '品'],
    '武侠': ['武道境界', '重'],
    '末世': ['进化等级', '阶'],
  };
  for (const [key, [mainName, subName]] of Object.entries(realmNames)) {
    realms[key] = {
      mainRealmName: mainName,
      subRealmName: subName,
      tiers: (realms['修仙'] as Record<string, unknown>).tiers,
      subRealmMultiplier: 1.05,
      tierJumpMultiplier: 1.30,
    };
  }
  writeJson(path.join(dataDir, 'realms.json'), realms);

  // factions.json — template per world
  const factions: Record<string, unknown> = {};
  for (const [key, world] of Object.entries(WORLDS)) {
    factions[key] = {
      templates: world.majorForces.map((mf: string) => ({
        id: `${key}_faction_${world.majorForces.indexOf(mf)}`,
        name: mf,
        type: key,
        description: `${world.name}的主要势力`,
        worldTypeId: key,
      })),
    };
  }
  writeJson(path.join(dataDir, 'factions.json'), factions);

  // names.json — name pool per world
  const names: Record<string, unknown> = {};
  for (const [key, world] of Object.entries(WORLDS)) {
    names[key] = {
      surnames: world.namePrefixes,
      maleNames: ['天', '云', '风', '雷', '阳', '星', '辰', '明', '玄', '浩'],
      femaleNames: ['月', '雪', '瑶', '紫', '清', '灵', '玉', '霜', '萱', '薇'],
    };
  }
  writeJson(path.join(dataDir, 'names.json'), names);

  // traits.json — minimal placeholder structure
  const traits: Record<string, unknown> = {};
  for (const key of Object.keys(WORLDS)) {
    traits[key] = {
      origin: { legendary: [], epic: [], rare: [], uncommon: [], common: [] },
      trait: { legendary: [], epic: [], rare: [], uncommon: [], common: [] },
      personality: { legendary: [], epic: [], rare: [], uncommon: [], common: [] },
      talent: { legendary: [], epic: [], rare: [], uncommon: [], common: [] },
    };
  }
  writeJson(path.join(dataDir, 'traits.json'), traits);

  // text.json — placeholder
  const texts: Record<string, unknown> = {};
  for (const [key, world] of Object.entries(WORLDS)) {
    texts[key] = {
      stats: {
        body: '体质',
        spiritRoot: '灵根',
        comprehension: '悟性',
        luck: '幸运',
        willpower: '意志',
      },
      terminology: {
        resource: key === '科技' ? '能量块' : key === '魔幻' ? '魔力晶石' : '灵石',
        power: key === '科技' ? '能量' : key === '魔幻' ? '魔力' : '灵力',
        cultivation: key === '科技' ? '进化' : key === '末世' ? '变异' : '修炼',
        breakthrough: key === '科技' ? '突破限制' : key === '魔幻' ? '突破位阶' : '突破',
      },
      paths: {
        body: { name: '体修', description: '以身体力量为本的修行之道' },
        spiritRoot: { name: '灵修', description: '以灵力为核心的修行之道' },
        comprehension: { name: '悟道', description: '以悟性为根基的修行之道' },
        luck: { name: '气运', description: '以气运为根基的修行之道' },
        willpower: { name: '意志', description: '以意志力为核心的修行之道' },
      },
    };
  }
  writeJson(path.join(dataDir, 'text.json'), texts);

  console.log(`\n✅ 核心数据文件已生成到: ${dataDir}`);
  console.log('   共 8 个 JSON 文件\n');
}

main();
