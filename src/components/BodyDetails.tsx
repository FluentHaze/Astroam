import { ArrowDownRight, Info, X } from 'lucide-react';
import { BODY_BY_ID } from '../data/bodies';
import type { Snapshot } from '../domain/astronomy/types';
import { useExplorer } from '../state/store';
import { lazy, Suspense } from 'react';

const BodyPreview = lazy(() => import('./BodyPreview'));

export function BodyDetails({ snapshot }: { snapshot: Snapshot | null }) {
  const selected = useExplorer((state) => state.selected);
  const select = useExplorer((state) => state.select);
  if (!selected) return null;
  const body = BODY_BY_ID[selected];
  const position = snapshot?.positions[selected];
  const distanceAu = position
    ? Math.hypot(position.xAu, position.yAu, position.zAu)
    : null;
  let period = '不适用';
  if (body.periodDays > 0)
    period = `${body.periodDays.toLocaleString('zh-CN', { maximumFractionDigits: 1 })} 天`;

  return (
    <aside
      className="body-details panel"
      aria-label="天体详情"
    >
      <div className="section-heading">
        <span>天体档案</span>
        <button
          className="icon-button"
          aria-label="关闭详情"
          onClick={() => select(null)}
        >
          <X size={17} />
        </button>
      </div>
      <Suspense
        fallback={<div className="planet-preview">正在准备贴图预览…</div>}
      >
        <BodyPreview body={body} />
      </Suspense>
      <div className="detail-title">
        <div>
          <span className="eyebrow">{body.english}</span>
          <h2>{body.name}</h2>
        </div>
        <span className="category-tag">{body.category}</span>
      </div>
      <p className="description">{body.description}</p>
      <dl className="body-stats">
        <div>
          <dt>平均半径</dt>
          <dd>{`${body.radiusKm.toLocaleString('zh-CN')} km`}</dd>
        </div>
        <div>
          <dt>{selected === 'Moon' ? '绕地球公转周期' : '绕太阳公转周期'}</dt>
          <dd>{period}</dd>
        </div>
        <div>
          <dt>距太阳中心</dt>
          <dd>
            {distanceAu === null ? '暂不可用' : `${distanceAu.toFixed(4)} AU`}
          </dd>
        </div>
      </dl>
      <div className="fact-box">
        <Info size={15} />
        <p>{body.fact}</p>
      </div>
      <div className="detail-footnote">
        <ArrowDownRight size={14} />
        <span>改变下方时间，观察它的运动</span>
      </div>
      <a
        className="data-source"
        href={body.sourceUrl}
        target="_blank"
        rel="noreferrer"
      >
        基础资料来源 · NASA / JPL
      </a>
      <a
        className="data-source"
        href="https://www.solarsystemscope.com/textures/"
        target="_blank"
        rel="noreferrer"
      >
        贴图：Solar System Scope · CC BY 4.0 · WebP 转换
      </a>
    </aside>
  );
}
