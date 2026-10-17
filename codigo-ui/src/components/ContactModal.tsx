import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography, Space, Tag, Row, Col } from 'antd';
import { 
  MessageOutlined, 
  SendOutlined, 
  CheckCircleFilled, 
  PhoneOutlined, 
  MailOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Vendor } from '../types';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface ContactModalProps {
  vendor: Vendor;
  productTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSendMessage?: (msg: string) => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  vendor,
  productTitle,
  isOpen,
  onClose,
  onSendMessage,
}) => {
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState('Ing. Marcos Giménez');
  const [senderPhone, setSenderPhone] = useState('+54 379 499-1020');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    onSendMessage?.(message);
    setSent(true);
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 1600);
  };

  const quickTemplates = [
    '¿Disponen de muestra para análisis de laboratorio?',
    '¿Cuentan con báscula propia para camiones bitrén?',
    '¿Qué horario de carga tienen en planta?',
  ];

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={560}
      title={
        <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
          <MessageOutlined className="text-[#176B4D]" />
          <span>Contacto Directo B2B con {vendor.name}</span>
        </div>
      }
    >
      {sent ? (
        <div className="py-8 text-center space-y-2">
          <CheckCircleFilled className="text-5xl text-[#176B4D]" />
          <Title level={4} className="!m-0 !text-gray-900">Mensaje enviado al vendedor</Title>
          <Text className="text-gray-500 text-xs block">
            Un representante comercial de {vendor.name} se contactará a la brevedad.
          </Text>
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          
          {/* Vendor Quick Info */}
          <div className="bg-[#f8fafc] p-3 rounded-lg border border-gray-200 text-xs space-y-1.5">
            <div className="font-semibold text-gray-800">
              Lote consultado: <span className="font-normal text-gray-600">{productTitle}</span>
            </div>
            <div className="flex items-center justify-between text-gray-500 text-[11px] pt-1 border-t border-gray-200/60">
              <span className="flex items-center gap-1">
                <PhoneOutlined className="text-[#176B4D]" /> {vendor.phone}
              </span>
              <span className="flex items-center gap-1">
                <MailOutlined className="text-[#176B4D]" /> {vendor.email}
              </span>
            </div>
          </div>

          {/* Quick template buttons */}
          <div>
            <div className="text-[11px] font-semibold text-gray-500 mb-1.5">
              Consultas habituales rápidas:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickTemplates.map((txt) => (
                <Button
                  key={txt}
                  size="small"
                  onClick={() => setMessage(txt)}
                  className="!text-[11px] !h-auto !py-1 text-gray-700"
                >
                  {txt}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Tu consulta comercial o técnica
            </label>
            <TextArea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe aquí tu consulta sobre disponibilidad, condiciones de pesaje o requerimiento de muestras..."
            />
          </div>

          <Row gutter={12}>
            <Col span={12}>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Nombre y Apellido
              </label>
              <Input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                size="middle"
              />
            </Col>
            <Col span={12}>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Teléfono de contacto
              </label>
              <Input
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                size="middle"
              />
            </Col>
          </Row>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <Button onClick={onClose}>Cancelar</Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              className="!bg-[#176B4D] hover:!bg-[#12553c] font-semibold"
            >
              Enviar Mensaje
            </Button>
          </div>

        </div>
      )}
    </Modal>
  );
};
