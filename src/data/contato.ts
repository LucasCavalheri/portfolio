// Formas de falar comigo. Todos os ícones vêm do Tabler, na variante de
// traço: marca em silhueta cheia ao lado de traço fino desequilibrava a
// coluna, e o Tabler cobre também WhatsApp e X, que faltam no Lucide.

export type Contato = {
  id: string;
  rotulo: string;
  valor: string;
  url?: string;
  hex: string;
  /** markup interno do símbolo, traçado */
  corpo: string;
};

const NEUTRO = "#a1a1a1";

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
    corpo:
      '<path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10"/> <path d="M3 7l9 6l9 -6"/>',
  },
  {
    id: "whatsapp",
    rotulo: "WhatsApp",
    valor: "(19) 99903-1230",
    url: `https://api.whatsapp.com/send?phone=5519999031230&text=${mensagemWhatsapp}`,
    hex: "#25D366",
    corpo:
      '<path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9"/> <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1"/>',
  },
  {
    id: "github",
    rotulo: "GitHub",
    valor: "@LucasCavalheri",
    url: "https://github.com/LucasCavalheri",
    hex: "#181717",
    corpo:
      '<path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5"/>',
  },
  {
    id: "linkedin",
    rotulo: "LinkedIn",
    valor: "lucas-cavalheri",
    url: "https://www.linkedin.com/in/lucas-cavalheri/",
    hex: "#0A66C2",
    corpo:
      '<path d="M8 11v5"/> <path d="M8 8v.01"/> <path d="M12 16v-5"/> <path d="M16 16v-3a2 2 0 1 0 -4 0"/> <path d="M3 7a4 4 0 0 1 4 -4h10a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-10a4 4 0 0 1 -4 -4l0 -10"/>',
  },
  {
    id: "instagram",
    rotulo: "Instagram",
    valor: "@lucascavalheri.dev",
    url: "https://www.instagram.com/lucascavalheri.dev/",
    hex: "#FF0069",
    corpo:
      '<path d="M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4l0 -8"/> <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/> <path d="M16.5 7.5v.01"/>',
  },
  {
    id: "x",
    rotulo: "X",
    valor: "@CavalheriDev",
    url: "https://x.com/CavalheriDev",
    hex: "#000000",
    corpo:
      '<path d="M4 4l11.733 16h4.267l-11.733 -16l-4.267 0"/> <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/>',
  },
  {
    id: "curriculo",
    rotulo: "Currículo",
    valor: "PDF",
    url: "/Curriculo-LucasCavalheri.pdf",
    hex: NEUTRO,
    corpo:
      '<path d="M14 3v4a1 1 0 0 0 1 1h4"/> <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2"/> <path d="M9 9l1 0"/> <path d="M9 13l6 0"/> <path d="M9 17l6 0"/>',
  },
  {
    id: "local",
    rotulo: "Local",
    valor: "Mogi Mirim, SP · remoto",
    hex: NEUTRO,
    corpo:
      '<path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/> <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0"/>',
  },
] satisfies Contato[];
