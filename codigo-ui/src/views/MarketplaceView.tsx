import React, { useState, useMemo } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Input, 
  Select, 
  Slider, 
  Checkbox, 
  Button, 
  Tag, 
  Typography, 
  Drawer, 
  Empty, 
  Space, 
  Divider,
  Radio
} from 'antd';
import { 
  FilterOutlined, 
  SearchOutlined, 
  ReloadOutlined, 
  CloseOutlined, 
  EnvironmentOutlined,
  CheckOutlined,
  SlidersOutlined
} from '@ant-design/icons';
import { Product, MaterialCategory, Province, PackagingType, ProductForecast } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Segmented } from 'antd';
import { CalendarOutlined, ThunderboltFilled } from '@ant-design/icons';

const { Title, Text } = Typography;

interface MarketplaceViewProps {
  products: Product[];
  forecasts?: ProductForecast[];
  initialCategory?: MaterialCategory | '';
  initialProvince?: Province | '';
  initialQuery?: string;
  onViewDetail: (id: string) => void;
  onRequestQuote: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onRequestForecast?: (forecast: ProductForecast) => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  products,
  forecasts = [],
  initialCategory = '',
  initialProvince = '',
  initialQuery = '',
  onViewDetail,
  onRequestQuote,
  onAddToCart,
  onRequestForecast,
}) => {
  const [activeCatalogTab, setActiveCatalogTab] = useState<'available' | 'forecasts'>('available');
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | ''>(initialCategory);
  const [selectedProvince, setSelectedProvince] = useState<Province | ''>(initialProvince);
  const [maxPrice, setMaxPrice] = useState<number>(150000);
  const [minAvailableTons, setMinAvailableTons] = useState<number>(0);
  const [packagingFilter, setPackagingFilter] = useState<PackagingType | ''>('');
  const [hasWeighbridgeOnly, setHasWeighbridgeOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'price-asc' | 'price-desc' | 'tons-desc'>('recent');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  React.useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
  }, [initialCategory]);

  React.useEffect(() => {
    if (initialProvince) setSelectedProvince(initialProvince);
  }, [initialProvince]);

  React.useEffect(() => {
    if (initialQuery) setSearchTerm(initialQuery);
  }, [initialQuery]);

  const categories: MaterialCategory[] = [
    'Cascarilla de arroz',
    'Chips forestales',
    'Aserrín y virutas',
    'Orujos y bagazos',
    'Biochar y cenizas',
  ];

  const provinces: Province[] = ['Corrientes', 'Chaco', 'Misiones', 'Formosa'];

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedProvince('');
    setMaxPrice(150000);
    setMinAvailableTons(0);
    setPackagingFilter('');
    setHasWeighbridgeOnly(false);
    setSortBy('recent');
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status === 'paused') return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matches = 
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.city.toLowerCase().includes(query) ||
          p.province.toLowerCase().includes(query) ||
          p.vendor.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query);
        if (!matches) return false;
      }

      if (selectedCategory && p.category !== selectedCategory) return false;
      if (selectedProvince && p.province !== selectedProvince) return false;
      if (p.pricePerTon > maxPrice) return false;
      if (p.availableTons < minAvailableTons) return false;
      if (packagingFilter && p.specs.packaging !== packagingFilter) return false;
      if (hasWeighbridgeOnly && !p.hasWeighbridge) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.pricePerTon - b.pricePerTon;
      if (sortBy === 'price-desc') return b.pricePerTon - a.pricePerTon;
      if (sortBy === 'tons-desc') return b.availableTons - a.availableTons;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [
    products,
    searchTerm,
    selectedCategory,
    selectedProvince,
    maxPrice,
    minAvailableTons,
    packagingFilter,
    hasWeighbridgeOnly,
    sortBy,
  ]);

  const activeFiltersCount = 
    (selectedCategory ? 1 : 0) +
    (selectedProvince ? 1 : 0) +
    (maxPrice < 150000 ? 1 : 0) +
    (minAvailableTons > 0 ? 1 : 0) +
    (packagingFilter ? 1 : 0) +
    (hasWeighbridgeOnly ? 1 : 0);

  const FilterContent = (
    <div className="space-y-5 text-xs">
      
      {/* Category */}
      <div className="space-y-1.5">
        <label className="font-bold text-gray-800 block">Tipo de Material</label>
        <div className="space-y-1">
          <Button
            block
            size="small"
            type={selectedCategory === '' ? 'primary' : 'text'}
            onClick={() => setSelectedCategory('')}
            className={`text-left justify-start ${selectedCategory === '' ? '!bg-[#176B4D]' : 'text-gray-700'}`}
          >
            Todas las categorías
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              block
              size="small"
              type={selectedCategory === cat ? 'primary' : 'text'}
              onClick={() => setSelectedCategory(cat)}
              className={`text-left justify-start truncate ${selectedCategory === cat ? '!bg-[#176B4D]' : 'text-gray-700'}`}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <Divider className="!my-2" />

      {/* Province */}
      <div className="space-y-1.5">
        <label className="font-bold text-gray-800 block">Provincia del NEA</label>
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            size="small"
            type={selectedProvince === '' ? 'primary' : 'default'}
            onClick={() => setSelectedProvince('')}
            className={selectedProvince === '' ? '!bg-[#176B4D]' : ''}
          >
            Todas
          </Button>
          {provinces.map((prov) => (
            <Button
              key={prov}
              size="small"
              type={selectedProvince === prov ? 'primary' : 'default'}
              onClick={() => setSelectedProvince(prov)}
              className={selectedProvince === prov ? '!bg-[#176B4D]' : ''}
            >
              {prov}
            </Button>
          ))}
        </div>
      </div>

      <Divider className="!my-2" />

      {/* Max Price Slider */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <label className="font-bold text-gray-800">Precio máx. / Tn</label>
          <span className="font-bold text-[#176B4D]">${maxPrice.toLocaleString('es-AR')}</span>
        </div>
        <Slider
          min={20000}
          max={150000}
          step={5000}
          value={maxPrice}
          onChange={(val) => setMaxPrice(val)}
          trackStyle={{ backgroundColor: '#176B4D' }}
          handleStyle={{ borderColor: '#176B4D' }}
        />
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>$20.000</span>
          <span>$150.000+</span>
        </div>
      </div>

      <Divider className="!my-2" />

      {/* Stock Minimo */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <label className="font-bold text-gray-800">Stock Mínimo Disponible</label>
          <span className="font-bold text-[#176B4D]">
            {minAvailableTons > 0 ? `${minAvailableTons} Tn` : 'Cualquiera'}
          </span>
        </div>
        <Radio.Group 
          value={minAvailableTons} 
          onChange={(e) => setMinAvailableTons(e.target.value)}
          size="small"
          className="w-full"
        >
          <div className="grid grid-cols-2 gap-1">
            <Radio.Button value={0} className="text-center">Todos</Radio.Button>
            <Radio.Button value={50} className="text-center">&gt;50 Tn</Radio.Button>
            <Radio.Button value={200} className="text-center">&gt;200 Tn</Radio.Button>
            <Radio.Button value={500} className="text-center">&gt;500 Tn</Radio.Button>
          </div>
        </Radio.Group>
      </div>

      <Divider className="!my-2" />

      {/* Packaging */}
      <div className="space-y-1.5">
        <label className="font-bold text-gray-800 block">Tipo de Envasado</label>
        <Select
          value={packagingFilter}
          onChange={(val) => setPackagingFilter(val as any)}
          size="small"
          className="w-full"
          options={[
            { value: '', label: 'Cualquier presentación' },
            { value: 'A granel (batea)', label: 'A granel (batea volcable)' },
            { value: 'Big Bags (1.000 kg)', label: 'Big Bags (1.000 kg)' },
            { value: 'Bolsas (25-50 kg)', label: 'Bolsas (25-50 kg)' },
            { value: 'En silo de carga directa', label: 'En silo de carga directa' },
          ]}
        />
      </div>

      <Divider className="!my-2" />

      {/* Weighbridge Check */}
      <div>
        <Checkbox
          checked={hasWeighbridgeOnly}
          onChange={(e) => setHasWeighbridgeOnly(e.target.checked)}
          className="text-xs"
        >
          Solo con báscula propia en planta
        </Checkbox>
      </div>

    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <Title level={3} className="!m-0 !text-gray-900 !font-extrabold tracking-tight">
            Catálogo de Subproductos Agroindustriales
          </Title>
          <Text className="text-xs text-gray-500">
            Lotes agroindustriales del NEA con ensayos analíticos certificados y báscula habilitada.
          </Text>
        </div>

        {/* Search & Sort Bar */}
        <Space wrap size="middle">
          <Input
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Buscar por material o localidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            className="w-64"
          />

          <Select
            value={sortBy}
            onChange={(val) => setSortBy(val)}
            className="w-44"
            options={[
              { value: 'recent', label: 'Más recientes' },
              { value: 'price-asc', label: 'Menor precio / Tn' },
              { value: 'price-desc', label: 'Mayor precio / Tn' },
              { value: 'tons-desc', label: 'Mayor stock (Tn)' },
            ]}
          />

          <Button
            icon={<FilterOutlined />}
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden"
          >
            Filtros ({activeFiltersCount})
          </Button>
        </Space>
      </div>

      {/* Catalog Mode Selector: Lotes Inmediatos vs Estimativos de Producción Futura */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200/90 shadow-2xs">
        <Segmented
          value={activeCatalogTab}
          onChange={(val) => setActiveCatalogTab(val as any)}
          size="middle"
          options={[
            {
              label: (
                <div className="flex items-center gap-2 px-2 py-1 font-semibold">
                  <ThunderboltFilled className="text-[#176B4D]" />
                  <span>Lotes Inmediatos ({filteredProducts.length})</span>
                </div>
              ),
              value: 'available',
            },
            {
              label: (
                <div className="flex items-center gap-2 px-2 py-1 font-semibold">
                  <CalendarOutlined className="text-amber-600" />
                  <span>Estimativos y Proyecciones ({forecasts.length})</span>
                </div>
              ),
              value: 'forecasts',
            },
          ]}
        />
        <span className="text-xs text-gray-500">
          {activeCatalogTab === 'available' 
            ? 'Lotes físicos listos para despacho inmediato en planta'
            : 'Previsiones de zafra y cosecha para contratos de suministro anticipados'}
        </span>
      </div>

      {/* Main Grid: Filters Sider + Product Catalog */}
      <Row gutter={[24, 24]}>
        
        {/* Desktop Filters Sider (Ant Design Card) */}
        <Col xs={0} lg={6}>
          <Card 
            className="!rounded-xl !border-gray-200 sticky top-24 shadow-xs"
            title={
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                  <SlidersOutlined className="text-[#176B4D]" />
                  Filtros B2B
                </span>
                {activeFiltersCount > 0 && (
                  <Button 
                    type="link" 
                    size="small" 
                    icon={<ReloadOutlined />} 
                    onClick={handleResetFilters}
                    className="!p-0 !text-[#176B4D] !text-xs"
                  >
                    Limpiar
                  </Button>
                )}
              </div>
            }
          >
            {FilterContent}
          </Card>
        </Col>

        {/* Product Catalog Results */}
        <Col xs={24} lg={18} className="space-y-4">
          
          {/* Results Summary Bar & Active Tags */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-gray-800">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'lote disponible' : 'lotes disponibles'}
            </span>

            <div className="flex flex-wrap items-center gap-1.5">
              {selectedCategory && (
                <Tag 
                  closable 
                  onClose={() => setSelectedCategory('')}
                  color="green"
                  className="font-medium"
                >
                  {selectedCategory}
                </Tag>
              )}
              {selectedProvince && (
                <Tag 
                  closable 
                  onClose={() => setSelectedProvince('')}
                  color="green"
                  className="font-medium"
                >
                  {selectedProvince}
                </Tag>
              )}
              {searchTerm && (
                <Tag 
                  closable 
                  onClose={() => setSearchTerm('')}
                  className="font-medium"
                >
                  "{searchTerm}"
                </Tag>
              )}
              {activeFiltersCount > 0 && (
                <Button 
                  type="link" 
                  size="small" 
                  onClick={handleResetFilters}
                  className="!p-0 !text-xs !text-gray-400 hover:!text-gray-700"
                >
                  Restablecer
                </Button>
              )}
            </div>
          </div>

          {/* Cards Grid: Immediate Products OR Future Forecasts */}
          {activeCatalogTab === 'available' ? (
            filteredProducts.length > 0 ? (
              <Row gutter={[20, 20]}>
                {filteredProducts.map((prod) => (
                  <Col xs={24} sm={12} xl={8} key={prod.id}>
                    <ProductCard
                      product={prod}
                      onViewDetail={onViewDetail}
                      onRequestQuote={onRequestQuote}
                      onAddToCart={onAddToCart}
                    />
                  </Col>
                ))}
              </Row>
            ) : (
              <Card className="!rounded-xl !border-gray-200 text-center py-12">
                <Empty
                  description={
                    <span className="text-gray-500 text-xs">
                      No se encontraron subproductos con estos filtros en el NEA.
                    </span>
                  }
                >
                  <Button 
                    type="primary" 
                    onClick={handleResetFilters}
                    className="!bg-[#176B4D] hover:!bg-[#12553c] mt-2 font-semibold"
                  >
                    Ver todos los lotes
                  </Button>
                </Empty>
              </Card>
            )
          ) : (
            /* Future Forecasts Grid */
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                <span>
                  <strong>Estimativos de Producción:</strong> Volúmenes declarados por generadores del NEA para próximas zafras. Permite acordar suministro con anticipación.
                </span>
                <Tag color="warning" className="font-bold m-0">Zafra / Cosecha 2026</Tag>
              </div>

              <Row gutter={[20, 20]}>
                {forecasts.map((fc) => (
                  <Col xs={24} md={12} key={fc.id}>
                    <Card
                      hoverable
                      className="!rounded-xl !border-gray-200 bg-white"
                      bodyStyle={{ padding: '20px' }}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Tag color="orange" className="font-semibold text-xs">
                            {fc.category}
                          </Tag>
                          <Tag color="blue" className="font-bold text-[11px]">
                            {fc.status}
                          </Tag>
                        </div>

                        <div>
                          <h4 className="font-bold text-base text-gray-900 m-0 leading-snug">
                            {fc.title}
                          </h4>
                          <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <EnvironmentOutlined className="text-[#176B4D]" /> {fc.city}, {fc.province} • {fc.vendorName}
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 m-0 line-clamp-2">
                          {fc.notes}
                        </p>

                        <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-gray-400 block">ESTIMATIVO VOLUMEN:</span>
                            <span className="font-extrabold text-gray-800 text-sm">{fc.estimatedTons.toLocaleString('es-AR')} Tn</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block">FECHA DISPONIBLE:</span>
                            <span className="font-bold text-[#176B4D]">{fc.availableDate}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block">PRECIO BASE ESTIMADO:</span>
                            <span className="font-bold text-gray-800">${fc.estimatedPricePerTon.toLocaleString('es-AR')}/Tn</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block">RESERVA MÍNIMA:</span>
                            <span className="font-bold text-gray-700">{fc.minReservationTons} Tn</span>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-end">
                          <Button
                            type="primary"
                            icon={<CalendarOutlined />}
                            onClick={() => {
                              onRequestForecast?.(fc);
                            }}
                            className="!bg-[#176B4D] hover:!bg-[#12553c] !text-xs font-bold"
                          >
                            Negociar Pre-Reserva
                          </Button>
                        </div>

                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}

        </Col>

      </Row>

      {/* Mobile Filters Drawer (Ant Design Drawer) */}
      <Drawer
        title="Filtros del Catálogo"
        placement="left"
        onClose={() => setMobileFilterOpen(false)}
        open={mobileFilterOpen}
        width={300}
        extra={
          activeFiltersCount > 0 && (
            <Button size="small" type="link" onClick={handleResetFilters}>
              Limpiar
            </Button>
          )
        }
      >
        {FilterContent}
        <div className="pt-4 mt-4 border-t border-gray-100">
          <Button
            block
            type="primary"
            onClick={() => setMobileFilterOpen(false)}
            className="!bg-[#176B4D]"
          >
            Ver {filteredProducts.length} Resultados
          </Button>
        </div>
      </Drawer>

    </div>
  );
};
