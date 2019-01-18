var Playground;
(function (Playground) {
    Playground.CodeGenTarget = "js";

    function CreateEditor(query) {
        var editor = ace.edit(query);
        editor.setTheme("ace/theme/xcode");
        editor.getSession().setMode("ace/mode/macaron");
        editor.getSession().setUseWrapMode(true);/* 折り返しあり */
        editor.setFontSize(12);
        return editor;
    }
    Playground.CreateEditor = CreateEditor;

    function ChangeSyntaxHighlight(editor, targetMode) {
        editor.getSession().setMode("ace/mode/" + targetMode);
    }
    Playground.ChangeSyntaxHighlight = ChangeSyntaxHighlight;
})(Playground || (Playground = {}));

// const ttag = {
//     Source: "Source",
//     Rule: "Rule",
//     Context: "Context",
//     TimingPremise: "TimingPremise",
//     Premise: "Premise",
//     PeriodicSome: "PeriodicSome",
//     Periodic: "Periodic",
//     Event: "Event",
//     Body: "Body",
//     Let: "Let",
//     Assign: "Assign",
//     Return: "Return",
//     Name: "Name",
//     Infix: "Infix",
//     Cast: "Cast",
//     Unary: "Unary",
//     Norm: "Norm",
//     Method: "Method",
//     Get: "Get",
//     Apply: "Apply",
//     Index: "Index",
//     CastExpr: "CastExpr",
//     Tuple: "Tuple",
//     Empty: "Empty",
//     List: "List",
//     RangeUntilExpr: "RangeUntilExpr",
//     RangeExpr: "RangeExpr",
//     Dict: "Dict",
//     Data: "Data",
//     Template: "Template",
//     String: "String",
//     Char: "Char",
//     Image: "Image",
//     Rational: "Rational",
//     Unit: "Unit",
//     Int: "Int",
//     Double: "Double",
//     True: "True",
//     False: "False",
//     Null: "Null",
//     Pictogram: "Pictogram"
// };

const cvswOrg = 1440; /* MacBookAirのSafariのwindowサイズ */
const cvshOrg = 837;  /* MacBookAirのSafariのwindowサイズ */
var cvsw = 1440;      /* リサイズ後のcanvas幅 */
var cvsh = 837;       /* リサイズ後のcanvas高さ */
var ratew = cvsw/cvswOrg;
var rateh = cvsh/cvshOrg;
var result;           /* macaronコードのパース結果の木 */

// 旧Macaron
// var globalField = {};
// var currentField = globalField; /* スコープ管理のため */

/* ctree走査用メソッド */

/* パース結果の木はctree(ノード)をclinkで繋いでいるので、
   現在のctreeから次のctreeを参照するために一手間かかる。
   以下は、ctreeを楽に操作するためのメソッドを挿している。 */

ctree.prototype.getLength = function(){
    return this.child.calcLength();
}

ctree.prototype.getChild = function(index){
    try{
        var length = this.getLength();
        var i = length - index;
        if(i > length || i <= 0) throw new RangeError('IndexError in tree.getChild');
        return this.child.passChild(i);
    }catch(e){
        console.error("RangeError:", e.message);
    }
}

ctree.prototype.getValue = function(){
    var inputs = this.inputs.slice(this.spos,this.epos);
    return (new TextDecoder).decode(inputs);
}

ctree.prototype.getLabeledChild = function(label){
    // TODO 動作チェック
    try{
        return this.child.passLabeledChild(label);
    }catch(e){
        return false;
    }
}

/* infoは条件分岐に使用

   廃止予定
   info.inFlow == true 実行中
   info.inFlow == false 前処理中
   (mainloop()を廃止したので、廃止することは確定)

   info.isKey == true valueを文字列として扱う */

ctree.prototype.visit = function(info){
    return eval("eval" + this.tag + "(this,info)");
}

/* 木を表示 デバッグ用 */
var showFlipper = false; /* ctree と clink の判定 */
ctree.prototype.show = function(depth){
    var indent = showFlipper ? "=".repeat(depth) : "-".repeat(depth);
    showFlipper = !showFlipper;
    console.log(indent + this.tag);
    var length = this.getLength();
    for(var i = 0;i<length;i++){
        this.getChild(i).show(depth+1);
    }
}

clink.prototype.calcLength = function(){
    if(this.prev == null){
        return 0;
    }else{
        return this.prev.calcLength() + 1;
    }
}

clink.prototype.passChild = function(index){
    if(index === 0){
        return this.child;
    }
    return this.prev.passChild(index - 1);
}

clink.prototype.passLabeledChild = function(label){
    if(this.tag === label){
        return this.child;
    }else if(this.prev !== null){
        return this.prev.passLabeledChild(label);
    }
    return null;
}


/* ctreeの走査用ビジターパターン */
function evalSource(tree,info){
    var length = tree.getLength();
    for(var i = 0;i<length;i++){
        tree.getChild(i).visit(info);
    }
    return null;
}

