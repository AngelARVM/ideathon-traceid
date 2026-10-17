export type Province = 'Corrientes' | 'Chaco' | 'Misiones' | 'Formosa';

export type MaterialCategory = 
  | 'Cascarilla de arroz'
  | 'Chips forestales'
  | 'Aserrín y virutas'
  | 'Orujos y bagazos'
  | 'Biochar y cenizas';

export type PackagingType = 'A granel (batea)' | 'Big Bags (1.000 kg)' | 'Bolsas (25-50 kg)' | 'En silo de carga directa';

export interface TraceabilityEvent {
  id: string;
  stage: string;
  title: string;
  date: string;
  location: string;
  actor: string;
  verified: boolean;
  notes: string;
  badge?: string;
}

export interface TechnicalSpecs {
  moisturePercentage: number; // e.g. 11.5%
  calorificPowerKcalKg?: number; // e.g. 3850 kcal/kg
  granulometry: string; // e.g. "G30 (10-30 mm)", "Fino (< 2 mm)"
  ashContentPercentage?: number; // e.g. 1.2%
  apparentDensityKgM3?: number; // e.g. 140 kg/m3
  contaminantsFree: boolean; // libre de metales, tierra, etc.
  packaging: PackagingType;
  labCertificateAvailable: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  businessName: string;
  cuit: string;
  rating: number; // e.g. 4.9
  reviewCount: number;
  completedDeals: number;
  location: string;
  province: Province;
  verified: boolean;
  joinedYear: number;
  phone: string;
  email: string;
  badge: string;
}

export interface UserProfile {
  id: string;
  name: string;
  company: string;
  cuit: string;
  role: 'vendor' | 'buyer';
  city: string;
  province: Province;
  phone: string;
  email: string;
  verified: boolean;
  badge: string;
  avatarText: string;
  color: string;
}

export interface Product {
  id: string;
  title: string;
  category: MaterialCategory;
  description: string;
  pricePerTon: number;
  currency: 'ARS' | 'USD';
  availableTons: number;
  minOrderTons: number;
  generationFrequency: 'Lote único' | 'Mensual continuo' | 'Semanal';
  province: Province;
  city: string;
  loadingPlantAddress: string;
  hasWeighbridge: boolean; // Báscula habilitada en planta
  maxTruckCapacityPerDay: number; // ej: 6 camiones/día
  specs: TechnicalSpecs;
  vendor: Vendor;
  images: string[];
  status: 'active' | 'paused' | 'sold_out';
  createdAt: string;
  traceabilityLotCode: string;
  traceabilityEvents: TraceabilityEvent[];
  featured?: boolean;
}

export type QuoteStatus = 'Pendiente' | 'En negociación' | 'Aceptada' | 'Rechazada';

export interface QuoteMessage {
  id: string;
  sender: 'buyer' | 'vendor';
  senderName: string;
  text: string;
  timestamp: string;
  proposedPricePerTon?: number;
}

export interface QuoteRequest {
  id: string;
  productId: string;
  productTitle: string;
  productCategory: MaterialCategory;
  vendorId: string;
  vendorName: string;
  buyerName: string;
  buyerCompany: string;
  buyerLocation: string;
  buyerContact: string;
  requestedTons: number;
  offeredPricePerTon: number;
  originalPricePerTon: number;
  currency: 'ARS' | 'USD';
  status: QuoteStatus;
  logisticsPreference: 'Retiro por cuenta del comprador' | 'Cotizar flete puesto en destino';
  targetDate: string;
  destinationCity?: string;
  destinationProvince?: Province;
  comments: string;
  createdAt: string;
  updatedAt: string;
  messages: QuoteMessage[];
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  tons: number;
  pricePerTon: number;
  logisticsPreference: 'Retiro por cuenta del comprador' | 'Cotizar flete puesto en destino';
  destinationCity?: string;
  addedAt: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  productId: string;
  productTitle: string;
  category: MaterialCategory;
  vendorId: string;
  vendorName: string;
  buyerName: string;
  buyerCompany: string;
  tons: number;
  pricePerTon: number;
  totalAmount: number;
  currency: 'ARS' | 'USD';
  status: 'Borrador' | 'Emitida por Vendedor' | 'Firmada en Blockchain' | 'Completada';
  blockchainHash?: string;
  blockNumber?: number;
  smartContractAddress?: string;
  buyerDigitalSignature?: string;
  sellerDigitalSignature?: string;
  buyerComment?: string; // Comentario del comprador acuñado en el blockchain como registro del vendedor
  createdAt: string;
  signedAt?: string;
  logistics: string;
  destination?: string;
}

export interface ProductForecast {
  id: string;
  title: string;
  category: MaterialCategory;
  estimatedTons: number;
  availableDate: string;
  estimatedPricePerTon: number;
  currency: 'ARS';
  province: Province;
  city: string;
  vendorId: string;
  vendorName: string;
  notes: string;
  status: 'Proyectado' | 'Reservas abiertas' | 'Asignado';
  minReservationTons: number;
  createdAt: string;
}

export type AppView = 
  | 'home'
  | 'marketplace'
  | 'product-detail'
  | 'vendor-dashboard'
  | 'publish-product'
  | 'requests'
  | 'orders';

