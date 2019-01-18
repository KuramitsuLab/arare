var stylesheet = `{
  "world":{
    "wireframes":false,
    "mouse":true
  },
  "slingshot":{
    "name":"sling",
    "x":300,
    "y":450
  },
  "rectangle":{
    "name":"floor",
    "x":700,
    "y":650,
    "width":1200,
    "height":200,
    "isStatic":true
  },
  "pyramid":{
    "name":"target",
    "x":700,
    "y":300,
    "columns":9,
    "rows":10,
    "elementType":"rectangle"
  },
  "text":{
    "name":"score",
    "x":1100,
    "y":800,
    "color":"blue",
    "value":"score"
  },
  "text":{
    "name":"score_val",
    "x":1220,
    "y":800,
    "color":"blue",
    "font":"ＭＳ ゴシック",
    "value":0
  }
}
`
function myRule(){
var ids = [];
for(var obj of objectMap['target'].bodies){
    ids.push(obj.id);
}
Matter.Events.on(engine, 'collisionEnd', function(event) {
    pairs = event.pairs;
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        if (pair.bodyA.label === objectMap['_rock'].label && ids.indexOf(pair.bodyB.id) > 0 || ids.indexOf(pair.bodyA.id) > 0 && pair.bodyB.label == objectMap['_rock'].label) {
            textMap['score_val'].value = textMap['score_val'].value + 1;
            writeAllText();
        }
    }
});
}