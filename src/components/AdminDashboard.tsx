
import React, { useState, useMemo, useEffect } from 'react';
import { Service, Booking, Question, QuestionType, UserRole } from '../types';
import { INITIAL_SERVICES } from '../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  LayoutDashboard, Package, ShoppingCart, Tag, Users, Star, 
  Plus, Trash2, Edit3, Search, Filter, ChevronRight, 
  TrendingUp, DollarSign, Calendar, CheckCircle2, Clock, XCircle,
  Menu, X, Printer, ClipboardList, HelpCircle, AlertCircle, CheckCircle
} from 'lucide-react';

interface AdminDashboardProps {
  services: Service[];
  bookings: Booking[];
  categories: string[];
  onUpdateCategories: (categories: string[]) => void;
  onAddService: (service: Omit<Service, 'id' | 'bookingCount'>) => void;
  onUpdateService: (service: Service) => void;
  onDeleteService: (id: string) => void;
  onUpdateStatus: (bookingId: string, newStatus: Booking['status']) => void;
  onPrintReceipt: (booking: Booking) => void;
  onBulkUpdateServices?: (updatedServices: Service[]) => void;
  onLogout: () => void;
  language: 'en' | 'ar';
  onLanguageChange: (lang: 'en' | 'ar') => void;
  t: (key: any) => string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  services, 
  bookings, 
  categories, 
  onUpdateCategories, 
  onAddService, 
  onUpdateService,
  onDeleteService, 
  onUpdateStatus,
  onPrintReceipt,
  onBulkUpdateServices,
  onLogout,
  language,
  onLanguageChange,
  t
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'orders' | 'categories' | 'customers' | 'analytics'>('overview');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ old: string, new: string } | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState<Booking['status'] | 'All'>('All');
  const [selectedOrder, setSelectedOrder] = useState<Booking | null>(null);
  const [categoryError, setCategoryError] = useState('');
  const [showCategorySuccess, setShowCategorySuccess] = useState(false);
  const [isInlineAddingCategory, setIsInlineAddingCategory] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  
  const [newService, setNewService] = useState<{
    name: string;
    nameAr: string;
    price: number;
    description: string;
    descriptionAr: string;
    category: string;
    categoryAr: string;
    questions: Question[];
  }>({
    name: '',
    nameAr: '',
    price: 0,
    description: '',
    descriptionAr: '',
    category: categories[0] || '',
    categoryAr: '',
    questions: [],
  });

  // Ensure newService.category is set if it's empty but categories exist
  useEffect(() => {
    if (!newService.category && categories.length > 0) {
      setNewService(prev => ({ ...prev, category: categories[0] }));
    }
  }, [categories, newService.category]);

  // --- ANALYTICS DATA ---
  const stats = useMemo(() => {
    const totalRevenue = bookings.reduce((acc, b) => acc + b.totalPrice, 0);
    const completedOrders = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed').length;
    const pendingOrders = bookings.filter(b => b.status === 'Pending').length;
    
    // Revenue by category
    const revByCat = categories.map(cat => {
      const revenue = bookings.reduce((acc, b) => {
        const catItems = b.items.filter(item => item.category === cat);
        return acc + catItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      }, 0);
      return { name: cat, value: revenue };
    }).filter(c => c.value > 0);

    // Bookings over time (last 7 days)
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const count = bookings.filter(b => new Date(b.timestamp).toISOString().split('T')[0] === dateStr).length;
      return { name: dateStr.split('-').slice(1).join('/'), count };
    });

    return { totalRevenue, completedOrders, pendingOrders, revByCat, last7Days };
  }, [bookings, categories]);

  const moreInfoAnalytics = useMemo(() => {
    const aggregated: { [serviceId: string]: { serviceName: string, questions: { [qLabel: string]: { [answer: string]: number } } } } = {};

    bookings.forEach(b => {
      if (b.serviceAnswers) {
        b.serviceAnswers.forEach(sa => {
          if (!aggregated[sa.serviceId]) {
            aggregated[sa.serviceId] = { serviceName: sa.serviceName, questions: {} };
          }
          sa.answers.forEach(ans => {
            if (!aggregated[sa.serviceId].questions[ans.questionLabel]) {
              aggregated[sa.serviceId].questions[ans.questionLabel] = {};
            }
            const answerStr = Array.isArray(ans.answer) ? ans.answer.join(', ') : ans.answer;
            if (answerStr) {
              aggregated[sa.serviceId].questions[ans.questionLabel][answerStr] = (aggregated[sa.serviceId].questions[ans.questionLabel][answerStr] || 0) + 1;
            }
          });
        });
      }
    });

    return aggregated;
  }, [bookings]);

  const uniqueCustomers = useMemo(() => {
    const customersMap = new Map<string, { name: string, phone: string, totalSpent: number, bookingsCount: number }>();
    bookings.forEach(b => {
      const existing = customersMap.get(b.customerName);
      if (existing) {
        existing.totalSpent += b.totalPrice;
        existing.bookingsCount += 1;
      } else {
        customersMap.set(b.customerName, { 
          name: b.customerName, 
          phone: b.customerPhone, 
          totalSpent: b.totalPrice, 
          bookingsCount: 1 
        });
      }
    });
    return Array.from(customersMap.values());
  }, [bookings]);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // --- HANDLERS ---
  const handleAddCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategory.trim();
    if (!trimmed) {
      setCategoryError('Category name cannot be empty');
      return;
    }
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      setCategoryError('Category already exists');
      return;
    }
    onUpdateCategories([...categories, trimmed]);
    setNewCategory('');
    setCategoryError('');
    setShowCategorySuccess(true);
    setTimeout(() => setShowCategorySuccess(false), 3000);
    setIsInlineAddingCategory(false);
  };

  const confirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    
    const cat = categoryToDelete;
    let nextCategories = categories.filter(c => c !== cat);
    
    if (onBulkUpdateServices) {
      const hasServicesInDeletedCat = services.some(s => s.category === cat);
      if (hasServicesInDeletedCat) {
        const updatedServices = services.map(s => 
          s.category === cat ? { ...s, category: 'Uncategorized' } : s
        );
        onBulkUpdateServices(updatedServices);
        
        if (!nextCategories.includes('Uncategorized')) {
          nextCategories.push('Uncategorized');
        }
      }
    }
    
    onUpdateCategories(nextCategories);
    setCategoryToDelete(null);
  };

  const handleEditCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    
    const trimmed = editingCategory.new.trim();
    if (!trimmed) {
      setCategoryError('Category name cannot be empty');
      return;
    }
    
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase() && c !== editingCategory.old)) {
      setCategoryError('Category name already exists');
      return;
    }

    const updatedCategories = categories.map(c => c === editingCategory.old ? trimmed : c);
    onUpdateCategories(updatedCategories);

    if (onBulkUpdateServices) {
      const updatedServices = services.map(s => 
        s.category === editingCategory.old ? { ...s, category: trimmed } : s
      );
      onBulkUpdateServices(updatedServices);
    }

    setEditingCategory(null);
    setCategoryError('');
  };

  const handleAddQuestion = (isEditing: boolean) => {
    const newQ: Question = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'short_answer',
      label: '',
      labelAr: '',
      required: false,
      options: [],
      optionsAr: []
    };
    if (isEditing && editingService) {
      setEditingService({
        ...editingService,
        questions: [...(editingService.questions || []), newQ]
      });
    } else {
      setNewService({
        ...newService,
        questions: [...newService.questions, newQ]
      });
    }
  };

  const handleUpdateQuestion = (isEditing: boolean, qId: string, updates: Partial<Question>) => {
    if (isEditing && editingService) {
      setEditingService({
        ...editingService,
        questions: (editingService.questions || []).map(q => q.id === qId ? { ...q, ...updates } : q)
      });
    } else {
      setNewService({
        ...newService,
        questions: newService.questions.map(q => q.id === qId ? { ...q, ...updates } : q)
      });
    }
  };

  const handleRemoveQuestion = (isEditing: boolean, qId: string) => {
    if (isEditing && editingService) {
      setEditingService({
        ...editingService,
        questions: (editingService.questions || []).filter(q => q.id !== qId)
      });
    } else {
      setNewService({
        ...newService,
        questions: newService.questions.filter(q => q.id !== qId)
      });
    }
  };

  const handleAddOption = (isEditing: boolean, qId: string) => {
    if (isEditing && editingService) {
      setEditingService({
        ...editingService,
        questions: (editingService.questions || []).map(q => q.id === qId ? { ...q, options: [...(q.options || []), ''], optionsAr: [...(q.optionsAr || []), ''] } : q)
      });
    } else {
      setNewService({
        ...newService,
        questions: newService.questions.map(q => q.id === qId ? { ...q, options: [...(q.options || []), ''], optionsAr: [...(q.optionsAr || []), ''] } : q)
      });
    }
  };

  const handleUpdateOption = (isEditing: boolean, qId: string, optIdx: number, val: string, isAr: boolean = false) => {
    if (isEditing && editingService) {
      setEditingService({
        ...editingService,
        questions: (editingService.questions || []).map(q => {
          if (q.id === qId) {
            if (isAr) {
              const newOptsAr = [...(q.optionsAr || [])];
              newOptsAr[optIdx] = val;
              return { ...q, optionsAr: newOptsAr };
            } else {
              const newOpts = [...(q.options || [])];
              newOpts[optIdx] = val;
              return { ...q, options: newOpts };
            }
          }
          return q;
        })
      });
    } else {
      setNewService({
        ...newService,
        questions: newService.questions.map(q => {
          if (q.id === qId) {
            if (isAr) {
              const newOptsAr = [...(q.optionsAr || [])];
              newOptsAr[optIdx] = val;
              return { ...q, optionsAr: newOptsAr };
            } else {
              const newOpts = [...(q.options || [])];
              newOpts[optIdx] = val;
              return { ...q, options: newOpts };
            }
          }
          return q;
        })
      });
    }
  };

  const handleRemoveOption = (isEditing: boolean, qId: string, optIdx: number) => {
    if (isEditing && editingService) {
      setEditingService({
        ...editingService,
        questions: (editingService.questions || []).map(q => {
          if (q.id === qId) {
            return { 
              ...q, 
              options: (q.options || []).filter((_, i) => i !== optIdx),
              optionsAr: (q.optionsAr || []).filter((_, i) => i !== optIdx)
            };
          }
          return q;
        })
      });
    } else {
      setNewService({
        ...newService,
        questions: newService.questions.map(q => {
          if (q.id === qId) {
            return { 
              ...q, 
              options: (q.options || []).filter((_, i) => i !== optIdx),
              optionsAr: (q.optionsAr || []).filter((_, i) => i !== optIdx)
            };
          }
          return q;
        })
      });
    }
  };

  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name || newService.price <= 0 || !newService.category) {
      setAdminError('Please fill in all fields correctly.');
      setTimeout(() => setAdminError(''), 5000);
      return;
    }
    onAddService(newService);
    setIsAddingService(false);
    setNewService({ 
      name: '', 
      nameAr: '',
      price: 0, 
      description: '', 
      descriptionAr: '',
      category: categories[0] || '', 
      categoryAr: '',
      questions: [],
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      onUpdateService(editingService);
      setEditingService(null);
    }
  };

  const filteredOrders = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           b.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = orderFilter === 'All' || b.status === orderFilter;
      return matchesSearch && matchesFilter;
    });
  }, [bookings, searchQuery, orderFilter]);

  const filteredServices = useMemo(() => {
    return services.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nameAr && s.nameAr.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.categoryAr && s.categoryAr.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [services, searchQuery]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50/50 lg:gap-8 animate-in fade-in duration-700 pb-24 lg:pb-0">
      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-12 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 z-50 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        {[
          { id: 'overview', label: t('overview'), icon: LayoutDashboard },
          { id: 'orders', label: t('orders'), icon: ShoppingCart },
          { id: 'services', label: t('services'), icon: Package },
          { id: 'analytics', label: t('analytics'), icon: TrendingUp },
          { id: 'more', label: language === 'ar' ? 'المزيد' : 'More', icon: Menu },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'more') {
                setIsMenuOpen(!isMenuOpen);
              } else {
                setActiveTab(item.id as any);
                setIsMenuOpen(false);
              }
            }}
            className={`flex flex-col items-center gap-1 transition-all ${
              (activeTab === item.id || (item.id === 'more' && isMenuOpen))
              ? 'text-indigo-600' 
              : 'text-gray-400'
            }`}
          >
            <item.icon size={22} strokeWidth={(activeTab === item.id || (item.id === 'more' && isMenuOpen)) ? 2.5 : 2} />
            <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Mobile More Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-300" onClick={() => setIsMenuOpen(false)}>
          <div 
            className="absolute bottom-32 left-4 right-4 bg-white rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'categories', label: language === 'ar' ? 'الفئات' : 'Categories', icon: Tag },
                { id: 'customers', label: language === 'ar' ? 'العملاء' : 'Customers', icon: Users },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMenuOpen(false);
                  }}
                  className={`flex flex-col items-center gap-3 p-6 rounded-3xl transition-all ${
                    activeTab === item.id ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-600'
                  }`}
                >
                  <item.icon size={24} />
                  <span className="text-xs font-bold">{item.label}</span>
                </button>
              ))}
              <button
                onClick={onLogout}
                className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-red-50 text-red-600"
              >
                <XCircle size={24} />
                <span className="text-xs font-bold">{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation (Desktop Only) */}
      <aside className="hidden lg:block w-72 space-y-2">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 ml-4">{language === 'ar' ? 'القائمة الرئيسية' : 'Main Menu'}</p>
          {[
            { id: 'overview', label: t('overview'), icon: LayoutDashboard },
            { id: 'services', label: t('services'), icon: Package },
            { id: 'orders', label: t('orders'), icon: ShoppingCart },
            { id: 'categories', label: language === 'ar' ? 'الفئات' : 'Categories', icon: Tag },
            { id: 'customers', label: language === 'ar' ? 'العملاء' : 'Customers', icon: Users },
            { id: 'analytics', label: t('analytics'), icon: TrendingUp },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setSearchQuery('');
                setIsMenuOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                activeTab === item.id 
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-gray-50">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all"
            >
              <XCircle size={20} />
              {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 space-y-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-gray-900 capitalize">
                {activeTab === 'overview' ? t('overview') : activeTab.replace('_', ' ')}
              </h1>
              <p className="text-gray-400 text-xs lg:text-sm font-medium">{language === 'ar' ? 'عمليات المنصة.' : 'Platform operations.'}</p>
            </div>
          </div>
          
          {(activeTab === 'services' || activeTab === 'orders') && (
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="text" 
                placeholder={`${language === 'ar' ? 'بحث' : 'Search'} ${activeTab}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-bold"
              />
            </div>
          )}
        </header>

        {/* Tab Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue', value: `${stats.totalRevenue.toFixed(2)} ${t('sar')}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: language === 'ar' ? 'إجمالي الحجوزات' : 'Total Bookings', value: bookings.length, icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: language === 'ar' ? 'إجمالي العملاء' : 'Total Customers', value: uniqueCustomers.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-6`}>
                      <stat.icon size={24} />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Core Management Section */}
              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                <h3 className="text-xl font-black text-gray-900 mb-8">{language === 'ar' ? 'الإدارة الأساسية' : 'Core Management'}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { id: 'services', label: t('services'), icon: Package, color: 'bg-indigo-50 text-indigo-600', count: services.length },
                    { id: 'orders', label: t('orders'), icon: ShoppingCart, color: 'bg-emerald-50 text-emerald-600', count: bookings.length },
                    { id: 'categories', label: language === 'ar' ? 'الفئات' : 'Categories', icon: Tag, color: 'bg-amber-50 text-amber-600', count: categories.length },
                    { id: 'analytics', label: language === 'ar' ? 'رؤى الاستطلاع' : 'Survey Insights', icon: ClipboardList, color: 'bg-purple-50 text-purple-600', count: Object.keys(moreInfoAnalytics).length },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className="flex flex-col items-center p-8 rounded-[2rem] border border-gray-50 hover:border-indigo-100 hover:shadow-xl transition-all group"
                    >
                      <div className={`${item.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <item.icon size={32} />
                      </div>
                      <span className="font-black text-gray-900 mb-1">{item.label}</span>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.count} {language === 'ar' ? 'عناصر' : 'Items'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Activity Section */}
              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-gray-900">{language === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">{language === 'ar' ? 'عرض جميع الطلبات' : 'View All Orders'}</button>
                </div>
                <div className="space-y-4">
                  {bookings.slice(0, 5).map(booking => (
                    <div key={booking.id} className="flex items-center justify-between p-6 rounded-2xl bg-gray-50 border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <div className="w-6 h-1 bg-indigo-600 rounded-full"></div>
                        </div>
                        <div>
                          <p className="font-black text-gray-900">{booking.customerName}</p>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">#{booking.id.toUpperCase()} • {booking.serviceDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-black text-gray-900">{booking.totalPrice} {t('sar')}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{booking.paymentMethod}</p>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                          booking.status === 'Pending' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                          booking.status === 'Confirmed' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                          booking.status === 'Completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                          'bg-red-50 border-red-100 text-red-600'
                        }`}>
                          {booking.status}
                        </div>
                      </div>
                    </div>
                  ))}
                  {bookings.length === 0 && (
                    <div className="py-10 text-center text-gray-400 font-bold">{language === 'ar' ? 'لا يوجد نشاط أخير.' : 'No recent activity found.'}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      setConfirmModal({
                        show: true,
                        title: language === 'ar' ? 'إصلاح جميع الخدمات' : 'Repair All Services',
                        message: language === 'ar' ? 'سيضمن هذا وجود جميع الخدمات الافتراضية وأن لديها أسئلتها الصحيحة. استمرار؟' : 'This will ensure all default services are present and have their correct questions. Continue?',
                        onConfirm: () => {
                          const existingNames = services.map(s => s.name.toLowerCase());
                          const missing = INITIAL_SERVICES.filter(s => !existingNames.includes(s.name.toLowerCase()));
                          missing.forEach(s => onAddService(s));
                          
                          services.forEach(s => {
                            const initial = INITIAL_SERVICES.find(is => is.name.toLowerCase() === s.name.toLowerCase());
                            if (initial && initial.questions) {
                              onUpdateService({ ...s, questions: initial.questions });
                            }
                          });
                          setAdminSuccess(language === 'ar' ? 'اكتمل الإصلاح! تم فحص وتحديث جميع الخدمات.' : 'Repair complete! All services checked and updated.');
                          setTimeout(() => setAdminSuccess(''), 5000);
                          setConfirmModal(prev => ({ ...prev, show: false }));
                        }
                      });
                    }}
                    className="bg-emerald-50 text-emerald-600 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-3 border border-emerald-100"
                  >
                    <Star size={16} />
                    {language === 'ar' ? 'إصلاح جميع الخدمات' : 'Repair All Services'}
                  </button>
                </div>
                <button 
                  onClick={() => setIsAddingService(!isAddingService)}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3"
                >
                  <Plus size={20} />
                  {language === 'ar' ? 'إضافة خدمة جديدة' : 'Add New Service'}
                </button>
              </div>

              {isAddingService && (
                <div className="bg-white p-10 rounded-[3rem] border-2 border-indigo-100 shadow-2xl animate-in zoom-in-95 duration-300">
                  <form onSubmit={handleServiceSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{language === 'ar' ? 'اسم الخدمة (إنجليزي)' : 'Service Name (EN)'}</label>
                        <input required type="text" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{language === 'ar' ? 'اسم الخدمة (عربي)' : 'Service Name (AR)'}</label>
                        <input required type="text" value={newService.nameAr} onChange={e => setNewService({...newService, nameAr: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-bold" dir="rtl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{language === 'ar' ? 'السعر (ريال)' : 'Price (SAR)'}</label>
                        <input required type="number" value={newService.price} onChange={e => setNewService({...newService, price: Number(e.target.value)})} className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{language === 'ar' ? 'الفئة (إنجليزي)' : 'Category (EN)'}</label>
                        <select value={newService.category} onChange={e => setNewService({...newService, category: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-bold">
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{language === 'ar' ? 'الفئة (عربي)' : 'Category (AR)'}</label>
                        <input type="text" value={newService.categoryAr} onChange={e => setNewService({...newService, categoryAr: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-bold" dir="rtl" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (EN)'}</label>
                        <textarea required value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} className="w-full h-32 px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-bold resize-none" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{language === 'ar' ? 'الوصف (عربي)' : 'Description (AR)'}</label>
                        <textarea required value={newService.descriptionAr} onChange={e => setNewService({...newService, descriptionAr: e.target.value})} className="w-full h-32 px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-bold resize-none" dir="rtl" />
                      </div>

                      {/* Survey / Questions Section */}
                      <div className="md:col-span-2 space-y-6 pt-6 border-t border-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">{language === 'ar' ? 'متطلبات الخدمة (استبيان)' : 'Service Requirements (Survey)'}</h4>
                            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-1">{language === 'ar' ? 'أضف الأسئلة التي يجب على العميل الإجابة عليها عند الحجز.' : 'Add questions the customer must answer when booking.'}</p>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleAddQuestion(false)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                          >
                            <Plus size={14} />
                            {language === 'ar' ? 'إضافة سؤال' : 'Add Question'}
                          </button>
                        </div>

                        <div className="space-y-4">
                          {newService.questions.map((q, qIdx) => (
                            <div key={q.id} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 space-y-4 relative group/q">
                              <button 
                                type="button"
                                onClick={() => handleRemoveQuestion(false, q.id)}
                                className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover/q:opacity-100"
                              >
                                <Trash2 size={16} />
                              </button>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{language === 'ar' ? 'نوع السؤال' : 'Question Type'}</label>
                                  <select 
                                    value={q.type} 
                                    onChange={e => handleUpdateQuestion(false, q.id, { type: e.target.value as any })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-bold"
                                  >
                                    <option value="short_answer">{language === 'ar' ? 'إجابة قصيرة' : 'Short Answer'}</option>
                                    <option value="multiple_choice">{language === 'ar' ? 'اختيار من متعدد' : 'Multiple Choice'}</option>
                                    <option value="multiple_select">{language === 'ar' ? 'تحديد متعدد (MSQ)' : 'Multiple Select (MSQ)'}</option>
                                    <option value="description">{language === 'ar' ? 'وصف / ملاحظة' : 'Description / Note'}</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{language === 'ar' ? 'عنوان السؤال (EN)' : 'Question Label (EN)'}</label>
                                  <input 
                                    type="text" 
                                    value={q.label} 
                                    onChange={e => handleUpdateQuestion(false, q.id, { label: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-bold"
                                    placeholder="e.g. Number of rooms"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{language === 'ar' ? 'عنوان السؤال (AR)' : 'Question Label (AR)'}</label>
                                  <input 
                                    type="text" 
                                    value={q.labelAr || ''} 
                                    onChange={e => handleUpdateQuestion(false, q.id, { labelAr: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-bold"
                                    dir="rtl"
                                    placeholder="مثلاً: عدد الغرف"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={q.required} 
                                    onChange={e => handleUpdateQuestion(false, q.id, { required: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{language === 'ar' ? 'مطلوب' : 'Required'}</span>
                                </label>
                              </div>

                              {(q.type === 'multiple_choice' || q.type === 'multiple_select') && (
                                <div className="space-y-3 pt-4 border-t border-gray-200/50">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{language === 'ar' ? 'الخيارات' : 'Options'}</label>
                                    <button 
                                      type="button" 
                                      onClick={() => handleAddOption(false, q.id)}
                                      className="text-indigo-600 hover:text-indigo-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                                    >
                                      <Plus size={12} /> {language === 'ar' ? 'إضافة خيار' : 'Add Option'}
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {q.options?.map((opt, optIdx) => (
                                      <div key={optIdx} className="flex items-center gap-2">
                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                          <input 
                                            type="text" 
                                            value={opt} 
                                            onChange={e => handleUpdateOption(false, q.id, optIdx, e.target.value)}
                                            className="px-3 py-2 rounded-lg border border-gray-100 bg-white text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                            placeholder={`Option ${optIdx + 1} (EN)`}
                                          />
                                          <input 
                                            type="text" 
                                            value={q.optionsAr?.[optIdx] || ''} 
                                            onChange={e => handleUpdateOption(false, q.id, optIdx, e.target.value, true)}
                                            className="px-3 py-2 rounded-lg border border-gray-100 bg-white text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all text-right"
                                            dir="rtl"
                                            placeholder={`الخيار ${optIdx + 1} (AR)`}
                                          />
                                        </div>
                                        <button 
                                          type="button" 
                                          onClick={() => handleRemoveOption(false, q.id, optIdx)}
                                          className="p-2 text-gray-300 hover:text-red-500"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          {newService.questions.length === 0 && (
                            <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-2xl">
                              <HelpCircle size={24} className="mx-auto text-gray-200 mb-2" />
                              <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">{language === 'ar' ? 'لم يتم إضافة أسئلة بعد' : 'No questions added yet'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setIsAddingService(false)} className="flex-1 bg-gray-100 text-gray-600 py-5 rounded-2xl font-black">{language === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                      <button type="submit" className="flex-[2] bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-indigo-700">{language === 'ar' ? 'نشر الخدمة' : 'Publish Service'}</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-8 py-6">{language === 'ar' ? 'الخدمة' : 'Service'}</th>
                        <th className="px-8 py-6">{language === 'ar' ? 'السعر' : 'Price'}</th>
                        <th className="px-8 py-6 text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredServices.map(service => (
                        <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-6 font-bold text-gray-900">{language === 'ar' && service.nameAr ? service.nameAr : service.name}</td>
                          <td className="px-8 py-6 font-black text-gray-900">{service.price} {t('sar')}</td>
                          <td className="px-8 py-6 text-right flex justify-end gap-2">
                             <button onClick={() => setEditingService(service)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl"><Edit3 size={16} /></button>
                             <button onClick={() => onDeleteService(service.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl"><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-8">
                {/* Orders logic adapted from user code */}
                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-8 py-6">{language === 'ar' ? 'رقم الطلب' : 'Order ID'}</th>
                        <th className="px-8 py-6">{language === 'ar' ? 'العميل' : 'Customer'}</th>
                        <th className="px-8 py-6">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                        <th className="px-8 py-6">{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredOrders.map(order => (
                        <tr key={order.id} onClick={() => setSelectedOrder(order)} className="hover:bg-gray-50 cursor-pointer">
                          <td className="px-8 py-6 font-mono font-black text-indigo-500">#{order.id.slice(0,8).toUpperCase()}</td>
                          <td className="px-8 py-6 font-bold">{order.customerName}</td>
                          <td className="px-8 py-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                              order.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                              order.status === 'Confirmed' ? 'bg-blue-50 text-blue-600' :
                              order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                              'bg-red-50 text-red-600'
                            }`}>{order.status}</span>
                          </td>
                          <td className="px-8 py-6 font-black">{order.totalPrice} {t('sar')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-8">
              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                <h3 className="text-xl font-black text-gray-900 mb-8">{language === 'ar' ? 'إدارة الفئات' : 'Manage Categories'}</h3>
                <form onSubmit={handleAddCategory} className="flex gap-4 mb-10">
                  <input 
                    type="text" 
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    placeholder={language === 'ar' ? 'اسم الفئة الجديدة...' : 'New category name...'}
                    className="flex-1 px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-bold transition-all"
                  />
                  <button type="submit" className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-black transition-all">
                    {language === 'ar' ? 'إضافة' : 'Add'}
                  </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categories.map(cat => (
                    <div key={cat} className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
                      <span className="font-bold text-gray-900">{cat}</span>
                      <button 
                        onClick={() => setCategoryToDelete(cat)} 
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-6">{language === 'ar' ? 'اسم العميل' : 'Customer Name'}</th>
                    <th className="px-8 py-6">{language === 'ar' ? 'الهاتف' : 'Phone'}</th>
                    <th className="px-8 py-6">{language === 'ar' ? 'الحجوزات' : 'Bookings'}</th>
                    <th className="px-8 py-6 text-right">{language === 'ar' ? 'إجمالي الإنفاق' : 'Total Spent'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {uniqueCustomers.map((customer, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-8 py-6 font-bold text-gray-900">{customer.name}</td>
                      <td className="px-8 py-6 text-sm font-medium text-gray-500">{customer.phone}</td>
                      <td className="px-8 py-6 font-bold text-gray-600">{customer.bookingsCount}</td>
                      <td className="px-8 py-6 text-right font-black text-gray-900">{customer.totalSpent.toFixed(2)} {t('sar')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {Object.entries(moreInfoAnalytics).map(([serviceId, data]) => (
                  <div key={serviceId} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                    <h3 className="text-xl font-black text-gray-900 border-b border-gray-50 pb-4">{data.serviceName}</h3>
                    <div className="space-y-10">
                      {Object.entries(data.questions).map(([qLabel, answers]) => (
                        <div key={qLabel} className="space-y-4">
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{qLabel}</p>
                          <div className="space-y-3">
                            {Object.entries(answers).map(([answer, count]) => {
                              const total = Object.values(answers).reduce((sum, c) => sum + c, 0);
                              const percentage = Math.round((count / total) * 100);
                              return (
                                <div key={answer} className="space-y-2">
                                  <div className="flex justify-between text-sm font-bold">
                                    <span className="text-gray-700">{answer}</span>
                                    <span className="text-indigo-600">{count} ({percentage}%)</span>
                                  </div>
                                  <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Notifications */}
      <div className="fixed bottom-24 right-8 z-[130] flex flex-col gap-4 pointer-events-none">
        {adminError && <div className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl animate-in slide-in-from-right-10 pointer-events-auto">{adminError}</div>}
        {adminSuccess && <div className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl animate-in slide-in-from-right-10 pointer-events-auto">{adminSuccess}</div>}
      </div>

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 lg:p-12 animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
            <div className="p-8 lg:p-12 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{language === 'ar' ? 'تعديل الخدمة' : 'Edit Service'}</h2>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">{language === 'ar' ? 'تحديث معلومات الخدمة ومتطلبات الاستبيان.' : 'Update service info and survey requirements.'}</p>
                </div>
                <button onClick={() => setEditingService(null)} className="p-3 bg-gray-100 text-gray-500 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all duration-300">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{language === 'ar' ? 'اسم الخدمة (إنجليزي)' : 'Service Name (EN)'}</label>
                    <input required type="text" value={editingService.name} onChange={e => setEditingService({...editingService, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{language === 'ar' ? 'اسم الخدمة (عربي)' : 'Service Name (AR)'}</label>
                    <input required type="text" value={editingService.nameAr || ''} onChange={e => setEditingService({...editingService, nameAr: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-bold" dir="rtl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{language === 'ar' ? 'السعر (ريال)' : 'Price (SAR)'}</label>
                    <input required type="number" value={editingService.price} onChange={e => setEditingService({...editingService, price: Number(e.target.value)})} className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{language === 'ar' ? 'الفئة' : 'Category'}</label>
                    <select value={editingService.category} onChange={e => setEditingService({...editingService, category: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-bold">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (EN)'}</label>
                    <textarea required value={editingService.description} onChange={e => setEditingService({...editingService, description: e.target.value})} className="w-full h-32 px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-bold resize-none" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{language === 'ar' ? 'الوصف (عربي)' : 'Description (AR)'}</label>
                    <textarea required value={editingService.descriptionAr || ''} onChange={e => setEditingService({...editingService, descriptionAr: e.target.value})} className="w-full h-32 px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-bold resize-none" dir="rtl" />
                  </div>

                  {/* Survey / Questions Section for Editing */}
                  <div className="md:col-span-2 space-y-6 pt-6 border-t border-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">{language === 'ar' ? 'متطلبات الخدمة (استبيان)' : 'Service Requirements (Survey)'}</h4>
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-1">{language === 'ar' ? 'أضف الأسئلة التي يجب على العميل الإجابة عليها عند الحجز.' : 'Add questions the customer must answer when booking.'}</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleAddQuestion(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                      >
                        <Plus size={14} />
                        {language === 'ar' ? 'إضافة سؤال' : 'Add Question'}
                      </button>
                    </div>

                    <div className="space-y-4">
                      {editingService.questions?.map((q, qIdx) => (
                        <div key={q.id} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 space-y-4 relative group/q">
                          <button 
                            type="button"
                            onClick={() => handleRemoveQuestion(true, q.id)}
                            className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover/q:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{language === 'ar' ? 'نوع السؤال' : 'Question Type'}</label>
                              <select 
                                value={q.type} 
                                onChange={e => handleUpdateQuestion(true, q.id, { type: e.target.value as any })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-bold"
                              >
                                <option value="short_answer">{language === 'ar' ? 'إجابة قصيرة' : 'Short Answer'}</option>
                                <option value="multiple_choice">{language === 'ar' ? 'اختيار من متعدد' : 'Multiple Choice'}</option>
                                <option value="multiple_select">{language === 'ar' ? 'تحديد متعدد (MSQ)' : 'Multiple Select (MSQ)'}</option>
                                <option value="description">{language === 'ar' ? 'وصف / ملاحظة' : 'Description / Note'}</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{language === 'ar' ? 'عنوان السؤال (EN)' : 'Question Label (EN)'}</label>
                              <input 
                                type="text" 
                                value={q.label} 
                                onChange={e => handleUpdateQuestion(true, q.id, { label: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-bold"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{language === 'ar' ? 'عنوان السؤال (AR)' : 'Question Label (AR)'}</label>
                              <input 
                                type="text" 
                                value={q.labelAr || ''} 
                                onChange={e => handleUpdateQuestion(true, q.id, { labelAr: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-bold"
                                dir="rtl"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={q.required} 
                                onChange={e => handleUpdateQuestion(true, q.id, { required: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{language === 'ar' ? 'مطلوب' : 'Required'}</span>
                            </label>
                          </div>

                          {(q.type === 'multiple_choice' || q.type === 'multiple_select') && (
                            <div className="space-y-3 pt-4 border-t border-gray-200/50">
                              <div className="flex items-center justify-between">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{language === 'ar' ? 'الخيارات' : 'Options'}</label>
                                <button 
                                  type="button" 
                                  onClick={() => handleAddOption(true, q.id)}
                                  className="text-indigo-600 hover:text-indigo-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                                >
                                  <Plus size={12} /> {language === 'ar' ? 'إضافة خيار' : 'Add Option'}
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {q.options?.map((opt, optIdx) => (
                                  <div key={optIdx} className="flex items-center gap-2">
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                      <input 
                                        type="text" 
                                        value={opt} 
                                        onChange={e => handleUpdateOption(true, q.id, optIdx, e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-gray-100 bg-white text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                        placeholder={`Option ${optIdx + 1} (EN)`}
                                      />
                                      <input 
                                        type="text" 
                                        value={q.optionsAr?.[optIdx] || ''} 
                                        onChange={e => handleUpdateOption(true, q.id, optIdx, e.target.value, true)}
                                        className="px-3 py-2 rounded-lg border border-gray-100 bg-white text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all text-right"
                                        dir="rtl"
                                        placeholder={`الخيار ${optIdx + 1} (AR)`}
                                      />
                                    </div>
                                    <button 
                                      type="button" 
                                      onClick={() => handleRemoveOption(true, q.id, optIdx)}
                                      className="p-2 text-gray-300 hover:text-red-500"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-100">
                  <button type="button" onClick={() => setEditingService(null)} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black">{language === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700">{language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
