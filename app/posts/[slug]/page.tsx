import { client } from '../../../tina/__generated__/client';
import PostClient from './post-client';

export async function generateStaticParams() {
  const { data } = await client.queries.postConnection();
  return (data.postConnection.edges || []).flatMap(edge => edge?.node ? [{ slug: edge.node._sys.filename }] : []);
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const response = await client.queries.post({ relativePath: `${slug}.md` });
  return <PostClient {...response} />;
}
