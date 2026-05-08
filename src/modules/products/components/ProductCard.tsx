import React from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart } from "lucide-react";
// removed local cart store usage here; we use backend cartService when authenticated
import { cartService } from "@modules/cart/services/cart.service";
import { useAuthStore } from "@core/store/auth.store";
import { PUBLIC_ROUTES } from "@/core/config/routes";
import type { Product } from "@modules/products/types";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { isAuthenticated } = useAuthStore();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      alert("Debes iniciar sesión para agregar al carrito");
      return;
    }

    if (!product.tiene_stock) {
      alert("Producto agotado");
      return;
    }

    // Usar la primera talla disponible si existe (B2C); B2B no requiere talla
    const defaultSize = product.tallas_disponibles_detalle?.[0];
    // Respetar la cantidad mínima de pedido mayorista (min_order_qty)
    const cantidad = Math.max(1, product.min_order_qty || 1);

    try {
      await cartService.addItem({
        prenda_id: product.id,
        talla_id: defaultSize?.id,
        cantidad,
      });
      const moqMsg = cantidad > 1 ? ` (mín. ${cantidad} uds.)` : "";
      alert(`Agregado al carrito: ${product.nombre}${moqMsg}`);
    } catch (err: any) {
      console.error("Error adding to cart:", err);
      alert(err.response?.data?.error || "Error al agregar al carrito");
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      alert("Debes iniciar sesión para agregar a favoritos");
      return;
    }

    // Aquí irá la integración con el backend
    alert("Agregado a favoritos");
  };

  return (
    <div className="group">
      <Link
        to={PUBLIC_ROUTES.PRODUCT_DETAIL(product.slug)}
        className="block bg-white overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 "
        style={{
          boxShadow:
            "0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 15px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Image: same style as admin/products - object-contain with white background */}
        <div className="relative h-40 md:h-44 lg:h-48 overflow-hidden bg-white rounded-t-lg flex items-center justify-center">
          <img
            src={product.imagen_principal || "/images/placeholder.jpg"}
            alt={product.nombre}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.es_novedad && (
              <span className="px-3 py-1.5 bg-accent-chocolate text-white text-xs font-semibold shadow-lg">
                Nuevo
              </span>
            )}
            {product.destacada && (
              <span className="px-3 py-1.5 bg-accent-mauve text-white text-xs font-semibold shadow-lg">
                Destacado
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handleToggleFavorite}
              className="p-2.5 bg-white shadow-lg hover:bg-accent-cream hover:text-accent-chocolate transition-all duration-200 hover:scale-110"
              title="Agregar a favoritos"
            >
              <Heart size={20} />
            </button>
            <button
              onClick={handleAddToCart}
              disabled={!product.tiene_stock}
              className="p-2.5 bg-white shadow-lg hover:bg-accent-cream hover:text-accent-chocolate transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Agregar al carrito"
            >
              <ShoppingCart size={20} />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-5 bg-white">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1.5 font-semibold">
            {product.marca_nombre}
          </p>
          <h3 className="text-base font-semibold text-text-important mb-1.5 line-clamp-2 group-hover:text-accent-chocolate transition-colors">
            {product.nombre}
          </h3>
          <p className="text-sm text-text-secondary mb-3">{product.color}</p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-accent-chocolate">
              Bs {product.precio}
            </span>
            {!product.tiene_stock && (
              <span className="text-xs text-error font-semibold bg-error/10 px-2 py-1">
                Agotado
              </span>
            )}
          </div>
          {(product.min_order_qty ?? 1) > 1 && (
            <p className="text-[10px] text-neutral-400 mt-1">
              Mín. pedido: {product.min_order_qty} uds.
            </p>
          )}
        </div>
      </Link>
    </div>
  );
};
