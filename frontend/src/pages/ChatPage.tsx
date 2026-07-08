import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, User as UserIcon, MessageSquare, FileText } from 'lucide-react';
import { uploadFileToCloudinary } from '../utils/uploadHelper';

import { SOCKET_URL } from '../components/chat/types';
import type { ChatSummary, Message, Offer } from '../components/chat/types';
import ChatList from '../components/chat/ChatList';
import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import { OffersMobilePanel, OffersDesktopSidebar } from '../components/chat/OffersSidebar';
import RatingModal from '../components/chat/RatingModal';
import type { EditFields } from '../components/chat/OfferCard';

// ─────────────────────────────────────────────────────────────────
// ChatPage — orchestrates state, socket, effects and handlers.
// Visual rendering is delegated to subcomponents in /components/chat
// ─────────────────────────────────────────────────────────────────
const ChatPage = () => {
    const { user } = useAuth();
    const { peerId } = useParams<{ peerId: string }>();
    const navigate = useNavigate();

    // ── State ────────────────────────────────────────────────────
    const [chats, setChats] = useState<ChatSummary[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [peerInfo, setPeerInfo] = useState<{ name: string; photoUrl: string | null } | null>(null);

    const [offers, setOffers] = useState<Offer[]>([]);
    const [showOffersSidebar, setShowOffersSidebar] = useState(true);
    const [respondingOffer, setRespondingOffer] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Edit offer state
    const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
    const [editFields, setEditFields] = useState<EditFields>({ desc: '', price: '', days: '', hours: '' });
    const [offerUpdateTrigger, setOfferUpdateTrigger] = useState(0);

    // Rating modal state
    const [ratingOfferId, setRatingOfferId] = useState<string | null>(null);
    const [reviewedOfferIds, setReviewedOfferIds] = useState<Set<string>>(new Set());

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    // ── Socket ───────────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;

        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            auth: { token: localStorage.getItem('token') },
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('register', { userId: user.id });
        });

        socket.on('newMessage', (message: Message) => {
            setMessages(prev => {
                if (prev.find(m => m.id === message.id)) return prev;
                return [...prev, message];
            });
            refreshChats();
        });

        socket.on('offerUpdated', () => {
            setOfferUpdateTrigger(prev => prev + 1);
        });

        return () => { socket.disconnect(); };
    }, [user]);

    // ── Data fetching ─────────────────────────────────────────────
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

    useEffect(() => {
        if (!peerId) { setMessages([]); setPeerInfo(null); return; }

        const fetchMessages = async () => {
            setLoadingMessages(true);
            try {
                const res = await api.get(`/chats/${peerId}`);
                setMessages(res.data);

                const peerRes = await api.get(`/users/public/${peerId}`);
                setPeerInfo({
                    name: peerRes.data.name,
                    photoUrl: peerRes.data.profile?.photoUrl || null,
                });

                api.patch(`/chats/${peerId}/read`).catch(() => {});
            } catch (error) {
                console.error('Error fetching messages:', error);
            } finally {
                setLoadingMessages(false);
            }
        };
        fetchMessages();
    }, [peerId]);

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

    // ── Message handlers ──────────────────────────────────────────
    const handleSend = async (imageUrl?: string) => {
        const textContent = newMessage.trim() || (imageUrl ? 'Archivo adjunto' : '');
        if (!textContent || !peerId || !user) return;
        setSending(true);
        try {
            if (socketRef.current?.connected) {
                socketRef.current.emit('sendMessage', { senderId: user.id, peerId, content: textContent, imageUrl });
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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !user || !peerId) return;
        setUploadingImage(true);
        try {
            const urls = await Promise.all(Array.from(files).map(f => uploadFileToCloudinary(f)));
            for (const url of urls) await handleSend(url);
        } catch (error) {
            console.error('Error uploading files:', error);
            alert('Error al subir los archivos.');
        } finally {
            setUploadingImage(false);
        }
    };

    // ── Offer handlers ────────────────────────────────────────────
    const emitOfferUpdated = () => {
        if (socketRef.current?.connected && peerId) {
            socketRef.current.emit('offerUpdated', { peerId });
        }
    };

    const handleOfferRespond = async (offerId: string, status: string) => {
        setRespondingOffer(offerId);
        try {
            const res = await api.patch(`/job-posts/offers/${offerId}/respond`, { status });
            setOffers(prev => prev.map(o => o.id === offerId ? res.data : o));
            emitOfferUpdated();
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
            emitOfferUpdated();
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

    const handleStartEdit = (offer: Offer) => {
        setEditingOfferId(offer.id);
        setEditFields({
            desc: offer.description,
            price: String(offer.price),
            days: offer.estimatedDays ? String(offer.estimatedDays) : '',
            hours: offer.estimatedHours ? String(offer.estimatedHours) : '',
        });
    };

    const handleCancelEdit = () => {
        setEditingOfferId(null);
        setEditFields({ desc: '', price: '', days: '', hours: '' });
    };

    const handleEditFieldChange = (field: keyof EditFields, value: string) => {
        setEditFields(prev => ({ ...prev, [field]: value }));
    };

    const handleOfferEditSubmit = async () => {
        if (!editingOfferId || !editFields.desc.trim() || !editFields.price) return;
        try {
            const res = await api.patch(`/job-posts/offers/${editingOfferId}/edit`, {
                description: editFields.desc,
                price: parseFloat(editFields.price),
                estimatedDays: editFields.days ? parseInt(editFields.days) : null,
                estimatedHours: editFields.hours ? parseInt(editFields.hours) : null,
            });
            setOffers(prev => prev.map(o => o.id === editingOfferId ? res.data : o));
            setEditingOfferId(null);
            emitOfferUpdated();
        } catch (error) {
            console.error('Error editing offer:', error);
            alert('No se pudo editar la propuesta.');
        }
    };

    const handleRemoveJobPost = async (offer: Offer) => {
        if (!confirm('¿Estás seguro de que quieres quitar este anuncio para que ya no reciba más propuestas?')) return;
        try {
            await api.patch(`/job-posts/${offer.jobPost.id}/status`, { status: 'CLOSED' });
            setOffers(prev =>
                prev.map(o =>
                    o.jobPost.id === offer.jobPost.id
                        ? { ...o, jobPost: { ...o.jobPost, status: 'CLOSED' } }
                        : o
                )
            );
            alert('El anuncio ha sido quitado exitosamente.');
        } catch (error: unknown) {
            console.error('Error removing job post:', error);
            alert((error as any)?.response?.data?.message || 'Error al quitar el anuncio');
        }
    };

    // ── "Ver Propuesta activa" button handler ─────────────────────
    const handleViewOffer = () => {
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
    };

    // ── Rating modal offer lookup ──────────────────────────────────
    const ratingOffer = ratingOfferId ? offers.find(o => o.id === ratingOfferId) : null;
    const ratingPeerName = ratingOffer
        ? (ratingOffer.senderId === user?.id ? ratingOffer.receiver : ratingOffer.sender).name
        : '';

    // ── Render ────────────────────────────────────────────────────
    return (
        <div className="flex w-full h-full bg-white overflow-hidden border-t border-gray-100">

            {/* Left sidebar — conversation list */}
            <ChatList
                chats={chats}
                loadingChats={loadingChats}
                peerId={peerId}
                currentUserId={user?.id}
            />

            {/* Centre column — messages */}
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
                                <button
                                    onClick={() => navigate('/app/chats')}
                                    className="md:hidden mr-3 p-1 rounded hover:bg-gray-200 transition-colors"
                                >
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
                                        <p className="text-sm font-bold text-gray-900 hover:text-yellow-600 transition-colors">
                                            {peerInfo?.name || 'Cargando...'}
                                        </p>
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

                        {/* Offers panel — mobile only (inline above messages) */}
                        <OffersMobilePanel
                            offers={offers}
                            showOffersSidebar={showOffersSidebar}
                            currentUserId={user?.id}
                            respondingOffer={respondingOffer}
                            editingOfferId={editingOfferId}
                            editFields={editFields}
                            reviewedOfferIds={reviewedOfferIds}
                            onClose={() => setShowOffersSidebar(false)}
                            onApprove={handleOfferApprove}
                            onRespond={handleOfferRespond}
                            onComplete={handleOfferComplete}
                            onStartEdit={handleStartEdit}
                            onCancelEdit={handleCancelEdit}
                            onEditFieldChange={handleEditFieldChange}
                            onEditSubmit={handleOfferEditSubmit}
                            onRemoveJobPost={handleRemoveJobPost}
                            onRate={setRatingOfferId}
                        />

                        {/* Rating modal */}
                        {ratingOfferId && ratingOffer && (
                            <RatingModal
                                offerId={ratingOfferId}
                                peerName={ratingPeerName}
                                onClose={() => setRatingOfferId(null)}
                                onReviewed={oid => setReviewedOfferIds(prev => new Set(prev).add(oid))}
                            />
                        )}

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
                                messages.map(msg => (
                                    <MessageBubble
                                        key={msg.id}
                                        msg={msg}
                                        isMine={msg.senderId === user?.id}
                                        onViewOffer={handleViewOffer}
                                    />
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input area */}
                        <ChatInput
                            newMessage={newMessage}
                            setNewMessage={setNewMessage}
                            sending={sending}
                            uploadingImage={uploadingImage}
                            onSend={() => handleSend()}
                            onFileChange={handleFileChange}
                        />
                    </>
                )}
            </div>

            {/* Right column — desktop offers sidebar */}
            <OffersDesktopSidebar
                offers={offers}
                showOffersSidebar={showOffersSidebar && !!peerId}
                currentUserId={user?.id}
                respondingOffer={respondingOffer}
                editingOfferId={editingOfferId}
                editFields={editFields}
                reviewedOfferIds={reviewedOfferIds}
                onClose={() => setShowOffersSidebar(false)}
                onApprove={handleOfferApprove}
                onRespond={handleOfferRespond}
                onComplete={handleOfferComplete}
                onStartEdit={handleStartEdit}
                onCancelEdit={handleCancelEdit}
                onEditFieldChange={handleEditFieldChange}
                onEditSubmit={handleOfferEditSubmit}
                onRemoveJobPost={handleRemoveJobPost}
                onRate={setRatingOfferId}
            />
        </div>
    );
};

export default ChatPage;
