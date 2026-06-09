/**
 * 消息数据库服务 - IndexedDB + Supabase 双层存储
 * 
 * 架构说明：
 * - IndexedDB：本地缓存层，存储最近的消息，支持离线查看
 * - Supabase：远程数据库，持久化存储所有消息
 * 
 * 同步策略：
 * - 新消息：先写入 IndexedDB，再同步到 Supabase
 * - 读取：优先从 IndexedDB 读取，不足时从 Supabase 分页获取
 */

import { MessageRecord, MESSAGE_CONFIG } from '@/shared/lib/types';

// IndexedDB 配置
const DB_NAME = 'wanjie_messages_db';
const DB_VERSION = 1;
const STORE_NAME = 'messages';

// IndexedDB 实例
let dbInstance: IDBDatabase | null = null;

/**
 * 初始化 IndexedDB
 */
function initIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('gameId', 'gameId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * 从 IndexedDB 获取消息
 */
async function getMessagesFromIndexedDB(
  gameId: string,
  limit: number,
  beforeTimestamp?: number
): Promise<MessageRecord[]> {
  const db = await initIndexedDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const gameIndex = store.index('gameId');
    
    const messages: MessageRecord[] = [];
    
    const request = gameIndex.openCursor(IDBKeyRange.only(gameId), 'prev');
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      
      if (cursor && messages.length < limit) {
        const msg = cursor.value as MessageRecord;
        // 如果指定了时间戳，只获取更早的消息
        if (!beforeTimestamp || msg.timestamp < beforeTimestamp) {
          messages.push(msg);
        }
        cursor.continue();
      } else {
        resolve(messages);
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

/**
 * 获取 IndexedDB 中消息总数
 */
async function getMessageCountFromIndexedDB(gameId: string): Promise<number> {
  const db = await initIndexedDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const gameIndex = store.index('gameId');
    
    const request = gameIndex.count(IDBKeyRange.only(gameId));
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 添加消息到 IndexedDB
 */
async function addMessageToIndexedDB(message: MessageRecord): Promise<void> {
  const db = await initIndexedDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.put(message);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * 批量添加消息到 IndexedDB
 */
async function addMessagesToIndexedDB(messages: MessageRecord[]): Promise<void> {
  const db = await initIndexedDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    let completed = 0;
    const total = messages.length;
    
    if (total === 0) {
      resolve();
      return;
    }
    
    messages.forEach((msg) => {
      const request = store.put(msg);
      request.onsuccess = () => {
        completed++;
        if (completed === total) {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  });
}

/**
 * 清空 IndexedDB 中的消息
 */
async function clearMessagesFromIndexedDB(gameId: string): Promise<void> {
  const db = await initIndexedDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const gameIndex = store.index('gameId');
    
    const request = gameIndex.openCursor(IDBKeyRange.only(gameId));
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

/**
 * 清理 IndexedDB 中超出限制的旧消息
 */
async function pruneOldMessages(gameId: string, keepCount: number): Promise<void> {
  const db = await initIndexedDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const gameIndex = store.index('gameId');
    
    let count = 0;
    const toDelete: string[] = [];
    
    const request = gameIndex.openCursor(IDBKeyRange.only(gameId), 'prev');
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      
      if (cursor) {
        count++;
        if (count > keepCount) {
          toDelete.push((cursor.value as MessageRecord).id);
        }
        cursor.continue();
      } else {
        // 删除超出限制的消息
        if (toDelete.length > 0) {
          const deletePromises = toDelete.map(id => {
            return new Promise<void>((res, rej) => {
              const deleteRequest = store.delete(id);
              deleteRequest.onsuccess = () => res();
              deleteRequest.onerror = () => rej(deleteRequest.error);
            });
          });
          Promise.all(deletePromises).then(() => resolve()).catch(reject);
        } else {
          resolve();
        }
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

// ========== 远程存储（静态模式下禁用） ==========

// 注意：静态导出模式下无服务端 API，远程存储功能已禁用
// 所有消息仅存储在本地 IndexedDB 中

async function getMessagesFromRemote(
  _gameId: string,
  _page: number,
  _pageSize: number
): Promise<{ messages: MessageRecord[]; total: number; hasMore: boolean }> {
  return { messages: [], total: 0, hasMore: false };
}

async function clearMessagesFromRemote(_gameId: string): Promise<boolean> {
  return true;
}

// ========== 公开接口 ==========

export interface MessagePagination {
  messages: MessageRecord[];
  total: number;
  hasMore: boolean;
  page: number;
  pageSize: number;
}

/**
 * 添加新消息
 * 1. 先写入 IndexedDB
 * 2. 异步同步到远程数据库
 * 3. 清理超出限制的旧消息
 */
export async function addMessage(
  gameId: string,
  message: MessageRecord
): Promise<void> {
  // 1. 写入 IndexedDB
  await addMessageToIndexedDB(message);

  // 2. 清理超出限制的旧消息（IndexedDB 保留最多 500 条）
  const indexedDBLimit = 500;
  await pruneOldMessages(gameId, indexedDBLimit);
}

/**
 * 获取最新消息
 * 优先从 IndexedDB 获取，不足时从远程获取
 */
export async function getLatestMessages(
  gameId: string,
  limit: number = MESSAGE_CONFIG.memoryLimit
): Promise<MessageRecord[]> {
  // 从 IndexedDB 获取
  const localMessages = await getMessagesFromIndexedDB(gameId, limit);
  return localMessages.slice(0, limit);
}

/**
 * 分页获取历史消息
 * 用于滚动加载更多历史消息
 */
export async function getMessagesPage(
  gameId: string,
  page: number,
  pageSize: number
): Promise<MessagePagination> {
  // 先尝试从 IndexedDB 获取
  const localMessages = await getMessagesFromIndexedDB(gameId, pageSize * page);
  
  if (localMessages.length >= pageSize * page) {
    // 本地数据充足
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const messages = localMessages.slice(start, end);
    
    return {
      messages,
      total: localMessages.length,
      hasMore: end < localMessages.length,
      page,
      pageSize,
    };
  }
  
  // 从远程获取
  const remote = await getMessagesFromRemote(gameId, page, pageSize);
  
  // 缓存到本地
  if (remote.messages.length > 0) {
    await addMessagesToIndexedDB(remote.messages);
  }
  
  return {
    ...remote,
    page,
    pageSize,
  };
}

/**
 * 获取比指定时间戳更早的消息（用于无限滚动加载）
 */
export async function getMessagesBefore(
  gameId: string,
  beforeTimestamp: number,
  limit: number
): Promise<MessageRecord[]> {
  // 先从 IndexedDB 获取
  const localMessages = await getMessagesFromIndexedDB(gameId, limit, beforeTimestamp);
  
  if (localMessages.length >= limit) {
    return localMessages;
  }
  
  // 计算需要从远程获取的页数
  // 这里简化处理，直接从远程获取一页
  // TODO: 可以优化为更精确的查询
  const remote = await getMessagesFromRemote(gameId, 1, limit * 2);
  
  // 过滤出比 beforeTimestamp 更早的消息
  const olderMessages = remote.messages.filter(m => m.timestamp < beforeTimestamp);
  
  // 缓存到本地
  if (olderMessages.length > 0) {
    await addMessagesToIndexedDB(olderMessages);
  }
  
  return olderMessages.slice(0, limit);
}

/**
 * 获取消息总数
 */
export async function getMessageCount(gameId: string): Promise<number> {
  // 先从 IndexedDB 获取
  const localCount = await getMessageCountFromIndexedDB(gameId);
  
  // 如果本地有数据，返回本地计数
  if (localCount > 0) {
    return localCount;
  }
  
  // 否则从远程获取
  const remote = await getMessagesFromRemote(gameId, 1, 1);
  return remote.total;
}

/**
 * 清空所有消息
 */
export async function clearAllMessages(gameId: string): Promise<void> {
  await Promise.all([
    clearMessagesFromIndexedDB(gameId),
    clearMessagesFromRemote(gameId),
  ]);
}

/**
 * 同步远程消息到本地
 * 用于游戏加载时同步数据
 */
export async function syncMessagesFromRemote(
  gameId: string,
  limit: number = 100
): Promise<MessageRecord[]> {
  const remote = await getMessagesFromRemote(gameId, 1, limit);
  
  if (remote.messages.length > 0) {
    await addMessagesToIndexedDB(remote.messages);
  }
  
  return remote.messages;
}
