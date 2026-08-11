import type { Thing, WithContext } from 'schema-dts';

/**
 * Renders a schema.org graph as JSON-LD.
 *
 * Search engines read this to build rich results, and answer engines
 * (ChatGPT, Perplexity, AI Overviews) read it to decide what they can quote.
 * Nothing here is visible to users.
 */
export function JsonLd({ data }: { data: WithContext<Thing> | WithContext<Thing>[] }) {
    return (
        <script
            type="application/ld+json"
            // The payload is built from our own dictionaries and constants, never
            // from user input, so serialising it directly is safe. `<` is escaped
            // anyway so a stray sequence can never close the script tag early.
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(data).replace(/</g, '\\u003c'),
            }}
        />
    );
}
