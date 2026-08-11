import { NewBuildWizard } from '@/components/budget-request/NewBuildWizard';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Obra Nueva en Mallorca | Express Renovation',
    description: 'Cuéntanos tu proyecto de construcción y obra nueva.',
};

export default function NewBuildPage() {
    return <NewBuildWizard />;
}
