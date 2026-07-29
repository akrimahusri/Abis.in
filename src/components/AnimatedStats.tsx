import { useEffect, useState, useRef } from 'react';

const statsData = [
  { target: 1250, suffix: '+', label: 'Porsi Makanan Terselamatkan', isDecimal: false },
  { target: 500, suffix: '+', label: 'Mitra Warung', isDecimal: false },
  { target: 82, suffix: 'k', label: 'Pengguna Aktif', isDecimal: true },
  { target: 50, suffix: '+', label: 'Wilayah Jangkauan', isDecimal: false }
];

function CountUp({ target, isDecimal }: { target: number, isDecimal: boolean }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let startTimestamp: number | null = null;
    const duration = 2500;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      const ease = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(ease * target));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(target); // Ensure it reaches exact target
      }
    };
    
    window.requestAnimationFrame(step);
  }, [isVisible, target]);

  let displayValue = count.toString();
  if (isDecimal) {
    // 82 -> 8.2
    displayValue = (count / 10).toString();
    if (displayValue.indexOf('.') === -1 && count !== 0 && target !== count) {
      displayValue += '.0';
    }
  } else if (count >= 1000) {
    // format thousand separator with dot for Indonesian locale e.g. 1.250
    displayValue = count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  return <span ref={ref}>{displayValue}</span>;
}

export default function AnimatedStats() {
  return (
    <section className="mt-20 overflow-hidden rounded-[2rem] bg-abisGreen px-6 py-14 text-white shadow-xl">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 text-center">
        {statsData.map((item) => (
          <div key={item.label} className="px-4">
            <p className="text-5xl font-literata font-medium tracking-tight">
              <CountUp target={item.target} isDecimal={item.isDecimal} />
              <span className="text-[#FD9D1A] font-semibold">{item.suffix}</span>
            </p>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.15em] text-white/90 font-hanken">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
