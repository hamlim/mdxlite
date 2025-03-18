import type { ReactNode } from "react";
import "../styles.css";

function themeCheck() {
  let prefersDarkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  let preferred = prefersDarkModeQuery.matches ? "dark" : "light";
  document.documentElement.classList.add(preferred);
  prefersDarkModeQuery.addEventListener("change", (e) => {
    let newPreferred = e.matches ? "dark" : "light";
    document.documentElement.classList.remove(preferred);
    document.documentElement.classList.add(newPreferred);
    preferred = newPreferred;
  });
}

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <title>mdxlite</title>
        <meta
          name="description"
          content="A minimal MDX runtime for constrained environments"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
          dangerouslySetInnerHTML={{ __html: `(${themeCheck.toString()})()` }}
        />
        {children}
      </body>
    </html>
  );
}
