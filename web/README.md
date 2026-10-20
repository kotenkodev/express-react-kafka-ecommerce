# 🛍️ KafkaShop — Web Frontend

A modern, responsive e-commerce web application built with **React, TypeScript, React Router, TanStack Query, Zustand, and Tailwind CSS**.

KafkaShop provides a unified frontend for a distributed, event-driven e-commerce platform. It combines a customer-facing storefront with an administrator dashboard, enabling users to browse products, manage shopping carts, place orders, and track deliveries in real time.

Administrators can manage the product catalog, monitor orders, search historical order records, and explore business analytics through interactive dashboards.

The application communicates with the platform's microservices through a centralized API Gateway, while Kafka-powered backend events drive real-time order updates.

---

## 🚀 Key Features

### Customer Experience

- **Product Storefront** — Browse products with responsive cards and infinite scrolling.
- **Product Search** — Find products using search and filtering controls.
- **Product Details** — View product information, pricing, category, and stock availability.
- **Shopping Cart** — Add products, update quantities, remove items, and calculate totals.
- **Checkout** — Create orders directly from the shopping cart.
- **Idempotent Checkout** — Uses unique request identifiers to reduce duplicate order submissions.
- **Order History** — View previously created orders and their current status.
- **Real-Time Tracking** — Receive payment and delivery updates through Server-Sent Events.
- **Authentication** — Register, sign in, restore sessions, and sign out.

### Administrator Experience

- **Product Management** — Create, edit, and delete catalog products.
- **Order Monitoring** — View orders across the platform.
- **Advanced Order Search** — Search indexed orders and filter them by status.
- **Analytics Dashboard** — Visualize business metrics and order activity.
- **Real-Time Updates** — Monitor order status changes as backend events are processed.
- **Role-Based Navigation** — Display administration tools only to authorized users.

### Application Features

- Responsive layouts with a collapsible sidebar.
- Reusable UI components and form controls.
- Client-side routing with protected routes.
- Automatic JWT access token attachment.
- Automatic access token refresh.
- API request caching and invalidation.
- Persistent authentication and cart state.
- Toast notifications and error handling.
- Loading skeletons and empty states.
- Interactive charts and pagination.

## 🛠 Technology Stack

| Technology                        | Purpose                                       |
| --------------------------------- | --------------------------------------------- |
| React                             | Component-based user interface                |
| TypeScript                        | Type-safe frontend development                |
| React Router                      | Client-side routing and navigation            |
| TanStack Query                    | Server-state management and caching           |
| Zustand                           | Authentication, cart, and order state         |
| Axios                             | API communication and request interceptors    |
| Tailwind CSS                      | Responsive utility-based styling              |
| Recharts                          | Analytics charts and visualizations           |
| Zod                               | Form and query validation                     |
| Lucide React                      | Interface icons                               |
| Sonner                            | Toast notifications                           |
| better-sse compatible EventSource | Real-time order updates                       |
| Reusable UI primitives            | Dialogs, tables, cards, forms, and navigation |

## 🏗 Architecture

KafkaShop follows a feature-oriented frontend architecture.

Its React application communicates with a centralized API Gateway rather than directly accessing individual backend services.

```text
                    ┌──────────────────────┐
                    │       KafkaShop      │
                    │    React Frontend    │
                    │                      │
                    │ • Storefront         │
                    │ • Shopping Cart      │
                    │ • Checkout           │
                    │ • Order Tracking     │
                    │ • Admin Dashboard    │
                    └──────────┬───────────┘
                               │
                     Axios / EventSource
                               │
                               ▼
                    ┌──────────────────────┐
                    │      API Gateway     │
                    │       Port 8000      │
                    │                      │
                    │ • JWT Authentication │
                    │ • Request Routing    │
                    │ • Role Authorization │
                    │ • SSE Proxying       │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
   │ Auth Service│     │Order Service│     │Product Svc  │
   │ Port 3006   │     │ Port 3001   │     │ Port 3007   │
   └─────────────┘     └──────┬──────┘     └─────────────┘
                              │
                              ▼
                        Apache Kafka
                              │
          ┌───────────────────┼────────────────────┐
          │                   │                    │
          ▼                   ▼                    ▼
   ┌──────────────┐   ┌──────────────┐   ┌────────────────┐
   │Payment Svc   │   │Delivery Svc  │   │ Search Service │
   │Port 3002     │   │Port 3003     │   │ Elasticsearch  │
   └──────────────┘   └──────────────┘   └────────────────┘
                              │
                              ▼
                       Analytics Service
```

