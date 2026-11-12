import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import "./photography.css";
import { PhotographyAssistant, whatsappUrl } from "./PhotographyAssistant";

const stories: Array<{
  title: string;
  category: string;
  type: string;
  image: string;
  className: string;
  isClientWork?: boolean;
}> = [
  {
    title: "A day woven with tradition",
    category: "Traditional Indian wedding",
    type: "Weddings",
    image:
      "https://images.pexels.com/photos/8804917/pexels-photo-8804917.jpeg?auto=compress&cs=tinysrgb&w=1200",
    className: "story-card story-card-tall",
  },
  {
    title: "A celebration close to the heart",
    category: "Muslim wedding celebration",
    type: "Weddings",
    image:
      "/images/muslim-wedding-client.png",
    isClientWork: true,
    className: "story-card story-card-client-photo",
  },
  {
    title: "A promise shared with family",
    category: "Christian wedding ceremony",
    type: "Weddings",
    image:
      "https://images.pexels.com/photos/33328742/pexels-photo-33328742.jpeg?auto=compress&cs=tinysrgb&w=1200",
    className: "story-card",
  },
  {
    title: "Rituals filled with color",
    category: "Hindu wedding ceremony",
    type: "Weddings",
    image:
      "https://images.pexels.com/photos/38273000/pexels-photo-38273000.jpeg?auto=compress&cs=tinysrgb&w=1200",
    className: "story-card",
  },
  {
    title: "A promise in the Gurdwara",
    category: "Sikh wedding ceremony",
    type: "Weddings",
    image:
      "https://images.pexels.com/photos/38781222/pexels-photo-38781222.jpeg?auto=compress&cs=tinysrgb&w=1200",
    className: "story-card",
  },
  {
    title: "A sacred vow, shared together",
    category: "Buddhist wedding ceremony",
    type: "Weddings",
    image:
      "https://images.pexels.com/photos/20752380/pexels-photo-20752380.jpeg?auto=compress&cs=tinysrgb&w=1200",
    className: "story-card",
  },
  {
    title: "A joyful wedding in the city",
    category: "Jewish wedding celebration",
    type: "Weddings",
    image:
      "https://images.pexels.com/photos/15978822/pexels-photo-15978822.jpeg?auto=compress&cs=tinysrgb&w=1200",
    className: "story-card",
  },
  {
    title: "A birthday with friends",
    category: "Birthday celebration",
    type: "Birthdays",
    image:
      "https://images.pexels.com/photos/27176823/pexels-photo-27176823.jpeg?auto=compress&cs=tinysrgb&w=1200",
    className: "story-card",
  },
  {
    title: "In the room where news breaks",
    category: "Press & media",
    type: "Press & media",
    image:
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=85",
    className: "story-card",
  },
  {
    title: "Ideas, people, possibility",
    category: "Brand & corporate",
    type: "Brand & corporate",
    image:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=85",
    className: "story-card",
  },
  {
    title: "A room full of celebration",
    category: "Celebrations & community",
    type: "Celebrations",
    image:
      "https://images.pexels.com/photos/16583021/pexels-photo-16583021.jpeg?auto=compress&cs=tinysrgb&w=1200",
    className: "story-card",
  },
];

const storyFilters = ["All examples", "Weddings", "Birthdays", "Press & media", "Brand & corporate", "Celebrations"];

