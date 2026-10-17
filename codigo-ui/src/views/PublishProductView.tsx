import React, { useState } from 'react';
import { 
  Steps, 
  Card, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Checkbox, 
  Button, 
  Row, 
  Col, 
  Typography, 
  Result, 
  Tag, 
  Space, 
  Divider 
} from 'antd';
import { 
  PlusCircleOutlined, 
  UploadOutlined, 
  CheckCircleFilled, 
  ArrowLeftOutlined, 
  ArrowRightOutlined,
  EnvironmentOutlined,
  ExperimentOutlined,
  FileDoneOutlined,
  AppstoreOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { Product, MaterialCategory, Province, PackagingType, AppView } from '../types';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

interface PublishProductViewProps {
  onPublish: (newProduct: Product) => void;
  onNavigate: (view: AppView, productId?: string) => void;
}

export const PublishProductView: React.FC<PublishProductViewProps> = ({
  onPublish,
  onNavigate,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MaterialCategory>('Cascarilla de arroz');
  const [description, setDescription] = useState('');
  const [pricePerTon, setPricePerTon] = useState<number>(32000);
  const [availableTons, setAvailableTons] = useState<number>(350);
  const [unit, setUnit] = useState<'Toneladas' | 'm³' | 'Big Bags'>('Toneladas');
  const [minOrderTons, setMinOrderTons] = useState<number>(25);
  const [generationFrequency, setGenerationFrequency] = useState<'Lote único' | 'Mensual continuo' | 'Semanal'>('Mensual continuo');
  
  // Location
  const [province, setProvince] = useState<Province>('Corrientes');
  const [city, setCity] = useState('Mercedes');
  const [loadingPlantAddress, setLoadingPlantAddress] = useState('Ruta Nacional 119 Km 92');
  const [hasWeighbridge, setHasWeighbridge] = useState(true);
  const [maxTruckCapacityPerDay, setMaxTruckCapacityPerDay] = useState(6);

  // Technical Specs
  const [moisturePercentage, setMoisturePercentage] = useState<number>(11.5);
  const [calorificPowerKcalKg, setCalorificPowerKcalKg] = useState<number>(3700);
  const [granulometry, setGranulometry] = useState('G30 estandarizado (10 a 30 mm)');
  const [ashContentPercentage, setAshContentPercentage] = useState<number>(1.5);
  const [apparentDensityKgM3, setApparentDensityKgM3] = useState<number>(150);
  const [packaging, setPackaging] = useState<PackagingType>('A granel (batea)');
  const [labCertificateAvailable, setLabCertificateAvailable] = useState(true);

  // Sample Photos
  const sampleImages = [
    { label: 'Cascarilla Arroz', url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1000&q=80' },
    { label: 'Chips Forestales', url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1000&q=80' },
    { label: 'Aserrín de Pino', url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1000&q=80' },
    { label: 'Virutas de Madera', url: 'https://images.unsplash.com/photo-1520052205864-92d242b3a76b?auto=format&fit=crop&w=1000&q=80' },
    { label: 'Bagazo Cítrico', url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1000&q=80' },
    { label: 'Biochar / Carbón', url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1000&q=80' },
  ];
  const [selectedImage, setSelectedImage] = useState(sampleImages[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [published, setPublished] = useState(false);

  const handleFinish = () => {
    const finalImage = customImageUrl.trim() || selectedImage;
    const newLotCode = `LOT-NEA-${Date.now().toString().slice(-4)}`;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      title: title || `${category} - Lote Calificado ${city}`,
      category,
      description: description || `Lote de ${category} disponible en ${city}, ${province}. Material controlado para uso agroindustrial o energético.`,
      pricePerTon,
      currency: 'ARS',
      availableTons,
      minOrderTons,
      generationFrequency,
      province,
      city,
      loadingPlantAddress,
      hasWeighbridge,
      maxTruckCapacityPerDay,
      specs: {
        moisturePercentage,
        calorificPowerKcalKg: calorificPowerKcalKg || undefined,
        granulometry,
        ashContentPercentage,
        apparentDensityKgM3,
        contaminantsFree: true,
        packaging,
        labCertificateAvailable,
      },
      vendor: {
        id: 'ven-1',
        name: 'Molinos del Iberá S.A.',
        businessName: 'Molinos del Iberá S.A.',
        cuit: '30-71189423-4',
        rating: 4.9,
        reviewCount: 38,
        completedDeals: 114,
        location: `${city}, ${province}`,
        province,
        verified: true,
        joinedYear: 2021,
        phone: '+54 3773 42-8810',
        email: 'comercial@molinosdelibera.com.ar',
        badge: 'Generador Certificado A+',
      },
      images: [finalImage],
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      traceabilityLotCode: newLotCode,
      traceabilityEvents: [
        {
          id: `tr-${Date.now()}-1`,
          stage: 'Generación / Cosecha',
          title: `Acopio inicial de ${category}`,
          date: 'Reciente',
          location: `${city}, ${province}`,
          actor: 'Molinos del Iberá S.A.',
          verified: true,
          notes: 'Registro de acopio inicial bajo silo y control preliminar de humedad.',
          badge: 'Origen Verificado',
        },
        {
          id: `tr-${Date.now()}-2`,
          stage: 'Muestreo de Calidad',
          title: 'Determinación de Humedad y Granulometría',
          date: 'Hoy',
          location: 'Laboratorio de Control Interno',
          actor: 'Departamento Técnico',
          verified: true,
          notes: `Humedad verificada al ${moisturePercentage}%, apto para despacho inmediato.`,
          badge: 'Ficha Aprobada',
        }
      ],
      featured: false,
    };

    onPublish(newProduct);
    setPublished(true);
  };

  if (published) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card className="!rounded-2xl !border-gray-200 shadow-sm text-center">
          <Result
            status="success"
            title="¡Subproducto publicado con éxito!"
            subTitle="El lote ya se encuentra visible en el marketplace de ReValor NEA con código de trazabilidad único generado."
            extra={[
              <Button
                type="primary"
                key="catalog"
                onClick={() => onNavigate('marketplace')}
                className="!bg-[#176B4D] hover:!bg-[#12553c]"
              >
                Ver en el Catálogo
              </Button>,
              <Button
                key="dashboard"
                onClick={() => onNavigate('vendor-dashboard')}
              >
                Ir a mi Panel de Control
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  const stepItems = [
    { title: 'Material', icon: <AppstoreOutlined /> },
    { title: 'Volumen & Precio', icon: <span className="font-bold">⚖️</span> },
    { title: 'Logística', icon: <EnvironmentOutlined /> },
    { title: 'Ficha Técnica', icon: <ExperimentOutlined /> },
    { title: 'Fotos & Confirmación', icon: <UploadOutlined /> },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Title */}
      <div className="pb-3 border-b border-gray-200">
        <Tag color="success" className="font-bold text-xs">Publicación de Lotes NEA</Tag>
        <Title level={3} className="!m-0 !text-gray-900 !font-extrabold tracking-tight mt-1">
          Publicar Nuevo Subproducto Agroindustrial
        </Title>
        <Text className="text-xs text-gray-500">
          Ingresá los parámetros de tu lote para conectar directamente con compradores del Nordeste Argentino.
        </Text>
      </div>

      {/* Fusion Steps Wizard */}
      <Card className="!rounded-xl !border-gray-200 shadow-xs" bodyStyle={{ padding: '16px 24px' }}>
        <Steps
          current={currentStep}
          onChange={(step) => setCurrentStep(step)}
          items={stepItems}
          size="small"
        />
      </Card>

      {/* Main Step Form Card */}
      <Card className="!rounded-xl !border-gray-200 shadow-sm" bodyStyle={{ padding: '24px' }}>
        
        {/* Step 0: Identificación */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">
              Paso 1: Identificación del Subproducto
            </div>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Familia de Subproducto *
                </label>
                <Select
                  value={category}
                  onChange={(val) => {
                    const cat = val as MaterialCategory;
                    setCategory(cat);
                    const found = sampleImages.find(s => s.label.toLowerCase().includes(cat.split(' ')[0].toLowerCase()));
                    if (found) setSelectedImage(found.url);
                  }}
                  className="w-full"
                  size="large"
                  options={[
                    { value: 'Cascarilla de arroz', label: 'Cascarilla de arroz' },
                    { value: 'Chips forestales', label: 'Chips forestales (Pino / Eucalipto)' },
                    { value: 'Aserrín y virutas', label: 'Aserrín y virutas secadas' },
                    { value: 'Orujos y bagazos', label: 'Orujos y bagazos cítricos/caña' },
                    { value: 'Biochar y cenizas', label: 'Biochar y carbón vegetal' },
                  ]}
                />
              </Col>

              <Col xs={24} sm={12}>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Título Comercial de la Oferta *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Cascarilla de arroz a granel descascarado reciente"
                  size="large"
                />
              </Col>

              <Col span={24}>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Descripción del Material y Proceso *
                </label>
                <TextArea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detallá el proceso industrial de origen, estado de conservación bajo silo, usos recomendados (camas de cría, abono, combustión en calderas)..."
                />
              </Col>
            </Row>
          </div>
        )}

        {/* Step 1: Volúmenes y Precio */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">
              Paso 2: Volumen y Condiciones Comerciales
            </div>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Cantidad Disponible *
                </label>
                <InputNumber
                  min={1}
                  value={availableTons}
                  onChange={(val) => setAvailableTons(val || 1)}
                  className="w-full font-bold"
                  size="large"
                  addonAfter={unit}
                />
              </Col>

              <Col xs={24} sm={8}>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Unidad de Medida
                </label>
                <Select
                  value={unit}
                  onChange={(val) => setUnit(val as any)}
                  className="w-full"
                  size="large"
                  options={[
                    { value: 'Toneladas', label: 'Toneladas (Tn)' },
                    { value: 'm³', label: 'Metros Cúbicos (m³)' },
                    { value: 'Big Bags', label: 'Big Bags (1.000 kg)' },
                  ]}
                />
              </Col>

              <Col xs={24} sm={8}>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Precio Sugerido por {unit.slice(0, -1)} ($ ARS) *
                </label>
                <InputNumber
                  step={500}
                  value={pricePerTon}
                  onChange={(val) => setPricePerTon(val || 0)}
                  className="w-full font-bold !text-[#176B4D]"
                  size="large"
                  addonBefore="$"
                  addonAfter={`/${unit === 'Toneladas' ? 'Tn' : unit}`}
                />
              </Col>

              <Col xs={24} sm={8}>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Pedido Mínimo (MOQ)
                </label>
                <InputNumber
                  min={1}
                  value={minOrderTons}
                  onChange={(val) => setMinOrderTons(val || 1)}
                  className="w-full"
                  size="middle"
                  addonAfter="Tn"
                />
                <span className="text-[10px] text-gray-400">1 batea estándar ~ 28 a 30 Tn</span>
              </Col>

              <Col xs={24} sm={8}>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Frecuencia de Generación
                </label>
                <Select
                  value={generationFrequency}
                  onChange={(val) => setGenerationFrequency(val as any)}
                  className="w-full"
                  size="middle"
                  options={[
                    { value: 'Mensual continuo', label: 'Mensual continuo' },
                    { value: 'Lote único', label: 'Lote único acopiado' },
                    { value: 'Semanal', label: 'Semanal' },
                  ]}
                />
              </Col>

              <Col xs={24} sm={8}>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Presentación de Despacho
                </label>
                <Select
                  value={packaging}
                  onChange={(val) => setPackaging(val as PackagingType)}
                  className="w-full"
                  size="middle"
                  options={[
                    { value: 'A granel (batea)', label: 'A granel (batea volcable)' },
                    { value: 'Big Bags (1.000 kg)', label: 'Big Bags (1.000 kg)' },
                    { value: 'Bolsas (25-50 kg)', label: 'Bolsas (25-50 kg)' },
                    { value: 'En silo de carga directa', label: 'En silo de carga directa' },
                  ]}
                />
              </Col>
            </Row>
          </div>
        )}

        {/* Step 2: Ubicación y Logística */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">
              Paso 3: Ubicación y Capacidad de Carga en Planta
            </div>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Provincia del NEA *
                </label>
                <Select
                  value={province}
                  onChange={(val) => setProvince(val as Province)}
                  className="w-full"
                  size="middle"
                  options={[
                    { value: 'Corrientes', label: 'Corrientes' },
                    { value: 'Chaco', label: 'Chaco' },
                    { value: 'Misiones', label: 'Misiones' },
                    { value: 'Formosa', label: 'Formosa' },
                  ]}
                />
              </Col>

              <Col xs={24} sm={8}>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Localidad / Municipio *
                </label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej: Mercedes, Virasoro, Oberá"
                  size="middle"
                />
              </Col>

              <Col xs={24} sm={8}>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Dirección o Ruta de Planta
                </label>
                <Input
                  value={loadingPlantAddress}
                  onChange={(e) => setLoadingPlantAddress(e.target.value)}
                  placeholder="Ej: Ruta 123 Km 104"
                  size="middle"
                />
              </Col>

              <Col span={24}>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                  <Checkbox
                    checked={hasWeighbridge}
                    onChange={(e) => setHasWeighbridge(e.target.checked)}
                    className="font-semibold text-xs text-gray-800"
                  >
                    La planta cuenta con báscula electrónica para pesaje oficial (emite ticket oficial)
                  </Checkbox>
                </div>
              </Col>

              <Col xs={24} sm={12}>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Capacidad de carga máxima por día (camiones/día)
                </label>
                <InputNumber
                  min={1}
                  value={maxTruckCapacityPerDay}
                  onChange={(val) => setMaxTruckCapacityPerDay(val || 1)}
                  className="w-full"
                  addonAfter="camiones / día"
                />
              </Col>
            </Row>
          </div>
        )}

        {/* Step 3: Ficha Técnica */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">
              Paso 4: Parámetros Técnicos Certificados
            </div>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Humedad Declarada (%) *
                </label>
                <InputNumber
                  step={0.1}
                  value={moisturePercentage}
                  onChange={(val) => setMoisturePercentage(val || 0)}
                  className="w-full font-bold"
                  size="middle"
                  addonAfter="%"
                />
              </Col>

              <Col xs={24} sm={8}>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Poder Calorífico Inferior (PCI)
                </label>
                <InputNumber
                  step={50}
                  value={calorificPowerKcalKg}
                  onChange={(val) => setCalorificPowerKcalKg(val || 0)}
                  className="w-full"
                  size="middle"
                  addonAfter="kcal/kg"
                />
              </Col>

              <Col xs={24} sm={8}>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Granulometría
                </label>
                <Input
                  value={granulometry}
                  onChange={(e) => setGranulometry(e.target.value)}
                  placeholder="Ej: G30 (10 a 30 mm), Fino"
                  size="middle"
                />
              </Col>

              <Col xs={24} sm={8}>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Densidad Aparente (kg/m³)
                </label>
                <InputNumber
                  value={apparentDensityKgM3}
                  onChange={(val) => setApparentDensityKgM3(val || 0)}
                  className="w-full"
                  size="middle"
                  addonAfter="kg/m³"
                />
              </Col>

              <Col xs={24} sm={8}>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Contenido de Cenizas (%)
                </label>
                <InputNumber
                  step={0.1}
                  value={ashContentPercentage}
                  onChange={(val) => setAshContentPercentage(val || 0)}
                  className="w-full"
                  size="middle"
                  addonAfter="%"
                />
              </Col>

              <Col span={24}>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Checkbox
                    checked={labCertificateAvailable}
                    onChange={(e) => setLabCertificateAvailable(e.target.checked)}
                    className="font-semibold text-xs text-gray-800"
                  >
                    Dispone de informe de ensayo bromatológico o laboratorio INTI/FSC disponible
                  </Checkbox>
                </div>
              </Col>
            </Row>
          </div>
        )}

        {/* Step 4: Fotografía & Confirmación */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">
              Paso 5: Fotografía del Material y Confirmación
            </div>

            <div className="text-xs text-gray-500">
              Seleccioná una imagen de muestra para tu material o pegá el enlace a una foto real de acopio:
            </div>

            <Row gutter={[12, 12]}>
              {sampleImages.map((s) => (
                <Col xs={12} sm={8} md={4} key={s.label}>
                  <div
                    onClick={() => {
                      setSelectedImage(s.url);
                      setCustomImageUrl('');
                    }}
                    className={`cursor-pointer rounded-lg overflow-hidden border-2 p-1 transition-all text-center ${
                      selectedImage === s.url && !customImageUrl
                        ? 'border-[#176B4D] ring-2 ring-emerald-200 bg-emerald-50/40'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="aspect-square rounded overflow-hidden mb-1">
                      <img src={s.url} alt={s.label} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 block truncate">{s.label}</span>
                  </div>
                </Col>
              ))}
            </Row>

            <div className="pt-2">
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                O ingresá una URL directa de imagen:
              </label>
              <Input
                placeholder="https://..."
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
              />
            </div>

            {/* Preview Box */}
            <div className="p-3 bg-[#f8fafc] rounded-lg border border-gray-200 flex items-center justify-between text-xs">
              <Space size="middle">
                <img
                  src={customImageUrl.trim() || selectedImage}
                  alt="Preview"
                  className="w-14 h-12 rounded object-cover border border-gray-200"
                />
                <div>
                  <div className="font-bold text-gray-900">{title || `${category} - Lote ${city}`}</div>
                  <div className="text-gray-500 text-[11px]">{availableTons} Tn • ${pricePerTon.toLocaleString('es-AR')}/Tn • {city}, {province}</div>
                </div>
              </Space>
              <Tag color="success">Listo para publicar</Tag>
            </div>
          </div>
        )}

        <Divider className="!my-5" />

        {/* Wizard Controls */}
        <div className="flex items-center justify-between">
          <Button
            disabled={currentStep === 0}
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            icon={<ArrowLeftOutlined />}
          >
            Anterior
          </Button>

          {currentStep < 4 ? (
            <Button
              type="primary"
              onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
              className="!bg-[#176B4D] hover:!bg-[#12553c]"
            >
              <span>Siguiente</span>
              <ArrowRightOutlined />
            </Button>
          ) : (
            <Button
              type="primary"
              size="large"
              icon={<PlusCircleOutlined />}
              onClick={handleFinish}
              className="!bg-[#176B4D] hover:!bg-[#12553c] font-bold"
            >
              Publicar Lote Ahora
            </Button>
          )}
        </div>

      </Card>

    </div>
  );
};
