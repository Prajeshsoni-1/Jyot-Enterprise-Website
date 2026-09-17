import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ANALYTICS_IDS, initAnalytics, trackPageView, isPublicPath } from "../lib/analytics";
import {
  SITE_NAME,
  jsonLd,
  localBusinessSchema,
  organizationSchema,
  websiteSchema,
} from "../lib/seo";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { FloatingTools } from "../components/site/FloatingTools";
import { getSiteSettings } from "../lib/settings.functions";
import {
  DEFAULT_SITE_SETTINGS,
  SiteSettingsContext,
  mergeSettings,
  type SiteSettings,
} from "../lib/site-settings";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error instanceof Error ? error : new Error(String(error)), {
      boundary: "tanstack_root_error_component",
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <pre id="root-error-debug" className="text-xs text-left text-destructive overflow-auto max-h-40 p-2 bg-destructive/10 rounded">
          {error instanceof Error ? error.stack || error.message : String(error)}
        </pre>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async () => {
    try {
      const res = await getSiteSettings();
      return { settings: mergeSettings(res) };
    } catch {
      return { settings: DEFAULT_SITE_SETTINGS };
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Jyot Enterprise — Financial, IT, Legal & Engineering Services" },
      {
        name: "description",
        content:
          "Jyot Enterprise is an enterprise partner for financial, IT, legal and engineering services across India.",
      },
      { name: "author", content: "Jyot Enterprise" },
      { name: "theme-color", content: "#F04A23" },
      { name: "format-detection", content: "telephone=no" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: "en_IN" },
      { property: "og:title", content: "Jyot Enterprise" },
      {
        property: "og:description",
        content: "Empowering Dreams. Enabling Growth.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      ...(ANALYTICS_IDS.searchConsole
        ? [{ name: "google-site-verification", content: ANALYTICS_IDS.searchConsole }]
        : []),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/brand/logo-mark.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/brand/logo-mark.png" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "manifest", href: "/manifest.json" },
    ],
    scripts: [jsonLd(organizationSchema), jsonLd(localBusinessSchema), jsonLd(websiteSchema)],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const settings = (Route.useLoaderData()?.settings ?? DEFAULT_SITE_SETTINGS) as SiteSettings;
  const routerState = useRouterState();
  const routerPathname = routerState.location.pathname;

  // Multi-tier detection for admin / auth routes:
  // 1. Matches array inspection (matches contains routeId and pathname)
  const isMatchConsole = routerState.matches.some((m) => {
    const id = (m.routeId || "").toLowerCase();
    const p = (m.pathname || "").toLowerCase();
    return (
      id.includes("_authenticated") ||
      id.includes("/admin") ||
      id.includes("/auth") ||
      p.startsWith("/admin") ||
      p.includes("/admin") ||
      p.startsWith("/auth") ||
      p.includes("/auth")
    );
  });

  // 2. Browser window pathname check
  const isWindowConsole =
    typeof window !== "undefined" &&
    (window.location.pathname.startsWith("/admin") ||
      window.location.pathname.includes("/admin") ||
      window.location.pathname.startsWith("/auth") ||
      window.location.pathname.includes("/auth"));

  // 3. Router pathname check
  const isPathConsole = !isPublicPath(routerPathname);

  // Admin and sign-in screens run completely isolated without any public marketing chrome.
  const isConsole = isMatchConsole || isWindowConsole || isPathConsole;

  useEffect(() => {
    // Only track real visitors on public website routes; strictly exclude /admin/* and /auth/*
    if (!isConsole && isPublicPath(routerPathname)) {
      initAnalytics(settings?.analytics?.ga4);
      trackPageView(routerPathname);
    }
  }, [isConsole, routerPathname, settings?.analytics?.ga4]);

  return (
    <QueryClientProvider client={queryClient}>
      <SiteSettingsContext.Provider value={settings}>
        {isConsole ? (
          <Outlet />
        ) : (
          <>
            <a
              href="#main-content"
              className="sr-only rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]"
            >
              Skip to main content
            </a>
            <Header />
            <main id="main-content">
              {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
              <Outlet />
            </main>
            <Footer />
            <FloatingTools />
          </>
        )}
      </SiteSettingsContext.Provider>
    </QueryClientProvider>
  );
}
