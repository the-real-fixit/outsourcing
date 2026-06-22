import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, User as UserIcon } from 'lucide-react';
import type { ChatSummary } from './types';

interface ChatListProps {
    chats: ChatSummary[];
    loadingChats: boolean;
    peerId: string | undefined;
    currentUserId: string | undefined;
}

const ChatList = ({ chats, loadingChats, peerId, currentUserId }: ChatListProps) => {
    const navigate = useNavigate();

    const getPeer = (chat: ChatSummary) =>
        chat.user1.id === currentUserId ? chat.user2 : chat.user1;

    return (
        <div className={`w-full md:w-80 border-r border-gray-100 flex flex-col ${peerId ? 'hidden md:flex' : 'flex'}`}>
            {/* Header */}
            <div className="px-4 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <MessageSquare size={20} className="mr-2 text-yellow-600" />
                    Mensajes
                </h2>
            </div>

            {/* List */}
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
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
                                    {peer.profile?.photoUrl ? (
                                        <img src={peer.profile.photoUrl} alt={peer.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon size={18} className="text-gray-400" />
                                    )}
                                </div>

                                {/* Name + last message */}
                                <div className="ml-3 flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{peer.name}</p>
                                    {lastMsg && (
                                        <p className="text-xs text-gray-500 truncate mt-0.5">
                                            {lastMsg.senderId === currentUserId ? 'Tú: ' : ''}{lastMsg.content}
                                        </p>
                                    )}
                                </div>

                                {/* Date + unread badge + profile button */}
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
                                        onClick={e => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            navigate(`/app/public-profile/${peer.id}`);
                                        }}
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
    );
};

export default ChatList;
