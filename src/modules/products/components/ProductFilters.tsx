import React, { useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";

interface FilterOptions {
  categories: Array<{ id: string; nombre: string }>;
  brands: Array<{ id: string; nombre: string }>;
  colors: string[];
}

interface ActiveFilters {
  categories: string[];
  brands: string[];
  colors: string[];
  priceMin: string;
  priceMax: string;
}

interface ProductFiltersProps {
  options: FilterOptions;
  activeFilters: ActiveFilters;
  onFilterChange: (filters: ActiveFilters) => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  options,
  activeFilters,
  onFilterChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = activeFilters.categories.includes(categoryId)
      ? activeFilters.categories.filter((id) => id !== categoryId)
      : [...activeFilters.categories, categoryId];
    onFilterChange({ ...activeFilters, categories: newCategories });
  };

  const handleBrandToggle = (brandId: string) => {
    const newBrands = activeFilters.brands.includes(brandId)
      ? activeFilters.brands.filter((id) => id !== brandId)
      : [...activeFilters.brands, brandId];
    onFilterChange({ ...activeFilters, brands: newBrands });
  };

  const handleColorToggle = (color: string) => {
    const newColors = activeFilters.colors.includes(color)
      ? activeFilters.colors.filter((c) => c !== color)
      : [...activeFilters.colors, color];
    onFilterChange({ ...activeFilters, colors: newColors });
  };

  const clearAllFilters = () => {
    onFilterChange({
      categories: [],
      brands: [],
      colors: [],
      priceMin: "",
      priceMax: "",
    });
  };

  const hasActiveFilters =
    activeFilters.categories.length > 0 ||
    activeFilters.brands.length > 0 ||
    activeFilters.colors.length > 0;

  return (
    <>
      {/* Mobile Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
      >
        <SlidersHorizontal size={18} />
        Filtros
      </button>

      {/* Filters Sidebar */}
      <div
        className={`
          fixed lg:relative inset-0 lg:inset-auto z-50 lg:z-auto
          bg-white lg:bg-transparent
          transform lg:transform-none transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold">Filtros</h3>
          <button onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="p-4 lg:p-0 space-y-6 overflow-y-auto max-h-screen lg:max-h-none">
          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="pb-6 border-b border-neutral-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">Filtros Activos</h4>
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Limpiar todo
                </button>
              </div>
            </div>
          )}

          {/* Price Range */}
          <div className="pb-6 border-b border-neutral-200">
            <h4 className="font-semibold mb-4">Precio</h4>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="Min"
                value={activeFilters.priceMin}
                onChange={(e) =>
                  onFilterChange({ ...activeFilters, priceMin: e.target.value })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
              <span className="text-neutral-500">-</span>
              <input
                type="number"
                placeholder="Max"
                value={activeFilters.priceMax}
                onChange={(e) =>
                  onFilterChange({ ...activeFilters, priceMax: e.target.value })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="pb-6 border-b border-neutral-200">
            <h4 className="font-semibold mb-4">Categorías</h4>
            <div className="space-y-2">
              {options.categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={activeFilters.categories.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-3 text-sm text-neutral-700">
                    {category.nombre}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div className="pb-6 border-b border-neutral-200">
            <h4 className="font-semibold mb-4">Marcas</h4>
            <div className="space-y-2">
              {options.brands.map((brand) => (
                <label
                  key={brand.id}
                  className="flex items-center cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={activeFilters.brands.includes(brand.id)}
                    onChange={() => handleBrandToggle(brand.id)}
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-3 text-sm text-neutral-700">
                    {brand.nombre}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Colors */}
          {options.colors.length > 0 && (
            <div>
              <h4 className="font-semibold mb-4">Colores</h4>
              <div className="flex flex-wrap gap-3">
                {options.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorToggle(color)}
                    className={`
                      px-3 py-1.5 rounded-full text-sm border-2 transition-all
                      ${
                        activeFilters.colors.includes(color)
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-neutral-300 text-neutral-700 hover:border-neutral-400"
                      }
                    `}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
