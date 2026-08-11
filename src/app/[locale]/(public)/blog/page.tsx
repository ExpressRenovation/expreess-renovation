import { getDictionary } from '@/lib/dictionaries';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Clock } from 'lucide-react';
import { blogPosts, readingMinutes } from '@/lib/blog-posts';
import type { Metadata } from 'next';
import { constructMetadata } from '@/i18n/seo-utils';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as any);
  const t = dict.blog;

  return constructMetadata({
    title: t.title,
    description: t.subtitle,
    path: '/blog',
    locale
  });
}

export default async function BlogPage({ params }: { params: Promise<{ locale: any }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const t = dict.blog;

  const dateLabel = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));

  // Newest post leads the page; the rest form the grid below.
  const [featured, ...rest] = [...blogPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <>
      <section className="w-full pt-20 pb-14 md:pt-28 md:pb-16 border-b">
        <div className="container-limited">
          <div className="h-px w-16 bg-primary mb-8" />
          <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-3xl text-balance">
            {t.title}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl font-light leading-relaxed">
            {t.subtitle}
          </p>
        </div>
      </section>

      {/* Featured post */}
      {featured && (
        <section className="w-full py-14 md:py-20">
          <div className="container-limited">
            <Link
              href={{ pathname: '/blog/[slug]', params: { slug: featured.slug } }}
              className="group grid lg:grid-cols-2 gap-8 lg:gap-14 items-center"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl">
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>

              <div>
                <div className="flex items-center gap-4 text-xs uppercase tracking-[0.14em] mb-5">
                  <span className="font-semibold text-primary-onLight">{featured.category}</span>
                  <span className="text-muted-foreground/60">
                    {dateLabel(featured.publishedAt)}
                  </span>
                </div>

                <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.12] text-balance group-hover:text-primary-onLight transition-colors">
                  {featured.title}
                </h2>

                <p className="mt-6 text-lg text-muted-foreground font-light leading-relaxed">
                  {featured.excerpt}
                </p>

                <span className="mt-8 inline-flex items-center gap-2 font-bold text-primary-onLight">
                  {t.readMore}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Remaining posts */}
      {rest.length > 0 && (
        <section className="w-full pb-20 md:pb-28">
          <div className="container-limited">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {rest.map((post) => (
                <Link
                  key={post.id}
                  href={{ pathname: '/blog/[slug]', params: { slug: post.slug } }}
                  className="group flex flex-col"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl mb-6">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  </div>

                  <div className="flex items-center gap-3 text-xs uppercase tracking-[0.14em] mb-3">
                    <span className="font-semibold text-primary-onLight">{post.category}</span>
                    <span className="text-muted-foreground/50 inline-flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {readingMinutes(post.content)} min
                    </span>
                  </div>

                  <h2 className="font-headline text-xl font-bold leading-snug mb-3 text-balance group-hover:text-primary-onLight transition-colors">
                    {post.title}
                  </h2>

                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="w-full py-20 md:py-28 bg-muted/30 border-t">
        <div className="container-limited text-center max-w-3xl">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-balance">{t.cta.title}</h2>
          <p className="text-lg text-muted-foreground mt-5 mb-9 font-light leading-relaxed">
            {t.cta.subtitle}
          </p>
          <Button asChild size="lg" className="font-bold text-base px-8">
            <Link href="/budget-request">
              {t.cta.button}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
