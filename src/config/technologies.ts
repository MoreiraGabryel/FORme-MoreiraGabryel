import type {Locale} from '../i18n/useTranslation';

export type Technology = {
  id: string;
  icon: string;
  label: string;
  description: Record<Locale, string>;
  category: Record<Locale, string>;
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
    titlePhrases: [
      'Meu Stack Diário.',
      'Linguagens que uso.',
      'Meu ambiente de trabalho.',
      'Front-end e interface.',
      'Back-end e automação.',
      'Dados, deploy e Git.',
    ],
    subtitle: 'Linguagens, ferramentas e serviços que uso para construir produtos digitais.',
    instruction: 'Role para continuar',
  },
  en: {
    titlePhrases: [
      'My Daily Stack.',
      'Languages I use.',
      'My work environment.',
      'Front end and interface.',
      'Back end and automation.',
      'Data, deploy, and Git.',
    ],
    subtitle: 'Languages, tools, and services I use to build digital products.',
    instruction: 'Scroll to continue',
  },
};

export const TECHNOLOGY_UI_COPY: Record<Locale, {
  previous: string;
  next: string;
  group: string;
  inspect: string;
  application: string;
  close: string;
}> = {
  pt: {
    previous: 'Grupo anterior',
    next: 'Próximo grupo',
    group: 'Grupo',
    inspect: 'Conhecer aplicação',
    application: 'Na prática',
    close: 'Fechar',
  },
  en: {
    previous: 'Previous group',
    next: 'Next group',
    group: 'Group',
    inspect: 'Explore application',
    application: 'In practice',
    close: 'Close',
  },
};

