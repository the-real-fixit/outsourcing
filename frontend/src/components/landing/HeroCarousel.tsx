import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const images = [
    'https://images.unsplash.com/photo-1581578731117-104f2a8d27e9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', // Construcción/Reparación
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', // Oficina/Equipo
    'https://images.unsplash.com/photo-1556910103-1c02745a30bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'  // Cocina/Hogar
];

const HeroCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 5000); // Cambia cada 5 segundos

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-full h-[400px] md:h-[500px] bg-gray-900 overflow-hidden mx-auto my-8 max-w-7xl rounded-xl shadow-2xl">
            <AnimatePresence mode='wait'>
                <motion.img
                    key={currentIndex}
                    src={images[currentIndex]}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 w-full h-full object-cover"
                    alt="Servicios profesionales"
                />
            </AnimatePresence>

            {/* Overlay opcional para texto si se desea en el futuro */}
            <div className="absolute inset-0 bg-black/20" />
        </div>
    );
};

export default HeroCarousel;
