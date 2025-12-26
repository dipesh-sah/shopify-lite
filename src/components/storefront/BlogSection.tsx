import Link from "next/link"
import Image from "next/image"

interface BlogSectionProps {
  posts: any[]
}

export function BlogSection({ posts }: BlogSectionProps) {
  if (!posts || posts.length === 0) return null

  return (
    <section className="bg-[#94c94d] py-16 md:py-24">
      <div className="container max-w-7xl px-4 md:px-8">
        <h2 className="text-3xl md:text-4xl font-semibold text-white mb-12">
          Discover more about peptides ...
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col"
            >
              <div className="aspect-[16/9] w-full relative rounded-lg overflow-hidden mb-6 shadow-lg">
                <Image
                  src={post.featured_image || "/placeholder-blog.jpg"}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:underline">
                  {post.title}
                </h3>
                <p className="text-white/90 text-sm line-clamp-4 leading-relaxed font-light">
                  {post.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex justify-center mt-16">
          <Link
            href="/blog"
            className="bg-white text-[#94c94d] hover:bg-gray-100 font-bold px-10 py-3 rounded-md transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
          >
            View all
          </Link>
        </div>
      </div>
    </section>
  )
}
