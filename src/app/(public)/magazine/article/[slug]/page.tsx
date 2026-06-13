import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Eye,
  Facebook,
  Twitter,
  MessageCircle,
  Share2,
} from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { SITE } from "@/content/site";
import { formatDateLong } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getArticleBySlug,
  getRelatedArticles,
  getAdjacentArticles,
  listComments,
  isBookmarked,
  getMyReaction,
} from "@/lib/magazine/queries";
import { recordView } from "@/lib/magazine/actions";
import { getContributorForArticle } from "@/lib/contributors/queries";
import { can } from "@/lib/auth/roles";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { CategoryChip } from "@/components/magazine/category-chip";
import { AuthorCard } from "@/components/magazine/author-card";
import { BlockRenderer } from "@/components/magazine/block-renderer";
import { ReadingProgress } from "@/components/magazine/reading-progress";
import { ReactionBar } from "@/components/magazine/reaction-bar";
import { BookmarkButton } from "@/components/magazine/bookmark-button";
import { CommentSection } from "@/components/magazine/comment-section";
import { RelatedArticles } from "@/components/magazine/related-articles";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return createMetadata({ title: "Article not found", description: "" });
  return createMetadata({
    title: article.seo_title || article.title,
    description: article.seo_description || article.excerpt || `A story from ${SITE.name}.`,
    path: `/magazine/article/${article.slug}`,
    image: article.cover_image || undefined,
    type: "article",
  });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const user = await getCurrentUser();
  const isStaff = user ? can(user.role, "content:moderate") : false;
  const isAuthor = user?.id === article.author_id;
  const isPreview = article.status !== "published";
  if (isPreview && !isStaff && !isAuthor) notFound();

  if (!isPreview) await recordView(article.id);

  const [related, adjacent, comments, contributor] = await Promise.all([
    getRelatedArticles(article, 3),
    getAdjacentArticles(article),
    listComments(article.id, { approvedOnly: true }),
    getContributorForArticle(article),
  ]);
  const authorRef = contributor
    ? { id: contributor.id, full_name: contributor.display_name, avatar_url: contributor.profile_photo }
    : article.author;
  const authorHref = contributor ? `/authors/${contributor.slug}` : undefined;
  const [bookmarked, myReaction] = user
    ? await Promise.all([isBookmarked(article.id, user.id), getMyReaction(article.id, user.id)])
    : [false, null];

  const url = `${SITE.url}/magazine/article/${article.slug}`;
  const shareText = encodeURIComponent(article.title);
  const shareUrl = encodeURIComponent(url);

  const articleLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt ?? "",
    datePublished: article.published_at ?? article.created_at,
    dateModified: article.updated_at ?? article.created_at,
    author: { "@type": "Person", name: article.author?.full_name ?? "Club member" },
    publisher: { "@type": "Organization", name: SITE.name },
    ...(article.cover_image ? { image: article.cover_image } : {}),
    mainEntityOfPage: url,
  };

  return (
    <>
      <ReadingProgress />
      <JsonLd data={articleLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Magazine", path: "/magazine" },
          { name: article.title, path: `/magazine/article/${article.slug}` },
        ])}
      />

      {/* ── Editorial masthead ─────────────────────────────────────────── */}
      <header className="relative isolate overflow-hidden border-b border-line">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-aurora opacity-70" />
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-50" />
        <div className="container-page max-w-3xl py-sp-5 text-center">
          <Link href="/magazine" className="mb-sp-4 inline-flex items-center gap-1 text-caption font-semibold text-soft hover:text-ink">
            <ArrowLeft className="size-4" /> Back to magazine
          </Link>

          {isPreview ? (
            <div className="mx-auto mb-sp-3 w-fit rounded-pill border border-warning/40 bg-warning-bg/50 px-3 py-1 text-caption font-semibold text-gold-700">
              Preview — not published yet
            </div>
          ) : null}

          {article.category ? (
            <div className="mb-sp-2 flex justify-center">
              <CategoryChip name={article.category.name} color={article.category.color} />
            </div>
          ) : null}

          <h1 className="mx-auto max-w-3xl font-display text-display font-extrabold leading-[1.05] tracking-tight text-ink text-balance">
            {article.title}
          </h1>

          {article.excerpt ? (
            <p className="mx-auto mt-sp-3 max-w-2xl text-lead leading-relaxed text-soft">{article.excerpt}</p>
          ) : null}

          {/* Byline */}
          <div className="mt-sp-4 flex flex-col items-center gap-sp-2">
            <div className="flex items-center justify-center">
              <AuthorCard
                author={authorRef}
                href={authorHref}
                subtitle={contributor?.headline ?? (article.editor ? `Edited by ${article.editor.full_name}` : "Club member")}
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-caption text-soft">
              {article.published_at ? <span>{formatDateLong(article.published_at)}</span> : null}
              <span aria-hidden className="text-line-strong">·</span>
              <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {article.reading_time} min read</span>
              <span aria-hidden className="text-line-strong">·</span>
              <span className="inline-flex items-center gap-1"><Eye className="size-3.5" /> {article.views} views</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Cover (breaks out wider than the text column) ───────────────── */}
      {article.cover_image ? (
        <div className="container-page max-w-4xl">
          <figure className="relative -mt-2">
            <div aria-hidden className="absolute -inset-3 -z-10 rounded-2xl bg-gradient-brand opacity-10 blur-2xl" />
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-line bg-background-subtle shadow-xl">
              <Image src={article.cover_image} alt="" fill sizes="(max-width: 1024px) 100vw, 896px" className="object-cover" priority />
            </div>
          </figure>
        </div>
      ) : null}

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <article className="container-page max-w-2xl py-sp-5">
        <div className="prose-article">
          <BlockRenderer blocks={article.blocks} />
        </div>

        {/* Reactions + bookmark + share */}
        <div className="mt-sp-5 flex flex-col gap-sp-3 border-y border-line py-sp-3">
          <ReactionBar
            articleId={article.id}
            slug={article.slug}
            initial={myReaction}
            totalLikes={article.likes}
            canReact={Boolean(user)}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <BookmarkButton articleId={article.id} slug={article.slug} initialBookmarked={bookmarked} canBookmark={Boolean(user)} />
            <div className="flex items-center gap-1 text-soft">
              <Share2 className="size-4" aria-hidden />
              <a aria-label="Share on Facebook" className="inline-flex size-9 items-center justify-center rounded-md hover:bg-background-subtle hover:text-ink" href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer">
                <Facebook className="size-4" />
              </a>
              <a aria-label="Share on X" className="inline-flex size-9 items-center justify-center rounded-md hover:bg-background-subtle hover:text-ink" href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`} target="_blank" rel="noopener noreferrer">
                <Twitter className="size-4" />
              </a>
              <a aria-label="Share on WhatsApp" className="inline-flex size-9 items-center justify-center rounded-md hover:bg-background-subtle hover:text-ink" href={`https://wa.me/?text=${shareText}%20${shareUrl}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Prev / next */}
        {(adjacent.prev || adjacent.next) ? (
          <nav className="mt-sp-4 grid gap-sp-3 sm:grid-cols-2" aria-label="More articles">
            {adjacent.prev ? (
              <Link href={`/magazine/article/${adjacent.prev.slug}`} className="rounded-lg border border-line bg-surface p-sp-3 hover:border-line-strong">
                <span className="inline-flex items-center gap-1 text-caption font-semibold text-soft"><ArrowLeft className="size-4" /> Previous</span>
                <p className="mt-1 font-heading font-bold text-ink">{adjacent.prev.title}</p>
              </Link>
            ) : <span />}
            {adjacent.next ? (
              <Link href={`/magazine/article/${adjacent.next.slug}`} className="rounded-lg border border-line bg-surface p-sp-3 text-right hover:border-line-strong">
                <span className="inline-flex items-center gap-1 text-caption font-semibold text-soft sm:justify-end">Next <ArrowRight className="size-4" /></span>
                <p className="mt-1 font-heading font-bold text-ink">{adjacent.next.title}</p>
              </Link>
            ) : <span />}
          </nav>
        ) : null}

        {article.edition ? (
          <p className="mt-sp-4 text-caption text-soft">
            From{" "}
            <Link href={`/magazine/${article.edition.slug}`} className="font-semibold text-primary-active underline">
              {article.edition.title}
            </Link>
          </p>
        ) : null}
      </article>

      <CommentSection articleId={article.id} comments={comments} canComment={Boolean(user)} />

      <div className="bg-background-subtle">
        <RelatedArticles articles={related} />
      </div>
    </>
  );
}
