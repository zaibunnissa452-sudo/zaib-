import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { trackEvent } from "../lib/analytics";
import "./photography.css";
import "./photography-orbit.css";
import { PhotographyOrbitHero } from "./PhotographyOrbitHero";
import { PhotographyAssistant, whatsappUrl } from "./PhotographyAssistant";
import { MagneticButton } from "../components/MagneticButton";

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
    title: "A promise written together",
    category: "Muslim wedding ceremony",
    type: "Weddings",
    image: "/images/photography/muslim-wedding-signing.jpeg",
    isClientWork: true,
    className: "story-card story-card-client-portrait",
  },
  {
    title: "A moment to begin a life together",
    category: "Muslim wedding celebration",
    type: "Weddings",
    image: "/images/photography/muslim-wedding-couple.jpeg",
    isClientWork: true,
    className: "story-card",
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
    title: "A celebration dinner with friends",
    category: "Celebration dinner",
    type: "Celebrations",
    image: "/images/photography/celebration-dinner.jpeg",
    isClientWork: true,
    className: "story-card",
  },
  {
    title: "A birthday bright with sparklers",
    category: "Birthday celebration",
    type: "Birthdays",
    image: "/images/photography/birthday-sparklers.jpeg",
    isClientWork: true,
    className: "story-card story-card-client-portrait",
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
  {
    title: "An evening under the lights",
    category: "Outdoor celebration setup",
    type: "Celebrations",
    image: "/images/photography/outdoor-celebration-setup.png",
    isClientWork: true,
    className: "story-card",
  },
  {
    title: "Style on display",
    category: "Fashion exhibition",
    type: "Brand & corporate",
    image: "/images/photography/fashion-exhibition-group.png",
    isClientWork: true,
    className: "story-card",
  },
  {
    title: "A style statement",
    category: "Fashion exhibition portrait",
    type: "Brand & corporate",
    image: "/images/photography/fashion-exhibition-model.png",
    isClientWork: true,
    className: "story-card story-card-client-portrait",
  },
  {
    title: "Together at the exhibition",
    category: "Fashion exhibition",
    type: "Brand & corporate",
    image: "/images/photography/fashion-exhibition-selfie.png",
    isClientWork: true,
    className: "story-card",
  },
];

const storyFilters = ["All examples", "Weddings", "Birthdays", "Press & media", "Brand & corporate", "Celebrations"];

const orbitStoryIndices = [2, 3, 10, 11, 15, 17] as const;
const heroOrbitEvents = orbitStoryIndices.map((storyIndex) => ({
  storyIndex,
  image: stories[storyIndex].image,
  title: stories[storyIndex].category,
}));

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
  const [selectedEventType, setSelectedEventType] = useState("");
  const prefersReducedMotion = useReducedMotion();

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

    trackEvent("generate_lead", {
      method: "whatsapp_form",
      event_type: eventType,
      has_date: Boolean(date),
    });

    window.location.assign(whatsappUrl(message));
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <main className="photo-site">
      <header className="photo-nav">
        <a className="photo-brand" href="#home">
          <img
            src="/images/photography/style-studio-logo.png"
            alt="Style Studio Photography — Capture, Cherish, Forever"
          />
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
          <MagneticButton href="#contact" className="photo-nav-cta" onClick={closeMenu}>
            Check your date <span aria-hidden="true">↗</span>
          </MagneticButton>
        </nav>
      </header>

      <PhotographyOrbitHero
        events={heroOrbitEvents}
        portrait="/images/photography/saleem-portrait-hero.jpg"
        onOpenStory={setActiveStory}
      />

      <section className="photo-photographer" aria-labelledby="photo-photographer-title">
        <div className="photo-photographer-layout">
          <div className="photo-photographer-portrait">
            <div className="photo-photographer-portrait-card">
              <img
                src="/images/photography/saleem-photographer.jpg"
                alt="Saleem, the Style Studio photographer, at an evening event"
              />
              <span className="photo-photographer-caption">
                <strong>Saleem</strong>
                <span>Photographer · Hyderabad</span>
              </span>
            </div>
          </div>
          <div className="photo-photographer-copy">
            <p className="photo-eyebrow">MEET YOUR PHOTOGRAPHER</p>
            <h2 id="photo-photographer-title">
              I’m Saleem.
              <br />
              <em>I capture what matters.</em>
            </h2>
            <p>
              I’m Mohammed Saleemuddin, a Hyderabad photographer for weddings
              across traditions, birthdays, and press events. I focus on the
              people and in-between moments that make each gathering yours.
            </p>
            <MagneticButton href="#stories" className="photo-button">
              Explore my photographs <span aria-hidden="true">↗</span>
            </MagneticButton>
          </div>
        </div>
      </section>

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
            <Reveal key={service.number} className="photo-event-card-reveal" delay={index * 0.1}>
              <article className="photo-event-card">
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
              </article>
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
          <p>Style Studio photographs are labeled separately from illustrative examples.</p>
        </Reveal>
        <div className="photo-story-filters" role="group" aria-label="Filter event photography examples by type">
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
          <MagneticButton
            href="tel:+919885037928"
            className="photo-contact-phone"
            onClick={() => trackEvent("contact_phone", { method: "phone_call" })}
          >
            Call Mohammed Saleemuddin <span>+91 98850 37928</span>
          </MagneticButton>
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
          <MagneticButton className="photo-button" type="submit">
            Continue on WhatsApp <span aria-hidden="true">↗</span>
          </MagneticButton>
        </form>
        </Reveal>
      </section>

      <footer className="photo-footer">
        <a className="photo-brand" href="#home">
          <img
            src="/images/photography/style-studio-logo.png"
            alt="Style Studio Photography — Capture, Cherish, Forever"
          />
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
