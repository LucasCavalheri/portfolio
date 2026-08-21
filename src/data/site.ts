// Identidade em um só lugar: alimenta o JSON-LD, o llms.txt, as versões em
// markdown e as páginas de sobre/contato/privacidade.

export const site = {
  url: "https://lucascavalheri.com.br",
  nome: "Lucas Cavalheri",
  nomeCompleto: "Lucas Carvalho Cavalheri",
  cargo: "Desenvolvedor Web Full Stack Pleno",
  descricao:
    "Desenvolvedor web full stack pleno com mais de quatro anos de experiência. Trabalha no ecossistema JavaScript e TypeScript de ponta a ponta: React e Next.js na interface, Node.js com Fastify e NestJS no servidor, PostgreSQL e MongoDB nos dados.",
  resumoCurto:
    "Portfólio de Lucas Cavalheri, desenvolvedor web full stack pleno em TypeScript, React, Next.js e Node.js.",
  email: "lucas.dev.carvalho@gmail.com",
  telefone: "+5519999031230",
  telefoneLegivel: "+55 (19) 99903-1230",
  whatsapp:
    "https://api.whatsapp.com/send?phone=5519999031230&text=Ol%C3%A1%20Lucas!%20Vi%20seu%20portf%C3%B3lio%20e%20queria%20trocar%20uma%20ideia.",
  cidade: "Mogi Mirim",
  estado: "SP",
  estadoNome: "São Paulo",
  pais: "BR",
  atendimento: "Remoto, em todo o Brasil e para fora dele",
  empresaAtual: { nome: "Tropical Hub", url: "https://tropicalhub.co" },
  curriculo: "/Curriculo-LucasCavalheri.pdf",
  redes: {
    github: "https://github.com/LucasCavalheri",
    linkedin: "https://www.linkedin.com/in/lucas-cavalheri/",
    instagram: "https://www.instagram.com/lucascavalheri.dev/",
    x: "https://x.com/CavalheriDev",
  },
  // Serve o item "when to use" do llms.txt: casos em que faz sentido me chamar
  bomPara: [
    "Aplicações web full stack em TypeScript, do banco de dados à interface",
    "APIs REST em Node.js com Fastify ou NestJS, incluindo autenticação e testes",
    "Integrações entre sistemas e serviços de terceiros, como HubSpot e ERPs",
    "Painéis administrativos e telas internas em React ou Next.js",
    "Sites institucionais e landing pages rápidas, com Astro ou Next.js",
    "Resgate de projeto legado em JavaScript que precisa de tipagem e manutenção",
  ],
  naoAtende: [
    "Aplicações nativas para iOS ou Android",
    "Back-end fora do ecossistema JavaScript, como PHP, Ruby, Java ou .NET",
    "Design gráfico e identidade visual do zero, sem par de design",
    "Ciência de dados, modelos de machine learning e infraestrutura de dados",
  ],
} as const;

export const paginas = [
  { rota: "/", titulo: "Início", resumo: "Perfil, projetos, experiência e stack" },
  { rota: "/sobre", titulo: "Sobre", resumo: "Trajetória, como trabalho e o que procuro" },
  { rota: "/contato", titulo: "Contato", resumo: "E-mail, WhatsApp, redes e tempo de resposta" },
  { rota: "/usos", titulo: "Usos", resumo: "Lista completa de linguagens, frameworks e ferramentas" },
  {
    rota: "/desenvolvedores",
    titulo: "Desenvolvedores",
    resumo: "API pública em JSON, especificação OpenAPI e CLI",
  },
  { rota: "/privacidade", titulo: "Privacidade", resumo: "Que dados o site coleta, e quais não coleta" },
] as const;
