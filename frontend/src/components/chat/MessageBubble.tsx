import type { Message } from './types';

interface MessageBubbleProps {
    msg: Message;
    isMine: boolean;
    /** Called when the user clicks "Ver Propuesta activa" inside a system-offer message */
    onViewOffer: () => void;
}

const MessageBubble = ({ msg, isMine, onViewOffer }: MessageBubbleProps) => {
    const isSystemOffer =
        msg.content.startsWith('[Propuesta]') || msg.content.startsWith('[Contra-propuesta]');

    return (
        <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                    isMine
                        ? 'bg-yellow-400 text-black rounded-br-md block'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md block'
                }`}
            >
                {/* Optional image attachment */}
                {msg.imageUrl && (
                    <div className="mb-2 rounded-lg overflow-hidden border border-black/10">
                        <img
                            src={msg.imageUrl}
                            alt="Adjunto"
                            className="max-w-full h-auto max-h-60 object-contain"
                        />
                    </div>
                )}

                {/* Text content */}
                {isSystemOffer ? (
                    <div className="space-y-2">
                        <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                        <button
                            onClick={onViewOffer}
                            className={`mt-2 text-xs px-3 py-1.5 rounded font-bold w-full text-center transition-colors shadow-sm ${
                                isMine
                                    ? 'bg-yellow-500 hover:bg-yellow-600 text-yellow-900 border border-yellow-600/20'
                                    : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-800'
                            }`}
                        >
                            Ver Propuesta activa
                        </button>
                    </div>
                ) : (
                    <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                )}

                {/* Timestamp */}
                <p className={`text-[10px] mt-1 ${isMine ? 'text-yellow-700' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
    );
};

export default MessageBubble;
