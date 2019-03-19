import * as $ from 'jquery';
import {Arare, ArareCode} from './arare';
import * as ace from '../node_modules/ace-builds/src-min-noconflict/ace.js';
import * as solarized_light from '../node_modules/ace-builds/src-min-noconflict/theme-solarized_light.js';
/* editor */

let arare: Arare = new Arare(500, 500);

var editor = ace.edit("editor");
editor.setTheme(solarized_light);
editor.getSession().setUseWrapMode(true);/* 折り返しあり */
//editor.setFontSize(24);

var timer = null;
editor.on("change", function (cm, obj) {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  timer = setTimeout(function () {
    //arare.compile(editor.getValue());
    arare.show(ArareCode);
    $('#play')[0].setAttribute('stroke', 'gray');
    $('#pause')[0].setAttribute('stroke', 'black');
  }, 400);
});

var fullscreen = false;
function getFullscreen() {
  if (document['webkitFullscreenElement']) {
    return document['webkitFullscreenElement'];
  } else if (document['mozFullScreenElement']) {
    return document['mozFullScreenElement'];
  } else if (document['msFullscreenElement']) {
    return document['msFullscreenElement'];
  } else if (document['fullscreenElement']) {
    return document['fullscreenElement'];
  }
}

function resizeMe() {
  var w = $(window).width();
  var h = $(window).height();
  console.log('resizeMe', w, h, fullscreen, getFullscreen());
  if (getFullscreen() != null) {
    fullscreen = true;
  }
  if (fullscreen) {
    var min = Math.min(w, h);
    arare.width = min;
    arare.height = min;
    fullscreen = false;
  }
  else {
    if (w <= 800) {
      arare.width = w;
      arare.height = w;
    }
    else {
      var min = Math.min(w / 2, h);
      arare.width = min;
      arare.height = min;
    }
  }

  if (arare.canvas) {
    arare.canvas.setAttribute('width', arare.width.toString());
    arare.canvas.setAttribute('height', arare.height.toString());
  }

  if (arare.context) {
    var render = arare.context.render;
    render.options.width = arare.width;
    render.options.height = arare.height;
  }
}

$(window).on('load', resizeMe);
$(window).on('resize', resizeMe);

$('#play').on("click", function () {
  arare.start(arare.context);
  $('#play')[0].setAttribute('stroke', 'gray');
  $('#pause')[0].setAttribute('stroke', 'black');
});

$('#pause')[0].setAttribute('stroke', 'gray');
$('#pause').on("click", function () {
  arare.pause(arare.context);
  $('#play')[0].setAttribute('stroke', 'black');
  $('#pause')[0].setAttribute('stroke', 'gray');
});

$('#reload').on("click", function () {
  arare.show(ArareCode);
  arare.start(arare.context);
  $('#play')[0].setAttribute('stroke', 'gray');
  $('#pause')[0].setAttribute('stroke', 'black');
});

var background = 'rgba(0, 0, 0, 0)';
$('#debug').on("click", function () {
  if (arare.debug) {
    var render = arare.context.render;
    render.options.wireframes = false;
    render.options.showPositions = false;
    render.options.showMousePositions = false;
    render.options.showVelocity = false;
    render.options.showAngleIndicator = false;
    render.options.showPositions = false;
    render.options.showBounds = false;
    render.options.background = background;
    arare.debug = false;
  }
  else {
    var render = arare.context.render;
    render.options.wireframes = true;
    render.options.showPositions = true;
    render.options.showMousePositions = true;
    render.options.showVelocity = true;
    render.options.showAngleIndicator = true;
    render.options.showPositions = true;
    background = render.options.background;
    render.options.background = 'rgba(0, 0, 0, 0)';
    arare.debug = true;
  }
});

$('#font-plus').on("click", function () {
  console.log(editor.getFontSize());
  editor.setFontSize(editor.getFontSize() + 2);
});

$('#font-minus').on("click", function () {
  editor.setFontSize(Math.max(8, editor.getFontSize() - 2));
});

function requestFullscreen(target) {
  if (target.webkitRequestFullscreen) {
    target.webkitRequestFullscreen(); //Chrome15+, Safari5.1+, Opera15+
  } else if (target.mozRequestFullScreen) {
    target.mozRequestFullScreen(); //FF10+
  } else if (target.msRequestFullscreen) {
    target.msRequestFullscreen(); //IE11+
  } else if (target.requestFullscreen) {
    target.requestFullscreen(); // HTML5 Fullscreen API仕様
  } else {
    //alert('ご利用のブラウザはフルスクリーン操作に対応していません');
    return;
  }
}

function exitFullscreen() {
  if (document['webkitCancelFullScreen']) {
    document['webkitCancelFullScreen'](); //Chrome15+, Safari5.1+, Opera15+
  } else if (document['mozCancelFullScreen']) {
    document['mozCancelFullScreen'](); //FF10+
  } else if (document['msExitFullscreen']) {
    document['msExitFullscreen'](); //IE11+
  } else if (document['cancelFullScreen']) {
    document['cancelFullScreen'](); //Gecko:FullScreenAPI仕様
  } else if (document.exitFullscreen) {
    document.exitFullscreen(); // HTML5 Fullscreen API仕様
  }
}

document.onkeydown = function (evt) {
  var isEscape = false;
  isEscape = (evt.key == "Escape" || evt.key == "Esc");
  if (isEscape) {
    exitFullscreen();
  }
};

$('#extend').on("click", function () {
  if (arare.canvas) {
    requestFullscreen(arare.canvas);
  }
});

arare.show(ArareCode);


