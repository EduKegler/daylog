import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daylog",
    short_name: "Daylog",
    description: "Your daily task tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F6F3",
    theme_color: "#B45309",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
