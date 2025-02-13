import type { UserConfig as ViteConfig } from "vite";
import { type Options as SvelteConfig } from "@sveltejs/vite-plugin-svelte";
import { type MarkedOptions } from "marked";

export type Theme = {};

export type UserConfig = {
  vite?: ViteConfig;
  svelte?: SvelteConfig;
  marked?: MarkedOptions;
  theme?: Theme;
  site?: {
    title?: string;
    description?: string;
  };
};

export const defineConfig = (config?: UserConfig) => config;
