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
  footerExpertiseLabel: string;
  footerSocialLabel: string;
  footerLegalLabel: string;
  footerDirectLabel: string;
  privacyLabel: string;
  termsLabel: string;
  socialGithub: string;
  socialInstagram: string;
  socialLinkedIn: string;
  socialWhatsApp: string;
  socialEmail: string;
  footerAvailabilityEyebrow: string;
  footerAvailabilityTitle: string;
  footerAvailabilityBody: string;
  footerStatusTitle: string;
  footerStatusBody: string;
  footerCopyright: string;
  footerPhrases: string[];
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
    stageTwo: 'Etapa 02 / Campo em movimento',
    stageTwoTitle: 'Agora o campo visual fica sustentado apenas pelo vídeo, pronto para receber conteúdo depois.',
    stageTwoBody: 'O movimento continua discreto e escuro, funcionando como base viva para os próximos módulos sem poluir a composição.',
    motionMeter: 'Presença do vídeo em cena',
    stageThree: 'Etapa 03 / Encerramento imersivo',
    stageThreeTitle: 'O layout passa a parecer encerrado, mas o scroll continua puxando a cena para dentro do fundo.',
    stageThreeBody: 'Este bloco funciona como um footer falso: ele entrega sensação de fechamento, porém guarda profundidade suficiente para sugerir que ainda existe outra camada abaixo.',
    stageThreeMeter: 'Profundidade do mergulho',
    stageThreeEyebrow: 'Camada disfarçada',
    stageThreeCardTitle: 'Footer visual com saída escondida para uma próxima etapa.',
    stageThreeCardBody: 'A composição precisa parecer final, mas ainda induzir curiosidade para quem insistir em descer mais a tela.',
    stageThreeCta: 'Vamos trabalhar juntos?',
    stageThreeCtaAlt: 'Vamos conversar sobre o seu projeto.',
    stageThreeRailPrimary: 'Front-end criativo',
    stageThreeRailSecondary: 'UI Motion Design',
    stageThreeRailTertiary: 'Automações web',
    footerExpertiseLabel: 'Atuação',
    footerSocialLabel: 'Redes',
    footerLegalLabel: 'Legal',
    footerDirectLabel: 'Contato direto',
    privacyLabel: 'Política de Privacidade',
    termsLabel: 'Termos de Serviço',
    socialGithub: 'GitHub',
    socialInstagram: 'Instagram',
    socialLinkedIn: 'LinkedIn',
    socialWhatsApp: 'WhatsApp',
    socialEmail: 'Gmail',
    footerAvailabilityEyebrow: 'Disponibilidade',
    footerAvailabilityTitle: 'Aberto para projetos, produtos digitais e automações sob medida.',
    footerAvailabilityBody: 'Podemos conversar sobre portfólio, landing pages, interfaces em motion, sistemas internos e experiências web com execução real.',
    footerStatusTitle: 'Contato com retorno profissional e direcionamento claro.',
    footerStatusBody: 'Escolha um canal, envie contexto e eu respondo com a melhor rota para seguir o projeto.',
    footerCopyright: '© 2026 MoreiraGabryel. Todos os direitos reservados.',
    footerPhrases: [
      'Vamos fechar seu projeto?',
      'Disponível para contrato.',
      'Execução premium.',
      'Vamos conversar?',
    ],
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
    stageThreeCtaAlt: 'Let’s talk about your project.',
    stageThreeRailPrimary: 'Creative front-end',
    stageThreeRailSecondary: 'UI motion design',
    stageThreeRailTertiary: 'Web automations',
    footerExpertiseLabel: 'Focus',
    footerSocialLabel: 'Socials',
    footerLegalLabel: 'Legal',
    footerDirectLabel: 'Direct contact',
    privacyLabel: 'Privacy Policy',
    termsLabel: 'Terms of Service',
    socialGithub: 'GitHub',
    socialInstagram: 'Instagram',
    socialLinkedIn: 'LinkedIn',
    socialWhatsApp: 'WhatsApp',
    socialEmail: 'Gmail',
    footerAvailabilityEyebrow: 'Availability',
    footerAvailabilityTitle: 'Open for digital products, custom automations, and premium interface work.',
    footerAvailabilityBody: 'We can talk about portfolios, landing pages, motion-driven interfaces, internal systems, and real-world web experiences.',
    footerStatusTitle: 'Clear contact channels with professional follow-through.',
    footerStatusBody: 'Pick a channel, send the context, and I will respond with the best route to move the project forward.',
    footerCopyright: '© 2026 MoreiraGabryel. All rights reserved.',
    footerPhrases: [
      'Shall we build this?',
      'Available for contract.',
      'Premium execution.',
      'Let’s talk?',
    ],
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
