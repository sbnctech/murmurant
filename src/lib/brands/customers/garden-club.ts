import type { ClubBrand } from '../types';

export const gardenClubBrand: ClubBrand = {
  id: 'garden-club',
  clubId: 'garden-club',
  name: 'Sunrise Garden Society',
  themeId: 'classic',
  identity: {
    logo: { url: '/brands/garden-club/logo.svg', width: 200, height: 60, alt: 'Garden Society Logo' },
    bug: { url: '/brands/garden-club/bug.svg', size: 32 },
    colors: { primary: '#16A34A', primaryHover: '#15803D', secondary: '#A855F7', accent: '#FBBF24' },
    fonts: { heading: 'Playfair Display, serif', body: 'Lato, sans-serif' },
  },
  voice: { tone: 'formal', terminology: { member: 'member', event: 'gathering', dues: 'membership fee' }, greeting: 'Welcome, fellow gardener!' },
  chatbot: { name: 'Rose', personality: 'Knowledgeable about plants, gentle and nurturing.', suggestedPrompts: ['When is the next plant swap?', 'What workshops are available?', 'How do I join a garden tour?'] },
  communication: { emailFromName: 'Sunrise Garden Society', emailReplyTo: 'info@sunrisegardensociety.org' },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
  updatedBy: 'system',
};
