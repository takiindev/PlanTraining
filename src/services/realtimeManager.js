import { subscribeToClassesByMonth, subscribeToUserRelatedClasses } from './classService';
import { subscribeToUsers, subscribeToUserInfo } from './userService';
import { subscribeToAccounts } from './accountService';

/**
 * Global Real-time Data Manager
 * Quản lý tất cả real-time listeners và đồng bộ dữ liệu
 */
class RealtimeDataManager {
  constructor() {
    this.listeners = new Map();
    this.data = new Map();
    this.callbacks = new Map();
  }

  /**
   * Subscribe to classes by month with automatic cleanup
   */
  subscribeClasses(year, month, callback, key = 'classes') {
    this.unsubscribe(key);
    
    const unsubscribe = subscribeToClassesByMonth(year, month, (classes) => {
      this.data.set(key, classes);
      if (callback) callback(classes);
      
      // Trigger all registered callbacks for this key
      const callbacks = this.callbacks.get(key) || [];
      callbacks.forEach(cb => cb(classes));
    });
    
    this.listeners.set(key, unsubscribe);
  }

  /**
   * Subscribe to user related classes
   */
  subscribeUserClasses(userId, callback, key = 'userClasses') {
    this.unsubscribe(key);
    
    const unsubscribe = subscribeToUserRelatedClasses(userId, (classes) => {
      this.data.set(key, classes);
      if (callback) callback(classes);
      
      // Trigger all registered callbacks for this key
      const callbacks = this.callbacks.get(key) || [];
      callbacks.forEach(cb => cb(classes));
    });
    
    this.listeners.set(key, unsubscribe);
  }

  /**
   * Subscribe to users list
   */
  subscribeUsers(callback, key = 'users') {
    this.unsubscribe(key);
    
    const unsubscribe = subscribeToUsers((users) => {
      this.data.set(key, users);
      if (callback) callback(users);
      
      // Trigger all registered callbacks for this key
      const callbacks = this.callbacks.get(key) || [];
      callbacks.forEach(cb => cb(users));
    });
    
    this.listeners.set(key, unsubscribe);
  }

  /**
   * Subscribe to specific user info
   */
  subscribeUserInfo(userId, callback, key = `userInfo-${userId}`) {
    this.unsubscribe(key);
    
    const unsubscribe = subscribeToUserInfo(userId, (userInfo) => {
      this.data.set(key, userInfo);
      if (callback) callback(userInfo);
      
      // Trigger all registered callbacks for this key
      const callbacks = this.callbacks.get(key) || [];
      callbacks.forEach(cb => cb(userInfo));
    });
    
    this.listeners.set(key, unsubscribe);
  }

  /**
   * Subscribe to accounts list
   */
  subscribeAccounts(callback, key = 'accounts') {
    this.unsubscribe(key);
    
    const unsubscribe = subscribeToAccounts((accounts) => {
      this.data.set(key, accounts);
      if (callback) callback(accounts);
      
      // Trigger all registered callbacks for this key
      const callbacks = this.callbacks.get(key) || [];
      callbacks.forEach(cb => cb(accounts));
    });
    
    this.listeners.set(key, unsubscribe);
  }

  /**
   * Add callback for existing subscription
   */
  addCallback(key, callback) {
    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, []);
    }
    this.callbacks.get(key).push(callback);
    
    // If data already exists, call callback immediately
    if (this.data.has(key)) {
      callback(this.data.get(key));
    }
  }

  /**
   * Remove callback
   */
  removeCallback(key, callback) {
    if (this.callbacks.has(key)) {
      const callbacks = this.callbacks.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Get current data for a key
   */
  getData(key) {
    return this.data.get(key);
  }

  /**
   * Unsubscribe from a specific listener
   */
  unsubscribe(key) {
    if (this.listeners.has(key)) {
      const unsubscribe = this.listeners.get(key);
      unsubscribe();
      this.listeners.delete(key);
    }
  }

  /**
   * Unsubscribe from all listeners
   */
  unsubscribeAll() {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
    this.data.clear();
    this.callbacks.clear();
  }

  /**
   * Get status of all active listeners
   */
  getStatus() {
    return {
      activeListeners: Array.from(this.listeners.keys()),
      dataKeys: Array.from(this.data.keys()),
      callbackKeys: Array.from(this.callbacks.keys())
    };
  }
}

// Global instance
export const realtimeManager = new RealtimeDataManager();

// Auto cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realtimeManager.unsubscribeAll();
  });
}

export default realtimeManager;
