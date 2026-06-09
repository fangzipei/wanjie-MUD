/**
 * 世界差异化姓名池
 *
 * 不同世界类型使用不同的姓名生成规则。
 * 数据与逻辑分离——generators.ts 从此文件导入姓名数据。
 */
import type { WorldType } from '@/shared/lib/types';
import { WorldDataRegistry } from '@/shared/lib/registry';

export interface NamePool {
  surnames: string[];
  maleNames: string[];
  femaleNames: string[];
}

/** 修仙/仙侠 — 中文古风 */
const CULTIVATION_NAMES: NamePool = {
  surnames: ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'],
  maleNames: ['天行', '浩然', '子轩', '逸风', '玄青', '明远', '志远', '凌霄', '云飞', '无极', '星河', '破军', '苍穹', '玄机'],
  femaleNames: ['清雪', '梦璃', '紫嫣', '灵韵', '月华', '霜华', '诗涵', '雨萱', '若烟', '玉瑶', '诗韵', '凌霜', '明月', '紫霞'],
};

/** 仙侠 — 剑修古风 */
const XIANXIA_NAMES: NamePool = {
  surnames: ['剑', '凌', '萧', '叶', '云', '白', '苏', '柳', '沈', '楚', '宫', '凤', '龙', '墨', '花', '慕', '容', '裴', '殷', '薛'],
  maleNames: ['剑心', '凌霄', '破天', '长风', '星辰', '孤鸿', '问剑', '飞羽', '惊鸿', '无痕', '一剑', '天涯', '追云', '斩月'],
  femaleNames: ['剑兰', '凌霜', '紫英', '青鸾', '凤歌', '霓裳', '秋水', '雪见', '寒梅', '清歌', '月华', '飞燕', '云裳', '玉剑'],
};

/** 高武/武侠 — 中文古风 + 复姓 */
const MARTIAL_NAMES: NamePool = {
  surnames: ['慕容', '南宫', '欧阳', '独孤', '上官', '李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '铁', '石', '雷'],
  maleNames: ['铁心', '破军', '狂刀', '龙城', '啸天', '霸天', '无双', '战', '烈', '锋', '震', '云龙', '天雄', '武'],
  femaleNames: ['如烟', '霜华', '飞燕', '红袖', '青鸾', '霓裳', '凤舞', '秋月', '雪见', '紫英', '清歌', '剑兰', '凌波', '寒梅'],
};

/** 科技 — 英文混血/代号风 */
const TECH_NAMES: NamePool = {
  surnames: ['陈·', '林·', '王·', '李·', '张·', '刘·', 'Alex·', 'Nova·', 'Zero·', 'Neo·', 'K·', 'V·'],
  maleNames: ['锐', '锋', '凯', '洛', '斯', '航', '宇', '辰', '赛博', '泰克', '瑞克'],
  femaleNames: ['娜', '琳', '莎', '薇', '霓', '芯', '码', '星', '诺娃', '艾达'],
};

/** 魔幻 — 西幻风 */
const MAGIC_NAMES: NamePool = {
  surnames: ['风语者', '铁锤', '星歌', '银叶', '夜风', '深水', '火鬃', '白鸦', '霜月', '暗影', '光翼', '晨露'],
  maleNames: ['艾琳', '索林', '凯尔', '达里安', '阿拉斯', '罗兰', '格里芬', '奥利安', '艾德温', '莱昂', '芬恩', '卡修斯'],
  femaleNames: ['莉亚', '艾拉', '西尔维亚', '露娜', '菲奥娜', '伊莎贝尔', '艾莉丝', '梅琳娜', '塞拉', '薇薇安', '艾希', '索菲亚'],
};

/** 异能 — 现代都市风 */
const ESPER_NAMES: NamePool = {
  surnames: ['林', '陈', '王', '李', '张', '刘', '赵', '黄', '周', '吴', '徐', '孙', '萧', '沈', '韩', '叶'],
  maleNames: ['晓峰', '宇轩', '浩宇', '俊杰', '子豪', '睿', '晨', '阳', '翔', '逸', '铭', '哲'],
  femaleNames: ['晓雨', '诗雨', '若溪', '欣怡', '思琪', '雅', '瑶', '悦', '晴', '雪', '琳', '婷'],
};

/** 末世 — 代号/简称风 */
const WASTELAND_NAMES: NamePool = {
  surnames: ['铁', '石', '灰', '焰', '霜', '雷', '钢', '毒', '血', '影', '骨', '棘'],
  maleNames: ['牙', '拳', '爪', '刃', '锤', '盾', '矛', '狼', '虎', '鹰', '鳄', '蛇'],
  femaleNames: ['牙', '爪', '刃', '箭', '镖', '针', '狐', '猫', '燕', '隼', '蝎', '蜂'],
};

/**
 * 从注册中心获取姓名池
 *
 * @param worldType - 世界类型标识
 * @returns 姓名池数据，未加载时抛出错误
 */
export function getNamePoolFromRegistry(worldType: string): NamePool {
  const registry = WorldDataRegistry.getInstance();
  const pool = registry.getNamePool(worldType);
  if (!pool) {
    throw new Error(`姓名池未加载: "${worldType}"。请确保 wanjie-core Mod 已正确加载。`);
  }
  return pool;
}

/** @deprecated 使用 getNamePoolFromRegistry() 替代 */
export const WORLD_NAME_POOLS: Record<WorldType, NamePool> = {
  '修仙': CULTIVATION_NAMES,
  '仙侠': XIANXIA_NAMES,
  '高武': MARTIAL_NAMES,
  '武侠': MARTIAL_NAMES,
  '科技': TECH_NAMES,
  '魔幻': MAGIC_NAMES,
  '异能': ESPER_NAMES,
  '末世': WASTELAND_NAMES,
};
