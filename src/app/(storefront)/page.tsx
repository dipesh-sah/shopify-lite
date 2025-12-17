import {
  getSaleProductsAction,
  getBestSellingProductsAction,
  getFeaturedCategoriesAction,
  getHomepageContentAction
} from "@/actions/storefront"
import { Hero } from "@/components/storefront/Hero"
import { ProductGrid } from "@/components/storefront/ProductGrid"
import { CategoryGrid } from "@/components/storefront/CategoryGrid"
import { FAQ } from "@/components/storefront/FAQ"
import { Newsletter } from "@/components/storefront/Newsletter"

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [
    saleProducts,
    bestSellers,
    categories,
    content
  ] = await Promise.all([
    getSaleProductsAction(4),
    getBestSellingProductsAction(4),
    getFeaturedCategoriesAction(),
    getHomepageContentAction()
  ])

  return (
    <div className="flex flex-col min-h-screen">
      <Hero
        title={content.hero?.heroTitle}
        subtitle={content.hero?.heroSubtitle}
        image={content.hero?.heroImage}
        buttonText={content.hero?.heroButtonText}
        buttonLink={content.hero?.heroButtonLink}
      />

      <ProductGrid
        title="Products On Sale"
        products={saleProducts}
      />

      <CategoryGrid categories={categories} />

      <ProductGrid
        title="Proven BestSellers"
        products={bestSellers}
      />

      {/* Info Section - Placeholder for now as per design "Discover more" */}
      <section className="bg-green-600 text-white py-16 mb-16">
        <div className="container">
          <h2 className="text-3xl font-bold mb-6">Discover more about peptides...</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/10 p-6 rounded-lg backdrop-blur text-center">
                <h3 className="font-bold mb-2">Benefit {i}</h3>
                <p className="text-sm opacity-90">Maximize your recovery and performance with our premium blends.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQ items={content.faqs} />

      <Newsletter />
    </div>
  )
}
