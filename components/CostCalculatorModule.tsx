import React, { useState, useMemo, useEffect } from 'react';
import { Scale, Calculator, Info, Printer, Settings, Zap, DollarSign, Box, Cpu, Minus, Plus, Trash2, Award, AlertTriangle, X, CheckCircle2, Save } from 'lucide-react';
import { CompanyConfig, TechnicalSpecs, SpecsDatabase } from '../types';

// --- Types ---

interface CostBreakdown {
  id: string;
  label: string;
  category: 'material' | 'labor' | 'margin';
  unitPrice: number;
  quantity: number;
  total: number;
  description: string;
}

interface PriceConfig {
  // Mechanical Basics
  kitBasePrice: number; // Basic kit (brackets, screws, counterweight frame)
  railPricePerMeter: number; // Cost of rails per meter of travel (approx 3m per stop)
  cablePricePerMeter: number; // Traveling cable
  
  // Labor
  installationBase: number;
  installationPerStop: number;
  
  // Multipliers
  profitMarginPercent: number; // e.g., 20%
  
  // Components
  machines: Record<string, number>;
  controls: Record<string, number>;
  doors: Record<string, number>; // Landing door price
  carDoorPrice: number; // Price for the car door mechanism
  cabins: Record<string, number>;
  
  // Capacity Multipliers (Base is 4 Persons)
  capacityMultipliers: Record<string, number>;
}

const DEFAULT_PRICES: PriceConfig = {
  kitBasePrice: 8500,
  railPricePerMeter: 180,
  cablePricePerMeter: 45,
  
  installationBase: 6000,
  installationPerStop: 800,
  
  profitMarginPercent: 25,
  
  machines: { 
    'Montanari Italy (Gearless)': 14500, 
    'Sicor Italy (Gearless)': 13800, 
    'Alberto Sassi (Geared)': 11000, 
    'Torin Drive (China)': 8500,
    'Hydraulic System (Italy)': 18000
  },
  controls: { 
    'Monarch Nice 3000+': 6500, 
    'Step System': 5800, 
    'INVT System': 4200 
  },
  doors: { 
    'Fermator Spain': 1800, 
    'Selcom Italy': 2200, 
    'Local Standard': 1200 
  },
  carDoorPrice: 2500, // Average addition for car door operator
  cabins: { 
    'Stainless Steel Hairline': 6000, 
    'Gold / Etched Design': 9500, 
    'Panoramic (Glass)': 18000 
  },
  capacityMultipliers: {
    '4 Persons (320kg)': 1.0,
    '6 Persons (450kg)': 1.1,
    '8 Persons (630kg)': 1.25,
    '10 Persons (800kg)': 1.4,
    '13 Persons (1000kg)': 1.6
  }
};

// --- Settings Modal Component ---
const SettingsModal = ({ 
  isOpen, 
  onClose, 
  config, 
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  config: PriceConfig; 
  onSave: (c: PriceConfig) => void 
}) => {
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
      setLocalConfig(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-bold text-jilco-900 flex items-center gap-2">
            <Settings className="text-gold-500" /> إعدادات التسعير الأساسية
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><X size={20}/></button>
        </div>
        
        <div className="p-6 space-y-6 flex-1">
           {/* Section 1: Basics */}
           <div>
              <h4 className="font-bold text-sm text-gray-500 mb-3 border-b pb-1">التكاليف الأساسية والتركيب</h4>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">سعر الكيت الميكانيكي الأساسي</label>
                    <input type="number" value={localConfig.kitBasePrice} onChange={e => setLocalConfig({...localConfig, kitBasePrice: parseFloat(e.target.value)})} className="w-full p-2 border rounded text-sm"/>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">هامش الربح (%)</label>
                    <input type="number" value={localConfig.profitMarginPercent} onChange={e => setLocalConfig({...localConfig, profitMarginPercent: parseFloat(e.target.value)})} className="w-full p-2 border rounded text-sm"/>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">تكلفة العمالة (أساسي)</label>
                    <input type="number" value={localConfig.installationBase} onChange={e => setLocalConfig({...localConfig, installationBase: parseFloat(e.target.value)})} className="w-full p-2 border rounded text-sm"/>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">تكلفة العمالة (لكل دور إضافي)</label>
                    <input type="number" value={localConfig.installationPerStop} onChange={e => setLocalConfig({...localConfig, installationPerStop: parseFloat(e.target.value)})} className="w-full p-2 border rounded text-sm"/>
                 </div>
              </div>
           </div>

           {/* Section 2: Unit Prices */}
           <div>
              <h4 className="font-bold text-sm text-gray-500 mb-3 border-b pb-1">أسعار الوحدات (للمتر / للقطعة)</h4>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">سعر السكك (للمتر)</label>
                    <input type="number" value={localConfig.railPricePerMeter} onChange={e => setLocalConfig({...localConfig, railPricePerMeter: parseFloat(e.target.value)})} className="w-full p-2 border rounded text-sm"/>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">سعر الكابلات المرنة (للمتر)</label>
                    <input type="number" value={localConfig.cablePricePerMeter} onChange={e => setLocalConfig({...localConfig, cablePricePerMeter: parseFloat(e.target.value)})} className="w-full p-2 border rounded text-sm"/>
                 </div>
              </div>
           </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
           <button onClick={() => setLocalConfig(DEFAULT_PRICES)} className="px-4 py-2 text-red-600 text-sm font-bold hover:bg-red-50 rounded">استعادة الافتراضي</button>
           <button onClick={() => onSave(localConfig)} className="px-6 py-2 bg-jilco-600 text-white rounded font-bold hover:bg-jilco-700 flex items-center gap-2"><Save size={16}/> حفظ التعديلات</button>
        </div>
      </div>
    </div>
  );
};

