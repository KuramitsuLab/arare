
var width = 1000;
var height = 1000;

export var ArareCode = {
  world : {
    'width': 1000,
    'height': 1000,
    'xGravity': 0.01,
    'yGravity': 0.01,
    'mouse': true,
    'ticker': { 'x': 10, 'y': 10 },
  },
  bodies : [
    {
      'value': 0,
    },
    {
      'shape': "circle",
      'concept': ['ボール', '円'],
      'name': 'ボール',
      'width': 50,
      'height': 50,
      'position': {
        'x': 500,
        'y': 500,
      },
      'angle': 0.2 * Math.PI,
      'render': {
        'fillStyle': 'rgba(11,11,11,0.1)',
        'strokeStyle': 'blue',
        'lineWidth': 10
      },
      'velocity': { x: 1, y: 1 },
      'value': "ほげ",
      'isSensor': true,
    },
    {
      'shape': "rectangle",
      'concept': ['X', '壁', '長方形'],
      'isStatic': false,
      'chamfer': true,
      'name': 'X',
      'width': 180,
      'height': 100,
      'slop': 0.001,
      'position': {
        'x': 200,
        'y': 300,
      },
    },
    {
      'shape': "polygon",
      'concept': ['多角形','正方形'],
      'isStatic': false,
      'chamfer': true,
      'sides': 6,
      'name': '多角形',
      'width': 100,
      'height': 100,
      'position': {
        'x': 400,
        'y': 500,
      },

    },
    {
      'shape': "trapezoid",
      'concept': ['台形'],
      'isStatic': false,
      'chamfer': true,
      'name': 'X',
      'slop': 0.45,
      'width': 100,
      'height': 150,
      'position': {
        'x': 100,
        'y': 700,
      },
    },
    {
      'value': 2,
      'name': 'Y',
    },
    {
      'name': 'SCORE',
      'value': 1,
      'position': { 'x': 100, 'y': 100 },
    },
  ],
  errors : [
  ]
}