import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Clock } from "lucide-react";

interface HomeProps {
  onExplore: () => void;
}

export function Home({ onExplore }: HomeProps) {
  return (
    <div className="min-h-screen flex items-center pt-16 px-4 sm:px-8 relative z-10">
      <div className="flex flex-col lg:flex-row items-center justify-between w-full max-w-7xl mx-auto gap-8 lg:gap-4">
        {/* Left — Copy */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-full lg:w-1/2"
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="w-2 h-2 rounded-full bg-lime pulse-dot shadow-[0_0_12px_#b7ff00]" />
            <span className="text-[10px] tracking-[4px] text-cyan font-bold">
              LORDS CAMPUS FOOD SYSTEM
            </span>
          </div>

          <h1 className="text-[clamp(2.8rem,7vw,6.5rem)] font-bold leading-[0.88] tracking-tight font-['Space_Grotesk']">
            ORDER
            <br />
            <span className="neon-cyan">SMART.</span>
            <br />
            SKIP THE WAIT.
          </h1>

          <p className="max-w-md text-gray-400 text-base leading-relaxed mt-6">
            Next-generation campus ordering designed for the Lords student
            community. Browse canteens, order in seconds, and track your food in
            real-time.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <button
              onClick={onExplore}
              className="group flex items-center gap-3 px-6 py-4 rounded-full bg-gradient-to-r from-cyan via-violet to-magenta text-white font-bold text-sm tracking-wider shadow-[0_0_35px_rgba(0,229,255,0.25)] hover:shadow-[0_0_55px_rgba(0,229,255,0.5)] hover:scale-105 transition-all duration-400"
            >
              EXPLORE CANTEENS
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-4 mt-10">
            {[
              { icon: Zap, label: "Instant Ordering" },
              { icon: Clock, label: "Live Queue Tracking" },
              { icon: Sparkles, label: "Zero Wait Pickup" },
            ].map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                className="glass-card flex items-center gap-2 px-4 py-2.5"
              >
                <f.icon className="w-4 h-4 text-cyan" />
                <span className="text-xs text-gray-300 font-medium">{f.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right — Hero visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full lg:w-1/2 flex items-center justify-center relative h-[400px] lg:h-[500px]"
          style={{ perspective: "1400px" }}
        >
          {/* Orbit rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] rounded-full border border-cyan/20"
            style={{ transform: "rotateX(68deg)" }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute w-[240px] h-[240px] sm:w-[300px] sm:h-[300px] rounded-full border border-violet/20"
            style={{ transform: "rotateY(68deg)" }}
          />
          <div className="absolute w-[200px] h-[200px] rounded-full bg-cyan/10 blur-[50px]" />

          {/* Floating burger image */}
          <motion.div
            animate={{ y: [0, -20, 0], rotateY: [-12, 5, -12] }}
            transition={{ duration: 5, repeat: Infinity, ease: "ease-in-out" }}
            className="relative z-10"
            style={{ transformStyle: "preserve-3d" }}
          >
            <img
              src="https://images.pexels.com/photos/18987002/pexels-photo-18987002.jpeg?auto=compress&cs=tinysrgb&h=400&w=400"
              alt="Gourmet burger"
              className="w-[240px] h-[240px] sm:w-[300px] sm:h-[300px] object-cover rounded-full border-2 border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.8)]"
            />
          </motion.div>

          {/* Floating chips */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "ease-in-out" }}
            className="absolute top-[15%] right-[5%] glass-card px-4 py-2.5 text-[10px] tracking-[3px] font-bold text-gray-200"
          >
            FRESH
          </motion.div>
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "ease-in-out", delay: 0.5 }}
            className="absolute bottom-[15%] left-[5%] glass-card px-4 py-2.5 text-[10px] tracking-[3px] font-bold text-lime"
          >
            FAST
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 h-11 border-t border-white/10 flex justify-center gap-8 sm:gap-16 items-center text-[9px] tracking-[3px] text-gray-600 z-40 bg-[#03030580] backdrop-blur-md">
        <span>SMART ORDERING</span>
        <span className="hidden sm:inline">REAL-TIME QUEUE</span>
        <span>LESS WAITING</span>
      </div>
    </div>
  );
}