// FIXME 新しい仕様次第
// function evalRule(tree,info){
//     var before = currentField;
//     currentField = {};
//     var contextTree = tree.getLabeledChild("context");
//     var inContext = contextTree != null ? contextTree.visit(info) : null;
//     info.counter = 0;
//     if(info.inFlow){
//         if(tree.getLabeledChild("cond").tag === ttag.TimingPremise){/* foreach or event */
//             if(!(tree.getLabeledChild("cond").getLabeledChild("timing").tag === ttag.Event)){
//                 /* eventは前処理のみ */
//                 /* foreachの処理 */
//                 while(true){
//                     var bool = tree.getLabeledChild("cond").visit(info);
//                     if(bool){
//                         info.isKey = false;
//                         tree.getLabeledChild("body").visit(info);
//                     }else{
//                         break;
//                     }
//                 }
//             }
//         }else{
//             if(tree.getLabeledChild("cond").getChild(0).tag === ttag.Name){
//                 info.isKey = false;
//                 tree.getLabeledChild("body").visit(info);/* Premiseへ */
//             }
//         }
//     }else{
//         if(tree.getLabeledChild("cond").tag === ttag.TimingPremise){
//             if(tree.getLabeledChild("cond").getLabeledChild("timing").tag === ttag.Event){/* event処理 */
//                 var eventInfo = tree.getLabeledChild("cond").visit(info);
//                 var event = eventInfo["event"];
//                 var targets = eventInfo["target"];
//                 var conds = eventInfo["conds"];
//                 // if(event == "Click"){
//                 //     var clickFunc = function(evt){
//                 //         var before = currentField;
//                 //         currentField = {};
//                 //         if(onDown/* 廃止済み */(overlayCanvas/* 廃止済み */, evt, targets, conds)){
//                 //             info.isKey =false;
//                 //             tree.getLabeledChild("body").visit(info);
//                 //         }
//                 //         currentField = before;
//                 //     };
//                 //     overlayCanvas.addEventListener("mousedown",clickFunc,false);
//                 //     events.push(["mousedown",clickFunc]);
//                 // }
//             }
//         }else{
//             if(tree.getLabeledChild("cond").getChild(0).tag === ttag.Apply){/* 関数定義 */
//                 info.isKey = true;
//                 var funcInfo = tree.getLabeledChild("cond").visit(info);
//                 /* 関数はパターンマッチで記述されるので、同じ名前の関数が来た際に前の関数を更新する必要がある */
//                 if(funcInfo.name in globalField){/* すでに同じ名前の関数が存在する場合 */
//                     var mfunc = globalField[funcInfo.name];
//                     if(mfunc.params.length == funcInfo.params.length){/* 関数の引数の数が同じか確認 */
//                         /* 新しい関数の引数名をすでにある関数の引数名と一致させるために、(新変数名)=(旧変数名)として環境に登録 */
//                         for(var i = 0; i < mfunc.params.length; i++){
//                             currentField[funcInfo.params[i]] = mfunc.params[i];
//                         }
//                         info.inFuncDecl = true;
//                         var conds = funcInfo.conds;
//                         /* 新しい関数のパターンマッチの条件を取得 */
//                         for(var i=0; i<conds.length; i++){
//                             if(ctree.prototype.isPrototypeOf(conds[i])){
//                                 conds[i] = conds[i].visit(info);
//                             }
//                         }
//                         var body = "if(" + conds.join(' && ') + "){" + tree.getLabeledChild("body").visit(info) + "}"
//                         info.inFuncDecl = false;
//                         /* 関数の中身を更新 */
//                         body = mfunc.body + body;
//                         mfunc.body = body;
//                         mfunc.func = "(function(" + mfunc.params.join(',') + "){" + body + "})";
//                         globalField[funcInfo.name] = mfunc;
//                     }else{/* 関数の引数の数が違う場合はエラー */
//                         throw new Error('wrong number of arguments');
//                         // return false;
//                     }
//                 }else{/* 同じ名前の関数が存在しない場合 */
//                     var conds = funcInfo.conds;
//                     /* パターンマッチの条件を取得 */
//                     for(var i=0; i<conds.length; i++){
//                         if(ctree.prototype.isPrototypeOf(conds[i])){
//                             conds[i] = conds[i].visit(info);
//                         }
//                     }
//                     /* 更新用に関数の中身を保持しておく */
//                     var body = "if(" + conds.join(' && ') + "){" + tree.getLabeledChild("body").visit(info) + "}"
//                     /* eval用に関数を完成 */
//                     var func = "(function(" + funcInfo.params.join(',') + "){" + body + "})";
//                     globalField[funcInfo.name] = new MFunc(func,funcInfo.params,body);
//                 }
//             }
//         }
//     }
//     currentField = before;
//     return null;
// }

// /* 未実装 */
// function evalContext(tree,info){
//     var length = tree.getLength();
//     var inContext = true;
//     for(var i = 0;i<length;i++){
//         inContext = inContext && tree.getChild(i).visit(info); // TODO 子ノードのeval結果はbool?
//     }
//     return inContext;
// }

// function evalTimingPremise(tree,info){
//     var length = tree.getLength();
//     if(tree.getLabeledChild("timing").tag === ttag.Event){/* eventの処理 */
//         var target = tree.getChild(0).visit(info);
//         var targets = target["target"];
//         if(length > 1){
//             var conds = [];
//             for(var i = 1; i < length; i++){
//                 conds.push(tree.getChild(i))
//             }
//         }else{
//             var conds = true;
//         }
//         target["conds"] = conds;
//         return target;
//     }else{/* foreachの処理 */
//         var targets = tree.getChild(0).visit(info);
//         while(targetsSetter(targets,info.counter,[],{index:0})){
//             var isContinue = false;
//             for(var i = 1;i<length;i++){
//                 if(!(tree.getChild(i).visit(info))){
//                     isContinue = true;
//                     break;
//                 }
//             }
//             info.counter++;
//             if(isContinue){
//                 continue;
//             }else{
//                 return true;
//             }
//         }
//     }
//     return false;
// }

// function evalPremise(tree,info){
//     var funcInfo = {};
//     var length = tree.getLength();
//     var funcTree = tree.getChild(0);
//     funcInfo.name = funcTree.getLabeledChild("recv").visit(info);
//     var funcParams = funcTree.getLabeledChild("param").visit(info);
//     var conds = [];
//     if(length == 1){
//         if(funcParams.length == 0){
//             params = funcParams;
//             conds = ["true"];
//         }else{
//             var paramLen = funcParams.length;
//             var params = [];
//             for(var i = 0;i<paramLen;i++){
//                 if(typeof funcParams[0] == "number" || funcParams[0].match("\"") != null){
//                     params.push("p" + i);
//                     conds.push("p" + i + " == " + funcParams[i]);
//                 }else{
//                     params.push(funcParams[i]);
//                     conds.push("true");
//                 }
//             }
//         }
//         funcInfo.params = params;
//         funcInfo.conds = conds;
//     }else{
//         funcInfo.params = funcParams;
//         for(var i = 1;i<length;i++){
//             conds.push(tree.getChild(i));
//         }
//         funcInfo.conds = conds;
//     }
//     return funcInfo;
// }

// function evalPeriodicSome(tree,info){ // FIXME
//     var targets = [];
//     targets.push(tree.getChild(0).visit({inFlow:true,isKey:true}));
//     targets.push(tree.getChild(1).visit({inFlow:true,isKey:true}));
//     return targets;
// }

// function evalPeriodic(tree,info){
//     var length = tree.getLength();
//     var targets = []
//     for(var i = 0;i<length;i++){
//         targets.push(tree.getChild(i).visit({inFlow:true,isKey:true}));
//     }
//     return targets;
// }

// function evalEvent(tree,info){
//     try{
//         var event = {"event":tree.getChild(0).getLabeledChild("recv").visit({inFlow:false,isKey:true})};
//         var target = tree.getChild(0).getLabeledChild("param").visit({inFlow:false,isKey:true});
//         if(!(target instanceof Array)){
//             target = [target];
//         }
//         event["target"] = target;
//     }catch(e){
//         console.error("EventError:", e.message);
//     }
//     return event;
// }

// function evalBody(tree,info){
//     var length = tree.getLength();
//     if(info.isKey){
//         var body = "";
//         for(var i = 0;i<length;i++){
//             body = body + tree.getChild(i).visit(info);
//         }
//         return body;
//     }

//     for(var i = 0;i<length;i++){
//         tree.getChild(i).visit(info);
//     }
//     return null;
// }

// function evalAssign(tree,info){
//     if(info.isKey){
//         return tree.getLabeledChild("left").visit(info) + "=" + tree.getLabeledChild("right").visit(info) + ";";
//     }

