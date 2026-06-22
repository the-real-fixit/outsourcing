import { FileText, X } from 'lucide-react';
import type { Offer } from './types';
import OfferCard from './OfferCard';
import type { EditFields } from './OfferCard';

interface OffersSidebarProps {
    offers: Offer[];
    showOffersSidebar: boolean;
    currentUserId: string | undefined;
    respondingOffer: string | null;
    editingOfferId: string | null;
    editFields: EditFields;
    reviewedOfferIds: Set<string>;

    // Sidebar visibility
    onClose: () => void;

    // OfferCard callbacks
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

/**
 * Renders the shared props object passed to every OfferCard.
 * Extracted to avoid repeating the same spread twice.
 */
const useCardProps = (props: Omit<OffersSidebarProps, 'offers' | 'showOffersSidebar' | 'onClose'>) => ({
    currentUserId: props.currentUserId,
    respondingOffer: props.respondingOffer,
    editingOfferId: props.editingOfferId,
    editFields: props.editFields,
    reviewedOfferIds: props.reviewedOfferIds,
    onApprove: props.onApprove,
    onRespond: props.onRespond,
    onComplete: props.onComplete,
    onStartEdit: props.onStartEdit,
    onCancelEdit: props.onCancelEdit,
    onEditFieldChange: props.onEditFieldChange,
    onEditSubmit: props.onEditSubmit,
    onRemoveJobPost: props.onRemoveJobPost,
    onRate: props.onRate,
});

// ── Mobile panel — inline above the messages list ────────────────
export const OffersMobilePanel = (props: OffersSidebarProps) => {
    const cardProps = useCardProps(props);
    if (props.offers.length === 0) return null;
    return (
        <div
            id="offers-panel-mobile"
            className="lg:hidden px-4 py-2 border-b border-gray-100 bg-yellow-50/50 max-h-56 overflow-y-auto space-y-2 transition-colors duration-500"
        >
            {props.offers.map(offer => (
                <OfferCard key={offer.id} offer={offer} {...cardProps} />
            ))}
        </div>
    );
};

// ── Desktop sidebar — right column ───────────────────────────────
export const OffersDesktopSidebar = (props: OffersSidebarProps) => {
    const cardProps = useCardProps(props);
    if (props.offers.length === 0 || !props.showOffersSidebar) return null;
    return (
        <div
            id="offers-sidebar"
            className="hidden lg:flex flex-col w-80 lg:w-96 border-l border-gray-100 bg-gray-50/30 flex-shrink-0 transition-all duration-500"
        >
            <div className="p-4 border-b border-gray-100 bg-white shadow-sm z-10 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 flex items-center">
                    <FileText size={18} className="mr-2 text-yellow-600" />
                    Propuestas Activas
                </h3>
                <button
                    onClick={props.onClose}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {props.offers.map(offer => (
                    <OfferCard key={offer.id} offer={offer} {...cardProps} />
                ))}
            </div>
        </div>
    );
};

/**
 * Default export bundles both panels for convenience.
 * ChatPage uses the named exports directly to place them at the
 * correct DOM positions (mobile inline vs. desktop right column).
 */
const OffersSidebar = (props: OffersSidebarProps) => (
    <>
        <OffersMobilePanel {...props} />
        <OffersDesktopSidebar {...props} />
    </>
);

export default OffersSidebar;
