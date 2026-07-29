import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

const TopCurve = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
      }
    }, { threshold: 0.1 });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="absolute top-0 left-0 w-full overflow-hidden leading-none z-10 -translate-y-[1px]">
      <svg 
        className={`relative block h-[50px] lg:h-[120px] w-full origin-top transition-transform duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] ${isVisible ? 'scale-y-100' : 'scale-y-0'}`} 
        viewBox="0 0 1200 120" 
        preserveAspectRatio="none"
      >
        <path d="M0,0 L1200,0 C1200,0 900,120 600,120 C300,120 0,0 0,0 Z" className="fill-abisCream"></path>
      </svg>
    </div>
  )
}

const BottomCurve = () => {
  return (
    <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10 translate-y-[1px] rotate-180">
      <svg className="relative block h-[50px] lg:h-[100px] w-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0,0 L1200,0 C1200,0 900,120 600,120 C300,120 0,0 0,0 Z" className="fill-abisCream"></path>
      </svg>
    </div>
  )
}
import HeroCards from '../components/HeroCards'
import AnimatedStats from '../components/AnimatedStats'

const pilarData = [
  {
    id: 'penjual',
    shortTitle: 'Penjual',
    title: 'Untuk Penjual',
    description: 'Bagikan surplus makanan harian Anda dengan harga terjangkau. Kurangi kerugian finansial sekaligus berkontribusi pada lingkungan.',
    cta: 'Daftar Jadi Mitra',
    accent: '01',
    imageAlt: 'Gambar makanan penjual',
    imgSrc: '/images/hero-1.jpg',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
    )
  },
  {
    id: 'pembeli',
    shortTitle: 'Pembeli',
    title: 'Untuk Pembeli',
    description: 'Nikmati hidangan lezat dari restoran favorit Anda dengan harga hingga 70% lebih hemat. Makan enak sambil menyelamatkan bumi.',
    cta: 'Mulai Menjelajah',
    accent: '02',
    imageAlt: 'Gambar makanan pembeli',
    imgSrc: '/images/hero-2.jpg',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
    )
  },
  {
    id: 'peternak',
    shortTitle: 'Peternak Maggot',
    title: 'Untuk Peternak Maggot',
    description: 'Dapatkan pasokan limbah organik berkualitas sebagai media pakan maggot. Bantu selesaikan masalah sampah organik kota.',
    cta: 'Gabung Sebagai Peternak',
    accent: '03',
    imageAlt: 'Gambar peternak maggot',
    imgSrc: '/images/hero-3.jpg',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="14" x="8" y="6" rx="4"/><path d="m19 7-3 2"/><path d="m5 7 3 2"/><path d="m19 19-3-2"/><path d="m5 19 3-2"/><path d="M20 13h-4"/><path d="M4 13h4"/><path d="m10 4 1 2h2l1-2"/></svg>
    )
  }
]

const testimonials = [
  {
    quote: 'Sejak bermitra dengan Abis.in, limbah harian warung kami berkurang hingga 80%. Senang rasanya tahu sisa makanan kami tidak terbuang sia-sia dan tetap jadi berkah.',
    name: 'Ibu Sartika',
    role: 'Pemilik Warung Nasi Kuning'
  },
  {
    quote: 'Abis.in membantu saya menemukan makanan enak dengan harga terjangkau. Proses reservasi cepat dan ramah lingkungan.',
    name: 'Teguh',
    role: 'Pembeli Aktif'
  },
  {
    quote: 'Sebagai peternak maggot, pasokan organik dari platform ini sangat konsisten. Kapasitas harian kami jadi lebih optimal.',
    name: 'Bapak Ardi',
    role: 'Peternak Maggot'
  }
]

