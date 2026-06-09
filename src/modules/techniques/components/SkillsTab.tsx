'use client';

import React, { useMemo, useState, useEffect } from 'react';

import { 
  Zap, 
  Lock, 
  Plus, 
  X, 
  Swords,
  Flame,
  Snowflake,
  Zap as Thunder,
  Wind,
  Mountain,
  Sun,
  Moon,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Element, WeaponCategory, ELEMENT_NAMES, WEAPON_CATEGORY_NAMES, getElementIcon, getWeaponCategoryIcon } from '@/modules/combat/logic/restraintSystem';
import { 
  getUnlockedSkills, 
  getEquippedSkills,
  getUnlockedTechniques,
  getEquippedTechniques,
  equipSkill,
  unequipSkill,
  equipTechnique,
  unequipTechnique,
  quickEquipSkill,
  quickEquipTechnique,
} from '@/modules/techniques/logic/skillEquipSystem';
import { TechniqueSkill, WeaponTechnique } from '@/modules/techniques/logic/skillTypes';
import { Technique, Equipment } from '@/shared/lib/types';

interface SkillsTabProps {
  /** 主角功法列表 */
  techniques: Technique[];
  /** 主角装备列表 */
  equipments: Equipment[];
  /** 装备的近战武器 */
  equippedMelee: Equipment | null;
  /** 装备的远程武器 */
  equippedRanged: Equipment | null;
  /** 当前激活的 Tab */
  activeTab?: 'technique' | 'combat';
  /** Tab 变更回调 */
  onTabChange?: (tab: 'technique' | 'combat') => void;
  /** 功法变更回调（返回更新后的功法） */
  onTechniqueChange?: (updatedTechnique: Technique) => void;
  /** 装备变更回调（返回更新后的装备） */
  onEquipmentChange?: (updatedEquipment: Equipment) => void;
}

// ============================================
// 元素图标映射
// ============================================

const ElementIcons: Record<Element, React.ReactNode> = {
  fire: <Flame className="w-3.5 h-3.5 text-orange-500" />,
  ice: <Snowflake className="w-3.5 h-3.5 text-cyan-500" />,
  thunder: <Thunder className="w-3.5 h-3.5 text-yellow-500" />,
  wind: <Wind className="w-3.5 h-3.5 text-green-500" />,
  earth: <Mountain className="w-3.5 h-3.5 text-amber-700" />,
  light: <Sun className="w-3.5 h-3.5 text-yellow-300" />,
  dark: <Moon className="w-3.5 h-3.5 text-purple-500" />,
};

export function SkillsTab({
  techniques,
  equipments,
  equippedMelee,
  equippedRanged,
  activeTab = 'technique',
  onTabChange,
  onTechniqueChange,
  onEquipmentChange,
}: SkillsTabProps) {
  // 获取已装备的功法（非残本）
  const equippedTechniques = useMemo(() => {
    return techniques.filter(t => !t.isFragment);
  }, [techniques]);
  
  // 获取已装备的武器
  const equippedWeapons = useMemo(() => {
    const weapons: Equipment[] = [];
    if (equippedMelee && !equippedMelee.isFragment) weapons.push(equippedMelee);
    if (equippedRanged && !equippedRanged.isFragment) weapons.push(equippedRanged);
    return weapons;
  }, [equippedMelee, equippedRanged]);
  
  // 统计法技
  const skillStats = useMemo(() => {
    let totalUnlocked = 0;
    let totalEquipped = 0;
    
    equippedTechniques.forEach(t => {
      totalUnlocked += getUnlockedSkills(t).length;
      totalEquipped += getEquippedSkills(t).length;
    });
    
    return { totalUnlocked, totalEquipped };
  }, [equippedTechniques]);
  
  // 统计斗技
  const techniqueStats = useMemo(() => {
    let totalUnlocked = 0;
    let totalEquipped = 0;
    
    equippedWeapons.forEach(w => {
      totalUnlocked += getUnlockedTechniques(w).length;
      totalEquipped += getEquippedTechniques(w).length;
    });
    
    return { totalUnlocked, totalEquipped };
  }, [equippedWeapons]);
  
  const handleTabChange = (tab: string) => {
    onTabChange?.(tab as 'technique' | 'combat');
  };
  
  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-2 shrink-0">
        <TabsTrigger value="technique" className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" />
          <span>法技</span>
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 ml-1">
            {skillStats.totalEquipped}/{skillStats.totalUnlocked}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="combat" className="flex items-center gap-1.5">
          <Swords className="w-3.5 h-3.5" />
          <span>斗技</span>
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 ml-1">
            {techniqueStats.totalEquipped}/{techniqueStats.totalUnlocked}
          </Badge>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="technique" className="flex-1 mt-2 overflow-hidden">
        <TechniqueSkillsPanel 
          techniques={equippedTechniques} 
          onTechniqueChange={onTechniqueChange}
        />
      </TabsContent>
      
      <TabsContent value="combat" className="flex-1 mt-2 overflow-hidden">
        <WeaponTechniquesPanel 
          weapons={equippedWeapons} 
          onEquipmentChange={onEquipmentChange}
        />
      </TabsContent>
    </Tabs>
  );
}

