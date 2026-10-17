import React from 'react';
import { Typography, Space, Row, Col, Divider, Tag, Button } from 'antd';
import { 
  EnvironmentOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  SafetyCertificateOutlined, 
  ArrowRightOutlined,
  CheckCircleFilled,
  SyncOutlined
} from '@ant-design/icons';
import { AppView, MaterialCategory } from '../types';

const { Title, Text, Link } = Typography;

interface FooterProps {
  onNavigate: (view: AppView) => void;
  onFilterCategory?: (category: MaterialCategory) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onFilterCategory }) => {
  return (
    <footer className="bg-[#111827] text-gray-300 border-t border-gray-800">
      {/* Upper Fusion Ribbon */}
      <div className="bg-[#176B4D] text-white py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="text-base sm:text-lg font-bold flex items-center justify-center md:justify-start gap-2">
              <SyncOutlined spin className="text-emerald-300" />
              <span>Bioeconomía Circular del Nordeste Argentino</span>
            </div>
            <p className="text-emerald-100 text-xs sm:text-sm m-0">
              Conectamos generadores y compradores de subproductos agroindustriales para certificar valorización y sustentabilidad.
            </p>
          </div>
          <Button
            type="default"
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={() => onNavigate('publish-product')}
            className="!font-bold !text-[#176B4D] !bg-white hover:!bg-emerald-50 !border-none"
          >
            Publicar mi Lote Hoy
          </Button>
        </div>
      </div>

      {/* Main Footer Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Row gutter={[32, 32]}>
          
          {/* Brand Info */}
          <Col xs={24} md={10} lg={8}>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#176B4D] flex items-center justify-center text-white font-black text-sm">
                  sM
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline leading-none">
                    <span className="font-light text-lg text-gray-200">sub</span>
                    <span className="font-extrabold text-lg text-emerald-400">Market</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">Lo que sobra, vale.</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
                subMarket: Marketplace B2B para comercializar y revalorizar subproductos agroindustriales del Nordeste Argentino.
              </p>
              <div className="space-y-1.5 text-xs text-gray-400 pt-1">
                <div className="flex items-center gap-2">
                  <EnvironmentOutlined className="text-emerald-400" />
                  <span>Sede Operativa: Parque Tecnológico NEA • Corrientes / Posadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <MailOutlined className="text-emerald-400" />
                  <span>contacto@submarket.com.ar</span>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneOutlined className="text-emerald-400" />
                  <span>0800-888-SUBMARKET / +54 379 440-9200</span>
                </div>
              </div>
            </div>
          </Col>

          {/* Subproductos */}
          <Col xs={12} sm={8} lg={5}>
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Subproductos Clave
            </div>
            <ul className="space-y-2 text-xs text-gray-400 list-none p-0 m-0">
              <li>
                <span 
                  onClick={() => { onFilterCategory?.('Cascarilla de arroz'); onNavigate('marketplace'); }}
                  className="hover:text-emerald-400 cursor-pointer transition-colors"
                >
                  Cascarilla de arroz seca
                </span>
              </li>
              <li>
                <span 
                  onClick={() => { onFilterCategory?.('Chips forestales'); onNavigate('marketplace'); }}
                  className="hover:text-emerald-400 cursor-pointer transition-colors"
                >
                  Chips y astillas forestales
                </span>
              </li>
              <li>
                <span 
                  onClick={() => { onFilterCategory?.('Aserrín y virutas'); onNavigate('marketplace'); }}
                  className="hover:text-emerald-400 cursor-pointer transition-colors"
                >
                  Aserrín y virutas de pino
                </span>
              </li>
              <li>
                <span 
                  onClick={() => { onFilterCategory?.('Biochar y cenizas'); onNavigate('marketplace'); }}
                  className="hover:text-emerald-400 cursor-pointer transition-colors"
                >
                  Biochar y enmiendas de suelo
                </span>
              </li>
              <li>
                <span 
                  onClick={() => { onFilterCategory?.('Orujos y bagazos'); onNavigate('marketplace'); }}
                  className="hover:text-emerald-400 cursor-pointer transition-colors"
                >
                  Bagazo cítrico deshidratado
                </span>
              </li>
            </ul>
          </Col>

          {/* Cuencas Regionales */}
          <Col xs={12} sm={8} lg={5}>
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Cuencas Productivas
            </div>
            <div className="space-y-2 text-xs text-gray-400">
              <div>
                <span className="text-gray-200 font-semibold block">Corrientes:</span>
                <span>Mercedes, Virasoro, Bella Vista, Libres</span>
              </div>
              <div>
                <span className="text-gray-200 font-semibold block">Misiones:</span>
                <span>Eldorado, Oberá, Montecarlo, Posadas</span>
              </div>
              <div>
                <span className="text-gray-200 font-semibold block">Chaco:</span>
                <span>Sáenz Peña, Charata, Machagai</span>
              </div>
            </div>
          </Col>

          {/* Trazabilidad & Garantía */}
          <Col xs={24} sm={8} lg={6}>
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Seguridad Operativa
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded bg-gray-800/80 border border-gray-700/80">
                <div className="flex items-center gap-1.5 font-semibold text-white text-xs">
                  <SafetyCertificateOutlined className="text-emerald-400" />
                  <span>Trazabilidad Auditada</span>
                </div>
                <p className="text-[11px] text-gray-400 m-0 mt-0.5">
                  Protocolo digital de cadena de custodia y control de pesaje en báscula.
                </p>
              </div>
              <div className="p-2.5 rounded bg-gray-800/80 border border-gray-700/80">
                <div className="flex items-center gap-1.5 font-semibold text-white text-xs">
                  <CheckCircleFilled className="text-emerald-400" />
                  <span>Ensayos INTI / Laboratorio</span>
                </div>
                <p className="text-[11px] text-gray-400 m-0 mt-0.5">
                  Reportes de humedad, poder calorífico y densidad aparente declarados.
                </p>
              </div>
            </div>
          </Col>

        </Row>

        <Divider className="!border-gray-800 !my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
          <span>© 2026 ReValor NEA • Red Agroindustrial del Nordeste Argentino. Todos los derechos reservados.</span>
          <Space split={<span className="text-gray-700">•</span>}>
            <span className="hover:text-gray-400 cursor-pointer">Condiciones B2B</span>
            <span className="hover:text-gray-400 cursor-pointer">Protocolos de Pesaje</span>
            <span className="hover:text-gray-400 cursor-pointer">Política de Privacidad</span>
          </Space>
        </div>
      </div>
    </footer>
  );
};
