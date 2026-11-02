import "server-only";
import { cloudinaryConfig } from "@/lib/images";
import { listCategories } from "@/lib/insights/articles";
import { DEFAULT_CATEGORIES } from "@/lib/insights/limits";
import { env } from "@/lib/env";
import { listUsers } from "@/lib/users";

/** Everything the article editor needs besides the article itself. */
export async function editorData() {
  const [users, categories] = await Promise.all([listUsers(), listCategories(DEFAULT_CATEGORIES)]);
  const { WEBSITE_REVALIDATE_URL } = env();
  return {
    authors: users.filter((user) => user.active).map((user) => ({ id: user.id, name: user.name })),
    categories,
    imagesEnabled: cloudinaryConfig() !== null,
    websiteUrl: WEBSITE_REVALIDATE_URL ? new URL(WEBSITE_REVALIDATE_URL).origin : undefined,
  };
}
