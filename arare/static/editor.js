
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
            Arare.compile(editor.getValue());
        }, 400);
    });
    Arare.show(ArareCode);
})()
