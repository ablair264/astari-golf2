# Neon Product Browser & Cart Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Firebase with Neon (read/write), build ASTARI-branded ProductBrowser + cart drawer + mobile sheets, swap admin to Ref/admin (excluding CaseStudyEditor), and replicate UnifiedChatWidget using golf catalog data.

**Architecture:** Vite/React app using `@neondatabase/serverless` for Neon queries via a shared client. Products, cart, and orders persisted in Neon; cart state mirrored locally for snappy UX. New UI components derived from Ref files, recolored to ASTARI theme (from `src/index.css` / homepage).

**Tech Stack:** React, Vite, Tailwind classes, Neon serverless (SQL over HTTPS), lucide-react, motion/react.

---

### Task 1: Add Neon client + env plumbing

**Files:**
- Create: `src/lib/neonClient.js`
- Create: `.env.example`
- Modify: `vite.config.js`, `package.json`, `package-lock.json`

**Steps:**
1. Add dependency `@neondatabase/serverless` and remove unused Firebase deps from package.json.
2. Add `VITE_NEON_DATABASE_URL` to `.env.example` (use provided conn string).
3. Create `neonClient.js` exporting a singleton query helper with basic error logging.
4. Update Vite config if needed to polyfill `global`/`process` for Neon bundle (esbuild define).

### Task 2: Define Neon schema + seed utilities

**Files:**
- Create: `scripts/neon/schema.sql`
- Create: `scripts/neon/seed.js`
- Modify: `README.md` (brief usage note)

**Steps:**
1. Write SQL for tables: `products`, `categories`, `cart_items(session_id, product_id, quantity)`, `orders`, `order_lines`.
2. Add sample seed script (Node) pulling current static ASTARI sample products from `src/App.jsx` into Neon.
3. Document how to run `psql "<conn>" -f scripts/neon/schema.sql` and `node scripts/neon/seed.js`.

### Task 3: Replace Firebase product service with Neon

**Files:**
- Modify: `src/services/products.js`
- Delete: `src/lib/firebase.js`
- Update imports in `src/pages/*`, components using product services

**Steps:**
1. Rewrite product service to use `neonClient` for list/by-id/by-category queries and optional filters (price/category/search).
2. Expose filter options (categories/price range) computed in SQL.
3. Remove Firebase storage upload helpers; for now assume media URLs are stored as strings in DB.
4. Update consuming pages (HomePage, CollectionPage, ProductDetailsPage, etc.) to use new signatures.

### Task 4: Cart + Order Neon integration

**Files:**
- Modify: `src/contexts/CartContext.jsx`
- Create: `src/services/cart.js`, `src/services/orders.js`
- Modify: `src/pages/CartPage.jsx` (if needed)

**Steps:**
1. Add session_id generation (UUID in localStorage) and load cart lines from Neon on mount.
2. On add/update/remove, optimistically update local state then persist to Neon (upsert/delete).
3. Implement `placeOrder` to insert `orders` + `order_lines`, then clear cart both Neon and local.
4. Add graceful error handling and fallback to local-only if Neon call fails.

### Task 5: Build ProductBrowser (desktop+mobile) from Ref

**Files:**
- Create: `src/components/product/ProductBrowser.jsx`
- Create: `src/components/product/ProductCard.jsx`
- Create: `src/components/product/MobileFilterBar.jsx`
- Create: `src/components/product/MobileProductSheet.jsx`
- Create: `src/components/product/MobileRowCard.jsx`

**Steps:**
1. Port structure/animations from Ref/ClothingBrowser and sibling components, but simplify filters to ASTARI categories/price/search and theme to existing homepage palette/fonts.
2. Replace clothing-specific copy with golf product language; use `motion/react` and lucide icons as in ref.
3. Wire data to Neon product service and CartContext add-to-cart CTA.
4. Add responsive behavior (grid/row toggle, bottom sheet for mobile).

### Task 6: OrderDrawer → CartDrawer with add-to-cart UX

**Files:**
- Create: `src/components/cart/CartDrawer.jsx` (from Ref/OrderDrawer.tsx)
- Wire into: `src/pages/ProductDetailsPage.jsx`, `src/components/Navbar` (cart icon), `ProductBrowser` actions

**Steps:**
1. Adapt drawer UI to ASTARI styling; show cart lines, totals, update qty, remove.
2. Hook buttons to CartContext and `placeOrder`.
3. Include mini checkout form (email/name/address) to send with order.

### Task 7: Replace admin with Ref/admin (exclude CaseStudyEditor)

**Files:**
- Replace: `src/pages/AdminDashboard.jsx`, `src/pages/AdminProducts.jsx`, `src/pages/AdminBrands.jsx`, `src/pages/AdminLogin.jsx` (map to new admin entry)
- Add: `src/admin/...` from `Ref/admin/**` excluding `CaseStudyEditor.tsx`
- Update: routes in `src/App.jsx`

**Steps:**
1. Copy admin components, adjust imports/paths to current aliasing and Neon services (products CRUD).
2. Remove Firebase dependencies from admin flows; use Neon for data.
3. Ensure branding/fonts match ASTARI (reuse global styles).

### Task 8: UnifiedChatWidget replication

**Files:**
- Create: `src/components/UnifiedChatWidget.jsx`
- Integrate into: `src/App.jsx` or layout wrapper

**Steps:**
1. Port UI/animations from Ref/UnifiedChatWidget.tsx, reword to ASTARI support tone.
2. Ensure floating widget doesn’t clash with cart drawer.

### Task 9: Style alignment and assets

**Files:**
- Modify: `src/index.css` (if palette tokens needed)
- Update: any component-specific styles to use Gravesend Sans / existing color vars

**Steps:**
1. Define CSS variables for accent greens and apply to new components.
2. Swap placeholder images with existing `/products/*.png` where possible.

### Task 10: Clean-up & verification

**Files:**
- Update: `package-lock.json`
- Update: `README.md` (usage instructions, env vars)

**Steps:**
1. Run `npm run build` to ensure Vite bundle compiles (adjust as needed).
2. Manual sanity: load Home/ProductBrowser, add to cart, place order (expect successful Neon writes).

---

Ready to execute? Options: run superpowers:executing-plans sequentially here, or handle selectively if priorities differ.***
