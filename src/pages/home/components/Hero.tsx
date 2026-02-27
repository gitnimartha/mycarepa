import { Link } from 'react-router-dom';

export default function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="min-h-screen flex items-center bg-gradient-to-br from-[#FFD4C4] via-[#FFF8F0] to-[#FFF8F0] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-transparent"></div>
      <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-5 gap-12 items-center relative z-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <i className="ri-heart-fill text-[#A8B89F] text-2xl"></i>
            <span className="text-sm font-medium text-[#6B6B6B] uppercase tracking-wider">
              Real Human Support
            </span>
          </div>
          <h1 className="font-serif text-5xl lg:text-6xl font-bold text-[#2C2C2C] leading-tight">
            My Care Personal Assistant™
          </h1>
          <h2 className="text-2xl text-[#2C2C2C] font-light">
            Your personal assistant when you need help most
          </h2>
          <p className="text-lg text-[#6B6B6B] leading-relaxed">
            Life doesn't come with instructions. You don't have to figure everything out alone.
            MyCarePA, My Care Personal Assistant™, connects you with a real, trained human who helps you work
            through challenges, stay organized, and move forward.
          </p>
          <p className="text-lg text-[#6B6B6B] leading-relaxed">
            No scripts. No bots. You'll be matched with a person who listens and cares.
          </p>
          <div className="pt-4 flex flex-col items-start gap-3">
            <button
              onClick={() => scrollToSection('pricing')}
              className="group relative w-full sm:w-auto px-10 py-4 bg-[#A8B89F] text-white text-lg font-semibold rounded-full overflow-hidden transition-all duration-300 whitespace-nowrap cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:scale-105"
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                Get Started
                <i className="ri-arrow-right-line text-xl transition-transform duration-300 group-hover:translate-x-1"></i>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#A8B89F] via-[#8FA085] to-[#A8B89F] bg-[length:200%_100%] animate-shimmer"></div>
            </button>
            <Link
              to="/schedule"
              className="text-[#6B6B6B] hover:text-[#A8B89F] transition-colors text-sm font-medium inline-flex items-center gap-1"
            >
              <i className="ri-calendar-check-line"></i>
              Already a member? Schedule a meeting
              <i className="ri-arrow-right-s-line"></i>
            </Link>
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#A8B89F]/20 to-transparent rounded-3xl transform rotate-3"></div>
            <img
              src="https://readdy.ai/api/search-image?query=A%20warm%20and%20caring%20diverse%20personal%20assistant%20sitting%20in%20a%20bright%20plant%20filled%20home%20office%20with%20natural%20wood%20tones%20and%20soft%20lighting%20smiling%20warmly%20during%20a%20video%20call%20on%20laptop%20looking%20toward%20the%20left%20side%20of%20the%20screen%20with%20genuine%20caring%20expression%20professional%20yet%20approachable%20atmosphere%20soft%20focus%20background%20with%20green%20plants%20and%20cream%20colored%20walls&width=800&height=600&seq=hero001&orientation=landscape"
              alt="Caring personal assistant"
              className="relative rounded-3xl shadow-2xl w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
