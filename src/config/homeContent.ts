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
