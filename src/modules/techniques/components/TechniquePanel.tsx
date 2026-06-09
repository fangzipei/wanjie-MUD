'use client';

import { useState, useMemo } from 'react';

import { Sword, Shield, Zap, Droplets, Package, Link2, Star, ArrowUpDown, Filter, Flame, Snowflake, Zap as Thunder, Wind, Mountain, Sun, Moon, Swords, Settings2 } from 'lucide-react';

import { ElementRestraintChart } from '@/modules/combat/components/RestraintChart';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { getRarityStyle, BackpackHeader, EmptyBackpackHint, UpgradeableItemTooltip } from '@/shared/ui/item-tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { useTechniques } from '@/views/game';
import { TECHNIQUE_BONDS, PROFICIENCY_LEVELS, getProficiencyLevel } from '@/modules/techniques/data/techniqueBondData';
import { getElementRestraintHint, getElementIcon, WEAPON_CATEGORY_DEFAULT_ELEMENT, WEAPON_CATEGORY_COMPATIBLE_TECHNIQUE } from '@/modules/combat/logic/restraintSystem';
import { Technique, TechniqueType, ItemRarity, UPGRADE_CONFIG, Element, ELEMENT_NAMES, WEAPON_CATEGORY_NAMES, WeaponCategory } from '@/shared/lib/types';

// 熟练度等级配置
const PROFICIENCY_COLORS: Record<string, string> = {
  '入门': 'text-gray-500 bg-gray-100 dark:bg-gray-800',
  '小成': 'text-green-600 bg-green-100 dark:bg-green-900/30',
  '大成': 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  '圆满': 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
  '化境': 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
};

// 属性图标映射
const ELEMENT_ICONS: Record<Element, React.ReactNode> = {
  fire: <Flame className="w-3 h-3 text-orange-500" />,
  ice: <Snowflake className="w-3 h-3 text-cyan-400" />,
  thunder: <Thunder className="w-3 h-3 text-yellow-500" />,
  wind: <Wind className="w-3 h-3 text-green-400" />,
  earth: <Mountain className="w-3 h-3 text-amber-600" />,
  light: <Sun className="w-3 h-3 text-yellow-300" />,
  dark: <Moon className="w-3 h-3 text-purple-400" />,
};

