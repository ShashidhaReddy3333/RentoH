export const routes = {
  home: '/',
  applications: '/app/applications',
  tours: '/app/tours',
  browse: '/browse',
  auth: {
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
  },
} as const;

export type AppRoute = typeof routes[keyof typeof routes] | `${typeof routes['browse']}/${string}` | `${typeof routes['home']}${string}`;