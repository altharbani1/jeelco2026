
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { LogIn, Lock, User as UserIcon, AlertCircle, CloudDownload, Settings, Database, CheckCircle2, XCircle } from 'lucide-react';
import { cloudService } from '../services/cloudService.ts';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('جاري التحقق...');
  
  // DB Config State
  const [showConfig, setShowConfig] = useState(false);
  const [dbConn, setDbConn] = useState('');
  const [configStatus, setConfigStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  useEffect(() => {
      const saved = localStorage.getItem('jilco_neon_connection');
      if (saved) setDbConn(saved);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatusText('جاري التحقق من البيانات...');
    
    try {
        const success = await login(username.trim(), password.trim());
        if (!success) {
            setStatusText('لم يتم العثور محلياً، جاري البحث في السحابة...');
            await new Promise(r => setTimeout(r, 800));
            setError('اسم المستخدم أو كلمة المرور غير صحيحة، أو لم يتم ضبط اتصال السحابة.');
            setLoading(false);
        }
    } catch (e) {
        setError('حدث خطأ أثناء محاولة الاتصال بالسحابة. تأكد من إعدادات الرابط.');
        setLoading(false);
    }
  };

  const handleSaveDb = async () => {
      setConfigStatus('testing');
      const ok = await cloudService.testConnection(dbConn);
      if (ok) {
          localStorage.setItem('jilco_neon_connection', dbConn);
          await cloudService.initDb(dbConn); // Ensure table is there
          setConfigStatus('success');
          setTimeout(() => setShowConfig(false), 1500);
      } else {
          setConfigStatus('error');
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden" dir="rtl">
        
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-jilco-900 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-gold-600 rounded-full blur-[120px] opacity-10 animate-pulse delay-1000"></div>
        </div>

        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative z-10 mx-4">
            
            {/* Header */}
            <div className="bg-jilco-900 p-8 text-center relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tighter">JILCO</h1>
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-[0.3em]">Elevators System</p>
                </div>
                {/* Database Settings Button */}
                <button 
                    onClick={() => setShowConfig(!showConfig)}
                    className="absolute top-4 left-4 text-white/30 hover:text-white transition-colors"
                    title="إعدادات الاتصال"
                >
                    <Settings size={20} />
                </button>
                
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400"></div>
            </div>

            {/* Form Container */}
            <div className="p-8">
                {showConfig ? (
                    <div className="animate-fade-in space-y-4">
                        <div className="text-center mb-4">
                            <h3 className="font-bold text-gray-800 flex items-center justify-center gap-2">
                                <Database size={18} className="text-jilco-600"/> إعدادات السحابة
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">أدخل رابط Neon Postgres لاستعادة بياناتك</p>
                        </div>
                        
                        <div className="space-y-3">
                            <textarea 
                                value={dbConn}
                                onChange={e => setDbConn(e.target.value)}
                                placeholder="postgres://user:pass@host/db"
                                className="w-full p-3 border border-gray-400 rounded-lg text-[10px] font-mono h-24 bg-gray-50 focus:ring-2 focus:ring-jilco-500 outline-none"
                            />
                            
                            <button 
                                onClick={handleSaveDb}
                                disabled={configStatus === 'testing'}
                                className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                    configStatus === 'success' ? 'bg-green-600 text-white' : 
                                    configStatus === 'error' ? 'bg-red-600 text-white' : 
                                    'bg-jilco-900 text-white hover:bg-black'
                                }`}
                            >
                                {configStatus === 'testing' ? 'جاري الفحص...' : 
                                 configStatus === 'success' ? <><CheckCircle2 size={18}/> تم الحفظ والاتصال</> :
                                 configStatus === 'error' ? <><XCircle size={18}/> رابط غير صالح</> : 
                                 'حفظ واختبار الاتصال'}
                            </button>
                            
                            <button onClick={() => setShowConfig(false)} className="w-full text-xs text-gray-400 font-bold hover:underline">العودة للدخول</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mb-6 text-center">
                            <h2 className="text-xl font-bold text-gray-800">تسجيل الدخول</h2>
                            <p className="text-sm text-gray-500 mt-1">أدخل بياناتك للوصول للنظام</p>
                        </div>

                        {error && (
                            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-fade-in leading-relaxed">
                                <AlertCircle size={16} className="shrink-0" /> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-2">اسم المستخدم</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        className="w-full pl-4 pr-10 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-jilco-500 outline-none transition-all text-base font-bold text-black bg-white"
                                        placeholder="اسم المستخدم"
                                    />
                                    <UserIcon size={18} className="absolute right-3 top-3.5 text-gray-500" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-2">كلمة المرور</label>
                                <div className="relative">
                                    <input 
                                        type="password" 
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full pl-4 pr-10 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-jilco-500 outline-none transition-all text-base font-bold text-black bg-white"
                                        placeholder="••••••••"
                                    />
                                    <Lock size={18} className="absolute right-3 top-3.5 text-gray-500" />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-jilco-900 text-white font-bold py-3.5 rounded-lg shadow-lg hover:bg-jilco-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                            >
                                {loading ? (
                                    <>
                                        <CloudDownload size={20} className="animate-bounce" /> {statusText}
                                    </>
                                ) : (
                                    <>
                                        <LogIn size={20} /> تسجيل الدخول
                                    </>
                                )}
                            </button>
                        </form>
                        
                        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-[10px] text-blue-800 text-center font-bold">
                                جهاز جديد؟ اضغط على أيقونة الترس بالأعلى لإدخال رابط السحابة الخاص بمؤسستك واستعادة كافة بياناتك.
                            </p>
                        </div>
                    </>
                )}
            </div>

            <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase">جميع الحقوق محفوظة © {new Date().getFullYear()} جيلكو للمصاعد</p>
            </div>
        </div>
    </div>
  );
};
