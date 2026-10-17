import React from 'react';
import { Card, Tag, Button, Space, Typography, Tooltip } from 'antd';
import { 
  EnvironmentOutlined, 
  SafetyCertificateFilled, 
  FireOutlined, 
  ExperimentOutlined, 
  InboxOutlined, 
  ArrowRightOutlined,
  CheckCircleOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import { Product } from '../types';

const { Text, Title } = Typography;

interface ProductCardProps {
  product: Product;
  onViewDetail: (id: string) => void;
  onRequestQuote: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetail,
  onRequestQuote,
  onAddToCart,
}) => {
  const formattedPrice = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(product.pricePerTon);

  const formattedTons = new Intl.NumberFormat('es-AR').format(product.availableTons);

  return (
    <Card
      hoverable
      className="overflow-hidden flex flex-col justify-between !rounded-xl !border-gray-200 transition-all duration-200"
      bodyStyle={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}
      cover={
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 group">
          <img
            alt={product.title}
            src={product.images[0]}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          
          {/* Top badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
            <Tag color="cyan" className="m-0 font-semibold !text-xs !rounded shadow-xs">
              {product.category}
            </Tag>
            {product.vendor.verified && (
              <Tag color="success" icon={<SafetyCertificateFilled />} className="m-0 font-medium !text-[11px] !rounded shadow-xs">
                Verificado
              </Tag>
            )}
          </div>

          {/* Bottom stats overlay */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-xs">
            <span className="bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded text-[11px] font-semibold text-emerald-300">
              {formattedTons} Tn disponibles
            </span>
            {product.hasWeighbridge && (
              <span className="bg-emerald-950/80 text-emerald-200 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px]">
                Báscula en planta
              </span>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {/* Vendor and Location */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <EnvironmentOutlined className="text-[#176B4D]" />
          <span className="font-semibold text-gray-700">{product.city}, {product.province}</span>
          <span>•</span>
          <span className="truncate">{product.vendor.name}</span>
        </div>

        {/* Product Title */}
        <div 
          onClick={() => onViewDetail(product.id)}
          className="cursor-pointer group/title"
        >
          <Title level={5} className="!m-0 !text-sm !font-bold !text-gray-900 group-hover/title:!text-[#176B4D] line-clamp-2 transition-colors">
            {product.title}
          </Title>
        </div>

        {/* Technical specs in Fusion style tags */}
        <div className="bg-[#f8fafc] p-2.5 rounded-lg border border-gray-100 space-y-1.5 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5">
              <ExperimentOutlined className="text-blue-500" />
              <div>
                <span className="text-[10px] text-gray-400 block leading-tight">Humedad</span>
                <span className="font-bold text-gray-800">{product.specs.moisturePercentage}%</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <FireOutlined className="text-amber-500" />
              <div>
                <span className="text-[10px] text-gray-400 block leading-tight">Poder Calorífico</span>
                <span className="font-bold text-gray-800">
                  {product.specs.calorificPowerKcalKg 
                    ? `${product.specs.calorificPowerKcalKg.toLocaleString('es-AR')} kcal` 
                    : 'N/D'}
                </span>
              </div>
            </div>
          </div>
          <div className="pt-1 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-500">
            <span className="truncate flex items-center gap-1">
              <InboxOutlined /> {product.specs.packaging}
            </span>
            <span className="text-gray-400">Lote: {product.traceabilityLotCode}</span>
          </div>
        </div>
      </div>

      {/* Pricing & Footer Actions */}
      <div className="pt-3 mt-3 border-t border-gray-100 flex items-end justify-between gap-2">
        <div>
          <span className="text-[11px] text-gray-400 block font-medium">Precio por tonelada</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-extrabold text-[#176B4D]">{formattedPrice}</span>
            <span className="text-xs text-gray-500">/ Tn</span>
          </div>
        </div>

        <Space size="xs">
          {onAddToCart && (
            <Tooltip title="Agregar al carrito B2B">
              <Button 
                size="small"
                icon={<ShoppingCartOutlined className="text-[#176B4D]" />}
                onClick={() => onAddToCart(product)}
                className="!text-xs font-semibold hover:!border-[#176B4D]"
              />
            </Tooltip>
          )}
          <Button 
            size="small"
            onClick={() => onRequestQuote(product)}
            className="!text-xs font-semibold"
          >
            Negociar
          </Button>
          <Button 
            type="primary" 
            size="small"
            icon={<ArrowRightOutlined />}
            onClick={() => onViewDetail(product.id)}
            className="!bg-[#176B4D] hover:!bg-[#12553c] !text-xs font-semibold"
          >
            Detalle
          </Button>
        </Space>
      </div>
    </Card>
  );
};
