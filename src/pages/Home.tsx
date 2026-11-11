import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock3,
  CreditCard,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

interface HomeProps {
  onExplore: () => void;
  onTrackOrder: () => void;
}

export function Home({ onExplore, onTrackOrder }: HomeProps) {
  const features = [
    {
      icon: ShoppingBag,
      label: "Order ahead",
      description: "Browse campus menus in one place.",
    },
    {
      icon: Clock3,
      label: "Live order updates",
      description: "Follow your order as it’s prepared.",
    },
    {
      icon: CreditCard,
      label: "Simple checkout",
      description: "A smooth path from menu to pickup.",
    },
  ];

  return (
    <div className="app-page relative z-10 flex min-h-screen items-start px-4 pb-24 pt-24 sm:px-8 md:pb-16">
      <div
        className="liquid-hero-shell my-auto mx-auto grid w-full max-w-7xl items-center gap-10 p-5 sm:gap-12 sm:p-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:p-12"
        onPointerMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty(
            "--pointer-x",
            `${((event.clientX - bounds.left) / bounds.width) * 100}%`,
          );
          event.currentTarget.style.setProperty(
            "--pointer-y",
            `${((event.clientY - bounds.top) / bounds.height) * 100}%`,
          );
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-cyan/20 bg-cyan/[0.06] px-3.5 py-2">
            <Sparkles className="h-3.5 w-3.5 text-cyan" />
            <span className="text-[10px] font-bold tracking-[0.16em] text-cyan sm:text-xs">
              LORDS CAMPUS · SMART CANTEEN
            </span>
          </div>

          <h1 className="font-['Space_Grotesk'] text-[clamp(3.2rem,7.2vw,6.6rem)] font-bold leading-[0.94] tracking-[-0.055em]">
            Campus food,
            <br />
            <span className="bg-gradient-to-r from-cyan via-[#72f0ff] to-violet bg-clip-text text-transparent">
              on your time.
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-gray-400 sm:text-lg sm:leading-8">
            Discover what’s cooking across campus, order your favourites, and
            stay in the loop until it’s time to pick up.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button
              onClick={onExplore}
              className="group flex min-h-12 items-center gap-3 rounded-full bg-gradient-to-r from-cyan to-violet px-6 py-3.5 text-sm font-bold tracking-wide text-white shadow-[0_0_35px_rgba(0,229,255,0.2)] transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_0_50px_rgba(0,229,255,0.38)]"
            >
              Explore canteens
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onTrackOrder}
              className="min-h-12 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-white/85 transition-all hover:border-cyan/30 hover:bg-cyan/[0.06] hover:text-white"
            >
              Track an order
            </button>
          </div>

          <div className="mt-12 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.1, duration: 0.5 }}
                className="glass-card liquid-feature-card group rounded-2xl p-4 sm:p-4"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-cyan/15 bg-cyan/[0.07] transition-colors group-hover:border-cyan/30 group-hover:bg-cyan/[0.12]">
                  <feature.icon className="h-4 w-4 text-cyan" />
                </div>
                <h2 className="text-sm font-semibold text-white">{feature.label}</h2>
                <p className="mt-1.5 text-xs leading-5 text-gray-500">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="liquid-visual relative flex min-h-[340px] w-full items-center justify-center sm:min-h-[460px]"
        >
          <div aria-hidden="true" className="liquid-orb liquid-orb-cyan" />
          <div aria-hidden="true" className="liquid-orb liquid-orb-violet" />
          <div aria-hidden="true" className="liquid-orb liquid-orb-magenta" />
          <motion.div
            whileHover={{ y: -5, rotate: 0.3 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="liquid-food-card relative aspect-[1.08] w-full max-w-[560px] overflow-hidden rounded-[2rem] bg-void-light"
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
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-black/70" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-transparent" />
            <div className="liquid-image-sheen absolute inset-0" />
            <div
              aria-hidden="true"
              className="hero-spotlight absolute inset-0 transition-opacity"
            />
            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5 sm:p-7">
              <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-white/90 backdrop-blur-xl">
                CAMPUS FAVORITES
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/30 text-cyan backdrop-blur-xl">
                <Sparkles className="h-4 w-4" />
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-lime pulse-dot" />
                Fresh from your campus canteens
              </span>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium tracking-wide text-white/65">
                    GOOD FOOD, RIGHT ON CAMPUS
                  </p>
                  <p className="mt-1 font-['Space_Grotesk'] text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    Your next break starts here.
                  </p>
                </div>
                <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md sm:flex">
                  <ArrowRight className="h-5 w-5 -rotate-45" />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
