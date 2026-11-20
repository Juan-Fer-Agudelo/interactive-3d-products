export const profile = {
  name: 'Juan Fernando Agudelo Colorado',
  shortName: 'Juan Fer Agudelo',
  role: 'Desarrollador Full-Stack · Automatización e IA · Análisis de Datos',
  location: 'Medellín, Antioquia, Colombia',
  email: 'juan.fernando.arch@gmail.com',
  phone: '+57 301 671 87 93',
  phoneHref: 'tel:+573016718793',
  links: {
    portfolio: 'https://juan-fer-digital.vercel.app',
    github: 'https://github.com/Juan-Fer-Agudelo',
    linkedin: 'https://www.linkedin.com/in/juan-fer-agudelo-861b13264/',
  },
  summary: [
    'Soy desarrollador full-stack y convierto procesos manuales en software que la gente usa todos los días. He trabajado en manufactura automotriz con Renault Sofasa, en la industria con Simex y para empresas de Estados Unidos con Talent Phi.',
    'Mis soluciones redujeron una aprobación de 14 horas a minutos, un proceso de 5 horas a 3 minutos y ahorraron cerca de 130 horas de trabajo manual. He llevado a producción plataformas web con pagos, reservas y analítica para clientes en Miami y Venezuela.',
    'Combino el análisis de datos (SQL, Python, Power BI, Excel, Looker Studio) con el desarrollo de aplicaciones en React, TypeScript, Power Apps, Power Automate, C#, Java y C++. Automatizo procesos con n8n, Make y Power Automate e integro inteligencia artificial en soluciones de negocio.',
    'Trabajo de cerca con las áreas de negocio y de planta, lidero proyectos de punta a punta y me comunico con claridad con usuarios y gerencia.',
  ],
  highlights: [
    { value: '14 h → min', label: 'Aprobar un cambio de estructura en Renault Sofasa' },
    { value: '5 h → 3 min', label: 'Gestión de piezas y subensambles' },
    { value: '~130 h', label: 'De trabajo manual ahorradas con n8n en Simex' },
    { value: '954', label: 'Empleados cubiertos por una sola app en planta' },
    { value: '+40 %', label: 'Menos tiempo operativo con Power Apps y Power Automate' },
    { value: '9,5 / 10', label: 'Calidad de código con QA automatizado' },
  ],
  experience: [
    {
      role: 'Desarrollador Full-Stack y Arquitecto de Software',
      company: 'Talent Phi',
      period: 'Abril 2026 – Actualidad',
      place: 'Doral, Miami, Estados Unidos',
      bullets: [
        'Diseño y llevo a producción plataformas B2B, B2C y de e-commerce, desde el modelo de datos hasta la integración de pagos y la optimización del rendimiento.',
        'Enhance.work: plataforma de empleo en medicina estética para el sur de Florida. Suscripciones recurrentes con Stripe y MongoDB como base de datos.',
        'Perfect B: migré el sitio de la clínica a Astro y React. Reservas y pagos en línea 24 h, en inglés y español, conectados a Phorest y Stripe. Integré Resend API y Google Sheets API.',
        'Miami Bounce: plataforma de reservas para alquiler de inflables con React, Tailwind CSS y MongoDB. Campañas medidas con GA4 y Meta desde el lanzamiento.',
        'Péptidos Venezuela: e-commerce con catálogo, carrito y pedidos, medido con Google Tag Manager, GA4, Meta Pixel y Microsoft Clarity.',
      ],
    },
    {
      role: 'Analista de Automatización y Desarrollo',
      company: 'Simex',
      period: 'Noviembre 2025 – Abril 2026',
      place: 'Colombia',
      bullets: [
        'Diseñé y desarrollé la intranet corporativa del grupo Simex, Soinco y Plastinovo con React, TypeScript y Tailwind CSS.',
        'Lideré el QA con pruebas automatizadas en Selenium: calificación superior a 9,5 sobre 10 en calidad de código y funcionamiento.',
        'Pipelines de CI/CD y control de versiones en Azure DevOps; despliegue en producción con Docker sobre Ubuntu.',
        'Automaticé con n8n la entrega diaria de las 10 tasas de cambio oficiales a Contabilidad, con alerta si falta alguna. Ahorró cerca de 130 horas de trabajo manual.',
        'Microservicios, APIs, web scraping y soluciones con IA y Deep Learning.',
        'SQL Server, Power BI, Excel avanzado y SSRS para tableros estratégicos. Gestión con Jira y Azure DevOps.',
      ],
    },
    {
      role: 'Analista de Datos',
      company: 'Renault Sofasa',
      period: 'Septiembre 2024 – Octubre 2025',
      place: 'Envigado, Antioquia',
      bullets: [
        'Estructura360: app en Power Apps para aprobar ascensos, traslados y cambios salariales. De 14 horas a minutos, para 954 empleados en 2 turnos de Soldadura, Pintura, Ensamble y Logística Industrial.',
        'Gestión de piezas y subensambles: app para fabricación que redujo el tiempo operativo de 5 horas a 3 minutos.',
        'Rechazos de defectos de calidad: app con Power Automate que registra el rechazo y el valor de la pieza al escanearla. La usan 8 UET de Soldadura y Ensamble.',
        'Trazabilidad de AGVs: mapa en tiempo real de los vehículos de guiado automático, con posición, carga, esperas e historial de movimientos.',
        'Análisis de calidad de Pintura: tablero en Looker Studio con DPU, FTT, mapa de calor de defectos y Pareto.',
        'Selección de aspirantes: app en tableta para las 4 escuelas de destreza y la RAC 5, con aptitud calculada automáticamente.',
        'Tableros en Power BI, bases en SharePoint y SQL Server, y gestión con Scrum, Kanban y cascada.',
      ],
    },
  ],
  projects: [
    {
      name: 'Enhance.work',
      tag: 'Plataforma de empleo',
      url: 'https://enhance.work',
      stack: ['React', 'MongoDB', 'Stripe'],
      description:
        'Une empleadores y candidatos de medicina estética en el sur de Florida. Cobra suscripciones recurrentes con Stripe.',
      color: '#5b8def',
    },
    {
      name: 'Perfect B',
      tag: 'Clínica de medicina estética',
      url: 'https://perfectb.com',
      stack: ['Astro', 'React', 'Phorest', 'Stripe', 'Resend'],
      description:
        'Reservas y pagos en línea 24 h, en inglés y español, conectados al sistema de agenda Phorest.',
      color: '#e879a8',
    },
    {
      name: 'Miami Bounce',
      tag: 'Reservas de inflables',
      url: 'https://miabounce.com',
      stack: ['React', 'Tailwind', 'MongoDB', 'GA4'],
      description:
        'El cliente reserva directo con la dueña, sin intermediarios. Campañas medidas con GA4 y Meta.',
      color: '#f59e0b',
    },
    {
      name: 'Péptidos Venezuela',
      tag: 'E-commerce',
      url: 'https://peptidosvzla.com',
      stack: ['React', 'GTM', 'GA4', 'Meta Pixel', 'Clarity'],
      description:
        'Catálogo, carrito y pedidos para vender en Caracas productos importados con protocolo clínico.',
      color: '#10b981',
    },
    {
      name: 'Estructura360',
      tag: 'Renault Sofasa',
      stack: ['Power Apps', 'Power Automate', 'SharePoint'],
      description:
        'Aprobación de ascensos, traslados y cambios salariales en planta. De 14 horas a minutos para 954 empleados.',
      color: '#facc15',
    },
    {
      name: 'Trazabilidad de AGVs',
      tag: 'Renault Sofasa',
      stack: ['Power Apps', 'SQL Server'],
      description:
        'Mapa en tiempo real de los vehículos de guiado automático que abastecen la UET Final, con historial para analizar retrasos.',
      color: '#a78bfa',
    },
    {
      name: 'Tasas de cambio automáticas',
      tag: 'Simex',
      stack: ['n8n', 'APIs', 'Email'],
      description:
        'Entrega diaria de las 10 tasas oficiales a Contabilidad con alerta si falta alguna. Cerca de 130 horas ahorradas.',
      color: '#fb7185',
    },
    {
      name: 'Farmacias MasSalud',
      tag: 'República Dominicana · Independiente',
      stack: ['Slack API', 'ERP'],
      description:
        'Alertas de llegadas tarde en Slack e indicadores de asistencia en el ERP, visibles solo para RR. HH. y Gerencia.',
      color: '#38bdf8',
    },
    {
      name: 'Contadoras AQ',
      tag: 'Independiente',
      stack: ['Next.js', 'Vercel', 'SEO'],
      description:
        'Sitio web optimizado para rendimiento y SEO, con dominio propio, como canal principal para captar clientes.',
      color: '#c084fc',
    },
  ],
  skills: [
    {
      group: 'Desarrollo',
      items: ['React', 'TypeScript', 'JavaScript', 'Astro', 'Next.js', 'Vue.js', 'Tailwind CSS', 'HTML', 'CSS', 'PHP', 'C#', '.NET', 'Java', 'C++', 'Python'],
    },
    {
      group: 'Datos',
      items: ['SQL', 'SQL Server', 'MongoDB', 'Power BI', 'Looker Studio', 'SSRS', 'Excel avanzado'],
    },
    {
      group: 'Automatización e IA',
      items: ['n8n', 'Make', 'Power Automate', 'Power Apps', 'Copilot Studio', 'SharePoint', 'APIs REST', 'Stripe', 'Resend API', 'Google Sheets API', 'Web scraping', 'Deep Learning'],
    },
    {
      group: 'DevOps y calidad',
      items: ['Docker', 'Azure DevOps', 'CI/CD', 'Linux (Ubuntu, CentOS, Mint)', 'Bash', 'Selenium', 'Vercel'],
    },
    {
      group: 'Diseño y gestión',
      items: ['Figma', 'VS Code', 'Visual Studio', 'Scrum', 'Kanban', 'Cascada', 'Jira'],
    },
  ],
  competencies: [
    'Liderazgo de proyectos de punta a punta',
    'Trabajo en equipo con áreas de negocio y de planta',
    'Análisis de datos para tomar decisiones',
    'Comunicación clara con usuarios y gerencia',
    'Aprendizaje continuo y adaptabilidad',
    'Pensamiento estratégico, creatividad e innovación',
  ],
  interests: [
    'Inteligencia artificial', 'Agentes de IA', 'Análisis de datos', 'Arquitectura de software',
    'Industria 4.0', 'Business Intelligence', 'Transformación digital', 'Cloud computing',
  ],
  education: [
    {
      title: 'Ingeniería de Sistemas (octavo semestre)',
      school: 'Institución Universitaria Salazar y Herrera',
      period: '2022 – 2026',
    },
    {
      title: 'Tecnólogo en Sistemas (graduado)',
      school: 'Institución Universitaria Salazar y Herrera',
      period: '',
    },
    {
      title: 'Bachiller Técnico en Sistemas',
      school: 'Institución Educativa Barrio Santander',
      period: '2020',
    },
  ],
  languages: [
    { name: 'Español', level: 'Nativo' },
    { name: 'Inglés', level: 'B1' },
  ],
};