The frontend receives ordinary API responses through Axios and subscribes to real-time order events using the browser's `EventSource` API.

## 🧭 Application Routes

Routing is implemented using React Router's `createBrowserRouter`.

| Route             | Page                       | Access        |
| ----------------- | -------------------------- | ------------- |
| `/login`          | Login                      | Public        |
| `/register`       | Registration               | Public        |
| `/`               | Storefront / home redirect | Authenticated |
| `/products/:id`   | Product details            | Authenticated |
| `/orders`         | Order history / all orders | Authenticated |
| `/product-search` | Product search             | User          |
| `/analytics`      | Analytics dashboard        | Admin         |
| `/search`         | Order search               | Admin         |
| `/products`       | Product management         | Admin         |

### Route Protection

The application includes three route guards.

**ProtectedRoute** checks whether an access token is available. While authentication is initializing, it displays a loading indicator. Unauthenticated users are redirected to `/login`.

**RoleRoute** restricts specific pages based on the authenticated user's role. Unauthorized users are redirected to `/`.

**HomeRoute** renders the storefront for ordinary users and redirects administrators to `/orders`.

These guards improve frontend navigation and user experience. Actual authorization must also be enforced by the backend services.

## 🔐 Authentication

KafkaShop integrates with the Auth Service through the API Gateway.

The authentication system supports account registration, login, logout, access token restoration, and automatic token refresh.

### Authentication Flow

```text
                    User Opens Application
                              │
                              ▼
                       Initialize Auth
                              │
                              ▼
                    Stored Access Token?
                              │
                       ┌──────┴──────┐
                       │             │
                      No            Yes
                       │             │
                       ▼             ▼
                    Login       GET /auth/me
                       │             │
                       ▼             ▼
                Enter Credentials  Validate Session
                       │             │
                       ▼             ▼
                    Login API    Restore User
                       │             │
                       └──────┬──────┘
                              │
                              ▼
                     Authenticated Routes
```

### Authentication State

Authentication state is managed through Zustand.

