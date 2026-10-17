import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Segmented, 
  Tag, 
  Button, 
  Input, 
  InputNumber, 
  Typography, 
  Space, 
  Divider, 
  Badge, 
  message as antMessage,
  Descriptions
} from 'antd';
import { 
  InboxOutlined, 
  SendOutlined, 
  CheckCircleFilled, 
  CloseCircleFilled, 
  ClockCircleFilled, 
  MessageOutlined, 
  CarOutlined, 
  UserOutlined, 
  ShopOutlined, 
  ArrowRightOutlined,
  DollarOutlined,
  SafetyCertificateFilled
} from '@ant-design/icons';
import { QuoteRequest, QuoteStatus, QuoteMessage, AppView, UserProfile } from '../types';

const { Title, Text, Paragraph } = Typography;

interface RequestsViewProps {
  requests: QuoteRequest[];
  onUpdateRequest: (updated: QuoteRequest) => void;
  onNavigate: (view: AppView, productId?: string) => void;
  activeProfile: UserProfile;
  onFormalizeOrder?: (request: QuoteRequest) => void;
}

export const RequestsView: React.FC<RequestsViewProps> = ({
  requests,
  onUpdateRequest,
  onNavigate,
  activeProfile,
  onFormalizeOrder,
}) => {
  const [selectedRequestId, setSelectedRequestId] = useState<string>(requests[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>(activeProfile.role === 'vendor' ? 'received' : 'sent');

  // React to profile role change
  React.useEffect(() => {
    setActiveTab(activeProfile.role === 'vendor' ? 'received' : 'sent');
  }, [activeProfile]);
  
  // Reply Form State
  const [replyMessage, setReplyMessage] = useState('');
  const [counterPrice, setCounterPrice] = useState<number | null>(null);

  const selectedRequest = requests.find((r) => r.id === selectedRequestId) || requests[0];

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() && !counterPrice) return;
    if (!selectedRequest) return;

    const newMessage: QuoteMessage = {
      id: `msg-${Date.now()}`,
      sender: activeTab === 'received' ? 'vendor' : 'buyer',
      senderName: `${activeProfile.name} (${activeProfile.company})`,
      text: replyMessage || `Propuesta de precio por tonelada actualizada a $${counterPrice?.toLocaleString('es-AR')}/Tn.`,
      timestamp: 'Hoy, recién',
      proposedPricePerTon: counterPrice ? Number(counterPrice) : undefined,
    };

    const updated: QuoteRequest = {
      ...selectedRequest,
      status: 'En negociación',
      offeredPricePerTon: counterPrice ? Number(counterPrice) : selectedRequest.offeredPricePerTon,
      updatedAt: new Date().toISOString(),
      messages: [...selectedRequest.messages, newMessage],
    };

    onUpdateRequest(updated);
    setReplyMessage('');
    setCounterPrice(null);
    antMessage.success('Respuesta y contraoferta enviadas a la contraparte.');
  };

  const handleUpdateStatus = (newStatus: QuoteStatus) => {
    if (!selectedRequest) return;

    const statusNotice: QuoteMessage = {
      id: `msg-${Date.now()}`,
      sender: activeTab === 'received' ? 'vendor' : 'buyer',
      senderName: `${activeProfile.name} (${activeProfile.company})`,
      text: newStatus === 'Aceptada'
        ? `Cotización formal ACEPTADA. Se emite orden de retiro por ${selectedRequest.requestedTons} Tn.`
        : `Cotización RECHAZADA. Las condiciones comerciales o de cupo no fueron acordadas.`,
      timestamp: 'Hoy, recién',
    };

    const updated: QuoteRequest = {
      ...selectedRequest,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      messages: [...selectedRequest.messages, statusNotice],
    };

    onUpdateRequest(updated);
    antMessage.info(`Estado actualizado a: "${newStatus}"`);
  };

  const getStatusTag = (status: QuoteStatus) => {
    switch (status) {
      case 'Pendiente':
        return <Tag color="warning" icon={<ClockCircleFilled />}>Pendiente</Tag>;
      case 'En negociación':
        return <Tag color="processing" icon={<MessageOutlined />}>En negociación</Tag>;
      case 'Aceptada':
        return <Tag color="success" icon={<CheckCircleFilled />}>Aceptada</Tag>;
      case 'Rechazada':
        return <Tag color="error" icon={<CloseCircleFilled />}>Rechazada</Tag>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <Tag color="cyan" className="font-semibold text-xs">Mesa de Negociación B2B</Tag>
          <Title level={3} className="!m-0 !text-gray-900 !font-extrabold tracking-tight mt-1">
            Cotizaciones y Negociaciones de Subproductos
          </Title>
          <Text className="text-xs text-gray-500">
            Seguimiento de ofertas, acuerdos de volumen, contraofertas y condiciones de retiro.
          </Text>
        </div>

        <Segmented
          value={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          options={[
            { label: 'Recibidas como Vendedor', value: 'received' },
            { label: 'Enviadas como Comprador', value: 'sent' },
          ]}
          size="middle"
        />
      </div>

      {/* Main Negotiation Grid */}
      <Row gutter={[24, 24]}>
        
        {/* Left Column: Quotes List (10 cols on LG) */}
        <Col xs={24} lg={10} className="space-y-4">
          
          {/* Status Filter Tags */}
          <div className="flex flex-wrap items-center gap-1 bg-white p-2 rounded-xl border border-gray-200 text-xs">
            {(['all', 'Pendiente', 'En negociación', 'Aceptada', 'Rechazada'] as const).map((st) => (
              <Button
                key={st}
                size="small"
                type={statusFilter === st ? 'primary' : 'text'}
                onClick={() => setStatusFilter(st)}
                className={`text-xs ${statusFilter === st ? '!bg-[#176B4D]' : 'text-gray-600'}`}
              >
                {st === 'all' ? 'Todas' : st}
              </Button>
            ))}
          </div>

          {/* Cards List */}
          <div className="space-y-3">
            {filteredRequests.map((req) => {
              const isSelected = selectedRequest?.id === req.id;
              const totalOp = req.requestedTons * req.offeredPricePerTon;

              return (
                <Card
                  key={req.id}
                  hoverable
                  onClick={() => setSelectedRequestId(req.id)}
                  className={`!rounded-xl transition-all cursor-pointer shadow-xs ${
                    isSelected 
                      ? '!border-[#176B4D] ring-2 ring-emerald-200 bg-white' 
                      : '!border-gray-200 bg-white'
                  }`}
                  bodyStyle={{ padding: '16px' }}
                >
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-gray-400 font-bold text-[10px]">
                        {req.id}
                      </span>
                      {getStatusTag(req.status)}
                    </div>

                    <div>
                      <div className="font-bold text-sm text-gray-900 line-clamp-1">
                        {req.productTitle}
                      </div>
                      <div className="text-gray-500 text-[11px]">
                        {activeTab === 'received' ? `Comprador: ${req.buyerCompany}` : `Vendedor: ${req.vendorName}`}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50 rounded-lg text-[11px]">
                      <div>
                        <span className="text-gray-400 block">Cantidad:</span>
                        <strong className="text-gray-900">{req.requestedTons} Tn</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Precio Ofertado:</span>
                        <strong className="text-[#176B4D]">${req.offeredPricePerTon.toLocaleString('es-AR')}/Tn</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                      <span>Entrega: {req.targetDate}</span>
                      <span className="font-bold text-gray-800">
                        Total: ${totalOp.toLocaleString('es-AR')} ARS
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}

            {filteredRequests.length === 0 && (
              <Card className="!rounded-xl !border-gray-200 text-center py-8 text-xs text-gray-400">
                No hay cotizaciones registradas en este estado.
              </Card>
            )}
          </div>

        </Col>

        {/* Right Column: Negotiation Thread & Actions (14 cols on LG) */}
        <Col xs={24} lg={14}>
          {selectedRequest ? (
            <Card className="!rounded-xl !border-gray-200 shadow-sm overflow-hidden" bodyStyle={{ padding: 0 }}>
              
              {/* Header Box */}
              <div className="bg-[#176B4D] p-5 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-emerald-200 text-xs font-bold">{selectedRequest.id}</span>
                  {getStatusTag(selectedRequest.status)}
                </div>

                <div>
                  <Title level={4} className="!m-0 !text-white !font-bold leading-snug">
                    {selectedRequest.productTitle}
                  </Title>
                  <Text className="text-emerald-100 text-xs">
                    Operación entre <strong>{selectedRequest.vendorName}</strong> y <strong>{selectedRequest.buyerCompany}</strong>
                  </Text>
                </div>

                {/* Status action buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <Button
                    type="primary"
                    icon={<CheckCircleFilled />}
                    disabled={selectedRequest.status === 'Aceptada'}
                    onClick={() => handleUpdateStatus('Aceptada')}
                    className="!bg-emerald-500 hover:!bg-emerald-400 font-semibold text-xs"
                  >
                    Aceptar Cotización
                  </Button>

                  <Button
                    danger
                    icon={<CloseCircleFilled />}
                    disabled={selectedRequest.status === 'Rechazada'}
                    onClick={() => handleUpdateStatus('Rechazada')}
                    className="font-semibold text-xs"
                  >
                    Rechazar
                  </Button>

                  {selectedRequest.status === 'Aceptada' && onFormalizeOrder && (
                    <Button
                      type="primary"
                      icon={<SafetyCertificateFilled />}
                      onClick={() => onFormalizeOrder(selectedRequest)}
                      className="!bg-white !text-[#176B4D] hover:!bg-emerald-50 font-bold text-xs shadow-xs"
                    >
                      Formalizar en Blockchain
                    </Button>
                  )}

                  <Button
                    type="link"
                    onClick={() => onNavigate('product-detail', selectedRequest.productId)}
                    className="!text-emerald-200 hover:!text-white ml-auto text-xs"
                  >
                    Ver lote original <ArrowRightOutlined />
                  </Button>
                </div>
              </div>

              {/* Deal Parameters Descriptions */}
              <div className="p-5 space-y-4">
                <Descriptions bordered size="small" column={{ xs: 2, sm: 4 }}>
                  <Descriptions.Item label="Volumen">
                    <span className="font-bold text-gray-900">{selectedRequest.requestedTons} Tn</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Precio Ofertado">
                    <span className="font-bold text-[#176B4D]">
                      ${selectedRequest.offeredPricePerTon.toLocaleString('es-AR')}/Tn
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Estimado">
                    <span className="font-bold text-gray-900">
                      ${(selectedRequest.requestedTons * selectedRequest.offeredPricePerTon).toLocaleString('es-AR')} ARS
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Fecha Requerida">
                    <span className="font-semibold text-gray-800">{selectedRequest.targetDate}</span>
                  </Descriptions.Item>
                </Descriptions>

                {/* Logistics details */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-gray-800">
                    <CarOutlined className="text-[#176B4D]" />
                    <span>Logística: {selectedRequest.logisticsPreference}</span>
                  </div>
                  <div className="text-gray-500 text-[11px]">
                    Contacto: {selectedRequest.buyerContact} ({selectedRequest.buyerLocation})
                  </div>
                </div>

                {/* Message Conversation Timeline */}
                <div className="space-y-3">
                  <div className="font-bold text-xs uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <MessageOutlined className="text-[#176B4D]" />
                    Historial de Mensajes y Ofertas
                  </div>

                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {selectedRequest.messages.map((msg) => {
                      const isVendor = msg.sender === 'vendor';
                      return (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-lg text-xs space-y-1 border ${
                            isVendor
                              ? 'bg-[#f0f9f5] border-[#92d6bb] ml-6'
                              : 'bg-gray-50 border-gray-200 mr-6'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-gray-800">
                              {msg.senderName}
                            </span>
                            <span className="text-gray-400">{msg.timestamp}</span>
                          </div>

                          <p className="text-gray-700 m-0 leading-relaxed">
                            {msg.text}
                          </p>

                          {msg.proposedPricePerTon && (
                            <div className="pt-1 text-[11px]">
                              <span className="text-gray-500">Precio propuesto: </span>
                              <strong className="text-[#176B4D]">
                                ${msg.proposedPricePerTon.toLocaleString('es-AR')}/Tn
                              </strong>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendMessage} className="pt-3 border-t border-gray-100 space-y-3">
                  <div className="font-semibold text-xs text-gray-700">
                    Enviar mensaje o contraoferta:
                  </div>

                  <Row gutter={8}>
                    <Col xs={24} sm={16}>
                      <Input
                        placeholder="Escribí un mensaje o condición de entrega..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        size="middle"
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <InputNumber
                        step={500}
                        placeholder="Contraoferta $/Tn"
                        value={counterPrice}
                        onChange={(val) => setCounterPrice(val)}
                        className="w-full"
                        size="middle"
                        addonBefore="$"
                        addonAfter="/Tn"
                      />
                    </Col>
                  </Row>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                      Enviar actualizará la solicitud a "En negociación".
                    </span>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SendOutlined />}
                      className="!bg-[#176B4D] hover:!bg-[#12553c] font-semibold"
                    >
                      Enviar Respuesta
                    </Button>
                  </div>
                </form>

              </div>

            </Card>
          ) : (
            <Card className="!rounded-xl !border-gray-200 text-center py-12 text-xs text-gray-400">
              Seleccioná una cotización para ver los detalles.
            </Card>
          )}
        </Col>

      </Row>

    </div>
  );
};