export const TECHNOLOGIES: Technology[] = [
  {
    id: "java",
    icon: "/icons/java.svg",
    label: "Java",
    category: {pt: "Back-end", en: "Backend"},
    description: {
      pt: "Em sistemas de gestão, organizo regras de negócio e entidades com Java. Trabalho com orientação a objetos para manter o código claro e fácil de evoluir.",
      en: "In management systems, I organize business rules and entities with Java. I use object-oriented design to keep the code clear and easy to extend.",
    },
    tooltip: {pt: "Regras de negócio e sistemas de gestão.", en: "Business rules and management systems."},
  },
  {
    id: "python",
    icon: "/icons/python.svg",
    label: "Python",
    category: {pt: "Automação", en: "Automation"},
    description: {
      pt: "Uso Python para automatizar tarefas, tratar arquivos e conectar serviços. Transformo processos repetitivos em scripts que posso executar e manter com controle.",
      en: "I use Python to automate tasks, process files, and connect services. I turn repetitive workflows into scripts I can run and maintain with control.",
    },
    tooltip: {pt: "Scripts que simplificam o trabalho diário.", en: "Scripts that simplify everyday work."},
  },
  {
    id: "springboot",
    icon: "/icons/springboot.svg",
    label: "Spring Boot",
    category: {pt: "Back-end", en: "Backend"},
    description: {
      pt: "Estruturo APIs de sistemas de gestão com Spring Boot, separando dados, serviços e regras de negócio. Essa organização facilita integrar a interface e manter o produto.",
      en: "I structure management-system APIs with Spring Boot, separating data, services, and business rules. This makes the interface easier to integrate and the product easier to maintain.",
    },
    tooltip: {pt: "APIs Java organizadas por responsabilidade.", en: "Java APIs organized by responsibility."},
  },
  {
    id: "pyarmor",
    icon: "/icons/pyarmor.svg",
    label: "PyArmor",
    category: {pt: "Automação", en: "Automation"},
    description: {
      pt: "Uso PyArmor na distribuição de ferramentas Python para proteger o código-fonte. Organizo o empacotamento para entregar a automação sem expor diretamente sua implementação.",
      en: "I use PyArmor when distributing Python tools to protect the source code. I organize packaging to deliver automation without directly exposing its implementation.",
    },
    tooltip: {pt: "Proteção de ferramentas Python distribuíveis.", en: "Protection for distributable Python tools."},
  },
  {
    id: "javascript",
    icon: "/icons/javascript.svg",
    label: "JavaScript",
    category: {pt: "Front-end", en: "Frontend"},
    description: {
      pt: "Na MORTECH e em interfaces de e-commerce, uso JavaScript para navegação, seleção de produtos e interações. Conecto os controles da página ao comportamento que o visitante espera.",
      en: "On MORTECH and e-commerce interfaces, I use JavaScript for navigation, product selection, and interactions. I connect page controls to the behavior visitors expect.",
    },
    tooltip: {pt: "Navegação, produtos e interações na web.", en: "Navigation, products, and web interactions."},
  },
  {
    id: "typescript",
    icon: "/icons/typescript.svg",
    label: "TypeScript",
    category: {pt: "Front-end", en: "Frontend"},
    description: {
      pt: "Usei TypeScript neste portfólio e na MORTECH para organizar componentes, dados e animações. A tipagem ajuda a detectar inconsistências antes de publicar as mudanças.",
      en: "I used TypeScript in this portfolio and MORTECH to organize components, data, and animations. Types help me catch inconsistencies before publishing changes.",
    },
    tooltip: {pt: "Interfaces e animações com dados tipados.", en: "Interfaces and animations with typed data."},
  },
  {
    id: "react",
    icon: "/icons/react.svg",
    label: "React",
    category: {pt: "Front-end", en: "Frontend"},
    description: {
      pt: "Construí este portfólio com React, separando as etapas e os controles em componentes. Uso estado e efeitos para coordenar a navegação e as interações da interface.",
      en: "I built this portfolio with React, separating stages and controls into components. I use state and effects to coordinate navigation and interface interactions.",
    },
    tooltip: {pt: "Componentes que dão forma ao portfólio.", en: "Components that shape this portfolio."},
  },
  {
    id: "tailwind",
    icon: "/icons/tailwind.svg",
    label: "Tailwind CSS",
    category: {pt: "Interface", en: "Interface"},
    description: {
      pt: "Uso Tailwind CSS neste portfólio para compor layouts responsivos e manter consistência visual. Ajusto espaçamento e apresentação para desktop e celular.",
      en: "I use Tailwind CSS in this portfolio to build responsive layouts and maintain visual consistency. I adapt spacing and presentation for desktop and mobile.",
    },
    tooltip: {pt: "Layouts responsivos e consistência visual.", en: "Responsive layouts and visual consistency."},
  },
  {
    id: "vite",
    icon: "/icons/vite.svg",
    label: "Vite",
    category: {pt: "Ferramentas", en: "Tooling"},
    description: {
      pt: "Usei Vite no portfólio e na MORTECH para desenvolver com atualização rápida e gerar o build de produção. Isso encurta o ciclo entre ajustar, testar e entregar.",
      en: "I used Vite in the portfolio and MORTECH for fast development updates and production builds. It shortens the cycle between making changes, testing, and delivering.",
    },
    tooltip: {pt: "Desenvolvimento ágil e builds de produção.", en: "Fast development and production builds."},
  },
  {
    id: "nodejs",
    icon: "/icons/nodejs.svg",
    label: "Node.js",
    category: {pt: "Back-end", en: "Backend"},
    description: {
      pt: "Uso Node.js em ferramentas, serviços e integrações. No projeto MCP da MORTECH, conectei a geração de imagens a uma ferramenta que o agente consegue executar.",
      en: "I use Node.js for tools, services, and integrations. In the MORTECH MCP project, I connected image generation to a tool the agent can execute.",
    },
    tooltip: {pt: "Serviços e ferramentas conectados por APIs.", en: "Services and tools connected through APIs."},
  },
  {
    id: "git",
    icon: "/icons/git.svg",
    label: "Git",
    category: {pt: "Versionamento", en: "Version control"},
    description: {
      pt: "Uso Git no portfólio, na MORTECH e no e-commerce para separar mudanças em branches e preservar o histórico. Assim consigo revisar cada entrega sem misturar frentes de trabalho.",
      en: "I use Git in the portfolio, MORTECH, and the e-commerce project to separate changes into branches and preserve history. I can review each delivery without mixing workstreams.",
    },
    tooltip: {pt: "Branches e histórico para entregas controladas.", en: "Branches and history for controlled deliveries."},
  },
  {
    id: "github",
    icon: "/icons/github.svg",
    label: "GitHub",
    category: {pt: "Versionamento", en: "Version control"},
    description: {
      pt: "Mantenho meus projetos no GitHub para organizar o código, documentar decisões e acompanhar entregas. Uso os repositórios como base de colaboração e publicação.",
      en: "I keep my projects on GitHub to organize code, document decisions, and track deliveries. Repositories provide the foundation for collaboration and publishing.",
    },
    tooltip: {pt: "Código, documentação e colaboração.", en: "Code, documentation, and collaboration."},
  },
  {
    id: "cloudflare",
    icon: "/icons/cloudflare.svg",
    label: "Cloudflare",
    category: {pt: "Deploy", en: "Deployment"},
    description: {
      pt: "Uso Cloudflare Pages para a publicação do portfólio. Organizo builds, rotas e cabeçalhos para entregar o site com HTTPS e distribuição pela rede global.",
      en: "I use Cloudflare Pages to publish the portfolio. I organize builds, routes, and headers to deliver the site with HTTPS and global network distribution.",
    },
    tooltip: {pt: "Publicação e distribuição do portfólio.", en: "Portfolio publishing and distribution."},
  },
  {
    id: "firebase",
    icon: "/icons/firebase.svg",
    label: "Firebase",
    category: {pt: "Dados e autenticação", en: "Data and authentication"},
    description: {
      pt: "Uso Firebase em produtos que precisam de login e atualização de dados em tempo real. Integro esses recursos à interface sem depender de um servidor dedicado para cada função.",
      en: "I use Firebase in products that need sign-in and real-time data updates. I integrate these features into the interface without a dedicated server for every function.",
    },
    tooltip: {pt: "Login e dados que acompanham a interface.", en: "Sign-in and data that keep up with the interface."},
  },
  {
    id: "postgresql",
    icon: "/icons/postgresql.svg",
    label: "PostgreSQL",
    category: {pt: "Banco de dados", en: "Database"},
    description: {
      pt: "Em sistemas de gestão, modelo dados com PostgreSQL para organizar cadastros e relacionamentos. Trabalho com consultas e integridade para manter as informações consistentes.",
      en: "In management systems, I model data with PostgreSQL to organize records and relationships. I work with queries and data integrity to keep information consistent.",
    },
    tooltip: {pt: "Modelagem e consultas de dados relacionais.", en: "Relational data modeling and queries."},
  },
  {
    id: "supabase",
    icon: "/icons/supabase.svg",
    label: "Supabase",
    category: {pt: "Dados e autenticação", en: "Data and authentication"},
    description: {
      pt: "Uso Supabase para integrar banco PostgreSQL e autenticação a aplicações web. Organizo o acesso aos dados para conectar a interface aos recursos do produto.",
      en: "I use Supabase to integrate PostgreSQL databases and authentication into web applications. I organize data access to connect the interface to product features.",
    },
    tooltip: {pt: "PostgreSQL e autenticação integrados à web.", en: "PostgreSQL and authentication integrated into the web."},
  },
  {
    id: "html5",
    icon: "/icons/html5.svg",
    label: "HTML5",
    category: {pt: "Front-end", en: "Frontend"},
    description: {
      pt: "Estruturei as páginas da MORTECH e interfaces do e-commerce com HTML. Uso elementos semânticos para organizar conteúdo, formulários e navegação de forma acessível.",
      en: "I structured MORTECH pages and e-commerce interfaces with HTML. I use semantic elements to organize content, forms, and navigation accessibly.",
    },
    tooltip: {pt: "Estrutura semântica para páginas e formulários.", en: "Semantic structure for pages and forms."},
  },
  {
    id: "css3",
    icon: "/icons/css3.svg",
    label: "CSS3",
    category: {pt: "Interface", en: "Interface"},
    description: {
      pt: "Uso CSS na MORTECH e neste portfólio para controlar composição, responsividade e estados dos controles. Ajusto a mesma experiência para telas grandes e celulares.",
      en: "I use CSS on MORTECH and this portfolio to control composition, responsiveness, and control states. I adapt the same experience to large screens and mobile devices.",
    },
    tooltip: {pt: "Composição visual e adaptação entre telas.", en: "Visual composition and adaptation across screens."},
  },
  {
    id: "gsap",
    icon: "/icons/gsap.svg",
    label: "GSAP",
    category: {pt: "Animação", en: "Animation"},
    description: {
      pt: "Usei GSAP neste portfólio para sincronizar animações com a rolagem e criar transições entre etapas. Na MORTECH, também apliquei movimento à marca e à apresentação visual.",
      en: "I used GSAP in this portfolio to synchronize animations with scrolling and create stage transitions. On MORTECH, I also applied motion to the brand and visual presentation.",
    },
    tooltip: {pt: "Movimento conectado à navegação do site.", en: "Motion connected to site navigation."},
  },
  {
    id: "lenis",
    icon: "/icons/lenis.svg",
    label: "Lenis",
    category: {pt: "Animação", en: "Animation"},
    description: {
      pt: "Integrei Lenis ao portfólio para suavizar a rolagem e acompanhar as cenas animadas. Mantenho a navegação direta para quem prefere menos movimento.",
      en: "I integrated Lenis into the portfolio to smooth scrolling and follow animated scenes. I keep navigation direct for visitors who prefer reduced motion.",
    },
    tooltip: {pt: "Rolagem suave em sintonia com as cenas.", en: "Smooth scrolling in sync with animated scenes."},
  },
  {
    id: "framer-motion",
    icon: "/icons/framer-motion.svg",
    label: "Framer Motion",
    category: {pt: "Animação", en: "Animation"},
    description: {
      pt: "Uso Framer Motion em interfaces React para organizar transições de estado e feedback dos controles. Trabalho o movimento para orientar a navegação sem competir com o conteúdo.",
      en: "I use Framer Motion in React interfaces to organize state transitions and control feedback. I design motion to guide navigation without competing with the content.",
    },
    tooltip: {pt: "Transições e feedback em interfaces React.", en: "Transitions and feedback in React interfaces."},
  },
  {
    id: "express",
    icon: "/icons/express.svg",
    label: "Express",
    category: {pt: "Back-end", en: "Backend"},
    description: {
      pt: "Trabalho com Express no e-commerce para conectar a interface às rotas de produtos e pedidos. Organizo requisições e respostas para integrar as funções da loja.",
      en: "I work with Express in the e-commerce project to connect the interface to product and order routes. I organize requests and responses to integrate store features.",
    },
    tooltip: {pt: "Rotas que conectam a loja aos seus serviços.", en: "Routes connecting the store to its services."},
  },
  {
    id: "sqlite",
    icon: "/icons/sqlite.svg",
    label: "SQLite / libSQL",
    category: {pt: "Banco de dados", en: "Database"},
    description: {
      pt: "Trabalho com dados de produtos e variantes em um e-commerce com libSQL. Uso essa estrutura para conectar catálogo, disponibilidade e seleção de itens na interface.",
      en: "I work with product and variant data in an e-commerce project using libSQL. I use that structure to connect the catalog, availability, and item selection in the interface.",
    },
    tooltip: {pt: "Dados de catálogo e variantes de produtos.", en: "Catalog data and product variants."},
  },
  {
    id: "mercadopago",
    icon: "/icons/mercadopago.svg",
    label: "Mercado Pago",
    category: {pt: "Integrações", en: "Integrations"},
    description: {
      pt: "Uso Mercado Pago como parte da integração de pagamentos do e-commerce. Organizo a experiência de checkout para conectar a escolha dos produtos à etapa de pagamento.",
      en: "I use Mercado Pago as part of the e-commerce payment integration. I organize the checkout experience to connect product selection to the payment stage.",
    },
    tooltip: {pt: "Checkout conectado à etapa de pagamento.", en: "Checkout connected to the payment stage."},
  },
  {
    id: "mcp",
    icon: "/icons/mcp.svg",
    label: "MCP",
    category: {pt: "IA e automação", en: "AI and automation"},
    description: {
      pt: "Criei uma integração MCP para a MORTECH que conecta o agente à geração de imagens com Grok. Transformei uma chamada de API em uma ferramenta disponível no fluxo de trabalho.",
      en: "I created an MCP integration for MORTECH that connects the agent to image generation with Grok. I turned an API call into a tool available in the workflow.",
    },
    tooltip: {pt: "Ferramentas de IA conectadas ao trabalho.", en: "AI tools connected to the workflow."},
  }
];
