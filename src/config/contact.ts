export const CONTACT = {
  github: 'https://github.com/MoreiraGabryel',
  linkedin: 'https://www.linkedin.com/in/marcos-gabryel-4b2594360/',
  email: 'marcosgabryel25@gmail.com',
  phone: '(11) 97876-5281',
} as const;

export const CONTACT_LINKS = {
  github: CONTACT.github,
  linkedin: CONTACT.linkedin,
  email: `mailto:${CONTACT.email}`,
  phone: `tel:${CONTACT.phone.replace(/\D/g, '')}`,
} as const;
