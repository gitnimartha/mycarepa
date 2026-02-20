export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: 'Get matched with a personal assistant',
      description: "You'll be paired with a trained assistant who becomes your primary point of contact.",
      icon: 'ri-user-heart-line'
    },
    {
      number: 2,
      title: 'Have a real conversation',
      description: 'Your first call is about understanding you—your situation, your goals, and what you need help with.',
      icon: 'ri-chat-smile-3-line'
    },
    {
      number: 3,
      title: 'Get ongoing support',
      description: 'Your assistant checks in, helps you prioritize, and supports you through calls, messages, and follow-ups.',
      icon: 'ri-calendar-check-line'
    },
    {
      number: 4,
      title: 'Adjust as you go',
      description: 'What you need today may change tomorrow. Your assistant adapts with you.',
      icon: 'ri-refresh-line'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-[#A8B89F]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-white">
            How It Works
          </h2>
          <div className="w-24 h-1 bg-[#2C2C2C] mx-auto mt-6"></div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-[#FFD4C4] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {step.number}
                </div>
                <div className="w-16 h-16 flex items-center justify-center">
                  <i className={`${step.icon} text-5xl text-[#A8B89F]`}></i>
                </div>
                <h3 className="font-serif text-xl font-semibold text-[#2C2C2C] leading-tight">
                  {step.title}
                </h3>
                <p className="text-[#6B6B6B] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <img
            src="https://readdy.ai/api/search-image?query=A%20satisfied%20client%20smiling%20with%20relief%20and%20happiness%20looking%20toward%20the%20right%20side%20of%20screen%20in%20a%20comfortable%20home%20setting%20with%20warm%20natural%20lighting%20soft%20focus%20background%20showing%20peace%20of%20mind%20and%20contentment%20after%20receiving%20support%20professional%20photography&width=600&height=400&seq=satisfied001&orientation=landscape"
            alt="Satisfied client"
            className="rounded-3xl shadow-2xl max-w-2xl w-full h-auto object-cover"
          />
        </div>
      </div>
    </section>
  );
}
