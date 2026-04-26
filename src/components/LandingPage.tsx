import React from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  language: 'en' | 'ar';
  onLanguageChange: (lang: 'en' | 'ar') => void;
  t: (key: any) => string;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, language, onLanguageChange, t }) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-brand/10 selection:text-brand">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/60 backdrop-blur-xl border-b border-slate-100/50 px-8 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="bg-brand text-white p-2.5 rounded-2xl shadow-lg shadow-brand/20 group-hover:scale-110 transition-transform duration-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-display text-2xl font-black tracking-tight text-slate-900 leading-none">
              Service<span className="text-brand">Point</span>
            </span>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden sm:flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button 
                onClick={() => onLanguageChange('en')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${language === 'en' ? 'bg-white text-brand shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                EN
              </button>
              <button 
                onClick={() => onLanguageChange('ar')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${language === 'ar' ? 'bg-white text-brand shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                AR
              </button>
            </div>

            <div className="flex items-center gap-8">
              <button 
                onClick={onLogin}
                className="hidden sm:block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-brand transition-colors"
              >
                {t('login')}
              </button>
              <button 
                onClick={onGetStarted}
                className="bg-brand text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-brand-dark transition-all shadow-xl shadow-brand/20 active:scale-95"
              >
                {t('getStarted')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-44 pb-32 px-8 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-1/4 -right-24 w-96 h-96 bg-brand/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 -left-24 w-[500px] h-[500px] bg-slate-100/50 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-slate-50 border border-slate-100 text-slate-500 font-display text-[10px] font-black uppercase tracking-[0.2em] mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
            </span>
            {language === 'ar' ? 'متاح الآن في جميع أنحاء المملكة العربية السعودية' : 'Now live across Saudi Arabia'}
          </div>
          
          <h1 className="font-display text-7xl md:text-[10rem] font-extrabold tracking-tighter leading-[0.8] text-slate-900 mb-12 max-w-5xl animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {language === 'ar' ? 'منصة خدمات' : "The new"} <br />
            <span className="text-brand">{language === 'ar' ? 'استثنائية' : 'standard'}</span> {language === 'ar' ? 'بالكامل.' : 'for service.'}
          </h1>
          
          <p className="font-sans text-xl md:text-2xl text-slate-400 font-medium max-w-2xl leading-relaxed mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {t('heroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <button 
              onClick={onGetStarted}
              className="group relative bg-slate-900 text-white px-16 py-6 rounded-3xl font-black text-[13px] uppercase tracking-[0.25em] shadow-2xl shadow-slate-900/20 hover:bg-brand transition-all duration-500 transform active:scale-95 overflow-hidden"
            >
              <span className="relative z-10">{t('browseServices')}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-brand to-brand-dark translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </button>
            <button 
              onClick={onLogin}
              className="bg-white text-slate-900 border border-slate-200 px-12 py-6 rounded-3xl font-black text-[13px] uppercase tracking-[0.25em] hover:bg-slate-50 transition-all duration-300"
            >
              {t('login')}
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-44 px-8 border-t border-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <FeatureCard 
              index="01"
              title={language === 'ar' ? 'جودة معتمدة' : 'Certified Quality'} 
              description={language === 'ar' ? 'يخضع كل محترف على منصتنا لعملية تحقق صارمة من 5 خطوات.' : 'Every professional on our platform undergoes a rigorous 5-step verification process.'}
            />
            <FeatureCard 
              index="02"
              title={language === 'ar' ? 'حجز فوري' : 'Instant Booking'} 
              description={language === 'ar' ? 'لا مكالمات هاتفية. لا انتظار للعروض. شاهد الأسعار واحجز فوراً.' : 'No phone calls. No waiting for quotes. See prices and book instantly.'}
            />
            <FeatureCard 
              index="03"
              title={language === 'ar' ? 'تسعير شفاف' : 'Transparent Pricing'} 
              description={language === 'ar' ? 'اعرف بالضبط ما ستدفعه قبل الحجز. لا توجد رسوم خفية أبداً.' : 'Know exactly what you pay before you book. No hidden fees, ever.'}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-44 px-8">
        <div className="max-w-7xl mx-auto rounded-[4rem] bg-slate-900 p-16 md:p-32 text-center text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand/20 rounded-full -mr-300 -mt-300 blur-[150px] group-hover:bg-brand/30 transition-all duration-700"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto">
            <h2 className="font-display text-5xl md:text-8xl font-black tracking-tighter mb-12 leading-[0.95]">
              {language === 'ar' ? 'هل أنت مستعد للأفضل؟' : 'Ready for the Next Level?'}
            </h2>
            <button 
              onClick={onGetStarted}
              className="bg-white text-slate-900 px-16 py-6 rounded-3xl font-black text-sm uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all duration-500 shadow-2xl"
            >
              {language === 'ar' ? 'ابدأ الآن' : 'Get Started Now'}
            </button>
          </div>
        </div>
      </section>

      <footer className="py-20 border-t border-slate-100 bg-slate-50/30">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
           <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white p-2 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-display text-2xl font-black tracking-tight text-slate-900 leading-none">
              Service<span className="text-brand">Point</span>
            </span>
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.25em]">
            © 2026 ServicePoint Saudi Arabia. <span className="hidden sm:inline">All rights reserved.</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ title, description, index }: { title: string; description: string; index: string }) => (
  <div className="group relative bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
    <div className="font-display text-[12rem] font-black text-slate-50 absolute -right-10 -bottom-10 leading-none pointer-events-none group-hover:text-brand/[0.03] transition-colors duration-500">
      {index}
    </div>
    <div className="relative z-10">
      <div className="w-12 h-1 bg-brand rounded-full mb-10 group-hover:w-20 transition-all duration-500"></div>
      <h3 className="font-display text-3xl font-black text-slate-900 mb-6 leading-tight group-hover:text-brand transition-colors">{title}</h3>
      <p className="font-sans text-slate-400 font-medium leading-relaxed max-w-[90%]">{description}</p>
    </div>
  </div>
);

export default LandingPage;
