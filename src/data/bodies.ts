import type { BodyInfo } from '../domain/astronomy/types';

const BODY_DATA: Omit<BodyInfo, 'sourceUrl'>[] = [
  {
    id: 'Sun',
    name: '太阳',
    english: 'SUN',
    category: '恒星',
    color: '#ffb454',
    radiusKm: 695700,
    periodDays: 0,
    displayRadius: 1.8,
    description:
      '太阳系的中心恒星。一颗持续进行核聚变的炽热等离子体球，为地球带来光与热。',
    fact: '太阳约占太阳系总质量的 99.86%。',
  },
  {
    id: 'Mercury',
    name: '水星',
    english: 'MERCURY',
    category: '类地行星',
    color: '#b7ada0',
    radiusKm: 2439.4,
    periodDays: 87.969,
    displayRadius: 0.28,
    description:
      '最靠近太阳的行星，表面布满撞击坑。稀薄的外逸层几乎无法保存热量，昼夜温差极大。',
    fact: '水星的一次太阳日约相当于 176 个地球日。',
  },
  {
    id: 'Venus',
    name: '金星',
    english: 'VENUS',
    category: '类地行星',
    color: '#e0bd86',
    radiusKm: 6051.8,
    periodDays: 224.701,
    displayRadius: 0.44,
    description:
      '被浓密云层包裹的岩石行星。强烈的温室效应使它成为太阳系表面最热的行星。',
    fact: '金星的自转方向与大多数行星相反。',
  },
  {
    id: 'Earth',
    name: '地球',
    english: 'EARTH',
    category: '类地行星',
    color: '#6caeff',
    radiusKm: 6371,
    periodDays: 365.256,
    displayRadius: 0.48,
    description:
      '我们的蓝色家园。液态海洋、保护性大气与适宜的温度，共同孕育了目前已知的生命。',
    fact: '太阳光到达地球，平均需要约 8 分 20 秒。',
  },
  {
    id: 'Moon',
    name: '月亮',
    english: 'MOON',
    category: '天然卫星',
    color: '#c3c7d0',
    radiusKm: 1737.4,
    periodDays: 27.322,
    displayRadius: 0.18,
    description:
      '地球唯一的天然卫星。它与地球潮汐锁定，因此我们总是看到大致相同的一面。',
    fact: '月亮的公转周期约为 27.3 天，月相周期约为 29.5 天。',
  },
  {
    id: 'Mars',
    name: '火星',
    english: 'MARS',
    category: '类地行星',
    color: '#e58b68',
    radiusKm: 3389.5,
    periodDays: 686.98,
    displayRadius: 0.36,
    description:
      '一颗拥有铁锈色地表的岩石行星。极冠、峡谷和干涸河床记录着它复杂的气候历史。',
    fact: '火星上的奥林帕斯山是太阳系最大的火山之一。',
  },
  {
    id: 'Jupiter',
    name: '木星',
    english: 'JUPITER',
    category: '气态巨行星',
    color: '#d7b598',
    radiusKm: 69911,
    periodDays: 4332.589,
    displayRadius: 1.05,
    description:
      '太阳系最大的行星。它的大气充满条纹云带和巨大风暴，大红斑已持续存在数百年。',
    fact: '木星的平均直径约为地球的 11 倍。',
  },
  {
    id: 'Saturn',
    name: '土星',
    english: 'SATURN',
    category: '气态巨行星',
    color: '#e5d1a0',
    radiusKm: 58232,
    periodDays: 10759.22,
    displayRadius: 0.88,
    description:
      '以壮观的环系闻名。环由无数冰粒和岩屑组成，行星本身主要由氢与氦构成。',
    fact: '土星的平均密度比水还小。',
  },
  {
    id: 'Uranus',
    name: '天王星',
    english: 'URANUS',
    category: '冰巨行星',
    color: '#91d1d6',
    radiusKm: 25362,
    periodDays: 30688.5,
    displayRadius: 0.65,
    description:
      '呈青蓝色的冰巨行星。自转轴高度倾斜，仿佛侧躺着沿轨道环绕太阳。',
    fact: '天王星的自转轴倾角约为 98°。',
  },
  {
    id: 'Neptune',
    name: '海王星',
    english: 'NEPTUNE',
    category: '冰巨行星',
    color: '#668eec',
    radiusKm: 24622,
    periodDays: 60182,
    displayRadius: 0.62,
    description:
      '太阳系最外侧的行星。遥远而寒冷的大气中，存在极为强劲的风和快速变化的云系。',
    fact: '海王星绕太阳一周约需要 165 个地球年。',
  },
];

export const BODIES: BodyInfo[] = BODY_DATA.map((body) => {
  let sourceUrl = 'https://ssd.jpl.nasa.gov/planets/phys_par.html';
  if (body.id === 'Sun') sourceUrl = 'https://science.nasa.gov/sun/facts/';
  if (body.id === 'Moon') sourceUrl = 'https://science.nasa.gov/moon/facts/';
  return { ...body, sourceUrl };
});

export const BODY_BY_ID = Object.fromEntries(
  BODIES.map((body) => [body.id, body]),
) as Record<BodyInfo['id'], BodyInfo>;
