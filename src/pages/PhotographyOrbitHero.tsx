import { useEffect, useState } from "react";
import { motion, useAnimationFrame, useMotionValue, useTransform } from "framer-motion";

type OrbitEvent = {
  storyIndex: number;
  image: string;
  title: string;
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
    const z = sine * 42;
    const scale = 0.86 + ((sine + 1) / 2) * 0.14;
    const tilt = Math.cos(angle) * -4;
    return `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${z}px) rotateY(${tilt}deg) scale(${scale})`;
  });
  const opacity = useTransform(rotation, (degrees) => {
    const angle = ((degrees + index * 60) * Math.PI) / 180;
    return 0.78 + ((Math.sin(angle) + 1) / 2) * 0.22;
  });

  return (
    <motion.button
      className="photo-orbit-card"
      type="button"
      style={{ transform, opacity }}
      onClick={() => onOpenStory(event.storyIndex)}
      aria-label={`View Style Studio photograph: ${event.title}`}
    >
      <img src={event.image} alt="" />
      <span className="photo-orbit-card-caption">{event.title}</span>
    </motion.button>
  );
}

export function PhotographyOrbitHero({ events, portrait, onOpenStory }: Props) {
  const rotation = useMotionValue(0);
  const [width, setWidth] = useState(() => (typeof window === "undefined" ? 1280 : window.innerWidth));
  const radiusX = Math.min(width * (width < 560 ? 0.4 : 0.38), 500);
  const radiusY = width < 560 ? 182 : width < 900 ? 210 : 266;

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // One full revolution takes about 36 seconds; the cards remain behind the portrait.
  useAnimationFrame((_time, delta) => {
    rotation.set((rotation.get() + Math.min(delta, 50) * 0.01) % 360);
  });

  return (
    <section className="photo-orbit-hero" id="home" aria-label="Style Studio event photography">
      <div className="photo-orbit-copy">
        <p className="photo-orbit-eyebrow">STYLE STUDIO PHOTOGRAPHY · HYDERABAD</p>
        <h1>Every tradition <em>deserves to be remembered.</em></h1>
        <p className="photo-orbit-description">
          Thoughtful photography and film for weddings, family milestones, press, and brands.
        </p>
        <a className="photo-orbit-cta" href="#contact">Check your date <span aria-hidden="true">↗</span></a>
      </div>

      <nav className="photo-orbit-services" aria-label="Photography categories">
        <a href="#event-services">Weddings</a>
        <a href="#event-services">Birthdays &amp; family</a>
        <a href="#event-services">Press</a>
        <a href="#event-services">Brands &amp; events</a>
      </nav>

      <div className="photo-orbit-stage" aria-label="Six real event photographs orbit around Saleem">
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
        <motion.div
          className="photo-orbit-portrait"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <img src={portrait} alt="Mohammed Saleemuddin, Style Studio photographer in Hyderabad" />
        </motion.div>
      </div>
    </section>
  );
}