//     var right = tree.getLabeledChild("right").visit(info);
//     info.isKey = true;
//     var left = tree.getLabeledChild("left").visit(info);
//     var leftName = left;
//     if(leftName.indexOf(".") > 0){
//         leftName = leftName.slice(0, leftName.indexOf("."));
//     }
//     if(leftName.indexOf("[") > 0){
//         leftName = leftName.slice(0, leftName.indexOf("["));
//     }

//     if(MEmpty.prototype.isPrototypeOf(right)){
//         try{
//             currentField[leftName].img.src = "image/" + right.value + ".png";
//             currentField[leftName].value = right.value;
//         }catch(e){
//             globalField[leftName].img.src = "image/" + right.value + ".png";
//             globalField[leftName].value = right.value;
//         }
//         return null;
//     }
//     var val = null;

//     if(leftName in currentField){
//         val = eval("currentField." + left + " = " + right);
//     }else if(leftName in globalField){
//         val = eval("globalField." + left + " = " + right);
//     }else{
//         val = eval(left + " = " + right);
//     }
//     // try{
//     //     val = eval("currentField." + tree.getLabeledChild("left").visit(info) + " = " + right);
//     // }catch(e){
//     //     try{
//     //         val = eval("globalField." + tree.getLabeledChild("left").visit(info) + " = " + right);
//     //     }catch(e){
//     //         val = eval(tree.getLabeledChild("left").visit(info) + " = " + right);
//     //     }
//     // }
//     info.isKey = false;
//     return null;
// }

// function evalReturn(tree,info){
//     if(info.isKey){
//         var returnExp = "return ";
//         returnExp = returnExp + tree.getLabeledChild("expr").visit(info) + ";";
//         return returnExp;
//     }
//     return tree.getLabeledChild("expr").visit(info);
// }

// function evalLet(tree,info){
//     if(info.isKey){
//         return tree.getLabeledChild("left").visit(info) + "=" + tree.getLabeledChild("right").visit(info) + ";";
//     }
//     // FIXME?
//     if(!(info.inFlow)){
//         currentField[tree.getLabeledChild("left").visit({inFlow:false,isKey:true})] = tree.getLabeledChild("right").visit({inFlow:false,createNew:true});
//     }
//     return null;
// }

// function evalPosition(tree,info){
//     if(!(info.inFlow)){
//         tree.getChild(0).visit({inFlow:false});
//     }
//     return null;
// }

// function evalName(tree,info){
//     var val = tree.getValue();
//     if(info.inFuncDecl){
//         if(val in currentField){
//             return currentField[val];
//         }
//     }
//     if(info.isKey){
//         return val;
//     }
//     if(val in currentField){
//         return currentField[val];
//     }
//     if(val in globalField){
//         return globalField[val];
//     }
//     throw new Error("Can't find variable: " + val); // FIXME
//     // return val;
// }

// function evalInfix(tree,info){
//     if(info.isKey){
//         return tree.getLabeledChild("left").visit(info) + tree.getLabeledChild("op").visit(info) + tree.getLabeledChild("right").visit(info);
//     }
//     var left = tree.getLabeledChild("left").visit(info);
//     var right = tree.getLabeledChild("right").visit(info);
//     if(MObject.prototype.isPrototypeOf(left)){
//         left = left.value;
//     }
//     if(MObject.prototype.isPrototypeOf(right)){
//         right = right.value;
//     }
//     return eval("left" + tree.getLabeledChild("op").visit({isKey:true}) + "right");
// }

// function evalCast(tree,info){
//     if(info.isKey){
//         return "(" + tree.getLabeledChild("type").visit(info) + ")" + tree.getLabeledChild("recv").visit(info);
//     }
//     return eval("(" + tree.getLabeledChild("type").visit(info) + ")" + tree.getLabeledChild("recv").visit(info));
// }

// function evalUnary(tree,info){
//     if(info.isKey){
//         return tree.getLabeledChild("op").visit(info) + tree.getLabeledChild("expr").visit(info);
//     }
//     return eval(tree.getLabeledChild("op").visit(info) + tree.getLabeledChild("expr").visit(info));
// }

// function evalNorm(tree,info){
//     if(info.isKey){
//         return "|" + tree.getLabeledChild("expr").visit(info) + "|";
//     }
//     return eval("|" + tree.getLabeledChild("expr").visit(info) + "|");
// }

// function evalMethod(tree,info){
//     if(info.isKey){
//         return tree.getLabeledChild("recv").visit(info) + "." + tree.getLabeledChild("name").visit(info) + "(" + tree.getLabeledChild("param").visit(info) + ")";
//     }
//     info.isKey = true;
//     var val = null;

//     var recv = tree.getLabeledChild("recv").visit(info);
//     var name = tree.getLabeledChild("name").visit(info);
//     var params = tree.getLabeledChild("param").visit(info);
//     var paramStr = "";

//     if(Array.isArray(params)){
//         var length = params.length;
//         for(var i = 0;i<length;i++){
//             if(params[i] in currentField){
//                 params[i] = currentField[params[i]];
//             }
//             if(params[i] in globalField){
//                 params[i] = globalField[params[i]];
//             }
//             paramStr = i == 0 ? paramStr + "params[" + i + "]" : paramStr + ",params[" + i + "]";
//         }
//     }else{
//         if(params in currentField){
//             params = currentField[params];
//         }
//         if(params in globalField){
//             params = globalField[params];
//         }
//         paramStr = "params"
//     }

//     try{
//         val = eval("currentField." + recv + "." + name + "(" + paramStr + ")");
//     }catch(e){
//         try{
//             val = eval("globalField." + recv + "." + name + "(" + paramStr + ")");
//         }catch(e){
//             val = eval(recv + "." + name + "(" + paramStr + ")");
//         }
//     }
//     info.isKey = false;
//     return val;
// }

// function evalGet(tree,info){
//     if(info.isKey){
//         return tree.getLabeledChild("recv").visit(info) + "." + tree.getLabeledChild("name").visit(info);
//     }
//     info.isKey = true;
//     var val = null;
//     try{
//         val = eval("currentField." + tree.getLabeledChild("recv").visit(info) + "." + tree.getLabeledChild("name").visit(info));
//     }catch(e){
//         try{
//             val = eval("globalField." + tree.getLabeledChild("recv").visit(info) + "." + tree.getLabeledChild("name").visit(info));
//         }catch(e){
//             val = eval(tree.getLabeledChild("recv").visit(info) + "." + tree.getLabeledChild("name").visit(info));
//         }
//     }
//     info.isKey = false;
//     return val;
// }

// function evalApply(tree,info){
//     if(info.isKey){
//         return "callFunc(\"" + tree.getLabeledChild("recv").visit(info) + "\")(" + tree.getLabeledChild("param").visit(info) + ")";

//     }

