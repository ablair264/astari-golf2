# E-Commerce Implementation Plan
## Astari Golf - Full Shopping Experience

---

## Overview
Build a complete e-commerce system with cart, wishlist, checkout, user accounts, and admin inventory management. All components should follow the current homepage design aesthetic using shadcn/ui, kibo-ui, spectrumui, and custom UI components.

---

## Phase 1: Foundation & State Management

### 1.1 Shopping Cart Context & State
**Goal:** Create a robust cart state management system
- [ ] Create `CartContext.jsx` with React Context for global cart state
- [ ] Implement cart actions: `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`
- [ ] Add localStorage persistence for cart data
- [ ] Create cart utility functions for calculating totals, tax, shipping
- [ ] Add cart item validation and stock checking

### 1.2 Wishlist Context & State
**Goal:** Implement wishlist functionality with persistence
- [ ] Create `WishlistContext.jsx` for global wishlist state
- [ ] Implement wishlist actions: `addToWishlist`, `removeFromWishlist`, `toggleWishlist`
- [ ] Add localStorage persistence for wishlist data
- [ ] Create utility to check if item is in wishlist

### 1.3 User Authentication Context
**Goal:** Set up user authentication and session management
- [ ] Extend existing auth context for customer accounts
- [ ] Add user profile state management
- [ ] Implement order history state
- [ ] Create customer preferences state (saved addresses, payment methods)

---

## Phase 2: Cart Implementation

### 2.1 Cart Icon & Badge in Navbar
**Goal:** Add visual cart indicator to navigation
- [ ] Update `Navbar.jsx` to include cart icon with item count badge
- [ ] Style cart badge to match design system (using kibo-ui/spectrumui patterns)
- [ ] Add smooth animation when items are added to cart
- [ ] Make cart icon clickable to open drawer

### 2.2 Cart Drawer Component
**Goal:** Create sliding drawer for cart preview
- [ ] Create `CartDrawer.jsx` using shadcn Sheet component
- [ ] Design cart item cards showing: image, name, price, quantity controls
- [ ] Add quantity increment/decrement buttons
- [ ] Implement remove item functionality
- [ ] Show cart subtotal, estimated tax, shipping
- [ ] Add "View Cart" and "Checkout" CTAs
- [ ] Style with gradients and design system colors

### 2.3 Full Cart Page
**Goal:** Dedicated cart page for detailed review
- [ ] Create `CartPage.jsx` route at `/cart`
- [ ] Display all cart items in detailed table/grid view
- [ ] Add bulk actions (remove selected, save for later)
- [ ] Show order summary panel (sticky on scroll)
- [ ] Add promo code input field
- [ ] Implement shipping calculator
- [ ] Add "Continue Shopping" and "Proceed to Checkout" buttons

### 2.4 AJAX Cart Updates
**Goal:** Real-time cart updates without page refresh
- [ ] Implement optimistic UI updates for cart actions
- [ ] Add loading states for cart operations
- [ ] Create toast notifications for cart actions
- [ ] Handle error states gracefully
- [ ] Sync cart with backend API endpoints

---

## Phase 3: Wishlist Implementation

### 3.1 Wishlist Icon & Functionality
**Goal:** Add wishlist toggle to product cards
- [ ] Add heart icon to product cards with toggle state
- [ ] Implement wishlist button in product details
- [ ] Add animation when toggling wishlist
- [ ] Update navbar with wishlist icon and count badge

### 3.2 Wishlist Modal
**Goal:** Create modal to view and manage wishlist items
- [ ] Create `WishlistModal.jsx` using shadcn Dialog component
- [ ] Display wishlist items in grid layout
- [ ] Add "Add to Cart" button for each item
- [ ] Implement remove from wishlist functionality
- [ ] Show empty state when wishlist is empty

