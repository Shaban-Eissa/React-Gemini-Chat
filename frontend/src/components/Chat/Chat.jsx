import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { marked } from "marked";
import clsx from "clsx";

const modelName = "gemini-2.5-flash";
const embeddingModel = "text-embedding-004";
const topK = 3;
const backendUrl = import.meta.env.VITE_BACKEND_URL;

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = useMutation({
    mutationFn: async (question) => {
      const res = await fetch(`${backendUrl}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error("Request failed");
      return res.json();
    },
    onMutate: (question) => {
      setMessages((prev) => [...prev, { role: "user", content: question }]);
      setInput("");
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Something went wrong" },
      ]);
    },
  });

  const canSend = input.trim().length > 0 && !sendMessage.isPending;

  const renderedContent = (m) =>
    m.role === "assistant" ? marked.parse(m.content) : m.content;

  const handleEnter = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) sendMessage.mutate(input.trim());
    }
  };

  return (
    <div className="h-full p-4 md:p-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="w-full h-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-5 rounded-2xl bg-white dark:bg-gray-800 shadow border border-gray-200 dark:border-gray-700 p-4 md:p-5 flex items-center justify-between">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-blue-600 text-white grid place-items-center font-semibold shadow-sm">
              AI
            </div>
            <div>
              <div className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                React Code Chat
              </div>
              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Ask questions about your codebase with RAG context.
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 md:gap-2 text-[11px] md:text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 text-blue-700 dark:text-blue-300">
                  Model: {modelName}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 text-emerald-700 dark:text-emerald-300">
                  Embeddings: {embeddingModel}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 py-0.5 text-gray-700 dark:text-gray-300">
                  TopK: {topK}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/30 px-2.5 py-0.5 text-purple-700 dark:text-purple-300 truncate max-w-[220px] md:max-w-none">
                  API: {backendUrl}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat window */}
        <div className="flex flex-col h-[calc(100vh-220px)]">
          <div className="flex-1 overflow-y-auto scroll-smooth rounded-2xl border border-gray-200 dark:border-gray-700 p-4 md:p-5 space-y-4 md:space-y-5 bg-white dark:bg-gray-900">
            {messages.map((m, i) => (
              <div key={i} className="w-full">
                <div
                  className={clsx("flex items-start gap-3 md:gap-4", {
                    "flex-row-reverse": m.role === "user",
                  })}
                >
                  <div
                    className={clsx(
                      "h-8 w-8 md:h-9 md:w-9 rounded-full grid place-items-center text-[10px] md:text-xs font-semibold shadow-sm",
                      m.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-white dark:bg-gray-600"
                    )}
                  >
                    {m.role === "user" ? "U" : "AI"}
                  </div>
                  <div
                    className={clsx(
                      "relative max-w-[90%] md:max-w-[75%] px-3.5 md:px-4 py-2.5 md:py-3 rounded-2xl border text-[0.95rem] md:text-base leading-6 md:leading-7 message-content",
                      m.role === "user"
                        ? "ml-auto bg-blue-50 text-blue-900 border-blue-200"
                        : "mr-auto bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
                    )}
                    dangerouslySetInnerHTML={{ __html: renderedContent(m) }}
                  />
                </div>
              </div>
            ))}

            {sendMessage.isPending && (
              <div className="w-full">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="h-8 w-8 md:h-9 md:w-9 rounded-full grid place-items-center text-[10px] md:text-xs font-semibold bg-gray-700 text-white">
                    AI
                  </div>
                  <div className="mr-auto max-w-[90%] md:max-w-[75%] px-3.5 md:px-4 py-2.5 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-gray-200">
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce">•</span>
                      <span className="animate-bounce [animation-delay:150ms]">
                        •
                      </span>
                      <span className="animate-bounce [animation-delay:300ms]">
                        •
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="mt-4 sticky bottom-0 bg-gradient-to-t from-white dark:from-gray-900 pt-4">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleEnter}
                placeholder="Ask anything about your code…"
                className="w-full h-14 md:h-16 pr-14 md:pr-16 border border-gray-300 dark:border-gray-700 rounded-2xl px-4 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-[0.95rem] md:text-base"
              />
              <button
                disabled={!canSend}
                onClick={() => sendMessage.mutate(input.trim())}
                className="absolute bottom-2 right-2 inline-grid place-items-center h-10 w-10 md:h-12 md:w-12 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 md:h-6 md:w-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
