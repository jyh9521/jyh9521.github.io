import { defineConfig } from 'tinacms';

export default defineConfig({
  branch: process.env.NEXT_PUBLIC_TINA_BRANCH || 'main',
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || '',
  token: process.env.TINA_TOKEN || '',
  build: { outputFolder: 'admin', publicFolder: 'public' },
  media: { tina: { mediaRoot: 'uploads', publicFolder: 'public' } },
  schema: {
    collections: [
      {
        name: 'post', label: '文章', path: 'content/posts', format: 'md',
        ui: { router: ({ document }) => `/posts/${document._sys.filename}/` },
        fields: [
          { type: 'string', name: 'title', label: '标题', isTitle: true, required: true },
          { type: 'datetime', name: 'date', label: '发布日期', required: true },
          { type: 'string', name: 'description', label: '摘要', ui: { component: 'textarea' } },
          { type: 'image', name: 'cover', label: '封面图片', accept: 'image' },
          { type: 'string', name: 'tags', label: '标签', list: true },
          { type: 'rich-text', name: 'body', label: '正文', isBody: true, required: true },
          { type: 'image', name: 'audio', label: '音频文件', accept: 'audio' },
          { type: 'image', name: 'video', label: '视频文件', accept: 'video' },
          { type: 'image', name: 'attachment', label: '下载附件', accept: 'document' }
        ]
      }
    ]
  }
});