### 3.3 Similar Products Suggestions
**Goal:** Recommend products based on wishlist items
- [ ] Create algorithm to find similar products (by category, brand, price range)
- [ ] Add "You Might Also Like" section in wishlist modal
- [ ] Display 4-6 recommended products
- [ ] Make recommendations clickable to view product details
- [ ] Style recommendations with subtle visual separation

---

## Phase 4: Product Details Page

### 4.1 Product Details Route & Component
**Goal:** Create comprehensive product detail view
- [ ] Create `ProductDetailsPage.jsx` route at `/products/:id`
- [ ] Implement product data fetching from Firebase
- [ ] Design hero section with large product image gallery
- [ ] Add image carousel/lightbox for multiple product images
- [ ] Display product name, brand, price, description

### 4.2 Product Information Sections
**Goal:** Show detailed product specifications
- [ ] Create tabbed interface for: Description, Specifications, Reviews
- [ ] Display materials, dimensions, care instructions
- [ ] Show stock availability status
- [ ] Add SKU, category, brand information
- [ ] Include shipping & return information

### 4.3 Add to Cart/Wishlist Actions
**Goal:** Enable purchasing from product page
- [ ] Add quantity selector with stock validation
- [ ] Implement "Add to Cart" button with loading state
- [ ] Add "Add to Wishlist" heart icon toggle
- [ ] Show success notification when added to cart
- [ ] Add "Buy Now" fast checkout option
- [ ] Display related products section at bottom

### 4.4 Product Reviews & Ratings
**Goal:** Show social proof and customer feedback
- [ ] Create rating display (stars out of 5)
- [ ] Show review count and average rating
- [ ] Display recent customer reviews
- [ ] Add review submission form (for logged-in users)
- [ ] Implement review sorting (most recent, highest rated)

---

## Phase 5: Checkout Process

### 5.1 Checkout Page Layout
**Goal:** Create multi-step checkout flow
- [ ] Create `CheckoutPage.jsx` route at `/checkout`
- [ ] Design 3-step progress indicator: Shipping → Payment → Review
- [ ] Implement step navigation with validation
- [ ] Show order summary panel (sticky)
- [ ] Add breadcrumb navigation

### 5.2 Shipping Information Step
**Goal:** Collect delivery details
- [ ] Create shipping address form with validation
- [ ] Implement address autocomplete (Google Places API)
- [ ] Add "Save address" checkbox for logged-in users
- [ ] Show saved addresses for returning customers
- [ ] Implement shipping method selection (standard, express)
- [ ] Calculate and display shipping costs
- [ ] Validate form before allowing next step

### 5.3 Payment Information Step
**Goal:** Secure payment collection
- [ ] Create payment form layout
- [ ] Integrate Stripe/PayPal payment elements
- [ ] Add credit card input with validation
- [ ] Show payment security badges
- [ ] Implement billing address (same as shipping option)
- [ ] Add "Save payment method" for logged-in users
- [ ] Validate payment details before review

### 5.4 Order Review & Confirmation
**Goal:** Final order verification before submission
- [ ] Display complete order summary
- [ ] Show shipping address, payment method, items
- [ ] Calculate final total with tax and shipping
- [ ] Add terms & conditions checkbox
- [ ] Implement "Place Order" button with loading state
- [ ] Handle payment processing errors
- [ ] Create order in Firebase after successful payment

---

## Phase 6: Order Confirmation

### 6.1 Order Confirmation Page
**Goal:** Confirm successful order placement
- [ ] Create `OrderConfirmationPage.jsx` route at `/order-confirmation/:orderId`
- [ ] Design success message with order number
- [ ] Display order details: items, shipping, total
- [ ] Show estimated delivery date
- [ ] Add tracking information (if available)
- [ ] Include "Continue Shopping" and "View Orders" buttons

### 6.2 Order Confirmation Email
**Goal:** Send email receipt to customer
- [ ] Set up email template for order confirmation
- [ ] Include order details, tracking link, contact info
- [ ] Send email via Firebase Functions + SendGrid/Mailgun
- [ ] Add order to customer's order history

