import * as Matter from 'matter-js';
import * as $ from 'jquery';

type World = {
    width?: number,
    height?: number,
    background?: string,
    debug?: boolean,
    autoPlay?: boolean,
    mouse?: boolean,
    gravityX?: number,
    gravityY?: number,
    mouseStiffness?: number,
    mouseVisible?: boolean

};

export let ArareCode = {
    world: {
        width: 1000,
        height: 1000,
        background: "white",
        debug: true,
        autoPlay: true,
    },
    bodies: [
    {
        type: "circle",
        name: "A",
        x: 100,
        y: 100,
        radius: 50,
        text: 12,
    },
    {
        type: "pendulum",
        name: "B",
        x: 400,
        y: 400,
        radius: 50,
        isStatic: true,
        angularSpeed: 1.0,
        //texture: "/static/image/logo.png"
    },
    {
        type: "rectangle",
        name: "C",
        x: 0,
        y: 300,
        width: 300,
        height: 20,
        isStatic: true,
        fillStyle: 'green',
    },
    {
        type: "rectangle",
        name: "C",
        x: 0,
        y: 980,
        width: 1000,
        height: 20,
        isStatic: true,
        fillStyle: 'black',
    },
    ],
};

type Context = {
    runner?: any,
    engine?: any,
    render?: any,
    vars?: any,
    newbodyFunc?: {[key: string]: any} 
}

export class Arare{

    public width: number;
    public height: number;
    public canvas: HTMLCanvasElement | null;
    public context: Context;
    public debug: boolean

    /* 物体属性 */
    static ATTRLIST = [
        "angle",//角度（ラジアン）
        "angularSpeed",//角速度
        "angularVelocity",//角速度
        "area",//面積
        "axes",//衝突検出のために使用される一意の軸ベクトル
        "bounds",//境界
        "density",//密度
        "force",//フォース（ベクトル）
        "friction",//摩擦
        "frictionAir",//空気抵抗
        "inertia",//慣性
        "inverseInertia",//慣性逆モーメント
        "inverseMass",//逆質量
        "isSleeping",//スリープ中か
        "isStatic",//静的か
        "label",//剛体のラベル
        "mass",//質量
        "motion",//運動量
        "position",//位置 { x: 0, y: 0 }
        "restitution",//弾力性
        "sleepThreshold",//スリープのしきい値
        "speed",//速度（スカラー）
        "timeScale",//タイムスケール
        "torque",//回転力
        //"type",//オブジェクトの型
        "velocity",//速度（ベクトル）
        "vertices",//剛体の頂点
    ];

    constructor(width: number, height: number){
        this.width = width;
        this.height = height;
        this.canvas = null;
        this.context = {
            runner: null,
            engine: null,
            render: null,
            vars: null,
            newbodyFunc: {} 
        }
        this.debug = false
    }

    public static copyAttr(src, dst, fields) {
        for (var f of fields) {
            if (src[f]) {
                dst[f] = src[f];
            }
        }
    }
    
    public static copyRender(src, dst, fields) {
        for (var f of fields) {
            if (src[f]) {
                dst.render = dst.render || {};
                dst.render[f] = src[f];
            }
        }
    }
    
    public static copySprite(src, dst, fields) {
        for (var f of fields) {
            if (src[f]) {
                dst.render = dst.render || {};
                dst.render.sprite = dst.render.sprite || {};
                dst.render.sprite[f] = src[f];
            }
        }
    }

    public static bodyData(vars, data) {
        var o = {};
        if (data.image) {
            data.texture = data.image;
        }
        if (data.parent && vars[data.parent]) {
            Arare.copyAttr(vars[data.parent], o, Arare.ATTRLIST);
        }
        Arare.copyAttr(data, o, Arare.ATTRLIST);
        Arare.copyRender(data, o, ["fillStyle", "strokeStyle", "lineStyle", "opacity", "text", "font", "textStyle"]);
        Arare.copySprite(data, o, ["texture", "strokeStyle", "xScale", "yScale"]);
        return o;
    }

