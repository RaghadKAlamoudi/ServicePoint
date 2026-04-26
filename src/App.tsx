
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Service, CartItem, AppSection, Booking, UserRole, User, ServiceAnswer } from './types';
import { INITIAL_SERVICES, ADMIN_EMAILS } from './constants';
import { Language, translations } from './translations';
import Navbar from './components/Navbar';
import ServiceCard from './components/ServiceCard';
import AdminDashboard from './components/AdminDashboard';
import AuthPage from './components/AuthPage';
import LandingPage from './components/LandingPage';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ArrowLeft, History } from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  getDocFromServer,
  increment
} from 'firebase/firestore';

const App: React.FC = () => {
  // --- AUTH & USER STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: keyof typeof translations['en']) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const isUserAdmin = useMemo(() => {
    return user?.role === 'admin' || (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
  }, [user]);

  const [walletBalance, setWalletBalance] = useState<number>(250.00);

  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Navigation state to control whether we show the landing page or the auth forms
  const [isNavigatingToAuth, setIsNavigatingToAuth] = useState(false);

  const role = user?.role || 'customer';
  
  // --- NAVIGATION STATE ---
  const [currentSection, setCurrentSection] = useState<AppSection>(
    role === 'admin' ? AppSection.ADMIN : AppSection.BROWSE
  );
  
  // --- SERVICES & CATEGORIES STATE ---
  const [services, setServices] = useState<Service[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // --- FIREBASE SYNC ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if user exists in Firestore
        let userDoc;
        try {
          userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        } catch (err) {
          console.error("Error fetching user doc:", err);
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
        }

        if (userDoc && userDoc.exists()) {
          const userData = userDoc.data() as User & { walletBalance?: number, favorites?: string[] };
          
          // Force admin role for authorized emails
          const currentUserEmail = (firebaseUser.email || userData.email || '').toLowerCase();
          let userRole = userData.role;
          if (ADMIN_EMAILS.includes(currentUserEmail) && userRole !== 'admin') {
            userRole = 'admin';
            updateDoc(doc(db, 'users', firebaseUser.uid), { role: 'admin' }).catch(e => console.error("Failed to auto-upgrade to admin:", e));
          } else if (!ADMIN_EMAILS.includes(currentUserEmail) && userRole === 'admin') {
            userRole = 'customer';
            updateDoc(doc(db, 'users', firebaseUser.uid), { role: 'customer' }).catch(e => console.error("Failed to auto-downgrade to customer:", e));
          }

          setUser({
            id: firebaseUser.uid,
            name: userData.name,
            email: currentUserEmail || userData.email || '',
            role: userRole
          });
          setCustomerInfo(prev => ({ ...prev, name: userData.name }));
          setWalletBalance(userData.walletBalance ?? 250.00);
          setFavorites(userData.favorites ?? []);
        } else {
          // New user
          const currentUserEmail = (firebaseUser.email || '').toLowerCase();
          const isAuthorizedAdmin = ADMIN_EMAILS.includes(currentUserEmail);
          
          const newUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || (isAuthorizedAdmin ? 'Admin User' : 'New User'),
            email: currentUserEmail,
            role: isAuthorizedAdmin ? 'admin' : 'customer'
          };
          try {
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              ...newUser,
              walletBalance: isAuthorizedAdmin ? 0 : 250.00
            });
          } catch (err) {
            console.error("Error creating user doc:", err);
            handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}`);
          }
          setUser(newUser);
          setCustomerInfo(prev => ({ ...prev, name: newUser.name }));
          setWalletBalance(isAuthorizedAdmin ? 0 : 250.00);
        }
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Sync Services & Categories
  useEffect(() => {
    if (!isAuthReady) return;

    const unsubscribeServices = onSnapshot(collection(db, 'services'), (snapshot) => {
      const servicesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Service));
      setServices(servicesData);
      
      // Auto-repair services missing questions for admins
      if (isUserAdmin && servicesData.length > 0) {
        const missingQuestions = servicesData.filter(s => !s.questions || s.questions.length === 0);
        if (missingQuestions.length > 0) {
          missingQuestions.forEach(async (s) => {
            const initial = INITIAL_SERVICES.find(is => is.id === s.id || is.name.toLowerCase() === s.name.toLowerCase());
            if (initial && initial.questions) {
              try {
                await updateDoc(doc(db, 'services', s.id), { questions: initial.questions });
              } catch (e) {
                console.error(`Failed to auto-repair service ${s.id}:`, e);
              }
            }
          });
        }
      }
      
      // If no services in DB, seed with initial services
      if (servicesData.length === 0 && isAuthReady && user) {
        INITIAL_SERVICES.forEach(async (s) => {
          try {
            await setDoc(doc(db, 'services', s.id), s);
          } catch (err) {
            console.error(`Failed to seed service ${s.id}:`, err);
          }
        });
      }
    }, (error) => {
      console.error("Services sync error:", error);
      handleFirestoreError(error, OperationType.LIST, 'services');
    });

    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const cats = snapshot.docs.map(doc => doc.data().name as string);
      setCustomCategories(cats);
      
      // Seed categories if empty
      if (cats.length === 0 && isAuthReady && user) {
        const initialCats = Array.from(new Set(INITIAL_SERVICES.map(s => s.category)));
        initialCats.forEach(async (cat) => {
          const catId = cat.toLowerCase().replace(/\s+/g, '-');
          try {
            await setDoc(doc(db, 'categories', catId), { name: cat });
          } catch (err) {
            console.error(`Failed to seed category ${catId}:`, err);
          }
        });
      }
    }, (error) => {
      console.error("Categories sync error:", error);
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });

    return () => {
      unsubscribeServices();
      unsubscribeCategories();
    };
  }, [isAuthReady, user?.role, user?.email]);

  // Real-time User Profile Sync (Wallet & Favorites)
  useEffect(() => {
    if (!user?.id) return;
    
    const unsubscribe = onSnapshot(doc(db, 'users', user.id), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (typeof data.walletBalance === 'number') {
          setWalletBalance(data.walletBalance);
        }
        if (Array.isArray(data.favorites)) {
          setFavorites(data.favorites);
        }
      }
    }, (err) => {
      console.error("User profile sync error:", err);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Sync Bookings
  useEffect(() => {
    if (!user) {
      setBookings([]);
      return;
    }

    let q;
    if (user.role === 'admin') {
      q = query(collection(db, 'bookings'), orderBy('timestamp', 'desc'));
    } else {
      q = query(collection(db, 'bookings'), where('userId', '==', user.id), orderBy('timestamp', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Booking));
      setBookings(bookingsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'bookings'));

    return () => unsubscribe();
  }, [user]);

  // Auto-confirm past bookings
  useEffect(() => {
    if (bookings.length === 0) return;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const pastPendingBookings = bookings.filter(b => {
      if (b.status !== 'Pending') return false;
      const [year, month, day] = b.serviceDate.split('-').map(Number);
      const bDate = new Date(year, month - 1, day);
      bDate.setHours(0, 0, 0, 0);
      return bDate < now;
    });

    if (pastPendingBookings.length > 0) {
      pastPendingBookings.forEach(async (b) => {
        try {
          await updateDoc(doc(db, 'bookings', b.id), { status: 'Confirmed' });
        } catch (e) {
          console.error("Failed to auto-confirm booking:", b.id, e);
        }
      });
    }
  }, [bookings]);

  // Test Connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  // --- CUSTOMER FLOW STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isBookingFlow, setIsBookingFlow] = useState(false);
  const [modalAnswers, setModalAnswers] = useState<{[key: string]: string | string[]}>({});
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'booking' | 'success'>('idle');
  const [showPastBookings, setShowPastBookings] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sms: false
  });
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [appError, setAppError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isToppingUp, setIsToppingUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(50);

  const handleTopUp = async () => {
    if (!user) return;
    try {
      const newBalance = walletBalance + topUpAmount;
      await updateDoc(doc(db, 'users', user.id), { walletBalance: newBalance });
      setWalletBalance(newBalance);
      setIsToppingUp(false);
      setSuccessMessage(language === 'ar' ? `تمت إضافة ${topUpAmount} ريال إلى محفظتك!` : `Successfully added ${topUpAmount} SAR to your wallet!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  useEffect(() => {
    if (selectedService && isBookingFlow) {
      const initial: {[key: string]: string | string[]} = {};
      selectedService.questions?.forEach(q => {
        initial[q.id] = q.type === 'multiple_select' ? [] : '';
      });
      setModalAnswers(initial);
    } else if (!selectedService) {
      setModalAnswers({});
    }
  }, [selectedService, isBookingFlow]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // --- CHECKOUT STATE ---
  const [checkoutStep, setCheckoutStep] = useState<'review' | 'details' | 'survey' | 'payment'>('review');
  const [customerInfo, setCustomerInfo] = useState({ name: user?.name || '', phone: '', date: '', time: '' });
  const [serviceAnswers, setServiceAnswers] = useState<ServiceAnswer[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Booking['paymentMethod']>('Credit Card');
  const [cardInfo, setCardInfo] = useState({ number: '', expiry: '', cvv: '', holder: '' });

  // --- COMPUTED VALUES ---
  const lastBooking = useMemo(() => bookings[0], [bookings]);
  const categoriesList = useMemo(() => {
    return ['All', ...customCategories].map(cat => {
      if (cat === 'All') return { id: 'All', name: 'All', nameAr: 'الكل' };
      const serviceWithAr = services.find(s => s.category === cat && s.categoryAr);
      return { id: cat, name: cat, nameAr: serviceWithAr?.categoryAr || cat };
    });
  }, [customCategories, services]);

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const searchLower = searchQuery.trim().toLowerCase();
      const matchesSearch = service.name.toLowerCase().includes(searchLower) ||
                           service.description.toLowerCase().includes(searchLower) ||
                           (service.nameAr || '').toLowerCase().includes(searchLower) ||
                           (service.descriptionAr || '').toLowerCase().includes(searchLower);
      
      // If searching, ignore category filter to provide global results
      const matchesCategory = searchQuery.trim() !== '' || activeCategory === 'All' || service.category === activeCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, activeCategory]);

  useEffect(() => {
    setShowAllServices(false);
  }, [activeCategory, searchQuery]);

  const displayedServices = useMemo(() => {
    // Show all results if searching or if "Show All" is toggled
    if (showAllServices || searchQuery.trim() !== '') return filteredServices;
    return filteredServices.slice(0, 5);
  }, [filteredServices, showAllServices, searchQuery]);

  const EXTRA_FEE = 25;
  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const finalTotal = useMemo(() => Math.max(0, cartTotal + EXTRA_FEE - appliedDiscount), [cartTotal, appliedDiscount]);
  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'WELCOME50') {
      setAppliedDiscount(50);
      setSuccessMessage('Promo code applied! 50 SAR discount');
    } else if (promoCode.toUpperCase() === 'SAVE10') {
      const discount = cartTotal * 0.1;
      setAppliedDiscount(discount);
      setSuccessMessage(`Promo code applied! You saved ${discount.toFixed(2)} SAR`);
    } else {
      setAppError('Invalid promo code. Try WELCOME50 or SAVE10');
      setAppliedDiscount(0);
    }
  };

  const toggleFavorite = async (serviceId: string) => {
    if (!user) return;
    const newFavorites = favorites.includes(serviceId) 
      ? favorites.filter(id => id !== serviceId) 
      : [...favorites, serviceId];
    
    try {
      await updateDoc(doc(db, 'users', user.id), { favorites: newFavorites });
      setFavorites(newFavorites);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  // --- PERSISTENCE ---
  useEffect(() => {
    if (isAuthReady && user) {
      // If we just loaded the user and we are on the landing page or just logged in,
      // redirect to the appropriate dashboard, but NOT if we are showing a success screen.
      if (currentSection !== AppSection.SUCCESS && (!isNavigatingToAuth || currentSection === AppSection.BROWSE)) {
        setCurrentSection(user.role === 'admin' ? AppSection.ADMIN : AppSection.BROWSE);
      }
    }
  }, [isAuthReady, user]);

  useEffect(() => {
    if (activeCategory !== 'All' && !customCategories.includes(activeCategory)) {
      setActiveCategory('All');
    }
  }, [customCategories, activeCategory]);

  // --- HANDLERS ---
  const handleLogin = (newUser: User) => {
    // This is now handled by onAuthStateChanged
    setCurrentSection(newUser.role === 'admin' ? AppSection.ADMIN : AppSection.BROWSE);
    setCustomerInfo(prev => ({ ...prev, name: newUser.name }));
  };

  const handleLogout = async () => {
    await auth.signOut();
    setCart([]);
    setBookingStatus('idle');
    setCheckoutStep('review');
    setIsNavigatingToAuth(false);
    setIsEditingProfile(false);
    setShowNotifications(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.id), {
          name: editForm.name,
          email: editForm.email
        });
        setIsEditingProfile(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
      }
    }
  };

  const addToCart = useCallback((service: Service, skipToStep?: 'review' | 'details' | 'survey' | 'payment') => {
    setCart(prev => {
      const existing = prev.find(item => item.id === service.id);
      if (existing) {
        return prev.map(item => item.id === service.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...service, quantity: 1 }];
    });
    setSelectedService(null);
    setCurrentSection(AppSection.CART);
    if (skipToStep) {
      setCheckoutStep(skipToStep);
    } else {
      setCheckoutStep('review');
    }
  }, []);

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
    }
  };

  const handlePrintReceipt = (booking: Booking) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const isAr = language === 'ar';
    const itemsHtml = booking.items.map(item => `
      <div style="display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #f8fafc; direction: ${isAr ? 'rtl' : 'ltr'};">
        <div style="display: flex; align-items: center; gap: 15px;">
          <div style="width: 40px; height: 40px; background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;">🛠️</div>
          <div>
            <div style="font-weight: 800; color: #0f172a; font-size: 14px;">${isAr && item.nameAr ? item.nameAr : item.name}</div>
            <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-top: 2px;">${item.quantity} ${isAr ? 'وحدة' : 'Units'} @ ${item.price} SAR</div>
          </div>
        </div>
        <div style="text-align: ${isAr ? 'left' : 'right'};">
          <div style="font-weight: 800; color: #0f172a; font-size: 14px;">${(item.price * item.quantity).toFixed(2)} SAR</div>
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html dir="${isAr ? 'rtl' : 'ltr'}">
        <head>
          <title>${isAr ? 'إيصال' : 'Receipt'} - ${booking.id.toUpperCase()}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&family=Noto+Sans+Arabic:wght@400;600;800&display=swap');
            body { font-family: ${isAr ? "'Noto Sans Arabic', sans-serif" : "'Plus Jakarta Sans', sans-serif"}; padding: 60px; color: #334155; line-height: 1.5; background: #fff; }
            .receipt-container { max-width: 700px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 50px; border-radius: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.02); position: relative; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 50px; border-bottom: 2px dashed #f1f5f9; padding-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 800; color: #4f46e5; letter-spacing: -0.02em; }
            .status { font-size: 10px; font-weight: 800; color: #10b981; text-transform: uppercase; background: #ecfdf5; padding: 4px 12px; border-radius: 999px; margin-top: 8px; display: inline-block; }
            .ref { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; margin-top: 4px; }
            
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 50px; }
            .info-box h4 { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; }
            .info-content p { margin: 2px 0; font-size: 13px; font-weight: 600; color: #1e293b; }
            
            .schedule-pannel { background: #f8fafc; padding: 20px 30px; border-radius: 16px; display: flex; justify-content: space-between; margin-bottom: 40px; border: 1px solid #f1f5f9; }
            .schedule-item p { margin: 0; }
            .schedule-label { font-size: 9px; font-weight: 800; color: #6366f1; text-transform: uppercase; margin-bottom: 4px; }
            .schedule-value { font-size: 14px; font-weight: 800; color: #1e293b; }
            
            .items-table { margin-bottom: 50px; }
            .table-head { display: flex; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; margin-bottom: 8px; }
            .table-head span { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
            
            .totals { border-top: 1px solid #f1f5f9; padding-top: 30px; }
            .total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
            .total-row.main { margin-top: 16px; padding-top: 16px; border-top: 2px solid #0f172a; }
            .total-row span { font-size: 13px; font-weight: 600; color: #64748b; }
            .total-row strong { font-size: 13px; font-weight: 800; color: #0f172a; }
            .grand-total { font-size: 32px; font-weight: 800; color: #4f46e5; letter-spacing: -0.04em; }
            
            .footer { text-align: center; margin-top: 60px; }
            .footer p { font-size: 12px; font-weight: 600; color: #94a3b8; }
            
            @media print {
              body { padding: 0; }
              .receipt-container { border: none; box-shadow: none; padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div>
                <div class="logo">ServicePoint</div>
                <div class="ref">REF: #${booking.id.toUpperCase()}</div>
              </div>
              <div style="text-align: right;">
                <div class="status">${isAr ? 'تم الدفع بنجاح' : 'Paid Successfully'}</div>
                <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-top: 8px;">${new Date(booking.timestamp).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { dateStyle: 'long' })}</div>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-box">
                <h4>${isAr ? 'موفر الخدمة' : 'Service Provider'}</h4>
                <div class="info-content">
                  <p>ServicePoint Professional</p>
                  <p>Riyadh, Saudi Arabia</p>
                  <p>support@servicepoint.com</p>
                </div>
              </div>
              <div class="info-box" style="text-align: right;">
                <h4>${isAr ? 'العميل' : 'Customer'}</h4>
                <div class="info-content">
                  <p>${booking.customerName}</p>
                  <p>${booking.customerPhone}</p>
                </div>
              </div>
            </div>

            <div class="schedule-pannel">
              <div class="schedule-item">
                <p class="schedule-label">${isAr ? 'تاريخ الخدمة' : 'Service Date'}</p>
                <p class="schedule-value">📅 ${booking.serviceDate}</p>
              </div>
              <div class="schedule-item" style="text-align: right;">
                <p class="schedule-label">${isAr ? 'وقت البدء' : 'Start Time'}</p>
                <p class="schedule-value">${booking.serviceTime} ⏰</p>
              </div>
            </div>

            <div class="items-table">
              <div class="table-head">
                <span>${isAr ? 'الوصف' : 'Description'}</span>
                <span>${isAr ? 'الإجمالي' : 'Subtotal'}</span>
              </div>
              ${itemsHtml}
            </div>

            <div class="totals">
              <div class="total-row">
                <span>${isAr ? 'طريقة الدفع' : 'Payment Method'}</span>
                <strong>${booking.paymentMethod}</strong>
              </div>
              <div class="total-row main">
                <span>${isAr ? 'إجمالي المبلغ' : 'Invoice Total'}</span>
                <span class="grand-total">${booking.totalPrice.toFixed(2)} SAR</span>
              </div>
            </div>

            <div class="footer">
              <p>${isAr ? 'شكراً لتعاملك معنا!' : 'Thank you for choosing ServicePoint!'}</p>
            </div>
          </div>
          <div style="text-align: center; margin-top: 40px;" class="no-print">
            <button onclick="window.print()" style="background: #4f46e5; color: white; border: none; padding: 16px 32px; border-radius: 12px; font-weight: 800; cursor: pointer;">
              ${isAr ? 'طباعة المستند' : 'Print Document'}
            </button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCancelBooking = async (id: string) => {
    try {
      await updateDoc(doc(db, 'bookings', id), { status: 'Cancelled' });
      setBookingToCancel(null);
      setSelectedBooking(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${id}`);
    }
  };

  const handleRescheduleBooking = async (id: string, newDate: string) => {
    try {
      await updateDoc(doc(db, 'bookings', id), { serviceDate: newDate });
      setIsRescheduling(false);
      setSelectedBooking(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${id}`);
    }
  };

  const handleAddService = async (newServiceData: Omit<Service, 'id' | 'bookingCount'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newService: Service = {
      ...newServiceData,
      id,
      bookingCount: 0
    };
    try {
      await setDoc(doc(db, 'services', id), newService);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `services/${id}`);
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'services', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `services/${id}`);
    }
  };

  const handleUpdateService = async (updatedService: Service) => {
    try {
      await setDoc(doc(db, 'services', updatedService.id), updatedService);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `services/${updatedService.id}`);
    }
  };

  const handleUpdateCategories = async (newCategories: string[]) => {
    const promises: Promise<any>[] = [];

    // Add new categories
    for (const cat of newCategories) {
      if (!customCategories.includes(cat)) {
        const id = cat.toLowerCase().replace(/\s+/g, '-');
        promises.push(
          setDoc(doc(db, 'categories', id), { name: cat })
            .catch(err => handleFirestoreError(err, OperationType.CREATE, `categories/${id}`))
        );
      }
    }

    // Delete removed categories
    for (const cat of customCategories) {
      if (!newCategories.includes(cat)) {
        const id = cat.toLowerCase().replace(/\s+/g, '-');
        promises.push(
          deleteDoc(doc(db, 'categories', id))
            .catch(err => handleFirestoreError(err, OperationType.DELETE, `categories/${id}`))
        );
      }
    }

    await Promise.all(promises);
  };

  const handleBookingConfirm = async () => {
    if (!user) {
      setAppError('Please log in to continue.');
      return;
    }
    
    setBookingStatus('booking');
    setAppError(null);
    console.log("Starting booking process for:", user.email);

    try {
      // Wallet Check (Essential)
      if (selectedPayment === 'Wallet' && walletBalance < finalTotal) {
        setAppError(language === 'ar' ? 'رصيد المحفظة غير كافٍ!' : 'Insufficient wallet balance!');
        setBookingStatus('idle');
        return;
      }

      const bookingId = Math.random().toString(36).substring(2, 11).toUpperCase();
      const newBooking: Booking = {
        id: bookingId,
        items: [...cart],
        totalPrice: finalTotal,
        timestamp: Date.now(),
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        serviceDate: customerInfo.date,
        serviceTime: customerInfo.time,
        paymentMethod: selectedPayment,
        status: selectedPayment === 'Pay on Site' ? 'Pending' : 'Confirmed',
        serviceAnswers: [...serviceAnswers],
        userId: user.id
      };

      console.log("Processing database records...");

      // A. Wallet Update (if needed)
      if (selectedPayment === 'Wallet') {
        try {
          await updateDoc(doc(db, 'users', user.id), {
            walletBalance: walletBalance - finalTotal
          });
          setWalletBalance(prev => prev - finalTotal);
        } catch (e: any) {
          console.error("Wallet update failed:", e);
          throw new Error("Wallet payment failed. Please check your balance.");
        }
      }

      // B. Create Booking document (Most critical step)
      try {
        await setDoc(doc(db, 'bookings', bookingId), newBooking);
        
        // Background updates (Non-blocking)
        cart.forEach((item) => {
          updateDoc(doc(db, 'services', item.id), {
            bookingCount: increment(item.quantity)
          }).catch(err => console.error("Non-blocking stats update failed:", err));
        });

        // SUCCESS
        setConfirmedBooking(newBooking);
        setCart([]);
        setServiceAnswers([]);
        setCurrentSection(AppSection.SUCCESS);
        setBookingStatus('idle');
        console.log("Booking flow finalized via success screen.");
      } catch (e: any) {
        console.error("Booking document creation failed:", e);
        throw new Error("Could not finalize your booking. Please try again.");
      }
    } catch (err: any) {
      console.error("Booking Error:", err);
      setAppError(err.message || 'Booking process failed. Please try again.');
      setBookingStatus('idle');
    }
  };

  // --- AUTH & LANDING GATE ---
  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    if (isNavigatingToAuth) {
      return <AuthPage onLogin={handleLogin} language={language} onLanguageChange={setLanguage} t={t} />;
    }
    return (
      <LandingPage 
        onGetStarted={() => setIsNavigatingToAuth(true)}
        onLogin={() => setIsNavigatingToAuth(true)}
        language={language}
        onLanguageChange={setLanguage}
        t={t}
      />
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-[#f8fafc] flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Navbar 
        currentSection={currentSection} 
        setSection={setCurrentSection} 
        cartCount={cartCount} 
        role={role} 
        user={user}
        walletBalance={walletBalance}
        onLogout={handleLogout}
        language={language}
        onLanguageChange={setLanguage}
        t={t}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-10">
        {role === 'customer' && (
          <>
            {/* Browse Section - This is the Home Page */}
            {currentSection === AppSection.BROWSE && (
              <div className="space-y-8 animate-in fade-in duration-1000">
                {/* Hero / Header */}
                <header className="relative pt-12 pb-4 flex flex-col items-center text-center">
                  <div className="absolute inset-0 bg-gradient-to-b from-brand/[0.02] to-transparent pointer-events-none -mx-4 sm:-mx-8 rounded-b-[4rem]"></div>
                  
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/[0.03] border border-brand/10 rounded-full mb-8">
                      <span className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse"></span>
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-brand">{t('allServices')}</span>
                    </div>

                    <h1 className="font-display text-5xl md:text-8xl font-black text-slate-900 leading-[0.85] tracking-tighter mb-8 max-w-3xl">
                      {language === 'ar' ? (
                        <>نخبة الخدمات <span className="text-brand">المختارة بعناية</span></>
                      ) : (
                        <>The new <span className="text-brand text-outline-brand">standard</span> for home service</>
                      )}
                    </h1>
                    
                    <p className="font-sans text-lg md:text-xl text-slate-400 font-medium max-w-xl leading-relaxed mb-12">
                      {t('heroSubtitle')}
                    </p>

                    <div className="flex flex-col items-center gap-4 w-full max-w-2xl px-4">
                      <div className="relative w-full group">
                        <input 
                          type="text" 
                          placeholder={t('searchPlaceholder')}
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full ps-14 pe-6 py-5 rounded-[2rem] border border-slate-100 bg-white shadow-[0_5px_15px_-3px_rgba(0,0,0,0.02)] focus:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] focus:border-brand focus:ring-0 outline-none transition-all duration-300 font-sans font-medium text-slate-600" 
                        />
                        <svg className="w-6 h-6 absolute start-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>

                      <button 
                        onClick={() => setCurrentSection(AppSection.MY_BOOKINGS)}
                        className="w-full flex items-center justify-center gap-3 py-5 rounded-[2rem] bg-white border border-slate-100 text-slate-600 font-bold hover:border-brand hover:text-brand transition-all duration-300 shadow-[0_5px_15px_-3px_rgba(0,0,0,0.02)] group hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)]"
                      >
                        <History className="w-5 h-5 text-slate-300 group-hover:text-brand transition-colors" />
                        <span>{t('viewHistory')}</span>
                      </button>
                    </div>
                  </div>
                </header>

                <div className="space-y-12">
                  {/* Category Selection Row */}
                  <div className="flex flex-col space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{language === 'ar' ? 'التصنيفات' : 'Browse by Category'}</span>
                      <div className="h-px bg-slate-100 flex-1 ms-6 hidden sm:block"></div>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                      {categoriesList.map(cat => (
                        <button 
                          key={cat.id} 
                          onClick={() => setActiveCategory(cat.id)}
                          className={`px-8 py-3.5 rounded-2xl border transition-all duration-500 whitespace-nowrap text-[11px] font-black uppercase tracking-[0.1em] ${
                            activeCategory === cat.id 
                            ? 'bg-brand border-brand text-white shadow-[0_10px_20px_-5px_rgba(124,58,237,0.3)] scale-105' 
                            : 'bg-white border-slate-100 text-slate-400 hover:border-brand hover:text-brand'
                          }`}
                        >
                          {language === 'ar' ? cat.nameAr : cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section Title & Grid */}
                  <div className="space-y-10">
                    <div className="flex items-end justify-between">
                      <div className="space-y-2">
                        <h2 className="font-display text-4xl font-extrabold text-slate-900 tracking-tight leading-none group">
                          {activeCategory === 'All' 
                            ? t('allServices') 
                            : (language === 'ar' 
                                ? `${categoriesList.find(c => c.id === activeCategory)?.nameAr || activeCategory}` 
                                : `${activeCategory}`)}
                          <span className="inline-block w-2.5 h-2.5 bg-brand rounded-full ml-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        </h2>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest leading-none">
                          {language === 'ar' 
                            ? (showAllServices || filteredServices.length <= 5 
                                ? `${filteredServices.length} خيار متاح` 
                                : `5 من أصل ${filteredServices.length} خيارات`)
                            : (showAllServices || filteredServices.length <= 5
                                ? `${filteredServices.length} items available`
                                : `Featured selection`)}
                        </p>
                      </div>
                      {filteredServices.length > 5 && (
                        <button 
                          onClick={() => setShowAllServices(!showAllServices)}
                          className="px-6 py-2.5 rounded-xl border border-slate-100 text-[10px] font-black text-slate-900 uppercase tracking-widest hover:bg-slate-50 transition-all duration-300"
                        >
                          {showAllServices ? t('viewLess') : t('viewAll')}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-8">
                      {displayedServices.map(service => (
                        <ServiceCard 
                          key={service.id}
                          service={service} 
                          onAdd={(s) => {
                            if (s.questions && s.questions.length > 0) {
                              setIsBookingFlow(true);
                              setSelectedService(s);
                            } else {
                              addToCart(s, 'details');
                            }
                          }} 
                          onViewDetails={(s) => {
                            setIsBookingFlow(false);
                            setSelectedService(s);
                          }}
                          quantityInCart={cart.find(c => c.id === service.id)?.quantity || 0}
                          isFavorite={favorites.includes(service.id)}
                          onToggleFavorite={toggleFavorite}
                          t={t}
                          language={language}
                        />
                      ))}
                      
                      {!showAllServices && filteredServices.length > 5 && (
                        <button 
                          onClick={() => setShowAllServices(true)}
                          className="w-full bg-slate-50 border border-slate-100/50 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 group hover:bg-white hover:border-brand hover:shadow-xl transition-all duration-500 p-8 h-full min-h-[300px]"
                        >
                          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-brand group-hover:text-white transition-all duration-500">
                             <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <div className="text-center">
                            <span className="block text-[11px] font-black text-slate-900 uppercase tracking-widest leading-tight mb-1">
                              {t('viewAll')}
                            </span>
                            <span className="block text-[9px] font-black text-slate-400">{filteredServices.length - 5} more</span>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cart & Checkout Section */}
            {currentSection === AppSection.CART && (
              <div className="max-w-6xl mx-auto animate-in slide-in-from-right-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                  {checkoutStep !== 'survey' && (
                    <div className="flex items-center gap-6">
                      {checkoutStep === 'payment' && (
                        <button 
                          onClick={() => setCurrentSection(AppSection.BROWSE)}
                          className="p-4 bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-brand hover:border-brand/20 hover:shadow-xl transition-all duration-300"
                        >
                          <ArrowLeft className={`w-6 h-6 ${language === 'ar' ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                      <div className="space-y-1">
                        <h2 className="font-display text-4xl font-black tracking-tight text-slate-900 leading-none">
                          {checkoutStep === 'review' ? t('yourSelection') : 
                           checkoutStep === 'details' ? t('professionalDetails') : t('securePayment')}
                        </h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          {checkoutStep === 'review' ? (language === 'ar' ? 'السلة' : 'Step 1: Your Basket') : 
                           checkoutStep === 'details' ? (language === 'ar' ? 'المعلومات' : 'Step 2: Information') : 
                           (language === 'ar' ? 'الدفع' : 'Step 3: Secure Checkout')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
                  {/* Summary First (Top on Mobile) */}
                  <div className="lg:col-span-1 order-first lg:order-last space-y-8 lg:sticky lg:top-24 h-fit">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] space-y-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand/[0.03] rounded-full -mr-16 -mt-16 blur-2xl"></div>
                      
                      <h3 className="font-display text-xl font-black text-slate-900 border-b border-slate-50 pb-6 relative z-10">
                        {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
                      </h3>
                      
                      {/* Item List in Summary */}
                      <div className="space-y-4 pb-8 border-b border-slate-50 max-h-60 overflow-y-auto custom-scrollbar relative z-10 px-1">
                        {cart.map(item => (
                          <div key={item.id} className="flex justify-between text-xs items-start group">
                            <div className="flex flex-col">
                              <span className="text-slate-900 font-bold leading-tight group-hover:text-brand transition-colors">
                                {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">Qty: {item.quantity}</span>
                            </div>
                            <span className="font-black text-slate-900 whitespace-nowrap ml-4">{item.price * item.quantity} <span className="text-[9px] text-slate-400">SAR</span></span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4 pt-2 relative z-10">
                        <div className="flex justify-between text-slate-400 font-black text-[10px] uppercase tracking-widest">
                          <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                          <span className="text-slate-600">{cartTotal} SAR</span>
                        </div>
                        <div className="flex justify-between text-brand font-black text-[10px] uppercase tracking-widest">
                          <span>{language === 'ar' ? 'رسوم الخدمة' : 'Service Fee'}</span>
                          <span>+{EXTRA_FEE} SAR</span>
                        </div>
                        {appliedDiscount > 0 && (
                          <div className="flex justify-between text-emerald-500 font-black text-[10px] uppercase tracking-widest">
                            <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
                            <span>-{appliedDiscount.toFixed(2)} SAR</span>
                          </div>
                        )}

                        <div className="pt-8 border-t-2 border-dashed border-slate-100">
                          {/* Booking Details Preview */}
                          {(customerInfo.name || customerInfo.date) && (
                            <div className="space-y-4 mb-8">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-4 h-px bg-slate-200"></span>
                                {language === 'ar' ? 'تفاصيل الحجز' : 'Booking Details'}
                              </span>
                              <div className="grid grid-cols-1 gap-2">
                                {customerInfo.name && (
                                  <div className="flex items-center gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                    <span className="text-base">👤</span>
                                    <div className="min-w-0">
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{language === 'ar' ? 'الاسم' : 'Name'}</p>
                                      <p className="text-xs font-bold text-slate-900 truncate">{customerInfo.name}</p>
                                    </div>
                                  </div>
                                )}
                                {customerInfo.date && (
                                  <div className="flex items-center gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                    <span className="text-base">📅</span>
                                    <div className="min-w-0">
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{language === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}</p>
                                      <p className="text-xs font-bold text-slate-900 truncate">
                                        {customerInfo.date} {customerInfo.time ? ` @ ${customerInfo.time}` : ''}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-end">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'الإجمالي' : 'Grand Total'}</span>
                            <div className="text-end">
                              <span className="text-4xl font-black text-brand tracking-tighter block leading-none">
                                {finalTotal}
                              </span>
                              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">Saudi Riyals</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {checkoutStep === 'review' && cart.length > 0 && (
                        <button 
                          onClick={() => setCheckoutStep('details')} 
                          className="w-full relative group h-16 rounded-2xl bg-slate-900 hover:bg-brand text-white font-black text-[13px] uppercase tracking-[0.2em] shadow-2xl transition-all duration-500 overflow-hidden active:scale-[0.98]"
                        >
                          <span className="relative z-10 flex items-center justify-center gap-3">
                            {language === 'ar' ? 'متابعة' : 'Proceed to Checkout'}
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-brand to-brand-dark translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-8">
                    {checkoutStep === 'review' ? (
                      <div className="space-y-6">
                        {cart.length === 0 ? (
                          <div className="text-center py-44 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center group">
                             <div className="w-24 h-24 rounded-full bg-white shadow-sm flex items-center justify-center text-5xl mb-8 group-hover:scale-110 transition-transform duration-500">🛒</div>
                             <h3 className="text-slate-900 font-display text-2xl font-black mb-4 uppercase tracking-tight">{language === 'ar' ? 'سلتك فارغة' : 'Your basket is empty'}</h3>
                             <p className="text-slate-400 font-medium max-w-xs mb-10 leading-relaxed">{language === 'ar' ? 'لم تضف أي خدمات بعد. ابدأ باستكشاف خدماتنا المميزة.' : 'Looks like you haven\'t added any services yet. Start exploring our premium selections.'}</p>
                             <button 
                              onClick={() => setCurrentSection(AppSection.BROWSE)} 
                              className="bg-slate-900 text-white px-10 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-brand transition-all duration-300 shadow-xl active:scale-95"
                             >
                              {t('browseServices')}
                             </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {cart.map(item => (
                              <div key={item.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 flex flex-col sm:flex-row items-center gap-10 shadow-sm hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] transition-all duration-500 group">
                                <div className="flex-1 text-center sm:text-start">
                                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full mb-4 group-hover:bg-brand/5 transition-colors duration-500">
                                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full group-hover:bg-brand"></span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:text-brand">{item.category}</span>
                                  </div>
                                  <h4 className="font-display text-2xl font-black text-slate-900 mb-2 leading-none">
                                    {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                                  </h4>
                                  <p className="text-slate-400 text-sm font-medium mb-4 line-clamp-1 max-w-md">
                                    {language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description}
                                  </p>
                                  <p className="font-black text-slate-900 text-xl tracking-tight">{item.price} <span className="text-xs text-slate-400 ml-1">SAR</span></p>
                                </div>
                                <div className="flex items-center gap-6 bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                                  <button onClick={() => updateQuantity(item.id, -1)} className="w-11 h-11 rounded-xl bg-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] border border-slate-100/80 text-lg font-black text-slate-400 hover:text-brand hover:border-brand/20 transition-all duration-300 active:scale-90">-</button>
                                  <span className="font-black text-xl w-6 text-center text-slate-900">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.id, 1)} className="w-11 h-11 rounded-xl bg-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] border border-slate-100/80 text-lg font-black text-slate-400 hover:text-brand hover:border-brand/20 transition-all duration-300 active:scale-90">+</button>
                                </div>
                                <button 
                                  onClick={() => removeFromCart(item.id)} 
                                  className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-300 active:scale-90"
                                  title="Remove item"
                                >
                                   <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : checkoutStep === 'details' ? (
                      <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 space-y-12 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.04)] relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand/[0.02] rounded-full blur-3xl pointer-events-none"></div>
                        
                        <div className="space-y-4">
                          <h3 className="font-display text-2xl font-black text-slate-900 leading-none">Who should we contact?</h3>
                          <p className="text-slate-400 text-sm font-medium">Please provide your details so we can coordinate the service delivery.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                            <input 
                              required 
                              type="text" 
                              placeholder="John Doe" 
                              value={customerInfo.name} 
                              onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} 
                              className="w-full px-7 py-4.5 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-brand/10 focus:border-brand/20 outline-none transition-all text-slate-900 font-sans font-bold placeholder:text-slate-300" 
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Phone</label>
                            <input 
                              required 
                              type="tel" 
                              placeholder="+966" 
                              value={customerInfo.phone} 
                              onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} 
                              className="w-full px-7 py-4.5 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-brand/10 focus:border-brand/20 outline-none transition-all text-slate-900 font-sans font-bold placeholder:text-slate-300" 
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Date</label>
                            <input 
                              required 
                              type="date" 
                              min={new Date().toISOString().split('T')[0]}
                              value={customerInfo.date} 
                              onChange={e => setCustomerInfo({...customerInfo, date: e.target.value})} 
                              className="w-full px-7 py-4.5 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-brand/10 focus:border-brand/20 outline-none transition-all text-slate-900 font-sans font-bold" 
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preferred Time</label>
                            <input 
                              required 
                              type="time" 
                              value={customerInfo.time} 
                              onChange={e => setCustomerInfo({...customerInfo, time: e.target.value})} 
                              className="w-full px-7 py-4.5 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-brand/10 focus:border-brand/20 outline-none transition-all text-slate-900 font-sans font-bold" 
                            />
                          </div>
                        </div>
                        <div className="flex gap-6 pt-6">
                          <button onClick={() => setCheckoutStep('review')} className="flex-1 px-8 h-16 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-400 bg-slate-50 hover:bg-slate-100 hover:text-slate-600 transition-all duration-300">Back</button>
                          <button 
                            disabled={!customerInfo.name || !customerInfo.phone || !customerInfo.date || !customerInfo.time}
                            onClick={() => {
                              // Initialize answers for all services in cart that have questions
                              const initialAnswers: ServiceAnswer[] = cart.filter(item => item.questions && item.questions.length > 0).map(item => ({
                                serviceId: item.id,
                                serviceName: item.name,
                                answers: (item.questions || []).map(q => ({
                                  questionId: q.id,
                                  questionLabel: q.label,
                                  answer: q.type === 'multiple_select' ? [] : ''
                                }))
                              }));
                              setServiceAnswers(initialAnswers);
                              setCheckoutStep('survey');
                            }} 
                            className="flex-[2] h-16 bg-slate-900 hover:bg-brand text-white rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] shadow-2xl transition-all duration-500 disabled:opacity-50 disabled:grayscale group"
                          >
                            <span className="flex items-center justify-center gap-3">
                              Next: Requirements
                              <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </span>
                          </button>
                        </div>
                      </div>
                    ) : checkoutStep === 'survey' ? (
                      <div className="bg-slate-50 min-h-[600px] rounded-[3rem] overflow-hidden shadow-[0_30px_70px_-20px_rgba(0,0,0,0.1)] animate-in slide-in-from-right-4 flex flex-col border border-slate-100">
                        {/* Improved Form Header */}
                        <div className="h-2 bg-brand w-full"></div>
                        <div className="p-10 space-y-12 flex-1 overflow-y-auto custom-scrollbar">
                          <div className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full -mr-16 -mt-16 blur-xl group-hover:bg-brand/10 transition-all duration-700"></div>
                            <div className="relative z-10 flex flex-col items-center text-center">
                              <span className="text-4xl mb-6">📝</span>
                              <h2 className="font-display text-4xl font-black text-slate-900 tracking-tight mb-4">Additional Details</h2>
                              <p className="text-slate-400 font-medium max-w-sm leading-relaxed">Please help us prepare better by providing exactly what's needed for your requested services.</p>
                              <div className="mt-8 flex items-center justify-center gap-6">
                                <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest">
                                  <span className="text-lg leading-none">*</span> Required Field
                                </div>
                                <div className="w-px h-4 bg-slate-100"></div>
                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                  {cart.filter(item => item.questions && item.questions.length > 0).length} services to verify
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-6">
                            {/* Service Specific Questions */}
                            {serviceAnswers.map((sa, saIdx) => (
                              <div key={sa.serviceId} className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-12">
                                <div className="flex items-center gap-6 relative">
                                  <div className="w-14 h-14 rounded-2xl bg-brand text-white flex items-center justify-center text-2xl shadow-lg shadow-brand/20">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Service Requirements</span>
                                    <h3 className="font-display text-2xl font-black text-slate-900 leading-none">{sa.serviceName}</h3>
                                  </div>
                                  <div className="flex-1 h-px bg-slate-50 ml-6 hidden sm:block"></div>
                                </div>
                                
                                <div className="space-y-12">
                                  {sa.answers.map((ans, ansIdx) => {
                                    const service = cart.find(c => c.id === sa.serviceId);
                                    const question = service?.questions?.find(q => q.id === ans.questionId);
                                    
                                    if (question?.type === 'description') {
                                      return (
                                        <div key={ans.questionId} className="p-6 bg-slate-50 rounded-3xl border border-slate-100/50">
                                          <div className="flex gap-4">
                                            <span className="text-xl">💡</span>
                                            <p className="text-sm text-slate-500 font-medium leading-relaxed italic">{ans.questionLabel}</p>
                                          </div>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div key={ans.questionId} className="space-y-6">
                                        <label className="text-lg font-black text-slate-900 flex items-center gap-3">
                                          <span className="w-1.5 h-1.5 bg-brand rounded-full"></span>
                                          {ans.questionLabel} 
                                          {question?.required && <span className="text-red-500 text-xl leading-none">*</span>}
                                        </label>
                                        
                                        {question?.type === 'short_answer' ? (
                                          <div className="relative group">
                                            <input 
                                              type="text"
                                              value={ans.answer as string}
                                              onChange={e => {
                                                const newAnswers = [...serviceAnswers];
                                                newAnswers[saIdx].answers[ansIdx].answer = e.target.value;
                                                setServiceAnswers(newAnswers);
                                              }}
                                              placeholder={language === 'ar' ? 'إجابتك' : 'Type here...'}
                                              className="w-full px-0 py-4 bg-transparent border-b-2 border-slate-100 focus:border-brand outline-none transition-all duration-300 text-slate-900 font-sans font-bold text-lg placeholder:text-slate-200"
                                            />
                                            <div className="absolute bottom-0 left-0 h-0.5 bg-brand w-0 group-focus-within:w-full transition-all duration-500"></div>
                                          </div>
                                        ) : (question?.type === 'multiple_choice' || question?.type === 'multiple_select') ? (
                                          <div className="flex flex-wrap gap-4">
                                            {question?.options?.map(opt => {
                                              const currentAnswers = (ans.answer as string[]) || [];
                                              const isChecked = question.type === 'multiple_select' 
                                                ? currentAnswers.includes(opt)
                                                : ans.answer === opt;
                                              
                                              return (
                                                <button
                                                  key={opt}
                                                  onClick={() => {
                                                    const newAnswers = [...serviceAnswers];
                                                    if (question.type === 'multiple_select') {
                                                      const currentArr = isChecked 
                                                        ? currentAnswers.filter(a => a !== opt)
                                                        : [...currentAnswers, opt];
                                                      newAnswers[saIdx].answers[ansIdx].answer = currentArr;
                                                    } else {
                                                      newAnswers[saIdx].answers[ansIdx].answer = opt;
                                                    }
                                                    setServiceAnswers(newAnswers);
                                                  }}
                                                  className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 border-2 active:scale-95 ${
                                                    isChecked 
                                                    ? 'bg-brand border-brand text-white shadow-lg shadow-brand/20' 
                                                    : 'bg-white border-slate-100 text-slate-400 hover:border-brand/30 hover:text-brand'
                                                  }`}
                                                >
                                                  {isChecked && '✓ '}{opt}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        ) : null}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}

                          {serviceAnswers.length === 0 && (
                            <div className="bg-white p-12 rounded-[2rem] border border-slate-100 text-center space-y-6 shadow-sm">
                              <div className="text-6xl opacity-20">📝</div>
                              <p className="text-slate-900 font-display text-xl font-black">{language === 'ar' ? 'لا توجد معلومات إضافية مطلوبة.' : 'No additional information required.'}</p>
                              <p className="text-slate-400 font-medium">{language === 'ar' ? 'يمكنك المتابعة إلى الخطوة التالية.' : 'You can proceed to the next step.'}</p>
                            </div>
                          )}
                          </div>

                        <div className="p-10 border-t border-slate-100 bg-white flex flex-col sm:flex-row gap-6">
                          <button 
                            onClick={() => setCheckoutStep('details')} 
                            className="flex-1 px-8 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-400 bg-slate-50 hover:bg-slate-100 hover:text-slate-600 transition-all duration-300"
                          >
                            {language === 'ar' ? 'رجوع' : 'Back to Details'}
                          </button>
                          <button 
                            onClick={() => {
                              // Check required service questions
                              for (const sa of serviceAnswers) {
                                const service = cart.find(c => c.id === sa.serviceId);
                                for (const ans of sa.answers) {
                                  const question = service?.questions?.find(q => q.id === ans.questionId);
                                  if (question?.required) {
                                    const isAnswered = Array.isArray(ans.answer) ? ans.answer.length > 0 : !!ans.answer;
                                    if (!isAnswered) {
                                      setAppError(language === 'ar' ? `يرجى الإجابة على: ${ans.questionLabel} لـ ${sa.serviceName}` : `Required: ${ans.questionLabel}`);
                                      return;
                                    }
                                  }
                                }
                              }
                              setCheckoutStep('payment');
                            }} 
                            className="flex-[2] py-5 bg-slate-900 hover:bg-brand text-white rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] shadow-2xl transition-all duration-500 group"
                          >
                            <span className="flex items-center justify-center gap-3">
                              {language === 'ar' ? 'متابعة للدفع' : 'Continue to Payment'}
                              <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                      <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-700">
                        {/* Payment Methods Section */}
                        <div className="space-y-8">
                          <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-brand/10 text-brand flex items-center justify-center text-3xl shadow-sm">
                              💳
                            </div>
                            <h2 className="font-display text-3xl font-black text-slate-900 tracking-tight">Payment Method</h2>
                            <p className="text-slate-400 font-medium max-w-xs leading-relaxed">Choose your preferred way to complete your booking securely.</p>
                          </div>

                          <div className="grid grid-cols-1 gap-6">
                            {[
                              { id: 'Credit Card', label: language === 'ar' ? 'بطاقة ائتمان' : 'Credit Card', icon: '💳' },
                              { id: 'Apple Pay', label: 'Apple Pay', icon: '🍎' },
                              { id: 'Pay on Site', label: language === 'ar' ? 'الدفع في الموقع' : 'Pay on Site', icon: '🏠' }
                            ].map(method => (
                              <div key={method.id} className="space-y-6">
                                <button 
                                  onClick={() => setSelectedPayment(method.id as any)}
                                  className={`w-full flex items-center gap-6 p-8 rounded-[2.5rem] border-2 transition-all text-start group relative overflow-hidden ${
                                    selectedPayment === method.id 
                                    ? 'border-brand bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] scale-[1.02]' 
                                    : 'border-slate-100 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
                                  }`}
                                >
                                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-colors ${
                                    selectedPayment === method.id ? 'bg-brand text-white' : 'bg-white text-slate-400'
                                  }`}>
                                    {method.id === 'Apple Pay' ? (
                                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.057 10.774c-.015-2.28 1.861-3.375 1.944-3.428-1.077-1.554-2.73-1.767-3.318-1.791-1.404-.144-2.739.825-3.45.825-.71 0-1.815-.807-3-1.807-1.551.024-2.981.9-3.771 2.261-1.6 2.756-.408 6.818 1.134 9.042.755 1.09 1.656 2.316 2.822 2.274 1.127-.045 1.55-.724 2.915-.724 1.362 0 1.748.724 2.937.7 1.21-.021 1.993-1.104 2.736-2.191.859-1.25 1.214-2.459 1.233-2.527-.027-.012-2.373-.91-2.398-3.644M14.523 4.242c.63-.762 1.053-1.821.936-2.883-.91.036-2.012.603-2.664 1.365-.585.672-1.095 1.758-.957 2.793 1.01.078 2.055-.513 2.685-1.275"/></svg>
                                    ) : method.icon}
                                  </div>
                                  
                                  <div className="flex-1">
                                    <p className="font-display font-black text-slate-900 text-xl tracking-tight leading-none mb-1">{method.label}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                      {method.id === 'Credit Card' ? 'Secure Payment' : method.id === 'Apple Pay' ? 'Quick & Easy' : 'Manual verification'}
                                    </p>
                                  </div>
                                  
                                  <div className={`w-6 h-6 rounded-full border-[3px] transition-all flex items-center justify-center ${
                                    selectedPayment === method.id ? 'border-brand bg-brand' : 'border-slate-200'
                                  }`}>
                                    {selectedPayment === method.id && (
                                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    )}
                                  </div>
                                </button>

                                {selectedPayment === 'Credit Card' && method.id === 'Credit Card' && (
                                  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] space-y-10 animate-in slide-in-from-top-6 duration-700 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                      <div className="w-16 h-16 border-4 border-slate-900 rounded-full"></div>
                                      <div className="w-24 h-16 border-4 border-slate-900 rounded-[2rem] -mt-8 -mr-12"></div>
                                    </div>

                                    <div className="space-y-3">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4 font-mono">{language === 'ar' ? 'اسم صاحب البطاقة' : 'Cardholder Name'}</label>
                                      <input 
                                        type="text" 
                                        placeholder="JOHN DOE"
                                        value={cardInfo.holder} 
                                        onChange={e => setCardInfo({...cardInfo, holder: e.target.value.toUpperCase()})} 
                                        className="w-full px-8 py-5 rounded-2xl border border-slate-100 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all text-slate-900 font-bold placeholder:text-slate-200 text-lg uppercase tracking-wider" 
                                      />
                                    </div>

                                    <div className="space-y-3">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4 font-mono">{language === 'ar' ? 'رقم البطاقة' : 'Card Number'}</label>
                                      <div className="relative group">
                                        <input 
                                          type="text" 
                                          placeholder="0000 0000 0000 0000" 
                                          value={cardInfo.number} 
                                          onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '').substring(0, 16).replace(/(.{4})/g, '$1 ').trim();
                                            setCardInfo({...cardInfo, number: val});
                                          }} 
                                          className="w-full px-8 py-5 rounded-2xl border border-slate-100 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all text-slate-900 font-bold font-mono text-xl tracking-widest placeholder:text-slate-200" 
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-2">
                                          <div className="w-8 h-5 bg-slate-100 rounded-sm"></div>
                                          <div className="w-8 h-5 bg-brand/20 rounded-sm"></div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                      <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4 font-mono text-center block w-full">{language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry'}</label>
                                        <input 
                                          type="text" 
                                          placeholder="MM / YY" 
                                          value={cardInfo.expiry} 
                                          onChange={e => {
                                            let val = e.target.value.replace(/\D/g, '').substring(0, 4);
                                            if (val.length > 2) val = val.substring(0, 2) + ' / ' + val.substring(2);
                                            setCardInfo({...cardInfo, expiry: val});
                                          }} 
                                          className="w-full px-8 py-5 rounded-2xl border border-slate-100 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all text-slate-900 font-bold text-center text-lg placeholder:text-slate-200" 
                                        />
                                      </div>
                                      <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4 font-mono text-center block w-full">CVV</label>
                                        <input 
                                          type="password" 
                                          placeholder="***" 
                                          value={cardInfo.cvv} 
                                          onChange={e => setCardInfo({...cardInfo, cvv: e.target.value.replace(/\D/g, '').substring(0, 3)})} 
                                          className="w-full px-8 py-5 rounded-2xl border border-slate-100 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all text-slate-900 font-bold text-center text-lg placeholder:text-slate-200 tracking-[0.5em]" 
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex flex-col sm:flex-row gap-6 pt-10">
                          <button 
                            onClick={() => setCheckoutStep('survey')} 
                            className="flex-1 px-8 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-400 bg-slate-50 hover:bg-slate-100 hover:text-slate-600 transition-all duration-300"
                          >
                            {language === 'ar' ? 'رجوع' : 'Back to Details'}
                          </button>
                          <button 
                            onClick={handleBookingConfirm} 
                            disabled={bookingStatus === 'booking' || (selectedPayment === 'Credit Card' && (!cardInfo.number || !cardInfo.expiry || !cardInfo.cvv || !cardInfo.holder))}
                            className="flex-[2] py-6 bg-slate-900 hover:bg-brand text-white rounded-2xl font-black text-[14px] uppercase tracking-[0.3em] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-500 group overflow-hidden relative"
                          >
                            <div className="absolute inset-0 bg-brand translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                            <span className="relative z-10 flex items-center justify-center gap-4">
                              {bookingStatus === 'booking' ? (
                                <div className="flex items-center gap-3">
                                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                  {language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                                </div>
                              ) : (
                                <>
                                  {language === 'ar' ? 'تأكيد ودفع' : 'Confirm & Pay'} {finalTotal} {t('sar')}
                                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </>
                              )}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Success Confirmation Section (Invoice Style) */}
            {currentSection === AppSection.SUCCESS && confirmedBooking && (
              <div className="max-w-2xl mx-auto py-10 animate-in zoom-in-95 duration-700">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col relative">
                  {/* Decorative Invoice Header */}
                  <div className="bg-gray-50 px-10 py-8 border-b border-dashed border-gray-200 flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 tracking-tighter uppercase">{language === 'ar' ? 'إيصال حجز' : 'Booking Receipt'}</h2>
                      <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                        {language === 'ar' ? 'الرقم المرجعي' : 'Ref'}: #{confirmedBooking.id.toUpperCase()}
                      </p>
                    </div>
                    <div className="text-end">
                      <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center ms-auto">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase mt-2 tracking-widest">
                        {confirmedBooking.paymentMethod === 'Pay on Site' 
                          ? (language === 'ar' ? 'الدفع في الموقع' : 'Pay on Site') 
                          : (language === 'ar' ? 'تم الدفع' : 'Paid Successfully')}
                      </p>
                    </div>
                  </div>

                  <div className="p-10 space-y-10">
                    {/* Buyer & Seller Info */}
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{language === 'ar' ? 'ملخص الدفع' : 'Payment Summary'}</p>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-gray-900">{language === 'ar' ? 'الخدمات المطلوبة' : 'Requested Services'}</p>
                          <p className="text-xs font-medium text-gray-500">{confirmedBooking.items.length} {language === 'ar' ? 'خدمات' : 'Services total'}</p>
                          <p className="text-xs font-medium text-indigo-600 font-bold">{confirmedBooking.totalPrice.toFixed(2)} SAR</p>
                        </div>
                      </div>
                      <div className="space-y-3 text-end">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{language === 'ar' ? 'العميل' : 'Customer'}</p>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-gray-900">{confirmedBooking.customerName}</p>
                          <p className="text-xs font-medium text-gray-500">{confirmedBooking.customerPhone}</p>
                          <p className="text-xs font-medium text-gray-500">{new Date(confirmedBooking.timestamp).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'long' })}</p>
                        </div>
                      </div>
                    </div>

                    {/* Schedule Header */}
                    <div className="bg-indigo-50/50 p-4 rounded-2xl flex items-center justify-between border border-indigo-100/50">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📅</span>
                        <div>
                          <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">{language === 'ar' ? 'تاريخ الخدمة' : 'Service Date'}</p>
                          <p className="text-sm font-bold text-indigo-900">{confirmedBooking.serviceDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-end">
                        <div>
                          <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">{language === 'ar' ? 'وقت البدء' : 'Start Time'}</p>
                          <p className="text-sm font-bold text-indigo-900">{confirmedBooking.serviceTime}</p>
                        </div>
                        <span className="text-xl">⏰</span>
                      </div>
                    </div>

                    {/* Invoice Table */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center px-4 pb-2 border-b border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{language === 'ar' ? 'الوصف' : 'Description'}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-end">{language === 'ar' ? 'المبلغ' : 'Amount'}</p>
                      </div>
                      <div className="space-y-2">
                        {confirmedBooking.items.map(item => (
                          <div key={item.id} className="flex justify-between items-center p-4 rounded-xl hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">🛠️</div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{item.name}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">{item.quantity} {language === 'ar' ? 'وحدة' : 'Units'} @ {item.price} {t('sar')}</p>
                              </div>
                            </div>
                            <p className="text-sm font-bold text-gray-900">{(item.price * item.quantity).toFixed(2)} {t('sar')}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Totals Section */}
                    <div className="space-y-3 pt-6 border-t border-gray-100">
                      <div className="flex justify-between items-center px-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</p>
                        <p className="text-xs font-black text-gray-900 uppercase tracking-widest">{confirmedBooking.paymentMethod}</p>
                      </div>
                      <div className="space-y-2 bg-gray-50 p-4 rounded-xl mt-4">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{language === 'ar' ? 'المجموع (قبل الضريبة)' : 'Subtotal (Before Tax)'}</p>
                          <p className="text-sm font-bold text-gray-700">{(confirmedBooking.totalPrice / 1.15).toFixed(2)} SAR</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{language === 'ar' ? 'ضريبة القيمة المضافة (15%)' : 'VAT (15%)'}</p>
                          <p className="text-sm font-bold text-gray-700">{(confirmedBooking.totalPrice - (confirmedBooking.totalPrice / 1.15)).toFixed(2)} SAR</p>
                        </div>
                        <div className="pt-2 border-t border-gray-200 mt-2 flex justify-between items-center">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{language === 'ar' ? 'إجمالي الفاتورة' : 'Invoice Total'}</p>
                          <p className="text-2xl font-black text-brand tracking-tighter">
                            {confirmedBooking.totalPrice.toFixed(2)} 
                            <span className="text-xs font-medium text-gray-300 ms-1">SAR</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar (Paper Spike Bottom Design) */}
                  <div className="p-10 bg-gray-900 space-y-4">
                    <button 
                      onClick={() => handlePrintReceipt(confirmedBooking)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      {language === 'ar' ? 'حفظ أو طباعة الإيصال' : 'Print or Save Receipt'}
                    </button>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setCurrentSection(AppSection.MY_BOOKINGS)} 
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                      >
                        {t('myBookings')}
                      </button>
                      <button 
                        onClick={() => setCurrentSection(AppSection.BROWSE)} 
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                      >
                        {t('home')}
                      </button>
                    </div>
                  </div>

                  {/* Serrated Bottom Edge Effect */}
                  <div className="absolute -bottom-2 left-0 right-0 flex justify-between overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="w-8 h-8 bg-gray-900 rotate-45 transform translate-y-4 shadow-inner"></div>
                    ))}
                  </div>
                  <p className="text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest py-8 bg-gray-900">
                    {language === 'ar' ? 'تم إرسال تأكيد إلى بريدك الإلكتروني.' : 'A confirmation email has been sent to your address.'}
                  </p>
                </div>
              </div>
            )}

            {/* My History Section */}
            {currentSection === AppSection.MY_BOOKINGS && (
              <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-left-4 duration-500 pb-24">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setCurrentSection(AppSection.BROWSE)}
                      className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm group"
                    >
                      <svg className={`w-6 h-6 transition-transform group-hover:-translate-x-1 ${language === 'ar' ? 'rotate-180 group-hover:translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight">{language === 'ar' ? 'حجوزاتك' : 'Your Bookings'}</h2>
                  </div>
                  
                  {/* History Tabs */}
                  <div className="flex bg-gray-100 p-1.5 rounded-[1.5rem] w-fit">
                    {['Upcoming', 'Past'].map(tab => {
                      const isUpcoming = tab === 'Upcoming';
                      const isActive = (isUpcoming && !showPastBookings) || (!isUpcoming && showPastBookings);
                      const label = isUpcoming 
                        ? (language === 'ar' ? 'القادمة' : 'Upcoming') 
                        : (language === 'ar' ? 'السابقة' : 'Past');
                      return (
                        <button 
                          key={tab}
                          onClick={() => setShowPastBookings(!isUpcoming)}
                          className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                            isActive 
                            ? 'bg-white text-indigo-600 shadow-sm' 
                            : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {(() => {
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);
                  
                  const filtered = bookings.filter(booking => {
                    const bookingDate = new Date(booking.serviceDate);
                    bookingDate.setHours(0, 0, 0, 0);
                    
                    if (showPastBookings) {
                      return bookingDate < now || booking.status === 'Completed' || booking.status === 'Cancelled';
                    } else {
                      return bookingDate >= now && booking.status !== 'Completed' && booking.status !== 'Cancelled';
                    }
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center">
                        <div className="text-6xl mb-6 opacity-10">📅</div>
                        <p className="text-gray-300 font-black text-xl uppercase tracking-[0.2em] mb-8">
                          {language === 'ar' 
                            ? `لا توجد حجوزات ${showPastBookings ? 'سابقة' : 'قادمة'}.` 
                            : `No ${showPastBookings ? 'past' : 'upcoming'} bookings.`}
                        </p>
                        <button onClick={() => setCurrentSection(AppSection.BROWSE)} className="bg-indigo-600 text-white px-12 py-5 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-indigo-700 transition-all">{t('browseServices')}</button>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 gap-8">
                      {filtered.map(booking => (
                        <div key={booking.id} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden transition-all hover:shadow-2xl group">
                          <div className={`absolute top-0 left-0 h-full w-2 ${
                            booking.status === 'Pending' ? 'bg-amber-400' :
                            booking.status === 'Confirmed' ? 'bg-blue-500' : 
                            booking.status === 'Cancelled' ? 'bg-red-500' : 'bg-emerald-500'
                          }`}></div>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-4">
                                <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">#{booking.id.toUpperCase()}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                                <span className="text-xs font-bold text-gray-400">{new Date(booking.timestamp).toLocaleDateString()}</span>
                              </div>
                              <h3 className="text-2xl font-black text-gray-900 mb-6 group-hover:text-indigo-600 transition-colors">
                                {booking.items.map(i => `${i.quantity}x ${i.name}`).join(' & ')}
                              </h3>
                              <div className="flex flex-wrap items-center gap-8">
                                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                  <span className="text-lg">📅</span>
                                  <span className="text-sm font-black text-gray-700">{booking.serviceDate} {language === 'ar' ? 'في' : 'at'} {booking.serviceTime}</span>
                                </div>
                                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                  <span className="text-lg">💰</span>
                                  <span className="text-sm font-black text-gray-700">{booking.totalPrice} {t('sar')}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-center gap-4">
                              <div className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] border-2 text-center w-full ${
                                booking.status === 'Pending' ? 'border-amber-100 text-amber-600 bg-amber-50' :
                                booking.status === 'Confirmed' ? 'border-blue-100 text-blue-600 bg-blue-50' :
                                booking.status === 'Cancelled' ? 'border-red-100 text-red-600 bg-red-50' :
                                'border-emerald-100 text-emerald-600 bg-emerald-50'
                              }`}>
                                {booking.status === 'Pending' ? (language === 'ar' ? 'قيد الانتظار' : 'Pending') :
                                 booking.status === 'Confirmed' ? (language === 'ar' ? 'مؤكد' : 'Confirmed') :
                                 booking.status === 'Completed' ? (language === 'ar' ? 'مكتمل' : 'Completed') :
                                 (language === 'ar' ? 'ملغي' : 'Cancelled')}
                              </div>
                              <div className="flex gap-4">
                                <button 
                                  onClick={() => setSelectedBooking(booking)}
                                  className="text-xs font-black text-gray-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                                >
                                  {language === 'ar' ? 'التفاصيل' : 'Details'}
                                </button>
                                
                                {showPastBookings ? (
                                  <button 
                                    onClick={() => { setSelectedBooking(booking); setIsRescheduling(true); setRescheduleDate(booking.serviceDate); }}
                                    className="text-xs font-black text-indigo-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                                  >
                                    {language === 'ar' ? 'إعادة جدولة' : 'Reschedule'}
                                  </button>
                                ) : (
                                  <>
                                    <button 
                                      onClick={() => handlePrintReceipt(booking)}
                                      className="text-xs font-black text-gray-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                                    >
                                      {language === 'ar' ? 'الإيصال' : 'Receipt'}
                                    </button>
                                    {booking.status !== 'Cancelled' && (
                                      <>
                                        <button 
                                          onClick={() => { setSelectedBooking(booking); setIsRescheduling(true); setRescheduleDate(booking.serviceDate); }}
                                          className="text-xs font-black text-indigo-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                                        >
                                          {language === 'ar' ? 'إعادة جدولة' : 'Reschedule'}
                                        </button>
                                        <button 
                                          onClick={() => setBookingToCancel(booking)}
                                          className="text-xs font-black text-red-400 hover:text-red-600 transition-colors uppercase tracking-widest"
                                        >
                                          {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                        </button>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Profile Section */}
            {currentSection === AppSection.PROFILE && (
              <div className="max-w-2xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500 pb-24">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setCurrentSection(AppSection.BROWSE)}
                    className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm group"
                  >
                    <svg className={`w-6 h-6 transition-transform group-hover:-translate-x-1 ${language === 'ar' ? 'rotate-180 group-hover:translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h2 className="text-4xl font-black text-gray-900 tracking-tight">{language === 'ar' ? 'الملف الشخصي' : 'Profile'}</h2>
                </div>

                <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-gray-100">
                  <div className="bg-indigo-600 h-32 relative">
                    <div className="absolute -bottom-12 left-12 w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-4xl border-4 border-white">
                      👤
                    </div>
                  </div>
                  <div className="pt-16 px-12 pb-12">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h2 className="text-3xl font-black text-gray-900">{user.name}</h2>
                        <p className="text-gray-400 font-bold">{user.email}</p>
                      </div>
                      <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {user.role} {language === 'ar' ? 'حساب' : 'Account'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{language === 'ar' ? 'إحصائيات الحساب' : 'Account Statistics'}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-2xl shadow-sm">
                            <p className="text-2xl font-black text-gray-900">{bookings.length}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('myBookings')}</p>
                          </div>
                          <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                            <div>
                              <p className="text-2xl font-black text-emerald-600">{walletBalance.toFixed(2)}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{language === 'ar' ? 'المحفظة (ريال)' : 'Wallet (SAR)'}</p>
                            </div>
                            <button 
                              onClick={() => setIsToppingUp(true)}
                              className="mt-2 text-[8px] font-black text-indigo-600 uppercase tracking-widest hover:underline text-start"
                            >
                              + {language === 'ar' ? 'شحن الرصيد' : 'Top up'}
                            </button>
                          </div>
                          <div className="bg-white p-4 rounded-2xl shadow-sm">
                            <p className="text-2xl font-black text-red-500">{favorites.length}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{language === 'ar' ? 'العناصر المحفوظة' : 'Saved Items'}</p>
                          </div>
                          <div className="bg-white p-4 rounded-2xl shadow-sm">
                            <p className="text-2xl font-black text-indigo-600">
                              {bookings.reduce((acc, b) => acc + b.totalPrice, 0)}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{language === 'ar' ? 'إجمالي المنفق' : 'Total Spent'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{language === 'ar' ? 'الإعدادات' : 'Settings'}</p>
                        
                        {/* Top-up Modal */}
                        {isToppingUp && (
                          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                            <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                              <h3 className="text-2xl font-black text-gray-900 mb-2">{language === 'ar' ? 'شحن المحفظة' : 'Top up Wallet'}</h3>
                              <p className="text-gray-400 text-sm font-medium mb-8">{language === 'ar' ? 'أضف رصيداً إلى حسابك للحجز السريع.' : 'Add funds to your account for instant bookings.'}</p>
                              
                              <div className="grid grid-cols-3 gap-3 mb-8">
                                {[50, 100, 250, 500, 1000, 2000].map(amount => (
                                  <button
                                    key={amount}
                                    onClick={() => setTopUpAmount(amount)}
                                    className={`py-4 rounded-2xl font-black text-sm transition-all border-2 ${topUpAmount === amount ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-50 border-gray-50 text-gray-400 hover:border-indigo-100'}`}
                                  >
                                    {amount}
                                  </button>
                                ))}
                              </div>

                              <div className="space-y-4">
                                <button 
                                  onClick={handleTopUp}
                                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition-all active:scale-95"
                                >
                                  {language === 'ar' ? 'تأكيد الشحن' : 'Confirm Top-up'}
                                </button>
                                <button 
                                  onClick={() => setIsToppingUp(false)}
                                  className="w-full bg-gray-100 text-gray-400 py-5 rounded-2xl font-black text-lg hover:bg-gray-200 transition-all"
                                >
                                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Edit Profile Section */}
                        <div className="space-y-4">
                          <button 
                            onClick={() => {
                              setIsEditingProfile(!isEditingProfile);
                              setShowNotifications(false);
                              setEditForm({ name: user.name, email: user.email });
                            }}
                            className={`w-full flex items-center justify-between p-6 border rounded-3xl transition-all group ${isEditingProfile ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100 hover:border-indigo-200'}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isEditingProfile ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              </div>
                              <span className="font-bold text-gray-700">{language === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}</span>
                            </div>
                            <svg className={`w-5 h-5 text-gray-300 transition-all ${isEditingProfile ? 'rotate-90 text-indigo-600' : 'group-hover:text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                          </button>

                          {isEditingProfile && (
                            <form onSubmit={handleUpdateProfile} className="p-8 bg-white border-2 border-indigo-100 rounded-[2rem] space-y-6 animate-in slide-in-from-top-4 duration-300">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
                                <input 
                                  type="text" 
                                  value={editForm.name} 
                                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-black font-bold"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
                                <input 
                                  type="email" 
                                  value={editForm.email} 
                                  onChange={e => setEditForm({...editForm, email: e.target.value})}
                                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-black font-bold"
                                />
                              </div>
                              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all">
                                {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                              </button>
                            </form>
                          )}
                        </div>

                        {/* Notifications Section */}
                        <div className="space-y-4">
                          <button 
                            onClick={() => {
                              setShowNotifications(!showNotifications);
                              setIsEditingProfile(false);
                            }}
                            className={`w-full flex items-center justify-between p-6 border rounded-3xl transition-all group ${showNotifications ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100 hover:border-indigo-200'}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${showNotifications ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                              </div>
                              <span className="font-bold text-gray-700">{language === 'ar' ? 'التنبيهات' : 'Notifications'}</span>
                            </div>
                            <svg className={`w-5 h-5 text-gray-300 transition-all ${showNotifications ? 'rotate-90 text-indigo-600' : 'group-hover:text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                          </button>

                          {showNotifications && (
                            <div className="p-8 bg-white border-2 border-indigo-100 rounded-[2rem] space-y-6 animate-in slide-in-from-top-4 duration-300">
                              {[
                                { id: 'email', label: language === 'ar' ? 'تنبيهات البريد الإلكتروني' : 'Email Notifications', desc: language === 'ar' ? 'تلقي التحديثات عبر البريد الإلكتروني' : 'Receive updates via email' },
                                { id: 'push', label: language === 'ar' ? 'تنبيهات الهاتف' : 'Push Notifications', desc: language === 'ar' ? 'تنبيهات على جهازك' : 'Alerts on your device' },
                                { id: 'sms', label: language === 'ar' ? 'تنبيهات SMS' : 'SMS Alerts', desc: language === 'ar' ? 'رسائل نصية للتحديثات العاجلة' : 'Text messages for urgent updates' }
                              ].map(setting => (
                                <div key={setting.id} className="flex items-center justify-between">
                                  <div>
                                    <p className="font-bold text-gray-900">{setting.label}</p>
                                    <p className="text-xs text-gray-400 font-medium">{setting.desc}</p>
                                  </div>
                                  <button 
                                    onClick={() => setNotificationSettings({...notificationSettings, [setting.id]: !notificationSettings[setting.id as keyof typeof notificationSettings]})}
                                    className={`w-12 h-6 rounded-full transition-all relative ${notificationSettings[setting.id as keyof typeof notificationSettings] ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                  >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationSettings[setting.id as keyof typeof notificationSettings] ? 'left-7' : 'left-1'}`}></div>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <button onClick={handleLogout} className="w-full flex items-center justify-between p-6 bg-red-50 border border-red-100 rounded-3xl hover:bg-red-100 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-600 shadow-sm">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </div>
                            <span className="font-bold text-red-600">{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {role === 'admin' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <AdminDashboard 
              services={services}
              bookings={bookings} 
              categories={categoriesList.filter(c => c.id !== 'All').map(c => c.name)}
              onUpdateCategories={handleUpdateCategories}
              onAddService={handleAddService}
              onUpdateService={handleUpdateService}
              onDeleteService={handleDeleteService}
              onUpdateStatus={handleUpdateStatus} 
              onPrintReceipt={handlePrintReceipt}
              onLogout={handleLogout}
              language={language}
              onLanguageChange={setLanguage}
              t={t}
            />
          </div>
        )}
      </main>

      {/* Error Modal */}
      {appError && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-xl p-8 shadow-xl text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{language === 'ar' ? 'عذراً! حدث خطأ ما' : 'Oops! Something went wrong'}</h3>
              <p className="text-gray-500 mb-6">{appError}</p>
              <button 
                onClick={() => setAppError(null)}
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-black transition-all"
              >
                {language === 'ar' ? 'فهمت' : 'Got it'}
              </button>
            </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {successMessage && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-top-10 duration-500">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-emerald-500">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="font-bold text-sm uppercase tracking-wide">{successMessage}</p>
            <button onClick={() => setSuccessMessage(null)} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {(() => {
        const service = selectedService ? services.find(s => s.id === selectedService.id) : null;
        if (!service) return null;

        return (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-t-[2.5rem] p-6 md:p-10 shadow-2xl animate-in slide-in-from-bottom-full duration-500 relative border-t border-gray-100 overflow-hidden max-h-[85vh] flex flex-col">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 flex-shrink-0"></div>
              <button onClick={() => setSelectedService(null)} className="absolute top-8 right-8 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all z-10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1 leading-none tracking-tight">
                      {isBookingFlow ? (language === 'ar' ? 'متطلبات الخدمة' : 'Service Requirements') : (language === 'ar' && service.nameAr ? service.nameAr : service.name)}
                    </h3>
                    {isBookingFlow && (
                      <p className="text-gray-400 font-bold text-xs leading-none mb-4 uppercase tracking-widest">
                        {language === 'ar' ? 'يرجى مراجعة المتطلبات لـ' : 'Please review requirements for'} <span className="text-indigo-600">{language === 'ar' && service.nameAr ? service.nameAr : service.name}</span>
                      </p>
                    )}
                    
                    {!isBookingFlow && (
                      <p className="text-gray-600 text-lg leading-relaxed mb-6 font-medium whitespace-pre-line border-t border-gray-50 pt-6">
                        {language === 'ar' && service.descriptionAr ? service.descriptionAr : service.description}
                      </p>
                    )}

                    {isBookingFlow && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest border-b border-gray-50 pb-1 leading-none">{language === 'ar' ? '1. تفاصيل الحجز' : '1. Booking Details'}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-0.5">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1 leading-none">{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
                              <input 
                                type="text" 
                                placeholder={language === 'ar' ? 'اسمك' : 'Your Name'}
                                value={customerInfo.name} 
                                onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-xs font-bold leading-none"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1 leading-none">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                              <input 
                                type="tel" 
                                placeholder="+966"
                                value={customerInfo.phone} 
                                onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-xs font-bold leading-none"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1 leading-none">{language === 'ar' ? 'تاريخ الخدمة' : 'Service Date'}</label>
                              <input 
                                type="date" 
                                min={new Date().toISOString().split('T')[0]}
                                value={customerInfo.date} 
                                onChange={e => setCustomerInfo({...customerInfo, date: e.target.value})}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-xs font-bold leading-none"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1 leading-none">{language === 'ar' ? 'وقت الخدمة' : 'Service Time'}</label>
                              <input 
                                type="time" 
                                value={customerInfo.time} 
                                onChange={e => setCustomerInfo({...customerInfo, time: e.target.value})}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-xs font-bold leading-none"
                              />
                            </div>
                          </div>
                        </div>

                        {service.questions && service.questions.length > 0 && (
                          <div className="space-y-4 pt-2">
                            <h4 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest border-b border-gray-50 pb-1 leading-none">{language === 'ar' ? '2. متطلبات الخدمة' : '2. Service Requirements'}</h4>
                            <div className="grid grid-cols-1 gap-4">
                              {service.questions.map(q => (
                                <div key={q.id} className={`${q.type === 'description' ? 'bg-indigo-50/30 border-indigo-100' : 'bg-gray-50/50 border-gray-100'} p-4 rounded-xl border space-y-2`}>
                                  <div className="flex items-center justify-between gap-3">
                                    <p className={`font-bold text-gray-900 text-xs leading-none ${q.type === 'description' ? 'text-indigo-900' : ''}`}>
                                      {language === 'ar' && q.labelAr ? q.labelAr : q.label}
                                      {q.type !== 'description' && q.required && <span className="text-red-500 ml-1">*</span>}
                                    </p>
                                    <span className="text-xs">{q.type === 'short_answer' ? '✍️' : q.type === 'multiple_choice' ? '🔘' : q.type === 'multiple_select' ? '✅' : 'ℹ️'}</span>
                                  </div>

                                  {q.type === 'short_answer' ? (
                                    <input 
                                      type="text"
                                      placeholder={language === 'ar' ? 'إجابتك...' : 'Your answer...'}
                                      value={modalAnswers[q.id] as string || ''}
                                      onChange={e => setModalAnswers({...modalAnswers, [q.id]: e.target.value})}
                                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-xs font-bold leading-none"
                                    />
                                  ) : (q.type === 'multiple_choice' || q.type === 'multiple_select') ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {q.options?.map((opt, optIdx) => {
                                        const current = modalAnswers[q.id];
                                        const isSelected = q.type === 'multiple_select' 
                                          ? ((current as string[]) || []).includes(opt)
                                          : current === opt;
                                        
                                        return (
                                          <button
                                            key={opt}
                                            onClick={() => {
                                              if (q.type === 'multiple_select') {
                                                const list = (current as string[]) || [];
                                                setModalAnswers({...modalAnswers, [q.id]: isSelected ? list.filter(c => c !== opt) : [...list, opt]});
                                              } else {
                                                setModalAnswers({...modalAnswers, [q.id]: opt});
                                              }
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border leading-none ${
                                              isSelected 
                                              ? 'bg-indigo-600 text-white border-indigo-600' 
                                              : 'bg-white text-gray-400 border-gray-200 hover:border-indigo-200'
                                            }`}
                                          >
                                            {isSelected && q.type === 'multiple_select' && '✓ '} {language === 'ar' && q.optionsAr?.[optIdx] ? q.optionsAr[optIdx] : opt}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-6 mt-2 flex-shrink-0">
                <div className="flex flex-col leading-none">
                  <span className="text-2xl font-bold text-indigo-600 tracking-tighter leading-none">{service.price} SAR</span>
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest leading-none mt-1">{t('totalAmount')}</span>
                </div>
                <div className="flex gap-3">
                  {isBookingFlow ? (
                    <>
                      <button 
                        onClick={() => setIsBookingFlow(false)}
                        className="bg-gray-100 text-gray-600 px-6 py-4 rounded-xl text-xs font-bold transition-all hover:bg-gray-200 leading-none"
                      >
                        Back
                      </button>
                      <button 
                        disabled={!customerInfo.name || !customerInfo.phone || !customerInfo.date || !customerInfo.time}
                        onClick={() => {
                          // Existing logic remains same, just styling updated
                          if (service.questions) {
                            for (const q of service.questions) {
                              if (q.required && q.type !== 'description') {
                                const ans = modalAnswers[q.id];
                                if (Array.isArray(ans) ? ans.length === 0 : !ans) {
                                  setAppError(`Required: ${q.label}`);
                                  return;
                                }
                              }
                            }
                          }
                          const allItems = [...cart, { ...service, quantity: 1 }];
                          const initialAnswers: ServiceAnswer[] = allItems.filter(item => item.questions && item.questions.length > 0).map(item => {
                            const isCurrentService = item.id === service.id;
                            return {
                              serviceId: item.id,
                              serviceName: item.name,
                              answers: (item.questions || []).map(q => ({
                                questionId: q.id,
                                questionLabel: q.label,
                                answer: isCurrentService ? (modalAnswers[q.id] || (q.type === 'multiple_select' ? [] : '')) : (q.type === 'multiple_select' ? [] : '')
                              }))
                            };
                          });
                          setServiceAnswers(initialAnswers);
                          addToCart(service, 'payment');
                          setSuccessMessage(`Booking confirmed!`);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl text-xs font-bold shadow-xl transition-all active:scale-95 leading-none disabled:opacity-50"
                      >
                        Confirm Booking
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => {
                        if (service.questions && service.questions.length > 0) {
                          setIsBookingFlow(true);
                        } else {
                          addToCart(service, 'details');
                        }
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-5 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 transition-all active:scale-95 leading-none flex items-center gap-3"
                    >
                      {t('bookNow')}
                      <span>✨</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Mobile Bottom Navigation */}
      {role === 'customer' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 px-6 py-3 z-[60] flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <button 
            onClick={() => setCurrentSection(AppSection.BROWSE)}
            className={`flex flex-col items-center gap-1 transition-all ${currentSection === AppSection.BROWSE ? 'text-indigo-600' : 'text-gray-400'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
          </button>
          
          <button 
            onClick={() => setCurrentSection(AppSection.MY_BOOKINGS)}
            className={`flex flex-col items-center gap-1 transition-all ${currentSection === AppSection.MY_BOOKINGS ? 'text-indigo-600' : 'text-gray-400'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-widest">History</span>
          </button>
          
          <button 
            onClick={() => setCurrentSection(AppSection.PROFILE)}
            className={`flex flex-col items-center gap-1 transition-all ${currentSection === AppSection.PROFILE ? 'text-indigo-600' : 'text-gray-400'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
          </button>

          <button 
            onClick={() => setCurrentSection(AppSection.CART)}
            className={`relative flex flex-col items-center gap-1 transition-all ${currentSection === AppSection.CART ? 'text-indigo-600' : 'text-gray-400'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-black text-white ring-2 ring-white">
                {cartCount}
              </span>
            )}
            <span className="text-[10px] font-black uppercase tracking-widest">Cart</span>
          </button>
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] p-10 md:p-16 shadow-2xl animate-in zoom-in-95 duration-300 relative border border-gray-100 overflow-hidden">
            <button onClick={() => { setSelectedBooking(null); setIsRescheduling(false); }} className="absolute top-10 right-10 p-3 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="mb-10">
              <div className={`inline-block px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 ${
                selectedBooking.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                selectedBooking.status === 'Confirmed' ? 'bg-blue-50 text-blue-600' : 
                selectedBooking.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {selectedBooking.status}
              </div>
              <h3 className="text-4xl font-black text-gray-900 tracking-tight">
                {isRescheduling ? 'Reschedule Booking' : 'Booking Details'}
              </h3>
              <p className="text-gray-400 font-bold text-sm mt-2">Reference: #{selectedBooking.id.toUpperCase()}</p>
            </div>

            {isRescheduling ? (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Select New Date</label>
                  <input 
                    type="date" 
                    min={new Date().toISOString().split('T')[0]}
                    value={rescheduleDate} 
                    onChange={e => setRescheduleDate(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-black font-bold"
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsRescheduling(false)}
                    className="flex-1 bg-gray-100 py-5 rounded-[1.5rem] font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => handleRescheduleBooking(selectedBooking.id, rescheduleDate)}
                    disabled={!rescheduleDate || rescheduleDate === selectedBooking.serviceDate}
                    className="flex-[2] bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-xl shadow-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
                  >
                    Confirm New Date
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest border-b border-gray-50 pb-2">Items</h4>
                    <div className="space-y-4">
                      {selectedBooking.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between group/item">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                              <p className="text-xs text-gray-400 font-bold">{item.quantity}x • {item.price} SAR</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest border-b border-gray-50 pb-2">Schedule & Payment</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">Date</p>
                        <p className="font-bold text-gray-900">📅 {selectedBooking.serviceDate}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">Method</p>
                        <p className="font-bold text-gray-900">💳 {selectedBooking.paymentMethod}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">Total</p>
                        <p className="text-2xl font-bold text-indigo-600">{selectedBooking.totalPrice} SAR</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-10 border-t border-gray-50 flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => handlePrintReceipt(selectedBooking)}
                    className="flex-1 bg-gray-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-black transition-all flex items-center justify-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print Receipt
                  </button>
                  {selectedBooking.status !== 'Cancelled' && (
                    <>
                      <button 
                        onClick={() => setIsRescheduling(true)}
                        className="flex-1 bg-indigo-50 text-indigo-600 py-5 rounded-2xl font-bold text-lg hover:bg-indigo-100 transition-all"
                      >
                        Reschedule
                      </button>
                      <button 
                        onClick={() => setBookingToCancel(selectedBooking)}
                        className="flex-1 bg-red-50 text-red-600 py-5 rounded-2xl font-bold text-lg hover:bg-red-100 transition-all"
                      >
                        Cancel Booking
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => setSelectedBooking(null)}
                    className="flex-1 bg-gray-900 text-white py-5 rounded-2xl font-bold text-lg shadow-xl hover:bg-black transition-all"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl p-10 shadow-2xl animate-in zoom-in-95 duration-300 relative border border-gray-100 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-8 text-red-600">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight leading-none">Cancel Booking?</h3>
            <p className="text-gray-500 font-medium mb-10 leading-tight text-sm">
              Are you sure you want to cancel your booking for <span className="font-bold text-gray-900">{bookingToCancel.items.map(i => i.name).join(', ')}</span>? This action cannot be undone.
            </p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => handleCancelBooking(bookingToCancel.id)}
                className="w-full bg-red-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-red-100 hover:bg-red-700 transition-all"
              >
                Yes, Cancel Booking
              </button>
              <button 
                onClick={() => setBookingToCancel(null)}
                className="w-full bg-gray-100 text-gray-600 py-5 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all"
              >
                No, Keep it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