const heroSlides = [
  {
    eyebrow: "WEDDINGS ACROSS ALL FAITHS & TRADITIONS",
    heading: "Every tradition",
    emphasis: "deserves to be remembered.",
    description:
      "Respectful photography for Hindu, Muslim, Christian, Sikh, Buddhist, Jewish, Jain, interfaith, and other wedding traditions.",
    image:
      "https://images.pexels.com/photos/8804917/pexels-photo-8804917.jpeg?auto=compress&cs=tinysrgb&w=1800",
    alt: "An Indian couple during their wedding ceremony",
  },
  {
    eyebrow: "BIRTHDAYS & FAMILY CELEBRATIONS",
    heading: "Good people.",
    emphasis: "A day worth keeping.",
    description:
      "Warm, natural coverage for birthdays, anniversaries, family gatherings, and community celebrations.",
    image:
      "https://images.pexels.com/photos/27176823/pexels-photo-27176823.jpeg?auto=compress&cs=tinysrgb&w=1800",
    alt: "Friends celebrating a birthday with cake and sparklers",
  },
  {
    eyebrow: "PRESS & MEDIA",
    heading: "The moments",
    emphasis: "the city needs to see.",
    description:
      "Considered coverage for press conferences, interviews, public announcements, and media assignments.",
    image:
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1800&q=85",
    alt: "A speaker addressing an audience at an event",
  },
  {
    eyebrow: "BRANDS & BUSINESS",
    heading: "Bring your",
    emphasis: "big ideas into focus.",
    description:
      "Professional imagery for launches, conferences, campaigns, and the people behind your brand.",
    image:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=85",
    alt: "Colleagues collaborating around a table",
  },
];

const eventTypes = [
  "Wedding (all faiths & traditions)",
  "Birthday / family celebration",
  "Cultural / community event",
  "Press / media assignment",
  "Brand / corporate event",
  "Product launch / promotion",
  "Other event",
];

const eventServices = [
  {
    number: "01",
    title: "Weddings across all faiths",
    eventType: "Wedding (all faiths & traditions)",
    description:
      "Respectful coverage for Hindu, Muslim, Christian, Sikh, Buddhist, Jewish, Jain, interfaith, and other faith and cultural traditions.",
  },
  {
    number: "02",
    title: "Birthdays & family milestones",
    eventType: "Birthday / family celebration",
    description:
      "Birthdays, anniversaries, family gatherings, and the milestones you want to remember.",
  },
  {
    number: "03",
    title: "Press & media",
    eventType: "Press / media assignment",
    description:
      "Press conferences, media briefings, interviews, public announcements, and official gatherings.",
  },
  {
    number: "04",
    title: "Brands & business",
    eventType: "Brand / corporate event",
    description:
      "Product launches, corporate events, promotional campaigns, and business milestones.",
  },
];

