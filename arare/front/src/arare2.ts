import * as Matter from 'matter-js';
import * as $ from 'jquery';
const Bodies = Matter.Bodies;
const Engine = Matter.Engine;
const Runner = Matter.Runner;
const Render = Matter.Render;
const Constraint = Matter.Constraint;
const MouseConstraint = Matter.MouseConstraint;
const Mouse = Matter.Mouse;
const World = Matter.World;
const Common = Matter['Common'];

export type Code = {
  world: any,
  bodies: any[],
  main: (Arare2) => void;
  errors?: {}[],
  rules?: any,
  shapeFuncMap?: { [key: string]: (ctx: Arare2, options: {}) => (x: number, y: number, index: number) => any },
};

// (Arare2, {}) -> (number, number, number) -> any

export class Arare2 {
  protected width: number;
  protected height: number;
  protected runner: Matter.Runner;
  protected engine: Matter.Engine;
  protected render: Matter.Render;
  protected canvas: HTMLCanvasElement;

  protected debug: boolean;

  public vars: {};

  private DefaultRenderOptions: Matter.IRenderDefinition;

  public constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    // create an engine
    this.engine = Engine.create();
    /* engineのアクティブ、非アクティブの制御を行う */
    this.runner = Runner.create({});
    const renderOptions = {
      /* Matter.js の変な仕様 canvas に 描画領域が追加される */
      element: document.getElementById('canvas'),
      engine: this.engine,
      options: {
        /* オブジェクトが枠線のみになる */
        width: this.width,
        height: this.height,
        background: 'rgba(0, 0, 0, 0)',
        wireframes: false,
        // showDebug: world.debug || false,
        // showPositions: world.debug || false,
        // showMousePositions: world.debug || false,
        // debugString: "hoge\nこまったなあ",
      },
    };
    this.DefaultRenderOptions = renderOptions;
    this.render = Render.create(renderOptions);
    this.canvas = this.render.canvas;
  }

  public set_window_size(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public getWidth = (): number => { return this.width; };

  public getHeight = (): number => { return this.height; };

  public getCanvas = (): HTMLCanvasElement => { return this.canvas; };

  public getRender = (): Matter.Render => { return this.render; };

  public getDebug = (): boolean => { return this.debug; };

  public setDebug = (debug: boolean) => { this.debug = debug; };

  public ready() {
    Runner.run(this.runner, this.engine); / *物理エンジンを動かす * /;
    Render.run(this.render); /* 描画開始 */
    this.runner.enabled = false; / *初期位置を描画したら一度止める * /;
  }

  public start() {
    // console.log("start");
    this.runner.enabled = true;
  }

  public pause() {
    // console.log("pause");
    this.runner.enabled = false;
  }

  public dispose() {
    // create an engine
    World.clear(this.engine.world, false);
    Engine.clear(this.engine);
    /* engineのアクティブ、非アクティブの制御を行う */
    Runner.stop(this.runner);
    Render.stop(this.render);
    this.render.canvas.remove();
    this.render.canvas = null;
    this.render.context = null;
    this.render.textures = {};

    const renderOptions = {
      /* Matter.js の変な仕様 canvas に新しい canvas が追加される */
      element: document.getElementById('canvas'),
      engine: this.engine,
      options: {
        /* オブジェクトが枠線のみになる */
        width: this.width,
        height: this.height,
        background: 'rgba(0, 0, 0, 0)',
        wireframes: false,
        // showDebug: world.debug || false,
        // showPositions: world.debug || false,
        // showMousePositions: world.debug || false,
        // debugString: "hoge\nこまったなあ",
      },
    };
    this.DefaultRenderOptions = renderOptions;
    this.render = Render.create(renderOptions);
    this.canvas = this.render.canvas;
  }

  private loadWorld(world: any) {
    /* 描画サイズを自動拡大/縮小を設定する */
    Render['lookAt'](this.render, {
      min: { x: 0, y: 0 },
      max: {
        x: world.width || 1000,
        y: world.height || 1000,
      },
    });
    /* 重力を設定する */
    const engine = this.engine;
    if (world.gravity) {
      engine.world.gravity = world.gravity;
      // ジャイロスコープ
      // デバイスの傾きで重力の向きを調整する
      // https://github.com/liabru/matter-js/blob/master/examples/gyro.js
      window.addEventListener('deviceorientation', (event) => {
        const orientation = window.orientation || 0;
        const gravity = engine.world.gravity;
        if (orientation === 0) {
          gravity.x = Common.clamp(event.gamma, -90, 90) / 90;
          gravity.y = Common.clamp(event.beta, -90, 90) / 90;
        } else if (orientation === 180) {
          gravity.x = Common.clamp(event.gamma, -90, 90) / 90;
          gravity.y = Common.clamp(-event.beta, -90, 90) / 90;
        } else if (orientation === 90) {
          gravity.x = Common.clamp(event.beta, -90, 90) / 90;
          gravity.y = Common.clamp(-event.gamma, -90, 90) / 90;
        } else if (orientation === -90) {
          gravity.x = Common.clamp(-event.beta, -90, 90) / 90;
          gravity.y = Common.clamp(event.gamma, -90, 90) / 90;
        }
      });
    }
    /* マウス */
    if (world.mouse) {
      const mouse = Mouse.create(this.render.canvas);
      const constraintOptions = {
        pointA: { x: 0, y: 0 },
        pointB: { x: 0, y: 0 },
        stiffness: world.mouseStiffness || 0.2,  /* 剛性 */
      };
      constraintOptions['render'] = {
        visible: world.mouseVisible || false,
      };
      const mouseConstraint = MouseConstraint.create(this.engine, {
        mouse,
        constraint: Constraint.create(constraintOptions),
      });
      World.add(this.engine.world, mouseConstraint);
      this.render['mouse'] = mouse;
      // an example of using mouse events on a mouse
      /*
      Events.on(mouseConstraint, 'mousedown', function(event) {
        var mousePosition = event.mouse.position;
        console.log('mousedown at ' + mousePosition.x + ' ' + mousePosition.y);
        //shakeScene(engine);
      });

      // an example of using mouse events on a mouse
      Events.on(mouseConstraint, 'mouseup', function(event) {
        var mousePosition = event.mouse.position;
        console.log('mouseup at ' + mousePosition.x + ' ' + mousePosition.y);
      });

      // an example of using mouse events on a mouse
      Events.on(mouseConstraint, 'startdrag', function(event) {
        console.log('startdrag', event);
      });

      // an example of using mouse events on a mouse
      Events.on(mouseConstraint, 'enddrag', function(event) {
        console.log('enddrag', event);
      });
      */
    }

  }

  public load(code: Code) {
    this.dispose();
    if (code.world) {
      // 世界の設定を行う
      this.loadWorld(code.world);
    }
    if (code.errors) {
      // TODO
      // editor にエラー情報をフィードバックする
    }
    // 物体の情報をアップデートする
    if (code.bodies) {
      const bodies = [];
      this.vars = {};
      for (const data of code.bodies) {
        if (data.shape && data.position) {
          const shape = shapeFunc(code, data)(this, data);
          const body = shape(data.position.x, data.position.y, -1);
          if (data.name) {
            this.vars[data.name] = body;
          }
          if (body.id) {
            bodies.push(body);
          }
        }
        /*  else {
          if(data.x && data.y) {
            data.deref = data.deref || defaultDeref;
            vars.push(data);
          }
        }*/
      }
      World.add(this.engine.world, bodies);
    }
    this.ready();
  }

  public compile(inputs: string) {
    try {
      $.ajax({
        url: '/compile',
        type: 'POST',
        data: {
          source: inputs,
        },
        timeout: 5000,
      }).done((data) => {
        data;
      }).fail((XMLHttpRequest, textStatus, errorThrown) => {
        console.log(`XMLHttpRequest : ${XMLHttpRequest}`);
        console.log(errorThrown);
        console.log(textStatus);
      }).always((data) => {
        this.load(window['ArareCode']);
        console.log(data);
      });
    } catch (e) {
      console.log(e); // FIXME
    }
  }
}

