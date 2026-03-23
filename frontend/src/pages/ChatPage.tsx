import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Send, ChevronLeft, User as UserIcon, MessageSquare, FileText, CheckCircle, XCircle, Clock, Paperclip, Edit2, X, Star, PartyPopper } from 'lucide-react';

interface ChatSummary {
    user1Id: string;
    user2Id: string;
    user1: { id: string; name: string; profile: { photoUrl: string | null } | null };
    user2: { id: string; name: string; profile: { photoUrl: string | null } | null };
    messages: { content: string; createdAt: string; senderId: string }[];
    unreadCount: number;
}

interface Message {
    id: string;
    content: string;
    imageUrl?: string | null;
    senderId: string;
    createdAt: string;
}

interface Offer {
    id: string;
    description: string;
    price: number;
    estimatedDays: number | null;
    status: string;
    senderId: string;
    receiverId: string;
    senderApproved: boolean;
    receiverApproved: boolean;
    senderCompleted: boolean;
    receiverCompleted: boolean;
    sender: { id: string; name: string };
    receiver: { id: string; name: string };
    jobPost: { id: string; title: string; authorId: string; status: string };
    createdAt: string;
    reviews?: { authorId: string }[];
}

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

// ── Rating Modal ────────────────────────────────────────────────
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

const ChatPage = () => {
    const { user } = useAuth();
    const { peerId } = useParams<{ peerId: string }>();
    const navigate = useNavigate();

    const [chats, setChats] = useState<ChatSummary[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [peerInfo, setPeerInfo] = useState<{ name: string; photoUrl: string | null } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [showOffersSidebar, setShowOffersSidebar] = useState(true);
    const [respondingOffer, setRespondingOffer] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    
    // Edit offer state
    const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
    const [editOfferDesc, setEditOfferDesc] = useState('');
    const [editOfferPrice, setEditOfferPrice] = useState('');
    const [editOfferDays, setEditOfferDays] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [offerUpdateTrigger, setOfferUpdateTrigger] = useState(0);

    // Rating modal state
    const [ratingOfferId, setRatingOfferId] = useState<string | null>(null);
    // Track which offers the user has already reviewed (to hide the Evaluar button)
    const [reviewedOfferIds, setReviewedOfferIds] = useState<Set<string>>(new Set());

    // Setup socket connection
    useEffect(() => {
        if (!user) return;

        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        socketRef.current = socket;

        socket.on('connect', () => {
            // Log removed
            socket.emit('register', { userId: user.id });
        });

        socket.on('newMessage', (message: Message) => {
            setMessages(prev => {
                // Avoid duplicates
                if (prev.find(m => m.id === message.id)) return prev;
                return [...prev, message];
            });
            // Refresh chat list for latest message preview
            refreshChats();
        });

        socket.on('offerUpdated', () => {
            setOfferUpdateTrigger(prev => prev + 1);
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    // Fetch all chats
    const refreshChats = async () => {
        try {
            const res = await api.get('/chats');
            setChats(res.data);
        } catch (error) {
            console.error('Error fetching chats:', error);
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoadingChats(true);
            await refreshChats();
            setLoadingChats(false);
        };
        init();
    }, []);

    // Fetch messages for active peer + mark chat as read
    useEffect(() => {
        if (!peerId) {
            setMessages([]);
            setPeerInfo(null);
            return;
        }

        const fetchMessages = async () => {
            setLoadingMessages(true);
            try {
                const res = await api.get(`/chats/${peerId}`);
                setMessages(res.data);

                const peerRes = await api.get(`/users/public/${peerId}`);
                setPeerInfo({
                    name: peerRes.data.name,
                    photoUrl: peerRes.data.profile?.photoUrl || null
                });

                // Mark this chat as read
                api.patch(`/chats/${peerId}/read`).catch(() => {});
            } catch (error) {
                console.error('Error fetching messages:', error);
            } finally {
                setLoadingMessages(false);
            }
        };
        fetchMessages();
    }, [peerId]);


    // Fetch offers between users
    useEffect(() => {
        if (!peerId) { setOffers([]); return; }
        const fetchOffers = async () => {
            try {
                const res = await api.get(`/job-posts/offers/between/${peerId}`);
                setOffers(res.data);
            } catch (error) {
                console.error('Error fetching offers:', error);
            }
        };
        fetchOffers();
    }, [peerId, offerUpdateTrigger]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (imageUrl?: string) => {
        const textContent = newMessage.trim() || (imageUrl ? 'Archivo adjunto' : '');
        if (!textContent || !peerId || !user) return;
        setSending(true);
        try {
            if (socketRef.current?.connected) {
                socketRef.current.emit('sendMessage', {
                    senderId: user.id,
                    peerId,
                    content: textContent,
                    imageUrl
                });
            } else {
                await api.post(`/chats/${peerId}/messages`, { content: textContent, imageUrl });
                const res = await api.get(`/chats/${peerId}`);
                setMessages(res.data);
            }
            if (!imageUrl) setNewMessage('');
            refreshChats();
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !user || !peerId) return;

        setUploadingImage(true);
        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('files', file);
        });

        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const imageUrls: string[] = res.data.urls;
            for (const url of imageUrls) {
                await handleSend(url);
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            alert('Error al subir los archivos.');
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleOfferRespond = async (offerId: string, status: string) => {
        setRespondingOffer(offerId);
        try {
            const res = await api.patch(`/job-posts/offers/${offerId}/respond`, { status });
            setOffers(prev => prev.map(o => o.id === offerId ? res.data : o));
            if (socketRef.current?.connected && peerId) {
                socketRef.current.emit('offerUpdated', { peerId });
            }
        } catch (error) {
            console.error('Error responding to offer:', error);
        } finally {
            setRespondingOffer(null);
        }
    };

    const handleOfferApprove = async (offerId: string) => {
        setRespondingOffer(offerId);
        try {
            const res = await api.patch(`/job-posts/offers/${offerId}/approve`);
            setOffers(prev => prev.map(o => o.id === offerId ? res.data : o));
            if (socketRef.current?.connected && peerId) {
                socketRef.current.emit('offerUpdated', { peerId });
            }
        } catch (error) {
            console.error('Error approving offer:', error);
        } finally {
            setRespondingOffer(null);
        }
    };

    const handleOfferComplete = async (offerId: string) => {
        setRespondingOffer(offerId);
        try {
            const res = await api.patch(`/job-posts/offers/${offerId}/complete`);
            setOffers(prev => prev.map(o => o.id === offerId ? res.data : o));
            if (socketRef.current?.connected && peerId) {
                socketRef.current.emit('offerCompleted', { peerId });
            }
        } catch (error) {
            console.error('Error completing offer:', error);
        } finally {
            setRespondingOffer(null);
        }
    };

    const startEditOffer = (offer: Offer) => {
        setEditingOfferId(offer.id);
        setEditOfferDesc(offer.description);
        setEditOfferPrice(offer.price.toString());
        setEditOfferDays(offer.estimatedDays ? offer.estimatedDays.toString() : '');
    };

    const handleOfferEditSubmit = async () => {
        if (!editingOfferId || !editOfferDesc.trim() || !editOfferPrice) return;
        
        try {
            const res = await api.patch(`/job-posts/offers/${editingOfferId}/edit`, {
                description: editOfferDesc,
                price: parseFloat(editOfferPrice),
                estimatedDays: editOfferDays ? parseInt(editOfferDays) : null
            });
            setOffers(prev => prev.map(o => o.id === editingOfferId ? res.data : o));
            setEditingOfferId(null);
            if (socketRef.current?.connected && peerId) {
                socketRef.current.emit('offerUpdated', { peerId });
            }
        } catch (error) {
            console.error('Error editing offer:', error);
            alert('Error al editar la propuesta');
        }
    };

    const handleRemoveJobPost = async (offer: Offer) => {
        try {
            if (!confirm('¿Estás seguro de que quieres quitar este anuncio para que ya no reciba más propuestas?')) return;
            await api.patch(`/job-posts/${offer.jobPost.id}/status`, { status: 'CLOSED' });
            setOffers(prev => prev.map(o => o.jobPost.id === offer.jobPost.id ? {
                ...o,
                jobPost: { ...o.jobPost, status: 'CLOSED' }
            } : o));
            alert('El anuncio ha sido quitado exitosamente.');
        } catch (error: unknown) {
            console.error('Error removing job post:', error);
            alert((error as any)?.response?.data?.message || 'Error al quitar el anuncio');
        }
    };

    const getPeer = (chat: ChatSummary) => {
        return chat.user1.id === user?.id ? chat.user2 : chat.user1;
    };

    const renderOffers = () => (
        <>
            {offers.map(offer => {
                                    const isSender = offer.senderId === user?.id;
                                    const myApproval = isSender ? offer.senderApproved : offer.receiverApproved;
                                    const myCompletion = isSender ? offer.senderCompleted : offer.receiverCompleted;
                                    const peer = isSender ? offer.receiver : offer.sender;

                                    if (editingOfferId === offer.id) {
                                        return (
                                            <div key={offer.id} className="bg-white rounded-lg p-3 border border-yellow-300 mb-2 shadow-sm">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-gray-900 border-l-2 border-yellow-400 pl-2">Editar Propuesta</span>
                                                    <button onClick={() => setEditingOfferId(null)} className="p-1 hover:bg-gray-100 rounded-full"><X size={14} className="text-gray-500"/></button>
                                                </div>
                                                <textarea value={editOfferDesc} onChange={e => setEditOfferDesc(e.target.value)} className="w-full text-xs p-2 border border-gray-200 focus:border-yellow-400 outline-none rounded mb-2" rows={2} placeholder="Descripción"/>
                                                <div className="flex gap-2 mb-2">
                                                    <div className="flex-1 relative">
                                                        <span className="absolute left-3 top-2.5 font-bold text-gray-500 text-xs">Q</span>
                                                        <input type="number" value={editOfferPrice} onChange={e => setEditOfferPrice(e.target.value)} placeholder="Monto" className="w-full text-xs p-2 pl-7 border border-gray-200 focus:border-yellow-400 outline-none rounded" min={0}/>
                                                    </div>
                                                    <div className="flex-1 relative">
                                                        <Clock size={12} className="absolute left-2 top-2.5 text-gray-400"/>
                                                        <input type="number" value={editOfferDays} onChange={e => setEditOfferDays(e.target.value)} placeholder="Días" className="w-full text-xs p-2 pl-6 border border-gray-200 focus:border-yellow-400 outline-none rounded" min={1}/>
                                                    </div>
                                                </div>
                                                <button onClick={handleOfferEditSubmit} className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-1.5 rounded text-xs font-bold transition-colors">Guardar Cambios y Re-enviar</button>
                                            </div>
                                        );
                                    }

                                    const statusColors: Record<string, string> = {
                                        PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                                        ACCEPTED: 'bg-green-100 text-green-800 border-green-200',
                                        REJECTED: 'bg-red-100 text-red-800 border-red-200',
                                        COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
                                    };

                                    return (
                                        <div key={offer.id} className={`rounded-lg p-3 border mb-2 shadow-sm ${offer.status === 'COMPLETED' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                                            <div className="flex items-center justify-between mb-1 pb-1.5 border-b border-gray-50">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center flex-shrink-0">
                                                        <FileText size={10} />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-900 truncate max-w-[150px]">{offer.jobPost.title}</span>
                                                </div>
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusColors[offer.status] || ''}`}>
                                                    {offer.status === 'PENDING' ? 'Pendiente' : offer.status === 'ACCEPTED' ? 'En Progreso' : offer.status === 'REJECTED' ? 'Rechazada' : (
                                                        <span className="flex items-center gap-1">
                                                            <CheckCircle size={10} /> Completada
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 line-clamp-3 mb-2">{offer.description}</p>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 bg-gray-50 rounded-md p-1.5 mb-1 text-center justify-center">
                                                <span className="flex items-center font-bold text-green-700 bg-white px-2 py-0.5 rounded shadow-sm">Q{offer.price}</span>
                                                {offer.estimatedDays && <span className="flex items-center bg-white px-2 py-0.5 rounded shadow-sm"><Clock size={12} className="mr-0.5" />{offer.estimatedDays} días</span>}
                                            </div>
                                            
                                            {/* ── PENDING: approve / reject ── */}
                                            {offer.status === 'PENDING' && (
                                                <div className="mt-2 pt-2 border-t border-gray-100">
                                                    {!myApproval ? (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleOfferApprove(offer.id)}
                                                                disabled={respondingOffer === offer.id}
                                                                className="flex-1 inline-flex items-center justify-center px-2 py-1.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded text-xs transition-colors disabled:opacity-50"
                                                            >
                                                                <CheckCircle size={12} className="mr-1" /> Aprobar
                                                            </button>
                                                            {!isSender && (
                                                                <button
                                                                    onClick={() => handleOfferRespond(offer.id, 'REJECTED')}
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
                                                    
                                                    {/* Both parties can counter-propose */}
                                                    <button 
                                                        onClick={() => startEditOffer(offer)}
                                                        className="mt-2 w-full inline-flex items-center justify-center px-2 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded text-xs transition-colors"
                                                    >
                                                        <Edit2 size={12} className="mr-1" /> {isSender ? 'Modificar Propuesta' : 'Contra-proponer'}
                                                    </button>
                                                </div>
                                            )}

                                            {/* ── ACCEPTED: mark as complete ── */}
                                            {offer.status === 'ACCEPTED' && (
                                                <div className="mt-2 pt-2 border-t border-gray-100">
                                                    {!myCompletion ? (
                                                        <button
                                                            onClick={() => handleOfferComplete(offer.id)}
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

                                            {/* ── COMPLETED: rate the other person ── */}
                                            {offer.status === 'COMPLETED' && (
                                                <div className="mt-2 pt-2 border-t border-blue-100">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-[10px] text-blue-700 font-semibold">¡Trabajo terminado!</span>
                                                        {(!reviewedOfferIds.has(offer.id) && !offer.reviews?.some(r => r.authorId === user?.id)) && (
                                                            <button
                                                                onClick={() => setRatingOfferId(offer.id)}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded text-xs transition-colors"
                                                            >
                                                                <Star size={12} className="fill-black" /> Evaluar a {peer.name.split(' ')[0]}
                                                            </button>
                                                        )}
                                                        {(reviewedOfferIds.has(offer.id) || offer.reviews?.some(r => r.authorId === user?.id)) && (
                                                            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                                                <CheckCircle size={14} className="text-green-500" /> Ya evaluaste
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {offer.jobPost.authorId === user?.id && offer.jobPost.status !== 'CLOSED' && (
                                                        <div className="mt-3 flex justify-end">
                                                            <button 
                                                                onClick={() => handleRemoveJobPost(offer)}
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
                                })}
        </>
    );

    return (
        <div className="flex w-full h-full bg-white overflow-hidden border-t border-gray-100">
            {/* Sidebar: Chat list */}
            <div className={`w-full md:w-80 border-r border-gray-100 flex flex-col ${peerId ? 'hidden md:flex' : 'flex'}`}>
                <div className="px-4 py-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center">
                        <MessageSquare size={20} className="mr-2 text-yellow-600" />
                        Mensajes
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loadingChats ? (
                        <div className="p-4 text-center text-gray-500 text-sm">Cargando conversaciones...</div>
                    ) : chats.length === 0 ? (
                        <div className="p-6 text-center">
                            <MessageSquare size={40} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 text-sm font-medium">No tienes conversaciones aún.</p>
                            <p className="text-gray-400 text-xs mt-1">Contacta a alguien desde un anuncio para empezar.</p>
                        </div>
                    ) : (
                        chats.map((chat) => {
                            const peer = getPeer(chat);
                            const lastMsg = chat.messages[0];
                            const isActive = peer.id === peerId;

                            return (
                                <Link
                                    key={`${chat.user1Id}-${chat.user2Id}`}
                                    to={`/app/chats/${peer.id}`}
                                    className={`flex items-center px-4 py-3 border-b border-gray-50 hover:bg-yellow-50 transition-colors ${isActive ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : ''}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
                                        {peer.profile?.photoUrl ? (
                                            <img src={peer.profile.photoUrl} alt={peer.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon size={18} className="text-gray-400" />
                                        )}
                                    </div>
                                    <div className="ml-3 flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{peer.name}</p>
                                        {lastMsg && (
                                            <p className="text-xs text-gray-500 truncate mt-0.5">
                                                {lastMsg.senderId === user?.id ? 'Tú: ' : ''}{lastMsg.content}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                        <div className="flex flex-col items-end gap-1">
                                            {lastMsg && (
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(lastMsg.createdAt).toLocaleDateString()}
                                                </span>
                                            )}
                                            {chat.unreadCount > 0 && peer.id !== peerId && (
                                                <span className="bg-yellow-400 text-black text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                                    {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={e => { e.preventDefault(); e.stopPropagation(); navigate(`/app/public-profile/${peer.id}`); }}
                                            title="Ver perfil"
                                            className="ml-1 p-1 rounded-full hover:bg-yellow-100 text-gray-400 hover:text-yellow-600 transition-colors"
                                        >
                                            <UserIcon size={14} />
                                        </button>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Main: Chat messages */}
            <div className={`flex-1 flex flex-col min-w-0 ${!peerId ? 'hidden md:flex' : 'flex'}`}>
                {!peerId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <MessageSquare size={64} className="mb-4 text-gray-200" />
                        <p className="text-lg font-medium">Selecciona una conversación</p>
                        <p className="text-sm mt-1">Escoge un chat de la izquierda para empezar a conversar.</p>
                    </div>
                ) : (
                    <>
                        {/* Chat header */}
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center">
                                <button onClick={() => navigate('/app/chats')} className="md:hidden mr-3 p-1 rounded hover:bg-gray-200 transition-colors">
                                    <ChevronLeft size={20} />
                                </button>
                                <Link
                                    to={`/app/public-profile/${peerId}`}
                                    className="flex items-center hover:opacity-80 transition-opacity"
                                >
                                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
                                        {peerInfo?.photoUrl ? (
                                            <img src={peerInfo.photoUrl} alt={peerInfo.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon size={16} className="text-gray-400" />
                                        )}
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-bold text-gray-900 hover:text-yellow-600 transition-colors">{peerInfo?.name || 'Cargando...'}</p>
                                        <p className="text-[10px] text-gray-400">Ver perfil</p>
                                    </div>
                                </Link>
                            </div>

                            {offers.length > 0 && !showOffersSidebar && (
                                <button
                                    onClick={() => setShowOffersSidebar(true)}
                                    className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-full text-xs font-bold transition-colors"
                                >
                                    <FileText size={14} />
                                    Abrir Propuestas
                                </button>
                            )}
                        </div>

                        {/* Offers Panel */}
                        {/* Offers Panel (Mobile only) */}
                        {offers.length > 0 && (
                            <div id="offers-panel-mobile" className="lg:hidden px-4 py-2 border-b border-gray-100 bg-yellow-50/50 max-h-56 overflow-y-auto space-y-2 transition-colors duration-500">
                                {renderOffers()}

                            </div>
                        )}

                        {/* Rating Modal */}
                        {ratingOfferId && (() => {
                            const offer = offers.find(o => o.id === ratingOfferId);
                            if (!offer) return null;
                            const isSender = offer.senderId === user?.id;
                            const peer = isSender ? offer.receiver : offer.sender;
                            return (
                                <RatingModal
                                    offerId={ratingOfferId}
                                    peerName={peer.name}
                                    onClose={() => setRatingOfferId(null)}
                                    onReviewed={(oid) => setReviewedOfferIds(prev => new Set(prev).add(oid))}
                                />
                            );
                        })()}



                        {/* Messages area */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50">
                            {loadingMessages ? (
                                <div className="text-center text-gray-500 text-sm py-10">Cargando mensajes...</div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-gray-400 text-sm py-10">
                                    <p className="font-medium">Inicia la conversación</p>
                                    <p className="text-xs mt-1">Envía un mensaje para comenzar.</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMine = msg.senderId === user?.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMine
                                                    ? 'bg-yellow-400 text-black rounded-br-md block'
                                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md block'
                                                    }`}
                                            >
                                                {msg.imageUrl && (
                                                    <div className="mb-2 rounded-lg overflow-hidden border border-black/10">
                                                        <img src={msg.imageUrl} alt="Adjunto" className="max-w-full h-auto max-h-60 object-contain" />
                                                    </div>
                                                )}
                                                {(() => {
                                                    const isSystemOffer = msg.content.startsWith('[Propuesta]') || msg.content.startsWith('[Contra-propuesta]');
                                                    if (isSystemOffer) {
                                                        return (
                                                            <div className="space-y-2">
                                                                <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                                                                <button 
                                                                    onClick={() => {
                                                                        if (window.innerWidth >= 1024) {
                                                                            setShowOffersSidebar(true);
                                                                            setTimeout(() => {
                                                                                const desktopSidebar = document.getElementById('offers-sidebar');
                                                                                if (desktopSidebar) {
                                                                                    desktopSidebar.classList.add('ring-4', 'ring-yellow-400', 'z-20');
                                                                                    setTimeout(() => desktopSidebar.classList.remove('ring-4', 'ring-yellow-400', 'z-20'), 1500);
                                                                                }
                                                                            }, 50);
                                                                        } else {
                                                                            const mobilePanel = document.getElementById('offers-panel-mobile');
                                                                            if (mobilePanel) {
                                                                                mobilePanel.scrollIntoView({ behavior: 'smooth' });
                                                                                mobilePanel.classList.add('bg-yellow-200');
                                                                                setTimeout(() => mobilePanel.classList.remove('bg-yellow-200'), 1500);
                                                                            } else {
                                                                                alert('La propuesta ya no está activa, fue borrada o fue completada.');
                                                                            }
                                                                        }
                                                                    }}
                                                                    className={`mt-2 text-xs px-3 py-1.5 rounded font-bold w-full text-center transition-colors shadow-sm ${
                                                                        isMine 
                                                                            ? 'bg-yellow-500 hover:bg-yellow-600 text-yellow-900 border border-yellow-600/20' 
                                                                            : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-800'
                                                                    }`}
                                                                >
                                                                    Ver Propuesta activa
                                                                </button>
                                                            </div>
                                                        );
                                                    }
                                                    return <p className="break-words whitespace-pre-wrap">{msg.content}</p>;
                                                })()}
                                                <p className={`text-[10px] mt-1 ${isMine ? 'text-yellow-700' : 'text-gray-400'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input area */}
                        <div className="px-4 py-3 border-t border-gray-100 bg-white">
                            <div className="flex items-center gap-2">
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*,.pdf,.doc,.docx" multiple className="hidden" />
                                <button 
                                    onClick={() => fileInputRef.current?.click()} 
                                    disabled={uploadingImage} 
                                    className="p-2 text-gray-500 hover:text-yellow-600 transition-colors disabled:opacity-50"
                                >
                                    <Paperclip size={20} />
                                </button>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder={uploadingImage ? "Subiendo imagen..." : "Escribe un mensaje..."}
                                    disabled={uploadingImage}
                                    className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm outline-none shadow-sm disabled:bg-gray-50"
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={sending || (!newMessage.trim() && !uploadingImage)}
                                    className="p-2.5 bg-yellow-400 hover:bg-yellow-500 text-black rounded-full transition-colors disabled:opacity-40 shadow-sm flex-shrink-0"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Right Sidebar: Offers (Desktop) */}
            {peerId && offers.length > 0 && showOffersSidebar && (
                <div id="offers-sidebar" className="hidden lg:flex flex-col w-80 lg:w-96 border-l border-gray-100 bg-gray-50/30 flex-shrink-0 transition-all duration-500">
                    <div className="p-4 border-b border-gray-100 bg-white shadow-sm z-10 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 flex items-center">
                            <FileText size={18} className="mr-2 text-yellow-600" />
                            Propuestas Activas
                        </h3>
                        <button onClick={() => setShowOffersSidebar(false)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {renderOffers()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatPage;
