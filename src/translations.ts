export type Language = 'en' | 'ar';

export const translations = {
  en: {
    // Navbar
    home: 'Home',
    services: 'Services',
    myBookings: 'My Bookings',
    admin: 'Admin',
    overview: 'Overview',
    orders: 'Orders',
    analytics: 'Analytics',
    login: 'Login',
    logout: 'Logout',
    profile: 'Profile',
    cart: 'Cart',
    
    // Landing Page
    heroTitle: 'Professional Services at Your Fingertips',
    heroSubtitle: 'Book the best professionals for your home, office, or personal needs with just a few clicks.',
    getStarted: 'Get Started',
    browseServices: 'Browse Services',
    
    // Browse Section
    allCategories: 'All',
    allServices: 'All Services',
    viewAll: 'View All',
    viewLess: 'View Less',
    searchPlaceholder: 'Search for services...',
    noServicesFound: 'No services found matching your search.',
    
    // Service Card
    details: 'Details',
    bookNow: 'Book Now',
    sar: 'SAR',
    
    // Cart & Checkout
    yourSelection: 'Your Selection',
    professionalDetails: 'Professional Details',
    serviceRequirements: 'Service Requirements',
    securePayment: 'Secure Payment',
    basketEmpty: 'Your basket is empty',
    browseAvailable: 'Browse Available Services',
    subtotal: 'Subtotal',
    serviceFee: 'Service Fee',
    discount: 'Discount',
    total: 'Total',
    proceed: 'Proceed',
    previous: 'Previous',
    nextPayment: 'Next: Payment',
    nextRequirements: 'Next: Requirements',
    pay: 'Pay',
    processing: 'Processing...',
    
    // Forms
    fullName: 'Full Name',
    phone: 'Phone Number',
    serviceDate: 'Service Date',
    serviceTime: 'Service Time',
    promoCode: 'Promo Code',
    apply: 'Apply',
    
    // Payment
    creditCard: 'Credit Card',
    applePay: 'Apple Pay',
    wallet: 'Wallet',
    payOnSite: 'Pay on Site',
    cardHolder: 'Cardholder Name',
    cardNumber: 'Card Number',
    expiry: 'Expiry',
    cvv: 'CVV',
    balance: 'Balance',
    insufficientBalance: 'Insufficient wallet balance.',
    
    // Success
    bookingSecured: 'Booking Secured',
    orderId: 'Order ID',
    backToHome: 'Back to Home',
    viewHistory: 'View History',
    
    // History
    bookingHistory: 'Booking History',
    noBookings: 'No bookings found.',
    reference: 'Reference',
    status: 'Status',
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    reschedule: 'Reschedule',
    cancelBooking: 'Cancel Booking',
    printReceipt: 'Print Receipt',
    
    // Profile
    personalProfile: 'Personal Profile',
    editProfile: 'Edit Profile',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    notifications: 'Notifications',
    
    // Admin
    adminDashboard: 'Admin Dashboard',
    totalRevenue: 'Total Revenue',
    totalBookings: 'Total Bookings',
    activeServices: 'Active Services',
    manageServices: 'Manage Services',
    addService: 'Add Service',
    editService: 'Edit Service',
    deleteService: 'Delete Service',
    
    // Modals
    confirmCancelTitle: 'Cancel Booking?',
    confirmCancelDesc: 'Are you sure you want to cancel this booking? This action cannot be undone.',
    yesCancel: 'Yes, Cancel Booking',
    noKeep: 'No, Keep it',
    
    // Requirements Modal
    bookingDetails: '1. Booking Details',
    reqsTitle: '2. Service Requirements',
    back: 'Back',
    confirmAddToCart: 'Confirm & Add to Cart',
    moreInfoRequired: 'More Info Required',
    shortAnswer: 'Short Answer',
    multipleChoice: 'Multiple Choice',
    multipleSelect: 'Multiple Select',
    description: 'Description',
    yourAnswer: 'Your answer...',
    
    // Support
    liveSupport: 'Live Support',
    typicallyReplies: 'Typically replies in 5m',
    typeMessage: 'Type your message...',
    totalAmount: 'Total Amount',
  },
  ar: {
    // Navbar
    home: 'الرئيسية',
    services: 'الخدمات',
    myBookings: 'حجوزاتي',
    admin: 'لوحة التحكم',
    overview: 'نظرة عامة',
    orders: 'الطلبات',
    analytics: 'التحليلات',
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    profile: 'الملف الشخصي',
    cart: 'السلة',
    
    // Landing Page
    heroTitle: 'خدمات احترافية بين يديك',
    heroSubtitle: 'احجز أفضل المحترفين لاحتياجاتك المنزلية أو المكتبية أو الشخصية بنقرات قليلة.',
    getStarted: 'ابدأ الآن',
    browseServices: 'تصفح الخدمات',
    
    // Browse Section
    allCategories: 'الكل',
    allServices: 'جميع الخدمات',
    viewAll: 'عرض الكل',
    viewLess: 'عرض أقل',
    searchPlaceholder: 'ابحث عن الخدمات...',
    noServicesFound: 'لم يتم العثور على خدمات تطابق بحثك.',
    
    // Service Card
    details: 'التفاصيل',
    bookNow: 'احجز الآن',
    sar: 'ريال',
    
    // Cart & Checkout
    yourSelection: 'اختيارك',
    professionalDetails: 'التفاصيل المهنية',
    serviceRequirements: 'متطلبات الخدمة',
    securePayment: 'دفع آمن',
    basketEmpty: 'سلتك فارغة',
    browseAvailable: 'تصفح الخدمات المتاحة',
    subtotal: 'المجموع الفرعي',
    serviceFee: 'رسوم الخدمة',
    discount: 'الخصم',
    total: 'المجموع',
    proceed: 'متابعة',
    previous: 'السابق',
    nextPayment: 'التالي: الدفع',
    nextRequirements: 'التالي: المتطلبات',
    pay: 'دفع',
    processing: 'جاري المعالجة...',
    
    // Forms
    fullName: 'الاسم الكامل',
    phone: 'رقم الهاتف',
    serviceDate: 'تاريخ الخدمة',
    serviceTime: 'وقت الخدمة',
    promoCode: 'كود الخصم',
    apply: 'تطبيق',
    
    // Payment
    creditCard: 'بطاقة ائتمان',
    applePay: 'أبل باي',
    wallet: 'المحفظة',
    payOnSite: 'الدفع في الموقع',
    cardHolder: 'اسم صاحب البطاقة',
    cardNumber: 'رقم البطاقة',
    expiry: 'تاريخ الانتهاء',
    cvv: 'الرمز السري',
    balance: 'الرصيد',
    insufficientBalance: 'رصيد المحفظة غير كافٍ.',
    
    // Success
    bookingSecured: 'تم تأكيد الحجز',
    orderId: 'رقم الطلب',
    backToHome: 'العودة للرئيسية',
    viewHistory: 'عرض السجل',
    
    // History
    bookingHistory: 'سجل الحجوزات',
    noBookings: 'لا توجد حجوزات.',
    reference: 'المرجع',
    status: 'الحالة',
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    reschedule: 'إعادة جدولة',
    cancelBooking: 'إلغاء الحجز',
    printReceipt: 'طباعة الإيصال',
    
    // Profile
    personalProfile: 'الملف الشخصي',
    editProfile: 'تعديل الملف',
    saveChanges: 'حفظ التغييرات',
    cancel: 'إلغاء',
    notifications: 'التنبيهات',
    
    // Admin
    adminDashboard: 'لوحة تحكم المسؤول',
    totalRevenue: 'إجمالي الإيرادات',
    totalBookings: 'إجمالي الحجوزات',
    activeServices: 'الخدمات النشطة',
    manageServices: 'إدارة الخدمات',
    addService: 'إضافة خدمة',
    editService: 'تعديل خدمة',
    deleteService: 'حذف خدمة',
    
    // Modals
    confirmCancelTitle: 'إلغاء الحجز؟',
    confirmCancelDesc: 'هل أنت متأكد أنك تريد إلغاء هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.',
    yesCancel: 'نعم، إلغاء الحجز',
    noKeep: 'لا، الاحتفاظ به',
    
    // Requirements Modal
    bookingDetails: '١. تفاصيل الحجز',
    reqsTitle: '٢. متطلبات الخدمة',
    back: 'رجوع',
    confirmAddToCart: 'تأكيد وإضافة للسلة',
    moreInfoRequired: 'مطلوب مزيد من المعلومات',
    shortAnswer: 'إجابة قصيرة',
    multipleChoice: 'اختيار من متعدد',
    multipleSelect: 'تحديد متعدد',
    description: 'وصف',
    yourAnswer: 'إجابتك...',
    
    // Support
    liveSupport: 'الدعم المباشر',
    typicallyReplies: 'يرد عادةً خلال ٥ دقائق',
    typeMessage: 'اكتب رسالتك...',
    totalAmount: 'إجمالي المبلغ',
  }
};
