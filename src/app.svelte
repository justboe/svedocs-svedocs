<script lang="ts">
  import { type Component } from "svelte";

  type Props = {
    markdown?: { html: string; frontmatter: Record<any, any> };
    Layout?: Component;
  };

  const { markdown, Layout }: Props = $props();
</script>

{#if Layout}
  <Layout>
    {@render md()}
  </Layout>
{:else}
  <main>
    {@render md()}
  </main>
{/if}

{#snippet md()}
  {#if markdown}
    {@html markdown.html}
  {/if}
{/snippet}