The store maintains:

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;

  initAuth: () => Promise<void>;
  setAccessToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
}
```

The store uses Zustand's persistence middleware with the storage key:

```text
auth-storage
```

The persisted state includes the current user and access token.

During application initialization, `initAuth()` retrieves current user information through `/auth/me` when a stored access token exists.

If initialization fails, the store clears the authenticated user and access token.

### Authentication API

| Method | Gateway Endpoint     | Description              |
| ------ | -------------------- | ------------------------ |
| `POST` | `/api/auth/register` | Create a user account    |
| `POST` | `/api/auth/login`    | Authenticate credentials |
| `POST` | `/api/auth/refresh`  | Refresh the access token |
| `POST` | `/api/auth/logout`   | End the current session  |
| `GET`  | `/api/auth/me`       | Retrieve current user    |

**Implementation note:** The dedicated `refreshToken()` function currently targets `/auth/refresh-token`, while the Axios interceptor uses `/auth/refresh`. The Auth Service implementation exposes `/auth/refresh`; the dedicated helper should be aligned before use.

## 🔄 Automatic JWT Refresh

The application uses an Axios instance with request and response interceptors.

Every authenticated API request automatically includes:

```http
Authorization: Bearer <access_token>
```

The Axios client is configured with:

```typescript
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});
```

When an API request receives an authentication error, the response interceptor attempts to obtain a new access token through the Auth Service.

A shared `refreshPromise` prevents multiple simultaneous failing requests from triggering independent refresh operations.

The refreshed access token is saved to the authentication store and used for subsequent requests.

The interceptor also displays toast notifications for network errors and server-side failures.

**Security consideration:** The current Zustand persistence configuration stores access tokens in browser storage. Production applications should evaluate the risks of token exposure through cross-site scripting and implement an appropriate token storage strategy.

## 🛍️ Product Storefront

The storefront displays products using reusable product cards and a responsive grid.

Product data is loaded through TanStack Query.

### Infinite Scrolling

The main shop page uses `useInfiniteQuery` to fetch products in pages of 12.

```typescript
useInfiniteQuery({
  queryKey: ["shop-products"],
  queryFn: ({ pageParam = 1 }) =>
    getProducts({
      page: pageParam,
      limit: 12,
    }),
  initialPageParam: 1,
  getNextPageParam: (lastPage) =>
    lastPage.pagination.page < lastPage.pagination.totalPages
      ? lastPage.pagination.page + 1
      : undefined,
});
```

Additional catalog pages are loaded as the user scrolls through the storefront.

The UI provides loading indicators, end-of-catalog messaging, and retry controls when product fetching fails.

### Product Details

The `/products/:id` route displays an individual product.

Customers can review product information and add available items to their cart.

### Product Search

The `/product-search` route provides a dedicated customer-facing product search experience.

The product API supports keyword search, category filtering, price ranges, stock availability, and pagination.

## 🛒 Shopping Cart

Shopping cart state is managed with Zustand and persisted in browser storage.

The cart stores product references, quantities, visibility state, and checkout dialog state.

### Cart Features

| Feature         | Description                                      |
| --------------- | ------------------------------------------------ |
| Add product     | Adds a product or increases an existing quantity |
| Update quantity | Changes product quantity                         |
| Remove product  | Removes an item from the cart                    |
| Calculate total | Computes the cart's total price                  |
| Count items     | Returns the total item count                     |
| Clear cart      | Removes all selected products                    |
| Sidebar cart    | Displays a collapsible cart interface            |
| Checkout dialog | Opens order confirmation                         |

The cart attempts to keep quantities within the selected product's available stock.

When the same product is added again, the quantity is capped by its stock value.

### Cart Layout

The application's main layout contains a shopping cart trigger in the header.

For customers, a cart badge displays the selected item count. The sidebar cart provides access to cart contents and checkout controls.

Administrators do not receive the customer cart interface in the main layout.

## 📦 Order Creation & Checkout

Checkout is implemented through `OrderForm.tsx`.

The checkout process converts cart items into the payload expected by the Order Service.

Example:

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "quantity": 2
  }
]
```

### Checkout Flow

```text
                  Shopping Cart
                        │
                        ▼
                 Review Order
                        │
                        ▼
             Generate Idempotency Key
                        │
                        ▼
                  POST /orders
                        │
                        ▼
                  Order Service
                        │
                 ┌──────┴──────┐
                 │             │
              Success        Failure
                 │             │
                 ▼             ▼
            Update Cache    Show Error
                 │
                 ▼
              Clear Cart
                 │
                 ▼
          Navigate to /orders
```

### Idempotency Protection

The checkout form generates a unique UUID using the browser's `crypto.randomUUID()`.

The identifier is sent through the `Idempotency-Key` header:

```typescript
const response = await axios.post("/orders", payload, {
  headers: {
    "Idempotency-Key": idempotencyKey,
  },
});
```

The same key is retained across attempts until order creation succeeds.

After a successful order, the application generates a new idempotency key for future checkout operations.

This integrates with the Order Service's Redis-backed idempotency mechanism.

### Cache Synchronization

After successful checkout, the application updates its orders cache and invalidates related TanStack Query entries.

