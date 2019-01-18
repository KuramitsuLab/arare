function addDate(pass){
    var d = new Date();
    var sc = document.createElement('script');
    sc.src = pass + '?date=' + d.getFullYear() + d.getMonth() + d.getDay() + d.getHours() + d.getMinutes() + d.getSeconds(); //関数などで処理したものでもOK
    document.body.appendChild(sc);
}

addDate('../static/js/app.js');