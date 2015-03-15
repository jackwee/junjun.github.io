
/**
  @title{helloworld}
  @description
  初始化colorbox库，得到colorbox句柄。
*/
var colorbox = initColorbox();

/**
  @description
  创建一个500*500的@class[Stage]{舞台}。
  @bold{舞台负责管理了舞台上所有精灵的结构组织、渲染以及交互。}
*/
var myStage = colorbox.Stage.create({
  width:500,
  height:500
});

/**
  @description
  创建hello world @class[Text]{文本精灵},并且设置其相关属性。
*/
var text = colorbox.Text.create({
  text:"hello world!!!",
  fillStyle:{r: 0, g: 0, b: 255},
  font:{
    size:30
  },
  x:200,
  y:200
});

/**
  @description
  将hello world文本精灵加入到舞台上。
  @bold{精灵只有被加入到舞台才能被显示出来。}
*/
myStage.add(text);


/**
  @description
  创建@class[Circle]{圆形精灵},并且设置其相关属性。
*/
var circle = colorbox.Circle.create({
  radius:30,
  fillStyle:{r: 255, g: 0, b: 0},
  x:300,
  y:300
});

/**
  @description
  将圆形精灵加入到舞台上。
*/
myStage.add(circle);


