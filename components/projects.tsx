"use client";

import { useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { Project } from "@/lib/api";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, FreeMode } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";

interface ProjectsProps {
  projects: Project[];
}

export function Projects({ projects }: ProjectsProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

  return (
    <section id="projects" className="py-24 md:py-32 bg-secondary overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
              I nostri progetti
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              Lavori selezionati
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground max-w-md hidden md:block">
              Ogni progetto è una soluzione unica, creata per raggiungere gli
              obiettivi di business del cliente.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => swiperInstance?.slidePrev()}
                className="p-3 rounded-full border border-border hover:bg-foreground hover:text-background transition-colors"
                aria-label="Progetto precedente"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => swiperInstance?.slideNext()}
                className="p-3 rounded-full border border-border hover:bg-foreground hover:text-background transition-colors"
                aria-label="Progetto successivo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">Nessun progetto trovato.</p>
        </div>
      ) : (
        <div className="px-4 sm:px-6 lg:px-8">
          <Swiper
            modules={[Autoplay, Navigation, FreeMode]}
            onSwiper={setSwiperInstance}
            spaceBetween={24}
            slidesPerView="auto"
            freeMode={{
              enabled: true,
              momentum: true,
              momentumRatio: 0.5,
            }}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            loop={true}
            grabCursor={true}
            className="!overflow-visible"
          >
            {projects.map((project) => (
              <SwiperSlide key={project.id} className="!w-[320px] sm:!w-[380px] md:!w-[420px]">
                <a
                  href={project.website_url || "#"}
                  target={project.website_url ? "_blank" : undefined}
                  rel={project.website_url ? "noopener noreferrer" : undefined}
                  className="group relative bg-card rounded-xl overflow-hidden cursor-pointer block"
                  onMouseEnter={() => setHoveredId(project.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    {project.image_src ? (
                      <img
                        src={project.image_src || "/placeholder.svg"}
                        alt={project.titleIT || project.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                        <span className="text-5xl font-bold text-muted-foreground/20">
                          {(project.titleIT || project.title).charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/80 transition-colors duration-300" />

                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <div
                      className={`transform transition-all duration-300 ${
                        hoveredId === project.id
                          ? "translate-y-0 opacity-100"
                          : "translate-y-4 opacity-0"
                      }`}
                    >
                      <p className="text-background/70 text-sm mb-2">
                        {project.categoryIT || project.category}
                      </p>
                      <h3 className="text-background text-xl font-semibold mb-3 flex items-center gap-2">
                        {project.titleIT || project.title}
                        <ArrowUpRight className="h-5 w-5" />
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(
                          project.featuresIT ||
                          project.features ||
                          project.technologies ||
                          []
                        )
                          .slice(0, 3)
                          .map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-1 bg-background/20 text-background rounded"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`absolute bottom-6 left-6 right-6 transition-all duration-300 ${
                      hoveredId === project.id ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    <p className="text-foreground/60 text-sm">
                      {project.categoryIT || project.category}
                    </p>
                    <h3 className="text-foreground text-lg font-semibold">
                      {project.titleIT || project.title}
                    </h3>
                  </div>
                </a>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </section>
  );
}
