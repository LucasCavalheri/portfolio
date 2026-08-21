// Formas de falar comigo. Envelope, documento e alfinete são desenhados aqui,
// preenchidos e no mesmo peso das marcas — traço fino ao lado de logo sólido
// deixava a coluna desalinhada.
import { siGithub, siInstagram, siWhatsapp, siX } from "simple-icons";
import { linkedinIcon } from "./icons";

export type Contato = {
  id: string;
  rotulo: string;
  valor: string;
  url?: string;
  hex: string;
  icon: { path: string };
};

const NEUTRO = "#a1a1a1";

const envelope = {
  path: "M3.75 5.25h16.5c.83 0 1.5.67 1.5 1.5v.63l-9.34 5.36a.75.75 0 0 1-.82 0L2.25 7.38V6.75c0-.83.67-1.5 1.5-1.5Zm-1.5 3.86v8.14c0 .83.67 1.5 1.5 1.5h16.5c.83 0 1.5-.67 1.5-1.5V9.11l-8.6 4.93a2.25 2.25 0 0 1-2.3 0L2.25 9.11Z",
};

const documento = {
  path: "M13.2 2.25H7.5A2.25 2.25 0 0 0 5.25 4.5v15A2.25 2.25 0 0 0 7.5 21.75h9a2.25 2.25 0 0 0 2.25-2.25V7.8h-4.05a1.5 1.5 0 0 1-1.5-1.5V2.25Zm1.5.44 3.62 3.61h-3.62V2.69ZM8.25 12h7.5v1.5h-7.5V12Zm0 3.75h5.25v1.5H8.25v-1.5Z",
};

// o furo aparece pela regra evenodd aplicada no sprite
const alfinete = {
  path: "M12 2.25A6.75 6.75 0 0 0 5.25 9c0 4.62 5.03 10.8 6.16 12.13a.77.77 0 0 0 1.18 0C13.72 19.8 18.75 13.62 18.75 9A6.75 6.75 0 0 0 12 2.25Zm0 9.5A2.75 2.75 0 1 1 12 6.25a2.75 2.75 0 0 1 0 5.5Z",
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
    icon: envelope,
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
    icon: documento,
  },
  {
    id: "local",
    rotulo: "Local",
    valor: "Mogi Mirim, SP · remoto",
    hex: NEUTRO,
    icon: alfinete,
  },
] satisfies Contato[];
