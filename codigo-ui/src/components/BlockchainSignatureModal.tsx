import React, { useState } from 'react';
import { 
  Modal, 
  Input, 
  Button, 
  Typography, 
  Space, 
  Tag, 
  Card, 
  Divider, 
  Alert, 
  Steps, 
  message 
} from 'antd';
import { 
  SafetyCertificateFilled, 
  CheckCircleFilled, 
  LockOutlined, 
  CopyOutlined, 
  FileTextOutlined, 
  BankOutlined,
  ThunderboltFilled
} from '@ant-design/icons';
import { PurchaseOrder, UserProfile } from '../types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface BlockchainSignatureModalProps {
  order: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSignature: (orderId: string, buyerComment: string, blockchainHash: string, blockNumber: number) => void;
  activeProfile: UserProfile;
}

export const BlockchainSignatureModal: React.FC<BlockchainSignatureModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmSignature,
  activeProfile,
}) => {
  const [comment, setComment] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [signedResult, setSignedResult] = useState<{
    hash: string;
    blockNumber: number;
    signature: string;
    timestamp: string;
  } | null>(null);

  if (!order) return null;

  const handleSign = () => {
    setIsSigning(true);

    setTimeout(() => {
      // Generate realistic cryptographic hash
      const randomHex = () => Math.random().toString(16).substring(2, 10);
      const generatedHash = `0x${randomHex()}${randomHex()}${randomHex()}${randomHex()}${randomHex()}${randomHex()}${randomHex()}${randomHex()}`;
      const blockNum = 19842000 + Math.floor(Math.random() * 900);
      const signatureStr = `SIG_ECDSA_SECP256K1_${activeProfile.role.toUpperCase()}_${randomHex()}${randomHex()}`;
      const nowIso = new Date().toISOString();

      setSignedResult({
        hash: generatedHash,
        blockNumber: blockNum,
        signature: signatureStr,
        timestamp: nowIso,
      });

      setIsSigning(false);
      onConfirmSignature(order.id, comment, generatedHash, blockNum);
      message.success('Firma digital verificada y bloque minado exitosamente.');
    }, 1200);
  };

  const handleCopyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Hash copiado al portapapeles');
  };

  const handleCloseModal = () => {
    setSignedResult(null);
    setComment('');
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onCancel={handleCloseModal}
      footer={null}
      width={680}
      centered
      title={
        <div className="flex items-center gap-2 text-base font-bold text-gray-900">
          <div className="w-7 h-7 rounded-lg bg-[#176B4D] flex items-center justify-center text-white text-sm">
            <SafetyCertificateFilled />
          </div>
          <span>Firma Digital & Registro Inmutable en Blockchain</span>
        </div>
      }
    >
      <div className="pt-2 space-y-5">
        
        {/* Blockchain Network Badge */}
        <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200/60 p-3 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-emerald-950">Red Blockchain NEA Ledger • Smart Contract v2.4</span>
          </div>
          <Tag color="success" className="font-mono text-[11px] m-0">Inmutable · EIP-712</Tag>
        </div>

        {/* Order Details summary */}
        <Card size="small" className="border-gray-200 bg-gray-50/60">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center border-b border-gray-200/80 pb-2">
              <span className="text-gray-500">Orden de Compra:</span>
              <span className="font-mono font-bold text-gray-800">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Subproducto Agroindustrial:</span>
              <span className="font-bold text-gray-900">{order.productTitle}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Volumen acordado:</span>
              <span className="font-semibold text-gray-800">{order.tons} Toneladas ({order.category})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Precio unitario:</span>
              <span className="font-semibold text-gray-800">${order.pricePerTon.toLocaleString('es-AR')}/Tn</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-gray-200/80">
              <span className="text-gray-800 font-bold">Monto Total de Operación:</span>
              <span className="font-extrabold text-[#176B4D] text-sm">
                ${order.totalAmount.toLocaleString('es-AR')} {order.currency}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-gray-500 pt-1">
              <span>Vendedor: <strong>{order.vendorName}</strong></span>
              <span>Comprador: <strong>{order.buyerCompany}</strong></span>
            </div>
          </div>
        </Card>

        {!signedResult ? (
          <>
            {/* Buyer Comment for Seller's Permanent Record */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                <span>Comentario / Observación de Conformidad para Registro del Vendedor:</span>
                <span className="text-[11px] text-gray-400 font-normal">Quedará grabado en el bloque</span>
              </label>
              <TextArea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ej: Calidad bromatológica conforme a protocolo. Autorizado ingreso de bateas con tara previa a báscula de Mercedes..."
                className="text-xs"
              />
              <p className="text-[11px] text-gray-500 m-0 leading-normal">
                Este mensaje se integrará a la carga criptográfica y quedará archivado como constancia permanente para el vendedor y auditorías.
              </p>
            </div>

            <Alert
              type="info"
              showIcon
              icon={<LockOutlined />}
              message={<span className="text-xs font-semibold">Garantía de Integridad Digital</span>}
              description={
                <span className="text-[11px] text-gray-600">
                  Al confirmar la firma, se generará una estampa de tiempo con tu par de claves criptográficas institucionales, validando la compra sin intermediarios.
                </span>
              }
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button
                type="primary"
                icon={<ThunderboltFilled />}
                loading={isSigning}
                onClick={handleSign}
                className="!bg-[#176B4D] hover:!bg-[#12553c] !font-bold"
              >
                Firmar y Grabar en Blockchain
              </Button>
            </div>
          </>
        ) : (
          /* Success Certificate View */
          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircleFilled className="text-emerald-600 text-lg" />
                <span>Transacción Acuñada y Sellada en el Bloque #{signedResult.blockNumber}</span>
              </div>

              <div className="space-y-2 text-xs font-mono bg-white p-3 rounded-lg border border-emerald-200">
                <div>
                  <span className="text-gray-400 block text-[10px]">HASH TRANSACCIÓN (TX HASH):</span>
                  <div className="flex items-center justify-between gap-2 text-emerald-900 break-all text-[11px]">
                    <span>{signedResult.hash}</span>
                    <Button 
                      size="small" 
                      type="text" 
                      icon={<CopyOutlined />} 
                      onClick={() => handleCopyHash(signedResult.hash)}
                    />
                  </div>
                </div>

                <div className="pt-1 border-t border-gray-100 flex justify-between text-[11px]">
                  <span className="text-gray-400 font-sans">Timestamp:</span>
                  <span className="text-gray-700">{signedResult.timestamp}</span>
                </div>

                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-400 font-sans">Firma Digital Comprador:</span>
                  <span className="text-gray-700 font-mono text-[10px] truncate max-w-[280px]">{signedResult.signature}</span>
                </div>

                {comment && (
                  <div className="pt-1 border-t border-gray-100">
                    <span className="text-gray-400 font-sans block text-[10px]">REGISTRO AUDITABLE DEL COMPRADOR:</span>
                    <span className="text-gray-800 font-sans text-xs italic">"{comment}"</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="primary" onClick={handleCloseModal} className="!bg-[#176B4D]">
                Entendido y Finalizar
              </Button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
};
