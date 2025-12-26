import OnboardingForm from '@/components/OnboardingForm';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 lg:p-24 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-5xl flex flex-col items-center">
        <div className="mb-12 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-slate-800/50 border border-slate-700 text-xs font-semibold text-blue-400 mb-4 backdrop-blur-sm">
            POWERED BY Oceanic6 Solutionz
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 font-outfit">
            Lead Genius <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">AI</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Autonomous multi-agent system for strategic market research and hyper-targeted lead discovery.
          </p>
        </div>

        <div className="glass-card w-full max-w-md p-8 rounded-2xl border-t border-white/10 shadow-2xl relative z-20">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl rotate-12 flex items-center justify-center shadow-lg border border-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>

          <div className="mt-8">
            <OnboardingForm />
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-slate-500 text-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700">1</div>
            <p>Company Research</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700">2</div>
            <p>ICP & Strategy</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700">3</div>
            <p>Lead Discovery</p>
          </div>
        </div>
      </div>
    </div>
  );
}
