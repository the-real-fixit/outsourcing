import { useState } from 'react';
import { X, Star, PartyPopper } from 'lucide-react';
import api from '../../services/api';

interface RatingModalProps {
    offerId: string;
    peerName: string;
    onClose: () => void;
    onReviewed?: (offerId: string) => void;
}

const RatingModal = ({ offerId, peerName, onClose, onReviewed }: RatingModalProps) => {
    const [stars, setStars] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async () => {
        if (stars === 0) return;
        setSubmitting(true);
        try {
            await api.post(`/job-posts/offers/${offerId}/review`, { rating: stars, content: comment });
            setDone(true);
            onReviewed?.(offerId);
        } catch (e: unknown) {
            alert((e as any)?.response?.data?.message || 'Error al enviar la evaluación');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 relative">
                <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 text-gray-400">
                    <X size={18} />
                </button>
                {done ? (
                    <div className="text-center py-4">
                        <PartyPopper size={48} className="mx-auto text-yellow-400 mb-3" />
                        <h3 className="text-lg font-bold text-gray-900 mb-1">¡Gracias por evaluar!</h3>
                        <p className="text-sm text-gray-500">Tu evaluación ayuda a construir confianza en la comunidad.</p>
                        <button onClick={onClose} className="mt-5 w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2.5 rounded-xl transition-colors">
                            Cerrar
                        </button>
                    </div>
                ) : (
                    <>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Evaluar a {peerName}</h3>
                        <p className="text-sm text-gray-500 mb-4">¿Cómo fue tu experiencia trabajando juntos?</p>
                        {/* Stars */}
                        <div className="flex justify-center gap-2 mb-4">
                            {[1, 2, 3, 4, 5].map(n => (
                                <button
                                    key={n}
                                    onClick={() => setStars(n)}
                                    onMouseEnter={() => setHovered(n)}
                                    onMouseLeave={() => setHovered(0)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <Star
                                        size={32}
                                        className={`transition-colors ${n <= (hovered || stars) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                                    />
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="Comentario (opcional)..."
                            rows={3}
                            className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-0 outline-none mb-4 resize-none"
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={stars === 0 || submitting}
                            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2.5 rounded-xl transition-colors disabled:opacity-40"
                        >
                            {submitting ? 'Enviando...' : 'Enviar Evaluación'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default RatingModal;
