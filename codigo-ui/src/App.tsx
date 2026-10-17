import React, { useState } from 'react';
import { ConfigProvider, App as AntdApp, theme, message } from 'antd';
import esES from 'antd/locale/es_ES';
import { AppView, Product, QuoteRequest, MaterialCategory, Province, UserProfile } from './types';
import { INITIAL_PRODUCTS, INITIAL_REQUESTS, MOCK_PROFILES } from './data/mockData';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { QuoteModal } from './components/QuoteModal';
import { ContactModal } from './components/ContactModal';
import { HomeView } from './views/HomeView';
import { MarketplaceView } from './views/MarketplaceView';
import { ProductDetailView } from './views/ProductDetailView';
import { VendorDashboardView } from './views/VendorDashboardView';
import { PublishProductView } from './views/PublishProductView';
import { RequestsView } from './views/RequestsView';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedProductId, setSelectedProductId] = useState<string>(INITIAL_PRODUCTS[0].id);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [requests, setRequests] = useState<QuoteRequest[]>(INITIAL_REQUESTS);
  
  // Active User Profile (Switchable without login)
  const [activeProfile, setActiveProfile] = useState<UserProfile>(MOCK_PROFILES[0]);

  // Search/category parameters passed to Marketplace
  const [marketFilters, setMarketFilters] = useState<{
    query?: string;
    category?: MaterialCategory | '';
    province?: Province | '';
  }>({});

  // Active modals
  const [quoteModalProduct, setQuoteModalProduct] = useState<Product | null>(null);
  const [contactModalProduct, setContactModalProduct] = useState<Product | null>(null);

  // Global Navigation Helper
  const handleNavigate = (view: AppView, productId?: string) => {
    if (productId) {
      setSelectedProductId(productId);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Profile Switcher Handler (No login required - strictly Vendedor / Comprador)
  const handleSwitchProfile = (profile: UserProfile) => {
    setActiveProfile(profile);
    message.success({
      content: `Modo: ${profile.role === 'vendor' ? 'Vendedor' : 'Comprador'}`,
      duration: 2,
    });
  };

  // Search trigger from Navbar or Home
  const handleMarketSearch = (filters: { query?: string; category?: MaterialCategory | ''; province?: Province | '' }) => {
    setMarketFilters(filters);
    setCurrentView('marketplace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Product Actions
  const handlePublishProduct = (newProduct: Product) => {
    // Associate the new product with the active vendor profile
    const productWithVendor: Product = {
      ...newProduct,
      vendor: {
        id: activeProfile.id,
        name: activeProfile.company,
        businessName: activeProfile.company,
        cuit: activeProfile.cuit,
        rating: 5.0,
        reviewCount: 12,
        completedDeals: 34,
        location: `${activeProfile.city}, ${activeProfile.province}`,
        province: activeProfile.province,
        verified: activeProfile.verified,
        joinedYear: 2022,
        phone: activeProfile.phone,
        email: activeProfile.email,
        badge: activeProfile.badge,
      }
    };
    setProducts((prev) => [productWithVendor, ...prev]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Quote Request Actions
  const handleCreateQuoteRequest = (newRequestData: Partial<QuoteRequest>) => {
    const newReq: QuoteRequest = {
      id: `REQ-2026-${Math.floor(100 + Math.random() * 900)}`,
      productId: newRequestData.productId || selectedProductId,
      productTitle: newRequestData.productTitle || '',
      productCategory: newRequestData.productCategory || 'Cascarilla de arroz',
      vendorId: newRequestData.vendorId || 'ven-1',
      vendorName: newRequestData.vendorName || 'Molinos del Iberá S.A.',
      buyerName: activeProfile.name,
      buyerCompany: activeProfile.company,
      buyerLocation: `${activeProfile.city}, ${activeProfile.province}`,
      buyerContact: `${activeProfile.phone} / ${activeProfile.email}`,
      requestedTons: newRequestData.requestedTons || 30,
      offeredPricePerTon: newRequestData.offeredPricePerTon || 30000,
      originalPricePerTon: newRequestData.originalPricePerTon || 30000,
      currency: newRequestData.currency || 'ARS',
      status: 'Pendiente',
      logisticsPreference: newRequestData.logisticsPreference || 'Retiro por cuenta del comprador',
      targetDate: newRequestData.targetDate || '2026-10-30',
      destinationCity: newRequestData.destinationCity,
      destinationProvince: newRequestData.destinationProvince,
      comments: newRequestData.comments || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: newRequestData.messages || [],
    };

    setRequests((prev) => [newReq, ...prev]);
  };

  const handleUpdateRequest = (updatedRequest: QuoteRequest) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === updatedRequest.id ? updatedRequest : r))
    );
  };

  const pendingQuotesCount = requests.filter((r) => r.status === 'Pendiente' || r.status === 'En negociación').length;

  const currentSelectedProduct =
    products.find((p) => p.id === selectedProductId) || products[0];

  return (
    <ConfigProvider
      locale={esES}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#176B4D',
          colorInfo: '#176B4D',
          colorSuccess: '#10B981',
          colorWarning: '#F59E0B',
          colorError: '#EF4444',
          borderRadius: 8,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          colorBgLayout: '#f5f7fa',
        },
        components: {
          Button: {
            borderRadius: 8,
            fontWeight: 600,
          },
          Card: {
            borderRadiusLG: 12,
          },
          Tag: {
            borderRadiusSM: 4,
          },
          Table: {
            borderRadiusLG: 12,
            headerBg: '#f8fafc',
          },
        },
      }}
    >
      <AntdApp>
        <div className="min-h-screen flex flex-col bg-[#f5f7fa] text-gray-800">
          
          {/* Header Navigation with Profile Switcher */}
          <Navbar
            currentView={currentView}
            onNavigate={handleNavigate}
            pendingQuotesCount={pendingQuotesCount}
            activeProfile={activeProfile}
            onSwitchProfile={handleSwitchProfile}
          />

          {/* Main Content Router */}
          <main className="flex-1">
            {currentView === 'home' && (
              <HomeView
                products={products}
                onNavigate={handleNavigate}
                onSearch={handleMarketSearch}
                onRequestQuote={(p) => setQuoteModalProduct(p)}
              />
            )}

            {currentView === 'marketplace' && (
              <MarketplaceView
                products={products}
                initialCategory={marketFilters.category || ''}
                initialProvince={marketFilters.province || ''}
                initialQuery={marketFilters.query || ''}
                onViewDetail={(id) => handleNavigate('product-detail', id)}
                onRequestQuote={(p) => setQuoteModalProduct(p)}
              />
            )}

            {currentView === 'product-detail' && currentSelectedProduct && (
              <ProductDetailView
                product={currentSelectedProduct}
                onNavigate={handleNavigate}
                onRequestQuote={(p) => setQuoteModalProduct(p)}
                onContactVendor={(p) => setContactModalProduct(p)}
              />
            )}

            {currentView === 'vendor-dashboard' && (
              <VendorDashboardView
                products={products}
                onNavigate={handleNavigate}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                pendingRequestsCount={pendingQuotesCount}
                activeProfile={activeProfile}
              />
            )}

            {currentView === 'publish-product' && (
              <PublishProductView
                onPublish={handlePublishProduct}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'requests' && (
              <RequestsView
                requests={requests}
                onUpdateRequest={handleUpdateRequest}
                onNavigate={handleNavigate}
                activeProfile={activeProfile}
              />
            )}
          </main>

          {/* Global Modals */}
          {quoteModalProduct && (
            <QuoteModal
              product={quoteModalProduct}
              isOpen={!!quoteModalProduct}
              onClose={() => setQuoteModalProduct(null)}
              onSubmitQuote={(req) => {
                handleCreateQuoteRequest(req);
              }}
            />
          )}

          {contactModalProduct && (
            <ContactModal
              vendor={contactModalProduct.vendor}
              productTitle={contactModalProduct.title}
              isOpen={!!contactModalProduct}
              onClose={() => setContactModalProduct(null)}
            />
          )}

          {/* Ant Design styled Footer */}
          <Footer
            onNavigate={handleNavigate}
            onFilterCategory={(cat) => handleMarketSearch({ category: cat })}
          />

        </div>
      </AntdApp>
    </ConfigProvider>
  );
}
