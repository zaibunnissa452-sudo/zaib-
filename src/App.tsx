import { lazy, Suspense } from "react";

const PhotographySite = lazy(() =>
  import("./pages/PhotographySite").then((module) => ({ default: module.PhotographySite })),
);
const CanteenApp = lazy(() => import("./CanteenApp"));

export default function App() {
  const isPhotographyRoute = window.location.pathname.replace(/\/+$/, "") === "/photography";
  const Page = isPhotographyRoute ? PhotographySite : CanteenApp;

  return (
    <Suspense
      fallback={
        <main className="min-h-screen px-6 py-24 text-center" aria-busy="true">
          Loading photography portfolio…
        </main>
      }
    >
      <Page />
    </Suspense>
  );
}
