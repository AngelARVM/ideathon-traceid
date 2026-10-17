import React, { useState } from 'react';
import { 
  Breadcrumb, 
  Button, 
  Card, 
  Row, 
  Col, 
  Typography, 
  Tag, 
  Descriptions, 
  Statistic, 
  Slider, 
  Rate, 
  Space, 
  Divider, 
  Avatar, 
  message 
} from 'antd';
import { 
  ArrowLeftOutlined, 
  ShareAltOutlined, 
  SafetyCertificateFilled, 
  EnvironmentOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  CalculatorOutlined, 
  FileTextOutlined, 
  CheckCircleFilled, 
  CarOutlined, 
  ShopOutlined,
  CalendarOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import { Product, AppView } from '../types';
import { TraceabilityTimeline } from '../components/TraceabilityTimeline';

const { Title, Text, Paragraph } = Typography;

interface ProductDetailViewProps {
  product: Product;
  onNavigate: (view: AppView, productId?: string) => void;
  onRequestQuote: (product: Product) => void;
  onContactVendor: (product: Product) => void;
  onAddToCart?: (product: Product, tons?: number) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  onNavigate,
  onRequestQuote,
  onContactVendor,
  onAddToCart,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [calcTons, setCalcTons] = useState(product.minOrderTons || 30);

  const formattedPrice = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(product.pricePerTon);

  const estimatedTrucks = Math.ceil(calcTons / 28);
  const calculatedTotal = calcTons * product.pricePerTon;

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    message.success('Enlace de lote copiado al portapapeles');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Ant Design Breadcrumb & Back action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <Breadcrumb
          items={[
            { title: <a onClick={() => onNavigate('home')}>Inicio</a> },
            { title: <a onClick={() => onNavigate('marketplace')}>Catálogo</a> },
            { title: product.category },
            { title: product.title },
          ]}
          className="text-xs"
        />

        <Space size="small">
          <Button
            size="small"
            icon={<ArrowLeftOutlined />}
            onClick={() => onNavigate('marketplace')}
          >
            Volver al catálogo
          </Button>
          <Button
            size="small"
            icon={<ShareAltOutlined />}
            onClick={handleShare}
          >
            Compartir
          </Button>
        </Space>
      </div>

      {/* Main Details Grid */}
      <Row gutter={[24, 24]}>
        
        {/* Left Column: Gallery, Specs & Traceability (15 cols on LG) */}
        <Col xs={24} lg={15} className="space-y-6">
          
          {/* Gallery Card */}
          <Card className="!rounded-xl !border-gray-200 overflow-hidden shadow-xs" bodyStyle={{ padding: 0 }}>
            <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <Tag color="cyan" className="font-semibold text-xs !rounded shadow-xs">
                  {product.category}
                </Tag>
                <Tag color="success" icon={<SafetyCertificateFilled />} className="font-medium text-xs !rounded shadow-xs">
                  Lote Auditado
                </Tag>
              </div>
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-2 p-3 bg-white border-t border-gray-100 overflow-x-auto">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      activeImageIndex === idx 
                        ? 'border-[#176B4D] ring-2 ring-emerald-200' 
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Description & Technical Sheet (Ant Design Descriptions) */}
          <Card 
            className="!rounded-xl !border-gray-200 shadow-xs"
            title={
              <div className="flex items-center gap-2">
                <FileTextOutlined className="text-[#176B4D]" />
                <span className="font-bold text-gray-900">Descripción y Ficha Técnica Homologada</span>
              </div>
            }
          >
            <div className="space-y-4">
              <Paragraph className="text-gray-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line m-0">
                {product.description}
              </Paragraph>

              <Descriptions 
                bordered 
                size="small" 
                column={{ xs: 1, sm: 2, md: 3 }}
                className="bg-gray-50/50"
              >
                <Descriptions.Item label="Humedad Declarada">
                  <span className="font-bold text-gray-900">{product.specs.moisturePercentage}%</span>
                </Descriptions.Item>
                <Descriptions.Item label="Poder Calorífico (PCI)">
                  <span className="font-bold text-amber-700">
                    {product.specs.calorificPowerKcalKg 
                      ? `${product.specs.calorificPowerKcalKg.toLocaleString('es-AR')} kcal/kg` 
                      : 'No aplica'}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Granulometría">
                  <span className="font-semibold text-gray-800">{product.specs.granulometry}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Contenido de Cenizas">
                  <span className="font-semibold text-gray-800">
                    {product.specs.ashContentPercentage !== undefined ? `${product.specs.ashContentPercentage}%` : 'Trazas'}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Densidad Aparente">
                  <span className="font-semibold text-gray-800">
                    {product.specs.apparentDensityKgM3 ? `${product.specs.apparentDensityKgM3} kg/m³` : 'N/D'}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Formato de Envase">
                  <span className="font-semibold text-gray-800">{product.specs.packaging}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Pesaje en Planta">
                  <Tag color="success" icon={<CheckCircleFilled />} className="m-0 text-[11px]">
                    Báscula Electrónica Oficial
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Capacidad Diaria">
                  <span className="font-semibold text-gray-800">Hasta {product.maxTruckCapacityPerDay} camiones/día</span>
                </Descriptions.Item>
                <Descriptions.Item label="Frecuencia">
                  <span className="font-semibold text-gray-800">{product.generationFrequency}</span>
                </Descriptions.Item>
              </Descriptions>
            </div>
          </Card>

          {/* Traceability Section */}
          <TraceabilityTimeline
            lotCode={product.traceabilityLotCode}
            events={product.traceabilityEvents}
          />

        </Col>

        {/* Right Column: Pricing, B2B Quote Card & Vendor (9 cols on LG) */}
        <Col xs={24} lg={9} className="space-y-6 sticky top-24">
          
          {/* Commercial Box */}
          <Card className="!rounded-xl !border-gray-200 shadow-md">
            <div className="space-y-5">
              
              <div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <EnvironmentOutlined className="text-[#176B4D]" />
                  <span className="font-semibold text-gray-700">{product.city}, {product.province}</span>
                  <span>•</span>
                  <span>Planta de origen</span>
                </div>
                <Title level={4} className="!m-0 !text-gray-900 !font-extrabold leading-snug">
                  {product.title}
                </Title>
              </div>

              {/* Price & Stock Strip */}
              <div className="bg-[#f0f9f5] p-3.5 rounded-lg border border-[#92d6bb] flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Precio Mayorista</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[#176B4D]">{formattedPrice}</span>
                    <span className="text-xs text-gray-500">/ Tn</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Stock Disponible</span>
                  <span className="text-sm font-extrabold text-gray-900">
                    {product.availableTons.toLocaleString('es-AR')} Tn
                  </span>
                  <span className="text-[10px] text-gray-400 block">Mínimo: {product.minOrderTons} Tn</span>
                </div>
              </div>

              {/* Interactive Load Calculator (Fusion Design) */}
              <div className="bg-[#f8fafc] p-3.5 rounded-lg border border-gray-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 flex items-center gap-1.5">
                    <CalculatorOutlined className="text-[#176B4D]" />
                    Calculadora de Carga y Flete
                  </span>
                  <Tag color="cyan" className="m-0 font-bold">~{estimatedTrucks} batea(s)</Tag>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Toneladas estimadas:</span>
                    <span className="font-bold text-gray-900">{calcTons} Tn</span>
                  </div>
                  <Slider
                    min={product.minOrderTons}
                    max={Math.min(product.availableTons, 300)}
                    step={5}
                    value={calcTons}
                    onChange={(val) => setCalcTons(val)}
                    trackStyle={{ backgroundColor: '#176B4D' }}
                    handleStyle={{ borderColor: '#176B4D' }}
                  />
                </div>

                <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-gray-500">Subtotal estimado:</span>
                  <span className="text-base font-extrabold text-[#176B4D]">
                    ${calculatedTotal.toLocaleString('es-AR')} ARS
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {onAddToCart && (
                  <Button
                    block
                    type="primary"
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => onAddToCart(product, calcTons)}
                    className="!bg-[#176B4D] hover:!bg-[#12553c] font-bold !rounded-lg"
                  >
                    Agregar {calcTons} Tn al Carrito
                  </Button>
                )}

                <Button
                  block
                  size="large"
                  onClick={() => onRequestQuote(product)}
                  className="font-bold !rounded-lg text-gray-800 hover:!text-[#176B4D] hover:!border-[#176B4D]"
                >
                  Negociar Precio / Contraoferta
                </Button>

                <Button
                  block
                  size="large"
                  icon={<PhoneOutlined />}
                  onClick={() => onContactVendor(product)}
                  className="font-semibold !rounded-lg text-gray-600 hover:!text-[#176B4D] hover:!border-[#176B4D]"
                >
                  Contactar al Vendedor
                </Button>
              </div>

              <div className="text-[11px] text-gray-400 text-center space-y-0.5">
                <div className="flex items-center justify-center gap-1">
                  <SafetyCertificateFilled className="text-emerald-600" />
                  Operación B2B directa sin comisiones ocultas
                </div>
                <div>Emisión de remito y pesaje con ticket oficial</div>
              </div>

            </div>
          </Card>

          {/* Verified Vendor Card */}
          <Card 
            className="!rounded-xl !border-gray-200 shadow-xs"
            title={
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-gray-500">Proveedor Calificado</span>
                <Tag color="success" icon={<SafetyCertificateFilled />}>Verificado</Tag>
              </div>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <Avatar 
                  size={42} 
                  style={{ backgroundColor: '#176B4D' }}
                  className="font-bold text-sm"
                >
                  {product.vendor.name.substring(0, 2).toUpperCase()}
                </Avatar>
                <div>
                  <div className="font-bold text-gray-900 text-sm">{product.vendor.name}</div>
                  <div className="text-[11px] text-gray-400 font-mono">CUIT: {product.vendor.cuit}</div>
                  <div className="flex items-center gap-1 pt-0.5">
                    <Rate disabled defaultValue={5} className="!text-xs text-amber-500" />
                    <span className="font-bold text-gray-800">{product.vendor.rating}</span>
                    <span className="text-gray-400 text-[10px]">({product.vendor.reviewCount} ops)</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-gray-50 rounded-lg grid grid-cols-2 gap-2 text-center text-gray-600">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Operaciones</span>
                  <span className="font-bold text-gray-900">{product.vendor.completedDeals} completadas</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Antigüedad</span>
                  <span className="font-bold text-gray-900">Desde {product.vendor.joinedYear}</span>
                </div>
              </div>

              <div className="space-y-1 text-gray-500 pt-1">
                <div className="flex items-center gap-2">
                  <EnvironmentOutlined className="text-gray-400" />
                  <span>{product.loadingPlantAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneOutlined className="text-gray-400" />
                  <span>{product.vendor.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MailOutlined className="text-gray-400" />
                  <span>{product.vendor.email}</span>
                </div>
              </div>
            </div>
          </Card>

        </Col>

      </Row>

    </div>
  );
};
