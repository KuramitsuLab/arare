const EmptyTag = "";
const EmptyTree = null;
const EmptyState = null;

class clink {
  constructor(tag,child,prev) {
    this.tag = tag;
    this.child = child;
    this.prev = prev;
  }
  toString() {
    if(this.child != null && this.tag != null){
      return '$' + this.tag + '=' + this.child.toString();
    }
    return '';
  }
  getTag() {
     for (var cur = this; cur != null; cur = cur.prev) {
        if (cur.child == null) {
           return cur.tag;
        }
     }
     return EmptyTag;
  }
}

class ctree {
  constructor(tag,inputs,spos,epos,child) {
    this.tag = (tag == EmptyTag && child != null) ? child.getTag() : tag;
    this.inputs = inputs;
    this.spos = spos;
    this.epos = epos;
    this.child = child;
  }
  toString() {
    var s = "[#" + this.tag;
    var cur = this.child;
    var cnt = 0;
    while(cur != null){
      s = s + " " + cur.toString();
      cur = cur.prev;
      cnt++;
    }
    if(cnt == 1){
      s = s + " '" + this.inputs.slice(this.spos, this.epos).toString() + "'";
    }
    return s + "]";
  }
}

class cmemo {
  constructor() {
    this.key = 0;
    this.matched = false;
    this.mpos = 0;
    this.mtree = null;
    this.mstate = null;
  }
}

class cstate {
  constructor(ns, spos, epos, sprev) {
    this.ns = ns;
    this.spos = spos;
    this.slen = epos - spos;
    this.sprev = sprev;
  }
}

class ParserContext {
  constructor(inputs, length, memolen) {
    this.inputs = inputs;
    this.length = length;
    this.pos = 0;
    this.headpos = 0;
    this.tree = null;
    this.state = null;
    this.memos = [...Array(memolen).keys()].map(function(){return new cmemo()});
  }
}

function bits32(bits, b){
  var n = b & 0xff;
  return (bits[n / 32 | 0] & (1 << (n % 32))) != 0;
}

function mbackpos(px, pos){
  if(px.headpos < px.pos){
    px.headpos = px.pos;
  }
  return pos;
}

const memosize = 0
const memolen = 1
const bs0 = [9728,1,0,0,0,0,0,0]
const bs1 = [-1,-5,-1,-1,-1,-1,-1,-1]
const bs2 = [0,66977792,0,0,0,0,0,0]
const bs3 = [0,67043328,0,0,0,0,0,0]
const bs4 = [0,0,32,32,0,0,0,0]
const bs5 = [0,10240,0,0,0,0,0,0]
const bs6 = [0,67043328,0,134217726,0,0,0,0]
function mback1(px,pos){
  px.pos = mbackpos(px, pos);
  return true;
}

function mback3(px,pos,tree){
  px.pos = mbackpos(px, pos);
  px.tree = tree;
  return true;
}

function or1(px,pe,pe2){
  var pos = px.pos;
  return pe(px) || mback1(px,pos) && pe2(px);
}

function or3(px,pe,pe2){
  var pos = px.pos;
  var tree = px.tree;
  return pe(px) || mback3(px,pos,tree) && pe2(px);
}

function many1(px,pe){
  var pos = px.pos;
  while(pe(px)) {
    pos = px.pos;
  }
  return mback1(px,pos);
}

function many3(px,pe){
  var pos = px.pos;
  var tree = px.tree;
  while(pe(px)) {
    pos = px.pos;
    tree = px.tree;
  }
  return mback3(px,pos,tree);
}

function manychar(px,bm){
  while(bits32(bm,px.inputs[px.pos])) {
    px.pos = px.pos + 1;
  }
  return true;
}

function mtree(px,tag,spos,epos){
  px.tree = new ctree(tag,px.inputs,spos,epos,px.tree);
  return true;
}

function mlink(px,tag,child,prev){
  px.tree = new clink(tag,child,prev);
  return true;
}

function newtree(px,spos,pe,tag,epos){
  var pos = px.pos;
  px.tree = EmptyTree;
  return pe(px) && mtree(px,tag,pos + spos,px.pos + epos);
}

function linktree(px,tag,pe){
  var tree = px.tree;
  return pe(px) && mlink(px,tag,px.tree,tree);
}

function tagtree(px,tag){
  return mlink(px,tag,EmptyTree,px.tree);
}

function e15(px){
  return px.inputs[px.pos++] == 44 && manychar(px,bs0);
}

function e17(px){
  return px.inputs[px.pos++] == 91 && manychar(px,bs0);
}

function e6(px){
  return newtree(px,0,(p26) => p26.inputs[p26.pos++] == 110 && p26.inputs[p26.pos++] == 117 && p26.inputs[p26.pos++] == 108 && p26.inputs[p26.pos++] == 108 && tagtree(p26,"Null"),EmptyTag,0) && manychar(px,bs0);
}

function e7(px){
  return newtree(px,0,(p27) => p27.inputs[p27.pos++] == 116 && p27.inputs[p27.pos++] == 114 && p27.inputs[p27.pos++] == 117 && p27.inputs[p27.pos++] == 101 && tagtree(p27,"True"),EmptyTag,0) && manychar(px,bs0);
}