const HowItWorksSection = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (containerRef.current) {
            const { top, height } = containerRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            // Calculate how far we've scrolled while the sticky section is pinned
            if (top <= 0) {
              const scrolled = -top;
              const totalScrollable = height - windowHeight;
              
              // Map to 0-1
              const progress = Math.min(Math.max(scrolled / totalScrollable, 0), 1);
              setScrollProgress(progress);
            } else {
              setScrollProgress(0);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Init
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // SEQUENCE ANIMATION:
  // 1. Background circle grows: 0.0 to 0.2
  const bgProgress = Math.min(scrollProgress / 0.2, 1);
  
  // 2. Title appears: 0.1 to 0.2, stays, fades out: 0.4 to 0.5
  let titleOpacity = 0;
  if (scrollProgress >= 0.1 && scrollProgress <= 0.2) titleOpacity = (scrollProgress - 0.1) / 0.1;
  else if (scrollProgress > 0.2 && scrollProgress < 0.4) titleOpacity = 1;
  else if (scrollProgress >= 0.4 && scrollProgress <= 0.5) titleOpacity = 1 - ((scrollProgress - 0.4) / 0.1);
  
  // 3. Main Content appears: 0.5 to 0.7
  const contentOpacity = Math.min(Math.max((scrollProgress - 0.5) / 0.2, 0), 1);
  const contentTranslate = 40 * (1 - contentOpacity); // slides up

  return (
    <div ref={containerRef} className="relative h-[300vh] w-full bg-abisCream" id="cara-kerja">
      <section className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden z-20 pt-16 lg:pt-20">
         {/* Animated Green Background (Full Screen Circle Effect) */}
         <div 
           className="absolute bottom-0 left-1/2 bg-[#1B4332] rounded-full z-0 pointer-events-none"
           style={{
             width: '250vw',
             height: '250vw',
             transform: `translateX(-50%) translateY(50%) scale(${bgProgress})`,
             transformOrigin: 'center',
           }}
         />
         
         {/* Center Container for absolute overlay */}
         <div className="relative w-full max-w-7xl px-6 h-full flex items-center justify-center z-20">
           
           {/* TITLE SCREEN (Fades out) */}
           <div 
             className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none"
             style={{
               opacity: titleOpacity,
               transform: `scale(${0.9 + (scrollProgress * 0.3)})`,
             }}
           >
             <h2 className="text-4xl font-literata font-semibold text-white sm:text-5xl lg:text-7xl">
               Cara Kerja <span className="text-[#FD9D1A]">Abis.in</span>
             </h2>
             <p className="mt-6 text-slate-200 max-w-2xl text-base sm:text-lg lg:text-xl">
               Platform kami menghubungkan penjual, pembeli, dan peternak maggot dalam satu siklus yang mudah, cepat, dan berdampak.
             </p>
           </div>
           
           {/* MAIN CONTENT SCREEN (Fades in) */}
           <div 
             className="absolute inset-0 flex items-center justify-center"
             style={{
               opacity: contentOpacity,
               transform: `translateY(${contentTranslate}px)`,
               pointerEvents: contentOpacity > 0.5 ? 'auto' : 'none'
             }}
           >
             <div className="w-full grid gap-10 lg:gap-12 lg:grid-cols-[1.2fr_0.8fr] items-center">
             
             {/* Left Side: Modern Timeline */}
             <div className="relative space-y-4 lg:space-y-6 before:absolute before:left-[24px] before:top-6 before:bottom-6 before:w-[2px] before:bg-white/10 ml-2">
               {/* Step 1 */}
               <div className="relative flex items-start gap-6 group">
                  <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E87B35] text-white shadow-lg shadow-[#E87B35]/30 transition-transform group-hover:scale-110 group-hover:rotate-3">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                  </div>
                  <div className="flex-1 rounded-3xl border border-white/5 bg-white/5 p-5 backdrop-blur-md transition-all duration-300 group-hover:bg-white/10 hover:border-white/20 hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-literata text-xl font-black text-white/20">01</span>
                      <h3 className="font-literata text-lg font-bold text-white">Penjual Posting Produk</h3>
                    </div>
                    <p className="font-hanken mt-2 text-xs sm:text-sm leading-relaxed text-slate-200">Mitra warung mengunggah surplus makanan harian yang masih layak konsumsi dengan mudah dan cepat.</p>
                  </div>
               </div>

               {/* Step 2 */}
               <div className="relative flex items-start gap-6 group">
                  <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#ECA25C] text-white shadow-lg shadow-[#ECA25C]/30 transition-transform group-hover:scale-110 group-hover:rotate-3">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 10a4 4 0 0 1-8 0M6 2l-3 4v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/></svg>
                  </div>
                  <div className="flex-1 rounded-3xl border border-white/5 bg-white/5 p-5 backdrop-blur-md transition-all duration-300 group-hover:bg-white/10 hover:border-white/20 hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-literata text-xl font-black text-white/20">02</span>
                      <h3 className="font-literata text-lg font-bold text-white">Reservasi & Pembelian</h3>
                    </div>
                    <p className="font-hanken mt-2 text-xs sm:text-sm leading-relaxed text-slate-200">Pembeli melihat daftar makanan tersedia di sekitar mereka dan memesan secara instan.</p>
                  </div>
               </div>

               {/* Step 3 */}
               <div className="relative flex items-start gap-6 group">
                  <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#6EA4C6] text-white shadow-lg shadow-[#6EA4C6]/30 transition-transform group-hover:scale-110 group-hover:rotate-3">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 18a2 2 0 100-4 2 2 0 000 4zm14 0a2 2 0 100-4 2 2 0 000 4zM5 14h14M5 14V6h10v8m4-8l3 4v4h-3M15 6h4l3 4"/></svg>
                  </div>
                  <div className="flex-1 rounded-3xl border border-white/5 bg-white/5 p-5 backdrop-blur-md transition-all duration-300 group-hover:bg-white/10 hover:border-white/20 hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-literata text-xl font-black text-white/20">03</span>
                      <h3 className="font-literata text-lg font-bold text-white">Pengambilan & Distribusi</h3>
                    </div>
                    <p className="font-hanken mt-2 text-xs sm:text-sm leading-relaxed text-slate-200">Pembeli mengambil pesanan, sisa yang tak layak dijemput oleh peternak maggot.</p>
                  </div>
               </div>
             </div>

             {/* Right Side: Phone Mockup with Floating Bubbles */}
             <div className="relative mx-auto w-full max-w-[260px] sm:max-w-[300px] lg:max-w-md z-20 flex justify-center mt-10 lg:mt-0">
               
               {/* Left Blue Bubble */}
               <div className="absolute right-[55%] sm:right-[60%] lg:right-[55%] top-[15%] sm:top-[20%] z-30 -rotate-12 drop-shadow-[0_0_20px_rgba(255,255,255,0.7)]">
                 <div className="relative bg-[#8AB9DA] rounded-xl sm:rounded-2xl px-4 py-2 sm:px-6 sm:py-3">
                   <p className="font-hanken font-medium text-white text-sm sm:text-xl whitespace-nowrap">Food Saved</p>
                   <div className="absolute -bottom-[6px] right-4 sm:right-6 w-3 h-3 sm:w-4 sm:h-4 bg-[#8AB9DA] rotate-45"></div>
                 </div>
               </div>

               {/* Right Orange Bubble */}
               <div className="absolute left-[75%] sm:left-[80%] lg:left-[75%] top-[45%] sm:top-[50%] z-30 -rotate-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.7)]">
                 <div className="relative bg-[#F5A967] rounded-xl sm:rounded-2xl px-4 py-2 sm:px-6 sm:py-3">
                   <p className="font-hanken font-medium text-white text-center text-sm sm:text-xl leading-tight whitespace-nowrap">Dari Sisa<br/>Jadi Berharga</p>
                   <div className="absolute -bottom-[6px] left-4 sm:left-6 w-3 h-3 sm:w-4 sm:h-4 bg-[#F5A967] rotate-45"></div>
                 </div>
               </div>

               <img src="/images/mockup.png" alt="App Mockup" className="relative z-20 w-full h-auto object-contain transition-transform duration-700 hover:scale-105 drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]" />
             </div>
           </div>
           </div>
         </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-abisCream text-abisGreen font-hanken">
      <header className="sticky top-0 z-50 border-b border-green-900/10 bg-abisCream/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <img src="/images/Logo.png" alt="Abis.in Logo" className="h-10 w-auto" />
          </div>
          <nav className="hidden gap-10 text-sm font-medium md:flex">
            <a href="#home" className="transition hover:text-abisOrange">Beranda</a>
            <a href="#pilar" className="transition hover:text-abisOrange">Program</a>
            <a href="#testimoni" className="transition hover:text-abisOrange">Dampak</a>
            <a href="#footer" className="transition hover:text-abisOrange">Kemitraan</a>
          </nav>
          <Link
            to="/auth"
            className="rounded-full border border-abisGreen bg-white px-6 py-2 text-sm font-semibold text-abisGreen shadow-sm transition hover:bg-abisGreen hover:text-white"
          >
            Masuk
          </Link>
        </div>
      </header>

      <main className="pt-10">
        <section id="home" className="mx-auto max-w-7xl px-6 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <span className="inline-flex rounded-full bg-abisOrange/10 px-4 py-1 text-xs uppercase tracking-[0.25em] text-abisOrange">
              Platform Zero Dead End
            </span>
            <div className="space-y-6">
              <h1 className="max-w-3xl text-5xl font-literata font-semibold leading-tight text-abisGreen sm:text-6xl">
                Setiap Sisa Punya <span className="text-[#FD9D1A]">Makna</span>
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-700">
                Jangan biarkan sisa makanan berakhir di tempat sampah. Kami menghubungkan dapur Anda dengan pembeli sekitar dan mitra peternak maggot secara langsung.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                to="/auth"
                className="inline-flex items-center justify-center rounded-full bg-abisGreen px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#144129]"
              >
                Mulai Berkontribusi
              </Link>
              <a
                href="#pilar"
                className="inline-flex items-center justify-center rounded-full border border-abisGreen bg-white px-8 py-3 text-sm font-semibold text-abisGreen transition hover:bg-abisGreen hover:text-white"
              >
                Jelajahi
              </a>
            </div>
          </div>

          <HeroCards />
        </section>

        <div className="mx-auto max-w-7xl px-6">
          <AnimatedStats />
        </div>

        <section id="pilar" className="mx-auto max-w-7xl px-6 mt-20 space-y-10">
          <div className="space-y-3 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-abisOrange">Tiga Pilar Ekosistem Kami</p>
            <h2 className="text-4xl font-literata font-semibold text-abisGreen sm:text-5xl">Tiga Pilar Ekosistem Kami</h2>
          </div>
          <div className="flex flex-col justify-center gap-4 lg:flex-row lg:gap-6">
            {pilarData.map((pillar) => (
              <article 
                key={pillar.id} 
                className="group relative flex h-24 w-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] hover:h-[480px] hover:shadow-2xl lg:h-[420px] lg:w-24 lg:flex-row lg:hover:h-[420px] lg:hover:w-[500px]"
              >
                {/* Left Sidebar / Header */}
                <div className="relative z-10 flex h-24 w-full shrink-0 flex-row items-center justify-between border-b border-slate-100 px-6 lg:h-full lg:w-24 lg:flex-col lg:border-b-0 lg:border-r lg:px-0 lg:py-6">
                  {/* Background Image with Dual Overlays for Crossfade */}
                  <div className="absolute inset-0 -z-10 overflow-hidden">
                    <img src={pillar.imgSrc} alt="" className="h-full w-full scale-100 object-cover grayscale transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-110 group-hover:grayscale-0" />
                    
                    {/* Initial Light Grey Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#f0f0f0]/95 to-[#d9d9d9]/95 transition-opacity duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:opacity-0"></div>
                    
                    {/* Hover Lighter Green Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#527d62]/95 to-[#3b5945]/95 opacity-0 transition-opacity duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:opacity-100"></div>
                  </div>
                  
                  {/* Text */}
                  <div className="flex flex-row items-center gap-4 lg:flex-col lg:gap-3">
                    <div className="hidden h-6 w-[2px] bg-[#324b3c]/30 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:h-8 group-hover:bg-white/70 lg:block"></div>
                    <h3 className="font-hanken whitespace-nowrap text-lg font-bold tracking-[0.1em] text-[#324b3c]/80 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:tracking-[0.15em] group-hover:text-white lg:rotate-180" style={{ writingMode: 'vertical-rl' }}>
                      {pillar.shortTitle}
                    </h3>
                  </div>
                  
                  {/* Number Outline */}
                  <div className="text-5xl font-bold tracking-tighter text-transparent text-[#324b3c] opacity-60 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-110 group-hover:text-white group-hover:opacity-100 lg:group-hover:-translate-y-2" style={{ WebkitTextStroke: '1px currentColor' }}>
                    {pillar.accent}
                  </div>
                </div>

                {/* Right Content */}
                <div className="flex w-full shrink-0 translate-y-8 flex-col overflow-hidden p-6 opacity-0 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:translate-y-0 group-hover:opacity-100 lg:w-[404px] lg:translate-x-8 lg:translate-y-0 lg:group-hover:translate-x-0">
                  <div className="overflow-hidden rounded-xl shadow-md">
                    <img src={pillar.imgSrc} alt={pillar.imageAlt} className="h-40 w-full object-cover transition-transform duration-700 hover:scale-105" />
                  </div>
                  
                  <div className="mt-5 flex flex-1 flex-col">
                    <h4 className="font-literata text-2xl font-bold text-[#324b3c]">{pillar.title}</h4>
                    <p className="font-hanken mt-3 text-sm leading-relaxed text-slate-600">
                      {pillar.description}
                    </p>
                    
                    <div className="mt-auto flex items-center justify-between pt-4 text-[#b95d2c] transition-colors group-hover:text-[#cd6631]">
                      <span className="font-hanken flex items-center gap-2 text-sm font-semibold transition-transform duration-300 hover:translate-x-1">
                        {pillar.cta} <span className="text-lg">&rarr;</span>
                      </span>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50/50 text-[#b95d2c] shadow-sm transition-all duration-300 hover:rotate-12 hover:scale-110">
                        {pillar.icon}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <HowItWorksSection />

        <section id="testimoni" className="mt-20 overflow-hidden w-full pb-10">
          <div className="mx-auto max-w-7xl px-6 mb-12">
            <div className="space-y-3 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-abisOrange">Apa Kata Mereka</p>
              <h2 className="text-4xl font-literata font-semibold text-abisGreen sm:text-5xl">Apa Kata Mereka</h2>
            </div>
          </div>

          <div className="space-y-6 flex flex-col items-center">
            {/* Top Row: Marquee Left */}
            <div className="relative flex overflow-hidden w-full group">
              <div className="flex gap-6 animate-marquee-left group-hover:[animation-play-state:paused] whitespace-nowrap w-max pr-6">
                {Array(8).fill(testimonials).flat().map((item, index) => (
                  <div key={`row1-${index}`} className="w-[320px] sm:w-[400px] shrink-0 rounded-[1.25rem] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between whitespace-normal">
                    <p className="text-sm leading-6 text-slate-700">"{item.quote}"</p>
                    <div className="mt-6 flex items-center gap-4">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-200">
                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${item.name}`} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-abisGreen">{item.name}</p>
                        <p className="text-slate-500">{item.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Row: Marquee Right */}
            <div className="relative flex overflow-hidden w-full group">
              <div className="flex gap-6 animate-marquee-right group-hover:[animation-play-state:paused] whitespace-nowrap w-max pr-6 -ml-20 sm:-ml-40">
                {Array(8).fill(testimonials).flat().map((item, index) => (
                  <div key={`row2-${index}`} className="w-[320px] sm:w-[400px] shrink-0 rounded-[1.25rem] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between whitespace-normal">
                    <p className="text-sm leading-6 text-slate-700">"{item.quote}"</p>
                    <div className="mt-6 flex items-center gap-4">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-200">
                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${item.name}2`} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-abisGreen">{item.name}</p>
                        <p className="text-slate-500">{item.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6">
          <section className="mt-20 rounded-[2rem] bg-abisGreen px-8 py-16 text-white shadow-xl">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-4xl font-literata font-semibold">Siap Untuk Membuat Perubahan?</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-200">
                Bergabunglah dengan ribuan orang lainnya yang telah berkomitmen untuk mengurangi limbah pangan dan membangun masa depan yang lebih hijau.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link to="/auth" className="inline-flex rounded-full bg-abisOrange px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#e38415]">
                  Daftar Sekarang
                </Link>
                <a href="#footer" className="inline-flex rounded-full border border-white/30 bg-white/10 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-abisGreen">
                  Kontak Tim Kami
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer id="footer" className="mt-20 border-t border-slate-200/70 bg-white px-6 pb-14 pt-14 text-slate-700">
        <div className="mx-auto grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr] xl:max-w-7xl">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <img src="/images/Logo.png" alt="Abis.in Logo" className="h-12 w-auto" />
              <div>
                <p className="text-sm text-slate-500">Platform keberlanjutan pangan nomor satu di Indonesia yang fokus pada pengurangan limbah melalui ekonomi sirkular.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-sm font-semibold text-abisGreen">Navigasi</p>
            <div className="space-y-2 text-sm text-slate-600">
              <a href="#home" className="block transition hover:text-abisOrange">Beranda</a>
              <a href="#pilar" className="block transition hover:text-abisOrange">Program</a>
              <a href="#testimoni" className="block transition hover:text-abisOrange">Dampak Sosial</a>
              <a href="#footer" className="block transition hover:text-abisOrange">Kemitraan</a>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-sm font-semibold text-abisGreen">Kontak</p>
            <p className="text-sm text-slate-600">halo@abis.in</p>
            <p className="text-sm text-slate-600">+62 813 2345 7890</p>
            <p className="text-sm text-slate-600">Jakarta, Indonesia</p>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
          © 2026 Abis.in. Semua hak dilindungi undang-undang.
        </div>
      </footer>
    </div>
  )
}
