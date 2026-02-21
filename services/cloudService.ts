
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, supabaseKey);

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
  // 1. اختبار الاتصال
  async testConnection() {
    try {
      const { error } = await supabase.from('jilco_backups').select('key').limit(1);
      return !error;
    } catch (e) {
      console.error('Cloud Connection Error:', e);
      return false;
    }
  },

  // 2. تهيئة قاعدة البيانات (الجدول يُنشأ عبر Supabase SQL Editor)
  async initDb() {
    // الجدول يُنشأ مسبقاً في Supabase Dashboard
    // لا حاجة لـ CREATE TABLE من الكود
    return true;
  },

  // 3. جمع البيانات المحلية
  getLocalData() {
    const data: Record<string, any> = {};
    STORAGE_KEYS.forEach(key => {
      const val = localStorage.getItem(key);
      if (val) data[key] = val;
    });
    return data;
  },

  // 4. رفع البيانات (Backup)
  async uploadData(data: any) {
    try {
      const jsonData = JSON.stringify(data);

      if (jsonData.length > 10 * 1024 * 1024) {
        console.warn('Payload too large for a single sync, consider removing some documents.');
      }

      const { error } = await supabase
        .from('jilco_backups')
        .upsert(
          { key: 'latest_backup', data: jsonData, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Upload Data Error:', e);
      throw e;
    }
  },

  // 5. استرجاع البيانات (Restore)
  async downloadData() {
    try {
      const { data, error } = await supabase
        .from('jilco_backups')
        .select('data')
        .eq('key', 'latest_backup')
        .single();

      if (error || !data) return null;

      // data.data هو نص JSON أو كائن مباشر
      if (typeof data.data === 'string') {
        return JSON.parse(data.data);
      }
      return data.data;
    } catch (e) {
      console.error('Download Data Error:', e);
      return null;
    }
  },

  // 6. التحقق من حالة النسخة الاحتياطية
  async getBackupInfo() {
    try {
      const { data, error } = await supabase
        .from('jilco_backups')
        .select('updated_at, data')
        .eq('key', 'latest_backup')
        .single();

      if (error || !data) return { exists: false };

      const sizeBytes = typeof data.data === 'string'
        ? data.data.length
        : JSON.stringify(data.data).length;

      return {
        exists: true,
        updatedAt: data.updated_at,
        sizeBytes
      };
    } catch (e) {
      console.error('Check Info Error:', e);
      return { error: true, exists: false };
    }
  }
};
