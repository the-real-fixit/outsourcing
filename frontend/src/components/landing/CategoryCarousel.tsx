import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const defaultIconMapping: Record<string, string> = {
    'Electricista': 'Zap',
    'Plomería': 'Wrench',
    'Pintura': 'Paintbrush',
    'Carpintería': 'Hammer',
    'Mudanza': 'Truck',
    'Jardinería': 'Scissors',
    'Técnico': 'Monitor',
    'Albañil': 'Hammer',
    'Paseo de mascotas': 'Dog',
    'Cuidado de mascotas': 'PawPrint',
    'Limpieza': 'Sparkles',
    'Fotografía': 'Camera',
    'Clases': 'GraduationCap',
};

const fallbackCategories = Object.keys(defaultIconMapping).map(name => ({
    name,
    iconStr: defaultIconMapping[name]
}));

const CategoryCarousel = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const [categories, setCategories] = useState<{ id?: string, name: string, iconStr: string }[]>([]);
    const isScrolling = useRef(false);
    const [isMd, setIsMd] = useState(false);

    useEffect(() => {
        const check = () => setIsMd(window.innerWidth >= 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('/categories');
                const catsToUse = response.data.length > 0
                    ? response.data.map((cat: { id: string, name: string, iconUrl?: string, jobCount?: number }) => ({
                        id: cat.id,
                        name: cat.name,
                        iconStr: defaultIconMapping[cat.name] || 'Wrench'
                    }))
                    : fallbackCategories;
                setCategories([...catsToUse, ...catsToUse, ...catsToUse]);
            } catch {
                setCategories([...fallbackCategories, ...fallbackCategories, ...fallbackCategories]);
            }
        };
        fetchCategories();
    }, []);

    // Jump to middle set so both directions can loop
    useEffect(() => {
        if (categories.length === 0) return;
        const el = scrollRef.current;
        if (!el) return;
        requestAnimationFrame(() => { el.scrollLeft = el.scrollWidth / 3; });
    }, [categories]);

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el || isScrolling.current) return;
        const third = el.scrollWidth / 3;
        if (el.scrollLeft >= third * 2) {
            isScrolling.current = true;
            el.scrollLeft -= third;
            isScrolling.current = false;
        } else if (el.scrollLeft <= 0) {
            isScrolling.current = true;
            el.scrollLeft += third;
            isScrolling.current = false;
        }
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener('scroll', handleScroll);
        return () => el.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const scroll = (direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        // item min-w + gap: ~116px on md, ~96px on smaller
        const isMd = window.innerWidth >= 768;
        const itemWidth = isMd ? 116 : 96;
        const visibleItems = Math.max(1, Math.floor(el.clientWidth / itemWidth));
        el.scrollBy({
            left: direction === 'left' ? -(itemWidth * visibleItems) : (itemWidth * visibleItems),
            behavior: 'smooth',
        });
    };

    const baseLength = Math.round(categories.length / 3);

    /*
     * Vertical alignment math (desktop, md+):
     *   - Scroll strip top padding: py-4 = 16px
     *   - Circle height: h-20 = 80px  →  circle center at 16 + 40 = 56px from strip top
     *   - Button (p-2 + h-6/w-6 icon) ≈ 40px tall  → half = 20px
     *   - Button top = 56px - 20px = 36px  → but with -translate-y-1/2 just set top to [56px]
     *
     * We set `top-[56px]` on absolute buttons and `-translate-y-1/2` to center them.
     * The relative wrapper has zero extra padding, so reference is exactly the strip top.
     *
     * Responsive circle sizes:
     *   mobile  → h-14 (56px), center at 16+28=44px  (buttons hidden, doesn't matter)
     *   sm      → h-16 (64px), center at 16+32=48px  (buttons still hidden)
     *   md+     → h-20 (80px), center at 16+40=56px  ✓
     */

    /*
     * Alignment math (md+):
     *   py-4 top padding on scroll strip = 16px
     *   circle h-20 = 80px, center at 16 + 40 = 56px from strip top
     *   button height ≈ 40px (p-2 + h-6 icon), half = 20px
     *   mt-9 = 36px → button center = 36 + 20 = 56px ✓
     */
    return (
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
            <div className="flex items-start">

                {/* LEFT button — flex sibling, mt-9 = 36px aligns center with circle center */}
                <button
                    onClick={() => scroll('left')}
                    className="hidden md:flex flex-shrink-0 mt-9 items-center justify-center p-2 rounded-full bg-white shadow-md hover:bg-gray-50 z-10"
                >
                    <Icons.ChevronLeft className="h-6 w-6 text-yellow-500" />
                </button>

                {/* Fade mask — flex-1 fills remaining width between buttons.
                     overflow-hidden clips circles at the edges.
                     mask-image fades the first/last 40px so partial circles dissolve. */}
                <div
                    className="flex-1 overflow-hidden"
                    style={isMd ? {
                        maskImage: 'linear-gradient(to right, transparent 0px, black 40px, black calc(100% - 40px), transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to right, transparent 0px, black 40px, black calc(100% - 40px), transparent 100%)',
                    } : {}}
                >
                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto gap-5 sm:gap-6 md:gap-8 py-4 no-scrollbar"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        scrollSnapType: 'x mandatory',
                    }}
                >
                    {categories.map((cat, index) => {
                        const IconComponent = (Icons as any)[cat.iconStr] || Icons.HelpCircle;
                        const originalCat = categories[index % baseLength] ?? cat;

                        return (
                            <motion.div
                                key={index}
                                whileHover={{ scale: 1.07 }}
                                whileTap={{ scale: 0.97 }}
                                style={{ scrollSnapAlign: 'start' }}
                                className="flex flex-col items-center flex-shrink-0 w-14 sm:w-16 md:w-20 cursor-pointer"
                                onClick={() => {
                                    if (originalCat.id) navigate(`/app/category/${originalCat.id}`);
                                }}
                            >
                                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-yellow-300 flex items-center justify-center shadow-sm mb-2 md:mb-3 text-black">
                                    <IconComponent className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                                </div>
                                <span className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-700 text-center leading-tight">
                                    {cat.name}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
                </div>{/* end clip area */}

                {/* RIGHT button — same mt-9 alignment */}
                <button
                    onClick={() => scroll('right')}
                    className="hidden md:flex flex-shrink-0 mt-9 items-center justify-center p-2 rounded-full bg-white shadow-md hover:bg-gray-50 z-10"
                >
                    <Icons.ChevronRight className="h-6 w-6 text-yellow-500" />
                </button>
            </div>
        </div>
    );
};

export default CategoryCarousel;
