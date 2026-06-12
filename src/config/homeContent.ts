import type {Locale} from '../i18n/useTranslation';

export type HomeCopy = {
  heroTag: string;
  heroSubtag: string;
  heroSupport: string;
  scrollCue: string;
  stageTwo: string;
  stageTwoTitle: string;
  stageTwoBody: string;
  motionMeter: string;
  stageThree: string;
  stageThreeTitle: string;
  stageThreeBody: string;
  stageThreeMeter: string;
  stageThreeEyebrow: string;
  stageThreeCardTitle: string;
  stageThreeCardBody: string;
  stageThreeCta: string;
  stageThreeCtaAlt: string;
  stageThreeRailPrimary: string;
  stageThreeRailSecondary: string;
  stageThreeRailTertiary: string;
  language: string;
  placeholderEyebrow: string;
  placeholderTitle: string;
  placeholderBody: string;
  phrases: string[];
};

export const HOME_COPY: Record<Locale, HomeCopy> = {
  pt: {
    heroTag: 'Portfólio de desenvolvedor',
    heroSubtag: 'Interfaces, sistemas e motion para produto digital.',
    heroSupport: 'Experiências visuais com foco em performance, automação e clareza de produto.',
    scrollCue: 'Role para iniciar a progressão visual.',
    stageTwo: 'Etapa 02 / Motion field',
    stageTwoTitle: 'Agora o campo visual fica sustentado apenas pelo vídeo, pronto para receber conteúdo depois.',
    stageTwoBody: 'O movimento continua discreto e escuro, funcionando como base viva para os próximos módulos sem poluir a composição.',
    motionMeter: 'Presença do vídeo em cena',
    stageThree: 'Etapa 03 / False footer',
    stageThreeTitle: 'O layout passa a parecer encerrado, mas o scroll continua puxando a cena para dentro do fundo.',
    stageThreeBody: 'Este bloco funciona como um footer falso: ele entrega sensação de fechamento, porém guarda profundidade suficiente para sugerir que ainda existe outra camada abaixo.',
    stageThreeMeter: 'Profundidade do mergulho',
    stageThreeEyebrow: 'Camada disfarçada',
    stageThreeCardTitle: 'Footer visual com saída escondida para uma próxima etapa.',
    stageThreeCardBody: 'A composição precisa parecer final, mas ainda induzir curiosidade para quem insistir em descer mais a tela.',
    stageThreeCta: 'Vamos trabalhar juntos?',
    stageThreeCtaAlt: 'Shall we work together?',
    stageThreeRailPrimary: 'Work together',
    stageThreeRailSecondary: 'Join the team',
    stageThreeRailTertiary: 'Just say hello',
    language: 'Idioma',
    placeholderEyebrow: 'Próxima funcionalidade',
    placeholderTitle: 'Espaço reservado para o próximo módulo interativo.',
    placeholderBody: 'Estrutura pronta para receber conteúdo posterior sem parecer wireframe ou área abandonada.',
    phrases: [
      'Construo interfaces que sustentam produto, narrativa e performance.',
      'Transformo requisitos complexos em sistemas visuais claros e escaláveis.',
      'Crio experiências digitais onde código, motion e usabilidade trabalham juntos.',
      'Desenho fluxos que aproximam automação, performance e presença visual.',
      'Projeto camadas de interface para parecerem precisas antes mesmo do clique.',
      'Conecto front-end, lógica e direção visual em experiências com intenção real.',
    ],
  },
  en: {
    heroTag: 'Developer portfolio',
    heroSubtag: 'Interfaces, systems, and motion for digital products.',
    heroSupport: 'Visual experiences shaped around performance, automation, and product clarity.',
    scrollCue: 'Scroll to begin the visual progression.',
    stageTwo: 'Stage 02 / Motion field',
    stageTwoTitle: 'The visual field is now sustained only by the video, ready to receive future content.',
    stageTwoBody: 'The motion stays dark and restrained, acting as a living base for upcoming modules without polluting the composition.',
    motionMeter: 'Video presence on stage',
    stageThree: 'Stage 03 / False footer',
    stageThreeTitle: 'The layout starts to feel finished, yet the scroll keeps pulling the scene deeper into the background.',
    stageThreeBody: 'This block behaves like a fake footer: it delivers closure while still preserving enough depth to suggest there is another hidden layer underneath.',
    stageThreeMeter: 'Dive depth',
    stageThreeEyebrow: 'Disguised layer',
    stageThreeCardTitle: 'A visual footer with a hidden exit toward a later stage.',
    stageThreeCardBody: 'The composition should feel final while still provoking curiosity for anyone who keeps scrolling downward.',
    stageThreeCta: 'Shall we work together?',
    stageThreeCtaAlt: 'Vamos trabalhar juntos?',
    stageThreeRailPrimary: 'Work together',
    stageThreeRailSecondary: 'Join the team',
    stageThreeRailTertiary: 'Just say hello',
    language: 'Language',
    placeholderEyebrow: 'Next feature',
    placeholderTitle: 'Reserved space for the next interactive module.',
    placeholderBody: 'The structure is ready to receive future content without feeling like a wireframe or an abandoned area.',
    phrases: [
      'I build interfaces that align product thinking, narrative, and performance.',
      'I turn complex requirements into visual systems that feel clear and scalable.',
      'I create digital experiences where code, motion, and usability move together.',
      'I design flows that connect automation, performance, and visual presence.',
      'I shape interface layers to feel precise before the first click happens.',
      'I connect front-end logic and visual direction into experiences with intent.',
    ],
  },
};
