import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://picklebracket.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/settings",
        "/players",
        "/bracket",
        "/round-robin",
        "/history",
        "/join",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
