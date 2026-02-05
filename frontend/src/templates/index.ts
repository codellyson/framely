/**
 * Templates Index
 *
 * Export all template components and provide a registry for the marketplace.
 */

import type { ComponentType } from 'react';
import { SocialIntro } from './SocialIntro';
import { SubscribeAnimation } from './SubscribeAnimation';
import { LowerThird } from './LowerThird';
import { TextReveal } from './TextReveal';
import { AnimatedGradient } from './AnimatedGradient';
import { ProductShowcase } from './ProductShowcase';
import { InstagramStory } from './InstagramStory';
import { SlideTransition } from './SlideTransition';

// Template component registry - maps template IDs to their React components
export const templateComponents: Record<string, ComponentType<any>> = {
  'social-intro-1': SocialIntro,
  'youtube-subscribe': SubscribeAnimation,
  'lower-third-1': LowerThird,
  'text-reveal-1': TextReveal,
  'gradient-bg-1': AnimatedGradient,
  'promo-slide-1': ProductShowcase,
  'instagram-story': InstagramStory,
  'presentation-1': SlideTransition,
};

// Get a template component by ID
export function getTemplateComponent(templateId: string): ComponentType<any> | null {
  return templateComponents[templateId] || null;
}

// Export individual components
export { SocialIntro } from './SocialIntro';
export { SubscribeAnimation } from './SubscribeAnimation';
export { LowerThird } from './LowerThird';
export { TextReveal } from './TextReveal';
export { AnimatedGradient } from './AnimatedGradient';
export { ProductShowcase } from './ProductShowcase';
export { InstagramStory } from './InstagramStory';
export { SlideTransition } from './SlideTransition';
