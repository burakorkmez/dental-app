import { clerkMiddleware } from '@clerk/nextjs/server';

/**
 * Next 16 renamed `middleware.ts` to `proxy.ts`. Same behaviour, new filename.
 *
 * This does no route matching on purpose. Clerk Core 3 deprecated
 * `createRouteMatcher` in favour of resource-based checks, because path
 * matching can diverge from how Next actually routes and leave a protected
 * resource reachable. So every guard lives next to the data it protects:
 * `requireStaff()` in the dashboard layout, `requireAuth()` in each API route.
 *
 * What this still does — and why it must stay — is attach Clerk's auth context
 * to every request, which is what lets a Route Handler read the
 * `Authorization: Bearer <session token>` the Expo app sends (PLAN.md R9).
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
