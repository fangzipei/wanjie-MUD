'use client';

import React, { useMemo, useState } from 'react';

import { Shield, Sword, Swords, Crosshair, Headphones, Shirt, Footprints, Package, Sparkles, Layers, Info, ArrowUpDown, Filter, Star, Flame, Snowflake, Zap as Thunder, Wind, Mountain, Sun, Moon } from 'lucide-react';

import { WeaponRestraintChart } from '@/modules/combat/components/RestraintChart';
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
import { EQUIPMENT_SETS, EquipmentAffix } from '@/modules/equipment/data/equipmentAffixData';
import { getElementIcon, getWeaponCategoryIcon, type Element, type WeaponCategory } from '@/modules/combat/logic/restraintSystem';
import { Equipment, EquipmentSlot, ItemRarity, UPGRADE_CONFIG, ELEMENT_NAMES, WEAPON_CATEGORY_NAMES } from '@/shared/lib/types';

interface EquipmentPanelProps {
  equipments: Equipment[];
  equippedMelee: Equipment | null;
  equippedRanged: Equipment | null;
  equippedHead: Equipment | null;
  equippedBody: Equipment | null;
  equippedLegs: Equipment | null;
  equippedFeet: Equipment | null;
  onEquip: (equipment: Equipment) => void;
  onUnequip: (slot: EquipmentSlot) => void;
  onUpgrade?: (equipment: Equipment) => void; // 升级回调
  onEnhance?: (equipmentId: string) => void; // 强化回调
  onRefine?: (equipmentId: string) => void; // 重铸回调
}

// 装备槽位配置
const SLOT_CONFIG: Record<EquipmentSlot, { icon: React.ReactNode; name: string; category: 'attack' | 'defense' }> = {
  melee: { icon: <Sword className="w-4 h-4" />, name: '近战武器', category: 'attack' },
  ranged: { icon: <Crosshair className="w-4 h-4" />, name: '远程武器', category: 'attack' },
  head: { icon: <Headphones className="w-4 h-4" />, name: '头部', category: 'defense' },
  body: { icon: <Shirt className="w-4 h-4" />, name: '身体', category: 'defense' },
  legs: { icon: <Shield className="w-4 h-4" />, name: '腿部', category: 'defense' },
  feet: { icon: <Footprints className="w-4 h-4" />, name: '脚部', category: 'defense' },
};