//     info.isKey = true;
//     var val = null;
//     var recv = tree.getLabeledChild("recv").visit(info);
//     var params = tree.getLabeledChild("param").visit(info);
//     var paramStr = "";
//     if(Array.isArray(params)){
//         var length = params.length;
//         for(var i = 0;i<length;i++){
//             if(params[i] in currentField){
//                 params[i] = currentField[params[i]];
//             }
//             if(params[i] in globalField){
//                 params[i] = globalField[params[i]];
//             }
//             if(MObject.prototype.isPrototypeOf(params[i]) || params[i].type == "body"){
//                 // MObject以外のオブジェクトもこちら
//                 // .type のため、undefinedは今とれない
//                 paramStr = i == 0 ? paramStr + "params[" + i + "]" : paramStr + ",params[" + i + "]";
//             }else{
//                 if(Array.isArray(params[i])){
//                     paramStr = i == 0 ? paramStr + "[" + params[i] + "]" : paramStr + "," + "[" + params[i] + "]";
//                 }else{
//                     paramStr = i == 0 ? paramStr + params[i] : paramStr + "," + params[i];
//                 }
//             }
//         }
//     }else{
//         if(params in currentField){
//             params = currentField[params];
//         }
//         if(params in globalField){
//             params = globalField[params];
//         }
//         paramStr = "params"
//     }

//     try{
//         var mfunc = eval("currentField." + recv)
//         val = eval(mfunc.func + "(" + paramStr + ")");
//     }catch(e){
//         try{
//             var mfunc = eval("globalField." + recv)
//             val = eval(mfunc.func + "(" + paramStr + ")");
//         }catch(e){
//             val = eval(recv + "(" + paramStr + ")");
//         }
//     }
//     info.isKey = false;
//     return val;
// }

// function evalIndex(tree,info){
//     if(info.isKey){
//         return tree.getLabeledChild("recv").visit(info) + "[" + tree.getLabeledChild("param").visit(info) + "]";
//     }
//     info.isKey = true;
//     var val = null;
//     try{
//         val = eval("currentField." + tree.getLabeledChild("recv").visit(info) + "[" + tree.getLabeledChild("param").visit(info) + "]");
//     }catch(e){
//         try{
//             val = eval("globalField." + tree.getLabeledChild("recv").visit(info) + "[" + tree.getLabeledChild("param").visit(info) + "]");
//         }catch(e){
//             val = eval(tree.getLabeledChild("recv").visit(info) + "[" + tree.getLabeledChild("param").visit(info) + "]");
//         }
//     }
//     info.isKey = false;
//     return val;
// }

// function evalArguments(tree,info){
//     var length = tree.getLength();
//     var list = [];
//     for(var i = 0;i<length;i++){
//         list.push(tree.getChild(i).visit(info));
//     }
//     return list;
// }

// function evalCastExpr(tree,info){
//     if(info.isKey){
//         return tree.getLabeledChild("recv").visit(info) + "=>" + tree.getLabeledChild("type").visit(info);
//     }
//     info.isKey = true;
//     var val = null;
//     try{
//         val = eval("currentField." + tree.getLabeledChild("recv").visit(info) + "=>" + tree.getLabeledChild("type").visit(info));
//     }catch(e){
//         try{
//             val = eval("globalField." + tree.getLabeledChild("recv").visit(info) + "=>" + tree.getLabeledChild("type").visit(info));
//         }catch(e){
//             val = eval(tree.getLabeledChild("recv").visit(info) + "=>" + tree.getLabeledChild("type").visit(info));
//         }
//     }
//     info.isKey = false;
//     return val;
// }

// function evalTuple(tree,info){
//     var length = tree.getLength();
//     var tuple = [];
//     for(var i = 0;i<length;i++){
//         tuple.push(tree.getChild(i).visit(info));
//     }
//     return tuple;
// }

// function evalEmpty(tree,info){
//     return null;
// }

// function evalList(tree,info){
//     var length = tree.getLength();
//     var list = [];
//     for(var i = 0;i<length;i++){
//         list.push(tree.getChild(i).visit(info));
//     }
//     return list;
// }

// function evalRangeUntilExpr(tree,info){
//     var list = [];
//     var start = tree.getLabeledChild("left").visit(info);
//     var end = tree.getLabeledChild("right").visit(info);
//     if(typeof start == "number" && typeof end == "number"){
//         for(var i = start; i < end; i++){
//             list.push(i);
//         }
//     }else if(typeof start == "string" && typeof end == "string"){
//         var startByte = start.charCodeAt(0);
//         var endByte = end.charCodeAt(0);
//         for(var i = startByte; i < endByte; i++) {
//             list.push(String.fromCodePoint(i));
//         }
//     }
//     return list;
// }

// function evalRangeExpr(tree,info){
//     var list = [];
//     var start = tree.getLabeledChild("left").visit(info);
//     var end = tree.getLabeledChild("right").visit(info);
//     if(typeof start == "number" && typeof end == "number"){
//         for(var i = start; i <= end; i++){
//             list.push(i);
//         }
//     }else if(typeof start == "string" && typeof end == "string"){
//         var startByte = start.charCodeAt(0);
//         var endByte = end.charCodeAt(0);
//         for(var i = startByte; i <= endByte; i++) {
//             list.push(String.fromCodePoint(i));
//         }
//     }
//     return list;
// }

// function evalDict(tree,info){
//     var length = tree.getLength();
//     var dict = {};
//     for(var i = 0;i<length;i++){
//         var target = tree.getChild(i);
//         dict[target.getLabeledChild("name").visit(info)] = target.getLabeledChild("value").visit(info);
//     }
//     return dict;
// }

// function evalData(tree,info){
//     return null; // TODO
// }

// function evalTemplate(tree,info){
//     var length = tree.getLength();
//     var template = "\`";
//     for(var i = 0;i<length;i++){
//         template = template + tree.getChild(i).getValue(); // TODO 確認
//     }
//     template = template +  "\`";
//     return template;
// }

function evalString(tree,info){
    // FIXME
    return tree.getValue();
    // return "\"" + tree.getValue() + "\"";
}

// function evalChar(tree,info){
//     return "\'" + tree.getValue() + "\'";
// }

// /* 廃止予定 */
// function evalImage(tree,info){
//     if(info.createNew){
//         return createImage(tree.getValue());
//     }
//     return new MEmpty(tree.getValue());
// }

// function evalRational(tree,info){
//     return eval(tree.getValue());
// }

// function evalUnit(tree,info){
//     return null; // TODO
// }

// function evalInt(tree,info){
//     return parseInt(tree.getValue());
// }

function evalInteger(tree,info){
    return parseInt(tree.getValue());
}

// function evalDouble(tree,info){
//     return parseFloat(tree.getValue());
// }

function evalFloat(tree,info){
    return parseFloat(tree.getValue());
}

function evalTrue(tree,info){
    return true;
}

