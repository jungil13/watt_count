// localStorage-based data service
// Replaces all backend API calls

// Storage keys
const STORAGE_KEYS = {
  USERS: 'wattcount_users',
  SHARED_CODES: 'wattcount_shared_codes',
  CONSUMPTION: 'wattcount_consumption',
  BILLS: 'wattcount_bills',
  PAYMENTS: 'wattcount_payments',
  RATES: 'wattcount_rates',
  CURRENT_USER: 'wattcount_current_user',
};

// Helper functions
const getStorage = (key, defaultValue = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return defaultValue;
  }
};

const setStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing ${key}:`, error);
    return false;
  }
};

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const generateSharedCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code.toUpperCase(); // Always return uppercase
};

// User Service
export const userService = {
  getAll: () => getStorage(STORAGE_KEYS.USERS),
  
  getById: (id) => {
    const users = getStorage(STORAGE_KEYS.USERS);
    return users.find(u => u.id === id) || null;
  },
  
  findByUsername: (username) => {
    const users = getStorage(STORAGE_KEYS.USERS);
    return users.find(u => u.username === username) || null;
  },
  
  findByPhoneNumber: (phoneNumber) => {
    const users = getStorage(STORAGE_KEYS.USERS);
    return users.find(u => u.phone_number === phoneNumber) || null;
  },
  
  create: (userData) => {
    const users = getStorage(STORAGE_KEYS.USERS);
    const newUser = {
      id: generateId(),
      ...userData,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    users.push(newUser);
    setStorage(STORAGE_KEYS.USERS, users);
    return newUser;
  },
  
  update: (id, updates) => {
    const users = getStorage(STORAGE_KEYS.USERS);
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    users[index] = {
      ...users[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    setStorage(STORAGE_KEYS.USERS, users);
    return users[index];
  },
  
  getAllSharedUsers: (mainUserId) => {
    const users = getStorage(STORAGE_KEYS.USERS);
    const sharedCodes = getStorage(STORAGE_KEYS.SHARED_CODES);
    const mainUserCodes = sharedCodes
      .filter(sc => sc.main_user_id === mainUserId)
      .map(sc => sc.code.toUpperCase());
    
    return users.filter(u => 
      u.role === 'shared_user' && 
      u.shared_code && 
      mainUserCodes.includes(u.shared_code.toUpperCase())
    );
  },
};

// Shared Code Service
export const sharedCodeService = {
  getAll: (mainUserId) => {
    const codes = getStorage(STORAGE_KEYS.SHARED_CODES);
    return mainUserId 
      ? codes.filter(c => c.main_user_id === mainUserId)
      : codes;
  },
  
  findByCode: (code) => {
    if (!code) return null;
    const codes = getStorage(STORAGE_KEYS.SHARED_CODES);
    // Remove any non-alphanumeric characters and normalize
    const normalizedInput = String(code).toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
    
    if (normalizedInput.length !== 8) {
      return null; // Code must be exactly 8 characters
    }
    
    const now = new Date();
    
    const found = codes.find(c => {
      if (!c.code) return false;
      // Normalize stored code
      const normalizedCode = String(c.code).toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
      const isMatch = normalizedCode === normalizedInput;
      const isNotUsed = !c.is_used;
      const isValidDate = !c.expires_at || new Date(c.expires_at) > now;
      
      return isMatch && isNotUsed && isValidDate;
    });
    
    return found || null;
  },
  
  create: (mainUserId, expiresAt = null) => {
    const codes = getStorage(STORAGE_KEYS.SHARED_CODES);
    let code;
    let attempts = 0;
    const maxAttempts = 10;
    
    // Ensure unique code
    do {
      code = generateSharedCode();
      attempts++;
      if (attempts > maxAttempts) {
        throw new Error('Failed to generate unique code. Please try again.');
      }
    } while (codes.some(c => c.code.toUpperCase() === code.toUpperCase()));
    
    const newCode = {
      id: generateId(),
      code: code.toUpperCase(), // Store as uppercase
      main_user_id: mainUserId,
      expires_at: expiresAt,
      is_used: false,
      used_by_user_id: null,
      created_at: new Date().toISOString(),
    };
    codes.push(newCode);
    setStorage(STORAGE_KEYS.SHARED_CODES, codes);
    return newCode;
  },
  
  markAsUsed: (code, userId) => {
    const codes = getStorage(STORAGE_KEYS.SHARED_CODES);
    const normalizedCode = String(code).toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
    const index = codes.findIndex(c => {
      const storedNormalized = String(c.code || '').toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
      return storedNormalized === normalizedCode;
    });
    if (index === -1) {
      console.error('Code not found to mark as used:', normalizedCode);
      return false;
    }
    
    codes[index].is_used = true;
    codes[index].used_by_user_id = userId;
    setStorage(STORAGE_KEYS.SHARED_CODES, codes);
    return true;
  },
  
  delete: (code) => {
    const codes = getStorage(STORAGE_KEYS.SHARED_CODES);
    const normalizedCode = String(code).toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
    const filtered = codes.filter(c => {
      const storedNormalized = String(c.code || '').toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
      return storedNormalized !== normalizedCode;
    });
    setStorage(STORAGE_KEYS.SHARED_CODES, filtered);
    return true;
  },
};

// Consumption Service
export const consumptionService = {
  getAll: (mainUserId = null) => {
    const records = getStorage(STORAGE_KEYS.CONSUMPTION);
    if (!mainUserId) return records;
    
    const users = userService.getAll();
    const sharedCodes = getStorage(STORAGE_KEYS.SHARED_CODES);
    const mainUserCodes = sharedCodes
      .filter(sc => sc.main_user_id === mainUserId)
      .map(sc => sc.code);
    
    const mainUser = users.find(u => u.id === mainUserId);
    const sharedUsers = users.filter(u => 
      u.role === 'shared_user' && 
      u.shared_code && 
      mainUserCodes.includes(u.shared_code.toUpperCase())
    );
    
    const allowedUserIds = [mainUserId, ...sharedUsers.map(u => u.id)];
    return records
      .filter(r => allowedUserIds.includes(r.user_id))
      .map(r => {
        const user = users.find(u => u.id === r.user_id);
        return {
          ...r,
          username: user?.username,
          full_name: user?.full_name,
        };
      });
  },
  
  getMy: (userId, limit = null) => {
    const records = getStorage(STORAGE_KEYS.CONSUMPTION);
    const users = userService.getAll();
    let filtered = records
      .filter(r => r.user_id === userId)
      .map(r => {
        const user = users.find(u => u.id === r.user_id);
        return {
          ...r,
          username: user?.username,
          full_name: user?.full_name,
        };
      })
      .sort((a, b) => new Date(b.reading_date) - new Date(a.reading_date));
    
    if (limit) {
      filtered = filtered.slice(0, limit);
    }
    return filtered;
  },
  
  getById: (id) => {
    const records = getStorage(STORAGE_KEYS.CONSUMPTION);
    const users = userService.getAll();
    const record = records.find(r => r.id === id);
    if (!record) return null;
    
    const user = users.find(u => u.id === record.user_id);
    return {
      ...record,
      username: user?.username,
      full_name: user?.full_name,
    };
  },
  
  getLatestByUserId: (userId) => {
    const records = getStorage(STORAGE_KEYS.CONSUMPTION);
    return records
      .filter(r => r.user_id === userId)
      .sort((a, b) => new Date(b.reading_date) - new Date(a.reading_date))[0] || null;
  },
  
  create: (data) => {
    const records = getStorage(STORAGE_KEYS.CONSUMPTION);
    const newRecord = {
      id: generateId(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    records.push(newRecord);
    setStorage(STORAGE_KEYS.CONSUMPTION, records);
    return newRecord;
  },
  
  update: (id, updates) => {
    const records = getStorage(STORAGE_KEYS.CONSUMPTION);
    const index = records.findIndex(r => r.id === id);
    if (index === -1) return null;
    
    records[index] = {
      ...records[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    setStorage(STORAGE_KEYS.CONSUMPTION, records);
    return records[index];
  },
  
  delete: (id) => {
    const records = getStorage(STORAGE_KEYS.CONSUMPTION);
    const filtered = records.filter(r => r.id !== id);
    setStorage(STORAGE_KEYS.CONSUMPTION, filtered);
    return true;
  },
};

// Bill Service
export const billService = {
  getAll: (mainUserId = null) => {
    const bills = getStorage(STORAGE_KEYS.BILLS);
    const users = userService.getAll();
    const consumption = getStorage(STORAGE_KEYS.CONSUMPTION);
    const payments = getStorage(STORAGE_KEYS.PAYMENTS);
    
    let filtered = bills;
    
    if (mainUserId) {
      const sharedCodes = getStorage(STORAGE_KEYS.SHARED_CODES);
      const mainUserCodes = sharedCodes
        .filter(sc => sc.main_user_id === mainUserId)
        .map(sc => sc.code);
      
      const mainUser = users.find(u => u.id === mainUserId);
      const sharedUsers = users.filter(u => 
        u.role === 'shared_user' && 
        u.shared_code && 
        mainUserCodes.includes(u.shared_code.toUpperCase())
      );
      
      const allowedUserIds = [mainUserId, ...sharedUsers.map(u => u.id)];
      filtered = bills.filter(b => allowedUserIds.includes(b.user_id));
    }
    
    return filtered
      .map(bill => {
        const user = users.find(u => u.id === bill.user_id);
        const consumptionRecord = consumption.find(cr => cr.id === bill.consumption_record_id);
        const billPayments = payments.filter(p => p.bill_id === bill.id);
        const totalPaid = billPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const remaining = bill.total_amount - totalPaid;
        
        let status = 'unpaid';
        if (totalPaid >= bill.total_amount) {
          status = 'paid';
        } else if (totalPaid > 0) {
          status = 'partial';
        }
        
        return {
          ...bill,
          username: user?.username,
          full_name: user?.full_name,
          role: user?.role,
          reading_date: consumptionRecord?.reading_date,
          current_reading: consumptionRecord?.current_reading,
          previous_reading: consumptionRecord?.previous_reading,
          consumption_kwh: consumptionRecord?.consumption_kwh || bill.consumption_kwh,
          total_paid: totalPaid,
          remaining_amount: remaining,
          status,
          payments: billPayments,
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },
  
  getMy: (userId, limit = null) => {
    const bills = billService.getAll();
    const user = userService.getById(userId);
    
    if (user?.role === 'shared_user') {
      // Shared users see all bills in their group
      const sharedCodes = getStorage(STORAGE_KEYS.SHARED_CODES);
      const normalizedUserCode = user.shared_code?.toUpperCase();
      const userCode = sharedCodes.find(sc => sc.code.toUpperCase() === normalizedUserCode);
      if (userCode) {
        return billService.getAll(userCode.main_user_id).slice(0, limit || Infinity);
      }
    }
    
    let filtered = bills.filter(b => b.user_id === userId);
    if (limit) {
      filtered = filtered.slice(0, limit);
    }
    return filtered;
  },
  
  getById: (id) => {
    const bills = billService.getAll();
    return bills.find(b => b.id === id) || null;
  },
  
  getByCycle: (billingCycle, userId = null) => {
    const bills = billService.getAll(userId);
    return bills.filter(b => b.billing_cycle === billingCycle);
  },
  
  create: (data) => {
    const bills = getStorage(STORAGE_KEYS.BILLS);
    const newBill = {
      id: generateId(),
      ...data,
      status: 'unpaid',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    bills.push(newBill);
    setStorage(STORAGE_KEYS.BILLS, bills);
    return newBill;
  },
  
  update: (id, updates) => {
    const bills = getStorage(STORAGE_KEYS.BILLS);
    const index = bills.findIndex(b => b.id === id);
    if (index === -1) return null;
    
    bills[index] = {
      ...bills[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    setStorage(STORAGE_KEYS.BILLS, bills);
    return bills[index];
  },
  
  delete: (id) => {
    const bills = getStorage(STORAGE_KEYS.BILLS);
    const filtered = bills.filter(b => b.id !== id);
    setStorage(STORAGE_KEYS.BILLS, filtered);
    
    // Also delete related payments
    const payments = getStorage(STORAGE_KEYS.PAYMENTS);
    const filteredPayments = payments.filter(p => p.bill_id !== id);
    setStorage(STORAGE_KEYS.PAYMENTS, filteredPayments);
    
    return true;
  },
};

// Payment Service
export const paymentService = {
  getAll: () => getStorage(STORAGE_KEYS.PAYMENTS),
  
  getMy: (userId) => {
    const payments = getStorage(STORAGE_KEYS.PAYMENTS);
    const bills = getStorage(STORAGE_KEYS.BILLS);
    const userBills = bills.filter(b => b.user_id === userId).map(b => b.id);
    return payments.filter(p => userBills.includes(p.bill_id));
  },
  
  getByBill: (billId) => {
    const payments = getStorage(STORAGE_KEYS.PAYMENTS);
    return payments.filter(p => p.bill_id === billId);
  },
  
  getById: (id) => {
    const payments = getStorage(STORAGE_KEYS.PAYMENTS);
    return payments.find(p => p.id === id) || null;
  },
  
  create: (data) => {
    const payments = getStorage(STORAGE_KEYS.PAYMENTS);
    const newPayment = {
      id: generateId(),
      ...data,
      created_at: new Date().toISOString(),
    };
    payments.push(newPayment);
    setStorage(STORAGE_KEYS.PAYMENTS, payments);
    return newPayment;
  },
};

// Rate Service
export const rateService = {
  getAll: () => getStorage(STORAGE_KEYS.RATES),
  
  getCurrent: () => {
    const rates = getStorage(STORAGE_KEYS.RATES);
    const now = new Date().toISOString().split('T')[0];
    return rates
      .filter(r => r.is_active && r.effective_from <= now && (!r.effective_to || r.effective_to >= now))
      .sort((a, b) => new Date(b.effective_from) - new Date(a.effective_from))[0] || null;
  },
  
  create: (data) => {
    const rates = getStorage(STORAGE_KEYS.RATES);
    // Deactivate all other rates
    rates.forEach(r => {
      if (r.is_active) {
        r.is_active = false;
      }
    });
    
    const newRate = {
      id: generateId(),
      ...data,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    rates.push(newRate);
    setStorage(STORAGE_KEYS.RATES, rates);
    return newRate;
  },
};

// Auth Service
export const authService = {
  register: (userData) => {
    // Check if username or phone already exists
    if (userService.findByUsername(userData.username)) {
      throw new Error('Username already exists');
    }
    if (userService.findByPhoneNumber(userData.phone_number)) {
      throw new Error('Phone number already exists');
    }
    
    // Generate shared code for main user
    const sharedCode = generateSharedCode();
    const newUser = userService.create({
      ...userData,
      role: 'main_user',
      shared_code: sharedCode.toUpperCase().trim(), // Store as uppercase
      password: userData.password, // In real app, hash this
    });
    
    // Create a shared code entry with the SAME code (ensure uppercase)
    const codes = getStorage(STORAGE_KEYS.SHARED_CODES);
    const normalizedSharedCode = sharedCode.toUpperCase().trim();
    const newCode = {
      id: generateId(),
      code: normalizedSharedCode, // Store as uppercase
      main_user_id: newUser.id,
      expires_at: null,
      is_used: false,
      used_by_user_id: null,
      created_at: new Date().toISOString(),
    };
    codes.push(newCode);
    setStorage(STORAGE_KEYS.SHARED_CODES, codes);
    
    const token = JSON.stringify({ userId: newUser.id, timestamp: Date.now() });
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, token);
    return {
      token: token,
      user: {
        id: newUser.id,
        username: newUser.username,
        phone_number: newUser.phone_number,
        full_name: newUser.full_name,
        role: newUser.role,
        shared_code: newUser.shared_code,
      },
    };
  },
  
  login: (username, password) => {
    const user = userService.findByUsername(username);
    if (!user) {
      throw new Error('Invalid username or password');
    }
    
    // Simple password check (in real app, hash and compare)
    if (user.password !== password) {
      throw new Error('Invalid username or password');
    }
    
    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }
    
    const token = JSON.stringify({ userId: user.id, timestamp: Date.now() });
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, token);
    return {
      token: token,
      user: {
        id: user.id,
        username: user.username,
        phone_number: user.phone_number,
        full_name: user.full_name,
        role: user.role,
        shared_code: user.shared_code,
      },
    };
  },
  
  connectWithCode: (data) => {
    // Normalize the code to uppercase for lookup
    if (!data.shared_code || !data.shared_code.trim()) {
      throw new Error('Shared code is required');
    }
    
    // Clean and normalize the code - remove any non-alphanumeric characters
    const normalizedCode = String(data.shared_code).toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
    
    if (normalizedCode.length !== 8) {
      throw new Error('Shared code must be exactly 8 characters');
    }
    
    // Debug: Log all codes for troubleshooting
    const allCodes = getStorage(STORAGE_KEYS.SHARED_CODES);
    console.log('🔍 Debug - Looking for code:', normalizedCode);
    console.log('🔍 Debug - Total codes in system:', allCodes.length);
    console.log('🔍 Debug - All codes:', allCodes.map(c => {
      const normalized = String(c.code || '').toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
      return {
        original: c.code,
        normalized: normalized,
        is_used: c.is_used,
        main_user_id: c.main_user_id,
        expires_at: c.expires_at,
        matches: normalized === normalizedCode
      };
    }));
    
    // Check if localStorage is working
    if (allCodes.length === 0) {
      console.warn('⚠️ Warning: No shared codes found in localStorage. This might indicate:');
      console.warn('  1. The Main User has not generated any codes yet');
      console.warn('  2. localStorage was cleared');
      console.warn('  3. You are using a different browser/domain');
    }
    
    const codeData = sharedCodeService.findByCode(normalizedCode);
    
    if (!codeData) {
      // More detailed error message
      const matchingCode = allCodes.find(c => {
        const storedNormalized = String(c.code || '').toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
        return storedNormalized === normalizedCode;
      });
      
      if (matchingCode) {
        if (matchingCode.is_used) {
          throw new Error('This shared code has already been used. Please ask the Main User to generate a new code.');
        } else if (matchingCode.expires_at && new Date(matchingCode.expires_at) <= new Date()) {
          throw new Error('This shared code has expired. Please ask the Main User to generate a new code.');
        } else {
          throw new Error('Code found but validation failed. Please try again.');
        }
      } else {
        // Check if there are any codes at all
        if (allCodes.length === 0) {
          throw new Error(`No shared codes found in the system. Please ask the Main User to generate a shared code first.`);
        }
        
        // Check if all codes are used
        const unusedCodes = allCodes.filter(c => !c.is_used);
        if (unusedCodes.length === 0) {
          throw new Error(`All shared codes have been used. Please ask the Main User to generate a new code.`);
        }
        
        // Code doesn't exist
        const availableCodes = unusedCodes.map(c => c.code).join(', ');
        throw new Error(`Invalid shared code "${normalizedCode}". The code does not exist. Available unused codes: ${availableCodes}`);
      }
    }
    
    // Check if username or phone already exists
    if (userService.findByUsername(data.username)) {
      throw new Error('Username already exists');
    }
    if (userService.findByPhoneNumber(data.phone_number)) {
      throw new Error('Phone number already exists');
    }
    
    const newUser = userService.create({
      ...data,
      role: 'shared_user',
      shared_code: normalizedCode, // Store normalized code
      password: data.password, // In real app, hash this
    });
    
    sharedCodeService.markAsUsed(normalizedCode, newUser.id);
    
    const token = JSON.stringify({ userId: newUser.id, timestamp: Date.now() });
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, token);
    return {
      token: token,
      user: {
        id: newUser.id,
        username: newUser.username,
        phone_number: newUser.phone_number,
        full_name: newUser.full_name,
        role: newUser.role,
      },
    };
  },
  
  getProfile: (userId) => {
    const user = userService.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      id: user.id,
      username: user.username,
      phone_number: user.phone_number,
      full_name: user.full_name,
      role: user.role,
      shared_code: user.shared_code,
      is_active: user.is_active,
      created_at: user.created_at,
    };
  },
  
  generateSharedCode: (mainUserId) => {
    return sharedCodeService.create(mainUserId);
  },
  
  getSharedCodes: (mainUserId) => {
    return sharedCodeService.getAll(mainUserId);
  },
  
  deleteSharedCode: (code) => {
    return sharedCodeService.delete(code);
  },
};

// Data Export/Import Service
export const dataService = {
  // Export all data or specific data types
  exportData: (options = {}) => {
    const {
      includeUsers = true,
      includeCodes = true,
      includeConsumption = true,
      includeBills = true,
      includePayments = true,
      includeRates = true,
    } = options;
    
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {}
    };
    
    if (includeUsers) {
      exportData.data.users = getStorage(STORAGE_KEYS.USERS);
    }
    if (includeCodes) {
      exportData.data.shared_codes = getStorage(STORAGE_KEYS.SHARED_CODES);
    }
    if (includeConsumption) {
      exportData.data.consumption = getStorage(STORAGE_KEYS.CONSUMPTION);
    }
    if (includeBills) {
      exportData.data.bills = getStorage(STORAGE_KEYS.BILLS);
    }
    if (includePayments) {
      exportData.data.payments = getStorage(STORAGE_KEYS.PAYMENTS);
    }
    if (includeRates) {
      exportData.data.rates = getStorage(STORAGE_KEYS.RATES);
    }
    
    return JSON.stringify(exportData, null, 2);
  },
  
  // Import data from exported JSON
  importData: (jsonString, options = {}) => {
    const {
      merge = false, // If true, merge with existing data; if false, replace
      includeUsers = true,
      includeCodes = true,
      includeConsumption = true,
      includeBills = true,
      includePayments = true,
      includeRates = true,
    } = options;
    
    try {
      const importedData = JSON.parse(jsonString);
      
      if (!importedData.data) {
        throw new Error('Invalid export format. Missing data object.');
      }
      
      if (includeUsers && importedData.data.users) {
        if (merge) {
          const existing = getStorage(STORAGE_KEYS.USERS);
          const merged = [...existing, ...importedData.data.users];
          // Remove duplicates by id
          const unique = merged.filter((user, index, self) =>
            index === self.findIndex(u => u.id === user.id)
          );
          setStorage(STORAGE_KEYS.USERS, unique);
        } else {
          setStorage(STORAGE_KEYS.USERS, importedData.data.users);
        }
      }
      
      if (includeCodes && importedData.data.shared_codes) {
        if (merge) {
          const existing = getStorage(STORAGE_KEYS.SHARED_CODES);
          const merged = [...existing, ...importedData.data.shared_codes];
          // Remove duplicates by id
          const unique = merged.filter((code, index, self) =>
            index === self.findIndex(c => c.id === code.id)
          );
          setStorage(STORAGE_KEYS.SHARED_CODES, unique);
        } else {
          setStorage(STORAGE_KEYS.SHARED_CODES, importedData.data.shared_codes);
        }
      }
      
      if (includeConsumption && importedData.data.consumption) {
        if (merge) {
          const existing = getStorage(STORAGE_KEYS.CONSUMPTION);
          const merged = [...existing, ...importedData.data.consumption];
          const unique = merged.filter((item, index, self) =>
            index === self.findIndex(i => i.id === item.id)
          );
          setStorage(STORAGE_KEYS.CONSUMPTION, unique);
        } else {
          setStorage(STORAGE_KEYS.CONSUMPTION, importedData.data.consumption);
        }
      }
      
      if (includeBills && importedData.data.bills) {
        if (merge) {
          const existing = getStorage(STORAGE_KEYS.BILLS);
          const merged = [...existing, ...importedData.data.bills];
          const unique = merged.filter((item, index, self) =>
            index === self.findIndex(i => i.id === item.id)
          );
          setStorage(STORAGE_KEYS.BILLS, unique);
        } else {
          setStorage(STORAGE_KEYS.BILLS, importedData.data.bills);
        }
      }
      
      if (includePayments && importedData.data.payments) {
        if (merge) {
          const existing = getStorage(STORAGE_KEYS.PAYMENTS);
          const merged = [...existing, ...importedData.data.payments];
          const unique = merged.filter((item, index, self) =>
            index === self.findIndex(i => i.id === item.id)
          );
          setStorage(STORAGE_KEYS.PAYMENTS, unique);
        } else {
          setStorage(STORAGE_KEYS.PAYMENTS, importedData.data.payments);
        }
      }
      
      if (includeRates && importedData.data.rates) {
        if (merge) {
          const existing = getStorage(STORAGE_KEYS.RATES);
          const merged = [...existing, ...importedData.data.rates];
          const unique = merged.filter((item, index, self) =>
            index === self.findIndex(i => i.id === item.id)
          );
          setStorage(STORAGE_KEYS.RATES, unique);
        } else {
          setStorage(STORAGE_KEYS.RATES, importedData.data.rates);
        }
      }
      
      return {
        success: true,
        message: 'Data imported successfully'
      };
    } catch (error) {
      console.error('Import error:', error);
      throw new Error(`Failed to import data: ${error.message}`);
    }
  },
  
  // Export only shared codes (simplified)
  exportCodes: () => {
    return dataService.exportData({
      includeUsers: false,
      includeCodes: true,
      includeConsumption: false,
      includeBills: false,
      includePayments: false,
      includeRates: false,
    });
  },
  
  // Import only shared codes (simplified)
  importCodes: (jsonString, merge = false) => {
    return dataService.importData(jsonString, {
      merge,
      includeUsers: false,
      includeCodes: true,
      includeConsumption: false,
      includeBills: false,
      includePayments: false,
      includeRates: false,
    });
  },
};

// Initialize default data if needed
export const initializeStorage = () => {
  // Initialize empty arrays if they don't exist
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    setStorage(STORAGE_KEYS.USERS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SHARED_CODES)) {
    setStorage(STORAGE_KEYS.SHARED_CODES, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONSUMPTION)) {
    setStorage(STORAGE_KEYS.CONSUMPTION, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.BILLS)) {
    setStorage(STORAGE_KEYS.BILLS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
    setStorage(STORAGE_KEYS.PAYMENTS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.RATES)) {
    setStorage(STORAGE_KEYS.RATES, []);
  }
};

