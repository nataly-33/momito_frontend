# TUMOMITO ERP — Frontend

Portal web B2B para **TUMOMITO S.A.**, importadora mayorista.  
Construido con React 19, TypeScript, Vite y Tailwind CSS.

---

## Stack

| Capa | Tecnología |
|---|---|
| UI | React 19 + TypeScript |
| Bundler | Vite 7 |
| Estilos | Tailwind CSS 3 |
| Estado global | Zustand |
| Rutas | React Router 7 |
| HTTP | Axios |
| Gráficas | Recharts |
| Pagos | Stripe.js + @stripe/react-stripe-js |
| Carrusel | Swiper |
| Animaciones | Framer Motion |

---

## Requisitos previos

- Node.js 18+
- npm 9+

---

## Instalación rápida

```bash
# 1. Entrar al directorio
cd tm_frontend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
copy .env.example .env     # Windows
# cp .env.example .env     # Linux/Mac
# → editar .env

# 4. Iniciar servidor de desarrollo
npm run dev
# → http://localhost:3000
```

---

## Variables de entorno (.env)

```env
VITE_API_URL=http://localhost:8000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

---

## Scripts

```bash
npm run dev        # servidor de desarrollo (localhost:3000)
npm run build      # build de producción
npm run preview    # previsualizar build local
npm run lint       # ESLint
```

---

## Rutas principales de la app

| Ruta | Descripción |
|---|---|
| `/` | Página de inicio (hero + destacados) |
| `/products` | Catálogo con filtros y sidebar |
| `/products/:slug` | Detalle de producto (stock en tiempo real) |
| `/cart` | Carrito de compras |
| `/checkout` | Proceso de pago (Stripe) |
| `/orders` | Mis pedidos |
| `/login` / `/register` | Autenticación |
| `/profile` | Perfil del cliente |
| `/admin/dashboard` | Dashboard ERP con gráficas (solo staff) |
| `/admin/products` | Gestión de productos |
| `/admin/orders` | Gestión de pedidos |
| `/admin/inventory` | Control de inventario |
| `/admin/quotes` | Cotizaciones B2B |
| `/admin/clients` | Clientes empresa |

---

## Documentación detallada

Ver [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) para la estructura completa de módulos, cómo agregar páginas, convenciones de código y más.
