import { CheckCircle, XCircle, Clock, FileText, Edit2, Star, X } from 'lucide-react';
import type { Offer } from './types';

export interface EditFields {
    desc: string;
    price: string;
    days: string;
}

interface OfferCardProps {
    offer: Offer;
    currentUserId: string | undefined;
    respondingOffer: string | null;
    editingOfferId: string | null;
    editFields: EditFields;
    reviewedOfferIds: Set<string>;

    // Callbacks
    onApprove: (offerId: string) => void;
    onRespond: (offerId: string, status: string) => void;
    onComplete: (offerId: string) => void;
    onStartEdit: (offer: Offer) => void;
    onCancelEdit: () => void;
    onEditFieldChange: (field: keyof EditFields, value: string) => void;
    onEditSubmit: () => void;
    onRemoveJobPost: (offer: Offer) => void;
    onRate: (offerId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ACCEPTED: 'bg-green-100 text-green-800 border-green-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200',
    COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
};

const STATUS_LABELS: Record<string, React.ReactNode> = {
    PENDING: 'Pendiente',
    ACCEPTED: 'En Progreso',
    REJECTED: 'Rechazada',
    COMPLETED: (
        <span className="flex items-center gap-1">
            <CheckCircle size={10} /> Completada
        </span>
    ),
};

const OfferCard = ({
    offer,
    currentUserId,
    respondingOffer,
    editingOfferId,
    editFields,
    reviewedOfferIds,
    onApprove,
    onRespond,
    onComplete,
    onStartEdit,
    onCancelEdit,
    onEditFieldChange,
    onEditSubmit,
    onRemoveJobPost,
    onRate,
}: OfferCardProps) => {
    const isSender = offer.senderId === currentUserId;
    const myApproval = isSender ? offer.senderApproved : offer.receiverApproved;
    const myCompletion = isSender ? offer.senderCompleted : offer.receiverCompleted;
    const peer = isSender ? offer.receiver : offer.sender;
    const alreadyReviewed =
        reviewedOfferIds.has(offer.id) || offer.reviews?.some(r => r.authorId === currentUserId);

    // ── Edit mode ────────────────────────────────────────────────
    if (editingOfferId === offer.id) {
        return (
            <div className="bg-white rounded-lg p-3 border border-yellow-300 mb-2 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-900 border-l-2 border-yellow-400 pl-2">
                        Editar Propuesta
                    </span>
                    <button onClick={onCancelEdit} className="p-1 hover:bg-gray-100 rounded-full">
                        <X size={14} className="text-gray-500" />
                    </button>
                </div>
                <textarea
                    value={editFields.desc}
                    onChange={e => onEditFieldChange('desc', e.target.value)}
                    className="w-full text-xs p-2 border border-gray-200 focus:border-yellow-400 outline-none rounded mb-2"
                    rows={2}
                    placeholder="Descripción"
                />
                <div className="flex gap-2 mb-2">
                    <div className="flex-1 relative">
                        <span className="absolute left-3 top-2.5 font-bold text-gray-500 text-xs">Q</span>
                        <input
                            type="number"
                            value={editFields.price}
                            onChange={e => onEditFieldChange('price', e.target.value)}
                            placeholder="Monto"
                            className="w-full text-xs p-2 pl-7 border border-gray-200 focus:border-yellow-400 outline-none rounded"
                            min={0}
                        />
                    </div>
                    <div className="flex-1 relative">
                        <Clock size={12} className="absolute left-2 top-2.5 text-gray-400" />
                        <input
                            type="number"
                            value={editFields.days}
                            onChange={e => onEditFieldChange('days', e.target.value)}
                            placeholder="Días"
                            className="w-full text-xs p-2 pl-6 border border-gray-200 focus:border-yellow-400 outline-none rounded"
                            min={1}
                        />
                    </div>
                </div>
                <button
                    onClick={onEditSubmit}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-1.5 rounded text-xs font-bold transition-colors"
                >
                    Guardar Cambios y Re-enviar
                </button>
            </div>
        );
    }

    // ── Normal view ──────────────────────────────────────────────
    return (
        <div
            className={`rounded-lg p-3 border mb-2 shadow-sm ${
                offer.status === 'COMPLETED' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
            }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-1 pb-1.5 border-b border-gray-50">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center flex-shrink-0">
                        <FileText size={10} />
                    </div>
                    <span className="text-xs font-bold text-gray-900 truncate max-w-[150px]">
                        {offer.jobPost.title}
                    </span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[offer.status] || ''}`}>
                    {STATUS_LABELS[offer.status] ?? offer.status}
                </span>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-600 line-clamp-3 mb-2">{offer.description}</p>

            {/* Price + days */}
            <div className="flex items-center gap-3 text-xs text-gray-500 bg-gray-50 rounded-md p-1.5 mb-1 text-center justify-center">
                <span className="flex items-center font-bold text-green-700 bg-white px-2 py-0.5 rounded shadow-sm">
                    Q{offer.price}
                </span>
                {offer.estimatedDays && (
                    <span className="flex items-center bg-white px-2 py-0.5 rounded shadow-sm">
                        <Clock size={12} className="mr-0.5" />
                        {offer.estimatedDays} días
                    </span>
                )}
            </div>

            {/* ── PENDING actions ── */}
            {offer.status === 'PENDING' && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                    {!myApproval ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => onApprove(offer.id)}
                                disabled={respondingOffer === offer.id}
                                className="flex-1 inline-flex items-center justify-center px-2 py-1.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded text-xs transition-colors disabled:opacity-50"
                            >
                                <CheckCircle size={12} className="mr-1" /> Aprobar
                            </button>
                            {!isSender && (
                                <button
                                    onClick={() => onRespond(offer.id, 'REJECTED')}
                                    disabled={respondingOffer === offer.id}
                                    className="flex-1 inline-flex items-center justify-center px-2 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded text-xs transition-colors disabled:opacity-50 border border-red-200"
                                >
                                    <XCircle size={12} className="mr-1" /> Rechazar
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="bg-blue-50 text-blue-700 text-[10px] sm:text-xs font-semibold p-1.5 rounded text-center border border-blue-100 flex items-center justify-center">
                            <CheckCircle size={12} className="mr-1 inline flex-shrink-0" />
                            Has aprobado. Esperando confirmación mutua.
                        </div>
                    )}

                    {/* Counter-propose / modify */}
                    <button
                        onClick={() => onStartEdit(offer)}
                        className="mt-2 w-full inline-flex items-center justify-center px-2 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded text-xs transition-colors"
                    >
                        <Edit2 size={12} className="mr-1" />
                        {isSender ? 'Modificar Propuesta' : 'Contra-proponer'}
                    </button>
                </div>
            )}

            {/* ── ACCEPTED actions ── */}
            {offer.status === 'ACCEPTED' && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                    {!myCompletion ? (
                        <button
                            onClick={() => onComplete(offer.id)}
                            disabled={respondingOffer === offer.id}
                            className="w-full inline-flex items-center justify-center px-2 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded text-xs transition-colors disabled:opacity-50"
                        >
                            <CheckCircle size={12} className="mr-1" /> Marcar como Completado
                        </button>
                    ) : (
                        <div className="bg-blue-50 text-blue-700 text-[10px] sm:text-xs font-semibold p-1.5 rounded text-center border border-blue-100 flex items-center justify-center">
                            <CheckCircle size={12} className="mr-1 inline flex-shrink-0" />
                            Has confirmado. Esperando al otro.
                        </div>
                    )}
                </div>
            )}

            {/* ── COMPLETED actions ── */}
            {offer.status === 'COMPLETED' && (
                <div className="mt-2 pt-2 border-t border-blue-100">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-blue-700 font-semibold">¡Trabajo terminado!</span>
                        {!alreadyReviewed ? (
                            <button
                                onClick={() => onRate(offer.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded text-xs transition-colors"
                            >
                                <Star size={12} className="fill-black" /> Evaluar a {peer.name.split(' ')[0]}
                            </button>
                        ) : (
                            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                <CheckCircle size={14} className="text-green-500" /> Ya evaluaste
                            </span>
                        )}
                    </div>

                    {offer.jobPost.authorId === currentUserId && offer.jobPost.status !== 'CLOSED' && (
                        <div className="mt-3 flex justify-end">
                            <button
                                onClick={() => onRemoveJobPost(offer)}
                                className="inline-flex items-center px-3 py-1.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-bold rounded text-xs transition-colors"
                            >
                                <XCircle size={14} className="mr-1" /> Quitar Anuncio
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OfferCard;
