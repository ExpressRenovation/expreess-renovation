import { Wrench, Waves, Home, Layers, Zap, Hammer, Droplets, Paintbrush, Shield } from 'lucide-react';
import { SERVICE_IMAGES } from '@/lib/site-assets';

export const services = [
  {
    id: 'construccion-y-reformas',
    icon: <Wrench />,
    image: SERVICE_IMAGES['construccion-y-reformas'],
    imageHint: 'construction site',
    subservices: [
      { id: 'gestion-integral-obra-nueva' },
      { id: 'reformas-integrales-viviendas-locales' },
      { id: 'ampliaciones-redistribucion' },
      { id: 'asesoramiento-materiales-construccion' },
    ]
  },
  {
    id: 'piscinas',
    icon: <Waves />,
    image: SERVICE_IMAGES['piscinas'],
    imageHint: 'swimming pool',
    subservices: [
      { id: 'diseno-personalizado' },
      { id: 'construccion-gunitado' },
      { id: 'sistemas-cloracion-salina' },
      { id: 'mantenimiento-reparacion' },
    ]
  },
  {
    id: 'reformas-de-interiores',
    icon: <Home />,
    image: SERVICE_IMAGES['reformas-de-interiores'],
    imageHint: 'modern kitchen',
    subservices: [
      { id: 'alicatados-pavimentos' },
      { id: 'instalaciones-fontaneria-electricidad' },
      { id: 'mobiliario-medida' },
      { id: 'banos-sanitarios' },
    ]
  },
  {
    id: 'paramentos-verticales',
    icon: <Layers />,
    image: SERVICE_IMAGES['paramentos-verticales'],
    imageHint: 'building facade',
    subservices: [
      { id: 'revestimientos-continuos' },
      { id: 'aislamiento-sate' },
      { id: 'rehabilitacion-fachadas' },
      { id: 'pintura-impermeabilizacion-exterior' },
    ]
  },
  {
    id: 'pintura',
    icon: <Paintbrush />,
    image: SERVICE_IMAGES['pintura'],
    imageHint: 'professional painter',
    subservices: [
      { id: 'pintura-interior-decorativa' },
      { id: 'pintura-fachadas' },
      { id: 'alisado-paredes' },
      { id: 'tratamiento-humedades' },
    ]
  },
  {
    id: 'impermeabilizacion',
    icon: <Shield />,
    image: SERVICE_IMAGES['impermeabilizacion'],
    imageHint: 'roof waterproofing',
    subservices: [
      { id: 'cubiertas-planas-terrazas' },
      { id: 'reparacion-tejados' },
      { id: 'laminas-membranas' },
      { id: 'aislamiento-cubiertas' },
    ]
  },
  {
    id: 'electricidad',
    icon: <Zap />,
    image: SERVICE_IMAGES['electricidad'],
    imageHint: 'electrical work',
    subservices: [
      { id: 'instalaciones-obra-nueva' },
      { id: 'actualizacion-reforma-electrica' },
      { id: 'boletines-certificaciones' },
      { id: 'iluminacion-led' },
    ]
  },
  {
    id: 'carpinteria',
    icon: <Hammer />,
    image: SERVICE_IMAGES['carpinteria'],
    imageHint: 'woodworking tools',
    subservices: [
      { id: 'ventanas-puertas-aluminio-pvc' },
      { id: 'cerramientos-pergolas' },
      { id: 'puertas-paso-entrada' },
      { id: 'armarios-vestidores-medida' },
    ]
  },
  {
    id: 'fontaneria',
    icon: <Droplets />,
    image: SERVICE_IMAGES['fontaneria'],
    imageHint: 'plumbing pipes',
    subservices: [
      { id: 'redes-fontaneria-desagues' },
      { id: 'reparacion-fugas' },
      { id: 'griferia-sanitarios' },
      { id: 'agua-caliente-sanitaria' },
    ]
  },
];