```typescript
queryClient.invalidateQueries({
  queryKey: ["orders"],
});

queryClient.invalidateQueries({
  queryKey: ["shop-products"],
});

queryClient.invalidateQueries({
  queryKey: ["products"],
});

queryClient.invalidateQueries({
  queryKey: ["search-orders"],
});
```

The cart is cleared, the checkout dialog closes, and the user is redirected to `/orders`.

## 🚚 Real-Time Order Tracking

KafkaShop receives order status updates through Server-Sent Events.

The `useOrderSSE` hook establishes an `EventSource` connection to the API Gateway.

```typescript
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

const sseUrl = `${apiUrl}/api/events?token=${encodeURIComponent(accessToken)}`;

const eventSource = new EventSource(sseUrl);
```

The token is included as a query parameter because native browser `EventSource` does not support custom authorization headers.

### Supported Order Statuses

The interface handles order states from the backend order lifecycle.

```text
PENDING
   │
   ▼
PAID
   │
   ▼
PREPARING
   │
   ▼
SHIPPED
   │
   ▼
DELIVERED
```

Payment failures can result in an order being marked `FAILED`.

The UI includes reusable order status badges, order cards, tables, and filtering controls.

### SSE Updates

The Order Service broadcasts events under the names:

```text
order_update
order.status.updated
```

These events allow the frontend to reflect changes without repeatedly requesting the full order collection.

The `useOrderSSE` hook integrates with both Zustand order state and TanStack Query.

### Security Note

Passing access tokens in URLs can expose them through logs or other URL-handling infrastructure. Production deployments should carefully control logging and evaluate a safer authentication mechanism for SSE subscriptions.

## 🧑‍💼 Administrator Dashboard

KafkaShop includes a dedicated administrator experience with role-restricted routes and navigation.

Administrators can access product management, order search, analytics, and platform-wide order monitoring.

### Product Management

The `/products` administration route provides a catalog management interface.

It includes reusable components for product creation, editing, deletion confirmation, and tabular product display.

The frontend integrates with the Product Service through the following endpoints:

| Method   | Endpoint                   | Purpose             |
| -------- | -------------------------- | ------------------- |
| `GET`    | `/api/products`            | Retrieve products   |
| `GET`    | `/api/products/categories` | Retrieve categories |
| `POST`   | `/api/products`            | Create a product    |
| `PUT`    | `/api/products/:id`        | Update a product    |
| `DELETE` | `/api/products/:id`        | Delete a product    |

Administrative mutations are protected by backend role checks.

### Order Management

The `/orders` route changes its presentation according to the authenticated user's role.

Regular customers see **My Orders**, while administrators see **All Orders (Admin)**.

The page integrates with the Order Service and subscribes to live SSE notifications.

Administrators can monitor order progression and inspect order information across the platform.

### Order Search

The `/search` route provides administrator-only search capabilities.

It uses the Search Service's Elasticsearch-backed API to query indexed orders.

The search interface supports text queries, status filtering, and pagination.

The API integration is implemented in:

```text
src/features/search/api/search.api.ts
```

## 📊 Analytics Dashboard

The `/analytics` route provides an administrator-only analytics experience.

The page combines real-time metrics from the Analytics Service with historical aggregations from the Search Service.

### Analytics Data Sources

| API Endpoint        | Purpose                  |
| ------------------- | ------------------------ |
| `/api/analytics`    | Operational analytics    |
| `/api/search/stats` | Indexed order statistics |

The analytics page uses Recharts to visualize order activity and business metrics.

### Real-Time Analytics Refresh

The page fetches analytics data every five seconds using TanStack Query.

```typescript
useQuery({
  queryKey: ["analytics-window"],
  queryFn: getAnalytics,
  refetchInterval: 5000,
});
```

The current implementation also builds a short client-side history of recent order count samples.

Each received sample is appended to local component state, retaining up to 12 samples.

The dashboard includes charting components, loading states, error handling, and manual refresh controls.

## 🧠 State Management

