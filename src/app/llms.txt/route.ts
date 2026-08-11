import { services } from '@/lib/services';
import { blogPosts } from '@/lib/blog-posts';
import { locations } from '@/lib/locations';
import { getDictionary } from '@/lib/dictionaries';
import { getLocalizedPath } from '@/i18n/seo-utils';
import { CONTACT_INFO, SITE_NAME, SITE_URL } from '@/lib/contact-info';

/**
 * `/llms.txt` — a plain-language map of the site for AI assistants.
 *
 * Crawlers for answer engines read this to understand what the site covers
 * without parsing every page. Generated from the same sources as the sitemap so
 * it cannot drift out of date.
 *
 * Spanish is used throughout: it is the default locale and the market language.
 */
export async function GET() {
    const dict = await getDictionary('es');
    const { address } = CONTACT_INFO;

    const url = (template: string, params?: Record<string, string>) =>
        `${SITE_URL}${getLocalizedPath(template, 'es', params)}`;

    const serviceBlocks = services
        .map((service) => {
            const t = dict.services?.[service.id];
            if (!t) return null;

            const subs = (service.subservices ?? [])
                .map((sub) => {
                    const subT = t.subservices?.[sub.id];
                    if (!subT) return null;
                    const href = url('/services/[category]/[subcategory]', {
                        category: service.id,
                        subcategory: sub.id,
                    });
                    return `  - [${subT.title}](${href}): ${subT.description}`;
                })
                .filter(Boolean);

            return [
                `- [${t.title}](${url('/services/[category]', { category: service.id })}): ${t.shortDescription ?? ''}`,
                ...subs,
            ].join('\n');
        })
        .filter(Boolean)
        .join('\n');

    const postBlocks = blogPosts
        .map((post) => `- [${post.title}](${url('/blog/[slug]', { slug: post.slug })}): ${post.excerpt}`)
        .join('\n');

    const body = `# ${SITE_NAME}

> Empresa de construcción, reformas integrales y obra nueva en Mallorca (Illes Balears, España). Ejecutamos reformas de viviendas y locales, construcción de piscinas, rehabilitación de fachadas e instalaciones, con acabados de gama alta y presupuesto cerrado por partidas.

Atendemos toda Mallorca, con especial presencia en ${locations.join(', ')}.

- Teléfono: ${CONTACT_INFO.phone}
- Email: ${CONTACT_INFO.email}
- Dirección: ${address.street}, ${address.postalCode} ${address.locality}, ${address.region}, España
- Idiomas de atención: español, inglés, alemán, neerlandés y catalán

## Servicios

${serviceBlocks}

## Presupuestos

- [Solicitar presupuesto](${url('/budget-request')}): formulario guiado que devuelve una estimación para reformas integrales y parciales.
- [Presupuesto rápido](${SITE_URL}/es/presupuesto/rapido): descripción libre del trabajo con fotos o vídeos opcionales.
- [Obra nueva](${SITE_URL}/es/presupuesto/obra-nueva): parcela, superficie a construir y alcance del proyecto.

## Blog

${postBlocks}

## Contacto

- [Página de contacto](${url('/contact')})

## Notas

- Todo el contenido está disponible en español (por defecto), inglés, alemán, neerlandés y catalán.
- El sitemap completo está en ${SITE_URL}/sitemap.xml
`;

    return new Response(body, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
    });
}
