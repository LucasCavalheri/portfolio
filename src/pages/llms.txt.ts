import { llmsTxt } from "../data/markdown";

export const GET = () =>
  new Response(llmsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