---

## Phase 7: Customer Account Area

### 7.1 Customer Dashboard
**Goal:** Central hub for customer account
- [ ] Create `CustomerDashboard.jsx` route at `/account`
- [ ] Design dashboard layout with sidebar navigation
- [ ] Show account overview: recent orders, saved items
- [ ] Display quick actions: track order, view wishlist
- [ ] Add account settings link

### 7.2 Order History
**Goal:** View all past orders
- [ ] Create `OrderHistoryPage.jsx` at `/account/orders`
- [ ] Display orders table with: date, order #, total, status
- [ ] Implement order filtering (by date, status)
- [ ] Add search functionality
- [ ] Make orders clickable to view details
- [ ] Show order status badges (processing, shipped, delivered)

### 7.3 Order Details View
**Goal:** Detailed view of specific order
- [ ] Create `OrderDetailsPage.jsx` at `/account/orders/:orderId`
- [ ] Display complete order information
- [ ] Show tracking information with timeline
- [ ] Add "Track Package" external link
- [ ] Include invoice download button
- [ ] Show "Request Refund" or "Cancel Order" options (based on status)

### 7.4 Refund Request
**Goal:** Allow customers to request refunds
- [ ] Create refund request modal/form
- [ ] Add reason selection dropdown
- [ ] Include optional comment field
- [ ] Validate refund eligibility (time limit, status)
- [ ] Submit refund request to admin for review
- [ ] Send email notification to customer and admin

### 7.5 Order Cancellation
**Goal:** Enable order cancellation for eligible orders
- [ ] Add "Cancel Order" button for processing orders
- [ ] Show cancellation confirmation modal
- [ ] Implement cancellation logic (only if not shipped)
- [ ] Update order status to "cancelled"
- [ ] Trigger refund process if payment captured
- [ ] Send cancellation confirmation email

### 7.6 Account Settings
**Goal:** Manage customer profile and preferences
- [ ] Create `AccountSettingsPage.jsx` at `/account/settings`
- [ ] Add profile information editor (name, email, phone)
- [ ] Implement saved addresses management (add, edit, delete)
- [ ] Add saved payment methods management
- [ ] Include password change functionality
- [ ] Add email preferences toggles

---

## Phase 8: Admin - Customers Table

### 8.1 Customers Table Component
**Goal:** View and manage all customers
- [ ] Create `AdminCustomers.jsx` page at `/admin/customers`
- [ ] Design table with columns: name, email, orders, total spent, joined date
- [ ] Implement pagination for large customer lists
- [ ] Add search by name/email functionality
- [ ] Include customer filtering (by order count, spend)
- [ ] Add sort functionality for each column

### 8.2 Customer Details Modal
**Goal:** View detailed customer information
- [ ] Create customer details modal (opens on row click)
- [ ] Display customer profile information
- [ ] Show order history for customer
- [ ] Display lifetime value and metrics
- [ ] Add quick actions: email customer, view orders
- [ ] Include customer notes section

### 8.3 Customer Management Actions
**Goal:** Admin actions for customer accounts
- [ ] Add "Edit Customer" functionality
- [ ] Implement account status toggle (active/inactive)
- [ ] Add manual order creation for customers
- [ ] Include export customer data button
- [ ] Add bulk actions for selected customers

---

## Phase 9: Admin - Orders Table

### 9.1 Orders Table Component
**Goal:** Manage all customer orders
- [ ] Create `AdminOrders.jsx` page at `/admin/orders`
- [ ] Design table with: order #, customer, date, total, status, actions
- [ ] Implement real-time order updates from Firebase
- [ ] Add status filter dropdown (all, processing, shipped, delivered, cancelled)
- [ ] Include date range filter
- [ ] Add search by order number or customer name

