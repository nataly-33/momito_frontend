# TUMOMITO Frontend — Guía de desarrollo

Esta guía explica la arquitectura, módulos, convenciones y cómo extender el proyecto.

---

## Tabla de contenidos

1. [Estructura de directorios](#1-estructura-de-directorios)
2. [Core — configuración y estado global](#2-core--configuración-y-estado-global)
3. [Módulos de la aplicación](#3-módulos-de-la-aplicación)
4. [Shared — componentes reutilizables](#4-shared--componentes-reutilizables)
5. [Sistema de rutas](#5-sistema-de-rutas)
6. [Sistema de diseño (colores y tipografía)](#6-sistema-de-diseño-colores-y-tipografía)
7. [WebSocket — stock en tiempo real](#7-websocket--stock-en-tiempo-real)
8. [Cómo agregar una nueva página](#8-cómo-agregar-una-nueva-página)
9. [Cómo agregar un nuevo módulo](#9-cómo-agregar-un-nuevo-módulo)
10. [Convenciones de código](#10-convenciones-de-código)

---

## 1. Estructura de directorios

```
tm_frontend/src/
├── core/                       # Configuración central de la app
│   ├── config/
│   │   ├── api.config.ts       # Instancia Axios + interceptores JWT
│   │   ├── endpoints.ts        # Todas las URLs de la API
│   │   └── routes.ts           # Constantes de rutas del frontend
│   ├── hooks/
│   │   └── useProductStock.ts  # WebSocket hook para stock en tiempo real
│   ├── routes/
│   │   ├── index.tsx           # Definición de todas las rutas
│   │   ├── ProtectedRoute.tsx  # Guard: requiere autenticación
│   │   └── AdminRoute.tsx      # Guard: requiere rol Admin/Empleado
│   └── store/
│       ├── auth.store.ts       # Estado de autenticación (Zustand)
│       └── cart.store.ts       # Estado del carrito local (Zustand)
│
├── shared/                     # Componentes y utilidades reutilizables
│   ├── components/
│   │   ├── layout/             # Layout components (Navbar, Footer, AdminLayout)
│   │   └── ui/                 # Componentes UI base (Button, Input, Modal, etc.)
│   └── utils/
│       └── cn.ts               # Utilidad para combinar clases Tailwind
│
└── modules/                    # Módulos de la aplicación (feature-based)
    ├── admin/
    ├── auth/
    ├── cart/
    ├── checkout/
    ├── customers/
    ├── orders/
    ├── products/
    └── reports/
```

### Estructura interna de cada módulo

```
modules/<nombre>/
├── pages/          # Componentes de página (uno por ruta)
├── components/     # Componentes del módulo
├── services/       # Llamadas a la API
└── types/          # Interfaces TypeScript
```

---

## 2. Core — configuración y estado global

### `core/config/api.config.ts`

Instancia de Axios preconfigurada con:
- `baseURL` desde `VITE_API_URL`
- **Interceptor de request**: agrega `Authorization: Bearer <token>` desde `localStorage`
- **Interceptor de response**: si recibe 401, intenta refrescar el token y reintenta; si falla, redirige a `/login`

```typescript
import { api } from '@core/config/api.config';
// Usar `api` para todas las llamadas HTTP — nunca `axios` directamente
```

### `core/config/endpoints.ts`

Centraliza todas las URLs. Estructura:
```typescript
ENDPOINTS.AUTH.LOGIN          // '/auth/login/'
ENDPOINTS.PRODUCTS.LIST       // '/products/prendas/'
ENDPOINTS.CART.ADD_ITEM       // '/cart/agregar/'
ENDPOINTS.ORDERS.CHECKOUT     // '/orders/pedidos/checkout/'
ENDPOINTS.REPORTS.DASHBOARD   // '/reports/dashboard/'
// etc.
```

> Agregar aquí cualquier endpoint nuevo antes de usarlo en los servicios.

### `core/config/routes.ts`

Constantes de rutas del frontend:
```typescript
PUBLIC_ROUTES.HOME            // '/'
PUBLIC_ROUTES.PRODUCTS        // '/products'
PUBLIC_ROUTES.PRODUCT_DETAIL  // (slug) => `/products/${slug}`
PUBLIC_ROUTES.CART            // '/cart'
PUBLIC_ROUTES.CHECKOUT        // '/checkout'
ADMIN_ROUTES.DASHBOARD        // '/admin/dashboard'
```

### `core/store/auth.store.ts` (Zustand)

Estado global de autenticación:
```typescript
const { user, isAuthenticated, login, logout } = useAuthStore();
```

- `login(token, user)` — guarda tokens en `localStorage` y actualiza el estado
- `logout()` — limpia `localStorage` y resetea el estado
- `isAuthenticated` — booleano derivado de si existe el token

### `core/store/cart.store.ts` (Zustand)

Estado local del carrito (sincronizado con `localStorage`):
```typescript
const { items, addItem, removeItem, clearCart, getTotal, getItemsCount } = useCartStore();
```

> El carrito también se persiste en el backend. El store local se usa para el contador del Navbar.

---

## 3. Módulos de la aplicación

### `modules/products`

Catálogo público de productos B2B.

**Páginas:**

| Archivo | Ruta | Descripción |
|---|---|---|
| `HomePage.tsx` | `/` | Hero carousel + productos destacados + novedades |
| `ProductsPage.tsx` | `/products` | Listado con sidebar de filtros, paginación |
| `ProductDetailPage.tsx` | `/products/:slug` | Detalle con galería, selector de cantidad, stock en tiempo real |

**Componentes:**
- `ProductCard.tsx` — tarjeta de producto con imagen, precio, mínimo de pedido y botón de carrito
- `ProductFilters.tsx` — sidebar de filtros (precio, categorías, marcas, colores)
- `HeroCarousel.tsx` — carrusel de la página de inicio

**Servicio (`products.service.ts`):**
```typescript
productsService.getProducts(params)   // listado con filtros
productsService.getProduct(slug)      // detalle por slug
productsService.getCategories()       // para el sidebar
productsService.getBrands()           // para el sidebar
```

**Tipos clave:**
```typescript
interface Product {
  id, nombre, precio, price_wholesale, min_order_qty,
  stock_total, tiene_stock, marca_nombre, slug,
  tallas_disponibles_detalle, imagenes_url, imagen_principal,
  destacada, es_novedad
}
```

**Stock en tiempo real:** `ProductDetailPage` usa el hook `useProductStock(slug)` para actualizar el stock vía WebSocket.

---

### `modules/cart`

**Páginas:**
- `CartPage.tsx` — lista ítems, controles de cantidad, resumen y botón ir a checkout

**Componentes:**
- `CartItem.tsx` — fila de ítem con imagen, nombre, cantidad y eliminar
- `CartSummary.tsx` — subtotal + envío + total + botón checkout
- `EmptyCart.tsx` — estado vacío

**Servicio (`cart.service.ts`):**
```typescript
cartService.getCart()               // GET carrito del backend
cartService.addItem({ prenda_id, talla_id?, cantidad })
cartService.updateItem(id, { cantidad })
cartService.removeItem(id)
cartService.clearCart()
```

---

### `modules/checkout`

Proceso de pago en un solo paso.

**Páginas:**
- `CheckoutPage.tsx` — wrapeado con `<Elements stripe={stripePromise}>` para Stripe

**Flujo del checkout:**
1. Usuario llena: Nombre, Dirección, Ciudad, Teléfono
2. Selecciona método de pago (Efectivo o Tarjeta)
3. Si tarjeta: ingresa nombre en tarjeta + `CardElement` (Stripe)
4. Clic en "Confirmar pedido":
   - Si tarjeta: `stripe.createPaymentMethod()` → `pm_xxx` → envía al backend
   - Backend crea orden + confirma PI con Stripe
   - Si `stripe_client_secret` en respuesta: `stripe.handleCardAction()` para 3D Secure
5. Modal de resultado: ✓ confirmado o ✗ rechazado

**Componentes internos en `CheckoutPage.tsx`:**
- `OrderSummaryColumn` — columna derecha con ítems, totales y botón confirmar
- `ResultModal` — modal con 3 estados: processing (spinner) / success (✓) / error (✗)
- `Field` + `Input` — helpers de formulario con manejo de errores

---

### `modules/orders`

**Páginas:**
- `OrdersPage.tsx` — listado de pedidos del usuario con filtros por estado y fecha
- `OrderDetailPage.tsx` — detalle del pedido, historial de estados, ítems

**Componentes:**
- `OrderCard.tsx` — tarjeta resumen de un pedido
- `OrderTimeline.tsx` — historial de estados visualizado como línea de tiempo
- `OrderFilter.tsx` — filtros de fecha y estado

**Servicio (`orders.service.ts`):**
```typescript
ordersService.getMyOrders()
ordersService.getOrder(id)
ordersService.checkout(data: CheckoutData): Promise<CheckoutResponse>
ordersService.cancelOrder(id)
ordersService.getPaymentMethods()
```

**Tipos clave:**
```typescript
interface CheckoutData {
  metodo_pago: 'efectivo' | 'tarjeta';
  direccion_texto?: string;
  payment_method_id?: string;
  notas_cliente?: string;
}

interface CheckoutResponse {
  message: string;
  pedido: Order;
  stripe_client_secret?: string;  // presente si se requiere 3DS
}
```

---

### `modules/auth`

**Páginas:**
- `LoginPage.tsx` — formulario de login (email + contraseña)
- `RegisterPage.tsx` — registro de usuario

**Servicio (`auth.service.ts`):**
```typescript
authService.login(email, password)   // guarda tokens en localStorage
authService.register(data)
authService.logout()
```

---

### `modules/customers`

Perfil y datos del cliente.

**Páginas:**
- `ProfilePage.tsx` — datos del usuario + formulario de dirección
- `FavoritesPage.tsx` — productos favoritos

**Servicio (`customers.service.ts`):**
```typescript
customersService.getProfile()
customersService.updateProfile(data)
customersService.getAddresses()
customersService.createAddress(data)
customersService.getCompanyProfile()    // perfil B2B
```

---

### `modules/admin`

Panel de administración para empleados y admin de TUMOMITO.  
Todas las rutas bajo `/admin/*` están protegidas por `AdminRoute`.

**Páginas:**

| Archivo | Ruta | Descripción |
|---|---|---|
| `AdminDashboardOverview.tsx` | `/admin/dashboard` | KPIs, gráficas de ventas, top clientes, alertas stock |
| `ProductsManagement.tsx` | `/admin/products` | CRUD de productos |
| `OrdersManagement.tsx` | `/admin/orders` | Gestión y cambio de estado de pedidos |
| `InventoryManagement.tsx` | `/admin/inventory` | Movimientos de inventario |
| `ClientsManagement.tsx` | `/admin/clients` | Clientes empresa |
| `QuotesManagement.tsx` | `/admin/quotes` | Cotizaciones B2B |
| `UsersManagment.tsx` | `/admin/users` | Usuarios del sistema |
| `RolesManagment.tsx` | `/admin/roles` | Roles y permisos |
| `AdminPredictions.tsx` | `/admin/predictions` | Predicciones ML de ventas |

**Dashboard (`AdminDashboardOverview.tsx`) — detalles:**

- Filtro de fecha (Desde / Hasta) que afecta todos los gráficos
- KPI cards: Ingresos, Pedidos pendientes, Productos activos, Clientes, Stock bajo, Total pedidos
- Gráfica de área: ventas confirmadas vs pendientes por mes (selector: 6m/12m/24m/48m)
- Gráfica de barras: top 10 productos por ingresos
- Gráfica dona: distribución de estados de pedidos
- Tabla top 5 clientes con barra de progreso
- Tabla de alertas de stock bajo con botón "Entrada"
- Feed de actividad reciente (pedidos + movimientos + cotizaciones)

---

### `modules/reports`

Reportes avanzados (exportación, filtros personalizados).

**Páginas:**
- `ReportsPage.tsx` — generación de reportes con filtros
- `AnalyticsPage.tsx` — analytics avanzados

---

## 4. Shared — componentes reutilizables

### Layout components (`shared/components/layout/`)

| Componente | Descripción |
|---|---|
| `MainLayout.tsx` | Wrapper para páginas públicas (Navbar + Footer) |
| `AdminLayout.tsx` | Wrapper para páginas admin (sidebar + header) |
| `Navbar.tsx` | Navegación principal con badge del carrito |
| `Footer.tsx` | Footer del sitio |

### UI components (`shared/components/ui/`)

| Componente | Props clave |
|---|---|
| `Button.tsx` | `variant` (primary/secondary/outline), `size`, `disabled` |
| `Input.tsx` | Controlled input con label y error |
| `Modal.tsx` | `isOpen`, `onClose`, `title`, `children` |
| `LoadingSpinner.tsx` | `size` (sm/md/lg) |
| `Pagination.tsx` | `total`, `pageSize`, `currentPage`, `onPageChange` |
| `Card.tsx` | Contenedor con sombra y bordes redondeados |

---

## 5. Sistema de rutas

```typescript
// core/routes/index.tsx — estructura de rutas
<Routes>
  {/* Públicas */}
  <Route path="/" element={<MainLayout />}>
    <Route index element={<HomePage />} />
    <Route path="products" element={<ProductsPage />} />
    <Route path="products/:slug" element={<ProductDetailPage />} />
    <Route path="cart" element={<CartPage />} />
    <Route path="checkout" element={<CheckoutPage />} />
    <Route path="orders/:id" element={<OrderDetailPage />} />
  </Route>

  {/* Requieren autenticación */}
  <Route element={<ProtectedRoute />}>
    <Route path="/orders" element={<OrdersPage />} />
    <Route path="/profile" element={<ProfilePage />} />
  </Route>

  {/* Solo Admin/Empleado */}
  <Route element={<AdminRoute />}>
    <Route path="/admin" element={<AdminLayout />}>
      <Route path="dashboard" element={<AdminDashboardOverview />} />
      <Route path="products" element={<ProductsManagement />} />
      {/* ... */}
    </Route>
  </Route>
</Routes>
```

**Guards:**
- `ProtectedRoute` — redirige a `/login` si `!isAuthenticated`
- `AdminRoute` — redirige a `/` si el usuario no tiene rol Admin o Empleado

---

## 6. Sistema de diseño (colores y tipografía)

El proyecto usa **Tailwind CSS** con colores personalizados. Los colores numéricos de Tailwind (`blue-500`, `primary-600`) **no están disponibles** — usar siempre los nombres del sistema de diseño.

### Colores disponibles

```javascript
// tailwind.config.js
primary: {
  light:   '#E2B8AD',   // rosa claro
  main:    '#CFA195',   // rosa principal
  dark:    '#87564B',   // marrón claro
  darker:  '#6D322A',   // marrón oscuro
}
accent: {
  chocolate:      '#6D3222',  // botones CTA principales
  chocolateHover: '#6D322A',  // hover de CTA
  mauve:          '#87564B',  // secundario
  cream:          '#E2B8AD',  // fondos suaves
}
neutral: {
  lightest: '#FAF9F8',
  light:    '#F5F3F1',
  medium:   '#D2BDAB',
  dark:     '#A59383',
  darker:   '#6D3222',
}
text:   { primary, important, secondary, muted, light }
background: { main, card, header, light }
```

### Colores de estado/feedback

```
success: '#60a67a'   error:   '#ab5151'
warning: '#d3b34a'   info:    '#53759c'
```

### Tipografía

```javascript
fontFamily: {
  sans:    '"Source Serif 4", Georgia, serif',
  display: '"Playfair Display", serif',   // títulos grandes
}
```

### Clases de botón estándar

```tsx
// Botón CTA principal
className="bg-accent-chocolate hover:bg-accent-mauve text-white font-semibold rounded-xl px-6 py-3"

// Botón secundario / outline
className="border border-neutral-medium text-text-secondary hover:bg-neutral-light rounded-xl px-6 py-3"
```

---

## 7. WebSocket — stock en tiempo real

### Hook `useProductStock`

```typescript
import { useProductStock } from '@core/hooks/useProductStock';

const { stock, connected } = useProductStock(slug);
// stock: { disponible: number, min_order_qty: number, tiene_stock: boolean } | null
// connected: boolean — indica si el WebSocket está activo
```

**Comportamiento:**
- Se conecta a `ws://localhost:8000/ws/stock/<slug>/` automáticamente
- Reconecta cada 3 segundos si la conexión se pierde
- Actualiza el estado cuando el backend emite un `broadcast_stock_update`

**Cuándo se actualizan los clientes:**
- Cuando otro usuario completa un checkout (stock reducido)
- Cuando un empleado registra un movimiento de inventario

---

## 8. Cómo agregar una nueva página

### 1. Crear el componente de página

```typescript
// src/modules/<modulo>/pages/NuevaPagina.tsx
export const NuevaPagina: React.FC = () => {
  return <div>Nueva página</div>;
};
```

### 2. Agregar la ruta

```typescript
// src/core/routes/index.tsx
import { NuevaPagina } from '@modules/<modulo>/pages/NuevaPagina';

// En el bloque de rutas apropiado:
<Route path="nueva-pagina" element={<NuevaPagina />} />
```

### 3. Agregar la constante de ruta

```typescript
// src/core/config/routes.ts
export const PUBLIC_ROUTES = {
  ...
  NUEVA_PAGINA: '/nueva-pagina',
};
```

---

## 9. Cómo agregar un nuevo módulo

```
src/modules/nuevo_modulo/
├── pages/
│   └── NuevoModuloPage.tsx
├── components/
│   └── NuevoComponente.tsx
├── services/
│   └── nuevo_modulo.service.ts
└── types/
    └── index.ts
```

```typescript
// services/nuevo_modulo.service.ts
import { api } from '@core/config/api.config';
import { ENDPOINTS } from '@core/config/endpoints';
import type { NuevoTipo } from '../types';

export const nuevoModuloService = {
  async getItems(): Promise<NuevoTipo[]> {
    const response = await api.get(ENDPOINTS.NUEVO_MODULO.LIST);
    return response.data.results ?? response.data;
  },
};
```

```typescript
// core/config/endpoints.ts — agregar el endpoint
NUEVO_MODULO: {
  LIST: '/nuevo_modulo/items/',
  BY_ID: (id: string) => `/nuevo_modulo/items/${id}/`,
},
```

---

## 10. Convenciones de código

### Componentes
- Un componente por archivo, nombre en PascalCase
- Exportar como named export (`export const Foo`)
- Props tipadas con `interface` (no `type`)

### Servicios
- Objeto con métodos async (`const service = { async method() {} }`)
- Siempre tipar el retorno de los métodos
- Usar `ENDPOINTS.*` en lugar de strings literales

### Estado
- Estado local (formularios, UI) → `useState`
- Estado global compartido → Zustand
- No usar Context API directamente

### Llamadas HTTP
- Siempre usar la instancia `api` de `api.config.ts`
- Nunca importar `axios` directamente en módulos
- El manejo de tokens es automático vía interceptores

### Tailwind
- No usar clases de color numéricas (`blue-500`, `primary-600`)
- Usar siempre los tokens del sistema de diseño (`accent-chocolate`, `primary-main`, etc.)
- Para combinar clases condicionalmente: usar la utilidad `cn()` de `shared/utils/cn.ts`

```typescript
import { cn } from '@shared/utils/cn';
className={cn('base-class', isActive && 'active-class', { 'conditional': condition })}
```

### Imports
- Usar aliases en lugar de rutas relativas:
```typescript
import { api } from '@core/config/api.config';       // ✓
import { Button } from '@shared/components/ui/Button'; // ✓
import { api } from '../../../core/config/api.config'; // ✗
```
