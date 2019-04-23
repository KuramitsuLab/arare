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

// import {Code} from './arare2-code';
export type Code = {
  world: any,
  bodies: any[],
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
    this.runner.enabled = false;  / *初期位置を描画したら一度止める * /;
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

  public load(code: Code) {
    this.dispose();
    if (code.world) {
      const world = code.world;
      Render['lookAt'](this.render, {
        min: { x: 0, y: 0 },
        max: {
          x: world.width || 1000,
          y: world.height || 1000,
        },
      });
      /* マウス */
      if (world.mouse || true) {
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
        // this.render.mouse = mouse;

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
      const engine = this.engine;
      engine.world.gravity.x = world.xGravity || 0;
      engine.world.gravity.y = world.yGravity || 0;
      if (world.yGravity) {
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
    } /* world */
    if (code.errors) {
      // this.notify(this, code.errors);
    }
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
      /*
      if(vars.length > 0) {
        this.render.options.variables = vars;
      }
      if (code.rules) {
        code.rules(Matter, this);
      }
      */
      this.ready();
    }
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
  circle (ctx: Arare2, options: {}) {
    return function (x, y, index) {
      let radius = options['radius'] || 25;
      if (options['width']) {
        radius = options['width'] / 2;
      }
      return Bodies.circle(x, y, radius, options);
    };
  },
  rectangle (ctx: Arare2, options: {}) {
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
  unknown (ctx: Arare2, options: {}) {
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
