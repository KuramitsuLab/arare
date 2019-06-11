import * as $ from 'jquery';
import { Arare } from './arare';
import { getSample } from './api';
// import { ArareCode } from './arare2-code';
import * as ace from '../node_modules/ace-builds/src-min-noconflict/ace.js';
import * as solarized_light from '../node_modules/ace-builds/src-min-noconflict/theme-solarized_light.js';
/* editor */

const arare: Arare = new Arare(500, 500);

const editor = ace.edit('editor');
editor.setTheme(solarized_light);
editor.getSession().setUseWrapMode(true); /* 折り返しあり */
// editor.setFontSize(24);

let timer = null;
editor.on('change', (cm, obj) => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  timer = setTimeout(() => {
    arare.compile(editor.getValue());
    $('#play')[0].setAttribute('stroke', 'gray');
    $('#pause')[0].setAttribute('stroke', 'black');
  },                 400);
});

let fullscreen = false;
function getFullscreen() {
  if (document['webkitFullscreenElement']) {
    return document['webkitFullscreenElement'];
  }
  if (document['mozFullScreenElement']) {
    return document['mozFullScreenElement'];
  }
  if (document['msFullscreenElement']) {
    return document['msFullscreenElement'];
  }
  return document['fullscreenElement'];
}

function resizeMe() {
  const w = $(window).width();
  const h = $(window).height();
  console.log('resizeMe', w, h, fullscreen, getFullscreen());
  if (getFullscreen() != null) {
    fullscreen = true;
  }
  if (fullscreen) {
    const min = Math.min(w, h);
    arare.set_window_size(min, min);
    fullscreen = false;
  } else {
    if (w <= 800) {
      arare.set_window_size(w, w);
    } else {
      const min = Math.min(w / 2, h);
      arare.set_window_size(min, min);
    }
  }
}

$(window).on('load', resizeMe);
$(window).on('resize', resizeMe);

$('#play').on('click', () => {
  arare.start();
  $('#play')[0].setAttribute('stroke', 'gray');
  $('#pause')[0].setAttribute('stroke', 'black');
});

$('#pause')[0].setAttribute('stroke', 'gray');
$('#pause').on('click', () => {
  arare.pause();
  $('#play')[0].setAttribute('stroke', 'black');
  $('#pause')[0].setAttribute('stroke', 'gray');
});

$('#reload').on('click', () => {
  arare.load(window['ArareCode']);
  $('#play')[0].setAttribute('stroke', 'gray');
  $('#pause')[0].setAttribute('stroke', 'black');
});

const background = 'rgba(0, 0, 0, 0)';
$('#debug').on('click', () => {
  arare.debug();
});

$('#font-plus').on('click', () => {
  console.log(editor.getFontSize());
  editor.setFontSize(editor.getFontSize() + 2);
});

$('#font-minus').on('click', () => {
  editor.setFontSize(Math.max(8, editor.getFontSize() - 2));
});

function requestFullscreen(target) {
  if (target.webkitRequestFullscreen) {
    target.webkitRequestFullscreen(); // Chrome15+, Safari5.1+, Opera15+
  } else if (target.mozRequestFullScreen) {
    target.mozRequestFullScreen(); // FF10+
  } else if (target.msRequestFullscreen) {
    target.msRequestFullscreen(); // IE11+
  } else if (target.requestFullscreen) {
    target.requestFullscreen(); // HTML5 Fullscreen API仕様
  } else {
    // alert('ご利用のブラウザはフルスクリーン操作に対応していません');
    return;
  }
}

function exitFullscreen() {
  if (document['webkitCancelFullScreen']) {
    document['webkitCancelFullScreen'](); // Chrome15+, Safari5.1+, Opera15+
  } else if (document['mozCancelFullScreen']) {
    document['mozCancelFullScreen'](); // FF10+
  } else if (document['msExitFullscreen']) {
    document['msExitFullscreen'](); // IE11+
  } else if (document['cancelFullScreen']) {
    document['cancelFullScreen'](); // Gecko:FullScreenAPI仕様
  } else if (document.exitFullscreen) {
    document.exitFullscreen(); // HTML5 Fullscreen API仕様
  }
}

$(document).on('keydown', (evt) => {
  // KeyCode 27: ESC button
  if (evt.keyCode === 27) {
    exitFullscreen();
  }
});

$('#extend').on('click', () => {
  requestFullscreen(arare.getCanvas());
});

getSample('ppy/sample.ppy').then((sample: string) => {
  editor.setValue(sample);
  arare.compile(editor.getValue());
}).catch((msg: string) => {
  console.error(msg);
});