function evalFalse(tree,info){
    return false;
}

function evalNull(tree,info){
    return null;
}

// /* foreachの対象を見つける 廃止するかは仕様次第 */
// function targetsSetter(targets,index,setted,counter){
//     for(obj in globalField){
//         if(setted.indexOf(obj) === -1){
//             currentField[targets[0]] = globalField[obj];
//             setted.push(obj);
//             if(targets.length !== 1){
//                 if(targetsSetter(targets.slice(1),index,setted.slice(0),counter)){
//                     return true;
//                 }else{
//                     continue;
//                 }
//             }else if(counter.index == index){
//                 return true;
//             }else{
//                 counter.index++;
//             }
//         }
//     }
//     return false;
// }

/* matter.js */
var Engine = Matter.Engine,
	World = Matter.World,
	Body = Matter.Body,
	Bodies = Matter.Bodies,
    Constraint = Matter.Constraint,
    Composite = Matter.Composite,
	Composites = Matter.Composites,
	Common = Matter.Common,
    Vertices = Matter.Vertices,
    Runner = Matter.Runner,
    Render = Matter.Render,
    Mouse = Matter.Mouse,
    MouseConstraint = Matter.MouseConstraint;

var engine;
var runner;
var render;

const optionName = [
    "isStatic",
    "density",
    "friction",
    "frictionAir",
    "restitution",
    "angle"
]

const objectTypeList = [
    "circle",
    "rectangle",
    "polygon",
    "trapezoid",
    "car",
    "stack",
    "pyramid",
    "chain",
    "pendulum",
    "cloth",
    "slingshot",
    "text",
    "constraint"
]

var objectParamMap = {};
var objectMap = {};
var textMap = {};

var matterCanvas = document.getElementById('matter-canvas');
var textCanvas = document.getElementById('text-canvas');
var textContext = textCanvas.getContext('2d');

var indexRegExp = new RegExp('\[[0-9]*\]', 'g');

const fontSize = 40;
// FIXME
const rockSize = 20;

var bgm;

