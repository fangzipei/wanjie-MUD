/**
 * WebSocket 消息类型定义
 */

import type { Announcement, AnnouncementRequest } from '@/modules/social/announcementTypes';
import type {
  PlayerOnlineState,
  AllLeaderboards,
} from '@/modules/social/multiplayerTypes';

// ========== 连接状态 ==========

/** WebSocket 连接状态 */
export type WSConnectionState = 
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

// ========== 消息类型 ==========

/** WebSocket 消息类型 */
export type WSMessageType =
  // 认证
  | 'auth'
  | 'auth_success'
  | 'welcome'
  // 连接相关
  | 'connect'
  | 'disconnect'
  | 'heartbeat'
  | 'heartbeat_ack'
  | 'ping'
  | 'pong'
  // 状态同步
  | 'player_join'
  | 'player_leave'
  | 'player_update'
  // 排行榜
  | 'leaderboard_sync'
  | 'leaderboard_update'
  // 公告
  | 'announcement_request'
  | 'announcement'
  | 'announcement_history'
  // 删号
  | 'delete_player'
  | 'player_deleted'
  // 错误
  | 'error';

// ========== 基础消息结构 ==========

/** WebSocket 消息 */
export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
  timestamp: number;
}

// ========== 认证相关 ==========

/** 认证请求载荷 */
export interface WSAuthPayload {
  playerId: string;
  playerName: string;
  worldType?: import('@/modules/social/multiplayerTypes').PlayerOnlineState['worldType'];
  level?: number;
  realm?: string;
  combatPower?: number;
  statistics?: import('@/modules/social/multiplayerTypes').PlayerStatistics;
}

/** 认证成功响应载荷 */
export interface WSAuthSuccessPayload {
  playerId: string;
  onlineCount: number;
}

// ========== 连接相关 ==========

/** 连接成功消息 */
export interface WSConnectPayload {
  playerId: string;
  serverTime: number;
  initialState?: PlayerOnlineState;
}

/** 心跳消息 */
export interface WSHeartbeatPayload {
  playerId?: string;
  playerData?: Partial<PlayerOnlineState>;
}

/** 心跳响应 */
export interface WSHeartbeatAckPayload {
  serverTime: number;
}

// ========== 玩家状态同步 ==========

/** 玩家进入消息 */
export interface WSPlayerJoinPayload {
  player: PlayerOnlineState;
  onlineCount: number;
}

/** 玩家离开消息 */
export interface WSPlayerLeavePayload {
  playerId: string;
  playerName: string;
  reason: 'disconnect' | 'timeout' | 'delete';
  onlineCount: number;
}

/** 玩家状态更新消息 */
export interface WSPlayerUpdatePayload {
  playerId: string;
  updates: Partial<PlayerOnlineState>;
}

// ========== 排行榜 ==========

/** 排行榜同步消息 */
export interface WSLeaderboardSyncPayload {
  leaderboards: AllLeaderboards;
  onlinePlayers: PlayerOnlineState[];
  onlineCount: number;
}

/** 排行榜更新消息 */
export interface WSLeaderboardUpdatePayload {
  leaderboards: AllLeaderboards;
  onlineCount: number;
}

// ========== 公告 ==========

/** 公告请求消息 */
export interface WSAnnouncementRequestPayload {
  request: AnnouncementRequest;
}

/** 公告广播消息 */
export interface WSAnnouncementPayload {
  announcement: Announcement;
  onlineCount: number;
}

/** 公告历史请求 */
export interface WSAnnouncementHistoryRequestPayload {
  since?: number;
  limit?: number;
}

/** 公告历史响应 */
export interface WSAnnouncementHistoryPayload {
  announcements: Announcement[];
  hasMore: boolean;
}

// ========== 删号 ==========

/** 删号请求消息 */
export interface WSDeletePlayerPayload {
  playerId: string;
  reason: 'restart' | 'manual';
}

/** 删号确认消息 */
export interface WSPlayerDeletedPayload {
  playerId: string;
  reason: 'restart' | 'manual' | 'inactive';
}

// ========== 错误 ==========

/** WebSocket 错误码 */
export enum WSErrorCode {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  HEARTBEAT_TIMEOUT = 'HEARTBEAT_TIMEOUT',
  PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
  DELETE_FAILED = 'DELETE_FAILED',
  RATE_LIMITED = 'RATE_LIMITED',
  INVALID_REQUEST = 'INVALID_REQUEST',
}

/** 错误消息 */
export interface WSErrorPayload {
  code: WSErrorCode;
  message: string;
  recoverable: boolean;
}

// ========== 配置常量 ==========

/** WebSocket 配置（同时用于 HTTP 轮询模式） */
export const WS_CONFIG = {
  // 心跳配置 - 更频繁以实现准实时
  HEARTBEAT_INTERVAL: 10 * 1000, // 客户端发送心跳间隔
  HEARTBEAT_TIMEOUT: 30 * 1000, // 服务端心跳超时（30秒无心跳视为离线）

  // 重连配置
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 3000,
  RECONNECT_INTERVAL: 3000, // 别名，与 RECONNECT_DELAY 一致

  // 清理配置
  CLEANUP_INTERVAL: 60 * 60 * 1000, // 清理间隔：1小时
  OFFLINE_KEEP_TIME: 7 * 24 * 60 * 60 * 1000, // 离线保留时间：7天（玩家数据在排行榜保留7天）

  // 排行榜配置
  MAX_LEADERBOARD_SIZE: 100,

  // 公告配置
  MAX_ANNOUNCEMENT_HISTORY: 50,
  ANNOUNCEMENT_COOLDOWN: 30 * 1000, // 公告冷却时间
  ANNOUNCEMENT_EXPIRE_TIME: 30 * 60 * 1000, // 公告过期时间
} as const;
