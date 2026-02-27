// API Configuration for Railway Backend
// These are public values - safe to hardcode

// Railway backend URL
export const API_URL = import.meta.env.VITE_API_URL || 'https://mycarepa-production.up.railway.app'

// Stripe publishable key (public)
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51T3mcj10nvnTVAogvr6gjBIFTmeurtama301mYA5gYGUfU7rE5hotIa45NGoUEYAdI81idnOGqAT5MJOvjDMaOHv00BNaUatbj'

// Calendly URLs
export const CALENDLY_URL_MEMBERS = import.meta.env.VITE_CALENDLY_URL || 'https://calendly.com/mtkinz79/dfsd'
export const CALENDLY_URL_FREE_INTRO = import.meta.env.VITE_CALENDLY_FREE_URL || 'https://calendly.com/mtkinz79/dfsd' // TODO: Update when free intro meeting is created
