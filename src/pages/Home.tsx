import { motion } from "framer-motion";
import { ArrowRight, Clock3, CreditCard, ShoppingBag } from "lucide-react";

interface HomeProps {
  onExplore: () => void;
}

export function Home({ onExplore }: HomeProps) {
  return (
    <div className="min-h-screen flex items-center pt-20 pb-24 md:pb-12 px-4 sm:px-8 relative z-10">
      <div className="flex flex-col lg:flex-row items-center justify-between w-full max-w-7xl mx-auto gap-8 lg:gap-12">
        {/* Left — Copy */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-full lg:w-1/2"
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="w-2 h-2 rounded-full bg-lime pulse-dot" />
            <span className="text-xs tracking-[0.18em] text-cyan font-bold">
              FRESH FROM YOUR CAMPUS CANTEENS
            </span>
          </div>

          <h1 className="text-[clamp(2.8rem,7vw,6rem)] font-bold leading-[0.98] tracking-tight font-['Space_Grotesk']">
            Good food.
            <br />
            <span className="neon-cyan">Less waiting.</span>
          </h1>

          <p className="max-w-lg text-gray-400 text-base sm:text-lg leading-relaxed mt-6">
            Browse campus menus, order your favourites, and follow your order
            from preparation to pickup—all in one place.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <button
              onClick={onExplore}
              className="group flex items-center gap-3 min-h-12 px-6 py-3.5 rounded-full bg-gradient-to-r from-cyan to-violet text-white font-bold text-sm tracking-wide shadow-[0_0_35px_rgba(0,229,255,0.25)] hover:shadow-[0_0_55px_rgba(0,229,255,0.5)] hover:brightness-110 transition-all"
            >
              Browse canteens
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10 max-w-2xl">
            {[
              { icon: ShoppingBag, label: "Order ahead" },
              { icon: Clock3, label: "Live order updates" },
              { icon: CreditCard, label: "Secure checkout" },
            ].map((feature, i) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                className="glass-card flex items-center gap-3 px-4 py-3"
              >
                <feature.icon className="w-4 h-4 text-cyan flex-shrink-0" />
                <span className="text-xs text-gray-300 font-medium">{feature.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right — Hero visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full lg:w-1/2 flex items-center justify-center relative min-h-[320px] sm:min-h-[440px]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative w-full max-w-[520px] aspect-[1.12] overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl shadow-black/40"
            onPointerMove={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              const spotlight = event.currentTarget.querySelector<HTMLElement>(".hero-spotlight");
              if (!spotlight) return;
              const x = event.clientX - bounds.left;
              const y = event.clientY - bounds.top;
              spotlight.style.backgroundImage = `radial-gradient(240px circle at ${x}px ${y}px, rgba(0, 229, 255, 0.2), transparent 78%)`;
            }}
            onPointerLeave={(event) => {
              const spotlight = event.currentTarget.querySelector<HTMLElement>(".hero-spotlight");
              if (spotlight) spotlight.style.backgroundImage = "none";
            }}
          >
            <img
              src="/menu-images/chicken-burger.jpg"
              alt="Freshly made chicken burger served with crispy greens"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
            <div
              aria-hidden="true"
              className="hero-spotlight absolute inset-0"
            />
            <div className="absolute left-5 bottom-5 right-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-lime" />
                Made fresh on campus
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

    </div>
  );
}