### 9.2 Order Details & Management
**Goal:** Detailed order view for admins
- [ ] Create order details modal/page
- [ ] Display complete order information
- [ ] Show customer details and contact info
- [ ] Add order status update dropdown
- [ ] Implement "Mark as Shipped" action
- [ ] Add "Process Refund" button
- [ ] Include order notes/comments section

### 9.3 Fulfillment Workflow
**Goal:** Streamline order fulfillment process
- [ ] Add "Print Packing Slip" button
- [ ] Create "Print Shipping Label" functionality
- [ ] Implement "Assign to Shipment" action
- [ ] Add tracking number input field
- [ ] Send shipping notification email to customer
- [ ] Update order status to "shipped" automatically

### 9.4 Refund Processing
**Goal:** Handle refund requests from admin
- [ ] Create refund request queue/section
- [ ] Display pending refund requests
- [ ] Add approve/deny refund actions
- [ ] Implement partial refund functionality
- [ ] Process refund through payment gateway
- [ ] Update order status and send notification

---

## Phase 10: Admin - Inventory Management

### 10.1 Inventory Overview
**Goal:** Track stock levels across all products
- [ ] Create `AdminInventory.jsx` page at `/admin/inventory`
- [ ] Display products table with: name, SKU, stock level, status
- [ ] Add low stock warning indicators
- [ ] Implement out-of-stock highlighting
- [ ] Show stock value calculations
- [ ] Add filter by category/brand

### 10.2 Stock Management
**Goal:** Update and track inventory levels
- [ ] Add "Update Stock" modal for individual products
- [ ] Implement bulk stock update functionality
- [ ] Create stock adjustment history log
- [ ] Add stock alert threshold settings
- [ ] Implement automatic low stock email notifications
- [ ] Show stock movement over time (graph)

### 10.3 Shipment Assignment
**Goal:** Organize orders into shipments
- [ ] Create shipment creation interface
- [ ] Add "Create Shipment" button to orders table
- [ ] Implement batch order selection for shipments
- [ ] Display shipment summary (items, quantities, destination)
- [ ] Add carrier selection dropdown
- [ ] Generate batch shipping labels
- [ ] Update inventory levels when shipment created

### 10.4 Inventory Reports
**Goal:** Analytics for inventory management
- [ ] Create inventory reports dashboard
- [ ] Show stock turnover rate
- [ ] Display best-selling products
- [ ] Add slow-moving inventory report
- [ ] Implement reorder suggestions
- [ ] Add export functionality for reports

---

## Phase 11: Firebase Backend Setup

### 11.1 Firestore Collections
**Goal:** Set up database structure
- [ ] Create `customers` collection with user profiles
- [ ] Create `orders` collection with order documents
- [ ] Create `cart` collection for persistent carts
- [ ] Create `wishlist` collection for saved items
- [ ] Create `inventory` collection for stock tracking
- [ ] Create `shipments` collection for fulfillment
- [ ] Set up Firestore security rules for each collection

### 11.2 Cloud Functions
**Goal:** Backend logic and automation
- [ ] Create order processing function (on order create)
- [ ] Implement payment processing function
- [ ] Add email sending functions (confirmations, notifications)
- [ ] Create inventory update function (on order/shipment)
- [ ] Implement refund processing function
- [ ] Add stock alert function (low stock notifications)

### 11.3 API Endpoints
**Goal:** Create backend API for client operations
- [ ] Cart operations API (add, update, remove, get)
- [ ] Wishlist operations API
- [ ] Order creation and management API
- [ ] Customer profile API
- [ ] Inventory management API
- [ ] Payment processing API integration

---

## Phase 12: Design & Styling

### 12.1 Component Styling
**Goal:** Match homepage aesthetic across new features
- [ ] Review existing design system from homepage
- [ ] Apply consistent gradients from design system
- [ ] Use kibo-ui components where applicable
- [ ] Use spectrumui components for enhanced UI elements
- [ ] Ensure shadcn/ui components are styled consistently
- [ ] Add smooth animations and transitions

