import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { API_URL, CALENDLY_URL_MEMBERS } from '../../config/api';

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState<{ customer_email?: string; customer?: { name?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    window.scrollTo(0, 0);
    if (sessionId) {
      fetch(`${API_URL}/api/session/${sessionId}`)
        .then(res => res.json())
        .then(data => {
          setSession(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const openCalendly = () => {
    if (window.Calendly) {
      window.Calendly.initPopupWidget({
        url: `${CALENDLY_URL_MEMBERS}?email=${encodeURIComponent(session?.customer_email || '')}&name=${encodeURIComponent(session?.customer?.name || '')}`
      });
    } else {
      window.open(CALENDLY_URL_MEMBERS, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFD4C4] via-[#FFF8F0] to-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 sm:p-12 text-center">
        <div className="w-20 h-20 bg-[#A8B89F] rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="ri-check-line text-4xl text-white"></i>
        </div>

        <h1 className="font-serif text-4xl font-bold text-[#2C2C2C] mb-4">
          Welcome to MyCarePA!
        </h1>

        <p className="text-lg text-[#6B6B6B] mb-8">
          {loading ? 'Loading...' : "Your subscription is now active. Let's schedule your first meeting with your personal assistant."}
        </p>

        <button
          onClick={openCalendly}
          className="w-full sm:w-auto px-10 py-4 bg-[#A8B89F] text-white text-lg font-semibold rounded-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer mb-6"
        >
          <i className="ri-calendar-line mr-2"></i>
          Schedule Your First Meeting
        </button>

        <div className="bg-[#FFF8F0] rounded-2xl p-6 mt-8">
          <h3 className="font-semibold text-[#2C2C2C] mb-3">
            <i className="ri-bookmark-line mr-2 text-[#A8B89F]"></i>
            Bookmark This Link for Future Bookings
          </h3>
          <p className="text-[#6B6B6B] text-sm mb-4">
            Save this link to schedule meetings anytime:
          </p>
          <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-200">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/schedule`}
              className="flex-1 bg-transparent text-sm text-[#6B6B6B] outline-none"
            />
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/schedule`)}
              className="px-3 py-1 bg-[#A8B89F] text-white text-sm rounded-lg hover:bg-[#8FA080] transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-[#6B6B6B]">
            Questions? Contact us anytime. We're here to help!
          </p>
          <Link to="/" className="text-[#A8B89F] hover:underline text-sm mt-2 inline-block">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
