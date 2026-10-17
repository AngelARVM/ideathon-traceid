import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Button, 
  Tag, 
  Space, 
  Input, 
  Modal, 
  Form, 
  InputNumber, 
  Select, 
  Typography, 
  Popconfirm, 
  message, 
  Segmented,
  Tooltip,
  Divider,
  Alert
} from 'antd';
import { 
  PlusCircleOutlined, 
  AppstoreOutlined, 
  InboxOutlined, 
  DollarCircleOutlined, 
  EditOutlined, 
  PauseCircleOutlined, 
  PlayCircleOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  SearchOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  SafetyCertificateFilled,
  CalendarOutlined,
  ThunderboltFilled,
  CopyOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { Product, AppView, UserProfile, PurchaseOrder, ProductForecast, MaterialCategory } from '../types';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface VendorDashboardViewProps {
  products: Product[];
  onNavigate: (view: AppView, productId?: string) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  pendingRequestsCount: number;
  activeProfile: UserProfile;
  orders: PurchaseOrder[];
  onGenerateOrder: (order: Partial<PurchaseOrder>) => void;
  onOpenSignModal?: (order: PurchaseOrder) => void;
  forecasts: ProductForecast[];
  onPublishForecast: (forecast: Partial<ProductForecast>) => void;
  onDeleteForecast?: (id: string) => void;
}

export const VendorDashboardView: React.FC<VendorDashboardViewProps> = ({
  products,
  onNavigate,
  onUpdateProduct,
  onDeleteProduct,
  pendingRequestsCount,
  activeProfile,
  orders,
  onGenerateOrder,
  onOpenSignModal,
  forecasts,
  onPublishForecast,
  onDeleteForecast,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'forecasts' | 'orders'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modals state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isForecastModalOpen, setIsForecastModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // New Forecast Form State
  const [newForecast, setNewForecast] = useState<Partial<ProductForecast>>({
    title: '',
    category: 'Cascarilla de arroz',
    estimatedTons: 500,
    availableDate: 'Diciembre 2026',
    estimatedPricePerTon: 30000,
    minReservationTons: 30,
    notes: '',
  });

  // New Blockchain Purchase Order Form State
  const [newOrder, setNewOrder] = useState<Partial<PurchaseOrder>>({
    buyerCompany: 'Central Térmica San Alonso',
    buyerName: 'Ing. Lucas Benítez',
    productId: products[0]?.id || '',
    productTitle: products[0]?.title || '',
    category: products[0]?.category || 'Cascarilla de arroz',
    tons: 50,
    pricePerTon: products[0]?.pricePerTon || 28500,
    logistics: 'Retiro por cuenta del comprador (Batea 35 Tn)',
    destination: 'Gobernador Virasoro, Corrientes',
  });

  const activeProducts = products.filter((p) => p.status === 'active');
  const totalTons = products.reduce((acc, p) => acc + (p.status === 'active' ? p.availableTons : 0), 0);
  const totalStockValue = products.reduce((acc, p) => acc + (p.status === 'active' ? p.availableTons * p.pricePerTon : 0), 0);

  const filteredProducts = products.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleToggleStatus = (p: Product) => {
    const newStatus = p.status === 'active' ? 'paused' : 'active';
    const updated = { ...p, status: newStatus as any };
    onUpdateProduct(updated);
    message.success(newStatus === 'paused' ? `Lote "${p.title}" pausado.` : `Lote "${p.title}" activado.`);
  };

  const handleDelete = (id: string) => {
    onDeleteProduct(id);
    message.success('Lote eliminado del inventario.');
  };

  const handleSaveEdit = () => {
    if (!editingProduct) return;
    onUpdateProduct(editingProduct);
    message.success('Lote actualizado exitosamente.');
    setEditingProduct(null);
  };

  const handleCreateForecast = () => {
    if (!newForecast.title) {
      message.error('Por favor ingresá un título para la proyección.');
      return;
    }
    onPublishForecast(newForecast);
    setIsForecastModalOpen(false);
    message.success('Estimativo de producción publicado en el marketplace.');
    setNewForecast({
      title: '',
      category: 'Cascarilla de arroz',
      estimatedTons: 500,
      availableDate: 'Diciembre 2026',
      estimatedPricePerTon: 30000,
      minReservationTons: 30,
      notes: '',
    });
  };

  const handleCreateBlockchainOrder = () => {
    if (!newOrder.productId || !newOrder.buyerCompany) {
      message.error('Completá los campos obligatorios de la orden.');
      return;
    }

    const selectedProd = products.find((p) => p.id === newOrder.productId) || products[0];
    const tons = Number(newOrder.tons) || 30;
    const price = Number(newOrder.pricePerTon) || selectedProd.pricePerTon;

    onGenerateOrder({
      ...newOrder,
      productTitle: selectedProd.title,
      category: selectedProd.category,
      tons,
      pricePerTon: price,
      totalAmount: tons * price,
      currency: 'ARS',
      vendorId: activeProfile.id,
      vendorName: activeProfile.company,
    });

    setIsOrderModalOpen(false);
    message.success('Orden de Compra B2B generada y registrada con Blockchain.');
  };

  const handleCopyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Hash copiado al portapapeles.');
  };

  const columns: ColumnsType<Product> = [
    {
      title: 'Subproducto',
      dataIndex: 'title',
      key: 'title',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <img
            src={record.images[0]}
            alt={record.title}
            className="w-11 h-11 rounded-lg object-cover border border-gray-200 shrink-0"
          />
          <div className="max-w-xs">
            <span 
              onClick={() => onNavigate('product-detail', record.id)}
              className="font-bold text-gray-900 hover:text-[#176B4D] cursor-pointer text-xs block truncate"
            >
              {record.title}
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              Lote: {record.traceabilityLotCode}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Categoría',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => <Tag color="cyan" className="font-semibold text-xs">{cat}</Tag>,
    },
    {
      title: 'Precio / Tn',
      dataIndex: 'pricePerTon',
      key: 'pricePerTon',
      sorter: (a, b) => a.pricePerTon - b.pricePerTon,
      render: (price) => (
        <div>
          <span className="font-extrabold text-[#176B4D] text-xs">
            ${price.toLocaleString('es-AR')}
          </span>
          <span className="text-[10px] text-gray-400 block font-normal">ARS / Tn</span>
        </div>
      ),
    },
    {
      title: 'Stock (Tn)',
      dataIndex: 'availableTons',
      key: 'availableTons',
      sorter: (a, b) => a.availableTons - b.availableTons,
      render: (tons) => (
        <span className="font-bold text-gray-800 text-xs">
          {tons.toLocaleString('es-AR')} Tn
        </span>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        if (status === 'active') return <Tag color="success" className="font-semibold">Activo</Tag>;
        if (status === 'paused') return <Tag color="warning" className="font-semibold">Pausado</Tag>;
        return <Tag color="default">Agotado</Tag>;
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            type="text"
            icon={<EyeOutlined />}
            onClick={() => onNavigate('product-detail', record.id)}
            title="Ver publicación"
          />
          <Button
            size="small"
            type="text"
            icon={<EditOutlined />}
            onClick={() => setEditingProduct(record)}
            className="text-blue-600"
            title="Modificar producto"
          />
          <Button
            size="small"
            type="text"
            icon={record.status === 'active' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => handleToggleStatus(record)}
            className={record.status === 'active' ? 'text-amber-600' : 'text-emerald-600'}
            title={record.status === 'active' ? 'Pausar' : 'Activar'}
          />
          <Popconfirm
            title="¿Eliminar esta publicación?"
            description="Esta acción retirará el lote del marketplace."
            onConfirm={() => handleDelete(record.id)}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              title="Borrar producto"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <Space size="small">
            <Tag color={activeProfile.role === 'vendor' ? 'success' : 'processing'} className="font-semibold text-xs">
              {activeProfile.role === 'vendor' ? 'Panel Vendedor B2B' : 'Panel Comprador & Contratos'}
            </Tag>
            <span className="font-bold text-gray-800 text-xs">{activeProfile.company}</span>
            <span className="text-xs text-gray-400 font-mono">• CUIT: {activeProfile.cuit}</span>
          </Space>
          <Title level={3} className="!m-0 !text-gray-900 !font-extrabold tracking-tight mt-1">
            {activeProfile.role === 'vendor' ? 'Gestión de Subproductos & Blockchain' : 'Mis Compras & Contratos Inteligentes'}
          </Title>
          <Text className="text-xs text-gray-500">
            {activeProfile.role === 'vendor'
              ? 'Administrá lotes, modificá precios, publicá estimativos futuros y emití órdenes de compra con sello blockchain.'
              : 'Consultá tus órdenes de compra, contratos blockchain firmados y trazabilidad inmutable.'}
          </Text>
        </div>

        <Space wrap>
          {activeProfile.role === 'vendor' && (
            <>
              <Button
                icon={<CalendarOutlined />}
                onClick={() => setIsForecastModalOpen(true)}
                className="font-semibold"
              >
                + Publicar Estimativo
              </Button>

              <Button
                icon={<SafetyCertificateFilled className="text-emerald-700" />}
                onClick={() => setIsOrderModalOpen(true)}
                className="font-semibold border-emerald-500 text-emerald-800 hover:text-emerald-900"
              >
                Generar Orden Blockchain
              </Button>

              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                onClick={() => onNavigate('publish-product')}
                className="!bg-[#176B4D] hover:!bg-[#12553c] font-semibold"
              >
                Publicar Nuevo Lote
              </Button>
            </>
          )}

          <Button
            icon={<InboxOutlined />}
            onClick={() => onNavigate('requests')}
            className="font-semibold"
          >
            Negociaciones ({pendingRequestsCount})
          </Button>
        </Space>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <Card className="!rounded-xl !border-gray-200 shadow-xs" bodyStyle={{ padding: '16px' }}>
            <Statistic
              title="Lotes Publicados"
              value={products.length}
              suffix={`(${activeProducts.length} activos)`}
              prefix={<AppstoreOutlined className="text-[#176B4D] text-lg mr-1.5" />}
              valueStyle={{ fontSize: '1.25rem', fontWeight: 800 }}
            />
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card className="!rounded-xl !border-gray-200 shadow-xs" bodyStyle={{ padding: '16px' }}>
            <Statistic
              title="Estimativos Publicados"
              value={forecasts.length}
              suffix="zafras"
              prefix={<CalendarOutlined className="text-amber-600 text-lg mr-1.5" />}
              valueStyle={{ fontSize: '1.25rem', fontWeight: 800 }}
            />
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card className="!rounded-xl !border-gray-200 shadow-xs" bodyStyle={{ padding: '16px' }}>
            <Statistic
              title="Órdenes con Blockchain"
              value={orders.length}
              suffix="selladas"
              prefix={<SafetyCertificateFilled className="text-emerald-600 text-lg mr-1.5" />}
              valueStyle={{ fontSize: '1.25rem', fontWeight: 800, color: '#176B4D' }}
            />
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card className="!rounded-xl !border-gray-200 shadow-xs" bodyStyle={{ padding: '16px' }}>
            <Statistic
              title="Solicitudes Pendientes"
              value={pendingRequestsCount}
              prefix={<ClockCircleFilled className="text-amber-500 text-lg mr-1.5" />}
              valueStyle={{ fontSize: '1.25rem', fontWeight: 800 }}
            />
          </Card>
        </Col>
      </Row>

      {/* TABS SWITCHER: INVENTARIO vs ESTIMATIVOS vs ÓRDENES BLOCKCHAIN */}
      <div className="bg-white p-2.5 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <Segmented
          value={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          size="middle"
          options={[
            {
              label: (
                <div className="flex items-center gap-2 px-2 py-1 font-semibold">
                  <AppstoreOutlined />
                  <span>Inventario de Lotes ({products.length})</span>
                </div>
              ),
              value: 'inventory',
            },
            {
              label: (
                <div className="flex items-center gap-2 px-2 py-1 font-semibold">
                  <CalendarOutlined className="text-amber-600" />
                  <span>Estimativos de Producción ({forecasts.length})</span>
                </div>
              ),
              value: 'forecasts',
            },
            {
              label: (
                <div className="flex items-center gap-2 px-2 py-1 font-semibold">
                  <SafetyCertificateFilled className="text-emerald-700" />
                  <span>Órdenes Blockchain ({orders.length})</span>
                </div>
              ),
              value: 'orders',
            },
          ]}
        />

        <div className="text-xs text-gray-500">
          {activeTab === 'inventory' && 'Modificá precios, pausá o borrá publicaciones.'}
          {activeTab === 'forecasts' && 'Publicá estimativos de zafra y cosecha para pre-ventas.'}
          {activeTab === 'orders' && 'Emisión y registro inmutable en Blockchain con firma digital.'}
        </div>
      </div>

      {/* TAB 1: INVENTORY TABLE */}
      {activeTab === 'inventory' && (
        <Card className="!rounded-xl !border-gray-200 shadow-xs overflow-hidden" bodyStyle={{ padding: 0 }}>
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Input
                prefix={<SearchOutlined className="text-gray-400" />}
                placeholder="Filtrar por subproducto o localidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
                size="small"
              />
            </div>

            <Segmented
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as string)}
              size="small"
              options={[
                { label: 'Todos', value: 'all' },
                { label: 'Activos', value: 'active' },
                { label: 'Pausados', value: 'paused' },
              ]}
            />
          </div>

          <Table
            columns={columns}
            dataSource={filteredProducts}
            rowKey="id"
            pagination={{ pageSize: 6, size: 'small' }}
            scroll={{ x: 750 }}
          />
        </Card>
      )}

      {/* TAB 2: ESTIMATIVOS DE PRODUCTOS (FORECASTS) */}
      {activeTab === 'forecasts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/70 border border-amber-200/80 p-4 rounded-xl">
            <div>
              <h4 className="font-bold text-sm text-amber-950 m-0">
                Estimativos y Proyecciones de Producción Futura
              </h4>
              <p className="text-xs text-amber-800 m-0 mt-0.5">
                Declaración de zafras, podas y cosechas futuras. Permite a los compradores pre-reservar volumen y acordar contratos anticipados.
              </p>
            </div>
            {activeProfile.role === 'vendor' && (
              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                onClick={() => setIsForecastModalOpen(true)}
                className="!bg-[#176B4D] font-bold"
              >
                + Publicar Nuevo Estimativo
              </Button>
            )}
          </div>

          <Row gutter={[16, 16]}>
            {forecasts.map((fc) => (
              <Col xs={24} md={12} key={fc.id}>
                <Card className="!rounded-xl !border-gray-200 bg-white" bodyStyle={{ padding: '20px' }}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Tag color="orange" className="font-semibold text-xs">{fc.category}</Tag>
                      <Tag color="blue" className="font-bold text-[11px]">{fc.status}</Tag>
                    </div>

                    <div>
                      <h4 className="font-bold text-base text-gray-900 m-0">{fc.title}</h4>
                      <span className="text-xs text-gray-500 block mt-0.5">
                        {fc.city}, {fc.province} • {fc.vendorName}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 m-0 leading-relaxed">
                      {fc.notes}
                    </p>

                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 block">ESTIMATIVO VOLUMEN:</span>
                        <span className="font-extrabold text-gray-900">{fc.estimatedTons.toLocaleString('es-AR')} Tn</span>
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

                    {activeProfile.role === 'vendor' && onDeleteForecast && (
                      <div className="pt-1 flex justify-end">
                        <Popconfirm
                          title="¿Eliminar este estimativo?"
                          onConfirm={() => onDeleteForecast(fc.id)}
                          okText="Eliminar"
                          cancelText="Cancelar"
                          okButtonProps={{ danger: true }}
                        >
                          <Button size="small" type="text" danger icon={<DeleteOutlined />}>
                            Eliminar estimativo
                          </Button>
                        </Popconfirm>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* TAB 3: ÓRDENES DE COMPRA & BLOCKCHAIN */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-xl">
            <div>
              <div className="flex items-center gap-2">
                <SafetyCertificateFilled className="text-emerald-700 text-base" />
                <h4 className="font-bold text-sm text-emerald-950 m-0">
                  Registro Inmutable de Órdenes en Blockchain (NEA Ledger)
                </h4>
              </div>
              <p className="text-xs text-emerald-800 m-0 mt-0.5">
                Contratos y órdenes B2B selladas criptográficamente. Incluyen hash SHA-256, bloque y comentarios de conformidad del comprador.
              </p>
            </div>
            {activeProfile.role === 'vendor' && (
              <Button
                type="primary"
                icon={<ThunderboltFilled />}
                onClick={() => setIsOrderModalOpen(true)}
                className="!bg-[#176B4D] font-bold"
              >
                + Generar Orden Blockchain
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {orders.map((ord) => (
              <Card 
                key={ord.id} 
                className="!rounded-xl !border-gray-200 bg-white shadow-2xs hover:border-emerald-300 transition-colors"
                bodyStyle={{ padding: '20px' }}
              >
                <div className="space-y-3">
                  
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-gray-900 text-sm">
                        {ord.orderNumber}
                      </span>
                      <Tag color="cyan" className="font-semibold">{ord.category}</Tag>
                      <Tag 
                        color={ord.status === 'Firmada en Blockchain' ? 'success' : 'processing'}
                        className="font-bold"
                      >
                        {ord.status}
                      </Tag>
                    </div>

                    <div className="text-xs text-gray-500">
                      Fecha de emisión: {new Date(ord.createdAt).toLocaleDateString('es-AR')}
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block">SUBPRODUCTO:</span>
                      <span className="font-bold text-gray-900 block text-sm">{ord.productTitle}</span>
                      <span className="text-gray-500 mt-1 block">
                        Vendedor: <strong>{ord.vendorName}</strong>
                      </span>
                      <span className="text-gray-500 block">
                        Comprador: <strong>{ord.buyerCompany}</strong> ({ord.buyerName})
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 block">VOLUMEN & PRECIO:</span>
                      <span className="font-extrabold text-gray-900 text-sm block">
                        {ord.tons} Toneladas a ${ord.pricePerTon.toLocaleString('es-AR')}/Tn
                      </span>
                      <span className="text-emerald-700 font-extrabold text-base block mt-0.5">
                        Total: ${ord.totalAmount.toLocaleString('es-AR')} ARS
                      </span>
                      <span className="text-gray-400 text-[11px] block mt-0.5">
                        Logística: {ord.logistics}
                      </span>
                    </div>

                    {/* Blockchain Block Stamp */}
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 font-mono text-[11px] space-y-1.5">
                      <div className="flex justify-between items-center text-emerald-800 font-bold">
                        <span>BLOCK #{ord.blockNumber || '19842103'}</span>
                        <Tag color="success" className="m-0 text-[10px] font-sans">EIP-712</Tag>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-400 block">TX HASH:</span>
                        <div className="flex items-center justify-between text-gray-700 break-all text-[10px]">
                          <span className="truncate max-w-[180px]">{ord.blockchainHash}</span>
                          {ord.blockchainHash && (
                            <Button 
                              type="text" 
                              size="small" 
                              icon={<CopyOutlined />} 
                              onClick={() => handleCopyHash(ord.blockchainHash!)} 
                            />
                          )}
                        </div>
                      </div>

                      {ord.signedAt && (
                        <div className="text-[10px] text-gray-500">
                          Firmado: {new Date(ord.signedAt).toLocaleDateString('es-AR')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Buyer Comment minted in Blockchain */}
                  {ord.buyerComment && (
                    <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200/60 text-xs">
                      <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                        Registro del Comprador Grabado en Blockchain:
                      </span>
                      <p className="text-gray-800 m-0 italic mt-0.5 font-medium">
                        "{ord.buyerComment}"
                      </p>
                    </div>
                  )}

                  {/* Action for Buyer: Sign pending order */}
                  {ord.status !== 'Firmada en Blockchain' && activeProfile.role === 'buyer' && onOpenSignModal && (
                    <div className="pt-2 flex justify-end">
                      <Button
                        type="primary"
                        icon={<SafetyCertificateFilled />}
                        onClick={() => onOpenSignModal(ord)}
                        className="!bg-[#176B4D] hover:!bg-[#12553c] font-bold"
                      >
                        Firmar Digitalmente con Blockchain
                      </Button>
                    </div>
                  )}

                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: MODIFICAR PRODUCTO */}
      {editingProduct && (
        <Modal
          title={`Modificar Lote: ${editingProduct.title}`}
          open={!!editingProduct}
          onCancel={() => setEditingProduct(null)}
          onOk={handleSaveEdit}
          okText="Guardar Cambios"
          cancelText="Cancelar"
          okButtonProps={{ className: '!bg-[#176B4D]' }}
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Título del Lote:</label>
              <Input
                value={editingProduct.title}
                onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
              />
            </div>

            <Row gutter={12}>
              <Col span={12}>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Precio por Tonelada ($):</label>
                <InputNumber
                  min={1000}
                  step={500}
                  value={editingProduct.pricePerTon}
                  onChange={(val) => setEditingProduct({ ...editingProduct, pricePerTon: Number(val) || 0 })}
                  className="w-full"
                  addonBefore="$"
                  addonAfter="ARS"
                />
              </Col>
              <Col span={12}>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Stock Disponible (Tn):</label>
                <InputNumber
                  min={0}
                  value={editingProduct.availableTons}
                  onChange={(val) => setEditingProduct({ ...editingProduct, availableTons: Number(val) || 0 })}
                  className="w-full"
                  addonAfter="Tn"
                />
              </Col>
            </Row>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Estado de Publicación:</label>
              <Select
                value={editingProduct.status}
                onChange={(val) => setEditingProduct({ ...editingProduct, status: val })}
                className="w-full"
                options={[
                  { value: 'active', label: 'Activo (Visible en marketplace)' },
                  { value: 'paused', label: 'Pausado (Oculto temporalmente)' },
                  { value: 'sold_out', label: 'Agotado' },
                ]}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Descripción y Condiciones:</label>
              <TextArea
                rows={3}
                value={editingProduct.description}
                onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: PUBLICAR ESTIMATIVOS DE PRODUCTOS */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CalendarOutlined className="text-[#176B4D]" />
            <span>Publicar Estimativo de Producción Futura (Zafra / Cosecha)</span>
          </div>
        }
        open={isForecastModalOpen}
        onCancel={() => setIsForecastModalOpen(false)}
        onOk={handleCreateForecast}
        okText="Publicar Estimativo"
        cancelText="Cancelar"
        okButtonProps={{ className: '!bg-[#176B4D]' }}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Título de la Proyección *</label>
            <Input
              placeholder="Ej: Zafra Arrocera Verano 2027 - Cascarilla Seca"
              value={newForecast.title}
              onChange={(e) => setNewForecast({ ...newForecast, title: e.target.value })}
            />
          </div>

          <Row gutter={12}>
            <Col span={12}>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Categoría</label>
              <Select
                value={newForecast.category}
                onChange={(val) => setNewForecast({ ...newForecast, category: val })}
                className="w-full"
                options={[
                  { value: 'Cascarilla de arroz', label: 'Cascarilla de arroz' },
                  { value: 'Chips forestales', label: 'Chips forestales' },
                  { value: 'Aserrín y virutas', label: 'Aserrín y virutas' },
                  { value: 'Orujos y bagazos', label: 'Orujos y bagazos' },
                  { value: 'Biochar y cenizas', label: 'Biochar y cenizas' },
                ]}
              />
            </Col>
            <Col span={12}>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Volumen Estimado (Tn)</label>
              <InputNumber
                min={10}
                value={newForecast.estimatedTons}
                onChange={(val) => setNewForecast({ ...newForecast, estimatedTons: Number(val) || 100 })}
                className="w-full"
                addonAfter="Tn"
              />
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Fecha de Disponibilidad</label>
              <Input
                placeholder="Ej: 15 Diciembre 2026"
                value={newForecast.availableDate}
                onChange={(e) => setNewForecast({ ...newForecast, availableDate: e.target.value })}
              />
            </Col>
            <Col span={12}>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Precio Base Proyectado ($/Tn)</label>
              <InputNumber
                min={1000}
                step={500}
                value={newForecast.estimatedPricePerTon}
                onChange={(val) => setNewForecast({ ...newForecast, estimatedPricePerTon: Number(val) || 0 })}
                className="w-full"
                addonBefore="$"
              />
            </Col>
          </Row>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Notas de la Cosecha y Logística:</label>
            <TextArea
              rows={3}
              placeholder="Detallá el cronograma de molienda/corte, condiciones para retiro con batea o entrega programada..."
              value={newForecast.notes}
              onChange={(e) => setNewForecast({ ...newForecast, notes: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* MODAL 3: GENERAR ORDEN DE COMPRA CON BLOCKCHAIN */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <SafetyCertificateFilled className="text-[#176B4D]" />
            <span>Generar Orden de Compra con Blockchain (Smart Contract)</span>
          </div>
        }
        open={isOrderModalOpen}
        onCancel={() => setIsOrderModalOpen(false)}
        onOk={handleCreateBlockchainOrder}
        okText="Emitir y Sellar en Blockchain"
        cancelText="Cancelar"
        okButtonProps={{ className: '!bg-[#176B4D]' }}
      >
        <div className="space-y-4 pt-2">
          <Alert
            type="info"
            message={<span className="text-xs font-bold">Acuerdo Comercial Inmutable</span>}
            description={
              <span className="text-[11px] text-gray-600">
                La orden se emitirá bajo el protocolo criptográfico del NEA Ledger con hash SHA-256 generado para firma del comprador.
              </span>
            }
          />

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Subproducto a Vender *</label>
            <Select
              value={newOrder.productId}
              onChange={(val) => {
                const prod = products.find((p) => p.id === val);
                if (prod) {
                  setNewOrder({
                    ...newOrder,
                    productId: prod.id,
                    productTitle: prod.title,
                    category: prod.category,
                    pricePerTon: prod.pricePerTon,
                  });
                }
              }}
              className="w-full"
              options={products.map((p) => ({
                value: p.id,
                label: `${p.title} (${p.category}) - $${p.pricePerTon.toLocaleString('es-AR')}/Tn`,
              }))}
            />
          </div>

          <Row gutter={12}>
            <Col span={12}>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Empresa Compradora *</label>
              <Input
                value={newOrder.buyerCompany}
                onChange={(e) => setNewOrder({ ...newOrder, buyerCompany: e.target.value })}
                placeholder="Ej: Central Térmica San Alonso"
              />
            </Col>
            <Col span={12}>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Responsable de Compra</label>
              <Input
                value={newOrder.buyerName}
                onChange={(e) => setNewOrder({ ...newOrder, buyerName: e.target.value })}
                placeholder="Ej: Ing. Lucas Benítez"
              />
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Cantidad Acordada (Tn) *</label>
              <InputNumber
                min={5}
                value={newOrder.tons}
                onChange={(val) => setNewOrder({ ...newOrder, tons: Number(val) || 30 })}
                className="w-full"
                addonAfter="Tn"
              />
            </Col>
            <Col span={12}>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Precio Acordado ($/Tn) *</label>
              <InputNumber
                min={1000}
                step={500}
                value={newOrder.pricePerTon}
                onChange={(val) => setNewOrder({ ...newOrder, pricePerTon: Number(val) || 0 })}
                className="w-full"
                addonBefore="$"
              />
            </Col>
          </Row>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Condición Logística y Destino:</label>
            <Input
              value={newOrder.logistics}
              onChange={(e) => setNewOrder({ ...newOrder, logistics: e.target.value })}
              placeholder="Ej: Retiro por cuenta del comprador en batea"
            />
          </div>
        </div>
      </Modal>

    </div>
  );
};
