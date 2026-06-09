/**
 * 离线挂机系统（re-export）
 *
 * 主文件位于 modules/time/logic/idleSystem.ts。
 * 此文件保留以确保现有导入不中断，后续将移除。
 *
 * @deprecated 请直接从 '@/modules/time/logic/idleSystem' 导入
 */
export {
  processOfflineTime,
  calculateIdleRewards,
  estimateIdleRewards,
  formatOfflineDuration,
} from '@/modules/time/logic/idleSystem';

export type {
  OfflineProcessResult,
  IdleCalculationParams,
} from '@/modules/time/logic/idleSystem';