KafkaShop uses two complementary state-management approaches.

### Zustand — Client State

Zustand manages authentication, shopping cart, and local order state.

| Store               | Responsibility                                      |
| ------------------- | --------------------------------------------------- |
| `authStore.ts`      | User identity, access token, session initialization |
| `cartStore.ts`      | Cart items, quantities, totals, checkout visibility |
| `ordersStore.ts`    | Local order records and live status updates         |
| `analyticsStore.ts` | Analytics-specific client state                     |

Authentication and cart stores use Zustand persistence middleware.

### TanStack Query — Server State

TanStack Query manages API requests, caching, re-fetching, and cache invalidation.

The application configures:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});
```

The frontend also includes React Query Devtools for inspecting query behavior during development.

## 🎨 UI & Design System

KafkaShop uses Tailwind CSS with reusable React UI components.

The application's design includes a responsive sidebar, product cards, management tables, modal dialogs, status badges, and interactive charts.

Reusable primitives are organized under:

```text
src/components/ui/
```

The available component set includes buttons, cards, inputs, tables, dialogs, dropdown menus, forms, pagination, tabs, sliders, tooltips, loading skeletons, and toast notifications.

The application also includes a reusable emoji picker component, although the Repomix export explicitly excludes it from the primary source subset.

## ⚙️ Environment Configuration

The frontend's Axios client and SSE integration use the API Gateway base URL.

Create an environment file in the frontend workspace:

```dotenv
VITE_API_URL=http://localhost:8000
```

The Axios instance appends `/api` to this base URL:

```typescript
baseURL: import.meta.env.VITE_API_URL + "/api";
```

For example:

```text
http://localhost:8000/api/products
http://localhost:8000/api/orders
http://localhost:8000/api/auth/login
```

The SSE integration uses the same base URL to connect to:

```text
http://localhost:8000/api/events
```

**Note:** The provided Repomix export contains frontend source files, not the frontend's package manifest or build configuration. Additional environment variables and scripts may exist outside this export.

## 💻 Getting Started

### Prerequisites

The frontend requires Node.js, npm, the frontend workspace dependencies, and a running API Gateway connected to the required backend services.

### Local Development

From the monorepo root, install dependencies:

```bash
npm install
```

Navigate to the frontend workspace, assumed to be `web` in the monorepo:

```bash
cd web
```

Create `.env.local`:

```dotenv
VITE_API_URL=http://localhost:8000
```

For a typical Vite-based React development setup, start the development server with:

```bash
npm run dev
```

The frontend is commonly served at:

```text
http://localhost:5173
```

The exact command and port should be confirmed against the frontend's `package.json` and Vite configuration, which were not included in this export.

### Production Build

For a typical Vite project:

```bash
npm run build
```

The resulting static assets can be deployed behind a web server or static hosting platform.

Ensure the production `VITE_API_URL` points to the appropriate API Gateway origin.

The actual build scripts should be verified against the frontend package manifest.

## 📂 Project Structure

```text
src/
├── components/
│   ├── guards/
│   │   ├── HomeRoute.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── RoleRoute.tsx
│   │
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── MainLayout.tsx
│   │
│   ├── reui/
│   │   └── emoji-picker.tsx
│   │
│   └── ui/
│       └── ...
│
├── features/
│   ├── analytics/
│   │   ├── api/
│   │   ├── components/
│   │   ├── store/
│   │   └── types.ts
│   │
│   ├── auth/
│   │   ├── api/
│   │   ├── components/
│   │   ├── schemas/
│   │   ├── store/
│   │   └── types.ts
│   │
│   ├── cart/
│   │   ├── components/
│   │   └── store/
│   │
│   ├── orders/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   └── types.ts
│   │
│   ├── products/
│   │   ├── api/
│   │   ├── components/
│   │   ├── schemas/
│   │   └── types.ts
│   │
│   └── search/
│       ├── api/
│       ├── components/
│       └── types.ts
│
├── hooks/
│   ├── use-mobile.ts
│   └── useDebounce.ts
│
├── lib/
│   ├── axios.ts
│   ├── error.ts
│   └── utils.ts
│
├── pages/
│   ├── AdminProductsPage.tsx
│   ├── AnalyticsPage.tsx
│   ├── LoginPage.tsx
│   ├── OrdersPage.tsx
│   ├── ProductPage.tsx
│   ├── ProductSearchPage.tsx
│   ├── RegisterPage.tsx
│   ├── RouteErrorPage.tsx
│   ├── SearchPage.tsx
│   └── ShopPage.tsx
│
├── App.tsx
├── index.css
├── main.tsx
├── providers.tsx
└── router.tsx
```

### Core Components

| File                                           | Responsibility                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| `src/main.tsx`                                 | React application entry point                                        |
| `src/App.tsx`                                  | Router, providers, authentication initialization, and notifications  |
| `src/router.tsx`                               | Route definitions and access restrictions                            |
| `src/providers.tsx`                            | TanStack Query configuration                                         |
| `src/lib/axios.ts`                             | API client, authorization headers, token refresh, and error handling |
| `src/components/layout/MainLayout.tsx`         | Main application layout                                              |
| `src/components/layout/Sidebar.tsx`            | Role-aware navigation and account controls                           |
| `src/features/auth/store/authStore.ts`         | Persistent authentication state                                      |
| `src/features/cart/store/cartStore.ts`         | Shopping cart management                                             |
| `src/features/orders/hooks/useOrderSSE.ts`     | Real-time order updates                                              |
| `src/features/orders/components/OrderForm.tsx` | Checkout and order submission                                        |
| `src/pages/ShopPage.tsx`                       | Product storefront                                                   |
| `src/pages/OrdersPage.tsx`                     | Order history and monitoring                                         |
| `src/pages/AnalyticsPage.tsx`                  | Analytics dashboard                                                  |
| `src/pages/AdminProductsPage.tsx`              | Administrative product management                                    |
| `src/pages/SearchPage.tsx`                     | Administrative order search                                          |

## 🔗 Backend Integration

KafkaShop works with the following backend services through the API Gateway.

| Service           | Responsibility                                       |
| ----------------- | ---------------------------------------------------- |
| API Gateway       | Central API entry point, authentication, and routing |
| Auth Service      | Registration, login, refresh tokens, and identity    |
| Product Service   | Product catalog, categories, and administration      |
| Order Service     | Checkout, order history, and SSE notifications       |
| Payment Service   | Asynchronous payment simulation                      |
| Delivery Service  | Simulated delivery processing                        |
| Search Service    | Elasticsearch-backed order search and statistics     |
| Analytics Service | Operational business analytics                       |

The frontend does not communicate with Kafka directly. Kafka messaging is handled by backend microservices.

## 🔒 Security Considerations

**Protected Routes:** Client-side route guards restrict access based on authentication and role information. Backend authorization remains essential.

**JWT Handling:** Axios automatically attaches access tokens to API requests and attempts token refresh when authentication expires.

**Token Persistence:** Access tokens and user information are persisted through Zustand. Production deployments should review browser storage security and XSS protections.

**SSE Authentication:** The current SSE connection includes the access token in a query parameter. Avoid logging or otherwise exposing token-bearing URLs.

**Idempotent Checkout:** Unique checkout request keys reduce duplicate orders when requests are retried.

**Role Restrictions:** Administrative features are hidden from regular users, while the API Gateway and backend services provide the actual authorization boundaries.

**Cross-Origin Requests:** Axios uses `withCredentials: true`. The API Gateway and Auth Service must be configured with compatible credential and CORS settings.

**API Errors:** The global Axios interceptor displays network and server errors, while feature components handle operation-specific errors.

**KafkaShop Web Frontend** — A responsive React storefront and administration dashboard connecting customers, products, orders, real-time delivery tracking, and analytics in a distributed e-commerce platform.
