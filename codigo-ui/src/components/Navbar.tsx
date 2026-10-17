import React, { useState } from 'react';
import { 
  Badge, 
  Drawer
} from 'antd';
import { 
  MenuOutlined,
  ShoppingCartOutlined,
  SafetyCertificateFilled
} from '@ant-design/icons';
import { AppView, UserProfile } from '../types';
import { MOCK_PROFILES } from '../data/mockData';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView, productId?: string) => void;
  pendingQuotesCount: number;
  activeProfile: UserProfile;
  onSwitchProfile: (profile: UserProfile) => void;
  cartCount?: number;
  onOpenCart?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  pendingQuotesCount,
  activeProfile,
  onSwitchProfile,
  cartCount = 0,
  onOpenCart,
}) => {
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);

  // Direct 1-click toggle between only Vendedor and Comprador
  const handleToggleRole = (targetRole: 'vendor' | 'buyer') => {
    if (activeProfile.role === targetRole) return;
    const target = MOCK_PROFILES.find((p) => p.role === targetRole) || MOCK_PROFILES[0];
    onSwitchProfile(target);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 gap-4">
            
            {/* Minimalist Logo: subMarket • Lo que sobra, vale. */}
            <div 
              onClick={() => onNavigate('home')} 
              className="flex items-center gap-2.5 cursor-pointer select-none shrink-0 group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#176B4D] flex items-center justify-center text-white shadow-xs group-hover:bg-[#12553c] transition-colors">
                <svg className="w-5 h-5 text-emerald-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
                  <path d="M11 19h8.2a1.8 1.8 0 0 0 1.5-2.6l-3.9-6.9" />
                  <path d="m15.5 4.8 2.3 4H10.6" />
                  <path d="m4.5 14.5 2.5 4.5 5-2" />
                  <path d="M20 14.5 17.5 19l-5-2" />
                  <path d="M11 3.5 8.5 8h5.5" />
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline leading-none">
                  <span className="font-light text-xl tracking-tight text-gray-800">sub</span>
                  <span className="font-extrabold text-xl tracking-tight text-[#176B4D]">Market</span>
                </div>
                <span className="text-[10px] text-gray-500 font-medium tracking-tight mt-0.5">
                  Lo que sobra, vale.
                </span>
              </div>
            </div>

            {/* SWITCH VENDEDOR / COMPRADOR */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => handleToggleRole('vendor')}
                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeProfile.role === 'vendor'
                    ? 'bg-[#176B4D] text-white shadow-xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeProfile.role === 'vendor' ? 'bg-emerald-300' : 'bg-gray-400'}`} />
                <span>Vendedor</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleRole('buyer')}
                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeProfile.role === 'buyer'
                    ? 'bg-[#176B4D] text-white shadow-xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeProfile.role === 'buyer' ? 'bg-emerald-300' : 'bg-gray-400'}`} />
                <span>Comprador</span>
              </button>
            </div>

            {/* Right actions: Explorar, Solicitudes/Negociaciones, Carrito / Panel */}
            <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-gray-700 shrink-0">
              <button
                onClick={() => onNavigate('marketplace')}
                className={`cursor-pointer hover:text-gray-900 transition-colors ${
                  currentView === 'marketplace' ? 'font-bold text-[#176B4D]' : ''
                }`}
              >
                Explorar
              </button>

              <button
                onClick={() => onNavigate('requests')}
                className="cursor-pointer hover:text-gray-900 transition-colors relative flex items-center gap-1.5"
              >
                <span>{activeProfile.role === 'buyer' ? 'Negociaciones' : 'Solicitudes'}</span>
                {pendingQuotesCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {pendingQuotesCount}
                  </span>
                )}
              </button>

              {activeProfile.role === 'vendor' ? (
                <>
                  <button
                    onClick={() => onNavigate('vendor-dashboard')}
                    className={`cursor-pointer hover:text-gray-900 transition-colors ${
                      currentView === 'vendor-dashboard' ? 'font-bold text-[#176B4D]' : ''
                    }`}
                  >
                    Panel Vendedor
                  </button>
                  <button
                    onClick={() => onNavigate('publish-product')}
                    className="bg-[#176B4D] hover:bg-[#12553c] text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-lg transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    + Publicar Lote
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate('vendor-dashboard')}
                    className={`cursor-pointer hover:text-gray-900 transition-colors ${
                      currentView === 'vendor-dashboard' ? 'font-bold text-[#176B4D]' : ''
                    }`}
                  >
                    Mis Compras
                  </button>

                  {/* Buyer Shopping Cart Button */}
                  <button
                    type="button"
                    onClick={onOpenCart}
                    className="flex items-center gap-2 bg-[#176B4D]/10 hover:bg-[#176B4D]/20 text-[#176B4D] font-bold text-xs sm:text-sm px-3.5 py-2 rounded-lg transition-all border border-[#176B4D]/30 cursor-pointer active:scale-98"
                  >
                    <ShoppingCartOutlined className="text-base" />
                    <span>Carrito</span>
                    {cartCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#176B4D] text-white text-[11px] font-extrabold flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu trigger */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                onClick={() => setMobileDrawerVisible(true)}
                className="p-1.5 text-gray-700 hover:text-gray-900"
              >
                <MenuOutlined className="text-lg" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <Drawer
        title="subMarket • Lo que sobra, vale."
        placement="right"
        onClose={() => setMobileDrawerVisible(false)}
        open={mobileDrawerVisible}
        width={280}
      >
        <div className="flex flex-col gap-3 text-sm">
          {/* Mobile Switch Control */}
          <div className="p-2 bg-gray-100 rounded-xl space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Modo activo:</span>
            <div className="grid grid-cols-2 gap-1 bg-gray-200 p-0.5 rounded-lg text-xs font-bold">
              <button
                onClick={() => handleToggleRole('vendor')}
                className={`py-1.5 rounded-md text-center transition-all cursor-pointer ${
                  activeProfile.role === 'vendor' ? 'bg-[#176B4D] text-white shadow-xs' : 'text-gray-600'
                }`}
              >
                Vendedor
              </button>
              <button
                onClick={() => handleToggleRole('buyer')}
                className={`py-1.5 rounded-md text-center transition-all cursor-pointer ${
                  activeProfile.role === 'buyer' ? 'bg-[#176B4D] text-white shadow-xs' : 'text-gray-600'
                }`}
              >
                Comprador
              </button>
            </div>
          </div>

          <button
            onClick={() => { onNavigate('home'); setMobileDrawerVisible(false); }}
            className="text-left py-2 px-3 rounded hover:bg-gray-100 font-medium"
          >
            Inicio
          </button>
          <button
            onClick={() => { onNavigate('marketplace'); setMobileDrawerVisible(false); }}
            className="text-left py-2 px-3 rounded hover:bg-gray-100 font-medium"
          >
            Explorar Catálogo
          </button>
          <button
            onClick={() => { onNavigate('requests'); setMobileDrawerVisible(false); }}
            className="text-left py-2 px-3 rounded hover:bg-gray-100 font-medium flex items-center justify-between"
          >
            <span>Solicitudes</span>
            {pendingQuotesCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendingQuotesCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { onNavigate('vendor-dashboard'); setMobileDrawerVisible(false); }}
            className="text-left py-2 px-3 rounded hover:bg-gray-100 font-medium"
          >
            {activeProfile.role === 'vendor' ? 'Panel Vendedor' : 'Mis Compras & Contratos'}
          </button>
          {activeProfile.role === 'buyer' && (
            <button
              onClick={() => { onOpenCart?.(); setMobileDrawerVisible(false); }}
              className="text-left py-2 px-3 rounded bg-emerald-50 text-[#176B4D] font-bold flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <ShoppingCartOutlined /> Carrito B2B
              </span>
              {cartCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#176B4D] text-white text-xs font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          )}
          {activeProfile.role === 'vendor' && (
            <button
              onClick={() => { onNavigate('publish-product'); setMobileDrawerVisible(false); }}
              className="text-left py-2 px-3 rounded hover:bg-gray-100 font-medium text-[#176B4D]"
            >
              + Publicar Lote
            </button>
          )}
        </div>
      </Drawer>
    </>
  );
};
