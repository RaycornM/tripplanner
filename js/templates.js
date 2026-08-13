/* =========================================================
   行程模板库
   ========================================================= */
(function (global) {
  'use strict';

  const TEMPLATES = [
    {
      id: 'tpl_bj_3d',
      name: '北京经典三日游',
      destination: '北京',
      emoji: '🏯',
      coverColor: 1,
      duration: 3,
      tags: ['历史', '人文', '城市'],
      desc: '故宫、长城、颐和园经典路线，适合初次到访北京。',
      days: [
        {
          transport: [{ type: 'flight', from: '出发地', to: '北京首都机场', departTime: '08:00', arriveTime: '10:30', number: '待定', cost: 1200, note: '提前2小时到机场' }],
          hotel: { name: '王府井附近酒店', address: '北京东城区王府井', checkIn: '14:00', checkOut: '12:00', cost: 600, lat: 39.9143, lng: 116.4104 },
          activities: [
            { name: '天安门广场', category: 'attraction', startTime: '13:00', endTime: '14:00', cost: 0, lat: 39.9055, lng: 116.3976, address: '北京东城区', note: '免费，需身份证' },
            { name: '故宫博物院', category: 'attraction', startTime: '14:00', endTime: '17:30', cost: 60, lat: 39.9163, lng: 116.3972, address: '北京东城区景山前街4号', note: '提前网上预约门票' },
            { name: '王府井小吃街', category: 'food', startTime: '18:00', endTime: '20:00', cost: 100, lat: 39.9143, lng: 116.4104, address: '王府井大街' }
          ]
        },
        {
          hotel: { name: '王府井附近酒店', address: '北京东城区王府井', checkIn: '14:00', checkOut: '12:00', cost: 600, lat: 39.9143, lng: 116.4104 },
          activities: [
            { name: '八达岭长城', category: 'attraction', startTime: '08:00', endTime: '14:00', cost: 40, lat: 40.3587, lng: 116.0205, address: '北京延庆区', note: '建议早出发，避开人流' },
            { name: '鸟巢水立方', category: 'attraction', startTime: '16:00', endTime: '18:00', cost: 50, lat: 39.9929, lng: 116.3964, address: '北京朝阳区国家体育场南路' },
            { name: '全聚德烤鸭', category: 'food', startTime: '18:30', endTime: '20:30', cost: 200, lat: 39.8939, lng: 116.4062, address: '前门大街30号' }
          ]
        },
        {
          activities: [
            { name: '颐和园', category: 'attraction', startTime: '09:00', endTime: '13:00', cost: 30, lat: 39.9999, lng: 116.2755, address: '北京海淀区新建宫门路19号' },
            { name: '圆明园', category: 'attraction', startTime: '13:30', endTime: '16:00', cost: 25, lat: 40.0068, lng: 116.2994, address: '北京海淀区清华西路28号' }
          ],
          transport: [{ type: 'flight', from: '北京首都机场', to: '出发地', departTime: '19:00', arriveTime: '21:30', number: '待定', cost: 1200 }]
        }
      ],
      checklist: [
        { category: '证件', text: '身份证' },
        { category: '证件', text: '学生证/优惠证件' },
        { category: '电子', text: '手机充电器、充电宝' },
        { category: '衣物', text: '舒适运动鞋' },
        { category: '其他', text: '故宫/长城门票提前预约' }
      ]
    },
    {
      id: 'tpl_hz_3d',
      name: '杭州西湖三日休闲',
      destination: '杭州',
      emoji: '🌸',
      coverColor: 2,
      duration: 3,
      tags: ['自然', '休闲', '湖景'],
      desc: '西湖、灵隐、西溪湿地，慢节奏的江南之旅。',
      days: [
        {
          transport: [{ type: 'train', from: '出发地', to: '杭州东站', departTime: '08:00', arriveTime: '10:00', number: 'GXXXX', cost: 200 }],
          hotel: { name: '西湖附近民宿', address: '杭州西湖区', checkIn: '14:00', checkOut: '12:00', cost: 450, lat: 30.2592, lng: 120.1487 },
          activities: [
            { name: '断桥残雪', category: 'attraction', startTime: '14:00', endTime: '15:00', cost: 0, lat: 30.2624, lng: 120.1494, address: '杭州西湖区北山路' },
            { name: '白堤漫步', category: 'attraction', startTime: '15:00', endTime: '16:30', cost: 0, lat: 30.2592, lng: 120.1487 },
            { name: '楼外楼', category: 'food', startTime: '17:30', endTime: '19:30', cost: 300, lat: 30.2547, lng: 120.1401, address: '孤山路30号', note: '西湖醋鱼、东坡肉' }
          ]
        },
        {
          hotel: { name: '西湖附近民宿', address: '杭州西湖区', checkIn: '14:00', checkOut: '12:00', cost: 450, lat: 30.2592, lng: 120.1487 },
          activities: [
            { name: '灵隐寺', category: 'attraction', startTime: '08:30', endTime: '12:00', cost: 75, lat: 30.2407, lng: 120.1011, address: '杭州西湖区灵隐路法云弄1号' },
            { name: '西溪湿地', category: 'attraction', startTime: '14:00', endTime: '17:30', cost: 80, lat: 30.2742, lng: 120.0755, address: '杭州西湖区天目山路518号' },
            { name: '河坊街', category: 'shopping', startTime: '19:00', endTime: '21:00', cost: 150, lat: 30.2462, lng: 120.1647 }
          ]
        },
        {
          activities: [
            { name: '雷峰塔', category: 'attraction', startTime: '09:00', endTime: '11:00', cost: 40, lat: 30.2336, lng: 120.1497, address: '杭州西湖区南山路' },
            { name: '苏堤春晓', category: 'attraction', startTime: '11:00', endTime: '13:00', cost: 0, lat: 30.2387, lng: 120.1372 }
          ],
          transport: [{ type: 'train', from: '杭州东站', to: '出发地', departTime: '16:00', arriveTime: '18:00', number: 'GXXXX', cost: 200 }]
        }
      ],
      checklist: [
        { category: '证件', text: '身份证' },
        { category: '衣物', text: '雨伞（杭州多雨）' },
        { category: '电子', text: '充电宝' },
        { category: '其他', text: '灵隐寺需提前预约' }
      ]
    },
    {
      id: 'tpl_xm_4d',
      name: '厦门鼓浪屿四日游',
      destination: '厦门',
      emoji: '🌊',
      coverColor: 3,
      duration: 4,
      tags: ['海岛', '文艺', '休闲'],
      desc: '鼓浪屿、环岛路、曾厝垵，文艺清新的海滨城市。',
      days: [
        {
          transport: [{ type: 'flight', from: '出发地', to: '厦门高崎机场', departTime: '09:00', arriveTime: '11:30', number: '待定', cost: 800 }],
          hotel: { name: '曾厝垵民宿', address: '厦门思明区曾厝垵', checkIn: '14:00', checkOut: '12:00', cost: 380, lat: 24.4392, lng: 118.1097 },
          activities: [
            { name: '曾厝垵文创村', category: 'shopping', startTime: '14:30', endTime: '17:00', cost: 100, lat: 24.4392, lng: 118.1097 },
            { name: '环岛路骑行', category: 'attraction', startTime: '17:30', endTime: '19:00', cost: 30, lat: 24.4355, lng: 118.1244, note: '租自行车' }
          ]
        },
        {
          hotel: { name: '鼓浪屿客栈', address: '厦门鼓浪屿', checkIn: '14:00', checkOut: '12:00', cost: 500, lat: 24.4487, lng: 118.0669 },
          activities: [
            { name: '鼓浪屿日光岩', category: 'attraction', startTime: '10:00', endTime: '12:00', cost: 50, lat: 24.4509, lng: 118.0663, address: '鼓浪屿晃岩路62号' },
            { name: '菽庄花园', category: 'attraction', startTime: '14:00', endTime: '16:00', cost: 30, lat: 24.4442, lng: 118.0637 },
            { name: '龙头路小吃', category: 'food', startTime: '17:00', endTime: '19:00', cost: 120, lat: 24.4497, lng: 118.0667 }
          ]
        },
        {
          hotel: { name: '曾厝垵民宿', address: '厦门思明区曾厝垵', checkIn: '14:00', checkOut: '12:00', cost: 380, lat: 24.4392, lng: 118.1097 },
          activities: [
            { name: '南普陀寺', category: 'attraction', startTime: '09:00', endTime: '11:00', cost: 0, lat: 24.4514, lng: 118.0917, address: '思明区思明南路515号' },
            { name: '厦门大学', category: 'attraction', startTime: '11:00', endTime: '13:00', cost: 0, lat: 24.4376, lng: 118.0900, note: '需提前预约入校' },
            { name: '沙坡尾', category: 'shopping', startTime: '15:00', endTime: '18:00', cost: 80, lat: 24.4367, lng: 118.0833 }
          ]
        },
        {
          activities: [
            { name: '中山路步行街', category: 'shopping', startTime: '10:00', endTime: '13:00', cost: 200, lat: 24.4633, lng: 118.0877 }
          ],
          transport: [{ type: 'flight', from: '厦门高崎机场', to: '出发地', departTime: '17:00', arriveTime: '19:30', number: '待定', cost: 800 }]
        }
      ],
      checklist: [
        { category: '证件', text: '身份证（鼓浪屿船票实名）' },
        { category: '衣物', text: '防晒衣、泳衣' },
        { category: '电子', text: '充电宝、防水手机袋' },
        { category: '其他', text: '鼓浪屿船票提前在「厦门轮渡」公众号购买' }
      ]
    },
    {
      id: 'tpl_cd_5d',
      name: '成都五日美食之旅',
      destination: '成都',
      emoji: '🐼',
      coverColor: 4,
      duration: 5,
      tags: ['美食', '熊猫', '城市'],
      desc: '熊猫基地、宽窄巷子、川菜美食，吃货天堂。',
      days: [
        {
          transport: [{ type: 'flight', from: '出发地', to: '成都天府机场', departTime: '08:00', arriveTime: '11:00', number: '待定', cost: 1000 }],
          hotel: { name: '春熙路酒店', address: '成都锦江区春熙路', checkIn: '14:00', checkOut: '12:00', cost: 500, lat: 30.6571, lng: 104.0817 },
          activities: [
            { name: '春熙路太古里', category: 'shopping', startTime: '14:30', endTime: '18:00', cost: 200, lat: 30.6535, lng: 104.0817 },
            { name: '小龙坎火锅', category: 'food', startTime: '18:30', endTime: '20:30', cost: 150, lat: 30.6571, lng: 104.0817 }
          ]
        },
        {
          hotel: { name: '春熙路酒店', address: '成都锦江区春熙路', checkIn: '14:00', checkOut: '12:00', cost: 500, lat: 30.6571, lng: 104.0817 },
          activities: [
            { name: '成都大熊猫繁育基地', category: 'attraction', startTime: '08:00', endTime: '13:00', cost: 55, lat: 30.7327, lng: 104.1370, address: '成都成华区熊猫大道1375号', note: '早上去熊猫更活跃' },
            { name: '宽窄巷子', category: 'attraction', startTime: '15:00', endTime: '18:00', cost: 100, lat: 30.6700, lng: 104.0577 },
            { name: '奎星楼街小吃', category: 'food', startTime: '18:30', endTime: '21:00', cost: 120, lat: 30.6714, lng: 104.0533 }
          ]
        },
        {
          hotel: { name: '春熙路酒店', address: '成都锦江区春熙路', checkIn: '14:00', checkOut: '12:00', cost: 500, lat: 30.6571, lng: 104.0817 },
          activities: [
            { name: '都江堰', category: 'attraction', startTime: '09:00', endTime: '14:00', cost: 80, lat: 30.9989, lng: 103.6106, address: '成都都江堰市', note: '高铁约30分钟' },
            { name: '锦里古街', category: 'shopping', startTime: '16:30', endTime: '20:00', cost: 150, lat: 30.6437, lng: 104.0469 }
          ]
        },
        {
          hotel: { name: '春熙路酒店', address: '成都锦江区春熙路', checkIn: '14:00', checkOut: '12:00', cost: 500, lat: 30.6571, lng: 104.0817 },
          activities: [
            { name: '武侯祠', category: 'attraction', startTime: '09:00', endTime: '11:30', cost: 50, lat: 30.6437, lng: 104.0483, address: '成都武侯区武侯祠大街231号' },
            { name: '杜甫草堂', category: 'attraction', startTime: '13:00', endTime: '16:00', cost: 50, lat: 30.6633, lng: 104.0258 },
            { name: '陈麻婆豆腐', category: 'food', startTime: '17:30', endTime: '19:30', cost: 100, lat: 30.6686, lng: 104.0556 }
          ]
        },
        {
          activities: [
            { name: '人民公园喝茶', category: 'other', startTime: '09:00', endTime: '12:00', cost: 50, lat: 30.6589, lng: 104.0553 }
          ],
          transport: [{ type: 'flight', from: '成都天府机场', to: '出发地', departTime: '16:00', arriveTime: '19:00', number: '待定', cost: 1000 }]
        }
      ],
      checklist: [
        { category: '证件', text: '身份证' },
        { category: '衣物', text: '舒适运动鞋' },
        { category: '其他', text: '熊猫基地需提前预约' },
        { category: '其他', text: '备肠胃药（川菜偏辣）' }
      ]
    },
    {
      id: 'tpl_xy_7d',
      name: '云南七日环线',
      destination: '云南',
      emoji: '🏔️',
      coverColor: 5,
      duration: 7,
      tags: ['自然', '环线', '高原'],
      desc: '昆明—大理—丽江—香格里拉，云南经典环线。',
      days: [
        {
          transport: [{ type: 'flight', from: '出发地', to: '昆明长水机场', departTime: '08:00', arriveTime: '11:00', number: '待定', cost: 900 }],
          hotel: { name: '昆明市区酒店', address: '昆明', checkIn: '14:00', checkOut: '12:00', cost: 350, lat: 25.0389, lng: 102.7183 },
          activities: [
            { name: '滇池', category: 'attraction', startTime: '14:00', endTime: '17:00', cost: 0, lat: 24.9650, lng: 102.7070 },
            { name: '金马碧鸡坊', category: 'food', startTime: '18:00', endTime: '20:00', cost: 120, lat: 25.0400, lng: 102.7033 }
          ]
        },
        {
          transport: [{ type: 'train', from: '昆明', to: '大理', departTime: '08:00', arriveTime: '10:30', number: '待定', cost: 145 }],
          hotel: { name: '大理古城客栈', address: '大理古城', checkIn: '14:00', checkOut: '12:00', cost: 300, lat: 25.6928, lng: 100.1587 },
          activities: [
            { name: '大理古城', category: 'attraction', startTime: '11:00', endTime: '14:00', cost: 0, lat: 25.6928, lng: 100.1587 },
            { name: '洱海环游', category: 'attraction', startTime: '15:00', endTime: '19:00', cost: 200, lat: 25.7750, lng: 100.1842, note: '租电动车或包车' }
          ]
        },
        {
          hotel: { name: '大理古城客栈', address: '大理古城', checkIn: '14:00', checkOut: '12:00', cost: 300, lat: 25.6928, lng: 100.1587 },
          activities: [
            { name: '苍山', category: 'attraction', startTime: '09:00', endTime: '13:00', cost: 280, lat: 25.6750, lng: 100.0833, note: '索道票' },
            { name: '喜洲古镇', category: 'attraction', startTime: '14:30', endTime: '17:30', cost: 0, lat: 25.8650, lng: 100.1667 }
          ]
        },
        {
          transport: [{ type: 'train', from: '大理', to: '丽江', departTime: '09:00', arriveTime: '10:30', number: '待定', cost: 80 }],
          hotel: { name: '丽江古城客栈', address: '丽江古城', checkIn: '14:00', checkOut: '12:00', cost: 320, lat: 26.8721, lng: 100.2257 },
          activities: [
            { name: '丽江古城', category: 'attraction', startTime: '11:00', endTime: '14:00', cost: 50, lat: 26.8721, lng: 100.2257, note: '古城维护费' },
            { name: '束河古镇', category: 'attraction', startTime: '15:00', endTime: '18:00', cost: 0, lat: 26.9069, lng: 100.2000 }
          ]
        },
        {
          hotel: { name: '丽江古城客栈', address: '丽江古城', checkIn: '14:00', checkOut: '12:00', cost: 320, lat: 26.8721, lng: 100.2257 },
          activities: [
            { name: '玉龙雪山', category: 'attraction', startTime: '08:00', endTime: '16:00', cost: 400, lat: 27.1000, lng: 100.1700, note: '索道+门票，注意高反' }
          ]
        },
        {
          transport: [{ type: 'car', from: '丽江', to: '香格里拉', departTime: '08:00', arriveTime: '13:00', number: '包车', cost: 300, note: '约4-5小时车程' }],
          hotel: { name: '香格里拉客栈', address: '香格里拉独克宗古城', checkIn: '14:00', checkOut: '12:00', cost: 350, lat: 27.8329, lng: 99.7063 },
          activities: [
            { name: '独克宗古城', category: 'attraction', startTime: '14:30', endTime: '17:00', cost: 0, lat: 27.8329, lng: 99.7063 },
            { name: '松赞林寺', category: 'attraction', startTime: '17:30', endTime: '19:00', cost: 115, lat: 27.8736, lng: 99.6908 }
          ]
        },
        {
          activities: [
            { name: '普达措国家公园', category: 'attraction', startTime: '08:00', endTime: '14:00', cost: 200, lat: 27.8000, lng: 99.9500 }
          ],
          transport: [{ type: 'flight', from: '香格里拉迪庆机场', to: '出发地', departTime: '17:00', arriveTime: '20:00', number: '待定', cost: 1100 }]
        }
      ],
      checklist: [
        { category: '证件', text: '身份证' },
        { category: '衣物', text: '冲锋衣/厚外套（高原早晚冷）' },
        { category: '健康', text: '红景天、氧气瓶（防高反）' },
        { category: '健康', text: '防晒霜、墨镜' },
        { category: '电子', text: '充电宝' },
        { category: '其他', text: '玉龙雪山索道票提前1天预约' }
      ]
    },
    {
      id: 'tpl_blank',
      name: '空白行程',
      destination: '',
      emoji: '🧳',
      coverColor: 0,
      duration: 1,
      tags: ['自定义'],
      desc: '从零开始，自由规划你的行程。',
      days: [],
      checklist: []
    }
  ];

  global.TEMPLATES = TEMPLATES;
})(window);