// ctreeで書いてるけど、jsのjsonに寄せる？
// jsonにすると重複禁止なので保留
function initJSON(tree){

    /* 要検討 */
    /* マウスイベント用 */
    var enableMouse = false;
    var mouseConstraint = null;

    /* slingshot用 */
    var enableSlingshot = false;
    var elastic = null;
    var slingshotName = "";

    var renderOption = {
        wireframes: false, /* trueにするとオブジェクトが枠線のみになる */
        width: cvsw,
        height: cvsh,
        background: 'rgba(0, 0, 0, 0)'
    }
    var gravityVal = 1;

    var objectNum = tree.getLength();

    for(var i = 0; i < objectNum; i++){
        var object = tree.getChild(i);
        var objectType = object.getLabeledChild("key").getValue();
        var member = object.getLabeledChild("value");
        var memberNum = member.getLength();

        if(objectType == "world"){
            for(var j = 0; j < memberNum; j++){
                /* getValue()は()->String */
                var key = member.getChild(j).getLabeledChild("key").getValue();
                var value = member.getChild(j).getLabeledChild("value").visit();

                if(key == "gravity"){
                    gravityVal = value;
                }else if(key == "background"){
                    $('#text-canvas').css("background-color", value);
                }else if(key in renderOption){
                    renderOption[key] = value;
                }else if(key == "mouse"){
                    enableMouse = value;
                }else if(key == "gyro"){
                    if(value){
                        window.addEventListener('deviceorientation', updateGravity);
                    }
                    // else{
                    // TODO removeイベント
                    // }
                }else if(key == "wall"){
                    objectMap['_wall0'] = Bodies.rectangle(0, 420, 20, 840, { isStatic: true });
                    objectMap['_wall1'] = Bodies.rectangle(1440, 420, 20, 840, { isStatic: true });
                    objectMap['_wall2'] = Bodies.rectangle(720, 10, 1420, 20, { isStatic: true });
                    objectMap['_wall3'] = Bodies.rectangle(720, 830, 1420, 20, { isStatic: true });
                }else if(key == "bgm"){
                    bgm = new Audio('./static/audio/' + value);
                    bgm.loop = true;
                }else{
                    return key;
                }
            }
        }else{
            var objectName = null;
            var newObject;

            if(objectType in objectParamMap){
                /* パラメータ引き継ぎ(値渡し) */
                newObject = JSON.parse(JSON.stringify(objectParamMap[objectType]));
            }else if(objectTypeList.indexOf(objectType) > -1){

                var newObject = {
                    type:objectType,
                    x: 0,                  /* x座標 */
                    y: 0,                  /* y座標 */
                    radius: 0,
                    width: 0,
                    height: 0,
                    /* polygon */
                    sides: 0,              /* 多角形の辺の数 */
                    /* trapezoid */
                    slope: 0,              /* 台形の傾斜 */
                    /* car */
                    wheelSize: 0,          /* 車輪の大きさ */
                    /* stack, pyramid */
                    columns: 0,            /* 行 */
                    rows: 0,               /* 列 */
                    // columnGap: 0,          /* 行の間隔 */
                    // rowGap: 0,             /* 列の間隔 */
                    elementType: null,     /* 生成するオブジェクトの種類 */
                    /* chain */
                    length:0,              /* 長さ */
                    /* text */
                    textColor: "white",
                    font:'ＭＳ ゴシック',
                    value: null,
                    /* constraint */
                    targetObject: null,
                    /* 速度 */
                    velocityX: 0,
                    velocityY: 0,
                    options: {
                        isStatic: false,   /* 静的オブジェクトかどうか */
                        density: 0.001,    /* 密度 */
                        friction: 0.1,     /* 摩擦係数 */
                        frictionAir: 0.01, /* 空気抵抗 */
                        restitution: 1,    /* 反発係数 */
                        // 度数にする？
                        angle: 0,          /* 角度 */
                        render: {
                            sprite: {
                                texture: null, /* テクスチャ */
                                // lookAt入れないとダメ？
                                // xScale:5,
                                // yScale:5
                            }
                        },
                    }
                };
            }else/* エラー */{
                return objectType;
            }

            for(var j = 0; j < memberNum; j++){
                var key = member.getChild(j).getLabeledChild("key").getValue();
                var value = member.getChild(j).getLabeledChild("value").visit();

                // FIXME こっちで条件分岐した方がいいか？
                if(key == "name"){
                    objectName = value;
                }else if(key == "image"){
                    if(value.indexOf('https://') > -1){
                        // TODO 確認
                        newObject.options.render.sprite.texture = value;
                    }else{
                        // FIXME 拡張子
                        newObject.options.render.sprite.texture = './static/image/' + value;
                    }
                }else if(optionName.indexOf(key) > -1){
                    newObject.options[key] = value;
                }else if(key == "color"){
                    newObject.options.render.fillStyle = value;
                }else{
                    if(key in newObject){
                        newObject[key] = value;
                    }else{
                        /* keyがnewObjectにない場合はエラー */
                        return key;
                    }
                }
            }

            if(objectName){
                /* {名前:パラメータ} */
                objectParamMap[objectName] = newObject;
            }

            if(newObject.type == "circle"/* 円 */){
                objectMap[objectName] = Bodies.circle(newObject.x, newObject.y , newObject.radius, newObject.options);
            }else if(newObject.type == "rectangle"/* 四角形 */){
                objectMap[objectName] = Bodies.rectangle(newObject.x, newObject.y, newObject.width, newObject.height, newObject.options);
            }else if(newObject.type == "polygon" /* 正多角形 */){
                objectMap[objectName] = Bodies.polygon(newObject.x, newObject.y, newObject.sides, newObject.radius, newObject.options);
            }else if(newObject.type == "trapezoid" /* 台形 */){
                objectMap[objectName] = Bodies.trapezoid(newObject.x, newObject.y, newObject.width, newObject.height, newObject.slope, newObject.options);
            }else if(newObject.type == "car" /* 車 */){
                objectMap[objectName] = Composites.car(newObject.x, newObject.y, newObject.width, newObject.height, newObject.wheelSize);
            }else if(newObject.type == "stack" /* 積み重ね */){
                // fieldに追加するかどうするか engine生成がこの後なので、World.add()のためにとりあえずpushしておく
                // objectMap[objectName] = Composites.stack(newObject.x, newObject.y, newObject.columns, newObject.rows, newObject.columnGap, newObject.rowGap, getCallBack(newObject.elementType));
                objectMap[objectName] = Composites.stack(newObject.x, newObject.y, newObject.columns, newObject.rows, 0, 0, getCallBack(newObject.elementType));
            }else if(newObject.type == "pyramid" /* 山なりに積む */){
                // Gapをパラメータで設定したい？
                // objectMap[objectName] = Composites.pyramid(newObject.x, newObject.y, newObject.columns, newObject.rows, newObject.columnGap, newObject.rowGap, getCallBack(newObject.elementType));
                objectMap[objectName] = Composites.pyramid(newObject.x, newObject.y, newObject.columns, newObject.rows, 0, 0, getCallBack(newObject.elementType));
            }else if(newObject.type == "chain" /* 鎖 */){
                var group = Body.nextGroup(true); /* chain内のオブジェクト同士は衝突しないようにcollisionFilterでグループ化する */
                var chain = Composites.stack(newObject.x, newObject.y, newObject.length, 1, 0, 0, getGroupedCallBack(newObject.elementType, group));
                objectMap[objectName] = Composites.chain(chain, 0.3, 0, -0.3, 0, {
                    stiffness: 1,
                    length: 0,
                    render: {
                        visible: false
                    }
                });
            }else if(newObject.type == "pendulum" /* 振り子 */){
                objectMap[objectName] = Composites.newtonsCradle(newObject.x, newObject.y, newObject.columns, newObject.radius, newObject.length);
            }else if(newObject.type == "cloth" /* 布 */){
                var group = Body.nextGroup(true);
                objectMap[objectName] = Composites.softBody(newObject.x, newObject.y, newObject.width, newObject.height, 5, 5, false, 8, {
                    friction: 0.00001,
                    collisionFilter: { group: group }
                    , render: { visible: false }
                    }, {
                        stiffness: 0.06
                    }
                );
            }else if(newObject.type == "slingshot" /* カタパルト */){
                var rock = Bodies.polygon(newObject.x, newObject.y, 8, rockSize * ratew, {
                    density: 0.004,
                    render: {
                        sprite: {
                            texture: newObject.options.render.sprite.texture
                        }
                    }
                });
                elastic = Constraint.create({
                    pointA: { x: newObject.x, y:newObject.y },
                    bodyB: rock,
                    stiffness: 0.05
                });
                objectMap[objectName] = elastic;
                objectMap['_rock'] = rock;
                enableSlingshot = true;
                slingshotName = objectName;
            }else if(newObject.type == "text" /* 文字列 */){
                textMap[objectName] = newObject;
            }else if(newObject.type = "constraint" /* 制約 */){
                var index = indexRegExp.exec(newObject.targetObject);
                if(index/* targetObjectが配列の場合 */){
                    /* オブジェクトが配列の場合、object.bodies[index]でアクセスする必要があるため */
                    newObject.targetObject = newObject.targetObject.replace(indexRegExp, '');
                    objectMap[objectName] = Constraint.create({
                        pointA: { x: newObject.x, y: newObject.y },
                        bodyB: objectMap[newObject.targetObject].bodies[parseInt(index[0].slice(1, -1), 10)],
                        // pointB: { x: 25, y: 0 },
                        // length: 2,
                        stiffness: 0.9
                    })
                }else{
                    objectMap[objectName] = Constraint.create({
                        pointA: { x: newObject.x, y: newObject.y },
                        bodyB: objectMap[newObject.targetObject],
                        // pointB: { x: 25, y: 0 },
                        // length: 2,
                        stiffness: 0.9
                    })
                }
            }

            if(!(newObject.velocityX == 0 && newObject.velocityY == 0)){
                if(objectMap[objectName].bodies){
                    for(var obj of objectMap[objectName].bodies){
                        Body.setVelocity(obj, {
                            x:newObject.velocityX,
                            y:newObject.velocityY
                        });
                    }
                }else{
                    Body.setVelocity(objectMap[objectName], {
                        x:newObject.velocityX,
                        y:newObject.velocityY
                    });
                }
            }

        }
    }

    engine = Engine.create();

    /* 重力 */
    engine.world.gravity.y = gravityVal;

    /* engineのアクティブ、非アクティブの制御を行う */
    runner = Runner.create();

    /* worldに追加 */
    World.add(engine.world, Object.values(objectMap));

    /* レンダリング設定 */
    render = Render.create({
        canvas: matterCanvas,/* あらかじめ作成したcanvasに描画するために必須 */
        engine: engine,
        options: renderOption
    });

    /* リサイズ */
    writeAllText();

    Render.lookAt(render, {
        min: { x: 0, y: 0 },
        max: { x: cvswOrg, y: cvshOrg }
    });

    /* マウスドラッグ */
    if(enableMouse){
        mouseConstraint = mouseDrag(render, engine);
    }

    /* slingshot */
    if(enableSlingshot){
        switchSlingshot(engine, elastic, slingshotName, mouseConstraint);
    }

    Runner.run(runner, engine); /* 物理エンジンを動かす */
    Render.run(render); /* 描画開始 */

    runner.enabled = false; /* 初期位置を描画したら一度止める */

    return false;
}

/* 端末の向きに応じた重力を設定 */
var updateGravity = function(event) {
    var orientation = typeof window.orientation !== 'undefined' ? window.orientation : 0,
        gravity = engine.world.gravity;

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
};