/* shapeFunc 物体の形状から物体を生成する関数 */

// (Arare2, {}) -> (number, number, number) -> any

const shapeFuncMap: { [key: string]: (ctx: Arare2, options: {}) => (x: number, y: number, index: number) => Matter.Body } = {
  circle(ctx: Arare2, options: {}) {
    return function (x, y, index) {
      let radius = options['radius'] || 25;
      if (options['width']) {
        radius = options['width'] / 2;
      }
      return Bodies.circle(x, y, radius, options);
    };
  },
  rectangle(ctx: Arare2, options: {}) {
    return function (x, y, index) {
      return Bodies.rectangle(x, y, options['width'] || 100, options['height'] || 100, options);
    };
  },
  polygon(ctx: Arare2, options: {}) {
    return function (x, y, index) {
      let radius = options['radius'] || 25;
      if (options['width']) {
        radius = options['width'] / 2;
      }
      return Matter.Bodies.polygon(x, y, options['sides'] || 5, radius, options);
    };
  },
  trapezoid(ctx: Arare2, options: {}) {
    return function (x, y, index) {
      return Matter.Bodies.trapezoid(x, y, options['width'] || 100, options['height'] || 100, options['slope'] || 0.5, options);
    };
  },
  unknown(ctx: Arare2, options: {}) {
    return function (x, y, index) {
      let radius = options['radius'] || 25;
      if (options['width']) {
        radius = options['width'] / 2;
      }
      return Bodies.circle(x, y, radius, options);
    };
  },
};

