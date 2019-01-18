// arare

var Arare = {
    newbodyFunc: {}, /* 物体作成の関数 */
    context: {},
}

var ArareCode = ArareCode || {
    world : {
        width: 1000,
        height: 1000,
        background: "white",
        mouse: false,
        debug: true,
        autoPlay: true,
    },
    bodies : [
        {
            type: "circle",
            name: "A",
            x : 100,
            y : 100,
            radius: 50,
        },
        {
            type: "circle",
            name: "B",
            x: 300,
            y: 100,
            radius: 50,
            isStatic: true,
            angularSpeed: 1.0,
            texture: "/static/image/logo.png"
        },
        {
            type: "rectangle",
            name: "C",
            x: 0,
            y: 300,
            width:300,
            height:20,
            isStatic: true,
            fillStyle: 'green',
        },
        {
            type: "rectangle",
            name: "C",
            x: 0,
            y: 980,
            width:1000,
            height:20,
            isStatic: true,
            fillStyle: 'black',
        },
    ],
}

/* 物体属性 */

Arare.ATTRLIST = [
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

Arare.bodyData = function(vars, data) {
  var o = {};
  if(data.image) {
    data.texture = data.image;
  }
  if (data.parent && vars[data.parent] ) {
    Arare.copyAttr(vars[data.parent], o, Arare.ATTRLIST);
  }
  Arare.copyAttr(data, o, Arare.ATTRLIST);
  Arare.copyRender(data, o, ["fillStyle"]);
  Arare.copySprite(data, o, ["texture", "strokeStyle", "xScale", "yScale"]);
  return o;
}


Arare.copyAttr = function(src, dst, fields) {
  for (var f of fields) {
      if(src[f]) {
        dst[f] = src[f];
      }
  }
}

Arare.copyRender = function(src, dst, fields) {
  for (var f of fields) {
      if(src[f]) {
        dst.render = dst.render || {};
        dst.render[f] = src[f];
      }
  }
}

Arare.copySprite = function(src, dst, fields) {
  for (var f of fields) {
      if(src[f]) {
        dst.render = dst.render || {};
        dst.render.sprite = dst.render.sprite || {};
        dst.render.sprite[f] = src[f];
      }
  }
}

/* 物体を作る */

Arare.newbodyFunc["circle"] = function(vars, data) {
    var options = Arare.bodyData(vars, data);
    return function(x, y) {
        return Matter.Bodies.circle(x, y, data.radius, options);
    }
}

Arare.newbodyFunc["rectangle"] = function(vars, data) {
    var options = Arare.bodyData(vars, data);
    return function(x, y) {
        return Matter.Bodies.rectangle(x, y, data.width, data.height, options);
    }
}

Arare.newbodyFunc["unknown"] = function(vars, data) {
    var options = {
    }
    return function(x, y) {
        return Matter.Bodies.circle(x, y, data.radius, options);
    }
}

Arare.newbody = function(ctx, data) {
    var vars = ctx.vars;
    var newbodyFunc =  Arare.newbodyFunc["unknown"](vars, data);
    var type = data.type || "unknown";
    if(ctx.newbodyFunc[type]) {
        newbodyFunc = ctx.newbodyFunc[type](vars, data)
    }
    else if(Arare.newbodyFunc[type]) {
        newbodyFunc = Arare.newbodyFunc[type](vars, data)
    }
    var body = newbodyFunc(data.x, data.y);
    if(data.name) {
        vars[name] = body;
    }
    console.log(body);
    return body;
}

/* 物体を登録する */

Arare.loadBodies = function(ctx, datalist) {
    var bodies = []
    for(var data of datalist) {
        bodies.push(Arare.newbody(ctx, data));
    }
    Matter.World.add(ctx.engine.world, bodies);
}

/* Arare */

Arare.init = function(world) {
    // create an engine
    var engine = Matter.Engine.create();

    / * 重力 ここでいいのか? */
    engine.world.gravity.x = world.gravityX || 0;
    engine.world.gravity.y = world.gravityY || 0;

    /* engineのアクティブ、非アクティブの制御を行う */
    var runner = Matter.Runner.create();

    /* worldに追加 */
    // World.add(engine.world, Object.values(objectMap));

    // レンダーオプション

    var render = Matter.Render.create({
        element: document.getElementById("canvas"),
        engine: engine,
        options: {
            /* オブジェクトが枠線のみになる */
            wireframes: false,
            width: $('#right').width() || 500,
            height: $('#right').height() || 500,
            background: world.background || 'rgba(0, 0, 0, 0)',
            showDebug: world.debug || false,
            showPositions: world.debug || false,
            showMousePositions: world.debug || false,
            debugString: "hoge\nこまったなあ",
        },
    });

    / *リサイズ * /
   Matter.Render.lookAt(render, {
       min: {x: 0, y: 0},
       max: {
           x: world.width || 1000,
           y: world.height || 1000
       }
   });

   /* マウス */
   if(world.mouse) {
     var mouse = Matter.Mouse.create(render.canvas);
     var mouseConstraint = Matter.MouseConstraint.create(engine, {
           mouse: mouse,
           constraint: {
               stiffness: world.mouseStiffness || 0.2,  /* 剛性 */
               render: {
                   visible: world.mouseVisible || false
               }
           }
       });
       Matter.World.add(engine.world, mouseConstraint);
       // keep the mouse in sync with rendering
       render.mouse = mouse;

       // an example of using mouse events on a mouse
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
    Matter.Runner.run(ctx.runner, ctx.engine); / *物理エンジンを動かす * /
    /* 描画開始 */
    Matter.Render.run(ctx.render);
    runner.enabled = false; / *初期位置を描画したら一度止める * /
}

Arare.start = function(ctx) {
    console.log("start");
    ctx.runner.enabled = true;
}

Arare.pause = function(ctx) {
    console.log("pause");
    /* engineを止める */
    ctx.runner.enabled = false;
}

Arare.reset = function(ctx) {
    if(ctx.runner) {
        Matter.Runner.stop(arare.runner);
        arare.runner = null;
    }
    if(ctx.engine) {
        Matter.World.clear(arare.engine.world);
        Matter.Engine.clear(arare.engine);
        arare.engine = null;
    }
    if(ctx.render) {
        var render = arare.render;
        Matter.Render.stop(render);
        // render.canvas.remove();
        render.canvas = null;
        render.context = null;
        render.textures = {};
    }

    //textContext.clearRect(0, 0, cvsw, cvsh);
    //$('#text-canvas').css("background-color", 'black');
}

Arare.show = function(code) {
    var context = Arare.context;
    Arare.reset(context);
    context = Arare.init(code.world);
    Arare.loadBodies(context, code.bodies);
    if(code.makeRules) {
        code.makeRules(Matter, context);
    }
    Arare.ready(context);
    Arare.context = context;
    if(code.world.autoPlay) {
      Arare.start(context);
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
        console.log("XMLHttpRequest : " + XMLHttpRequest.status);
        console.log("textStatus     : " + textStatus);
        console.log("errorThrown    : " + errorThrown.message);
    })
}
