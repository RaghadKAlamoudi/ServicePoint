import React from 'react';
import { Service } from './types';

export const ADMIN_EMAILS = ["raghadalamoudi0@gmail.com", "admin@servicepoint.com"];

export const INITIAL_SERVICES: Service[] = [
  {
    id: '1',
    name: 'AC Deep Cleaning & Maintenance',
    nameAr: 'تنظيف وصيانة المكيفات بعمق',
    price: 250,
    description: 'Full split or window AC cleaning, filter wash, and gas level check.',
    descriptionAr: 'تنظيف كامل للمكيفات السبلت أو الشباك، غسيل الفلاتر، وفحص مستوى الغاز.',
    category: 'Home Maintenance',
    categoryAr: 'صيانة المنزل',
    bookingCount: 0,
    questions: [
      { id: 'q1-1', type: 'description', label: 'Please ensure the area around the AC unit is clear for our technicians.', labelAr: 'يرجى التأكد من خلو المنطقة المحيطة بوحدة التكييف للفنيين لدينا.', required: false },
      { id: 'q1-2', type: 'multiple_choice', label: 'AC Type', labelAr: 'نوع المكيف', options: ['Split', 'Window', 'Central'], optionsAr: ['سبلت', 'شباك', 'مركزي'], required: true },
      { id: 'q1-3', type: 'short_answer', label: 'Number of Units', labelAr: 'عدد الوحدات', required: true },
      { id: 'q1-4', type: 'multiple_select', label: 'Additional Services', labelAr: 'خدمات إضافية', options: ['Gas Refill', 'Filter Replacement', 'Leak Repair'], optionsAr: ['تعبئة غاز', 'استبدال الفلتر', 'إصلاح التسريب'], required: false }
    ]
  },
  {
    id: '1-2',
    name: 'Plumbing Repair',
    nameAr: 'إصلاح السباكة',
    price: 150,
    description: 'Fixing leaks, clogged drains, and faucet replacements.',
    descriptionAr: 'إصلاح التسريبات، انسداد المصارف، واستبدال الصنابير.',
    category: 'Home Maintenance',
    categoryAr: 'صيانة المنزل',
    bookingCount: 0,
    questions: [
      { id: 'q1-2-1', type: 'description', label: 'Our plumbers will arrive with standard tools. Please specify if specialized parts are needed.', labelAr: 'سيصل السباكون لدينا مع الأدوات القياسية. يرجى تحديد ما إذا كانت هناك حاجة لقطع غيار متخصصة.', required: false },
      { id: 'q1-2-2', type: 'multiple_select', label: 'Issue Type', labelAr: 'نوع المشكلة', options: ['Leaking Pipe', 'Clogged Drain', 'Faucet Repair', 'Toilet Issue'], optionsAr: ['تسريب أنابيب', 'انسداد مصرف', 'إصلاح صنبور', 'مشكلة في المرحاض'], required: true },
      { id: 'q1-2-3', type: 'short_answer', label: 'Location of the issue (e.g., Kitchen, Bathroom)', labelAr: 'موقع المشكلة (مثلاً: المطبخ، الحمام)', required: true },
      { id: 'q1-2-4', type: 'multiple_choice', label: 'Urgency', labelAr: 'الأهمية', options: ['Emergency', 'Today', 'This Week'], optionsAr: ['طارئ', 'اليوم', 'هذا الأسبوع'], required: true }
    ]
  },
  {
    id: '1-3',
    name: 'Electrical Inspection',
    nameAr: 'فحص الكهرباء',
    price: 200,
    description: 'Full home wiring check and circuit breaker maintenance.',
    descriptionAr: 'فحص كامل لتمديدات المنزل وصيانة قواطع الدائرة.',
    category: 'Home Maintenance',
    categoryAr: 'صيانة المنزل',
    bookingCount: 0,
    questions: [
      { id: 'q1-3-1', type: 'multiple_choice', label: 'Property Type', labelAr: 'نوع العقار', options: ['Villa', 'Apartment', 'Office'], optionsAr: ['فيلا', 'شقة', 'مكتب'], required: true },
      { id: 'q1-3-2', type: 'short_answer', label: 'Number of Rooms', labelAr: 'عدد الغرف', required: true },
      { id: 'q1-3-3', type: 'multiple_select', label: 'Specific Concerns', labelAr: 'مخاوف محددة', options: ['Flickering Lights', 'Tripping Breakers', 'Burning Smell', 'General Checkup'], optionsAr: ['وميض الأضواء', 'تعطل القواطع', 'رائحة حريق', 'فحص عام'], required: true }
    ]
  },
  {
    id: '2',
    name: 'Executive Car Wash (Home Service)',
    nameAr: 'غسيل سيارات فاخر (خدمة منزلية)',
    price: 150,
    description: 'Exterior steam wash and interior vacuuming at your doorstep.',
    descriptionAr: 'غسيل خارجي بالبخار وتكنيس داخلي عند باب منزلك.',
    category: 'Automotive',
    categoryAr: 'السيارات',
    bookingCount: 0,
    questions: [
      { id: 'q2-1', type: 'description', label: 'Please ensure your car is parked in a location with at least 1 meter of space around it.', labelAr: 'يرجى التأكد من ركن سيارتك في مكان تتوفر فيه مساحة متر واحد على الأقل حولها.', required: false },
      { id: 'q2-2', type: 'multiple_choice', label: 'Car Size', labelAr: 'حجم السيارة', options: ['Sedan', 'SUV', 'Truck'], optionsAr: ['سيدان', 'دفع رباعي', 'شباك'], required: true },
      { id: 'q2-3', type: 'short_answer', label: 'Car Plate Number', labelAr: 'رقم لوحة السيارة', required: true },
      { id: 'q2-4', type: 'multiple_select', label: 'Add-ons', labelAr: 'إضافات', options: ['Engine Cleaning', 'Leather Conditioning', 'Tire Shine'], optionsAr: ['تنظيف المحرك', 'ترطيب الجلد', 'تلميع الإطارات'], required: false }
    ]
  },
  {
    id: '2-2',
    name: 'Mobile Oil Change',
    nameAr: 'تغيير زيت متنقل',
    price: 350,
    description: 'Full synthetic oil change and filter replacement at your home.',
    descriptionAr: 'تغيير زيت تخليقي كامل واستبدال الفلتر في منزلك.',
    category: 'Automotive',
    categoryAr: 'السيارات',
    bookingCount: 0,
    questions: [
      { id: 'q2-2-1', type: 'short_answer', label: 'Car Make and Model', labelAr: 'ماركة وموديل السيارة', required: true },
      { id: 'q2-2-2', type: 'short_answer', label: 'Year of Manufacture', labelAr: 'سنة الصنع', required: true },
      { id: 'q2-2-3', type: 'multiple_choice', label: 'Oil Type Preferred', labelAr: 'نوع الزيت المفضل', options: ['5W-30', '10W-40', '0W-20', 'Not Sure'], optionsAr: ['5W-30', '10W-40', '0W-20', 'غير متأكد'], required: true }
    ]
  },
  {
    id: '2-3',
    name: 'Battery Replacement',
    nameAr: 'استبدال البطارية',
    price: 450,
    description: 'On-site battery testing and replacement with 1-year warranty.',
    descriptionAr: 'فحص واستبدال البطارية في الموقع مع ضمان لمدة عام.',
    category: 'Automotive',
    categoryAr: 'السيارات',
    bookingCount: 0,
    questions: [
      { id: 'q2-3-1', type: 'short_answer', label: 'Current Battery Brand (if known)', labelAr: 'ماركة البطارية الحالية (إن وجدت)', required: false },
      { id: 'q2-3-2', type: 'multiple_choice', label: 'Car Engine Type', labelAr: 'نوع محرك السيارة', options: ['Petrol', 'Diesel', 'Hybrid'], optionsAr: ['بنزين', 'ديزل', 'هجين'], required: true },
      { id: 'q2-3-3', type: 'description', label: 'Our technician will test your alternator as well during the visit.', labelAr: 'سيقوم الفني لدينا باختبار المولد الخاص بك أيضاً خلال الزيارة.', required: false }
    ]
  },
  {
    id: '3',
    name: 'Certified Arabic-English Translation',
    nameAr: 'ترجمة معتمدة عربي-إنجليزي',
    price: 120,
    description: 'Professional translation of legal or technical documents per page.',
    descriptionAr: 'ترجمة احترافية للوثائق القانونية أو التقنية لكل صفحة.',
    category: 'Professional',
    categoryAr: 'احترافي',
    bookingCount: 0,
    questions: [
      { id: 'q3-1', type: 'multiple_choice', label: 'Document Type', labelAr: 'نوع الوثيقة', options: ['Legal', 'Medical', 'Technical', 'General'], optionsAr: ['قانوني', 'طبي', 'تقني', 'عام'], required: true },
      { id: 'q3-2', type: 'short_answer', label: 'Total Number of Pages', labelAr: 'إجمالي عدد الصفحات', required: true },
      { id: 'q3-3', type: 'multiple_select', label: 'Required Certifications', labelAr: 'الشهادات المطلوبة', options: ['Ministry of Justice', 'MOFA', 'Chamber of Commerce'], optionsAr: ['وزارة العدل', 'وزارة الخارجية', 'الغرفة التجارية'], required: false }
    ]
  },
  {
    id: '3-2',
    name: 'Legal Consultation (1h)',
    nameAr: 'استشارة قانونية (ساعة واحدة)',
    price: 500,
    description: 'One-on-one session with a certified legal expert.',
    descriptionAr: 'جلسة فردية مع خبير قانوني معتمد.',
    category: 'Professional',
    categoryAr: 'احترافي',
    bookingCount: 0,
    questions: [
      { id: 'q3-2-1', type: 'multiple_choice', label: 'Area of Law', labelAr: 'مجال القانون', options: ['Corporate', 'Family', 'Labor', 'Real Estate', 'Criminal'], optionsAr: ['شركات', 'أسرة', 'عمل', 'عقارات', 'جنائي'], required: true },
      { id: 'q3-2-2', type: 'short_answer', label: 'Briefly describe your case', labelAr: 'صف قضيتك باختصار', required: true },
      { id: 'q3-2-3', type: 'multiple_choice', label: 'Consultation Mode', labelAr: 'طريقة الاستشارة', options: ['In-Person', 'Video Call', 'Phone Call'], optionsAr: ['حضورياً', 'اتصال فيديو', 'اتصال هاتفي'], required: true }
    ]
  },
  {
    id: '3-3',
    name: 'Business Registration Support',
    nameAr: 'دعم تسجيل الأعمال',
    price: 1500,
    description: 'Full assistance with CR registration and licensing.',
    descriptionAr: 'مساعدة كاملة في تسجيل السجل التجاري والترخيص.',
    category: 'Professional',
    categoryAr: 'احترافي',
    bookingCount: 0,
    questions: [
      { id: 'q3-3-1', type: 'multiple_choice', label: 'Business Type', labelAr: 'نوع العمل', options: ['LLC', 'Sole Proprietorship', 'Joint Venture'], optionsAr: ['شركة ذات مسؤولية محدودة', 'مؤسسة فردية', 'مشروع مشترك'], required: true },
      { id: 'q3-3-2', type: 'short_answer', label: 'Proposed Business Name', labelAr: 'اسم العمل المقترح', required: true },
      { id: 'q3-3-3', type: 'multiple_select', label: 'Required Licenses', labelAr: 'التراخيص المطلوبة', options: ['Municipality', 'Civil Defense', 'Labor Office'], optionsAr: ['البلدية', 'الدفاع المدني', 'مكتب العمل'], required: true }
    ]
  },
  {
    id: '4',
    name: 'Desert Safari Photography',
    nameAr: 'تصوير سفاري صحراوي',
    price: 850,
    description: '4-hour professional photography session for groups or families.',
    descriptionAr: 'جلسة تصوير احترافية لمدة 4 ساعات للمجموعات أو العائلات.',
    category: 'Events',
    categoryAr: 'فعاليات',
    bookingCount: 0,
    questions: [
      { id: 'q4-1', type: 'short_answer', label: 'Number of People', labelAr: 'عدد الأشخاص', required: true },
      { id: 'q4-2', type: 'multiple_choice', label: 'Occasion', labelAr: 'المناسبة', options: ['Family Trip', 'Engagement', 'Corporate Event', 'Personal'], optionsAr: ['رحلة عائلية', 'خطوبة', 'فعالية شركة', 'شخصي'], required: true },
      { id: 'q4-3', type: 'multiple_select', label: 'Deliverables', labelAr: 'المخرجات', options: ['Digital Copies', 'Printed Album', 'Framed Photo', 'Video Highlights'], optionsAr: ['نسخ رقمية', 'ألبوم مطبوع', 'صورة مؤطرة', 'فيديو مميز'], required: true }
    ]
  },
  {
    id: '4-2',
    name: 'Event Catering (Per Person)',
    nameAr: 'تموين الفعاليات (للشخص)',
    price: 150,
    description: 'Premium buffet service with diverse international cuisines.',
    descriptionAr: 'خدمة بوفيه متميزة مع مطابخ عالمية متنوعة.',
    category: 'Events',
    categoryAr: 'فعاليات',
    bookingCount: 0,
    questions: [
      { id: 'q4-2-1', type: 'multiple_choice', label: 'Cuisine Preference', labelAr: 'المطبخ المفضل', options: ['Arabic', 'International', 'Asian', 'Italian'], optionsAr: ['عربي', 'عالمي', 'آسيوي', 'إيطالي'], required: true },
      { id: 'q4-2-2', type: 'short_answer', label: 'Number of Guests', labelAr: 'عدد الضيوف', required: true },
      { id: 'q4-2-3', type: 'multiple_select', label: 'Dietary Requirements', labelAr: 'متطلبات غذائية', options: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Nut-Free'], optionsAr: ['نباتي', 'نباتي صرف', 'خالي من الغلوتين', 'خالي من المكسرات'], required: false }
    ]
  },
  {
    id: '4-3',
    name: 'DJ & Sound System',
    nameAr: 'دي جي ونظام صوتي',
    price: 1200,
    description: 'Professional DJ with high-quality sound and lighting setup.',
    descriptionAr: 'دي جي محترف مع نظام صوت وإضاءة عالي الجودة.',
    category: 'Events',
    categoryAr: 'فعاليات',
    bookingCount: 0,
    questions: [
      { id: 'q4-3-1', type: 'multiple_choice', label: 'Event Type', labelAr: 'نوع الفعالية', options: ['Wedding', 'Birthday', 'Corporate', 'Private Party'], optionsAr: ['زفاف', 'عيد ميلاد', 'شركة', 'حفلة خاصة'], required: true },
      { id: 'q4-3-2', type: 'multiple_select', label: 'Music Genres', labelAr: 'أنواع الموسيقى', options: ['Pop', 'House', 'Arabic', 'Hip-Hop', 'Jazz'], optionsAr: ['بوب', 'هاوس', 'عربي', 'هيب هوب', 'جاز'], required: true },
      { id: 'q4-3-3', type: 'description', label: 'Please ensure the venue has a stable power supply for the sound system.', labelAr: 'يرجى التأكد من أن المكان يحتوي على مصدر طاقة مستقر لنظام الصوت.', required: false }
    ]
  },
  {
    id: '5',
    name: 'Home Nursing & Eldercare (4h)',
    nameAr: 'تمريض منزلي ورعاية كبار السن (4 ساعات)',
    price: 400,
    description: 'Certified medical assistant for home health monitoring and support.',
    descriptionAr: 'مساعد طبي معتمد لمراقبة الصحة المنزلية والدعم.',
    category: 'Healthcare',
    categoryAr: 'رعاية صحية',
    bookingCount: 0,
    questions: [
      { id: 'q5-1', type: 'short_answer', label: 'Patient Age', labelAr: 'عمر المريض', required: true },
      { id: 'q5-2', type: 'multiple_select', label: 'Required Services', labelAr: 'الخدمات المطلوبة', options: ['Medication Admin', 'Wound Care', 'Vital Monitoring', 'Mobility Support'], optionsAr: ['إعطاء الدواء', 'العناية بالجروح', 'مراقبة العلامات الحيوية', 'دعم الحركة'], required: true },
      { id: 'q5-3', type: 'short_answer', label: 'Medical History Summary', labelAr: 'ملخص التاريخ الطبي', required: true }
    ]
  },
  {
    id: '5-2',
    name: 'Physiotherapy Session',
    nameAr: 'جلسة علاج طبيعي',
    price: 350,
    description: 'Personalized physical therapy at home for recovery and mobility.',
    descriptionAr: 'علاج طبيعي مخصص في المنزل للتعافي والحركة.',
    category: 'Healthcare',
    categoryAr: 'رعاية صحية',
    bookingCount: 0,
    questions: [
      { id: 'q5-2-1', type: 'multiple_choice', label: 'Reason for Therapy', labelAr: 'سبب العلاج', options: ['Post-Surgery', 'Sports Injury', 'Chronic Pain', 'Elderly Care'], optionsAr: ['بعد الجراحة', 'إصابة رياضية', 'ألم مزمن', 'رعاية المسنين'], required: true },
      { id: 'q5-2-2', type: 'short_answer', label: 'Target Area (e.g., Knee, Back)', labelAr: 'المنطقة المستهدفة (مثلاً: الركبة، الظهر)', required: true },
      { id: 'q5-2-3', type: 'description', label: 'Please have any recent X-rays or MRI reports ready for the therapist.', labelAr: 'يرجى تجهيز أي تقارير أشعة سينية أو رنين مغناطيسي حديثة للمعالج.', required: false }
    ]
  },
  {
    id: '5-3',
    name: 'Blood Test at Home',
    nameAr: 'فحص دم في المنزل',
    price: 250,
    description: 'Professional sample collection and lab report delivery.',
    descriptionAr: 'جمع عينات احترافي وتسليم تقارير المختبر.',
    category: 'Healthcare',
    categoryAr: 'رعاية صحية',
    bookingCount: 0,
    questions: [
      { id: 'q5-3-1', type: 'multiple_select', label: 'Test Package', labelAr: 'باقة الفحص', options: ['Full Body Checkup', 'Diabetes Profile', 'Vitamin D', 'Thyroid Profile'], optionsAr: ['فحص كامل للجسم', 'ملف السكري', 'فيتامين د', 'ملف الغدة الدرقية'], required: true },
      { id: 'q5-3-2', type: 'description', label: 'Please fast for 10-12 hours before the appointment if required for your test.', labelAr: 'يرجى الصيام لمدة 10-12 ساعة قبل الموعد إذا كان مطلوباً لفحصك.', required: false },
      { id: 'q5-3-3', type: 'short_answer', label: 'Preferred Lab (if any)', labelAr: 'المختبر المفضل (إن وجد)', required: false }
    ]
  },
  {
    id: '6',
    name: 'Web & App Troubleshooting',
    nameAr: 'استكشاف أخطاء الويب والتطبيقات وإصلاحها',
    price: 300,
    description: 'Remote or on-site support for software issues and networking.',
    descriptionAr: 'دعم عن بعد أو في الموقع لمشاكل البرمجيات والشبكات.',
    category: 'Tech Support',
    categoryAr: 'دعم تقني',
    bookingCount: 0,
    questions: [
      { id: 'q6-1', type: 'multiple_choice', label: 'Device Type', labelAr: 'نوع الجهاز', options: ['Laptop', 'Desktop', 'Smartphone', 'Tablet', 'Server'], optionsAr: ['لابتوب', 'كمبيوتر مكتبي', 'هاتف ذكي', 'تابلت', 'سيرفر'], required: true },
      { id: 'q6-2', type: 'short_answer', label: 'Operating System', labelAr: 'نظام التشغيل', required: true },
      { id: 'q6-3', type: 'short_answer', label: 'Describe the issue', labelAr: 'صف المشكلة', required: true }
    ]
  },
  {
    id: '6-2',
    name: 'Smart Home Setup',
    nameAr: 'إعداد المنزل الذكي',
    price: 800,
    description: 'Installation and configuration of smart lights, cameras, and locks.',
    descriptionAr: 'تركيب وتكوين الأضواء والكاميرات والأقفال الذكية.',
    category: 'Tech Support',
    categoryAr: 'دعم تقني',
    bookingCount: 0,
    questions: [
      { id: 'q6-2-1', type: 'multiple_select', label: 'Devices to Install', labelAr: 'الأجهزة المراد تركيبها', options: ['Smart Lights', 'Security Cameras', 'Smart Lock', 'Thermostat', 'Smart Hub'], optionsAr: ['أضواء ذكية', 'كاميرات مراقبة', 'قفل ذكي', 'ترموستات', 'موزع ذكي'], required: true },
      { id: 'q6-2-2', type: 'multiple_choice', label: 'Preferred Ecosystem', labelAr: 'النظام المفضل', options: ['Google Home', 'Amazon Alexa', 'Apple HomeKit', 'Other'], optionsAr: ['جوجل هوم', 'أمازون أليكسا', 'أبل هوم كيت', 'آخر'], required: true },
      { id: 'q6-2-3', type: 'description', label: 'A stable Wi-Fi connection is required for all smart home devices.', labelAr: 'مطلوب اتصال Wi-Fi مستقر لجميع أجهزة المنزل الذكي.', required: false }
    ]
  },
  {
    id: '6-3',
    name: 'Data Recovery Service',
    nameAr: 'خدمة استعادة البيانات',
    price: 500,
    description: 'Professional recovery of lost files from hard drives or SSDs.',
    descriptionAr: 'استعادة احترافية للملفات المفقودة من الأقراص الصلبة أو SSD.',
    category: 'Tech Support',
    categoryAr: 'دعم تقني',
    bookingCount: 0,
    questions: [
      { id: 'q6-3-1', type: 'multiple_choice', label: 'Storage Media', labelAr: 'وسائط التخزين', options: ['Internal HDD', 'External HDD', 'SSD', 'USB Flash Drive', 'SD Card'], optionsAr: ['HDD داخلي', 'HDD خارجي', 'SSD', 'فلاش USB', 'بطاقة SD'], required: true },
      { id: 'q6-3-2', type: 'multiple_choice', label: 'Cause of Loss', labelAr: 'سبب الفقدان', options: ['Accidental Deletion', 'Formatting', 'Physical Damage', 'Virus/Malware'], optionsAr: ['حذف غير مقصود', 'فورمات', 'ضرر مادي', 'فيروس/برامج ضارة'], required: true },
      { id: 'q6-3-3', type: 'short_answer', label: 'Estimated Data Size', labelAr: 'حجم البيانات المقدر', required: false }
    ]
  },
  {
    id: '7',
    name: 'Personal Chef Service (Dinner)',
    nameAr: 'خدمة شيف شخصي (عشاء)',
    price: 600,
    description: 'A professional chef prepares a 3-course meal in your kitchen.',
    descriptionAr: 'شيف محترف يعد وجبة من 3 أطباق في مطبخك.',
    category: 'Wellness',
    categoryAr: 'عافية',
    bookingCount: 0,
    questions: [
      { id: 'q7-1', type: 'multiple_choice', label: 'Cuisine Style', labelAr: 'نمط المطبخ', options: ['French', 'Japanese', 'Mediterranean', 'Modern Fusion'], optionsAr: ['فرنسي', 'ياباني', 'متوسطي', 'فيوجن حديث'], required: true },
      { id: 'q7-2', type: 'short_answer', label: 'Number of Diners', labelAr: 'عدد المتناولين', required: true },
      { id: 'q7-3', type: 'multiple_select', label: 'Allergies', labelAr: 'حساسية', options: ['Shellfish', 'Dairy', 'Gluten', 'Nuts', 'None'], optionsAr: ['محار', 'ألبان', 'غلوتين', 'مكسرات', 'لا يوجد'], required: true }
    ]
  },
  {
    id: '7-2',
    name: 'Home Massage (90 min)',
    nameAr: 'مساج منزلي (90 دقيقة)',
    price: 450,
    description: 'Relaxing full-body massage by a certified therapist.',
    descriptionAr: 'مساج مريح لكامل الجسم من قبل معالج معتمد.',
    category: 'Wellness',
    categoryAr: 'عافية',
    bookingCount: 0,
    questions: [
      { id: 'q7-2-1', type: 'multiple_choice', label: 'Massage Type', labelAr: 'نوع المساج', options: ['Swedish', 'Deep Tissue', 'Thai', 'Aromatherapy'], optionsAr: ['سويدي', 'أنسجة عميقة', 'تايلاندي', 'علاجي بالروائح'], required: true },
      { id: 'q7-2-2', type: 'multiple_choice', label: 'Pressure Preference', labelAr: 'تفضيل الضغط', options: ['Light', 'Medium', 'Firm'], optionsAr: ['خفيف', 'متوسط', 'قوي'], required: true },
      { id: 'q7-2-3', type: 'description', label: 'The therapist will bring a portable massage table and oils.', labelAr: 'سيحضر المعالج طاولة مساج محمولة وزيوت.', required: false }
    ]
  },
  {
    id: '7-3',
    name: 'Personal Trainer (Session)',
    nameAr: 'مدرب شخصي (جلسة)',
    price: 200,
    description: 'One-on-one fitness coaching tailored to your goals.',
    descriptionAr: 'تدريب لياقة بدنية فردي مخصص لأهدافك.',
    category: 'Wellness',
    categoryAr: 'عافية',
    bookingCount: 0,
    questions: [
      { id: 'q7-3-1', type: 'multiple_choice', label: 'Fitness Goal', labelAr: 'هدف اللياقة', options: ['Weight Loss', 'Muscle Gain', 'Flexibility', 'General Health'], optionsAr: ['فقدان الوزن', 'زيادة العضلات', 'مرونة', 'صحة عامة'], required: true },
      { id: 'q7-3-2', type: 'multiple_choice', label: 'Experience Level', labelAr: 'مستوى الخبرة', options: ['Beginner', 'Intermediate', 'Advanced'], optionsAr: ['مبتدئ', 'متوسط', 'متقدم'], required: true },
      { id: 'q7-3-3', type: 'short_answer', label: 'Any existing injuries?', labelAr: 'أي إصابات موجودة؟', required: true }
    ]
  },
  {
    id: '8',
    name: 'Pet Relocation Consultation',
    nameAr: 'استشارة نقل الحيوانات الأليفة',
    price: 500,
    description: 'Expert guidance on international pet travel and documentation.',
    descriptionAr: 'توجيه خبير حول سفر الحيوانات الأليفة الدولي والوثائق.',
    category: 'Pets',
    categoryAr: 'حيوانات أليفة',
    bookingCount: 0,
    questions: [
      { id: 'q8-1', type: 'multiple_choice', label: 'Pet Type', labelAr: 'نوع الحيوان الأليف', options: ['Dog', 'Cat', 'Bird', 'Other'], optionsAr: ['كلب', 'قطة', 'طائر', 'آخر'], required: true },
      { id: 'q8-2', type: 'short_answer', label: 'Destination Country', labelAr: 'بلد الوجهة', required: true },
      { id: 'q8-3', type: 'short_answer', label: 'Planned Travel Date', labelAr: 'تاريخ السفر المخطط له', required: true }
    ]
  },
  {
    id: '8-2',
    name: 'Professional Dog Grooming',
    nameAr: 'تجميل الكلاب الاحترافي',
    price: 250,
    description: 'Full grooming service including bath, haircut, and nail trimming.',
    descriptionAr: 'خدمة تجميل كاملة تشمل الاستحمام وقص الشعر وتقليم الأظافر.',
    category: 'Pets',
    categoryAr: 'حيوانات أليفة',
    bookingCount: 0,
    questions: [
      { id: 'q8-2-1', type: 'short_answer', label: 'Dog Breed', labelAr: 'سلالة الكلب', required: true },
      { id: 'q8-2-2', type: 'multiple_choice', label: 'Dog Size', labelAr: 'حجم الكلب', options: ['Small', 'Medium', 'Large', 'Extra Large'], optionsAr: ['صغير', 'متوسط', 'كبير', 'كبير جداً'], required: true },
      { id: 'q8-2-3', type: 'multiple_select', label: 'Services Needed', labelAr: 'الخدمات المطلوبة', options: ['Bath & Dry', 'Haircut', 'Nail Trimming', 'Ear Cleaning'], optionsAr: ['استحمام وتجفيف', 'قص شعر', 'تقليم أظافر', 'تنظيف أذن'], required: true }
    ]
  },
  {
    id: '8-3',
    name: 'Pet Sitting (Per Day)',
    nameAr: 'جليسة حيوانات أليفة (يومياً)',
    price: 150,
    description: 'Reliable home visits to feed, play, and care for your pets.',
    descriptionAr: 'زيارات منزلية موثوقة لإطعام واللعب والعناية بحيواناتك الأليفة.',
    category: 'Pets',
    categoryAr: 'حيوانات أليفة',
    bookingCount: 0,
    questions: [
      { id: 'q8-3-1', type: 'short_answer', label: 'Number of Pets', labelAr: 'عدد الحيوانات الأليفة', required: true },
      { id: 'q8-3-2', type: 'short_answer', label: 'Pet Names and Types', labelAr: 'أسماء وأنواع الحيوانات الأليفة', required: true },
      { id: 'q8-3-3', type: 'multiple_select', label: 'Daily Tasks', labelAr: 'المهام اليومية', options: ['Feeding', 'Walking', 'Playtime', 'Medication'], optionsAr: ['إطعام', 'مشي', 'وقت اللعب', 'دواء'], required: true }
    ]
  },
];
