import { services } from '@/lib/services';
import { redirect, notFound } from 'next/navigation';

export async function generateStaticParams() {
    return services.map((service) => ({
        category: service.id,
    }));
}

export default async function ServiceCategoryPage({ params }: { params: Promise<{ category: string }> }) {
    const { category } = await params;
    const service = services.find((s) => s.id === category);

    if (!service) return notFound();

    // If subservices exist, redirect to the first one.
    // Otherwise, we might need a general category page, but for now redirect is safer for SEO silos structure.
    if (service.subservices && service.subservices.length > 0) {
        redirect(`/services/${category}/${service.subservices[0].id}`);
    }

    return notFound();
}
