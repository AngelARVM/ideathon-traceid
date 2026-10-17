import React from 'react';
import { Card, Timeline, Tag, Typography, Button, Space } from 'antd';
import { 
  SafetyCertificateOutlined, 
  CheckCircleFilled, 
  QrcodeOutlined, 
  EnvironmentOutlined, 
  CalendarOutlined, 
  UserOutlined, 
  FileDoneOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { TraceabilityEvent } from '../types';

const { Title, Text } = Typography;

interface TraceabilityTimelineProps {
  lotCode: string;
  events: TraceabilityEvent[];
}

export const TraceabilityTimeline: React.FC<TraceabilityTimelineProps> = ({ lotCode, events }) => {
  const timelineItems = events.map((evt, idx) => ({
    key: evt.id || idx,
    color: '#176B4D',
    dot: <CheckCircleFilled className="text-base text-[#176B4D]" />,
    children: (
      <div className="bg-gray-50/80 p-3.5 rounded-lg border border-gray-200/80 space-y-1.5 text-xs mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Space size="small">
            <span className="font-bold text-[#176B4D] uppercase tracking-wide text-xs">
              {evt.stage}
            </span>
            {evt.badge && (
              <Tag color="success" className="text-[10px] m-0 font-medium">
                {evt.badge}
              </Tag>
            )}
          </Space>
          <span className="text-gray-400 text-[11px] flex items-center gap-1">
            <CalendarOutlined /> {evt.date}
          </span>
        </div>

        <div className="font-bold text-gray-800 text-sm">
          {evt.title}
        </div>

        <p className="text-gray-600 leading-relaxed m-0 text-xs">
          {evt.notes}
        </p>

        <div className="pt-2 border-t border-gray-200/60 flex flex-wrap items-center justify-between text-[11px] text-gray-500">
          <Space size="middle">
            <span className="flex items-center gap-1 text-gray-700 font-medium">
              <UserOutlined className="text-[#176B4D]" /> {evt.actor}
            </span>
            <span className="flex items-center gap-1">
              <EnvironmentOutlined /> {evt.location}
            </span>
          </Space>
          <Button 
            type="link" 
            size="small" 
            icon={<FileDoneOutlined />} 
            className="!p-0 !text-[#176B4D] !text-[11px]"
          >
            Certificado
          </Button>
        </div>
      </div>
    ),
  }));

  return (
    <Card 
      className="!rounded-xl !border-gray-200 shadow-xs"
      title={
        <div className="flex items-center gap-2 py-1">
          <SafetyCertificateOutlined className="text-lg text-[#176B4D]" />
          <div>
            <span className="font-bold text-gray-900 text-base">Trazabilidad Verificable del Lote</span>
            <div className="text-xs text-gray-400 font-normal">
              Cadena de custodia verificada desde el origen agrícola/forestal hasta el acopio
            </div>
          </div>
        </div>
      }
      extra={
        <div className="flex items-center gap-2 bg-[#f0f9f5] px-2.5 py-1 rounded border border-[#92d6bb]">
          <QrcodeOutlined className="text-base text-[#176B4D]" />
          <div className="text-left leading-none">
            <span className="text-[9px] uppercase font-bold text-gray-500 block">Código Único NEA</span>
            <code className="text-xs font-mono font-bold text-[#176B4D]">{lotCode}</code>
          </div>
          <Tag color="success" className="m-0 text-[10px] font-bold">Auditado</Tag>
        </div>
      }
    >
      <div className="pt-2">
        <Timeline items={timelineItems} />
      </div>

      <div className="mt-2 p-3 rounded-lg bg-[#f0f9f5] border border-[#92d6bb] flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-950 gap-2">
        <span className="flex items-center gap-1.5 font-medium">
          <SafetyCertificateOutlined className="text-[#176B4D]" />
          Lote con conformidad bajo protocolo de subproductos sostenibles del Nordeste Argentino.
        </span>
        <Button 
          size="small" 
          icon={<DownloadOutlined />} 
          className="!text-xs font-semibold !text-[#176B4D] !border-[#92d6bb]"
        >
          Descargar Ficha PDF
        </Button>
      </div>
    </Card>
  );
};
