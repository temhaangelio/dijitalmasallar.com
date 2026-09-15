import { z } from "zod";

export const LOCAL_CHAT_MODEL = "qwen3.5:9b";
export const localChatSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(12000) })).min(1).max(40),
}).superRefine(({ messages }, ctx) => {
  if (messages.at(-1)?.role !== "user") ctx.addIssue({ code: "custom", path: ["messages"], message: "Son mesaj kullanıcıya ait olmalı." });
  if (messages.reduce((sum, message) => sum + message.content.length, 0) > 32000) ctx.addIssue({ code: "custom", path: ["messages"], message: "Sohbet uzadı. Yeni bir sohbet başlatın." });
});
export type ChatMessage = { role: "user" | "assistant"; content: string };