// --- Main Module ---

export const CostCalculatorModule: React.FC = () => {
  const [priceConfig, setPriceConfig] = useState<PriceConfig>(DEFAULT_PRICES);
  const [showSettings, setShowSettings] = useState(false);

  // Inputs
  const [elevatorCount, setElevatorCount] = useState(1);
  const [stops, setStops] = useState(4);
  const [capacity, setCapacity] = useState('6 Persons (450kg)');
  const [machineBrand, setMachineBrand] = useState('Montanari Italy (Gearless)');
  const [controlBrand, setControlBrand] = useState('Monarch Nice 3000+');
  const [doorBrand, setDoorBrand] = useState('Fermator Spain');
  const [cabinLevel, setCabinLevel] = useState('Stainless Steel Hairline');

  // Load / Save Config
  useEffect(() => {
    const savedPrices = localStorage.getItem('jilco_calculator_prices_v6');
    if (savedPrices) {
        try { setPriceConfig(JSON.parse(savedPrices)); } catch(e) {}
    }
  }, []);

  const saveConfig = (newConfig: PriceConfig) => {
      setPriceConfig(newConfig);
      localStorage.setItem('jilco_calculator_prices_v6', JSON.stringify(newConfig));
      setShowSettings(false);
  };

  // --- Logic & Validation ---
  const warnings = useMemo(() => {
      const warns = [];
      if (stops > 7 && machineBrand.includes('Hydraulic')) {
          warns.push('تحذير: النظام الهيدروليكي غير موصى به لأكثر من 7 وقفات بسبب التكلفة والأداء.');
      }
      if (stops > 12 && machineBrand.includes('Geared')) {
          warns.push('نصيحة: يفضل استخدام ماكينة Gearless للأدوار العالية لتوفير الطاقة والسرعة.');
      }
      return warns;
  }, [stops, machineBrand]);

  const breakdown = useMemo(() => {
    const list: CostBreakdown[] = [];
    const count = elevatorCount;
    const capacityMult = priceConfig.capacityMultipliers[capacity] || 1.0;
    
    // 1. Mechanical Kit (Rails, Counterweight, Brackets)
    // Estimation: 3.5 meters per stop approx.
    const travelHeight = stops * 3.5; 
    const railsCost = (travelHeight * priceConfig.railPricePerMeter * 2) * capacityMult; // *2 for car and counterweight rails
    const cablesCost = (travelHeight * 1.5) * priceConfig.cablePricePerMeter; // 1.5 factor for loops
    const mechanicalTotal = (priceConfig.kitBasePrice + railsCost + cablesCost) * count;

    list.push({
        id: 'mech',
        label: 'مجموعة الميكانيكا والسكك',
        category: 'material',
        unitPrice: mechanicalTotal / count,
        quantity: count,
        total: mechanicalTotal,
        description: `شامل السكك (${Math.ceil(travelHeight)}م) والكابلات والبراشوت`
    });

    // 2. Machine
    const baseMachinePrice = priceConfig.machines[machineBrand] || 0;
    const machineFinalPrice = baseMachinePrice * capacityMult;
    list.push({
        id: 'machine',
        label: `ماكينة الجر: ${machineBrand}`,
        category: 'material',
        unitPrice: machineFinalPrice,
        quantity: count,
        total: machineFinalPrice * count,
        description: `قدرة تتناسب مع حمولة ${capacity}`
    });

    // 3. Controller
    const controlPrice = priceConfig.controls[controlBrand] || 0;
    list.push({
        id: 'control',
        label: `نظام التحكم: ${controlBrand}`,
        category: 'material',
        unitPrice: controlPrice,
        quantity: count,
        total: controlPrice * count,
        description: 'شامل اللوحة الرئيسية والإنفرتر والتمديدات'
    });

    // 4. Doors (Landing + Car)
    const landingDoorPrice = priceConfig.doors[doorBrand] || 0;
    const carDoorPrice = priceConfig.carDoorPrice;
    // Total Doors = (Stops * Landing) + (1 Car Door)
    const doorsPerElevator = (stops * landingDoorPrice) + carDoorPrice;
    list.push({
        id: 'doors',
        label: `نظام الأبواب (${doorBrand})`,
        category: 'material',
        unitPrice: doorsPerElevator,
        quantity: count,
        total: doorsPerElevator * count,
        description: `عدد ${stops} باب خارجي + 1 باب داخلي أوتوماتيك`
    });

    // 5. Cabin
    const cabinPrice = (priceConfig.cabins[cabinLevel] || 0) * capacityMult;
    list.push({
        id: 'cabin',
        label: `الكابينة والديكور: ${cabinLevel}`,
        category: 'material',
        unitPrice: cabinPrice,
        quantity: count,
        total: cabinPrice * count,
        description: 'شامل الأرضيات والسقف المستعار والإضاءة'
    });

    // 6. Installation (Labor)
    const laborPerElevator = priceConfig.installationBase + (stops * priceConfig.installationPerStop);
    list.push({
        id: 'labor',
        label: 'أجور التركيب والعمالة',
        category: 'labor',
        unitPrice: laborPerElevator,
        quantity: count,
        total: laborPerElevator * count,
        description: 'شامل التركيب الميكانيكي والكهربائي والتشغيل'
    });

    return list;
  }, [elevatorCount, stops, capacity, machineBrand, controlBrand, doorBrand, cabinLevel, priceConfig]);

  // Totals Calculation
  const materialCost = breakdown.filter(i => i.category === 'material').reduce((s, i) => s + i.total, 0);
  const laborCost = breakdown.filter(i => i.category === 'labor').reduce((s, i) => s + i.total, 0);
  const costTotal = materialCost + laborCost;
  
  const marginAmount = costTotal * (priceConfig.profitMarginPercent / 100);
  const priceBeforeTax = costTotal + marginAmount;
  const taxAmount = priceBeforeTax * 0.15;
  const finalPrice = priceBeforeTax + taxAmount;

  return (
    <div className="flex-1 bg-gray-100 p-8 overflow-auto h-full animate-fade-in">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Panel */}
          <div className="lg:col-span-4 space-y-6">
              
              {/* Header Card */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-black text-jilco-900 flex items-center gap-2"><Calculator size={20} className="text-gold-500"/> مدخلات المشروع</h3>
                      <button onClick={() => setShowSettings(true)} className="p-2 bg-gray-50 text-gray-500 hover:text-jilco-600 rounded-full transition-colors" title="إعدادات التسعير">
                          <Settings size={18}/>
                      </button>
                  </div>
                  
                  {warnings.length > 0 && (
                      <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 leading-relaxed">
                          {warnings.map((w, i) => <div key={i} className="flex gap-2"><AlertTriangle size={14} className="shrink-0 mt-0.5"/> {w}</div>)}
                      </div>
                  )}

                  <div className="space-y-5">
                      {/* Quantity & Stops */}
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">عدد المصاعد</label>
                              <div className="flex items-center gap-2">
                                <button onClick={() => setElevatorCount(Math.max(1, elevatorCount - 1))} className="w-8 h-8 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">-</button>
                                <span className="flex-1 text-center font-black text-lg text-jilco-900 bg-gray-50 py-1 rounded-lg border border-gray-100">{elevatorCount}</span>
                                <button onClick={() => setElevatorCount(elevatorCount + 1)} className="w-8 h-8 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">+</button>
                              </div>
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">عدد الوقفات ({stops})</label>
                              <input type="range" min="2" max="25" value={stops} onChange={e => setStops(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-jilco-600 mt-3" />
                          </div>
                      </div>

                      {/* Capacity */}
                      <div>
                          <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">الحمولة / عدد الأشخاص</label>
                          <select value={capacity} onChange={e => setCapacity(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-jilco-500">
                              {Object.keys(priceConfig.capacityMultipliers).map(k => <option key={k} value={k}>{k}</option>)}
                          </select>
                      </div>
                  </div>
              </div>

              {/* Specs Card */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                  <h3 className="font-black text-sm text-gray-800 mb-4 flex items-center gap-2"><Cpu size={18} className="text-jilco-600"/> المواصفات الفنية</h3>
                  <div className="space-y-3">
                      <div>
                          <label className="text-[10px] font-bold text-gray-400 mb-1 block">نوع الماكينة</label>
                          <select value={machineBrand} onChange={e => setMachineBrand(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-bold bg-gray-50 outline-none">
                              {Object.keys(priceConfig.machines).map(k => <option key={k} value={k}>{k}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="text-[10px] font-bold text-gray-400 mb-1 block">نظام التحكم (Controller)</label>
                          <select value={controlBrand} onChange={e => setControlBrand(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-bold bg-gray-50 outline-none">
                              {Object.keys(priceConfig.controls).map(k => <option key={k} value={k}>{k}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="text-[10px] font-bold text-gray-400 mb-1 block">نوع الأبواب</label>
                          <select value={doorBrand} onChange={e => setDoorBrand(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-bold bg-gray-50 outline-none">
                              {Object.keys(priceConfig.doors).map(k => <option key={k} value={k}>{k}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="text-[10px] font-bold text-gray-400 mb-1 block">ديكور الكابينة</label>
                          <select value={cabinLevel} onChange={e => setCabinLevel(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-bold bg-gray-50 outline-none">
                              {Object.keys(priceConfig.cabins).map(k => <option key={k} value={k}>{k}</option>)}
                          </select>
                      </div>
                  </div>
              </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-8 flex flex-col space-y-6">
              
              {/* Grand Total Banner */}
              <div className="bg-jilco-900 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                  
                  <div className="text-center md:text-right relative z-10">
                      <p className="text-gold-400 font-bold text-xs mb-2 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                          <Award size={14}/> إجمالي العرض النهائي
                      </p>
                      <h2 className="text-5xl lg:text-6xl font-black font-mono tracking-tighter flex items-baseline gap-2">
                        {finalPrice.toLocaleString()} 
                        <span className="text-lg font-bold text-white/40 uppercase">SAR</span>
                      </h2>
                      <p className="text-[10px] text-gray-400 mt-2">السعر يشمل الضريبة 15% والتركيب والضمان</p>
                  </div>

                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10 min-w-[200px]">
                      <div className="flex justify-between items-center mb-2 text-xs text-gray-300">
                          <span>التكلفة (مواد+عمل)</span>
                          <span className="font-mono">{costTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2 text-xs text-green-300">
                          <span>الربح التقديري ({priceConfig.profitMarginPercent}%)</span>
                          <span className="font-mono">{marginAmount.toLocaleString()}</span>
                      </div>
                      <div className="h-px bg-white/20 my-2"></div>
                      <div className="flex justify-between items-center text-sm font-bold">
                          <span>الضريبة (VAT)</span>
                          <span className="font-mono text-gold-400">{taxAmount.toLocaleString()}</span>
                      </div>
                  </div>
              </div>

              {/* Detailed Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 text-sm">تفاصيل التكاليف الفنية</h3>
                      <button onClick={() => window.print()} className="text-xs text-gray-500 hover:text-jilco-600 flex items-center gap-1"><Printer size={14}/> طباعة التقرير</button>
                  </div>
                  
                  <div className="overflow-auto flex-1">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-white text-gray-500 font-bold text-xs uppercase tracking-wider border-b border-gray-200">
                            <tr>
                                <th className="p-4 w-1/2">البند / الوصف</th>
                                <th className="p-4 text-center">النوع</th>
                                <th className="p-4 text-center">سعر الوحدة</th>
                                <th className="p-4 text-center">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {breakdown.map((item) => (
                                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-4">
                                        <p className="font-bold text-gray-800 text-sm mb-0.5">{item.label}</p>
                                        <p className="text-[10px] text-gray-400">{item.description}</p>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${item.category === 'material' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {item.category === 'material' ? 'توريد' : 'تركيب'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center font-mono text-gray-600 text-xs">
                                        {item.unitPrice.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-center font-bold text-jilco-900 font-mono">
                                        {item.total.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t border-gray-200">
                            <tr>
                                <td colSpan={3} className="p-4 font-bold text-gray-600">المجموع الفرعي للتكاليف (بدون هامش ربح)</td>
                                <td className="p-4 text-center font-bold text-lg font-mono text-gray-800">{costTotal.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                  </div>
              </div>
          </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        config={priceConfig}
        onSave={saveConfig}
      />
    </div>
  );
};
