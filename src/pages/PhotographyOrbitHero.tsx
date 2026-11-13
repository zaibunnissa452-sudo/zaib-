import { useEffect, useState } from "react";
import { motion, useAnimationFrame, useMotionValue, useTransform } from "framer-motion";
import { GoldParticles } from "../components/GoldParticles";

type OrbitEvent = {
  storyIndex: number;
  image: string;
  title: string;
  label: string;
};

type Props = {
  events: readonly OrbitEvent[];
  portrait: string;
  onOpenStory: (storyIndex: number) => void;
};

function OrbitCard({
  event,
  index,
  rotation,
  radiusX,
  radiusY,
  onOpenStory,
}: {
  event: OrbitEvent;
  index: number;
  rotation: ReturnType<typeof useMotionValue<number>>;
  radiusX: number;
  radiusY: number;
  onOpenStory: (storyIndex: number) => void;
}) {
  const transform = useTransform(rotation, (degrees) => {
    const angle = ((degrees + index * 60) * Math.PI) / 180;
    const sine = Math.sin(angle);
    const x = Math.cos(angle) * radiusX;
    const y = sine * radiusY;
    const z = sine * 105;
    const scale = 0.78 + ((sine + 1) / 2) * 0.22;
    const tilt = Math.cos(angle) * -7;
    return `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${z}px) rotateY(${tilt}deg) scale(${scale})`;
  });
  const depthOrder = useTransform(rotation, (degrees) => {
    const angle = ((degrees + index * 60) * Math.PI) / 180;
    return Math.sin(angle) > 0 ? 26 : 12;
  });
  const opacity = useTransform(rotation, (degrees) => {
    const angle = ((degrees + index * 60) * Math.PI) / 180;
    return 0.78 + ((Math.sin(angle) + 1) / 2) * 0.22;
  });

  return (
    <motion.button
      className="photo-orbit-card"
      type="button"
      style={{ transform, zIndex: depthOrder, opacity }}
      onClick={() => onOpenStory(event.storyIndex)}
      aria-label={`View Style Studio photograph: ${event.title}`}
    >
      <img src={event.image} alt={event.title} />
      <span className="photo-orbit-card-edge" />
      <span className="photo-orbit-card-meta"><i /> REAL EVENT</span>
      <span className="photo-orbit-card-caption">{event.label}</span>
    </motion.button>
  );
}

export function PhotographyOrbitHero({ events, portrait, onOpenStory }: Props) {
  const rotation = useMotionValue(0);
  const [paused, setPaused] = useState(false);
  const [width, setWidth] = useState(() => (typeof window === "undefined" ? 1280 : window.innerWidth));
  const radiusX = Math.min(width * (width < 560 ? 0.34 : 0.36), 455);
  const radiusY = width < 560 ? 138 : width < 900 ? 125 : 160;

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useAnimationFrame((_time, delta) => {
    if (!paused) rotation.set((rotation.get() + Math.min(delta, 50) * 0.02) % 360);
  });

  return (
    <section className="photo-orbit-hero" id="home" aria-label="Style Studio event photography">
      <GoldParticles particleCount={42} speed={0.32} />
      <div className="photo-orbit-topline">
        <span>WEDDINGS ACROSS ALL FAITHS &amp; TRADITIONS</span>
        <span>HYDERABAD · INDIA</span>
      </div>

      <motion.div
        className="photo-orbit-copy"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.08 }}
      >
        <p className="photo-orbit-eyebrow"><i /> THE PEOPLE, THE PROMISES, THE IN-BETWEEN MOMENTS</p>
        <h1>Every tradition <em>deserves to be remembered.</em></h1>
        <p className="photo-orbit-description">
          Photography and videography for Hindu, Muslim, Christian, Sikh, Buddhist, Jewish, Jain, interfaith, and other wedding traditions.
        </p>
      </motion.div>

      <div className="photo-orbit-services" aria-label="Style Studio event services">
        <a href="#event-services"><strong>WEDDINGS</strong><span>Photography + video</span></a>
        <a href="#event-services"><strong>BIRTHDAYS</strong><span>Photography + video</span></a>
        <a href="#event-services"><strong>PRESS EVENTS</strong><span>Photography only</span></a>
        <a href="#event-services"><strong>BRANDS &amp; BUSINESS</strong><span>Photography + launches</span></a>
      </div>

      <div className="photo-orbit-stage" aria-label="Six real event photographs continuously orbit around Saleem">
        <div className="photo-orbit-aura" aria-hidden="true" />
        <div className="photo-orbit-ring photo-orbit-ring-back" aria-hidden="true" />
        <div className="photo-orbit-ring photo-orbit-ring-front" aria-hidden="true" />
        {events.map((event, index) => (
          <OrbitCard
            key={`${event.storyIndex}-${event.title}`}
            event={event}
            index={index}
            rotation={rotation}
            radiusX={radiusX}
            radiusY={radiusY}
            onOpenStory={onOpenStory}
          />
        ))}
        <button
          className="photo-orbit-motion-toggle"
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-pressed={paused}
          aria-label={paused ? "Resume revolving event photographs" : "Pause revolving event photographs"}
        >
          <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>{paused ? "RESUME ORBIT" : "PAUSE ORBIT"}
        </button>
        <motion.div
          className="photo-orbit-portrait"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <img src={portrait} alt="Mohammed Saleemuddin, Style Studio photographer in Hyderabad" />
        </motion.div>
        <div className="photo-orbit-center-label" aria-hidden="true">STYLE STUDIO <span>·</span> REAL STORIES</div>
      </div>

      <div className="photo-orbit-bottomline">
        <span><i /> SIX MOMENTS FROM THE STYLE STUDIO ARCHIVE</span>
        <a className="photo-orbit-cta" href="#contact">Tell us what you’re planning <b>↗</b></a>
        <a className="photo-orbit-scroll" href="#event-services">SCROLL TO EXPLORE <b>↓</b></a>
      </div>
    </section>
  );
}
