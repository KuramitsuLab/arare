
/* editor */

(function(){
  var editor = ace.edit("editor");
  editor.setTheme("ace/theme/solarized_light");
  editor.getSession().setUseWrapMode(true);/* 折り返しあり */
  editor.setFontSize(24);

  var timer = null;
  editor.on("change", function (cm, obj) {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        timer = setTimeout(function() {
            //Arare.compile(editor.getValue());
            Arare.show(ArareCode);
            $('#play')[0].setAttribute('stroke', 'gray');
            $('#pause')[0].setAttribute('stroke', 'black');
        }, 400);
    });

    var fullscreen = false;
    function getFullscreen() {
    	if (document.webkitFullscreenElement) {
    		return document.webkitFullscreenElement;
    	} else if (document.mozFullScreenElement) {
    		return document.mozFullScreenElement;
    	} else if (document.msFullscreenElement) {
    		return document.msFullscreenElement;
    	} else if (document.fullscreenElement) {
    		return document.fullscreenElement;
    	}
    }

    function resizeMe() {
      var w = $( window ).width();
      var h = $( window ).height();
      console.log('resizeMe', w, h, fullscreen, getFullscreen());
      if(getFullscreen() != null) {
        fullscreen = true;
      }
      if (fullscreen) {
        var min = Math.min(w, h);
        Arare.width  =min;
        Arare.height =min;
        fullscreen = false;
      }
      else {
        if(w <= 800) {
          Arare.width = w;
          Arare.height = w;
        }
        else {
          var min = Math.min(w/2, h);
          Arare.width  = min;
          Arare.height = min;
        }
      }

      if(Arare.canvas) {
        Arare.canvas.setAttribute('width', Arare.width);
        Arare.canvas.setAttribute('height', Arare.height);
      }

      if(Arare.context) {
        var render = Arare.context.render;
        render.options.width = Arare.width;
        render.options.height = Arare.height;
      }
    }

    $(window).on('load', resizeMe);
    $(window).on('resize', resizeMe);

    $('#play').on("click", function() {
      Arare.start(Arare.context);
      $('#play')[0].setAttribute('stroke', 'gray');
      $('#pause')[0].setAttribute('stroke', 'black');
    });

    $('#pause')[0].setAttribute('stroke', 'gray');
    $('#pause').on("click", function() {
      Arare.pause(Arare.context);
      $('#play')[0].setAttribute('stroke', 'black');
      $('#pause')[0].setAttribute('stroke', 'gray');
    });

    $('#reload').on("click", function() {
      Arare.show(ArareCode);
      Arare.start(Arare.context);
      $('#play')[0].setAttribute('stroke', 'gray');
      $('#pause')[0].setAttribute('stroke', 'black');
    });

    var background = 'rgba(0, 0, 0, 0)';
    $('#debug').on("click", function() {
      if(Arare.debug) {
        var render = Arare.context.render;
        render.options.wireframes = false;
        render.options.showPositions = false;
        render.options.showMousePositions = false;
        render.options.showVelocity = false;
        render.options.showAngleIndicator = false;
        render.options.showPositions = false;
        render.options.showBounds = false;
        render.options.background = background;
        Arare.debug = false;
      }
      else {
        var render = Arare.context.render;
        render.options.wireframes = true;
        render.options.showPositions = true;
        render.options.showMousePositions = true;
        render.options.showVelocity = true;
        render.options.showAngleIndicator = true;
        render.options.showPositions = true;
        background = render.options.background;
        render.options.background = 'rgba(0, 0, 0, 0)';
        Arare.debug = true;
      }
    });

    $('#font-plus').on("click", function() {
      console.log(editor.getFontSize());
      editor.setFontSize(editor.getFontSize() + 2);
    });

    $('#font-minus').on("click", function() {
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
    	if (document.webkitCancelFullScreen) {
    		document.webkitCancelFullScreen(); //Chrome15+, Safari5.1+, Opera15+
    	} else if (document.mozCancelFullScreen) {
    		document.mozCancelFullScreen(); //FF10+
    	} else if (document.msExitFullscreen) {
    		document.msExitFullscreen(); //IE11+
    	} else if(document.cancelFullScreen) {
    		document.cancelFullScreen(); //Gecko:FullScreenAPI仕様
    	} else if(document.exitFullscreen) {
    		document.exitFullscreen(); // HTML5 Fullscreen API仕様
    	}
    }

    document.onkeydown = function(evt) {
      evt = evt || window.event;
      var isEscape = false;
      if ("key" in evt) {
          isEscape = (evt.key == "Escape" || evt.key == "Esc");
      } else {
          isEscape = (evt.keyCode == 27);
      }
      if (isEscape) {
          exitFullscreen();
      }
    };

    $('#extend').on("click", function() {
      if(Arare.canvas) {
        requestFullscreen(Arare.canvas);
      }
    });

    Arare.show(ArareCode);

})()
