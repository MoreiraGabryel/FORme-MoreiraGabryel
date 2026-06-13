import type {Locale} from '../i18n/useTranslation';
import {CONTACT} from './contact';

export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export type LegalDocument = {
  eyebrow: string;
  title: string;
  updatedLabel: string;
  updatedAt: string;
  sections: LegalSection[];
};

export type LegalLocaleContent = {
  language: string;
  backToHome: string;
  privacyNav: string;
  termsNav: string;
  privacy: LegalDocument;
  terms: LegalDocument;
};

export const LEGAL_CONTENT: Record<Locale, LegalLocaleContent> = {
  pt: {
    language: 'Idioma',
    backToHome: 'Voltar para a página inicial',
    privacyNav: 'Política de Privacidade',
    termsNav: 'Termos de Serviço',
    privacy: {
      eyebrow: 'Documento legal',
      title: 'Política de Privacidade',
      updatedLabel: 'Última atualização',
      updatedAt: '12 de junho de 2026',
      sections: [
        {
          title: '1. Visão geral',
          paragraphs: [
            'Este portfólio apresenta projetos, serviços e formas de contato profissionais de MoreiraGabryel.',
            'As informações coletadas são tratadas com finalidade de comunicação, análise básica de uso e proteção do funcionamento da experiência digital.',
          ],
        },
        {
          title: '2. Dados que podem ser coletados',
          paragraphs: [
            'Podem ser coletados dados fornecidos voluntariamente por você, como nome, e-mail, empresa, mensagem e qualquer informação enviada em canais de contato.',
            'Também podem existir dados técnicos básicos, como endereço IP aproximado, navegador, dispositivo, idioma e páginas acessadas, quando isso for necessário para segurança, métricas ou melhoria do site.',
          ],
        },
        {
          title: '3. Como os dados podem ser usados',
          paragraphs: [
            'Os dados podem ser utilizados para responder contatos, analisar oportunidades de trabalho, melhorar a navegação, entender desempenho de páginas e manter a integridade do site.',
            'As informações não são vendidas como produto comercial de dados pessoais.',
          ],
        },
        {
          title: '4. Compartilhamento e retenção',
          paragraphs: [
            'Dados podem ser processados por provedores técnicos indispensáveis ao funcionamento do site, como hospedagem, analytics, formulários, e-mail ou automações conectadas.',
            'As informações são mantidas apenas pelo tempo razoavelmente necessário para operação, comunicação, cumprimento legal ou proteção contra abuso.',
          ],
        },
        {
          title: '5. Cookies e tecnologias similares',
          paragraphs: [
            'O site pode utilizar armazenamento local, cookies ou soluções equivalentes para lembrar idioma, preferências de navegação e métricas básicas.',
            'Você pode limpar esses dados pelo navegador, observando que algumas preferências visuais ou funcionais podem ser perdidas.',
          ],
        },
        {
          title: '6. Seus direitos e contato',
          paragraphs: [
            `Você pode solicitar esclarecimentos, atualização ou remoção de informações de contato enviadas por você usando o e-mail ${CONTACT.email}.`,
            'Ao continuar utilizando este site, você reconhece esta política como a referência atual de tratamento das informações relacionadas à experiência apresentada aqui.',
          ],
        },
      ],
    },
    terms: {
      eyebrow: 'Documento legal',
      title: 'Termos de Serviço',
      updatedLabel: 'Última atualização',
      updatedAt: '12 de junho de 2026',
      sections: [
        {
          title: '1. Escopo do site',
          paragraphs: [
            'Este site existe para apresentar portfólio, capacidades técnicas, estudos visuais, serviços e canais de contato profissionais.',
            'O conteúdo é informativo e pode ser atualizado, reorganizado ou removido a qualquer momento sem aviso prévio.',
          ],
        },
        {
          title: '2. Uso permitido',
          paragraphs: [
            'Você concorda em utilizar o site apenas para fins legítimos, sem tentar interferir na disponibilidade, segurança, integridade visual ou funcionamento técnico da aplicação.',
            'Não é permitido reproduzir integralmente identidade visual, código proprietário, textos exclusivos ou materiais protegidos sem autorização.',
          ],
        },
        {
          title: '3. Propriedade intelectual',
          paragraphs: [
            'Projetos, textos, composições visuais, interações e implementações exibidos neste portfólio permanecem protegidos pelos direitos aplicáveis de autoria e propriedade intelectual.',
            'Referências externas eventualmente citadas servem apenas como contexto ou inspiração técnica e não transferem titularidade de marcas ou materiais de terceiros.',
          ],
        },
        {
          title: '4. Propostas, contato e respostas',
          paragraphs: [
            'O envio de mensagem, briefing ou proposta não cria automaticamente obrigação contratual, aceite comercial ou prazo garantido de resposta.',
            'Trabalhos, escopos, entregas, prazos e valores dependem de alinhamento posterior entre as partes.',
          ],
        },
        {
          title: '5. Limitações',
          paragraphs: [
            'Embora exista cuidado técnico com a experiência apresentada, o site é fornecido no estado em que se encontra, podendo sofrer indisponibilidade, ajustes ou inconsistências temporárias.',
            'Na máxima extensão permitida pela lei aplicável, não há garantia absoluta de disponibilidade contínua ou ausência total de erros.',
          ],
        },
        {
          title: '6. Contato',
          paragraphs: [
            `Dúvidas sobre estes termos podem ser encaminhadas para ${CONTACT.email}.`,
            'Ao navegar pelo site, você concorda com estes termos como condição geral de uso da experiência e do conteúdo disponibilizado.',
          ],
        },
      ],
    },
  },
  en: {
    language: 'Language',
    backToHome: 'Back to home',
    privacyNav: 'Privacy Policy',
    termsNav: 'Terms of Service',
    privacy: {
      eyebrow: 'Legal document',
      title: 'Privacy Policy',
      updatedLabel: 'Last updated',
      updatedAt: 'June 12, 2026',
      sections: [
        {
          title: '1. Overview',
          paragraphs: [
            'This portfolio showcases MoreiraGabryel projects, services, and professional contact channels.',
            'Any collected information is handled for communication purposes, basic usage analysis, and protection of the digital experience.',
          ],
        },
        {
          title: '2. Data that may be collected',
          paragraphs: [
            'Data voluntarily provided by you may be collected, such as name, email, company, message, and any information shared through contact channels.',
            'Basic technical data may also exist, including approximate IP address, browser, device, language, and visited pages, when required for security, analytics, or product improvement.',
          ],
        },
        {
          title: '3. How data may be used',
          paragraphs: [
            'Data may be used to reply to messages, evaluate work opportunities, improve navigation, understand page performance, and maintain site integrity.',
            'Information is not sold as a commercial personal-data product.',
          ],
        },
        {
          title: '4. Sharing and retention',
          paragraphs: [
            'Data may be processed by technical providers strictly required to operate the site, such as hosting, analytics, forms, email, or connected automations.',
            'Information is retained only for the time reasonably necessary for operation, communication, legal compliance, or abuse prevention.',
          ],
        },
        {
          title: '5. Cookies and similar technologies',
          paragraphs: [
            'The site may use local storage, cookies, or equivalent solutions to remember language, browsing preferences, and lightweight metrics.',
            'You may clear this data through your browser, understanding that some visual or functional preferences may be lost.',
          ],
        },
        {
          title: '6. Your rights and contact',
          paragraphs: [
            `You may request clarification, updates, or removal of contact information you submitted by emailing ${CONTACT.email}.`,
            'By continuing to use this site, you acknowledge this policy as the current reference for information handling related to the experience presented here.',
          ],
        },
      ],
    },
    terms: {
      eyebrow: 'Legal document',
      title: 'Terms of Service',
      updatedLabel: 'Last updated',
      updatedAt: 'June 12, 2026',
      sections: [
        {
          title: '1. Site scope',
          paragraphs: [
            'This site exists to present portfolio work, technical capabilities, visual studies, services, and professional contact channels.',
            'The content is informational and may be updated, reorganized, or removed at any time without prior notice.',
          ],
        },
        {
          title: '2. Permitted use',
          paragraphs: [
            'You agree to use the site only for lawful purposes, without attempting to interfere with the application availability, security, visual integrity, or technical behavior.',
            'You may not fully reproduce visual identity, proprietary code, exclusive copy, or protected materials without authorization.',
          ],
        },
        {
          title: '3. Intellectual property',
          paragraphs: [
            'Projects, copy, visual compositions, interactions, and implementations displayed in this portfolio remain protected by applicable authorship and intellectual-property rights.',
            'Any external references mentioned serve only as context or technical inspiration and do not transfer ownership of third-party brands or materials.',
          ],
        },
        {
          title: '4. Proposals, contact, and replies',
          paragraphs: [
            'Sending a message, brief, or proposal does not automatically create a contractual obligation, commercial acceptance, or guaranteed response deadline.',
            'Work, scope, deliverables, timelines, and pricing depend on later alignment between the parties.',
          ],
        },
        {
          title: '5. Limitations',
          paragraphs: [
            'While technical care is applied to the presented experience, the site is provided as is and may experience downtime, adjustments, or temporary inconsistencies.',
            'To the maximum extent allowed by applicable law, there is no absolute guarantee of continuous availability or total absence of errors.',
          ],
        },
        {
          title: '6. Contact',
          paragraphs: [
            `Questions about these terms may be sent to ${CONTACT.email}.`,
            'By browsing this site, you agree to these terms as the general condition for using the experience and content provided here.',
          ],
        },
      ],
    },
  },
};