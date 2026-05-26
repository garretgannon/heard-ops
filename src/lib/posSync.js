/**
 * Mock POS Integration Service
 * Simulates a connection to a Point of Sale system (e.g. Toast)
 */

class POSSyncService {
  constructor() {
    this.storageKey = 'heardos_pos_connected';
  }

  // --- Connection Management ---
  isConnected() {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(this.storageKey) === 'true';
  }

  async connect(provider = 'toast') {
    return new Promise(resolve => {
      setTimeout(() => {
        localStorage.setItem(this.storageKey, 'true');
        resolve({ success: true, provider });
      }, 1500); // Simulate network latency
    });
  }

  async disconnect() {
    return new Promise(resolve => {
      setTimeout(() => {
        localStorage.removeItem(this.storageKey);
        resolve({ success: true });
      }, 500);
    });
  }

  // --- 86 Syncing ---
  async sync86ToPOS(itemName, reason = '') {
    if (!this.isConnected()) return { success: false, reason: 'Not connected to POS' };
    
    console.log(`[POS SYNC] 86'd item pushed to POS: ${itemName}`);
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: true, timestamp: new Date().toISOString() });
      }, 800);
    });
  }

  // --- Dynamic Prep Planning (Sales Velocity) ---
  async getSalesVelocity(itemCategory = 'default') {
    if (!this.isConnected()) return null;

    // Simulate different sales velocities based on category to make the UI look dynamic
    return new Promise(resolve => {
      setTimeout(() => {
        const velocities = {
          'burger_patties': { ratePerHour: 45, trend: 'up', status: 'selling_fast' },
          'fries': { ratePerHour: 120, trend: 'up', status: 'selling_fast' },
          'salad_mix': { ratePerHour: 5, trend: 'down', status: 'slow' },
          'default': { ratePerHour: Math.floor(Math.random() * 20) + 10, trend: 'stable', status: 'normal' }
        };
        
        // Randomize slightly so it feels alive
        const base = velocities[itemCategory] || velocities['default'];
        resolve({
          ...base,
          ratePerHour: base.ratePerHour + Math.floor(Math.random() * 5)
        });
      }, 400);
    });
  }

  // --- Labor Sync ---
  async getLiveClockIns() {
    if (!this.isConnected()) return [];

    return new Promise(resolve => {
      setTimeout(() => {
        // Return a mock list of employee IDs who are currently clocked in at the POS
        resolve([
          'usr_1', // Alex (GM)
          'usr_3', // Sam (Lead Line)
          // Intentionally omitting someone to show the discrepancy feature
        ]);
      }, 600);
    });
  }
}

export const posSync = new POSSyncService();