    /* 物体を作る */
    static newbodyFunc: {[key: string]: any} = {
        "circle": (vars, data) => {
            var options = Arare.bodyData(vars, data);
            return (x: number, y: number) => {
                return Matter.Bodies.circle(x, y, data.radius, options);
            }
        },
        "rectangle": (vars, data) => {
            var options = Arare.bodyData(vars, data);
            return (x: number, y: number) => {
                return Matter.Bodies.rectangle(x, y, data.width, data.height, options);
            }
        },
        "pendulum": (vars, data) => {
            var options = Arare.bodyData(vars, data);
            return (x, y) => {
                return Matter.Composites['newtonsCradle'](x, y, options['columns'] || 1, options['radius'] || 80, options['length'] || 240);
            }
        },
        "unknown": (_, data) => {
            var options = {
            }
            return (x: number, y: number) => {
                return Matter.Bodies.circle(x, y, data.radius, options);
            }
        }
    };

    public static newbody(ctx: Context, data) {
        var vars = ctx.vars;
        var newbodyFunc = Arare.newbodyFunc["unknown"](vars, data);
        var type = data.type || "unknown";
        if (ctx.newbodyFunc[type]) {
            newbodyFunc = ctx.newbodyFunc[type](vars, data)
        }
        else if (Arare.newbodyFunc[type]) {
            newbodyFunc = Arare.newbodyFunc[type](vars, data)
        }
        var body = newbodyFunc(data.x, data.y);
        if (data.name) {
            vars[name] = body;
        }
        console.log(body);
        return body;
    }

    /* 物体を登録する */
    public static loadBodies(ctx: Context, datalist) {
        datalist = typeof datalist == 'undefined' ? [] : datalist;
        var bodies = []
        for (var data of datalist) {
            bodies.push(Arare.newbody(ctx, data));
        }
        Matter.World.add(ctx.engine.world, bodies);
    }

    public init(world: World) {
        world = typeof world == 'undefined' ? {} : world;

        // create an engine
        var engine = Matter.Engine.create();

        /* engineのアクティブ、非アクティブの制御を行う */
        var runner = Matter.Runner.create({});

        /* worldに追加 */
        // World.add(engine.world, Object.values(objectMap));

        // レンダーオプション

        if (this.canvas) {
            this.canvas.parentElement.removeChild(this.canvas);
        }

        var renderOptions = {
            /* Matter.js の変な仕様 canvas に新しい canvas が追加される */
            element: document.getElementById("canvas"),
            engine: engine,
            options: {
                /* オブジェクトが枠線のみになる */
                width: this.width,
                height: this.height,
                background: world.background || 'rgba(0, 0, 0, 0)',
                wireframes: false,
                //showDebug: world.debug || false,
                //showPositions: world.debug || false,
                //showMousePositions: world.debug || false,
                //debugString: "hoge\nこまったなあ",
            },
        }

        var render = Matter.Render.create(renderOptions);
        this.canvas = render.canvas;

        /* マウス */
        if (world.mouse || true) {
            var mouse = Matter.Mouse.create(render.canvas);
            var constraintOptions = {
                pointA: { x: 0, y: 0 },
                pointB: { x: 0, y: 0 },
                stiffness: world.mouseStiffness || 0.2,  /* 剛性 */
            };
            constraintOptions['render'] = {
                visible: world.mouseVisible || false
            };
            var mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: Matter.Constraint.create(constraintOptions)
        });

        / *リサイズ * /
        Matter.Render['lookAt'](render, {
            min: { x: 0, y: 0 },
            max: {
                x: world.width || 1000,
                y: world.height || 1000
            }
        });

        Matter.World.add(engine.world, mouseConstraint);
        render['mouse'] = mouse;
    
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

        / * 重力 ここでいいのか? */
        engine.world.gravity.x = world.gravityX || 0;
        engine.world.gravity.y = world.gravityY || 0;

