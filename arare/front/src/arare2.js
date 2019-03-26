// arare

Matter.use('matter-wrap');

var Arare = {
  width: 500,
  height: 500,
  newbodyFunc: {},
  /* 物体作成の関数 */
  context: {},
  /* イベント通知 */
  notify: function(ctx) {},
};

var ArareCode = ArareCode || {
  world: {
    width: 1000,
    height: 1000,
    background: 'rgba(255,200,200, 1.0)',
    debug: true,
    autoPlay: true,
  },
  bodies: [{
      shape: "circle",
      name: "A",
      x: 100,
      y: 100,
      width: 100,
      text: "ほげ",
    },
    {
      shape: "pendulum",
      name: "B",
      x: 400,
      y: 400,
      width: 100,
      height: 100,
      number: 2,
      isStatic: true,
      angularSpeed: 1.0,
      //texture: "/static/image/logo.png"
    },
    {
      shape: "rectangle",
      name: "C",
      x: 0,
      y: 300,
      width: 300,
      height: 20,
      isStatic: true,
      fillStyle: 'darkgreen',
    },
    {
      shape: "rectangle",
      name: "C",
      x: 0,
      y: 980,
      width: 1000,
      height: 20,
      isStatic: true,
      fillStyle: 'blue',
    },
    {
      name: "ほげほご",
      value: 123,
      x: 100,
      y: 800,
      fillStyle: 'blue',
    },
  ],
};

