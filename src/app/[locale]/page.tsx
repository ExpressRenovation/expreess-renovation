import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function Home() {
  const logoUrl = "https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Fdochevi%2FLogo-Express-web-276w.webp?alt=media&token=70fcace5-1efc-4999-867c-6d933be5cada";
  const underConstructionImageUrl = "https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Fdochevi%2F218434-P0LL3W-528.jpg?alt=media&token=c3092520-0d13-4b4d-9cb8-9ae6677893f2";

  return (
    <main className="flex-1 flex items-center justify-center text-center p-4">
      <div className="space-y-8">
        <div className="flex flex-col items-center gap-8">
            <div className="relative w-72 h-auto mx-auto">
                <Image
                    src={logoUrl}
                    alt="Logo Express Renovation Mallorca"
                    width={276}
                    height={116}
                    className="object-contain"
                    priority
                />
            </div>
             <div className="relative w-full max-w-md h-auto mx-auto">
                <Image
                    src={underConstructionImageUrl}
                    alt="Sitio en construcción"
                    width={500}
                    height={500}
                    className="object-contain rounded-lg"
                />
            </div>
        </div>
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">
          Nuestro sitio web está en construcción
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Estamos trabajando para traerte una experiencia increíble. ¡Vuelve pronto!
        </p>
        <Button asChild>
          <Link href="/hoja-de-ruta">Ver Hoja de Ruta</Link>
        </Button>
      </div>
    </main>
  );
}
