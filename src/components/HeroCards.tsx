import { useState, useEffect } from 'react';

const cardsData = [
  {
    id: 1,
    image: '/images/hero-1.jpg',
    tag: 'Food Saved',
    title: 'Setiap Sisa Punya Makna',
    desc: 'Lihat bagaimana setiap sajian terselamatkan, dibagikan, dan diolah kembali.'
  },
  {
    id: 2,
    image: '/images/hero-2.jpg',
    tag: 'Circular Economy',
    title: 'Berbagi Kebahagiaan',
    desc: 'Bantu warung lokal mengurangi limbah sekaligus menikmati hidangan lezat.'
  },
  {
    id: 3,
    image: '/images/hero-3.jpg',
    tag: 'Sustainability',
    title: 'Lingkungan Terjaga',
    desc: 'Ubah sisa organik menjadi nilai tambah melalui peternak maggot.'
  },
  {
    id: 4,
    image: '/images/hero-4.jpg',
    tag: 'Community',
    title: 'Langkah Kecil Berdampak',
    desc: 'Bergabung dalam ekosistem hijau yang memberi manfaat bagi semua.'
  }
];

export default function HeroCards() {
  const [cards, setCards] = useState(cardsData);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 4000);
    return () => clearInterval(timer);
  }, [cards, isFlipping]);

  const handleNext = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    
    setTimeout(() => {
      setCards(prev => {
        const newCards = [...prev];
        const first = newCards.shift();
        if (first) newCards.push(first);
        return newCards;
      });
      setIsFlipping(false);
    }, 400); // matches the transition duration
  };

  return (
    <div className="relative mx-auto w-full max-w-xl h-[450px]">
      {/* Background glow */}
      <div className="absolute inset-0 -right-5 -top-8 h-full rounded-[2.5rem] bg-abisOrange/10 blur-3xl" />
      
      <div className="relative h-full w-full" onClick={handleNext}>
        {cards.map((card, index) => {
          const isTop = index === 0;
          const isFlippingOut = isTop && isFlipping;
          
          let transform = '';
          let opacity = 1;
          let zIndex = 40 - index;
          
          if (isFlippingOut) {
            transform = 'translateY(-30%) translateX(10%) rotate(5deg) scale(0.95)';
            opacity = 0;
          } else {
            const scale = 1 - (index * 0.05);
            // Stack downwards slightly
            const translateY = index * 20;
            // Slight rotation for that deck of cards feel
            const rotate = index % 2 === 0 ? index * 1.5 : -index * 1.5;
            
            transform = `translateY(${translateY}px) scale(${scale}) rotate(${rotate}deg)`;
            opacity = 1 - (index * 0.15);
          }

          return (
            <div 
              key={card.id}
              className="absolute inset-0 transition-all duration-500 ease-in-out cursor-pointer overflow-hidden rounded-[2rem] border border-abisGreen/20 bg-white shadow-[0_40px_100px_-40px_rgba(27,67,50,0.45)]"
              style={{ 
                transform,
                opacity,
                zIndex,
                transformOrigin: 'top center'
              }}
            >
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s] hover:scale-105" style={{ backgroundImage: `url(${card.image})` }}>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/70" />
                <div className="relative z-10 flex h-full flex-col justify-end p-8 text-white">
                  <div className="mb-auto mt-2">
                     <span className="inline-flex items-center rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md border border-white/20">
                      {card.tag}
                    </span>
                  </div>
                  <h2 className="mt-5 text-3xl font-literata font-bold">{card.title}</h2>
                  <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/90">
                    {card.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
