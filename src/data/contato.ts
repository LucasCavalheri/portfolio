// Formas de falar comigo. As marcas vêm do simple-icons (silhueta preenchida);
// e-mail, currículo e local usam traçados do Lucide.
import { siGithub, siInstagram, siWhatsapp, siX } from "simple-icons";
import { linkedinIcon } from "./icons";

export type Contato = {
  id: string;
  rotulo: string;
  valor: string;
  url?: string;
  hex: string;
  /** logo de marca: silhueta preenchida */
  icon?: { path: string };
  /** ícone traçado (Lucide): markup interno do símbolo */
  corpo?: string;
};

const NEUTRO = "#a1a1a1";

// Traçados do Lucide, a mesma família usada pelo shadcn/ui: desenho fino e
// consistente, no lugar dos que eu havia desenhado à mão.
const envelope = {
  corpo:
    '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/>',
};

const documento = {
  corpo:
    '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
};

const alfinete = {
  corpo:
    '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
};

const mensagemWhatsapp = encodeURIComponent(
  "Olá Lucas! Vi seu portfólio e queria trocar uma ideia."
);

export const contatos = [
  {
    id: "email",
    rotulo: "E-mail",
    valor: "lucas.dev.carvalho@gmail.com",
    url: "mailto:lucas.dev.carvalho@gmail.com",
    hex: NEUTRO,
    corpo: envelope.corpo,
  },
  {
    id: "whatsapp",
    rotulo: "WhatsApp",
    valor: "(19) 99903-1230",
    url: `https://api.whatsapp.com/send?phone=5519999031230&text=${mensagemWhatsapp}`,
    hex: siWhatsapp.hex,
    icon: siWhatsapp,
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
    id: "curriculo",
    rotulo: "Currículo",
    valor: "PDF",
    url: "/Curriculo-LucasCavalheri.pdf",
    hex: NEUTRO,
    corpo: documento.corpo,
  },
  {
    id: "local",
    rotulo: "Local",
    valor: "Mogi Mirim, SP · remoto",
    hex: NEUTRO,
    corpo: alfinete.corpo,
  },
] satisfies Contato[];
