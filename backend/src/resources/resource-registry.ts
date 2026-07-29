export type ResourceDefinition = {
  label: string;
  identityFields: string[];
};

export const RESOURCE_DEFINITIONS = {
  'auth-client': { label: 'CMS auth client', identityFields: ['name', 'client_id'] },
  compliances: { label: 'compliance item', identityFields: ['title', 'name'] },
  countries: { label: 'country', identityFields: ['en_short_name', 'alpha_2_code'] },
  currencies: { label: 'currency', identityFields: ['name', 'code'] },
  'customer-reviews': { label: 'customer review', identityFields: ['title', 'name'] },
  'email-templates': { label: 'email template', identityFields: ['name', 'subject'] },
  'event-categories': { label: 'event category', identityFields: ['name', 'title'] },
  events: { label: 'event', identityFields: ['title', 'name'] },
  'faq-categories': { label: 'FAQ category', identityFields: ['name', 'title'] },
  faqs: { label: 'FAQ', identityFields: ['question', 'title'] },
  features: { label: 'feature', identityFields: ['title', 'name'] },
  'footer-group-types': { label: 'footer group', identityFields: ['name', 'title'] },
  footers: { label: 'footer link', identityFields: ['title', 'link'] },
  genders: { label: 'gender', identityFields: ['gender_name', 'name'] },
  languages: { label: 'language', identityFields: ['language_name', 'name'] },
  metas: { label: 'meta entry', identityFields: ['slug', 'title', 'name'] },
  news: { label: 'news item', identityFields: ['title', 'slug'] },
  'news-categories': { label: 'news category', identityFields: ['name', 'title'] },
  partners: { label: 'partner', identityFields: ['name', 'title'] },
  'payment-gateways': { label: 'payment gateway', identityFields: ['name', 'code'] },
  plans: { label: 'plan', identityFields: ['name', 'title'] },
  'portfolio-categories': { label: 'portfolio category', identityFields: ['name', 'title'] },
  portfolios: { label: 'portfolio', identityFields: ['title', 'name'] },
  'release-notes': { label: 'release note', identityFields: ['title', 'version'] },
  roles: { label: 'role', identityFields: ['role_name', 'name'] },
  'sms-templates': { label: 'SMS template', identityFields: ['name', 'title'] },
  'social-links': { label: 'social link', identityFields: ['social_title', 'name', 'url'] },
  subscribes: { label: 'subscription', identityFields: ['email', 'name'] },
  tags: { label: 'tag', identityFields: ['tag_title', 'name'] },
  'trusted-brands': { label: 'trusted brand', identityFields: ['name', 'title'] },
  'tutorial-categories': { label: 'tutorial category', identityFields: ['name', 'title'] },
  tutorials: { label: 'tutorial', identityFields: ['title', 'name'] },
  users: { label: 'user', identityFields: ['email', 'login_id', 'name'] },
  years: { label: 'year', identityFields: ['year'] },
} satisfies Record<string, ResourceDefinition>;

export type ResourceName = keyof typeof RESOURCE_DEFINITIONS;

export const isResourceName = (value: string): value is ResourceName =>
  Object.prototype.hasOwnProperty.call(RESOURCE_DEFINITIONS, value);