// 装备槽位卡片
function EquipmentSlotCard({ 
  slot, 
  equipment, 
  onUnequip,
  onUpgrade,
  onEnhance,
}: { 
  slot: EquipmentSlot; 
  equipment: Equipment | null;
  onUnequip: () => void;
  onUpgrade?: () => void;
  onEnhance?: () => void;
}) {
  const config = SLOT_CONFIG[slot];
  
  if (!equipment) {
    return (
      <div className={`p-2 h-full rounded-lg border border-border bg-muted/30`}>
        <div className="flex items-center gap-2">
          <div className="shrink-0 text-muted-foreground">{config.icon}</div>
          <div className="min-w-0">
            <div className="text-[10px] text-muted-foreground">{config.name}</div>
            <div className="text-xs text-muted-foreground">未装备</div>
          </div>
        </div>
      </div>
    );
  }

  // 获取强化等级显示
  const enhancementDisplay = equipment.enhancement && equipment.enhancement > 0 
    ? `+${equipment.enhancement}` 
    : null;

  return (
    <UpgradeableItemTooltip
      name={equipment.name}
      rarity={equipment.rarity}
      type={config.name}
      description={equipment.description}
      stats={[
        ...(equipment.attackBonus > 0 ? [{ label: '攻击力', value: `+${equipment.attackBonus}%`, color: 'red' }] : []),
        ...(equipment.defenseBonus > 0 ? [{ label: '防御力', value: `+${equipment.defenseBonus}%`, color: 'blue' }] : []),
        { label: '战力', value: equipment.power, color: 'orange' },
        ...(equipment.enhancement && equipment.enhancement > 0 ? [{ label: '强化', value: `+${equipment.enhancement}`, color: 'yellow' }] : []),
      ]}
      element={equipment.element ? (
        <span className="flex items-center gap-1">
          {getElementIcon(equipment.element)}
          <span>{ELEMENT_NAMES[equipment.element as Element]}</span>
        </span>
      ) : undefined}
      compatibleElement={equipment.compatibleElement ? {
        name: ELEMENT_NAMES[equipment.compatibleElement as Element],
        bonus: equipment.compatibleBonus,
      } : undefined}
      weaponCategory={equipment.weaponCategory ? (
        <span className="flex items-center gap-1">
          {getWeaponCategoryIcon(equipment.weaponCategory)}
          <span>{WEAPON_CATEGORY_NAMES[equipment.weaponCategory as WeaponCategory]}</span>
        </span>
      ) : undefined}
      techniqueSlots={{
        current: equipment.techniqueSlots,
        max: equipment.maxTechniqueSlots,
      }}
      weaponTechniques={equipment.allTechniques?.map(t => ({ name: t.name, unlockLevel: t.unlockLevel, description: t.description }))}
      currentLevel={equipment.level}
      level={equipment.level}
      exp={equipment.exp}
      maxLevel={UPGRADE_CONFIG.maxLevel}
      showUpgrade={!!onUpgrade}
      onUpgrade={onUpgrade}
      side="top"
    >
      <div className={`p-2 h-full rounded-lg border ${getRarityStyle(equipment.rarity, 'border')} ${getRarityStyle(equipment.rarity, 'bg')}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="shrink-0 text-muted-foreground">{config.icon}</div>
            <div className="min-w-0 flex-1">
              <div className={`text-xs font-medium truncate ${getRarityStyle(equipment.rarity, 'text')}`}>
                {enhancementDisplay && <span className="text-yellow-500">{enhancementDisplay} </span>}
                {equipment.name}
              </div>
              <div className="flex items-center gap-2 text-[10px] mt-0.5">
                {equipment.attackBonus > 0 && (
                  <span className="text-red-500 dark:text-red-400">+{equipment.attackBonus}%攻</span>
                )}
                {equipment.defenseBonus > 0 && (
                  <span className="text-blue-500 dark:text-blue-400">+{equipment.defenseBonus}%防</span>
                )}
                {equipment.level > 1 && (
                  <span className="text-primary">Lv.{equipment.level}</span>
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

// 装备背包物品
function EquipmentItem({ 
  equipment, 
  onEquip,
  onUpgrade,
}: { 
  equipment: Equipment; 
  onEquip: () => void;
  onUpgrade?: () => void;
}) {
  const config = SLOT_CONFIG[equipment.slot];
  
  // 获取强化等级显示
  const enhancementDisplay = equipment.enhancement && equipment.enhancement > 0 
    ? `+${equipment.enhancement}` 
    : null;

  return (
    <UpgradeableItemTooltip
      name={equipment.name}
      rarity={equipment.rarity}
      type={config.name}
      description={equipment.description}
      stats={[
        ...(equipment.attackBonus > 0 ? [{ label: '攻击力', value: `+${equipment.attackBonus}%`, color: 'red' }] : []),
        ...(equipment.defenseBonus > 0 ? [{ label: '防御力', value: `+${equipment.defenseBonus}%`, color: 'blue' }] : []),
        { label: '战力', value: equipment.power, color: 'orange' },
        ...(equipment.enhancement && equipment.enhancement > 0 ? [{ label: '强化', value: `+${equipment.enhancement}`, color: 'yellow' }] : []),
      ]}
      element={equipment.element ? (
        <span className="flex items-center gap-1">
          {getElementIcon(equipment.element)}
          <span>{ELEMENT_NAMES[equipment.element as Element]}</span>
        </span>
      ) : undefined}
      compatibleElement={equipment.compatibleElement ? {
        name: ELEMENT_NAMES[equipment.compatibleElement as Element],
        bonus: equipment.compatibleBonus,
      } : undefined}
      weaponCategory={equipment.weaponCategory ? (
        <span className="flex items-center gap-1">
          {getWeaponCategoryIcon(equipment.weaponCategory)}
          <span>{WEAPON_CATEGORY_NAMES[equipment.weaponCategory as WeaponCategory]}</span>
        </span>
      ) : undefined}
      techniqueSlots={{
        current: equipment.techniqueSlots,
        max: equipment.maxTechniqueSlots,
      }}
      weaponTechniques={equipment.allTechniques?.map(t => ({ name: t.name, unlockLevel: t.unlockLevel, description: t.description }))}
      currentLevel={equipment.level}
      level={equipment.level}
      exp={equipment.exp}
      maxLevel={UPGRADE_CONFIG.maxLevel}
      showUpgrade={!!onUpgrade}
      onUpgrade={onUpgrade}
      side="top"
    >
      <div 
        className={`p-2 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] hover:border-primary/50 ${getRarityStyle(equipment.rarity, 'border')} ${getRarityStyle(equipment.rarity, 'bg')}`}
        onClick={onEquip}
      >
        <div className="flex items-center gap-2">
          <div className="shrink-0">{config.icon}</div>
          <div className="min-w-0 flex-1">
            <div className={`text-xs font-medium truncate ${getRarityStyle(equipment.rarity, 'text')}`}>
              {enhancementDisplay && <span className="text-yellow-500">{enhancementDisplay} </span>}
              {equipment.name}
            </div>
            <div className="flex items-center gap-2 text-[10px] mt-0.5">
              {equipment.attackBonus > 0 && (
                <span className="text-red-500 dark:text-red-400">+{equipment.attackBonus}%攻</span>
              )}
              {equipment.defenseBonus > 0 && (
                <span className="text-blue-500 dark:text-blue-400">+{equipment.defenseBonus}%防</span>
              )}
              {equipment.level > 1 && (
                <span className="text-primary">Lv.{equipment.level}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </UpgradeableItemTooltip>
  );
}

export function EquipmentPanel({
  equipments,
  equippedMelee,
  equippedRanged,
  equippedHead,
  equippedBody,
  equippedLegs,
  equippedFeet,
  onEquip,
  onUnequip,
  onUpgrade,
}: EquipmentPanelProps) {
  // 按槽位分组已装备的装备
  const equippedBySlot: Record<EquipmentSlot, Equipment | null> = {
    melee: equippedMelee,
    ranged: equippedRanged,
    head: equippedHead,
    body: equippedBody,
    legs: equippedLegs,
    feet: equippedFeet,
  };

  // 计算总加成
  const totalAttackBonus = [equippedMelee, equippedRanged]
    .filter(Boolean)
    .reduce((sum, e) => sum + (e?.attackBonus || 0), 0);
  
  const totalDefenseBonus = [equippedHead, equippedBody, equippedLegs, equippedFeet]
    .filter(Boolean)
    .reduce((sum, e) => sum + (e?.defenseBonus || 0), 0);

  // 检查装备是否已装备
  const isEquipped = (equipment: Equipment) => {
    return equippedBySlot[equipment.slot]?.id === equipment.id;
  };

  // 筛选出未装备的装备，并去除重复ID
  const unfilteredBackpack = useMemo(() => {
    const unequipped = equipments.filter(e => !isEquipped(e));
    // 使用Map去重，保留最后一个相同ID的装备
    const uniqueMap = new Map<string, Equipment>();
    unequipped.forEach(e => uniqueMap.set(e.id, e));
    return Array.from(uniqueMap.values());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipments, equippedMelee, equippedRanged, equippedHead, equippedBody, equippedLegs, equippedFeet]);
  
  // 排序和筛选状态
  const [sortBy, setSortBy] = useState<'level' | 'attack' | 'defense' | 'rarity'>('level');
  const [filterSlot, setFilterSlot] = useState<'all' | EquipmentSlot>('all');
  const [filterRarity, setFilterRarity] = useState<'all' | ItemRarity>('all');
  
  // 排序和筛选后的背包
  const backpack = useMemo(() => {
    let result = unfilteredBackpack;
    
    // 槽位筛选
    if (filterSlot !== 'all') {
      result = result.filter(e => e.slot === filterSlot);
    }
    
    // 稀有度筛选
    if (filterRarity !== 'all') {
      result = result.filter(e => e.rarity === filterRarity);
    }
    
    // 排序
    const rarityOrder = ['普通', '稀有', '史诗', '传说'];
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'level':
          return b.level - a.level;
        case 'attack':
          return (b.attackBonus || 0) - (a.attackBonus || 0);
        case 'defense':
          return (b.defenseBonus || 0) - (a.defenseBonus || 0);
        case 'rarity':
          return rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);
        default:
          return 0;
      }
    });
    
    return result;
  }, [unfilteredBackpack, sortBy, filterSlot, filterRarity]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-1 pt-2 shrink-0">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            装备
          </div>
          <div className="flex gap-2 text-[10px] font-normal">
            <span className="text-red-500 dark:text-red-400">+{totalAttackBonus}%攻</span>
            <span className="text-blue-500 dark:text-blue-400">+{totalDefenseBonus}%防</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-2 space-y-2 flex-1 overflow-y-auto">
        {/* 武器槽位 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <Sword className="w-3 h-3" />
              武器
            </div>
            <div className="text-[10px] font-medium text-red-500 dark:text-red-400">+{totalAttackBonus}%</div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <EquipmentSlotCard
              slot="melee"
              equipment={equippedMelee}
              onUnequip={() => onUnequip('melee')}
              onUpgrade={equippedMelee && onUpgrade ? () => onUpgrade(equippedMelee) : undefined}
            />
            <EquipmentSlotCard
              slot="ranged"
              equipment={equippedRanged}
              onUnequip={() => onUnequip('ranged')}
              onUpgrade={equippedRanged && onUpgrade ? () => onUpgrade(equippedRanged) : undefined}
            />
          </div>
        </div>

        {/* 护甲槽位 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <Shield className="w-3 h-3" />
              护甲
            </div>
            <div className="text-[10px] font-medium text-blue-500 dark:text-blue-400">+{totalDefenseBonus}%</div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <EquipmentSlotCard
              slot="head"
              equipment={equippedHead}
              onUnequip={() => onUnequip('head')}
              onUpgrade={equippedHead && onUpgrade ? () => onUpgrade(equippedHead) : undefined}
            />
            <EquipmentSlotCard
              slot="body"
              equipment={equippedBody}
              onUnequip={() => onUnequip('body')}
              onUpgrade={equippedBody && onUpgrade ? () => onUpgrade(equippedBody) : undefined}
            />
            <EquipmentSlotCard
              slot="legs"
              equipment={equippedLegs}
              onUnequip={() => onUnequip('legs')}
              onUpgrade={equippedLegs && onUpgrade ? () => onUpgrade(equippedLegs) : undefined}
            />
            <EquipmentSlotCard
              slot="feet"
              equipment={equippedFeet}
              onUnequip={() => onUnequip('feet')}
              onUpgrade={equippedFeet && onUpgrade ? () => onUpgrade(equippedFeet) : undefined}
            />
          </div>
        </div>

        {/* 武器克制关系图 */}
        <WeaponRestraintChart />

        {/* 装备背包 - 不可折叠 */}
        <div className="pt-1">
          <BackpackHeader icon={<Package className="w-3 h-3" />} title="装备背包" count={backpack.length} />
          
          {/* 排序和筛选 */}
          {unfilteredBackpack.length > 0 && (
            <div className="flex gap-1.5 mb-2 flex-wrap">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'level' | 'attack' | 'defense' | 'rarity')}>
                <SelectTrigger className="h-6 text-[10px] w-auto min-w-[80px]">
                  <ArrowUpDown className="w-2.5 h-2.5 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="level" className="text-xs">等级优先</SelectItem>
                  <SelectItem value="attack" className="text-xs">攻击优先</SelectItem>
                  <SelectItem value="defense" className="text-xs">防御优先</SelectItem>
                  <SelectItem value="rarity" className="text-xs">稀有优先</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSlot} onValueChange={(v) => setFilterSlot(v as 'all' | EquipmentSlot)}>
                <SelectTrigger className="h-6 text-[10px] w-auto min-w-[70px]">
                  <Filter className="w-2.5 h-2.5 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">全部</SelectItem>
                  <SelectItem value="melee" className="text-xs">近战</SelectItem>
                  <SelectItem value="ranged" className="text-xs">远程</SelectItem>
                  <SelectItem value="head" className="text-xs">头部</SelectItem>
                  <SelectItem value="body" className="text-xs">身体</SelectItem>
                  <SelectItem value="legs" className="text-xs">腿部</SelectItem>
                  <SelectItem value="feet" className="text-xs">脚部</SelectItem>
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
            <EmptyBackpackHint message={unfilteredBackpack.length > 0 ? "无匹配装备" : "暂无装备"} />
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {backpack.map((equipment) => (
                <EquipmentItem
                  key={equipment.id}
                  equipment={equipment}
                  onEquip={() => onEquip(equipment)}
                  onUpgrade={onUpgrade ? () => onUpgrade(equipment) : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* 激活的套装效果 */}
        <ActiveSetEffects 
          equippedItems={[equippedMelee, equippedRanged, equippedHead, equippedBody, equippedLegs, equippedFeet]} 
        />
      </CardContent>
    </Card>
  );
}

// 套装效果显示组件
function ActiveSetEffects({ equippedItems }: { equippedItems: (Equipment | null)[] }) {
  // 统计套装装备数量
  const setCounts: Record<string, number> = {};
  const setItems: Record<string, Equipment[]> = {};
  const equippedWithSet = equippedItems.filter((e): e is Equipment => 
    e !== null && e.setId !== undefined
  );
  
  for (const item of equippedWithSet) {
    if (item.setId) {
      setCounts[item.setId] = (setCounts[item.setId] || 0) + 1;
      if (!setItems[item.setId]) {
        setItems[item.setId] = [];
      }
      setItems[item.setId].push(item);
    }
  }
  
  // 找到激活的套装效果
  const activeSets: { set: typeof EQUIPMENT_SETS[0]; count: number; activeBonuses: typeof EQUIPMENT_SETS[0]['bonuses'][0]; nextBonus: typeof EQUIPMENT_SETS[0]['bonuses'][0] | null; equippedItems: Equipment[] }[] = [];
  
  for (const [setId, count] of Object.entries(setCounts)) {
    const setConfig = EQUIPMENT_SETS.find(s => s.id === setId);
    if (setConfig && count >= 2) {
      const activeBonuses = setConfig.bonuses.filter(b => count >= b.requiredPieces);
      const nextBonus = setConfig.bonuses.find(b => count < b.requiredPieces);
      if (activeBonuses.length > 0) {
        activeSets.push({ 
          set: setConfig, 
          count, 
          activeBonuses: activeBonuses[activeBonuses.length - 1], // 最高激活的奖励
          nextBonus: nextBonus || null,
          equippedItems: setItems[setId] || []
        });
      }
    }
  }
  
  if (activeSets.length === 0) return null;
  
  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
        <Layers className="w-3 h-3" />
        <span>套装效果</span>
      </div>
      <div className="space-y-1">
        {activeSets.map(({ set, count, activeBonuses, nextBonus, equippedItems }) => (
          <Tooltip key={set.id}>
            <TooltipTrigger asChild>
              <div 
                className={`p-2 rounded-lg border cursor-help ${getRarityStyle(set.rarity, 'border')} ${getRarityStyle(set.rarity, 'bg')}`}
              >
                <div className="flex items-center justify-between">
                  <div className={`text-xs font-medium ${getRarityStyle(set.rarity, 'text')}`}>
                    {set.name}
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                    {count}/{set.bonuses[set.bonuses.length - 1]?.requiredPieces || count}件
                  </Badge>
                </div>
                <div className="text-[9px] text-primary mt-1">
                  ✦ {activeBonuses.description}
                </div>
                {nextBonus && (
                  <div className="text-[8px] text-muted-foreground mt-0.5">
                    下一级 ({nextBonus.requiredPieces}件): {nextBonus.description}
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs bg-popover border-border shadow-lg">
              <div className="space-y-2">
                <div className="text-xs font-medium text-foreground">{set.name}</div>
                <div className="text-[10px] text-muted-foreground">{set.description}</div>
                <div className="space-y-1">
                  <div className="text-[10px] font-medium text-foreground">套装效果：</div>
                  {set.bonuses.map((bonus, idx) => {
                    const isActive = count >= bonus.requiredPieces;
                    return (
                      <div 
                        key={idx} 
                        className={`text-[10px] ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                      >
                        {isActive ? '✦' : '○'} {bonus.requiredPieces}件: {bonus.description}
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-medium text-foreground">已装备部件：</div>
                  <div className="text-[10px] text-muted-foreground">
                    {equippedItems.map(item => item.name).join('、')}
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
