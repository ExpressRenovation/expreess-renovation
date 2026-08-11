import { blogPosts, readingMinutes } from '@/lib/blog-posts';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/lib/dictionaries';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, ArrowRight, Calendar, Clock, Tag } from 'lucide-react';
import { JsonLd } from '@/components/seo/json-ld';
import { absoluteUrl, buildArticle, buildBreadcrumbs } from '@/lib/structured-data';
import { SITE_NAME } from '@/lib/contact-info';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
// generateAlternates is used by constructMetadata internally now, but if imported, remove it.
// keeping it clean.

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

import { constructMetadata } from '@/i18n/seo-utils';

// ... (existing imports)

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return {};
  }

  return constructMetadata({
    title: `${post.title} | ${SITE_NAME}`,
    description: post.excerpt,
    image: post.image,
    path: '/blog/[slug]',
    locale,
    params: { slug },
    type: 'article'
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string, locale: any }> }) {
  const { slug, locale } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  const dict = await getDictionary(locale);
  const t_cta = dict.blog.cta;

  if (!post) {
    notFound();
  }

  const postUrl = absoluteUrl('/blog/[slug]', locale, { slug });
  const publishedLabel = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(post.publishedAt));

  const related = blogPosts.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <>
      <JsonLd
        data={[
          buildArticle({
            title: post.title,
            description: post.excerpt,
            url: postUrl,
            image: post.image,
            datePublished: post.publishedAt,
            section: post.category,
          }),
          buildBreadcrumbs([
            { name: 'Inicio', url: absoluteUrl('/', locale) },
            { name: 'Blog', url: absoluteUrl('/blog', locale) },
            { name: post.title, url: postUrl },
          ]),
        ]}
      />
      {/* Title block first, image after — the reader meets the headline, not a
          decorative band. */}
      <section className="pt-16 md:pt-24 pb-10 md:pb-12">
        <div className="container-limited max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary-onLight transition-colors mb-10"
          >
            <ArrowLeft className="h-4 w-4" />
            Blog
          </Link>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs uppercase tracking-[0.14em] mb-7">
            <span className="inline-flex items-center gap-2 font-semibold text-primary-onLight">
              <Tag className="w-3.5 h-3.5" />
              {post.category}
            </span>
            <span className="inline-flex items-center gap-2 text-muted-foreground/70">
              <Calendar className="w-3.5 h-3.5" />
              <time dateTime={post.publishedAt}>{publishedLabel}</time>
            </span>
            <span className="inline-flex items-center gap-2 text-muted-foreground/70">
              <Clock className="w-3.5 h-3.5" />
              {readingMinutes(post.content)} min
            </span>
          </div>

          <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-balance">
            {post.title}
          </h1>

          <p className="mt-7 text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
            {post.excerpt}
          </p>
        </div>
      </section>

      <section className="pb-14 md:pb-20">
        <div className="container-limited max-w-5xl">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl">
            <Image
              src={post.image}
              alt={`Imagen representativa de ${post.title}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
              data-ai-hint={post.imageHint}
            />
          </div>
        </div>
      </section>

      <section className="pb-16 md:pb-24">
        <div className="container-limited">
          <article
            className="prose prose-lg dark:prose-invert mx-auto max-w-3xl
                       prose-headings:font-headline prose-headings:tracking-tight
                       prose-h2:text-3xl prose-h2:mt-14 prose-h2:mb-5
                       prose-h3:text-xl prose-h3:mt-10
                       prose-p:leading-[1.8] prose-p:text-muted-foreground
                       prose-strong:text-foreground prose-strong:font-semibold
                       prose-li:text-muted-foreground prose-li:leading-relaxed
                       prose-a:text-primary-onLight prose-a:no-underline hover:prose-a:underline"
          >
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </article>
        </div>
      </section>

      {/* Related reading — keeps people on site and links the silo */}
      {related.length > 0 && (
        <section className="py-14 md:py-20 border-t bg-muted/20">
          <div className="container-limited">
            <h2 className="font-headline text-2xl md:text-3xl font-bold mb-10">
              Sigue leyendo
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {related.map((other) => (
                <Link
                  key={other.id}
                  href={{ pathname: '/blog/[slug]', params: { slug: other.slug } }}
                  className="group flex flex-col"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl mb-5">
                    <Image
                      src={other.image}
                      alt={other.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-onLight mb-2">
                    {other.category}
                  </span>
                  <h3 className="font-headline text-lg font-bold leading-snug group-hover:text-primary-onLight transition-colors text-balance">
                    {other.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

        <section className="w-full py-20 md:py-28 bg-secondary/50">
          <div className="container-limited text-center">
            <h2 className="font-headline text-3xl md:text-4xl font-bold">{t_cta.postCta.title}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4 mb-8">
              {t_cta.postCta.subtitle}
            </p>
            <Button asChild size="lg" className="font-bold">
              <Link href="/budget-request">
                {t_cta.button}
                <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </section>
    </>
  );
}
