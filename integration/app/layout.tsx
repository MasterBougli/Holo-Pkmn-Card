import "./news.css";
import "./boosters.css";
import "./card-thickness.css";
import "./site-availability.css";
import type { Metadata } from "next";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource-variable/inclusive-sans/wght.css";
import "@fontsource/opendyslexic/400.css";
import "@fontsource/opendyslexic/700.css";
import "./globals.css";
import "./card-holo.css";
import "./collection-game.css";
import "./ui-layout.css";
import { AccessibilityGate } from "@/components/player-ui";

export const metadata: Metadata = {
  title: "GeeckosCollector — Ta prochaine carte t’attend",
  description: "Collectionne les cartes Pokémon, ouvre des boosters et fais grandir ta collection.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}<footer className="open-source-footer"><a href="/a-propos#open-source">À propos · Open source</a></footer><AccessibilityGate/></body></html>;
}
