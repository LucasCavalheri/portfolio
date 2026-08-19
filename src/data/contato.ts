// Formas de falar comigo. Ícones desenhados aqui quando não há marca
// (e-mail, currículo, localização); os demais vêm do simple-icons.
import { siGithub, siInstagram, siX } from "simple-icons";
import { linkedinIcon } from "./icons";

export type Contato = {
  id: string;
  rotulo: string;
  valor: string;
  url?: string;
  hex: string;
  icon: { path: string };
  traco?: boolean;
};

const envelope = { path: "M3 5.5h18v13H3zM3.5 7l8.5 6 8.5-6" };
const documento = { path: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zm0 0v5h5M9 17h6" };
const alfinete = { path: "M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z M12 10.5h.01" };

export const contatos = [
  {
    id: "email",
    rotulo: "E-mail",
    valor: "lucas.dev.carvalho@gmail.com",
    url: "mailto:lucas.dev.carvalho@gmail.com",
    hex: "#a1a1a1",
    icon: envelope,
    traco: true,
  },
  {
    id: "curriculo",
    rotulo: "Currículo",
    valor: "PDF",
    url: "/Curriculo-LucasCavalheri.pdf",
    hex: "#a1a1a1",
    icon: documento,
    traco: true,
  },
  {
    id: "github",
    rotulo: "GitHub",
    valor: "@LucasCavalheri",
    url: "https://github.com/LucasCavalheri",
    hex: siGithub.hex,
    icon: siGithub,
  },
  {
    id: "linkedin",
    rotulo: "LinkedIn",
    valor: "lucas-cavalheri",
    url: "https://www.linkedin.com/in/lucas-cavalheri/",
    hex: "#0A66C2",
    icon: linkedinIcon,
  },
  {
    id: "instagram",
    rotulo: "Instagram",
    valor: "@lucascavalheri.dev",
    url: "https://www.instagram.com/lucascavalheri.dev/",
    hex: siInstagram.hex,
    icon: siInstagram,
  },
  {
    id: "x",
    rotulo: "X",
    valor: "@CavalheriDev",
    url: "https://x.com/CavalheriDev",
    hex: siX.hex,
    icon: siX,
  },
  {
    id: "local",
    rotulo: "Local",
    valor: "Mogi Mirim, SP · remoto",
    hex: "#a1a1a1",
    icon: alfinete,
    traco: true,
  },
] satisfies Contato[];
