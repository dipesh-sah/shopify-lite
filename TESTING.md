# Testing Your E-commerce Platform

## Frontend Access

### Storefront (Customer-facing)
Visit these URLs in your browser:

1. **Homepage**: http://localhost:3000
2. **All Products**: http://localhost:3000/products
3. **Product Details**: http://localhost:3000/products/[product-id]
4. **Shopping Cart**: http://localhost:3000/cart
5. **Checkout**: http://localhost:3000/checkout
6. **Sign In/Sign Up**: http://localhost:3000/signin
7. **User Account**: http://localhost:3000/account

### Admin Panel
Visit these URLs:

1. **Admin Dashboard**: http://localhost:3000/admin
2. **Products Management**: http://localhost:3000/admin/products
3. **Add New Product**: http://localhost:3000/admin/products/new
4. **Edit Product**: http://localhost:3000/admin/products/[product-id]/edit
5. **Orders Management**: http://localhost:3000/admin/orders

## How to Test

### 1. Create a Product (Admin)
1. Go to http://localhost:3000/admin/products
2. Click "Add Product" button
3. Fill in all details:
   - Name, Description, Price
   - Upload images or add URLs
   - Add tags
   - Set stock quantity
4. Click "Create Product"

### 2. View Products (Storefront)
1. Go to http://localhost:3000/products
2. You'll see all products in a grid
3. Click on any product to see details

### 3. Add to Cart
1. On product detail page
2. Click "Add to Cart" button
3. Go to http://localhost:3000/cart to see cart

### 4. Checkout
1. From cart page, click "Proceed to Checkout"
2. Stripe checkout will open (test mode)

## Firebase Setup Required

**IMPORTANT**: To see products and use all features, you need to:

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Enable Authentication (Email/Password)
4. Add credentials to `.env` file
5. Restart dev server: `npm run dev`

## Quick Start URLs

**Main Pages:**
- Storefront: http://localhost:3000
- Admin: http://localhost:3000/admin

**Your dev server is running on port 3000**
