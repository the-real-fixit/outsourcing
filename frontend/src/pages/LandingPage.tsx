import LandingNavbar from '../components/landing/LandingNavbar';
import HeroCarousel from '../components/landing/HeroCarousel';
import RoleSelection from '../components/landing/RoleSelection';
import CategoryCarousel from '../components/landing/CategoryCarousel';
import HighlightedAds from '../components/landing/HighlightedAds';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-white">
            <LandingNavbar />

            <main>
                <div className="px-4">
                    <HeroCarousel />
                </div>

                <section className="mb-8">
                    <RoleSelection />
                </section>

                <section className="py-8 bg-gray-50 mb-12">
                    <h2 className="text-center text-2xl font-bold text-gray-800 mb-6">Categorías Populares</h2>
                    <CategoryCarousel />
                </section>

                <HighlightedAds />
            </main>

            <footer className="bg-gray-100 py-8 text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Fix it! - Tu plataforma de confianza
            </footer>
        </div>
    );
};

export default LandingPage;
