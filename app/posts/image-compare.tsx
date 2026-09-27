'use client';

export default function ImageCompare({ before, after, beforeLabel, afterLabel }: { before: string; after: string; beforeLabel: string; afterLabel: string }) {
  return <span className="image-compare">
    <img className="compare-after" src={after} alt={afterLabel} />
    <span className="compare-before-window"><img src={before} alt={beforeLabel} /></span>
    <span className="compare-label compare-label-before">{beforeLabel}</span><span className="compare-label compare-label-after">{afterLabel}</span>
    <input className="compare-range" type="range" min="0" max="100" defaultValue="50" aria-label="拖动滑块对比图片" onInput={event => { const value = event.currentTarget.value; event.currentTarget.parentElement?.style.setProperty('--compare-position', `${value}%`); }} />
    <span className="compare-divider" aria-hidden="true" />
  </span>;
}
