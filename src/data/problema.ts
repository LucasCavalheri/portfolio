// Erros no formato RFC 9457 (Problem Details for HTTP APIs), que substituiu a
// RFC 7807. O corpo é sempre o mesmo objeto, servido como
// application/problem+json, com extensões próprias em `codigo` e `dica`.
import { site } from "./site";

export const TIPO_PROBLEMA = "application/problem+json; charset=utf-8";

/** Cada tipo de erro tem uma URL estável que o documenta. */
export const TIPOS = {
  recursoNaoEncontrado: `${site.url}/desenvolvedores#recurso-nao-encontrado`,
  limiteExcedido: `${site.url}/desenvolvedores#limite-excedido`,
  metodoNaoPermitido: `${site.url}/desenvolvedores#metodo-nao-permitido`,
  erroInterno: `${site.url}/desenvolvedores#erro-interno`,
} as const;

export type Problema = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  /** extensão: identificador estável, seguro para comparar em código */
  codigo: string;
  /** extensão: o que fazer em seguida */
  dica: string;
  documentacao: string;
};

export const problema = (
  status: number,
  type: string,
  title: string,
  detail: string,
  instance: string,
  codigo: string,
  dica: string
): Problema => ({
  type,
  title,
  status,
  detail,
  instance,
  codigo,
  dica,
  documentacao: `${site.url}/desenvolvedores`,
});

export const recursoNaoEncontrado = (caminho: string) =>
  problema(
    404,
    TIPOS.recursoNaoEncontrado,
    "Recurso não encontrado",
    `O recurso ${caminho} não existe nesta API.`,
    caminho,
    "recurso_nao_encontrado",
    "Consulte /api/v1/index.json para a lista de recursos, ou /openapi.json para a especificação."
  );

export const limiteExcedido = (caminho: string, segundos: number) =>
  problema(
    429,
    TIPOS.limiteExcedido,
    "Limite de requisições excedido",
    `Muitas requisições. Tente novamente em ${segundos} segundos.`,
    caminho,
    "limite_excedido",
    "Respeite o cabeçalho Retry-After. A política está em RateLimit-Policy."
  );

export const metodoNaoPermitido = (caminho: string, metodo: string) =>
  problema(
    405,
    TIPOS.metodoNaoPermitido,
    "Método não permitido",
    `Esta API só aceita GET. O método ${metodo} não é suportado.`,
    caminho,
    "metodo_nao_permitido",
    "Use GET. Toda operação é somente leitura e idempotente."
  );
