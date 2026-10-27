# 数据与资产来源

核验日期：2026-10-27。当前为教学探索原型，不输出地面观测指引。

| 类别           | 来源与版本                                                                                                   | 用途与说明                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| 天文计算       | [Astronomy Engine 2.1.19](https://github.com/cosinekitty/astronomy)                                          | MIT；浏览器本地计算，使用 HelioVector 获取日心 J2000 赤道坐标，距离 AU                         |
| API 与坐标说明 | [JavaScript / TypeScript 官方文档](https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md) | 计算接口、参考系与时间输入依据                                                                 |
| 行星物理参数   | [NASA JPL Planetary Physical Parameters](https://ssd.jpl.nasa.gov/planets/phys_par.html)                     | 平均半径；展示值适度取整。公转周期为近似恒星周期，只用于参考轨迹采样与科普展示，不参与位置计算 |
| 科普简介       | [NASA Solar System Exploration](https://science.nasa.gov/solar-system/)                                      | 中文简介为项目自行概述，不复制原文                                                             |
| 太阳           | [NASA Sun Facts](https://science.nasa.gov/sun/facts/)                                                        | 太阳资料；半径采用常用名义值 695700 km                                                         |
| 月亮           | [NASA Moon Facts](https://science.nasa.gov/moon/facts/)                                                      | 月球资料、约 27.3 天公转与约 29.5 天月相周期                                                   |
| 球体纹理       | [Solar System Scope](https://www.solarsystemscope.com/textures/) · CC BY 4.0                                 | 十个 2048×1024 表面贴图；经公开署名镜像下载后转为 WebP                                         |
| 档案缩略图     | `src/components/BodyPreview.tsx`                                                                             | 使用与场景相同的贴图与球体组件；固定预览光照，不代表当前相位                                   |
| 背景星空与银河 | `src/scene/Starfield.tsx`                                                                                    | 原创程序化银河与确定性星点，包含冷暖色、亮度层次和暗尘带；不对应真实星表或观测方位             |
| 图标           | Lucide React 0.468.0                                                                                         | ISC，按需引用                                                                                  |

项目不依赖付费 API、在线纹理服务、天气接口或账号系统。开源软件的许可随依赖包保留；正式对外分发前仍需生成包含所有间接依赖的完整第三方归属清单。当前未使用星表、城市数据。纹理属于基于影像与地图制作的美术资产，含调色与缺失区域补全，并非实时影像。

贴图逐文件清单、尺寸、体积、原始与转换后 SHA-256 见 `public/textures/manifest.json`；随资源分发的署名和修改说明见 `public/textures/ATTRIBUTION.md`。十个表面贴图取自 [Sanghel 公开镜像](https://github.com/Sanghel/solar-system-3d/tree/develop/public/textures)，云层、法线和星环取自 [Qt 官方镜像](https://github.com/qt/qt3d/tree/dev/tests/manual/planets-qml/images/solarsystemscope)。[Qt 的归属说明](https://doc.qt.io/qt-6/qt3d-attribution-solar-system-scope.html)明确记录这批资源的来源与 CC BY 4.0 授权。未复制镜像仓库中的程序代码。