### 12.2 Responsive Design
**Goal:** Ensure all features work on mobile/tablet
- [ ] Make cart drawer responsive
- [ ] Optimize checkout flow for mobile
- [ ] Ensure product details page is mobile-friendly
- [ ] Make admin tables responsive with horizontal scroll
- [ ] Test all modals on small screens
- [ ] Add mobile-specific navigation improvements

### 12.3 Loading & Error States
**Goal:** Polished UX for all interactions
- [ ] Add skeleton loaders for data fetching
- [ ] Implement loading spinners for actions
- [ ] Create error boundary components
- [ ] Design error message displays
- [ ] Add empty state illustrations
- [ ] Implement retry mechanisms

---

## Phase 13: Testing & Quality Assurance

### 13.1 Functionality Testing
**Goal:** Ensure all features work correctly
- [ ] Test complete cart flow (add, update, remove, checkout)
- [ ] Test wishlist functionality across pages
- [ ] Verify checkout process end-to-end
- [ ] Test order management from customer perspective
- [ ] Verify admin order processing workflow
- [ ] Test inventory updates and stock tracking

### 13.2 Payment Testing
**Goal:** Verify payment integration
- [ ] Test successful payment scenarios
- [ ] Test payment failure handling
- [ ] Verify refund processing
- [ ] Test 3D Secure authentication
- [ ] Validate payment security compliance

### 13.3 Edge Cases & Error Handling
**Goal:** Handle unexpected scenarios
- [ ] Test concurrent cart updates
- [ ] Test out-of-stock scenarios during checkout
- [ ] Verify behavior with network failures
- [ ] Test session expiration handling
- [ ] Validate form error messages

---

## Phase 14: Launch Preparation

### 14.1 Performance Optimization
**Goal:** Ensure fast loading and smooth interactions
- [ ] Optimize images with lazy loading
- [ ] Implement code splitting for routes
- [ ] Add caching for product data
- [ ] Minimize bundle size
- [ ] Test and optimize Lighthouse scores

### 14.2 Security Review
**Goal:** Protect customer data and payments
- [ ] Review Firestore security rules
- [ ] Validate payment integration security
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Review authentication flows

### 14.3 Documentation
**Goal:** Document system for maintenance
- [ ] Document cart/wishlist state management
- [ ] Create admin user guide
- [ ] Document Firebase collections structure
- [ ] Add code comments for complex logic
- [ ] Create deployment guide

---

## Success Criteria

### Customer Experience
- ✅ Seamless cart experience with instant updates
- ✅ Intuitive checkout flow with clear progress
- ✅ Easy order tracking and management
- ✅ Beautiful, on-brand design throughout

### Admin Experience
- ✅ Efficient order processing workflow
- ✅ Clear inventory visibility
- ✅ Easy customer management
- ✅ Comprehensive reporting

### Technical
- ✅ Fast performance (<2s page load)
- ✅ Secure payment processing
- ✅ Real-time data synchronization
- ✅ Mobile-responsive throughout
- ✅ Scalable architecture

---

## Timeline Estimate

- **Phase 1-2 (Cart):** 1 week
- **Phase 3 (Wishlist):** 3 days
- **Phase 4 (Product Details):** 4 days
- **Phase 5-6 (Checkout):** 1 week
- **Phase 7 (Customer Account):** 1 week
- **Phase 8-10 (Admin):** 1.5 weeks
- **Phase 11 (Backend):** 1 week
- **Phase 12-14 (Polish & Launch):** 1 week

**Total:** ~6-7 weeks for complete implementation

---

## Notes

- All features should use existing Firebase configuration
- Follow current authentication patterns
- Reuse existing component library structure
- Maintain design consistency with homepage
- Prioritize mobile-first approach
- Consider accessibility throughout (WCAG 2.1 AA)
