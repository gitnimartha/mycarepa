import { Link } from 'react-router-dom';

interface StickyBannerProps {
  show: boolean;
}

export default function StickyBanner({ show }: StickyBannerProps) {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 bg-[#FFF8F0] shadow-md transition-transform duration-300 ${
        show ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <i className="ri-heart-fill text-[#A8B89F] text-xl"></i>
          <span className="font-serif text-lg font-semibold text-[#2C2C2C]">
            My Care Personal Assistant™
          </span>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 w-full md:w-auto">
          <Link
            to="/schedule"
            className="w-full md:w-auto px-6 py-2.5 bg-[#A8B89F] text-white rounded-full font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 whitespace-nowrap text-center"
          >
            Schedule Time
          </Link>
          <button
            onClick={() => scrollToSection('pricing')}
            className="group relative w-full md:w-auto px-6 py-2.5 border-2 border-[#A8B89F] text-[#A8B89F] rounded-full font-medium overflow-hidden transition-all duration-300 whitespace-nowrap cursor-pointer hover:scale-105 hover:shadow-md"
          >
            <span className="relative z-10 inline-flex items-center gap-2">
              View Plans
              <i className="ri-eye-line text-lg transition-all duration-300 group-hover:scale-110"></i>
            </span>
            <div className="absolute inset-0 bg-[#A8B89F] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="inline-flex items-center gap-2">
                View Plans
                <i className="ri-eye-line text-lg"></i>
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
