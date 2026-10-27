import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  Compass,
  Crosshair,
  Eye,
  HelpCircle,
  Orbit,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { BodyPicker } from '../components/BodyPicker';
import { BodyDetails } from '../components/BodyDetails';
import { TimeController } from '../components/TimeController';
import { useExplorer } from '../state/store';
import { useAstronomy } from './useAstronomy';

const SolarScene = lazy(() => import('../scene/SolarScene'));

class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div
          className="scene-fallback"
          role="alert"
        >
          <h2>三维场景暂不可用</h2>
          <p>你仍可选择天体、查看资料和改变时间。</p>
          <button onClick={() => this.setState({ failed: false })}>
            重试场景
          </button>
        </div>
      );
    return this.props.children;
  }
}

export default function App() {
  const { snapshot, paths, error, retry } = useAstronomy();
  const labels = useExplorer((state) => state.labels);
  const orbits = useExplorer((state) => state.orbits);
  const [help, setHelp] = useState(false);
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (help) setHelp(false);
      else useExplorer.getState().select(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [help]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="./"
          aria-label="Astroam 星际漫游首页"
        >
          <Orbit
            size={29}
            strokeWidth={1.4}
          />
          <span>ASTROAM</span>
          <span className="brand-divider" />
          <span className="brand-subtitle">星际漫游</span>
        </a>
        <div
          className="mode-tabs"
          aria-label="探索模式"
        >
          <span className="mode-tab current">
            <Orbit size={15} />
            <span>太阳系探索</span>
          </span>
          <span
            className="mode-tab future"
            title="后续版本开放"
          >
            <Sparkles size={14} />
            <span>今晚观星</span>
            <small>即将启程</small>
          </span>
        </div>
        <button
          className="help-button"
          onClick={() => setHelp((value) => !value)}
          aria-expanded={help}
        >
          <HelpCircle size={17} />
          <span>操作指南</span>
        </button>
      </header>
      <main
        className="explorer"
        aria-label="太阳系探索工作区"
      >
        <div className="scene-container">
          <SceneBoundary>
            <Suspense
              fallback={<div className="scene-fallback">正在准备三维场景…</div>}
            >
              {snapshot && !error && (
                <SolarScene
                  snapshot={snapshot}
                  paths={paths}
                />
              )}
            </Suspense>
          </SceneBoundary>
        </div>
        <div className="scene-intro">
          <span className="eyebrow">A SMALL STEP INTO THE UNIVERSE</span>
          <h1>从这里，望向宇宙。</h1>
          <p>选择一颗星球，开启你的太阳系漫游。</p>
        </div>
        <BodyPicker />
        <BodyDetails snapshot={error ? null : snapshot} />
        <div
          className="scene-tools panel"
          aria-label="场景设置"
        >
          <button
            aria-pressed={orbits}
            aria-label="显示轨道"
            title="显示轨道"
            onClick={() => useExplorer.getState().toggleOrbits()}
          >
            <Orbit size={19} />
          </button>
          <button
            aria-pressed={labels}
            aria-label="显示名称"
            title="显示名称"
            onClick={() => useExplorer.getState().toggleLabels()}
          >
            <Eye size={19} />
          </button>
          <span />
          <button
            aria-label="重置视角"
            title="重置视角"
            onClick={() => useExplorer.getState().resetCamera()}
          >
            <Crosshair size={19} />
          </button>
        </div>
        <div className="scene-notes">
          <Compass size={14} />
          <span>示意比例 · 天体大小与距离已调整</span>
          <span className="notes-secondary">
            轨道为启动时刻起的一周参考轨迹 · 星野为装饰
          </span>
        </div>
        {!snapshot && !error && (
          <div
            className="status-banner"
            role="status"
          >
            正在计算太阳系位置…
          </div>
        )}
        {error && (
          <div
            className="status-banner error"
            role="alert"
          >
            <span>{error}</span>
            <button onClick={retry}>
              <RotateCcw size={14} />
              <span>重试计算</span>
            </button>
          </div>
        )}
        {help && (
          <section
            className="help-panel panel"
            aria-label="操作指南"
          >
            <div className="section-heading">
              <span>开始你的探索</span>
              <button
                className="icon-button"
                aria-label="关闭操作指南"
                onClick={() => setHelp(false)}
              >
                <X size={17} />
              </button>
            </div>
            <p>拖动旋转 · 滚轮缩放 · 右键拖动平移</p>
            <p>触控：单指旋转，双指缩放与平移。</p>
            <p>单击天体或左侧列表查看资料。点击空白取消选择。</p>
            <p>
              场景获得焦点后：方向键旋转，＋／－缩放，Home 重置，Esc 关闭详情。
            </p>
            <p>选择速度后点击播放。修改日期会暂停；回到现在恢复实时 1 倍。</p>
            <p>
              日期编辑使用
              UTC，主时间按设备时区显示。后台暂停绘制与模拟推进，返回后实时模式重新读取系统时钟。
            </p>
            <p className="muted">
              第一轮原型 · 位置使用 Astronomy Engine；表面贴图来自 Solar System
              Scope，并非实时影像。独立星历精度对照尚待完成。
            </p>
          </section>
        )}
      </main>
      <TimeController />
      <div className="app-footer">
        <span>ASTROAM / EXPLORER 0.1</span>
        <span>保持好奇，继续探索。</span>
      </div>
    </div>
  );
}