const shapeFunc = (code: Code, options: {}) => {
  const shape = options['shape'] || 'unknown';
  if (code.shapeFuncMap && code.shapeFuncMap[shape]) {
    return code.shapeFuncMap[shape];
  }
  if (shapeFuncMap[shape]) {
    return shapeFuncMap[shape];
  }
  return shapeFuncMap['unknown'];
};

const _getTexture = function (render, imagePath) {
  let image = render.textures[imagePath];

  if (image) {
    return image;
  }

  image = render.textures[imagePath] = new Image();
  image.src = imagePath;

  return image;
};

Render['bodies'] = function (render, bodies, context) {
  const c = context;
  const engine = render.engine;
  const options = render.options;
  const showInternalEdges = options.showInternalEdges || !options.wireframes;

  let body;
  let part;
  let i;
  let k;

  for (i = 0; i < bodies.length; i += 1) {
    body = bodies[i];

    if (!body.render.visible) {
      continue;
    }

    // handle compound parts
    for (k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k += 1) {
      part = body.parts[k];

      if (!part.render.visible) {
        continue;
      }

      if (options.showSleeping && body.isSleeping) {
        c.globalAlpha = 0.5 * part.render.opacity;
      } else if (part.render.opacity !== 1) {
        c.globalAlpha = part.render.opacity;
      }

      if (part.render.sprite && part.render.sprite.texture && !options.wireframes) {
        // part sprite
        const sprite = part.render.sprite;
        const texture = _getTexture(render, sprite.texture);

        c.translate(part.position.x, part.position.y);
        c.rotate(part.angle);

        c.drawImage(
          texture,
          texture.width * -sprite.xOffset * sprite.xScale,
          texture.height * -sprite.yOffset * sprite.yScale,
          texture.width * sprite.xScale,
          texture.height * sprite.yScale,
        );

        // revert translation, hopefully faster than save / restore
        c.rotate(-part.angle);
        c.translate(-part.position.x, -part.position.y);
      } else {
        // part polygon
        if (part.circleRadius) {
          c.beginPath();
          c.arc(part.position.x, part.position.y, part.circleRadius, 0, 2 * Math.PI);
        } else {
          c.beginPath();
          c.moveTo(part.vertices[0].x, part.vertices[0].y);

          for (let j = 1; j < part.vertices.length; j += 1) {
            if (!part.vertices[j - 1].isInternal || showInternalEdges) {
              c.lineTo(part.vertices[j].x, part.vertices[j].y);
            } else {
              c.moveTo(part.vertices[j].x, part.vertices[j].y);
            }

            if (part.vertices[j].isInternal && !showInternalEdges) {
              c.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
            }
          }

          c.lineTo(part.vertices[0].x, part.vertices[0].y);
          c.closePath();
        }

        if (!options.wireframes) {
          c.fillStyle = part.render.fillStyle;

          if (part.render.lineWidth) {
            c.lineWidth = part.render.lineWidth;
            c.strokeStyle = part.render.strokeStyle;
            c.stroke();
          }

          c.fill();
        } else {
          c.lineWidth = 1;
          c.strokeStyle = '#bbb';
          c.stroke();
        }
      }

      c.globalAlpha = 1;

      if (part.value) {
        c.font = part.render.font || '32px Arial';
        c.fillStyle = part.render.fontStyle || 'white';
        c.textAlign = 'center';
        c.fillText(`${part.value}`, part.position.x, part.position.y + 10);
      }
    }
  }
};
