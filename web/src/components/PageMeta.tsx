import { useEffect } from "react";

export interface PageMetaProps {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
}

const DEFAULT_DESCRIPTION =
  "KafkaShop is a high-performance event-driven e-commerce platform powered by Apache Kafka, Redis distributed idempotency, Elasticsearch, and real-time SSE streaming.";
const DEFAULT_OG_IMAGE = "/og-image.png";

export function PageMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_OG_IMAGE,
  noIndex = false,
}: PageMetaProps) {
  const fullTitle = title.toLowerCase().includes("kafkashop")
    ? title
    : `${title} | KafkaShop`;
  const resolvedOgTitle = ogTitle || fullTitle;
  const resolvedOgDesc = ogDescription || description;

  useEffect(() => {
    document.title = fullTitle;

    const setMetaTag = (
      attribute: "name" | "property",
      key: string,
      content: string,
    ) => {
      let element = document.querySelector<HTMLMetaElement>(
        `meta[${attribute}="${key}"]`,
      );
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    setMetaTag("name", "description", description);
    setMetaTag("property", "og:title", resolvedOgTitle);
    setMetaTag("property", "og:description", resolvedOgDesc);
    setMetaTag("property", "og:image", ogImage);
    setMetaTag("name", "twitter:title", resolvedOgTitle);
    setMetaTag("name", "twitter:description", resolvedOgDesc);
    setMetaTag("name", "twitter:image", ogImage);

    if (noIndex) {
      setMetaTag("name", "robots", "noindex, nofollow");
    } else {
      setMetaTag("name", "robots", "index, follow");
    }
  }, [
    fullTitle,
    description,
    resolvedOgTitle,
    resolvedOgDesc,
    ogImage,
    noIndex,
  ]);

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={resolvedOgTitle} />
      <meta property="og:description" content={resolvedOgDesc} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:title" content={resolvedOgTitle} />
      <meta name="twitter:description" content={resolvedOgDesc} />
      <meta name="twitter:image" content={ogImage} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </>
  );
}

export default PageMeta;
