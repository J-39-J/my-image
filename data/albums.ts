// 🛡️ 本文件由 XingHuiSama 控制台自动生成，请勿手动修改
export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export const albums: Album[] = [
  {
    "title": "Nikki",
    "cover": "https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-041543-3f7615.jpg",
    "id": "album_1792786549774",
    "photos": [
      {
        "url": "https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-041617-6d05f3.jpg",
        "caption": "漂亮"
      }
    ],
    "date": "2026-10-23",
    "description": "暖暖"
  },
  {
    "title": "林赛99",
    "cover": "https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-041433-0cd64c.gif",
    "id": "album_1792786491657",
    "photos": [
      {
        "url": "https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-041513-4b1f1e.jpg"
      }
    ],
    "date": "2026-10-23"
  },
  {
    "title": "时光相册",
    "cover": "https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-012331-cd505a.jpg",
    "id": "album_1792787000001",
    "photos": [
      { "url": "https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-012331-cd505a.jpg" },
      { "url": "https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-012350-9c2524.jpg" },
      { "url": "https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-013305-14ec46.jpg" },
      { "url": "https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-013335-6258b5.jpg" },
      { "url": "https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-013522-b17807.jpg" },
      { "url": "https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-035915-acc360.jpg" },
      { "url": "https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-040321-a72de2.jpg" },
      { "url": "https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-040339-b7e312.jpg" },
      { "url": "https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-041310-923872.jpg" },
      { "url": "https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-041602-80de3b.jpg" },
      { "url": "https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-041825-55e9e6.jpg" }
    ],
    "date": "2026-10-23",
    "description": "图床里上传的照片"
  }
];
