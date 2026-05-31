import { useEffect, useState } from 'react';

const CAPTIONS = [
  'Doctors caring for patients every day',
  'Expert medical teams at your hospital',
  'Modern treatment and recovery support',
  'Trusted healthcare professionals on duty',
  'Compassionate care when it matters most',
  'Advanced hospital facilities and equipment',
  'Patient-centered treatment plans',
  'Skilled nurses and dedicated caregivers',
  'Emergency care ready around the clock',
  'Wellness and preventive medicine',
  'Pediatric and family health services',
  'Surgical excellence and patient safety',
  'Pharmacy and medicine management',
  'Diagnostic and laboratory services',
  'Rehabilitation and recovery programs',
  'Community health and outreach',
  'Medical innovation and research',
  'Coordinated multi-specialty care',
  'Clean, modern hospital environment',
  'Your partner in better health',
];

const SLIDE_COUNT = 20;

const SLIDES = Array.from({ length: SLIDE_COUNT }, (_, i) => ({
  src: `/login/slide-${String(i + 1).padStart(2, '0')}.jpg`,
  caption: CAPTIONS[i] ?? 'Quality healthcare for every patient',
}));

const INTERVAL_MS = 5000;

export default function LoginSlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    SLIDES.forEach((slide) => {
      const img = new Image();
      img.src = slide.src;
    });
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={slide.src}
            alt=""
            loading={i <= 1 ? 'eager' : 'lazy'}
            className={`h-full w-full object-cover ${i === index ? 'animate-ken-burns' : ''}`}
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-br from-brand-950/88 via-brand-900/78 to-slate-950/82" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.12),transparent_45%)]" />

      <div className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 px-6">
        <p
          key={index}
          className="max-w-lg animate-fade-in text-center text-sm font-medium tracking-wide text-white/90"
        >
          {SLIDES[index].caption}
        </p>
        <p className="text-xs font-medium text-white/50">
          {index + 1} / {SLIDES.length}
        </p>
        <div className="pointer-events-auto flex max-w-md flex-wrap justify-center gap-1.5">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`rounded-full transition-all duration-300 ${
                i === index
                  ? 'h-1.5 w-5 bg-white shadow-glow'
                  : 'h-1.5 w-1.5 bg-white/35 hover:bg-white/65'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