export function PhotographySite() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeStory, setActiveStory] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState("All examples");
  const [activeHero, setActiveHero] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState("");
  const heroRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImageY = useTransform(heroProgress, [0, 1], [0, 100]);

  useEffect(() => {
    if (prefersReducedMotion || heroPaused) return;
    const timer = window.setInterval(() => {
      setActiveHero((current) => (current + 1) % heroSlides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [heroPaused, prefersReducedMotion]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Style Studio | Mohammed Saleemuddin — Hyderabad Event Photographer";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    if (activeStory === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveStory(null);
      if (event.key === "ArrowRight") {
        setActiveStory((current) => (current === null ? null : (current + 1) % stories.length));
      }
      if (event.key === "ArrowLeft") {
        setActiveStory((current) =>
          current === null ? null : (current - 1 + stories.length) % stories.length,
        );
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeStory]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const eventType = String(formData.get("eventType") ?? "").trim();
    const contact = String(formData.get("contact") ?? "").trim();
    const date = String(formData.get("date") ?? "").trim();
    const details = String(formData.get("details") ?? "").trim();
    const message = [
      "Hello Saleem, I’d like to enquire about photography.",
      "",
      `Name: ${name}`,
      `Event: ${eventType}`,
      `Contact: ${contact}`,
      date ? `Event date: ${date}` : "",
      details ? `Details: ${details}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    window.location.assign(whatsappUrl(message));
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <main className="photo-site">
      <motion.div
        className="photo-scroll-progress"
        style={{ scaleX: scrollYProgress }}
        aria-hidden="true"
      />
      <header className="photo-nav">
        <a className="photo-brand" href="#home" aria-label="Style Studio by Mohammed Saleemuddin home">
          STYLE <span>STUDIO</span>
          <small>BY MOHAMMED SALEEMUDDIN</small>
        </a>
        <button
          className="photo-menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="photo-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "Close" : "Menu"}
          <span className={menuOpen ? "photo-menu-icon is-open" : "photo-menu-icon"} aria-hidden="true">
            <i />
            <i />
          </span>
        </button>
        <nav className={menuOpen ? "is-open" : ""} id="photo-navigation" aria-label="Main navigation">
          <a href="#stories" onClick={closeMenu}>Gallery</a>
          <a href="#event-services" onClick={closeMenu}>Events</a>
          <a href="#approach" onClick={closeMenu}>Our approach</a>
          <a className="photo-nav-cta" href="#contact" onClick={closeMenu}>
            Check your date <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <motion.section
        className="photo-hero"
        id="home"
        ref={heroRef}
        aria-label="Style Studio event photography examples"
        aria-roledescription="carousel"
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={heroSlides[activeHero].image}
            className="photo-hero-image"
            src={heroSlides[activeHero].image}
            alt={heroSlides[activeHero].alt}
            style={{ y: prefersReducedMotion ? 0 : heroImageY }}
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.8 }}
          />
        </AnimatePresence>
        <div className="photo-hero-shade" />
        <motion.div
          className="photo-hero-copy"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.p
            key={`eyebrow-${activeHero}`}
            className="photo-eyebrow"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.65 }}
          >
            {heroSlides[activeHero].eyebrow} · HYDERABAD
          </motion.p>
          <AnimatePresence mode="wait">
            <motion.div
              className="photo-hero-message"
              key={activeHero}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.35 }}
            >
              <h1>{heroSlides[activeHero].heading}<br /><em>{heroSlides[activeHero].emphasis}</em></h1>
              <p className="photo-hero-description">{heroSlides[activeHero].description}</p>
            </motion.div>
          </AnimatePresence>
          <a className="photo-button photo-button-light" href="#contact">
            Tell us what you’re planning <span aria-hidden="true">↗</span>
          </a>
        </motion.div>
        <p className="photo-hero-note">
          REPRESENTATIVE EVENT IMAGE · NOT A CLIENT ASSIGNMENT
        </p>
        <div className="photo-hero-controls" role="group" aria-label="Choose hero image">
          <button
            type="button"
            aria-label="Previous event category"
            onClick={() => setActiveHero((activeHero - 1 + heroSlides.length) % heroSlides.length)}
          >
            ←
          </button>
          <div className="photo-hero-dots">
            {heroSlides.map((slide, index) => (
              <button
                type="button"
                key={slide.eyebrow}
                className={index === activeHero ? "is-active" : ""}
                aria-label={`Show ${slide.eyebrow.toLowerCase()} image`}
                aria-pressed={index === activeHero}
                onClick={() => setActiveHero(index)}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Next event category"
            onClick={() => setActiveHero((activeHero + 1) % heroSlides.length)}
          >
            →
          </button>
          <button
            type="button"
            aria-label={heroPaused ? "Resume automatic event categories" : "Pause automatic event categories"}
            aria-pressed={heroPaused}
            onClick={() => setHeroPaused((paused) => !paused)}
          >
            <span aria-hidden="true">{heroPaused ? "▶" : "Ⅱ"}</span>
          </button>
        </div>
        <a className="photo-scroll" href="#event-services" aria-label="Scroll to event services">
          <span />
        </a>
      </motion.section>

      <Reveal className="photo-intro">
        <p className="photo-eyebrow">PEOPLE, PLACES & PURPOSEFUL MOMENTS</p>
        <h2>
          Stories worth telling,
          <br />
          <em>moments worth keeping.</em>
        </h2>
        <p>
          Style Studio photographs weddings across faiths, birthdays and family
          milestones, cultural celebrations, business events, and press
          assignments with care and attention to the moments that matter.
        </p>
      </Reveal>

      <section className="photo-event-services" id="event-services">
        <Reveal className="photo-section-heading">
          <div>
            <p className="photo-eyebrow">MORE THAN WEDDINGS</p>
            <h2>One studio. <em>Every kind of event.</em></h2>
          </div>
          <p>Professional photography for Hyderabad’s couples, families, organisations, and brands.</p>
        </Reveal>
        <div className="photo-event-grid">
          {eventServices.map((service, index) => (
            <Reveal className="photo-event-card" key={service.number} delay={index * 0.1}>
              <span className="photo-event-number">{service.number}</span>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <a
                href="#contact"
                aria-label={`Enquire about ${service.title}`}
                onClick={() => {
                  setSelectedEventType(service.eventType);
                }}
              >
                Enquire about this service <span aria-hidden="true">↗</span>
              </a>
            </Reveal>
          ))}
        </div>
        <Reveal className="photo-press-note">
          <span className="photo-press-mark" aria-hidden="true">PRESS</span>
          <p>
            <strong>Press Club member · Holds press accreditation</strong>
            <span>
              Available for press and media assignments. Access requirements
              and credentials can be confirmed with the event organiser.
            </span>
          </p>
        </Reveal>
      </section>

      <section className="photo-stories" id="stories">
        <Reveal className="photo-section-heading">
          <div>
            <p className="photo-eyebrow">EVENT PHOTOGRAPHY</p>
            <h2>See the kinds of stories <em>we can capture.</em></h2>
          </div>
          <p>Illustrative examples are labeled; the Muslim wedding photograph is actual Style Studio work.</p>
        </Reveal>
        <div className="photo-story-filters" role="group" aria-label="Filter stock photo examples by event type">
          {storyFilters.map((filter) => (
            <button
              className={activeFilter === filter ? "is-active" : ""}
              type="button"
              key={filter}
              aria-pressed={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        <motion.div className="photo-story-grid" layout>
          <AnimatePresence mode="popLayout">
            {stories.map((story, index) =>
              activeFilter === "All examples" || story.type === activeFilter ? (
                <motion.div
                  className={story.className}
                  key={story.title}
                  layout
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.28 }}
                >
                  <button
                    className="photo-story-button"
                    type="button"
                    onClick={() => setActiveStory(index)}
                    aria-label={`View event image example: ${story.title}`}
                  >
                    <img src={story.image} alt="" loading="lazy" />
                    <span className="photo-story-number">{String(index + 1).padStart(2, "0")}</span>
                    <span className="photo-story-caption">
                      <span>{story.category.toUpperCase()}</span>
                      <span className="photo-story-title">{story.title}</span>
                      <span className="photo-story-open">
                        {story.isClientWork ? "Style Studio photograph" : "Illustrative image"} · View details ↗
                      </span>
                    </span>
                  </button>
                </motion.div>
              ) : null,
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      <section className="photo-approach" id="approach">
        <Reveal className="photo-approach-image">
          <img
            src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=85"
            alt="Illustrative stock image of a couple celebrating with family and friends"
            loading="lazy"
          />
          <span className="photo-approach-image-credit">
            Illustrative image
          </span>
        </Reveal>
        <Reveal className="photo-approach-copy" delay={0.12}>
          <p className="photo-eyebrow">OBSERVANT, PREPARED, PROFESSIONAL</p>
          <h2>Ready for the moments that <em>matter.</em></h2>
          <p>
            Every assignment starts with understanding the brief. From
            family-led celebrations to press events and brand activations,
            the approach is thoughtful, respectful, and focused on telling
            the story clearly.
          </p>
          <a className="photo-text-link" href="#contact">
            Tell us about your event <span aria-hidden="true">↗</span>
          </a>
        </Reveal>
      </section>

      <section className="photo-contact" id="contact">
        <Reveal className="photo-contact-heading">
          <p className="photo-eyebrow">WEDDINGS · BIRTHDAYS · PRESS · BUSINESS · EVENTS</p>
          <h2>What are you<br />bringing people <em>together for?</em></h2>
          <p>
            Share a few details about your wedding, birthday, press assignment,
            launch, or event and Mohammed Saleemuddin will follow up.
          </p>
          <a className="photo-contact-phone" href="tel:+919885037928">
            Call Mohammed Saleemuddin <span>+91 98850 37928</span>
          </a>
        </Reveal>
        <Reveal className="photo-form-reveal" delay={0.12}>
        <form className="photo-inquiry-form" onSubmit={handleSubmit}>
          <label>
            Your name
            <input name="name" autoComplete="name" placeholder="How should we address you?" required />
          </label>
          <label>
            What are you planning?
            <select
              name="eventType"
              value={selectedEventType}
              onChange={(event) => setSelectedEventType(event.target.value)}
              required
            >
              <option value="" disabled>Select an event type</option>
              {eventTypes.map((eventType) => (
                <option key={eventType} value={eventType}>{eventType}</option>
              ))}
            </select>
          </label>
          <div className="photo-form-row">
            <label>
              Email or phone
              <input
                name="contact"
                autoComplete="email"
                placeholder="Where can we reach you?"
                required
              />
            </label>
            <label>
              Event date
              <input name="date" type="date" />
            </label>
          </div>
          <label>
            Tell us about it
            <textarea
              name="details"
              placeholder="What kind of event is it? Include the venue and any details that will help us understand the brief."
              rows={3}
            />
          </label>
          <p className="photo-form-note">
            WhatsApp will open with your enquiry ready to review and send to Saleem.
          </p>
          <button className="photo-button" type="submit">
            Continue on WhatsApp <span aria-hidden="true">↗</span>
          </button>
        </form>
        </Reveal>
      </section>

      <footer className="photo-footer">
        <a className="photo-brand" href="#home">
          STYLE <span>STUDIO</span>
          <small>BY MOHAMMED SALEEMUDDIN</small>
        </a>
        <p>Photography · Weddings, birthdays, press & events · Hyderabad</p>
        <a href="#home">Back to top ↑</a>
      </footer>
      <PhotographyAssistant />
      <AnimatePresence>
        {activeStory !== null && (
          <motion.div
            className="photo-lightbox-backdrop"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            onClick={(event) => {
              if (event.target === event.currentTarget) setActiveStory(null);
            }}
          >
            <motion.div
              className="photo-lightbox"
              role="dialog"
              aria-modal="true"
              aria-label={stories[activeStory].title}
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.97, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            >
              <button
                className="photo-lightbox-close"
                type="button"
                aria-label="Close story"
                onClick={() => setActiveStory(null)}
                autoFocus
              >
                ×
              </button>
              <AnimatePresence mode="wait">
                <motion.img
                  key={stories[activeStory].image}
                  src={stories[activeStory].image}
                  alt={stories[activeStory].title}
                  className={stories[activeStory].isClientWork ? "photo-lightbox-client-image" : ""}
                  initial={prefersReducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                />
              </AnimatePresence>
              <div className="photo-lightbox-caption">
                <div>
                  <p>{stories[activeStory].category}</p>
                  <h2>{stories[activeStory].title}</h2>
                  <p className="photo-lightbox-credit">
                    {stories[activeStory].isClientWork
                      ? "Photographed by Style Studio"
                      : "Illustrative image · not a Style Studio client assignment"}
                  </p>
                </div>
                <div className="photo-lightbox-controls">
                  <button
                    type="button"
                    aria-label="Previous story"
                    onClick={() =>
                      setActiveStory((activeStory - 1 + stories.length) % stories.length)
                    }
                  >
                    ←
                  </button>
                  <span>
                    {String(activeStory + 1).padStart(2, "0")} / {String(stories.length).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    aria-label="Next story"
                    onClick={() => setActiveStory((activeStory + 1) % stories.length)}
                  >
                    →
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Reveal({
  children,
  className,
  delay = 0,
  id,
}: {
  children: ReactNode;
  className: string;
  delay?: number;
  id?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      id={id}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
