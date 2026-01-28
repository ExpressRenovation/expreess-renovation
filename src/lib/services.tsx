import { Wrench, Waves, Home, Layers, Zap, Hammer, Droplets, Paintbrush, Shield } from 'lucide-react';

export const services = [
  {
    id: 'construccion-y-reformas',
    icon: <Wrench />,
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
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
    image: 'https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Frm-construcciones%2Fstair-swimming-pool-beautiful-luxury-hotel-pool-resort.jpg?alt=media&token=000a63f7-5bc9-4725-8241-9a1aca26f0ee',
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
    image: 'https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Frm-construcciones%2Freformas-interiores.jpg?alt=media&token=538252a2-39d1-4cf6-9901-07bcee453c1a',
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
    image: 'https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Frm-construcciones%2Fportrait-engineer-job-site-work-hours.jpg?alt=media&token=62378104-d756-4d9f-92a7-e0663ce03fc6',
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
    image: 'https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Frm-construcciones%2Fsafety-tools-painting-work.jpg?alt=media&token=2de4b481-d54b-465b-8993-c027428dc313',
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
    image: 'https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Frm-construcciones%2Fclose-up-safety-boos-worker-use-boot-safety-cleaning-by-water.jpg?alt=media&token=2b06910b-0555-461a-9079-9045ddfa7912',
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
    image: 'https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Frm-construcciones%2Fmale-electrician-works-switchboard-with-electrical-connecting-cable.jpg?alt=media&token=398720eb-bd07-4aee-90cc-0376ed7b892a',
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
    image: 'https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Frm-construcciones%2Fcarpinteria.jpg?alt=media&token=3a943388-4d57-474c-86d7-ca02901b2fff',
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
    image: 'https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Frm-construcciones%2Ffontaneria.jpg?alt=media&token=265db5dc-043b-46b9-a87f-d968e5b3f1df',
    imageHint: 'plumbing pipes',
    subservices: [
      { id: 'redes-fontaneria-desagues' },
      { id: 'reparacion-fugas' },
      { id: 'griferia-sanitarios' },
      { id: 'agua-caliente-sanitaria' },
    ]
  },
];
