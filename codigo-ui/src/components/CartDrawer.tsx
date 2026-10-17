import React from 'react';
import { 
  Drawer, 
  Button, 
  Typography, 
  Space, 
  Tag, 
  InputNumber, 
  Radio, 
  Empty, 
  Divider, 
  Popconfirm 
} from 'antd';
import { 
  ShoppingCartOutlined, 
  DeleteOutlined, 
  SafetyCertificateFilled, 
  ArrowRightOutlined, 
  TruckOutlined, 
  InteractionOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { CartItem, Product } from '../types';

const { Title, Text, Paragraph } = Typography;

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateTons: (itemId: string, tons: number) => void;
  onUpdateLogistics: (itemId: string, pref: 'Retiro por cuenta del comprador' | 'Cotizar flete puesto en destino') => void;
  onRemoveItem: (itemId: string) => void;
  onCheckoutItem: (item: CartItem) => void;
  onNegotiateItem: (product: Product) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateTons,
  onUpdateLogistics,
  onRemoveItem,
  onCheckoutItem,
  onNegotiateItem,
}) => {
  const totalTons = cart.reduce((acc, item) => acc + item.tons, 0);
  const totalAmount = cart.reduce((acc, item) => acc + (item.tons * item.pricePerTon), 0);

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCartOutlined className="text-[#176B4D] text-lg" />
            <span className="font-bold text-gray-900">Carrito B2B de Subproductos</span>
          </div>
          {cart.length > 0 && (
            <Tag color="success" className="font-bold">
              {cart.length} {cart.length === 1 ? 'lote' : 'lotes'}
            </Tag>
          )}
        </div>
      }
      placement="right"
      width={460}
      onClose={onClose}
      open={isOpen}
      footer={
        cart.length > 0 ? (
          <div className="space-y-3 pt-1">
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/80 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Volumen Total Solicitado:</span>
                <span className="font-bold text-gray-800">{totalTons} Toneladas</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-1 border-t border-gray-200">
                <span className="font-bold text-gray-900">Total Estimado Material:</span>
                <span className="font-extrabold text-[#176B4D] text-base">
                  ${totalAmount.toLocaleString('es-AR')} ARS
                </span>
              </div>
              <p className="text-[10px] text-gray-400 m-0 pt-0.5">
                * Precios en planta origen sin flete adicional. La orden final se formaliza con firma digital Blockchain.
              </p>
            </div>

            <Button
              type="primary"
              size="large"
              block
              icon={<SafetyCertificateFilled />}
              onClick={() => {
                if (cart.length > 0) {
                  onCheckoutItem(cart[0]);
                }
              }}
              className="!bg-[#176B4D] hover:!bg-[#12553c] !font-bold !h-12 !text-sm shadow-xs"
            >
              Realizar Compra con Firma Blockchain
            </Button>
          </div>
        ) : null
      }
    >
      {cart.length === 0 ? (
        <div className="py-16 text-center space-y-4">
          <Empty 
            description={
              <span className="text-gray-500 text-xs">
                Tu carrito de subproductos está vacío. Explorá el catálogo para sumar cascarilla, chips o aserrín.
              </span>
            } 
          />
        </div>
      ) : (
        <div className="space-y-4">
          {cart.map((item) => {
            const itemTotal = item.tons * item.pricePerTon;

            return (
              <div 
                key={item.id} 
                className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-2xs hover:border-gray-300 transition-colors"
              >
                {/* Header: Title & Delete */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-[#176B4D] uppercase tracking-wider block">
                      {item.product.category}
                    </span>
                    <h4 className="font-bold text-sm text-gray-900 m-0 leading-snug">
                      {item.product.title}
                    </h4>
                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                      <EnvironmentOutlined /> {item.product.city}, {item.product.province} • {item.product.vendor.name}
                    </span>
                  </div>

                  <Popconfirm
                    title="¿Quitar del carrito?"
                    onConfirm={() => onRemoveItem(item.id)}
                    okText="Quitar"
                    cancelText="Cancelar"
                  >
                    <button 
                      type="button" 
                      className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
                    >
                      <DeleteOutlined />
                    </button>
                  </Popconfirm>
                </div>

                {/* Price and Ton Selector */}
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px]">PRECIO TONELADA:</span>
                    <span className="font-bold text-gray-800">${item.pricePerTon.toLocaleString('es-AR')}/Tn</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">CANTIDAD (TONELADAS):</span>
                    <InputNumber
                      min={item.product.minOrderTons || 5}
                      max={item.product.availableTons}
                      value={item.tons}
                      onChange={(val) => onUpdateTons(item.id, Number(val) || item.product.minOrderTons)}
                      size="small"
                      addonAfter="Tn"
                      className="w-full font-bold"
                    />
                  </div>
                </div>

                {/* Logistics Preference */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block flex items-center gap-1">
                    <TruckOutlined /> Modalidad Logística:
                  </span>
                  <Radio.Group
                    size="small"
                    value={item.logisticsPreference}
                    onChange={(e) => onUpdateLogistics(item.id, e.target.value)}
                    className="w-full text-xs"
                  >
                    <div className="space-y-1">
                      <Radio value="Retiro por cuenta del comprador" className="text-xs">
                        Retiro propio en planta con báscula
                      </Radio>
                      <Radio value="Cotizar flete puesto en destino" className="text-xs">
                        Solicitar flete puesto en destino
                      </Radio>
                    </div>
                  </Radio.Group>
                </div>

                {/* Subtotal & Actions */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 block">SUBTOTAL:</span>
                    <span className="font-extrabold text-[#176B4D] text-sm">
                      ${itemTotal.toLocaleString('es-AR')} ARS
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="small"
                      icon={<InteractionOutlined />}
                      onClick={() => {
                        onNegotiateItem(item.product);
                        onClose();
                      }}
                      className="!text-xs font-semibold text-gray-700"
                    >
                      Negociar Precio
                    </Button>

                    <Button
                      size="small"
                      type="primary"
                      icon={<SafetyCertificateFilled />}
                      onClick={() => {
                        onCheckoutItem(item);
                      }}
                      className="!bg-[#176B4D] !text-xs font-bold"
                    >
                      Comprar
                    </Button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
};
