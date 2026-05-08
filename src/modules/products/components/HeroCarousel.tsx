import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";

interface HeroSlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  cta: string;
  link: string;
}

const slides: HeroSlide[] = [
  {
    id: 1,
    image: "images/banners/fondo2.jpg",
    title: "Disponibilidad 24/7",
    subtitle: "Tu proveedor que nunca duerme",
    cta: "Explorar",
    link: "/products?new=true",
  },
  {
    id: 2,
    image: "images/banners/fondo3.jpg",
    title: "Rapidez",
    subtitle: "La mejor calidad en un solo click",
    cta: "Ver Ofertas",
    link: "/products?featured=true",
  },
  {
    id: 3,
    image: "images/banners/fondo1.jpg",
    title: "Confianza",
    subtitle: "Pedidos seguros, entregas puntuales",
    cta: "Comprar Ahora",
    link: "/products",
  },
];

export const HeroCarousel: React.FC = () => {
  return (
    <div className="relative w-full h-[60vh] md:h-[70vh] bg-neutral-medium overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade"
        fadeEffect={{
          crossFade: true,
        }}
        speed={800}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{
          clickable: true,
          el: ".swiper-pagination-custom",
          bulletClass:
            "inline-block w-3 h-3 rounded-full bg-white/50 mx-1.5 cursor-pointer transition-all duration-300 hover:bg-white/70",
          bulletActiveClass: "!w-8 !bg-white scale-110",
        }}
        navigation={{
          nextEl: ".swiper-button-next-custom",
          prevEl: ".swiper-button-prev-custom",
        }}
        loop={true}
        className="h-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="relative w-full h-full">
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                style={{
                  backgroundImage: `linear-gradient(to right, rgba(109, 50, 34, 0.6), rgba(109, 50, 34, 0.47)), url(${slide.image})`,
                }}
              />

              {/* Content Container */}
              <div className="relative z-10 h-full flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                  <div
                    className="animate-fade-in text-left"
                    style={{ paddingRight: '60vw' }}
                  >
                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-display font-bold text-white mb-4 leading-tight drop-shadow-2xl animate-slide-up">
                      {slide.title}
                    </h1>
                    <p className="text-xl md:text-2xl lg:text-3xl text-white/95 mb-8 drop-shadow-lg animate-slide-up animation-delay-200">
                      {slide.subtitle}
                    </p>
                    <Link
                      to={slide.link}
                      className="inline-block px-8 py-4 bg-accent-chocolate text-white font-semibold rounded-lg hover:bg-accent-chocolateHover transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-accent-chocolate/50 animate-slide-up animation-delay-400"
                    >
                      {slide.cta}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}

        {/* Custom Navigation Buttons */}
        <button className="swiper-button-prev-custom absolute left-1 md:left-2 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 bg-white/5 backdrop-blur-sm rounded-full hover:bg-white/15 hover:scale-110 transition-all duration-300 group shadow-xl hover:shadow-2xl">
          <ChevronLeft className="text-accent-chocolate" size={24} />
        </button>
        <button className="swiper-button-next-custom absolute right-1 md:right-2 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 bg-white/5 backdrop-blur-sm rounded-full hover:bg-white/15 hover:scale-110 transition-all duration-300 group shadow-xl hover:shadow-2xl">
          <ChevronRight className="text-accent-chocolate" size={24} />
        </button>

        {/* Custom Pagination */}
        <div className="swiper-pagination-custom absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-1"></div>
      </Swiper>

      {/* CSS para animaciones personalizadas */}
      <style>{`
        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }
        
        .animate-slide-up {
          animation: slideUp 0.8s ease-out;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
