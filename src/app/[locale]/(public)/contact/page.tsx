import { getDictionary } from '@/lib/dictionaries';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ContactForm } from '@/components/contact/contact-form';
import { CONTACT_INFO } from '@/lib/contact-info';
import { constructMetadata } from '@/i18n/seo-utils';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as any);

  return constructMetadata({
    title: `${dict.contact.title} | Express Renovation Mallorca`,
    description: dict.contact.subtitle,
    path: '/contact',
    locale,
  });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale as any);
  const t = dict.contact;
  const t_cta = dict.blog.cta;

  const { address } = CONTACT_INFO;

  const contactDetails = [
    {
      icon: <Phone className="h-5 w-5" />,
      label: t.phone.label,
      value: CONTACT_INFO.phone,
      href: CONTACT_INFO.phoneHref,
    },
    {
      icon: <Mail className="h-5 w-5" />,
      label: t.email.label,
      value: CONTACT_INFO.email,
      href: `mailto:${CONTACT_INFO.email}`,
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      label: t.address.label,
      value: `${address.street}, ${address.postalCode} ${address.locality}`,
    },
  ];

  return (
    <>
      {/* Hero — quiet, typographic. The form is the point, not a stock photo. */}
      <section className="relative overflow-hidden bg-stone-950 text-white pt-24 pb-28 md:pt-32 md:pb-36">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 25%, hsl(var(--primary)) 0, transparent 42%), radial-gradient(circle at 85% 75%, hsl(var(--primary)) 0, transparent 38%)',
          }}
        />
        <div className="relative container-limited">
          <div className="h-px w-16 bg-primary mb-8" />
          <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-3xl text-balance">
            {t.title}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl font-light leading-relaxed">
            {t.subtitle}
          </p>
        </div>
      </section>

      {/* Form + details, lifted over the hero edge */}
      <section className="relative -mt-16 md:-mt-20 pb-20 md:pb-28">
        <div className="container-limited grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          <div className="lg:col-span-7 rounded-3xl border bg-background p-8 md:p-10 shadow-[0_8px_60px_-20px_rgba(0,0,0,0.28)]">
            <h2 className="font-headline text-2xl md:text-3xl font-bold mb-8">{t.formTitle}</h2>
            <ContactForm t={t} locale={locale} />
          </div>

          <aside className="lg:col-span-5 lg:mt-20 space-y-8">
            <div>
              <h2 className="font-headline text-2xl md:text-3xl font-bold mb-7">{t.infoTitle}</h2>

              <ul className="space-y-1">
                {contactDetails.map((item) => (
                  <li key={item.label}>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="group flex items-start gap-4 -mx-4 px-4 py-4 rounded-2xl hover:bg-muted/50 transition-colors"
                      >
                        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary-onLight">
                          {item.icon}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">
                            {item.label}
                          </span>
                          <span className="block font-headline text-lg group-hover:text-primary-onLight transition-colors break-words">
                            {item.value}
                          </span>
                        </span>
                      </a>
                    ) : (
                      <div className="flex items-start gap-4 px-4 py-4">
                        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary-onLight">
                          {item.icon}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">
                            {item.label}
                          </span>
                          <span className="block text-muted-foreground leading-relaxed">{item.value}</span>
                        </span>
                      </div>
                    )}
                  </li>
                ))}

                <li className="flex items-start gap-4 px-4 py-4">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary-onLight">
                    <Clock className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">
                      Horario
                    </span>
                    <span className="block text-muted-foreground leading-relaxed">
                      Lunes a viernes, 8:00 &ndash; 18:00
                    </span>
                  </span>
                </li>
              </ul>
            </div>

            {/* Map, framed as part of the composition rather than a bare iframe */}
            <div className="overflow-hidden rounded-3xl border aspect-[4/3]">
              <iframe
                src="https://maps.google.com/maps?q=39.530111,2.503278&z=15&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa de ubicación de Express Renovation Mallorca"
              />
            </div>
          </aside>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="w-full py-20 md:py-28 bg-muted/30 border-t">
        <div className="container-limited text-center max-w-3xl">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-balance">{t_cta.title}</h2>
          <p className="text-lg text-muted-foreground mt-5 mb-9 font-light leading-relaxed">
            {t_cta.subtitle}
          </p>
          <Button asChild size="lg" className="font-bold text-base px-8">
            <Link href="/budget-request">
              {t_cta.button}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