function getCallBack(type){
    if(type == "circle"){
        return function(x, y) {
            return Bodies.circle(x, y, 20);
        };
    }else if(type == "rectangle"){
        return function(x, y) {
            return Bodies.rectangle(x, y, 25, 40);
        };
    }
}

function getGroupedCallBack(type, group){
    if(type == "circle"){
        return function(x, y) {
            return Bodies.circle(x - 20, y, 20, {
                collisionFilter: { group: group }
                // TODO option
                // density: 0.005,
                // frictionAir: 0.05,
                // render: {
                //     fillStyle: '#575375'
                // }
            });
        };
    }else if(type == "rectangle"){
        return function(x, y) {
            return Bodies.rectangle(x - 20, y, 53, 20, {
                collisionFilter: { group: group }
                // TODO option
            });
        };
    }else if(type == "ellipse"){
        return function(x, y) {
            return Bodies.rectangle(x - 20, y, 53, 20, {
                collisionFilter: { group: group },
                // TODO option
                chamfer: 5 /* 角取り */
            });
        };
    }
}

function mouseDrag(render, engine){
    // FIXME engineの扱い
    var mouse = Mouse.create(render.canvas);
    var mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: {
                visible: false
            }
        }
    });

    World.add(engine.world, mouseConstraint);

    render.mouse = mouse;

    return mouseConstraint;
}

function switchSlingshot(engine, elastic, slingshotName, mouseConstraint){
    // FIXME engineの扱い
    Matter.Events.on(engine, 'afterUpdate', function() {
        if (mouseConstraint.mouse.button === -1 && (Math.abs(objectMap['_rock'].velocity.x) > 20 || Math.abs(objectMap['_rock'].velocity.y) > 20)) {
            objectMap['_rock'] = Bodies.polygon(objectMap[slingshotName].pointA.x, objectMap[slingshotName].pointA.y, 7, rockSize * ratew, {
                density: 0.004,
                render: {
                    sprite: {
                        texture: objectParamMap[slingshotName].options.render.sprite.texture
                    }
                }
            });
            World.add(engine.world, objectMap['_rock']);
            elastic.bodyB = objectMap['_rock'];
        }
    });
}

function writeAllText(){
    textContext.clearRect(0, 0, cvsw, cvsh);

    for(var textParam of Object.values(textMap)){
        textContext.fillStyle = textParam.textColor;
        textContext.font = fontSize * ratew + "px " + textParam.font;
        textContext.fillText(textParam.value, textParam.x * ratew, textParam.y * rateh);
    }
}

// TODO 画面外に出たオブジェクトの扱い

// 削除する
// World.remove(engine.world, object);

/* 反対の画面端から出現させる */
// function wrap(body) {
//     if (body.position.x < 0) {
//         Body.translate(body, {x: cvsw - 1,y: 0});
//     }
//     if (body.position.x > cvsw) {
//         Body.translate(body, {x: 1 - cvsw,y: 0});
//     }
//     if (body.position.y < 0) {
//         Body.translate(body, {x: 0,y: cvsh - 1});
//     }
//     if (body.position.y > cvsh) {
//         Body.translate(body, {x: 0,y: 1 - cvsh});
//     }
// }

$(window).on('load', function(){
    resizeWindow();
});

/* リサイズイベント */
$(window).on('resize', function(){
    resizeWindow();
});

function resizeWindow(){
    /* 現在のwindowサイズ */
    cvsw = $( window ).width();
    cvsh = $( window ).height();

    resizeEditorSize();
    resizeCanvasSize();

    ratew = cvsw / cvswOrg;
    rateh = cvsh / cvshOrg;

    /* canvasサイズ更新 */
    $('#matter-canvas').get(0).width = cvsw;
    $('#matter-canvas').get(0).height = cvsh;
    $('#text-canvas').get(0).width = cvsw;
    $('#text-canvas').get(0).height = cvsh;

    centeringCanvas();

    /* objectサイズ更新 */
    writeAllText();
    if(render){
        render.options.width = cvsw;
        render.options.height = cvsh;
    }

}

/* canvasを 16:9 に合わせる */
function resizeCanvasSize(){
    var wBase = cvsw / 16.0;
    var hBase = cvsh / 9.0;
    if(wBase > hBase){
      cvsw = hBase * 16;
    }else{
      cvsh = wBase * 9;
    }
}

function centeringCanvas(){
    var top = ($( window ).height() - cvsh)/2;
    var left = ($( window ).width() - cvsw)/2;
    $("#matter-canvas").css({
        "position": "absolute",
        "top": top,
        "left": left
    });
    $("#text-canvas").css({
        "position": "absolute",
        "top": top,
        "left": left
    });
}

/* 各種イベント */

var macaronEditor;

$(function () {

    macaronEditor = Playground.CreateEditor("macaron-editor");

    var GenerateServer = function () {

        resetState();

        if($('[name="lang"]').val() == 'json'){
            compile('json');
        }else/* $('[name="lang"]').val() == 'jp' */{
            compile('jp');
        }
    };

    var timer = null;
    macaronEditor.on("change", function (cm, obj) {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        timer = setTimeout(GenerateServer, 400);
    });

    $('#start-plot').click(function () {
        console.log("start");

        /* 一時停止ボタンに切り替え */
        $(this).removeClass("active");
        $($(this).attr("switch-link")).addClass("active");

        /* engineを動かす */
        runner.enabled = true;

        /* audio */
        if(bgm){
            bgm.play();
        }
    });
    $('#pause-plot').click(function (){
        console.log("pause");

        /* 開始ボタンに切り替え */
        $(this).removeClass("active");
        $($(this).attr("switch-link")).addClass("active");

        /* engineを止める */
        runner.enabled = false;

        /* audio */
        if(bgm){
            bgm.pause();
        }
    });
    $('#reset').click(function () {
        console.log("reset");

        resetState();

        compile();
    });
    /* デモ用 */
    $('[name="samples"]').change(function() {
        var sampleName = $('[name="samples"]').val();
        var url = ''

        if(sampleName == "slingshot"){
            url = '/sample/slingshot';
        }else if(sampleName == "bridge"){
            url = '/sample/bridge';
        }else if(sampleName == "car"){
            url = '/sample/car';
        }else if(sampleName == "pendulum"){
            url = '/sample/pendulum';
        }else if(sampleName == "wreckingball"){
            url = '/sample/wreckingball';
        }else if(sampleName == "japanese"){
            url = '/sample/japanese';
        }else{
            // TODO
        }

        if(url != ''){
            $.ajax({
                url: url,
                type: 'POST',
                timeout: 5000,
            })
            .done(function(data) {
                macaronEditor.setValue(data);
            })
            .fail(function(XMLHttpRequest, textStatus, errorThrown) {
                console.log("ajax通信に失敗しました");
                console.log("XMLHttpRequest : " + XMLHttpRequest.status);
                console.log("textStatus     : " + textStatus);
                console.log("errorThrown    : " + errorThrown.message);
            });
        }else{
            macaronEditor.setValue("");
        }
    });
    /* 文字サイズ */
    $('[name="fontsize"]').change(function() {
        var fontsize = Number($('[name="fontsize"]').val());
        // alert($('[name="fontsize"]').val());
        macaronEditor.setFontSize(fontsize);
    });
    
    /* ファイル読み込み(スタイルシート) */
    // $('#load-json').click(function() {
    //     console.log("load json")
    //     $('#loadfile-json').click();
    //     $('#loadfile-json').change(function(){
    //         var reader = new FileReader();
    //         reader.onload = function () {
    //             jsonEditor.toTextArea();
    //             $('#macaron-text').val(reader.result);
    //             jsonEditor = makeJSONEditor();
    //         }
    //         var file = this.files[0];
    //         // FIXME ファイルチェック
    //         // if (!file.type.match(/json/)){
    //         //     alert("対応ファイル json");
    //         //     return;
    //         // }
    //         reader.readAsText(file);
    //     });
    // });
});

