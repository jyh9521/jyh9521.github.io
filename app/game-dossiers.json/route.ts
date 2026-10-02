import { getGames } from '../../lib/games';

export const dynamic = 'force-static';

// Public local dossiers only: no upstream request, credentials or private notes.
export function GET() {
  return Response.json(getGames().map(game => ({
    slug: game.slug,
    title: game.title,
    names: [...new Set([
      game.title, game.metadata?.title, game.metadata?.localizedName,
      game.metadata?.originalName, ...(game.metadata?.alternativeNames || []),
    ].filter((name): name is string => Boolean(name)))],
  })));
}
