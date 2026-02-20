export default function Footer() {
  const scrollToSection = (id: string) => {
    // Check if we're on the homepage
    const isHomePage = window.location.pathname === '/' || 
                       window.location.pathname === __BASE_PATH__ || 
                       window.location.pathname === __BASE_PATH__ + '/';
    
    if (isHomePage) {
      // If on homepage, just scroll to the section
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If on another page, navigate to homepage with hash
      const basePath = __BASE_PATH__ || '';
      window.location.href = `${basePath}/#${id}`;
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToHome = () => {
    if (window.location.pathname === '/' || window.location.pathname === __BASE_PATH__ || window.location.pathname === __BASE_PATH__ + '/') {
      scrollToTop();
    } else {
      window.location.href = __BASE_PATH__ || '/';
    }
  };

  return (
    <footer className="bg-[#2C2C2C] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-12 sm:mb-16">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <i className="ri-heart-fill text-[#A8B89F] text-2xl"></i>
              <span className="font-serif text-xl font-semibold">My Care Personal Assistant™</span>
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
              <li>
                <button onClick={() => scrollToSection('contact')} className="text-white hover:text-[#A8B89F] transition-colors duration-200 cursor-pointer">
                  Contact
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
                <a 
                  href="/privacy-policy" 
                  onClick={(e) => {
                    e.preventDefault();
                    window.REACT_APP_NAVIGATE('/privacy-policy');
                  }}
                  className="text-white hover:text-[#A8B89F] transition-colors duration-200 cursor-pointer"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="/terms-of-service" 
                  onClick={(e) => {
                    e.preventDefault();
                    window.REACT_APP_NAVIGATE('/terms-of-service');
                  }}
                  className="text-white hover:text-[#A8B89F] transition-colors duration-200 cursor-pointer"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a 
                  href="/assistant-guidelines" 
                  onClick={(e) => {
                    e.preventDefault();
                    window.REACT_APP_NAVIGATE('/assistant-guidelines');
                  }}
                  className="text-white hover:text-[#A8B89F] transition-colors duration-200 cursor-pointer"
                >
                  Assistant Guidelines
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Stay Connected
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Get updates and tips for making the most of your MyCarePA personal assistant.
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2 bg-transparent border border-gray-600 rounded-lg focus:border-[#A8B89F] focus:outline-none text-white placeholder-gray-500 text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#A8B89F] rounded-lg hover:bg-[#8FA080] transition-colors duration-200 cursor-pointer whitespace-nowrap"
              >
                <i className="ri-arrow-right-line text-white"></i>
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-gray-400">
          <p className="text-center md:text-left">© 2025 My Care Personal Assistant™. All rights reserved.</p>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-center">
            <p>All assistants are trained professionals</p>
            <span className="hidden sm:inline">•</span>
            <p>Conversations are confidential</p>
            <span className="hidden sm:inline">•</span>
            <p>Clear boundaries respected</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a 
            href="https://readdy.ai/?ref=logo" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-[#A8B89F] transition-colors duration-200 text-sm cursor-pointer"
          >
            Powered by Readdy
          </a>
        </div>
      </div>
    </footer>
  );
}
