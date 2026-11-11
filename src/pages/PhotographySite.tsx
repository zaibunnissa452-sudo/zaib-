import { useEffect, useState, type FormEvent } from "react";
import "./photography.css";

const stories = [
  {
    title: "A promise in the garden",
    category: "WEDDING · HYDERABAD",
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1100&q=85",
    className: "story-card story-card-tall",
  },
  {
    title: "The quiet before the vows",
    category: "NIKAH · HYDERABAD",
    image:
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1000&q=85",
    className: "story-card",
  },
  {
    title: "An evening to remember",
    category: "CELEBRATION · HYDERABAD",
    image:
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=85",
    className: "story-card",
  },
];

export function PhotographySite() {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Still & Story — Wedding and Event Photography in Hyderabad";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="photo-site">
      <header className="photo-nav">
        <a className="photo-brand" href="#home" aria-label="Still and Story home">
          STILL <span>&</span> STORY
        </a>
        <nav aria-label="Main navigation">
          <a href="#stories">Stories</a>
          <a href="#approach">Our approach</a>
          <a className="photo-nav-cta" href="#contact">
            Check your date <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <section className="photo-hero" id="home">
        <img
          className="photo-hero-image"
          src="https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=2400&q=90"
          alt="Newlyweds sharing a quiet moment after their ceremony"
        />
        <div className="photo-hero-shade" />
        <div className="photo-hero-copy">
          <p className="photo-eyebrow">WEDDING & EVENT PHOTOGRAPHY · HYDERABAD</p>
          <h1>For the feeling<br />you’ll want to <em>keep.</em></h1>
          <p className="photo-hero-description">
            Honest, thoughtful photographs of your people, your traditions, and
            the moments that make the day yours.
          </p>
          <a className="photo-button photo-button-light" href="#contact">
            Tell us what you’re planning <span aria-hidden="true">↗</span>
          </a>
        </div>
        <p className="photo-hero-note">MADE WITH CARE IN HYDERABAD</p>
        <a className="photo-scroll" href="#stories" aria-label="Scroll to wedding stories">
          <span />
        </a>
      </section>

      <section className="photo-intro" id="approach">
        <p className="photo-eyebrow">A LITTLE LESS POSED. A LOT MORE YOU.</p>
        <h2>
          The best photographs don’t interrupt the moment.
          <br />
          <em>They let you return to it.</em>
        </h2>
        <p>
          From the stillness of a nikah to a dance floor full of your favourite
          people, we document celebrations with warmth, respect, and an eye for
          the in-between.
        </p>
      </section>

      <section className="photo-stories" id="stories">
        <div className="photo-section-heading">
          <div>
            <p className="photo-eyebrow">THE STORIES WE TELL</p>
            <h2>Every celebration, <em>its own world.</em></h2>
          </div>
          <p>Wedding days, nikah ceremonies, and the gatherings around them.</p>
        </div>
        <div className="photo-story-grid">
          {stories.map((story, index) => (
            <article className={story.className} key={story.title}>
              <img src={story.image} alt={story.title} loading="lazy" />
              <span className="photo-story-number">0{index + 1}</span>
              <div className="photo-story-caption">
                <p>{story.category}</p>
                <h3>{story.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="photo-approach">
        <div className="photo-approach-image">
          <img
            src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=85"
            alt="A couple celebrating with their family and friends"
            loading="lazy"
          />
        </div>
        <div className="photo-approach-copy">
          <p className="photo-eyebrow">PRESENT, NEVER IN THE WAY</p>
          <h2>Your day should feel like <em>your day.</em></h2>
          <p>
            We take time to understand what matters to you and your family.
            Then we blend in, pay attention, and photograph the celebration as
            it truly unfolds.
          </p>
          <a className="photo-text-link" href="#contact">
            Let’s talk about your celebration <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <section className="photo-contact" id="contact">
        <div className="photo-contact-heading">
          <p className="photo-eyebrow">YOUR DATE, YOUR STORY</p>
          <h2>Let’s make room<br />for the <em>good stuff.</em></h2>
          <p>
            Tell us a little about the celebration. We’ll be in touch to talk
            through the details.
          </p>
        </div>
        <form className="photo-inquiry-form" onSubmit={handleSubmit}>
          <label>
            Your name
            <input name="name" autoComplete="name" placeholder="How should we address you?" required />
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
              placeholder="Event type, venue, or anything you’d like us to know"
              rows={3}
            />
          </label>
          <button className="photo-button" type="submit">
            Send an enquiry <span aria-hidden="true">↗</span>
          </button>
          {submitted && (
            <p className="photo-form-notice" role="status">
              Thanks for sharing your plans. This enquiry form is a preview and
              needs the photographer’s email or WhatsApp connected before it
              can deliver messages.
            </p>
          )}
        </form>
      </section>

      <footer className="photo-footer">
        <a className="photo-brand" href="#home">
          STILL <span>&</span> STORY
        </a>
        <p>Wedding and event photography · Hyderabad</p>
        <a href="#home">Back to top ↑</a>
      </footer>
    </main>
  );
}
