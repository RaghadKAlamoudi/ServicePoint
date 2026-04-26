import React from 'react';
import { Service } from '../types';

interface ServiceCardProps {
  service: Service;
  onAdd: (service: Service) => void;
  onViewDetails: (service: Service) => void;
  quantityInCart: number;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  t: (key: any) => string;
  language: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onAdd, onViewDetails, quantityInCart, isFavorite, onToggleFavorite, t, language }) => {
  return (
    <div 
      onClick={() => onViewDetails(service)}
      className="group relative bg-white rounded-3xl border border-slate-100/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 cursor-pointer overflow-hidden p-4 sm:p-7 flex flex-col items-start text-start"
    >
      {/* Favorite Button */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(service.id);
        }}
        className={`absolute top-3 right-3 sm:top-5 sm:right-5 p-1.5 sm:p-2 rounded-xl transition-all z-10 ${isFavorite ? 'bg-red-50 text-red-500 shadow-sm' : 'bg-slate-50/80 text-slate-300 hover:text-red-400 hover:bg-white hover:shadow-md'}`}
      >
        <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      {/* Cart Quantity Badge */}
      {quantityInCart > 0 && (
        <div className="absolute top-3 left-3 sm:top-5 sm:left-5 bg-brand text-white text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 rounded-full shadow-lg shadow-brand/20 animate-in zoom-in duration-300">
          {quantityInCart}
        </div>
      )}

      <div className="flex-1 flex flex-col justify-start w-full mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <span className="inline-flex items-center justify-center rounded-full bg-slate-50 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest ring-1 ring-inset ring-slate-200/50">
            {language === 'ar' && service.categoryAr ? service.categoryAr : service.category}
          </span>
        </div>
        
        <h3 className="font-display text-base sm:text-xl font-extrabold text-slate-900 group-hover:text-brand transition-colors line-clamp-2 leading-[1.2] tracking-tight mb-1 sm:mb-2">
          {language === 'ar' && service.nameAr ? service.nameAr : service.name}
        </h3>
        
        <div className="flex items-baseline gap-1 mt-auto">
          <span className="text-xl sm:text-2xl font-black text-brand tracking-tighter">
            {service.price}
          </span>
          <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {t('sar')}
          </span>
        </div>
      </div>

      <div className="w-full">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(service);
          }}
          className="w-full px-4 py-2.5 sm:px-5 sm:py-3.5 bg-brand rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black text-white uppercase tracking-[0.15em] hover:bg-brand-dark transition-all duration-300 shadow-lg shadow-brand/10 flex items-center justify-center gap-2 group/btn"
        >
          {t('details')}
          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>

      {/* Decorative gradient corner */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-brand/5 rounded-full blur-2xl group-hover:bg-brand/10 transition-colors duration-500 pointer-events-none"></div>
    </div>
  );
};

export default ServiceCard;
