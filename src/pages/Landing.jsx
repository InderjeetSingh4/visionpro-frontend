import { motion } from 'framer-motion';
import { ArrowRight, Eye, ShieldCheck, Sparkles, Layers, Zap, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const scrollToFeatures = () => {
    document.getElementById('features-section').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start pt-20 pb-32 relative z-20 bg-[#F5F5F7] dark:bg-[#000000]">
      
      {/* Universal Frosted Apple Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full filter blur-[120px] bg-slate-300/40 dark:bg-zinc-900/40"></div>
        <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full filter blur-[120px] bg-gray-200/50 dark:bg-zinc-800/30"></div>
        <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      </div>

      {/* 🟢 NAVBAR (Cleaned up, Access Node removed) */}
      <nav className="w-full border-b border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-black/20 backdrop-blur-3xl fixed top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1D1D1F] dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-[#1D1D1F] shadow-sm">
              <Sparkles size={16} />
            </div>
            <span className="font-bold text-lg tracking-tight text-[#1D1D1F] dark:text-white">VisionPro</span>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Friendly System Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">AI System Online</span>
            </div>

            {/* Quick Link */}
            <button onClick={scrollToFeatures} className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#1D1D1F] dark:hover:text-white transition-colors">
                 Features
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.main initial="hidden" animate="visible" variants={fadeUp} className="max-w-5xl mx-auto px-6 text-center mb-32 mt-20 relative z-10">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1, ease: "easeOut" }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#1D1D1F] dark:bg-white animate-pulse"></span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">Smart Camera Software</span>
        </motion.div>
        
        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-8 leading-[1.1] text-[#1D1D1F] dark:text-white">
          Instantly understand <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-800 dark:from-zinc-100 dark:to-zinc-500">
            what your camera sees.
          </span>
        </h1>
        
        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
          Turn any standard webcam or smartphone into a smart AI camera. Automatically detect objects, count items, and track activity in real-time without any technical setup.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/auth')} className="w-full sm:w-auto px-8 py-4 bg-[#1D1D1F] dark:bg-white hover:bg-black dark:hover:bg-gray-200 text-white dark:text-[#1D1D1F] rounded-2xl font-bold text-sm flex items-center justify-center gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-colors">
            Open Dashboard <ArrowRight size={18} />
          </motion.button>
        </div>
      </motion.main>

      {/* Everyday User Feature Grid */}
      <motion.section id="features-section" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={{ visible: { transition: { staggerChildren: 0.2 } } }} className="w-full max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-32 relative z-10">
        {[
          { icon: Eye, title: "Use Any Camera", desc: "Easily connect your shop's computer webcam or use your phone's camera to start scanning immediately." },
          { icon: Zap, title: "Lightning Fast AI", desc: "Get instant results. The AI works in real-time to detect objects without slowing down your computer." },
          { icon: ShieldCheck, title: "100% Private & Secure", desc: "Your video feeds are completely private. We use bank-level security so only you can see your cameras." }
        ].map((feature, i) => (
          <motion.div key={i} variants={fadeUp} className="bg-white/60 dark:bg-[#18181b]/60 backdrop-blur-3xl border border-slate-200/50 dark:border-white/5 p-8 rounded-[2rem] text-left shadow-sm hover:shadow-xl transition-all duration-500 group">
            <div className="w-14 h-14 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-white/5 group-hover:scale-110 transition-transform duration-500">
              <feature.icon size={26} className="text-[#1D1D1F] dark:text-white" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-[#1D1D1F] dark:text-white tracking-tight">{feature.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* Simplified Bottom Call to Action */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="w-full max-w-5xl mx-auto px-6 text-center relative z-10">
        <div className="bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-3xl border border-slate-200/50 dark:border-white/10 p-10 sm:p-16 rounded-[2.5rem] shadow-md">
            <CheckCircle2 size={40} className="mx-auto mb-6 text-slate-400 dark:text-slate-500" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-[#1D1D1F] dark:text-white">Simple, but incredibly powerful.</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10">You don't need to be a tech expert to use AI. Just log in, connect your camera, and let the software do the heavy lifting for your business.</p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/auth')} className="px-8 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[#1D1D1F] dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 rounded-2xl font-bold text-sm shadow-sm transition-colors">
                Create Your Account
            </motion.button>
        </div>
      </motion.section>

    </div>
  );
};

export default Landing;