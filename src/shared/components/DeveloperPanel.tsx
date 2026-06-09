'use client';

import { useState } from 'react';

import { Bug, Settings, Sparkles, Swords, Shield, Heart, Zap, Globe, ShieldCheck } from 'lucide-react';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { ScrollArea } from '@/shared/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Separator } from '@/shared/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet';
import { Switch } from '@/shared/ui/switch';
import { ControlledTabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { EQUIPMENT_NAMES } from '@/modules/equipment/data/equipment';
import { TECHNIQUE_NAMES, RARITY_POWER_RANGE, RARITY_BONUS_RANGE } from '@/modules/techniques/data/techniques';
import { Protagonist, CultivationPath, WorldType, ItemRarity, TechniqueType, EquipmentSlot } from '@/shared/lib/types';

interface DeveloperPanelProps {
  protagonist: Protagonist;
  devInvincible?: boolean; // 开发者无敌模式状态
  onToggleDevInvincible?: () => void; // 切换开发者无敌模式
  onUpdateLevel: (level: number) => void;
  onUpdateExperience: (exp: number) => void;
  onUpdateHp: (hp: number, maxHp?: number) => void;
  onUpdateMp: (mp: number, maxMp?: number) => void;
  onUpdateStat: (stat: string, value: number) => void;
  onUpdateMentalState: (stability: number, demonChance?: number) => void;
  onUpdatePathLevel: (level: number) => void;
  onAddItem: (itemId: string, quantity: number) => void;
  onAddSpiritStones: (amount: number) => void;
  onAddTechnique: (techniqueId: string) => void;
  onAddEquipment: (equipmentId: string) => void;
  /** 按配置添加功法（类型+稀有度） */
  onAddTechniqueByConfig?: (type: TechniqueType, rarity: ItemRarity) => void;
  /** 按配置添加装备（槽位+稀有度） */
  onAddEquipmentByConfig?: (slot: EquipmentSlot, rarity: ItemRarity) => void;
  onSetCultivationPath: (pathId: string) => void;
  onTriggerBreakthrough: () => void;
  onTriggerTribulation: () => void;
  onTriggerDemon: () => void;
  onResetCooldowns: () => void;
  onSetWorldType: (worldType: string) => void;
  onFullRestore: () => void;
  onAddAllItems: () => void;
  onMaxStats: () => void;
}

const MAX_LEVEL = 100;

const STAT_OPTIONS = [
  { value: '体质', label: '体质' },
  { value: '灵根', label: '灵根' },
  { value: '悟性', label: '悟性' },
  { value: '幸运', label: '幸运' },
  { value: '意志', label: '意志' },
];

const PATH_OPTIONS = [
  { value: 'none', label: '无流派' },
  { value: 'body', label: '体修' },
  { value: 'sword', label: '剑修' },
  { value: 'spell', label: '法修' },
  { value: 'alchemy', label: '丹修' },
  { value: 'demon', label: '魔修' },
];

const WORLD_TYPE_OPTIONS: { value: WorldType; label: string }[] = [
  { value: '修仙', label: '修仙' },
  { value: '高武', label: '高武' },
  { value: '科技', label: '科技' },
  { value: '魔幻', label: '魔幻' },
  { value: '异能', label: '异能' },
  { value: '仙侠', label: '仙侠' },
  { value: '武侠', label: '武侠' },
  { value: '末世', label: '末世' },
];

const RARITY_OPTIONS: { value: ItemRarity; label: string; color: string }[] = [
  { value: '普通', label: '普通', color: 'text-gray-500' },
  { value: '稀有', label: '稀有', color: 'text-blue-500' },
  { value: '史诗', label: '史诗', color: 'text-purple-500' },
  { value: '传说', label: '传说', color: 'text-yellow-500' },
];

const TECHNIQUE_TYPE_OPTIONS: { value: TechniqueType; label: string }[] = [
  { value: 'attack', label: '攻击型' },
  { value: 'defense', label: '防御型' },
];

const EQUIPMENT_SLOT_OPTIONS: { value: EquipmentSlot; label: string }[] = [
  { value: 'melee', label: '近战武器' },
  { value: 'ranged', label: '远程武器' },
  { value: 'head', label: '头部' },
  { value: 'body', label: '身体' },
  { value: 'legs', label: '腿部' },
  { value: 'feet', label: '脚部' },
];

const COMMON_ITEMS = [
  { id: 'spirit_stone', name: '灵石' },
  { id: 'pill_breakthrough_low', name: '筑基丹' },
  { id: 'pill_breakthrough_mid', name: '结金丹' },
  { id: 'pill_cultivation_low', name: '聚气丹' },
  { id: 'pill_hp_restore', name: '回血丹' },
  { id: 'pill_mp_restore', name: '回气丹' },
];

export function DeveloperPanel({
  protagonist,
  devInvincible = false,
  onToggleDevInvincible,
  onUpdateLevel,
  onUpdateExperience,
  onUpdateHp,
  onUpdateMp,
  onUpdateStat,
  onUpdateMentalState,
  onUpdatePathLevel,
  onAddItem,
  onAddSpiritStones,
  onAddTechnique,
  onAddEquipment,
  onAddTechniqueByConfig,
  onAddEquipmentByConfig,
  onSetCultivationPath,
  onTriggerBreakthrough,
  onTriggerTribulation,
  onTriggerDemon,
  onResetCooldowns,
  onSetWorldType,
  onFullRestore,
  onAddAllItems,
  onMaxStats,
}: DeveloperPanelProps) {
  const [open, setOpen] = useState(false);
  
  // 输入状态
  const [levelInput, setLevelInput] = useState(protagonist.level.toString());
  const [expInput, setExpInput] = useState('0');
  const [hpInput, setHpInput] = useState(protagonist.currentHp.toString());
  const [maxHpInput, setMaxHpInput] = useState(protagonist.maxHp.toString());
  const [mpInput, setMpInput] = useState(protagonist.currentMp.toString());
  const [maxMpInput, setMaxMpInput] = useState(protagonist.maxMp.toString());
  const [spiritStonesInput, setSpiritStonesInput] = useState('1000');
  const [itemId, setItemId] = useState('spirit_stone');
  const [itemQuantity, setItemQuantity] = useState('10');
  const [statKey, setStatKey] = useState('体质');
  const [statValue, setStatValue] = useState('100');
  const [stabilityInput, setStabilityInput] = useState(
    protagonist.mentalState?.stability?.toString() || '70'
  );
  const [demonChanceInput, setDemonChanceInput] = useState(
    protagonist.mentalState?.demonChance?.toString() || '0'
  );
  const [pathLevelInput, setPathLevelInput] = useState('1');
  const [selectedPath, setSelectedPath] = useState(protagonist.cultivationPath || 'none');
  const [selectedWorldType, setSelectedWorldType] = useState<WorldType>(protagonist.world.type);
  
  // 功法选择状态
  const [techniqueType, setTechniqueType] = useState<TechniqueType>('attack');
  const [techniqueRarity, setTechniqueRarity] = useState<ItemRarity>('史诗');
  
  // 装备选择状态
  const [equipmentSlot, setEquipmentSlot] = useState<EquipmentSlot>('melee');
  const [equipmentRarity, setEquipmentRarity] = useState<ItemRarity>('史诗');

  // 生成功法 - 使用正确的生成函数
  const generateTechnique = () => {
    // 优先使用新的按配置添加回调
    if (onAddTechniqueByConfig) {
      onAddTechniqueByConfig(techniqueType, techniqueRarity);
    } else {
      // 兼容旧版本：使用默认参数
      console.warn('DeveloperPanel: onAddTechniqueByConfig not provided, using fallback');
      onAddTechnique(`dev_${techniqueType}_${techniqueRarity}_${Date.now()}`);
    }
  };

  // 生成装备 - 使用正确的生成函数
  const generateEquipment = () => {
    // 优先使用新的按配置添加回调
    if (onAddEquipmentByConfig) {
      onAddEquipmentByConfig(equipmentSlot, equipmentRarity);
    } else {
      // 兼容旧版本：使用默认参数
      console.warn('DeveloperPanel: onAddEquipmentByConfig not provided, using fallback');
      onAddEquipment(`dev_${equipmentSlot}_${equipmentRarity}_${Date.now()}`);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full border-2 border-yellow-500/50 bg-yellow-50/80 dark:bg-yellow-950/50 hover:bg-yellow-100 dark:hover:bg-yellow-900 shadow-lg z-50"
        >
          <Bug className="h-5 w-5 text-yellow-600" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:max-w-[400px] p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 border-b">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Settings className="w-4 h-4 text-yellow-600" />
            <span>开发者面板</span>
            <Badge variant="outline" className="text-[10px] border-yellow-500 text-yellow-600">
              DEBUG
            </Badge>
          </SheetTitle>
          <SheetDescription className="text-xs">
            调试工具，仅供开发测试使用
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-1 px-4 py-2">
          <ControlledTabs defaultTab="level" className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-8 text-xs sticky top-0 bg-background z-10">
              <TabsTrigger value="level" className="text-[10px]">等级</TabsTrigger>
              <TabsTrigger value="items" className="text-[10px]">物品</TabsTrigger>
              <TabsTrigger value="technique" className="text-[10px]">功法</TabsTrigger>
              <TabsTrigger value="equipment" className="text-[10px]">装备</TabsTrigger>
              <TabsTrigger value="events" className="text-[10px]">事件</TabsTrigger>
            </TabsList>
            
            {/* 等级与属性 */}
            <TabsContent value="level" className="mt-3 space-y-3">
              <div className="space-y-2">
                {/* 等级设置 */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    设置等级 (1-{MAX_LEVEL})
                  </Label>
                  <div className="flex gap-1">
                    <Input 
                      type="number" 
                      value={levelInput} 
                      onChange={(e) => setLevelInput(e.target.value)}
                      className="h-8 text-xs flex-1"
                      min={1}
                      max={MAX_LEVEL}
                    />
                    <Button 
                      size="sm" 
                      className="h-8 text-xs px-3"
                      onClick={() => onUpdateLevel(parseInt(levelInput) || 1)}
                    >
                      设置
                    </Button>
                  </div>
                </div>
                
                {/* 经验设置 */}
                <div className="space-y-1">
                  <Label className="text-xs">添加经验</Label>
                  <div className="flex gap-1">
                    <Input 
                      type="number" 
                      value={expInput} 
                      onChange={(e) => setExpInput(e.target.value)}
                      className="h-8 text-xs flex-1"
                      min={0}
                    />
                    <Button 
                      size="sm" 
                      className="h-8 text-xs px-3"
                      onClick={() => onUpdateExperience(parseInt(expInput) || 0)}
                    >
                      添加
                    </Button>
                  </div>
                </div>
                
                {/* HP设置 */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Heart className="w-3 h-3 text-red-500" />
                    HP / 最大HP
                  </Label>
                  <div className="flex gap-1">
                    <Input 
                      type="number" 
                      value={hpInput} 
                      onChange={(e) => setHpInput(e.target.value)}
                      className="h-8 text-xs"
                      min={0}
                    />
                    <Input 
                      type="number" 
                      value={maxHpInput} 
                      onChange={(e) => setMaxHpInput(e.target.value)}
                      className="h-8 text-xs"
                      min={1}
                    />
                    <Button 
                      size="sm" 
                      className="h-8 text-xs px-3"
                      onClick={() => onUpdateHp(parseInt(hpInput) || 0, parseInt(maxHpInput) || undefined)}
                    >
                      设置
                    </Button>
                  </div>
                </div>
                
                {/* MP设置 */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Zap className="w-3 h-3 text-blue-500" />
                    MP / 最大MP
                  </Label>
                  <div className="flex gap-1">
                    <Input 
                      type="number" 
                      value={mpInput} 
                      onChange={(e) => setMpInput(e.target.value)}
                      className="h-8 text-xs"
                      min={0}
                    />
                    <Input 
                      type="number" 
                      value={maxMpInput} 
                      onChange={(e) => setMaxMpInput(e.target.value)}
                      className="h-8 text-xs"
                      min={1}
                    />
                    <Button 
                      size="sm" 
                      className="h-8 text-xs px-3"
                      onClick={() => onUpdateMp(parseInt(mpInput) || 0, parseInt(maxMpInput) || undefined)}
                    >
                      设置
                    </Button>
                  </div>
                </div>
                
                {/* 属性设置 */}
                <div className="space-y-1">
                  <Label className="text-xs">属性设置</Label>
                  <div className="flex gap-1">
                    <Select value={statKey} onValueChange={setStatKey}>
                      <SelectTrigger className="h-8 text-xs w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAT_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input 
                      type="number" 
                      value={statValue} 
                      onChange={(e) => setStatValue(e.target.value)}
                      className="h-8 text-xs w-16"
                      min={1}
                    />
                    <Button 
                      size="sm" 
                      className="h-8 text-xs px-3"
                      onClick={() => onUpdateStat(statKey, parseInt(statValue) || 1)}
                    >
                      设置
                    </Button>
                  </div>
                </div>
                
                <Separator className="my-2" />
                
                {/* 快捷按钮 */}
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={onFullRestore}
                  >
                    <Heart className="w-3 h-3 mr-1" />
                    完全恢复
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={onMaxStats}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    属性最大化
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => onUpdateLevel(100)}
                  >
                    满级
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={onAddAllItems}
                  >
                    全物品x99
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* 物品 */}
            <TabsContent value="items" className="mt-3 space-y-3">
              {/* 添加灵石 */}
              <div className="space-y-1">
                <Label className="text-xs">添加灵石</Label>
                <div className="flex gap-1">
                  <Input 
                    type="number" 
                    value={spiritStonesInput} 
                    onChange={(e) => setSpiritStonesInput(e.target.value)}
                    className="h-8 text-xs flex-1"
                    min={1}
                  />
                  <Button 
                    size="sm" 
                    className="h-8 text-xs px-3"
                    onClick={() => onAddSpiritStones(parseInt(spiritStonesInput) || 1000)}
                  >
                    添加
                  </Button>
                </div>
              </div>
              
              {/* 添加物品 */}
              <div className="space-y-1">
                <Label className="text-xs">添加物品</Label>
                <div className="flex gap-1">
                  <Select value={itemId} onValueChange={setItemId}>
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_ITEMS.map(item => (
                        <SelectItem key={item.id} value={item.id} className="text-xs">
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input 
                    type="number" 
                    value={itemQuantity} 
                    onChange={(e) => setItemQuantity(e.target.value)}
                    className="h-8 text-xs w-14"
                    min={1}
                  />
                  <Button 
                    size="sm" 
                    className="h-8 text-xs px-3"
                    onClick={() => onAddItem(itemId, parseInt(itemQuantity) || 1)}
                  >
                    添加
                  </Button>
                </div>
              </div>
              
              <Separator className="my-2" />
              
              {/* 快捷添加 */}
              <div className="space-y-2">
                <Label className="text-xs">快捷添加</Label>
                <div className="grid grid-cols-3 gap-1">
                  {[100, 1000, 10000].map(amount => (
                    <Button 
                      key={amount}
                      size="sm" 
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => onAddSpiritStones(amount)}
                    >
                      灵石+{amount}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            {/* 功法 */}
            <TabsContent value="technique" className="mt-3 space-y-3">
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Swords className="w-3 h-3" />
                  生成功法
                </Label>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">功法类型</Label>
                    <Select value={techniqueType} onValueChange={(v) => setTechniqueType(v as TechniqueType)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TECHNIQUE_TYPE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">稀有度</Label>
                    <Select value={techniqueRarity} onValueChange={(v) => setTechniqueRarity(v as ItemRarity)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RARITY_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            <span className={opt.color}>{opt.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  className="w-full h-9 text-xs"
                  onClick={generateTechnique}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  随机生成并添加功法
                </Button>
                
                <Separator className="my-2" />
                
                {/* 快捷生成 */}
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">快捷生成传说功法</Label>
                  <div className="grid grid-cols-2 gap-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        setTechniqueType('attack');
                        setTechniqueRarity('传说');
                        setTimeout(() => generateTechnique(), 0);
                      }}
                    >
                      <Swords className="w-3 h-3 mr-1" />
                      传说攻击功法
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        setTechniqueType('defense');
                        setTechniqueRarity('传说');
                        setTimeout(() => generateTechnique(), 0);
                      }}
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      传说防御功法
                    </Button>
                  </div>
                </div>
                
                {/* 当前功法数量 */}
                <div className="text-[10px] text-muted-foreground mt-2">
                  当前功法数量: {protagonist.techniques.length}
                </div>
              </div>
            </TabsContent>
            
            {/* 装备 */}
            <TabsContent value="equipment" className="mt-3 space-y-3">
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  生成装备
                </Label>
                
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">装备槽位</Label>
                  <Select value={equipmentSlot} onValueChange={(v) => setEquipmentSlot(v as EquipmentSlot)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_SLOT_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">稀有度</Label>
                  <Select value={equipmentRarity} onValueChange={(v) => setEquipmentRarity(v as ItemRarity)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RARITY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          <span className={opt.color}>{opt.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  className="w-full h-9 text-xs"
                  onClick={generateEquipment}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  随机生成并添加装备
                </Button>
                
                <Separator className="my-2" />
                
                {/* 快捷生成全套 */}
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">快捷生成全套传说装备</Label>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-7 text-xs w-full"
                    onClick={() => {
                      setEquipmentRarity('传说');
                      const slots: EquipmentSlot[] = ['melee', 'ranged', 'head', 'body', 'legs', 'feet'];
                      slots.forEach(slot => {
                        setEquipmentSlot(slot);
                        setTimeout(() => generateEquipment(), 0);
                      });
                    }}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    生成全套传说装备
                  </Button>
                </div>
                
                {/* 当前装备数量 */}
                <div className="text-[10px] text-muted-foreground mt-2">
                  当前装备数量: {protagonist.equipments.length}
                </div>
              </div>
            </TabsContent>
            
            {/* 事件 */}
            <TabsContent value="events" className="mt-3 space-y-3">
              <div className="space-y-2">
                {/* 流派设置 */}
                <div className="space-y-1">
                  <Label className="text-xs">设置流派</Label>
                  <Select value={selectedPath} onValueChange={(v) => {
                    setSelectedPath(v);
                    onSetCultivationPath(v === 'none' ? '' : v);
                  }}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="选择流派" />
                    </SelectTrigger>
                    <SelectContent>
                      {PATH_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* 流派等级 */}
                <div className="space-y-1">
                  <Label className="text-xs">流派等级</Label>
                  <div className="flex gap-1">
                    <Input 
                      type="number" 
                      value={pathLevelInput} 
                      onChange={(e) => setPathLevelInput(e.target.value)}
                      className="h-8 text-xs flex-1"
                      min={1}
                      max={10}
                    />
                    <Button 
                      size="sm" 
                      className="h-8 text-xs px-3"
                      onClick={() => onUpdatePathLevel(parseInt(pathLevelInput) || 1)}
                    >
                      设置
                    </Button>
                  </div>
                </div>
                
                {/* 世界观类型 */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    世界观类型
                  </Label>
                  <Select 
                    value={selectedWorldType} 
                    onValueChange={(v) => {
                      setSelectedWorldType(v as WorldType);
                      onSetWorldType(v);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORLD_TYPE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator className="my-2" />
                
                {/* 触发事件 */}
                <div className="space-y-1">
                  <Label className="text-xs">触发事件</Label>
                  <div className="grid grid-cols-2 gap-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={onTriggerBreakthrough}
                    >
                      触发突破
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={onTriggerTribulation}
                    >
                      触发渡劫
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={onTriggerDemon}
                    >
                      触发心魔
                    </Button>
                  </div>
                </div>
                
                <Separator className="my-2" />
                
                {/* 一键重置冷却 */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    冷却时间管理
                  </Label>
                  <Button 
                    className="w-full h-9 text-xs bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                    onClick={onResetCooldowns}
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    一键重置所有冷却
                  </Button>
                  <p className="text-[10px] text-muted-foreground">
                    重置: 势力任务、飞升挑战、探索CD、炼丹炼器进度
                  </p>
                </div>
                
                <Separator className="my-2" />
                
                {/* 心境设置 */}
                <div className="space-y-1">
                  <Label className="text-xs">心境设置</Label>
                  <div className="flex gap-1">
                    <Input 
                      type="number" 
                      value={stabilityInput} 
                      onChange={(e) => setStabilityInput(e.target.value)}
                      className="h-8 text-xs flex-1"
                      min={0}
                      max={100}
                      placeholder="稳定度"
                    />
                    <Input 
                      type="number" 
                      value={demonChanceInput} 
                      onChange={(e) => setDemonChanceInput(e.target.value)}
                      className="h-8 text-xs flex-1"
                      min={0}
                      max={100}
                      placeholder="心魔概率"
                    />
                  </div>
                  <Button 
                    size="sm" 
                    className="h-8 text-xs w-full"
                    onClick={() => onUpdateMentalState(parseInt(stabilityInput) || 70, parseInt(demonChanceInput) || 0)}
                  >
                    设置心境
                  </Button>
                </div>
                
                <Separator className="my-2" />
                
                {/* 战斗无敌模式 */}
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-green-500" />
                    战斗无敌模式
                  </Label>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-xs text-muted-foreground">
                      启用后飞升战斗中敌人伤害固定为1
                    </span>
                    <Switch
                      checked={devInvincible}
                      onCheckedChange={onToggleDevInvincible}
                    />
                  </div>
                  {devInvincible && (
                    <div className="text-[10px] text-green-600 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      无敌模式已启用
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </ControlledTabs>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