(function() {
  var Common = Matter.Common;
  var Composite = Matter.Composite;
  var Bounds = Matter.Bounds;
  var Events = Matter.Events;
  var Engine = Matter.Engine;
  var Render = Matter.Render;
  var Runner = Matter.Runner;
  var Body = Matter.Body;
  var Composites = Matter.Composites;
  var MouseConstraint = Matter.MouseConstraint;
  var Mouse = Matter.Mouse;
  var World = Matter.World;

  var RENDER = [
    "visible", "fillStyle", "strokeStyle",
    "lineStyle", "opacity",
    "text", "font", "textStyle"
  ]

  var SPRITE = [
    "texture", "xScale", "yScale",
  ]

  var hasOption = function(data, fields) {
    for (var f of fields) {
      if (data[f]) return true;
    }
    return false;
  }

  var copyVal = function(ctx, a, index) {
    if (Array.isArray(a)) {
      return a[index % a.length];
    } else if (typeof(a) == 'function') {
      return a(index);
    } else if (typeof(a) == 'object' && a.shape) {
      return Arare.bodyFunc(ctx, a);
    } else {
      return a;
    }
  }

  var copyOption = function(ctx, src, dst, index, fields) {
    if (fields) {
      for (var f of fields) {
        if (src[f]) {
          dst[f] = copyVal(ctx, src[f]);
        }
      }
    } else {
      for (var f in src) {
        if (RENDER.indexOf(f) == -1 && SPRITE.indexOf(f) == -1) {
          dst[f] = copyVal(ctx, src[f]);
        }
      }
    }
  }

  Arare.newOption = function(ctx, data, index) {
    var o = {};
    copyOption(ctx, data, o, index);
    if (hasOption(data, RENDER)) {
      o.render = {};
      copyOption(ctx, data, o.render, index, RENDER);
      if (hasOption(data, SPRITE)) {
        o.render.sprite = {};
        copyOption(ctx, data, o.render.sprite, index, SPRITE);
      }
    }
    return o;
  }

  Arare.addBodyFunction = function(key, f) {
    Arare.newbodyFunc[key] = f;
  }

  /* 物体を作る */

  Arare.newbodyFunc["circle"] = function(ctx, data) {
    return function(x, y, index) {
      var options = Arare.newOption(ctx, data, index);
      var radius = data.radius || 25;
      if (data.width) {
        radius = data.width / 2;
      }
      return Matter.Bodies.circle(x, y, radius, options);
    }
  }

  Arare.newbodyFunc["rectangle"] = function(ctx, data) {
    return function(x, y, index) {
      var options = Arare.newOption(ctx, data, index);
      return Matter.Bodies.rectangle(x, y, data.width || 100, data.height || 100, options);
    }
  }

  Arare.newbodyFunc["unknown"] = function(ctx, data) {
    return function(x, y, index) {
      var options = Arare.newOption(ctx, data, index);
      return Matter.Bodies.circle(x, y, data.radius || 25, options);
    }
  }

  Arare.bodyFunc = function(ctx, data) {
    var newbodyFunc = Arare.newbodyFunc["unknown"](ctx, data);
    var shape = data.shape;
    if (ctx.newbodyFunc[shape]) {
      newbodyFunc = ctx.newbodyFunc[shape](ctx, data)
    } else if (Arare.newbodyFunc[shape]) {
      newbodyFunc = Arare.newbodyFunc[shape](ctx, data)
    }
    return newbodyFunc;
  }

  /* event */

  Arare.newContext = function(world, datalist) {
    var engine = Matter.Engine.create();
    var runner = Matter.Runner.create();
    if (Arare.canvas) {
      Arare.canvas.parentElement.removeChild(Arare.canvas);
    }

    var render = Matter.Render.create({
      element: document.getElementById("canvas"),
      engine: engine,
      options: {
        //canvas: document.getElementById("canvas"),
        width: Arare.width,
        height: Arare.height,
        background: world.background || 'rgba(255, 255, 255, 1)',
        showBounds: true,
        wireframes: false,
        showDebug: world.debug || false,
        showPositions: world.debug || false,
        showMousePositions: world.debug || false,
        showAfterImage: 0.2,
        hasBounds: true,
      },
    });
    Arare.canvas = render.canvas;

    / *リサイズ * /
    Matter.Render.lookAt(render, {
      min: {
        x: 0,
        y: 0
      },
      max: {
        x: world.width || 1000,
        y: world.height || 1000
      }
    });
    //console.log(world.width, world.height, Arare.width, Arare.height)

    /* マウス */
    if (world.mouse || true) {
      var mouse = Matter.Mouse.create(render.canvas);
      var mouseConstraint = Matter.MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
          stiffness: world.mouseStiffness || 0.2,
          render: { /* 剛性 */
            visible: world.mouseVisible || false
          }
        }
      });

      Matter.World.add(engine.world, mouseConstraint);
      render.mouse = mouse;

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

    return {
      engine: engine,
      runner: runner,
      render: render,
      canvas: render.canvas,
      vars: {},
      newbodyFunc: {},
    };
  }

  Arare.ready = function(ctx) {
    / *物理エンジンを動かす * /
    Matter.Runner.run(ctx.runner, ctx.engine);
    /* 描画開始 */
    Matter.Render.run(ctx.render);
    / *初期位置を描画したら一度止める * /
    ctx.runner.enabled = false;
    Arare.notify(ctx);
  }

  Arare.start = function(ctx) {
    //console.log("start");
    ctx.runner.enabled = true;
    Arare.notify(ctx);
    Arare.ticker(ctx, {value: '再生中..'})
  }

  Arare.pause = function(ctx) {
    //console.log("pause");
    ctx.runner.enabled = false;
    Arare.notify(ctx);
  }

  var defaultDeref = function(v) { return v.value; }

  Arare.show = function(code) {
    var ctx = Arare.context;
    /* reset running status */
    if (ctx.runner) {
      Runner.stop(ctx.runner);
      ctx.runner = null;
    }
    if (ctx.engine) {
      World.clear(ctx.engine.world);
      Engine.clear(ctx.engine);
      ctx.engine = null;
    }
    if (ctx.render) {
      var render = ctx.render;
      Render.stop(render);
      // render.canvas.remove();
      //render.canvas = null;
      //render.context = null;
      //render.textures = {};
    }
    if(code.world) {
      ctx = Arare.newContext(code.world);
      var bodies = [];
      var vars = ctx.render.options.variables || [];
      for (var data of code.bodies) {
        if(data.shape) {
          var f = Arare.bodyFunc(ctx, data);
          var body = f(data.x, data.y, 0);
          if (data.name) {
            ctx.vars[name] = body;
          }
          if (body.id) {
            bodies.push(body);
          }
        }
        else {
          if(data.x && data.y) {
            data.deref = data.deref || defaultDeref;
            vars.push(data);
          }
        }
      }
      World.add(ctx.engine.world, bodies);
      if(vars.length > 0) {
        ctx.render.options.variables = vars;
      }
      if (code.makeRules) {
        code.makeRules(Matter, ctx);
      }
      Arare.context = ctx;
      Arare.ready(ctx);
      if (code.world.autoPlay) {
        Arare.start(ctx);
      }
      return;
    }
    if(code.errors) {
      Arare.notify(ctx);
    }
  }

  Arare.ticker = function(ctx, data) {
    if(ctx.render) {
      var tickers = ctx.render.options.tickers || [];
      tickers.push({
        x: data.x || 50,
        y: data.y || 50,
        font: data.font || "36px Arial",
        keepAlive: data.keepAlive || 500,
        value: data.value || data.text || '[Playing]',
        xShift: data.xShift || 2,
        yShift: data.yShift || 0,
      });
      ctx.render.options.tickers = tickers;
    }
  }

  /* コンパイル */

  Arare.compile = function(inputs) {
    $.ajax({
      url: '/compile',
      type: 'POST',
      data: {
        source: inputs
      },
      timeout: 5000,
    }).done(function(data) {
      Arare.show(ArareCode);
    }).fail(function(XMLHttpRequest, textStatus, errorThrown) {
      console.log("XMLHttpRequest : " + XMLHttpRequest);
      console.log(errorThrown);
      console.log(textStatus);
    }).always( (data) => {
      console.log(data);
    });
  }
})();

/* Arare */

/* Composite */

Arare.newbodyFunc["pendulum"] = function(ctx, data) {
  return function(x, y, index) {
    var options = Arare.newOption(ctx, data, index);
    return Arare.newtonsCradle(x, y, options);
  }
}

Arare.newtonsCradle = function(xx, yy, options) {
  var separation = 1.9;
  var number = options.number || 1;
  var size = (options.width || 200) / (number * 2);
  var length = options.height || 100;
  var newtonsCradle = Matter.Composite.create({
    label: 'Newtons Cradle'
  });
  for (var i = 0; i < number; i++) {
    var circle = Matter.Bodies.circle(xx + i * (size * separation), yy + length, size, {
      inertia: options.interia || Infinity,
      restitution: options.restitution || 1,
      friction: options.friction || 0,
      frictionAir: options.frictionAir || 0.0001,
      slop: options.slop || 1
    });
    var constraint = Matter.Constraint.create({
      pointA: {
        x: xx + i * (size * separation),
        y: yy
      },
      bodyB: circle,
      render: {
        lineWidth: options.lineWidth | 1,
        strokeStyle: options.strokeStyle || 'gray',
      }
    });
    Matter.Composite.addBody(newtonsCradle, circle);
    Matter.Composite.addConstraint(newtonsCradle, constraint);
  }
  return newtonsCradle;
};
