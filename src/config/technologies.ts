import type {Locale} from '../i18n/useTranslation';

export type Technology = {
  id: string;
  icon: string;
  label: string;
  description: Record<Locale, string>;
  tooltip: Record<Locale, string>;
  iconScale?: number;
  iconOffsetX?: number;
  iconOffsetY?: number;
};

export const TECHNOLOGIES_SECTION_COPY: Record<
  Locale,
  {
    titlePhrases: string[];
    subtitle: string;
    instruction: string;
  }
> = {
  pt: {
    titlePhrases: ['Meu stack diário', 'As linguagens que domino', 'Com o que construo', 'Minha base técnica', 'O que me move'],
    subtitle: 'Tecnologias que uso para criar interfaces, automações e produtos digitais.',
    instruction: 'Mova o mouse para explorar',
  },
  en: {
    titlePhrases: ['My daily stack', 'The languages I master', 'What I build with', 'My technical foundation', 'What drives me'],
    subtitle: 'Technologies I use to create interfaces, automations, and digital products.',
    instruction: 'Move your mouse to explore',
  },
};

export const TECHNOLOGIES: Technology[] = [
  {
    id: 'java',
    icon: '/icons/java.svg',
    label: 'Java',
    description: {
      pt: 'Habilidade em lógica de programação, orientação a objetos e estruturação de sistemas com foco em organização, clareza e manutenção do código.',
      en: 'Skilled in programming logic, object-oriented development, and system structuring with a focus on clean, organized, and maintainable code.',
    },
    tooltip: {
      pt: 'Lógica estruturada, back-end e fundamentos sólidos.',
      en: 'Structured logic, back-end, and solid foundations.',
    },
  },
  {
    id: 'python',
    icon: '/icons/python.svg',
    label: 'Python',
    description: {
      pt: 'Experiência na criação de automações, scripts utilitários e soluções que otimizam tarefas repetitivas e fluxos operacionais.',
      en: 'Experienced in building automations, utility scripts, and solutions that optimize repetitive tasks and operational workflows.',
    },
    tooltip: {
      pt: 'Automações, scripts e soluções operacionais.',
      en: 'Automations, scripts, and operational solutions.',
    },
  },
  {
    id: 'springboot',
    icon: '/icons/springboot.svg',
    label: 'Spring Boot',
    description: {
      pt: 'Conhecimento na construção de APIs e estruturas backend em Java, aplicando organização de camadas, regras de negócio e boas práticas de desenvolvimento.',
      en: 'Knowledge in building APIs and backend structures with Java, applying layered architecture, business logic, and development best practices.',
    },
    tooltip: {
      pt: 'Back-end Java, APIs e estruturação de sistemas.',
      en: 'Java back-end, APIs, and system structuring.',
    },
  },
  {
    id: 'pyarmor',
    icon: '/icons/pyarmor.svg',
    label: 'PyArmor',
    description: {
      pt: 'Uso voltado à proteção e empacotamento de scripts Python, reduzindo a exposição direta do código-fonte em projetos distribuíveis.',
      en: 'Used for protecting and packaging Python scripts, reducing direct source-code exposure in distributable projects.',
    },
    tooltip: {
      pt: 'Proteção e empacotamento de scripts distribuíveis.',
      en: 'Protection and packaging for distributable scripts.',
    },
  },
  {
    id: 'javascript',
    icon: '/icons/javascript.svg',
    label: 'JavaScript',
    description: {
      pt: 'Habilidade na criação de funcionalidades dinâmicas, interações visuais e comportamentos personalizados para aplicações web.',
      en: 'Skilled in creating dynamic features, visual interactions, and custom behaviors for web applications.',
    },
    tooltip: {
      pt: 'Interações, lógica de interface e comportamento dinâmico.',
      en: 'Interactions, interface logic, and dynamic behavior.',
    },
  },
  {
    id: 'typescript',
    icon: '/icons/typescript.svg',
    label: 'TypeScript',
    description: {
      pt: 'Aplicação de tipagem estática para tornar o código mais seguro, previsível e escalável em projetos front-end e aplicações maiores.',
      en: 'Applied to make code safer, more predictable, and more scalable in front-end projects and larger applications.',
    },
    tooltip: {
      pt: 'Código mais seguro, escalável e previsível.',
      en: 'Safer, scalable, and more predictable code.',
    },
  },
  {
    id: 'react',
    icon: '/icons/react.svg',
    label: 'React',
    description: {
      pt: 'Desenvolvimento de interfaces modernas com componentes reutilizáveis, foco em experiência do usuário, organização visual e manutenção do projeto.',
      en: 'Development of modern interfaces using reusable components, with a focus on user experience, visual organization, and project maintainability.',
    },
    tooltip: {
      pt: 'Construção de interfaces modernas e componentizadas.',
      en: 'Modern, component-based interface construction.',
    },
  },
  {
    id: 'tailwind',
    icon: '/icons/tailwind.svg',
    label: 'Tailwind CSS',
    description: {
      pt: 'Criação de layouts responsivos, consistentes e modernos com agilidade, mantendo padronização visual e controle direto sobre a interface.',
      en: 'Creation of responsive, consistent, and modern layouts with speed, visual standardization, and direct control over the interface.',
    },
    tooltip: {
      pt: 'Estilização rápida, responsiva e consistente.',
      en: 'Fast, responsive, and consistent styling.',
    },
  },
  {
    id: 'vite',
    icon: '/icons/vite.svg',
    label: 'Vite',
    description: {
      pt: 'Uso em projetos front-end para melhorar o ambiente de desenvolvimento, acelerar builds e tornar o fluxo de criação mais eficiente.',
      en: 'Used in front-end projects to improve the development environment, speed up builds, and make the creation workflow more efficient.',
    },
    tooltip: {
      pt: 'Build rápido e ambiente moderno de desenvolvimento.',
      en: 'Fast build and modern development environment.',
    },
  },
  {
    id: 'nodejs',
    icon: '/icons/nodejs.svg',
    label: 'Node.js',
    description: {
      pt: 'Aplicação em backends, APIs, automações e integrações, conectando aplicações web a serviços, dados e processos externos.',
      en: 'Applied in backends, APIs, automations, and integrations, connecting web applications to services, data, and external processes.',
    },
    tooltip: {
      pt: 'APIs, back-end e integrações.',
      en: 'APIs, back-end, and integrations.',
    },
  },
  {
    id: 'git',
    icon: '/icons/git.svg',
    label: 'Git',
    description: {
      pt: 'Controle de versionamento para organizar alterações, manter histórico do projeto e trabalhar com mais segurança durante o desenvolvimento.',
      en: 'Version control used to organize changes, preserve project history, and work more safely during development.',
    },
    tooltip: {
      pt: 'Controle de versão e fluxo profissional.',
      en: 'Version control and professional workflow.',
    },
  },
  {
    id: 'github',
    icon: '/icons/github.svg',
    label: 'GitHub',
    description: {
      pt: 'Uso profissional para hospedagem de repositórios, documentação de projetos, controle de entregas e apresentação técnica do portfólio.',
      en: 'Professional use for repository hosting, project documentation, delivery management, and technical portfolio presentation.',
    },
    tooltip: {
      pt: 'Organização, publicação e colaboração de projetos.',
      en: 'Project organization, publishing, and collaboration.',
    },
  },
  {
    id: 'cloudflare',
    icon: '/icons/cloudflare.svg',
    label: 'Cloudflare',
    description: {
      pt: 'Uso para deploy e hospedagem via Cloudflare Pages, com distribuição global, HTTPS automático e builds integrados ao GitHub.',
      en: 'Used for deploying and hosting via Cloudflare Pages, with global distribution, automatic HTTPS, and GitHub-integrated builds.',
    },
    tooltip: {
      pt: 'Deploy global, edge e entrega de aplicações.',
      en: 'Global deploy, edge, and application delivery.',
    },
  },
  {
    id: 'firebase',
    icon: '/icons/firebase.svg',
    label: 'Firebase',
    description: {
      pt: 'Aplicado em projetos que precisam de autenticação, banco de dados em tempo real e infraestrutura de backend sem servidor próprio.',
      en: 'Applied in projects requiring authentication, real-time database, and backend infrastructure without managing a dedicated server.',
    },
    tooltip: {
      pt: 'Auth, dados em tempo real e backend gerenciado.',
      en: 'Auth, real-time data, and managed backend.',
    },
  },
  {
    id: 'postgresql',
    icon: '/icons/postgresql.svg',
    label: 'PostgreSQL',
    description: {
      pt: 'Uso em modelagem e gestão de bancos de dados relacionais, com foco em consultas estruturadas, integridade dos dados e organização de informações.',
      en: 'Used for relational database modeling and management, focused on structured queries, data integrity, and information organization.',
    },
    tooltip: {
      pt: 'Dados relacionais, modelagem e integridade.',
      en: 'Relational data, modeling, and integrity.',
    },
  },
  {
    id: 'supabase',
    icon: '/icons/supabase.svg',
    label: 'Supabase',
    description: {
      pt: 'Utilizado como alternativa open-source ao Firebase, combinando banco de dados PostgreSQL com autenticação e APIs geradas automaticamente.',
      en: 'Used as an open-source Firebase alternative, combining PostgreSQL database with authentication and auto-generated APIs.',
    },
    tooltip: {
      pt: 'Banco de dados, autenticação e back-end como serviço.',
      en: 'Database, authentication, and backend as a service.',
    },
  },
];
