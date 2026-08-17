"use client";

import { create } from "zustand";

export type QueueStatus =
  | "idle"
  | "uploading"
  | "queued"
  | "processing"
  | "done"
  | "error"
  | "cancelled";

export interface QueueItem {
  id: string;
  defId: string;
  label: string;
  location: "client" | "server";
  fileName: string;
  status: QueueStatus;
  progress: number;
  stage?: string;
  jobId?: string;
  error?: string;
  result?: {
    blobs: Blob[];
    names: string[];
    mimes: string[];
    downloadUrls?: { name: string; url: string }[];
  };
}

interface ConvertStore {
  items: QueueItem[];
  add: (item: QueueItem) => void;
  update: (id: string, patch: Partial<QueueItem>) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useConvertStore = create<ConvertStore>((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [item, ...s.items] })),
  update: (id, patch) =>
    set((s) => ({ items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })),
  remove: (id) => set((s) => ({ items: s.items.filter((it) => it.id !== id) })),
  clear: () => set({ items: [] }),
}));

export function newItemId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
