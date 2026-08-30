import type { OfficialAiSource } from "./types";

/** Explicit allow-list: the crawler never follows a URL outside these first-party hosts. */
export const officialAiSources: readonly OfficialAiSource[] = [
  { name: "OpenAI", url: "https://openai.com/news/", host: "openai.com" },
  { name: "Anthropic", url: "https://www.anthropic.com/news", host: "anthropic.com" },
  { name: "Google", url: "https://blog.google/technology/", host: "blog.google" },
  { name: "Google DeepMind", url: "https://deepmind.google/discover/blog/", host: "deepmind.google" },
  { name: "Google Developers", url: "https://developers.googleblog.com/", host: "developers.googleblog.com" },
  { name: "Apple", url: "https://www.apple.com/newsroom/", host: "apple.com" },
  { name: "Microsoft", url: "https://news.microsoft.com/source/topics/ai/", host: "news.microsoft.com" },
  { name: "Meta", url: "https://about.fb.com/news/", host: "about.fb.com" },
  { name: "NVIDIA", url: "https://blogs.nvidia.com/", host: "blogs.nvidia.com" },
  { name: "Hugging Face", url: "https://huggingface.co/blog", host: "huggingface.co" },
];

export function sourceForUrl(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
    return officialAiSources.find((source) => hostname === source.host || hostname.endsWith(`.${source.host}`)) ?? null;
  } catch {
    return null;
  }
}
