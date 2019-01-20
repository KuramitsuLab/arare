
/* editor */

(function(){
  var editor = ace.edit("editor");
  editor.setTheme("ace/theme/solarized_light");
  editor.getSession().setUseWrapMode(true);/* 折り返しあり */
  //editor.setFontSize(24);

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

    function resizeMe() {
      var w = $( window ).width();
      var h = $( window ).height();
      if(w <= 800) {
        Arare.width = w * 0.95;
        Arare.height = w * 0.95;
      }
      else {
        var min = Math.min(w/2, h);
        Arare.width  =min;
        Arare.height =min;
      }
      $('#canvas').get(0).width = Arare.width;
      $('#canvas').get(0).width = Arare.height;

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
        render.options.showPositions = false;
        render.options.showMousePositions = false;
        render.options.wireframes = false;
        render.options.background = background;
        Arare.debug = false;
      }
      else {
        var render = Arare.context.render;
        render.options.showPositions = true;
        render.options.showMousePositions = true;
        render.options.wireframes = true;
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

    Arare.show(ArareCode);

})()
