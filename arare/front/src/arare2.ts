import * as Matter from 'matter-js';
import * as ArareCode from 'arare2-code';

let Bodies = Matter.Bodies;
let Engine = Matter.Engine;
let Runner = Matter.Runner;
let Render = Matter.Render;
let MouseConstraint = Matter.MouseConstraint;
let Mouse = Matter.Mouse;
let World = Matter.World;
let Common = Matter['Common'];

type Code = {
    world: any,
    bodies: [any],
    errors: [{}],
    rules?: any,
    shapeFuncMap?: {[key: string]: (ctx: Arare2, options: {}) => (x: number, y: number, index: number) => any }
}

export class Arare2 {
    protected width:  number;
    protected height: number;

    protected runner: any;
    protected engine: any;
    protected render: any;

    //public canvas: HTMLCanvasElement | null;
    public vars: {};

    public constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        // create an engine
        this.engine = Engine.create();
        /* engineのアクティブ、非アクティブの制御を行う */
        this.runner = Runner.create({});
        var renderOptions = {
            /* Matter.js の変な仕様 canvas に新しい canvas が追加される */
            element: document.getElementById("canvas"),
            engine: this.engine,
            options: {  /* オブジェクトが枠線のみになる */
                width: this.width,
                height: this.height,
                background: 'rgba(0, 0, 0, 0)',
                wireframes: false,
                //showDebug: world.debug || false,
                //showPositions: world.debug || false,
                //showMousePositions: world.debug || false,
                //debugString: "hoge\nこまったなあ",
            },
        }
        this.render = Render.create(renderOptions);
        //this.canvas = this.render.canvas;
    }

    public ready() {
        Runner.run(this.runner, this.engine); / *物理エンジンを動かす * /
        Render.run(this.render); /* 描画開始 */
        this.runner.enabled = false;  / *初期位置を描画したら一度止める * /
    }

    public dispose() {
        if (this.runner) {
          Runner.stop(this.runner);
          this.runner = null;
        }
        if (this.engine) {
          //Matter.World.clear(this.engine.world);
          Engine.clear(this.engine);
          this.engine = null;
        }
        if (this.render) {
            var canvas = this.render;
            Render.stop(this.render);
            if (canvas) {
                canvas.parentElement.removeChild(canvas);
            }
          //render.canvas = null;
          //render.context = null;
          //render.textures = {};
        }
    }

    public load(code: Code) {
        if(code.world) {
            var world = world;
            Render['lookAt'](this.render, {
                min: { x: 0, y: 0 },
                max: {
                    x: world.width || 1000,
                    y: world.height || 1000
                }
            });
            /* マウス */
            if (world.mouse || true) {
                var mouse = Mouse.create(this.render.canvas);
                var mouseConstraint = MouseConstraint.create(this.engine, {
                    mouse: mouse,
                    constraint: {
                        stiffness: world.mouseStiffness || 0.2,
                        render: { /* 剛性 */
                            visible: false
                        }
                    }
                });
                Matter.World.add(this.engine.world, mouseConstraint);
                this.render.mouse = mouse;
        
                // an example of using mouse events on a mouse
                /*
                Matter.Events.on(mouseConstraint, 'mousedown', function(event) {
                    var mousePosition = event.mouse.position;
                    console.log('mousedown at ' + mousePosition.x + ' ' + mousePosition.y);
                    //shakeScene(engine);
                });
        
                // an example of using mouse events on a mouse
                Matter.Events.on(mouseConstraint, 'mouseup', function(event) {
                    var mousePosition = event.mouse.position;
                    console.log('mouseup at ' + mousePosition.x + ' ' + mousePosition.y);
                });
        
                // an example of using mouse events on a mouse
                Matter.Events.on(mouseConstraint, 'startdrag', function(event) {
                    console.log('startdrag', event);
                });
        
                // an example of using mouse events on a mouse
                Matter.Events.on(mouseConstraint, 'enddrag', function(event) {
                    console.log('enddrag', event);
                });
                */
            }
            var engine = this.engine;
            engine.world.gravity.x = world.xGravity || 0;
            engine.world.gravity.y = world.yGravity || 0;
            if(world.yGravity) {
              window.addEventListener('deviceorientation', function(event) {
                var orientation = window.orientation || 0;
                var gravity = engine.world.gravity;
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
        if(code.errors) {
            //this.notify(this, code.errors);
        }
        if(code.bodies) {
            var bodies = [];
            this.vars = {};
            for (var data of code.bodies) {
                if(data.shape && data.position) {
                    var shape = shapeFunc(code, data)(this, data);
                    var body = shape(data.position.x, data.position.y, -1);
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
            Matter.World.add(this.engine.world, bodies);
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
                  source: inputs
                },
                  timeout: 5000,
              }).done(function(data) {
                  this.load(ArareCode);
              }).fail(function(XMLHttpRequest, textStatus, errorThrown) {
                console.log("XMLHttpRequest : " + XMLHttpRequest);
                console.log(errorThrown);
                console.log(textStatus);
              }).always( (data) => {
                console.log(data);
              });
        }
        catch(e) {
            console.log(e); // FIXME
        }
      }

}

/* shapeFunc 物体の形状から物体を生成する関数 */

//(Arare2, {}) -> (number, number, number) -> any

let shapeFuncMap : {[key: string]: (ctx: Arare2, options: {}) => (x: number, y: number, index: number) => any } = {
    "circle": function(ctx: Arare2, options: {}) { 
        return function(x, y, index) {
            var radius = options['radius'] || 25;
            if (options['width']) {
                radius = options['width'] / 2;
            }
            return Bodies.circle(x, y, radius, options);
        }
    },
    "rectangle": function(ctx: Arare2, options: {}) {
        return function(x, y, index) {
            return Bodies.rectangle(x, y, options['width'] || 100, options['height'] || 100, options);
        }
    },
    "unknown": function(ctx: Arare2, options: {}) {
        return function(x, y, index) {
            var radius = options['radius'] || 25;
            if (options['width']) {
                radius = options['width'] / 2;
            }

            return Bodies.circle(x, y, radius, options);
        }
    }
}

let shapeFunc = (code: Code, options: {}) => {
    var shape = options['shape'] || 'unknown';
    if (code.shapeFuncMap && code.shapeFuncMap[shape]) {
        return code.shapeFuncMap[shape];
    } else if (shapeFuncMap[shape]) {
        return shapeFuncMap[shape];
    }
    return shapeFuncMap["unknown"];
}
