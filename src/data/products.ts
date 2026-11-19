export type ProductCategory = 'Iluminación' | 'Relojería' | 'Acústica' | 'Objetos';

export type FinishId = 'obsidiana' | 'titanio' | 'bronce';

export type ProductModelId =
  | 'monolith-lamp'
  | 'chronograph-watch'
  | 'acoustic-speaker'
  | 'ceramic-vessel';

export interface FinishOption {
  id: FinishId;
  name: string;
  swatchHex: string;
  primaryHex: number;
  primaryRoughness: number;
  primaryMetalness: number;
  accentHex: number;
  accentRoughness: number;
  accentMetalness: number;
}

export interface ProductItem {
  id: ProductModelId;
  code: string;
  name: string;
  category: ProductCategory;
  materialSummary: string;
  price: number;
  image: string;
  shortDescription: string;
  description: string;
  dimensions: string;
  weight: string;
  edition: string;
  specs: Array<{ label: string; value: string }>;
}

export const FINISH_OPTIONS: FinishOption[] = [
  {
    id: 'obsidiana',
    name: 'Obsidiana Mate',
    swatchHex: '#1A1A1E',
    primaryHex: 0x1a1a1f,
    primaryRoughness: 0.42,
    primaryMetalness: 0.72,
    accentHex: 0xd4a853,
    accentRoughness: 0.2,
    accentMetalness: 0.94,
  },
  {
    id: 'titanio',
    name: 'Titanio Cepillado',
    swatchHex: '#6E727A',
    primaryHex: 0x6c7078,
    primaryRoughness: 0.26,
    primaryMetalness: 0.92,
    accentHex: 0xc89d54,
    accentRoughness: 0.22,
    accentMetalness: 0.92,
  },
  {
    id: 'bronce',
    name: 'Bronce Oscuro',
    swatchHex: '#4A392C',
    primaryHex: 0x3b2d23,
    primaryRoughness: 0.34,
    primaryMetalness: 0.86,
    accentHex: 0xe0b76d,
    accentRoughness: 0.18,
    accentMetalness: 0.96,
  },
];

export const PRODUCTS: ProductItem[] = [
  {
    id: 'monolith-lamp',
    code: 'M-01',
    name: 'Lámpara Monolito M-01',
    category: 'Iluminación',
    materialSummary: 'Aluminio anodizado y latón',
    price: 480,
    image: '/src/assets/images/product_monolith_lamp_1795104330280.jpg',
    shortDescription:
      'Luminaria articulada de escritorio con contrapeso circular de latón macizo.',
    description:
      'Construida en aluminio mecanizado CNC con acabado anodizado profundo. Su anillo inferior de latón actúa como contrapeso físico para equilibrar el brazo articulado sin fricción mecánica visible.',
    dimensions: '420 × 160 × 460 mm',
    weight: '2.4 kg',
    edition: 'Serie Permanente',
    specs: [
      { label: 'Fuente lumínica', value: 'LED cálido 2700K · CRI 97' },
      { label: 'Material principal', value: 'Aluminio 6061-T6 anodizado' },
      { label: 'Contrapeso', value: 'Latón torneado sólido' },
      { label: 'Regulación', value: 'Atenuador táctil continuo' },
    ],
  },
  {
    id: 'chronograph-watch',
    code: 'S-04',
    name: 'Reloj Cronógrafo S-04',
    category: 'Relojería',
    materialSummary: 'Titanio grado 5 y zafiro',
    price: 1290,
    image: '/src/assets/images/product_chronograph_watch_1795104330328.jpg',
    shortDescription:
      'Cronógrafo mecánico de caja arquitectónica en titanio cepillado y cristal abombado.',
    description:
      'Caja esculpida en bloque de titanio grado 5 con bisel escalonado y cristal de zafiro con tratamiento antirreflejos interno. Esfera negra mate con subesferas empotradas y agujas en tono bronce.',
    dimensions: '40.5 × 11.4 mm',
    weight: '78 g',
    edition: 'Edición Numerada',
    specs: [
      { label: 'Calibre', value: 'Automático mecánico 28,800 vph' },
      { label: 'Caja', value: 'Titanio grado 5 cepillado' },
      { label: 'Cristal', value: 'Zafiro abombado antirreflejos' },
      { label: 'Hermeticidad', value: '10 ATM / 100 metros' },
    ],
  },
  {
    id: 'acoustic-speaker',
    code: 'V-08',
    name: 'Altavoz Acústico V-08',
    category: 'Acústica',
    materialSummary: 'Aluminio carbón y cobre',
    price: 840,
    image: '/src/assets/images/product_acoustic_speaker_1795104330072.jpg',
    shortDescription:
      'Monitor cilíndrico inalámbrico con guía de ondas en cobre mecanizado.',
    description:
      'Recinto acústico cilíndrico libre de resonancias internas, coronado por una bocina exponencial torneada en cobre sólido que controla la dispersión de altas frecuencias sobre el tejido técnico frontal.',
    dimensions: '185 × 185 × 330 mm',
    weight: '4.1 kg',
    edition: 'Serie Estudio',
    specs: [
      { label: 'Transductores', value: 'Woofer 5.25" + Tweeter guía cobre' },
      { label: 'Amplificación', value: 'Clase D biamplificada 140 W RMS' },
      { label: 'Respuesta', value: '42 Hz – 24 kHz (±2.5 dB)' },
      { label: 'Conectividad', value: 'Wi-Fi Lossless · USB-C · Aux' },
    ],
  },
  {
    id: 'ceramic-vessel',
    code: 'K-12',
    name: 'Difusor Cerámico K-12',
    category: 'Objetos',
    materialSummary: 'Gres basalto y vidrio ahumado',
    price: 260,
    image: '/src/assets/images/product_ceramic_vessel_1795104329320.jpg',
    shortDescription:
      'Objeto de mesa en gres negro torneado con collar de latón y cúpula de vidrio.',
    description:
      'Cuerpo torneado a mano en gres de alta densidad pigmentado con basalto natural, rematado por un anillo calibrado de latón cepillado y una cúpula de vidrio borosilicato ahumado.',
    dimensions: '125 × 125 × 190 mm',
    weight: '1.15 kg',
    edition: 'Lote Artesanal',
    specs: [
      { label: 'Cuerpo', value: 'Gres vitrificado cocción a 1260 °C' },
      { label: 'Anillo', value: 'Latón cepillado con laca protectora' },
      { label: 'Cúpula', value: 'Vidrio borosilicato soplado' },
      { label: 'Sistema', value: 'Difusión ultrasónica silenciosa' },
    ],
  },
];

export const CATEGORIES: Array<'Todos' | ProductCategory> = [
  'Todos',
  'Iluminación',
  'Relojería',
  'Acústica',
  'Objetos',
];