// ============================================
// 法技管理面板
// ============================================

function TechniqueSkillsPanel({
  techniques,
  onTechniqueChange,
}: {
  techniques: Technique[];
  onTechniqueChange?: (updatedTechnique: Technique) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    techniques[0]?.id || null
  );
  
  // 当 techniques 更新时，确保 selectedId 仍然有效
  useEffect(() => {
    const isValid = techniques.some(t => t.id === selectedId);
    if (!isValid && techniques.length > 0) {
      setSelectedId(techniques[0].id);
    }
  }, [techniques, selectedId]);
  
  const selectedTechnique = useMemo(() => 
    techniques.find(t => t.id === selectedId) || null,
    [techniques, selectedId]
  );
  
  if (techniques.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-xs text-muted-foreground text-center py-8">
          <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div>暂无功法</div>
          <div className="text-[10px] mt-1">请先获取功法</div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 pt-2 shrink-0">
        <CardTitle className="text-sm">法技管理</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 overflow-hidden flex flex-col gap-2">
        {/* 功法选择器 */}
        <Select value={selectedId || ''} onValueChange={setSelectedId}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="选择功法" />
          </SelectTrigger>
          <SelectContent>
            {techniques.map(t => {
              const unlockedCount = getUnlockedSkills(t).length;
              const equippedCount = getEquippedSkills(t).length;
              return (
                <SelectItem key={t.id} value={t.id} className="text-xs">
                  <div className="flex items-center gap-2">
                    {t.element && ElementIcons[t.element]}
                    <span className="truncate">{t.name}</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 ml-auto">
                      {equippedCount}/{unlockedCount}
                    </Badge>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        
        {/* 法技列表 */}
        {selectedTechnique && (
          <TechniqueSkillList 
            technique={selectedTechnique}
            onTechniqueChange={onTechniqueChange}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// 单个功法的法技列表
// ============================================

function TechniqueSkillList({
  technique,
  onTechniqueChange,
}: {
  technique: Technique;
  onTechniqueChange?: (updatedTechnique: Technique) => void;
}) {
  const unlockedSkills = useMemo(() => getUnlockedSkills(technique), [technique]);
  const equippedSkills = useMemo(() => getEquippedSkills(technique), [technique]);
  const equippedSkillIds = equippedSkills.map(s => s.id);
  const availableSkills = unlockedSkills.filter(s => !equippedSkillIds.includes(s.id));
  
  const handleQuickEquip = (skillId: string) => {
    const result = quickEquipSkill(technique, skillId);
    if (result.success && result.updatedTechnique) {
      onTechniqueChange?.(result.updatedTechnique);
    }
  };
  
  const handleUnequip = (slotIndex: number) => {
    const result = unequipSkill(technique, slotIndex);
    if (result.success && result.updatedTechnique) {
      onTechniqueChange?.(result.updatedTechnique);
    }
  };
  
  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-2">
      {/* 功法信息 */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
        {technique.element && (
          <span className="flex items-center gap-1">
            {ElementIcons[technique.element]}
            {ELEMENT_NAMES[technique.element]}
          </span>
        )}
        <span>Lv.{technique.level}</span>
        <span className="text-orange-500">
          {unlockedSkills.length}/{technique.allSkills.length} 已解锁
        </span>
        {technique.compatibleWeapon && (
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-cyan-500/10 border-cyan-400 text-cyan-600">
            <Swords className="w-2.5 h-2.5 mr-0.5" />
            {WEAPON_CATEGORY_NAMES[technique.compatibleWeapon]}
          </Badge>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-1">
          {/* 技能槽位 */}
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground font-medium">
              技能槽位 ({equippedSkills.length}/{technique.skillSlots})
            </div>
            {Array.from({ length: technique.maxSkillSlots }).map((_, index) => {
              const isUnlocked = index < technique.skillSlots;
              const equippedSkillId = technique.equippedSkills[index];
              const skill = equippedSkillId ? technique.allSkills.find(s => s.id === equippedSkillId) : null;
              
              if (!isUnlocked) {
                return (
                  <div key={index} className="flex items-center gap-2 p-2 rounded border border-dashed border-muted-foreground/30 bg-muted/30">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                    <div className="text-[10px] text-muted-foreground">槽位 {index + 1} · 未解锁</div>
                  </div>
                );
              }
              
              if (!skill) {
                return (
                  <div key={index} className="flex items-center gap-2 p-2 rounded border border-dashed border-muted-foreground/30 bg-muted/30">
                    <Plus className="w-3.5 h-3.5 text-muted-foreground/50" />
                    <div className="text-[10px] text-muted-foreground">槽位 {index + 1} · 空</div>
                  </div>
                );
              }
              
              return (
                <div key={index} className="flex items-center justify-between gap-2 p-2 rounded border bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {technique.element && ElementIcons[technique.element]}
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-medium truncate">{skill.name}</div>
                      <div className="text-[10px] text-muted-foreground">{skill.mpCost}MP · {skill.cooldown}回合</div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 shrink-0"
                    onClick={() => handleUnequip(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>
          
          {/* 可用技能 */}
          {availableSkills.length > 0 && (
            <div className="space-y-1 pt-1 border-t">
              <div className="text-[10px] text-muted-foreground font-medium">
                可用技能 ({availableSkills.length})
              </div>
              {availableSkills.map(skill => (
                <button
                  key={skill.id}
                  onClick={() => handleQuickEquip(skill.id)}
                  className="w-full flex items-center gap-2 p-2 rounded border border-border hover:border-primary/50 hover:bg-muted/50 text-left"
                >
                  {technique.element && ElementIcons[technique.element]}
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium truncate">{skill.name}</div>
                    <div className="text-[10px] text-muted-foreground">{skill.mpCost}MP · {skill.cooldown}回合</div>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
          
          {/* 未解锁技能 */}
          {technique.allSkills.some(s => s.unlockLevel > technique.level) && (
            <div className="space-y-1 pt-1 border-t">
              <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                未解锁 ({technique.allSkills.length - unlockedSkills.length})
              </div>
              {technique.allSkills
                .filter(s => s.unlockLevel > technique.level)
                .map(skill => (
                  <div key={skill.id} className="flex items-center gap-2 p-2 rounded border border-dashed border-muted-foreground/30 bg-muted/20 opacity-60">
                    {technique.element && ElementIcons[technique.element]}
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-medium truncate text-muted-foreground">{skill.name}</div>
                      <div className="text-[10px] text-orange-500">需 Lv.{skill.unlockLevel}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-orange-500/10 border-orange-400 text-orange-600">
                      {skill.unlockLevel - technique.level}级
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================
// 斗技管理面板
// ============================================

function WeaponTechniquesPanel({
  weapons,
  onEquipmentChange,
}: {
  weapons: Equipment[];
  onEquipmentChange?: (updatedEquipment: Equipment) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    weapons[0]?.id || null
  );
  
  // 当 weapons 更新时，确保 selectedId 仍然有效
  useEffect(() => {
    const isValid = weapons.some(w => w.id === selectedId);
    if (!isValid && weapons.length > 0) {
      setSelectedId(weapons[0].id);
    }
  }, [weapons, selectedId]);
  
  const selectedWeapon = useMemo(() => 
    weapons.find(w => w.id === selectedId) || null,
    [weapons, selectedId]
  );
  
  if (weapons.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-xs text-muted-foreground text-center py-8">
          <Swords className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div>暂无武器</div>
          <div className="text-[10px] mt-1">请先装备武器</div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 pt-2 shrink-0">
        <CardTitle className="text-sm">斗技管理</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 overflow-hidden flex flex-col gap-2">
        {/* 武器选择器 */}
        <Select value={selectedId || ''} onValueChange={setSelectedId}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="选择武器" />
          </SelectTrigger>
          <SelectContent>
            {weapons.map(w => {
              const unlockedCount = getUnlockedTechniques(w).length;
              const equippedCount = getEquippedTechniques(w).length;
              return (
                <SelectItem key={w.id} value={w.id} className="text-xs">
                  <div className="flex items-center gap-2">
                    {w.weaponCategory && getWeaponCategoryIcon(w.weaponCategory)}
                    <span className="truncate">{w.name}</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 ml-auto">
                      {equippedCount}/{unlockedCount}
                    </Badge>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        
        {/* 斗技列表 */}
        {selectedWeapon && (
          <WeaponTechniqueList 
            equipment={selectedWeapon}
            onEquipmentChange={onEquipmentChange}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// 单个武器的斗技列表
// ============================================

function WeaponTechniqueList({
  equipment,
  onEquipmentChange,
}: {
  equipment: Equipment;
  onEquipmentChange?: (updatedEquipment: Equipment) => void;
}) {
  const unlockedTechniques = useMemo(() => getUnlockedTechniques(equipment), [equipment]);
  const equippedTechniques = useMemo(() => getEquippedTechniques(equipment), [equipment]);
  const equippedTechniqueIds = equippedTechniques.map(t => t.id);
  const availableTechniques = unlockedTechniques.filter(t => !equippedTechniqueIds.includes(t.id));
  
  const handleQuickEquip = (techniqueId: string) => {
    const result = quickEquipTechnique(equipment, techniqueId);
    if (result.success && result.updatedEquipment) {
      onEquipmentChange?.(result.updatedEquipment);
    }
  };
  
  const handleUnequip = (slotIndex: number) => {
    const result = unequipTechnique(equipment, slotIndex);
    if (result.success && result.updatedEquipment) {
      onEquipmentChange?.(result.updatedEquipment);
    }
  };
  
  // 触发类型中文映射
  const triggerTypeNames: Record<string, string> = {
    'on_attack': '攻击时',
    'on_hit': '命中时',
    'on_kill': '击杀时',
    'on_crit': '暴击时',
    'passive': '被动',
    'active': '主动',
  };
  
  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-2">
      {/* 武器信息 */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
        {equipment.weaponCategory && (
          <span className="flex items-center gap-1">
            {getWeaponCategoryIcon(equipment.weaponCategory)}
            {WEAPON_CATEGORY_NAMES[equipment.weaponCategory]}
          </span>
        )}
        <span>Lv.{equipment.level}</span>
        <span className="text-orange-500">
          {unlockedTechniques.length}/{equipment.allTechniques.length} 已解锁
        </span>
        {equipment.compatibleElement && (
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-purple-500/10 border-purple-400 text-purple-600">
            {getElementIcon(equipment.compatibleElement)}
            {ELEMENT_NAMES[equipment.compatibleElement]}
          </Badge>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-1">
          {/* 技巧槽位 */}
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground font-medium">
              斗技槽位 ({equippedTechniques.length}/{equipment.techniqueSlots})
            </div>
            {Array.from({ length: equipment.maxTechniqueSlots }).map((_, index) => {
              const isUnlocked = index < equipment.techniqueSlots;
              const equippedTechniqueId = equipment.equippedTechniques[index];
              const technique = equippedTechniqueId 
                ? equipment.allTechniques.find(t => t.id === equippedTechniqueId) 
                : null;
              
              if (!isUnlocked) {
                return (
                  <div key={index} className="flex items-center gap-2 p-2 rounded border border-dashed border-muted-foreground/30 bg-muted/30">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                    <div className="text-[10px] text-muted-foreground">槽位 {index + 1} · 未解锁</div>
                  </div>
                );
              }
              
              if (!technique) {
                return (
                  <div key={index} className="flex items-center gap-2 p-2 rounded border border-dashed border-muted-foreground/30 bg-muted/30">
                    <Plus className="w-3.5 h-3.5 text-muted-foreground/50" />
                    <div className="text-[10px] text-muted-foreground">槽位 {index + 1} · 空</div>
                  </div>
                );
              }
              
              return (
                <div key={index} className="flex items-center justify-between gap-2 p-2 rounded border bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Swords className="w-3.5 h-3.5 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-medium truncate">{technique.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {triggerTypeNames[technique.trigger.type] || technique.trigger.type}
                        {technique.trigger.chance && ` · ${Math.round(technique.trigger.chance * 100)}%`}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 shrink-0"
                    onClick={() => handleUnequip(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>
          
          {/* 可用斗技 */}
          {availableTechniques.length > 0 && (
            <div className="space-y-1 pt-1 border-t">
              <div className="text-[10px] text-muted-foreground font-medium">
                可用斗技 ({availableTechniques.length})
              </div>
              {availableTechniques.map(technique => (
                <button
                  key={technique.id}
                  onClick={() => handleQuickEquip(technique.id)}
                  className="w-full flex items-center gap-2 p-2 rounded border border-border hover:border-primary/50 hover:bg-muted/50 text-left"
                >
                  <Swords className="w-3.5 h-3.5 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium truncate">{technique.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {triggerTypeNames[technique.trigger.type] || technique.trigger.type}
                      {technique.trigger.chance && ` · ${Math.round(technique.trigger.chance * 100)}%`}
                    </div>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
          
          {/* 未解锁斗技 */}
          {equipment.allTechniques.some(t => t.unlockLevel > equipment.level) && (
            <div className="space-y-1 pt-1 border-t">
              <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                未解锁 ({equipment.allTechniques.length - unlockedTechniques.length})
              </div>
              {equipment.allTechniques
                .filter(t => t.unlockLevel > equipment.level)
                .map(technique => (
                  <div key={technique.id} className="flex items-center gap-2 p-2 rounded border border-dashed border-muted-foreground/30 bg-muted/20 opacity-60">
                    <Swords className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-medium truncate text-muted-foreground">{technique.name}</div>
                      <div className="text-[10px] text-orange-500">需 Lv.{technique.unlockLevel}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-orange-500/10 border-orange-400 text-orange-600">
                      {technique.unlockLevel - equipment.level}级
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default SkillsTab;
