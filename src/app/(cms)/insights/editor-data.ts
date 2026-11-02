import "server-only";
import { cloudinaryConfig } from "@/lib/images";
import { listCategories } from "@/lib/insights/articles";
import { DEFAULT_CATEGORIES } from "@/lib/insights/limits";
import { listUsers } from "@/lib/users";
import { websiteOrigin } from "@/lib/website";

/** Everything the article editor needs besides the article itself. */
export async function editorData() {
  const [users, categories] = await Promise.all([listUsers(), listCategories(DEFAULT_CATEGORIES)]);
  return {
    authors: users.filter((user) => user.active).map((user) => ({ id: user.id, name: user.name })),
    categories,
    imagesEnabled: cloudinaryConfig() !== null,
    websiteUrl: websiteOrigin(),
  };
}
