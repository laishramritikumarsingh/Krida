import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Flame,
  Droplets,
  Zap,
  ShieldAlert,
  Sparkles,
  Send,
  Brain,
  Check,
  Plus,
  Trash2,
  Search,
  Layers,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { NutritionPlan, FoodItem, DailyNutritionSummary } from '../types';

export const NutritionPage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'logger' | 'foods' | 'planner' | 'ask'>('logger');
  const [nutrition, setNutrition] = useState<NutritionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  // Daily summary & logging state
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [dailySummary, setDailySummary] = useState<DailyNutritionSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Food catalogue state
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [foodSearch, setFoodSearch] = useState('');
  const [selectedFoodCategory, setSelectedFoodCategory] = useState('All');

  // Quick log modal / form state
  const [quickLogItem, setQuickLogItem] = useState<FoodItem | null>(null);
  const [quickMealType, setQuickMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Breakfast');
  const [quickServings, setQuickServings] = useState<number>(1.0);
  const [logSuccessMsg, setLogSuccessMsg] = useState<string | null>(null);

  // AI Meal Planner state
  const [dietPref, setDietPref] = useState('Vegetarian');
  const [foodRestrictions, setFoodRestrictions] = useState<string[]>([]);
  const [cuisine, setCuisine] = useState('Indian');
  const [mealSchedule, setMealSchedule] = useState('4 meals (Breakfast, Lunch, Pre-Workout, Dinner)');
  const [planGoal, setPlanGoal] = useState('Muscle Gain');
  const [isGeneratingMeals, setIsGeneratingMeals] = useState(false);
  const [generatedMealPlan, setGeneratedMealPlan] = useState<any>(null);

  // Ask AI Q&A state
  const [question, setQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<{
    answer: string;
    sources: any[];
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchBaseData = async () => {
    setLoading(true);
    try {
      const [nutRes, foodsRes] = await Promise.all([
        api.nutrition.get().catch(() => null),
        api.nutrition.getFoods().catch(() => []),
      ]);
      if (nutRes) setNutrition(nutRes);
      if (Array.isArray(foodsRes)) setFoodItems(foodsRes);
    } catch (err) {
      console.error('Failed to load nutrition data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailySummary = async (dateStr: string) => {
    setSummaryLoading(true);
    try {
      const res = await api.nutrition.getSummary(dateStr);
      setDailySummary(res);
    } catch (err) {
      console.error('Failed to load daily summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      fetchBaseData();
    } else {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    fetchDailySummary(selectedDate);
  }, [authLoading, isAuthenticated, selectedDate]);

  // Log a selected food item
  const handleLogFood = async () => {
    if (!quickLogItem) return;
    try {
      await api.nutrition.logEntry({
        food_item_id: quickLogItem.id,
        food_name: quickLogItem.name,
        meal_type: quickMealType,
        quantity_servings: quickServings,
        calories: Math.round(quickLogItem.calories * quickServings),
        protein_g: Math.round(quickLogItem.protein_g * quickServings * 10) / 10,
        carbs_g: Math.round(quickLogItem.carbs_g * quickServings * 10) / 10,
        fat_g: Math.round(quickLogItem.fat_g * quickServings * 10) / 10,
        logged_date: selectedDate,
      });

      setLogSuccessMsg(`Logged ${quickLogItem.name} (${quickServings} serving) to ${quickMealType}!`);
      setTimeout(() => setLogSuccessMsg(null), 3500);
      setQuickLogItem(null);
      fetchDailySummary(selectedDate);
    } catch (err) {
      console.error('Failed to log food:', err);
    }
  };

  // Delete logged entry
  const handleDeleteEntry = async (id: number) => {
    try {
      await api.nutrition.deleteEntry(id);
      fetchDailySummary(selectedDate);
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  // Generate AI meal plan
  const handleGenerateMeals = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingMeals(true);
    try {
      const res = await api.nutrition.generateMeals({
        dietary_preference: dietPref,
        food_restrictions: foodRestrictions,
        cuisine,
        meal_schedule: mealSchedule,
        daily_calories_target: nutrition?.daily_calories || 2400,
        protein_target_g: nutrition?.protein_g || 160,
        goal: planGoal,
      });
      setGeneratedMealPlan(res);
    } catch (err) {
      console.error('Meal planning failed:', err);
    } finally {
      setIsGeneratingMeals(false);
    }
  };

  // Ask AI Q&A
  const handleAskAi = async (qText?: string) => {
    const qToSend = qText || question;
    if (!qToSend.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.nutrition.ask(qToSend);
      setAiAnswer(res);
    } catch (err) {
      console.error('Failed to ask nutrition AI:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // Filter food items
  const filteredFoodItems = foodItems.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(foodSearch.toLowerCase()) ||
      f.category.toLowerCase().includes(foodSearch.toLowerCase());
    const matchesCategory = selectedFoodCategory === 'All' || f.category === selectedFoodCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#D7FF43] border-t-transparent animate-spin" />
        <div className="text-xs font-mono font-bold text-[#88A8C8] uppercase tracking-wider">
          Calibrating Nutritional Partitions...
        </div>
      </div>
    );
  }

  // Targets from plan
  const targetCal = dailySummary?.target_calories || nutrition?.daily_calories || 2400;
  const targetP = dailySummary?.target_protein || nutrition?.protein_g || 160;
  const targetC = dailySummary?.target_carbs || nutrition?.carbs_g || 270;
  const targetF = dailySummary?.target_fat || nutrition?.fat_g || 75;

  const currentCal = dailySummary?.total_calories || 0;
  const currentP = dailySummary?.total_protein || 0;
  const currentC = dailySummary?.total_carbs || 0;
  const currentF = dailySummary?.total_fat || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16 pt-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#222711] border border-[#3d471d] text-xs font-mono font-bold text-[#D7FF43] mb-2">
            <Flame className="w-3.5 h-3.5" />
            <span>07 • ATHLETIC FUELING & MACRONUTRIENT PARTITIONING</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Diet, Nutrition & Indian Food Tracker
          </h1>
          <p className="text-sm text-[#88A8C8] mt-0.5">
            Mifflin-St Jeor TDEE energy balance, verified Indian staple food database, and meal logs.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#0e1113] border border-[#1a1f24]">
          <Calendar className="w-4 h-4 text-[#D7FF43] ml-2" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none pr-2"
          />
        </div>
      </div>

      {/* Prominent Transparent Nutrition Disclaimer */}
      <div className="p-3.5 rounded-2xl bg-[#121618] border border-[#3d471d] text-xs text-[#88A8C8] flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-[#D7FF43] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-white">Estimate & Safety Notice:</strong> All nutritional values and caloric targets are scientific estimates derived from the Indian Food Composition Tables (IFCT) and USDA databases. They are not medical prescriptions. Athletes with metabolic conditions, diabetes, allergies, or clinical dietary needs should consult a qualified dietitian or physician.
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#1a1f24] pb-3">
        {[
          { id: 'logger', label: 'Daily Food Logger & Totals', icon: Utensils },
          { id: 'foods', label: 'Indian Food Database (Transparent Provenance)', icon: Layers },
          { id: 'planner', label: 'AI Meal Suggestion Generator', icon: Sparkles },
          { id: 'ask', label: 'Ask Nutrition AI (Peri-Workout)', icon: Brain },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-[#222711] text-[#D7FF43] border border-[#3d471d] shadow-[0_0_10px_-2px_rgba(215,255,67,0.25)]'
                  : 'bg-[#0e1113] text-[#88A8C8] border border-[#1a1f24] hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: DAILY FOOD LOGGER & TOTALS */}
      {/* ============================================================ */}
      {activeTab === 'logger' && (
        <div className="space-y-6">
          {/* Macronutrient Progress Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Calories */}
            <div className="p-5 rounded-2xl bg-[#0e1113] border border-[#1a1f24] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#88A8C8] uppercase">
                <span>Calories</span>
                <Flame className="w-4 h-4 text-[#D7FF43]" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {currentCal} <span className="text-xs font-normal text-[#88A8C8]">/ {targetCal} kcal</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#121618] overflow-hidden">
                <div
                  style={{ width: `${Math.min((currentCal / targetCal) * 100, 100)}%` }}
                  className="h-full bg-[#D7FF43] rounded-full"
                />
              </div>
            </div>

            {/* Protein */}
            <div className="p-5 rounded-2xl bg-[#0e1113] border border-[#1a1f24] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#88A8C8] uppercase">
                <span>Protein</span>
                <Utensils className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {currentP}g <span className="text-xs font-normal text-[#88A8C8]">/ {targetP}g</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#121618] overflow-hidden">
                <div
                  style={{ width: `${Math.min((currentP / targetP) * 100, 100)}%` }}
                  className="h-full bg-emerald-400 rounded-full"
                />
              </div>
            </div>

            {/* Carbs */}
            <div className="p-5 rounded-2xl bg-[#0e1113] border border-[#1a1f24] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#88A8C8] uppercase">
                <span>Carbohydrates</span>
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {currentC}g <span className="text-xs font-normal text-[#88A8C8]">/ {targetC}g</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#121618] overflow-hidden">
                <div
                  style={{ width: `${Math.min((currentC / targetC) * 100, 100)}%` }}
                  className="h-full bg-cyan-400 rounded-full"
                />
              </div>
            </div>

            {/* Fat */}
            <div className="p-5 rounded-2xl bg-[#0e1113] border border-[#1a1f24] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#88A8C8] uppercase">
                <span>Fats</span>
                <Droplets className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {currentF}g <span className="text-xs font-normal text-[#88A8C8]">/ {targetF}g</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#121618] overflow-hidden">
                <div
                  style={{ width: `${Math.min((currentF / targetF) * 100, 100)}%` }}
                  className="h-full bg-amber-400 rounded-full"
                />
              </div>
            </div>
          </div>

          {logSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-[#222711] border border-[#3d471d] text-xs font-mono text-[#D7FF43] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {logSuccessMsg}
            </div>
          )}

          {/* Meals Breakdown Sections */}
          <div className="space-y-4">
            {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((mealType) => {
              const entriesForMeal = (dailySummary?.entries || []).filter(
                (e) => e.meal_type.toLowerCase() === mealType.toLowerCase()
              );
              const mealCal = entriesForMeal.reduce((acc, e) => acc + e.calories, 0);
              const mealP = entriesForMeal.reduce((acc, e) => acc + e.protein_g, 0);

              return (
                <div key={mealType} className="p-5 rounded-2xl bg-[#0e1113] border border-[#1a1f24] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white font-mono">{mealType}</h3>
                      <div className="text-[11px] text-[#88A8C8] font-mono mt-0.5">
                        {Math.round(mealCal)} kcal • {Math.round(mealP * 10) / 10}g Protein
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setQuickMealType(mealType);
                        setActiveTab('foods');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#121618] hover:bg-[#222711] border border-[#1e252a] hover:border-[#3d471d] text-xs font-mono font-bold text-[#D7FF43] flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Food
                    </button>
                  </div>

                  {entriesForMeal.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {entriesForMeal.map((entry) => (
                        <div
                          key={entry.id}
                          className="p-3 rounded-xl bg-[#121618] border border-[#1e252a] flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-white">{entry.food_name}</div>
                            <div className="text-[10px] text-[#88A8C8] font-mono mt-0.5">
                              {entry.quantity_servings} serving • {entry.calories} kcal • {entry.protein_g}g P • {entry.carbs_g}g C • {entry.fat_g}g F
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="p-1.5 rounded-lg text-[#88A8C8] hover:text-red-400 hover:bg-white/5"
                            title="Remove entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-[#121618]/50 border border-[#1e252a]/60 text-center text-[11px] text-[#88A8C8] italic">
                      No items logged for {mealType}. Click "+ Add Food" to pick from the Indian food database.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: TRANSPARENT INDIAN FOOD DATABASE */}
      {/* ============================================================ */}
      {activeTab === 'foods' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-[#0e1113] border border-[#1a1f24] space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88A8C8]" />
                <input
                  type="text"
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                  placeholder="Search Indian foods (e.g. Basmati Rice, Dal Tadka, Paneer, Curd, Roti, Soya)..."
                  className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#88A8C8]/60 focus:outline-none"
                />
              </div>

              <select
                value={selectedFoodCategory}
                onChange={(e) => setSelectedFoodCategory(e.target.value)}
                className="bg-[#121618] border border-[#1e252a] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
              >
                {['All', 'Grains', 'Pulses', 'Dairy', 'Meat/Eggs', 'Fruits/Veg', 'Soya/Protein'].map((c) => (
                  <option key={c} value={c}>
                    Category: {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFoodItems.map((food) => (
              <div
                key={food.id}
                className="p-5 rounded-2xl bg-[#0e1113] border border-[#1a1f24] hover:border-[#D7FF43]/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222711] text-[#D7FF43] border border-[#3d471d]">
                      {food.category}
                    </span>
                    <span className="text-[10px] font-mono text-[#88A8C8]">{food.serving_size}</span>
                  </div>

                  <h4 className="text-base font-bold text-white">{food.name}</h4>

                  {/* Macros grid */}
                  <div className="grid grid-cols-4 gap-1.5 text-center mt-3 p-2 rounded-xl bg-[#121618] border border-[#1e252a] font-mono text-xs">
                    <div>
                      <div className="text-[#D7FF43] font-bold">{Math.round(food.calories)}</div>
                      <div className="text-[9px] text-[#88A8C8]">kcal</div>
                    </div>
                    <div>
                      <div className="text-emerald-400 font-bold">{food.protein_g}g</div>
                      <div className="text-[9px] text-[#88A8C8]">Protein</div>
                    </div>
                    <div>
                      <div className="text-cyan-400 font-bold">{food.carbs_g}g</div>
                      <div className="text-[9px] text-[#88A8C8]">Carbs</div>
                    </div>
                    <div>
                      <div className="text-amber-400 font-bold">{food.fat_g}g</div>
                      <div className="text-[9px] text-[#88A8C8]">Fat</div>
                    </div>
                  </div>

                  <div className="mt-2.5 text-[10px] font-mono text-[#88A8C8] leading-tight">
                    <div>Provenance: <span className="text-zinc-300">{food.provenance}</span></div>
                    {food.allergens && food.allergens !== 'None' && (
                      <div className="text-amber-400/90 mt-0.5">Allergens: {food.allergens}</div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setQuickLogItem(food)}
                  className="w-full py-2 rounded-xl bg-[#121618] hover:bg-[#222711] border border-[#1e252a] hover:border-[#3d471d] text-xs font-mono font-bold text-white hover:text-[#D7FF43] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Log to Meal
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUICK LOG MODAL */}
      {quickLogItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0e1113] border border-[#3d471d] rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1a1f24]">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#D7FF43] uppercase">
                  RECORD FOOD LOG
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">{quickLogItem.name}</h3>
              </div>
              <button
                onClick={() => setQuickLogItem(null)}
                className="text-[#88A8C8] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Target Meal
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setQuickMealType(m)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                        quickMealType === m
                          ? 'bg-[#222711] text-[#D7FF43] border border-[#3d471d]'
                          : 'bg-[#121618] text-[#88A8C8] border border-[#1e252a]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Quantity (Servings of {quickLogItem.serving_size}): {quickServings}x
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="10"
                  value={quickServings}
                  onChange={(e) => setQuickServings(parseFloat(e.target.value) || 1.0)}
                  className="w-full bg-[#121618] border border-[#1e252a] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#121618] border border-[#1e252a] text-xs font-mono flex justify-between text-[#88A8C8]">
                <span>Estimated Energy: <strong className="text-white">{Math.round(quickLogItem.calories * quickServings)} kcal</strong></span>
                <span>Protein: <strong className="text-emerald-400">{Math.round(quickLogItem.protein_g * quickServings * 10) / 10}g</strong></span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setQuickLogItem(null)}
                className="px-4 py-2 rounded-xl bg-[#121618] border border-[#1e252a] text-xs text-[#88A8C8] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleLogFood}
                className="px-5 py-2 rounded-xl bg-[#D7FF43] hover:brightness-110 text-black text-xs font-extrabold flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Confirm & Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: AI MEAL SUGGESTION GENERATOR */}
      {/* ============================================================ */}
      {activeTab === 'planner' && (
        <div className="p-6 rounded-2xl bg-[#0e1113] border border-[#3d471d] shadow-[0_0_20px_-5px_rgba(215,255,67,0.15)] space-y-6">
          <div className="pb-4 border-b border-[#1a1f24]">
            <span className="text-[10px] font-mono font-bold text-[#D7FF43] uppercase tracking-wider">
              INDIAN REGIONAL & SPORTS NUTRITION SYNTHESIZER
            </span>
            <h2 className="text-2xl font-black text-white mt-0.5">Generate Tailored Meal Suggestions</h2>
            <p className="text-xs text-[#88A8C8] mt-1 leading-relaxed">
              Provides practical, high-protein Indian meal plans with transparent calorie, protein, and allergen disclosures. Avoids extreme crash diets or unsupported supplements.
            </p>
          </div>

          <form onSubmit={handleGenerateMeals} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Dietary Preference
                </label>
                <select
                  value={dietPref}
                  onChange={(e) => setDietPref(e.target.value)}
                  className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                >
                  <option value="Vegetarian">Vegetarian (Lacto-Vegetarian)</option>
                  <option value="Non-Vegetarian">Non-Vegetarian (Poultry/Eggs/Fish)</option>
                  <option value="Eggetarian">Eggetarian</option>
                  <option value="Vegan">Vegan (Plant-Based)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Cuisine Foundation
                </label>
                <select
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                >
                  <option value="Indian (North & South staples)">Indian (North & South staples)</option>
                  <option value="Mediterranean & High Protein">Mediterranean & High Protein</option>
                  <option value="Global Fitness Macro Split">Global Fitness Macro Split</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Athletic Objective
                </label>
                <select
                  value={planGoal}
                  onChange={(e) => setPlanGoal(e.target.value)}
                  className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                >
                  <option value="Muscle Gain">Muscle Gain (Hypertrophy Surplus)</option>
                  <option value="Fat Loss">Fat Loss (Moderate Caloric Deficit)</option>
                  <option value="Sports Performance & HYROX">Sports Performance & HYROX</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Daily Meal Frequency
                </label>
                <select
                  value={mealSchedule}
                  onChange={(e) => setMealSchedule(e.target.value)}
                  className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                >
                  <option value="3 meals (Breakfast, Lunch, Dinner)">3 meals (Breakfast, Lunch, Dinner)</option>
                  <option value="4 meals (Breakfast, Lunch, Pre-Workout, Dinner)">4 meals (Breakfast, Lunch, Pre-Workout, Dinner)</option>
                  <option value="5 meals (Frequent Protein Pacing)">5 meals (Frequent Protein Pacing)</option>
                </select>
              </div>
            </div>

            {/* Restrictions */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-2">
                Food Restrictions & Allergies
              </label>
              <div className="flex flex-wrap gap-2">
                {['Lactose Intolerant', 'Nut Allergy', 'Gluten Sensitive', 'Soy Free', 'Low FODMAP'].map((r) => {
                  const isChecked = foodRestrictions.includes(r);
                  return (
                    <button
                      type="button"
                      key={r}
                      onClick={() =>
                        setFoodRestrictions((prev) =>
                          prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        isChecked
                          ? 'bg-[#222711] text-[#D7FF43] border border-[#3d471d]'
                          : 'bg-[#121618] text-[#88A8C8] border border-[#1e252a]'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div className="text-[11px] font-mono text-[#88A8C8]">
                Uses server-side Gemini/OpenAI if configured; otherwise provides verified evidence-based fallback.
              </div>
              <button
                type="submit"
                disabled={isGeneratingMeals}
                className="px-6 py-3 rounded-xl bg-[#D7FF43] hover:brightness-110 text-black text-xs font-extrabold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(215,255,67,0.3)] disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isGeneratingMeals ? 'Synthesizing Meals...' : 'Generate Meal Suggestions'}
              </button>
            </div>
          </form>

          {/* Generated Result Output */}
          {generatedMealPlan && (
            <div className="p-5 rounded-2xl bg-[#121618] border border-[#3d471d] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#1e252a]">
                <span className="text-xs font-mono font-bold text-[#D7FF43] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Meal Protocol Generated
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222711] text-[#D7FF43] border border-[#3d471d]">
                  Engine: {generatedMealPlan.engine_label}
                </span>
              </div>

              <div className="text-xs text-zinc-200 leading-relaxed font-mono whitespace-pre-wrap">
                {generatedMealPlan.meal_plan_text}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: ASK NUTRITION AI */}
      {/* ============================================================ */}
      {activeTab === 'ask' && (
        <div className="p-6 rounded-2xl bg-[#0e1113] border border-[#1a1f24] space-y-6">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#D7FF43] uppercase tracking-wider">
              PERI-WORKOUT & METABOLIC SCIENCE ASSISTANT
            </span>
            <h2 className="text-2xl font-black text-white mt-0.5">Ask Nutrition AI</h2>
            <p className="text-xs text-[#88A8C8] mt-1">
              Ask about glycogen timing, protein synthesis thresholds, pre-workout meals, or hydration.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
              placeholder="e.g. What should I eat 90 minutes before heavy squats?"
              className="flex-1 bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-4 py-3 text-xs text-white placeholder-[#88A8C8]/60 focus:outline-none"
            />
            <button
              onClick={() => handleAskAi()}
              disabled={aiLoading}
              className="px-6 py-3 rounded-xl bg-[#D7FF43] hover:brightness-110 text-black text-xs font-extrabold transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {aiLoading ? 'Thinking...' : 'Ask'}
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              'How much protein per kg bodyweight for hypertrophy?',
              'Best Indian vegetarian post-workout meal options?',
              'How to structure intra-workout electrolytes for HYROX?',
            ].map((p, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuestion(p);
                  handleAskAi(p);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#121618] border border-[#1e252a] text-[#88A8C8] hover:text-[#D7FF43] text-[11px] font-mono transition-colors"
              >
                "{p}"
              </button>
            ))}
          </div>

          {aiAnswer && (
            <div className="p-5 rounded-2xl bg-[#121618] border border-[#3d471d] space-y-3">
              <div className="text-xs font-mono font-bold text-[#D7FF43] flex items-center gap-1.5">
                <Brain className="w-4 h-4" />
                KRIDA Sports Nutrition Response
              </div>
              <div className="text-xs text-zinc-200 leading-relaxed font-mono whitespace-pre-wrap">
                {aiAnswer.answer}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
