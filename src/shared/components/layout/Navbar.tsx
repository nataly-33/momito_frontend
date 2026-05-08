import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, User, Search, Menu, X, Heart } from "lucide-react";
import { useAuthStore } from "@/core/store/auth.store";
import { useCartStore } from "@core/store/cart.store";
import { PUBLIC_ROUTES, PRIVATE_ROUTES } from "@/core/config/routes";

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const { items } = useCartStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(PUBLIC_ROUTES.HOME);
  };

  const cartItemsCount = items.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <nav className="sticky top-0 z-50 bg-neutral-light/50 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          <Link to={PUBLIC_ROUTES.HOME} className="flex items-center space-x-3">
            <img 
              src="/logo/logo.png" 
              alt="SmartSales Logo" 
              className="h-12 w-12 object-contain"
            />
            <span className="text-2xl font-display font-bold text-text-important">
              TU MOMITO
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to={PUBLIC_ROUTES.PRODUCTS}
              className="text-text-secondary hover:text-accent-chocolate transition-colors font-medium"
            >
              Catálogo
            </Link>
            <Link
              to="/new-arrivals"
              className="text-text-secondary hover:text-accent-chocolate transition-colors font-medium"
            >
              Novedades
            </Link>
            <Link
              to="/featured"
              className="text-text-secondary hover:text-accent-chocolate transition-colors font-medium"
            >
              Destacados
            </Link>
          </div>

          {/* Right Section */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Search */}
            <button className="p-2 text-text-secondary hover:text-accent-chocolate transition-colors">
              <Search size={22} />
            </button>

            {isAuthenticated ? (
              <>
                {/* Favorites */}
                <Link
                  to={PRIVATE_ROUTES.FAVORITES}
                  className="p-2 text-text-secondary hover:text-accent-chocolate transition-colors"
                >
                  <Heart size={22} />
                </Link>

                {/* Cart */}
                <Link
                  to={PRIVATE_ROUTES.CART}
                  className="relative p-2 text-text-secondary hover:text-accent-chocolate transition-colors"
                >
                  <ShoppingBag size={22} />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent-chocolate text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemsCount}
                    </span>
                  )}
                </Link>

                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-text-secondary hover:text-accent-chocolate transition-colors">
                    <User size={22} />
                    <span className="text-sm font-medium">{user?.nombre}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 border border-border">
                    <Link
                      to={PRIVATE_ROUTES.PROFILE}
                      className="block px-4 py-2 text-sm text-text-primary hover:bg-primary-light transition-colors"
                    >
                      Mi Perfil
                    </Link>
                    <Link
                      to={PRIVATE_ROUTES.ORDERS}
                      className="block px-4 py-2 text-sm text-text-primary hover:bg-primary-light transition-colors"
                    >
                      Mis Pedidos
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-error hover:bg-primary-light transition-colors"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  to={PUBLIC_ROUTES.LOGIN}
                  className="text-text-secondary hover:text-accent-chocolate transition-colors font-medium"
                >
                  Ingresar
                </Link>
                <Link
                  to={PUBLIC_ROUTES.REGISTER}
                  className="px-5 py-2.5 bg-accent-chocolate text-white rounded-lg hover:bg-accent-chocolateHover transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-text-secondary hover:text-accent-chocolate transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-neutral-light/50">
          <div className="px-4 py-4 space-y-3">
            <Link
              to={PUBLIC_ROUTES.PRODUCTS}
              className="block text-text-primary hover:text-accent-chocolate font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Catálogo
            </Link>
            <Link
              to="/new-arrivals"
              className="block text-text-primary hover:text-accent-chocolate font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Novedades
            </Link>
            <Link
              to="/featured"
              className="block text-text-primary hover:text-accent-chocolate font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Destacados
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to={PRIVATE_ROUTES.CART}
                  className="block text-text-primary hover:text-accent-chocolate font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Carrito ({cartItemsCount})
                </Link>
                <Link
                  to={PRIVATE_ROUTES.FAVORITES}
                  className="block text-text-primary hover:text-accent-chocolate font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Favoritos
                </Link>
                <Link
                  to={PRIVATE_ROUTES.PROFILE}
                  className="block text-text-primary hover:text-accent-chocolate font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Mi Perfil
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-error font-medium"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  to={PUBLIC_ROUTES.LOGIN}
                  className="block text-text-primary hover:text-accent-chocolate font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Ingresar
                </Link>
                <Link
                  to={PUBLIC_ROUTES.REGISTER}
                  className="block text-text-primary hover:text-accent-chocolate font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
