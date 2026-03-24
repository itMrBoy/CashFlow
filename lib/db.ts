import * as SQLite from 'expo-sqlite';
import { Transaction, Subscription } from "@/types/database";
import { TransactionFilters } from '../store/useStore';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

export async function initDB() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (!db) {
        db = await SQLite.openDatabaseAsync('cashflow.db');
      }

      // 分开执行 PRAGMA 和建表语句，增强兼容性
      await db.execAsync('PRAGMA journal_mode = WAL;');
      
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          date TEXT NOT NULL,
          metadata TEXT,
          note TEXT,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS subscriptions (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          amount REAL NOT NULL,
          cycle TEXT NOT NULL,
          first_billing_date TEXT NOT NULL,
          category TEXT NOT NULL,
          note TEXT,
          created_at TEXT NOT NULL
        );
      `);
    } catch (error) {
      initPromise = null;
      db = null; // 重置连接以允许重试
      console.error("Database initialization failed:", error);
      throw error;
    }
  })();

  return initPromise;
}

// 内部安全检查函数
async function ensureDB(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    await initDB();
  }
  if (!db) throw new Error("Database failed to initialize");
  return db;
}

export async function insertTransaction(transaction: Transaction) {
  const database = await ensureDB();
  return await database.runAsync(
    'INSERT INTO transactions (id, type, title, amount, category, date, metadata, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      transaction.id,
      transaction.type,
      transaction.title,
      transaction.amount,
      transaction.category,
      transaction.date,
      transaction.metadata || null,
      transaction.note || null,
      transaction.created_at,
    ]
  );
}

export async function updateTransaction(transaction: Transaction) {
  const database = await ensureDB();
  return await database.runAsync(
    'UPDATE transactions SET type = ?, title = ?, amount = ?, category = ?, date = ?, metadata = ?, note = ? WHERE id = ?',
    [
      transaction.type,
      transaction.title,
      transaction.amount,
      transaction.category,
      transaction.date,
      transaction.metadata || null,
      transaction.note || null,
      transaction.id,
    ]
  );
}

export async function deleteTransaction(id: string) {
  const database = await ensureDB();
  return await database.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

export async function getTransactions(
  filters: TransactionFilters,
  limit: number = 50,
  offset: number = 0
): Promise<Transaction[]> {
  const database = await ensureDB();

  let query = 'SELECT * FROM transactions';
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.type !== 'all') {
    conditions.push('type = ?');
    params.push(filters.type);
  }

  if (filters.categories && filters.categories.length > 0) {
    const placeholders = filters.categories.map(() => '?').join(',');
    conditions.push(`category IN (${placeholders})`);
    params.push(...filters.categories);
  }

  if (filters.dateRange) {
    conditions.push('date(date) >= ? AND date(date) <= ?');
    params.push(filters.dateRange.start, filters.dateRange.end);
  }

  if (filters.searchQuery) {
    conditions.push('(title LIKE ? OR category LIKE ? OR note LIKE ?)');
    const keywordParam = `%${filters.searchQuery}%`;
    params.push(keywordParam, keywordParam, keywordParam);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return await database.getAllAsync<Transaction>(query, params);
}

export async function getFilteredTotals(
  filters: TransactionFilters
): Promise<{ income: number; expense: number }> {
  const database = await ensureDB();

  let query = `
    SELECT 
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
    FROM transactions
  `;
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.type !== 'all') {
    conditions.push('type = ?');
    params.push(filters.type);
  }

  if (filters.categories && filters.categories.length > 0) {
    const placeholders = filters.categories.map(() => '?').join(',');
    conditions.push(`category IN (${placeholders})`);
    params.push(...filters.categories);
  }

  if (filters.dateRange) {
    conditions.push('date(date) >= ? AND date(date) <= ?');
    params.push(filters.dateRange.start, filters.dateRange.end);
  }

  if (filters.searchQuery) {
    conditions.push('(title LIKE ? OR category LIKE ? OR note LIKE ?)');
    const keywordParam = `%${filters.searchQuery}%`;
    params.push(keywordParam, keywordParam, keywordParam);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  const result = await database.getAllAsync<{ income: number; expense: number }>(query, params);

  if (result && result.length > 0) {
    return {
      income: result[0].income || 0,
      expense: result[0].expense || 0,
    };
  }

  return { income: 0, expense: 0 };
}

export async function getMonthlyTotals(monthYear: string): Promise<{ income: number; expense: number }> {
  const database = await ensureDB();

  const query = `
    SELECT 
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
    FROM transactions 
    WHERE date LIKE ?
  `;

  const result = await database.getAllAsync<{ income: number; expense: number }>(query, [`${monthYear}%`]);

  if (result && result.length > 0) {
    return {
      income: result[0].income || 0,
      expense: result[0].expense || 0
    };
  }

  return { income: 0, expense: 0 };
}

export async function insertSubscription(subscription: Subscription) {
  const database = await ensureDB();
  return await database.runAsync(
    'INSERT INTO subscriptions (id, name, amount, cycle, first_billing_date, category, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      subscription.id,
      subscription.name,
      subscription.amount,
      subscription.cycle,
      subscription.first_billing_date,
      subscription.category,
      subscription.note || null,
      subscription.created_at,
    ]
  );
}

export async function updateSubscription(subscription: Subscription) {
  const database = await ensureDB();
  return await database.runAsync(
    'UPDATE subscriptions SET name = ?, amount = ?, cycle = ?, first_billing_date = ?, category = ?, note = ? WHERE id = ?',
    [
      subscription.name,
      subscription.amount,
      subscription.cycle,
      subscription.first_billing_date,
      subscription.category,
      subscription.note || null,
      subscription.id,
    ]
  );
}

export async function getSubscriptions(): Promise<Subscription[]> {
  const database = await ensureDB();
  return await database.getAllAsync<Subscription>('SELECT * FROM subscriptions ORDER BY first_billing_date DESC');
}

export async function deleteSubscription(id: string) {
  const database = await ensureDB();
  return await database.runAsync('DELETE FROM subscriptions WHERE id = ?', [id]);
}
export async function exportAllData() {
  const database = await ensureDB();
  const transactions = await database.getAllAsync<Transaction>('SELECT * FROM transactions');
  const subscriptions = await database.getAllAsync<Subscription>('SELECT * FROM subscriptions');
  return { transactions, subscriptions };
}

export async function clearAllData() {
  const database = await ensureDB();
  await database.withTransactionAsync(async () => {
    await database.runAsync('DELETE FROM transactions');
    await database.runAsync('DELETE FROM subscriptions');
  });
}

export async function importData(jsonData: { transactions: Transaction[], subscriptions: Subscription[] }) {
  const database = await ensureDB();
  await database.withTransactionAsync(async () => {
    // 先清空所有数据
    await database.runAsync('DELETE FROM transactions');
    await database.runAsync('DELETE FROM subscriptions');

    // 插入交易数据
    if (jsonData.transactions && jsonData.transactions.length > 0) {
      for (const t of jsonData.transactions) {
        await database.runAsync(
          'INSERT INTO transactions (id, type, title, amount, category, date, metadata, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            t.id,
            t.type,
            t.title,
            t.amount,
            t.category,
            t.date,
            t.metadata || null,
            t.note || null,
            t.created_at,
          ]
        );
      }
    }

    // 插入订阅数据
    if (jsonData.subscriptions && jsonData.subscriptions.length > 0) {
      for (const s of jsonData.subscriptions) {
        await database.runAsync(
          'INSERT INTO subscriptions (id, name, amount, cycle, first_billing_date, category, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            s.id,
            s.name,
            s.amount,
            s.cycle,
            s.first_billing_date,
            s.category,
            s.note || null,
            s.created_at,
          ]
        );
      }
    }
  });
}
