import Head from "next/head";
import { useState } from "react";

import Breadcrumbs from "../components/Breadcrumbs";

const faqItems = [
  {
    question: "What is Events Community?",
    answer:
      "Events Community is a platform where students and young people in Karakalpakstan can discover clubs, projects, and workshops in one place.",
  },
  {
    question: "Who is this website for?",
    answer:
      "It is designed for school students in grades 8 to 11, gap year students, and other young people who want to join communities or build projects.",
  },
  {
    question: "How do I join an opportunity?",
    answer:
      "Create an account, log in, browse the available opportunities, and use the join button on any card that interests you.",
  },
  {
    question: "Do I need an account to browse?",
    answer:
      "No. You can browse first, but you need to log in before the platform can save your registration.",
  },
  {
    question: "Will the site show if I already registered?",
    answer:
      "Yes. After login, the frontend checks your existing registrations and marks the opportunities you already joined.",
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <>
      <Head>
        <title>FAQ | Events Community</title>
      </Head>

      <main className="page-shell page-stack">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "FAQ" }]} />

        <section className="hero">
          <span className="eyebrow">FAQ</span>
          <div className="hero-copy">
            <h1>Frequently asked questions</h1>
            <p className="hero-subtitle">
              Quick answers about browsing opportunities, creating an account, and joining clubs,
              projects, and workshops through the current MVP.
            </p>
          </div>
        </section>

        <section className="faq-list">
          {faqItems.map((item, index) => (
            <article key={item.question} className="faq-card">
              <button
                type="button"
                className="faq-toggle"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
                onClick={() => setOpenIndex((current) => (current === index ? -1 : index))}
              >
                <span>{item.question}</span>
                <span className="faq-symbol" aria-hidden="true">
                  {openIndex === index ? "-" : "+"}
                </span>
              </button>

              {openIndex === index ? <p id={`faq-answer-${index}`}>{item.answer}</p> : null}
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