// 获取克制关系显示（功法只有元素属性，没有武器类别）
function getRestraintDisplay(technique: Technique): { elementBadges: React.ReactNode[] } {
  const elementBadges: React.ReactNode[] = [];
  
  // 元素属性
  if (technique.element) {
    const hint = getElementRestraintHint(technique.element);
    const icon = getElementIcon(technique.element);
    elementBadges.push(
      <Tooltip key="element">
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className="text-[9px] px-1 py-0 h-4 bg-purple-500/10 border-purple-400 text-purple-600 dark:text-purple-400 cursor-help flex items-center gap-0.5"
          >
            <span>{icon}</span>
            {ELEMENT_NAMES[technique.element as Element]}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <div className="text-xs font-medium">{icon}{ELEMENT_NAMES[technique.element as Element]}属性</div>
            {hint.counters.length > 0 && (
              <div className="text-[10px] text-green-500">✦ 克制：{hint.counters.join('、')}</div>
            )}
            {hint.counteredBy.length > 0 && (
              <div className="text-[10px] text-red-500">⚠ 被克：{hint.counteredBy.join('、')}</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }
  
  return { elementBadges };
}

interface TechniquePanelProps {
  techniques?: Technique[];
  equippedAttackTechniques?: (Technique | null)[];
  equippedDefenseTechniques?: (Technique | null)[];
  onEquip?: (technique: Technique, slotIndex?: number) => void;
  onUnequip?: (type: TechniqueType, slotIndex?: number) => void;
  onUpgrade?: (technique: Technique) => void; // 升级回调
  useGlobalState?: boolean;
}

// 功法类型配置
const TECHNIQUE_CONFIG = {
  attack: {
    icon: <Sword className="w-4 h-4" />,
    name: '攻击功法',
    color: 'red',
  },
  defense: {
    icon: <Shield className="w-4 h-4" />,
    name: '防御功法',
    color: 'blue',
  },
};

// 功法槽位卡片
function TechniqueSlotCard({ 
  technique, 
  slotIndex,
  type,
  onUnequip,
  onUpgrade,
}: { 
  technique: Technique | null;
  slotIndex: number;
  type: TechniqueType;
  onUnequip: () => void;
  onUpgrade?: () => void;
}) {
  const config = TECHNIQUE_CONFIG[type];
  
  if (!technique) {
    return (
      <div className={`p-2 rounded-lg border border-border bg-muted/30`}>
        <div className="flex items-center gap-2">
          <div className="shrink-0 text-muted-foreground">{config.icon}</div>
          <div className="min-w-0">
            <div className="text-[10px] text-muted-foreground">槽位 {slotIndex + 1}</div>
            <div className="text-xs text-muted-foreground">未装备</div>
          </div>
        </div>
      </div>
    );
  }

  // 技能解锁信息用于tooltip
  const unlockedSkillCount = technique.allSkills ? technique.allSkills.filter(s => s.unlockLevel <= technique.level).length : 0;
  const totalSkillCount = technique.allSkills?.length || 0;

  return (
    <UpgradeableItemTooltip
      name={technique.name}
      rarity={technique.rarity}
      type={config.name}
      description={technique.description}
      stats={[
        { label: '威力', value: technique.power, color: 'orange' },
        { label: '加成', value: `+${technique.bonus}%`, color: 'yellow' },
        { label: '法力消耗', value: technique.mpCost ?? technique.baseMpCost ?? 0, color: 'blue' },
      ]}
      element={technique.element ? (
        <span className="flex items-center gap-1">
          {getElementIcon(technique.element)}
          <span>{ELEMENT_NAMES[technique.element as Element]}</span>
        </span>
      ) : undefined}
      compatibleWeapon={technique.compatibleWeapon ? {
        name: WEAPON_CATEGORY_NAMES[technique.compatibleWeapon as WeaponCategory],
        bonus: technique.compatibleBonus,
        element: (
          <span className="flex items-center gap-0.5">
            {getElementIcon(WEAPON_CATEGORY_DEFAULT_ELEMENT[technique.compatibleWeapon as WeaponCategory])}
            <span>{ELEMENT_NAMES[WEAPON_CATEGORY_DEFAULT_ELEMENT[technique.compatibleWeapon as WeaponCategory]]}</span>
          </span>
        ),
        compatibleTechnique: WEAPON_CATEGORY_COMPATIBLE_TECHNIQUE[technique.compatibleWeapon as WeaponCategory],
      } : undefined}
      skillSlots={{
        current: technique.skillSlots,
        max: technique.maxSkillSlots,
      }}
      techniqueSkills={technique.allSkills?.map(s => ({ name: s.name, unlockLevel: s.unlockLevel, description: s.description }))}
      currentLevel={technique.level}
      level={technique.level}
      exp={technique.exp}
      maxLevel={UPGRADE_CONFIG.maxLevel}
      showUpgrade={!!onUpgrade}
      onUpgrade={onUpgrade}
      side="top"
    >
      <div className={`p-2 rounded-lg border ${getRarityStyle(technique.rarity, 'border')} ${getRarityStyle(technique.rarity, 'bg')}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="shrink-0 text-muted-foreground">{config.icon}</div>
            <div className="min-w-0 flex-1">
              <div className={`text-xs font-medium truncate ${getRarityStyle(technique.rarity, 'text')}`}>
                {technique.name}
              </div>
              <div className="flex items-center gap-2 text-[10px] mt-0.5">
                <span className="text-orange-500">威{technique.power}</span>
                <span className="text-yellow-500">+{technique.bonus}%</span>
                {technique.level > 1 && (
                  <span className="text-primary">Lv.{technique.level}</span>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 shrink-0"
            onClick={(e) => { e.stopPropagation(); onUnequip(); }}
          >
            ×
          </Button>
        </div>
      </div>
    </UpgradeableItemTooltip>
  );
}

// 功法背包物品
function TechniqueItem({ 
  technique, 
  onEquip,
  onUpgrade,
  emptySlotIndex 
}: { 
  technique: Technique; 
  onEquip: (slotIndex: number) => void;
  onUpgrade?: () => void;
  emptySlotIndex: number;
}) {
  const config = TECHNIQUE_CONFIG[technique.type];
  
  // 技能解锁信息用于tooltip
  const unlockedSkillCount = technique.allSkills ? technique.allSkills.filter(s => s.unlockLevel <= technique.level).length : 0;
  const totalSkillCount = technique.allSkills?.length || 0;

  return (
    <UpgradeableItemTooltip
      name={technique.name}
      rarity={technique.rarity}
      type={config.name}
      description={technique.description}
      stats={[
        { label: '威力', value: technique.power, color: 'orange' },
        { label: '加成', value: `+${technique.bonus}%`, color: 'yellow' },
        { label: '法力消耗', value: technique.mpCost ?? technique.baseMpCost ?? 0, color: 'blue' },
      ]}
      element={technique.element ? (
        <span className="flex items-center gap-1">
          {getElementIcon(technique.element)}
          <span>{ELEMENT_NAMES[technique.element as Element]}</span>
        </span>
      ) : undefined}
      compatibleWeapon={technique.compatibleWeapon ? {
        name: WEAPON_CATEGORY_NAMES[technique.compatibleWeapon as WeaponCategory],
        bonus: technique.compatibleBonus,
        element: (
          <span className="flex items-center gap-0.5">
            {getElementIcon(WEAPON_CATEGORY_DEFAULT_ELEMENT[technique.compatibleWeapon as WeaponCategory])}
            <span>{ELEMENT_NAMES[WEAPON_CATEGORY_DEFAULT_ELEMENT[technique.compatibleWeapon as WeaponCategory]]}</span>
          </span>
        ),
        compatibleTechnique: WEAPON_CATEGORY_COMPATIBLE_TECHNIQUE[technique.compatibleWeapon as WeaponCategory],
      } : undefined}
      skillSlots={{
        current: technique.skillSlots,
        max: technique.maxSkillSlots,
      }}
      techniqueSkills={technique.allSkills?.map(s => ({ name: s.name, unlockLevel: s.unlockLevel, description: s.description }))}
      currentLevel={technique.level}
      level={technique.level}
      exp={technique.exp}
      maxLevel={UPGRADE_CONFIG.maxLevel}
      showUpgrade={!!onUpgrade}
      onUpgrade={onUpgrade}
      side="top"
    >
      <div 
        className={`p-2 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] hover:border-primary/50 ${getRarityStyle(technique.rarity, 'border')} ${getRarityStyle(technique.rarity, 'bg')}`}
        onClick={() => onEquip(emptySlotIndex)}
      >
        <div className="flex items-center gap-2">
          <div className="shrink-0">{config.icon}</div>
          <div className="min-w-0 flex-1">
            <div className={`text-xs font-medium truncate ${getRarityStyle(technique.rarity, 'text')}`}>
              {technique.name}
            </div>
            <div className="flex items-center gap-2 text-[10px] mt-0.5">
              <span className="text-orange-500">威{technique.power}</span>
              <span className="text-yellow-500">+{technique.bonus}%</span>
              {technique.level > 1 && (
                <span className="text-primary">Lv.{technique.level}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </UpgradeableItemTooltip>
  );
}

export function TechniquePanel({
  techniques: propsTechniques,
  equippedAttackTechniques: propsAttackTechniques,
  equippedDefenseTechniques: propsDefenseTechniques,
  onEquip: propsEquip,
  onUnequip: propsUnequip,
  onUpgrade,
  useGlobalState = true,
}: TechniquePanelProps) {
  const globalState = useGlobalState ? useTechniques() : null;
  
  const techniques = propsTechniques ?? globalState?.techniques ?? [];
  const attackTechniques = (propsAttackTechniques ?? globalState?.equippedAttackTechniques ?? [null, null, null]) as (Technique | null)[];
  const defenseTechniques = (propsDefenseTechniques ?? globalState?.equippedDefenseTechniques ?? [null, null, null]) as (Technique | null)[];
  const onEquip = propsEquip ?? globalState?.equipTechnique ?? (() => {});
  const onUnequip = propsUnequip ?? globalState?.unequipTechnique ?? (() => {});

  // 计算总加成
  const totalAttackBonus = attackTechniques.filter(Boolean).reduce((sum, t) => sum + (t?.bonus || 0), 0);
  const totalDefenseBonus = defenseTechniques.filter(Boolean).reduce((sum, t) => sum + (t?.bonus || 0), 0);

  // 检查功法是否已装备
  const isEquipped = (technique: Technique) => {
    const list = technique.type === 'attack' ? attackTechniques : defenseTechniques;
    return list.some(t => t?.id === technique.id);
  };

  // 筛选未装备的功法
  const unfilteredBackpack = techniques.filter((t: Technique) => !isEquipped(t));
  
  // 排序和筛选状态
  const [sortBy, setSortBy] = useState<'level' | 'power' | 'rarity'>('level');
  const [filterType, setFilterType] = useState<'all' | 'attack' | 'defense'>('all');
  const [filterRarity, setFilterRarity] = useState<'all' | ItemRarity>('all');
  
  // 排序和筛选后的背包
  const backpack = useMemo(() => {
    let result = unfilteredBackpack;
    
    // 类型筛选
    if (filterType !== 'all') {
      result = result.filter((t: Technique) => t.type === filterType);
    }
    
    // 稀有度筛选
    if (filterRarity !== 'all') {
      result = result.filter((t: Technique) => t.rarity === filterRarity);
    }
    
    // 排序
    const rarityOrder = ['普通', '稀有', '史诗', '传说'];
    result = [...result].sort((a: Technique, b: Technique) => {
      switch (sortBy) {
        case 'level':
          return b.level - a.level;
        case 'power':
          return b.power - a.power;
        case 'rarity':
          return rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);
        default:
          return 0;
      }
    });
    
    return result;
  }, [unfilteredBackpack, sortBy, filterType, filterRarity]);
  
  // 找空槽位
  const findEmptySlot = (type: TechniqueType): number => {
    const list = type === 'attack' ? attackTechniques : defenseTechniques;
    const idx = list.findIndex(t => t === null);
    return idx >= 0 ? idx : 0;
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-1 pt-2 shrink-0">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            功法
          </div>
          <div className="flex gap-2 text-[10px] font-normal">
            <span className="text-red-500">+{totalAttackBonus}%攻</span>
            <span className="text-blue-500">+{totalDefenseBonus}%防</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-2 space-y-2 flex-1 overflow-y-auto">
        {/* 攻击功法槽位 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              {TECHNIQUE_CONFIG.attack.icon}
              {TECHNIQUE_CONFIG.attack.name}
            </div>
            <div className="text-[10px] font-medium text-red-500">+{totalAttackBonus}%</div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[0, 1, 2].map(index => (
              <TechniqueSlotCard
                key={index}
                type="attack"
                technique={attackTechniques[index]}
                slotIndex={index}
                onUnequip={() => onUnequip('attack', index)}
                onUpgrade={attackTechniques[index] && onUpgrade ? () => onUpgrade(attackTechniques[index]!) : undefined}
              />
            ))}
          </div>
        </div>

        {/* 防御功法槽位 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              {TECHNIQUE_CONFIG.defense.icon}
              {TECHNIQUE_CONFIG.defense.name}
            </div>
            <div className="text-[10px] font-medium text-blue-500">+{totalDefenseBonus}%</div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[0, 1, 2].map(index => (
              <TechniqueSlotCard
                key={index}
                type="defense"
                technique={defenseTechniques[index]}
                slotIndex={index}
                onUnequip={() => onUnequip('defense', index)}
                onUpgrade={defenseTechniques[index] && onUpgrade ? () => onUpgrade(defenseTechniques[index]!) : undefined}
              />
            ))}
          </div>
        </div>

        {/* 激活的羁绊 */}
        <ActiveBonds attackTechniques={attackTechniques} defenseTechniques={defenseTechniques} />

        {/* 元素克制关系图 */}
        <ElementRestraintChart />

        {/* 功法背包 - 不可折叠 */}
        <div className="pt-1">
          <BackpackHeader icon={<Package className="w-3 h-3" />} title="功法背包" count={backpack.length} />
          
          {/* 排序和筛选 */}
          {unfilteredBackpack.length > 0 && (
            <div className="flex gap-1.5 mb-2 flex-wrap">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'level' | 'power' | 'rarity')}>
                <SelectTrigger className="h-6 text-[10px] w-auto min-w-[80px]">
                  <ArrowUpDown className="w-2.5 h-2.5 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="level" className="text-xs">等级优先</SelectItem>
                  <SelectItem value="power" className="text-xs">威力优先</SelectItem>
                  <SelectItem value="rarity" className="text-xs">稀有优先</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={(v) => setFilterType(v as 'all' | 'attack' | 'defense')}>
                <SelectTrigger className="h-6 text-[10px] w-auto min-w-[70px]">
                  <Filter className="w-2.5 h-2.5 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">全部</SelectItem>
                  <SelectItem value="attack" className="text-xs">攻击</SelectItem>
                  <SelectItem value="defense" className="text-xs">防御</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterRarity} onValueChange={(v) => setFilterRarity(v as 'all' | ItemRarity)}>
                <SelectTrigger className="h-6 text-[10px] w-auto min-w-[70px]">
                  <Star className="w-2.5 h-2.5 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">全部</SelectItem>
                  <SelectItem value="传说" className="text-xs">传说</SelectItem>
                  <SelectItem value="史诗" className="text-xs">史诗</SelectItem>
                  <SelectItem value="稀有" className="text-xs">稀有</SelectItem>
                  <SelectItem value="普通" className="text-xs">普通</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {backpack.length === 0 ? (
            <EmptyBackpackHint message={unfilteredBackpack.length > 0 ? "无匹配功法" : "暂无功法"} />
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {backpack.map((technique: Technique) => (
                <TechniqueItem
                  key={technique.id}
                  technique={technique}
                  onEquip={(slotIndex) => onEquip(technique, slotIndex)}
                  onUpgrade={onUpgrade ? () => onUpgrade(technique) : undefined}
                  emptySlotIndex={findEmptySlot(technique.type)}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 羁绊显示组件
function ActiveBonds({ 
  attackTechniques, 
  defenseTechniques 
}: { 
  attackTechniques: (Technique | null)[];
  defenseTechniques: (Technique | null)[];
}) {
  // 合并所有装备的功法
  const allEquipped = [...attackTechniques, ...defenseTechniques].filter((t): t is Technique => t !== null);
  
  // 检测激活的羁绊
  const activeBonds: { bond: typeof TECHNIQUE_BONDS[0]; level: typeof TECHNIQUE_BONDS[0]['levels'][0]; count: number; matchedTechniques: Technique[] }[] = [];
  
  for (const bond of TECHNIQUE_BONDS) {
    const matchedTechniques = allEquipped.filter(t => 
      bond.keywords.some(keyword => t.name.includes(keyword))
    );
    const matchCount = matchedTechniques.length;
    
    if (matchCount >= bond.minMatches) {
      // 找到对应的羁绊等级
      const level = [...bond.levels].reverse().find(l => matchCount >= l.requiredCount);
      if (level) {
        activeBonds.push({ bond, level, count: matchCount, matchedTechniques });
      }
    }
  }
  
  if (activeBonds.length === 0) return null;
  
  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
        <Link2 className="w-3 h-3" />
        <span>激活羁绊</span>
      </div>
      <div className="space-y-1">
        {activeBonds.map(({ bond, level, count, matchedTechniques }) => (
          <Tooltip key={bond.id}>
            <TooltipTrigger asChild>
              <div 
                className={`p-2 rounded-lg border cursor-help ${getRarityStyle(bond.rarity, 'border')} ${getRarityStyle(bond.rarity, 'bg')}`}
              >
                <div className="flex items-center justify-between">
                  <div className={`text-xs font-medium ${getRarityStyle(bond.rarity, 'text')}`}>
                    {bond.name}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                      Lv.{level.level}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                      {count}/{level.requiredCount}
                    </Badge>
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  <span className="text-orange-500">威力+{level.effects.powerBonus}%</span>
                  <span className="mx-1">·</span>
                  <span className="text-yellow-500">加成+{level.effects.bonusMultiplier}%</span>
                </div>
                {level.effects.special && (
                  <div className="text-[9px] text-primary mt-0.5">
                    ✦ {level.effects.special}
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs bg-popover border-border shadow-lg">
              <div className="space-y-2">
                <div className="text-xs font-medium text-foreground">{bond.name}</div>
                <div className="text-[10px] text-muted-foreground">{bond.description}</div>
                <div className="space-y-1">
                  <div className="text-[10px] font-medium text-foreground">触发条件：</div>
                  <div className="text-[10px] text-muted-foreground">
                    包含以下关键词的功法：{bond.keywords.slice(0, 5).join('、')}{bond.keywords.length > 5 ? '...' : ''}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-medium text-foreground">已匹配功法：</div>
                  <div className="text-[10px] text-primary">
                    {matchedTechniques.map(t => t.name).join('、')}
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
