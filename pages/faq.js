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

function FaqChevron({ isOpen }) {
  return (
    <span className={`faq-chevron${isOpen ? " is-open" : ""}`} aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M4 6L8 10L12 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState(-1);

  return (
    <>
      <Head>
        <title>FAQ | Events Community</title>
      </Head>

      <main className="page-shell page-stack">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "FAQ" }]} />

        <section className="faq-page-header">
          <h1>Frequently asked questions</h1>
          <p>Answers to the things students ask us most often.</p>
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
                <FaqChevron isOpen={openIndex === index} />
              </button>

              {openIndex === index ? (
                <div className="faq-answer" id={`faq-answer-${index}`}>
                  <p>{item.answer}</p>
                </div>
              ) : null}
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
