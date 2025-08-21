// Product Template - Master product definition
export interface ProductTemplate {
  _id: string;
  templateName: string;
  description: string;
  price: number;
  productType: 'tours' | 'lessons' | 'rentals' | 'tickets';
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  // Computed fields for easier access
  longitude: number;
  latitude: number;
  vendorId: string;
  imageURL?: string;
  duration?: number;
  additionalInfo?: string;
  requirements?: string[];
  waiver?: string;
  templateStatus: ProductStatusEnum;
  createdAt: string;
  updatedAt: string;
}

// For backward compatibility
export interface Product extends ProductTemplate {
  productName: string;
  productDescription: string;
  productPrice: number;
  productImageURL?: string;
  productDuration?: number;
  productDate?: string;
  productStartTime?: string;
  productAdditionalInfo?: string;
  productRequirements?: string[];
  productWaiver?: string;
  productStatus: ProductStatusEnum;
}

export enum ProductStatusEnum {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface ProductResponse {
  data: Product[];
  total?: number;
  page?: number;
  limit?: number;
  message?: string;
}

export interface CreateProductDto {
  productName: string;
  productDescription: string;
  productPrice: number;
  productType: 'tours' | 'lessons' | 'rentals' | 'tickets';
  productImageURL?: string;
  productDuration?: number;
  productDate?: string;
  productStartTime?: string;
  productAdditionalInfo?: string;
  productRequirements?: string[];
  productWaiver?: string;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  productStatus?: ProductStatusEnum;
}

export enum ProductItemStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export interface ProductItem {
  _id: string;
  templateId: string;
  vendorId: string;
  productDate: string;
  startTime: string;
  duration: number;
  price: number;
  quantityAvailable: number;
  quantitySold: number;
  longitude: number;
  latitude: number;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  templateName: string;
  description: string;
  productType: 'tours' | 'lessons' | 'rentals' | 'tickets';
  requirements: string[];
  waiver: string;
  imageURL?: string;
  itemStatus: ProductItemStatus;
  instructorName?: string;
  tourGuide?: string;
  equipmentSize?: string;
  notes?: string;
  additionalInfo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProductItemDto {
  productDate?: string;
  startTime?: string;
  duration?: number;
  price?: number;
  quantityAvailable?: number;
  notes?: string;
  instructorName?: string;
  tourGuide?: string;
  equipmentSize?: string;
  itemStatus?: ProductItemStatus;
}

export interface ProductItemResponse {
  data: ProductItem[];
  total?: number;
  page?: number;
  limit?: number;
  message?: string;
}

export interface FilterOptions {
  searchTerm: string;
  filterType: string;
  filterStatus: string;
  sortOrder: 'asc' | 'desc';
}

// Utility types
export type ProductType = 'tours' | 'lessons' | 'rentals' | 'tickets';

export const PRODUCT_TYPES: ProductType[] = ['tours', 'lessons', 'rentals', 'tickets'];

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  tours: 'Tours',
  lessons: 'Lessons',
  rentals: 'Rentals',
  tickets: 'Tickets',
};
