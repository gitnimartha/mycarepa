import { Link } from 'react-router-dom';

export default function Footer() {
  const scrollToSection = (id: string) => {
    // Check if we're on the homepage
    const isHomePage = window.location.pathname === '/';

    if (isHomePage) {
      // If on homepage, just scroll to the section
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If on another page, navigate to homepage with hash
      window.location.href = `/#${id}`;
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToHome = () => {
    if (window.location.pathname === '/') {
      scrollToTop();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <footer className="bg-[#2C2C2C] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-12 sm:mb-16">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <i className="ri-heart-fill text-[#A8B89F] text-2xl"></i>
              <span className="font-serif text-xl font-semibold">My Care Personal Assistant</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Real human support when you need help most. Personal assistance for everyone.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <button onClick={goToHome} className="text-white hover:text-[#A8B89F] transition-colors duration-200 cursor-pointer">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('how-it-works')} className="text-white hover:text-[#A8B89F] transition-colors duration-200 cursor-pointer">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('services')} className="text-white hover:text-[#A8B89F] transition-colors duration-200 cursor-pointer">
                  Services
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('pricing')} className="text-white hover:text-[#A8B89F] transition-colors duration-200 cursor-pointer">
                  Pricing
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy-policy" className="text-white hover:text-[#A8B89F] transition-colors duration-200">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-white hover:text-[#A8B89F] transition-colors duration-200">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/assistant-guidelines" className="text-white hover:text-[#A8B89F] transition-colors duration-200">
                  Assistant Guidelines
                </Link>
              </li>
              <li>
                <Link to="/schedule" className="text-white hover:text-[#A8B89F] transition-colors duration-200">
                  Schedule Meeting
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Contact
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Ready to get started? We're here to help.
            </p>
            <a
              href="mailto:support@mycarepersonalassistant.com"
              className="text-[#A8B89F] hover:underline text-sm"
            >
              support@mycarepersonalassistant.com
            </a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-gray-400">
          <p className="text-center md:text-left">© 2025 My Care Personal Assistant. All rights reserved.</p>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-center">
            <p>All assistants are trained professionals</p>
            <span className="hidden sm:inline">|</span>
            <p>Conversations are confidential</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
