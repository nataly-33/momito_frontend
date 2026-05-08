import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { HeroCarousel } from "@modules/products/components/HeroCarousel";
import { ProductCard } from "@modules/products/components/ProductCard";
import { productsService } from "../services/products.service";
import type { Product, Category } from "../types";

// Gradiente de fallback cuando la categoría no tiene imagen subida
const CATEGORY_BG: Record<string, string> = {
  "Juguetes":           "from-blue-400 to-blue-600",
  "Iluminación":        "from-yellow-400 to-orange-500",
  "Ropa y Accesorios":  "from-pink-400 to-rose-600",
  "Bazar":              "from-green-400 to-teal-600",
  "Ferretería":         "from-gray-400 to-gray-600",
  "Decoración":         "from-purple-400 to-violet-600",
};

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [featured, newArrivals, cats] = await Promise.all([
        productsService.getFeatured(),
        productsService.getNewArrivals(),
        productsService.getCategories(),
      ]);
      setFeaturedProducts(featured.slice(0, 8));
      setNewProducts(newArrivals.slice(0, 8));
      setCategories(cats.filter((c) => c.activa).slice(0, 8));
    } catch (error) {
      console.error("Error loading homepage:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary">
      <HeroCarousel />

      {/* Categorías — cargadas desde la API */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-center text-neutral-900 mb-12">
            Compra por Categoría
          </h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse aspect-square bg-neutral-200 rounded-lg" />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((category) => {
                const gradient = CATEGORY_BG[category.nombre] ?? "from-neutral-400 to-neutral-600";
                return (
                  <Link
                    key={category.id}
                    to={`/products?categorias=${category.id}`}
                    className="group"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
                      {category.imagen_url ? (
                        <img
                          src={category.imagen_url}
                          alt={category.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${gradient} group-hover:scale-105 transition-transform duration-500`} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-semibold text-base leading-tight">
                          {category.nombre}
                        </h3>
                        <p className="text-white/70 text-xs mt-0.5">
                          {category.total_prendas} productos
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      {/*
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-display font-bold text-neutral-900">
              Productos Destacados
            </h2>
            <Link to="/products?featured=true" className="flex items-center text-primary-600 hover:text-primary-700 font-medium">
              Ver todos <ArrowRight size={20} className="ml-2" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-neutral-200 rounded-2xl mb-4" />
                  <div className="h-4 bg-neutral-200 rounded mb-2" />
                  <div className="h-4 bg-neutral-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section> */}

      {/* Nuevos ingresos */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-display font-bold text-neutral-900">
              Nuevos Ingresos
            </h2>
            <Link to="/products?new=true" className="flex items-center text-primary-600 hover:text-primary-700 font-medium">
              Ver todos <ArrowRight size={20} className="ml-2" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-neutral-200 rounded-xl mb-4" />
                  <div className="h-4 bg-neutral-200 rounded mb-2" />
                  <div className="h-4 bg-neutral-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {newProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-display font-bold text-neutral-900 mb-6">
            Únete a nuestra comunidad
          </h2>
          <p className="text-lg text-neutral-700 mb-8">
            Recibe actualizaciones exclusivas, ofertas especiales y las últimas tendencias
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <input
              type="email"
              placeholder="Tu correo electrónico"
              className="px-6 py-3 rounded-lg border border-neutral-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 w-full sm:w-80"
            />
            <button className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium">
              Suscribirse
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
