
import { neon } from '@neondatabase/serverless';

// القائمة الشاملة لجميع مفاتيح التخزين في النظام
const STORAGE_KEYS = [
  'jilco_quote_data',           // إعدادات الشركة
  'jilco_quotes_archive',       // عروض الأسعار
  'jilco_invoices_archive',     // الفواتير
  'jilco_receipts_archive',     // سندات القبض
  'jilco_contracts_archive',    // العقود
  'jilco_customers',            // العملاء
  'jilco_projects',             // المشاريع
  'jilco_phases',               // مراحل المشاريع
  'jilco_specs_db',             // قاعدة بيانات المواصفات
  'jilco_suppliers',            // الموردين
  'jilco_supplier_products',    // منتجات الموردين
  'jilco_purchase_invoices',    // فواتير المشتريات
  'jilco_supplier_payments',    // مدفوعات الموردين
  'jilco_warranties_archive',   // الضمانات
  'jilco_hr_employees',         // الموظفين
  'jilco_hr_commissions',       // العمولات
  'jilco_smart_elevators',      // المصاعد الذكية
  'jilco_documents',            // الوثائق
  'jilco_system_users',         // المستخدمين
  'jilco_claims_archive',       // المطالبات المالية
  'jilco_expenses_archive',     // المصروفات
  'jilco_calculator_prices_v6'  // إعدادات الحاسبة
];

export const cloudService = {
  // 1. اختبار الاتصال مع تهيئة تلقائية
  async testConnection(connString: string) {
    if (!connString || !connString.startsWith('postgres')) return false;
    try {
      const sql = neon(connString);
      const result = await sql`SELECT 1 as result`;
      return result && result[0]?.result === 1;
    } catch (e) {
      console.error("Cloud Connection Error:", e);
      return false;
    }
  },

  // 2. تهيئة قاعدة البيانات وضمان وجود الجدول
  async initDb(connString: string) {
    if (!connString) return false;
    try {
        const sql = neon(connString);
        await sql`CREATE TABLE IF NOT EXISTS jilco_backups (
          id SERIAL PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )`;
        return true;
    } catch (e) {
        console.error("Init DB Error:", e);
        return false;
    }
  },

  // 3. جمع البيانات المحلية
  getLocalData() {
    const data: Record<string, any> = {};
    STORAGE_KEYS.forEach(key => {
        const val = localStorage.getItem(key);
        if(val) data[key] = val; 
    });
    return data;
  },

  // 4. رفع البيانات (Backup) مع فحص الحجم
  async uploadData(connString: string, data: any) {
    if (!connString) return false;
    try {
        const sql = neon(connString);
        const jsonData = JSON.stringify(data);
        
        // فحص حجم البيانات (Postgres JSONB limit is usually high, but network request might fail)
        if (jsonData.length > 10 * 1024 * 1024) { // 10MB limit check
            console.warn("Payload too large for a single sync, consider removing some documents.");
        }

        await sql`
          INSERT INTO jilco_backups (key, data, updated_at)
          VALUES ('latest_backup', ${jsonData}::jsonb, NOW())
          ON CONFLICT (key) 
          DO UPDATE SET data = ${jsonData}::jsonb, updated_at = NOW()
        `;
        return true;
    } catch (e) {
        console.error("Upload Data Error:", e);
        throw e; // Pass error to UI for syncStatus
    }
  },

  // 5. استرجاع البيانات (Restore)
  async downloadData(connString: string) {
    if (!connString) return null;
    try {
        const sql = neon(connString);
        const result = await sql`SELECT data FROM jilco_backups WHERE key = 'latest_backup'`;
        if (result && result.length > 0) {
            return result[0].data;
        }
        return null;
    } catch (e) {
        console.error("Download Data Error:", e);
        return null;
    }
  },

  // 6. التحقق من حالة النسخة الاحتياطية
  async getBackupInfo(connString: string) {
    if (!connString) return { exists: false };
    try {
      const sql = neon(connString);
      const result = await sql`
        SELECT 
          updated_at, 
          pg_column_size(data) as size_bytes 
        FROM jilco_backups 
        WHERE key = 'latest_backup'
      `;
      
      if (result && result.length > 0) {
        return {
          exists: true,
          updatedAt: result[0].updated_at,
          sizeBytes: result[0].size_bytes
        };
      }
      return { exists: false };
    } catch (e) {
      console.error("Check Info Error:", e);
      return { error: true, exists: false };
    }
  }
};
