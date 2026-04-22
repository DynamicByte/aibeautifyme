export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  reason: string;
  imageUrl: string;
  price: string;
}

export interface RoutineStep {
  id: string;
  order: number;
  timeOfDay: 'AM' | 'PM' | 'Both';
  stepName: string;
  product?: Product;
}

export interface UserProfile {
  skinType?: 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive';
  concerns?: string[];
  goals?: string[];
  age?: string;
}
