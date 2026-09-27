'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type Product = {
  appid: number; name: string; shortDescription: string; headerImage: string;
  developers: string[]; genres: string[]; releaseDate: string; platforms: string[];
};

function useProduct(appid: string, enabled = true) {
  const [product, setProduct] = useState<Product | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    fetch(`/ns/api/steam/app/${appid}`).then(r => {
      if (!r.ok) throw new Error('Steam product unavailable');
      return r.json();
    }).then(data => { if (active) setProduct(data); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [appid, enabled]);
  return { product, failed };
}

function ProductDetails({ product, appid, compact = false }: { product: Product; appid: string; compact?: boolean }) {
  return <span className={`steam-product${compact ? ' steam-product-compact' : ''}`}>
    {product.headerImage && <img className="steam-product-image" src={product.headerImage} alt={`${product.name} 商品图片`} loading="lazy" />}
    <span className="steam-product-info">
      <strong className="steam-product-name">{product.name}</strong>
      {product.shortDescription && <span className="steam-product-description">{product.shortDescription}</span>}
      <span className="steam-product-meta">{[product.genres.slice(0, 2).join(' / '), product.releaseDate, product.developers.slice(0, 1).join('')].filter(Boolean).join(' · ')}</span>
      <a className="steam-product-cta" href={`https://store.steampowered.com/app/${appid}/`} target="_blank" rel="noreferrer">在Steam查看</a>
    </span>
  </span>;
}

export function SteamProductCard({ appid }: { appid: string }) {
  const { product, failed } = useProduct(appid);
  if (!product) return <span className="steam-card-placeholder">{failed ? `Steam 商品信息暂不可用（${appid}）` : `正在加载 Steam 商品（${appid}）…`}</span>;
  return <ProductDetails product={product} appid={appid} />;
}

export function SteamHoverLink({ appid, href, children }: { appid: string; href: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const { product, failed } = useProduct(appid, open);
  useEffect(() => {
    if (!open || window.matchMedia('(hover: hover)').matches) return;
    const closeOutside = (event: PointerEvent) => { if (!wrap.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [open]);
  return <span ref={wrap} className="steam-hover-wrap" onMouseEnter={() => { if (window.matchMedia('(hover: hover)').matches) setOpen(true); }} onMouseLeave={() => { if (window.matchMedia('(hover: hover)').matches) setOpen(false); }} onFocus={() => { if (window.matchMedia('(hover: hover)').matches) setOpen(true); }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }}>
    <a href={href} target="_blank" rel="noreferrer" aria-expanded={open} aria-haspopup="true" onClick={event => { if (window.matchMedia('(hover: none)').matches) { event.preventDefault(); setOpen(value => !value); } }}>{children}</a>
    {open && <span className="steam-hover-popup" role="status">{product ? <ProductDetails product={product} appid={appid} compact /> : failed ? 'Steam 商品信息暂不可用' : '正在加载 Steam 商品信息…'}</span>}
  </span>;
}
