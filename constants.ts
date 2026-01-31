
import { Constellation } from './types';

export const CONSTELLATIONS: Constellation[] = [
  {
    id: 'libra',
    name: 'Libra',
    koreanName: '천칭자리',
    description: '정의의 여신 아스트라이아가 들고 있는 공평한 저울입니다.',
    myth: '인간들의 선과 악을 재어 운명을 결정하는 데 쓰였던 신성한 저울입니다.',
    funFact: '황도 12궁 중 생물이 아닌 사물을 형상화한 유일한 별자리입니다.',
    difficulty: 'Medium',
    stars: [
      { id: 80, x: 50, y: 30 }, { id: 81, x: 30, y: 55 }, { id: 82, x: 70, y: 55 }, { id: 83, x: 50, y: 80 }
    ],
    connections: [[80, 81], [80, 82], [81, 83], [82, 83], [81, 82]]
  },
  {
    id: 'cancer',
    name: 'Cancer',
    koreanName: '게자리',
    description: '어두운 별들로 이루어져 있지만, 신화적으로 중요한 게의 형상입니다.',
    myth: '헤라클레스의 발가락을 물었던 용감한 게가 죽어서 하늘의 별자리가 되었다고 합니다.',
    funFact: '별자리 중심에 프레세페(Praesepe)라는 아름다운 성단이 숨어 있습니다.',
    difficulty: 'Medium',
    stars: [
      { id: 20, x: 50, y: 20 }, { id: 21, x: 50, y: 45 }, { id: 22, x: 30, y: 70 }, { id: 23, x: 70, y: 70 }
    ],
    connections: [[20, 21], [21, 22], [21, 23]]
  },
  {
    id: 'aries',
    name: 'Aries',
    koreanName: '양자리',
    description: '황도 12궁의 첫 번째 별자리로, 하늘의 양을 상징합니다.',
    myth: '황금 가죽을 가진 양이 프릭소스와 헬레 남매를 구하기 위해 하늘을 달린 이야기입니다.',
    funFact: '가장 밝은 별 하말(Hamal)은 아랍어로 "양"을 뜻합니다.',
    difficulty: 'Easy',
    stars: [
      { id: 10, x: 70, y: 30 }, { id: 11, x: 50, y: 40 }, { id: 12, x: 30, y: 60 }, { id: 13, x: 25, y: 70 }
    ],
    connections: [[10, 11], [11, 12], [12, 13]]
  },
  {
    id: 'cassiopeia',
    name: 'Cassiopeia',
    koreanName: '카시오페아',
    description: '북극성 근처에서 볼 수 있는 뚜렷한 W자 모양의 별자리입니다.',
    myth: '허영심 많은 카시오페아 왕비가 의자에 앉아 거꾸로 매달린 채 벌을 받고 있는 모습입니다.',
    funFact: '북두칠성과 마주 보고 있어 북극성을 찾는 또 다른 중요한 이정표가 됩니다.',
    difficulty: 'Easy',
    stars: [
      { id: 30, x: 20, y: 40 }, { id: 31, x: 35, y: 60 }, { id: 32, x: 50, y: 45 }, { id: 33, x: 65, y: 65 }, { id: 34, x: 80, y: 40 }
    ],
    connections: [[30, 31], [31, 32], [32, 33], [33, 34]]
  },
  {
    id: 'orion',
    name: 'Orion',
    koreanName: '오리온자리',
    description: '겨울 밤하늘의 왕자라 불리는 위풍당당한 사냥꾼의 모습입니다.',
    myth: '자신이 세상에서 가장 강하다고 뽐내던 거인 오리온이 별자리가 된 모습입니다.',
    funFact: '중심에 나란히 있는 세 별은 "삼태성"이라 불리며 오리온의 허리띠를 상징합니다.',
    difficulty: 'Hard',
    stars: [
      { id: 200, x: 35, y: 20 }, { id: 201, x: 65, y: 20 }, // Shoulders
      { id: 202, x: 45, y: 50 }, { id: 203, x: 50, y: 50 }, { id: 204, x: 55, y: 50 }, // Belt
      { id: 205, x: 35, y: 80 }, { id: 206, x: 65, y: 80 }  // Feet
    ],
    connections: [[200, 202], [201, 204], [202, 203], [203, 204], [202, 205], [204, 206]]
  },
  {
    id: 'big-dipper',
    name: 'The Big Dipper',
    koreanName: '북두칠성',
    description: '큰곰자리의 꼬리와 엉덩이 부분을 이루는 일곱 개의 밝은 별입니다.',
    myth: '일곱 형제가 효심을 기리기 위해 하늘의 별이 되었다는 한국의 정겨운 전설이 담겨 있습니다.',
    funFact: '북두칠성의 끝 두 별을 이으면 북극성을 찾을 수 있어 항해사들에게 길잡이가 되었습니다.',
    difficulty: 'Easy',
    stars: [
      { id: 0, x: 20, y: 30 }, { id: 1, x: 35, y: 45 }, { id: 2, x: 50, y: 50 },
      { id: 3, x: 60, y: 40 }, { id: 4, x: 80, y: 35 }, { id: 5, x: 85, y: 55 },
      { id: 6, x: 65, y: 60 }
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]]
  },
  {
    id: 'pisces',
    name: 'Pisces',
    koreanName: '물고기자리',
    description: '끈으로 묶인 채 서로 다른 방향으로 헤엄치는 두 마리 물고기입니다.',
    myth: '미의 여신 아프로디테와 아들 에로스가 괴물을 피해 물고기로 변신해 서로를 놓치지 않으려 끈으로 묶은 모습입니다.',
    funFact: '현재 춘분점이 이 별자리에 위치하고 있어 천문학적으로 매우 중요한 의미를 가집니다.',
    difficulty: 'Hard',
    stars: [
      { id: 120, x: 20, y: 20 }, { id: 121, x: 35, y: 35 }, { id: 122, x: 50, y: 55 }, // Top fish & string
      { id: 123, x: 70, y: 70 }, { id: 124, x: 85, y: 75 }, // Bottom string
      { id: 125, x: 75, y: 90 }, { id: 126, x: 90, y: 90 }  // Bottom fish
    ],
    connections: [[120, 121], [121, 122], [122, 123], [123, 124], [124, 125], [125, 126], [126, 124]]
  },
  {
    id: 'gemini',
    name: 'Gemini',
    koreanName: '쌍둥이자리',
    description: '두 형제 카스토르와 폴룩스가 나란히 서 있는 형상입니다.',
    myth: '죽음도 갈라놓을 수 없었던 형제애를 기리기 위해 제우스가 하늘에 올린 별자리입니다.',
    funFact: '머리에 해당하는 두 별 중 폴룩스가 카스토르보다 조금 더 밝습니다.',
    difficulty: 'Hard',
    stars: [
      { id: 40, x: 30, y: 20 }, { id: 41, x: 70, y: 20 }, // Heads
      { id: 42, x: 30, y: 45 }, { id: 43, x: 70, y: 45 }, // Torsos
      { id: 44, x: 25, y: 75 }, { id: 45, x: 35, y: 75 }, // Left legs
      { id: 46, x: 65, y: 75 }, { id: 47, x: 75, y: 75 }  // Right legs
    ],
    connections: [[40, 42], [42, 44], [42, 45], [41, 43], [43, 46], [43, 47], [40, 41]]
  },
  {
    id: 'taurus',
    name: 'Taurus',
    koreanName: '황소자리',
    description: 'V자 모양의 얼굴과 길게 뻗은 두 뿔을 가진 황소의 모습입니다.',
    myth: '제우스가 에우로파를 유혹하기 위해 변신했던 눈부신 흰 소의 모습이라고 합니다.',
    funFact: '황소의 눈에 해당하는 알데바란은 붉은색으로 빛나 화난 소의 눈처럼 보입니다.',
    difficulty: 'Medium',
    stars: [
      { id: 60, x: 50, y: 55 }, { id: 61, x: 40, y: 45 }, { id: 62, x: 45, y: 65 }, { id: 63, x: 55, y: 65 }, { id: 64, x: 60, y: 45 }, // Face V
      { id: 65, x: 80, y: 20 }, { id: 66, x: 20, y: 25 }  // Horns
    ],
    connections: [[61, 60], [60, 64], [61, 62], [62, 63], [63, 64], [64, 65], [61, 66]]
  },
  {
    id: 'capricorn',
    name: 'Capricorn',
    koreanName: '염소자리',
    description: '상반신은 염소, 하반신은 물고기 모양을 한 기묘하고 신비로운 바다 염소입니다.',
    myth: '괴물 티폰을 피해 도망치던 판(Pan) 신이 급하게 변신하다가 만들어진 모습입니다.',
    funFact: '기원전에는 동지점이 이 별자리에 있어서 "겨울의 관문"이라 불렸습니다.',
    difficulty: 'Hard',
    stars: [
      { id: 100, x: 20, y: 30 }, { id: 101, x: 40, y: 35 }, { id: 102, x: 80, y: 40 }, // Top edge
      { id: 103, x: 75, y: 65 }, { id: 104, x: 50, y: 80 }, { id: 105, x: 35, y: 60 }  // Bottom edge
    ],
    connections: [[100, 101], [101, 102], [102, 103], [103, 104], [104, 105], [105, 100], [101, 105]]
  },
  {
    id: 'virgo',
    name: 'Virgo',
    koreanName: '처녀자리',
    description: '한 손에는 보리 이삭을 들고 있는 대지의 여신 데메테르의 딸 아스트라이아입니다.',
    myth: '아득한 옛날 인간들이 타락했을 때 끝까지 지상을 지켰던 정의의 여신입니다.',
    funFact: '가장 밝은 별 스피카(Spica)는 보리 이삭이라는 뜻으로 청백색으로 아름답게 빛납니다.',
    difficulty: 'Hard',
    stars: [
      { id: 130, x: 50, y: 20 }, { id: 131, x: 45, y: 40 }, { id: 132, x: 30, y: 50 }, // Head/Arm
      { id: 133, x: 55, y: 55 }, { id: 134, x: 70, y: 50 }, // Body
      { id: 135, x: 60, y: 80 }, { id: 136, x: 40, y: 75 }  // Legs
    ],
    connections: [[130, 131], [131, 132], [131, 133], [133, 134], [133, 135], [133, 136]]
  },
  {
    id: 'sagittarius',
    name: 'Sagittarius',
    koreanName: '궁수자리',
    description: '활을 당기고 있는 반인반마 켄타우로스의 모습으로, "주전자" 모양으로도 유명합니다.',
    myth: '지혜로운 키론이 전갈로부터 사람들을 지키기 위해 활을 겨누고 있는 모습입니다.',
    funFact: '은하수의 가장 밝은 부분이 이 별자리 근처에 있어 우주의 중심 방향을 알려줍니다.',
    difficulty: 'Hard',
    stars: [
      { id: 90, x: 40, y: 40 }, { id: 91, x: 60, y: 40 }, { id: 92, x: 70, y: 60 }, { id: 93, x: 30, y: 60 }, // Body/Pot
      { id: 94, x: 50, y: 25 }, // Top
      { id: 95, x: 85, y: 50 }, // Handle
      { id: 96, x: 15, y: 55 }  // Spout
    ],
    connections: [[90, 91], [91, 92], [92, 93], [93, 90], [90, 94], [91, 94], [91, 95], [92, 95], [93, 96], [90, 96]]
  },
  {
    id: 'scorpio',
    name: 'Scorpio',
    koreanName: '전갈자리',
    description: 'S자 모양으로 길게 늘어진 꼬리와 치명적인 독침을 가진 전갈입니다.',
    myth: '사냥꾼 오리온을 한 방에 쓰러뜨렸던 전갈이 그 공로를 인정받아 별자리가 되었습니다.',
    funFact: '심장에 위치한 안타레스(Antares)는 화성과 붉은색 경쟁을 한다고 해서 붙여진 이름입니다.',
    difficulty: 'Hard',
    stars: [
      { id: 70, x: 80, y: 30 }, { id: 71, x: 70, y: 40 }, { id: 72, x: 65, y: 55 }, // Head
      { id: 73, x: 55, y: 65 }, { id: 74, x: 45, y: 80 }, { id: 75, x: 30, y: 85 }, // Tail curve
      { id: 76, x: 20, y: 75 }, { id: 77, x: 25, y: 60 }  // Stinger
    ],
    connections: [[70, 71], [71, 72], [72, 73], [73, 74], [74, 75], [75, 76], [76, 77]]
  },
  {
    id: 'leo',
    name: 'Leo',
    koreanName: '사자자리',
    description: '거꾸로 된 물음표 모양의 머리와 직사각형 몸통이 특징인 사자 별자리입니다.',
    myth: '헤라클레스가 물리친 네메아의 거대한 사자가 하늘의 별이 되었습니다.',
    funFact: '가장 밝은 별 레굴루스(Regulus)는 "작은 왕"이라는 뜻을 가지고 있습니다.',
    difficulty: 'Medium',
    stars: [
      { id: 50, x: 80, y: 60 }, { id: 51, x: 85, y: 40 }, { id: 52, x: 70, y: 20 }, { id: 53, x: 55, y: 25 }, // Head "?"
      { id: 54, x: 55, y: 45 }, { id: 55, x: 60, y: 60 }, // Chest
      { id: 56, x: 20, y: 60 }, { id: 57, x: 35, y: 40 }  // Tail
    ],
    connections: [[50, 51], [51, 52], [52, 53], [53, 54], [54, 55], [55, 50], [54, 57], [57, 56], [56, 55]]
  },
  {
    id: 'aquarius',
    name: 'Aquarius',
    koreanName: '물병자리',
    description: '물병에서 끊임없이 신비로운 물을 쏟아붓고 있는 소년의 형상입니다.',
    myth: '신들에게 술을 따르는 아름다운 소년 가니메데가 들고 있는 물병입니다.',
    funFact: '이 별자리 근처에는 고래자리, 물고기자리 등 물과 관련된 별자리들이 모여 있습니다.',
    difficulty: 'Hard',
    stars: [
      { id: 110, x: 40, y: 30 }, { id: 111, x: 55, y: 35 }, { id: 112, x: 70, y: 30 }, // Arm/Shoulder
      { id: 113, x: 50, y: 55 }, { id: 114, x: 45, y: 75 }, { id: 115, x: 30, y: 85 }, // Water stream 1
      { id: 116, x: 65, y: 70 }, { id: 117, x: 80, y: 80 }  // Water stream 2
    ],
    connections: [[110, 111], [111, 112], [111, 113], [113, 114], [114, 115], [113, 116], [116, 117]]
  }
];
