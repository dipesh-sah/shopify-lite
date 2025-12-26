# Database Setup Guide

## Quick Start - Production Deployment

Run this single file to setup complete database:

```bash
mysql -u username -p database_name < complete_database_schema.sql
```

Or via cPanel phpMyAdmin:
1. Open phpMyAdmin
2. Select your database
3. Go to "Import" tab
4. Choose `complete_database_schema.sql`
5. Click "Go"

## What Gets Created

### Core Tables (20+)
- **Auth & Admin**: roles, admin_users, settings
- **Customers**: customers, customer_addresses, customer_sessions, customer_segments
- **B2B**: companies, company_locations
- **Products**: products, product_variants, product_images, product_categories
- **Categories**: categories, category_translations (multi-language support)
- **Orders**: orders, order_items, refunds
- **Inventory**: Full variant support with default variants
- **Promotions**: Discount codes and campaigns
- **Reviews**: Product reviews with ratings
- **Carts**: Server-side cart management
- **Shipping**: zones, methods, rates

### Metadata System (5 tables)
- metafield_definitions
- metafields
- metaobject_definitions
- metaobjects
- metafield_history

### Blog System (6 tables)
- blog_posts, blog_categories, blog_tags
- blog_post_tags, blog_comments, blog_views
- Includes stored procedures and views

### Additional Features
- SEO metadata
- URL redirects
- Audit logs
- Full-text search on blog posts
- Hierarchical categories with translations
- Multi-language support

## Database Connection

Update your `.env` file:

```env
# Local Development
DATABASE_URL=mysql://root:password@localhost:3306/shopify_lite

# Production (PlanetScale example)
DATABASE_URL=mysql://user:password@host/database?ssl={"rejectUnauthorized":true}

# Or individual variables
DATABASE_HOST=your-host.com
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=your_database
```

## File Structure

```
my-app/
├── complete_database_schema.sql  ← Single comprehensive schema
└── DATABASE_SETUP.md            ← This file
```

All previous migration files have been consolidated into `complete_database_schema.sql` for easier deployment.

## Verification

After import, verify tables:

```sql
-- Check all tables created
SHOW TABLES;

-- Should show 50+ tables

-- Verify key tables
DESCRIBE products;
DESCRIBE blog_posts;
DESCRIBE metafields;
```

## Need Help?

- **Local setup**: Just run the SQL file in your MySQL
- **cPanel**: Use phpMyAdmin import
- **Cloud (Vercel/Railway)**: Follow their database setup guides
- **PlanetScale**: Use their CLI or dashboard import

Total setup time: ~30 seconds! 🚀