        return {
            engine: engine,
            runner: runner,
            render: render,
            canvas: render.canvas,
            vars: {},
            newbodyFunc: {},
        };
    }

    public ready(ctx: Context) {
        Matter.Runner.run(ctx.runner, ctx.engine); / *物理エンジンを動かす * /
        /* 描画開始 */
        Matter.Render.run(ctx.render);
        ctx.runner.enabled = false; / *初期位置を描画したら一度止める * /
    }
    
    public start(ctx: Context) {
        //console.log("start");
        ctx.runner.enabled = true;
    }
    
    public pause(ctx: Context) {
        //console.log("pause");
        ctx.runner.enabled = false;
    }

    public reset(ctx: Context) {
        if (ctx.runner) {
            Matter.Runner.stop(ctx.runner);
            ctx.runner = null;
        }
        if (ctx.engine) {
            Matter.World.clear(ctx.engine.world, false);
            Matter.Engine.clear(ctx.engine);
            ctx.engine = null;
        }
        if (ctx.render) {
            var render = ctx.render;
            Matter.Render.stop(render);
            // render.canvas.remove();
            render.canvas = null;
            render.context = null;
            //render.textures = {};
        }
    }
    
    public show(code) {
        code.world = typeof code.world == 'undefined' ? {} : code.world;
        var context = this.context;
        this.reset(context);
        context = this.init(code.world);
        Arare.loadBodies(context, code.bodies);
        if (code.makeRules) {
            code.makeRules(Matter, context);
        }
        this.ready(context);
        this.context = context;
        if (code.world.autoPlay) {
            this.start(context);
        }
    }

    /* コンパイル */

    public compile(inputs) {
        $.ajax({
        url: '/compile',
        type: 'POST',
        data: {
            source: inputs
        },
        timeout: 5000,
        }).done(function (data) {
        this.show(ArareCode);
        }).fail(function (XMLHttpRequest, textStatus, errorThrown) {
            console.log("XMLHttpRequest : " + XMLHttpRequest.status);
            console.log("textStatus     : " + textStatus);
            console.log("errorThrown    : " + errorThrown);
        })
    }
}

export let arare: Arare = new Arare(500, 500);

/*
Matter.Render.bodies = function (render, bodies, context) {
    var c = context,
    engine = render.engine,
    options = render.options,
    showInternalEdges = options.showInternalEdges || !options.wireframes,
    body, part, i, k;

    for (i = 0; i < bodies.length; i++) {
    body = bodies[i];
    if (!body.render.visible)
        continue;

    // handle compound parts
    for (k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
        part = body.parts[k];

        if (!part.render.visible)
        continue;

        if (options.showSleeping && body.isSleeping) {
        c.globalAlpha = 0.5 * part.render.opacity;
        } else if (part.render.opacity !== 1) {
        c.globalAlpha = part.render.opacity;
        }

        if (part.render.sprite && part.render.sprite.texture && !options.wireframes) {
        // part sprite
        var sprite = part.render.sprite,
            texture = _getTexture(render, sprite.texture);

        c.translate(part.position.x, part.position.y);
        c.rotate(part.angle);

        c.drawImage(
            texture,
            texture.width * -sprite.xOffset * sprite.xScale,
            texture.height * -sprite.yOffset * sprite.yScale,
            texture.width * sprite.xScale,
            texture.height * sprite.yScale
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

            for (var j = 1; j < part.vertices.length; j++) {
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
            c.lineWidth = 3;
            c.strokeStyle = '#bbb';
            c.stroke();
        }
        if (part.render.text) {
            c.font = part.render.font || "24px Arial";
            c.fillStyle = part.render.textStyle || 'rgba(255,0,127,0.5)';
            c.fillText("" + part.render.text, part.position.x, part.position.y);
        }
        }
        c.globalAlpha = 1;
    }
    }
};
*/