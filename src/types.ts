export type Language = 'en' | 'ar';

export type QuestionType = 'short_answer' | 'multiple_choice' | 'multiple_select' | 'description';

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  labelAr?: string;
  options?: string[]; // Only for multiple_choice
  optionsAr?: string[]; // Arabic options
  required: boolean;
}

export interface Service {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  description: string;
  descriptionAr?: string;
  category: string;
  categoryAr?: string;
  bookingCount: number;
  isFavorite?: boolean;
  questions?: Question[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface CartItem extends Service {
  quantity: number;
}

export interface ServiceAnswer {
  serviceId: string;
  serviceName: string;
  answers: {
    questionId: string;
    questionLabel: string;
    answer: string | string[];
  }[];
}

export interface Booking {
  id: string;
  items: CartItem[];
  totalPrice: number;
  timestamp: number;
  customerName: string;
  customerPhone: string;
  serviceDate: string;
  serviceTime: string;
  paymentMethod: 'Credit Card' | 'Apple Pay' | 'Pay on Site' | 'Wallet';
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  serviceAnswers?: ServiceAnswer[];
  userId: string;
}

export enum AppSection {
  BROWSE = 'browse',
  CART = 'cart',
  SUCCESS = 'success',
  ADMIN = 'admin',
  MY_BOOKINGS = 'my_bookings',
  PROFILE = 'profile'
}

export type UserRole = 'customer' | 'admin';
