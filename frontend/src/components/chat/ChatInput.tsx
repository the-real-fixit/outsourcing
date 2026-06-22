import { useRef } from 'react';
import { Paperclip, Send } from 'lucide-react';

interface ChatInputProps {
    newMessage: string;
    setNewMessage: (value: string) => void;
    sending: boolean;
    uploadingImage: boolean;
    onSend: () => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ChatInput = ({
    newMessage,
    setNewMessage,
    sending,
    uploadingImage,
    onSend,
    onFileChange,
}: ChatInputProps) => {
    // fileInputRef is internal — only this component needs it
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <div className="px-4 py-3 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2">
                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileChange}
                    accept="image/*,.pdf,.doc,.docx"
                    multiple
                    className="hidden"
                />

                {/* Paperclip button */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="p-2 text-gray-500 hover:text-yellow-600 transition-colors disabled:opacity-50"
                >
                    <Paperclip size={20} />
                </button>

                {/* Text input */}
                <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={uploadingImage ? 'Subiendo imagen...' : 'Escribe un mensaje...'}
                    disabled={uploadingImage}
                    className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm outline-none shadow-sm disabled:bg-gray-50"
                />

                {/* Send button */}
                <button
                    onClick={onSend}
                    disabled={sending || (!newMessage.trim() && !uploadingImage)}
                    className="p-2.5 bg-yellow-400 hover:bg-yellow-500 text-black rounded-full transition-colors disabled:opacity-40 shadow-sm flex-shrink-0"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
