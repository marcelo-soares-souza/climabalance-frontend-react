export interface UserSummary {
  id: string;
  email: string;
  slug: string;
  status: string;
  locale: string;
  emailConfirmedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  roles: string[];
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName: string | null;
  documentType: string | null;
  documentNumber: string | null;
  birthDate: string | null;
  phone: string | null;
  countryCode: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressPostalCode: string | null;
  addressCountry: string | null;
  about: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  xUrl: string | null;
  blueskyUrl: string | null;
  mastodonUrl: string | null;
  youtubeUrl: string | null;
  linkedinUrl: string | null;
  avatarPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileUpdate {
  display_name?: string;
  document_type?: string;
  document_number?: string;
  birth_date?: string;
  phone?: string;
  country_code?: string;
  address_line1?: string;
  address_line2?: string;
  address_city?: string;
  address_state?: string;
  address_postal_code?: string;
  address_country?: string;
  about?: string;
  website_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  x_url?: string;
  bluesky_url?: string;
  mastodon_url?: string;
  youtube_url?: string;
  linkedin_url?: string;
}

export interface UserUpdate {
  email?: string;
  password?: string;
  password_confirm?: string;
  locale?: string;
  status?: string;
}
