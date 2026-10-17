import React, { useState } from 'react';
import { 
  Modal, 
  Form, 
  InputNumber, 
  Radio, 
  Input, 
  Button, 
  Select, 
  Typography, 
  Alert, 
  Row, 
  Col, 
  Divider,
  Tag,
  Space
} from 'antd';
import { 
  SendOutlined, 
  CheckCircleFilled, 
  ShopOutlined, 
  EnvironmentOutlined,
  DollarOutlined,
  CarOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { Product, Province, QuoteRequest } from '../types';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface QuoteModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSubmitQuote: (newRequest: Partial<QuoteRequest>) => void;
}

export const QuoteModal: React.FC<QuoteModalProps> = ({
  product,
  isOpen,
  onClose,
  onSubmitQuote,
}) => {
  const [requestedTons, setRequestedTons] = useState<number>(Math.max(product.minOrderTons, 30));
  const [offeredPrice, setOfferedPrice] = useState<number>(product.pricePerTon);
  const [logistics, setLogistics] = useState<'Retiro por cuenta del comprador' | 'Cotizar flete puesto en destino'>('Retiro por cuenta del comprador');
  const [destinationCity, setDestinationCity] = useState('');
  const [destinationProvince, setDestinationProvince] = useState<Province>('Corrientes');
  const [targetDate, setTargetDate] = useState('2026-10-30');
  const [buyerName, setBuyerName] = useState('Ing. Marcos Giménez');
  const [buyerCompany, setBuyerCompany] = useState('Bioenergía Mesopotamia S.A.');
  const [buyerContact, setBuyerContact] = useState('+54 379 499-1020 / compras@biomesopotamia.com');
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const totalEstimate = requestedTons * offeredPrice;

  const handleSubmit = () => {
    onSubmitQuote({
      productId: product.id,
      productTitle: product.title,
      productCategory: product.category,
      vendorId: product.vendor.id,
      vendorName: product.vendor.name,
      buyerName,
      buyerCompany,
      buyerLocation: `${destinationCity || 'Corrientes Capital'}, ${destinationProvince}`,
      buyerContact,
      requestedTons,
      offeredPricePerTon: offeredPrice,
      originalPricePerTon: product.pricePerTon,
      currency: product.currency,
      status: 'Pendiente',
      logisticsPreference: logistics,
      targetDate,
      destinationCity: destinationCity || undefined,
      destinationProvince: destinationProvince || undefined,
      comments: comments || `Solicitud formal de cotización por ${requestedTons} Tn de ${product.title}.`,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'buyer',
          senderName: `${buyerName} (${buyerCompany})`,
          text: comments || `Estimados ${product.vendor.name}, solicitamos cotización formal por ${requestedTons} Tn. Ofrecemos $${offeredPrice.toLocaleString('es-AR')}/Tn con fecha prevista ${targetDate}.`,
          timestamp: 'Hoy, recién',
          proposedPricePerTon: offeredPrice,
        }
      ]
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={680}
      title={
        <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
          <ShopOutlined className="text-[#176B4D]" />
          <span>Solicitar Cotización Formal B2B</span>
        </div>
      }
      className="!rounded-2xl"
    >
      {submitted ? (
        <div className="py-10 text-center space-y-3">
          <CheckCircleFilled className="text-5xl text-[#176B4D]" />
          <Title level={4} className="!m-0 !text-gray-900">¡Cotización enviada con éxito!</Title>
          <Text className="text-gray-500 text-xs block max-w-sm mx-auto">
            Se notificó a <strong>{product.vendor.name}</strong>. Podés seguir la negociación en la pestaña <strong>Solicitudes</strong>.
          </Text>
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          
          {/* Header Product Summary */}
          <div className="bg-[#f8fafc] p-3.5 rounded-lg border border-gray-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-gray-900">{product.title}</span>
              <Tag color="green">{product.category}</Tag>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <EnvironmentOutlined />
              <span>{product.vendor.name} • {product.city}, {product.province}</span>
            </div>
          </div>

          <Row gutter={[16, 16]}>
            {/* Volume */}
            <Col xs={24} sm={12}>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 block">
                  Toneladas solicitadas (Tn) *
                </label>
                <InputNumber
                  min={product.minOrderTons}
                  max={product.availableTons}
                  value={requestedTons}
                  onChange={(val) => setRequestedTons(val || product.minOrderTons)}
                  className="w-full font-bold"
                  size="large"
                  addonAfter="Tn"
                />
                <div className="flex gap-1 pt-1">
                  {[30, 60, 150, 300].map(vol => (
                    vol <= product.availableTons && (
                      <Button
                        key={vol}
                        size="small"
                        type={requestedTons === vol ? 'primary' : 'default'}
                        onClick={() => setRequestedTons(vol)}
                        className={`text-[11px] !px-2 ${requestedTons === vol ? '!bg-[#176B4D]' : ''}`}
                      >
                        {vol} Tn
                      </Button>
                    )
                  ))}
                </div>
                <div className="text-[10px] text-gray-400">
                  Mínimo: {product.minOrderTons} Tn • Stock total: {product.availableTons} Tn
                </div>
              </div>
            </Col>

            {/* Price Proposal */}
            <Col xs={24} sm={12}>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 block">
                  Precio ofertado por Tonelada ($ ARS) *
                </label>
                <InputNumber
                  step={500}
                  value={offeredPrice}
                  onChange={(val) => setOfferedPrice(val || product.pricePerTon)}
                  className="w-full font-bold !text-[#176B4D]"
                  size="large"
                  addonBefore="$"
                  addonAfter="/Tn"
                />
                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                  <span>Precio de lista: ${product.pricePerTon.toLocaleString('es-AR')}</span>
                  {offeredPrice !== product.pricePerTon && (
                    <Tag color="warning" className="m-0 text-[10px]">Oferta ajustada</Tag>
                  )}
                </div>
              </div>
            </Col>
          </Row>

          {/* Subtotal Banner */}
          <div className="bg-[#f0f9f5] p-3 rounded-lg border border-[#92d6bb] flex items-center justify-between text-xs">
            <span className="text-gray-600 font-medium">Subtotal estimado de la operación:</span>
            <span className="text-base font-extrabold text-[#176B4D]">
              ${totalEstimate.toLocaleString('es-AR')} ARS
            </span>
          </div>

          {/* Logistics Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 block">
              Modalidad de Transporte y Logística
            </label>
            <Radio.Group 
              value={logistics} 
              onChange={(e) => setLogistics(e.target.value)}
              className="w-full"
            >
              <Space direction="vertical" className="w-full">
                <Radio value="Retiro por cuenta del comprador" className="text-xs">
                  <span className="font-semibold text-gray-800">Retiro por cuenta del comprador (camión propio en planta)</span>
                  <span className="text-gray-400 block text-[11px]">En planta del vendedor ({product.city}, {product.province})</span>
                </Radio>
                <Radio value="Cotizar flete puesto en destino" className="text-xs">
                  <span className="font-semibold text-gray-800">Cotizar flete puesto en destino</span>
                  <span className="text-gray-400 block text-[11px]">El vendedor incluye o presupuesta transporte</span>
                </Radio>
              </Space>
            </Radio.Group>

            {logistics === 'Cotizar flete puesto en destino' && (
              <Row gutter={8} className="pt-2">
                <Col span={14}>
                  <Input
                    placeholder="Localidad de destino (ej. Virasoro)"
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value)}
                    size="small"
                  />
                </Col>
                <Col span={10}>
                  <Select
                    value={destinationProvince}
                    onChange={(val) => setDestinationProvince(val as Province)}
                    className="w-full"
                    size="small"
                    options={[
                      { value: 'Corrientes', label: 'Corrientes' },
                      { value: 'Chaco', label: 'Chaco' },
                      { value: 'Misiones', label: 'Misiones' },
                      { value: 'Formosa', label: 'Formosa' },
                    ]}
                  />
                </Col>
              </Row>
            )}
          </div>

          {/* Dates & Company info */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Fecha estimada de retiro
              </label>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                size="middle"
              />
            </Col>
            <Col xs={24} sm={12}>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Empresa Solicitante
              </label>
              <Input
                value={buyerCompany}
                onChange={(e) => setBuyerCompany(e.target.value)}
                size="middle"
              />
            </Col>
          </Row>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Comentarios o especificaciones técnicas
            </label>
            <TextArea
              rows={2}
              placeholder="Ej: Requerimos entrega en bateas de 40 m3, análisis bromatológico adjunto..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>

          <Divider className="!my-3" />

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2">
            <Button onClick={onClose}>Cancelar</Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              className="!bg-[#176B4D] hover:!bg-[#12553c] font-semibold"
            >
              Enviar Cotización
            </Button>
          </div>

        </div>
      )}
    </Modal>
  );
};