function e8(px){
  return newtree(px,0,(p28) => p28.inputs[p28.pos++] == 102 && p28.inputs[p28.pos++] == 97 && p28.inputs[p28.pos++] == 108 && p28.inputs[p28.pos++] == 115 && p28.inputs[p28.pos++] == 101 && tagtree(p28,"False"),EmptyTag,0) && manychar(px,bs0);
}

function e19(px){
  return bits32(bs6,px.inputs[px.pos++]) && manychar(px,bs6);
}

function e9(px){
  return px.inputs[px.pos++] == 79 && px.inputs[px.pos++] == 98 && px.inputs[px.pos++] == 106 && px.inputs[px.pos++] == 101 && px.inputs[px.pos++] == 99 && px.inputs[px.pos++] == 116 && px.inputs[px.pos++] == 73 && px.inputs[px.pos++] == 100 && px.inputs[px.pos++] == 40 && px.inputs[px.pos++] == 34 && newtree(px,0,(p29) => e19(p29) && tagtree(p29,"ObjectId"),EmptyTag,0) && px.inputs[px.pos++] == 34 && px.inputs[px.pos++] == 41;
}

function e2(px){
  return px.inputs[px.pos++] == 34 && newtree(px,0,(p11) => many1(p11,(p10) => or1(p10,(p6) => p6.inputs[p6.pos++] == 92 && p6.inputs[p6.pos++] == 34,(p9) => or1(p9,(p7) => p7.inputs[p7.pos++] == 92 && p7.inputs[p7.pos++] == 92,(p8) => bits32(bs1,p8.inputs[p8.pos++])))) && tagtree(p11,"String"),EmptyTag,0) && px.inputs[px.pos++] == 34 && manychar(px,bs0);
}

function e11(px){
  return px.inputs[px.pos++] == 46 && bits32(bs3,px.inputs[px.pos++]) && manychar(px,bs3);
}

function e10(px){
  return or1(px,(p30) => p30.inputs[p30.pos++] == 48,(p31) => bits32(bs2,p31.inputs[p31.pos++]) && manychar(p31,bs3));
}

function e12(px){
  return bits32(bs4,px.inputs[px.pos++]) && or1(px,(p32) => bits32(bs5,p32.inputs[p32.pos++]),(p33) => true) && bits32(bs3,px.inputs[px.pos++]) && manychar(px,bs3);
}

function e3(px){
  return newtree(px,0,(p17) => or1(p17,(p12) => p12.inputs[p12.pos++] == 45,(p13) => true) && e10(p17) && or3(p17,(p15) => e11(p15) && or1(p15,e12,(p14) => true) && tagtree(p15,"Float"),(p16) => true && tagtree(p16,"Integer")),EmptyTag,0) && manychar(px,bs0);
}

function e13(px){
  return px.inputs[px.pos++] == 123 && manychar(px,bs0);
}

function e20(px){
  return px.inputs[px.pos++] == 58 && manychar(px,bs0);
}

function e14(px){
  return newtree(px,0,(p34) => linktree(p34,"key",e2) && e20(p34) && linktree(p34,"value",e1) && tagtree(p34,"Member"),EmptyTag,0);
}

function e16(px){
  return px.inputs[px.pos++] == 125 && manychar(px,bs0);
}

function e4(px){
  return newtree(px,0,(p21) => e13(p21) && or3(p21,(p19) => linktree(p19,"_",e14) && many3(p19,(p18) => e15(p18) && linktree(p18,"_",e14)),(p20) => true) && e16(p21) && tagtree(p21,"Object"),EmptyTag,0);
}

function e1(px){
  return or3(px,e2,(p5) => or3(p5,e3,(p4) => or3(p4,e4,(p3) => or3(p3,e5,(p2) => or3(p2,e6,(p1) => or3(p1,e7,(p0) => or3(p0,e8,e9)))))));
}

function e18(px){
  return px.inputs[px.pos++] == 93 && manychar(px,bs0);
}

function e5(px){
  return newtree(px,0,(p25) => e17(p25) && or3(p25,(p23) => linktree(p23,"",e1) && many3(p23,(p22) => e15(p22) && linktree(p22,"",e1)),(p24) => true) && e18(p25) && tagtree(p25,"List"),EmptyTag,0);
}

function e0(px){
  return manychar(px,bs0) && e1(px) && manychar(px,bs0) && !(px.pos < px.length);
}

function parseJSON(inputs,length){
  var px = new ParserContext(inputs,length,memolen);
  if(e0(px)){
    if(px.tree == null){
      return new ctree(EmptyTag, inputs, 0, px.pos, null);
    }
    return px.tree;
  }
  return new ctree("[error]", inputs, 0, px.headpos, null);
}

// var fs = require('fs');

// (function main(){
//     for(var i = 2;i < process.argv.length;i++){
//       var inputs = fs.readFileSync('./' + process.argv[i]);
//       console.time('timer1');
//       var result = parse(inputs,inputs.length-1);
//       console.timeEnd('timer1');
//       console.log(result.toString());
//       //以下の関数を使うとObjectの中身まで見れますがxmark10.xmlみたいな大きなファイルの場合にコンソールが凍ります。
//       //console.dir(JSON.stringify(result));
//     }
// })();
    
