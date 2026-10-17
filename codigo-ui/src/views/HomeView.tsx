import React, { useState } from 'react';
import { 
  Row, 
  Col, 
  Tag, 
  Typography 
} from 'antd';
import { 
  ArrowRightOutlined
} from '@ant-design/icons';
import { Product, MaterialCategory, AppView } from '../types';
import { CATEGORIES_INFO } from '../data/mockData';
import { ProductCard } from '../components/ProductCard';

const { Title, Paragraph } = Typography;

interface HomeViewProps {
  products: Product[];
  onNavigate: (view: AppView, productId?: string) => void;
  onSearch: (filters: { query?: string; category?: MaterialCategory | '' }) => void;
  onRequestQuote: (product: Product) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  onNavigate,
  onSearch,
  onRequestQuote,
}) => {
  const handleCategoryClick = (cat: MaterialCategory) => {
    onSearch({ category: cat });
    onNavigate('marketplace');
  };

  // Find Cascarilla de arroz for the hero floating card
  const cascarillaProduct = products.find(p => p.category === 'Cascarilla de arroz') || products[0];

  const recentProducts = products.slice(0, 4);

  return (
    <div className="space-y-16 pb-20">
      
      {/* MINIMALIST HERO SECTION (subMarket • Lo que sobra, vale.) */}
      <section className="bg-[#f4f3ef] pt-12 pb-20 sm:pt-16 sm:pb-24 px-4 sm:px-6 lg:px-8 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto">
          <Row gutter={[48, 40]} align="middle">
            
            {/* Left Column: Headline, subhead, clean input & CTA */}
            <Col xs={24} lg={12} className="space-y-6">
              
              {/* Eyebrow tag: subMarket slogan */}
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#176B4D]" />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#176B4D]">
                  subMarket · Lo que sobra, vale.
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-black text-[#114735] tracking-tight leading-[1.08] m-0">
                Transformamos subproductos en oportunidades
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-gray-600 font-normal leading-relaxed max-w-xl m-0">
                Lo que una industria ya no necesita, otra lo puede transformar. Conectá con materiales y proveedores del Nordeste argentino.
              </p>

              {/* Explorar materiales CTA button */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('marketplace')}
                  className="bg-[#176B4D] hover:bg-[#12553c] text-white font-bold text-sm px-7 py-3.5 rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-2.5 cursor-pointer active:scale-98"
                >
                  <span>Explorar materiales</span>
                  <span className="text-base leading-none">↗</span>
                </button>
              </div>

              {/* Micro guarantee line */}
              <div className="pt-2 flex items-center gap-2 text-xs text-gray-500">
                <svg className="w-4 h-4 text-[#176B4D] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                </svg>
                <span>Contacto directo · Acuerdos entre empresas · Corrientes, Chaco y Misiones</span>
              </div>

            </Col>

            {/* Right Column: Large rounded photo + floating card */}
            <Col xs={24} lg={12}>
              <div className="relative">
                {/* Main Hero Photo (Cascarilla / Biomass mound at mill) */}
                <div className="aspect-[4/3] rounded-[28px] overflow-hidden shadow-md bg-stone-200 border border-gray-200/60">
                  <img
                    src="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=80"
                    alt="Acopio de Cascarilla de arroz en molino de Corrientes"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Floating white card (matching screenshot bottom-left overlay) */}
                <div 
                  onClick={() => onNavigate('product-detail', cascarillaProduct.id)}
                  className="absolute bottom-5 left-5 bg-white/98 backdrop-blur-xs p-4 sm:p-5 rounded-2xl shadow-lg border border-gray-100 max-w-xs cursor-pointer hover:border-emerald-300 transition-all group"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#176B4D] block">
                      De residuo a recurso
                    </span>
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-extrabold text-base text-gray-900 group-hover:text-[#176B4D] transition-colors m-0">
                        Cascarilla de arroz
                      </h4>
                      <span className="text-[#176B4D] font-bold text-base group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                        ↗
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      Mercedes, Corrientes
                    </div>
                  </div>
                </div>

              </div>
            </Col>

          </Row>
        </div>
      </section>

      {/* SECTION: "Un nuevo destino para cada material" (WITH IMAGES) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight m-0">
              Un nuevo destino para cada material
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 m-0">
              Categorías tipificadas para valorización energética, camas agropecuarias y bioinsumos en el NEA.
            </p>
          </div>
          <button
            onClick={() => onNavigate('marketplace')}
            className="text-xs font-bold text-[#176B4D] hover:text-[#114735] flex items-center gap-1 cursor-pointer"
          >
            <span>Ver todo el catálogo</span>
            <ArrowRightOutlined />
          </button>
        </div>

        {/* Categories Grid WITH REAL HIGH-RES MATERIAL PHOTOS */}
        <Row gutter={[20, 20]}>
          {CATEGORIES_INFO.map((cat) => (
            <Col xs={24} sm={12} lg={8} key={cat.name}>
              <div
                onClick={() => handleCategoryClick(cat.name)}
                className="bg-white rounded-2xl border border-gray-200/90 hover:border-emerald-400 shadow-2xs hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between h-full group"
              >
                {/* Material Photo Banner */}
                <div className="relative h-36 w-full overflow-hidden bg-gray-100">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/15" />
                  
                  {/* Top Floating Badge & Diagonal Arrow */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="w-8 h-8 rounded-lg bg-white/95 text-[#176B4D] flex items-center justify-center font-bold text-sm shadow-xs backdrop-blur-xs group-hover:scale-105 transition-transform">
                      ↗
                    </span>
                    <span className="text-[11px] font-bold text-gray-800 bg-white/95 px-2.5 py-1 rounded-full shadow-xs backdrop-blur-xs">
                      {cat.count} publicaciones
                    </span>
                  </div>

                  {/* Bottom Image Tag */}
                  <div className="absolute bottom-2.5 left-3">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-[#176B4D]/90 text-white backdrop-blur-xs">
                      {cat.badge}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-base text-gray-900 group-hover:text-[#176B4D] transition-colors m-0">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 m-0 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-[#176B4D]">
                    <span>Explorar lotes</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>

              </div>
            </Col>
          ))}
        </Row>
      </section>

      {/* RECENT PRODUCTS MINIMALIST SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold text-[#176B4D] uppercase tracking-wider">
              Disponibilidad inmediata
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-0.5 m-0">
              Lotes activos recientemente
            </h3>
          </div>
          <button
            onClick={() => onNavigate('marketplace')}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors cursor-pointer"
          >
            Explorar todas ({products.length})
          </button>
        </div>

        <Row gutter={[20, 20]}>
          {recentProducts.map((prod) => (
            <Col xs={24} sm={12} lg={6} key={prod.id}>
              <ProductCard
                product={prod}
                onViewDetail={(id) => onNavigate('product-detail', id)}
                onRequestQuote={onRequestQuote}
              />
            </Col>
          ))}
        </Row>
      </section>

      {/* MINIMALIST "CÓMO FUNCIONA" & BENEFICIOS */}
      <section id="como-funciona" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#f4f3ef] rounded-3xl p-8 sm:p-12 border border-gray-200/80 space-y-8">
          
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold text-[#176B4D] uppercase tracking-wider">
              subMarket · Bioeconomía circular
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight m-0">
              Lo que sobra, vale.
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 m-0">
              Conectamos generadores agroindustriales con industrias transformadoras sin intermediarios innecesarios.
            </p>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 space-y-2 h-full">
                <span className="w-8 h-8 rounded-lg bg-[#e6f4ee] text-[#176B4D] flex items-center justify-center font-bold text-sm">1</span>
                <h4 className="font-bold text-sm text-gray-900 m-0">Publicá o buscá insumos</h4>
                <p className="text-xs text-gray-500 m-0 leading-relaxed">
                  Lotes con parámetros reales de humedad, poder calorífico y ubicación de carga.
                </p>
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 space-y-2 h-full">
                <span className="w-8 h-8 rounded-lg bg-[#e6f4ee] text-[#176B4D] flex items-center justify-center font-bold text-sm">2</span>
                <h4 className="font-bold text-sm text-gray-900 m-0">Cotizá y acordá flete</h4>
                <p className="text-xs text-gray-500 m-0 leading-relaxed">
                  Propuesta directa de toneladas, precio acordado y modalidad de retiro en planta o destino.
                </p>
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 space-y-2 h-full">
                <span className="w-8 h-8 rounded-lg bg-[#e6f4ee] text-[#176B4D] flex items-center justify-center font-bold text-sm">3</span>
                <h4 className="font-bold text-sm text-gray-900 m-0">Carga con ticket oficial</h4>
                <p className="text-xs text-gray-500 m-0 leading-relaxed">
                  Turno de báscula en planta y certificado de trazabilidad de lote auditable.
                </p>
              </div>
            </Col>
          </Row>

          <div className="pt-2 flex items-center justify-between flex-wrap gap-4 border-t border-gray-200/60">
            <div className="text-xs text-gray-500">
              ¿Tenés subproductos en tu molino o aserradero?
            </div>
            <button
              onClick={() => onNavigate('publish-product')}
              className="bg-[#176B4D] hover:bg-[#12553c] text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
            >
              Publicar un subproducto
            </button>
          </div>

        </div>
      </section>

    </div>
  );
};