function compile(lang){

    var inputs = macaronEditor.getValue();

    var postURL = '/stylesheet';

    if(lang == "jp"){
        postURL = '/jp';
    }

    /* サーバーにinputsを投げる */
    $.ajax({
        url: postURL,
        type: 'POST',
        // dataType: 'json',
        data: {
            source:inputs
        },
        timeout: 5000,
    })
    .done(function(data) {

        var annotations = [];

        /* スタイルシートの処理 */
        var inputsJSON = (new TextEncoder).encode(stylesheet);
        var jsonResult = parseJSON(inputsJSON,inputsJSON.length-1);

        // if(lang == "jp"){
        //     // エラーの返し方による
        // }

        if(jsonResult.tag == "[error]"){
            var errorStr = stylesheet.substr(jsonResult.pos, jsonResult.epos);
            var errorLine = errorStr.split("\n").length - 1;

            /* 行の先頭でパースエラーが発生した場合 */
            if(errorStr.split("\n")[errorLine].replace(/^\s+/g, "").length <= 1){
                /* 間違っている構文は一つ前の行 */
                errorLine = errorLine - 1;
            }

            annotations = [
                {
                    row: errorLine, // FIXME
                    type: "error",
                    text: "Syntax Error"
                }
            ];

        }else{
            var errorKey = initJSON(jsonResult);

            if(errorKey){
                var errorPos = stylesheet.indexOf(errorKey);
                var errorStr = stylesheet.substr(0, errorPos + errorKey.length);
                var errorLine = errorStr.split("\n").length - 1;

                annotations = [
                    {
                        row: errorLine,
                        type: "error",
                        text: "Can't find parameter: " + errorKey
                    }
                ];

            }else{
                /* ルールの処理 */
                myRule();
            }
        }

        macaronEditor.getSession().setAnnotations(annotations);

    })
    .fail(function(XMLHttpRequest, textStatus, errorThrown) {
        /* textStatus == "parseerror" の時、rule.jsでシンタックスエラー */
        console.log("ajax通信に失敗しました");
        console.log("XMLHttpRequest : " + XMLHttpRequest.status);
        console.log("textStatus     : " + textStatus);
        console.log("errorThrown    : " + errorThrown.message);
        // TODO うざい
        // alert(textStatus.name + ': ' + errorThrown.message);
    });
}

function resizeEditorSize(){
    $('#macaron-editor').css("height", cvsh*11/16);
    $('#macaron-editor').css("width", cvsw*2/5);
}

function resetState(){

    textContext.clearRect(0, 0, cvsw, cvsh);

    $('#text-canvas').css("background-color", 'black');

    objectParamMap = {};
    objectMap = {};
    textMap = {};

    if(render){
        Render.stop(render);
        // render.canvas.remove();
        render.canvas = null;
        render.context = null;
        render.textures = {};
    }
    if(runner){
        Runner.stop(runner);
        runner = null;
    }
    if(engine){
        World.clear(engine.world);
        Engine.clear(engine);
        engine = null;
    }

    // TODO 他のaudioの扱い
    if(bgm){
        bgm.pause();
        bgm.currentTime = 0;
    }
}

/* マウス位置表示 */
function simple_tooltip(target_items, name){
    $(target_items).each(function(i){
        $("#wrapper").append("<div class='"+name+"' id='"+name+i+"'><p></p></div>");
        var my_tooltip = $("#"+name+i);
        var tooltipDoc =  document.getElementById(name+i);

        if($(this).attr("title") != "" && $(this).attr("title") != "undefined" ){
            $(this).removeAttr("title").mouseover(function(){
                my_tooltip.css({opacity:0.8, display:"none"}).fadeIn(400);
            }).mousemove(function(kmouse){
                var border_top = $(window).scrollTop();
                var border_right = $(window).width();
                var left_pos;
                var top_pos;
                var offset = 5;  // 場所

                if(border_right - (offset *2) >= my_tooltip.width() + kmouse.pageX){
                    left_pos = kmouse.pageX+offset;
                } else{
                    left_pos = border_right-my_tooltip.width()-offset;
                }

                if(border_top + (offset *2)>= kmouse.pageY - my_tooltip.height()){
                    top_pos = border_top +offset;
                } else{
                    top_pos = kmouse.pageY-my_tooltip.height()-offset;
                }

                my_tooltip.css({left:left_pos, top:top_pos});

                tooltipDoc.innerHTML = '<p>'+ getMousePosition(matterCanvas, kmouse) +'</p>'

            }).mouseout(function(){
                my_tooltip.css({left:"-9999px"});
            });
        }
    });
}

$(document).ready(function(){  
    simple_tooltip("#matter-canvas","tooltip");  
});

function getMousePosition(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return "(" + (evt.clientX - rect.left) + "," + (evt.clientY - rect.top) + ")"
}

/* Matter.js(参考) */

/* キー入力 */
// var RIGHT = 0;
// var LEFT = 0;
// var UP = 0;
// var SPACE = 0;

// document.onkeydown = function(event){
//         if (event.keyCode == 39) {RIGHT = 1};
//         if (event.keyCode == 37) {LEFT = 1};
//         if (event.keyCode == 38) {UP = 1};
//         if (event.keyCode == 32) {SPACE = 1};
// };
// document.onkeyup = function(event){
//         if (event.keyCode == 39) {RIGHT = 0};
//         if (event.keyCode == 37) {LEFT = 0};
//         if (event.keyCode == 38) {UP = 0};
//         if (event.keyCode == 32) {SPACE = 0};
// };

// TODO メモ
// 左画面 縮尺 modalビュー
// Crome検証 エラーメッセージくらい
// klabにpush 綺麗にする