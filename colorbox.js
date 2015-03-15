function initColorbox(){
var __modules__ = {};
var colorbox;
__modules__["/camera/topcamera.js"] = function(require, load, export$) {
var Klass = require("../lib/colortraits").Klass;
var Trait = require("../lib/colortraits").Trait;
var compose = require("../lib/colortraits").compose;
var TransformableTrait = require("../lib/transformable").TransformableTrait;
var TimeStamper = require("../lib/timestamp").TimeStamper;
var geometry = require("../lib/geometry");


var displayObjs = [];
/**
@section{概述}
顶视角观察世界。
view决定了用什么样的方法、视角观察世界，可以正着看，斜着看，看世界的某一部分等。
*/

function compareFun(displayObj1, displayObj2)
{
  return displayObj1.viewMatrix().tz - displayObj2.viewMatrix().tz;
}

/**
@itrait[TopCameraTrait]{
  @compose[(TransformableTrait)]{}
  顶视角视图的基本的功能单元
}
*/

var TopCameraTrait = compose([TransformableTrait], {
  __init : function()
  {
    this.subTraits(0).__init(TimeStamper.create());
  },

  getPstnRelativeToMatrix:function(viewPstn, matrix)
  {
    var mat = geometry.matrixInvert(geometry.matrixMultiply(this.matrix(), matrix));

    return geometry.pointApplyMatrix(viewPstn, mat);
  },
/**
@method[compareMatrix #:hidden]{
  @trait[TopCameraTrait]  
  @param[matrix1 object]{
  坐标矩阵1
  }
  @param[matrix2 object]{
  坐标矩阵2
  }
  @return[number]{>0表示 matrix2 更近, =0表示远近值相同, <0表示 matrix1 更近。}
  比较两个matrix的远近.即z轴上坐标比较。
}
*/
  compareMatrix : function(matrix1, matrix2)
  {
    if (matrix1.tz == undefined || matrix2.tz == undefined)
      return 0;

    return matrix2.tz - matrix1.tz;
  },
/**
@method[draw #:hidden]{
  @trait[TopCameraTrait]
  @param[painter object]{
  绘制器
  }
  @param[scene object]{
  场景
  }
  @return[undefined]{}
  用传入的渲染器painter重绘screen，如果开启脏矩形管理则不会绘制全部screen
}
*/
  draw:function(painter, scene)
  {
    var ctx = painter.getContext("2d");
    var mat = this.matrix();
    var bIdentity = geometry.isIdentityMatrix(mat);

    ctx.save();

    if(!bIdentity)
      ctx.setTransform(mat.a, mat.b, mat.c, mat.d, mat.tx, mat.ty);    

    displayObjs.length = 0;
    var dirtyrect = scene.emitDisplayObjects(displayObjs);
    var len = displayObjs.length;
    this.updateViewMatrix(displayObjs);    

    if(dirtyrect !== null){
      this.dirtyRectToBounding(dirtyrect);
      this.filterDisplayObjects(dirtyrect);

      if(displayObjs.length != 0){
        ctx.beginPath();
        ctx.rect(dirtyrect.x, dirtyrect.y, dirtyrect.width, dirtyrect.height);
        ctx.closePath();
        ctx.clip();
        ctx.clearRect(dirtyrect.x, dirtyrect.y, dirtyrect.width, dirtyrect.height);    
        
      } 
      scene.clearminBoundingDirtyRect();
    }

    displayObjs.sort(compareFun);
    for(var i = 0, len = displayObjs.length; i < len; ++i )
    {
      displayObjs[i].draw(painter);
      
    }

    ctx.restore();

    if(painter.sketchpad().requestPaint)
      painter.sketchpad().requestPaint();
  },
/**
@method[getGameToViewMatrix #:hidden]{
  @trait[TopCameraTrait] 
  @return[object]{matrix}
  返回游戏坐标系到view坐标系的转换矩阵      
}
*/
  getGameToViewMatrix : function()
  {
    return this.matrix();
  },
/**
@method[updateViewMatrix #:hidden]{
  @trait[TopCameraTrait] 
  @param[pidgets array]{
  显示对象构成的数组
  }
  @return[undefined]{}
  更新所有显示对象上的viewMatirx      
}
*/
  updateViewMatrix : function(pidgets)
  {
    var camaraMat = this.matrix();
    var bIdentity = geometry.isIdentityMatrix(camaraMat);
    var len = pidgets.length;
    var pidget, viewMat;

    for(var i = 0; i < len; ++i )
    {
      pidget = pidgets[i];
      if(bIdentity)
      {
        viewMat = geometry.matrixMultiply(pidget.worldMatrix(), pidget.gprim().matrix());
      }
      else
      {
        viewMat = geometry.matrixMultiply(pidget.worldMatrix(), pidget.gprim().matrix());
        geometry.matrixMultiplyBy(viewMat, camaraMat);
      }
      pidgets[i].setviewMatrix(viewMat);
    }
  },
/**
@method[filterDisplayObjects #:hidden]{
  @trait[TopCameraTrait]
  @param[rect object]{
  脏的矩形对象
  }
  @return[undefined]{}
  用输入的脏矩形过来显示列表。  
}
*/
  filterDisplayObjects: function(rect)
  {
    if(rect.x == undefined || rect.y == undefined || rect.width == undefined || rect.height == undefined){
      displayObjs.length = 0;
      return;
    }
    var tempdisplay = [];
    for(var j = 0, len = displayObjs.length; j < len; ++j)
    {
      var gprimbbox = displayObjs[j].gprim().bbox();
      var matrix = displayObjs[j].worldMatrix();
      var camaraMat = this.matrix();
      var viewMat = geometry.matrixMultiply(camaraMat, matrix);
      geometry.rectApplyByMatrixToBoundRect(gprimbbox, viewMat);

      if(geometry.boundRectOverlap(gprimbbox, rect)){
        tempdisplay.push(displayObjs[j]);
      }
    }

    displayObjs = tempdisplay; //数据处理错误，明天改

  },
/**
@method[dirtyRectToBounding #:hidden]{
  @trait[TopCameraTrait]
  @param[rect object]{
  脏矩形对象。
  }
  @return[undefined]{}
  将脏矩形应用于camera的视角矩阵。
}
*/
  dirtyRectToBounding : function(rect)
  { 
    var camaraMat = this.matrix();
    var bIdentity = geometry.isIdentityMatrix(camaraMat);
    if(!bIdentity)
    {
      geometry.rectApplyByMatrixToBoundRect(rect, camaraMat);
    }                                                                                                                                     
  }
}, []);


/**
@iclass[TopCamera Klass (TopCameraTrait)]{
  顶视角视图类}
*/

var TopCamera = Klass.extend({
  initialize : function()
  {
    this.subTraits(0).__init();
  }
}, [], [TopCameraTrait]);

export$({
  TopCameraTrait : TopCameraTrait,
  TopCamera : TopCamera
});
};
__modules__["/selection/selectionutil.js"] = function(require, load, export$) {


/**
* @function[findFirst]{
* 按照指定查询深度，深度遍历给定node的孩子节点，找出第一个满足谓词函数的孩子节点（不包括当前节点）。
* @param[node @type[TreeActor]]{
*   所要查找的节点。
* }
* @param[predicate function]{
*   (node) -> boolean;
*   用于检测节点谓词函数。
* }
* @param[dep number]{
*   查询深度，默认为INFINITY，查询整棵树。
* }
* @param[isRude boolean]{
*   暴力查找，说明predicate是boolean型，为了提高性能，要求该参数由外部传入。
* }
* @return[Array]{
*   由第一个满足条件的节点组成的数组（最多有一个元素）。
* }
* }
* 
*/

function findFirst(actor,predicate,dep,isRude){
  if(dep <= 0){
    return [];
  }


  var children = actor.children();
  for (var i = 0; i < children.length; i++) {
    //rude select
    if(isRude){
      return predicate ? [children[0]] : [];
    }

    //function select
    if(predicate(children[i])){
      return [children[i]];
    }else{
      var subTreeResult = findFirst(children[i],predicate,dep-1);
      if(subTreeResult.length === 1){
        return subTreeResult;
      }else{
        continue;
      }
    }
  };
  return [];
}

/**
  * @function[findAll]{
  * 按照指定查询深度，深度遍历给定node的孩子节点，找出所有满足谓词函数的孩子节点（不包括当前节点）。
  * @param[node @type[TreeActor]]{
  *   所要查找的节点。
  * }
  * @param[predicate function]{
  *   (node) -> boolean;
  *   用于检测节点谓词函数。
  * }
  * @param[dep number]{
  *   查询深度，默认为INFINITY，查询整棵树。
  * }
  * @param[isRude boolean]{
  *   暴力查找，说明predicate是boolean型，为了提高性能，要求该参数由外部传入。
  * }
  * @return[Array]{
  *   由所有满足条件的节点组成的数组。
  * }
  * }
  * 
  */
function findAll(actor,predicate,dep,isRude){
  var result = [];
  if(dep <= 0){
    return result;
  }

  var children = actor.children();
  for (var i = 0; i < children.length; i++) {
    //rude select
    if(isRude){
      predicate && result.push(children[i]);      
    }else{
      //function select
      if(predicate(children[i])){
        result.push(children[i]);
      }
    }
    
    var subTreeResult = findAll(children[i],predicate,dep-1,isRude);
    result.concat(subTreeResult);      
  };
  return result;

}



export$({
  findFirst:findFirst,
  findAll:findAll
})

};
__modules__["/sprites/composite.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits");
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;
var Sprite = require("./sprite");
var CompositeTrait = require("../gprims/compositegprim").CompositeTrait;


/**
@title{Composite}
*/

/**
@iclass[Composite Sprite (CompositeTrait)]{
  组合精灵，它可以将多个精灵图元组合为一个精灵整体。
  @grant[CompositeTrait type #:attr 'READONLY]
  @grantMany[CompositeTrait lineWidth gprims ratioAnchor anchor strokeStyle strokeFlag id tag fillFlag fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineCap lineJoin miterLimit]
  @constructor[Composite]{
    @param[param object]{
      @verbatim|{
        初始化参数对象包含的属性可以为：
        id:id值。
        tag:tag标签。
        gprims: array, 需要组合的gprim。
        fillStyle：整个文本的fillStyle。如果styles中设置，则以styles为先。
        strokeStyle：整个文本的strokStyle。如果styles中设置，则以styles为先。
        x:精灵的x坐标。
        y:精灵的y坐标。
        z:精灵的z坐标。
        ratioAnchor: 百分比设置锚点。
        anchor：锚点。
        lineWidth、 strokeFlag、 fillFlag、 shadowColor、shadowBlur、shadowOffsetX、shadowOffsetY、lineCap、lineJoin、miterLimit
      }|
    }
  }
}
**/
var Composite = Sprite.extend({
  initialize: function(param)
  {
    this.execProto("initialize", {gprim:this, interactable:((param == undefined) ? undefined : param.interactable)});
    this.subTraits(0).__init(param);
  }
},
[[READONLY("type"), CompositeTrait.grant("type")], [CUSTOM_SETTER("lineWidth"), CompositeTrait.grant("lineWidth")],
  [CUSTOM_SETTER("gprims"), CompositeTrait.grant("gprims")], [CUSTOM_SETTER("strokeStyle"), CompositeTrait.grant("strokeStyle")],
  [CUSTOM_SETTER("fillStyle"), CompositeTrait.grant("fillStyle")], [CUSTOM_SETTER("shadowColor"), CompositeTrait.grant("shadowColor")]].concat(CompositeTrait.grantMany(["fillFlag", "strokeFlag", "id", "tag", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineCap", "lineJoin", "miterLimit", "lineDash"])),
[CompositeTrait]);

export$(Composite);
};
__modules__["/stage.js"] = function(require, load, export$) {
var WorldTrait = require("world").WorldTrait;
var objectDotCreate = require("./lib/util").objectDotCreate;
var Klass = require("./lib/colortraits").Klass;
var assert = require("./lib/debug").assert;

/**
@title{Stage}
@iclass[Stage Klass (WorldTrait)]{
  @constructor[Stage]{
    @param[par object]{创建Stage所需的参数.}
    Stage的构造函数，当创建stage的参数中既指定了container又指定了width和height时,内部创建的canvas大小以container的宽高优先。
  }

  @bold{1、}Stage负责舞台上所有精灵的场景组织、渲染及交互派发。

  @bold{2、}Stage上可以添加任意类型的sprite。

  @bold{3、}sprite之间默认用树状结构组织。

  @jscode{
    //创建一个100*100的stage，并且canvas的父节点是div。
    Stage.create({
      width:100,
      height:100,
      container:div
    });
  }
}
*/

var Stage = Klass.extend({
  initialize : function(par)
  {
    var newParam = objectDotCreate(par);
    newParam.bubbling = true;
    newParam.autorepaint = true;

    var container = par.container;
    if(container){
      var width = par.width ? par.width :(container.offsetWidth ? container.offsetWidth : 0);
      var height = par.height ? par.height :(container.offsetHeight ? container.offsetHeight : 0);
      
      if(!width|| !height)
      {
        assert(false, "bad container width height");
      }
      else
      {
        newParam.width = width;
        newParam.height = height;
      }
    }

    this.execProto("initialize", newParam);
    this.subTraits(0).__init(newParam);
  }
}, {}, [WorldTrait]);

export$({
  Stage : Stage
});
};
__modules__["/thirdlib/rx/rx.time.js"] = function(require, load, export$) {
// Copyright (c) Microsoft Open Technologies, Inc. All rights reserved. See License.txt in the project root for license information.

(function (root, factory) {
    var freeExports = typeof exports == 'object' && exports,
        freeModule = typeof module == 'object' && module && module.exports == freeExports && module,
        freeGlobal = typeof global == 'object' && global;
    if (freeGlobal.global === freeGlobal) {
        window = freeGlobal;
    }

    // Because of build optimizers
    if (typeof define === 'function' && define.amd) {
        define(['rx', 'exports'], function (Rx, exports) {
            root.Rx = factory(root, exports, Rx);
            return root.Rx;
        });
    } else if (typeof module === 'object' && module && module.exports === freeExports) {
        module.exports = factory(root, module.exports, require('./rx'));
    } else {
        root.Rx = factory(root, {}, root.Rx);
    }
}(this, function (global, exp, Rx, undefined) {
    
    // Refernces
    var Observable = Rx.Observable,
        observableProto = Observable.prototype,
        AnonymousObservable = Rx.Internals.AnonymousObservable,
        observableDefer = Observable.defer,
        observableEmpty = Observable.empty,
        observableThrow = Observable.throwException,
        observableFromArray = Observable.fromArray,
        timeoutScheduler = Rx.Scheduler.timeout,
        SingleAssignmentDisposable = Rx.SingleAssignmentDisposable,
        SerialDisposable = Rx.SerialDisposable,
        CompositeDisposable = Rx.CompositeDisposable,
        RefCountDisposable = Rx.RefCountDisposable,
        Subject = Rx.Subject,
        BinaryObserver = Rx.Internals.BinaryObserver,
        addRef = Rx.Internals.addRef,
        normalizeTime = Rx.Scheduler.normalize;

    function observableTimerDate(dueTime, scheduler) {
        return new AnonymousObservable(function (observer) {
            return scheduler.scheduleWithAbsolute(dueTime, function () {
                observer.onNext(0);
                observer.onCompleted();
            });
        });
    }

    function observableTimerDateAndPeriod(dueTime, period, scheduler) {
        var p = normalizeTime(period);
        return new AnonymousObservable(function (observer) {
            var count = 0, d = dueTime;
            return scheduler.scheduleRecursiveWithAbsolute(d, function (self) {
                var now;
                if (p > 0) {
                    now = scheduler.now();
                    d = d + p;
                    if (d <= now) {
                        d = now + p;
                    }
                }
                observer.onNext(count++);
                self(d);
            });
        });
    }

    function observableTimerTimeSpan(dueTime, scheduler) {
        var d = normalizeTime(dueTime);
        return new AnonymousObservable(function (observer) {
            return scheduler.scheduleWithRelative(d, function () {
                observer.onNext(0);
                observer.onCompleted();
            });
        });
    }

    function observableTimerTimeSpanAndPeriod(dueTime, period, scheduler) {
        if (dueTime === period) {
            return new AnonymousObservable(function (observer) {
                return scheduler.schedulePeriodicWithState(0, period, function (count) {
                    observer.onNext(count);
                    return count + 1;
                });
            });
        }
        return observableDefer(function () {
            return observableTimerDateAndPeriod(scheduler.now() + dueTime, period, scheduler);
        });
    }

    /**
     *  Returns an observable sequence that produces a value after each period.
     *  
     * @example
     *  1 - res = Rx.Observable.interval(1000);
     *  2 - res = Rx.Observable.interval(1000, Rx.Scheduler.timeout);
     *      
     * @static
     * @memberOf Observable
     * @param {Number} period Period for producing the values in the resulting sequence (specified as an integer denoting milliseconds).
     * @param {Scheduler} [scheduler] Scheduler to run the timer on. If not specified, Rx.Scheduler.timeout is used.
     * @returns {Observable} An observable sequence that produces a value after each period.
     */
    var observableinterval = Observable.interval = function (period, scheduler) {
        scheduler || (scheduler = timeoutScheduler);
        return observableTimerTimeSpanAndPeriod(period, period, scheduler);
    };

    /**
     *  Returns an observable sequence that produces a value after dueTime has elapsed and then after each period.
     *  
     * @example
     *  1 - res = Rx.Observable.timer(new Date());
     *  2 - res = Rx.Observable.timer(new Date(), 1000);
     *  3 - res = Rx.Observable.timer(new Date(), Rx.Scheduler.timeout);
     *  4 - res = Rx.Observable.timer(new Date(), 1000, Rx.Scheduler.timeout);
     *  
     *  5 - res = Rx.Observable.timer(5000);
     *  6 - res = Rx.Observable.timer(5000, 1000);
     *  7 - res = Rx.Observable.timer(5000, Rx.Scheduler.timeout);
     *  8 - res = Rx.Observable.timer(5000, 1000, Rx.Scheduler.timeout);
     *  
     * @static
     * @memberOf Observable 
     * @param {Number} dueTime Absolute (specified as a Date object) or relative time (specified as an integer denoting milliseconds) at which to produce the first value.
     * @param {Mixed} [periodOrScheduler]  Period to produce subsequent values (specified as an integer denoting milliseconds), or the scheduler to run the timer on. If not specified, the resulting timer is not recurring.
     * @param {Scheduler} [scheduler]  Scheduler to run the timer on. If not specified, the timeout scheduler is used.
     * @returns {Observable} An observable sequence that produces a value after due time has elapsed and then each period.
     */
    var observableTimer = Observable.timer = function (dueTime, periodOrScheduler, scheduler) {
        var period;
        scheduler || (scheduler = timeoutScheduler);
        if (periodOrScheduler !== undefined && typeof periodOrScheduler === 'number') {
            period = periodOrScheduler;
        } else if (periodOrScheduler !== undefined && typeof periodOrScheduler === 'object') {
            scheduler = periodOrScheduler;
        }
        if (dueTime instanceof Date && period === undefined) {
            return observableTimerDate(dueTime.getTime(), scheduler);
        }
        if (dueTime instanceof Date && period !== undefined) {
            period = periodOrScheduler;
            return observableTimerDateAndPeriod(dueTime.getTime(), period, scheduler);
        }
        if (period === undefined) {
            return observableTimerTimeSpan(dueTime, scheduler);
        }
        return observableTimerTimeSpanAndPeriod(dueTime, period, scheduler);
    };

    function observableDelayTimeSpan(dueTime, scheduler) {
        var source = this;
        return new AnonymousObservable(function (observer) {
            var active = false,
                cancelable = new SerialDisposable(),
                exception = null,
                q = [],
                running = false,
                subscription;
            subscription = source.materialize().timestamp(scheduler).subscribe(function (notification) {
                var d, shouldRun;
                if (notification.value.kind === 'E') {
                    q = [];
                    q.push(notification);
                    exception = notification.value.exception;
                    shouldRun = !running;
                } else {
                    q.push({ value: notification.value, timestamp: notification.timestamp + dueTime });
                    shouldRun = !active;
                    active = true;
                }
                if (shouldRun) {
                    if (exception !== null) {
                        observer.onError(exception);
                    } else {
                        d = new SingleAssignmentDisposable();
                        cancelable.disposable(d);
                        d.disposable(scheduler.scheduleRecursiveWithRelative(dueTime, function (self) {
                            var e, recurseDueTime, result, shouldRecurse;
                            if (exception !== null) {
                                return;
                            }
                            running = true;
                            do {
                                result = null;
                                if (q.length > 0 && q[0].timestamp - scheduler.now() <= 0) {
                                    result = q.shift().value;
                                }
                                if (result !== null) {
                                    result.accept(observer);
                                }
                            } while (result !== null);
                            shouldRecurse = false;
                            recurseDueTime = 0;
                            if (q.length > 0) {
                                shouldRecurse = true;
                                recurseDueTime = Math.max(0, q[0].timestamp - scheduler.now());
                            } else {
                                active = false;
                            }
                            e = exception;
                            running = false;
                            if (e !== null) {
                                observer.onError(e);
                            } else if (shouldRecurse) {
                                self(recurseDueTime);
                            }
                        }));
                    }
                }
            });
            return new CompositeDisposable(subscription, cancelable);
        });
    }

    function observableDelayDate(dueTime, scheduler) {
        var self = this;
        return observableDefer(function () {
            var timeSpan = dueTime - scheduler.now();
            return observableDelayTimeSpan.call(self, timeSpan, scheduler);
        });
    }

    /**
     *  Time shifts the observable sequence by dueTime. The relative time intervals between the values are preserved.
     *  
     * @example
     *  1 - res = Rx.Observable.timer(new Date());
     *  2 - res = Rx.Observable.timer(new Date(), Rx.Scheduler.timeout);
     *  
     *  3 - res = Rx.Observable.delay(5000);
     *  4 - res = Rx.Observable.delay(5000, 1000, Rx.Scheduler.timeout);
     * @memberOf Observable#
     * @param {Number} dueTime Absolute (specified as a Date object) or relative time (specified as an integer denoting milliseconds) by which to shift the observable sequence.
     * @param {Scheduler} [scheduler] Scheduler to run the delay timers on. If not specified, the timeout scheduler is used.
     * @returns {Observable} Time-shifted sequence.
     */
    observableProto.delay = function (dueTime, scheduler) {
        scheduler || (scheduler = timeoutScheduler);
        return dueTime instanceof Date ?
            observableDelayDate.call(this, dueTime.getTime(), scheduler) :
            observableDelayTimeSpan.call(this, dueTime, scheduler);
    };

    /**
     *  Ignores values from an observable sequence which are followed by another value before dueTime.
     *  
     * @example
     *  1 - res = source.throttle(5000); // 5 seconds
     *  2 - res = source.throttle(5000, scheduler);        
     * 
     * @memberOf Observable
     * @param {Number} dueTime Duration of the throttle period for each value (specified as an integer denoting milliseconds).
     * @param {Scheduler} [scheduler]  Scheduler to run the throttle timers on. If not specified, the timeout scheduler is used.
     * @returns {Observable} The throttled sequence.
     */
    observableProto.throttle = function (dueTime, scheduler) {
        scheduler || (scheduler = timeoutScheduler);
        var source = this;
        return new AnonymousObservable(function (observer) {
            var cancelable = new SerialDisposable(), hasvalue = false, id = 0, subscription, value = null;
            subscription = source.subscribe(function (x) {
                var currentId, d;
                hasvalue = true;
                value = x;
                id++;
                currentId = id;
                d = new SingleAssignmentDisposable();
                cancelable.disposable(d);
                d.disposable(scheduler.scheduleWithRelative(dueTime, function () {
                    if (hasvalue && id === currentId) {
                        observer.onNext(value);
                    }
                    hasvalue = false;
                }));
            }, function (exception) {
                cancelable.dispose();
                observer.onError(exception);
                hasvalue = false;
                id++;
            }, function () {
                cancelable.dispose();
                if (hasvalue) {
                    observer.onNext(value);
                }
                observer.onCompleted();
                hasvalue = false;
                id++;
            });
            return new CompositeDisposable(subscription, cancelable);
        });
    };

    /**
     *  Projects each element of an observable sequence into zero or more windows which are produced based on timing information.
     *  
     * @example
     *  1 - res = xs.windowWithTime(1000, scheduler); // non-overlapping segments of 1 second
     *  2 - res = xs.windowWithTime(1000, 500 , scheduler); // segments of 1 second with time shift 0.5 seconds
     *      
     * @memberOf Observable#
     * @param {Number} timeSpan Length of each window (specified as an integer denoting milliseconds).
     * @param {Mixed} [timeShiftOrScheduler]  Interval between creation of consecutive windows (specified as an integer denoting milliseconds), or an optional scheduler parameter. If not specified, the time shift corresponds to the timeSpan parameter, resulting in non-overlapping adjacent windows.
     * @param {Scheduler} [scheduler]  Scheduler to run windowing timers on. If not specified, the timeout scheduler is used.
     * @returns {Observable} An observable sequence of windows.
     */
    observableProto.windowWithTime = function (timeSpan, timeShiftOrScheduler, scheduler) {
        var source = this, timeShift;
        if (timeShiftOrScheduler === undefined) {
            timeShift = timeSpan;
        }
        if (scheduler === undefined) {
            scheduler = timeoutScheduler;
        }
        if (typeof timeShiftOrScheduler === 'number') {
            timeShift = timeShiftOrScheduler;
        } else if (typeof timeShiftOrScheduler === 'object') {
            timeShift = timeSpan;
            scheduler = timeShiftOrScheduler;
        }
        return new AnonymousObservable(function (observer) {
            var createTimer,
                groupDisposable,
                nextShift = timeShift,
                nextSpan = timeSpan,
                q = [],
                refCountDisposable,
                timerD = new SerialDisposable(),
                totalTime = 0;
            groupDisposable = new CompositeDisposable(timerD);
            refCountDisposable = new RefCountDisposable(groupDisposable);
            createTimer = function () {
                var isShift, isSpan, m, newTotalTime, ts;
                m = new SingleAssignmentDisposable();
                timerD.disposable(m);
                isSpan = false;
                isShift = false;
                if (nextSpan === nextShift) {
                    isSpan = true;
                    isShift = true;
                } else if (nextSpan < nextShift) {
                    isSpan = true;
                } else {
                    isShift = true;
                }
                newTotalTime = isSpan ? nextSpan : nextShift;
                ts = newTotalTime - totalTime;
                totalTime = newTotalTime;
                if (isSpan) {
                    nextSpan += timeShift;
                }
                if (isShift) {
                    nextShift += timeShift;
                }
                m.disposable(scheduler.scheduleWithRelative(ts, function () {
                    var s;
                    if (isShift) {
                        s = new Subject();
                        q.push(s);
                        observer.onNext(addRef(s, refCountDisposable));
                    }
                    if (isSpan) {
                        s = q.shift();
                        s.onCompleted();
                    }
                    createTimer();
                }));
            };
            q.push(new Subject());
            observer.onNext(addRef(q[0], refCountDisposable));
            createTimer();
            groupDisposable.add(source.subscribe(function (x) {
                var i, s;
                for (i = 0; i < q.length; i++) {
                    s = q[i];
                    s.onNext(x);
                }
            }, function (e) {
                var i, s;
                for (i = 0; i < q.length; i++) {
                    s = q[i];
                    s.onError(e);
                }
                observer.onError(e);
            }, function () {
                var i, s;
                for (i = 0; i < q.length; i++) {
                    s = q[i];
                    s.onCompleted();
                }
                observer.onCompleted();
            }));
            return refCountDisposable;
        });
    };

    /**
     *  Projects each element of an observable sequence into a window that is completed when either it's full or a given amount of time has elapsed.
     *  @example
     *  1 - res = source.windowWithTimeOrCount(5000, 50); // 5s or 50 items
     *  2 - res = source.windowWithTimeOrCount(5000, 50, scheduler); //5s or 50 items
     *      
     * @memberOf Observable#
     * @param {Number} timeSpan Maximum time length of a window.
     * @param {Number} count Maximum element count of a window.
     * @param {Scheduler} [scheduler]  Scheduler to run windowing timers on. If not specified, the timeout scheduler is used.
     * @returns {Observable} An observable sequence of windows.
     */
    observableProto.windowWithTimeOrCount = function (timeSpan, count, scheduler) {
        var source = this;
        scheduler || (scheduler = timeoutScheduler);
        return new AnonymousObservable(function (observer) {
            var createTimer,
                groupDisposable,
                n = 0,
                refCountDisposable,
                s,
                timerD = new SerialDisposable(),
                windowId = 0;
            groupDisposable = new CompositeDisposable(timerD);
            refCountDisposable = new RefCountDisposable(groupDisposable);
            createTimer = function (id) {
                var m = new SingleAssignmentDisposable();
                timerD.disposable(m);
                m.disposable(scheduler.scheduleWithRelative(timeSpan, function () {
                    var newId;
                    if (id !== windowId) {
                        return;
                    }
                    n = 0;
                    newId = ++windowId;
                    s.onCompleted();
                    s = new Subject();
                    observer.onNext(addRef(s, refCountDisposable));
                    createTimer(newId);
                }));
            };
            s = new Subject();
            observer.onNext(addRef(s, refCountDisposable));
            createTimer(0);
            groupDisposable.add(source.subscribe(function (x) {
                var newId = 0, newWindow = false;
                s.onNext(x);
                n++;
                if (n === count) {
                    newWindow = true;
                    n = 0;
                    newId = ++windowId;
                    s.onCompleted();
                    s = new Subject();
                    observer.onNext(addRef(s, refCountDisposable));
                }
                if (newWindow) {
                    createTimer(newId);
                }
            }, function (e) {
                s.onError(e);
                observer.onError(e);
            }, function () {
                s.onCompleted();
                observer.onCompleted();
            }));
            return refCountDisposable;
        });
    };

    /**
     *  Projects each element of an observable sequence into zero or more buffers which are produced based on timing information.
     *  
     * @example
     *  1 - res = xs.bufferWithTime(1000, scheduler); // non-overlapping segments of 1 second
     *  2 - res = xs.bufferWithTime(1000, 500, scheduler; // segments of 1 second with time shift 0.5 seconds
     *      
     * @memberOf Observable#
     * @param {Number} timeSpan Length of each buffer (specified as an integer denoting milliseconds).
     * @param {Mixed} [timeShiftOrScheduler]  Interval between creation of consecutive buffers (specified as an integer denoting milliseconds), or an optional scheduler parameter. If not specified, the time shift corresponds to the timeSpan parameter, resulting in non-overlapping adjacent buffers.
     * @param {Scheduler} [scheduler]  Scheduler to run buffer timers on. If not specified, the timeout scheduler is used.
     * @returns {Observable} An observable sequence of buffers.
     */
    observableProto.bufferWithTime = function (timeSpan, timeShiftOrScheduler, scheduler) {
        var timeShift;
        if (timeShiftOrScheduler === undefined) {
            timeShift = timeSpan;
        }
        scheduler || (scheduler = timeoutScheduler);
        if (typeof timeShiftOrScheduler === 'number') {
            timeShift = timeShiftOrScheduler;
        } else if (typeof timeShiftOrScheduler === 'object') {
            timeShift = timeSpan;
            scheduler = timeShiftOrScheduler;
        }
        return this.windowWithTime(timeSpan, timeShift, scheduler).selectMany(function (x) {
            return x.toArray();
        });
    };

    /**
     *  Projects each element of an observable sequence into a buffer that is completed when either it's full or a given amount of time has elapsed.
     *  
     * @example
     *  1 - res = source.bufferWithTimeOrCount(5000, 50); // 5s or 50 items in an array 
     *  2 - res = source.bufferWithTimeOrCount(5000, 50, scheduler); // 5s or 50 items in an array
     *      
     * @memberOf Observable#
     * @param {Number} timeSpan Maximum time length of a buffer.
     * @param {Number} count Maximum element count of a buffer.
     * @param {Scheduler} [scheduler]  Scheduler to run bufferin timers on. If not specified, the timeout scheduler is used.
     * @returns {Observable} An observable sequence of buffers.
     */
    observableProto.bufferWithTimeOrCount = function (timeSpan, count, scheduler) {
        scheduler || (scheduler = timeoutScheduler);
        return this.windowWithTimeOrCount(timeSpan, count, scheduler).selectMany(function (x) {
            return x.toArray();
        });
    };

    /**
     *  Records the time interval between consecutive values in an observable sequence.
     *  
     * @example
     *  1 - res = source.timeInterval();
     *  2 - res = source.timeInterval(Rx.Scheduler.timeout);
     *      
     * @memberOf Observable#
     * @param [scheduler]  Scheduler used to compute time intervals. If not specified, the timeout scheduler is used.
     * @returns {Observable} An observable sequence with time interval information on values.
     */
    observableProto.timeInterval = function (scheduler) {
        var source = this;
        scheduler || (scheduler = timeoutScheduler);
        return observableDefer(function () {
            var last = scheduler.now();
            return source.select(function (x) {
                var now = scheduler.now(), span = now - last;
                last = now;
                return {
                    value: x,
                    interval: span
                };
            });
        });
    };

    /**
     *  Records the timestamp for each value in an observable sequence.
     *  
     * @example
     *  1 - res = source.timestamp(); // produces { value: x, timestamp: ts }
     *  2 - res = source.timestamp(Rx.Scheduler.timeout);
     *      
     * @memberOf Observable#
     * @param {Scheduler} [scheduler]  Scheduler used to compute timestamps. If not specified, the timeout scheduler is used.
     * @returns {Observable} An observable sequence with timestamp information on values.
     */
    observableProto.timestamp = function (scheduler) {
        scheduler || (scheduler = timeoutScheduler);
        return this.select(function (x) {
            return {
                value: x,
                timestamp: scheduler.now()
            };
        });
    };

    function sampleObservable(source, sampler) {
        
        return new AnonymousObservable(function (observer) {
            var atEnd, value, hasValue;

            function sampleSubscribe() {
                if (hasValue) {
                    hasValue = false;
                    observer.onNext(value);
                }
                if (atEnd) {
                    observer.onCompleted();
                }
            }

            return new CompositeDisposable(
                source.subscribe(function (newValue) {
                    hasValue = true;
                    value = newValue;
                }, observer.onError.bind(observer), function () {
                    atEnd = true;
                }),
                sampler.subscribe(sampleSubscribe, observer.onError.bind(observer), sampleSubscribe)
            );
        });
    }

    /**
     *  Samples the observable sequence at each interval.
     *  
     * @example
     *  1 - res = source.sample(sampleObservable); // Sampler tick sequence
     *  2 - res = source.sample(5000); // 5 seconds
     *  2 - res = source.sample(5000, Rx.Scheduler.timeout); // 5 seconds
     *      
     * @memberOf Observable#
     * @param {Mixed} intervalOrSampler Interval at which to sample (specified as an integer denoting milliseconds) or Sampler Observable.
     * @param {Scheduler} [scheduler]  Scheduler to run the sampling timer on. If not specified, the timeout scheduler is used.
     * @returns {Observable} Sampled observable sequence.
     */
    observableProto.sample = function (intervalOrSampler, scheduler) {
        scheduler || (scheduler = timeoutScheduler);
        if (typeof intervalOrSampler === 'number') {
            return sampleObservable(this, observableinterval(intervalOrSampler, scheduler));
        }
        return sampleObservable(this, intervalOrSampler);
    };

    /**
     *  Returns the source observable sequence or the other observable sequence if dueTime elapses.
     *  
     * @example
     *  1 - res = source.timeout(new Date()); // As a date
     *  2 - res = source.timeout(5000); // 5 seconds
     *  3 - res = source.timeout(new Date(), Rx.Observable.returnValue(42)); // As a date and timeout observable
     *  4 - res = source.timeout(5000, Rx.Observable.returnValue(42)); // 5 seconds and timeout observable
     *  5 - res = source.timeout(new Date(), Rx.Observable.returnValue(42), Rx.Scheduler.timeout); // As a date and timeout observable
     *  6 - res = source.timeout(5000, Rx.Observable.returnValue(42), Rx.Scheduler.timeout); // 5 seconds and timeout observable
     *      
     * @memberOf Observable#
     * @param {Number} dueTime Absolute (specified as a Date object) or relative time (specified as an integer denoting milliseconds) when a timeout occurs.
     * @param {Observable} [other]  Sequence to return in case of a timeout. If not specified, a timeout error throwing sequence will be used.
     * @param {Scheduler} [scheduler]  Scheduler to run the timeout timers on. If not specified, the timeout scheduler is used.
     * @returns {Observable} The source sequence switching to the other sequence in case of a timeout.
     */
    observableProto.timeout = function (dueTime, other, scheduler) {
        var schedulerMethod, source = this;
        other || (other = observableThrow(new Error('Timeout')));
        scheduler || (scheduler = timeoutScheduler);
        if (dueTime instanceof Date) {
            schedulerMethod = function (dt, action) {
                scheduler.scheduleWithAbsolute(dt, action);
            };
        } else {
            schedulerMethod = function (dt, action) {
                scheduler.scheduleWithRelative(dt, action);
            };
        }
        return new AnonymousObservable(function (observer) {
            var createTimer,
                id = 0,
                original = new SingleAssignmentDisposable(),
                subscription = new SerialDisposable(),
                switched = false,
                timer = new SerialDisposable();
            subscription.disposable(original);
            createTimer = function () {
                var myId = id;
                timer.disposable(schedulerMethod(dueTime, function () {
                    switched = id === myId;
                    var timerWins = switched;
                    if (timerWins) {
                        subscription.disposable(other.subscribe(observer));
                    }
                }));
            };
            createTimer();
            original.disposable(source.subscribe(function (x) {
                var onNextWins = !switched;
                if (onNextWins) {
                    id++;
                    observer.onNext(x);
                    createTimer();
                }
            }, function (e) {
                var onErrorWins = !switched;
                if (onErrorWins) {
                    id++;
                    observer.onError(e);
                }
            }, function () {
                var onCompletedWins = !switched;
                if (onCompletedWins) {
                    id++;
                    observer.onCompleted();
                }
            }));
            return new CompositeDisposable(subscription, timer);
        });
    };

    /**
     *  Generates an observable sequence by iterating a state from an initial state until the condition fails.
     *  
     * @example
     *  res = source.generateWithAbsoluteTime(0, 
     *      function (x) { return return true; }, 
     *      function (x) { return x + 1; }, 
     *      function (x) { return x; }, 
     *      function (x) { return new Date(); 
     *  });
     *      
     * @static
     * @memberOf Observable
     * @param {Mixed} initialState Initial state.
     * @param {Function} condition Condition to terminate generation (upon returning false).
     * @param {Function} iterate Iteration step function.
     * @param {Function} resultSelector Selector function for results produced in the sequence.
     * @param {Function} timeSelector Time selector function to control the speed of values being produced each iteration, returning Date values.
     * @param {Scheduler} [scheduler]  Scheduler on which to run the generator loop. If not specified, the timeout scheduler is used.
     * @returns {Observable} The generated sequence.
     */
    Observable.generateWithAbsoluteTime = function (initialState, condition, iterate, resultSelector, timeSelector, scheduler) {
        scheduler || (scheduler = timeoutScheduler);
        return new AnonymousObservable(function (observer) {
            var first = true,
                hasResult = false,
                result,
                state = initialState,
                time;
            return scheduler.scheduleRecursiveWithAbsolute(scheduler.now(), function (self) {
                if (hasResult) {
                    observer.onNext(result);
                }
                try {
                    if (first) {
                        first = false;
                    } else {
                        state = iterate(state);
                    }
                    hasResult = condition(state);
                    if (hasResult) {
                        result = resultSelector(state);
                        time = timeSelector(state);
                    }
                } catch (e) {
                    observer.onError(e);
                    return;
                }
                if (hasResult) {
                    self(time);
                } else {
                    observer.onCompleted();
                }
            });
        });
    };

    /**
     *  Generates an observable sequence by iterating a state from an initial state until the condition fails.
     * 
     * @example 
     *  res = source.generateWithRelativeTime(0, 
     *      function (x) { return return true; }, 
     *      function (x) { return x + 1; }, 
     *      function (x) { return x; }, 
     *      function (x) { return 500; }
     *  );
     *      
     * @static
     * @memberOf Observable
     * @param {Mixed} initialState Initial state.
     * @param {Function} condition Condition to terminate generation (upon returning false).
     * @param {Function} iterate Iteration step function.
     * @param {Function} resultSelector Selector function for results produced in the sequence.
     * @param {Function} timeSelector Time selector function to control the speed of values being produced each iteration, returning integer values denoting milliseconds.
     * @param {Scheduler} [scheduler]  Scheduler on which to run the generator loop. If not specified, the timeout scheduler is used.
     * @returns {Observable} The generated sequence.
     */
    Observable.generateWithRelativeTime = function (initialState, condition, iterate, resultSelector, timeSelector, scheduler) {
        scheduler || (scheduler = timeoutScheduler);
        return new AnonymousObservable(function (observer) {
            var first = true,
                hasResult = false,
                result,
                state = initialState,
                time;
            return scheduler.scheduleRecursiveWithRelative(0, function (self) {
                if (hasResult) {
                    observer.onNext(result);
                }
                try {
                    if (first) {
                        first = false;
                    } else {
                        state = iterate(state);
                    }
                    hasResult = condition(state);
                    if (hasResult) {
                        result = resultSelector(state);
                        time = timeSelector(state);
                    }
                } catch (e) {
                    observer.onError(e);
                    return;
                }
                if (hasResult) {
                    self(time);
                } else {
                    observer.onCompleted();
                }
            });
        });
    };

    /**
     *  Time shifts the observable sequence by delaying the subscription.
     *  
     * @example
     *  1 - res = source.delaySubscription(5000); // 5s
     *  2 - res = source.delaySubscription(5000, Rx.Scheduler.timeout); // 5 seconds
     *      
     * @memberOf Observable#
     * @param {Number} dueTime Absolute or relative time to perform the subscription at.
     * @param {Scheduler} [scheduler]  Scheduler to run the subscription delay timer on. If not specified, the timeout scheduler is used.
     * @returns {Observable} Time-shifted sequence.
     */
    observableProto.delaySubscription = function (dueTime, scheduler) {
        scheduler || (scheduler = timeoutScheduler);
        return this.delayWithSelector(observableTimer(dueTime, scheduler), function () { return observableEmpty(); });
    };

    /**
     *  Time shifts the observable sequence based on a subscription delay and a delay selector function for each element.
     *  
     * @example
     *  1 - res = source.delayWithSelector(function (x) { return Rx.Scheduler.timer(5000); }); // with selector only
     *  1 - res = source.delayWithSelector(Rx.Observable.timer(2000), function (x) { return Rx.Observable.timer(x); }); // with delay and selector
     *      
     * @memberOf Observable#
     * @param {Observable} [subscriptionDelay]  Sequence indicating the delay for the subscription to the source. 
     * @param {Function} delayDurationSelector Selector function to retrieve a sequence indicating the delay for each given element.
     * @returns {Observable} Time-shifted sequence.
     */
    observableProto.delayWithSelector = function (subscriptionDelay, delayDurationSelector) {
        var source = this, subDelay, selector;
        if (typeof subscriptionDelay === 'function') {
            selector = subscriptionDelay;
        } else {
            subDelay = subscriptionDelay;
            selector = delayDurationSelector;
        }
        return new AnonymousObservable(function (observer) {
            var delays = new CompositeDisposable(), atEnd = false, done = function () {
                if (atEnd && delays.length === 0) {
                    observer.onCompleted();
                }
            }, subscription = new SerialDisposable(), start = function () {
                subscription.setDisposable(source.subscribe(function (x) {
                    var delay;
                    try {
                        delay = selector(x);
                    } catch (error) {
                        observer.onError(error);
                        return;
                    }
                    var d = new SingleAssignmentDisposable();
                    delays.add(d);
                    d.setDisposable(delay.subscribe(function () {
                        observer.onNext(x);
                        delays.remove(d);
                        done();
                    }, observer.onError.bind(observer), function () {
                        observer.onNext(x);
                        delays.remove(d);
                        done();
                    }));
                }, observer.onError.bind(observer), function () {
                    atEnd = true;
                    subscription.dispose();
                    done();
                }));
            };

            if (!subDelay) {
                start();
            } else {
                subscription.setDisposable(subDelay.subscribe(function () {
                    start();
                }, observer.onError.bind(observer), function () { start(); }));
            }

            return new CompositeDisposable(subscription, delays);
        });
    };

    /**
     *  Returns the source observable sequence, switching to the other observable sequence if a timeout is signaled.
     *  
     * @example
     *  1 - res = source.timeoutWithSelector(Rx.Observable.timer(500)); 
     *  2 - res = source.timeoutWithSelector(Rx.Observable.timer(500), function (x) { return Rx.Observable.timer(200); });
     *  3 - res = source.timeoutWithSelector(Rx.Observable.timer(500), function (x) { return Rx.Observable.timer(200); }, Rx.Observable.returnValue(42));
     *      
     * @memberOf Observable#
     * @param {Observable} [firstTimeout]  Observable sequence that represents the timeout for the first element. If not provided, this defaults to Observable.never().
     * @param {Function} [timeoutDurationSelector] Selector to retrieve an observable sequence that represents the timeout between the current element and the next element.
     * @param {Observable} [other]  Sequence to return in case of a timeout. If not provided, this is set to Observable.throwException(). 
     * @returns {Observable} The source sequence switching to the other sequence in case of a timeout.
     */
    observableProto.timeoutWithSelector = function (firstTimeout, timeoutdurationSelector, other) {
        firstTimeout || (firstTimeout = observableNever());
        other || (other = observableThrow(new Error('Timeout')));
        var source = this;
        return new AnonymousObservable(function (observer) {
            var subscription = new SerialDisposable(), timer = new SerialDisposable(), original = new SingleAssignmentDisposable();

            subscription.setDisposable(original);

            var id = 0, switched = false, setTimer = function (timeout) {
                var myId = id, timerWins = function () {
                    return id === myId;
                };
                var d = new SingleAssignmentDisposable();
                timer.setDisposable(d);
                d.setDisposable(timeout.subscribe(function () {
                    if (timerWins()) {
                        subscription.setDisposable(other.subscribe(observer));
                    }
                    d.dispose();
                }, function (e) {
                    if (timerWins()) {
                        observer.onError(e);
                    }
                }, function () {
                    if (timerWins()) {
                        subscription.setDisposable(other.subscribe(observer));
                    }
                }));
            };

            setTimer(firstTimeout);
            var observerWins = function () {
                var res = !switched;
                if (res) {
                    id++;
                }
                return res;
            };

            original.setDisposable(source.subscribe(function (x) {
                if (observerWins()) {
                    observer.onNext(x);
                    var timeout;
                    try {
                        timeout = timeoutdurationSelector(x);
                    } catch (e) {
                        observer.onError(e);
                        return;
                    }
                    setTimer(timeout);
                }
            }, function (e) {
                if (observerWins()) {
                    observer.onError(e);
                }
            }, function () {
                if (observerWins()) {
                    observer.onCompleted();
                }
            }));
            return new CompositeDisposable(subscription, timer);
        });
    };

    /**
     *  Ignores values from an observable sequence which are followed by another value within a computed throttle duration.
     *  
     * @example
     *  1 - res = source.delayWithSelector(function (x) { return Rx.Scheduler.timer(x + x); }); 
     * 
     * @memberOf Observable#
     * @param {Function} throttleDurationSelector Selector function to retrieve a sequence indicating the throttle duration for each given element.
     * @returns {Observable} The throttled sequence.
     */
    observableProto.throttleWithSelector = function (throttleDurationSelector) {
        var source = this;
        return new AnonymousObservable(function (observer) {
            var value, hasValue = false, cancelable = new SerialDisposable(), id = 0, subscription = source.subscribe(function (x) {
                var throttle;
                try {
                    throttle = throttleDurationSelector(x);
                } catch (e) {
                    observer.onError(e);
                    return;
                }
                hasValue = true;
                value = x;
                id++;
                var currentid = id, d = new SingleAssignmentDisposable();
                cancelable.setDisposable(d);
                d.setDisposable(throttle.subscribe(function () {
                    if (hasValue && id === currentid) {
                        observer.onNext(value);
                    }
                    hasValue = false;
                    d.dispose();
                }, observer.onError.bind(observer), function () {
                    if (hasValue && id === currentid) {
                        observer.onNext(value);
                    }
                    hasValue = false;
                    d.dispose();
                }));
            }, function (e) {
                cancelable.dispose();
                observer.onError(e);
                hasValue = false;
                id++;
            }, function () {
                cancelable.dispose();
                if (hasValue) {
                    observer.onNext(value);
                }
                observer.onCompleted();
                hasValue = false;
                id++;
            });
            return new CompositeDisposable(subscription, cancelable);
        });
    };

    /**
     *  Skips elements for the specified duration from the end of the observable source sequence, using the specified scheduler to run timers.
     *  
     *  1 - res = source.skipLastWithTime(5000);     
     *  2 - res = source.skipLastWithTime(5000, scheduler); 
     *      
     * @description
     *  This operator accumulates a queue with a length enough to store elements received during the initial duration window.
     *  As more elements are received, elements older than the specified duration are taken from the queue and produced on the
     *  result sequence. This causes elements to be delayed with duration.          
     * @memberOf Observable#
     * @param {Number} duration Duration for skipping elements from the end of the sequence.
     * @param {Scheduler} [scheduler]  Scheduler to run the timer on. If not specified, defaults to Rx.Scheduler.timeout
     * @returns {Observable} An observable sequence with the elements skipped during the specified duration from the end of the source sequence.
     */
    observableProto.skipLastWithTime = function (duration, scheduler) {
        scheduler || (scheduler = timeoutScheduler);
        var source = this;
        return new AnonymousObservable(function (observer) {
            var q = [];
            return source.subscribe(function (x) {
                var now = scheduler.now();
                q.push({ interval: now, value: x });
                while (q.length > 0 && now - q[0].interval >= duration) {
                    observer.onNext(q.shift().value);
                }
            }, observer.onError.bind(observer), function () {
                var now = scheduler.now();
                while (q.length > 0 && now - q[0].interval >= duration) {
                    observer.onNext(q.shift().value);
                }
                observer.onCompleted();
            });
        });
    };

    /**
     *  Returns elements within the specified duration from the end of the observable source sequence, using the specified schedulers to run timers and to drain the collected elements.
     *  
     * @example
     *  1 - res = source.takeLastWithTime(5000, [optional timer scheduler], [optional loop scheduler]); 
     * @description
     *  This operator accumulates a queue with a length enough to store elements received during the initial duration window.
     *  As more elements are received, elements older than the specified duration are taken from the queue and produced on the
     *  result sequence. This causes elements to be delayed with duration.    
     * @memberOf Observable#
     * @param {Number} duration Duration for taking elements from the end of the sequence.
     * @param {Scheduler} [timerScheduler]  Scheduler to run the timer on. If not specified, defaults to Rx.Scheduler.timeout.
     * @param {Scheduler} [loopScheduler]  Scheduler to drain the collected elements. If not specified, defaults to Rx.Scheduler.immediate.
     * @returns {Observable} An observable sequence with the elements taken during the specified duration from the end of the source sequence.
     */
    observableProto.takeLastWithTime = function (duration, timerScheduler, loopScheduler) {
        return this.takeLastBufferWithTime(duration, timerScheduler).selectMany(function (xs) { return observableFromArray(xs, loopScheduler); });
    };

    /**
     *  Returns an array with the elements within the specified duration from the end of the observable source sequence, using the specified scheduler to run timers.
     *  
     * @example
     *  1 - res = source.takeLastBufferWithTime(5000, [optional scheduler]); 
     * @description
     *  This operator accumulates a queue with a length enough to store elements received during the initial duration window.
     *  As more elements are received, elements older than the specified duration are taken from the queue and produced on the
     *  result sequence. This causes elements to be delayed with duration.   
     * @memberOf Observable#
     * @param {Number} duration Duration for taking elements from the end of the sequence.
     * @param {Scheduler} scheduler Scheduler to run the timer on. If not specified, defaults to Rx.Scheduler.timeout.
     * @returns {Observable} An observable sequence containing a single array with the elements taken during the specified duration from the end of the source sequence.
     */
    observableProto.takeLastBufferWithTime = function (duration, scheduler) {
        var source = this;
        scheduler || (scheduler = timeoutScheduler);
        return new AnonymousObservable(function (observer) {
            var q = [];

            return source.subscribe(function (x) {
                var now = scheduler.now();
                q.push({ interval: now, value: x });
                while (q.length > 0 && now - q[0].interval >= duration) {
                    q.shift();
                }
            }, observer.onError.bind(observer), function () {
                var now = scheduler.now(), res = [];
                while (q.length > 0) {
                    var next = q.shift();
                    if (now - next.interval <= duration) {
                        res.push(next.value);
                    }
                }

                observer.onNext(res);
                observer.onCompleted();
            });
        });
    };

    /**
     *  Takes elements for the specified duration from the start of the observable source sequence, using the specified scheduler to run timers.
     *  
     * @example
     *  1 - res = source.takeWithTime(5000,  [optional scheduler]); 
     * @description
     *  This operator accumulates a queue with a length enough to store elements received during the initial duration window.
     *  As more elements are received, elements older than the specified duration are taken from the queue and produced on the
     *  result sequence. This causes elements to be delayed with duration.    
     * @memberOf Observable#
     * @param {Number} duration Duration for taking elements from the start of the sequence.
     * @param {Scheduler} scheduler Scheduler to run the timer on. If not specified, defaults to Rx.Scheduler.timeout.
     * @returns {Observable} An observable sequence with the elements taken during the specified duration from the start of the source sequence.
     */
    observableProto.takeWithTime = function (duration, scheduler) {
        var source = this;
        scheduler || (scheduler = timeoutScheduler);
        return new AnonymousObservable(function (observer) {
            var t = scheduler.scheduleWithRelative(duration, function () {
                observer.onCompleted();
            });

            return new CompositeDisposable(t, source.subscribe(observer));
        });
    };

    /**
     *  Skips elements for the specified duration from the start of the observable source sequence, using the specified scheduler to run timers.
     *  
     * @example
     *  1 - res = source.skipWithTime(5000, [optional scheduler]); 
     *  
     * @description     
     *  Specifying a zero value for duration doesn't guarantee no elements will be dropped from the start of the source sequence.
     *  This is a side-effect of the asynchrony introduced by the scheduler, where the action that causes callbacks from the source sequence to be forwarded
     *  may not execute immediately, despite the zero due time.
     *  
     *  Errors produced by the source sequence are always forwarded to the result sequence, even if the error occurs before the duration.     
     * @memberOf Observable#     
     * @param {Number} duration Duration for skipping elements from the start of the sequence.
     * @param {Scheduler} scheduler Scheduler to run the timer on. If not specified, defaults to Rx.Scheduler.timeout.
     * @returns {Observable} An observable sequence with the elements skipped during the specified duration from the start of the source sequence.
     */
    observableProto.skipWithTime = function (duration, scheduler) {
        var source = this;
        scheduler || (scheduler = timeoutScheduler);
        return new AnonymousObservable(function (observer) {
            var open = false,
                t = scheduler.scheduleWithRelative(duration, function () { open = true; }),
                d = source.subscribe(function (x) {
                    if (open) {
                        observer.onNext(x);
                    }
                }, observer.onError.bind(observer), observer.onCompleted.bind(observer));

            return new CompositeDisposable(t, d);
        });
    };

    /**
     *  Skips elements from the observable source sequence until the specified start time, using the specified scheduler to run timers.
     *  Errors produced by the source sequence are always forwarded to the result sequence, even if the error occurs before the start time>.
     *  
     * @examples
     *  1 - res = source.skipUntilWithTime(new Date(), [optional scheduler]);         
     * @memberOf Obseravble#
     * @param startTime Time to start taking elements from the source sequence. If this value is less than or equal to Date(), no elements will be skipped.
     * @param scheduler Scheduler to run the timer on. If not specified, defaults to Rx.Scheduler.timeout.
     * @returns {Observable} An observable sequence with the elements skipped until the specified start time. 
     */
    observableProto.skipUntilWithTime = function (startTime, scheduler) {
        scheduler || (scheduler = timeoutScheduler);
        var source = this;
        return new AnonymousObservable(function (observer) {
            var open = false,
                t = scheduler.scheduleWithAbsolute(startTime, function () { open = true; }),
                d = source.subscribe(function (x) {
                    if (open) {
                        observer.onNext(x);
                    }
                }, observer.onError.bind(observer), observer.onCompleted.bind(observer));

            return new CompositeDisposable(t, d);
        });
    };

    /**
     *  Takes elements for the specified duration until the specified end time, using the specified scheduler to run timers.
     *  
     * @example
     *  1 - res = source.takeUntilWithTime(new Date(), [optional scheduler]);   
     * @memberOf Observable#   
     * @param {Number} endTime Time to stop taking elements from the source sequence. If this value is less than or equal to new Date(), the result stream will complete immediately.
     * @param {Scheduler} scheduler Scheduler to run the timer on.
     * @returns {Observable} An observable sequence with the elements taken until the specified end time.
     */
    observableProto.takeUntilWithTime = function (endTime, scheduler) {
        scheduler || (scheduler = timeoutScheduler);
        var source = this;
        return new AnonymousObservable(function (observer) {
            return new CompositeDisposable(scheduler.scheduleWithAbsolute(endTime, function () {
                observer.onCompleted();
            }),  source.subscribe(observer));
        });
    };

    return Rx;
}));
};
__modules__["/sprites/container.js"] = function(require, load, export$) {
var TreeActor = require("../treeactor").TreeActor;

/**
@title{ContainerSprite}
*/

/**
@iclass[ContainerSprite TreeActor ]{
  容器精灵，该精灵没有显示对象，但可以被加到场景中，也可以添加 sprite 孩子。

  该容器可以作为冒泡接收精灵，当 receiveBubble 参数为true时，表示它可以接收冒泡消息，否则不接收。
}
**/
var ContainerSprite = TreeActor.extend({
  initialize : function(receiveBubble)
  {
    this.execProto("initialize");
    if(receiveBubble != undefined)
      this.setreceiveBubble(receiveBubble);
    else
      this.setreceiveBubble(false);
  },

  emitDisplayObjects : function()
  {

  },

  emitInteractiveObjects : function()
  {

  },
  
  emitInteractiveObjects : function()
  {

  },
  enableAutoRepaint: function()
  {
    
  }
}, ["receiveBubble"]);

export$(ContainerSprite);
};
__modules__["/lib/winding.js"] = function(require, load, export$) {
var geo = require("./geometry");

var SkScalarMul = function(a, b)
{
  return a*b;
}
var SkScalarSignAsInt = function(x)
{
  return (x < 0) ? -1 : ((x > 0) ? 1 : 0);
}
/**
@function[winding_line]{
  @param[pts array]{
  [{x: y: }, {x: y:}]，直线两个点构成的数组
  }
  @param[x float]{
  检测点的横坐标
  }
  @param[y float]{
  监测点的纵所标
  }
  @return[int]{}
  方法检测一个点的一条射线穿过一条线段的方式。
  返回up to down 1; down to up -1, 不穿过0
}
*/

function winding_line(pts, x, y) {
  var x0 = pts[0].x;
  var y0 = pts[0].y;
  var x1 = pts[1].x;
  var y1 = pts[1].y;

  var dy = y1 - y0;

  var dir = 1;
  if (y0 > y1) {
      //SkTSwap(y0, y1);互换
      var temp = y0;
      y0 = y1;
      y1 = temp;
      dir = -1;
  }
  if (y < y0 || y >= y1) {
      return 0;
  }

  var cross = SkScalarMul(x1 - x0, y - pts[0].y) - SkScalarMul(dy, x - pts[0].x);

  if (SkScalarSignAsInt(cross) == dir) {
      dir = 0;
  }
  return dir;
}

/////////////////////////////////////////////////////
var is_mono_quad = function(y0, y1, y2) {
  //    return SkScalarSignAsInt(y0 - y1) + SkScalarSignAsInt(y1 - y2) != 0;
  if (y0 == y1) {
      return true;
  }
  if (y0 < y1) {
      return y1 <= y2;
  } else {
      return y1 >= y2;
  }
}
var SkScalarDiv = function(a, b)
{
  return a/b;
}  
var SkScalarIsNaN = function(x)
{
  return x!=x;
} 
var SkScalarSqrt = function(x)
{
  return Math.sqrt(x);
}
var SkScalarAve = function(a, b)
{
  return (a + b)/2;
}
var SkScalarMulAdd = function(a, b, c)
{
  return a*b+c;
}
var valid_unit_divide = function(numer, denom, ratio) {
    //assert(ratio);

    if (numer < 0) {
        numer = -numer;
        denom = -denom;
    }

    if (denom == 0 || numer == 0 || numer >= denom) {
        return 0;
    }

    var r = SkScalarDiv(numer, denom);
    if (SkScalarIsNaN(r)) {
        return 0;
    }
    //assert(r >= 0 && r < 1);
    if ( r <= 0 || r>= 1) { // catch underflow if numer <<<< denom
        return 0;
    }
    ratio.push(r);
    return 1;
}
/*  From Numerical Recipes in C.

  Q = -1/2 (B + sign(B) sqrt[B*B - 4*A*C])
  x1 = Q / A
  x2 = C / Q
*/
//我们方法和此方法不一样在于，我们的方法是真的求一元二次方程的根，而这里包含了贝塞尔曲线的根是[0-1]
var SkFindUnitQuadRoots = function(A, B, C, roots) {
  if (A == 0) {
      return valid_unit_divide(-C, B, roots);
  }

  var R = B*B - 4*A*C;
  if (R < 0 || SkScalarIsNaN(R)) {  // complex roots
      return 0;
  }
  R = SkScalarSqrt(R);
  var r = 0;

  var Q = (B < 0) ? -(B-R)/2 : -(B+R)/2;
  r += valid_unit_divide(Q, A, roots);
  r += valid_unit_divide(C, Q, roots);
  //表示有两个根
  if (r == 2) {
      if (roots[0] > roots[1]){
        var temp = roots[0];
        roots[0] = roots[1];
        roots[1] = temp;
      }
      else if (roots[0] == roots[1])  // nearly-equal?
          r -= 1; // skip the double root
  }
  return r;
}
var winding_mono_quad = function(pts, x, y) {
  var y0 = pts[0].y;
  var y2 = pts[2].y;

  var dir = 1;
  if (y0 > y2) {
      var temp = y0;
      y0 = y2;
      y2 = temp;
      dir = -1;
  }
  if (y < y0 || y >= y2) {
      return 0;
  }

  // bounds check on X (not required. is it faster?)
  // if (pts[0].fX > x && pts[1].fX > x && pts[2].fX > x) {
  //     return 0;
  // }

  var roots = [];

  var n = SkFindUnitQuadRoots(pts[0].y - 2 * pts[1].y + pts[2].y,
                              2 * (pts[1].y - pts[0].y),
                              pts[0].y - y,
                              roots);
  //assert(n <= 1);
  var xt;
  if (0 == n) {
      var mid = SkScalarAve(y0, y2);
      // Need [0] and [2] if dir == 1
      // and  [2] and [0] if dir == -1
      //xt = y < mid ? pts[1 - dir].x : pts[dir - 1].x;
      xt = y < mid ? pts[1 - dir].x : pts[dir + 1].x;
  } else {
      var t = roots[0];
      var C = pts[0].x;
      var A = pts[2].x - 2 * pts[1].x + C;
      var B = 2 * (pts[1].x - C);
      xt = SkScalarMulAdd(SkScalarMulAdd(A, t, B), t, C);
  }
  if((dir == 1 && x == pts[2].x && y == pts[2].y) || (dir == -1 && x == pts[0].x && y == pts[0].y)){
    return 0;
  } 
  return xt <= x ? dir : 0;
  
}
////////////////

/*  If defined, this makes eval_quad and eval_cubic do more setup (sometimes
    involving integer multiplies by 2 or 3, but fewer calls to SkScalarMul.
    May also introduce overflow of fixed when we compute our setup.
*/

////////////////////////////////////////////////////////////////////////

var is_not_monotonic = function(a, b, c) {
  var ab = a - b;
  var bc = b - c;
  if (ab < 0) {
      bc = -bc;
  }
  return ab == 0 || bc < 0;
}

 /*  Linearly interpolate between A and B, based on t.
    If t is 0, return A
    If t is 1, return B
    else interpolate.
    t must be [0..SK_Scalar1]
*/
var SkScalarInterp = function(A, B, t) {
  //SkASSERT(t >= 0 && t <= SK_Scalar1);
  return A + (B - A) * t;
}

var interp_quad_coords_x = function(src, dst, t) {
  var ab = SkScalarInterp(src[0].x, src[1].x, t);
  var bc = SkScalarInterp(src[1].x, src[2].x, t);

  dst[0].x = src[0].x;
  dst[1].x = ab;
  dst[2].x = SkScalarInterp(ab, bc, t);
  dst[3].x = bc;
  dst[4].x = src[2].x;
}
var interp_quad_coords_y = function(src, dst, t) {
  var ab = SkScalarInterp(src[0].y, src[1].y, t);
  var bc = SkScalarInterp(src[1].y, src[2].y, t);

  dst[0].y = src[0].y;
  dst[1].y = ab;
  dst[2].y = SkScalarInterp(ab, bc, t);
  dst[3].y = bc;
  dst[4].y = src[2].y;
}

var SkChopQuadAt = function(src, dst, t) {
    // SkASSERT(t > 0 && t < SK_Scalar1);

    interp_quad_coords_x(src, dst, t);
    interp_quad_coords_y(src, dst, t);
}
var flatten_double_quad_extrema = function(coords) {
  coords[1].y = coords[3].y = coords[2].y;
}
var SkScalarAbs = function(x)
{
  return Math.abs(x);
}
/*   Returns 0 for 1 quad, and 1 for two quads, either way the answer is
 stored in dst[]. Guarantees that the 1/2 quads will be monotonic.
 */
var SkChopQuadAtYExtrema = function(src, dst) {
  var a = src[0].y;
  var b = src[1].y;
  var c = src[2].y;

  if (is_not_monotonic(a, b, c)) {
      var tValue  = [];
      if (valid_unit_divide(a - b, a - b - b + c, tValue)) {
          SkChopQuadAt(src, dst, tValue[0]);
          flatten_double_quad_extrema(dst);
          return 1;
      }
      // if we get here, we need to force dst to be monotonic, even though
      // we couldn't compute a unit_divide value (probably underflow).
      b = SkScalarAbs(a - b) < SkScalarAbs(b - c) ? a : c;
  }
  dst[0].x = src[0].x;
  dst[0].y = a;
  dst[1].x = src[1].x;
  dst[1].y = b;
  dst[2].x = src[2].x;
  dst[2].y = c;
  return 0;
}
/**
@function[winding_quad]{
  @param[pts array]{[{x: y: }, {x: y:}, {x: ,y:}]二次贝塞尔曲线三个控制点构成的数组}
  @param[x float]{检测点的横坐标}
  @param[y float]{监测点的纵所标}
  @return[int]{}
  方法检测一个点的一条射线穿过一条二次贝塞尔曲线的点的方式。
  返回up to down 1; down to up -1, 不穿过0
}
*/
function winding_quad(pts, x, y) {  
  var n = 0; //t的拐点个数初始化

  if (!is_mono_quad(pts[0].y, pts[1].y, pts[2].y)) {
    var dst = [{}, {}, {}, {}, {}]; //有些是二次是需要切割的
    n = SkChopQuadAtYExtrema(pts, dst);
    pts = dst;
  }
  var w = winding_mono_quad(pts, x, y);
  if (n > 0) {
    //这里表示被切割成两段了，然后需要后面的那组新的段数
    pts.splice(0, 2);
    w += winding_mono_quad(pts, x, y);
  }
  return w;
}

//////////////////////////////////////
/*  Cubic'(t) = At^2 + Bt + C, where
    A = 3(-a + 3(b - c) + d)
    B = 6(a - 2b + c)
    C = 3(b - a)
    Solve for t, keeping only those that fit betwee 0 < t < 1
*/
var SkFindCubicExtrema = function(a, b, c, d, tValues) {
  // we divide A,B,C by 3 to simplify
  var A = d - a + 3*(b - c);
  var B = 2*(a - b - b + c);
  var C = b - a;

  return SkFindUnitQuadRoots(A, B, C, tValues);
}

var interp_cubic_coords_x = function(src, dst, t) 
{
  var ab = SkScalarInterp(src[0].x, src[1].x, t);
  var bc = SkScalarInterp(src[1].x, src[2].x, t);
  var cd = SkScalarInterp(src[2].x, src[3].x, t);
  var abc = SkScalarInterp(ab, bc, t);
  var bcd = SkScalarInterp(bc, cd, t);
  var abcd = SkScalarInterp(abc, bcd, t);

  dst[0].x = src[0].x;
  dst[1].x = ab;
  dst[2].x = abc;
  dst[3].x = abcd;
  dst[4].x = bcd;
  dst[5].x = cd;
  dst[6].x = src[3].x;
}
var interp_cubic_coords_y = function(src, dst, t) 
{
  var ab = SkScalarInterp(src[0].y, src[1].y, t);
  var bc = SkScalarInterp(src[1].y, src[2].y, t);
  var cd = SkScalarInterp(src[2].y, src[3].y, t);
  var abc = SkScalarInterp(ab, bc, t);
  var bcd = SkScalarInterp(bc, cd, t);
  var abcd = SkScalarInterp(abc, bcd, t);

  dst[0].y = src[0].y;
  dst[1].y = ab;
  dst[2].y = abc;
  dst[3].y = abcd;
  dst[4].y = bcd;
  dst[5].y = cd;
  dst[6].y = src[3].y;
}
var SkChopCubicAt = function(src, dst, t) {
  if(!(t > 0 && t < 1)){
    debugger;
  }
  interp_cubic_coords_x(src, dst, t);
  interp_cubic_coords_y(src, dst, t);
}
var flatten_double_cubic_extrema1 = function(coords) {
  coords[2].y = coords[4].y = coords[3].y;
}
var flatten_double_cubic_extrema2 = function(coords) {
  coords[5].y = coords[7].y = coords[6].y;
}
var SkChopCubicAt4 = function(src, dst, tValues, roots) 
{
  /*if(!(tValues[0] > 0 && tValues[0] < 1 && tValues[1] > 0 && tValues[1] < 1 && tValues[0] < tValues[1])){
    debugger;
  }*/
  if (dst) {
    if (roots == 0) { // nothing to chop
      for(var i = 0, length = src.length; i<length; i++){
        dst[i] = src[i];
      }
    } else {
      var t = [];
      t[0] = tValues[0];
      var tmp = []; //4      

      for (var i = 0; i < roots; i++) {
        var tempdst = [{}, {}, {}, {}, {}, {}, {}];
        SkChopCubicAt(src, tempdst, t[0]);
        for(var j = 0, length = tempdst.length; j < length; j++){
          dst[i*3 + j] = tempdst[j];
        }

        if (i == roots - 1) {
          break;
        }
        tmp = tempdst.slice(3, 7);

        // have src point to the remaining cubic (after the chop)
        src = tmp;
        tempdst = tempdst.splice(0, 3);

        // watch out in case the renormalized t isn't in range
        t = [];
        if (!valid_unit_divide(tValues[i+1] - tValues[i],
                               1 - tValues[i], t)) {
            // if we can't, just create a degenerate cubic
            dst[7] = dst[8] = dst[9] = src[3];
            break;
        }
      }
    }
  }
}
/*  Given 4 points on a cubic bezier, chop it into 1, 2, 3 beziers such that
    the resulting beziers are monotonic in Y. This is called by the scan
    converter.  Depending on what is returned, dst[] is treated as follows:
    0   dst[0..3] is the original cubic
    1   dst[0..3] and dst[3..6] are the two new cubics
    2   dst[0..3], dst[3..6], dst[6..9] are the three new cubics
    If dst == null, it is ignored and only the count is returned.
*/
var SkChopCubicAtYExtrema = function(src, dst) {
  var tValues = [];
  var roots = SkFindCubicExtrema(src[0].y, src[1].y, src[2].y, src[3].y, tValues); //roots表示的是根的个数

  SkChopCubicAt4(src, dst, tValues, roots);
  if (dst && (roots > 0)) {
      // we do some cleanup to ensure our Y extrema are flat
      flatten_double_cubic_extrema1(dst);
      if (roots == 2) {
          flatten_double_cubic_extrema2(dst);
      }
  }
  return roots;
}/////////////
var SkMaxScalar = function(a, b) { return a > b ? a : b; }
var SkMinScalar = function(a, b) { return a < b ? a : b; }
var find_minmax = function(pts, minPtr, maxPtr) {
  var min, max;
  min = max = pts[0].x;
  for (var i = 1; i < 4; ++i) {
      min = SkMinScalar(min, pts[i].x);
      max = SkMaxScalar(max, pts[i].x);
  }
  minPtr[0] = min;
  maxPtr[0] = max;
}
var eval_cubic_coeff = function(A, B, C, D, t) {
    return SkScalarMulAdd(SkScalarMulAdd(SkScalarMulAdd(A, t, B), t, C), t, D);
}
/*   Given 4 cubic points (either Xs or Ys), and a target X or Y, compute the
 t value such that cubic(t) = target
 */
var chopMonoCubicAt = function(c0, c1, c2, c3, target, t) {
  //   SkASSERT(c0 <= c1 && c1 <= c2 && c2 <= c3);
  if(!(c0 < target && target < c3)){
    //debugger;
  }

  var D = c0 - target;
  var A = c3 + 3*(c1 - c2) - c0;
  var B = 3*(c2 - c1 - c1 + c0);
  var C = 3*(c1 - c0);

  var TOLERANCE = 1 / 4096;
  var minT = 0;
  var maxT = 1;
  var mid;
  var i;
  for (i = 0; i < 16; i++) {
      mid = SkScalarAve(minT, maxT);
      var delta = eval_cubic_coeff(A, B, C, D, mid);
      if (delta < 0) {
          minT = mid;
          delta = -delta;
      } else {
          maxT = mid;
      }
      if (delta < TOLERANCE) {
          break;
      }
  }
  t[0] = mid;
}
var eval_cubic_pts = function(c0, c1, c2, c3, t) 
{
  var A = c3 + 3*(c1 - c2) - c0;
  var B = 3*(c2 - c1 - c1 + c0);
  var C = 3*(c1 - c0);
  var D = c0;
  return eval_cubic_coeff(A, B, C, D, t);
}

var winding_mono_cubic = function(pts, x, y) {
  var p0 = pts[0];
  var p3 = pts[3];

  var storage = [];

  var dir = 1;
  if (pts[0].y > pts[3].y) {
      storage[0] = pts[3];
      storage[1] = pts[2];
      storage[2] = pts[1];
      storage[3] = pts[0];
      pts = storage;
      dir = -1;
  }
  if (y < pts[0].y || y >= pts[3].y) {
      return 0;
  }

  // quickreject or quickaccept
  var min = [], max = [];
  find_minmax(pts, min, max);
  if (x < min[0]) {
      return 0;
  }
  if (x > max[0]) {
      return dir;
  }

  // compute the actual x(t) value
  var t = [];
  chopMonoCubicAt(pts[0].y, pts[1].y, pts[2].y, pts[3].y, y, t);
  var xt = eval_cubic_pts(pts[0].x, pts[1].x, pts[2].x, pts[3].x, t[0]);

  if(dir == 1 && x ==  p3.x && y ==  p3.y || dir == -1 && x ==  p0.x && y ==  p0.y)
    return 0;
  return xt <= x ? dir : 0;
}

/**
@function[winding_cubic]{
  @param[pts array]{
  [{x: y: }, {x: y:},{x: y: }, {x: y:}]三次贝塞尔曲线四个控制点构成的数组
  }
  @param[x float]{
  检测点的横坐标
  }
  @param[y float]{
  监测点的纵所标
  }
  @return[int]{}
  方法检测一个点的一条射线穿过一条三次贝塞尔曲线的方式。
  返回up to down 1; down to up -1, 不穿过0
}
*/
function winding_cubic(pts, x, y) {
  var dst = [];
  //............这里是需要将其放在三次贝塞尔曲线中的，做缓存，然后增加性能？？？？？？？？
  //
  var n = SkChopCubicAtYExtrema(pts, dst);
  var w = 0;
  for (var i = 0; i <= n; ++i) {      
    w += winding_mono_cubic(dst, x, y);
    dst.splice(0, 3);
  }
  return w;
}

///////////////////////////////////////////////ellipse
var QuadraticRoots = function(a, b, c, roots)
{ 
  var n = 0; 
  if(a == 0){
    roots[0] = -c/b;
    n = 1;    
  }else {
    var delt=b*b-4*a*c;
    
    var x1 = undefined;
    var x2 = undefined;
    if(delt>0)
    {
      x1 = ((-b) + Math.sqrt(delt))/(2*a);
      x2 = ((-b) - Math.sqrt(delt))/(2*a);
      n = 2;                                    
    } else if (delt==0) {
      x1 = x2 = (-b)/(2*a);
      n = 1;
    }
    roots[0] = x1;
    roots[1] = x2;
  }
  return n; 
}
//是否在弧上
var positiveVector = {x: 1, y: 0};
//被认为是正的椭圆
var ispointInEllipseArc = function(pts, x, y)
{
  var mcos = x/pts[2];
  var msin = y/pts[3];
  var angle = geo.getVectorAngle(positiveVector, {x: mcos, y: msin});
  var detangle = pts[6] - pts[5];
  var detangle1 = angle - pts[5] ;

  detangle1 = Math.abs(detangle1) < 0.000001 ? 0 : detangle1;

  if(pts[7] && detangle1 > 0) {
    detangle1 = detangle1 - Math.PI*2;    
  }else if(!pts[7] && detangle1 < 0) {
    detangle1 = detangle1 + Math.PI*2
  }
  if(Math.abs(detangle1) == 0)
    return -1; //起点
  if(Math.abs(detangle1) == Math.abs(detangle))
    return 1; //末点
  if(Math.abs(detangle1) < Math.abs(detangle))
    return 2; //中间
  return 0;

/*   if(Math.abs(detangle1) <= Math.abs(detangle))
    return true;
  return false;*/
}

var FindEllipseArcRoots = function(pts, x, y)
{
  var w = 0;
  var rx = pts[2];
  var ry = pts[3];
  var matrix = geo.identityMatrix(); //
  geo.matrixTranslateBy(matrix, pts[0], pts[1]);
  geo.matrixRotateBy(matrix, pts[4]);    
  geo.matrixInvertBy(matrix);
  // //
  var newpoint = {x: x, y: y};
  geo.pointApplyByMatrix(newpoint, matrix);
  var newpoint1 = {x: x-1, y: y};
  geo.pointApplyByMatrix(newpoint1, matrix);
  var vector = {x: newpoint1.x - newpoint.x, y: newpoint1.y - newpoint.y};

  var A = ry*ry*vector.x*vector.x + rx*rx*vector.y*vector.y;
  var B = 2*ry*ry*newpoint.x*vector.x + 2*rx*rx*newpoint.y*vector.y;
  var C = ry*ry*newpoint.x*newpoint.x + rx*rx*newpoint.y*newpoint.y - rx*rx*ry*ry;

  var roots = [];
  var n = QuadraticRoots(A, B, C, roots);

  if(n == 1 && roots[0] !== 0)
    return 0;

  var temp = {};
  for(var i = 0; i < roots.length; i++)
  {
    if(roots[i] >= 0)
    {
      var inline_x = newpoint.x + roots[i]*vector.x;
      var inline_y = newpoint.y + roots[i]*vector.y;
      var bFlag = ispointInEllipseArc(pts, inline_x, inline_y);
      if(bFlag)
      {
        temp.flag = bFlag;
        temp.x = inline_x;
        temp.y = inline_y;
      }else{
        n = n - 1;
      }
    }else{
      n = n -1;
    }
  }

  if(n == 1)
  {
    var dx = -rx*temp.y/ry;
    var dy = ry*temp.x/rx;

    if(!pts[7]){
      dx = -dx;
      dy = -dy;
    }
    if(vector.x*dy - vector.y*dx > 0)
    {
      w += 1;
    }else if(vector.x*dy - vector.y*dx < 0){
      w -= 1;
    }else {
      if(newpoint.y < 0){
        if(temp.flag == 1)
          w -= 1;
        else if(temp.flag == -1)
          w += 1;
      }else if(newpoint.y > 0){
        return 0;
      }
    }

    if(temp.flag == -1 && w == -1){
      w += 1;
    }
    if(temp.flag == 1 && w == 1){
      w -= 1;
    }
  }

  return w; 
}

/**
@function[winding_ellipse]{
  @param[pts array]{
  [center_x, center_y, rx, ry, rotateangle = erfa, startangle = sita, endangle, rotateflag]椭圆弧曲线参数构成的数组
  }
  @param[x float]{
  检测点的横坐标
  }
  @param[y float]{
  监测点的纵所标
  }
  @return[int]{}
  方法检测一个点的一条向左射线穿过一条椭圆弧的交点方式。
  返回up to down 1; down to up -1, 不穿过0
}
*/
 /*如果是原点的坐标系的话，方程为
  x = rx*cos(erfa)*cos(sita) - ry*sin(erfa)*sin(sita);
  y = rx*sin(erfa)*cos(sita) + ry*cos(erfa)*sin(sita);
 实现方法为：当射线与弧线段相交两个点的时候，那么肯定这两个点是一上一下的，所以这里认为w为0
  如果相交的点为一个的化，四段弧的单调性是不会随着旋转而变换的，所以这里要计算的是*/
function winding_ellipse(pts, x, y) {
  //根是角度
  return FindEllipseArcRoots(pts, x, y);
}

var windingCounts = {
  "L": function(pts, x, y)
  {
    return winding_line(pts, x, y);
  },
  "Q": function(pts, x, y)
  {
    return winding_quad(pts, x, y);
  },
  "C": function(pts, x, y)
  {
    return winding_cubic(pts, x, y);
  },
  "A": function(pts, x, y)
  {
    return winding_ellipse(pts, x, y);
  },
  "Z": function(pts, x, y)
  {
    return winding_line(pts, x, y);
  }
}

/**
@function[isPointInPath]{
  @param[ls array]{
  pathgprim中的pathelements构成的数组
  }
  @param[x float]{
  检测点的横坐标
  }
  @param[y float]{
  监测点的纵所标
  }
  @return[boolean]{}
  检测一个点是否在一条封闭path路径的内部。
}
*/
function isPointInPath(ls, x, y)
{
  var stPointA = ls[0].point();
  var w = 0;
  var pts = [];
  var endPointA, pathele, type, f;
  for(var i = 1; i < ls.length; i++)
  {
    pathele = ls[i];
    type = pathele.type();
    f = windingCounts[type];
    switch(type)
    {
      case "A":
        pts = [pathele.center().x, pathele.center().y, pathele.rx(), pathele.ry(), pathele.xaxisrotate(), pathele.startAngle(), pathele.endAngle(), !pathele.sweepflag()];
        break;
      case "Z":
        pts = [stPointA, ls[0].point()];
        break;
      default:
        endPointA = pathele.bboxPoint(); 
        pts = [stPointA].concat(endPointA);
        break;
    }    
    w += f(pts, x, y);
    stPointA = pathele.point();
  }

  return !!w; 
}


export$({
  isPointInPath: isPointInPath,
  windingCounts: windingCounts,
  winding_line: winding_line,
  winding_quad: winding_quad,
  winding_cubic: winding_cubic,
  winding_ellipse: winding_ellipse
});
};
__modules__["/sprites/text.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits");
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;
var Sprite = require("./sprite");
var TextTrait = require("../gprims/textgprim").TextTrait;

/**
@title{Text}
*/

/**
@iclass[Text Sprite (TextTrait)]{
  文本精灵，它使用了TextTrait，具有TextTrait上所有属性和方法。
  @grant[TextTrait type #:attr 'READONLY]
  @grant[TextTrait text #:attr 'READONLY]
  @grant[TextTrait font #:attr 'READONLY]
  @grantMany[TextTrait fillFlag strokeStyle strokeFlag id tag fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY]
  @constructor[Text]{
    @param[param object]{初始化参数。}
  }
}
**/
var Text = Sprite.extend({
  initialize: function(param)
  {
    this.execProto("initialize", {gprim:this, interactable:((param == undefined) ? undefined : param.interactable)});
    this.subTraits(0).__init(param);
  }
},
[[READONLY("type"), TextTrait.grant("type")], [CUSTOM_SETTER("text"), TextTrait.grant("text")], 
  [CUSTOM_SETTER("font"), TextTrait.grant("font")], [CUSTOM_SETTER("strokeStyle"), TextTrait.grant("strokeStyle")],
  [CUSTOM_SETTER("fillStyle"), TextTrait.grant("fillStyle")], [CUSTOM_SETTER("shadowColor"), TextTrait.grant("shadowColor")]].concat(
  TextTrait.grantMany(["fillFlag", "strokeFlag", "id", "tag", "shadowBlur", "shadowOffsetX", "shadowOffsetY"])),
[TextTrait]);

export$(Text);
};
__modules__["/gprims/arcgprim.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits")
,   ShapTrait = require("./shaptrait").ShapTrait
,   geo = require("../lib/geometry");


var Klass = colortraits.Klass;
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;

/**
@itrait[ArcTrait]{
  @extend[ShapTrait]{}
  @traitGrantMany[ShapTrait type id tag strokeStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineWidth lineCap lineJoin miterLimit lineDash #:trait ArcTrait] 
  圆弧图元的基本功能单元。   
}
**/

/**
@property[radius number #:def 10]{
  @trait[ArcTrait]
  圆弧的半径。
}
*/
/**
@property[startAngle float #:def 0]{
  @trait[ArcTrait]
  起始角，以弧度计。（弧的圆形的三点钟位置是 0 度）。
}
*/
/**
@property[endAngle float #:def Math.PI]{
  @trait[ArcTrait]
  结束角，以弧度计。
}
*/
/**
@property[anticlockwise boolean #:def false]{
  @trait[ArcTrait]
  逆时针还是顺时针绘图,false = 顺时针，true = 逆时针。
}
*/
var defaultArc = {radius: 10, startAngle: 0, endAngle: Math.PI, anticlockwise: false};
var ArcTrait = ShapTrait.extend({
  __init: function(param)
  {
    this.subTraits(0).__init(param);
    if(param == undefined)
      param = defaultArc;
    this._t.setradius(param.radius);
    this._t.setstartAngle(param.startAngle);
    this._t.setendAngle(param.endAngle);
    this._t.setanticlockwise((param.anticlockwise == undefined) ? false : param.anticlockwise);
    this._t.settype("arc");

    this._t.setlength(undefined);
  },
/**
@method[setradius]{
  @trait[ArcTrait]
  @param[radius float]{}
  @return[this]{}
  设置圆弧的半径。
}
*/
  setradius: function(r)
  {
    this._t.cache().bbox = undefined;
    this._t.setradius(r);
    this._t.setlength(undefined);
    return this;
  },
/**
@method[setstartAngle]{
  @trait[ArcTrait]
  @param[angle float]{弧度。}
  @return[this]{}
  设置圆弧的起始角。
}
*/
  setstartAngle: function(angle)
  {
    this._t.cache().bbox = undefined;
    this._t.setstartAngle(angle);
    this._t.setlength(undefined);
    return this;
  },
/**
@method[setendAngle]{
  @trait[ArcTrait]
  @param[angle float]{弧度值。}
  @return[this]{}
  设置圆弧的结束角。
}
*/
  setendAngle: function(angle)
  {
    this._t.cache().bbox = undefined;
    this._t.setendAngle(angle);
    this._t.setlength(undefined);
    return this;
  },
/**
@method[setanticlockwise]{
  @trait[ArcTrait]
  @param[clock boolean]{true逆时针，false:顺时针}
  @return[this]{}
  修改圆弧的绘图方向。
}
*/
  setanticlockwise: function(clock)
  {
    this._t.cache().bbox = undefined;
    this._t.setanticlockwise(clock);
    this._t.setlength(undefined);
    return this;
  },
  localBbox: function()
  {
/*   var radius = this._t.radius();
    var lineWidth = this._t.lineWidth();

    return new geo.Rect(-radius-lineWidth/2, -radius-lineWidth/2, 2*radius+lineWidth, 2*radius+lineWidth);                                      
 */ 

    var anticlockwise = this._t.anticlockwise();
    var startAngle = this._t.startAngle();
    var endAngle = this._t.endAngle();
    var radius = this._t.radius();

    //转换成顺时针的，结束角度一定大于起始角度
    if(endAngle < startAngle)
      endAngle += Math.PI*2;    

    if(anticlockwise){
      var temp = startAngle;
      startAngle = endAngle;
      endAngle = temp+Math.PI*2;
    }

    var points = [];
    points.push({x: radius*Math.cos(startAngle), y: radius*Math.sin(startAngle)});
    points.push({x: radius*Math.cos(endAngle), y: radius*Math.sin(endAngle)});

    var k = Math.floor(startAngle/(Math.PI*2));
    var nineangle = k*Math.PI*2;
    while(nineangle <= endAngle)
    {
      if(nineangle >= startAngle)
      {
        points.push({x: radius*Math.cos(nineangle), y: radius*Math.sin(nineangle)});
      }
      nineangle += Math.PI/2;
    }

    var xmin, xmax, ymin, ymax;

    for(var i = 0, length = points.length; i< length; i++)
    {
      var pstn = points[i];
      if (pstn.x < xmin || xmin == undefined)
        xmin = pstn.x;
      if (pstn.x > xmax || xmax == undefined)
        xmax = pstn.x;

      if (pstn.y < ymin || ymin == undefined)
        ymin = pstn.y;
      if (pstn.y > ymax || ymax == undefined)
        ymax = pstn.y;

    }
    var lineWidth = this._t.lineWidth();

    return geo.rectMake(xmin - lineWidth/2, ymin - lineWidth/2, xmax - xmin + lineWidth, ymax - ymin + lineWidth);

  },
  localInside: function(x, y)
  {
    var startAngle = this._t.startAngle();
    var endAngle = this._t.endAngle();
    var radius = this._t.radius();
    var lineWidth = this._t.lineWidth();
    var anticlockwise = this._t.anticlockwise();

    var r = Math.sqrt(x*x+y*y);
    //判断点是否在圆环内
    var isInTorus = (radius - lineWidth/2) <= r && r <= (radius + lineWidth/2);
    if (!isInTorus)
      return false;   

    if (2 * Math.PI <= endAngle - startAngle || endAngle - startAngle <= -2 * Math.PI)
    {
      //画了一个整圆
      return true;
    }

    if (endAngle < startAngle)
      endAngle+=Math.PI*2;    

    if(anticlockwise){
      var temp = startAngle;
      startAngle = endAngle;
      endAngle = temp + Math.PI*2;
    }

    //得到向量(x, y)和startAngle半径之间的夹角
    var startX = radius * Math.cos(startAngle);
    var startY = radius * Math.sin(startAngle);

    //这个时候是等价的
    var angle = geo.getVectorAngle({x:startX, y:startY}, {x:x, y:y}) + startAngle;    
    
    return angle >= startAngle && angle <= endAngle;
  },
  localHook: function(cb)
  {
    this.hookMany(this._t, ["strokeFlag", "radius", "startAngle", "endAngle", "anticlockwise", 
                            "strokeStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY",
                            "lineWidth", "lineCap", "lineDash", "anchorPoint"], cb, "a");
  },
  unlocalHook: function(cb)
  {
    this.unhookMany(this._t, ["strokeFlag", "radius", "startAngle", "endAngle", "anticlockwise", 
                            "strokeStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY",
                            "lineWidth", "lineCap", "lineDash", "anchorPoint"], cb, "a"); 

  },
/**
@method[length]{
  @trait[ArcTrait]
  @return[float]{路径的长度}
  获取Arc路径的长度, 边界的长度。这里是原生的长度，不包含缩放的过程。
}
*/
  length: function()
  {
    var len = this._t.length();
    if(len == undefined){
      var radius = this._t.radius();
      var detaangle = this._t.__detaAngle(this._t.startAngle(), this._t.endAngle(), this._t.anticlockwise());
      len = 2*Math.PI*radius*detaangle/(Math.PI*2);

      this._t.setlength(len);
    }

    return len;
  },
/**
@method[pointAtPercent]{
  @trait[ArcTrait]
  @param[t float]{0-1之间。小于等于0, 返回起点; 大于等于1, 返回结束点。}
  @return[point]{}
  Returns the point at the percentage t of the current arc. t在 0 到 1 之间.检测的方向为顺时针。
  这里是原生的点，不包含缩放的过程。起点为起始角度
}
*/
  pointAtPercent: function(t)
  {
    var startAngle = this.startAngle();
    var endAngle = this.endAngle();
    var radius = this.radius();
    var clock = this.anticlockwise();

    if(t<=0)
      return {x: radius*Math.cos(startAngle), y: radius*Math.sin(startAngle)};
    if(t>=1)
      return {x: radius*Math.cos(endAngle), y: radius*Math.sin(endAngle)};

    var len = this.length();
    var detaangle = this._t.__detaAngle(startAngle, endAngle, clock);
    
    var tempangle = t*detaangle;
    var calangle;
    if(clock){
      calangle = startAngle - tempangle;
    }else {
      calangle = startAngle + tempangle;
    }
    return {x: radius*Math.cos(calangle), y: radius*Math.sin(calangle)};

  },
/**
@method[percentAtLength]{
  @trait[ArcTrait]
  @param[len float]{大于0。大于总长度返回1,小于0返回0。}
  @return[float]{}
  Returns the point at the length  of the current arc. len在 0 到 整个长度之间。
}
*/
  percentAtLength: function(len)
  {
    var alllen = this._t.length();
    if(len < 0)
      return 0;
    if(alllen < len)
      return 1;

    return len/alllen;
  },
  __detaAngle: function(st, end, clock)
  {
    st = (st + Math.PI*2)%(Math.PI*2);
    end = (end + Math.PI*2)%(Math.PI*2);

    if(clock){
      return Math.PI*2 - (end - st);
    }else {
      return end - st;
    }

  }
},
 ["radius", "startAngle", "endAngle", "anticlockwise", "length"].concat(ShapTrait.grantMany(["strokeFlag", "cache", "type", "id", "tag", "strokeStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY",
    "lineWidth", "lineCap", "lineDash", "anchorPoint"])) 
);


/**
@iclass[ArcKlass Klass (ArcTrait)]{
  弧图图元。
  @grant[LineTrait type #:attr 'READONLY]
  @grant[LineTrait radius #:attr 'CUSTOM_SETTER]
  @grant[LineTrait startAngle #:attr 'CUSTOM_SETTER]
  @grant[LineTrait endAngle #:attr 'CUSTOM_SETTER]
  @grant[LineTrait anticlockwise #:attr 'CUSTOM_SETTER]
  @grant[LineTrait lineWidth #:attr 'CUSTOM_SETTER]
  @grantMany[LineTrait strokeStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineWidth lineCap lineDash id tag]
}
**/
/**
@property[ratioAnchor object #:def "{ratiox: 0, ratioy: 0}"]{
  @class[ArcKlass]
  图元左上角到图元锚点的距离与未经矩阵变换的图元的宽高比组成的对象。
}
*/
/**
@property[anchor object #:def "{x: 0, y: 0}"]{
  @class[ArcKlass]
  图元锚点在local坐标系下的位置。
}
*/

var ArcKlass = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize");
    this.subTraits(0).__init(param);
  }
},
 [[READONLY("type"), ArcTrait.grant("type")], [CUSTOM_SETTER("radius"), ArcTrait.grant("radius")],
  [CUSTOM_SETTER("startAngle"), ArcTrait.grant("startAngle")], [CUSTOM_SETTER("endAngle"), ArcTrait.grant("endAngle")],
  [CUSTOM_SETTER("anticlockwise"), ArcTrait.grant("anticlockwise")], [CUSTOM_SETTER("lineWidth"), ArcTrait.grant("lineWidth")],
  [CUSTOM_SETTER("strokeStyle"), ArcTrait.grant("strokeStyle")], [CUSTOM_SETTER("shadowColor"), ArcTrait.grant("shadowColor")]].concat(
  ArcTrait.grantMany(["strokeFlag", "id", "tag", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineCap",
  "lineDash"])),
[ArcTrait]);

export$({
  ArcKlass : ArcKlass,
  ArcTrait : ArcTrait
});
};
__modules__["/sprites/polygon.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits");
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;
var Sprite = require("./sprite");
var PolygonTrait = require("../gprims/polygongprim").PolygonTrait;

/**
@title{Polygon}
*/

/**
@iclass[Polygon Sprite (PolygonTrait)]{
  凸多边形精灵，它使用了 PolygonTrait ，具有PolygonTrait上所有属性和方法.
  
  @grant[PolygonTrait type #:attr 'READONLY]
  @grant[PolygonTrait radius #:attr 'READONLY]
  @grantMany[PolygonTrait ratioAnchor anchor fillFlag strokeFlag id tag strokeStyle fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineDash] 
  @constructor[Polygon]{
    @param[param object]{
      @verbatim|{
        初始化参数对象包含的属性可以为：
        vertexes
        x:精灵的x坐标。
        y:精灵的y坐标。
        z:精灵的z坐标。
        ratioAnchor: 百分比设置锚点。
        anchor：锚点。
        fillFlag strokeFlag id tag strokeStyle fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineDash
      }|
    }
  }
}
**/
var Polygon = Sprite.extend({
  initialize: function(param)
  {
    this.execProto("initialize", {gprim:this, interactable:((param == undefined) ? undefined : param.interactable)});
    this.subTraits(0).__init(param);
  }
},
 [[READONLY("type"), PolygonTrait.grant("type")], [CUSTOM_SETTER("vertexes"), PolygonTrait.grant("vertexes")],
  [CUSTOM_SETTER("strokeStyle"), PolygonTrait.grant("strokeStyle")], [CUSTOM_SETTER("fillStyle"), PolygonTrait.grant("fillStyle")],
  [CUSTOM_SETTER("shadowColor"), PolygonTrait.grant("shadowColor")]].concat(
  PolygonTrait.grantMany(["fillFlag", "strokeFlag", "id", "tag", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineDash"])),
 [PolygonTrait]);

export$(Polygon);
};
__modules__["/selection/selection.js"] = function(require, load, export$) {

/**
 @title{Selection}
*/

var READONLY = require("../lib/colortraits").READONLY;
var PRIVATE = require("../lib/colortraits").PRIVATE;
var Klass = require("../lib/colortraits").Klass
var assert = require("../lib/debug").assert;

var SelectionUtil = require("./selectionutil");

var is_array = function(v){
  // return  v &&
  //         (typeof v) === "object" &&
  //         (typeof v.length) === "number" &&
  //         (typeof v.splice) === "function" &&
  //         (!(v.hasOwnProperty)||v.hasOwnProperty("length")) &&
  //         !(v.propertyIsEnumerable('length'));
  return Object.prototype.toString.call(v) === "[object Array]";
}

/**
  * @function[DataDivide]{
  * 帮助函数，数据分流dispatch策略，从selectionRoot分流拉取数据。要求selectionRoot上必须已经绑定数据，且绑定数据为数组，否则抛异常。
  * 用法:Selection.data(DataDivide);
  * }
  * 
  */
var DataDivide = function(rootData, groupIndex, groupSize){
  assert(is_array(rootData),"selectionRoot is not bind to array data in DataDivide.");
  return rootData;
}

/**
  * @iclass[Selection]{
  *   Selection是colorbox selection中一个具体的类，也是最重要的类，提供对Selection操作的API。一个selection对象代表一组平坦的集合，可以利用Selection上的接口对这一组集合进行查询，数据绑定，增删节点等操作。
  * Selection为内部类型，不提供显示的构造方法，只能通过select方法或Selection上的API来创建Selection。
  * }
  */
var Selection = Klass.extend({
  initialize:function(groups){
    this._t.setgroups(groups);
  },
  /**
    * @method[select]{
    * 遍历selection集合中的所有元素，对每个元素查找它的第一个满足条件（谓词函数）的子节点，由查询出来的子节点作为元素，构成新的selection集合，并返回新的selection集合。
    * @class[Selection]
    * @param[predicate function/boolean]{
    *   function:
    *     (node) -> boolean;
    *     用于筛选集合中元素的谓词函数。
    *     node:集合中的节点元素；
    *     return:谓词函数判断结果，true/false。
    *   boolean:
    *     true:选择所有子孙节点；
    *     false:不选择任何节点
    * }
    * @param[dep number]{
    *   查询深度，默认为INFINITY，查询整棵树。
    * }
    * @return[@type[Selection]]{
    *   被遍历selection中的各个元素中，每个元素的第一个满足条件的子节点构成的集合。
    * }
    * }
    * 
    */
  select:function(predicate,dep){
    var newGroups = [];
    var gs = this._t.groups();


    //考虑性能优化，不把判断放到findFirst中
    var isRude =  typeof(predicate) === "boolean";
    var tmp;
    var eleArray;
    var newG;
    this.each(function(element,index){     
      eleArray = SelectionUtil.findFirst(element, predicate,dep || Infinity,isRude);
      
      newG = {
        elements:eleArray,
        selectionRoot:element
      };

      newGroups.push(newG);
    });
    return Selection.create(newGroups);
  },
  /**
    * @method[selectAll]{
    * 遍历selection集合中的所有元素，对每个元素查找它的的所有满足条件（谓词函数）的子节点，由查询出来的子节点作为元素，构成新的selection集合，并返回新的selection集合。
    * @class[Selection]
    * @param[predicate function/boolean]{
    *   function:
    *     (node) -> boolean;
    *     用于筛选集合中元素的谓词函数。
    *     node:集合中的节点元素；
    *     return:谓词函数判断结果，true/false。
    *   boolean:
    *     true:选择所有子孙节点；
    *     false:不选择任何节点
    * }
    * @param[dep number]{
    *   查询深度，默认为INFINITY，查询整棵树。
    * }
    * @return[@type[Selection]]{
    *   被遍历selection中的各个元素中，每个元素的所有满足条件的子节点构成的集合。
    * }
    * }
    * 
    */
  selectAll:function(predicate,dep){
    var newGroups = [];
    var gs = this._t.groups();

    //考虑性能优化，不把判断放到findAll中
    var isRude =  typeof(predicate) === "boolean";
    var tmp;
    var eleArray;
    var newG;
    this.each(function(element,index){
      eleArray = SelectionUtil.findAll(element, predicate,dep || Infinity,isRude);
  
      newG = {
        elements:eleArray,
        selectionRoot:element
      };
      newGroups.push(newG);
    });
    return Selection.create(newGroups);
  },
  /**
    * @method[filter]{
    *   从当前集合中filter出一些元素，组成新的集合。
    *   @class[Selection]
    *   @param[predicate function]{
    *     (node,index) -> boolean;
    *     用于筛选集合中元素的谓词函数。
    *     node:集合中的节点元素；
    *     index:元素在集合中的位置；
    *     return:谓词函数判断结果，true/false。
    *   }
    *   @return[@type[Selection]]{
    *     由满足条件的元素组成的新的集合。
    *   }
    * }
    * 
    */
  filter:function(predicate){
    var newGroups = [];
    var gs = this._t.groups();
    var index = 0;
    for (var i = 0; i < gs.length; i++) {
      var newG = {
        elements:[],
        selectionRoot:gs[i].selectionRoot
      };
      for (var j = 0; j < gs[i].elements.length; j++) {
        if(predicate(gs[i].elements[j],index)){
          newG.elements.push(gs[i].elements[j]);
        }
        index++;
      };
      if (newG.elements.length > 0) {
        newGroups.push(newG);
      };
    };
    return Selection.create(newGroups);
  },

  /**
    * @method[each]{
    * 遍历selection集合中的所有元素，对每个元素逐个调用function。
    * @class[Selection]
    * @param[f function]{
    *   (element,index) -> void;
    *   应用到集合中每个元素的函数。
    *   this:node节点;
    *   element:集合中的节点元素;
    *   index:元素在selection中所处的位置;
    *   return:void。
    * }
    * @return[Selection]{
    *   返回当前Selection。
    * }
    * }
    * 
    */    
  each:function(f){
    var index=0;
    var gs = this._t.groups();
    for (var i = 0; i < gs.length; i++) {
      for (var j = 0; j < gs[i].elements.length; j++) {
        f(gs[i].elements[j],index);
        index++;
      };
    };
    return this;
  },
  /**
    * @method[call]{
    * 调用函数f，将selection和argument作为参数传给f。
    * @class[Selection]
    * @param[f function]{
    *   (selection) -> void;
    *   被调用函数。
    *   selection:元素集合;
    *   return:void。
    * }
    * @return[void]
    * }
    * 
    */  
  call:function(f){
    assert(typeof(f) === "function","Selection.call must be give function.");   
    f.apply(undefined,([this]).concat(Array.prototype.slice.call(arguments,1)));
  },

  /**
    * @method[size]{
    * 获取selection中元素的个数。
    * @class[Selection]
    * @return[number]{
    *  selection中元素的个数。
    * }
    * }
    * 
    */
  size:function(){
    var num = 0;
    this.each(function(element){
      num++;
    });
    return num;
  },

  /**
    * @method[empty]{
    * 判断selection中是否有元素。
    * @class[Selection]
    * @return[boolean]{
    *  true/false。
    * }
    * }
    * 
    */
  empty:function(){
    return this.size() === 0;
  },

  /**
    * @method[append]{
    *   为Selection中的每个元素添加孩子节点。
    *   @class[Selection]
    *   @param[nodeClassorNode NodeClass/Node]{
    *     NodeClass:用来创建孩子节点的Class，要求nodeClass有无参的构造函数;
    *     Node:用于append的孩子节点。    
    *   }
    *   @param[f function]{
    *    (data,index)-> node;
    *    this:node元素;
    *    data:元素上绑定的数据;
    *    index:元素在集合中的位置;
    *     return:NodeClass/Node。
    *   }
    *   @return[@type[Selection]]{
    *    由新创建元素组成的Selection。
    *   }
    * }
    */
  append:function(value){
    var newGroups = [];
    this.each(function(node,index){
        //每个元素独立一组
        var newG = {
            elements:[],
            selectionRoot:node
          };
        var ret = typeof(value) === "function" ? value.call(node,node.dynamicProperty("data"),index) : value;
        var v = typeof(ret.create) === "function" ? ret.create() : ret;
        assert(node.addChild,"node must have addChild method.");
        node.addChild(v);
        newG.elements.push(v);
        
        newGroups.push(newG);
          
      });
    return Selection.create(newGroups);
  },
  /**
    * @method[remove]{
    *   将selection中的每个元素，从其父节点上删除。
    *   @class[Selection]
    *   @return[@type[Selection]]{
    *     原来的selection集合，集合中的element都已经从parent node上删除。
    *   }
    * }
    * 
    */  
  remove:function(){
    this.each(function(node,index){
                return  node.parent 
                        && node.parent()
                        && node.parent().removeChild
                        && node.parent().removeChild(node);
      });
    //todo:selectionRoot是否需要清除？D3中不清除。

  },

  /**
    * @method[setProperty]{
    *   设置selection中元素的属性值，支持设置一个属性，或一组属性。
    *   @class[Selection]
    *   @param[nameorvalues string/object]{
    *     string:设置一个属性的属性名字符串。
    *     key-value object:设置一组属性的属性对象。
    *       object的value:
    *         (1)value:常量，则将其设置为元素的属性值;
    *         (2)value:function
    *           (data,index) -> anything;
    *           调用该function，将其返回值作为属性值;
    *           data:node上所绑定的数据;
    *           index:元素在集合中的位置;
    *           return:anything，作为属性值。
    *     function:
    *       (data,index) -> string/key-value object;
    *       this:node元素;
    *       data:node上所绑定的数据;
    *       index:元素在集合中的位置;
    *       return:string(作为单个属性的属性名);
    *              key-value object(设置一组属性的属性对象,该值中的value如果是function，将不再次被调用)。
    *     
    *   }
    *   @param[value anything]{
    *    (1)value:常量，则将其设置为元素的属性值;
    *    (2)value:function
    *     (data,index) -> anything;
    *     调用该function，将其返回值作为属性值;
    *     this:node元素;
    *     data:node上所绑定的数据;
    *     index:元素在集合中的位置;
    *     return:anything，作为属性值。
    *   }
    *   @return[@type[Selection]]{
    *     接口的调用者，也就是selection。
    *   }
    * }
    * 
    */
  setProperty:function(nameorvalues,value){
    return this._t.__setProperty(nameorvalues,value,false);
  },

  /**
    * @method[property]{
    *   获取selection中元素的属性值。
    *   @class[Selection]
    *   @param[name string]{
    *    属性名字符串。
    *   }
    *   @return[Array]{
    *    平坦的属性数组。
    *   }
    * }
    * 
    */
  property:function(name){
    return this._t.__property(name,false);
  },

  /**
    * @method[setDynamicProperty]{
    *   设置selection中元素的动态属性值，支持设置一个属性，或一组属性。
    *   @class[Selection]
    *   @param[nameorvalues string/object]{
    *     string:设置一个属性的属性名字符串。
    *     key-value object:设置一组属性的属性对象。
    *       object的value:
    *         (1)value:常量，则将其设置为元素的属性值;
    *         (2)value:function
    *           (data,index) -> anything;
    *           调用该function，将其返回值作为属性值;
    *           data:node上所绑定的数据;
    *           index:元素在集合中的位置;
    *           return:anything，作为属性值。
    *     function:
    *       (data,index) -> string/key-value object;
    *       data:node上所绑定的数据;
    *       index:元素在集合中的位置;
    *       return:string(作为单个属性的属性名);
    *              key-value object(设置一组属性的属性对象,该值中的value如果是function，将不再次被调用)。
    *     
    *   }
    *   @param[value anything]{
    *    (1)value:常量，则将其设置为元素的属性值;
    *    (2)value:function
    *     (data,index) -> anything;
    *     调用该function，将其返回值作为属性值;
    *     this:node元素;
    *     data:node上所绑定的数据;
    *     index:元素在集合中的位置;
    *     return:anything，作为属性值。
    *   }
    *   @return[@type[Selection]]{
    *     接口的调用者，也就是selection。
    *   }
    * }
    * 
    */

  setDynamicProperty:function(nameorvalues,value){
    return this._t.__setProperty(nameorvalues,value,true);
  },
  /**
    * @method[dynamicProperty]{
    *   获取selection中元素的动态属性值。
    *   @class[Selection]
    *   @param[name string]{
    *    属性名字符串。
    *   }
    *   @return[Array]{
    *    平坦的属性数组。
    *   }
    * }
    * 
    */
  dynamicProperty:function(name){
    return this._t.__property(name,true);
  },
  __property:function(name,isDynamic){
    var pros = [];
    var type = typeof(name);
    assert(type === "string","Illegal property name type.");
    this.each(function(node,index){
        var res = isDynamic ? node.dynamicProperty(name) : (node[name] ? node[name]() : undefined);
        pros.push(res);
      });
    return pros;
  },
  __setProperty:function(nameorvalues,value,isDynamic){
    var type = typeof(nameorvalues);
    assert(type === "string" || type === "object" || type === "function","Illegal setProperty nameorvalues type.");
    var errHead = isDynamic ? "setDynamicProperty " : "setProperty "    
    this.each(function(node,index){
      if(type === "string"){//设置一个属性
        var v = (typeof value === "function")? value.call(node,node.dynamicProperty("data"),index) : value;
        isDynamic ? node.setDynamicProperty(nameorvalues,v) : node["set"+nameorvalues](v);
      }else if(type === "object"){//设置一组属性
        assert(value === undefined,errHead+"set goup properties only allow one param.")
        for (var k in nameorvalues) {
          var v = (typeof nameorvalues[k] === "function")? nameorvalues[k].call(node,node.dynamicProperty("data"),index) : nameorvalues[k];
          isDynamic ? node.setDynamicProperty(k,v) : node["set"+k](v);
        };
      }else{//function return string or key-value object.

        var ret = nameorvalues.call(node,node.dynamicProperty("data"),index);
        var retType = typeof(ret);
        assert(retType === "string" || retType === "object","function nameorvalues must return string or key-value object.");
        if(retType === "string"){//设置一个属性
          var v = (typeof value === "function")? value.call(node,node.dynamicProperty("data"),index) : value;
          isDynamic ? node.setDynamicProperty(ret,v) : node["set"+ret](v);
        }else{//设置一组属性
          for (var k in ret) {
            assert(value === undefined,errHead+"set goup properties only allow one param.");
            isDynamic ? node.setDynamicProperty(k,ret[k]) : node["set"+k](ret[k]);
          };
        }
      }        
    });
    return this;

  },
  __arrayData:function(arrValue,nodekey,datakey){
    assert(is_array(arrValue),"data bind error: value must be array or function that return array.");
    var keyMode = (typeof(nodekey) === "function");
    var updateGroups = [];
    var enterGroups = [];
    var exitGroups = [];
    if(!keyMode){//match by order
      var enterNum = arrValue.length - this.size();
      var exitNum = this.size() - arrValue.length;

      var index = 0;
      var gs = this._t.groups();
      for (var i = 0; i < gs.length; i++) {
        var newUpdateG = {elements:[],selectionRoot:gs[i].selectionRoot};
        var newEnterG = {elements:[],selectionRoot:gs[i].selectionRoot};
        var newExitG = {elements:[],selectionRoot:gs[i].selectionRoot};
        for (var j = 0; j < gs[i].elements.length; j++) {
          if(enterNum >= 0){//more data
            gs[i].elements[j].setDynamicProperty("data",arrValue[index]);
            newUpdateG.elements.push(gs[i].elements[j]);
          }else{//less data
            if(index < arrValue.length){
              gs[i].elements[j].setDynamicProperty("data",arrValue[index]);
              newUpdateG.elements.push(gs[i].elements[j]);
            }else{
              newExitG.elements.push(gs[i].elements[j]);
            }
          }
          index++;
        };
        updateGroups.push(newUpdateG);
        enterGroups.push(newEnterG);
        exitGroups.push(newExitG);
      };
      //策略:多余的默认添加到EnterGroups最后一个group中
      if(enterNum){
        for (var i = 0; i < enterNum; i++) {
          var ph = PlaceHolder.create();
          ph.setDynamicProperty("data",arrValue[arrValue.length - (enterNum - i)]);
          //enterGroups不至于没有group,除非原来selection就没有group
          enterGroups[enterGroups.length - 1].elements.push(ph);       
        };
      }

    }else{//match by key
      var gs = this._t.groups();
      for (var i = 0; i < gs.length; i++) {
        for (var j = 0; j < gs[i].elements.length; j++) {
          var k = nodekey(gs[i].elements[j]);
          
          if(typeof(k) === "string" || k === undefined){
            gs[i].elements[j].__store_key_remove_later__ = k;//key临时挂在element上
          }else{
            assert(false,"nodekey must return string or undefined.");
          }
        };
      };

      var dataKeyMap = {};
      for (var i = 0; i < arrValue.length; i++) {
        var k = datakey(arrValue[i]);
        assert(typeof(k) === "string","nodekey must return string.");
        dataKeyMap[k] = arrValue[i];
      };


      for (var i = 0; i < gs.length; i++) {
        var newUpdateG = {elements:[],selectionRoot:gs[i].selectionRoot};
        var newEnterG = {elements:[],selectionRoot:gs[i].selectionRoot};
        var newExitG = {elements:[],selectionRoot:gs[i].selectionRoot};
        for (var j = 0; j < gs[i].elements.length; j++) {
          var tmpkey = gs[i].elements[j].__store_key_remove_later__;
          if(tmpkey&& dataKeyMap[tmpkey]){
            
            gs[i].elements[j].setDynamicProperty("data",dataKeyMap[tmpkey]);
            delete(dataKeyMap[tmpkey]);
            delete(gs[i].elements[j].__store_key_remove_later__);
            newUpdateG.elements.push(gs[i].elements[j]);
            
          }else{
            newExitG.elements.push(gs[i].elements[j]);
            delete(gs[i].elements[j].__store_key_remove_later__);
          }
        }
        updateGroups.push(newUpdateG);
        enterGroups.push(newEnterG);
        exitGroups.push(newExitG);
      }


      //策略:多余的默认添加到EnterGroups最后一个group中
      for(var k in dataKeyMap){
        var ph = PlaceHolder.create();
        ph.setDynamicProperty("data",dataKeyMap[k]);
        //enterGroups不至于没有group,除非原来selection就没有group
        enterGroups[enterGroups.length - 1].elements.push(ph);
      }      
    }
    return UpdateSelection.create(updateGroups,enterGroups,exitGroups);
  },
  __functionData:function(f,nodekey,datakey){
    var keyMode = (typeof(nodekey) === "function");
    var updateGroups = [];
    var enterGroups = [];
    var exitGroups = [];
    var gs = this._t.groups();
    for (var i = 0; i < gs.length; i++) {
      var newUpdateG = {elements:[],selectionRoot:gs[i].selectionRoot};
      var newEnterG = {elements:[],selectionRoot:gs[i].selectionRoot};
      var newExitG = {elements:[],selectionRoot:gs[i].selectionRoot};

      var rootData = gs[i].selectionRoot && gs[i].selectionRoot.dynamicProperty("data");
      aGroupValueArr = f(rootData,i,gs[i].elements.length);
      assert(is_array(aGroupValueArr),"data bind error: function must return array."); 
      
      if(!keyMode){
        var gEnterNum = aGroupValueArr.length - gs[i].elements.length;
        var gExitNum = aGroupValueArr.length - gs[i].elements.length;

        for (var j = 0; j < gs[i].elements.length; j++) {
          if(gEnterNum >= 0){//more data
            gs[i].elements[j].setDynamicProperty("data",aGroupValueArr[j]);
            newUpdateG.elements.push(gs[i].elements[j]);
          }else{//less data
            if(j < aGroupValueArr.length){
              gs[i].elements[j].setDynamicProperty("data",aGroupValueArr[j]);
              newUpdateG.elements.push(gs[i].elements[j]);
            }else{
              newExitG.elements.push(gs[i].elements[j]);
            }
          }
        };
        if(gEnterNum){
          for (var k = 0; k < gEnterNum; k++) {
            var ph = PlaceHolder.create();
            ph.setDynamicProperty("data",aGroupValueArr[aGroupValueArr.length - (gEnterNum - k)]);
            newEnterG.elements.push(ph);     
          };
        }
        
      }else{//keymode

        for (var j = 0; j < gs[i].elements.length; j++) {
          var k = nodekey(gs[i].elements[j]);            
          if(typeof(k) === "string" || k === undefined){
            gs[i].elements[j].__store_key_remove_later__ = k;//key临时挂在element上
          }else{
            assert(false,"nodekey must return string or undefined.");
          }
        };
        
        var dataKeyMap = {};
        for (var j = 0; j < aGroupValueArr.length; j++) {
          var k = datakey(aGroupValueArr[j]);
          assert(typeof(k) === "string","nodekey must return string.");
          dataKeyMap[k] = aGroupValueArr[j];
        };

        for (var j = 0; j < gs[i].elements.length; j++) {
          var tmpkey = gs[i].elements[j].__store_key_remove_later__;
          if(tmpkey&& dataKeyMap[tmpkey]){            
            gs[i].elements[j].setDynamicProperty("data",dataKeyMap[tmpkey]);
            delete(dataKeyMap[tmpkey]);
            delete(gs[i].elements[j].__store_key_remove_later__);
            newUpdateG.elements.push(gs[i].elements[j]);
            
          }else{
            newExitG.elements.push(gs[i].elements[j]);
            delete(gs[i].elements[j].__store_key_remove_later__);
          }
        };

        for(var k in dataKeyMap){
          var ph = PlaceHolder.create();
          ph.setDynamicProperty("data",dataKeyMap[k]);
          newEnterG.elements.push(ph);     
        }        
      }
      updateGroups.push(newUpdateG);
      enterGroups.push(newEnterG);
      exitGroups.push(newExitG);            
    }
    return UpdateSelection.create(updateGroups,enterGroups,exitGroups);

  },

  /**
    * @method[data]{
    * 为selection中的元素绑定数据，数据来自当前array或f计算结果。
    * @class[Selection]
    * @param[array Array]{
    *   数据数组，数组中的元素会按照顺序逐一绑定到selection中的element上。
    * }
    * @param[f function]{
    *   (rootData, groupIndex, groupSize) -> Array;
    *   用户使用f来做数据绑定需要了解Selection集合中元素采用group进行存储，f会针对于每个group调用一次，并将返回值平坦的绑定到group中的元素上。
    *   rootData:group的selectionRoot上绑定的数据;
    *     groupIndex:group所处的位置;
    *   groupSize:group中元素的个数;
    *   return:Array，平坦绑定到group中的元素上的数据。
    * }
    * @param[nodekey function]{
    *   (element) -> string;
    *   元素匹配键值的计算函数。
    *   element:集合中的元素;
    *   return:用于数据绑定匹配的键值字符串,与data产生的键值匹配。
    * }
    * @param[datakey function]{
    *   (d) -> string;
    *   数据匹配键值的计算函数。
    *   d:数据数组中的元素;
    *   return:用于数据绑定匹配的键值字符串，与element产生的键值匹配。
    * }
    * @return[@type[UpdateSelection]]{
    *   根据数据绑定所创建的UpdateSelection。
    * }
    * }
    * 
    */
  data:function(value,nodekey,datakey){ 

    assert((!nodekey && !datakey) ||
           ((typeof(nodekey) === "function")&&(typeof(datakey) === "function")),
           "nodekey & datakey must be given function both or both not.");
    
    if(typeof value === "function"){//必须返回数组
      return this._t.__functionData(value,nodekey,datakey)
    }else{
      return this._t.__arrayData(value,nodekey,datakey);
    }
  },
  /**
    * @method[replaceWith]{
    *   替换集合中的元素。
    *   @class[Selection]
    *   @param[value @type[Klass]]{
    *    替换元素的类型。
    *   }
    *   @param[value function]{
    *     (oldNode,index) -> node
    *     this:node节点;
    *     oldNode:被替换者;
    *     index:元素在集合中的位置;
    *     return:替换者。
    *   }
    *   @return[Array]{
    *    被替换掉的节点作为元素的Selection集合。
    *   }
    * }
    * 
    */
  replaceWith:function(value){
    var newGroups = [];
    var index = 0;
    var gs = this._t.groups();
    for (var i = 0; i < gs.length; i++) {
      var newG = {elements:[]};
      var gIndex = 0;
      for (var j = 0; j < gs[i].elements.length; j++) {
        var newEle = typeof(value) === "function" ? value.call(gs[i].elements[j],gs[i].elements[j],index) : value.create();
        var oldEle = (gs[i].elements.splice(gIndex,1,newEle))[0];
        //拷贝绑定的数据
        newEle.setDynamicProperty("data",oldEle.dynamicProperty("data"));
        gIndex++;
        oldEle.parent().replaceChild(oldEle,newEle);
        newG.elements.push[oldEle];
        index++;
      };
    };
    return Selection.create(newGroups);

  } 
},[PRIVATE("groups")]);




/**
  * @iclass[UpdateSelection]{
  *   UpdateSelection表示Selection数据绑定操作中，被绑定数据的元素集合。继承自Selection，并对接口进行扩展。
  *   UpdateSelection由Selection.data接口产生。
  * }
  */
var UpdateSelection = Selection.extend({
  initialize:function(updateGroups,enterGroups,exitGroups){
    this.execProto("initialize",updateGroups);
    this._t.set__enter__(EnterSelection.create(enterGroups,this));
    this._t.set__exit__(ExitSelection.create(exitGroups,this));
  },

  /**
    * @method[enter]{
    *   获取UpdateSelection对应的EnterSelection。
    *   @class[UpdateSelection]
    *   @return[@type[EnterSelection]]
    * }
    */
  enter:function(){
    return this._t.__enter__();
  },

  /**
    * @method[exit]{
    *   获取UpdateSelection对应的ExitSelection。
    *   @class[UpdateSelection]
    *   @return[@type[ExitSelection]]
    * }
    */
  exit:function(){
    return this._t.__exit__();
  }
},[PRIVATE("__enter__"),PRIVATE("__exit__")]);


/**
  * @iclass[ExitSelection]{
  *   ExitSelection表示Selection数据绑定操作中，未被绑定数据的元素集合。继承自Selection，并对接口进行扩展。
  *   ExitSelection由Selection.data接口产生，可通过UpdateSelection.exit()接口获取。
  * }
  */
var ExitSelection = Selection.extend({
  initialize:function(groups,updateSelection){
    this.execProto("initialize",groups);
    this._t.set__update__(updateSelection);
  },

  /**
    * @method[update]{
    *   获取ExitSelection对应的UpdateSelection。
    *   @class[ExitSelection]
    *   @return[@type[UpdateSelection]]
    * }
    */
  update:function(){
    return this._t.__update__();
  }
},[PRIVATE("__update__")]);


/**
  * @iclass[EnterSelection]{
  *   EnterSelection表示Selection数据绑定操作中，根据未绑定到对应元素的数据所创建的PlaceHolder集合。PlaceHolder可以理解为一种用于保存数据的伪节点。
  *   EnterSelection由Selection.data接口产生，可通过UpdateSelection.enter()接口获取。
  * }
  */
var EnterSelection = Klass.extend({
  initialize:function(groups,updateSelection){
    this._t.setgroups(groups);
    this._t.set__update__(updateSelection);
  },

  /**
    * @method[update]{
    *   获取EnterSelection对应的UpdateSelection。
    *   @class[EnterSelection]
    *   @return[@type[UpdateSelection]]
    * }
    */
  update:function(){
    return this._t.__update__();
  },

  /**
    * @method[size]{
    *   获取selection中元素的个数。
    *   @class[EnterSelection]
    *   @return[number]
    * }
    */
  size:function(){
    var num = 0;
    var gs = this._t.groups();
    for (var i = 0; i < gs.length; i++) {
      for (var j = 0; j < gs[i].elements.length; j++) {
        num++;
      };
    };    
    return num;
  },

  /**
    * @method[empty]{
    *   判断selection中是否有元素。
    *   @class[EnterSelection]
    *   @return[boolean]{
    *     集合中有元素，返回true，否则，返回false。
    *   }
    * }
    */
  empty:function(){
    return this.size() === 0;
  },

  /**
    * @method[append]{
    *   为EnterSelection中的PlaceHolder创建相应元素添加到相应的slectionRoot上。
    *   @class[EnterSelection]
    *   @param[nodeClassorNode NodeClass/Node]{
    *     NodeClass:用来创建孩子节点的Class，要求nodeClass有无参的构造函数;
    *     Node:用于append的孩子节点。    
    *   }
    *   @param[f function]{
    *    (data,index)-> node;
    *    this: placeHolder;
    *    data:元素上绑定的数据;
    *    index:元素在集合中的位置;
    *    return:NodeClass/Node。
    *   }
    *   @return[@type[Selection]]{
    *    由新创建元素组成的Selection。
    *   }
    * }
    */
  append:function(value){
    var newGroups = [];
    var gs = this._t.groups();
    var index = 0;
    for (var i = 0; i < gs.length; i++) {
      //保持原有分组结构
      var newG = {
            elements:[],
            selectionRoot:gs[i].selectionRoot
          };
      for (var j = 0; j < gs[i].elements.length; j++) {
        var ret = typeof value === "function" ? value.call(gs[i].elements[j],gs[i].elements[j].dynamicProperty("data"),index) : value;
        var v = typeof(ret.create) === "function" ? ret.create() : ret;
        v.setDynamicProperty("data",gs[i].elements[j].dynamicProperty("data"));
        assert(gs[i].selectionRoot.addChild,"node must have addChild method.");

        gs[i].selectionRoot.addChild(v);
        newG.elements.push(v);
        
        index++;
      };
      newGroups.push(newG);
    }; 
    return Selection.create(newGroups);
  }
},[PRIVATE("groups"),PRIVATE("__update__")]);


//用于数据绑定阶段，为未找到对应绑定元素的数据占位。内部数据接口。
var PlaceHolder = Klass.extend({
  initialize:function(){
    this.attributes = {};
  },
  setDynamicProperty:function(name,attr){
    this.attributes[name] = attr;
  },
  dynamicProperty:function(name){
    return this.attributes[name];
  }
});



/**
  * @function[select]{
  *   将传入节点转换成selection，集合中包含一个element，即node。
  *   @param[node @type[TreeActor]]{
  *     传入节点，该节点会作为创建的selection的element。
  *   }
  *   @return[@type[Selection]]{
  *     由传入node作为元素所构建的Selection。
  *   }
  * }
  * 
  */
var select = function(node){
   var groups = [
      {
        elements:[node],
        selectionRoot:undefined
      }
   ];
   return Selection.create(groups);   
};


export$({
  select : select,
  DataDivide:DataDivide
});




};
__modules__["/gprims/autowraptextgprim.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits")
,   helper = require("../lib/helper")
,   CompositeTrait = require("./compositegprim").CompositeTrait
,   geo = require("../lib/geometry")
,   TextKlass = require("./textgprim").TextKlass;

var assert = require("../lib/debug").assert;


var Klass = colortraits.Klass;
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;


/**
@itrait[AutoWrapTextTrait]{
  @extend[CompositeTrait]{
  }
  @traitGrantMany[CompositeTrait ratioAnchor anchor gprims strokeStyle strokeFlag fillFlag cache type id tag fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY anchorPoint #:trait AutoWrapTextTrait]
  自动换行的文本图元的基本功能。支持对于不同的行进行style设置。
}
**/
/**
@property[text string #:def "A" #:attr 'CUSTOM_SETTER]{
  @trait[AutoWrapTextTrait]
  需要显示的文本。
}
*/
/**
@property[maxWidth number #:def "Infinity" #:attr 'CUSTOM_SETTER]{
  @trait[AutoWrapTextTrait]
  文本显示框的最大宽度。
}
*/
/**
@property[maxHeight number #:def "Infinity" #:attr 'CUSTOM_SETTER]{
  @trait[AutoWrapTextTrait]
  文本显示框的最大高度。
}
*/
/**
@property[lineSpacing number #:def 0 #:attr 'CUSTOM_SETTER]{
  @trait[AutoWrapTextTrait]
  文本之间的行间距,单位为px。默认值0。
}
*/
/**
@property[align string #:def "left" #:attr 'CUSTOM_SETTER]{
  @trait[AutoWrapTextTrait]
  文本的水平对齐方式。取值范围："left", "center", "right"。
}
*/
/**
@property[styles array #:def "[{font: {style: \"normal\", weight: 400, size: 16, family: \"Arial\"}}]" #:attr 'CUSTOM_SETTER]{
  @trait[AutoWrapTextTrait]
  @verbatim|{
  设置文本的格式, 一个行文本格式包含：font, fillStyle, strokeStyle。后面的行会复用前面的行的格式。
  eg:设置第一行的文本格式为font: {style: "normal", size: 25, weight: 300}, fillStyle: "red", strokeStyle: "blue";
     设置第二行的文本格式为fillStyle: "blue";
     设置第三行的文本格式为font: {size: 30, weight: 400}, fillStyle: "yellow";
     设置第四行的文本格式和第三行的相同.
     则设置styles属性为：[{font: {style: "normal", size: 25, weight: 300}, fillStyle: "red", strokeStyle: "blue"}, {fillStyle: "blue"}, {font: {size: 30, weight: 400}, fillStyle: "blue"}].
    结果：
    第一行的文本格式为：font: {style: "normal", size: 25, weight: 300, family: "Arial"}, fillStyle: "red", strokeStyle: "blue";
    第二行的文本格式为：font: {style: "normal", size: 25, weight: 300, family: "Arial"}, fillStyle: "blue", strokeStyle: "blue";
    第三行的文本格式为：font: {style: "normal", size: 30, weight: 400, family: "Arial"}, fillStyle: "yellow", strokeStyle: "blue";
    第四行的文本格式为：font: {style: "normal", size: 30, weight: 400, family: "Arial"}, fillStyle: "yellow", strokeStyle: "blue";      
  }|
}
*/
var defaultAutoWrapText = {text: "A", maxWidth: Infinity, maxHeight: Infinity, align: "left", lineSpacing: 0, styles: [{font: {style: "normal", weight: 400, size: 16, family: "Arial"}}]};
var AutoWrapTextTrait = CompositeTrait.extend({
  __init: function(param)
  {
    this.subTraits(0).__init(param);
    if(param == undefined)
      param = defaultAutoWrapText;
    this._t.settext((param.text == undefined) ? "" : param.text);
    this._t.setmaxWidth((param.maxWidth == undefined) ? Infinity : (param.maxWidth < 0) ? 0 : param.maxWidth);
    this._t.setmaxHeight((param.maxHeight == undefined) ? Infinity : (param.maxHeight < 0) ? 0 : param.maxHeight);
    this._t.setalign((param.align == undefined) ? "left" : param.align);
    this._t.setlineSpacing((param.lineSpacing == undefined) ? 0 : param.lineSpacing);
    this._t.setstyles((param.styles == undefined) ? [{font: {style: "normal", weight: 400, size: 16, family: "Arial"}}] : param.styles);

    this._t.__splitText();
    this._t.__updateListLines();
  },
/**
@method[settext]{
  @trait[AutoWrapTextTrait]  
  @param[text string]{文本的内容。}
  @return[this]{}
  设置文本的内容。
}
*/
  settext: function(text)
  {
    this._t.cache().bbox = undefined;
    this._t.settext(text);
    this._t.__splitText();
    this._t.__updateListLines();
    return this;
  },
/**
@method[setmaxWidth]{
  @trait[AutoWrapTextTrait]  
  @param[w number]{
  文本显示框的最大宽度。
  }
  @return[this]{}
  设置文本显示框的最大宽度。
}
*/
  setmaxWidth: function(w)
  {
    //assert(w > 0, "maxWidth must be positive!!!"); 
    w = w < 0 ? 0 : w;             
    this._t.cache().bbox = undefined;
    this._t.setmaxWidth(w);
    this._t.__splitText();
    this._t.__updateListLines();
    return this;
  },
/**
@method[setmaxHeight]{
  @trait[AutoWrapTextTrait]  
  @param[h number]{
  文本显示框的最大高度。
  }
  @return[this]{}
  设置文本显示框的最大高度。
}
*/
  setmaxHeight: function(h)
  {
    //assert(h > 0, "maxHeight must be positive!!!");
    h = h < 0 ? 0 : h;  
    this._t.cache().bbox = undefined;
    this._t.setmaxHeight(h);
    this._t.__splitText();
    this._t.__updateListLines();
    return this;
  },
/**
@method[setalign]{
  @trait[AutoWrapTextTrait]  
  @param[align string]{
  文本水平的对齐方式。参数取值范围："center","right","left"。
  }
  @return[this]{}
  设置文本水平的对齐方式。
}
*/
  setalign: function(align)
  {
    this._t.cache().bbox = undefined;
    this._t.setalign(align);
    this._t.__splitText();
    this._t.__updateListLines();
    return this;
  },
/**
@method[setlineSpacing]{
  @trait[AutoWrapTextTrait]  
  @param[linespacing number]{
  文本的行间距。单位为"px"。
  }
  @return[this]{}
  设置文本的行间距。
}
*/
  setlineSpacing: function(linespacing)
  {
    this._t.cache().bbox = undefined;
    this._t.setlineSpacing(linespacing);
    this._t.__splitText();
    this._t.__updateListLines();
    return this;
  },
  localHook: function(cb)
  {
    this.hookMany(this._t, ["gprims", "maxWidth", "maxHeight", "align", "lineSpacing", "strokeStyle", "strokeFlag", "fillFlag", "text",  
                            "fillStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "anchorPoint"], cb, "a");
  },
  unlocalHook: function(cb)
  {

    this.unhookMany(this._t, ["gprims", "maxWidth", "maxHeight", "align", "lineSpacing", "strokeStyle", "strokeFlag", "fillFlag", "text", 
                            "fillStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "anchorPoint"], cb, "a");   
  },
/**
@method[__splitText #:hidden]{
  @trait[AutoWrapTextTrait]  
  @return[undefined]{}
  私有方法，用于分割字符串。
}
*/  
  __splitText: function()
  {
    //regulartext是一个数组保存处理好的数据。不支持英文单纯识别
    var maxWidth = this._t.maxWidth();
    var text = this._t.text();
    var lines = [];
    if(maxWidth == Infinity){
      lines.push(text);
    }else {      
      var lineSpacing = this._t.lineSpacing();
      var maxHeight = this._t.maxHeight();
      var styles = this._t.styles();
      var styleslen = styles.length;
      var font = styles[0].font;
      var fontSize = font.size;
      var c = text.length,
          i = 0,
          l = parseInt(maxWidth / fontSize, 10),
          lines = [];
      var count = 0;
      var addheight = fontSize;

      while(i < c &&  addheight < maxHeight && l !== 0) {
          var last = current = '';
          while(true) {
              if(i + l > c) {
                  break;
              }
              //assert(i <= l, "text substr from i to l ,i must smaller or equal than l, maybe maxWidth or maxHeight is wrong!!!");
                           
              var s = text.substr(i, l),
                  w = helper.measureText(s, font).width;

              if(w != maxWidth) {
                  if(w > maxWidth) {
                      current = '-';
                      l--;
                  } else {
                      current = '+';
                      l++;
                  }

                  if(last && last != current) {
                      if(current == '+') {
                          l--;
                      }
                      break;
                  }

                  last = current;

              } else {
                  break;
              }
          }

          lines.push(text.substr(i, l));
          i += l;
          ++count;

          if(count < styleslen){
            if(styles[count].font !== undefined){
              font = styles[count].font;
              fontSize = font.size;
              l = parseInt(maxWidth / fontSize, 10);
            }            
          }
          addheight += (fontSize + lineSpacing);
      }
    }   
    
    this._t.setsplittexts(lines);
  },
/**
@method[__updateListLines #:hidden]{
  @trait[AutoWrapTextTrait]  
  @return[undefined]{}
  私有方法，用于将分割字符串构成图元。
}
*/
  __updateListLines: function()
  {
    var maxWidth = this._t.maxWidth();
    var lines = this._t.splittexts();
    var gprims = [];
    var styles = this._t.styles();      
    var lineSpacing = this._t.lineSpacing();
    var align = this._t.align();    
    var x = 0;    
    var stylelen = styles.length;
    var font = styles[0].font;
    var fillStyle = styles[0].fillStyle;
    var strokeStyle = styles[0].strokeStyle;
    var y = 0;
    for(var i = 0, len = lines.length; i < len; i++){
      if(maxWidth !== Infinity){
        var strlength;
        if(align == "center"){
          strlength = helper.measureText(lines[i], font).width;
          x = (maxWidth - strlength)/2;
        }else if(align == "right"){
          strlength = helper.measureText(lines[i], font).width;
          x = maxWidth - strlength;
        }
      }           
      var text = TextKlass.create({font: font, text: lines[i], y: y, x: x, fillStyle: fillStyle, strokeStyle: strokeStyle});
      gprims.push(text);
      y += (font.size + lineSpacing);
      if(i+1 < stylelen){
        var styles_i = styles[i+1];
        font = (styles_i.font !== undefined) ? styles_i.font : font;        
        fillStyle = (styles_i.fillStyle !== undefined) ? styles_i.fillStyle : fillStyle;
        strokeStyle = (styles_i.strokeStyle !== undefined) ? styles_i.strokeStyle : strokeStyle;
      } 
    }
    
    this.setgprims(gprims);
  },
/**
@method[lines]{
  @trait[AutoWrapTextTrait]
  @return[number]{文本的行数}
  获取自动换行后的文本的行数，如果文本超出maxHeight，会被自动切割掉，返回的行数不包含切割掉的部分。
}
*/
  lines: function()
  {
    return this._t.splittexts().length;
  },
/**
@method[splitTexts]{
  @trait[AutoWrapTextTrait]  
  @return[array]{每一行字符串构成的数组}
  获取自动换行后每一行的文本内容构成的数组。
}
*/
  splitTexts: function()
  {
    return this._t.splittexts();
  },
/**
@method[lineStyle]{
  @trait[AutoWrapTextTrait]、  
  @param[index number]{
  第num行数,从0开始。
  }
  @return[object]{第line行的文本格式}
  获取自动换行后第index行的style格式，起始行下标从0开始。
}
*/
  lineStyle: function(index)
  {
    var styles = this._t.styles();
    if(index >= styles.length){
      return styles[styles.length - 1];
    }else {
      return styles[index];
    }
  },
/**
@method[setlineStyle]{
  @trait[AutoWrapTextTrait]  
  @param[index number]{
  第index行数,从0开始。
  }
  @param[linestyle object]{
  第index行的style。eg:{font: {size: 13}, fillStyle: "red", strokeStyle: "blue"}或者{fillStyle: "red"}
  }
  @return[this]{}
  设置第index行的style格式，起始行下标从0开始。
 }
*/
  setlineStyle: function(index, linestyle)
  {
    var styles = this._t.styles();
    if(index < styles.length){
      styles.splice(index, 1, linestyle);
    }else if(index = styles.length){
      styles.push(linestyle);
    }else {
      for(var i = styles.length, len = i-1; i < index; ++i){
        styles.push(styles[len]);
      }
      styles.push(linestyle);
    }
    this._t.setstyles(styles);

    this._t.__splitText();
    this._t.__updateListLines();

    return this;
  },
/**
@method[setstyles]{
  @trait[AutoWrapTextTrait]  
  @param[styles array]{
  文本的格式。
  }
  @return[this]{}
  设置文本的格式。
}
*/
  setstyles: function(styles)
  {
    this._t.setstyles(styles);
    this._t.__splitText();
    this._t.__updateListLines();
    return this;
  }
},
["text", "splittexts", "maxWidth", "maxHeight", "align", "lineSpacing", "styles"].concat(CompositeTrait.grantMany(["gprims", "strokeStyle", "strokeFlag", "fillFlag", "cache", "type", "id", "tag", "fillStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "anchorPoint"]))   
);

/**
@iclass[AutoWrapTextKlass Klass (AutoWrapTextTrait)]{
  自动换行的文本图元。
  @grant[AutoWrapTextTrait type #:attr 'READONLY]
  @grantMany[AutoWrapTextTrait text gprims styles maxWidth maxHeight align lineSpacing]
  @grantMany[AutoWrapTextTrait ratioAnchor anchor strokeStyle strokeFlag id tag fillFlag fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY]
  @constructor[AutoWrapTextKlass]{
    @param[param object]{
      @verbatim|{
        初始化参数对象包含的属性可以为：
        id:id值。
        tag:tag标签。
        text: 文本内容。
        styles:每行的style组成的数组。
        fillStyle：整个文本的fillStyle。如果styles中设置，则以styles为先。
        strokeStyle：整个文本的strokStyle。如果styles中设置，则以styles为先。
        maxWidth：最大宽度。
        maxHeight：最大高度。
        align:对齐方式。
        lineSpacing：行间距。
        x:精灵的x坐标。
        y:精灵的y坐标。
        z:精灵的z坐标。
        ratioAnchor: 百分比设置锚点。
        anchor：锚点。
        strokeFlag、fillFlag、shadowColor、shadowBlur、shadowOffsetX、shadowOffsetY
      }|
    }
  }
}
**/
var AutoWrapTextKlass = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize");
    this.subTraits(0).__init(param);
  }
},
 [[READONLY("type"), AutoWrapTextTrait.grant("type")], [CUSTOM_SETTER("text"), AutoWrapTextTrait.grant("text")], 
  [CUSTOM_SETTER("gprims"), AutoWrapTextTrait.grant("gprims")],[CUSTOM_SETTER("styles"), AutoWrapTextTrait.grant("styles")],
  [CUSTOM_SETTER("maxWidth"), AutoWrapTextTrait.grant("maxWidth")], [CUSTOM_SETTER("maxHeight"), AutoWrapTextTrait.grant("maxHeight")],
  [CUSTOM_SETTER("align"), AutoWrapTextTrait.grant("align")], [CUSTOM_SETTER("lineSpacing"), AutoWrapTextTrait.grant("lineSpacing")],
  [CUSTOM_SETTER("strokeStyle"), AutoWrapTextTrait.grant("strokeStyle")], [CUSTOM_SETTER("fillStyle"), AutoWrapTextTrait.grant("fillStyle")],
  [CUSTOM_SETTER("shadowColor"), AutoWrapTextTrait.grant("shadowColor")]].concat(
  AutoWrapTextTrait.grantMany(["strokeFlag", "fillFlag", "id", "tag", "shadowBlur", "shadowOffsetX", "shadowOffsetY"])),
 [AutoWrapTextTrait]
);

export$({
  AutoWrapTextTrait : AutoWrapTextTrait,
  AutoWrapTextKlass : AutoWrapTextKlass
});
};
__modules__["/gprims/clipgprim.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits")
,   GPrimTrait = require("./gprim").GPrimTrait
,   debug = require("../lib/debug");

var geo = require("../lib/geometry");

var Klass = colortraits.Klass;
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;

/**
@itrait[ClipTrait]{
  @extend[GPrimTrait]{}
  @traitGrantAll[GPrimTrait #:trait ClipTrait]    
  矩形剪裁图元的基本功能单元。
}
**/

/**
@property[gprim gprim]{
  @trait[ClipTrait]
  被剪裁的图元。
}
*/
/**
@property[clipx float #:def 0]{
  @trait[ClipTrait]
  裁减窗口的左上角x坐标，相对于被裁减的目标gprim的本地坐标系。
}
*/
/**
@property[clipy float #:def 0]{
  @trait[ClipTrait]
  裁减窗口的左上角y坐标。
}
*/
/**
@property[clipw float #:def 0]{
  @trait[ClipTrait]
  裁减的宽度。
}
*/
/**
@property[cliph float #:def 0]{
  @trait[ClipTrait]
  裁减的高度。
}
*/
var defaultClip = {clipx: 0, clipy: 0, clipw: 0, cliph: 0};
var ClipTrait = GPrimTrait.extend({
  __init: function(param)
  {
    this.subTraits(0).__init(param);
    if(param == undefined)
      param = defaultClip;
    this._t.setgprim((param.gprim == undefined) ? debug.error('CilpGPrim constructor: param error') : param.gprim);
    this._t.setclipx((param.clipx == undefined) ? 0 : param.clipx);
    this._t.setclipy((param.clipy == undefined) ? 0 : param.clipy);
    this._t.setclipw((param.clipw == undefined) ? 0 : param.clipw);
    this._t.setcliph((param.cliph == undefined) ? 0 : param.cliph);
    this._t.settype("clip");
  },
/**
@method[setclipw]{
  @trait[ClipTrait]
  @param[w float]{}
  @return[this]{}
  设置裁剪的宽度。
}
*/
  setclipw: function(w)
  {
    this._t.cache().bbox = undefined;
    this._t.setclipw(w);
    return this;
  },
/**
@method[setcliph]{
  @trait[ClipTrait]
  @param[h float]{}
  @return[this]{}
  设置裁剪的高度。
}
*/
  setcliph: function(h)
  {
    this._t.cache().bbox = undefined;
    this._t.setcliph(h);
    return this;
  },
  localBbox: function()
  {
    return geo.rectMake(0, 0, this._t.clipw(), this._t.cliph());
  },
  localInside: function(x, y)
  {
    return 0 <= x && x <= this._t.clipw()
      && 0 <= y && y <= this._t.cliph()
      && this._t.gprim().inside(x + this._t.clipx(), y + this._t.clipy());
  },
  localHook: function(cb)
  {
    this.hookMany(this._t, ["gprim", "clipx", "clipy", "clipw", "cliph", "anchorPoint"], cb, "a");
    this._t.gprim().localHook(cb);
  },
  unlocalHook: function(cb)
  { 
    this.unhookMany(this._t, ["gprim", "clipx", "clipy", "clipw", "cliph"], cb, "a"); 
    this._t.gprim().unlocalHook(); 
  }
},
 ["gprim", "clipx", "clipy", "clipw", "cliph"].concat(GPrimTrait.grantAll())
);


/**
@iclass[ClipKlass Klass (ArcTrait)]{
  矩形剪裁图元。
  @grant[ClipTrait type #:attr 'READONLY]
  @grant[ClipTrait clipw #:attr 'CUSTOM_SETTER]
  @grant[ClipTrait cliph #:attr 'CUSTOM_SETTER]
  @grantMany[ClipTrait gprim clipx clipy id tag]
}
**/
/**
@property[ratioAnchor object #:def "{ratiox: 0, ratioy: 0}"]{
  @class[ClipKlass]
  图元左上角到图元锚点的距离与未经矩阵变换的图元的宽高比组成的对象。
}
*/
/**
@property[anchor object #:def "{x: 0, y: 0}"]{
  @class[ClipKlass]
  图元锚点在local坐标系下的位置。
}
*/
var ClipKlass = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize");
    this.subTraits(0).__init(param);
  }
},
 [[READONLY("type"), ClipTrait.grant("type")], [CUSTOM_SETTER("clipw"), ClipTrait.grant("clipw")],
  [CUSTOM_SETTER("cliph"), ClipTrait.grant("cliph")]].concat(ClipTrait.grantMany(["id", "tag", "gprim", "clipx", "clipy"])),
 [ClipTrait]);

export$({
  ClipTrait : ClipTrait,
  ClipKlass : ClipKlass
});
};
__modules__["/world.js"] = function(require, load, export$) {
var Klass = require("./lib/colortraits").Klass;
var Trait = require("./lib/colortraits").Trait;
var compose = require("./lib/colortraits").compose;
var TreeSceneTrait = require("scene").TreeSceneTrait;
var TopCameraTrait = require("camera/all").TopCameraTrait;
var EventDecider = require("eventdecider").EventDecider;
var BubbleEventDecider = require("eventdecider").BubbleEventDecider;
var HonestPainter = require("painter/all").HonestPainter;
var helper = require("./lib/helper");

var DirtyManagerTrait = require("./lib/dirtymanager").DirtyManagerTrait;
var AutoRepaintTrait = require("./lib/autorepaint").AutoRepaintTrait;

var Rx = require("./thirdlib/rx/all");

var defaultFrameRate = 30;
var defaultInvalidateTime = 10;

/**
@itrait[WorldTrait]{
  @compose[(TreeSceneTrait TopCameraTrait DirtyManagerTrait AutoRepaintTrait)]{
  }
  WorldTrait是集场景管理、场景渲染、脏矩形管理、自动重绘为一体的功能单元。它里面包含了场景管理、场景渲染、脏矩形管理、自动重绘所有的功能。
}
*/
/**
@property[invalidateTime number #:def 10]{
  @trait[GPrimTrait]
  重绘命令延迟时间。
}
@property[invalidateFlag boolean #:def false]{
  @trait[GPrimTrait]
  是否已经有重绘请求标志位。
  如果有，在提交重复请求时不会重复提交。
}
@property[invalidateSubject Subject]{
  @trait[GPrimTrait]
  重绘消息流。
}
@property[bubbling boolean]{
  @trait[GPrimTrait]
  消息冒泡功能开关。true:开启，false:关闭。
}
@property[frameRate number #:def 30]{
  @trait[GPrimTrait]
  舞台更新的帧率。
}
@property[showFPS boolean #:def false]{
  @trait[GPrimTrait]
  实时帧率显示开关。
}
*/
var WorldTrait = compose([TreeSceneTrait, TopCameraTrait, DirtyManagerTrait, AutoRepaintTrait], {
/**
@method[__init #:hidden]{
  @trait[WorldTrait]
  @param[param object]{
    参数对象中需要包括：
    @verbatim|{
      width: 画布的宽度。
      height: 画布的高度。
      container: 画布的父容器；缺省参数，默认 body。
      frameRate: world的逻辑更新频率；缺省参数，默认 30帧。
      showFPS: 是否显示 world 更新帧率；缺省参数，默认 false。
      autorepaint：创建的时候设置，是否要自动重绘，缺省参数，默认  false。
      dirtyMgrFlag: 创建的时候设置，是否打开脏矩形开关，缺省参数，默认  false。
    }|
  }
  @return[this]{}
  WorldTrait 初始化函数。
}
*/
  __init : function(param)
  {
    this.subTraits(0).__init({owner:this, interactable:param.interactable});
    this.subTraits(1).__init();
    this.subTraits(2).__init(param);
    this.subTraits(3).__init(param);

    this._t.setgTime(0);
    this._t.setbFreeze(false);
    if(param.bubbling)
      this._t.setbubbling(param.bubbling);
    if(param.invalidateTime)
      this._t.setinvalidateTime(param.invalidateTime);
    else
      this._t.setinvalidateTime(defaultInvalidateTime);

    this.initInvalidate();

    this._t.setpainter(HonestPainter.create(helper.createSketchpad(param.width, param.height, param.container)));

    //colorbox将各个painter、camera、scene等功能都抽象成为 trait 功能单元,同时也提供 Klass 实体。
    //因此在 painter、camera、scene 等功能单元内部，默认是认为大家都是分开的。
    //在不同的应用场景中，用户可能需要不一样的策略，有时候需要将 painter、camera、scene 都组合在一起，
    //在 world 这样的应用场景中就是将 painter、camera、scene和world一体的。
    //因此在调用 painter、camera、scene 等模块的函数时，好几个参数都是 world 。

    if(!!this._t.bubbling())
      this._t.seteventDecider(BubbleEventDecider.create(this, this._t.painter().eventObservables(), this));
    else
      this._t.seteventDecider(EventDecider.create(this, this._t.painter().eventObservables(), this));

    if(param.frameRate)
    {
      this._t.setframeRate(param.frameRate);
    }
    else
      this._t.setframeRate(defaultFrameRate);

    this._t.setinterval(Math.floor(1000/this._t.frameRate()));

    if(param.showFPS)
      this._t.setshowFPS(param.showFPS);
    else
      this._t.setshowFPS(false);

    this.createEventStream("system");
  },
/**
@method[redraw]{
  @trait[WorldTrait]
  @return[this]{}
  重绘函数，该函数会立即将场景重绘。
}
*/
  redraw : function()
  {
    if(!this.dirtyMgrFlag()){
      this._t.painter().clear();
    }    
    this.draw(this._t.painter(), this);

    return this;
  },
/**
@method[update #:hidden]{
  @trait[WorldTrait]
  @param[t number]{当前世界时间。}
  @param[dt number]{距离上一次更新的间隔时间。}
  @return[this]{}
  更新函数，该函数会对场景中所有的精灵进行逻辑更新及重绘。
}
*/
  update : function(t, dt)
  {
  	this.subTraits(0).__update(t, dt);

    this.redraw();
  },
/**
@method[loop]{
  @trait[WorldTrait]
  @return[this]{}
  world的驱动函数，调用此函数后world才会以一定频率驱动起来。
}
*/
  loop : function()
  {
    var date = new Date();
  	var now = lastTime = date.getTime();
    var dt = 0;
    var gTime = this._t.gTime();

  	var self = this;
    var selfT = this._t;

    var bShowFPS = this._t.showFPS();
    if(bShowFPS)
    {
      var times = 0;
      var elapsed = 0;
    }

  	function loop()
  	{
      date = new Date();
  	  now = date.getTime();
      dt = now - lastTime;
      lastTime = now;
      gTime += dt;
      selfT.setgTime(gTime);

      if(bShowFPS)
      {
        elapsed += dt;
        times ++;
        if (elapsed > 2000)
        {
          document.getElementById("fps").innerHTML = Math.floor(times * 1000 / elapsed) + "";
          
          elapsed = 0;
          times = 0;
        }
      }

  	  self.update(gTime, dt);
  	}
    
  	this.update(gTime, 0);
    this._t.settimer(setInterval(loop, this._t.interval()));

    return this;
  },
/**
@method[freeze]{
  @trait[WorldTrait]
  @return[this]{}
  将整个world冰封起来，world将静止不动，不会进行逻辑更新及重绘等。
}
*/
  /*freeze时，整个世界的时钟都是静止的，因此当 unfreeze 时，当前时间是静止时的时间，并且 dt=0，就像什么都没有发生过。*/
  freeze : function()
  {
    this._t.setbFreeze(true);
    clearInterval(this._t.timer());
    this._t.settimer(undefined);

    return this;
  },
/**
@method[unfreeze]{
  @trait[WorldTrait]
  @return[this]{}
  将 freeze 后 的world解冻恢复，恢复后 world 会正常进行逻辑更新等。
}
*/
  unfreeze : function()
  {
    this.loop();
    this._t.setbFreeze(false);

    return this;
  },
/**
@method[eventDecider #:hidden]{
  @trait[WorldTrait]
  @return[EventDecider]{}
  获取世界的事件处理器。
}
*/
  eventDecider : function()
  {
    return this._t.eventDecider();
  },
/*
@method[initInvalidate #:hidden]{
  @trait[WorldTrait]
  @return[this]{}
  初始化重绘制函数。
}
*/
  initInvalidate:function()
  {
    this._t.setinvalidateFlag(false);
    this._t.setinvalidateSubject(new Rx.Subject());

    var self = this;
    var _t = this._t;
    this._t.invalidateSubject().asObservable().delay(this._t.invalidateTime()).subscribe(function(e){
      //redraw world
      //console.log("rx delay cb");
      self.redraw();
      _t.setinvalidateFlag(false);
    });

    return this;
  },
/**
@method[invalidate]{
  @trait[WorldTrait]
  @return[this]{}
  提交重绘请求，舞台会在合适的时候将场景重绘。
}
*/
  invalidate:function()
  {
    if(this._t.invalidateFlag() === true)
      return;

    this._t.setinvalidateFlag(true);
    this._t.invalidateSubject().onNext("redraw");

    return this;
  },
/**
  @method[setSize]{
    @trait[WorldTrait]
    @return[this]{}
    设置世界的宽度和高度。
 }
*/
  setSize : function(w, h)
  {
    this._t.painter().setWidth(w);
    this._t.painter().setHeight(h);
    this.invalidate();

    return this;
  },
/**
@method[getSize]{
  @trait[WorldTrait]
  @return[this]{}
  获取世界的宽度和高度。
}
*/
  getSize : function()
  {
    return this._t.painter().getSize();
  },
/**
@method[painter]{
  @trait[WorldTrait]
  @return[HonestPainter]{}
  获取世界的绘制器。
}
*/
  painter : function()
  {
    return this._t.painter();
  }
}, 
["invalidateTime", "invalidateFlag", "invalidateSubject", "bubbling", "frameRate", "showFPS", "interval", "gTime", "timer", "painter", "eventDecider", "bFreeze"]
);


/**
@iclass[World Klass (WorldTrait)]{
  world 是集场景管理、场景渲染、事件派发、脏矩形管理、自动重绘等一体的抽象世界。
  用户创建的精灵必须加入到world中才能显示和交互。
}
*/
var World = Klass.extend({
  initialize : function(param)
  {
  	this.subTraits(0).__init(param);
  }
}, [], [WorldTrait]);

export$({
  WorldTrait:WorldTrait,
  World:World
});
};
__modules__["/thirdlib/rx/rx.html.js"] = function(require, load, export$) {
/**
* Copyright 2011 Microsoft Corporation
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

(function (root, factory) {
    var freeExports = typeof exports == 'object' && exports &&
    (typeof root == 'object' && root && root == root.global && (window = root), exports);

    // Because of build optimizers
    if (typeof define === 'function' && define.amd) {
        define(['rx', 'exports'], function (Rx, exports) {
            root.Rx = factory(root, exports, Rx);
            return root.Rx;
        });
    }  else if (typeof module == 'object' && module && module.exports == freeExports) {
        var rxroot = factory(root, module.exports, require('./rx'));
        module.exports = rxroot;
    } else {
        root.Rx = factory(root, {}, root.Rx);
    }
}(this, function (global, exports, root, undefined) {

    var Observable = root.Observable,
        observableProto = Observable.prototype,
        observableCreateWithDisposable = Observable.createWithDisposable,
        disposableCreate = root.Disposable.create,
        CompositeDisposable = root.CompositeDisposable,
        RefCountDisposable = root.RefCountDisposable,
        AsyncSubject = root.AsyncSubject;

    var createEventListener = function (el, eventName, handler) {
        var disposables = new CompositeDisposable(),

            createListener = function (element, eventName, handler) {
                if (element.addEventListener) {
                    element.addEventListener(eventName, handler, false);
                    return disposableCreate(function () {
                        element.removeEventListener(eventName, handler, false);
                    });
                } else if (element.attachEvent) {
                    element.attachEvent('on' + eventName, handler);
                    return disposableCreate(function () {
                        element.detachEvent('on' + eventName, handler);
                    });         
                } else {
                    element['on' + eventName] = handler;
                    return disposableCreate(function () {
                        element['on' + eventName] = null;
                    });
                }
            };

        if ( el && el.nodeName || el === global ) {
            disposables.add(createListener(el, eventName, handler));
        } else if ( el && el.length ) {
            for (var i = 0, len = el.length; i < len; i++) {
                disposables.add(createEventListener(el[i], eventName, handler));
            }
        }

        return disposables;
    };

    Observable.fromEvent = function (element, eventName) {
        return observableCreateWithDisposable(function (observer) {
            var handler = function (e) {
                observer.onNext(e); 
            };
            return createEventListener(element, eventName, handler);
        });
    };

    var destroy = (function () {
        var trash = document.createElement('div');
        return function (element) {
            trash.appendChild(element);
            trash.innerHTML = '';
        };
    })();


    Observable.getJSONPRequest = (function () {
        var uniqueId = 0;
        return function (url) {
            var subject = new AsyncSubject(),
                head = document.getElementsByTagName('head')[0] || document.documentElement,
                tag = document.createElement('script'),
                handler = 'rxjscallback' + uniqueId++,
                url = url.replace('=JSONPCallback', '=' + handler);

            global[handler] = function (data) {
                subject.onNext(data);
                subject.onCompleted();  
            };

            tag.src = url;
            tag.async = true;
            tag.onload = tag.onreadystatechange = function (_, abort) {
                if ( abort || !tag.readyState || /loaded|complete/.test(tag.readyState) ) {
                    tag.onload = tag.onreadystatechange = null;
                    if (head && tag.parentNode) {
                        destroy(tag);
                    }
                    tag = undefined;
                    delete global[handler];
                }

            };  
            head.insertBefore(tag, head.firstChild );
            var refCount = new RefCountDisposable(disposableCreate( function () {
                if (!/loaded|complete/.test(tag.readyState)) {
                    tag.abort();
                    tag.onload = tag.onreadystatechange = null;
                    if (head && tag.parentNode) {
                        destroy(tag);
                    }
                    tag = undefined;
                    delete global[handler];
                    subject.onError(new Error('The script has been aborted'));
                }
            }));

            return observableCreateWithDisposable( function (subscriber) {
                return new CompositeDisposable(subject.subscribe(subscriber), refCount.getDisposable());
            });
        };      

    })();



    function getXMLHttpRequest() {
        if (global.XMLHttpRequest) {
            return new global.XMLHttpRequest;
        } else {
            try {
                return new global.ActiveXObject('Microsoft.XMLHTTP');
            } catch (e) {
                throw new Error('XMLHttpRequest is not supported by your browser');
            }
        }
    }

    var observableAjax = Observable.ajax = function (settings) {
        if (typeof settings === 'string') {
            settings = { method: 'GET', url: settings, async: true };
        }
        if (settings.async === undefined) {
            settings.async = true;
        }
        var subject = new AsyncSubject(),
            xhr = getXMLHttpRequest();

        if (settings.headers) {
            var headers = settings.headers, header;
            for (header in headers) {
                xhr.setRequestHeader(header, headers[header]);
            }
        }                   
        try {
            if (details.user) {
                xhr.open(settings.method, settings.url, settings.async, settings.user, settings.password);
            } else {
                xhr.open(settings.method, settings.url, settings.async);
            }
            xhr.onreadystatechange = xhr.onload = function () {
                if (xhr.readyState === 4) {
                    var status = xhr.status;
                    if ((status >= 200 && status <= 300) || status === 0 || status === '') {
                        subject.onNext(xhr);
                        subject.onCompleted();
                    } else {
                        subject.onError(xhr);
                    }
                }
            };
            xhr.onerror = xhr.onabort = function () {
                subject.onError(xhr);
            };
            xhr.send(settings.body || null);
        } catch (e) {
            subject.onError(e);
        }

        var refCount = new RefCountDisposable(disposableCreate( function () {
            if (xhr.readyState !== 4) {
                xhr.abort();
                subject.onError(xhr);
            }
        }));

        return observableCreateWithDisposable( function (subscriber) {
            return new CompositeDisposable(subject.subscribe(subscriber), refCount.getDisposable());
        });
    };

    Observable.post = function (url, body) {
        return observableAjax({ url: url, body: body, method: 'POST', async: true });
    };

    var observableGet = Observable.get = function (url) {
        return observableAjax({ url: url, method: 'GET', async: true });
    };

    if (typeof window.JSON !== 'undefined') {
        Observable.getJSON = function (url) {
            return observableGet(url).select(function (xhr) {
                return JSON.parse(xhr.responseText);
            });
        };      
    }

    return root;

}));
};
__modules__["/camera/all.js"] = function(require, load, export$) {
export$({
  TopCamera : require("./topcamera").TopCamera,
  TopCameraTrait : require("./topcamera").TopCameraTrait
});
};
__modules__["/singlegprimtreeactor.js"] = function(require, load, export$) {
var Trait = require("./lib/colortraits").Trait;
var TreeActor = require("treeactor").TreeActor;
var READONLY = require("./lib/colortraits").READONLY;
var PRIVATE = require("./lib/colortraits").PRIVATE;
var CUSTOM_SETTER = require("./lib/colortraits").CUSTOM_SETTER;
var geo = require("./lib/geometry");

var Pidget = require("pidget");
var DisplayObject = Pidget.DisplayObject
,   InteractiveObject = Pidget.InteractiveObject
,   EffectedDisplayObject = Pidget.EffectedDisplayObject
,   EffectedInteractiveObject = Pidget.EffectedInteractiveObject;


/**
@iclass[SingleGPrimTreeActor TreeActor]{
  只有一个GPrim的TreeActor。
  @constructor[SingleGPrimTreeActor]{
    @param[param object]{创建只有一个图元的树状精灵所需参数。}
  }
  @jscode{
    //创建只有一个图元的树状精灵。
    Actor.create({
      interactable:false,
      gprim:textGprim
    });
  }
}
*/
/**
@property[gprim Gprim]{
  @class[SingleGPrimTreeActor]
  精灵的图元。
}
*/
/**
@property[interactiveObject Pidget]{
  @class[SingleGPrimTreeActor]
  精灵的交互对象。
}
*/
/**
@property[displayObject Pidget]{
  @class[SingleGPrimTreeActor]
  精灵的显示对象。
}
*/
var SingleGPrimTreeActor = TreeActor.extend({
  initialize: function(param){
    this.execProto("initialize", param);

    var gprim = param.gprim;
    this._t.setgprim(gprim);
    this._t.setdisplayObject(DisplayObject.create({
      gprim:gprim, 
      worldMatrix:this.matrix(), 
      effect:{ownerActor:this},
      actor:this
    }));
    this._t.setinteractiveObject(InteractiveObject.create({
      gprim:gprim, 
      worldMatrix:this.matrix(), 
      actor:this
    }));
    this._t.setopenVisRefs(0);
    var self = this;//actor
    function cb(evt){
      if(evt.type == "clipperChanged" || evt.type == "effectChanged"){
        var param = {
              gprim:self.gprim(), 
              matrix:self.matrix(), 
              actor:self
            }
        if(!evt.clipper && !evt.effect){
          self.setdisplayObject(DisplayObject.create(param));
          self.setinteractiveObject(InteractiveObject.create(param));
        }else{
          self.setdisplayObject(EffectedDisplayObject.create(param));
          self.setinteractiveObject(EffectedInteractiveObject.create(param));
        }
      }
    }
    this.subscribe("system", cb);

    this.setbeforeBbox(undefined);
  },
/**
@method[emitDisplayObjects #:hidden]{
  @trait[SingleGPrimTreeActor]
  @param[displayObjs array]{渲染对象列表。}
  @return[array]{displayObjs}
  将精灵所对应图元的显示对象提交到显示对象列表中。
}
*/
  emitDisplayObjects:function(v)
  {
    this._t.displayObject().setworldMatrix(this.matrix());
    v.push(this._t.displayObject());

    return v;
  },
/**
@method[emitInteractiveObjects #:hidden]{
  @trait[SingleGPrimTreeActor]
  @param[interactiveObjs array]{交互对象列表。}
  @return[array]{interactiveObjs}
  将精灵所对应图元的交互对象提交到显示对象列表中。。
}
*/
  emitInteractiveObjects:function(v)
  {
    this._t.interactiveObject().setworldMatrix(this.matrix());
    v.push(this._t.interactiveObject());

    return v;
  },
/**
@method[hookVisible #:hidden]{
  @trait[SingleGPrimTreeActor]
  @param[function cb]{hook的callback函数}
  @return[undefined]{}
  hook住Actor、gprim上影响显示的属性，以及hook住Actor本身所挂的gprim。
}
*/
  hookVisible: function(cb)
  {
    this.execProto("hookActorVisible", cb);
    this.hook(this._t, "gprim", cb, "a");    
    this.gprim().hookGPrimVisible(cb);
  },
/**
@method[unhookVisible #:hidden]{
  @trait[SingleGPrimTreeActor]
  @param[function cb]{unhook的callback函数}
  @return[undefined]{}
  unhook住Actor、gprim上影响显示的属性，以及unhook住Actor本身所挂的gprim。
}
*/
  unhookVisible: function(cb)
  {
    this.execProto("unhookActorVisible", cb);
    this.unhook(this._t, "gprim", cb, "a");       
    this.gprim().unhookGPrimVisible(cb);
  },
/**
@method[__openVisibleStream #:hidden]{
  @trait[SingleGPrimTreeActor]
  @param[function cb]{hook的callback函数}
  @return[undefined]{}
  给system消息管道添加一个visibleChanged的消息。
}
*/
  __openVisibleStream : function(cb)
  {
    if(this._t.openVisRefs() == 0)
    {
      var self = this;
      var visibleafter = function(obj){
        self.notify("system", "visibleChanged");
      };
      this.hookVisible(visibleafter);
      this._t.setopenVisCB(visibleafter);
    }

    this._t.setopenVisRefs(this._t.openVisRefs() + 1);
  },
/**
@method[__closeVisibleStream #:hidden]{
  @trait[SingleGPrimTreeActor]
  @param[function cb]{unhook的callback函数}
  @return[undefined]{}
  给system消息管道移除一个visibleChanged的消息。
}
*/
  __closeVisibleStream : function()
  {
    this._t.setopenVisRefs(this._t.openVisRefs() - 1);
    if(this._t.openVisRefs() == 0)
      this.unhookVisible(this._t.openVisCB());
  },
/**
@method[enableAutoRepaint #:hidden]{
  @class[SingleGPrimTreeActor]
  @return[undefined]{}
  当场景的自动重绘是开启状态时，精灵被加入场景会调用此函数。
  该函数会hook住影响精灵显示的所有属性，当属性发生改变时会往精灵的visibleChanged消息流中发消息。
}
*/ 
  enableAutoRepaint : function()
  {
    this._t.__openVisibleStream();
    var self = this;
    var boserver = this.subscribe("system", function(str){
      if(str == "visibleChanged"){
        self.ownerScene().owner().invalidate();
      }
      }); //这里还需要添加一个属性去保存住那个返回的监听者
    this.setvisobserver(boserver);
  },
/**
@method[enableDirtyRects #:hidden]{
  @class[SingleGPrimTreeActor]
  @return[undefined]{}
  当场景的脏矩形是开启状态时，精灵被加入场景会需要通知场景脏了。
  给消息管道system添加一个监听。
}
*/
  enableDirtyRects: function()
  {
    this.setbeforeBbox(this.bbox());
    this._t.__openVisibleStream();
    var self = this;
    var boserver = this.subscribe("system", function(){
      var rect = self.beforeBbox();
      self.ownerScene().calculateDirtyRect(rect);
      self.ownerScene().calculateDirtyRect(self.bbox());
      self.setbeforeBbox(self.bbox());
    }); 
    this._t.setdirtyobserver(boserver);
  },
/**
@method[disableDirtyRects #:hidden]{
  @class[SingleGPrimTreeActor]
  @return[undefined]{}
  当场景的脏矩形是开启状态时,actor从场景中移除的时候，会调用此函数关闭actor上的一些hook。
}
*/
  disableDirtyRects: function()
  {
    this._t.__closeVisibleStream();
    this._t.dirtyobserver().dispose();  
  },
/**
@method[disableAutoRepaint #:hidden]{
  @class[SingleGPrimTreeActor]
  @return[undefined]{}
  当场景的自动重绘是开启状态时,actor从场景中移除的时候，会调用此函数关闭actor上的一些hook。
}
*/
  disableAutoRepaint: function()
  {
    this._t.__closeVisibleStream();
    this._t.visobserver().dispose();
  },
/**
@method[bbox]{
  @class[SingleGPrimTreeActor]
  @return[rect]{}
  获取actor的包围盒。
}
*/
  bbox:function()
  {
    return geo.rectApplyMatrixToBoundRect(this.gprim().bbox(), this.matrix());
  },
/**
@method[setgprim]{
  @class[SingleGPrimTreeActor]
  @return[this]{}
  设置精灵的显示图元，默认情况下显示图元和参与交互的图元是同一个，因此都需要设置。
}
*/
  setgprim:function(gp)
  {
    this._t.setgprim(gp);
    this._t.displayObject().setgprim(gp);
    this._t.interactiveObject().setgprim(gp);

    return this;
  }

},[CUSTOM_SETTER("gprim"), "displayObject", "interactiveObject", "visobserver", "dirtyobserver", "beforeBbox", PRIVATE("openVisRefs"), PRIVATE("openVisCB")]);

export$({
  SingleGPrimTreeActor:SingleGPrimTreeActor
});

};
__modules__["/lib/dirtymanager.js"] = function(require, load, export$) {
var colortraits = require("./colortraits");
var geo = require("./geometry");
var EventStreamTrait = require("./eventstream");

var Klass = colortraits.Klass;
var Trait = colortraits.Trait;
var compose = colortraits.compose;

/**
@itrait[DirtyManagerTrait]{
  脏矩形管理功能单元。
}
*/
var enableDirtyRects = function(actor)
{
  actor.enableDirtyRects();
};
var disableDirtyRects = function(actor)
{
  actor.disableDirtyRects();
}
var DirtyManagerTrait = compose([EventStreamTrait], {
  __init: function(param)
  {
    this.subTraits(0).__init();
    this._t.setdirtyMgrFlag((param == null || param.dirtyMgrFlag == undefined) ? false : param.dirtyMgrFlag);    
    if(this._t.dirtyMgrFlag()) {
      this._t.setminBoundingDirtyRect({});
      this.createEventStream("system");
      var self = this;
      this.subscribe("system", function(evt){
        if(evt.type == "addActor"){
          //evt.actor.enableDirtyRects(); 
          evt.actor.forEach(enableDirtyRects);         
        }else if(evt.type == "removeActor"){
          //evt.actor.disableDirtyRects();
          evt.actor.forEach(disableDirtyRects);
        }
        self.calculateDirtyRect(evt.actor.bbox());
        
      });
    }else {
      this._t.setminBoundingDirtyRect(null);
    }     
  },
/**
@method[calculateDirtyRect #:hidden]{
  @trait[DirtyManagerTrait]
  @param[rect rect]{}
  提交一个脏矩形。
}
*/
  calculateDirtyRect: function(rect) 
  {
    var dirtyrect = this._t.minBoundingDirtyRect();
     if(dirtyrect.x == undefined){
      var minX = Math.floor(rect.x);
      var minY = Math.floor(rect.y);
      var maxX = Math.ceil(rect.x + rect.width);
      var maxY = Math.ceil(rect.y + rect.height);
      dirtyrect.x = minX;
      dirtyrect.y = minY;
      dirtyrect.width = maxX - minX;
      dirtyrect.height = maxY - minY;
    } else {
      var minX = Math.floor(Math.min(dirtyrect.x, rect.x));
      var minY = Math.floor(Math.min(dirtyrect.y, rect.y));
      var maxX = Math.ceil(Math.max(dirtyrect.x + dirtyrect.width, rect.x + rect.width));
      var maxY = Math.ceil(Math.max(dirtyrect.y + dirtyrect.height, rect.y + rect.height));

      dirtyrect.x = minX;
      dirtyrect.y = minY;
      dirtyrect.width = maxX - minX;
      dirtyrect.height = maxY - minY;
    }
    /*if(dirtyrect.x == undefined){
      dirtyrect.x = rect.x;
      dirtyrect.y = rect.y;
      dirtyrect.width = rect.width;
      dirtyrect.height = rect.height;
    } else {
      var minX = Math.floor(Math.min(dirtyrect.x, rect.x));
      var minY = Math.floor(Math.min(dirtyrect.y, rect.y));
      var maxX = Math.ceil(Math.max(dirtyrect.x + dirtyrect.width, rect.x + rect.width));
      var maxY = Math.ceil(Math.max(dirtyrect.y + dirtyrect.height, rect.y + rect.height));

      dirtyrect.x = minX;
      dirtyrect.y = minY;
      dirtyrect.width = maxX - minX;
      dirtyrect.height = maxY - minY;
    }*/

  },
/**
@method[minBoundingDirtyRect #:hidden]{
  @trait[DirtyManagerTrait]
  获取当前的脏矩形。
}
*/
  minBoundingDirtyRect: function()
  {
    return this._t.minBoundingDirtyRect();
  },
/**
@method[clearminBoundingDirtyRect #:hidden]{
  @trait[DirtyManagerTrait]
  将脏矩形清空。
}
*/
  clearminBoundingDirtyRect: function()
  {
    var rect = this._t.minBoundingDirtyRect();
    rect.x = undefined;
    rect.y = undefined;
    rect.width = undefined;
    rect.height = undefined;
  },
/**
@method[dirtyMgrFlag #:hidden]{
  @trait[DirtyManagerTrait]
  @return[boolean]{}
  获取脏矩形开关。
}
*/
  dirtyMgrFlag: function()
  {
    return this._t.dirtyMgrFlag();
  }

},
  ["dirtyMgrFlag", "minBoundingDirtyRect"]);


//可能后期需要一个多个小的零碎的脏矩形管理

export$({DirtyManagerTrait: DirtyManagerTrait});

};
__modules__["/gprims/polygongprim.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits")
,   ShapTrait = require("./shaptrait").ShapTrait
,   geo = require("../lib/geometry");


var Klass = colortraits.Klass;
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;
/**
@itrait[PolygonTrait]{
  @extend[ShapTrait]
  @traitGrantMany[ShapTrait ratioAnchor anchor cache fillFlag strokeFlag type id tag strokeStyle fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineDash #:trait PolygonTrait]
  图元多边形的功能单元,支持凹多边形以及凸多边形。
  该GPrim的类型, type, 值为"polygon"。
}
*/
/**
@property[vertexes array #:def "[{x: 10, y: 0}, {x: 0, y: 20}, {x: 20, y: 20}]"]{
  @trait[PolygonTrait]
  array of Coordinate, 多边形的顶点列表, 例如：[{x: 1, y: 2}, {x: 3, y: 4},...{x: 12, y: 13}]。
}
*/
/**
@property[length float #:attr 'READONLY]{
  @trait[PolygonTrait]
  未经缩放的多边形的路径长度; 
  注：这里是原生的路径长度，不包含缩放的过程。
}
*/
var defaultPolygon = {vertexes: [{x: 10, y: 0}, {x: 0, y: 20}, {x: 20, y: 20}]};
var PolygonTrait = ShapTrait.extend({
  __init: function(param)
  {
    this.subTraits(0).__init(param);
    if(param == undefined)
      param = defaultPolygon;
    this._t.setvertexes((param.vertexes == undefined) ? [] : param.vertexes);
    this._t.settype("polygon");

    this._t.setlength(undefined);
  },
/**
@method[setvertexes]{
  @trait[PolygonTrait]
  @param[vertexes array]{array of Coordinate, 多边形的顶点列表, 例如：[{x: 1, y: 2}, {x: 3, y: 4},...{x: 12, y: 13}]。
  }
  @return[this]{}
  修改多边形的顶点属性。
}
*/
  setvertexes: function(vertexes)
  {
    this._t.cache().bbox = undefined;
    this._t.setvertexes(vertexes);
    this._t.setlength(undefined);
    return this;
  },
/**
@method[localBbox]{
  @trait[PolygonTrait]
  @return[rect]{多边形的local坐标系下的矩形包围盒。}
  获取local坐标系下的多边形的bbox。
}
*/
  localBbox: function()
  {
    var left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    var vs = this._t.vertexes();
    for (var i in vs)
    {
      var p = vs[i];
      left = (p.x < left) ? p.x : left;
      top = (p.y < top) ? p.y : top;
      right = (p.x > right) ? p.x : right;
      bottom = (p.y > bottom) ? p.y : bottom;                             
    }

    var linewidth = 0;
    if(this._t.strokeStyle() !== undefined || this._t.strokeFlag()) {      
      linewidth = 1;  
    }

    return geo.rectMake(left, top, right - left + linewidth, bottom - top + linewidth);
  },
/**
@method[localInside]{
  @trait[PolygonTrait]
  @param[x float]{要检测点的x坐标值。}
  @param[y float]{要检测点的y坐标值。}
  @return[boolean]{}
  判断一个点是否在loacal坐标系下的多边形的内部。
  @hyperlink["http://blog.csdn.net/hjh2005/article/details/9246967"]
}
*/
  localInside: function(x, y)
  {
    var vs = this._t.vertexes();

    return geo.isPointInPolygon(x, y, vs);
  },
  localHook: function(cb)
  {
    
    this.hookMany(this._t, ["fillFlag", "strokeFlag", "vertexes", "strokeStyle", "fillStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineDash", "anchorPoint"], cb, "a");
  },
  unlocalHook: function(cb)
  {
    
    this.unhookMany(this._t, ["fillFlag", "strokeFlag", "vertexes", "strokeStyle", "fillStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineDash", "anchorPoint"], cb, "a");   
  },
/**
@method[length]{
  @trait[PolygonTrait]
  @return[float]{路径的长度}
  获取未经缩放的多边形的路径长度。
  注：这里是原生的路径长度，不包含缩放的过程。
}
*/
  length: function()
  {
    var len = this._t.length();
    if(len == undefined){
      len = 0;
      var vertexes = this._t.vertexes();
      
      var prev, nextv;
      for(var i = 0, length = vertexes.length; i < length; i++)
      {  
        prev = vertexes[i]; 
        if(i == length -1){
          nextv = vertexes[0];
        } else {
          nextv = vertexes[i+1];
        }    
         
        len += Math.sqrt((prev.x - nextv.x)*(prev.x - nextv.x) + (prev.y - nextv.y)*(prev.y - nextv.y));
      }
      this._t.setlength(len);
    }

    return len;
  },
/**
@method[pointAtPercent]{
  @trait[PolygonTrait]
  @param[t float]{0-1之间。小于等于0, 返回起点; 大于等于1, 返回结束点。}
  @return[point]{}
  Returns the point at the percentage t of the current polygon. t在 0 到 1 之间.
  注：这里的点表示未经缩放的多边形上的点，即不包含缩放的过程。
}
*/
  pointAtPercent: function(t)
  {
    var vertexes = this._t.vertexes();
    if(t <= 0 || t >= 1){
      return {x: vertexes[0].x, y: vertexes[0].y};
    }
    var length = vertexes.length;

    var alllen = this.length();
    var prelen = 0;
    for(var i = 0, length = vertexes.length; i < length; i++)
    {
      var prev = vertexes[i]; 
      var nextv;
      if(i == length -1){
        nextv = vertexes[0];
      } else {
        nextv = vertexes[i+1];
      } 
      var templen =  Math.sqrt((prev.x - nextv.x)*(prev.x - nextv.x) + (prev.y - nextv.y)*(prev.y - nextv.y));
      prelen += templen;
      if(alllen*t <= prelen){
        var percent = (alllen*t - prelen + templen)/templen;
        return {x: prev.x + percent*(nextv.x - prev.x), y:prev.y + percent*(nextv.y - prev.y)};
      }
    }

  },
/**
@method[percentAtLength]{
  @trait[PolygonTrait]
  @param[len float]{大于总长度返回1, 小于0返回0。}
  @return[float]{占总长度的百分比}
  Returns the point at the length  of the current polygon. len在 0 到 整个长度之间。
  注：这里路径的总长度指的是未经缩放变换的总长度。      
  注：获取的是未经缩放前Polygon路径上的点，如果Polygon路径经过缩放，这里需要手动对获取的点进行相应的变换。
}
*/
  percentAtLength: function(len)
  {
    var alllen = this._t.length();
    if(len < 0)
      return 0;
    if(alllen < len)
      return 1;

    return len/alllen;
  }
},
 ["vertexes", "length"].concat(ShapTrait.grantMany(["fillFlag", "strokeFlag", "cache", "type", "id", "tag", "strokeStyle", "fillStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineDash", "anchorPoint"]))
);

/**
@iclass[PolygonKlass Klass (PolygonTrait)]{
  基本的多边形图元。
  @grant[PolygonTrait type #:attr 'READONLY]
  @grant[PolygonTrait vertexes]
  @grantMany[PolygonTrait ratioAnchor anchor fillFlag strokeFlag id tag strokeStyle fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineDash]
  @constructor[PolygonKlass]{
    @param[param object]{
      @verbatim|{
        初始化参数对象包含的属性可以为：
        vertexes
        x:精灵的x坐标。
        y:精灵的y坐标。
        z:精灵的z坐标。
        ratioAnchor: 百分比设置锚点。
        anchor：锚点。
        fillFlag strokeFlag id tag strokeStyle fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineDash
      }|
    }
  }
}
*/

var PolygonKlass = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize");
    this.subTraits(0).__init(param);
  }
},
 [[READONLY("type"), PolygonTrait.grant("type")], [CUSTOM_SETTER("vertexes"), PolygonTrait.grant("vertexes")],
  [CUSTOM_SETTER("strokeStyle"), PolygonTrait.grant("strokeStyle")], [CUSTOM_SETTER("fillStyle"), PolygonTrait.grant("fillStyle")],
  [CUSTOM_SETTER("shadowColor"), PolygonTrait.grant("shadowColor")]].concat(
  PolygonTrait.grantMany(["fillFlag", "strokeFlag", "id", "tag", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineDash"])),
[PolygonTrait]
);

export$({
  PolygonKlass : PolygonKlass,
  PolygonTrait : PolygonTrait
});
};
__modules__["/sprites/sprite.js"] = function(require, load, export$) {
var SingleGPrimTreeActor = require("../singlegprimtreeactor").SingleGPrimTreeActor;
var identifymatrix = require("../lib/geometry").identityMatrix();
/**
@title{Sprite}
*/

/**
@iclass[Sprite SingleGPrimTreeActor]{
所有sprite的基类。
@grant[TransformableTrait x #:attr 'CUSTOM_GETTER_SETTER]
@grant[TransformableTrait y #:attr 'CUSTOM_GETTER_SETTER]
@grant[TransformableTrait z #:attr 'CUSTOM_GETTER_SETTER]
@grant[TransformableTrait scale #:attr 'CUSTOM_GETTER_SETTER]
@grant[TransformableTrait rotation #:attr 'CUSTOM_GETTER_SETTER]
}
**/
var Sprite = SingleGPrimTreeActor.extend({
  initialize: function(param)
  {
    this.execProto("initialize", param);
  },

  emitDisplayObjects:function(v)
  {
    this.displayObject().setworldMatrix(identifymatrix);
    v.push(this.displayObject());

    return v;
  },

  emitInteractiveObjects:function(v)
  {
    this.interactiveObject().setworldMatrix(identifymatrix);
    v.push(this.interactiveObject());

    return v;
  },
  hookVisible: function(cb)
  {  
    this.gprim().hookGPrimVisible(cb);
  },
  unhookVisible: function(cb)
  {  
    this.gprim().unhookGPrimVisible(cb);
  }
});

export$(Sprite);
};
__modules__["/colorbox.js"] = function(require, load, export$) {
/**
@function[initColorbox]{
  @return[colorbox]{}
  初始化colorbox模块，得到colorbox句柄。
}

@bold{colorbox句柄中含有：}

@bold{@type-link[Text]{Text}:文本精灵}

@bold{@type-link[AutoWrapText]{AutoWrapText}:自动换行文本精灵}

@bold{@type-link[Rect]{Rect}:矩形精灵}

@bold{@type-link[Line]{Line}:折线精灵}

@bold{@type-link[Rect]{Rect}:矩形精灵}

@bold{@type-link[Circle]{Circle}:圆形精灵}

@bold{@type-link[Polygon]{Polygon}:多边形精灵}

@bold{@type-link[Path]{Path}:路径精灵}

@bold{@type-link[Arc]{Arc}:圆弧精灵}

@bold{@type-link[Annulus]{Annulus}:圆环精灵}

@bold{@type-link[Image]{Image}:图片精灵}

@bold{@type-link[Composite]{Composite}:组合精灵}

@bold{@type-link[Clip]{Clip}:剪裁精灵}

@bold{@type-link[BubbleReceiver]{BubbleReceiver}:冒泡消息接收精灵}

@bold{@type-link[helper]{helper}:帮助功能单元}

@bold{@type-link[colorTrait]{colorTrait}:colorTrait相关功能单元}

*/

var colorbox = {};

colorbox.Stage = require("stage").Stage;
var sprite = require("/sprites/all");
for(var key in sprite)
{
  if(sprite.hasOwnProperty(key))
  {
  	colorbox[key] = sprite[key];
  }
}

colorbox.helper = require("./lib/helper");

var colortraits = require("./lib/colortraits");
var debug = require("./lib/debug");
var selection = require("./selection/selection");
var selector = require("./selection/selector");

colorbox.Klass = colortraits.Klass;
colorbox.Trait = colortraits.Trait;
colorbox.compose = colortraits.compose;
colorbox.composeGrantProperties = colortraits.composeGrantProperties;
colorbox.READONLY = colortraits.READONLY;
colorbox.PRIVATE = colortraits.PRIVATE;
colorbox.assert = debug.assert;
colorbox.selection = selection;
colorbox.selector = selector;

export$(colorbox);
};
__modules__["/gprims/rectgprim.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits")
,   ShapTrait = require("./shaptrait").ShapTrait
,   geo = require("../lib/geometry");


var Klass = colortraits.Klass;
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;

/**
@itrait[RectTrait]{
  @extend[ShapTrait]{}
  @traitGrantMany[ShapTrait type id tag strokeStyle fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineWidth lineCap lineJoin miterLimit lineDash #:trait RectTrait]    
  矩形图元的基本功能单元。
}
**/

/**
@property[width float #:def 10 #:attr 'CUSTOM_SETTER]{
  @trait[RectTrait]
  矩形的宽度。
}
*/
/**
@property[height float #:def 10 #:attr 'CUSTOM_SETTER]{
  @trait[RectTrait]
  矩形的高度。
}
*/
var defaultRect = [{width: 10, height: 10}];
var zeroPoint = {x: 0, y: 0};
var RectTrait = ShapTrait.extend({
  __init: function(param)
  {
    this.subTraits(0).__init(param);
    if(param == undefined)
      param = defaultRect;
    this._t.setwidth((param.width == undefined) ? 10 : param.width);
    this._t.setheight((param.height == undefined) ? 10 : param.height);
    this._t.settype("rect");

    this._t.setlength(undefined);
  },
/**
@method[setwidth]{
  @trait[RectTrait]
  @param[width float]{矩形宽度值。}
  @return[this]{}
  @verbatim|{
    设置矩形的宽度。当设置了线宽的时候，bbox的width会和这里的width是不同的。
    如果通过getwidth()方法是获取bbox的width，
    如果想要获取这里设定的width,直接通过函数width()就可以获取。
  }|
}
*/
  setwidth: function(width)
  {
    this._t.cache().bbox = undefined;
    this._t.setwidth(width);
    this._t.setlength(undefined);
    return this;
  },
/**
@method[setheight]{
  @trait[RectTrait]
  @param[height float]{矩形高度值。}
  @return[this]{}
  设置矩形的高度。
}
*/
  setheight: function(height)
  {
    this._t.cache().bbox = undefined;
    this._t.setheight(height);
    this._t.setlength(undefined);
    return this;
  },
/**
@method[width]{
  @trait[RectTrait]
  @return[number]{}
  矩形的原生的宽度。
}
*/
  width: function()
  {
    return this._t.width();
  },
/**
@method[width]{
  @trait[RectTrait]
  @return[number]{}
  矩形的原生的高度。
}
*/
  height: function()
  {
    return this._t.height();
  },
/**
@method[localBbox]{
  @trait[RectTrait]
  @return[rect]{}
  获取本地坐标系下图元的包围盒。
  当设置strokeStyle或者设置其strokeFlag为true时候，它的包围盒会包括边界的宽度。
  如果不设置上述两者任一，就会默认线宽是0，所以包围盒是不包含线宽的。
}
*/
  localBbox: function()
  {
    var linewidth = 0;
    if(this._t.strokeStyle() !== undefined || this._t.strokeFlag()) {      
      linewidth = this._t.lineWidth();  
    }
    return geo.rectMake(-linewidth/2, -linewidth/2, this._t.width() + linewidth, this._t.height()+ linewidth);
  },
/**
@method[localInside]{
  @trait[RectTrait]
  @param[x float]{x坐标。}
  @param[y float]{y坐标。}
  @return[boolean]{}
  本地坐标系下，判断一个点是否在图元内。
}
*/
  localInside: function(x, y)
  {
    var linewidth = 0;
    if(this._t.strokeStyle() !== undefined || this._t.strokeFlag()) {      
      linewidth = this._t.lineWidth();  
    }
    if(x > -linewidth/2 && x < this._t.width() + linewidth && y > -linewidth/2 && y < this._t.height()+ linewidth){
      return true;
    }    
    return false;
  },
  localHook: function(cb)
  {

    this.hookMany(this._t, ["fillFlag", "strokeFlag", "width", "height", "strokeStyle", "fillStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineWidth", "anchorPoint"], cb, "a");
  },
  unlocalHook: function(cb)
  {

    this.unhookMany(this._t, ["fillFlag", "strokeFlag", "width", "height", "strokeStyle", "fillStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineWidth", "anchorPoint"], cb, "a");   
  },
/**
@method[length]{
  @trait[RectTrait]
  @return[float]{路径的长度}
  获取rect路径的长度。
}
*/
  length: function()
  {
    var len = this._t.length();
    if(len == undefined){
      len = (this._t.width() + this._t.height())*2;
      this._t.setlength(len);
    }

    return len;
  },
/**
@method[pointAtPercent]{
  @trait[RectTrait]
  @param[t float]{0-1之间。小于等于0, 返回起点; 大于等于1, 返回结束点。}
  @return[point]{}
  Returns the point at the percentage t of the current rect. t在 0 到 1 之间.检测的方向为顺时针。不支持缩放的长度，求得都是原生的长度
}
*/
  pointAtPercent: function(t)
  {
    if(t <= 0 || t >= 1)
      return zeroPoint;
    var width = this._t.width();
    var height = this._t.height();
    var len = this.length();
    if(width >= t*len){
      return {x: len*t, y: 0};
    }else if(width + height >= t*len){
      return {x: width, y: t*len - width};
    }else if(width*2 + height >= t*len){
      return {x: width - (t - 0.5)*len, y: height};
    }else {
      return {x: 0, y: (1 - t)*len};
    }
  },
/**
@method[percentAtLength]{
  @trait[RectTrait]
  @param[len float]{大于0。大于总长度返回1,小于0返回0。}
  @return[float]{大于0}
  Returns the point at the length  of the current rect path. len在 0 到 整个长度之间.不支持缩放的长度，求得都是原生的长度
}
*/
  percentAtLength: function(len)
  {
    var alllen = this._t.length();
    if(len < 0)
      return 0;
    if(alllen < len)
      return 1;

    return len/alllen;
  }
},
 ["width", "height", "length"].concat(ShapTrait.grantMany(["fillFlag", "strokeFlag", "cache", "type", "id", "tag", "strokeStyle", "fillStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineWidth", "anchorPoint"]))
);


/**
@iclass[RectKlass Klass (RectTrait)]{
  矩形图元。
  @grant[LineTrait type #:attr 'READONLY]
  @grant[LineTrait width #:attr 'CUSTOM_SETTER]
  @grant[LineTrait height #:attr 'CUSTOM_SETTER]
  @grant[LineTrait lineWidth #:attr 'CUSTOM_SETTER]
  @grantMany[LineTrait strokeStyle fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineCap lineJoin miterLimit lineDash id tag]
  }
**/
/**
@property[ratioAnchor object #:def "{ratiox: 0, ratioy: 0}"]{
  @class[RectKlass]
  图元左上角到图元锚点的距离与未经矩阵变换的图元的宽高比组成的对象。
}
*/
/**
@property[anchor object #:def "{x: 0, y: 0}"]{
  @class[RectKlass]
  图元锚点在local坐标系下的位置。
}
*/
var RectKlass = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize");
    this.subTraits(0).__init(param);
  }
},
 [[READONLY("type"), RectTrait.grant("type")], [CUSTOM_SETTER("lineWidth"), RectTrait.grant("lineWidth")],
  [CUSTOM_SETTER("strokeStyle"), RectTrait.grant("strokeStyle")], [CUSTOM_SETTER("fillStyle"), RectTrait.grant("fillStyle")],
  [CUSTOM_SETTER("shadowColor"), RectTrait.grant("shadowColor")]].concat(
  RectTrait.grantMany(["fillFlag", "strokeFlag", "id", "tag", "shadowBlur", "shadowOffsetX", "shadowOffsetY"])),
[RectTrait]
);


export$({
  RectKlass : RectKlass,
  RectTrait : RectTrait
});
};
__modules__["/gprims/imagegprim.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits")
,   GPrimTrait = require("./gprim").GPrimTrait
,   helper = require("../lib/helper")
,   geo = require("../lib/geometry");


var Klass = colortraits.Klass;
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;

/**
@itrait[ImageTrait]{
  @extend[GPrimTrait]{}
  @traitGrantAll[GPrimTrait #:trait ImageTrait]    
  图片图元的基本功能单元。
}
*/
/**
@property[image ImageDomElement #:def "http://img0.bdstatic.com/img/image/shouye/mxangel.jpg"]{
  @trait[ImageTrait]
  规定要使用的图像、画布或视频。
}
*/
/**
 @property[width number #:attr 'CUSTOM_SETTER]{
  @trait[ImageTrait]
  图片的宽度。
}
*/
/**
@property[height number #:attr 'CUSTOM_SETTER]{
  @trait[ImageTrait]
  图片的高度。
}
*/
/**
@property[constraintmode array #:def undefined]{
  @trait[ImageTrait]
  图片显示的模式，必须是个array，array中每一项必须是:{type: "fitWidth"}, {type: "fitHeight"}, {type: "uniformScale"}, {type: "place", param: [a, b, "yAlgin"]/[a, b]}, {type: "cut"}。
  @verbatim|{
    "fitWidth": 表示图像宽度匹配bbox的宽度;
    "fitHeight": 表示图像的高度匹配bbox的高度;
    "uniformScale": 表示图像等比缩放;
    "place":表示在某一维度上, 图像的a倍的位置对应于bbox中b倍的位置。param可为[a, b], [a, b, "xAliagn"], [a, b, "yAlign"], (a: 0-1, b: 0-1), 如果没设定则会自动匹配到未设定的某一坐标系(横坐标优先);
    "cut":表示图像超出bbox的部分进行裁剪;
  }|
}
*/
/**
@property[alpha float #:def 1]{
  @trait[ImageTrait]
  0~1,图片显示的透明度。
}
*/
var defaultImage = {image: "http://img0.bdstatic.com/img/image/shouye/mxangel.jpg"};
var defaultWidthForUnloaded = 100;
var defaultHeightForUnloaded = 100;
var ImageTrait = GPrimTrait.extend({
  __init: function(param)
  {
    this.subTraits(0).__init(param);
    if(param == undefined)
      param = defaultImage;
    this._t.setimage((typeof(param.image) ==  "string") ? (helper.loadImage(param.image)): ((param.image == undefined) ? helper.loadImage("") : param.image));
    this._t.settype("image");
    this._t.setalpha((param.alpha == undefined) ? 1 : param.alpha);
    this._t.setconstraintmode(param.constraintmode); //这里还需要添加在painter里面？？？

    this._t.setwidth((param.width == undefined) ? defaultWidthForUnloaded : param.width);
    this._t.setheight((param.height == undefined) ? defaultHeightForUnloaded : param.height);
    if(this._t.image().complete){
      this._t.cache().bbox = undefined; //不仅是这里的所有的set属性都是要设置cache.bbox为undefined
      this._t.setwidth((param.width == undefined) ? this._t.image().width : param.width);
      this._t.setheight((param.height == undefined) ? this._t.image().height : param.height);
    } else {
      var trait = this._t;    
      helper.loadImage(trait.image().src, function()
        {
          trait.cache().bbox = undefined; //不仅是这里的所有的set属性都是要设置cache.bbox为undefined
          trait.setwidth((param.width == undefined) ? trait.image().width : param.width);
          trait.setheight((param.height == undefined) ? trait.image().height : param.height);
        });
    }


  },
/**
@method[setwidth]{
  @trait[ImageTrait]
  @param[width number]{}
  @return[this]{}
  设置图片的宽度。
}
*/
  setwidth: function(w)
  {
    this._t.cache().bbox = undefined;
    this._t.setwidth(w);
    return this;
  },
/**
@method[setheight]{
  @trait[ImageTrait]
  @param[height number]{}
  @return[this]{}
  设置图片的高度。
}
*/
  setheight: function(h)
  {
    this._t.cache().bbox = undefined;
    this._t.setheight(h);
    return this;
  },
/**
@method[width]{
  @trait[ImageTrait]
  @return[number]{}
  图片的宽度。
}
*/
  width: function()
  {
    return this._t.width();
  },
/**
@method[height]{
  @trait[ImageTrait]
  @return[number]{}
  图片的高度。
}
*/
  height: function()
  {
    return this._t.height();
  },
/**
@method[localBbox]{
  @trait[ImageTrait]
  @return[rect]{}
  获取图片的包围盒。
}
*/
  localBbox: function()
  { 
    return geo.rectMake(0, 0, this._t.width(), this._t.height());                     
  },
/**
@method[localInside]{
  @trait[ImageTrait]
  @return[boolean]{}
  本地坐标系下，判断一个点是否在image内部.
}
*/
  localInside: function(x, y)
  {   
    if(this._t.alpha() == 0)
    {
      return false;
    }else { 
      if(x > 0 && x < this._t.width() && y > 0 && y < this._t.height()){
        return true;
      }
    }
    return false;    
  },
/**
@method[localHook]{
  @trait[ImageTrait]
  @param[cb function]{回调函数。}
  @return[this]{}
  hook住当前本身gprim所有影响显示的属性。
}
*/
  localHook: function(cb)
  {
    this.hookMany(this._t, ["image", "width", "height", "constraintmode", "alpha", "anchorPoint"], cb, "a");
    return this;
  },
/**
@method[unlocalHook]{
  @trait[ImageTrait]
  @return[this]{}
  unhook住当前本身gprim所有影响显示的属性。
}
*/
  unlocalHook: function(cb)
  {
    this.unhookMany(this._t, ["image", "width", "height", "constraintmode", "alpha", "anchorPoint"], cb, "a");   
  }
},
["image", "width", "height", "constraintmode", "alpha"].concat(GPrimTrait.grantAll())
);

/**
@iclass[ImageKlass Klass (ImageTrait)]{
  图片图元。
  @grantMany[ImageTrait image alpha constraintmode tag id]
  @grant[ImageTrait type #:attr 'READONLY]
  @grant[ImageTrait width #:attr 'CUSTOM_SETTER]
  @grant[ImageTrait height #:attr 'CUSTOM_SETTER]
}
**/
/**
@property[ratioAnchor object #:def "{ratiox: 0, ratioy: 0}"]{
  @class[ImageKlass]
  图元左上角到图元锚点的距离与未经矩阵变换的图元的宽高比组成的对象。
}
*/
/**
@property[anchor object #:def "{x: 0, y: 0}"]{
  @class[ImageKlass]
  图元锚点在local坐标系下的位置。
}
*/
var ImageKlass = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize");
    this.subTraits(0).__init(param);
  }
},
 [[READONLY("type"), ImageTrait.grant("type")]].concat(ImageTrait.grantMany(["alpha", "constraintmode", "image", "tag", "id"])),
 [ImageTrait]
);

export$({
  ImageKlass : ImageKlass,
  ImageTrait : ImageTrait
});
};
__modules__["/lib/transformable.js"] = function(require, load, export$) {
var geo = require("./geometry")
,   util = require("./util")
,   Klass = require("./colortraits").Klass
,   Trait = require("./colortraits").Trait
,   assert = require("./debug").assert

/**
@itrait[TransformableTrait]{空间变换功能单元。}

@property[x float]{
  @trait[TransformableTrait]
  x轴坐标。
}
@property[y float]{
  @trait[TransformableTrait]
  y轴坐标。
}
@property[z float]{
  @trait[TransformableTrait]
  z轴坐标。
}
@property[scale float]{
  @trait[TransformableTrait]
  缩放比例。
}
@property[rotation float]{
  @trait[TransformableTrait]
  旋转角度; 弧度值，默认逆时针。
}
**/
var TransformableTrait = Trait.extend({
/*
@method[__init #:hidden]{
  @trait[TransformableTrait]
  @param[timeStamp timeStamp]{时间钟。}
  @param[dep boolean]{是否需要深度拷贝。}
  @return[this]{}
  空间变换功能单元的初始化函数.
}
*/ 
  __init:function(timeStamp, dep)
  {
    assert(timeStamp, "param error");
    
    var m = [];
    m[0] = {
      x:0,
      y:0,
      z:0,
      sx:1,
      sy:1,
      r:0
    };

    this._t.setmatrixs(m);
    this._t.settimeStamper(timeStamp);
    this._t.setdirtyStamp(timeStamp.now());
    this._t.setcalculateStamp(timeStamp.now() - 1);
    this._t.set__depTransformable__(dep);
  },
/*
@method[setx #:hidden]{
  @trait[TransformableTrait]
  @param[val number]{新的x轴坐标值。}
  @return[this]{}
  设置精灵的x坐标。
}
*/ 
  setx:function(val)
  {
    var m = this._t.matrixs()[0];
    m.x = val;

    this.stepForwardTimeStamp__();
    return this;
  },
/**
@method[x #:hidden]{
 @trait[TransformableTrait]
 @return[number]{}
 获取元素的x坐标.  
} 
*/ 
  x:function()
  {
    var m = this._t.matrixs()[0];
    return m.x;
  },
/**
@method[sety #:hidden]{
  @trait[TransformableTrait]
  @param[val float]{新的y轴坐标值。}
  @return[this]{}
  设置精灵的y坐标.
}
*/
  sety:function(val)
  {
    var m = this._t.matrixs()[0];
    m.y = val;
    this.stepForwardTimeStamp__();
    return this;
  },
/**
@method[y #:hidden]{
  @trait[TransformableTrait]
  @return[number]{}
  获取元素的y坐标.
}
*/ 
  y:function(val)
  {
    var m = this._t.matrixs()[0];
    return m.y;
  },
/**
@method[setz #:hidden]{
  @trait[TransformableTrait]
  @param[val float]{新的z轴坐标值.}
  @return[this]{}
  设置精灵的z坐标.
}
*/ 
  setz:function(val)
  {
    var m = this._t.matrixs()[0];
    m.z = val;
    this.stepForwardTimeStamp__();
    return this;
  },
/**
@method[z #:hidden]{
 @trait[TransformableTrait]
 @return[number]{} 
 获取元素的z坐标.
}
*/ 
  z:function()
  {
    var m = this._t.matrixs()[0];
    return m.z;
  },
/**
@method[move]{
  @trait[TransformableTrait]
  @param[x float]{新的x轴坐标值.}
  @param[y float]{新的y轴坐标值.}
  @param[z float]{新的z轴坐标值.}
  @return[this]{}
  设置精灵的x、y、z的的坐标值.
}
*/ 
  move:function(x, y, z)
  {
    var m = this._t.matrixs()[0];
    m.x = x;
    m.y = y;

    if (typeof(z) == "number")
      m.z = z;

    this.stepForwardTimeStamp__();
    return this;
  },
/**
@method[moveBy]{
  @trait[TransformableTrait]
  @param[dx float]{x坐标轴的增量}
  @param[dy float]{y坐标轴的增量}
  @param[dz float]{z坐标轴的增量}
  @return[this]{}
  增加元素的x、y、z的的坐标值.
}
*/ 
  moveBy:function(dx, dy, dz)
  {
    var m = this._t.matrixs()[0];
    m.x += dx;
    m.y += dy;

    if (typeof(z) == "number")
      m.z += dz;

    this.stepForwardTimeStamp__();
    return this;
  },
/**
@method[setrotation #:hidden]{
  @trait[TransformableTrait]
  @param[radian float]{旋转角度的弧度值.}
  @return[this]{}
  将精灵旋转一个角度,默认逆时针旋。
}
*/ 
  setrotation:function(radian)
  {
    var m = this._t.matrixs()[0];
    m.r = radian;
    this.stepForwardTimeStamp__();
    return this;
  },
/**
@method[rotation #:hidden]{
 @trait[TransformableTrait]
 @return[number]{}
 获取元素的旋转角度,默认逆时针旋。
}
*/ 
  rotation:function()
  {
    var m = this._t.matrixs()[0];
    return m.r;
  },
/**
@method[rotateBy]{
  @trait[TransformableTrait]
  @param[radian float]{旋转角度的增量，角度的弧度值。}
  @return[this]{}
  将精灵旋转一个角度。
}
*/ 
  rotateBy:function(radian)
  {
    var m = this._t.matrixs()[0];
    m.r += radian;
    this.stepForwardTimeStamp__();
    return this;
  },
/**
@method[applyScaleY]{
  @trait[TransformableTrait]
  @param[sy float]{缩放比例的增量。}
  @return[this]{}
  将精灵按Y轴增加一个缩放值。
}
*/ 
  applyScaleY:function(sy)
  {
    var m = this._t.matrixs()[0];
    m.sy *= sy;
    this.stepForwardTimeStamp__();
    return this;
  },
/**
@method[setscale #:hidden]{
  @trait[TransformableTrait]
  @param[sx float]{x轴缩放比例。}
  @param[sy float]{y轴缩放比例。}
  @return[this]{}
  将精灵x轴及y轴分别缩放到一定比例。
}
*/ 
  setscale:function(sx, sy)
  {
    var m = this._t.matrixs()[0];
    m.sx = sx;
    m.sy = sy;
    this.stepForwardTimeStamp__();
    return this;
  },
/**
@method[scale #:hidden]{
 @trait[TransformableTrait]
 @return[对象]{sx: a, sy: b}
 获取元素x轴及y轴缩放的比例
}
*/
  scale:function()
  {
    var m = this._t.matrixs()[0];
    return {sx: m.sx, sy: m.sy};
  },
 /**
@method[scaleBy]{
  @trait[TransformableTrait]
  @param[sx float]{x轴缩放比例的增量。}
  @param[sy float]{y轴缩放比例的增量。}
  @return[this]{}
  在当前缩放基础上将增加精灵缩放比例。
}
*/ 
  scaleBy:function(sx, sy)
  {
    var m = this._t.matrixs()[0];
    m.sx *= sx;
    m.sy *= sy;
    this.stepForwardTimeStamp__();
    return this;
  },
/**
@method[transform]{
  @trait[TransformableTrait]
  @param[m matrix]{新的空间矩阵。}
  @return[this]{}
  直接应用一个变换矩阵。
}
*/ 
  transform:function(m)
  {
    var affine = geo.decomposeMatrix(m);
    var m = this._t.matrixs()[0];
    
    m.x = affine.x;
    m.y = affine.y;
    m.sx = affine.sx;
    m.sy = affine.sy;
    m.r = affine.r;

    this.stepForwardTimeStamp__();
    return this;
  },
/**
@method[pushMatrix]{
  @trait[TransformableTrait]
  @param[m matrix]{}
  @return[this]{}
  在现有的矩阵变换基础上再添加一个变换矩阵。
}
*/
  pushMatrix:function(m)
  {
    var ms = this._t.matrixs();

    ms.push(m);
    this.stepForwardTimeStamp__();
    return this;
  },
/**
@method[popMatrix]{
  @trait[TransformableTrait]
  @param[m matrix]{}
  @return[matrix]{}
  移除最近添加的变换矩阵。
}
*/
  popMatrix:function()
  {
    var ms = this._t.matrixs();

    assert(ms.length > 1, "logical error");

    this.stepForwardTimeStamp__();
    return ms.pop();
  },

/**
@method[matrix]{
  @trait[TransformableTrait]
  @return[matrix]{}
  获取元素的空间矩阵
}
*/
  matrix:function()
  {
    var bDirty = this.transformable_dirty__();
    if (bDirty)
    {
      var dep = this._t.__depTransformable__();
      //var dep = this.__depTransformable__;
      var matrix = dep ? util.copy(dep.matrix()) : geo.identityMatrix();
      //var ms = this.matrixs;
      var ms = this._t.matrixs();
      var affine = ms[0];

      //标准变换显示SRT
      if (affine.x != 0 || affine.y != 0 || affine.z != 0)
        geo.matrixTranslateBy(matrix, affine.x, affine.y, affine.z);
      
      if (affine.r != 0)
        geo.matrixRotateBy(matrix, affine.r);

      if (affine.sx != 1 || affine.sy != 1)
        geo.matrixScaleBy(matrix, affine.sx, affine.sy);      

      for (var i=1; i<ms.length; i++)
      {
        this["__" + ms[i][0] + "matrix", matrix](ms[i].slice(1));
      }

      this._t.set__matrix__(matrix);

      if(bDirty == 1)
      {
        this._t.setcalculateStamp(dep.stamp());
      }else if(bDirty == 2)
      {
        this._t.setcalculateStamp(this._t.dirtyStamp());
      }

      return matrix;
    }
    else
      return this._t.__matrix__();
  },

  setDepTransformable:function(dep)
  {
    var oldOne = this._t.__depTransformable__();

    this._t.set__depTransformable__(dep);
    this.stepForwardTimeStamp__();

    return oldOne;
  },

  stamp:function()
  {
    return this._t.calculateStamp();
  },

  dirtyStamp: function()
  {
    return this._t.dirtyStamp();
  },

  transformable_dirty__:function()
  {
    //内部函数，外部不可以调用
    var dep = this._t.__depTransformable__();

    //1, self dirty
    //2, dep  dirty
    //3, dep is newer than self

    var bDirty = 0;

    if(dep && dep.transformable_dirty__() || dep && this.stamp() < dep.stamp()){
      bDirty = 1;
      /*this._t.setcalculateStamp(dep.stamp());*/
    }

    if(this._t.calculateStamp() < this._t.dirtyStamp()){
      bDirty = 2;
      /*this._t.setcalculateStamp(this._t.dirtyStamp());*/
    }
    
    return bDirty;
  },

  stepForwardTimeStamp__:function()
  {
    this._t.timeStamper().stepForward();
    this._t.setdirtyStamp(this._t.timeStamper().now());
  }},
  ["matrixs", "timeStamper", "dirtyStamp", "calculateStamp", "__depTransformable__", "__matrix__"]

);

export$({TransformableTrait: TransformableTrait});

};
__modules__["/interactor.js"] = function(require, load, export$) {
var Klass = require("./lib/colortraits").Klass
,   Trait = require("./lib/colortraits").Trait
,   debug = require("./lib/debug")
,   Rx = require("./thirdlib/rx/all");

var objectDotCreate = require("./lib/util").objectDotCreate;


var shakeSpan = 2;


function testShake(evtPressed, evtDragged)
{
  var distX = evtDragged.mouseX - evtPressed.mouseX;
  var distY = evtDragged.mouseY - evtPressed.mouseY;
  return (distX * distX + distY * distY) < shakeSpan * shakeSpan;
}

/**
精灵的交互功能模块。

在colorbox中，交互行为被抽象为一个个的Interactor，比如 MouseOverInteractor、MouseOutInteractor等。
精灵想要拥有某方面的交互能力，则必须绑定一个相应类型的Interactor实例。
*/


/**
@iclass[Interactor]{
  构成一个interactor所需要的最基本的功能，所有的interactor都必须具有该class上的所有功能。
  @constructor[Interactor]{
    @param[type string]{交互类型。}
  }
}
**/
var Interactor = Klass.extend({
  initialize:function(type)
  {
    this.settype(type);
    this.setsubject(new Rx.Subject());
    this.setobservable(this.subject().asObservable());
  }
}, ["observable", "subject", "type"]);


var MouseOverInteractor = Interactor.extend({
  initialize : function()
  {
    this.execProto("initialize", "mouseOver");
  }
});

var MouseMovedInteractor = Interactor.extend({
  initialize : function()
  {
    this.execProto("initialize", "mouseMoved");
  }
});

var MouseOutInteractor = Interactor.extend({
  initialize : function()
  {
    this.execProto("initialize", "mouseOut");
  }
});

var KeyPressedInteractor = Interactor.extend({
  initialize : function()
  {
    this.execProto("initialize", "keyPressed");
  }
});

var KeyReleasedInteractor = Interactor.extend({
  initialize : function()
  {
    this.execProto("initialize", "keyReleased");
  }
});

var MousewheelInteractor = Interactor.extend({
  initialize : function()
  {
    this.execProto("initialize", "mousewheel");
  }
});

var MousePressedInteractor = Interactor.extend({
  initialize : function()
  {
    this.execProto("initialize", "mousePressed");
  }
});

var MouseReleasedInteractor = Interactor.extend({
  initialize : function()
  {
    this.execProto("initialize", "mouseReleased");
  }
});


var mouseReleasedInteractorTrait = Trait.extend({
  __init:function(actor)
  {
    this._type = "mouseReleased";
    this.setobservable(actor.getInteractObservable(this.type()).delay(0));
  }

});

/**
@iclass[MouseReleasedInteractor Klass]{
  放开鼠标交互类。
}
*/
var MouseReleasedInteractor1 = Interactor.extend({
  initialize : function(actor)
  {
    this.execProto("initialize", "mouseReleased");
    this.subTraits(0).__init(actor);
  }
}, [], [mouseReleasedInteractorTrait]);


/**
@iclass[MouseReleasedInteractor Klass]{
  单击鼠标交互类。
}
*/
var MouseClickedInteractor = Interactor.extend({
  initialize:function(actor)
  {
    this.execProto("initialize", "mouseClicked");

    this._t.__bindActor(actor);
  },

  __bindActor:function(actor)
  {
    var button = 0;
    var pressObs = actor.getInteractObservable("mousePressed").select(function(e)
    {
      button = e.sourceEvt.button;
      return e;});
    var moveObs = actor.getInteractObservable("mouseMoved").where(function(e){return e.sourceEvt.button === button});
    var releaseObs = actor.getInteractObservable("mouseReleased").where(function(e){return e.sourceEvt.button === button});

    var button = 0;
    var relObservable = pressObs.then(function(e){
      var downEvt = e;
      var clickEvt = objectDotCreate(downEvt);
      clickEvt.type = "mouseClicked";
      return moveObs.takeUntil(releaseObs).skipWhile(function(e){
        clickEvt = objectDotCreate(e);
        clickEvt.type = "mouseClicked";
        return testShake(downEvt, e);
      }).take(1).aggregate(clickEvt, function(clickEvt, e){
        return false;
      }).where(function(e){
        return e;
      });
    });

    this.setobservable(relObservable);
  }
});



/**
@iclass[MouseReleasedInteractor Klass]{
  拖动某个精灵交互类。
}
*/
var MouseDraggedInteractor = Interactor.extend({
  initialize:function(actor)
  {
    this.execProto("initialize", "mouseDragged");
    this._t.__bindActor(actor);
  },

  __bindActor:function(actor)
  {
    var button = 0;
    var downObs = actor.getInteractObservable("mousePressed");
    var moveObs = actor.getInteractObservable("mouseMoved");
    var upObs = actor.getInteractObservable("mouseReleased");
    
    var dragStart = false;
    var beDragged = false;
    var startEvt;
    var subject = this.subject();
    var moveObserver;
    var lastDragMoveEvt;

    downObs.subscribe(function(evt){
      startEvt = evt;
      dragStart = true;

      moveObserver = moveObs.subscribe(function(evt){
        if(!testShake(startEvt, evt))
        {
          lastDragMoveEvt = evt;
          var newEvt = objectDotCreate(evt);
          newEvt.type = "mouseDragged";
          if(dragStart)
          {
            newEvt.dragStart = true;
            dragStart = false;
            beDragged = true;
          }

          subject.onNext(newEvt);
        }
      });
    });

    var observer = upObs.subscribe(function(evt){
      if(moveObserver)
      {
        moveObserver.dispose();
        moveObserver = undefined;
      }
      if(beDragged)
      {
        var newEvt = objectDotCreate(lastDragMoveEvt);
        newEvt.type = "mouseDragged";
        newEvt.dragEnd = true;
        subject.onNext(newEvt);
        beDragged = false;
        lastDragMoveEvt = undefined;
      }
    });

    return;

    
    var mousedrag = downObs.selectMany(function (md) {
      // calculate offsets when mouse down
      var startX = md.offsetX, startY = md.offsetY;
      var dragStart = true;
      var dragging = false;

      // Calculate delta with mousemove until mouseup
      return moveObs.map(function (evt) {
        var newEvt = objectDotCreate(evt);
        newEvt.type = "mouseDragged";
        if(dragStart)
        {
          dragStart = false;
          newEvt.dragStart = true;
        }
        else
          dragging = true;
        return newEvt;
      }).takeUntil(upObs).concat(upObs.take(1).select(function(evt){
          var newEvt = objectDotCreate(evt);
          newEvt.type = "mouseDragged";
          newEvt.dragEnd = true;
          return newEvt;
        }));
    });

    this.setobservable(mousedrag);
    return;




    var button = 0;
    var relObservable = downObs.select(function(e){
      button = e.sourceEvt.button
      return e;
    }).then(function(e){
      var downEvt = e;
      var dragObs = moveObs.take(1).select(
          function(evt){
          var newEvt = objectDotCreate(evt);
          newEvt.type = "mouseDragged";
          newEvt.dragStart = true;
          return newEvt;
        }).concat(moveObs.takeUntil(upObs).select(function(evt){
          var newEvt = objectDotCreate(evt);
          newEvt.type = "mouseDragged";
          return newEvt;
        })).concat(upObs.take(1).select(function(evt){
          var newEvt = objectDotCreate(evt);
          newEvt.type = "mouseDragged";
          newEvt.dragEnd = true;
          return newEvt;
        }));

      return dragObs;
    });

    this.setobservable(relObservable);
  }

});


var twoFingerTouchInteractor = Interactor.extend({
  initialize : function()
  {
    this.execProto("initialize", "twoFingerTouch");
  }
});


/**
@method[setShakeSpan]{
  @param[shakeSpan float]{}
  设置鼠标拖动的防抖动阈值。
}
*/
setShakeSpan = function(shakeSpan)
{
  shakeSpan = shakeSpan;
};


export$({
  //primitive interactor
  Interactor:Interactor,
  MouseOverInteractor:MouseOverInteractor,
  MouseOutInteractor:MouseOutInteractor,
  MouseMovedInteractor:MouseMovedInteractor,
  KeyPressedInteractor:KeyPressedInteractor,
  KeyReleasedInteractor:KeyReleasedInteractor,
  MousewheelInteractor:MousewheelInteractor,
  MouseReleasedInteractor:MouseReleasedInteractor,
  MousePressedInteractor:MousePressedInteractor,
  //composibal interactor
  MouseClickedInteractor:MouseClickedInteractor,
  MouseDraggedInteractor:MouseDraggedInteractor,
  Interactors:{
    mouseOver : MouseOverInteractor,
    mouseOut : MouseOutInteractor,
    mouseMoved : MouseMovedInteractor,
    mousePressed : MousePressedInteractor,
    mouseReleased : MouseReleasedInteractor,
    keyPressed : KeyPressedInteractor,
    keyReleased : KeyReleasedInteractor,
    mousewheel : MousewheelInteractor,
    mouseDragged : MouseDraggedInteractor,
    mouseClicked : MouseClickedInteractor,
    twoFingerTouch : twoFingerTouchInteractor
  },
  setShakeSpan:setShakeSpan

});



};
__modules__["/gprims/shaptrait.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits")
,   GPrimTrait = require("./gprim").GPrimTrait;

var helper = require("../lib/helper");

var Trait = colortraits.Trait;

/**
@itrait[StyleTrait]{图元显示样式功能单元。}
*/
/**
@property[strokeStyle color #:def undefined]{
  @trait[StyleTrait]
  笔触的颜色、渐变或模式。值可以是：color、gradient、pattern.(helper中可以创建).
  color对象的格式为：{r, g, b, a};
}
*/
/**
@property[fillStyle color #:def undefined]{
  @trait[StyleTrait]
  填充绘画的颜色、渐变或模式。值可以是：color、gradient、pattern.(helper中可以创建)。
}
*/
/**
@property[shadowColor color #:def undefined]{
  @trait[StyleTrait]
  阴影的颜色。
}
*/
/**
@property[shadowBlur number #:def 0]{
  @trait[StyleTrait]
  阴影的模糊级别。
}
*/
/**
@property[shadowOffsetX number #:def 0]{
  @trait[StyleTrait]
  阴影距绘制图元的水平距离。正值或负值，定义阴影与形状的水平距离。
}
*/
/**
@property[shadowOffsetY number #:def 0]{
  @trait[StyleTrait]
  阴影距绘制图元的垂直距离。
}
*/
/**
@property[lineWidth float #:def 1]{
  @trait[StyleTrait]
  当前的线条宽度。以像素计，
}
*/
/**
@property[lineCap string #:def "butt"]{
  @trait[StyleTrait]
  线条的结束端点样式。可以取值：butt：默认。向线条的每个末端添加平直的边缘。
  round:向线条的每个末端添加圆形线帽。
  square:向线条的每个末端添加正方形线帽。
}
*/
/**
@property[lineJoin float #:def "miter"]{
  @trait[StyleTrait]
  两条线相交时，所创建的拐角类型。可以取值：bevel:创建斜角。
  round：创建圆角。miter：默认。创建尖角。
}
*/
/**
@property[miterLimit number #:def 10]{
  @trait[StyleTrait]
  最大斜接长度。正数。规定最大斜接长度。
  如果斜接长度超过 miterLimit 的值，边角会以 lineJoin 的 "bevel" 类型来显示。
}
*/
/**
@property[lineDash string #:def undefined]{
  @trait[StyleTrait]
  线形,虚线等。[2]
}
*/
/**
@property[fillFlag boolean #:def false]{
  @trait[StyleTrait]
  是否填充。fillStyle/fillFlag两者只要设置一个就会有效。
}
*/
/**
@property[strokeFlag boolean #:def false]{
  @trait[StyleTrait]
  是否绘制边界。strokeStyle/strokeFlag两者只要设置一个有效就会stroke。
}
*/
var defaultStyle = {};
var StyleTrait = Trait.extend({
  __init: function(param)
  {  
    if(param == undefined)
      param = defaultStyle; 

    this.setstrokeStyle(param.strokeStyle);
    this.setfillStyle(param.fillStyle);
    this.setshadowColor(param.shadowColor); 
/*    this._t.setstrokeStyle(param.strokeStyle);
    this._t.setfillStyle(param.fillStyle);
    this._t.setshadowColor(param.shadowColor);*/
    this._t.setshadowBlur((param.shadowBlur == undefined) ? 0 :param.shadowBlur);
    this._t.setshadowOffsetX((param.shadowOffsetX == undefined) ? 0 : param.shadowOffsetX);
    this._t.setshadowOffsetY((param.shadowOffsetY == undefined) ? 0 : param.shadowOffsetY);
    this._t.setlineCap((param.lineCap == undefined) ? "butt" : param.lineCap);
    this._t.setlineJoin((param.lineJoin == undefined) ? "miter" : param.lineJoin);
    this._t.setmiterLimit((param.miterLimit == undefined) ? 10 : param.miterLimit);
    this._t.setlineWidth((param.lineWidth == undefined) ? 1 : param.lineWidth);    //
    this._t.setlineDash(param.lineDash);

    this._t.setfillFlag((param.fillFlag == undefined) ? false : param.fillFlag);
    this._t.setstrokeFlag((param.strokeFlag == undefined) ? false : param.strokeFlag);
  },
/**
@method[applyStyle]{
  @trait[StyleTrait]
  @param[ctx canvas2dcontext]{绘制画笔。}
  @return[this]{}
  canvas应用所有的style。
}
*/
  applyStyle: function(ctx)
  {
    if (this._t.lineWidth() != 1) //
      ctx.lineWidth = this._t.lineWidth();
  
    if (this._t.lineCap() != "butt") //
      ctx.lineCap = this._t.lineCap();

    if (this._t.lineJoin() != "miter") //
      ctx.lineJoin = this._t.lineJoin();
    
    if (this._t.miterLimit() != 10) //
      ctx.miterLimit = this._t.miterLimit();

    if (this._t.strokeStyle() != undefined) {
      var strokeStyle = this._t.strokeStyle();
      if(strokeStyle.r !== undefined)
        strokeStyle = this._t._strokeString();
      ctx.strokeStyle = strokeStyle;
    }

    if(this._t.fillStyle() != undefined) {
      var fillStyle = this._t.fillStyle();
      if(fillStyle.r !== undefined)
        fillStyle = this._t._fillString();
      ctx.fillStyle = fillStyle;
    }

    if(this._t.shadowColor() != undefined) {
      var shadowColor = this._t.shadowColor();
      if(shadowColor.r !== undefined)
        shadowColor = this._t._shadowString();
      ctx.shadowColor = shadowColor;
    }

    if(this._t.shadowBlur() != 0) //
      ctx.shadowBlur = this._t.shadowBlur();

    if(this._t.shadowOffsetX() != 0) //
      ctx.shadowOffsetX = this._t.shadowOffsetX();

    if(this._t.shadowOffsetY() != 0) //
      ctx.shadowOffsetY = this._t.shadowOffsetY();

    if(this._t.lineDash() != undefined)
      ctx.setLineDash(this._t.lineDash());

    return this;
  },

  setfillStyle: function(fillStyle)
  {
    if(fillStyle !== undefined && fillStyle.r !== undefined){
      this._t.set_fillString(helper.colorToString(fillStyle));
    }
    this._t.setfillStyle(fillStyle);    
  },

  setstrokeStyle: function(strokeStyle)
  {
    if(strokeStyle !== undefined && strokeStyle.r !== undefined){
      this._t.set_strokeString(helper.colorToString(strokeStyle));
    }
    this._t.setstrokeStyle(strokeStyle);
  },

  setshadowColor: function(shadowColor)
  {
    if(shadowColor !== undefined && shadowColor.r !== undefined){
      this._t.set_shadowString(helper.colorToString(shadowColor));
    }
    this._t.setshadowColor(shadowColor);
  }
},
["_shadowString", "_strokeString", "_fillString", "fillFlag", "strokeFlag", "strokeStyle", "fillStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineCap", "lineJoin", "miterLimit", "lineWidth", "lineDash"]
);

/**
@itrait[ShapTrait]{
  @compose[(GPrimTrait StyleTrait)]{
  }
  @traitGrant[StyleTrait lineWidth float #:attr 'CUSTOM_SETTER #:trait ShapTrait]{绘制的线条宽度。}
  @traitGrantMany[StyleTrait fillFlag strokeFlag strokeStyle fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineCap lineJoin miterLimit lineWidth lineDash #:trait ShapTrait]
  @traitGrantAll[GPrimTrait #:trait ShapTrait]
  形状类图元功能单元。
}
*/
var ShapTrait = colortraits.compose([GPrimTrait, StyleTrait], {
  __init: function(param)
  {
    this.subTraits(0).__init(param);
    this.subTraits(1).__init(param);
  },
/**
@method[setlineWidth]{
  @trait[ShapTrait]
  @return[this]{}
  设置线宽。
}
*/
  setlineWidth: function(num)
  {
    this._t.cache().bbox = undefined;
    this._t.setlineWidth(num);
    return this;
  }
},
 GPrimTrait.grantAll().concat(StyleTrait.grantAll())
);

export$({
  ShapTrait : ShapTrait
});
};
__modules__["/gprims/annulusgprim.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits")
,   ShapTrait = require("./shaptrait").ShapTrait
,   geo = require("../lib/geometry");


var Klass = colortraits.Klass;
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;

/**
@itrait[AnnulusTrait]{
  @extend[ShapTrait] {
    @traitGrantMany[ShapTrait ratioAnchor anchor cache type id tag strokeFlag strokeStyle fillFlag fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineDash #:trait AnnulusTrait]
  }
  图元环形/扇形的功能单元。它与ArcTrait的区别主要在于：创建需要的参数不同，且bbox是更加贴近真实的图元，同时它不支持线宽。
  不管它是否填充，它的inside一定指环形整体。
  该GPrim的类型, type, 值为"annulus"。  
}
*/
/**
@property[innerradius float #:def 0 #:attr 'CUSTOM_SETTER]{
  @trait[AnnulusTrait]
  内半径, 默认条件下为0, 即表示一个扇形。
}
*/
/**
@property[outerradius float #:def 10  #:attr 'CUSTOM_SETTER]{
  @trait[AnnulusTrait]
  外半径，要求外半径一定大于内半径。
}
*/
/**
@property[startAngle float #:def 0 #:attr 'CUSTOM_SETTER]{
  @trait[AnnulusTrait]
  弧度值, 圆弧开始的弧度。
}
*/
/**
@property[endAngle float #:def Math.PI*2 #:attr 'CUSTOM_SETTER]{
  @trait[AnnulusTrait]
  弧度值, 圆弧结束的弧度。
}
*/
/**
@property[anticlockwise boolean #:def false #:attr 'CUSTOM_SETTER]{
  @trait[AnnulusTrait]
  表示绘制方向: true逆时针, false顺时针。
}
*/
/**
@property[length float #:attr 'READONLY]{
  @trait[AnnulusTrait]
  未经缩放的多边形的路径长度; 
  注：这里是原生的路径长度，不包含缩放的过程。
}
*/

var defaultAnnulus = {innerradius: 0, outerradius: 10, startAngle: 0, endAngle: Math.PI*2, anticlockwise: false};
var AnnulusTrait = ShapTrait.extend({
  __init: function(param)
  {
    this.subTraits(0).__init(param);
    if(param == undefined)
      param = defaultAnnulus;
    this._t.setinnerradius((param.innerradius == undefined) ? 0 : param.innerradius);
    this._t.setouterradius(param.outerradius);
    this._t.setstartAngle(param.startAngle);
    this._t.setendAngle(param.endAngle);
    this._t.setanticlockwise((param.anticlockwise == undefined) ? false : param.anticlockwise);
    this._t.settype("annulus");

    this._t.setlength(undefined);
  },
/**
@method[setinnerradius]{
  @trait[AnnulusTrait]
  @param[innerradius float]{内环的半径。}
  @return[this]{}
  修改环形的内半径。
}
*/
  setinnerradius: function(r)
  {
    this._t.cache().bbox = undefined;
    this._t.setinnerradius(r);
    this._t.setlength(undefined);
    return this;
  },
/**
@method[setouterradius]{
  @trait[AnnulusTrait]
  @param[outerradius float]{外环的半径。}
  @return[this]{}
  修改环形/扇形的外半径。
}
*/
  setouterradius: function(r)
  {
    this._t.cache().bbox = undefined;
    this._t.setouterradius(r);
    this._t.setlength(undefined);
    return this;
  },
/**
@method[setstartAngle]{
  @trait[AnnulusTrait]
  @param[angle float]{角度值.}
  @return[this]{}
  修改环形/扇形的起始角度。
}
*/
  setstartAngle: function(angle)
  {
    this._t.cache().bbox = undefined;
    this._t.setstartAngle(angle);
    this._t.setlength(undefined);
    return this;
  },
/**
@method[setendAngle]{
  @trait[AnnulusTrait]
  @param[angle float]{角度值。}
  @return[this]{}
  修改环形/扇形的结束角度。
}
*/
  setendAngle: function(angle)
  {
    this._t.cache().bbox = undefined;
    this._t.setendAngle(angle);
    this._t.setlength(undefined);
    return this;
  },
/**
@method[setanticlockwise]{
  @trait[AnnulusTrait]
  @param[flag boolean]{旋转方向。}
  @return[this]{}
  修改环形/扇形的旋转方向，默认为false。
}
*/
  setanticlockwise: function(flag)
  {
    this._t.cache().bbox = undefined;
    this._t.setanticlockwise(flag);
    this._t.setlength(undefined);
    return this;
  },
/**
@method[localBbox]{
  @trait[AnnulusTrait]
  @return[rect]环形/扇形的local坐标系下的矩形包围盒。}
  获取local坐标系下的环形/扇形的bbox。
}
*/
  localBbox: function()
  {
    var anticlockwise = this._t.anticlockwise();
    var startAngle = this._t.startAngle();
    var endAngle = this._t.endAngle();
    var innerradius = this._t.innerradius();
    var outerradius = this._t.outerradius();

    //转换成顺时针的，结束角度一定大于起始角度
    if(endAngle < startAngle)
      endAngle += Math.PI*2;    

    if(anticlockwise){
      var temp = startAngle;
      startAngle = endAngle;
      endAngle = temp+Math.PI*2;
    }

    var points = [];
    points.push({x: innerradius*Math.cos(startAngle), y: innerradius*Math.sin(startAngle)});
    points.push({x: innerradius*Math.cos(endAngle), y: innerradius*Math.sin(endAngle)});
    points.push({x: outerradius*Math.cos(startAngle), y: outerradius*Math.sin(startAngle)});
    points.push({x: outerradius*Math.cos(endAngle), y: outerradius*Math.sin(endAngle)});

    var k = Math.floor(startAngle/(Math.PI*2));
    var nineangle = k*Math.PI*2;
    while(nineangle <= endAngle)
    {
      if(nineangle >= startAngle)
      {
        points.push({x: outerradius*Math.cos(nineangle), y: outerradius*Math.sin(nineangle)});
      }
      nineangle += Math.PI/2;
    }

    var xmin, xmax, ymin, ymax;

    for(var i = 0, length = points.length; i< length; i++)
    {
      var pstn = points[i];
      if (pstn.x < xmin || xmin == undefined)
        xmin = pstn.x;
      if (pstn.x > xmax || xmax == undefined)
        xmax = pstn.x;

      if (pstn.y < ymin || ymin == undefined)
        ymin = pstn.y;
      if (pstn.y > ymax || ymax == undefined)
        ymax = pstn.y;

    }

    return geo.rectMake(xmin, ymin, xmax - xmin + 1, ymax - ymin + 1);                                   
  },
/**
@method[localInside]{
  @trait[AnnulusTrait]
  @param[x float]{要检测点的x坐标值。}
  @param[y float]{要检测点的y坐标值。}
  @return[boolean]{}
  判断一个点是否在loacal坐标系下的环形/扇形的内部。
}
*/
  localInside: function(x, y)
  {
    var startAngle = this._t.startAngle();
    var endAngle = this._t.endAngle();
    var innerradius = this._t.innerradius();
    var outerradius = this._t.outerradius();
    var anticlockwise = this._t.anticlockwise();

    var r = Math.sqrt(x*x+y*y);
    //判断点是否在圆环内
    var isInTorus = r >= innerradius && r <= outerradius;
    if (!isInTorus)
      return false;
    
    if (2 * Math.PI <= endAngle - startAngle || endAngle - startAngle <= -2 * Math.PI)
    {
      //画了一个整圆
      return true;
    }

    if (endAngle < startAngle)
      endAngle+=Math.PI*2;

    if(anticlockwise){
      var temp = startAngle;
      startAngle = endAngle;
      endAngle = temp + Math.PI*2;
    }

    //得到向量(x, y)和startAngle半径之间的夹角
    var startX = Math.cos(startAngle);
    var startY = Math.sin(startAngle);

    //这个时候是等价的
    var angle = geo.getVectorAngle({x:startX, y:startY}, {x:x, y:y}) + startAngle;
    
    return angle >= startAngle && angle <= endAngle;
  },
  localHook: function(cb)
  {
    this.hookMany(this._t, ["innerradius", "outerradius", "startAngle", "endAngle", "anticlockwise","strokeFlag", "strokeStyle", 
                            "fillFlag", "fillStyle","shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY",
                            "lineDash", "anchorPoint"], cb, "a");
  },
  unlocalHook: function(cb)
  {
    this.unhookMany(this._t, ["innerradius", "outerradius", "startAngle", "endAngle", "anticlockwise","strokeFlag", "strokeStyle", 
                              "fillFlag", "fillStyle","shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY",
                              "lineDash", "anchorPoint"], cb, "a");                                  
  },
/**
@method[length]{
  @trait[AnnulusTrait]
  @return[float]{路径的长度}
  获取未经缩放的Annulus路径的长度, 即边界的长度。注：这里是原生的长度，不包含缩放的过程。
}
*/
  length: function()
  {
    var len = this._t.length();
    if(len == undefined){
      var outr = this._t.outerradius();
      var inr = this._t.innerradius();
      len = 0; 
      len += 2*(outr - inr);
      var detaangle = this._t.__detaAngle(this._t.startAngle(), this._t.endAngle(), this._t.anticlockwise());
      len += 2*Math.PI*outr*detaangle/(Math.PI*2) + 2*Math.PI*inr*detaangle/(Math.PI*2);

      this._t.setlength(len);
    }

    return len;
  },
/**
@method[pointAtPercent]{
  @trait[AnnulusTrait]
  @param[t float]{0-1之间。小于等于0, 返回起点; 大于等于1, 返回结束点。}
  @return[point]{}
  Returns the point at the percentage t of the current annulus. t在 0 到 1 之间.检测的方向为顺时针。
  注：这里是原生的点，不包含缩放的过程。起点为内圆的点，然后沿直线曲线直线曲线运动。如果Annulus路径经过缩放，这里需要手动对获取的点进行相应的变换。
}
*/
  pointAtPercent: function(t)
  {
    var startAngle = this.startAngle();
    var endAngle = this.endAngle();
    var inr = this.innerradius();
    var outr = this.outerradius();
    var clock = this.anticlockwise();

    if(t<=0 || t >=1)
      return {x: inr*Math.cos(startAngle), y: inr*Math.sin(startAngle)};

    var len = this.length();
    var detaR = outr - inr;
    var detaangle = this._t.__detaAngle(startAngle, endAngle, clock);
    var outlen = 2*Math.PI*outr*detaangle/(Math.PI*2);
    var inlen = 2*Math.PI*inr*detaangle/(Math.PI*2);

    var tempR, tempangle, calangle;
    if(t*len < detaR){
      tempR = inr + t*len;
      return {x: tempR*Math.cos(startAngle), y: tempR*Math.sin(startAngle)};
    }else if(t*len < detaR + outlen){
      tempangle = (t*len - detaR)/outlen*detaangle;
      if(clock){
        calangle = startAngle - tempangle;
      }else {
        calangle = startAngle + tempangle;
      }
      return {x: outr*Math.cos(calangle), y: outr*Math.sin(calangle)};
    }else if(t*len < 2*detaR + outlen){
      tempR = 2*outr - t*len - inr + outlen;  
      return {x: tempR*Math.cos(endAngle), y: tempR*Math.sin(endAngle)};    
    }else {
      tempangle = (1-(1-t)*len/inlen) * detaangle;
      if(clock){
        calangle = endAngle + tempangle;
      }else {
        calangle = endAngle - tempangle;
      }
      return {x: inr*Math.cos(calangle), y: inr*Math.sin(calangle)};
    }

  },
/**
@method[percentAtLength]{
  @trait[AnnulusTrait]
  @param[len float]{大于总长度返回1,小于0返回0.}
  @return[float]{}
  Returns the point at the length  of the current annulus. len在 0 到 整个长度之间.
  注：这里路径的总长度指的是未经缩放变换的总长度。
  注：获取的是未经缩放前Annulus路径上的点，如果Annulus路径经过缩放，这里需要手动对获取的点进行相应的变换。
}
*/
  percentAtLength: function(len)
  {
    var alllen = this._t.length();
    if(len < 0)
      return 0;
    if(alllen < len)
      return 1;

    return len/alllen;
  },
  __detaAngle: function(st, end, clock)
  {
    st = (st + Math.PI*2)%(Math.PI*2);
    end = (end + Math.PI*2)%(Math.PI*2);

    if(clock){
      return Math.PI*2 - (end - st);
    }else {
      return end - st;
    }

  }
},
  ["innerradius", "outerradius", "startAngle", "endAngle", "anticlockwise", "length"].concat(ShapTrait.grantMany(["cache", "type", "id", "tag", "strokeFlag", "strokeStyle", "fillFlag", "fillStyle",
    "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineDash", "anchorPoint"]))
);

/**
@iclass[AnnulusKlass Klass (AnnulusTrait)]{
  基本的环形/扇形图元。
  @grant[AnnulusTrait type #:attr 'READONLY]
  @grant[AnnulusTrait outerradius ]
  @grant[AnnulusTrait startAngle]
  @grant[AnnulusTrait endAngle]
  @grant[AnnulusTrait anticlockwise]
  @grantMany[AnnulusTrait ratioAnchor anchor id tag strokeFlag strokeStyle fillFlag fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineDash] 
  @constructor[AnnulusKlass]{
    @param[param object]{
      @verbatim|{
        初始化参数对象包含的属性可以为：
        innerradius、outerradius、startAngle、endAngle、anticlockwise
        x:精灵的x坐标。
        y:精灵的y坐标。
        z:精灵的z坐标。
        ratioAnchor: 百分比设置锚点。
        anchor：锚点。
        id tag strokeFlag strokeStyle fillFlag fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineDash
      }|
    }
  }
}
**/
var AnnulusKlass = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize");
    this.subTraits(0).__init(param);
  }
},
 [[READONLY("type"), AnnulusTrait.grant("type")], [CUSTOM_SETTER("innerradius"), AnnulusTrait.grant("innerradius")],
  [CUSTOM_SETTER("outerradius"), AnnulusTrait.grant("outerradius")], [CUSTOM_SETTER("startAngle"), AnnulusTrait.grant("startAngle")],
  [CUSTOM_SETTER("endAngle"), AnnulusTrait.grant("endAngle")], [CUSTOM_SETTER("anticlockwise"), AnnulusTrait.grant("anticlockwise")],
  [CUSTOM_SETTER("strokeStyle"), AnnulusTrait.grant("strokeStyle")], [CUSTOM_SETTER("fillStyle"), AnnulusTrait.grant("fillStyle")],
  [CUSTOM_SETTER("shadowColor"), AnnulusTrait.grant("shadowColor")]].concat(
  AnnulusTrait.grantMany(["id", "tag", "strokeFlag", "fillFlag", "shadowBlur", "shadowOffsetX", "shadowOffsetY","lineDash"])),
[AnnulusTrait]);


export$({
  AnnulusKlass : AnnulusKlass,
  AnnulusTrait : AnnulusTrait
});

};
__modules__["/lib/helper.js"] = function(require, load, export$) {
// require("./flashcanvas");
var arrayMap = require("./util").arrayMap;

//arguments.length == 1, only parent
//arguments.length == 2, width, height
//arguments.length == 3, width, height, parent
/**
@function[createSketchpad]{
  @param[width number]{
  创建canvas的宽度.
  }
  @param[height number]{
  创建canvas的高度
  }
  @param[parent object]{
  创建canvas的父亲
  }
  @return[object]{canvas}
  创建一个canvas
}
*/
function createSketchpad(width, height, parent)
{
  if (arguments.length == 1)
  {
    parent = width;
    width = undefined;
  }

  var canvas = document.createElement("canvas");
  if (parent == null)
  {
    document.body.appendChild(canvas);
  }
  else
  {
    parent.appendChild(canvas);
  }

  if(window.FlashCanvas)
    window.FlashCanvas.initElement(canvas);
  
  if (width != undefined)
    canvas.width = width;
  if (height != undefined)
    canvas.height = height;

  return canvas;
}

/**
@function[createHiddenSketchpad]{
  @param[width number]{
  创建canvas的宽度.
  }
  @param[height number]{
  创建canvas的高度
  }
  @return[object]{canvas}
  创建一个hidden canvas
}
*/
function createHiddenSketchpad(width, height)
{
  var canvas = document.createElement("canvas");

  if (width != undefined)
    canvas.width = width;
  if (height != undefined)
    canvas.height = height;

  if(window.FlashCanvas)
    window.FlashCanvas.initElement(canvas);

  return canvas;
} 

/**
@function[loadImage]{
  @param[src string]{
  图片资源。
  }
  @param[callback function]{
  图片加载完成以后回调函数。
  }
  @return[object]{image}
  加载一张图片。
}
*/
function loadImage (src, callback)
{
  var img = new Image();
  img.src = src;
  
  img.onload = function()
  {
    if (callback)
      callback();
  }

  return img;
}

/**
@function[createAudio]{
  @return[object]{audio}
  创建一个audio。
}
*/
function createAudio ()
{
  return document.createElement("audio");
}


var ctx;

function getCanvas2dContext()
{
  if(ctx != undefined)
    return ctx;

  var canvas = document.getElementsByTagName("canvas")[0];
  if(canvas == undefined){
    canvas = createSketchpad();
  }
  ctx = canvas.getContext("2d");
  return ctx;
}
/**
@function[measureText]{
  @param[strs string]{
  需要测量的字符串.
  }
  @param[font object]{
  font字符类型对象eg:{style: "normal", weight: 400, size: 16, family: "Arial"}
  }
  @return[object]{文本的height和width的对象}
  测量text的高度/高度
}
*/
function measureText(str, font)
{
  var ctx = getCanvas2dContext();
  ctx.save();
  ctx.font = fontToString(font);
  var mes = ctx.measureText(str);
  mes.height = font.size;
  ctx.restore();

  return mes;
}

/**
@function[fontToString]{
  @param[font object]{
  font对象，包含：style、weight、size、family:组成对象：例如：{style: "normal", weight: 400, size: 16, family: "Arial"}.
  }
  @return[string]{}
  将对象形式的font格式转换为String。上述转换为："normal 400 16px Arial" 
}
*/
function fontToString(font)
{
  //return font.style + " " + font.variant + " " + font.weight + " " + font.size + "px" + " " + font.family;
  var style = (font.style == undefined) ? "normal" : font.style;
  var weight = (font.weight == undefined) ? 400 : font.weight;
  var size = (font.size == undefined) ? 16 : font.size;
  var family = (font.family == undefined) ? "Arial" : font.family;
  return style + " " + weight + " " + size + "px" + " " + family;
}
/**
@function[svgToArray]{
  @param[dara string]{
  svg data: svg path数据构成的字符串
  }
  @return[array]{}
  将svg path数据变为pathgprim需要的array
  eg: "M 0 0 L 2 3 Z"=>[["M", 0, 0], ["L", 2, 3], ["Z"]]
}
*/
function svgToArray(data)
{
  if (!data) return [];
    // command string
  var cs = data;
  // 由于目前受我们的path路径的限制只支持，绝对路径，默认大小写为大写
  //不知此svg中的v, h, t, s
  var cc = [ 'm', 'M', 'l', 'L', 'z', 'Z','c', 'C', 'q', 'Q', 'a', 'A'];
  cs = cs.replace(/  /g, ' ');
  cs = cs.replace(/ /g, ',');
  cs = cs.replace(/,,/g, ',');
  var n;
  // create pipes so that we can split the data
  for (n = 0; n < cc.length; n++) {
      cs = cs.replace(new RegExp(cc[n], 'g'), '|' + cc[n]);
  }
  // create array
  var arr = cs.split('|');//["", "M,20,10,", "L,20"]
  var ca = [];
  // init context point
  for (n = 1; n < arr.length; n++) {
    var str = arr[n];
    var c = str.charAt(0);
    str = str.slice(1);
    str = str.replace(new RegExp('e,-', 'g'), 'e-');  //???

    var p = str.split(',');
    if (p.length > 0 && p[0] === '') p.shift();

    for (var i = 0; i < p.length; i++) {
      p[i] = parseFloat(p[i]);
    }
    if (isNaN(p[p.length - 1])) p.pop();    
    var path = [];
    path.push(c.toUpperCase());
    path = path.concat(p);
    ca.push(path);
  }
  return ca;
}
/**
@function[createLinearGradient]{
  @param[x1 number]{
  渐变开始点的 x 坐标
  }
  @param[y1 number]{
  渐变开始点的 y 坐标
  }
  @param[x2 number]{
  渐变结束点的 x 坐标
  }
  @param[y2 number]{
  渐变结束点的 y 坐标
  }
  @return[gradient]{}
  渐变可用于填充矩形、圆形、线条、文本等等。
  请使用该对象作为 strokeStyle 或 fillStyle 属性的值。
  请使用 addColorStop() 方法规定不同的颜色，以及在 gradient 对象中的何处定位颜色。
}
*/
function createLinearGradient(x1, y1, x2, y2)
{
  var ctx = getCanvas2dContext();
  return ctx.createLinearGradient(x1, y1, x2, y2)
}
/**
@function[createRadialGradient]{
  @param[x1 number]{
  渐变的开始圆的 x 坐标
  }
  @param[y1 number]{
  渐变的开始圆的 y 坐标
  }
  @param[r1 number]{
  开始圆的半径
  }
  @param[x2 number]{
  渐变的结束圆的 x 坐标
  }
  @param[y2 number]{
  渐变的结束圆的 y 坐标
  }
  @param[r2 number]{
  结束圆的半径
  }
  @return[gradient]{}
  创建放射状/圆形渐变对象。渐变可用于填充矩形、圆形、线条、文本等等。
  请使用该对象作为 strokeStyle 或 fillStyle 属性的值。
  请使用 addColorStop() 方法规定不同的颜色，以及在 gradient 对象中的何处定位颜色。
}
*/
function createRadialGradient(x1, y1, r1, x2, y2, r2)
{
  var ctx = getCanvas2dContext();
  return  ctx.createRadialGradient(x1, y1, r1, x2, y2, r2);
}
/**
@function[createPattern]{
  @param[image image]{
  规定要使用的图片、画布等元素,这个图片必须是加载完成以后的图片资源，否则不可以使用。
  }
  @param[mode string]{
  @verbatim|{
    重复的模式包含：
    mode: "repeat"  默认。该模式在水平和垂直方向重复。
          "repeat-x"  该模式只在水平方向重复。
          "repeat-y"  该模式只在垂直方向重复。
          "no-repeat" 该模式只显示一次（不重复）。
  }|
  }
  @return[gradient]{}
  }
  @verbatim|{
  在指定的方向内重复指定的元素.
eg：var img = helper.loadImage("image/rw.png", function()
    {
      var fills = helper.createPattern(img, "repeat");
      sprite.setfillStyle(fills);    
    });
  }|
}
*/

function createPattern(img, mode)
{
  var ctx = getCanvas2dContext();
  return  ctx.createPattern(img, mode);
}
/**
@function[arraysToPointArrays]{
  @param[arrays array]{
  [[x1, y1], [x2, y2], [x3, y3], [x4, y4]....]。
  }
  @return[array]{array of point}
  [{x: x1, y: y1}, {x: x2, y: y2}, {x: x3, y: y3}....]。
  数据类型转换，将数组构成的点形式，转换成由对象构成的点。
}
*/
function arraysToPointArrays(arrays)
{
  var pArrays = arrayMap(arrays, function(item)
                        {
                          return {x: item[0], y: item[1]};
                        });
  return pArrays;
}

/**
@function[colorToString]{
  @param[object color]{
  {r: , g: , b: }或者{r: , g: , b: , a: }
  }
  @return[string]{颜色构成的字符串}
  将对象形式的颜色修改为字符串。
}
*/
function colorToString(color)
{
  var a = 1;
  if(color.a !== undefined)
    a = color.a;
  return "rgba" + "(" + color.r + ", " + color.g + ", " + color.b + ", " + a + ")";
}

export$({
  createSketchpad: createSketchpad,
  loadImage: loadImage,
  createAudio: createAudio,
  createHiddenSketchpad: createHiddenSketchpad,
  measureText: measureText,
  fontToString: fontToString,
  svgToArray: svgToArray,
  createLinearGradient: createLinearGradient,
  createRadialGradient: createRadialGradient,
  createPattern: createPattern,
  arraysToPointArrays: arraysToPointArrays,
  colorToString: colorToString
});
};
__modules__["/lib/eventstream.js"] = function(require, load, export$) {
var Klass = require("./colortraits").Klass
  , Trait = require("./colortraits").Trait;

var Rx = require("../thirdlib/rx/all");

/**
@itrait[EventStreamTrait]{
  公用的消息流功能单元，该 trait 中声明了消息流中通用的消息投递及监听接口等。
}
*/

var EventStreamTrait = Trait.extend({
/**
@method[__init #:hidden]{
  @trait[EventStreamTrait]
  @return[this]{}
  EventStreamTrait功能单元的初始化函数。
}
*/
  __init: function()
  {
    if(this._t.subject() == undefined){
      this._t.setsubject({});
    }   

    return this;
  },
/**
@method[createEventStream]{
  @trait[EventStreamTrait]
  @param[name string]{消息流的名字。}
  @return[observable]{Rx消息流}
  创建名字为name的一个消息流。如果该消息流已经存在，则直接返回该消息流。
}
*/
  createEventStream : function(name)
  {
    if(this._t.subject()[name] == undefined){
      var sub = new Rx.Subject();
      this._t.subject()[name] = {subject : sub, observable : sub.asObservable()};
    }    
    return this._t.subject()[name].observable;
  },
/**
@method[getEventStream]{
  @trait[EventStreamTrait]
  @param[name string]{消息流的名字。}
  @return[observable]{}
  获取以name命名的消息流。
}
*/
  getEventStream : function(name)
  {
    return this._t.subject()[name].observable;
  },

/**
@method[deleteEventStream]{
  @trait[EventStreamTrait]
  @param[name string]{消息流的名字。}
  @return[this]{}
  删除一个名为name的消息流。
}
*/
  deleteEventStream: function(name)
  {
    delete this._t.subject()[name];

    return this;
  },
/**
@method[notify]{
  @trait[EventStreamTrait]
  @param[name string]{消息流的名字。}
  @param[evt object]{发送的消息值。}
  @return[this]{}
  发送evt消息到名字为name的消息流中去。
}
*/
  notify : function(name, evt)
  {
    this._t.subject()[name].subject.onNext(evt);
    return this;
  },

/**
@method[subscribe]{
  @trait[EventStreamTrait]
  @param[name string]{消息流的名称。}
  @param[callback function]{消息的callback函数。}
  @return[observer]{
   返回这个消息的监听者。
   如果要取消一个监听直接调用返回值的dispose函数。
  }
  用callback函数监听名字为name的消息流中的消息。
  @jscode{
    //监听someObj对象上名字为system消息流。
    var observer = someObj.subscrite("system", function(evt){...});
    //取消监听
    observer.dispose();
  }
}
*/
  subscribe : function(name, callback)
  // subscribe : function(name, delegate(obj, obj.fun / callback, userdata))
  // delegate  返回 observer。
  //observer 从 rx 的observer派生， observer 对象本省上放置了一些用户数据，在observer的onnext函数中，将用户数据等信息传给 cb。
  //找到动态给 observable 动态添加 observer 的方法。
  {
    this._t.subject()[name].observable.subscribe(function(){

    });
    return this._t.subject()[name].observable.subscribe(callback);
  }
}, ["subject"]);

export$(EventStreamTrait);
};
__modules__["/gprims/gprim.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits")
,   timestamp = require("../lib/timestamp")
,   TransformableTrait = require("../lib/transformable").TransformableTrait
,   QueryTrait = require("../query").QueryTrait
,   geo = require("../lib/geometry");


var globalTimeStamp = timestamp.globalTimeStamp;
var Klass = colortraits.Klass;
var READONLY = colortraits.READONLY;

/**
@section{概述}
本模块实现了colorbox图元的基本模块GPrim。
gprim表示能够在屏幕上显示的实体(图片、多边形、文本等)的图元。

bbox函数时返回该图元参与交互时的最小矩形包围盒。

inside函数是精确判断某一个position是不是出于该图元上。

gprim不能够直接被绘制到屏幕上，必须通过绑定到actor上，才能够被显示和参与交互。或直接采用sprite.
图元想要参与交互，则必须判断用户操作的位置是不是发生在该图元上。colorbox首先是利用图元的bbox进行一次粗略判断，当一个用户点击的位置处于图元的bbox上时，
才会用该图元的inside进行精确判断，精确判断后如果该交互位置处于该图元上，则会向该图元所属的精灵发送相应的交互消息。

GPrimTrait是所有图元trait模块最基本的trait。

通过扩展GPrimTrait，实现了丰富的图元trait(图像, 文本, 圆, 多边形, 路径等)。
*/

/**
@itrait[GPrimTrait]{
  @compose[(TransformableTrait QueryTrait)]{   
  }
  @traitGrantMany[QueryTrait id tag #:trait GPrimTrait]
  构成一个GPrim最基本的功能单元, 所有图元类型最上层都是继承自最基本的GPrimTrait。
}
**/
/**
@property[type string]{
  @trait[GPrimTrait]
  GPrim的类型。
}
*/
/**
@property[catch object]{
  @trait[GPrimTrait]
  私有属性，外界不可访问，用于缓存bbox。
}
*/
/**
@property[anchorPoint object]{
  @trait[GPrimTrait]
  私有属性，外界不可访问，用于记录真实的锚点。
}
*/
/**
@property[ratioAnchor object #:def "{ratiox: 0, ratioy: 0}" #:attr 'CUSTOM_GETTER_SETTER]{
  @class[GPrimTrait]
  图元左上角到图元锚点的距离与未经矩阵变换的图元的宽高比组成的对象。
}
*/
/**
@property[anchor object #:def "{x: 0, y: 0}" #:attr 'CUSTOM_GETTER_SETTER]{
  @class[GPrimTrait]
  图元锚点在local坐标系下的位置。
}
*/
var emptyRect = geo.Rect(0, 0, 0, 0);
var GPrimTrait = colortraits.compose([TransformableTrait, QueryTrait],//.name("TransformTrait")
{
/**
@method[__init #:hidden]{
  @trait[GPrimTrait]     
  @param[param object]{
    @verbatim|{
      id: string 唯一，可通过id查找或删除GPrim。
      tag: string 可以通过设置tag，获取GPrim树状结构上的信息。
      x: 可以在初始化的时候，初始化gprim的位置x。
      y: 可以在初始化的时候，初始化gprim的位置y。
      z: 可以在初始化的时候，初始化gprim的位置z。
      ratioAnchor: {ratiox: a, ratioy: b} 可以在初始化的时候，通过百分比方式设置图元的锚点。
      anchor: {x: a, y: b} 可以在初始化的时候，设置local坐标系下的锚点。初始化同时设置ratioAnchor/anchor,以anchor为准。
    }|
   }
  @return[undefined]{}
  gprim的local初始化函数。
}
**/
  __init: function(param)
  {
    if(param == undefined)
      param = {};
    this.subTraits(0).__init(globalTimeStamp);
    this.subTraits(1).__init(param);

    this._t.setcache({});
    this._t.settype("gprim");
    this._t.setanchorPoint({x: 0, y: 0, type: "absolute"});
    
    if(param.ratioAnchor !== undefined){
      this._t.setanchorPoint({x: param.ratioAnchor.ratiox, y: param.ratioAnchor.ratioy, type: "ratio"});
    } 
    if(param.anchor !== undefined){
      this._t.setanchorPoint({x: param.anchor.x, y: param.anchor.y, type: "absolute"});
    }

    //
    if(param.x !== undefined){
      this.setx(param.x);
    }
    if(param.y !== undefined){
      this.sety(param.y);
    }
    if(param.z !== undefined){
      this.setz(param.z);
    }      
  },
/**
@method[width]{
  @trait[GPrimTrait]
  @return[number]{图元的宽度}
  获取当前图元的宽度。这里获取的是经过矩阵等变换的bbox的width.  
}
*/
  width: function()
  {
    return this.bbox().width;
  },
/**
@method[height]{
  @trait[GPrimTrait]
  @return[number]{图元的高度}
  获取当前图元的高度。这里获取的是经过矩阵等变换的bbox的height。
}
*/

  height: function()
  {
    return this.bbox().height;
  },
/**
@method[bbox]{
  @trait[GPrimTrait]
  @return[object]{{x: a, y: b, width: c, height: d}}
  获取经过变化后的当前的图元的bbox. bbox包含gprim所处的位置x/y，以及bbox宽度和高度width/height.
  为了使得每次获取bbox不用重新计算，bbox具有缓冲。
}
*/
  bbox: function()
  {
    var cache = this._t.cache();    
    var calculatestamp = this.stamp();
    
    if(undefined　!= cache.bbox && calculatestamp == cache.stamp)
    {
      return cache.bbox;
    }
    var mat = this.matrix();
    
    var res = this.localBbox(); 
    var anchor = this.anchor();
    res.x -= anchor.x;
    res.y -= anchor.y;   
    res = geo.rectApplyMatrixToBoundRect(res, mat);     

    cache.stamp = this.stamp();
    cache.bbox = res;
    return res;
  },
/**
@method[inside]{
  @trait[GPrimTrait]
  @param[x number]{           
  被检测的点的x坐标值。
  }
  @param[y number]{
  被检测的点的y坐标值。
  }
  @return[boolean]{}  
  精确判断一个点是否在此图元上。
}
*/
  inside: function(x, y)
  {
    var bbox = this.bbox();
    if (bbox.x <= x && x < (bbox.x + bbox.width) 
      && bbox.y <= y && y < (bbox.y + bbox.height))
    {
      var invertmatrix = geo.matrixInvert(this.matrix());
      var newpos = geo.pointApplyMatrix({x: x, y: y}, invertmatrix);//geometry 上优化??
      var anchor = this.anchor();
      newpos.x += anchor.x;
      newpos.y += anchor.y;      
      return this.localInside(newpos.x, newpos.y);
    }
    return false;
  },
/**
@method[setratioAnchor]{
  @trait[GPrimTrait]
  @param[ratiox number]{           
  横坐标方向上local坐标系下锚点x坐标值占未缩放旋转图元宽的百分比。
  }
  @param[ratioy number]{
  纵坐标方向上local坐标系下锚点y坐标值占未缩放旋转图元高的百分比。
  }
  @return[this]{}
  通过比率设置图元的锚点。  
}
*/
  setratioAnchor: function(ratioAnchor)
  {
    var anchorPoint = this._t.anchorPoint();
    anchorPoint.x = ratioAnchor.ratiox;
    anchorPoint.y = ratioAnchor.ratioy;
    anchorPoint.type = "ratio";
    return this;
  },
/**
@method[anchorByRatio]{
  @trait[GPrimTrait]
    @return[object]{{ratiox: 百分比, ratioy: 百分比}}
    获取图元的锚点到local坐标系下的原点占整个未缩放旋转图元宽高的百分比。
}
*/
  ratioAnchor: function()
  {
    var anchorPoint = this._t.anchorPoint();    
    if(anchorPoint.type == "absolute"){
      var localBbox = this.localBbox();
      return {ratiox: anchorPoint.x/localBbox.width, ratioy: anchorPoint.y/localBbox.height};
    }else {
      return {ratiox: anchorPoint.x, ratioy: anchorPoint.y};
    }   
  },
/**
@method[setanchor]{
  @trait[GPrimTrait]
  @param[x number]{           
  横坐标方向上local坐标系下锚点x坐标值。
  }
  @param[y number]{
  纵坐标方向上local坐标系下锚点y坐标值。
  }
  @return[this]{}
  设置图元的锚点。
}
*/
  setanchor: function(anchor)
  {
    var anchorPoint = this._t.anchorPoint();
    anchorPoint.x = anchor.x;
    anchorPoint.y = anchor.y;
    anchorPoint.type = "absolute";
    return this;
  },
/**
@method[anchor]{
  @trait[GPrimTrait]
 @return[object]{{x: 横坐标, y: 纵坐标}}
  获取local坐标系下图元的锚点。
}
*/
  anchor: function()
  {   
    var anchorPoint = this._t.anchorPoint();    
    if(anchorPoint.type == "absolute"){
      return {x: anchorPoint.x, y: anchorPoint.y};
    }else {
      var localBbox = this.localBbox();
      return {x: anchorPoint.x*localBbox.width, y: anchorPoint.y*localBbox.height};      
    }
  },
/**
@method[localBbox]{
  @trait[GPrimTrait]
  @return[object]{{x: 0, y: 0, width: 0, height: 0}}  
  在没给定任何类型的图元上,它的默认bbox是一个全0的Rect。
  用户自定义图元类型时，需要指定自己的localBbox。
}
*/
  localBbox: function()
  {
    return emptyRect;
  },
/**
@method[localInside]{
  @trait[GPrimTrait]
  @return[boolean]{}
  在没给定任何类型的图元上,它的默认inside是false.
  用户自定义图元类型时，需要指定自己的localInside.
}
*/
  localInside: function(x, y)
  {
    return false;
  },
/**
@method[hookGPrimVisible #:hidden]{
  @trait[GPrimTrait]
  @param[cb function]{
  回调函数。
  }
  @return[undefined]{}
  hook住当前gprim所有影响显示的属性, 以及hook住影响bbox的时间钟。
}
*/
  hookGPrimVisible: function(cb)
  {
    this.localHook(cb);
    this.hook(this.subTraits(0), "dirtyStamp", cb, "a");
    this.hook(this.subTraits(0), "dirtyStamp", cb, "b");
  },
/**
@method[localHook #:hidden]{
  @trait[GPrimTrait]  
  @param[cb function]{
  回调函数。
  }
  @return[undefined]{}
  hook住当前本身gprim所有影响显示的属性。
}
*/
  localHook: function(cb)
  {
    this.hook(this._t, "anchorPoint", cb, "a");
  },
/**
@method[unhookGPrimVisible #:hidden]{
  @trait[GPrimTrait]
  @return[undefined]{}
  unhook住当前gprim所有影响显示的属性, 以及unhook住影响bbox的时间钟。
}
*/
  unhookGPrimVisible: function(cb)
  {
    this.unlocalHook(cb);
    this.unhook(this.subTraits(0), "dirtyStamp", cb, "a");
    this.unhook(this.subTraits(0), "dirtyStamp", cb, "b");    
  },
/**
@method[unlocalHook #:hidden]{
  @trait[GPrimTrait]
  @return[undefined]{}
  unhook住当前本身gprim所有影响显示的属性。
}
*/
  unlocalHook: function(cb)
  { 
    this.unhook(this._t, "anchorPoint", cb, "a");   
  }
},
 ["type", "cache", "anchorPoint"].concat(QueryTrait.grantAll())
);


/**
@iclass[GPrim Klass (GPrimTrait)]{
  最基本的GPrim图元.
  @grant[GPrimTrait type #:def "gprim" #:attr 'READONLY]
  @grantMany[GPrimTrait id tag ratioAnchor anchor]
  @constructor[GPrim]{
    @param[param object]{
      @verbatim|{
        初始化参数对象包含的属性可以为：
        id:string id值，唯一。
        tag:string tag标签。
        x:number 精灵的x坐标。
        y:numbr 精灵的y坐标。
        z:number 精灵的z坐标。
        ratioAnchor: {ratiox: a, ratioy: b}百分比设置锚点。
        anchor：{x: a, y: b}锚点。初始化同时设置ratioAnchor/anchor,以anchor为准。
      }|
    }
  }
}
**/
var GPrim = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize");
    this.subTraits(0).__init(param);
  }
}, 
[[READONLY("type"), GPrimTrait.grant("type")]].concat(GPrimTrait.grantMany(["id", "tag"])),
[GPrimTrait]
);

export$({
  GPrimTrait : GPrimTrait,
  GPrim : GPrim
});
};
__modules__["/painter/all.js"] = function(require, load, export$) {
/*exports.HonestPainter = require("./honestpainter").HonestPainter;
exports.HonestPainter = require("./honestpainter").HonestPainter;*/

export$({
  HonestPainter: require("./honestpainter").HonestPainter
});
};
__modules__["/lib/autorepaint.js"] = function(require, load, export$) {
var colortraits = require("./colortraits");
var geo = require("./geometry");
var EventStreamTrait = require("./eventstream");

var Klass = colortraits.Klass;
var Trait = colortraits.Trait;
var compose = colortraits.compose;

/**
@itrait[AutoRepaintTrait]{
  自动重绘的功能单元。
}
*/
var enableAutoRepaint = function(actor)
{
  actor.enableAutoRepaint();
};
var disableAutoRepaint = function(actor)
{
  actor.disableAutoRepaint();
};
var AutoRepaintTrait = compose([EventStreamTrait], {
  __init: function(param)
  {
    this.subTraits(0).__init();
    this._t.setautorepaint((param == null || param.autorepaint == undefined) ? false : param.autorepaint);    
    if(this._t.autorepaint()) {
      this.createEventStream("system");
      var self = this;
      this.subscribe("system", function(evt){
        if(evt.type == "addActor" && evt.actor.enableAutoRepaint){
          //evt.actor.enableAutoRepaint(); 
          evt.actor.forEach(enableAutoRepaint);           
        }else if(evt.type == "removeActor" && evt.actor.disableAutoRepaint){
          //evt.actor.disableAutoRepaint();
          evt.actor.forEach(disableAutoRepaint);
        }
        self.owner().invalidate();  //这里可能需要修改，因为scene和world里面的刷新是不同的
        
      });
    }     
  },
/**
@method[autorepaint]{
  @trait[AutoRepaintTrait]
  @return[boolean]{}
  返回autorepaint标志位。
}
*/
  autorepaint: function()
  {
    return this._t.autorepaint();
  }

},
  ["autorepaint"]);

export$({AutoRepaintTrait: AutoRepaintTrait});
};
__modules__["/lib/colortraits.js"] = function(require, load, export$) {
var slice = Array.prototype.slice;

/*------------------   colortraits 中一些依赖的帮助函数 start  ------------------*/
//原本此类帮助函数来源于 colorbox 的 debug 和 util 模块，用来调试 和 兼容 ie6 //
//但由于 colorsight 项目需要将 colortraits 模块独立， 并由外部注入。因此才将帮助函数重新在此处实现一份//

// var assert = require("./debug").assert;
// var util = require("./util");
// var objectKeysForEach = util.objectKeysForEach;
// var arrayForEach = util.arrayForEach;
// var arraySome = util.arraySome;
// var identifier = util.identifier;
// var objectDotCreate = util.objectDotCreate;

var assert = function (exp,msg)
{
  if (exp)
  {
    return true;
  }
  else
  {
    var theMsg = msg === undefined ? "assert !!!" : msg;
    console.log("exception throwed:  " + theMsg);
    throw (theMsg);
  }
}

var objectKeysForEach = function(obj, cb)
{
  for(var key in obj)
  {
    if(obj.hasOwnProperty(key))
      cb(key, obj);
  }
}

var arrayForEach = (function(){
  if(Array.prototype.forEach)
  {
    return function(obj, cb)
    {
      obj.forEach(cb);
    }
  }
  else
  { 
    return function(obj, cb)
    {
      var i = 0, len = obj.length;
      
      for (; i<len; i++){
        cb(obj[i], i);
      };
    }
  }
})();

var arraySome = (function(){
  if(Array.prototype.some)
  {
    return function(obj, cb)
    {
      return obj.some(cb);
    };
  }
  else
  {
    return function(obj, cb)
    {
      var i = 0;
      while (i < obj.length)
      {
        if (cb(obj[i], i, obj))
          return true;
        
        i++;
      }

      return false;
    };
  }
})();

var identifier = (function(){
  var __idGenter = 0;

  return function(obj)
  {
    if (obj.__identifier === undefined)
    {
      return obj.__identifier = __idGenter++;
    }
    else
    {
      return obj.__identifier;
    }
  }
})();


//兼容ie6、7、8没有 Object.create接口。
var objectDotCreate = (function(){
  if(Object.create)
  {
    return Object.create;
  }
  else
  {
    return function(proto)
    {
      var ExObjectDotCreate = function()
      {

      }
      ExObjectDotCreate.prototype = proto;
      var newObj = new ExObjectDotCreate();
      newObj.__proto__ = proto;
      return newObj;
    }
  }
})();

/*------------------  colortraits 中一些依赖的帮助函数 end  ------------------*/

//将 properties 中的所有属性复制到 obj 中。
var addProperties = function(obj, properties)
{
  //在IE中，__proto__是一个普通的属性。为了尽量跟其他浏览器兼容，所以这里__proto__需要是enumerable:false, writable:true,但是在 ie6 下没办法做到这件事情。
  for(var key in properties)
  {
    if(properties.hasOwnProperty(key))
    {
      obj[key] = properties[key];
    }
  }

  return obj;
}

//创建一个以 proto 为原型的对象，并为新对象中加入 properties 中所有属性。
var createObject = function(proto, properties)
{
  var newobj = objectDotCreate(proto);

  if(properties)
    addProperties(newobj, properties);

  return newobj;
};

//判断是否为 local 方法名。
var isLocalMethod = function(methodName)
{
  if(methodName[0] != undefined)
    return methodName[0] == "_" && methodName[1] == "_";
  else
    return methodName.indexOf("__") == 0;
}

//判断属性列表是否合法。
var checkTraitProperties = function(directUsedTraits, properties)
{
  var usedTraitsIds = {};
  var grantTraitsIds = [];

  if(properties === undefined)
    return;

  assert((properties instanceof Array), "bad properties type!!!!");

//判断属性列表格式是否合法，属性列表只能是 ["propName", ["propName", grantProp]]类似这样的组合。
  for(var i = 0; i < properties.length; ++i)
  {
    var value = properties[i];
    if(value instanceof Array)
    {
      assert(value.length === 2, "bad properties array value length");
      assert(typeof(value[0]) === "string", "bad properties array first value");
      assert(value[1].isGrant, "bad properties array second value");

      for(var id in value[1].grantTraitIdentifiers)
      {
        if(value[1].grantTraitIdentifiers.hasOwnProperty(id))
        {
          grantTraitsIds.push(id);
        }
      }
    }
    else if(typeof(value) != "string")
    {
      assert(false, "bad properties !!!!!!!");
    }
  }
  
//判断所有 grantProp 中的授权的 trait 是否为直接使用的 trait。
  var trait;
  for(var i = 0; i < directUsedTraits.length; ++i)
  {
    trait = directUsedTraits[i];
    usedTraitsIds[identifier(trait)] = identifier(trait);
  }

  assert(
    !(arraySome(grantTraitsIds, 
      function(id){
        if(usedTraitsIds[id] === undefined)
          return true;
    })), 
    "argument is not valid properties!!! "
  );
}

//将数组形式的属性列表转为{propName:grantValue}形式，若不是授权属性，则 grantValue 为 undefined。
var convertTraitProperties = function(properties)
{
  var objProperties = {};

  if(properties != undefined)
  {
    for(var name in properties)
    {
      if(properties.hasOwnProperty(name))
      {
        var prop = properties[name];
        if(prop instanceof Array)
        {
          objProperties[prop[0]] = prop[1];
        }
        else if(typeof(prop) === "string")
          objProperties[prop] = undefined;
      }
    }
  }

  return objProperties;
}

//初始化 trait 的默认名字映射表：{propName : traitId + propName}
function initTraitDefaultNameMap(trait)
{
  var nameMap = {};
  var id = identifier(trait);

  for(var name in trait._properties)
  {
    if(trait._properties.hasOwnProperty(name))
      nameMap[name] = id + name;
  }

  trait._defaultNameMap = nameMap;
}

//为trait对应的属性properties生成一个名字映射集合列表namesMap，该列表主要为了合并授权属性做准备。
/*
假如 trait 对应的 properties 为 
{
  a : undefined,
  b : trait1.grant("x")
}。
那么生成的名字映射集合列表 namesMap 为：
[
  {traitId+a : traitId+a},

  {
    traitId+b : traitId+b,
    trait1Id+x : trait1Id+x,
  }
]
数组中每一项代表一个名字映射集合，该名字映射集合中存放了多个trait的默认映射名字，以 map 存储；代表了这几个 trait 属性需要合并为同一个属性。
*/
var genPropertiesNamesMap = function(trait, properties)
{
  var namesMap = [];

  for(var name in properties)
  {
    if(!properties.hasOwnProperty(name))
      continue;

    var idName = trait._defaultNameMap[name];
    var value = properties[name];
    var nameMap = {};
    nameMap[idName] = idName;
    if(value != undefined)
    {
      assert(value.isGrant, "bad properties value!!!");
      for(var grantName in value.grantNames)
      {
        if(!value.grantNames.hasOwnProperty(grantName))
          continue;
        nameMap[grantName] = grantName;
      }
    }

    namesMap.push(nameMap);
  }

  return namesMap;
}

//将多个 namesMaps 合并为一个 namesMap
//namesMaps 为 namesMap array。
var mergeNamesMaps = function(namesMaps)
{
  var nameRefs = {};
  var refId = 0;
  var len = namesMaps.length;
  var namesMap;
  var idRefs = {};

  //为所有 localName 生成对应的 ref。
  //需要 merge 为一项的所有 localName 的 ref对象中的 id 值相同。
  for(var i = 0; i < len; ++i)
  {
    namesMap = namesMaps[i];
    for(var id in namesMap)
    {
      var nameMap = namesMap[id];
      var nameMapRef = {id:refId, gId:refId};

      for(var name in nameMap)
      {
        if(!nameMap.hasOwnProperty(name))
          continue;

        if(nameRefs[name] != null)
        {
          var localIdRefs = idRefs[nameRefs[name].id];
          for(var gid in localIdRefs)
          {
            if(localIdRefs.hasOwnProperty(gid))
              localIdRefs[gid].id = refId;
          }            
        }
        else
        {
          nameRefs[name] = nameMapRef;

          if(idRefs[refId] == null)
            idRefs[refId] = {};
          idRefs[refId][nameRefs[name].gId] = nameRefs[name];
        }
      }
      ++refId;
    }
  }

  //此处遍历不适用 objectKeysForEach 是为了避免生成临时函数对象。
  var idNamsMap = {};
  for(var name in nameRefs)
  {
    if(!nameRefs.hasOwnProperty(name))
      continue;
    
    if(idNamsMap[nameRefs[name].id] == null)
      idNamsMap[nameRefs[name].id] = {};
    idNamsMap[nameRefs[name].id][name] = name;
    
  }
  
  return idNamsMap;
}


/**
@itrait[Trait]{
是唯一一个模块预定义的trait，其它所有的trait都基于它产生。

@itemize[#:style 'unnumbered
  @item{Trait:是一个完备的纯粹的功能单元，不能实例化对象。}
  @item{Trait:是一组方法和私有属性的集合。}
  @item{Trait:可扩展、可组合。}
  @item{Trait:可被 Klass 直接使用。}
]

}
@property[_t traitMsg #:attr 'PRIVATE]{
  @trait[Trait]
  当前 Trait 的私有命名空间。

  @itemize[#:style 'unnumbered
    @item{_t 只能够在 Trait 内部用 this._t 的方式获取，外部 anyObj._t 获取不到。}
    @item{通过 this._t 可以访问和修改 Trait 上的私有属性及调用 Trait 上的 local 方法。}
  ]  
}
*/
var traitPrototype = {};
var Trait = (function(){
  var Trait = createObject(
    traitPrototype, 
    {
      _methods : {},
      _lMethods : {},
      _usedTraits : [],
      _directUsedTraits : [],
      _properties: {},
      _defaultNameMap:{},
      _namesMap : [],
      forbidden : {_ownerTrait: Trait}
    }
  );

/**
@method[isTrait]{
  @trait[Trait]
  @return[boolean]{true:是；false:不是。}
  询问对象是否为 Trait。
}
*/
  traitPrototype.isTrait = function()
  {
    return true;
  };
/**
@method[extend]{
  @trait[Trait]
  @param[extMethods object]{
    扩展方法集合。

    @jscode{
      例如：
      {
        move : function(){},
        __jump : function(){}
      }
    }

    @bold{local方法}扩展方法集合中，以"__"双下划线开头的方法为 local 方法，只能够在所属 
    Trait 内部或者直接使用该 Trait 的Klass 或 Trait使用。
  }
  @param[properties array]{
    扩展属性集合。

    @jscode{
      //例如：
      ["position", ["speed", base.grant("speed")]]
      //trait上声明的属性全部为 trait 私有属性，外部不可以直接访问。
      //若外部想要访问 trait 私有属性，则必须通过授权的方式访问。
      //此处授权只能针对被扩展的 base Trait。
    }
  }
  @return[@type[Trait]]{新trait。}
  以原始Trait为原型，根据扩展信息扩展出一个新的Trait。

  @bold{新 trait 中会具有被扩展 trait 上所有的方法及用户新声明的扩展方法和属性。}
}
*/
//注：extend 的实现不能复用 compose 是因为 extend 不会有名字冲突。扩展函数优先于 trait 已有函数。
  traitPrototype.extend = function (extMethods, properties)
  {
    checkTraitProperties([this], properties);
    properties = convertTraitProperties(properties);

    var methods = addProperties({}, this._methods);
    var lMethods = {};

    var nt = createObject(traitPrototype,
                          {
                            _methods : methods,
                            _lMethods : lMethods,
                            _properties : properties
                          });

    nt._usedTraits = this._usedTraits.concat([this]);
    nt._directUsedTraits = [this];
    initTraitDefaultNameMap(nt);
    var tmpNamesMap = genPropertiesNamesMap(nt, properties);
    nt._namesMap = mergeNamesMaps([this._namesMap, tmpNamesMap]);

    for(var mname in extMethods)
    {
      var f = extMethods[mname];
      assert(typeof f === "function", "expect function");

      if(isLocalMethod(mname))
      {
        lMethods[mname] = {_ownerTrait: nt,_func: f};
      }
      else
      {
        methods[mname] = {_ownerTrait: nt, _func: f};
      }
    }

    return nt;
  };

/**
@method[hasMethod]{
  @trait[Trait]
  @param[methodName string]{
    方法名。
  }
  @return[boolean]{true：存在；false：不存在。}
  询问Trait上是否存在名为 methodName 的方法。  
}
*/
  traitPrototype.hasMethod = function (methodName)
  {
    return !!this._methods[methodName];
  };

/**
@method[grant]{
  @trait[Trait]
  @param[propName string]{
    属性名。
  }
  @return[@type[GrantProperty]]{}
  得到trait中的propName的属性访问授权，一般被用于trait的扩展属性值。 
  @jscode{
    例如:
    //假如 OldTrait 有 a、b两个私有属性
    var NewTrait = OldTrait.extend(
      {
        foo:function(){}
      },
      [
        ["x", OldTrait.grant("a")], 
        ["b", OldTrait.grant("b")], 
      ]
    );
    //NewTrait 中有 x、y两个私有属性；
    //x 授权访问 OldTrait 中的 a 属性；b 授权访问 OldTrait 中的 b属性。
    //即 NewTrait 中的 x 属性 和 OldTrait 中的 a 属性是同一属性。
    //NewTrait 中的 b 属性 和 OldTrait 中的 b 属性是同一属性。
  } 
}
*/
  traitPrototype.grant = function(propName)
  {
    return new GrantProperty(this, propName);
  };
/**
@method[grantAll]{
  @trait[Trait]
  @return[array]{
    @jscode{
      [['a', trait.grant('a')], ['b', traing.grant('b')]]
    }
  }
  以相同名字授权访问 trait 中所有的属性,该返回值可以作为扩展属性列表使用。
  @jscode{
    例如:
    //假如 OldTrait 有 a、b两个私有属性
    var NewTrait = OldTrait.extend(
      {
        foo:function(){}
      },
      //此处相当于 [["a", OldTrait.grant("a")], ["b", OldTrait.grant("b")]]
      OldTrait.grantAll()
    );
    //NewTrait 以同名的方式得到了 OldTrait 中所有属性的访问授权。
    //即 NewTrait 中也有了 a、b 属性，并且跟 OldTrait 中的 a、b属性是同一属性。
  }
}
*/
  traitPrototype.grantAll = function()
  {
    var grantProps = [];
    var self = this;

    objectKeysForEach(this._properties, function(name){
      grantProps.push([name, new GrantProperty(self, name)]);
    });

    return grantProps;
  };

/**
@method[grantMany]{
  @trait[Trait]
  @param[propNames array]{
    属性名列表。
  }
  @return[array]{
    @jscode{
      [['a', trait.grant('a')], ['b', traing.grant('b')]]
    }
  }
  以相同名字授权访问 trait 中 namesAry 中的属性,该返回值可以作为扩展属性列表使用。
  @jscode{
    例如:
    //假如 OldTrait 有 a、b、c三个私有属性
    var NewTrait = OldTrait.extend(
      {
        foo:function(){}
      },
      //此处相当于 [["a", OldTrait.grant("a")], ["b", OldTrait.grant("b")]]
      OldTrait.grantMany(["a", "b"])
    );
    //NewTrait 以同名的方式得到了 OldTrait 中a、b属性的访问授权。
    //即 NewTrait 中也有了 a、b 属性，并且跟 OldTrait 中的 a、b属性是同一属性。
  }
}
*/
  traitPrototype.grantMany = function(propNames)
  {
    var grantProps = [];
    var self = this;

    arrayForEach(propNames, function(name){
      grantProps.push([name, new GrantProperty(self, name)]);
    });

    return grantProps;
  };

/**
@method[grantExclude]{
  @trait[Trait]
  @param[propNames array]{
    属性名列表。
  }
  @return[array]{
    @jscode{
      [['a', trait.grant('a')], ['b', traing.grant('b')]]
    }
  }
  以相同名字授权访问 trait 中除去 propNames 以外的属性,该返回值可以作为扩展属性列表使用。
  @jscode{
    例如:
    //假如 OldTrait 有 a、b、c三个私有属性
    var NewTrait = OldTrait.extend(
      {
        foo:function(){}
      },
      //此处相当于 [["a", OldTrait.grant("a")], ["b", OldTrait.grant("b")]]
      OldTrait.grantExlude(["c"])
    );
    //NewTrait 以同名的方式得到了 OldTrait 中a、b属性的访问授权。
    //即 NewTrait 中也有了 a、b 属性，并且跟 OldTrait 中的 a、b属性是同一属性。
  }
}
*/
  traitPrototype.grantExclude = function(propNames)
  {
    var grantProps = [];
    var self = this;

    objectKeysForEach(this._properties, function(name){
      if(!arraySome(propNames, function(exname){
        if(exname == name)
          return true;
        return false;
      }))
      {
        grantProps.push([name, new GrantProperty(self, name)]);
      }
    });

    return grantProps;
  };
/**
@method[neg]{
  @trait[Trait]
  @return[@type[Trait]]{新tarit。}
  将 trait 中所有函数遮蔽，形成一个新的trait返回。
}
*/
  traitPrototype.neg = function ()
  {
    if (this._negtive)
    {
      return _negtive;
    }

    var methods = {};
    var lMethods = {};
    var usedTraits = this._usedTraits.concat([this]);
    var nt = createObject(traitPrototype, 
                          {
                            _methods: methods,
                            _lMethods : lMethods,
                            _usedTraits: usedTraits,
                            _directUsedTraits : [this],
                            _properties:{},
                            _defaultNameMap : {},
                            _namesMap:{}
                          });

    var mtbl = this._methods;
    for (var mname in mtbl)
    {
      methods[mname] = Trait.forbidden;
    }
    mtbl = trati._lMethods;
    for (var mname in mtbl)
    {
      lMethods[mname] = Trait.forbidden;
    }

    nt._negtive = this;

    return nt;
  };

/**
@method[rename]{
  @trait[Trait]
  @param[nameMap object]{
    需要更名的函数名字映射表。需要更名的函数不能是 local 函数。
    @jscode{
      例如：{oldMethodName : newMethodName ...}
    }
  }
  @return[@type[Trait]]{新trait。}
  为 trait 中某些函数更名后，返回一个新trait。旧名字的方法将不存在。
}
*/
  traitPrototype.rename = function (nameMap)
  {
    var methods = {};
    var usedTraits = this._usedTraits.concat([this]);
    
    var nt = createObject(traitPrototype, {
      _methods: methods,
      _lMethods : this._lMethods,
      _usedTraits: usedTraits,
      _directUsedTraits : [this],
      _properties:{},
      _defaultNameMap:{},
      _namesMap : {}
    });

    var mtbl = this._methods;
    for (var mname in mtbl)
    {
      var theName = nameMap[mname];
      theName = theName ? theName : mname;

      if (methods[theName] !== undefined 
          && methods[theName] !== mtbl[mname]
          && methods[theName]._ownerTrait !== mtbl[mname]._ownerTrait
          //&& Object.isPropertyEnumerable(methods, theName) == true
          )
      {
        assert(false, "`" + theName + "' name conflicts!!!");
      }
      else
      {
        methods[theName] = mtbl[mname];
      }
    }

    return nt;
  };
/**
@method[exclude]{
  @trait[Trait]
  @param[nameList array]{
    需要剔除的方法名列表。例如[methodName1, methodName2...]
  }
  @return[@type[Trait]]{新trait。}
  剔除掉trait中的由nameList指定的那些方法后，返回一个新的trait。
}
*/
  traitPrototype.exclude = function (nameList)
  {
    var methods = {};
    var usedTraits = this._usedTraits.concat([this]);

    var nt = createObject(traitPrototype, {
      _methods: methods,
      _lMethods : this._lMethods,
      _usedTraits: usedTraits,
      _directUsedTraits : [this],
      _properties:{},
      _defaultNameMap:{},
      _namesMap : {}
    });

    var mtbl = this._methods;
    for (var mname in mtbl)
    {
      methods[mname] = mtbl[mname];
    }

    for (var i = 0; i < nameList.length; ++i)
    {
      delete methods[nameList[i]];
    }

    return nt;
  };

/**
@method[select]{
  @trait[Trait]
  @param[nameList array]{
    选择的方法名列表。例如[methodName1, methodName2...]
  }
  @return[@type[Trait]]{新trait。}
  选择trait中的由nameList指定的那些方法，组成一个新的trait返回。
}
*/
  traitPrototype.select = function (nameList)
  {
    var methods = {};
    var usedTraits = this._usedTraits.concat([this]);

    var nt = createObject(traitPrototype, {
      _methods: methods,
      _lMethods : this._lMethods,
      _usedTraits: usedTraits,
      _directUsedTraits : [this],
      _properties:{},
      _defaultNameMap:{},
      _namesMap : {}
    });

    var mtbl = this._methods;
    
    for (var i = 0; i < nameList.length; ++i)
    {
      var m = mtbl[nameList[i]];
      if(null != m)
      { 
        methods[nameList[i]] = m;
      }
    }

    return nt;
  };

/**
@method[alias]{
  @trait[Trait]
  @param[nameList array]{
    需要取别名的函数名字映射表。
    @jscode{
      例如：{oldMethodName : newMethodName ...}
    }
  }
  @return[@type[Trait]]{新trait。}
  为trait中的某些方法取个别名后，返回一个新trait。原有名字的方法仍然存在。
}
*/
  traitPrototype.alias = function (nameMap)
  {
    var methods = {};
    var usedTraits = this._usedTraits.concat([this]);

    var nt = createObject(traitPrototype, {
      _methods: methods,
      _lMethods : this._lMethods,
      _usedTraits: usedTraits,
      _directUsedTraits : [this],
      _properties:{},
      _defaultNameMap:{},
      _namesMap :{}
    });

    var mtbl = this._methods;
    for (var mname in mtbl)
    {
      methods[mname] = mtbl[mname];
    }
    
    for (var theName in nameMap)
    {
      var newName = nameMap[theName];
      if (methods[newName] !== undefined 
          && methods[newName] !== mtbl[theName]
          && methods[newName]._ownerTrait !== mtbl[theName]._ownerTrait
          //&& Object.isPropertyEnumerable(methods, theName) == true
          )
      {
        assert(false, "`" + newName + "' name conflicts!!!");
      }
      else
      {
        methods[newName] = mtbl[theName];
      }
    }

    return nt;
  };
/**
@method[prefix]{
  @trait[Trait]
  @param[prefixStr String]{
    前缀字符串。
  }
  @return[@type[Trait]]{新trait。}
  为trait中的所有方法名都增加一个由prefixStr前缀后，返回一个新的trait。
}
*/
  traitPrototype.prefix = function (prefixStr)
  {
    var methods = {};
    var usedTraits = this._usedTraits.concat([this]);

    var nt = createObject(traitPrototype, {
      _methods: methods,
      _lMethods : this._lMethods,
      _usedTraits: usedTraits,
      _directUsedTraits : [this],
      _properties:{},
      _defaultNameMap:{},
      _namesMap : {}
    });

    var mtbl = this._methods;
    for (var mname in mtbl)
    {
      methods[prefixStr + mname] = mtbl[mname];
    }

    return nt;
  };

  return Trait;
})();

/**
@function[compose]{
  @param[traits array]{
    被组合的 trait 列表。
  }
  @param[extMethods object]{
    扩展方法集合。

    @jscode{
      例如：
      {
        move : function(){}, //公有方法
        __jump : function(){}//local 方法
      }
    }

    @bold{local方法:}扩展方法集合中，以"__"双下划线开头的方法为 local 方法，只能够在所属 
    Trait 内部或者直接使用该 Trait 的Klass 或 Trait使用。
  }
  @param[properties array]{
    扩展属性集合。

    @jscode{
      //例如：
      ["position", ["speed", composedTrait.grant("speed")]]
      //trait上声明的属性全部为 trait 私有属性，外部不可以直接访问。
      //若外部想要访问 trait 私有属性，则必须通过授权的方式访问。
      //此处授权只能针对直接使用的 traits。
    }
  }
  @return[@type[Trait]]{新trait。}
  将多个 traits 组合成一个新的 trait，同时给新 trait 加入用户扩展的方法和属性。

  @bold{新的 trait 中会拥有被组合 traits 中所有的方法及用户新扩展的方法和属性。}
}
*/
function compose(traits, extMethods, properties)
{
  checkTraitProperties(traits, properties);
  properties = convertTraitProperties(properties);

  var methods = {};
  var usedTraits = [];
  var namesMaps = [];
  var lMethods = {};
  
  var nt = createObject(traitPrototype, {
    _methods : methods,
    _lMethods : lMethods,
    _directUsedTraits : traits,
    _properties : properties
  });

  for (var i = 0; i < traits.length; ++i)
  {
    var usedTrait = traits[i];
    var mtbl = usedTrait._methods;
    objectKeysForEach(mtbl, function(mname){
      if (methods[mname] !== undefined 
            && methods[mname] !== mtbl[mname]
           // && methods[mname]._ownerTrait === mtbl[mname]._ownerTrait
          //下面这句是干啥的？大家已经忘记了。谁想起来，谁加上注释
          //&& Object.isPropertyEnumerable(methods, mname) == true
          )
      {
        assert(false, "`" + mname + "' method conflicts!!!");
      }
      else
      {
        methods[mname] = mtbl[mname];
      }
    });

    usedTraits = usedTraits.concat(usedTrait._usedTraits);
    usedTraits.push(usedTrait);
    namesMaps.push(traits[i]._namesMap);
  }
  nt._usedTraits = usedTraits;
  initTraitDefaultNameMap(nt);
  var tmpNamesMap = genPropertiesNamesMap(nt, properties);
  namesMaps.push(tmpNamesMap);
  nt._namesMap = mergeNamesMaps(namesMaps);

  objectKeysForEach(extMethods, function(mname){
    var f = extMethods[mname];
    assert(typeof f === "function", "expect function");

    if(isLocalMethod(mname))
    {
      lMethods[mname] = {_ownerTrait: nt,_func: f};
    }
    else
    {
      methods[mname] = {_ownerTrait: nt,_func: f};
    }
  });

  return nt;
}

//如果 entity 中的属性是授权属性，那么需要将对应属性授权访问 entity._aggregateTrait 上的属性。
//因为 entity 内部实际上也是一个 trait，entity 上的所有属性都是 entity._aggregateTrait 上的私有属性。
function grantEntityProperties(entity)
{
  var properties = {};
  //var superGrantProperties = entity.proto()._grantProperties;
  var aggTrait = entity._aggregateTrait;
  var aggTraitProperties = aggTrait._properties;

  for(var name in aggTraitProperties)
  {
    if(!aggTraitProperties.hasOwnProperty(name))
      continue;
    var value = aggTraitProperties[name];
    var newVal;
    if(value && value.isGrant)
    {
      newVal = composeGrantProperties([value, aggTrait.grant(name)]);
    }
    else
    {
      newVal = aggTrait.grant(name);
    }

    //自动将当前entity上的属性与super上同名的属性做合并。
    // if(superGrantProperties[name] == null)
    //   properties[name] = newVal;
    // else
    // {
    //   assert(superGrantProperties[name].isGrant, "grantEntityProperties bad properties");

    //   properties[name] = composeGrantProperties([superGrantProperties[name], newVal]);
    // }
  }

  return properties;
}

//将原型上的属性平坦到当前对象上，目的是为了给原型上的属性重新生成 getter、setter；因为扩展对象有可能改变属性的 globalName，而 getter、setter 是会闭包住 globalName的，所以需要重新生成。
function  flatEntityProperties(entity)
{
  var properties = {};
  var superEntity = entity.proto();

  if(superEntity != null && superEntity.isEntity)
  {
    addProperties(properties, superEntity._properties);
  }

  var aggTrait = entity._aggregateTrait;
  var aggTraitProperties = aggTrait._properties;
  for(var key in aggTraitProperties)
  {
    if(aggTraitProperties.hasOwnProperty(key))
      properties[key] = entity;
  }

  return properties;
}
/*
性能测试发现，参数个数越多，函数调用越耗时。
并且当函数声明的参数个数为N时，如果调用函数时传入的参数个数不是N，函数调用耗时会成倍增加。
因此 wrap 用户函数时，根据函数的参数个数生成对应的 wrap 函数;函数参数最多为 8 个。
*/
function wrapEntityFunction0p(fun, ownerTraitId)
{
  return function()
  {
    var oldT = this._t;
    this._t = this._ts[ownerTraitId];
    var ret = fun.call(this);
    this._t = oldT;
    return ret;
  }
}

function wrapEntityFunction1p(fun, ownerTraitId)
{
  return function(a)
  {
    var oldT = this._t;
    this._t = this._ts[ownerTraitId];
    var ret = fun.call(this, a);
    this._t = oldT;
    return ret;
  }
}

function wrapEntityFunction2p(fun, ownerTraitId)
{
  return function(a, b)
  {
    var oldT = this._t;
    this._t = this._ts[ownerTraitId];
    var ret = fun.call(this, a, b);
    this._t = oldT;
    return ret;
  }
}

function wrapEntityFunction3p(fun, ownerTraitId)
{
  return function(a, b, c)
  {
    var oldT = this._t;
    this._t = this._ts[ownerTraitId];
    var ret = fun.call(this, a, b, c);
    this._t = oldT;
    return ret;
  }
}

function wrapEntityFunction4p(fun, ownerTraitId)
{
  return function(a, b, c, d)
  {
    var oldT = this._t;
    this._t = this._ts[ownerTraitId];
    var ret = fun.call(this, a, b, c, d);
    this._t = oldT;
    return ret;
  }
}

function wrapEntityFunction5p(fun, ownerTraitId)
{
  return function(a, b, c, d, e)
  {
    var oldT = this._t;
    this._t = this._ts[ownerTraitId];
    var ret = fun.call(this, a, b, c, d, e);
    this._t = oldT;
    return ret;
  }
}

function wrapEntityFunction6p(fun, ownerTraitId)
{
  return function(a, b, c, d, e, f)
  {
    var oldT = this._t;
    this._t = this._ts[ownerTraitId];
    var ret = fun.call(this, a, b, c, d, e, f);
    this._t = oldT;
    return ret;
  }
}

function wrapEntityFunction7p(fun, ownerTraitId)
{
  return function(a, b, c, d, e, f, g)
  {
    var oldT = this._t;
    this._t = this._ts[ownerTraitId];
    var ret = fun.call(this, a, b, c, d, e, f, g);
    this._t = oldT;
    return ret;
  }
}

function wrapEntityFunction8p(fun, ownerTraitId)
{
  return function(a, b, c, d, e, f, g, h)
  {
    var oldT = this._t;
    this._t = this._ts[ownerTraitId];
    var ret = fun.call(this, a, b, c, d, e, f, g, h);
    this._t = oldT;
    return ret;
  }
}

var wrapEntityFunctionGenerators = [wrapEntityFunction0p, wrapEntityFunction1p,wrapEntityFunction2p,wrapEntityFunction3p,wrapEntityFunction4p, wrapEntityFunction5p, wrapEntityFunction6p, wrapEntityFunction7p, wrapEntityFunction8p];


function wrap_tLocalFunction0p(fun, ownerTraitId, o)
{
  return function()
  {
    return fun.call(this._o);
  }
}

function wrap_tLocalFunction1p(fun, ownerTraitId, o)
{
  return function(a)
  {
    return fun.call(this._o, a);
  }
}

function wrap_tLocalFunction2p(fun, ownerTraitId, o)
{
  return function(a, b)
  {
    return fun.call(this._o, a, b);
  }
}

function wrap_tLocalFunction3p(fun, ownerTraitId, o)
{
  return function(a, b, c)
  {
    return fun.call(this._o, a, b, c);
  }
}

function wrap_tLocalFunction4p(fun, ownerTraitId, o)
{
  return function(a, b, c, d)
  {
    return fun.call(this._o, a, b, c, d);
  }
}

function wrap_tLocalFunction5p(fun, ownerTraitId, o)
{
  return function(a, b, c, d, e)
  {
    return fun.call(this._o, a, b, c, d, e);
  }
}

function wrap_tLocalFunction6p(fun, ownerTraitId, o)
{
  return function(a, b, c, d, e, f)
  {
    return fun.call(this._o, a, b, c, d, e, f);
  }
}

function wrap_tLocalFunction7p(fun, ownerTraitId, o)
{
  return function(a, b, c, d, e, f, g)
  {
    return fun.call(this._o, a, b, c, d, e, f, g);
  }
}

function wrap_tLocalFunction8p(fun, ownerTraitId, o)
{
  return function(a, b, c, d, e, f, g, h)
  {
    return fun.call(this._o, a, b, c, d, e, f, g, h);
  }
}

var wrap_tLocalFunctionGenerators = [wrap_tLocalFunction0p, wrap_tLocalFunction1p, wrap_tLocalFunction2p, wrap_tLocalFunction3p, wrap_tLocalFunction4p, wrap_tLocalFunction5p, wrap_tLocalFunction6p, wrap_tLocalFunction7p, wrap_tLocalFunction8p];

function generateTrait_t(o, trait, curUsedTraits, superTs)
{
  var globalNameMap = o._globalNameMap;
  //// 必须记住 _o, _t上的函数 accessors 依赖于 o 这个对象实例。
  // 必须记住 _ownerEntity,是为了正确实现 execProto
  var _t = {_o:o, _ownerTrait:trait};
  if(curUsedTraits[identifier(trait)] == null)
  {
    _t._ownerEntity = superTs[identifier(trait)]._ownerEntity;
  }
  else
  {
    _t._ownerEntity = o;
  }
  var defaultNameMap = trait._defaultNameMap;
  //define private properties getter and setter;
  objectKeysForEach(trait._properties, function(propName){
    var setName = "set" + propName;
    var globalName = globalNameMap[defaultNameMap[propName]];
    _t[propName] = function(){
      return this._o._propertiesStore[globalName];
    };
    _t[setName] = function(val){
      this._o._propertiesStore[globalName] = val;
      return this._o;
    };
  });

  //define local function accessor;
  var lMethods = trait._lMethods;
  for(var medName in lMethods)
  {
    if(!lMethods.hasOwnProperty(medName))
      continue;
    assert(!(_t.hasOwnProperty(medName)), "local properties's getter setter conflict local function");
    _t[medName] = wrap_tLocalFunctionGenerators[lMethods[medName]._func.length](lMethods[medName]._func, identifier(trait), o);
  }

  return _t;
}

//generateEntityAll_Ts ：生成 entity 上所有使用过的 traits 及 _aggregateTrait 的 _t 对象。
//每个 trait 都拥有一个自己的 _t, _t中存储了 trait 中所有私有属性、私有方法的getter、setter。
//在 wrapFunction 内部，根据 ownerTraitId，动态设置 _t。
function generateEntityAll_Ts(o, superEntity, curUsedTraits)
{
  var _ts = {};
  var usedTraits = o._usedTraits;

  for(var id in usedTraits)
  {
    if(usedTraits.hasOwnProperty(id))
    {
      var trait = usedTraits[id];
      _ts[identifier(trait)] = generateTrait_t(o, trait, curUsedTraits, superEntity._ts);
    }
  }

/*
  var aggregateTrait = o._aggregateTrait;
  _ts[aggregateTrait.cIdentifier()] = generateTrait_t(aggregateTrait);
*/
  return _ts;
}

//更新对象 o 上的所有trait所对应的 _t 对象，用_ts储存。
//_ts 是个以 trait identifier 为索引，值是 _t 的 map。
function updateEntityAll_Ts(o)
{
  var old_ts = o._ts;
  var _ts = {};

  for(var key in old_ts)
  {
    if(old_ts.hasOwnProperty(key))
      _ts[key] = createObject(old_ts[key], {_o:o});
  }

  o._ts = _ts;
}

function wrapSubtraitLocalFunction0p(fun, ownerTraitId, o)
{
  return function()
  {
    var o = this._o;
    var oldT = o._t;
    o._t = o._ts[ownerTraitId];
    var ret = fun.call(o);
    o._t = oldT;
    return ret;
  }
}

function wrapSubtraitLocalFunction1p(fun, ownerTraitId, o)
{
  return function(a)
  {
    var o = this._o;
    var oldT = o._t;
    o._t = o._ts[ownerTraitId];
    var ret = fun.call(o, a);
    o._t = oldT;
    return ret;
  }
}

function wrapSubtraitLocalFunction2p(fun, ownerTraitId, o)
{
  return function(a, b)
  {
    var o = this._o;
    var oldT = o._t;
    o._t = o._ts[ownerTraitId];
    var ret = fun.call(o, a, b);
    o._t = oldT;
    return ret;
  }
}

function wrapSubtraitLocalFunction3p(fun, ownerTraitId, o)
{
  return function(a, b, c)
  {
    var o = this._o;
    var oldT = o._t;
    o._t = o._ts[ownerTraitId];
    var ret = fun.call(o, a, b, c);
    o._t = oldT;
    return ret;
  }
}

function wrapSubtraitLocalFunction4p(fun, ownerTraitId, o)
{
  return function(a, b, c, d)
  {
    var o = this._o;
    var oldT = o._t;
    o._t = o._ts[ownerTraitId];
    var ret = fun.call(o, a, b, c, d);
    o._t = oldT;
    return ret;
  }
}

function wrapSubtraitLocalFunction5p(fun, ownerTraitId, o)
{
  return function(a, b, c, d, e)
  {
    var o = this._o;
    var oldT = o._t;
    o._t = o._ts[ownerTraitId];
    var ret = fun.call(o, a, b, c, d, e);
    o._t = oldT;
    return ret;
  }
}

function wrapSubtraitLocalFunction6p(fun, ownerTraitId, o)
{
  return function(a, b, c, d, e, f)
  {
    var o = this._o;
    var oldT = o._t;
    o._t = o._ts[ownerTraitId];
    var ret = fun.call(o, a, b, c, d, e, f);
    o._t = oldT;
    return ret;
  }
}

function wrapSubtraitLocalFunction7p(fun, ownerTraitId, o)
{
  return function(a, b, c, d, e, f, g)
  {
    var o = this._o;
    var oldT = o._t;
    o._t = o._ts[ownerTraitId];
    var ret = fun.call(o, a, b, c, d, e, f, g);
    o._t = oldT;
    return ret;
  }
}


function wrapSubtraitLocalFunction8p(fun, ownerTraitId, o)
{
  return function(a, b, c, d, e, f, g, h)
  {
    var o = this._o;
    var oldT = o._t;
    o._t = o._ts[ownerTraitId];
    var ret = fun.call(o, a, b, c, d, e, f, g, h);
    o._t = oldT;
    return ret;
  };
}

var wrapSubtraitLocalFunctionGenerators = [wrapSubtraitLocalFunction0p, wrapSubtraitLocalFunction1p, wrapSubtraitLocalFunction2p, wrapSubtraitLocalFunction3p, wrapSubtraitLocalFunction4p, wrapSubtraitLocalFunction5p, wrapSubtraitLocalFunction6p, wrapSubtraitLocalFunction7p, wrapSubtraitLocalFunction8p];

function generateTraitSubtrait(o, trait)
{
  //define local function accessor;
  var lMethods = trait._lMethods;
  var subTrait = {_o:o, _ownerTrait:trait};
  for(var medName in lMethods)
  {
    if(lMethods.hasOwnProperty(medName))
      subTrait[medName] = wrapSubtraitLocalFunctionGenerators[lMethods[medName]._func.length](lMethods[medName]._func, identifier(trait), o);
  }

  return subTrait;
}

//为entity所有直接使用的traits生成对应的 traitMsg。
function generateEntityAllSubtraits(o)
{
  var subTraits = {};

  for(var i in o._usedTraits)
  {
    if(o._usedTraits.hasOwnProperty(i))
    {
      var trait = o._usedTraits[i];
      subTraits[identifier(trait)] = generateTraitSubtrait(o, trait);
    }
  }

  return subTraits;
}

//更新对象 o 上的所有 directUsedTraits 所对应的 subTrait 对象，用 _subTraits 储存。
//_subTraits 是个以 trait identifier 为索引，值是 subTrait 的 map。
function updateEntitySubtraits(o)
{
  var oldSubtraits = o._subTraits;
  var subTraits = {};

  for(var key in oldSubtraits)
  {
    if(oldSubtraits.hasOwnProperty(key))
      subTraits[key] = createObject(oldSubtraits[key], {_o:o});
  }

  o._subTraits = subTraits;
}

//生成最终的 GlobalNamemap，全局名字映射表。
//GlobalName 只会以 superEntity 上的最大 id 递增是为了保持 propertiesStore 的原型继承。
function genEntityGlobalNamemap(o, superEntity)
{
  var namesMap = o._namesMap;
  var superGlobalNameMap = superEntity._globalNameMap;

  //序列化 serialize properties's global nameMap
  var globalNameMap = {};
  var maxGlobalNameNum = superEntity._maxGlobalNameNum;
  var globalName;


  for(var id in namesMap)
  {
    var tmpNamesMap = namesMap[id];
    for(var key in tmpNamesMap)
    {
      if(tmpNamesMap.hasOwnProperty(key))
      {
        var name = tmpNamesMap[key];

        if(superGlobalNameMap.hasOwnProperty(name))
        {
          if(globalName === undefined)
          {
            globalName = superGlobalNameMap[name];
            continue;
          }
          if(globalName != superGlobalNameMap[name])
          {
            globalName = maxGlobalNameNum++;
            break;
          }
        }
        else
        {
          globalName = maxGlobalNameNum++;
          break;
        }
      }
    }
    for(var key in tmpNamesMap)
    {
      if(tmpNamesMap.hasOwnProperty(key))
      {
        globalNameMap[tmpNamesMap[key]] = globalName;
      }
    }
    globalName = undefined;
  }
  
  o._globalNameMap = globalNameMap;
  o._maxGlobalNameNum = maxGlobalNameNum;
}

var PrivateGetterStr = "Error: get private property: ";
var PrivateSetterStr = "Error: set private property: ";
var ReadonlySetterStr = "Error: set readonly property: ";
var CustomSetterStr = "Error: did't give a setter function then you set custom_setter property: ";

//为对象属性定义公有的 getter、setter。其中包括 superEntity 上的属性。
//原因是扩展对象有可能改变属性的 globalName，而 getter、setter 会闭包住对应的 globalName，所以全部重新生成。
function defineEntityPropertyGetterSetter(o, superEntity)
{
  var globalNameMap = o._globalNameMap;
  var properties = o._properties;
  var ownerEntity, defaultMappedName, specialProperties;

  objectKeysForEach(properties, function(name){
    ownerEntity = properties[name];
    specialProperties = ownerEntity._specialProperties;
    defaultMappedName = ownerEntity._aggregateTrait._defaultNameMap[name];
    var globalName = globalNameMap[defaultMappedName];
    
    //entity 上的属性 getter、setter 可以直接复用对应的 _aggregateTrait _t 上的属性的 getter、setter。
    //好处是因为当发生hook时，只会替换所有 _ts 受影响的 getter、setter。不必再去替换 entity上公有属性访问的 getter、setter。
    //代价是会多付出访问时间，用 _t 上的getter、setter需要多几次属性查找。
    //经测试，最终不使用 _t 上的 getter、setter。因为性能代价太大，是直接访问的 10 倍以上。

    var type;
    var setName = "set" + name;
    if(specialProperties.hasOwnProperty(name))
    {
      type = specialProperties[name];
      if(type == PRIVATE)
      {
        //若属性定义为 PRIVATE 属性，且用户没有重写 getter、setter 函数则为用户生成一个抛出异常的 getter、setter 函数。
        if(!o.hasOwnProperty(name))
        {
          o[name] = function()
          {
            throw (PrivateGetterStr + name);
          };
        }

        if(!o.hasOwnProperty(setName))
        {
          o[setName] = function()
          {
            throw (PrivateSetterStr + name);
          }
        }
      }
      else if(type == READONLY)
      {
        assert(!o.hasOwnProperty(name), "READONLY property: " + name + " getter conflict with methods");
        o[name] = function()
        {
          //return this._ts[aggTraitId][name]();
          return this._propertiesStore[globalName];
        };
        //若属性定义为 READONLY 属性,用户没有重写 setter 函数则为用户生成一个抛出异常的 setter 函数。
        if(!o.hasOwnProperty(setName))
        {
          o[setName] = function()
          {
            throw (ReadonlySetterStr + name);
          }
        }
      }
      else if(type == CUSTOM_SETTER)
      {
        assert(!o.hasOwnProperty(name), "CUSTOM_SETTER property: " + name + " getter conflict with methods");
        o[name] = function()
        {
          //return this._ts[aggTraitId][name]();
          return this._propertiesStore[globalName];
        };
        //若属性定义为 CUSTOM_SETTER 属性，但用户却没有实现其 setter，则为用户生成一个抛出异常的 setter 函数。
        if(!o.hasOwnProperty(setName))
        {
          o[setName] = function()
          {
            throw (CustomSetterStr + name);
          }
        }
      }
      else
      {

      }
    }
    else
    {
      assert(!o.hasOwnProperty(name), "public property: " + name + " getter conflict with methods");
      assert(!o.hasOwnProperty(setName), "public property: " + name + " setter conflict with methods");
      o[name] = function()
      {
        //return this._ts[aggTraitId][name]();
        return this._propertiesStore[globalName];
      };
      o[setName] = function(val)
      {
        //return this._ts[aggTraitId][setName](val);
        this._propertiesStore[globalName] = val;
        return this;
      }
    }
  });
}

//将 entity 所有使用过的 traits 去重且合并。
function compressEntityUsedTraits(superEntityUsedTraits, aggregateTrait, curUsedTraits)
{
  var usedTraits = {};

  for(var key in superEntityUsedTraits)
  {
    if(superEntityUsedTraits.hasOwnProperty(key))
      usedTraits[key] = superEntityUsedTraits[key];
  }

  var aggUsedTraits = aggregateTrait._usedTraits;
  for(var i = 0; i < aggUsedTraits.length; ++i)
  {
    var trait = aggUsedTraits[i];
    usedTraits[identifier(trait)] = trait;
    curUsedTraits[identifier(trait)] = trait;
  }

  usedTraits[identifier(aggregateTrait)] = aggregateTrait;
  curUsedTraits[identifier(aggregateTrait)] = aggregateTrait;

  return usedTraits;
}

//分离各类属性。
function separateProperties(properties)
{
  var allPropsAry = [];
  //特殊类型属性用 map 形式存储是为了查找方便。
  var specialProperties = {}
  var i = 0;

  for(var name in properties)
  {
    if(properties.hasOwnProperty(name))
    {
      var prop = properties[name];
      if(typeof(prop) === "string")
      {
        allPropsAry[i++] = prop;
      }
      else if(prop instanceof Array)
      {
        if(typeof(prop[0]) === "string")
        {
          allPropsAry[i++] = prop;
        }
        else if(prop[0].type)
        {
          allPropsAry[i++] = [prop[0].name, prop[1]];
          specialProperties[prop[0].name] = prop[0].type;
        }
        else
        {
          assert(false, "bad property" + prop);
        }
      }
      else
      {
        if(prop.type)
        {
          allPropsAry[i++] = prop.name;
          specialProperties[prop.name] = prop.type;
        }
        else
        {
          assert(false, "bad property" + prop);
        }
      }
    }
  }

  return {
    allPropsAry : allPropsAry,
    specialProperties : specialProperties
  };
}

/*
为对象 o 应用上扩展方法、属性及所使用的traits。
*/
function useTraits(o, extMethods, properties, traits)
{
  var superEntity = o.proto();

  if(traits == null && extMethods == null && properties == null)
  {
    //保持属性原型链结构；获取属性时，在用户没有修改属性的情况下，取得的是原型上的属性值。
    o._propertiesStore = createObject(superEntity._propertiesStore);
    //不能复用原来的_t 及 subtrait 是因为_t 和 subtrait 都需要记住它所对应的实例化对象_o,才能完成一些操作。
    //因此此处必须重新为 _t 及 subtrait 绑定对应的 _o 对象。
    updateEntityAll_Ts(o);
    updateEntitySubtraits(o);
    return;
  }

  if(traits == null)
    traits = [];
  if(extMethods == null)
    extMethods = {};
  if(properties == null)
    properties = [];

  //保持属性原型链结构；获取属性时，在用户没有修改属性的情况下，取得的是原型上的属性值。
  //即使新对象中存在新的属性合并等操作，也不会影响到该原型链语义；原则上只要保证新对象上有属性合并的属性最终的 globalName 是唯一的(跟原型上的 globalName不一样)。
  o._propertiesStore = createObject(superEntity._propertiesStore);

  var sepProps = separateProperties(properties);
  o._specialProperties = sepProps.specialProperties;
  var aggregateTrait = compose(traits, extMethods, sepProps.allPropsAry);
  var traitMethods = aggregateTrait._methods;
  for (var mname in traitMethods)
  {
    if(!traitMethods.hasOwnProperty(mname))
      continue;
    var md = traitMethods[mname];
    var wrapFun = wrapEntityFunctionGenerators[md._func.length](md._func, identifier(md._ownerTrait));
    //wrapEntityFunction(md._func, md._ownerTrait.cIdentifier());
    wrapFun._ownerEntity = o;

    //methods can be call by this.methodName();
    o[mname] = wrapFun;
  }
 
  o._aggregateTrait = aggregateTrait;

  var curUsedTraits = {};
  o._usedTraits = compressEntityUsedTraits(superEntity._usedTraits, aggregateTrait, curUsedTraits);

  var grantProperties = grantEntityProperties(o);
  //o._grantProperties = grantProperties;
  var tmpNamesMap = genPropertiesNamesMap(aggregateTrait, grantProperties);
  o._properties = flatEntityProperties(o);
  o._namesMap = mergeNamesMaps([superEntity._namesMap, aggregateTrait._namesMap, tmpNamesMap]);
  
  genEntityGlobalNamemap(o, superEntity);
  //generate entity's traits all _ts.
  o._ts = generateEntityAll_Ts(o, superEntity, curUsedTraits);
  //generate entity's traits all _subTraits.
  o._subTraits = generateEntityAllSubtraits(o, traits);
  defineEntityPropertyGetterSetter(o, superEntity);

  return o;
}

//准备好遍历 globalName 所对应所有的 trait 属性的信息，存放于 _globalNameLocalpropInfo 上。
function updateGlobalNameLocalpropsInfo(obj, globalName)
{
  //obj 有可能层次很深，在遥远的 proto 上 _globalNameLocalpropInfo 有可能已经被别的类型初始化好了。
  //因此需要判断里 obj 最近的 proto 上是否存在 _globalNameLocalpropInfo。
  if(obj._globalNameLocalpropInfo == null || !obj.__proto__.hasOwnProperty("_globalNameLocalpropInfo"))
  {
    //defaultMappedNameInfo 存放该 obj 上所有使用过 trait 中的属性信息。
    //key 是属性的默认映射名，value是属性所在的 traitId及真实属性名。
    var defaultMappedNameInfo = {};
    objectKeysForEach(obj._usedTraits, function(key){
      var trait = obj._usedTraits[key];
      objectKeysForEach(trait._properties, function(propName){
        defaultMappedNameInfo[trait._defaultNameMap[propName]] = {traitId:key, propName:propName};
      });
    });
/*
    var aggTrait = obj._aggregateTrait;
    objectKeysForEach(aggTrait._properties, function(propName){
      defaultMappedNameInfo[aggTrait._defaultNameMap[propName]] = {traitId:aggTrait.cIdentifier(), propName:propName};
    });
*/
    var globalNameMap = obj._globalNameMap;
    var namesMap = obj._namesMap;
    //globalNameLocalpropInfo 中存放了每个 globalName 所对应的所有 trait 属性信息。
    //key 是 globalName，value是个数组，数组中存放了多个 defaultMappedNameInfo 项。
    var globalNameLocalpropInfo = {};

    objectKeysForEach(namesMap, function(key){
      //names 中存放了多个属性默认映射名，代表这些属性是同一属性。
      var names = namesMap[key];
      var reversedInfo;
      var globalName;
      objectKeysForEach(names, function(defaultMappedName){
        if(reversedInfo == null)
        {
          //初始化好 globalName 所对应的所有 trait 属性信息。
          globalName = globalNameMap[defaultMappedName];
          reversedInfo = [];
          globalNameLocalpropInfo[globalName] = reversedInfo;
        }
        reversedInfo.push(defaultMappedNameInfo[defaultMappedName]);
      });
    });

    //同类型的 object 的 setter 替换信息是一样的，因此信息放在对象的 __proto__ 上，以便复用。
    obj.__proto__._globalNameLocalpropInfo = globalNameLocalpropInfo;
  }
}

//记录globalName所对应所有 trait 属性的 hook 信息。以便替换setter以及unhook。
function updateGlobalNameHookInfos(obj, cbTime, cb, defaultMappedName, globalName)
{
  if(obj._hookInfos == null)
  {
    obj._hookInfos = {a:{}, b:{}};
  }
  var timeHookInfos = obj._hookInfos[cbTime];
  var hookInfo = timeHookInfos[globalName];
  //为了 setter 函数效率，如果某个globalName 对应的  hookinfo 只有一项，则直接存储；如果有多项，则用数组存储。
  if(hookInfo == null)
  {
    hookInfo = {defaultMappedName:defaultMappedName, cb:cb};
    timeHookInfos[globalName] = hookInfo;
  }
  else
  {
    if(hookInfo instanceof Array)
    {
      if(!arraySome(hookInfo, function(infoItem)
        {
          if(infoItem.defaultMappedName === defaultMappedName && infoItem.cb === cb)
          {
            infoItem.cb = cb;
            return true;
          }
          return false;
        }))
      {
        //如果原有的 hookinfoArray 不存在新加入的trait属性的hook，那么将新的信息push到数组末尾。
        hookInfo.push({defaultMappedName:defaultMappedName, cb:cb});
      };
    }
    else
    {
      if(hookInfo.defaultMappedName === defaultMappedName && hookInfo.cb === cb)
      {
        hookInfo.cb = cb;
      }
      else
      {
        timeHookInfos[globalName] = [hookInfo, 
          {defaultMappedName:defaultMappedName, cb:cb}];
      }
    }
  }

  return hookInfo;
}

//根据 globalName 的 hookInfo 信息，生成对应的 setter 函数。hookInfo 有可能没有、直接一个hookInfo值，或存储了多个 hookInfo 值的数组；因此生成 setter 函数时要区别对待。
function generateSetterFun(obj, globalName)
{
  var tSetterFun, eSetterFun;
  var beforeHookInfo = obj._hookInfos.b[globalName];
  var afterHookInfo = obj._hookInfos.a[globalName];
  var beforeIsArray = beforeHookInfo instanceof Array;
  var afterIsArray = afterHookInfo instanceof Array;

  if(!beforeIsArray && !afterIsArray)
  {
    if(beforeHookInfo == undefined && afterHookInfo != undefined)
    {
      tSetterFun = function(val){
        var oldVal = this._o._propertiesStore[globalName];
        this._o._propertiesStore[globalName] = val;
        afterHookInfo.cb(obj, oldVal, val);
        return val;
      };

      eSetterFun = function(val)
      {
        var oldVal = this._propertiesStore[globalName];
        this._propertiesStore[globalName] = val;
        afterHookInfo.cb(obj, oldVal, val);
        return val;
      };
    }
    else if(beforeHookInfo != undefined && afterHookInfo == undefined)
    {
      tSetterFun = function(val){
        var oldVal = this._o._propertiesStore[globalName];
        if(!beforeHookInfo.cb(obj, oldVal, val))
        {
          this._o._propertiesStore[globalName] = val;
        }
        else
        {
          val = oldVal;
        }
        return val;
      };

      eSetterFun = function(val)
      {
        var oldVal = this._propertiesStore[globalName];
        if(!beforeHookInfo.cb(obj, oldVal, val))
        {
          this._propertiesStore[globalName] = val;
        }
        else
        {
          val = oldVal;
        }
        return val;
      };
    }
    else if(beforeHookInfo != undefined && afterHookInfo != undefined)
    {
      tSetterFun = function(val){
        var oldVal = this._o._propertiesStore[globalName];
        if(!beforeHookInfo.cb(obj, oldVal, val))
        {
          this._o._propertiesStore[globalName] = val;
        }
        else
        {
          val = oldVal;
        }
        afterHookInfo.cb(obj, oldVal, val);
        return val;
      };
      eSetterFun = function(val){
        var oldVal = this._propertiesStore[globalName];
        if(!beforeHookInfo.cb(obj, oldVal, val))
        {
          this._propertiesStore[globalName] = val;
        }
        else
        {
          val = oldVal;
        }
        afterHookInfo.cb(obj, oldVal, val);
        return val;
      };
    }
    else
    {
      //beforeHookInfo is undefined && afterHookInfo is undefined
      //tSetterFun can use the _t proto's setter fun;
      //tSetterFun = undefined;
      
      tSetterFun = function(val){
        return this._o._propertiesStore[globalName] = val;
      };
      eSetterFun = function(val){
        return this._propertiesStore[globalName] = val;
      };
    }
  }
  else if(!beforeIsArray && afterIsArray)
  {
    if(beforeHookInfo == undefined)
    {
      tSetterFun = function(val){
        var oldVal = this._o._propertiesStore[globalName];
        this._o._propertiesStore[globalName] = val;
        arrayForEach(afterHookInfo, function(info){
          info.cb(obj, oldVal, val);
        });
        return val;
      };
      eSetterFun = function(val){
        var oldVal = this._propertiesStore[globalName];
        this._propertiesStore[globalName] = val;
        arrayForEach(afterHookInfo, function(info){
          info.cb(obj, oldVal, val);
        });
        return val;
      };
    }
    else
    {
      tSetterFun = function(val){
        var oldVal = this._o._propertiesStore[globalName];
        if(!beforeHookInfo(obj, oldVal, val))
        {
          this._o._propertiesStore[globalName] = val;
        }
        else
        {
          val = oldVal;
        }
        arrayForEach(afterHookInfo, function(info){
          info.cb(obj, oldVal, val);
        });
        return val;
      };

      eSetterFun = function(val){
        var oldVal = this._propertiesStore[globalName];
        if(!beforeHookInfo(obj, oldVal, val))
        {
          this._propertiesStore[globalName] = val;
        }
        else
        {
          val = oldVal;
        }
        arrayForEach(afterHookInfo, function(info){
          info.cb(obj, oldVal, val);
        });
        return val;
      };
    }
  }
  else if(beforeIsArray && !afterIsArray)
  {
    if(afterHookInfo == undefined)
    {
      tSetterFun = function(val){
        var oldVal = this._o._propertiesStore[globalName];
        var bOld = false;
        arrayForEach(beforeHookInfo, function(info){
          bOld |= info.cb(obj, oldVal, val); 
        });
        if(!bOld)
        {
          this._o._propertiesStore[globalName] = val;
        }
        else
        {
          val = oldVal;
        }
        return val;
      };

      eSetterFun = function(val){
        var oldVal = this._propertiesStore[globalName];
        var bOld = false;
        arrayForEach(beforeHookInfo, function(info){
          bOld |= info.cb(obj, oldVal, val); 
        });
        if(!bOld)
        {
          this._propertiesStore[globalName] = val;
        }
        else
        {
          val = oldVal;
        }
        return val;
      };
    }
    else
    {
      tSetterFun = function(val){
        var oldVal = this._o._propertiesStore[globalName];
        var bOld = false;
        arrayForEach(beforeHookInfo, function(info){
          bOld |= info.cb(obj, oldVal, val); 
        });
        if(!bOld)
        {
          this._o._propertiesStore[globalName] = val;
        }
        else
        {
          val = oldVal;
        }
        afterHookInfo.cb(obj, oldVal, val);
        return val;
      };

      eSetterFun = function(val){
        var oldVal = this._propertiesStore[globalName];
        var bOld = false;
        arrayForEach(beforeHookInfo, function(info){
          bOld |= info.cb(obj, oldVal, val); 
        });
        if(!bOld)
        {
          this._propertiesStore[globalName] = val;
        }
        else
        {
          val = oldVal;
        }
        afterHookInfo.cb(obj, oldVal, val);
        return val;
      };
    }
  }
  else
  {
    // beforeIsArray && afterIsArray
    tSetterFun = function(val){
      var oldVal = this._o._propertiesStore[globalName];
      var bOld = false;
      arrayForEach(beforeHookInfo, function(info){
        bOld |= info.cb(obj, oldVal, val); 
      });
      if(!bOld)
      {
        this._o._propertiesStore[globalName] = val;
      }
      else
      {
        val = oldVal;
      }
      arrayForEach(afterHookInfo, function(info){
        info.cb(obj, oldVal, val);
      });
      return val;
    };

    eSetterFun = function(val){
      var oldVal = this._propertiesStore[globalName];
      var bOld = false;
      arrayForEach(beforeHookInfo, function(info){
        bOld |= info.cb(obj, oldVal, val); 
      });
      if(!bOld)
      {
        this._propertiesStore[globalName] = val;
      }
      else
      {
        val = oldVal;
      }
      arrayForEach(afterHookInfo, function(info){
        info.cb(obj, oldVal, val);
      });
      return val;
    };
  }

  return {tSetter:tSetterFun, eSetter:eSetterFun};
}

//发生 hook 时，需要更新 _t 及 obj 上的 setter 函数；在属性改变时，才能够正确的通知出去。
function updateSetters(obj, globalName)
{
  var _ts = obj._ts;
  var setter = generateSetterFun(obj, globalName);
  var localProps = obj._globalNameLocalpropInfo[globalName];

  var _t;
  var propName, setterName, ownerEntity;

  //替换 globalName 影响的所有_t上的 setter
  arrayForEach(localProps, function(prop){
    propName = prop.propName;
    setterName = "set" + propName;
    ownerEntity = obj._properties[propName];
    _t = _ts[prop.traitId];
    _t[setterName] = setter.tSetter;

    //替换对象上公有属性的外部访问 api。
    //如果 prop.traitId 所代表的 trait 是 obj 上使用过的 _aggregateTrait
    //并且在该属性是公有属性，则需要替换。
    if( ownerEntity
        && ownerEntity._aggregateTrait == obj._usedTraits[prop.traitId]
        && ownerEntity._specialProperties[propName] == null
      )
    {
      obj[setterName] = setter.eSetter;
    }
    /*
    if(setterFun != undefined)
    {
      _t["set"+prop.propName] = setterFun;
    }
    else
    {
      //use _t proto's setterFun;
      delete _t["set"+prop.propName];
    }
    */
  });
}

//获取 obj 直接使用的 index 所代表的 trait 对外命名空间。
function getDirectedUsedTrait(obj, index)
{
  var ownerTrait;
  var directUsedTrait;

  assert(((typeof index) === "number"), "getDirectedUsedTrait bad index type");
  if(obj._t == null)
  {
    //在trait外部调用此方法，只能访问entity上直接使用的trait方法
    ownerTrait = obj._aggregateTrait;
  }
  else
  {
    ownerTrait = obj._t._ownerTrait;
  }

  return ownerTrait._directUsedTraits[index];
}

/**
@iclass[GrantProperty]{
  属性授权类；代表对 trait 某个私有属性的访问许可证。
}
*/
var GrantProperty = (function(){
  function GrantProperty(trait, name)
  {
    //授权的名字映射表；key 是 授权属性名 defaultNameMap，value 也是 defaultNameMap。
    //之所以用 {key:value} 形式存储是为了方便做属性合并和查找。
    this.grantNames = {};
    //授权访问的 trait 映射表；key 是 trait identifier，value 是对应的 trait。
    this.grantTraitIdentifiers = {};
    this.isGrant = true;
    if(trait != undefined)
    {
      var grantName = trait._defaultNameMap[name];
      var traitIdentifier = identifier(trait);
      this.grantNames[grantName] = grantName;
      this.grantTraitIdentifiers[traitIdentifier] = traitIdentifier;
    }

    return this;
  }

/**
@method[merge #:hidden]{
  @class[GrantProperty]
  @param[grantProp GrantProperty]{
    属性授权。
  }
  @return[this]{}
  将grantProp属性授权合并到当前属性授权上。  
}
*/
  GrantProperty.prototype.merge = function (grantProp)
  {
    //merge grantNames
    var grantNames = this.grantNames;
    var mergeNames = grantProp.grantNames;
    for(var name in mergeNames)
    {
      if(mergeNames.hasOwnProperty(name))
        grantNames[name] = name;
    }

    //merge grantTraitIdentifiers
    var grantIds = this.grantTraitIdentifiers;
    var mergeIds = grantProp.grantTraitIdentifiers;
    for(var name in mergeIds)
    {
      if(mergeIds.hasOwnProperty(name))
        grantIds[name] = name;
    }

    return this;
  };

/**
@method[compose]{
  @class[GrantProperty]
  @param[grantProps array]{
    属性授权列表。
  }
  @return[@type[GrantProperty]]{新的属性授权}
  将当前属性授权和grantProps中的所有属性授权组合为一个新的属性授权返回。  
}
*/
  GrantProperty.prototype.compose = function (grantProps)
  {
    var composeGrants = [this];

    if((grantProps instanceof Array))
      composeGrants = composeGrants.concat(grantProps);
    else
      composeGrants = composeGrants.concat(slice.call(arguments, 0));

    return composeGrantProperties(composeGrants);
  };

  return GrantProperty;
})();

/**
@function[composeGrantProperties]{
  @param[grantProps array]{
    授权属性列表。
  }
  @return[@type[GrantProperty]]{}
  将多个授权属性合并为一个新的授权返回。

  此方法可以将多个trait中的多个属性合并为同一个属性。
}
*/
function composeGrantProperties(grantProps)
{
  var newGrantProp = new GrantProperty();

  for(var i = 0; i < grantProps.length; ++i)
  {
    newGrantProp.merge(grantProps[i]);
  }
  return newGrantProp;
}

var Entity = {
  _usedTraits : [],
  _namesMap : [],
  _properties:{},
  _specialProperties:{},
  _propertiesStore:{},
  _globalNameMap:{},
  _maxGlobalNameNum:0,
  //_grantProperties:{},//目的是为了将当前 entity 上的属性和 super 上的同名属性自动合并。

/**
@method[isEntity #:hidden]{
  @class[Klass]
  @return[boolean]{true：是；false：不是。}
  询问对象是否是一个原型对象。  
}
*/
  isEntity : function ()
  {
    return true;
  },
/**
@method[proto]{
  @class[Klass]
  @return[prototype]{}
  获取类的原型信息。  
}
*/
  proto : function()
  {
    return this.__proto__;
  },
/**
@method[aggregateTrait #:hidden]{
  @class[Klass]
  @return[@type[Trait]]{}
  获取类的内部trait，在实现上可以把类看成是一个 trait。  
}
*/
  aggregateTrait : function ()
  {
    return this._aggregateTrait;
  },

/**
@method[execProto]{
  @class[Klass]
  @param[methodName string]{
    父类上某方法名。
  }
  @param[arguments arguments]{
    可变参数列表；父类上 methodName 所指定方法所需要的参数。
  }
  @return[value]{父类 methodName 方法的返回值。}
  调用父类上 methodName 所代表的方法。
}
*/
  execProto: function (methodName, a, b, c, d, e, f, g, h)
  {
    var m = this._t._ownerEntity.proto()[methodName];
    return m.call(this, a, b, c, d, e, f, g, h);  
  },
/**
@method[tryExec]{
  @class[Klass]
  @param[methodName string]{
    方法名。
  }
  @param[arguments arguments]{
    可变参数列表；methodName 所指定方法所需要的参数。
  }
  @return[value]{methodName 方法的返回值。}
  安全执行 methodName 所代表的方法，若方法不存在，则不执行直接返回。
}
*/
  tryExec: function (methodName, a, b, c, d, e, f, g, h)
  {
    var m = this[methodName];
    if (m)
    {
      return m.call(this, a, b, c, d, e, f, g, h);
    }
  },
/**
@method[hasMethod]{
  @class[Klass]
  @param[methodName string]{
    方法名。
  }
  @return[boolean]{true：存在；false：不存在。}
  询问对象是否存在名为 methodName 的方法。  
}
*/
  hasMethod : function(methodName)
  {
    return !!this[methodName];
  },
/**
@method[hasProperty]{
  @class[Klass]
  @param[propName string]{
    属性名。
  }
  @return[boolean]{true：存在；false：不存在。}
  询问对象是否存在名为 propName 的属性。  
}
*/
  hasProperty : function(propName)
  {
    return this._properties.hasOwnProperty(propName);
  },

/**
@method[clone #:hidden]{
  @class[Klass]
  @param[extMethods obj]{
    扩展方法集合。
  }
  @param[properties array]{
    扩展属性集合。
  }
  @param[properties traitArray]{
    扩展所需的 traits 集合。
  }
  @return[entity]{}
  以原始对象为原型，根据扩展信息克隆出一个新的对象。
}
*/
  clone: function (extMethods, properties, traits)
  {
    var obj = createObject(this);

    useTraits(obj, extMethods, properties, traits);

    return obj;
  },
/**
@method[hook]{
  @class[Klass]
  @param[hookTraitmsg traitMsg]{
    hook的属性所属的 trait，例如 this._t 或者 this.subTraits(n)等。
  }
  @param[propName string]{
    属性名。
  }
  @param[cb function]{
    hook 函数。
    @jscode{
      //hook函数参数分别表示：hook的对象、旧属性值、新属性值
      function cb(obj, oldVal, newVal){ ... }
    }
  }
  @param[cbTime string]{
    hook 函数调用时间；可以是 "b":属性变化前， "a":属性变化后。
  }
  @return[this]{}
  用函数 cb 去 hook 住 traitMsg 上 propName 属性。

  若cbTime是 "b",则在用户设置该属性时，在属性真正修改前会调用 cb 函数。

  若cbTime是 "a",则在用户设置该属性时，在属性真正修改后会调用 cb 函数。
}
*/
  hook : function(hookTraitmsg, propName, cb, cbTime)
  {
    var hookTrait = hookTraitmsg._ownerTrait;
    if(hookTrait == null || cb == null)
      return this;

    if(cbTime == undefined)
    {
      cbTime = "a";
    }
/*
    if(propName == "dirtyStamp")
    {
      console.log(this.aaa)
      this.aaa = 2;
      debugger;
    }*/

    //受同一个 globalName 影响的 localNames
    var defaultMappedName = hookTrait._defaultNameMap[propName];
    var globalNameMap = this._globalNameMap[defaultMappedName];
    
    updateGlobalNameLocalpropsInfo(this, globalNameMap);
    updateGlobalNameHookInfos(this, cbTime, cb, defaultMappedName, globalNameMap);
    updateSetters(this, globalNameMap);

    return this;
  },
/**
@method[hookMany]{
  @class[Klass]
  @param[hookTraitmsg traitMsg]{
    hook的属性所属的 trait，例如 this._t 或者 this.subTraits(n)等。
  }
  @param[propNames array]{
    包含多个属性名的数组。
  }
  @param[cb function]{
    hook 函数。
    @jscode{
      //hook函数参数分别表示：hook的对象、旧属性值、新属性值
      function cb(obj, oldVal, newVal){ ... }
    }
  }
  @param[cbTime string]{
    hook 函数调用时间；可以是 "b":属性变化前， "a":属性变化后。
  }
  @return[this]{}
  用函数 cb 去 hook 住 propNames 中所有的属性。

  若cbTime是 "b",则在用户设置这些属性时，在属性真正修改前会调用 cb 函数。
  
  若cbTime是 "a",则在用户设置这些属性时，在属性真正修改后会调用 cb 函数。
}
*/
  hookMany : function(hookTraitmsg, propNames, cb, cbTime)
  {
    var len = propNames.length;

    for(var i = 0; i < len; ++i)
    {
      this.hook(hookTraitmsg, propNames[i], cb, cbTime);    
    }

    return this;
  },
/**
@method[unhook]{
  @class[Klass]
  @param[hookTraitmsg traitMsg]{
    unhook的属性所属的 trait，例如 this._t 或者 this.subTraits(n)等。
  }
  @param[propName string]{
    属性名。
  }
  @param[cb function]{
    unhook 的函数。    
  }
  @param[cbTime string]{
    hook 时间；可以是 "b":属性变化前， "a":属性变化后。
  }
  @return[this]{}
  取消对 traitMsg 所代表trait 上 propName 属性的 hook。
}
*/
  unhook : function(hookTraitmsg, propName, cb, cbTime)
  {
    var hookTrait = hookTraitmsg._ownerTrait;
    if(hookTrait == null)
      return this;

    if(cbTime == undefined)
    {
      cbTime = "a";
    }

    var defaultMappedName = hookTrait._defaultNameMap[propName];
    var globalName = this._globalNameMap[defaultMappedName];
    var timeHookInfos = this._hookInfos[cbTime];
    var hookInfo = timeHookInfos[globalName];

    if(hookInfo == null)
      assert(false, "unhook cb is undefined!!");
    //clear hookInfo
    if(hookInfo instanceof Array)
    {
      var bTwo = (hookInfo.length == 2);
      if(arraySome(hookInfo, function(info, i){
          if(info.defaultMappedName === defaultMappedName && info.cb === cb)
          {
            hookInfo.splice(i, 1);
            //timeHookInfos[globalName] = hookInfo.splice(i, 1);
            return true;
          }
          return false;
        }))
      {
        if(bTwo)
        {
          timeHookInfos[globalName] = timeHookInfos[globalName][0];
        }
      }
      else
      {
        assert(false, "unhook a no exist cb hook");
      }

    }
    else
    {
      if(hookInfo.defaultMappedName === defaultMappedName && hookInfo.cb === cb)
      {
        delete timeHookInfos[globalName];
        /*
        var hookGlobalNames = Object.cKeys(timeHookInfos);
        if(hookGlobalNames.length == 0)
        {
          delete this._hookInfos[cbTime];
        }
        */
      }
      else
      {
        assert(false, "unhook a no exist cb");
      }
    }

    updateSetters(this, globalName);

    return this;
  },
/**
@method[unhookMany]{
  @class[Klass]
  @param[hookTraitmsg traitMsg]{
    unhook的属性所属的 trait，例如 this._t 或者 this.subTraits(n)等。
  }
  @param[propNames array]{
    包含多个属性名的数组。
  }
  @param[cb function]{
    unhook 的函数。    
  }
  @param[cbTime string]{
    hook 时间；可以是 "b":属性变化前， "a":属性变化后。
  }
  @return[this]{}
  取消对 traitMsg 所代表trait 上 propNames 中所有属性的 hook。
}
*/
  unhookMany : function(hookTraitmsg, propNames, cb, cbTime)
  {
    var len = propNames.length;

    for(var i = 0; i < len; ++i)
    {
      this.unhook(hookTraitmsg, propNames[i], cb, cbTime);    
    }

    return this;
  },
/**
@method[subTraits]{
  @class[Klass]
  @param[index number]{
    Klass直接使用的 trait 所在的数组下标值。
  }
  @return[traitMsg]{trait 描述。}
  获取 Klass 直接使用的 name 所代表的 trait 对外命名空间。

  通过 traitMsg 可以 hook trait 的属性及可以调用 trait 上的私有方法。
}
*/
  subTraits : function(index)
  {
    var directUsedTrait = getDirectedUsedTrait(this, index);
    if(directUsedTrait != null)
    {
      return this._subTraits[identifier(directUsedTrait)];
    }
  }
};

/**
@iclass[Klass]{
  模块预定义的 Class。

  @itemize[#:style 'unnumbered
    @item{Klass:可被扩展出新的 Class。}
    @item{Klass:可以实例化出对象。}
    @item{Klass:可以直接使用 Trait。}
  ]

  在它的基础上可以扩展出新的Klass，并且通过Klass可以创建实例化对象。
}

@property[_t traitMsg #:attr 'PRIVATE]{
  @class[Klass]
  当前 Klass 实例化对象的私有命名空间。

  @itemize[#:style 'unnumbered
    @item{_t 只能够在 Klass 内部用 this._t 的方式获取，外部 anyObj._t 获取不到。}
    @item{通过 this._t 可以访问和修改 Klass 上所有的属性及调用 Klass 上的 local 方法。}
  ]  
}
*/
var Klass = Entity.clone({
/**
@method[extend]{
  @class[Klass]
  @param[extMethods obj]{
    派生方法集合。

    @jscode{
      例如：
      {
        move : function(){},
        __jump : function(){}
      }
    }

    @bold{local方法}派生方法集合中，以"__"双下划线开头的方法为 local 方法，只能够在 Klass 内部使用。
  }
  @param[properties array]{
    派生属性列表。
    @jscode{
      例如：
      [
        "position",//公有属性
        READONLY("speed"),//只读属性
        PRIVATE("girlFriend"), //私有属性
        ["money", Tom.grant("money").compose(Lucy.grant("money"))] //公有属性，并且将Tom 和 Lucy 的钱都占为己有。 
      ]
    }
  }
  @param[traits array]{
    派生类所使用的 trait array。
  }
  @param[extKlass array]{
    用来订制 Klass 的方法及属性。

    数组最多有三项[extMethods, properties, traits]
    @jscode{
      extMethods ： NewKlass 上的扩展方法；
      properties ： NewKlass 上的扩展属性；
      traits : NewKlass 所使用的traits；
    }
  }
  @return[Klass]{派生类}
  用 extMethods, properties, traits 对父类进行扩展，得到一个新的派生类。
}
*/
  extend:function(extMethods, properties, traits, extKlass)
  //extend:function(extMethods, properties, traits)
  {
    var newKlass;
    if(extKlass)
      newKlass = this.clone(extKlass[0], extKlass[1], extKlass[2]);
    else
      newKlass = this.clone();
    newKlass._objectProto = this._objectProto.clone(extMethods, properties, traits);

    return newKlass;
  }
});

//Klass的create函数是不定长参数，因此不能定义在clone的扩展函数集合里面，否则参数有可能被截断。
/**
@method[create]{
  @class[Klass]
  @param[arguments arguments]{
    创建对象所需的参数；即Klass 上的 initialize 函数所需的参数。
  }
  @return[object]{类实例化对象。}
  创建一个 Klass 实例化对象，默认会调用 Klass 上的 initialize 函数最为实例对象的初始化函数。
}
*/
Klass.create = function()
{
  var inst = this._objectProto.clone();

  inst.initialize.apply(inst, arguments);
  inst.Klass = this;


  return inst;
}

Klass._objectProto = Entity.clone({initialize:function(){}});


/**
@function[READONLY]{
  @param[propName String]{
    属性名。
  }
  @return[object]{}
  将 propName 属性标识为只读属性；一般用于 Klass 属性定义。
  @jscode{
    //例如:
    //MyKlass 中 money 为只读属性，外部只能访问不能修改。
    var MyKlass = Klass.extend(
      extMethods,
      [READONLY("money")]
    );
  }
}
*/
var READONLY = function(propName)
{
  return {name:propName, type:READONLY};
}

/**
@function[PRIVATE]{
  @param[propName String]{
    属性名。
  }
  @return[object]{}
  将 propName 属性标识为私有属性；一般用于 Klass 属性定义。
  @jscode{
    //例如:
    //MyKlass 中 money 为私有属性；外部不能访问和修改。
    var MyKlass = Klass.extend(
      extMethods,
      [PRIVATE("money")]
    );
  }
}
*/
var PRIVATE = function(propName)
{
  return {name:propName, type:PRIVATE};
}

/**
@function[CUSTOM_SETTER]{
  @param[propName String]{
    属性名。
  }
  @return[object]{}
  将 propName 属性标识为由用户提供设置接口的属性；一般用于 Klass 属性定义。
  @jscode{
    //例如:
    var MyKlass = Klass.extend(
      {
        setmoney : function(){...}
      },
      [PRIVATE("money")]
    );
  }
}
*/
var CUSTOM_SETTER = function(propName)
{
  return {name:propName, type:CUSTOM_SETTER};
}

export$({
  Trait: Trait,
  compose: compose,
  Entity: Entity,
  Klass: Klass,
  composeGrantProperties: composeGrantProperties,
  READONLY: READONLY,
  PRIVATE: PRIVATE,
  CUSTOM_SETTER: CUSTOM_SETTER
});
};
__modules__["/sprites/clip.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits");
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;
var Sprite = require("./sprite");
var ClipTrait = require("../gprims/clipgprim").ClipTrait;


/**
@title{Clip}
*/

/**
@iclass[Clip Sprite (ClipTrait)]{
  矩形剪裁精灵，该精灵可以去用一个矩形框剪裁另外一个精灵图源。它使用了 ClipTrait 具有 ClipTrait 上所有属性和方法。
  
  @grant[ClipTrait type #:attr 'READONLY]
  @grant[ClipTrait clipw #:attr 'READONLY]
  @grant[ClipTrait cliph #:attr 'READONLY]
  @grantMany[ClipTrait id tag gprim clipx clipy] 
}
**/
var Clip = Sprite.extend({
  initialize: function(param)
  {
    this.execProto("initialize", {gprim:this, interactable:((param == undefined) ? undefined : param.interactable)});
    this.subTraits(0).__init(param);
  }
},
 [[READONLY("type"), ClipTrait.grant("type")], [CUSTOM_SETTER("clipw"), ClipTrait.grant("clipw")],
  [CUSTOM_SETTER("cliph"), ClipTrait.grant("cliph")]].concat(ClipTrait.grantMany(["id", "tag", "gprim", "clipx", "clipy"])),
 [ClipTrait]);

export$(Clip);
};
__modules__["/sprites/circle.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits");
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;
var Sprite = require("./sprite");
var CircleTrait = require("../gprims/circlegprim").CircleTrait;


/**
@title{Circle}
*/

/**
@iclass[Circle Sprite (CircleTrait)]{
  圆形精灵，它使用了 CircleTrait，具有CircleTrait上所有属性和方法:
  其中，属性读取方式为：xxx(),属性设置方式setxxx(val)。
  @grant[CircleTrait type #:attr 'READONLY]
  @grant[CircleTrait radius #:attr 'READONLY]
  @grantMany[CircleTrait fillFlag strokeFlag id tag strokeStyle fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineDash] 
}
**/
var Circle = Sprite.extend({
  initialize: function(param)
  {
    this.execProto("initialize", {gprim:this, interactable:((param == undefined) ? undefined : param.interactable)});
    this.subTraits(0).__init(param);
  }
},
[[READONLY("type"), CircleTrait.grant("type")], [CUSTOM_SETTER("radius"), CircleTrait.grant("radius")],
 [CUSTOM_SETTER("strokeStyle"), CircleTrait.grant("strokeStyle")], [CUSTOM_SETTER("fillStyle"), CircleTrait.grant("fillStyle")],
 [CUSTOM_SETTER("shadowColor"), CircleTrait.grant("shadowColor")]].concat(CircleTrait.grantMany(["fillFlag", "strokeFlag", "id", "tag", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineDash"])),   
 [CircleTrait]);

export$(Circle);
};
__modules__["/gprims/proceduregprim.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits")
,   GPrimTrait = require("./gprim").GPrimTrait;


var Klass = colortraits.Klass;
var READONLY = colortraits.READONLY;

/**
@iclass[ProcedureTrait Trait]{
  用户自定义gprim。通过这个gprim，用户可以定制出任何自己想要展示的gprim对象，并且可以控制这个gprim对象的交互区域等。使用GPrimTrait。
  具有如下属性：
  @verbatim|{
    {draw:function, 用户自自定义gprim的绘制函数}
    {bbox:function, 用来返回该gprim对象的矩形包围盒的函数}
    {inside:function, 碰撞检测函数，用来判断某个坐标是否跟该gprim发生碰撞}
    {type: 只读 "proceduregprim"}
    {id}
    {tag}
    {x}
    {y}
  }|
}
**/

//这里有一个问题是如何初始化方法和函数同名
var defaultProcedure = {};
var ProcedureTrait = GPrimTrait.extend({
  __init:function(param)
  {
    this.subTraits(0).__init(param);
    this._t.settype("proceduregprim");
    if(param == undefined)
      param = defaultProcedure;
    this._t.setdraw((param.draw == undefined) ? function(m, painter){} : param.draw);
    this._t.setlocalBbox((param.localBbox == undefined) ? function(){return indetifyRect;} : param.localBbox);
    this._t.setlocalInside((param.locaInside == undefined) ? function(x, y){return false;} : param.localInside);
  }
},
 ["localBbox", "localInside", "localDraw"].concat(GPrimTrait.grantAll())
 );


/**
@iclass[ProcedureGPrim Klass (ProcedureTrait)]{
  用户自定义gprim。通过这个gprim，用户可以定制出任何自己想要展示的gprim对象，并且可以控制这个gprim对象的交互区域等。具有如下属性：
  @verbatim|{
    {draw:function, 用户自自定义gprim的绘制函数}
    {bbox:function, 用来返回该gprim对象的矩形包围盒的函数}
    {inside:function, 碰撞检测函数，用来判断某个坐标是否跟该gprim发生碰撞}
    {id}
    {type: "procedure", 只读}
  }|
}
**/
 /**
 *  @property[ratioAnchor object #:def "{ratiox: 0, ratioy: 0}"]{
      @class[ProcedureKlass]
      图元左上角到图元锚点的距离与未经矩阵变换的图元的宽高比组成的对象。
 *  }
 */
 /**
 *  @property[anchor object #:def "{x: 0, y: 0}"]{
      @class[ProcedureKlass]
      图元锚点在local坐标系下的位置。
 *  }
 */
var ProcedureKlass = Klass.create({
  initialize: function(param)
  {
    this.execProto("initialize");
    this.subTraits(0).__init(param);
  }
},
[[READONLY("type"), ProcedureTrait.grant("type")], ["localBbox", ProcedureTrait.grant("localBbox")],
 ["localInside", ProcedureTrait.grant("localInside")], ["draw", ProcedureTrait.grant("draw")]].concat(PathTrait.grantMany("id")),
[ProcedureTrait]);


export$({
  ProcedureTrait : ProcedureTrait,
  ProcedureKlass : ProcedureKlass  
});

};
__modules__["/treeactor.js"] = function(require, load, export$) {



var TreeActorBase = require("./treeactorbase").TreeActor;



var TreeActor = TreeActorBase.extend({
  initialize:function(param){
    this.execProto("initialize", param);    
    this.dynamicAttrs = {};
  },
  setProperty:function(name,value){
    if(this.hasProperty(name))
      this["set"+name](value);
    else
      throw "actor has no property named:"+name;
    return this;
  },
  property:function(name){
    if(this.hasProperty(name))
      return this[name]();
    else 
      throw "actor has no property named:"+name;
  },
  setDynamicProperty:function(name,value){
    this.dynamicAttrs[name] = value;
    return this;
  },
  dynamicProperty:function(name){
    return this.dynamicAttrs[name];
  }
});

export$({
  TreeActor : TreeActor
});

};
__modules__["/thirdlib/rx/rx.js"] = function(require, load, export$) {
// Copyright (c) Microsoft Open Technologies, Inc. All rights reserved. See License.txt in the project root for license information.

(function (window, undefined) {
    var freeExports = typeof exports == 'object' && exports,
        freeModule = typeof module == 'object' && module && module.exports == freeExports && module,
        freeGlobal = typeof global == 'object' && global;
    if (freeGlobal.global === freeGlobal) {
        window = freeGlobal;
    }

     /** 
     * @name Rx
     * @type Object
     */
    var Rx = { Internals: {} };
    
    // Defaults
    function noop() { }
    function identity(x) { return x; }
    function defaultNow() { return new Date().getTime(); }
    function defaultComparer(x, y) { return x === y; }
    function defaultSubComparer(x, y) { return x - y; }
    function defaultKeySerializer(x) { return x.toString(); }
    function defaultError(err) { throw err; }

    // Errors
    var sequenceContainsNoElements = 'Sequence contains no elements.';
    var argumentOutOfRange = 'Argument out of range';
    var objectDisposed = 'Object has been disposed';
    function checkDisposed() {
        if (this.isDisposed) {
            throw new Error(objectDisposed);
        }
    }
    
    var slice = Array.prototype.slice;
    function argsOrArray(args, idx) {
        return args.length === 1 && Array.isArray(args[idx]) ?
            args[idx] :
            slice.call(args);
    }
    var hasProp = {}.hasOwnProperty;

    /** @private */
    var inherits = this.inherits = Rx.Internals.inherits = function (child, parent) {
        function __() { this.constructor = child; }
        __.prototype = parent.prototype;
        child.prototype = new __();
    };

    /** @private */    
    var addProperties = Rx.Internals.addProperties = function (obj) {
        var sources = slice.call(arguments, 1);
        for (var i = 0, len = sources.length; i < len; i++) {
            var source = sources[i];
            for (var prop in source) {
                obj[prop] = source[prop];
            }
        }
    };

    // Rx Utils
    var addRef = Rx.Internals.addRef = function (xs, r) {
        return new AnonymousObservable(function (observer) {
            return new CompositeDisposable(r.getDisposable(), xs.subscribe(observer));
        });
    };

    // Collection polyfills
    function arrayInitialize(count, factory) {
        var a = new Array(count);
        for (var i = 0; i < count; i++) {
            a[i] = factory();
        }
        return a;
    }

    // Utilities
    if (!Function.prototype.bind) {
        Function.prototype.bind = function (that) {
            var target = this,
                args = slice.call(arguments, 1);
            var bound = function () {
                if (this instanceof bound) {
                    function F() { }
                    F.prototype = target.prototype;
                    var self = new F();
                    var result = target.apply(self, args.concat(slice.call(arguments)));
                    if (Object(result) === result) {
                        return result;
                    }
                    return self;
                } else {
                    return target.apply(that, args.concat(slice.call(arguments)));
                }
            };

            return bound;
        };
    }

    var boxedString = Object("a"),
        splitString = boxedString[0] != "a" || !(0 in boxedString);
    if (!Array.prototype.every) {
        Array.prototype.every = function every(fun /*, thisp */) {
            var object = Object(this),
                self = splitString && {}.toString.call(this) == "[object String]" ?
                    this.split("") :
                    object,
                length = self.length >>> 0,
                thisp = arguments[1];

            if ({}.toString.call(fun) != "[object Function]") {
                throw new TypeError(fun + " is not a function");
            }

            for (var i = 0; i < length; i++) {
                if (i in self && !fun.call(thisp, self[i], i, object)) {
                    return false;
                }
            }
            return true;
        };
    }

    if (!Array.prototype.map) {
        Array.prototype.map = function map(fun /*, thisp*/) {
            var object = Object(this),
                self = splitString && {}.toString.call(this) == "[object String]" ?
                    this.split("") :
                    object,
                length = self.length >>> 0,
                result = Array(length),
                thisp = arguments[1];

            if ({}.toString.call(fun) != "[object Function]") {
                throw new TypeError(fun + " is not a function");
            }

            for (var i = 0; i < length; i++) {
                if (i in self)
                    result[i] = fun.call(thisp, self[i], i, object);
            }
            return result;
        };
    }

    if (!Array.prototype.filter) {
        Array.prototype.filter = function (predicate) {
            var results = [], item, t = new Object(this);
            for (var i = 0, len = t.length >>> 0; i < len; i++) {
                item = t[i];
                if (i in t && predicate.call(arguments[1], item, i, t)) {
                    results.push(item);
                }
            }
            return results;
        };
    }

    if (!Array.isArray) {
        Array.isArray = function (arg) {
            return Object.prototype.toString.call(arg) == '[object Array]';
        };
    }
    
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function indexOf(searchElement) {
            var t = Object(this);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = 0;
            if (arguments.length > 1) {
                n = Number(arguments[1]);
                if (n !== n) {
                    n = 0;
                } else if (n !== 0 && n != Infinity && n !== -Infinity) {
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
            }
            if (n >= len) {
                return -1;
            }
            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
            for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        };
    }

    // Collections
    var IndexedItem = function (id, value) {
        this.id = id;
        this.value = value;
    };

    IndexedItem.prototype.compareTo = function (other) {
        var c = this.value.compareTo(other.value);
        if (c === 0) {
            c = this.id - other.id;
        }
        return c;
    };

    // Priority Queue for Scheduling
    var PriorityQueue = function (capacity) {
        this.items = new Array(capacity);
        this.length = 0;
    };
    var priorityProto = PriorityQueue.prototype;
    priorityProto.isHigherPriority = function (left, right) {
        return this.items[left].compareTo(this.items[right]) < 0;
    };
    priorityProto.percolate = function (index) {
        if (index >= this.length || index < 0) {
            return;
        }
        var parent = index - 1 >> 1;
        if (parent < 0 || parent === index) {
            return;
        }
        if (this.isHigherPriority(index, parent)) {
            var temp = this.items[index];
            this.items[index] = this.items[parent];
            this.items[parent] = temp;
            this.percolate(parent);
        }
    };
    priorityProto.heapify = function (index) {
        if (index === undefined) {
            index = 0;
        }
        if (index >= this.length || index < 0) {
            return;
        }
        var left = 2 * index + 1,
            right = 2 * index + 2,
            first = index;
        if (left < this.length && this.isHigherPriority(left, first)) {
            first = left;
        }
        if (right < this.length && this.isHigherPriority(right, first)) {
            first = right;
        }
        if (first !== index) {
            var temp = this.items[index];
            this.items[index] = this.items[first];
            this.items[first] = temp;
            this.heapify(first);
        }
    };
    priorityProto.peek = function () {
        return this.items[0].value;
    };
    priorityProto.removeAt = function (index) {
        this.items[index] = this.items[--this.length];
        delete this.items[this.length];
        this.heapify();
    };
    priorityProto.dequeue = function () {
        var result = this.peek();
        this.removeAt(0);
        return result;
    };
    priorityProto.enqueue = function (item) {
        var index = this.length++;
        this.items[index] = new IndexedItem(PriorityQueue.count++, item);
        this.percolate(index);
    };
    priorityProto.remove = function (item) {
        for (var i = 0; i < this.length; i++) {
            if (this.items[i].value === item) {
                this.removeAt(i);
                return true;
            }
        }
        return false;
    };
    PriorityQueue.count = 0;
    /**
     * Represents a group of disposable resources that are disposed together.
     * 
     * @constructor
     */
    var CompositeDisposable = Rx.CompositeDisposable = function () {
        this.disposables = argsOrArray(arguments, 0);
        this.isDisposed = false;
        this.length = this.disposables.length;
    };

    var CompositeDisposablePrototype = CompositeDisposable.prototype;

    /**
     *  Adds a disposable to the CompositeDisposable or disposes the disposable if the CompositeDisposable is disposed.
     *  
     * @param {Mixed} item Disposable to add.
     */    
    CompositeDisposablePrototype.add = function (item) {
        if (this.isDisposed) {
            item.dispose();
        } else {
            this.disposables.push(item);
            this.length++;
        }
    };

    /**
     *  Removes and disposes the first occurrence of a disposable from the CompositeDisposable.
     *  
     * @memberOf CompositeDisposable#
     * @param {Mixed} item Disposable to remove.
     * @returns {Boolean} true if found; false otherwise.
     */
    CompositeDisposablePrototype.remove = function (item) {
        var shouldDispose = false;
        if (!this.isDisposed) {
            var idx = this.disposables.indexOf(item);
            if (idx !== -1) {
                shouldDispose = true;
                this.disposables.splice(idx, 1);
                this.length--;
                item.dispose();
            }

        }
        return shouldDispose;
    };

    /**
     *  Disposes all disposables in the group and removes them from the group.
     *
     * @memberOf CompositeDisposable#     
     */
    CompositeDisposablePrototype.dispose = function () {
        if (!this.isDisposed) {
            this.isDisposed = true;
            var currentDisposables = this.disposables.slice(0);
            this.disposables = [];
            this.length = 0;

            for (var i = 0, len = currentDisposables.length; i < len; i++) {
                currentDisposables[i].dispose();
            }
        }
    };

    /**
     *  Removes and disposes all disposables from the CompositeDisposable, but does not dispose the CompositeDisposable.
     *
     * @memberOf CompositeDisposable#
     */   
    CompositeDisposablePrototype.clear = function () {
        var currentDisposables = this.disposables.slice(0);
        this.disposables = [];
        this.length = 0;
        for (var i = 0, len = currentDisposables.length; i < len; i++) {
            currentDisposables[i].dispose();
        }
    };

    /**
     *  Determines whether the CompositeDisposable contains a specific disposable.
     *  
     * @memberOf CompositeDisposable#     
     * @param {Mixed} item Disposable to search for.
     * @returns {Boolean} true if the disposable was found; otherwise, false.
     */    
    CompositeDisposablePrototype.contains = function (item) {
        return this.disposables.indexOf(item) !== -1;
    };

    /**
     *  Converts the existing CompositeDisposable to an array of disposables
     *  
     * @memberOf CompositeDisposable#
     * @returns {Array} An array of disposable objects.
     */  
    CompositeDisposablePrototype.toArray = function () {
        return this.disposables.slice(0);
    };
    
    /**
     * Provides a set of static methods for creating Disposables.
     *
     * @constructor 
     * @param {Function} dispose Action to run during the first call to dispose. The action is guaranteed to be run at most once.
     */
    var Disposable = Rx.Disposable = function (action) {
        this.isDisposed = false;
        this.action = action;
    };

    /** 
     * Performs the task of cleaning up resources.
     *
     * @memberOf Disposable#
     */     
    Disposable.prototype.dispose = function () {
        if (!this.isDisposed) {
            this.action();
            this.isDisposed = true;
        }
    };

    /**
     *  Creates a disposable object that invokes the specified action when disposed.
     *  
     * @static
     * @memberOf Disposable
     * @param {Function} dispose Action to run during the first call to dispose. The action is guaranteed to be run at most once.
     * @return {Disposable} The disposable object that runs the given action upon disposal.
     */
    var disposableCreate = Disposable.create = function (action) { return new Disposable(action); };

    /** 
     * Gets the disposable that does nothing when disposed. 
     * 
     * @static
     * @memberOf Disposable
     */
    var disposableEmpty = Disposable.empty = { dispose: noop };

    /**
     * Represents a disposable resource which only allows a single assignment of its underlying disposable resource.
     * If an underlying disposable resource has already been set, future attempts to set the underlying disposable resource will throw an Error.
     * 
     * @constructor
     */
    var SingleAssignmentDisposable = Rx.SingleAssignmentDisposable = function () {
        this.isDisposed = false;
        this.current = null;
    };

    var SingleAssignmentDisposablePrototype = SingleAssignmentDisposable.prototype;

    /**
     *  Gets or sets the underlying disposable. After disposal, the result of getting this method is undefined.
     *  
     * @memberOf SingleAssignmentDisposable#
     * @param {Disposable} [value] The new underlying disposable.
     * @returns {Disposable} The underlying disposable.
     */
    SingleAssignmentDisposablePrototype.disposable = function (value) {
        return !value ? this.getDisposable() : this.setDisposable(value);
    };

    /**
     *  Gets the underlying disposable. After disposal, the result of getting this method is undefined.
     * 
     * @memberOf SingleAssignmentDisposable#     
     * @returns {Disposable} The underlying disposable.
     */  
    SingleAssignmentDisposablePrototype.getDisposable = function () {
        return this.current;
    };

    /**
     *  Sets the underlying disposable. 
     *
     * @memberOf SingleAssignmentDisposable#     
     * @param {Disposable} value The new underlying disposable.
     */
    SingleAssignmentDisposablePrototype.setDisposable = function (value) {
        if (this.current) {
            throw new Error('Disposable has already been assigned');
        }
        var shouldDispose = this.isDisposed;
        if (!shouldDispose) {
            this.current = value;
        }
        if (shouldDispose && value) {
            value.dispose();
        }
    };

    /** 
     * Disposes the underlying disposable.
     * 
     * @memberOf SingleAssignmentDisposable#
     */
    SingleAssignmentDisposablePrototype.dispose = function () {
        var old;
        if (!this.isDisposed) {
            this.isDisposed = true;
            old = this.current;
            this.current = null;
        }
        if (old) {
            old.dispose();
        }
    };

    /**
     * Represents a disposable resource whose underlying disposable resource can be replaced by another disposable resource, causing automatic disposal of the previous underlying disposable resource.
     *
     * @constructor 
     */
    var SerialDisposable = Rx.SerialDisposable = function () {
        this.isDisposed = false;
        this.current = null;
    };

    /**
     * Gets the underlying disposable.
     * @return The underlying disposable</returns>
     */
    SerialDisposable.prototype.getDisposable = function () {
        return this.current;
    };

    /**
     * Sets the underlying disposable.
     *
     * @memberOf SerialDisposable#
     * @param {Disposable} value The new underlying disposable.
     */  
    SerialDisposable.prototype.setDisposable = function (value) {
        var shouldDispose = this.isDisposed, old;
        if (!shouldDispose) {
            old = this.current;
            this.current = value;
        }
        if (old) {
            old.dispose();
        }
        if (shouldDispose && value) {
            value.dispose();
        }
    };

    /**
     * Gets or sets the underlying disposable.
     * If the SerialDisposable has already been disposed, assignment to this property causes immediate disposal of the given disposable object. Assigning this property disposes the previous disposable object.
     * 
     * @memberOf SerialDisposable#
     * @param {Disposable} [value] The new underlying disposable.
     * @returns {Disposable} The underlying disposable.
     */    
    SerialDisposable.prototype.disposable = function (value) {
        if (!value) {
            return this.getDisposable();
        } else {
            this.setDisposable(value);
        }
    };

    /** 
     * Disposes the underlying disposable as well as all future replacements.
     * 
     * @memberOf SerialDisposable#
     */
    SerialDisposable.prototype.dispose = function () {
        var old;
        if (!this.isDisposed) {
            this.isDisposed = true;
            old = this.current;
            this.current = null;
        }
        if (old) {
            old.dispose();
        }
    };

    /**
     * Represents a disposable resource that only disposes its underlying disposable resource when all dependent disposable objects have been disposed.
     */  
    var RefCountDisposable = Rx.RefCountDisposable = (function () {

        /**
         * @constructor
         * @private
         */
        function InnerDisposable(disposable) {
            this.disposable = disposable;
            this.disposable.count++;
            this.isInnerDisposed = false;
        }

        /** @private */
        InnerDisposable.prototype.dispose = function () {
            if (!this.disposable.isDisposed) {
                if (!this.isInnerDisposed) {
                    this.isInnerDisposed = true;
                    this.disposable.count--;
                    if (this.disposable.count === 0 && this.disposable.isPrimaryDisposed) {
                        this.disposable.isDisposed = true;
                        this.disposable.underlyingDisposable.dispose();
                    }
                }
            }
        };

        /**
         * Initializes a new instance of the RefCountDisposable with the specified disposable.
         *
         * @constructor
         * @param {Disposable} disposable Underlying disposable.
          */
        function RefCountDisposable(disposable) {
            this.underlyingDisposable = disposable;
            this.isDisposed = false;
            this.isPrimaryDisposed = false;
            this.count = 0;
        }

        /** 
         * Disposes the underlying disposable only when all dependent disposables have been disposed 
         *
         * @memberOf RefCountDisposable#
         */
        RefCountDisposable.prototype.dispose = function () {
            if (!this.isDisposed) {
                if (!this.isPrimaryDisposed) {
                    this.isPrimaryDisposed = true;
                    if (this.count === 0) {
                        this.isDisposed = true;
                        this.underlyingDisposable.dispose();
                    }
                }
            }
        };

        /**
         * Returns a dependent disposable that when disposed decreases the refcount on the underlying disposable.
         *
         * @memberOf RefCountDisposable#         
         * @returns {Disposable} A dependent disposable contributing to the reference count that manages the underlying disposable's lifetime.H
         */        
        RefCountDisposable.prototype.getDisposable = function () {
            return this.isDisposed ? disposableEmpty : new InnerDisposable(this);
        };

        return RefCountDisposable;
    })();

    /**
     * @constructor
     * @private
     */
    function ScheduledDisposable(scheduler, disposable) {
        this.scheduler = scheduler, this.disposable = disposable, this.isDisposed = false;
    }

    /** 
     * @private
     * @memberOf ScheduledDisposable#
     */
    ScheduledDisposable.prototype.dispose = function () {
        var parent = this;
        this.scheduler.schedule(function () {
            if (!parent.isDisposed) {
                parent.isDisposed = true;
                parent.disposable.dispose();
            }
        });
    };

    /** 
    * @private 
    * @constructor
    */
    function ScheduledItem(scheduler, state, action, dueTime, comparer) {
        this.scheduler = scheduler;
        this.state = state;
        this.action = action;
        this.dueTime = dueTime;
        this.comparer = comparer || defaultSubComparer;
        this.disposable = new SingleAssignmentDisposable();
    }

    /** 
    * @private 
    * @memberOf ScheduledItem#
    */
    ScheduledItem.prototype.invoke = function () {
        this.disposable.disposable(this.invokeCore());
    };

    /** 
    * @private 
    * @memberOf ScheduledItem#
    */
    ScheduledItem.prototype.compareTo = function (other) {
        return this.comparer(this.dueTime, other.dueTime);
    };

    /** 
    * @private 
    * @memberOf ScheduledItem#
    */
    ScheduledItem.prototype.isCancelled = function () {
        return this.disposable.isDisposed;
    };

    /** 
    * @private 
    * @memberOf ScheduledItem#
    */
    ScheduledItem.prototype.invokeCore = function () {
        return this.action(this.scheduler, this.state);
    };

    /** Provides a set of static properties to access commonly used schedulers. */
    var Scheduler = Rx.Scheduler = (function () {

        /** 
         * @constructor 
         * @private
         */
        function Scheduler(now, schedule, scheduleRelative, scheduleAbsolute) {
            this.now = now;
            this._schedule = schedule;
            this._scheduleRelative = scheduleRelative;
            this._scheduleAbsolute = scheduleAbsolute;
        }

        function invokeRecImmediate(scheduler, pair) {
            var state = pair.first, action = pair.second, group = new CompositeDisposable(),
            recursiveAction = function (state1) {
                action(state1, function (state2) {
                    var isAdded = false, isDone = false,
                    d = scheduler.scheduleWithState(state2, function (scheduler1, state3) {
                        if (isAdded) {
                            group.remove(d);
                        } else {
                            isDone = true;
                        }
                        recursiveAction(state3);
                        return disposableEmpty;
                    });
                    if (!isDone) {
                        group.add(d);
                        isAdded = true;
                    }
                });
            };
            recursiveAction(state);
            return group;
        }

        function invokeRecDate(scheduler, pair, method) {
            var state = pair.first, action = pair.second, group = new CompositeDisposable(),
            recursiveAction = function (state1) {
                action(state1, function (state2, dueTime1) {
                    var isAdded = false, isDone = false,
                    d = scheduler[method].call(scheduler, state2, dueTime1, function (scheduler1, state3) {
                        if (isAdded) {
                            group.remove(d);
                        } else {
                            isDone = true;
                        }
                        recursiveAction(state3);
                        return disposableEmpty;
                    });
                    if (!isDone) {
                        group.add(d);
                        isAdded = true;
                    }
                });
            };
            recursiveAction(state);
            return group;
        }

        function invokeAction(scheduler, action) {
            action();
            return disposableEmpty;
        }

        var schedulerProto = Scheduler.prototype;

        /**
         * Returns a scheduler that wraps the original scheduler, adding exception handling for scheduled actions.
         * 
         * @memberOf Scheduler#         
         * @param {Function} handler Handler that's run if an exception is caught. The exception will be rethrown if the handler returns false.
         * @returns {Scheduler} Wrapper around the original scheduler, enforcing exception handling.
         */        
        schedulerProto.catchException = function (handler) {
            return new CatchScheduler(this, handler);
        };
        
        /**
         * Schedules a periodic piece of work by dynamically discovering the scheduler's capabilities. The periodic task will be scheduled using window.setInterval for the base implementation.
         * 
         * @memberOf Scheduler#         
         * @param {Number} period Period for running the work periodically.
         * @param {Function} action Action to be executed.
         * @returns {Disposable} The disposable object used to cancel the scheduled recurring action (best effort).
         */        
        schedulerProto.schedulePeriodic = function (period, action) {
            return this.schedulePeriodicWithState(null, period, function () {
                action();
            });
        };

        /**
         * Schedules a periodic piece of work by dynamically discovering the scheduler's capabilities. The periodic task will be scheduled using window.setInterval for the base implementation.
         * 
         * @memberOf Scheduler#         
         * @param {Mixed} state Initial state passed to the action upon the first iteration.
         * @param {Number} period Period for running the work periodically.
         * @param {Function} action Action to be executed, potentially updating the state.
         * @returns {Disposable} The disposable object used to cancel the scheduled recurring action (best effort).
         */
        schedulerProto.schedulePeriodicWithState = function (state, period, action) {
            var s = state, id = window.setInterval(function () {
                s = action(s);
            }, period);
            return disposableCreate(function () {
                window.clearInterval(id);
            });
        };

        /**
         * Schedules an action to be executed.
         * 
         * @memberOf Scheduler#         
         * @param {Function} action Action to execute.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        schedulerProto.schedule = function (action) {
            return this._schedule(action, invokeAction);
        };

        /**
         * Schedules an action to be executed.
         * 
         * @memberOf Scheduler#         
         * @param state State passed to the action to be executed.
         * @param {Function} action Action to be executed.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        schedulerProto.scheduleWithState = function (state, action) {
            return this._schedule(state, action);
        };

        /**
         * Schedules an action to be executed after the specified relative due time.
         * 
         * @memberOf Scheduler#         
         * @param {Function} action Action to execute.
         * @param {Number}dueTime Relative time after which to execute the action.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        schedulerProto.scheduleWithRelative = function (dueTime, action) {
            return this._scheduleRelative(action, dueTime, invokeAction);
        };

        /**
         * Schedules an action to be executed after dueTime.
         * 
         * @memberOf Scheduler#         
         * @param state State passed to the action to be executed.
         * @param {Function} action Action to be executed.
         * @param {Number}dueTime Relative time after which to execute the action.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        schedulerProto.scheduleWithRelativeAndState = function (state, dueTime, action) {
            return this._scheduleRelative(state, dueTime, action);
        };

        /**
         * Schedules an action to be executed at the specified absolute due time.
         * 
         * @memberOf Scheduler#         
         * @param {Function} action Action to execute.
         * @param {Number}dueTime Absolute time at which to execute the action.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
          */
        schedulerProto.scheduleWithAbsolute = function (dueTime, action) {
            return this._scheduleAbsolute(action, dueTime, invokeAction);
        };

        /**
         * Schedules an action to be executed at dueTime.
         * 
         * @memberOf Scheduler#         
         * @param {Mixed} state State passed to the action to be executed.
         * @param {Function} action Action to be executed.
         * @param {Number}dueTime Absolute time at which to execute the action.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        schedulerProto.scheduleWithAbsoluteAndState = function (state, dueTime, action) {
            return this._scheduleAbsolute(state, dueTime, action);
        };

        /**
         * Schedules an action to be executed recursively.
         * 
         * @memberOf Scheduler#
         * @param {Function} action Action to execute recursively. The parameter passed to the action is used to trigger recursive scheduling of the action.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        schedulerProto.scheduleRecursive = function (action) {
            return this.scheduleRecursiveWithState(action, function (_action, self) {
                _action(function () {
                    self(_action);
                });
            });
        };

        /**
         * Schedules an action to be executed recursively.
         * 
         * @memberOf Scheduler#        
         * @param {Mixed} state State passed to the action to be executed.
         * @param {Function} action Action to execute recursively. The last parameter passed to the action is used to trigger recursive scheduling of the action, passing in recursive invocation state.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        schedulerProto.scheduleRecursiveWithState = function (state, action) {
            return this.scheduleWithState({ first: state, second: action }, function (s, p) {
                return invokeRecImmediate(s, p);
            });
        };

        /**
         * Schedules an action to be executed recursively after a specified relative due time.
         * 
         * @memberOf Scheduler         
         * @param {Function} action Action to execute recursively. The parameter passed to the action is used to trigger recursive scheduling of the action at the specified relative time.
         * @param {Number}dueTime Relative time after which to execute the action for the first time.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        schedulerProto.scheduleRecursiveWithRelative = function (dueTime, action) {
            return this.scheduleRecursiveWithRelativeAndState(action, dueTime, function (_action, self) {
                _action(function (dt) {
                    self(_action, dt);
                });
            });
        };

        /**
         * Schedules an action to be executed recursively after a specified relative due time.
         * 
         * @memberOf Scheduler         
         * @param {Mixed} state State passed to the action to be executed.
         * @param {Function} action Action to execute recursively. The last parameter passed to the action is used to trigger recursive scheduling of the action, passing in the recursive due time and invocation state.
         * @param {Number}dueTime Relative time after which to execute the action for the first time.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        schedulerProto.scheduleRecursiveWithRelativeAndState = function (state, dueTime, action) {
            return this._scheduleRelative({ first: state, second: action }, dueTime, function (s, p) {
                return invokeRecDate(s, p, 'scheduleWithRelativeAndState');
            });
        };

        /**
         * Schedules an action to be executed recursively at a specified absolute due time.
         * 
         * @memberOf Scheduler         
         * @param {Function} action Action to execute recursively. The parameter passed to the action is used to trigger recursive scheduling of the action at the specified absolute time.
         * @param {Number}dueTime Absolute time at which to execute the action for the first time.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        schedulerProto.scheduleRecursiveWithAbsolute = function (dueTime, action) {
            return this.scheduleRecursiveWithAbsoluteAndState(action, dueTime, function (_action, self) {
                _action(function (dt) {
                    self(_action, dt);
                });
            });
        };

        /**
         * Schedules an action to be executed recursively at a specified absolute due time.
         * 
         * @memberOf Scheduler         
         * @param {Mixed} state State passed to the action to be executed.
         * @param {Function} action Action to execute recursively. The last parameter passed to the action is used to trigger recursive scheduling of the action, passing in the recursive due time and invocation state.
         * @param {Number}dueTime Absolute time at which to execute the action for the first time.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        schedulerProto.scheduleRecursiveWithAbsoluteAndState = function (state, dueTime, action) {
            return this._scheduleAbsolute({ first: state, second: action }, dueTime, function (s, p) {
                return invokeRecDate(s, p, 'scheduleWithAbsoluteAndState');
            });
        };

        /** Gets the current time according to the local machine's system clock. */
        Scheduler.now = defaultNow;

        /**
         * Normalizes the specified TimeSpan value to a positive value.
         * 
         * @static
         * @memberOf Scheduler
         * @param {Number} timeSpan The time span value to normalize.
         * @returns {Number} The specified TimeSpan value if it is zero or positive; otherwise, 0
         */   
        Scheduler.normalize = function (timeSpan) {
            if (timeSpan < 0) {
                timeSpan = 0;
            }
            return timeSpan;
        };

        return Scheduler;
    }());
    
    var schedulerNoBlockError = 'Scheduler is not allowed to block the thread';

    /**
     * Gets a scheduler that schedules work immediately on the current thread.
     * 
     * @memberOf Scheduler
     */    
    var immediateScheduler = Scheduler.immediate = (function () {

        function scheduleNow(state, action) {
            return action(this, state);
        }

        function scheduleRelative(state, dueTime, action) {
            if (dueTime > 0) throw new Error(schedulerNoBlockError);
            return action(this, state);
        }

        function scheduleAbsolute(state, dueTime, action) {
            return this.scheduleWithRelativeAndState(state, dueTime - this.now(), action);
        }

        return new Scheduler(defaultNow, scheduleNow, scheduleRelative, scheduleAbsolute);
    }());

    /** 
     * Gets a scheduler that schedules work as soon as possible on the current thread.
     */
    var currentThreadScheduler = Scheduler.currentThread = (function () {
        var queue;

        /** 
         * @private 
         * @constructor
         */
        function Trampoline() {
            queue = new PriorityQueue(4);
        }

        /** 
        * @private 
        * @memberOf Trampoline
        */
        Trampoline.prototype.dispose = function () {
            queue = null;
        };

        /** 
        * @private 
        * @memberOf Trampoline
        */
        Trampoline.prototype.run = function () {
            var item;
            while (queue.length > 0) {
                item = queue.dequeue();
                if (!item.isCancelled()) {
                    while (item.dueTime - Scheduler.now() > 0) {
                    }
                    if (!item.isCancelled()) {
                        item.invoke();
                    }
                }
            }
        };

        function scheduleNow(state, action) {
            return this.scheduleWithRelativeAndState(state, 0, action);
        }

        function scheduleRelative(state, dueTime, action) {
            var dt = this.now() + Scheduler.normalize(dueTime),
                    si = new ScheduledItem(this, state, action, dt),
                    t;
            if (!queue) {
                t = new Trampoline();
                try {
                    queue.enqueue(si);
                    t.run();
                } catch (e) { 
                    throw e;
                } finally {
                    t.dispose();
                }
            } else {
                queue.enqueue(si);
            }
            return si.disposable;
        }

        function scheduleAbsolute(state, dueTime, action) {
            return this.scheduleWithRelativeAndState(state, dueTime - this.now(), action);
        }

        var currentScheduler = new Scheduler(defaultNow, scheduleNow, scheduleRelative, scheduleAbsolute);
        currentScheduler.scheduleRequired = function () { return queue === null; };
        currentScheduler.ensureTrampoline = function (action) {
            if (queue === null) {
                return this.schedule(action);
            } else {
                return action();
            }
        };

        return currentScheduler;
    }());

    /**
     * @private
     */
    var SchedulePeriodicRecursive = (function () {
        function tick(command, recurse) {
            recurse(0, this._period);
            try {
                this._state = this._action(this._state);
            } catch (e) {
                this._cancel.dispose();
                throw e;
            }
        }

        /**
         * @constructor
         * @private
         */
        function SchedulePeriodicRecursive(scheduler, state, period, action) {
            this._scheduler = scheduler;
            this._state = state;
            this._period = period;
            this._action = action;
        }

        SchedulePeriodicRecursive.prototype.start = function () {
            var d = new SingleAssignmentDisposable();
            this._cancel = d;
            d.setDisposable(this._scheduler.scheduleRecursiveWithRelativeAndState(0, this._period, tick.bind(this)));

            return d;
        };

        return SchedulePeriodicRecursive;
    }());

    /** Provides a set of extension methods for virtual time scheduling. */
    Rx.VirtualTimeScheduler = (function (_super) {

        function localNow() {
            return this.toDateTimeOffset(this.clock);
        }

        function scheduleNow(state, action) {
            return this.scheduleAbsoluteWithState(state, this.clock, action);
        }

        function scheduleRelative(state, dueTime, action) {
            return this.scheduleRelativeWithState(state, this.toRelative(dueTime), action);
        }

        function scheduleAbsolute(state, dueTime, action) {
            return this.scheduleRelativeWithState(state, this.toRelative(dueTime - this.now()), action);
        }

        function invokeAction(scheduler, action) {
            action();
            return disposableEmpty;
        }

        inherits(VirtualTimeScheduler, _super);

        /**
         * Creates a new virtual time scheduler with the specified initial clock value and absolute time comparer.
         *
         * @constructor
         * @param {Number} initialClock Initial value for the clock.
         * @param {Function} comparer Comparer to determine causality of events based on absolute time.
         */
        function VirtualTimeScheduler(initialClock, comparer) {
            this.clock = initialClock;
            this.comparer = comparer;
            this.isEnabled = false;
            this.queue = new PriorityQueue(1024);
            _super.call(this, localNow, scheduleNow, scheduleRelative, scheduleAbsolute);
        }

        var VirtualTimeSchedulerPrototype = VirtualTimeScheduler.prototype;

        /**
         * Schedules a periodic piece of work by dynamically discovering the scheduler's capabilities. The periodic task will be emulated using recursive scheduling.
         * 
         * @memberOf VirtualTimeScheduler#         
         * @param {Mixed} state Initial state passed to the action upon the first iteration.
         * @param {Number} period Period for running the work periodically.
         * @param {Function} action Action to be executed, potentially updating the state.
         * @returns {Disposable} The disposable object used to cancel the scheduled recurring action (best effort).
         */      
        VirtualTimeSchedulerPrototype.schedulePeriodicWithState = function (state, period, action) {
            var s = new SchedulePeriodicRecursive(this, state, period, action);
            return s.start();
        };

        /**
         * Schedules an action to be executed after dueTime.
         * 
         * @memberOf VirtualTimeScheduler#
         * @param {Mixed} state State passed to the action to be executed.
         * @param {Number} dueTime Relative time after which to execute the action.
         * @param {Function} action Action to be executed.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */            
        VirtualTimeSchedulerPrototype.scheduleRelativeWithState = function (state, dueTime, action) {
            var runAt = this.add(this.clock, dueTime);
            return this.scheduleAbsoluteWithState(state, runAt, action);
        };

        /**
         * Schedules an action to be executed at dueTime.
         * 
         * @memberOf VirtualTimeScheduler#         
         * @param {Number} dueTime Relative time after which to execute the action.
         * @param {Function} action Action to be executed.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */          
        VirtualTimeSchedulerPrototype.scheduleRelative = function (dueTime, action) {
            return this.scheduleRelativeWithState(action, dueTime, invokeAction);
        };    

        /** 
         * Starts the virtual time scheduler. 
         * 
         * @memberOf VirtualTimeScheduler#
         */
        VirtualTimeSchedulerPrototype.start = function () {
            var next;
            if (!this.isEnabled) {
                this.isEnabled = true;
                do {
                    next = this.getNext();
                    if (next !== null) {
                        if (this.comparer(next.dueTime, this.clock) > 0) {
                            this.clock = next.dueTime;
                        }
                        next.invoke();
                    } else {
                        this.isEnabled = false;
                    }
                } while (this.isEnabled);
            }
        };

        /** 
         * Stops the virtual time scheduler. 
         * 
         * @memberOf VirtualTimeScheduler#   
         */
        VirtualTimeSchedulerPrototype.stop = function () {
            this.isEnabled = false;
        };

        /**
         * Advances the scheduler's clock to the specified time, running all work till that point.
         *
         * @param {Number} time Absolute time to advance the scheduler's clock to.
         */
        VirtualTimeSchedulerPrototype.advanceTo = function (time) {
            var next;
            var dueToClock = this.comparer(this.clock, time);
            if (this.comparer(this.clock, time) > 0) {
                throw new Error(argumentOutOfRange);
            }
            if (dueToClock === 0) {
                return;
            }
            if (!this.isEnabled) {
                this.isEnabled = true;
                do {
                    next = this.getNext();
                    if (next !== null && this.comparer(next.dueTime, time) <= 0) {
                        if (this.comparer(next.dueTime, this.clock) > 0) {
                            this.clock = next.dueTime;
                        }
                        next.invoke();
                    } else {
                        this.isEnabled = false;
                    }
                } while (this.isEnabled);
                this.clock = time;
            }
        };

        /**
         * Advances the scheduler's clock by the specified relative time, running all work scheduled for that timespan.
         *
         * @memberOf VirtualTimeScheduler#
         * @param {Number} time Relative time to advance the scheduler's clock by.
         */
        VirtualTimeSchedulerPrototype.advanceBy = function (time) {
            var dt = this.add(this.clock, time);
            var dueToClock = this.comparer(this.clock, dt);
            if (dueToClock > 0) {
                throw new Error(argumentOutOfRange);
            }
            if (dueToClock === 0) {
                return;
            }
            return this.advanceTo(dt);
        };        

        /**
         * Advances the scheduler's clock by the specified relative time.
         *
         * @memberOf VirtualTimeScheduler#         
         * @param {Number} time Relative time to advance the scheduler's clock by.
         */
        VirtualTimeSchedulerPrototype.sleep = function (time) {
            var dt = this.add(this.clock, time);

            if (this.comparer(this.clock, dt) >= 0) {
                throw new Error(argumentOutOfRange);
            }

            this.clock = dt;
        };

        /**
         * Gets the next scheduled item to be executed.
         *
         * @memberOf VirtualTimeScheduler#             
         * @returns {ScheduledItem} The next scheduled item.
         */          
        VirtualTimeSchedulerPrototype.getNext = function () {
            var next;
            while (this.queue.length > 0) {
                next = this.queue.peek();
                if (next.isCancelled()) {
                    this.queue.dequeue();
                } else {
                    return next;
                }
            }
            return null;
        };

        /**
         * Schedules an action to be executed at dueTime.
         *
         * @memberOf VirtualTimeScheduler#         
         * @param {Scheduler} scheduler Scheduler to execute the action on.
         * @param {Number} dueTime Absolute time at which to execute the action.
         * @param {Function} action Action to be executed.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */           
        VirtualTimeSchedulerPrototype.scheduleAbsolute = function (dueTime, action) {
            return this.scheduleAbsoluteWithState(action, dueTime, invokeAction);
        };

        /**
         * Schedules an action to be executed at dueTime.
         *
         * @memberOf VirtualTimeScheduler#
         * @param {Mixed} state State passed to the action to be executed.
         * @param {Number} dueTime Absolute time at which to execute the action.
         * @param {Function} action Action to be executed.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        VirtualTimeSchedulerPrototype.scheduleAbsoluteWithState = function (state, dueTime, action) {
            var self = this,
                run = function (scheduler, state1) {
                    self.queue.remove(si);
                    return action(scheduler, state1);
                },
                si = new ScheduledItem(self, state, run, dueTime, self.comparer);
            self.queue.enqueue(si);
            return si.disposable;
        };

        return VirtualTimeScheduler;
    }(Scheduler));

    /** Provides a virtual time scheduler that uses Date for absolute time and number for relative time. */
    Rx.HistoricalScheduler = (function (_super) {
        inherits(HistoricalScheduler, _super);

        /**
         * Creates a new historical scheduler with the specified initial clock value.
         * 
         * @constructor
         * @param {Number} initialClock Initial value for the clock.
         * @param {Function} comparer Comparer to determine causality of events based on absolute time.
         */
        function HistoricalScheduler(initialClock, comparer) {
            var clock = initialClock == null ? 0 : initialClock;
            var cmp = comparer || defaultSubComparer;
            _super.call(this, clock, cmp);
        }

        var HistoricalSchedulerProto = HistoricalScheduler.prototype;

        /**
         * Adds a relative time value to an absolute time value.
         * 
         * @memberOf HistoricalScheduler
         * @param {Number} absolute Absolute virtual time value.
         * @param {Number} relative Relative virtual time value to add.
         * @return {Number} Resulting absolute virtual time sum value.
         */
        HistoricalSchedulerProto.add = function (absolute, relative) {
            return absolute + relative;
        };

        /**
         * @private
         * @memberOf HistoricalScheduler
         */
        HistoricalSchedulerProto.toDateTimeOffset = function (absolute) {
            return new Date(absolute).getTime();
        };

        /**
         * Converts the TimeSpan value to a relative virtual time value.
         * 
         * @memberOf HistoricalScheduler         
         * @param {Number} timeSpan TimeSpan value to convert.
         * @return {Number} Corresponding relative virtual time value.
         */
        HistoricalSchedulerProto.toRelative = function (timeSpan) {
            return timeSpan;
        };

        return HistoricalScheduler;    
    }(Rx.VirtualTimeScheduler));
    
    var scheduleMethod, clearMethod = noop;
    (function () {
        function postMessageSupported () {
            // Ensure not in a worker
            if (!window.postMessage || window.importScripts) { return false; }
            var isAsync = false, 
                oldHandler = window.onmessage;
            // Test for async
            window.onmessage = function () { isAsync = true; };
            window.postMessage('','*');
            window.onmessage = oldHandler;

            return isAsync;
        }

        if (typeof window.process === 'object' && Object.prototype.toString.call(window.process) === '[object process]') {
            scheduleMethod = window.process.nextTick;
        } else if (typeof window.setImmediate === 'function') {
            scheduleMethod = window.setImmediate;
            clearMethod = window.clearImmediate;
        } else if (postMessageSupported()) {
            var MSG_PREFIX = 'ms.rx.schedule' + Math.random(),
                tasks = {},
                taskId = 0;

            function onGlobalPostMessage(event) {
                // Only if we're a match to avoid any other global events
                if (typeof event.data === 'string' && event.data.substring(0, MSG_PREFIX.length) === MSG_PREFIX) {
                    var handleId = event.data.substring(MSG_PREFIX.length),
                        action = tasks[handleId];
                    action();
                    delete tasks[handleId];
                }
            }

            if (window.addEventListener) {
                window.addEventListener('message', onGlobalPostMessage, false);
            } else {
                window.attachEvent('onmessage', onGlobalPostMessage, false);
            }

            scheduleMethod = function (action) {
                var currentId = taskId++;
                tasks[currentId] = action;
                window.postMessage(MSG_PREFIX + currentId, '*');
            };
        } else if (!!window.MessageChannel) {
            var channel = new window.MessageChannel(),
                channelTasks = {},
                channelTaskId = 0;

            channel.port1.onmessage = function (event) {
                var id = event.data,
                    action = channelTasks[id];
                action();
                delete channelTasks[id];
            };

            scheduleMethod = function (action) {
                var id = channelTaskId++;
                channelTasks[id] = action;
                channel.port2.postMessage(id);     
            };
        } else if ('document' in window && 'onreadystatechange' in window.document.createElement('script')) {
            
            scheduleMethod = function (action) {
                var scriptElement = window.document.createElement('script');
                scriptElement.onreadystatechange = function () { 
                    action();
                    scriptElement.onreadystatechange = null;
                    scriptElement.parentNode.removeChild(scriptElement);
                    scriptElement = null;  
                };
                window.document.documentElement.appendChild(scriptElement);  
            };
 
        } else {
            scheduleMethod = function (action) { return window.setTimeout(action, 0); };
            clearMethod = window.clearTimeout;
        }
    }());

    /** 
     * Gets a scheduler that schedules work via a timed callback based upon platform.
     *
     * @memberOf Scheduler
     */
    var timeoutScheduler = Scheduler.timeout = (function () {

        function scheduleNow(state, action) {
            var scheduler = this,
                disposable = new SingleAssignmentDisposable();
            var id = scheduleMethod(function () {
                if (!disposable.isDisposed) {
                    disposable.setDisposable(action(scheduler, state));
                }
            });
            return new CompositeDisposable(disposable, disposableCreate(function () {
                clearMethod(id);
            }));
        }

        function scheduleRelative(state, dueTime, action) {
            var scheduler = this,
                dt = Scheduler.normalize(dueTime);
            if (dt === 0) {
                return scheduler.scheduleWithState(state, action);
            }
            var disposable = new SingleAssignmentDisposable();
            var id = window.setTimeout(function () {
                if (!disposable.isDisposed) {
                    disposable.setDisposable(action(scheduler, state));
                }
            }, dt);
            return new CompositeDisposable(disposable, disposableCreate(function () {
                window.clearTimeout(id);
            }));
        }

        function scheduleAbsolute(state, dueTime, action) {
            return this.scheduleWithRelativeAndState(state, dueTime - this.now(), action);
        }

        return new Scheduler(defaultNow, scheduleNow, scheduleRelative, scheduleAbsolute);
    })();

    /** @private */
    var CatchScheduler = (function (_super) {

        function localNow() {
            return this._scheduler.now();
        }

        function scheduleNow(state, action) {
            return this._scheduler.scheduleWithState(state, this._wrap(action));
        }

        function scheduleRelative(state, dueTime, action) {
            return this._scheduler.scheduleWithRelativeAndState(state, dueTime, this._wrap(action));
        }

        function scheduleAbsolute(state, dueTime, action) {
            return this._scheduler.scheduleWithAbsoluteAndState(state, dueTime, this._wrap(action));
        }

        inherits(CatchScheduler, _super);

        /** @private */
        function CatchScheduler(scheduler, handler) {
            this._scheduler = scheduler;
            this._handler = handler;
            this._recursiveOriginal = null;
            this._recursiveWrapper = null;
            _super.call(this, localNow, scheduleNow, scheduleRelative, scheduleAbsolute);
        }

        /** @private */
        CatchScheduler.prototype._clone = function (scheduler) {
            return new CatchScheduler(scheduler, this._handler);
        };

        /** @private */
        CatchScheduler.prototype._wrap = function (action) {
            var parent = this;
            return function (self, state) {
                try {
                    return action(parent._getRecursiveWrapper(self), state);
                } catch (e) {
                    if (!parent._handler(e)) { throw e; }
                    return disposableEmpty;
                }
            };
        };

        /** @private */
        CatchScheduler.prototype._getRecursiveWrapper = function (scheduler) {
            if (this._recursiveOriginal !== scheduler) {
                this._recursiveOriginal = scheduler;
                var wrapper = this._clone(scheduler);
                wrapper._recursiveOriginal = scheduler;
                wrapper._recursiveWrapper = wrapper;
                this._recursiveWrapper = wrapper;
            }
            return this._recursiveWrapper;
        };

        /** @private */
        CatchScheduler.prototype.schedulePeriodicWithState = function (state, period, action) {
            var self = this, failed = false, d = new SingleAssignmentDisposable();

            d.setDisposable(this._scheduler.schedulePeriodicWithState(state, period, function (state1) {
                if (failed) { return null; }
                try {
                    return action(state1);
                } catch (e) {
                    failed = true;
                    if (!self._handler(e)) { throw e; }
                    d.dispose();
                    return null;
                }
            }));

            return d;
        };

        return CatchScheduler;
    }(Scheduler));

    /**
     *  Represents a notification to an observer.
     */
    var Notification = Rx.Notification = (function () {
        function Notification(kind, hasValue) { 
            this.hasValue = hasValue == null ? false : hasValue;
            this.kind = kind;
        }

        var NotificationPrototype = Notification.prototype;

        /**
         * Invokes the delegate corresponding to the notification or the observer's method corresponding to the notification and returns the produced result.
         * 
         * @memberOf Notification
         * @param {Any} observerOrOnNext Delegate to invoke for an OnNext notification or Observer to invoke the notification on..
         * @param {Function} onError Delegate to invoke for an OnError notification.
         * @param {Function} onCompleted Delegate to invoke for an OnCompleted notification.
         * @returns {Any} Result produced by the observation.
         */
        NotificationPrototype.accept = function (observerOrOnNext, onError, onCompleted) {
            if (arguments.length === 1 && typeof observerOrOnNext === 'object') {
                return this._acceptObservable(observerOrOnNext);
            }
            return this._accept(observerOrOnNext, onError, onCompleted);
        };

        /**
         * Returns an observable sequence with a single notification.
         * 
         * @memberOf Notification
         * @param {Scheduler} [scheduler] Scheduler to send out the notification calls on.
         * @returns {Observable} The observable sequence that surfaces the behavior of the notification upon subscription.
         */
        NotificationPrototype.toObservable = function (scheduler) {
            var notification = this;
            scheduler = scheduler || immediateScheduler;
            return new AnonymousObservable(function (observer) {
                return scheduler.schedule(function () {
                    notification._acceptObservable(observer);
                    if (notification.kind === 'N') {
                        observer.onCompleted();
                    }
                });
            });
        };

        NotificationPrototype.equals = function (other) {
            var otherString = other == null ? '' : other.toString();
            return this.toString() === otherString;
        };

        return Notification;
    })();

    /**
     * Creates an object that represents an OnNext notification to an observer.
     * 
     * @static
     * @memberOf Notification
     * @param {Any} value The value contained in the notification.
     * @returns {Notification} The OnNext notification containing the value.
     */
    var notificationCreateOnNext = Notification.createOnNext = (function () {

        function _accept (onNext) {
            return onNext(this.value);
        }

        function _acceptObservable(observer) {
            return observer.onNext(this.value);
        }

        function toString () {
            return 'OnNext(' + this.value + ')';
        }

        return function (value) {
            var notification = new Notification('N', true);
            notification.value = value;
            notification._accept = _accept.bind(notification);
            notification._acceptObservable = _acceptObservable.bind(notification);
            notification.toString = toString.bind(notification);
            return notification;
        };
    }());

    /**
     *  Creates an object that represents an OnError notification to an observer.
     *  
     * @static     s
     * @memberOf Notification
     * @param {Any} error The exception contained in the notification.
     * @returns {Notification} The OnError notification containing the exception.
     */
    var notificationCreateOnError = Notification.createOnError = (function () {

        function _accept (onNext, onError) {
            return onError(this.exception);
        }

        function _acceptObservable(observer) {
            return observer.onError(this.exception);
        }

        function toString () {
            return 'OnError(' + this.exception + ')';
        }

        return function (exception) {
            var notification = new Notification('E');
            notification.exception = exception;
            notification._accept = _accept.bind(notification);
            notification._acceptObservable = _acceptObservable.bind(notification);
            notification.toString = toString.bind(notification);
            return notification;
        };
    }());

    /**
     *  Creates an object that represents an OnCompleted notification to an observer.
     * 
     * @static
     * @memberOf Notification
     * @returns {Notification} The OnCompleted notification.
     */
    var notificationCreateOnCompleted = Notification.createOnCompleted = (function () {

        function _accept (onNext, onError, onCompleted) {
            return onCompleted();
        }

        function _acceptObservable(observer) {
            return observer.onCompleted();
        }

        function toString () {
            return 'OnCompleted()';
        }

        return function () {
            var notification = new Notification('C');
            notification._accept = _accept.bind(notification);
            notification._acceptObservable = _acceptObservable.bind(notification);
            notification.toString = toString.bind(notification);
            return notification;
        };
    }());

    /** 
     * @constructor
     * @private
     */
    var Enumerator = Rx.Internals.Enumerator = function (moveNext, getCurrent, dispose) {
        this.moveNext = moveNext;
        this.getCurrent = getCurrent;
        this.dispose = dispose;
    };

    /**
     * @static
     * @memberOf Enumerator
     * @private
     */
    var enumeratorCreate = Enumerator.create = function (moveNext, getCurrent, dispose) {
        var done = false;
        dispose || (dispose = noop);
        return new Enumerator(function () {
            if (done) {
                return false;
            }
            var result = moveNext();
            if (!result) {
                done = true;
                dispose();
            }
            return result;
        }, function () { return getCurrent(); }, function () {
            if (!done) {
                dispose();
                done = true;
            }
        });
    };
    
    /** @private */
    var Enumerable = Rx.Internals.Enumerable = (function () {

        /** 
         * @constructor
         * @private
         */
        function Enumerable(getEnumerator) {
            this.getEnumerator = getEnumerator;
        }

        /** 
         * @private
         * @memberOf Enumerable#
         */
        Enumerable.prototype.concat = function () {
            var sources = this;
            return new AnonymousObservable(function (observer) {
                var e = sources.getEnumerator(), isDisposed = false, subscription = new SerialDisposable();
                var cancelable = immediateScheduler.scheduleRecursive(function (self) {
                    var current, ex, hasNext = false;
                    if (!isDisposed) {
                        try {
                            hasNext = e.moveNext();
                            if (hasNext) {
                                current = e.getCurrent();
                            } else {
                                e.dispose();
                            }
                        } catch (exception) {
                            ex = exception;
                            e.dispose();
                        }
                    } else {
                        return;
                    }
                    if (ex) {
                        observer.onError(ex);
                        return;
                    }
                    if (!hasNext) {
                        observer.onCompleted();
                        return;
                    }
                    var d = new SingleAssignmentDisposable();
                    subscription.setDisposable(d);
                    d.setDisposable(current.subscribe(
                        observer.onNext.bind(observer),
                        observer.onError.bind(observer),
                        function () { self(); })
                    );
                });
                return new CompositeDisposable(subscription, cancelable, disposableCreate(function () {
                    isDisposed = true;
                    e.dispose();
                }));
            });
        };

        /** 
         * @private
         * @memberOf Enumerable#
         */
        Enumerable.prototype.catchException = function () {
            var sources = this;
            return new AnonymousObservable(function (observer) {
                var e = sources.getEnumerator(), isDisposed = false, lastException;
                var subscription = new SerialDisposable();
                var cancelable = immediateScheduler.scheduleRecursive(function (self) {
                    var current, ex, hasNext;
                    hasNext = false;
                    if (!isDisposed) {
                        try {
                            hasNext = e.moveNext();
                            if (hasNext) {
                                current = e.getCurrent();
                            }
                        } catch (exception) {
                            ex = exception;
                        }
                    } else {
                        return;
                    }
                    if (ex) {
                        observer.onError(ex);
                        return;
                    }
                    if (!hasNext) {
                        if (lastException) {
                            observer.onError(lastException);
                        } else {
                            observer.onCompleted();
                        }
                        return;
                    }
                    var d = new SingleAssignmentDisposable();
                    subscription.setDisposable(d);
                    d.setDisposable(current.subscribe(
                        observer.onNext.bind(observer),
                        function (exn) {
                            lastException = exn;
                            self();
                        },
                        observer.onCompleted.bind(observer)));
                });
                return new CompositeDisposable(subscription, cancelable, disposableCreate(function () {
                    isDisposed = true;
                }));
            });
        };

        return Enumerable;
    }());

    /** 
     * @static
     * @private
     * @memberOf Enumerable
     */
    var enumerableRepeat = Enumerable.repeat = function (value, repeatCount) {
        if (repeatCount === undefined) {
            repeatCount = -1;
        }
        return new Enumerable(function () {
            var current, left = repeatCount;
            return enumeratorCreate(function () {
                if (left === 0) {
                    return false;
                }
                if (left > 0) {
                    left--;
                }
                current = value;
                return true;
            }, function () { return current; });
        });
    };

    /** 
     * @static
     * @private
     * @memberOf Enumerable
     */    
    var enumerableFor = Enumerable.forEach = function (source, selector) {
        selector || (selector = identity);
        return new Enumerable(function () {
            var current, index = -1;
            return enumeratorCreate(
                function () {
                    if (++index < source.length) {
                        current = selector(source[index], index);
                        return true;
                    }
                    return false;
                },
                function () { return current; }
            );
        });
    };

    /**
     * Supports push-style iteration over an observable sequence.
     */
    var Observer = Rx.Observer = function () { };

    /**
     *  Creates a notification callback from an observer.
     *  
     * @param observer Observer object.
     * @returns The action that forwards its input notification to the underlying observer.
     */
    Observer.prototype.toNotifier = function () {
        var observer = this;
        return function (n) {
            return n.accept(observer);
        };
    };

    /**
     *  Hides the identity of an observer.

     * @returns An observer that hides the identity of the specified observer. 
     */   
    Observer.prototype.asObserver = function () {
        return new AnonymousObserver(this.onNext.bind(this), this.onError.bind(this), this.onCompleted.bind(this));
    };

    /**
     *  Checks access to the observer for grammar violations. This includes checking for multiple OnError or OnCompleted calls, as well as reentrancy in any of the observer methods.
     *  If a violation is detected, an Error is thrown from the offending observer method call.
     *  
     * @returns An observer that checks callbacks invocations against the observer grammar and, if the checks pass, forwards those to the specified observer.
     */    
    Observer.prototype.checked = function () { return new CheckedObserver(this); };

    /**
     *  Creates an observer from the specified OnNext, along with optional OnError, and OnCompleted actions.
     *  
     * @static
     * @memberOf Observer
     * @param {Function} [onNext] Observer's OnNext action implementation.
     * @param {Function} [onError] Observer's OnError action implementation.
     * @param {Function} [onCompleted] Observer's OnCompleted action implementation.
     * @returns {Observer} The observer object implemented using the given actions.
     */
    var observerCreate = Observer.create = function (onNext, onError, onCompleted) {
        onNext || (onNext = noop);
        onError || (onError = defaultError);
        onCompleted || (onCompleted = noop);
        return new AnonymousObserver(onNext, onError, onCompleted);
    };

    /**
     *  Creates an observer from a notification callback.
     *  
     * @static
     * @memberOf Observer
     * @param {Function} handler Action that handles a notification.
     * @returns The observer object that invokes the specified handler using a notification corresponding to each message it receives.
     */
    Observer.fromNotifier = function (handler) {
        return new AnonymousObserver(function (x) {
            return handler(notificationCreateOnNext(x));
        }, function (exception) {
            return handler(notificationCreateOnError(exception));
        }, function () {
            return handler(notificationCreateOnCompleted());
        });
    };
    
    /**
     * Abstract base class for implementations of the Observer class.
     * This base class enforces the grammar of observers where OnError and OnCompleted are terminal messages. 
     */
    var AbstractObserver = Rx.Internals.AbstractObserver = (function (_super) {
        inherits(AbstractObserver, _super);

        /**
         * Creates a new observer in a non-stopped state.
         *
         * @constructor
         */
        function AbstractObserver() {
            this.isStopped = false;
            _super.call(this);
        }

        /**
         * Notifies the observer of a new element in the sequence.
         *  
         * @memberOf AbstractObserver
         * @param {Any} value Next element in the sequence. 
         */
        AbstractObserver.prototype.onNext = function (value) {
            if (!this.isStopped) {
                this.next(value);
            }
        };

        /**
         * Notifies the observer that an exception has occurred.
         * 
         * @memberOf AbstractObserver
         * @param {Any} error The error that has occurred.     
         */    
        AbstractObserver.prototype.onError = function (error) {
            if (!this.isStopped) {
                this.isStopped = true;
                this.error(error);
            }
        };

        /**
         * Notifies the observer of the end of the sequence.
         */    
        AbstractObserver.prototype.onCompleted = function () {
            if (!this.isStopped) {
                this.isStopped = true;
                this.completed();
            }
        };

        /**
         * Disposes the observer, causing it to transition to the stopped state.
         */
        AbstractObserver.prototype.dispose = function () {
            this.isStopped = true;
        };

        AbstractObserver.prototype.fail = function () {
            if (!this.isStopped) {
                this.isStopped = true;
                this.error(true);
                return true;
            }

            return false;
        };

        return AbstractObserver;
    }(Observer));

    /**
     * Class to create an Observer instance from delegate-based implementations of the on* methods.
     */
    var AnonymousObserver = Rx.AnonymousObserver = (function (_super) {
        inherits(AnonymousObserver, _super);

        /**
         * Creates an observer from the specified OnNext, OnError, and OnCompleted actions.
         * 
         * @constructor
         * @param {Any} onNext Observer's OnNext action implementation.
         * @param {Any} onError Observer's OnError action implementation.
         * @param {Any} onCompleted Observer's OnCompleted action implementation.  
         */      
        function AnonymousObserver(onNext, onError, onCompleted) {
            _super.call(this);
            this._onNext = onNext;
            this._onError = onError;
            this._onCompleted = onCompleted;
        }

        /**
         * Calls the onNext action.
         * 
         * @memberOf AnonymousObserver
         * @param {Any} value Next element in the sequence.   
         */     
        AnonymousObserver.prototype.next = function (value) {
            this._onNext(value);
        };

        /**
         * Calls the onError action.
         * 
         * @memberOf AnonymousObserver
         * @param {Any{ error The error that has occurred.   
         */     
        AnonymousObserver.prototype.error = function (exception) {
            this._onError(exception);
        };

        /**
         *  Calls the onCompleted action.
         *
         * @memberOf AnonymousObserver
         */        
        AnonymousObserver.prototype.completed = function () {
            this._onCompleted();
        };

        return AnonymousObserver;
    }(AbstractObserver));

    var CheckedObserver = (function (_super) {
        inherits(CheckedObserver, _super);

        function CheckedObserver(observer) {
            _super.call(this);
            this._observer = observer;
            this._state = 0; // 0 - idle, 1 - busy, 2 - done
        }

        var CheckedObserverPrototype = CheckedObserver.prototype;

        CheckedObserverPrototype.onNext = function (value) {
            this.checkAccess();
            try {
                this._observer.onNext(value);
            } catch (e) { 
                throw e;                
            } finally {
                this._state = 0;
            }
        };

        CheckedObserverPrototype.onError = function (err) {
            this.checkAccess();
            try {
                this._observer.onError(err);
            } catch (e) { 
                throw e;                
            } finally {
                this._state = 2;
            }
        };

        CheckedObserverPrototype.onCompleted = function () {
            this.checkAccess();
            try {
                this._observer.onCompleted();
            } catch (e) { 
                throw e;                
            } finally {
                this._state = 2;
            }
        };

        CheckedObserverPrototype.checkAccess = function () {
            if (this._state === 1) { throw new Error('Re-entrancy detected'); }
            if (this._state === 2) { throw new Error('Observer completed'); }
            if (this._state === 0) { this._state = 1; }
        };

        return CheckedObserver;
    }(Observer));

    /** @private */
    var ScheduledObserver = Rx.Internals.ScheduledObserver = (function (_super) {
        inherits(ScheduledObserver, _super);

        function ScheduledObserver(scheduler, observer) {
            _super.call(this);
            this.scheduler = scheduler;
            this.observer = observer;
            this.isAcquired = false;
            this.hasFaulted = false;
            this.queue = [];
            this.disposable = new SerialDisposable();
        }

        /** @private */
        ScheduledObserver.prototype.next = function (value) {
            var self = this;
            this.queue.push(function () {
                self.observer.onNext(value);
            });
        };

        /** @private */
        ScheduledObserver.prototype.error = function (exception) {
            var self = this;
            this.queue.push(function () {
                self.observer.onError(exception);
            });
        };

        /** @private */
        ScheduledObserver.prototype.completed = function () {
            var self = this;
            this.queue.push(function () {
                self.observer.onCompleted();
            });
        };

        /** @private */
        ScheduledObserver.prototype.ensureActive = function () {
            var isOwner = false, parent = this;
            if (!this.hasFaulted && this.queue.length > 0) {
                isOwner = !this.isAcquired;
                this.isAcquired = true;
            }
            if (isOwner) {
                this.disposable.setDisposable(this.scheduler.scheduleRecursive(function (self) {
                    var work;
                    if (parent.queue.length > 0) {
                        work = parent.queue.shift();
                    } else {
                        parent.isAcquired = false;
                        return;
                    }
                    try {
                        work();
                    } catch (ex) {
                        parent.queue = [];
                        parent.hasFaulted = true;
                        throw ex;
                    }
                    self();
                }));
            }
        };

        /** @private */
        ScheduledObserver.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            this.disposable.dispose();
        };

        return ScheduledObserver;
    }(AbstractObserver));

    /** @private */
    var ObserveOnObserver = (function (_super) {
        inherits(ObserveOnObserver, _super);

        /** @private */ 
        function ObserveOnObserver() {
            _super.apply(this, arguments);
        }

        /** @private */ 
        ObserveOnObserver.prototype.next = function (value) {
            _super.prototype.next.call(this, value);
            this.ensureActive();
        };

        /** @private */ 
        ObserveOnObserver.prototype.error = function (e) {
            _super.prototype.error.call(this, e);
            this.ensureActive();
        };

        /** @private */ 
        ObserveOnObserver.prototype.completed = function () {
            _super.prototype.completed.call(this);
            this.ensureActive();
        };

        return ObserveOnObserver;
    })(ScheduledObserver);

    var observableProto;

    /**
     * Represents a push-style collection.
     */
    var Observable = Rx.Observable = (function () {

        /**
         * @constructor
         * @private
         */
        function Observable(subscribe) {
            this._subscribe = subscribe;
        }

        observableProto = Observable.prototype;

        observableProto.finalValue = function () {
            var source = this;
            return new AnonymousObservable(function (observer) {
                var hasValue = false, value;
                return source.subscribe(function (x) {
                    hasValue = true;
                    value = x;
                }, observer.onError.bind(observer), function () {
                    if (!hasValue) {
                        observer.onError(new Error(sequenceContainsNoElements));
                    } else {
                        observer.onNext(value);
                        observer.onCompleted();
                    }
                });
            });
        };

        /**
         *  Subscribes an observer to the observable sequence.
         *  
         * @example
         *  1 - source.subscribe();
         *  2 - source.subscribe(observer);
         *  3 - source.subscribe(function (x) { console.log(x); });
         *  4 - source.subscribe(function (x) { console.log(x); }, function (err) { console.log(err); });
         *  5 - source.subscribe(function (x) { console.log(x); }, function (err) { console.log(err); }, function () { console.log('done'); });
         *  @param {Mixed} [observerOrOnNext] The object that is to receive notifications or an action to invoke for each element in the observable sequence.
         *  @param {Function} [onError] Action to invoke upon exceptional termination of the observable sequence.
         *  @param {Function} [onCompleted] Action to invoke upon graceful termination of the observable sequence.
         *  @returns {Diposable} The source sequence whose subscriptions and unsubscriptions happen on the specified scheduler. 
         */
        observableProto.subscribe = observableProto.forEach = function (observerOrOnNext, onError, onCompleted) {
            var subscriber;
            if (typeof observerOrOnNext === 'object') {
                subscriber = observerOrOnNext;
            } else {
                subscriber = observerCreate(observerOrOnNext, onError, onCompleted);
            }

            return this._subscribe(subscriber);
        };

        /**
         *  Creates a list from an observable sequence.
         *  
         * @memberOf Observable
         * @returns An observable sequence containing a single element with a list containing all the elements of the source sequence.  
         */
        observableProto.toArray = function () {
            function accumulator(list, i) {
                var newList = list.slice(0);
                newList.push(i);
                return newList;
            }
            return this.scan([], accumulator).startWith([]).finalValue();
        };

        return Observable;
    })();

    /**
     * Invokes the specified function asynchronously on the specified scheduler, surfacing the result through an observable sequence.
     * 
     * @example
     * 1 - res = Rx.Observable.start(function () { console.log('hello'); });
     * 2 - res = Rx.Observable.start(function () { console.log('hello'); }, Rx.Scheduler.timeout);
     * 2 - res = Rx.Observable.start(function () { this.log('hello'); }, Rx.Scheduler.timeout, console);
     * 
     * @param {Function} func Function to run asynchronously.
     * @param {Scheduler} [scheduler]  Scheduler to run the function on. If not specified, defaults to Scheduler.timeout.
     * @param [context]  The context for the func parameter to be executed.  If not specified, defaults to undefined.
     * @returns {Observable} An observable sequence exposing the function's result value, or an exception.
     * 
     * Remarks
     * * The function is called immediately, not during the subscription of the resulting sequence.
     * * Multiple subscriptions to the resulting sequence can observe the function's result.  
     */
    Observable.start = function (func, scheduler, context) {
        return observableToAsync(func, scheduler)();
    };

    /**
     * Converts the function into an asynchronous function. Each invocation of the resulting asynchronous function causes an invocation of the original synchronous function on the specified scheduler.
     * 
     * @example
     * 1 - res = Rx.Observable.toAsync(function (x, y) { return x + y; })(4, 3);
     * 2 - res = Rx.Observable.toAsync(function (x, y) { return x + y; }, Rx.Scheduler.timeout)(4, 3);
     * 2 - res = Rx.Observable.toAsync(function (x) { this.log(x); }, Rx.Scheduler.timeout, console)('hello');
     * 
     * @param function Function to convert to an asynchronous function.
     * @param {Scheduler} [scheduler] Scheduler to run the function on. If not specified, defaults to Scheduler.timeout.
     * @param {Mixed} [context] The context for the func parameter to be executed.  If not specified, defaults to undefined.
     * @returns {Function} Asynchronous function.
     */
    var observableToAsync = Observable.toAsync = function (func, scheduler, context) {
        scheduler || (scheduler = timeoutScheduler);
        return function () {
            var args = slice.call(arguments, 0), subject = new AsyncSubject();
            scheduler.schedule(function () {
                var result;
                try {
                    result = func.apply(context, args);
                } catch (e) {
                    subject.onError(e);
                    return;
                }
                subject.onNext(result);
                subject.onCompleted();
            });
            return subject.asObservable();
        };
    };    
     /**
     *  Wraps the source sequence in order to run its observer callbacks on the specified scheduler.
     * 
     *  This only invokes observer callbacks on a scheduler. In case the subscription and/or unsubscription actions have side-effects
     *  that require to be run on a scheduler, use subscribeOn.
     *          
     *  @param {Scheduler} scheduler Scheduler to notify observers on.
     *  @returns {Observable} The source sequence whose observations happen on the specified scheduler.     
     */
    observableProto.observeOn = function (scheduler) {
        var source = this;
        return new AnonymousObservable(function (observer) {
            return source.subscribe(new ObserveOnObserver(scheduler, observer));
        });
    };

     /**
     *  Wraps the source sequence in order to run its subscription and unsubscription logic on the specified scheduler. This operation is not commonly used;
     *  see the remarks section for more information on the distinction between subscribeOn and observeOn.

     *  This only performs the side-effects of subscription and unsubscription on the specified scheduler. In order to invoke observer
     *  callbacks on a scheduler, use observeOn.

     *  @param {Scheduler} scheduler Scheduler to perform subscription and unsubscription actions on.
     *  @returns {Observable} The source sequence whose subscriptions and unsubscriptions happen on the specified scheduler.
     */
    observableProto.subscribeOn = function (scheduler) {
        var source = this;
        return new AnonymousObservable(function (observer) {
            var m = new SingleAssignmentDisposable(), d = new SerialDisposable();
            d.setDisposable(m);
            m.setDisposable(scheduler.schedule(function () {
                d.setDisposable(new ScheduledDisposable(scheduler, source.subscribe(observer)));
            }));
            return d;
        });
    };
    
    /**
     *  Creates an observable sequence from a specified subscribe method implementation.
     *  
     * @example
     *  1 - res = Rx.Observable.create(function (observer) { return function () { } );
     *  
     * @param {Function} subscribe Implementation of the resulting observable sequence's subscribe method, returning a function that will be wrapped in a Disposable.
     * @returns {Observable} The observable sequence with the specified implementation for the Subscribe method.
     */
    Observable.create = function (subscribe) {
        return new AnonymousObservable(function (o) {
            return disposableCreate(subscribe(o));
        });
    };

    /**
     *  Creates an observable sequence from a specified subscribe method implementation.
     *  
     * @example
     *  1 - res = Rx.Observable.create(function (observer) { return Rx.Disposable.empty; } );        
     * @static
     * @memberOf Observable
     * @param {Function} subscribe Implementation of the resulting observable sequence's subscribe method.
     * @returns {Observable} The observable sequence with the specified implementation for the Subscribe method.
     */
    Observable.createWithDisposable = function (subscribe) {
        return new AnonymousObservable(subscribe);
    };

    /**
     *  Returns an observable sequence that invokes the specified factory function whenever a new observer subscribes.
     *  
     * @example
     *  1 - res = Rx.Observable.defer(function () { return Rx.Observable.fromArray([1,2,3]); });    
     * @static
     * @memberOf Observable
     * @param {Function} observableFactory Observable factory function to invoke for each observer that subscribes to the resulting sequence.
     * @returns {Observable} An observable sequence whose observers trigger an invocation of the given observable factory function.
     */
    var observableDefer = Observable.defer = function (observableFactory) {
        return new AnonymousObservable(function (observer) {
            var result;
            try {
                result = observableFactory();
            } catch (e) {
                return observableThrow(e).subscribe(observer);
            }
            return result.subscribe(observer);
        });
    };

    /**
     *  Returns an empty observable sequence, using the specified scheduler to send out the single OnCompleted message.
     *  
     * @example
     *  1 - res = Rx.Observable.empty();  
     *  2 - res = Rx.Observable.empty(Rx.Scheduler.timeout);  
     * @static
     * @memberOf Observable
     * @param {Scheduler} [scheduler] Scheduler to send the termination call on.
     * @returns {Observable} An observable sequence with no elements.
     */
    var observableEmpty = Observable.empty = function (scheduler) {
        scheduler || (scheduler = immediateScheduler);
        return new AnonymousObservable(function (observer) {
            return scheduler.schedule(function () {
                observer.onCompleted();
            });
        });
    };

    /**
     *  Converts an array to an observable sequence, using an optional scheduler to enumerate the array.
     *  
     * @example
     *  1 - res = Rx.Observable.fromArray([1,2,3]);
     *  2 - res = Rx.Observable.fromArray([1,2,3], Rx.Scheduler.timeout);
     * @static
     * @memberOf Observable
     * @param {Scheduler} [scheduler] Scheduler to run the enumeration of the input sequence on.
     * @returns {Observable} The observable sequence whose elements are pulled from the given enumerable sequence.
     */
    var observableFromArray = Observable.fromArray = function (array, scheduler) {
        scheduler || (scheduler = currentThreadScheduler);
        return new AnonymousObservable(function (observer) {
            var count = 0;
            return scheduler.scheduleRecursive(function (self) {
                if (count < array.length) {
                    observer.onNext(array[count++]);
                    self();
                } else {
                    observer.onCompleted();
                }
            });
        });
    };

    /**
     *  Generates an observable sequence by running a state-driven loop producing the sequence's elements, using the specified scheduler to send out observer messages.
     *  
     * @example
     *  1 - res = Rx.Observable.generate(0, function (x) { return x < 10; }, function (x) { return x + 1; }, function (x) { return x; });
     *  2 - res = Rx.Observable.generate(0, function (x) { return x < 10; }, function (x) { return x + 1; }, function (x) { return x; }, Rx.Scheduler.timeout);
     * @static
     * @memberOf Observable
     * @param {Mixed} initialState Initial state.
     * @param {Function} condition Condition to terminate generation (upon returning false).
     * @param {Function} iterate Iteration step function.
     * @param {Function} resultSelector Selector function for results produced in the sequence.
     * @param {Scheduler} [scheduler] Scheduler on which to run the generator loop. If not provided, defaults to Scheduler.currentThread.
     * @returns {Observable} The generated sequence.
     */
    Observable.generate = function (initialState, condition, iterate, resultSelector, scheduler) {
        scheduler || (scheduler = currentThreadScheduler);
        return new AnonymousObservable(function (observer) {
            var first = true, state = initialState;
            return scheduler.scheduleRecursive(function (self) {
                var hasResult, result;
                try {
                    if (first) {
                        first = false;
                    } else {
                        state = iterate(state);
                    }
                    hasResult = condition(state);
                    if (hasResult) {
                        result = resultSelector(state);
                    }
                } catch (exception) {
                    observer.onError(exception);
                    return;
                }
                if (hasResult) {
                    observer.onNext(result);
                    self();
                } else {
                    observer.onCompleted();
                }
            });
        });
    };

    /**
     *  Returns a non-terminating observable sequence, which can be used to denote an infinite duration (e.g. when using reactive joins).
     * 
     * @static
     * @memberOf Observable
     * @returns {Observable} An observable sequence whose observers will never get called.
     */
    var observableNever = Observable.never = function () {
        return new AnonymousObservable(function () {
            return disposableEmpty;
        });
    };

    /**
     *  Generates an observable sequence of integral numbers within a specified range, using the specified scheduler to send out observer messages.
     *  
     * @example
     *  1 - res = Rx.Observable.range(0, 10);
     *  2 - res = Rx.Observable.range(0, 10, Rx.Scheduler.timeout);
     * @static
     * @memberOf Observable
     * @param {Number} start The value of the first integer in the sequence.
     * @param {Number} count The number of sequential integers to generate.
     * @param {Scheduler} [scheduler] Scheduler to run the generator loop on. If not specified, defaults to Scheduler.currentThread.
     * @returns {Observable} An observable sequence that contains a range of sequential integral numbers.
     */
    Observable.range = function (start, count, scheduler) {
        scheduler || (scheduler = currentThreadScheduler);
        return new AnonymousObservable(function (observer) {
            return scheduler.scheduleRecursiveWithState(0, function (i, self) {
                if (i < count) {
                    observer.onNext(start + i);
                    self(i + 1);
                } else {
                    observer.onCompleted();
                }
            });
        });
    };

    /**
     *  Generates an observable sequence that repeats the given element the specified number of times, using the specified scheduler to send out observer messages.
     *  
     * @example
     *  1 - res = Rx.Observable.repeat(42);
     *  2 - res = Rx.Observable.repeat(42, 4);
     *  3 - res = Rx.Observable.repeat(42, 4, Rx.Scheduler.timeout);
     *  4 - res = Rx.Observable.repeat(42, null, Rx.Scheduler.timeout);
     * @static
     * @memberOf Observable
     * @param {Mixed} value Element to repeat.
     * @param {Number} repeatCount [Optiona] Number of times to repeat the element. If not specified, repeats indefinitely.
     * @param {Scheduler} scheduler Scheduler to run the producer loop on. If not specified, defaults to Scheduler.immediate.
     * @returns {Observable} An observable sequence that repeats the given element the specified number of times.
     */
    Observable.repeat = function (value, repeatCount, scheduler) {
        scheduler || (scheduler = currentThreadScheduler);
        if (repeatCount == null) {
            repeatCount = -1;
        }
        return observableReturn(value, scheduler).repeat(repeatCount);
    };

    /**
     *  Returns an observable sequence that contains a single element, using the specified scheduler to send out observer messages.
     *  
     * @example
     *  1 - res = Rx.Observable.returnValue(42);
     *  2 - res = Rx.Observable.returnValue(42, Rx.Scheduler.timeout);
     * @static
     * @memberOf Observable
     * @param {Mixed} value Single element in the resulting observable sequence.
     * @param {Scheduler} scheduler Scheduler to send the single element on. If not specified, defaults to Scheduler.immediate.
     * @returns {Observable} An observable sequence containing the single specified element.
     */
    var observableReturn = Observable.returnValue = function (value, scheduler) {
        scheduler || (scheduler = immediateScheduler);
        return new AnonymousObservable(function (observer) {
            return scheduler.schedule(function () {
                observer.onNext(value);
                observer.onCompleted();
            });
        });
    };

    /**
     *  Returns an observable sequence that terminates with an exception, using the specified scheduler to send out the single OnError message.
     *  
     * @example
     *  1 - res = Rx.Observable.throwException(new Error('Error'));
     *  2 - res = Rx.Observable.throwException(new Error('Error'), Rx.Scheduler.timeout);
     * @static
     * @memberOf Observable
     * @param {Mixed} exception An object used for the sequence's termination.
     * @param {Scheduler} scheduler Scheduler to send the exceptional termination call on. If not specified, defaults to Scheduler.immediate.
     * @returns {Observable} The observable sequence that terminates exceptionally with the specified exception object.
     */
    var observableThrow = Observable.throwException = function (exception, scheduler) {
        scheduler || (scheduler = immediateScheduler);
        return new AnonymousObservable(function (observer) {
            return scheduler.schedule(function () {
                observer.onError(exception);
            });
        });
    };

    /**
     *  Constructs an observable sequence that depends on a resource object, whose lifetime is tied to the resulting observable sequence's lifetime.
     *  
     * @example
     *  1 - res = Rx.Observable.using(function () { return new AsyncSubject(); }, function (s) { return s; });
     * @static
     * @memberOf Observable
     * @param {Function} resourceFactory Factory function to obtain a resource object.
     * @param {Function} observableFactory Factory function to obtain an observable sequence that depends on the obtained resource.
     * @returns {Observable} An observable sequence whose lifetime controls the lifetime of the dependent resource object.
     */
    Observable.using = function (resourceFactory, observableFactory) {
        return new AnonymousObservable(function (observer) {
            var disposable = disposableEmpty, resource, source;
            try {
                resource = resourceFactory();
                if (resource) {
                    disposable = resource;
                }
                source = observableFactory(resource);
            } catch (exception) {
                return new CompositeDisposable(observableThrow(exception).subscribe(observer), disposable);
            }
            return new CompositeDisposable(source.subscribe(observer), disposable);
        });
    };                        
    
    /**
     * Propagates the observable sequence that reacts first.
     * 
     * @memberOf Observable#
     * @param {Observable} rightSource Second observable sequence.
     * @returns {Observable} {Observable} An observable sequence that surfaces either of the given sequences, whichever reacted first.
     */  
    observableProto.amb = function (rightSource) {
        var leftSource = this;
        return new AnonymousObservable(function (observer) {

            var choice,
                leftChoice = 'L', rightChoice = 'R',
                leftSubscription = new SingleAssignmentDisposable(),
                rightSubscription = new SingleAssignmentDisposable();

            function choiceL() {
                if (!choice) {
                    choice = leftChoice;
                    rightSubscription.dispose();
                }
            }

            function choiceR() {
                if (!choice) {
                    choice = rightChoice;
                    leftSubscription.dispose();
                }
            }

            leftSubscription.setDisposable(leftSource.subscribe(function (left) {
                choiceL();
                if (choice === leftChoice) {
                    observer.onNext(left);
                }
            }, function (err) {
                choiceL();
                if (choice === leftChoice) {
                    observer.onError(err);
                }
            }, function () {
                choiceL();
                if (choice === leftChoice) {
                    observer.onCompleted();
                }
            }));

            rightSubscription.setDisposable(rightSource.subscribe(function (right) {
                choiceR();
                if (choice === rightChoice) {
                    observer.onNext(right);
                }
            }, function (err) {
                choiceR();
                if (choice === rightChoice) {
                    observer.onError(err);
                }
            }, function () {
                choiceR();
                if (choice === rightChoice) {
                    observer.onCompleted();
                }
            }));

            return new CompositeDisposable(leftSubscription, rightSubscription);
        });
    };

    /**
     * Propagates the observable sequence that reacts first.
     *
     * @example
     * E.g. winner = Rx.Observable.amb(xs, ys, zs);
     * @static
     * @memberOf Observable
     * @returns {Observable} An observable sequence that surfaces any of the given sequences, whichever reacted first.
     */  
    Observable.amb = function () {
        var acc = observableNever(),
            items = argsOrArray(arguments, 0);
        function func(previous, current) {
            return previous.amb(current);
        }
        for (var i = 0, len = items.length; i < len; i++) {
            acc = func(acc, items[i]);
        }
        return acc;
    };

    function observableCatchHandler(source, handler) {
        return new AnonymousObservable(function (observer) {
            var d1 = new SingleAssignmentDisposable(), subscription = new SerialDisposable();
            subscription.setDisposable(d1);
            d1.setDisposable(source.subscribe(observer.onNext.bind(observer), function (exception) {
                var d, result;
                try {
                    result = handler(exception);
                } catch (ex) {
                    observer.onError(ex);
                    return;
                }
                d = new SingleAssignmentDisposable();
                subscription.setDisposable(d);
                d.setDisposable(result.subscribe(observer));
            }, observer.onCompleted.bind(observer)));
            return subscription;
        });
    }

    /**
     * Continues an observable sequence that is terminated by an exception with the next observable sequence.
     * @example
     * 1 - xs.catchException(ys)
     * 2 - xs.catchException(function (ex) { return ys(ex); })
     * @memberOf Observable#
     * @param {Mixed} handlerOrSecond Exception handler function that returns an observable sequence given the error that occurred in the first sequence, or a second observable sequence used to produce results when an error occurred in the first sequence.
     * @returns {Observable} An observable sequence containing the first sequence's elements, followed by the elements of the handler sequence in case an exception occurred.
     */      
    observableProto.catchException = function (handlerOrSecond) {
        if (typeof handlerOrSecond === 'function') {
            return observableCatchHandler(this, handlerOrSecond);
        }
        return observableCatch([this, handlerOrSecond]);
    };

    /**
     * Continues an observable sequence that is terminated by an exception with the next observable sequence.
     * 
     * @example
     * 1 - res = Rx.Observable.catchException(xs, ys, zs);
     * 2 - res = Rx.Observable.catchException([xs, ys, zs]);
     * @static
     * @memberOf Observable
     * @returns {Observable} An observable sequence containing elements from consecutive source sequences until a source sequence terminates successfully.
     */
    var observableCatch = Observable.catchException = function () {
        var items = argsOrArray(arguments, 0);
        return enumerableFor(items).catchException();
    };

    /**
     * Merges the specified observable sequences into one observable sequence by using the selector function whenever any of the observable sequences produces an element.
     * This can be in the form of an argument list of observables or an array.
     *
     * @example
     * 1 - obs = observable.combineLatest(obs1, obs2, obs3, function (o1, o2, o3) { return o1 + o2 + o3; });
     * 2 - obs = observable.combineLatest([obs1, obs2, obs3], function (o1, o2, o3) { return o1 + o2 + o3; });
     * @memberOf Observable#
     * @returns {Observable} An observable sequence containing the result of combining elements of the sources using the specified result selector function. 
     */
    observableProto.combineLatest = function () {
        var args = slice.call(arguments);
        if (Array.isArray(args[0])) {
            args[0].unshift(this);
        } else {
            args.unshift(this);
        }
        return combineLatest.apply(this, args);
    };

    /**
     * Merges the specified observable sequences into one observable sequence by using the selector function whenever any of the observable sequences produces an element.
     * 
     * @example
     * 1 - obs = Rx.Observable.combineLatest(obs1, obs2, obs3, function (o1, o2, o3) { return o1 + o2 + o3; });
     * 2 - obs = Rx.Observable.combineLatest([obs1, obs2, obs3], function (o1, o2, o3) { return o1 + o2 + o3; });     
     * @static
     * @memberOf Observable
     * @returns {Observable} An observable sequence containing the result of combining elements of the sources using the specified result selector function.
     */
    var combineLatest = Observable.combineLatest = function () {
        var args = slice.call(arguments), resultSelector = args.pop();
        
        if (Array.isArray(args[0])) {
            args = args[0];
        }

        return new AnonymousObservable(function (observer) {
            var falseFactory = function () { return false; },
                n = args.length,
                hasValue = arrayInitialize(n, falseFactory),
                hasValueAll = false,
                isDone = arrayInitialize(n, falseFactory),
                values = new Array(n);

            function next(i) {
                var res;
                hasValue[i] = true;
                if (hasValueAll || (hasValueAll = hasValue.every(function (x) { return x; }))) {
                    try {
                        res = resultSelector.apply(null, values);
                    } catch (ex) {
                        observer.onError(ex);
                        return;
                    }
                    observer.onNext(res);
                } else if (isDone.filter(function (x, j) { return j !== i; }).every(function (x) { return x; })) {
                    observer.onCompleted();
                }
            }

            function done (i) {
                isDone[i] = true;
                if (isDone.every(function (x) { return x; })) {
                    observer.onCompleted();
                }
            }

            var subscriptions = new Array(n);
            for (var idx = 0; idx < n; idx++) {
                (function (i) {
                    subscriptions[i] = new SingleAssignmentDisposable();
                    subscriptions[i].setDisposable(args[i].subscribe(function (x) {
                        values[i] = x;
                        next(i);
                    }, observer.onError.bind(observer), function () {
                        done(i);
                    }));
                }(idx));
            }

            return new CompositeDisposable(subscriptions);
        });
    };

    /**
     * Concatenates all the observable sequences.  This takes in either an array or variable arguments to concatenate.
     * 
     * @example
     * 1 - concatenated = xs.concat(ys, zs);
     * 2 - concatenated = xs.concat([ys, zs]);
     * @memberOf Observable#
     * @returns {Observable} An observable sequence that contains the elements of each given sequence, in sequential order. 
     */ 
    observableProto.concat = function () {
        var items = slice.call(arguments, 0);
        items.unshift(this);
        return observableConcat.apply(this, items);
    };

    /**
     * Concatenates all the observable sequences.
     * 
     * @example
     * 1 - res = Rx.Observable.concat(xs, ys, zs);
     * 2 - res = Rx.Observable.concat([xs, ys, zs]);
     * @static
     * @memberOf Observable
     * @returns {Observable} An observable sequence that contains the elements of each given sequence, in sequential order. 
     */
    var observableConcat = Observable.concat = function () {
        var sources = argsOrArray(arguments, 0);
        return enumerableFor(sources).concat();
    };    

    /**
     * Concatenates an observable sequence of observable sequences.
     * 
     * @memberOf Observable#
     * @returns {Observable} An observable sequence that contains the elements of each observed inner sequence, in sequential order. 
     */ 
    observableProto.concatObservable = observableProto.concatAll =function () {
        return this.merge(1);
    };

    /**
     * Merges an observable sequence of observable sequences into an observable sequence, limiting the number of concurrent subscriptions to inner sequences.
     * Or merges two observable sequences into a single observable sequence.
     * 
     * @example
     * 1 - merged = sources.merge(1);
     * 2 - merged = source.merge(otherSource);  
     * @memberOf Observable#
     * @param {Mixed} [maxConcurrentOrOther] Maximum number of inner observable sequences being subscribed to concurrently or the second observable sequence.
     * @returns {Observable} The observable sequence that merges the elements of the inner sequences. 
     */ 
    observableProto.merge = function (maxConcurrentOrOther) {
        if (typeof maxConcurrentOrOther !== 'number') {
            return observableMerge(this, maxConcurrentOrOther);
        }
        var sources = this;
        return new AnonymousObservable(function (observer) {
            var activeCount = 0,
                group = new CompositeDisposable(),
                isStopped = false,
                q = [],
                subscribe = function (xs) {
                    var subscription = new SingleAssignmentDisposable();
                    group.add(subscription);
                    subscription.setDisposable(xs.subscribe(observer.onNext.bind(observer), observer.onError.bind(observer), function () {
                        var s;
                        group.remove(subscription);
                        if (q.length > 0) {
                            s = q.shift();
                            subscribe(s);
                        } else {
                            activeCount--;
                            if (isStopped && activeCount === 0) {
                                observer.onCompleted();
                            }
                        }
                    }));
                };
            group.add(sources.subscribe(function (innerSource) {
                if (activeCount < maxConcurrentOrOther) {
                    activeCount++;
                    subscribe(innerSource);
                } else {
                    q.push(innerSource);
                }
            }, observer.onError.bind(observer), function () {
                isStopped = true;
                if (activeCount === 0) {
                    observer.onCompleted();
                }
            }));
            return group;
        });
    };

    /**
     * Merges all the observable sequences into a single observable sequence.  
     * The scheduler is optional and if not specified, the immediate scheduler is used.
     * 
     * @example
     * 1 - merged = Rx.Observable.merge(xs, ys, zs);
     * 2 - merged = Rx.Observable.merge([xs, ys, zs]);
     * 3 - merged = Rx.Observable.merge(scheduler, xs, ys, zs);
     * 4 - merged = Rx.Observable.merge(scheduler, [xs, ys, zs]);    
     * 
     * @static
     * @memberOf Observable
     * @returns {Observable} The observable sequence that merges the elements of the observable sequences. 
     */  
    var observableMerge = Observable.merge = function () {
        var scheduler, sources;
        if (!arguments[0]) {
            scheduler = immediateScheduler;
            sources = slice.call(arguments, 1);
        } else if (arguments[0].now) {
            scheduler = arguments[0];
            sources = slice.call(arguments, 1);
        } else {
            scheduler = immediateScheduler;
            sources = slice.call(arguments, 0);
        }
        if (Array.isArray(sources[0])) {
            sources = sources[0];
        }
        return observableFromArray(sources, scheduler).mergeObservable();
    };    

    /**
     * Merges an observable sequence of observable sequences into an observable sequence.
     * 
     * @memberOf Observable#
     * @returns {Observable} The observable sequence that merges the elements of the inner sequences.   
     */  
    observableProto.mergeObservable = observableProto.mergeAll =function () {
        var sources = this;
        return new AnonymousObservable(function (observer) {
            var group = new CompositeDisposable(),
                isStopped = false,
                m = new SingleAssignmentDisposable();
            group.add(m);
            m.setDisposable(sources.subscribe(function (innerSource) {
                var innerSubscription = new SingleAssignmentDisposable();
                group.add(innerSubscription);
                innerSubscription.setDisposable(innerSource.subscribe(function (x) {
                    observer.onNext(x);
                }, observer.onError.bind(observer), function () {
                    group.remove(innerSubscription);
                    if (isStopped && group.length === 1) {
                        observer.onCompleted();
                    }
                }));
            }, observer.onError.bind(observer), function () {
                isStopped = true;
                if (group.length === 1) {
                    observer.onCompleted();
                }
            }));
            return group;
        });
    };

    /**
     * Continues an observable sequence that is terminated normally or by an exception with the next observable sequence.
     * 
     * @memberOf Observable
     * @param {Observable} second Second observable sequence used to produce results after the first sequence terminates.
     * @returns {Observable} An observable sequence that concatenates the first and second sequence, even if the first sequence terminates exceptionally.
     */
    observableProto.onErrorResumeNext = function (second) {
        if (!second) {
            throw new Error('Second observable is required');
        }
        return onErrorResumeNext([this, second]);
    };

    /**
     * Continues an observable sequence that is terminated normally or by an exception with the next observable sequence.
     * 
     * @example
     * 1 - res = Rx.Observable.onErrorResumeNext(xs, ys, zs);
     * 1 - res = Rx.Observable.onErrorResumeNext([xs, ys, zs]);
     * @static
     * @memberOf Observable
     * @returns {Observable} An observable sequence that concatenates the source sequences, even if a sequence terminates exceptionally.   
     */
    var onErrorResumeNext = Observable.onErrorResumeNext = function () {
        var sources = argsOrArray(arguments, 0);
        return new AnonymousObservable(function (observer) {
            var pos = 0, subscription = new SerialDisposable(),
            cancelable = immediateScheduler.scheduleRecursive(function (self) {
                var current, d;
                if (pos < sources.length) {
                    current = sources[pos++];
                    d = new SingleAssignmentDisposable();
                    subscription.setDisposable(d);
                    d.setDisposable(current.subscribe(observer.onNext.bind(observer), function () {
                        self();
                    }, function () {
                        self();
                    }));
                } else {
                    observer.onCompleted();
                }
            });
            return new CompositeDisposable(subscription, cancelable);
        });
    };

    /**
     * Returns the values from the source observable sequence only after the other observable sequence produces a value.
     * 
     * @memberOf Observable#
     * @param {Observable} other The observable sequence that triggers propagation of elements of the source sequence.
     * @returns {Observable} An observable sequence containing the elements of the source sequence starting from the point the other sequence triggered propagation.    
     */
    observableProto.skipUntil = function (other) {
        var source = this;
        return new AnonymousObservable(function (observer) {
            var isOpen = false;
            var disposables = new CompositeDisposable(source.subscribe(function (left) {
                if (isOpen) {
                    observer.onNext(left);
                }
            }, observer.onError.bind(observer), function () {
                if (isOpen) {
                    observer.onCompleted();
                }
            }));

            var rightSubscription = new SingleAssignmentDisposable();
            disposables.add(rightSubscription);
            rightSubscription.setDisposable(other.subscribe(function () {
                isOpen = true;
                rightSubscription.dispose();
            }, observer.onError.bind(observer), function () {
                rightSubscription.dispose();
            }));

            return disposables;
        });
    };

    /**
     * Transforms an observable sequence of observable sequences into an observable sequence producing values only from the most recent observable sequence.
     * 
     * @memberOf Observable#
     * @returns {Observable} The observable sequence that at any point in time produces the elements of the most recent inner observable sequence that has been received.  
     */
    observableProto.switchLatest = function () {
        var sources = this;
        return new AnonymousObservable(function (observer) {
            var hasLatest = false,
                innerSubscription = new SerialDisposable(),
                isStopped = false,
                latest = 0,
                subscription = sources.subscribe(function (innerSource) {
                    var d = new SingleAssignmentDisposable(), id = ++latest;
                    hasLatest = true;
                    innerSubscription.setDisposable(d);
                    d.setDisposable(innerSource.subscribe(function (x) {
                        if (latest === id) {
                            observer.onNext(x);
                        }
                    }, function (e) {
                        if (latest === id) {
                            observer.onError(e);
                        }
                    }, function () {
                        if (latest === id) {
                            hasLatest = false;
                            if (isStopped) {
                                observer.onCompleted();
                            }
                        }
                    }));
                }, observer.onError.bind(observer), function () {
                    isStopped = true;
                    if (!hasLatest) {
                        observer.onCompleted();
                    }
                });
            return new CompositeDisposable(subscription, innerSubscription);
        });
    };

    /**
     * Returns the values from the source observable sequence until the other observable sequence produces a value.
     * 
     * @memberOf Observable#
     * @param {Observable} other Observable sequence that terminates propagation of elements of the source sequence.
     * @returns {Observable} An observable sequence containing the elements of the source sequence up to the point the other sequence interrupted further propagation.   
     */
    observableProto.takeUntil = function (other) {
        var source = this;
        return new AnonymousObservable(function (observer) {
            return new CompositeDisposable(
                source.subscribe(observer),
                other.subscribe(observer.onCompleted.bind(observer), observer.onError.bind(observer), noop)
            );
        });
    };

    function zipArray(second, resultSelector) {
        var first = this;
        return new AnonymousObservable(function (observer) {
            var index = 0, len = second.length;
            return first.subscribe(function (left) {
                if (index < len) {
                    var right = second[index++], result;
                    try {
                        result = resultSelector(left, right);
                    } catch (e) {
                        observer.onError(e);
                        return;
                    }
                    observer.onNext(result);
                } else {
                    observer.onCompleted();
                }
            }, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    }    

    /**
     * Merges the specified observable sequences into one observable sequence by using the selector function whenever all of the observable sequences or an array have produced an element at a corresponding index.
     * The last element in the arguments must be a function to invoke for each series of elements at corresponding indexes in the sources.
     *
     * @example
     * 1 - res = obs1.zip(obs2, fn);
     * 1 - res = x1.zip([1,2,3], fn);  
     * @memberOf Observable#
     * @returns {Observable} An observable sequence containing the result of combining elements of the sources using the specified result selector function. 
     */   
    observableProto.zip = function () {
        if (Array.isArray(arguments[0])) {
            return zipArray.apply(this, arguments);
        }
        var parent = this, sources = slice.call(arguments), resultSelector = sources.pop();
        sources.unshift(parent);
        return new AnonymousObservable(function (observer) {
            var n = sources.length,
              queues = arrayInitialize(n, function () { return []; }),
              isDone = arrayInitialize(n, function () { return false; });
            var next = function (i) {
                var res, queuedValues;
                if (queues.every(function (x) { return x.length > 0; })) {
                    try {
                        queuedValues = queues.map(function (x) { return x.shift(); });
                        res = resultSelector.apply(parent, queuedValues);
                    } catch (ex) {
                        observer.onError(ex);
                        return;
                    }
                    observer.onNext(res);
                } else if (isDone.filter(function (x, j) { return j !== i; }).every(function (x) { return x; })) {
                    observer.onCompleted();
                }
            };

            function done(i) {
                isDone[i] = true;
                if (isDone.every(function (x) { return x; })) {
                    observer.onCompleted();
                }
            }

            var subscriptions = new Array(n);
            for (var idx = 0; idx < n; idx++) {
                (function (i) {
                    subscriptions[i] = new SingleAssignmentDisposable();
                    subscriptions[i].setDisposable(sources[i].subscribe(function (x) {
                        queues[i].push(x);
                        next(i);
                    }, observer.onError.bind(observer), function () {
                        done(i);
                    }));
                })(idx);
            }

            return new CompositeDisposable(subscriptions);
        });
    };

    /**
     * Merges the specified observable sequences into one observable sequence by using the selector function whenever all of the observable sequences have produced an element at a corresponding index.
     * 
     * @static
     * @memberOf Observable
     * @param {Array} sources Observable sources.
     * @param {Function} resultSelector Function to invoke for each series of elements at corresponding indexes in the sources.
     * @returns {Observable} An observable sequence containing the result of combining elements of the sources using the specified result selector function.
     */
    Observable.zip = function (sources, resultSelector) {
        var first = sources[0],
            rest = sources.slice(1);
        rest.push(resultSelector);
        return first.zip.apply(first, rest);
    };


    /**
     *  Hides the identity of an observable sequence.
     *  
     * @returns {Observable} An observable sequence that hides the identity of the source sequence.    
     */
    observableProto.asObservable = function () {
        var source = this;
        return new AnonymousObservable(function (observer) {
            return source.subscribe(observer);
        });
    };

    /**
     *  Projects each element of an observable sequence into zero or more buffers which are produced based on element count information.
     *  
     * @example
     *  1 - xs.bufferWithCount(10);
     *  2 - xs.bufferWithCount(10, 1);
     *  
     * @memberOf Observable#
     * @param {Number} count Length of each buffer.
     * @param {Number} [skip] Number of elements to skip between creation of consecutive buffers. If not provided, defaults to the count.
     * @returns {Observable} An observable sequence of buffers.    
     */
    observableProto.bufferWithCount = function (count, skip) {
        if (skip === undefined) {
            skip = count;
        }
        return this.windowWithCount(count, skip).selectMany(function (x) {
            return x.toArray();
        }).where(function (x) {
            return x.length > 0;
        });
    };

    /**
     *  Dematerializes the explicit notification values of an observable sequence as implicit notifications.
     *  
     * @memberOf Observable# 
     * @returns {Observable} An observable sequence exhibiting the behavior corresponding to the source sequence's notification values.
     */ 
    observableProto.dematerialize = function () {
        var source = this;
        return new AnonymousObservable(function (observer) {
            return source.subscribe(function (x) {
                return x.accept(observer);
            }, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    };

    /**
     *  Returns an observable sequence that contains only distinct contiguous elements according to the keySelector and the comparer.
     *  
     *  1 - var obs = observable.distinctUntilChanged();
     *  2 - var obs = observable.distinctUntilChanged(function (x) { return x.id; });
     *  3 - var obs = observable.distinctUntilChanged(function (x) { return x.id; }, function (x, y) { return x === y; });
     *  
     * @memberOf Observable#
     * @param {Function} [keySelector] A function to compute the comparison key for each element. If not provided, it projects the value.
     * @param {Function} [comparer] Equality comparer for computed key values. If not provided, defaults to an equality comparer function.
     * @returns {Observable} An observable sequence only containing the distinct contiguous elements, based on a computed key value, from the source sequence.   
     */
    observableProto.distinctUntilChanged = function (keySelector, comparer) {
        var source = this;
        keySelector || (keySelector = identity);
        comparer || (comparer = defaultComparer);
        return new AnonymousObservable(function (observer) {
            var hasCurrentKey = false, currentKey;
            return source.subscribe(function (value) {
                var comparerEquals = false, key;
                try {
                    key = keySelector(value);
                } catch (exception) {
                    observer.onError(exception);
                    return;
                }
                if (hasCurrentKey) {
                    try {
                        comparerEquals = comparer(currentKey, key);
                    } catch (exception) {
                        observer.onError(exception);
                        return;
                    }
                }
                if (!hasCurrentKey || !comparerEquals) {
                    hasCurrentKey = true;
                    currentKey = key;
                    observer.onNext(value);
                }
            }, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    };

    /**
     *  Invokes an action for each element in the observable sequence and invokes an action upon graceful or exceptional termination of the observable sequence.
     *  This method can be used for debugging, logging, etc. of query behavior by intercepting the message stream to run arbitrary actions for messages on the pipeline.
     *  
     * @example
     *  1 - observable.doAction(observer);
     *  2 - observable.doAction(onNext);
     *  3 - observable.doAction(onNext, onError);
     *  4 - observable.doAction(onNext, onError, onCompleted);
     *  
     * @memberOf Observable#
     * @param {Mixed} observerOrOnNext Action to invoke for each element in the observable sequence or an observer.
     * @param {Function} [onError]  Action to invoke upon exceptional termination of the observable sequence. Used if only the observerOrOnNext parameter is also a function.
     * @param {Function} [onCompleted]  Action to invoke upon graceful termination of the observable sequence. Used if only the observerOrOnNext parameter is also a function.
     * @returns {Observable} The source sequence with the side-effecting behavior applied.   
     */
    observableProto.doAction = function (observerOrOnNext, onError, onCompleted) {
        var source = this, onNextFunc;
        if (typeof observerOrOnNext === 'function') {
            onNextFunc = observerOrOnNext;
        } else {
            onNextFunc = observerOrOnNext.onNext.bind(observerOrOnNext);
            onError = observerOrOnNext.onError.bind(observerOrOnNext);
            onCompleted = observerOrOnNext.onCompleted.bind(observerOrOnNext);
        }
        return new AnonymousObservable(function (observer) {
            return source.subscribe(function (x) {
                try {
                    onNextFunc(x);
                } catch (e) {
                    observer.onError(e);
                }
                observer.onNext(x);
            }, function (exception) {
                if (!onError) {
                    observer.onError(exception);
                } else {
                    try {
                        onError(exception);
                    } catch (e) {
                        observer.onError(e);
                    }
                    observer.onError(exception);
                }
            }, function () {
                if (!onCompleted) {
                    observer.onCompleted();
                } else {
                    try {
                        onCompleted();
                    } catch (e) {
                        observer.onError(e);
                    }
                    observer.onCompleted();
                }
            });
        });
    };

    /**
     *  Invokes a specified action after the source observable sequence terminates gracefully or exceptionally.
     *  
     * @example
     *  1 - obs = observable.finallyAction(function () { console.log('sequence ended'; });
     *  
     * @memberOf Observable#
     * @param {Function} finallyAction Action to invoke after the source observable sequence terminates.
     * @returns {Observable} Source sequence with the action-invoking termination behavior applied. 
     */  
    observableProto.finallyAction = function (action) {
        var source = this;
        return new AnonymousObservable(function (observer) {
            var subscription = source.subscribe(observer);
            return disposableCreate(function () {
                try {
                    subscription.dispose();
                } catch (e) { 
                    throw e;                    
                } finally {
                    action();
                }
            });
        });
    };

    /**
     *  Ignores all elements in an observable sequence leaving only the termination messages.
     *  
     * @memberOf Observable#
     * @returns {Observable} An empty observable sequence that signals termination, successful or exceptional, of the source sequence.    
     */
    observableProto.ignoreElements = function () {
        var source = this;
        return new AnonymousObservable(function (observer) {
            return source.subscribe(noop, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    };

    /**
     *  Materializes the implicit notifications of an observable sequence as explicit notification values.
     *  
     * @memberOf Observable#
     * @returns {Observable} An observable sequence containing the materialized notification values from the source sequence.
     */    
    observableProto.materialize = function () {
        var source = this;
        return new AnonymousObservable(function (observer) {
            return source.subscribe(function (value) {
                observer.onNext(notificationCreateOnNext(value));
            }, function (exception) {
                observer.onNext(notificationCreateOnError(exception));
                observer.onCompleted();
            }, function () {
                observer.onNext(notificationCreateOnCompleted());
                observer.onCompleted();
            });
        });
    };

    /**
     *  Repeats the observable sequence a specified number of times. If the repeat count is not specified, the sequence repeats indefinitely.
     *  
     * @example
     *  1 - repeated = source.repeat();
     *  2 - repeated = source.repeat(42);
     *  
     * @memberOf Observable#
     * @param {Number} [repeatCount]  Number of times to repeat the sequence. If not provided, repeats the sequence indefinitely.
     * @returns {Observable} The observable sequence producing the elements of the given sequence repeatedly.   
     */
    observableProto.repeat = function (repeatCount) {
        return enumerableRepeat(this, repeatCount).concat();
    };

    /**
     *  Repeats the source observable sequence the specified number of times or until it successfully terminates. If the retry count is not specified, it retries indefinitely.
     *  
     * @example
     *  1 - retried = retry.repeat();
     *  2 - retried = retry.repeat(42);
     *  
     * @memberOf Observable#
     * @param {Number} [retryCount]  Number of times to retry the sequence. If not provided, retry the sequence indefinitely.
     * @returns {Observable} An observable sequence producing the elements of the given sequence repeatedly until it terminates successfully. 
     */
    observableProto.retry = function (retryCount) {
        return enumerableRepeat(this, retryCount).catchException();
    };

    /**
     *  Applies an accumulator function over an observable sequence and returns each intermediate result. The optional seed value is used as the initial accumulator value.
     *  For aggregation behavior with no intermediate results, see Observable.aggregate.
     *  
     *  1 - scanned = source.scan(function (acc, x) { return acc + x; });
     *  2 - scanned = source.scan(0, function (acc, x) { return acc + x; });
     *  
     * @memberOf Observable#
     * @param {Mixed} [seed] The initial accumulator value.
     * @param {Function} accumulator An accumulator function to be invoked on each element.
     * @returns {Observable} An observable sequence containing the accumulated values.
     */
    observableProto.scan = function () {
        var seed, hasSeed = false, accumulator;
        if (arguments.length === 2) {
            seed = arguments[0];
            accumulator = arguments[1];
            hasSeed = true;
        } else {
            accumulator = arguments[0];
        }
        var source = this;
        return observableDefer(function () {
            var hasAccumulation = false, accumulation;
            return source.select(function (x) {
                if (hasAccumulation) {
                    accumulation = accumulator(accumulation, x);
                } else {
                    accumulation = hasSeed ? accumulator(seed, x) : x;
                    hasAccumulation = true;
                }
                return accumulation;
            });
        });
    };

    /**
     *  Bypasses a specified number of elements at the end of an observable sequence.
     *  
     * @memberOf Observable#
     * @description
     *  This operator accumulates a queue with a length enough to store the first <paramref name="count"/> elements. As more elements are
     *  received, elements are taken from the front of the queue and produced on the result sequence. This causes elements to be delayed.     
     * @param count Number of elements to bypass at the end of the source sequence.
     * @returns {Observable} An observable sequence containing the source sequence elements except for the bypassed ones at the end.   
     */
    observableProto.skipLast = function (count) {
        var source = this;
        return new AnonymousObservable(function (observer) {
            var q = [];
            return source.subscribe(function (x) {
                q.push(x);
                if (q.length > count) {
                    observer.onNext(q.shift());
                }
            }, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    };

    /**
     *  Prepends a sequence of values to an observable sequence with an optional scheduler and an argument list of values to prepend.
     *  
     *  1 - source.startWith(1, 2, 3);
     *  2 - source.startWith(Rx.Scheduler.timeout, 1, 2, 3);
     *  
     * @memberOf Observable#
     * @returns {Observable} The source sequence prepended with the specified values.  
     */
    observableProto.startWith = function () {
        var values, scheduler, start = 0;
        if (!!arguments.length && 'now' in Object(arguments[0])) {
            scheduler = arguments[0];
            start = 1;
        } else {
            scheduler = immediateScheduler;
        }
        values = slice.call(arguments, start);
        return enumerableFor([observableFromArray(values, scheduler), this]).concat();
    };

    /**
     *  Returns a specified number of contiguous elements from the end of an observable sequence, using an optional scheduler to drain the queue.
     *  
     * @example
     *  1 - obs = source.takeLast(5);
     *  2 - obs = source.takeLast(5, Rx.Scheduler.timeout);
     *  
     * @description
     *  This operator accumulates a buffer with a length enough to store elements count elements. Upon completion of
     *  the source sequence, this buffer is drained on the result sequence. This causes the elements to be delayed.
     *      
     * @memberOf Observable#
     * @param {Number} count Number of elements to take from the end of the source sequence.
     * @param {Scheduler} [scheduler] Scheduler used to drain the queue upon completion of the source sequence.
     * @returns {Observable} An observable sequence containing the specified number of elements from the end of the source sequence.
     */   
    observableProto.takeLast = function (count, scheduler) {
        return this.takeLastBuffer(count).selectMany(function (xs) { return observableFromArray(xs, scheduler); });
    };

    /**
     *  Returns an array with the specified number of contiguous elements from the end of an observable sequence.
     *  
     * @description
     *  This operator accumulates a buffer with a length enough to store count elements. Upon completion of the
     *  source sequence, this buffer is produced on the result sequence. 
     *      
     * @memberOf Observable#         
     * @param {Number} count Number of elements to take from the end of the source sequence.
     * @returns {Observable} An observable sequence containing a single array with the specified number of elements from the end of the source sequence.
     */
    observableProto.takeLastBuffer = function (count) {
        var source = this;
        return new AnonymousObservable(function (observer) {
            var q = [];
            return source.subscribe(function (x) {
                q.push(x);
                if (q.length > count) {
                    q.shift();
                }
            }, observer.onError.bind(observer), function () {
                observer.onNext(q);
                observer.onCompleted();
            });
        });
    };

    /**
     *  Projects each element of an observable sequence into zero or more windows which are produced based on element count information.
     *  
     *  1 - xs.windowWithCount(10);
     *  2 - xs.windowWithCount(10, 1);
     *      
     * @memberOf Observable#
     * @param {Number} count Length of each window.
     * @param {Number} [skip] Number of elements to skip between creation of consecutive windows. If not specified, defaults to the count.
     * @returns {Observable} An observable sequence of windows.  
     */
    observableProto.windowWithCount = function (count, skip) {
        var source = this;
        if (count <= 0) {
            throw new Error(argumentOutOfRange);
        }
        if (skip == null) {
            skip = count;
        }
        if (skip <= 0) {
            throw new Error(argumentOutOfRange);
        }
        return new AnonymousObservable(function (observer) {
            var m = new SingleAssignmentDisposable(),
                refCountDisposable = new RefCountDisposable(m),
                n = 0,
                q = [],
                createWindow = function () {
                    var s = new Subject();
                    q.push(s);
                    observer.onNext(addRef(s, refCountDisposable));
                };
            createWindow();
            m.setDisposable(source.subscribe(function (x) {
                var s;
                for (var i = 0, len = q.length; i < len; i++) {
                    q[i].onNext(x);
                }
                var c = n - count + 1;
                if (c >= 0 && c % skip === 0) {
                    s = q.shift();
                    s.onCompleted();
                }
                n++;
                if (n % skip === 0) {
                    createWindow();
                }
            }, function (exception) {
                while (q.length > 0) {
                    q.shift().onError(exception);
                }
                observer.onError(exception);
            }, function () {
                while (q.length > 0) {
                    q.shift().onCompleted();
                }
                observer.onCompleted();
            }));
            return refCountDisposable;
        });
    };

    /**
     *  Returns the elements of the specified sequence or the specified value in a singleton sequence if the sequence is empty.
     *  
     *  1 - obs = xs.defaultIfEmpty();
     *  2 - obs = xs.defaultIfEmpty(false);
     *      
     * @memberOf Observable#
     * @param defaultValue The value to return if the sequence is empty. If not provided, this defaults to null.
     * @returns {Observable} An observable sequence that contains the specified default value if the source is empty; otherwise, the elements of the source itself. 
     */
    observableProto.defaultIfEmpty = function (defaultValue) {
        var source = this;
        if (defaultValue === undefined) {
            defaultValue = null;
        }
        return new AnonymousObservable(function (observer) {
            var found = false;
            return source.subscribe(function (x) {
                found = true;
                observer.onNext(x);
            }, observer.onError.bind(observer), function () {
                if (!found) {
                    observer.onNext(defaultValue);
                }
                observer.onCompleted();
            });
        });
    };

    /**
     *  Returns an observable sequence that contains only distinct elements according to the keySelector and the comparer.
     *  Usage of this operator should be considered carefully due to the maintenance of an internal lookup structure which can grow large. 
     * 
     * @example
     *  1 - obs = xs.distinct();
     *  2 - obs = xs.distinct(function (x) { return x.id; });
     *  2 - obs = xs.distinct(function (x) { return x.id; }, function (x) { return x.toString(); });
     *      
     * @memberOf Observable#     
     * @param {Function} [keySelector]  A function to compute the comparison key for each element.
     * @param {Function} [keySerializer]  Used to serialize the given object into a string for object comparison.
     * @returns {Observable} An observable sequence only containing the distinct elements, based on a computed key value, from the source sequence.
     */
   observableProto.distinct = function (keySelector, keySerializer) {
        var source = this;
        keySelector || (keySelector = identity);
        keySerializer || (keySerializer = defaultKeySerializer);
        return new AnonymousObservable(function (observer) {
            var hashSet = {};
            return source.subscribe(function (x) {
                var key, serializedKey, otherKey, hasMatch = false;
                try {
                    key = keySelector(x);
                    serializedKey = keySerializer(key);
                } catch (exception) {
                    observer.onError(exception);
                    return;
                }
                for (otherKey in hashSet) {
                    if (serializedKey === otherKey) {
                        hasMatch = true;
                        break;
                    }
                }
                if (!hasMatch) {
                    hashSet[serializedKey] = null;
                    observer.onNext(x);
                }
            }, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    };

    /**
     *  Groups the elements of an observable sequence according to a specified key selector function and comparer and selects the resulting elements by using a specified function.
     *  
     * @example
     *  1 - observable.groupBy(function (x) { return x.id; });
     *  2 - observable.groupBy(function (x) { return x.id; }), function (x) { return x.name; });
     *  3 - observable.groupBy(function (x) { return x.id; }), function (x) { return x.name; }, function (x) { return x.toString(); });
     *      
     * @memberOf Observable#
     * @param {Function} keySelector A function to extract the key for each element.
     * @param {Function} [elementSelector]  A function to map each source element to an element in an observable group.
     * @param {Function} [keySerializer]  Used to serialize the given object into a string for object comparison.
     * @returns {Observable} A sequence of observable groups, each of which corresponds to a unique key value, containing all elements that share that same key value.    
     */
    observableProto.groupBy = function (keySelector, elementSelector, keySerializer) {
        return this.groupByUntil(keySelector, elementSelector, function () {
            return observableNever();
        }, keySerializer);
    };

    /**
     *  Groups the elements of an observable sequence according to a specified key selector function.
     *  A duration selector function is used to control the lifetime of groups. When a group expires, it receives an OnCompleted notification. When a new element with the same
     *  key value as a reclaimed group occurs, the group will be reborn with a new lifetime request.
     *  
     * @example
     *  1 - observable.groupByUntil(function (x) { return x.id; }, null,  function () { return Rx.Observable.never(); });
     *  2 - observable.groupBy(function (x) { return x.id; }), function (x) { return x.name; },  function () { return Rx.Observable.never(); });
     *  3 - observable.groupBy(function (x) { return x.id; }), function (x) { return x.name; },  function () { return Rx.Observable.never(); }, function (x) { return x.toString(); });
     *      
     * @memberOf Observable#
     * @param {Function} keySelector A function to extract the key for each element.
     * @param {Function} durationSelector A function to signal the expiration of a group.
     * @param {Function} [keySerializer]  Used to serialize the given object into a string for object comparison.
     * @returns {Observable} 
     *  A sequence of observable groups, each of which corresponds to a unique key value, containing all elements that share that same key value.
     *  If a group's lifetime expires, a new group with the same key value can be created once an element with such a key value is encoutered.
     *      
     */
    observableProto.groupByUntil = function (keySelector, elementSelector, durationSelector, keySerializer) {
        var source = this;
        elementSelector || (elementSelector = identity);
        keySerializer || (keySerializer = defaultKeySerializer);
        return new AnonymousObservable(function (observer) {
            var map = {},
                groupDisposable = new CompositeDisposable(),
                refCountDisposable = new RefCountDisposable(groupDisposable);
            groupDisposable.add(source.subscribe(function (x) {
                var duration, durationGroup, element, fireNewMapEntry, group, key, serializedKey, md, writer, w;
                try {
                    key = keySelector(x);
                    serializedKey = keySerializer(key);
                } catch (e) {
                    for (w in map) {
                        map[w].onError(e);
                    }
                    observer.onError(e);
                    return;
                }
                fireNewMapEntry = false;
                try {
                    writer = map[serializedKey];
                    if (!writer) {
                        writer = new Subject();
                        map[serializedKey] = writer;
                        fireNewMapEntry = true;
                    }
                } catch (e) {
                    for (w in map) {
                        map[w].onError(e);
                    }
                    observer.onError(e);
                    return;
                }
                if (fireNewMapEntry) {
                    group = new GroupedObservable(key, writer, refCountDisposable);
                    durationGroup = new GroupedObservable(key, writer);
                    try {
                        duration = durationSelector(durationGroup);
                    } catch (e) {
                        for (w in map) {
                            map[w].onError(e);
                        }
                        observer.onError(e);
                        return;
                    }
                    observer.onNext(group);
                    md = new SingleAssignmentDisposable();
                    groupDisposable.add(md);
                    var expire = function  () {
                        if (serializedKey in map) {
                            delete map[serializedKey];
                            writer.onCompleted();
                        }
                        groupDisposable.remove(md);
                    };
                    md.setDisposable(duration.take(1).subscribe(noop, function (exn) {
                        for (w in map) {
                            map[w].onError(exn);
                        }
                        observer.onError(exn);
                    }, function () {
                        expire();
                    }));
                }
                try {
                    element = elementSelector(x);
                } catch (e) {
                    for (w in map) {
                        map[w].onError(e);
                    }
                    observer.onError(e);
                    return;
                }
                writer.onNext(element);
            }, function (ex) {
                for (var w in map) {
                    map[w].onError(ex);
                }
                observer.onError(ex);
            }, function () {
                for (var w in map) {
                    map[w].onCompleted();
                }
                observer.onCompleted();
            }));
            return refCountDisposable;
        });
    };

    /**
     *  Projects each element of an observable sequence into a new form by incorporating the element's index.
     *  
     * @example
     *  source.select(function (value, index) { return value * value + index; });
     *      
     * @memberOf Observable#
     * @param {Function} selector A transform function to apply to each source element; the second parameter of the function represents the index of the source element.
     * @param {Any} [thisArg] Object to use as this when executing callback.
     * @returns {Observable} An observable sequence whose elements are the result of invoking the transform function on each element of source. 
     */
    observableProto.select = function (selector, thisArg) {
        var parent = this;
        return new AnonymousObservable(function (observer) {
            var count = 0;
            return parent.subscribe(function (value) {
                var result;
                try {
                    result = selector.call(thisArg, value, count++, parent);
                } catch (exception) {
                    observer.onError(exception);
                    return;
                }
                observer.onNext(result);
            }, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    };

    observableProto.map = observableProto.select;

    function selectMany(selector) {
        return this.select(selector).mergeObservable();
    }

    /**
     *  One of the Following:
     *  Projects each element of an observable sequence to an observable sequence and merges the resulting observable sequences into one observable sequence.
     *  
     * @example
     *  1 - source.selectMany(function (x) { return Rx.Observable.range(0, x); });
     *  Or:
     *  Projects each element of an observable sequence to an observable sequence, invokes the result selector for the source element and each of the corresponding inner sequence's elements, and merges the results into one observable sequence.
     *  
     *  1 - source.selectMany(function (x) { return Rx.Observable.range(0, x); }, function (x, y) { return x + y; });
     *  Or:
     *  Projects each element of the source observable sequence to the other observable sequence and merges the resulting observable sequences into one observable sequence.
     *  
     *  1 - source.selectMany(Rx.Observable.fromArray([1,2,3]));
     *      
     * @memberOf Observable#
     * @param selector A transform function to apply to each element or an observable sequence to project each element from the source sequence onto.
     * @param {Function} [resultSelector]  A transform function to apply to each element of the intermediate sequence.
     * @returns {Observable} An observable sequence whose elements are the result of invoking the one-to-many transform function collectionSelector on each element of the input sequence and then mapping each of those sequence elements and their corresponding source element to a result element.   
     */
    observableProto.selectMany = observableProto.flatMap = function (selector, resultSelector) {
        if (resultSelector) {
            return this.selectMany(function (x) {
                return selector(x).select(function (y) {
                    return resultSelector(x, y);
                });
            });
        }
        if (typeof selector === 'function') {
            return selectMany.call(this, selector);
        }
        return selectMany.call(this, function () {
            return selector;
        });
    };

    /**
     *  Bypasses a specified number of elements in an observable sequence and then returns the remaining elements.
     *      
     * @memberOf Observable#
     * @param {Number} count The number of elements to skip before returning the remaining elements.
     * @returns {Observable} An observable sequence that contains the elements that occur after the specified index in the input sequence.   
     */
    observableProto.skip = function (count) {
        if (count < 0) {
            throw new Error(argumentOutOfRange);
        }
        var observable = this;
        return new AnonymousObservable(function (observer) {
            var remaining = count;
            return observable.subscribe(function (x) {
                if (remaining <= 0) {
                    observer.onNext(x);
                } else {
                    remaining--;
                }
            }, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    };

    /**
     *  Bypasses elements in an observable sequence as long as a specified condition is true and then returns the remaining elements.
     *  The element's index is used in the logic of the predicate function.
     *  
     *  1 - source.skipWhile(function (value) { return value < 10; });
     *  1 - source.skipWhile(function (value, index) { return value < 10 || index < 10; });
     *      
     * @memberOf Observable#
     * @param {Function} predicate A function to test each element for a condition; the second parameter of the function represents the index of the source element.
     * @returns {Observable} An observable sequence that contains the elements from the input sequence starting at the first element in the linear series that does not pass the test specified by predicate.   
     */
    observableProto.skipWhile = function (predicate) {
        var source = this;
        return new AnonymousObservable(function (observer) {
            var i = 0, running = false;
            return source.subscribe(function (x) {
                if (!running) {
                    try {
                        running = !predicate(x, i++);
                    } catch (e) {
                        observer.onError(e);
                        return;
                    }
                }
                if (running) {
                    observer.onNext(x);
                }
            }, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    };

    /**
     *  Returns a specified number of contiguous elements from the start of an observable sequence, using the specified scheduler for the edge case of take(0).
     *  
     *  1 - source.take(5);
     *  2 - source.take(0, Rx.Scheduler.timeout);
     *      
     * @memberOf Observable#
     * @param {Number} count The number of elements to return.
     * @param {Scheduler} [scheduler] Scheduler used to produce an OnCompleted message in case <paramref name="count count</paramref> is set to 0.
     * @returns {Observable} An observable sequence that contains the specified number of elements from the start of the input sequence.  
     */
    observableProto.take = function (count, scheduler) {
        if (count < 0) {
            throw new Error(argumentOutOfRange);
        }
        if (count === 0) {
            return observableEmpty(scheduler);
        }
        var observable = this;
        return new AnonymousObservable(function (observer) {
            var remaining = count;
            return observable.subscribe(function (x) {
                if (remaining > 0) {
                    remaining--;
                    observer.onNext(x);
                    if (remaining === 0) {
                        observer.onCompleted();
                    }
                }
            }, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    };

    /**
     *  Returns elements from an observable sequence as long as a specified condition is true.
     *  The element's index is used in the logic of the predicate function.
     *  
     * @example
     *  1 - source.takeWhile(function (value) { return value < 10; });
     *  1 - source.takeWhile(function (value, index) { return value < 10 || index < 10; });
     *      
     * @memberOf Observable#
     * @param {Function} predicate A function to test each element for a condition; the second parameter of the function represents the index of the source element.
     * @returns {Observable} An observable sequence that contains the elements from the input sequence that occur before the element at which the test no longer passes.  
     */
    observableProto.takeWhile = function (predicate) {
        var observable = this;
        return new AnonymousObservable(function (observer) {
            var i = 0, running = true;
            return observable.subscribe(function (x) {
                if (running) {
                    try {
                        running = predicate(x, i++);
                    } catch (e) {
                        observer.onError(e);
                        return;
                    }
                    if (running) {
                        observer.onNext(x);
                    } else {
                        observer.onCompleted();
                    }
                }
            }, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    };

    /**
     *  Filters the elements of an observable sequence based on a predicate by incorporating the element's index.
     *  
     * @example
     *  1 - source.where(function (value) { return value < 10; });
     *  1 - source.where(function (value, index) { return value < 10 || index < 10; });
     *      
     * @memberOf Observable#
     * @param {Function} predicate A function to test each source element for a condition; the second parameter of the function represents the index of the source element.
     * @param {Any} [thisArg] Object to use as this when executing callback.
     * @returns {Observable} An observable sequence that contains elements from the input sequence that satisfy the condition.   
     */
    observableProto.where = function (predicate, thisArg) {
        var parent = this;
        return new AnonymousObservable(function (observer) {
            var count = 0;
            return parent.subscribe(function (value) {
                var shouldRun;
                try {
                    shouldRun = predicate.call(thisArg, value, count++, parent);
                } catch (exception) {
                    observer.onError(exception);
                    return;
                }
                if (shouldRun) {
                    observer.onNext(value);
                }
            }, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    };

    observableProto.filter = observableProto.where;
    /** @private */
    var AnonymousObservable = Rx.Internals.AnonymousObservable = (function (_super) {
        inherits(AnonymousObservable, _super);
        
        /**
         * @private
         * @constructor
         */
        function AnonymousObservable(subscribe) {
            if (!(this instanceof AnonymousObservable)) {
                return new AnonymousObservable(subscribe);
            }

            function s(observer) {
                var autoDetachObserver = new AutoDetachObserver(observer);
                if (currentThreadScheduler.scheduleRequired()) {
                    currentThreadScheduler.schedule(function () {
                        try {
                            autoDetachObserver.disposable(subscribe(autoDetachObserver));
                        } catch (e) {
                            if (!autoDetachObserver.fail(e)) {
                                throw e;
                            } 
                        }
                    });
                } else {
                    try {
                        autoDetachObserver.disposable(subscribe(autoDetachObserver));
                    } catch (e) {
                        if (!autoDetachObserver.fail(e)) {
                            throw e;
                        }
                    }
                }

                return autoDetachObserver;
            }

            _super.call(this, s);
        }

        return AnonymousObservable;

    }(Observable));

    /** @private */
    var AutoDetachObserver = (function (_super) {
        inherits(AutoDetachObserver, _super);

        /**
         * @private
         * @constructor
         */
        function AutoDetachObserver(observer) {
            _super.call(this);
            this.observer = observer;
            this.m = new SingleAssignmentDisposable();
        }

        var AutoDetachObserverPrototype = AutoDetachObserver.prototype

        /**
         * @private
         * @memberOf AutoDetachObserver#
         */
        AutoDetachObserverPrototype.next = function (value) {
            var noError = false;
            try {
                this.observer.onNext(value);
                noError = true;
            } catch (e) { 
                throw e;                
            } finally {
                if (!noError) {
                    this.dispose();
                }
            }
        };

        /**
         * @private
         * @memberOf AutoDetachObserver#
         */
        AutoDetachObserverPrototype.error = function (exn) {
            try {
                this.observer.onError(exn);
            } catch (e) { 
                throw e;                
            } finally {
                this.dispose();
            }
        };

        /**
         * @private
         * @memberOf AutoDetachObserver#
         */
        AutoDetachObserverPrototype.completed = function () {
            try {
                this.observer.onCompleted();
            } catch (e) { 
                throw e;                
            } finally {
                this.dispose();
            }
        };

        /**
         * @private
         * @memberOf AutoDetachObserver#
         */
        AutoDetachObserverPrototype.disposable = function (value) {
            return this.m.disposable(value);
        };

        /**
         * @private
         * @memberOf AutoDetachObserver#
         */
        AutoDetachObserverPrototype.dispose = function () {
            _super.prototype.dispose.call(this);
            this.m.dispose();
        };

        return AutoDetachObserver;
    }(AbstractObserver));

    /** @private */
    var GroupedObservable = (function (_super) {
        inherits(GroupedObservable, _super);

        function subscribe(observer) {
            return this.underlyingObservable.subscribe(observer);
        }

        /** 
         * @constructor
         * @private
         */
        function GroupedObservable(key, underlyingObservable, mergedDisposable) {
            _super.call(this, subscribe);
            this.key = key;
            this.underlyingObservable = !mergedDisposable ?
                underlyingObservable :
                new AnonymousObservable(function (observer) {
                    return new CompositeDisposable(mergedDisposable.getDisposable(), underlyingObservable.subscribe(observer));
                });
        }

        return GroupedObservable;
    }(Observable));

    /** @private */
    var InnerSubscription = function (subject, observer) {
        this.subject = subject;
        this.observer = observer;
    };

    /**
     * @private
     * @memberOf InnerSubscription
     */
    InnerSubscription.prototype.dispose = function () {
        if (!this.subject.isDisposed && this.observer !== null) {
            var idx = this.subject.observers.indexOf(this.observer);
            this.subject.observers.splice(idx, 1);
            this.observer = null;
        }
    };

    /**
     *  Represents an object that is both an observable sequence as well as an observer.
     *  Each notification is broadcasted to all subscribed observers.
     */
    var Subject = Rx.Subject = (function (_super) {
        function subscribe(observer) {
            checkDisposed.call(this);
            if (!this.isStopped) {
                this.observers.push(observer);
                return new InnerSubscription(this, observer);
            }
            if (this.exception) {
                observer.onError(this.exception);
                return disposableEmpty;
            }
            observer.onCompleted();
            return disposableEmpty;
        }

        inherits(Subject, _super);

        /**
         * Creates a subject.
         *
         * @constructor
         */      
        function Subject() {
            _super.call(this, subscribe);
            this.isDisposed = false,
            this.isStopped = false,
            this.observers = [];
        }

        addProperties(Subject.prototype, Observer, {
            /**
             * Indicates whether the subject has observers subscribed to it.
             * 
             * @memberOf ReplaySubject# 
             * @returns {Boolean} Indicates whether the subject has observers subscribed to it.
             */         
            hasObservers: function () {
                return this.observers.length > 0;
            },
            /**
             * Notifies all subscribed observers about the end of the sequence.
             * 
             * @memberOf ReplaySubject#
             */                          
            onCompleted: function () {
                checkDisposed.call(this);
                if (!this.isStopped) {
                    var os = this.observers.slice(0);
                    this.isStopped = true;
                    for (var i = 0, len = os.length; i < len; i++) {
                        os[i].onCompleted();
                    }

                    this.observers = [];
                }
            },
            /**
             * Notifies all subscribed observers about the exception.
             * 
             * @memberOf ReplaySubject#
             * @param {Mixed} error The exception to send to all observers.
             */               
            onError: function (exception) {
                checkDisposed.call(this);
                if (!this.isStopped) {
                    var os = this.observers.slice(0);
                    this.isStopped = true;
                    this.exception = exception;
                    for (var i = 0, len = os.length; i < len; i++) {
                        os[i].onError(exception);
                    }

                    this.observers = [];
                }
            },
            /**
             * Notifies all subscribed observers about the arrival of the specified element in the sequence.
             * 
             * @memberOf ReplaySubject#
             * @param {Mixed} value The value to send to all observers.
             */                 
            onNext: function (value) {
                checkDisposed.call(this);
                if (!this.isStopped) {
                    var os = this.observers.slice(0);
                    for (var i = 0, len = os.length; i < len; i++) {
                        os[i].onNext(value);
                    }
                }
            },
            /**
             * Unsubscribe all observers and release resources.
             * 
             * @memberOf ReplaySubject#
             */                
            dispose: function () {
                this.isDisposed = true;
                this.observers = null;
            }
        });

        /**
         * Creates a subject from the specified observer and observable.
         * 
         * @static
         * @memberOf Subject
         * @param {Observer} observer The observer used to send messages to the subject.
         * @param {Observable} observable The observable used to subscribe to messages sent from the subject.
         * @returns {Subject} Subject implemented using the given observer and observable.
         */
        Subject.create = function (observer, observable) {
            return new AnonymousSubject(observer, observable);
        };

        return Subject;
    }(Observable));

    /**
     *  Represents the result of an asynchronous operation.
     *  The last value before the OnCompleted notification, or the error received through OnError, is sent to all subscribed observers.
     */   
    var AsyncSubject = Rx.AsyncSubject = (function (_super) {

        function subscribe(observer) {
            checkDisposed.call(this);
            if (!this.isStopped) {
                this.observers.push(observer);
                return new InnerSubscription(this, observer);
            }
            var ex = this.exception;
            var hv = this.hasValue;
            var v = this.value;
            if (ex) {
                observer.onError(ex);
            } else if (hv) {
                observer.onNext(v);
                observer.onCompleted();
            } else {
                observer.onCompleted();
            }
            return disposableEmpty;
        }

        inherits(AsyncSubject, _super);

        /**
         * Creates a subject that can only receive one value and that value is cached for all future observations.
         *
         * @constructor
         */ 
        function AsyncSubject() {
            _super.call(this, subscribe);

            this.isDisposed = false,
            this.isStopped = false,
            this.value = null,
            this.hasValue = false,
            this.observers = [],
            this.exception = null;
        }

        addProperties(AsyncSubject.prototype, Observer, {
            /**
             * Indicates whether the subject has observers subscribed to it.
             * 
             * @memberOf AsyncSubject# 
             * @returns {Boolean} Indicates whether the subject has observers subscribed to it.
             */         
            hasObservers: function () {
                return this.observers.length > 0;
            },
            /**
             * Notifies all subscribed observers about the end of the sequence, also causing the last received value to be sent out (if any).
             * 
             * @memberOf AsyncSubject#
             */ 
            onCompleted: function () {
                var o, i, len;
                checkDisposed.call(this);
                if (!this.isStopped) {
                    var os = this.observers.slice(0);
                    this.isStopped = true;
                    var v = this.value;
                    var hv = this.hasValue;

                    if (hv) {
                        for (i = 0, len = os.length; i < len; i++) {
                            o = os[i];
                            o.onNext(v);
                            o.onCompleted();
                        }
                    } else {
                        for (i = 0, len = os.length; i < len; i++) {
                            os[i].onCompleted();
                        }
                    }

                    this.observers = [];
                }
            },
            /**
             * Notifies all subscribed observers about the exception.
             * 
             * @memberOf AsyncSubject#
             * @param {Mixed} error The exception to send to all observers.
             */ 
            onError: function (exception) {
                checkDisposed.call(this);
                if (!this.isStopped) {
                    var os = this.observers.slice(0);
                    this.isStopped = true;
                    this.exception = exception;

                    for (var i = 0, len = os.length; i < len; i++) {
                        os[i].onError(exception);
                    }

                    this.observers = [];
                }
            },
            /**
             * Sends a value to the subject. The last value received before successful termination will be sent to all subscribed and future observers.
             * 
             * @memberOf AsyncSubject#
             * @param {Mixed} value The value to store in the subject.
             */             
            onNext: function (value) {
                checkDisposed.call(this);
                if (!this.isStopped) {
                    this.value = value;
                    this.hasValue = true;
                }
            },
            /**
             * Unsubscribe all observers and release resources.
             * 
             * @memberOf AsyncSubject#
             */
            dispose: function () {
                this.isDisposed = true;
                this.observers = null;
                this.exception = null;
                this.value = null;
            }
        });

        return AsyncSubject;
    }(Observable));

    /** @private */
    var AnonymousSubject = (function (_super) {
        inherits(AnonymousSubject, _super);

        function subscribe(observer) {
            return this.observable.subscribe(observer);
        }

        /**
         * @private
         * @constructor
         */
        function AnonymousSubject(observer, observable) {
            _super.call(this, subscribe);
            this.observer = observer;
            this.observable = observable;
        }

        addProperties(AnonymousSubject.prototype, Observer, {
            /**
             * @private
             * @memberOf AnonymousSubject#
            */
            onCompleted: function () {
                this.observer.onCompleted();
            },
            /**
             * @private
             * @memberOf AnonymousSubject#
            */            
            onError: function (exception) {
                this.observer.onError(exception);
            },
            /**
             * @private
             * @memberOf AnonymousSubject#
            */            
            onNext: function (value) {
                this.observer.onNext(value);
            }
        });

        return AnonymousSubject;
    }(Observable));

    // Check for AMD
    if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
        window.Rx = Rx;
        return define(function () {
            return Rx;
        });
    } else if (freeExports) {
        if (typeof module == 'object' && module && module.exports == freeExports) {
            module.exports = Rx;
        } else {
            freeExports = Rx;
        }
    } else {
        window.Rx = Rx;
    }
}(this));
};
__modules__["/actortraits.js"] = function(require, load, export$) {
var Trait = require("./lib/colortraits").Trait
  , debug = require("./lib/debug")
  , util = require("./lib/util")
  , ClipKlass = require("./gprims/clipgprim").ClipKlass
  , ImageKlass = require("./gprims/imagegprim").ImageKlass
  , Rx = require("./thirdlib/rx/all");

var identifier = util.identifier;
var Interactors = require("interactor").Interactors;
/*
**1,image

**2,w:frame width
**3,h:frame height

**4,HSpan:default is w
**5,VSpan:default is h

**6,startFrame:index of start frame
**7,endFrame:index of end frame

**8,times:default is 1.
**9,interval:

**10,factor:
*/
var frameUpdate = function(t, actor)
{
  var data = actor.satelliteData("frame");

  var imgWidth = data._clipGPrim.get("gprim").get("width");
  var imgHeight = data._clipGPrim.get("gprim").get("height");
  var endX = data._endX == -1 ? imgWidth : data._endX;
  var endY = data._endY == -1 ? imgHeight : data._endY;
  var compelete = false;

  dt = dt * data._factor;

  if (data._times == 0)
    return;

  data._elapsed += dt;
  
  while (data._elapsed >= data._interval)
  {
    data._elapsed -= data._interval;
    
    data._x += data._hSpan;

    //jump to next line?
    if (data._x >= imgWidth)
    {
      data._x = 0;
      data._y += data._vSpan;
    }

    //check if frame play over
    if (((data._x+data._hSpan) > endX && (data._y+data._vSpan) == endY) ||
        (data._y + data._vSpan) > endY)
    {
      data._times --;
      
      data._x = data._startX;
      data._y = data._startY;

      if (0 == data._times)
        break;
    }
  }

  data._clipGPrim.set("x", data._x);
  data._clipGPrim.set("y", data._y);
};

var FrameSeqTrait = Trait.extend({
  initialize:function(param)
  {
    var data = this.querySatelliteData("frame", {});

    var imgGPrim = new ImageKlass({image:param.image});
    data._clipGPrim = new ClipKlass({w:param.w, h:param.h, gprim:imgGPrim});

    if (typeof(param.HSpan) == 'number')
      data._hSpan = param.HSpan;
    else
      data._hSpan = param.w;

    if (typeof(param.VSpan) == 'number')
      data._vSpan = param.VSpan;
    else
      data._vSpan = param.h;

    var startFrame = {x:0, y:0};
    if (typeof(param.startFrame) == 'number')
    {
      startFrame.x = param.startFrame;
      startFrame.y = 0;
    }
    else if (param.startFrame)
    {
      startFrame = param.startFrame;
    }
    
    var endFrame = {x:-1, y:-1};
    if (typeof(param.endFrame) == "number")
    {
      endFrame.x = param.endFrame;
      endFrame.y = 1;
    }
    else if (param.endFrame)
    {
      endFrame = param.endFrame;
    }

    debug.assert((typeof(startFrame.x) == 'number' && 
                  typeof(startFrame.y) == 'number' &&
                  typeof(endFrame.x) == 'number' &&
                  typeof(endFrame.y == 'number')), "parameter error");

    data._startX = startFrame.x * param.w;
    data._startY = startFrame.y * param.h;
    data._endX = endFrame.x == -1 ? -1 : endFrame.x * param.w;
    data._endY = endFrame.y == -1 ? -1 : endFrame.y * param.h;

    if (typeof(param.times) == 'number')
      data._times = param.times;
    else
      data._times = 1;

    data._interval = param.interval;

    if (typeof(param.factor) == 'number')
      data._factor = param.factor;
    else
      data._factor = 1;

    data._clipGPrim.x = data._x = data._startX;
    data._clipGPrim.y = data._y = data._startY;

    data._elapsed = 0;

    this.regUpdate(frameUpdate);
  },

  _frameData: function()
  {
    return this.satelliteData("frame");
  },

  setFrameSeqFactor:function(factor)
  {
    debug.assert(typeof(factor) == "number", "frameseq component setFrameSeqFactor parameter error");
    
    this.satelliteData("frame")._factor = factor;
  },

  getGPrim:function()
  {
    return this.satelliteData("frame")._clipGPrim;
  }
});

var EmitterTrait = Trait.extend({
  __init:function(emitter)
  {
    this.querySatelliteData("emitter", emitter);

    var update = function(t, actor)
    {
      actor.querySatelliteData("emitter").update(dt, null, {});
    };
    
    this.regUpdate(update);
  },

  getEmitter:function()
  {
    return this.querySatelliteData("emitter");
  }
});

var UnitTrait = Trait.extend(
  {     
     isUnit:function(host)
     {
        return true;
     }
  });

var IsoVerActorTrait = Trait.extend(
  {
    emitGPrims:function(v)
    {
      var m = this.gprim();
      var mat = this.matrix();
      
      debug.assert(typeof(mat.tz) == "number", "logical error");

      v.push({gprim:m, effect:{matrix:mat, vertical:true, z:mat.tz}});
    },

    emitControlGPrims:function(v)
    {
      return this.emitGPrims(v);
    }
  }
);

function isPrimitiveInteractor(type)
{
  if(type == "mouseDragged" || type == "mouseClicked")
    return false;

  return true;
}

var interactorTypesMap = 
{
  mouseOver : "mouse",
  mouseMoved : "mouse",
  mouseOut : "mouse",
  keyPressed : "mouse",
  keyReleased : "mouse",
  mouseDragged : "mouse",
  mouseClicked : "mouse",
  keyPressed : "keyboard",
  keyReleased : "keyboard",
  mousePressed : "mouse",
  mouseReleased : "mouse",
  twoFingerTouch : "mouse"
}

/**
@itrait[InteractorTrait]{交互行为功能单元，一旦actor应用上interactorTrait，actor便具有了添加、删除交互等能力。}
*/
var InteractorTrait = Trait.extend({
/**
@method[__init #:hidden]{
  @trait[InteractorTrait]
  @return[this]{}
  interactorTrait功能单元的初始化函数。
}
*/
  __init:function()
  {
    this._t.setinteractors({});
    this._t.setobservers({});
    //交互监听的引用计数
    this.mouse = 0;
    this.keyboard = 0;
  },
/**
@method[addEventListener]{
  @trait[InteractorTrait]
  @param[type string]{交互事件类型。}
  @param[cb function]{交互响应的回调函数。回调函数的参数是event。}
  @return[this]{}
  给精灵添加某种交互功能。
  @verbatim|{
    @bold{支持的交互类型有：}
    mouseOver
    mouseOut
    mouseMoved
    mouseDragged : evt.etype = touchstart | touchmove | touchend
    mousePressed
    mouseReleased
    keyPressed
    keyReleased
    twoFingerTouch : evt.etype = touchstart | touchmove | touchend
  }|
  @jscode{
    sprite.addEventListener("mouseOver", function(evt){
      //evt中含有
      {
        type:交互事件类型。
        actor:发生交互的精灵。
        mouseX:鼠标在舞台上的X坐标。
        mouseY:鼠标在舞台上的y坐标。
        dragStart:为true时表示拖拽开始。
        dragEnt:为true时表示拖拽结束。
        preventFlow:组织交互事件冒泡给上层接收精灵。
      }
    });
  }
}
*/
  addEventListener : function(type, cb)
  {
    var observable = this.getInteractObservable(type);
    var observer = observable.subscribe(cb);
    
    if(this._t.observers()[type] == null)
      this._t.observers()[type] = {};

    this._t.observers()[type][identifier(cb)] = observer;

    return this;
  },
/**
@method[removeEventListener]{
  @trait[InteractorTrait]
  @param[type string]{交互事件类型。}
  @param[callback function]{交互的回调函数。}
  @return[this]{}
  取消某个交互的回调函数。
}
*/
  removeEventListener : function(type, cb)
  {
    if(this._t.observers()[type] == null)
      return;
    
    this._t.observers()[type][identifier(cb)].dispose();
    delete this._t.observers()[type][identifier(cb)];

    var noneObserverExist = true;
    for(var observer in this._t.observers()[type])
    {
      noneObserverExist = false;
      break;
    }

    if(noneObserverExist)
    {
      delete this._t.observers()[type];
      delete this._t.interactors()[type];
      this[interactorTypesMap[type]] -= 1;
    }

    return this;
  },
/**
@method[removeAllEventListener]{
  @trait[InteractorTrait]
  @param[type string]{交互事件类型。}
  @return[this]{}
  取消某一类型的交互的回调函数。
}
*/
  removeAllEventListener: function(type)
  {
    if(typeof(type) === "string"){
      if(this._t.observers()[type] == null)
        return;
      for(var observer in  this._t.observers()[type])
      {
         this._t.observers()[type][observer].dispose();
        delete  this._t.observers()[type][observer];
      }

      delete this._t.observers()[type];
      delete this._t.interactors()[type];
      this[interactorTypesMap[type]] -= 1;

      return this;
    }else {
      debug.assert(false, "please enter the right interactor type!!");
    }
  },
  __getInteractor : function(type)
  {
    var interactor = this._t.interactors()[type];
    if(interactor == null)
    {
      interactor = Interactors[type].create(this);
      this._t.interactors()[type] = interactor;
      this[interactorTypesMap[type]] += 1;
    }

    return interactor;
  },
/**
@method[getInteractObservable #:hidden]{
  @trait[InteractorTrait]
  @param[type string]{交互事件类型。}
  @return[observable]{Rx observable}
  获取精灵上某个交互的消息流。如果没有，则会创建一个新的。
}
*/
  getInteractObservable : function(type)
  {
    var interactor = this._t.__getInteractor(type);

    return interactor.observable();
  },
/**
@method[getInteractSubject #:hidden]{
  @trait[InteractorTrait]
  @param[type string]{交互事件类型。}
  @return[subject]{Rx subject。}
  获取精灵上某个交互的subject。若果不存在，则会创建新的。
}
*/
  getInteractSubject : function(type)
  {
    var interactor = this._t.__getInteractor(type);

    return interactor.subject();
  },
/**
 @method[queryInteractSubject #:hidden]{
  @trait[InteractorTrait]
  @param[type string]{交互事件类型。}
  @return[subject]{Rx subject}
  获取精灵上某个交互的subject。若果不存在，则返回 undefined。
 }
*/
  queryInteractSubject : function(type)
  {
    var interactor = this._t.interactors()[type];
    if(interactor == null)
    {
      return;
    }

    return interactor.subject();
  },
/**
@method[requestInteractiveObjects #:hidden]{
  @trait[InteractorTrait]
  @param[decider EventDecider]{场景事件派发器。}
  @param[interactiveObjs array]{交互对象列表。}
  @param[evtType string]{交互事件类型。只能是 mouse 或 keyboard。}
  @return[this]{}
  将精灵中evtType类型交互的对象提交到interactiveObjs中。
}
*/
  requestInteractiveObjects : function(decider, interactiveObjs, evtType)
  {
    var bHasTypeInteraction = (this[evtType] > 0);
    if(!this.interactable() ||  !bHasTypeInteraction)
      return;

    this.emitInteractiveObjects(interactiveObjs);
    return this;
  },
/*
@method[forceRequestInteractiveObjects #:hidden]{
  @trait[InteractorTrait]
  @param[decider @type[EventDecider]]{事件派发器。}
  @param[forceTypes array]{强制提交交互类型列表。}
  @param[interactiveObjs array]{交互对象列表。}
  @param[evtType String]{交互事件类型。只能是 mouse 或 keyboard。}
  @return[this]{}
  强制提交精灵上所有事件的交互对象。
}
*/
  forceRequestInteractiveObjects : function(decider, forceTypes, interactiveObjs, evtType)
  {
    if(!this.interactable())
      return;

    //假如actor上没有强制需要提交的事件类型，则需要为此事件初始化好对应的消息管道。
    for(var type in forceTypes)
    {
      this._t.__getInteractor(type);
    }
    
    this.requestInteractiveObjects(decider, interactiveObjs, evtType);

    return this;
  },

  forceInteractionTypes : function(forceTypes, evtType)
  {
    var interactors = this._t.interactors();
    var hasInteractor = false;
    if(forceTypes == null)
    {
      forceTypes = {}
      for(var type in interactors)
      {
        if(interactorTypesMap[type] == evtType)
        {
          forceTypes[type] = type;
          hasInteractor = true;
        }
      }
      if(!hasInteractor)
        return;

      return forceTypes;
    }
    var newtypes = {};

    for(var type in forceInteractionTypes)
    {
      newtypes[type] = type;
    }
    for(var type in interactors)
    {
      if(interactorTypesMap[type] == evtType)
        newtypes[type] = type;
    }
    return newtypes;
  }

}, ["interactors", "observers"]);

export$({
  EmitterTrait:EmitterTrait,
  FrameSeqTrait:FrameSeqTrait,
  UnitTrait:UnitTrait,
  IsoVerActorTrait:IsoVerActorTrait,
  InteractorTrait:InteractorTrait
});

};
__modules__["/scene.js"] = function(require, load, export$) {
var debug = require("./lib/debug")
  , TreeActor = require("treeactor").TreeActor
  , Klass = require("./lib/colortraits").Klass
  , Trait = require("./lib/colortraits").Trait
  , DirtyManagerTrait = require("./lib/dirtymanager").DirtyManagerTrait
  , AutoRepaintTrait = require("./lib/autorepaint").AutoRepaintTrait;

var EventStreamTrait = require("./lib/eventstream");

/**
@section{概述}
colorbox的场景管理器模块，主要是负责舞台上精灵结构的组织。
不同类型的应用适合不同类型的场景管理，colorbox默认提供了树状结构的场景管理方式。
*/

/**
@itrait[SceneTrait]{构成一个scene所需要的最基本的功能，所有的scene都必须具有sceneTrait上的所有功能。}
**/
var SceneTrait = Trait.extend({
/**
@method[update #:hidden]{
  @trait[SceneTrait]
  @param[t number]{世界的当前时间。}
  @param[dt number]{距离上一次逻辑更新的间隔时间。}
  @return[this]{}
  场景更新函数，该函数会对场景中所有的精灵进行逻辑更。
}
*/
  update: function (t, dt)
  {
    debug.error('cannot be here');

    return this;
  },
/**
@method[add]{
  @trait[SceneTrait]
  @param[actor Actor]{
    添加的精灵。
  }
  @param[position object]{
    添加的精灵的位置。
  }
  @return[this]{}
  往场景管理器中添加一个精灵。
}
*/
  add:function(actor, position)
  {
    debug.error('cannot be here');
  },
/**
@method[remove]{
  @trait[SceneTrait]
  @param[actor Actor]{
   actor;删除的精灵。
  }
  @return[this]{}
  删除场景管理器中的某个精灵。
}
*/
  remove:function(actor)
  {
    debug.error('cannot be here');
  },
/**
@method[filt]{
  @trait[SceneTrait]
  @param[container object]{
    存储复合条件的容器对象。该对象必须具有push函数。
  }
  @param[filter function]{
    过滤函数。
  }
  @return[this]{}
  遍历场景中的所有精灵并用filt过滤，将符合条件的精灵放入container容器中。
}
*/
  filt:function(container, filter)
  {
    debug.error('cannot be here');
  },

/**
@method[forEach]{
  @trait[SceneTrait]
  @param[cb function]{forEach回调函数，cb的参数是遍历到的actor。}
  @return[this]{}
  遍历场景中的所有精灵并用依次调用cb函数。
}
*/
  forEachActor : function(cb)
  {
    debug.error('cannot be here');
  },

/**
@method[emitDisplayObjects #:hidden]{
  @trait[SceneTrait]
  @param[displayObjs array]{渲染对象列表。}
  @return[this]{}
  将场景中所有的渲染对象提交到displayObjs中。
}
*/
  emitDisplayObjects : function(displayObjs)
  {
    debug.error('cannot be here');
  },

/**
@method[requestInteractiveObjects #:hidden]{
  @trait[SceneTrait]
  @param[decider EventDecider]{场景事件派发器。}
  @param[interactiveObjs array]{交互对象列表。}
  @param[evtType string]{交互的消息类型。}
  @return[this]{}
  将场景中所有关心evtType类型交互的对象提交到interactiveObjs中。
}
*/
  requestInteractiveObjects : function(decider, interactiveObjs, evtType)
  {
    debug.error('cannot be here');
  }
});

/**
@iclass[Scene Klass (SceneTrait EventStreamTrait DirtyManagerTrait AutoRepaintTrait)]{
  @constructor[Scene]{
    @param[param object]{创建Scene所需参数。}
  }
  Scene是所有场景管理器的基类,任何订制的场景管理器都必须提供Scene中的方法。
  @jscode{
    //创建一个场景,并且打开场景的自动重绘和脏矩形管理功能。
    Scene.create({
      dirtyMgrFlag:true,
      autorepaint:true
    });
  }
}
*/
var Scene = Klass.extend({
  initialize : function(param)
  {
    var self = this;
    this.subTraits(1).__init();
    this.createEventStream("system");
    this.subscribe("system", function(evt){
      if(evt.type == "active")
      {
        this.active();
      }
      else if(evt.type == "deactive")
      {
        self.deactive();
      }
    });

    //this.createEventStream("addremoveActor");
    this.subTraits(2).__init(param);
    this.subTraits(3).__init(param);
  }

}, [["subject", EventStreamTrait.grant("subject")]], [SceneTrait, EventStreamTrait, DirtyManagerTrait, AutoRepaintTrait]);


var PublicActiveEvent = {type:"active"};
var PublicDeactiveEvent = {type:"deactive"};
var gDecider;
var gInteractiveObjs;
var gEvtType;
function requestInteractionReduceFunction(forceInteractionTypes, actor)
{
  if(actor.hasMethod("receiveBubble"))
  {
    return actor.forceInteractionTypes(forceInteractionTypes, gEvtType);
  }
  else if(forceInteractionTypes)
  {
    actor.forceRequestInteractiveObjects(gDecider, forceInteractionTypes, gInteractiveObjs, gEvtType);
    return forceInteractionTypes;
  }
  else
    actor.requestInteractiveObjects(gDecider, gInteractiveObjs, gEvtType);
};

var gDisplayObjs;
function emitDisplayObjectsFun(actor)
{
  actor.emitDisplayObjects(gDisplayObjs);
}

function foreachActiveFun(actor)
{
  actor.notify("system", PublicActiveEvent);
}

function foreachDeactiveFun(actor)
{
  actor.notify("system", PublicActiveEvent);  
}

var gt;
var gdt;
function sceneUpdate(a) 
{ 
  a.update(gt, gdt); 
}


var addremoveEvent = {}; //这里可能全局只有一个可能会受影响

/**
@itrait[TreeSceneTrait]{
  树状组织结构的场景管理功能单元，TreeScene会使用该trait来拥有树状组织结构场景管理能力。
}
*/
var TreeSceneTrait = Trait.extend({
/**
@method[__init #:hidden]{
  @trait[TreeSceneTrait]
  @param[param object]{
    param object中必须含有owner、interactble属性。
    owner是scene从属的对象,该对象必须提供 eventDecider(获取该scene的事件派发器)的方法。
  }
  @return[this]{}
  TreeSceneTrait的初始化函数。
}
*/
  __init:function(param)
  {
    var root = TreeActor.create(param);
    this._t.setroot(root);
    this._t.setowner(param.owner);

    return this;
  },
  __update: function (t, dt)
  {
    gt = t;
    gdt = dt;
    this._t.root().forEach(sceneUpdate);
  },

/**
@method[owner #:hidden]{
  @trait[TreeSceneTrait]
  @return[object]{owner}
  获取该场景所属的对象。
}
*/
  owner : function()
  {
    return this._t.owner();
  },

  active: function()
  {
    PublicActiveEvent.scene = this;
    this._t.root().forEach(foreachActiveFun);
  },

  deactive: function()
  {    
    PublicDeactiveEvent.scene = this;
    this._t.root().forEach(foreachDeactiveFun);
  },
/**
@method[add]{
  @trait[TreeSceneTrait]
  @param[sprite Sprite]{
   需要添加的精灵，此处必须是TreeActor。因为场景管理器是树状结构的场景管理。
  }
  @param[parent Sprite]{
   被添加精灵的父精灵，默认是根节点。
  }
  @return[this]{}
  往场景中添加精灵。
  
  当添加一个actor的时候，会判断world的autorepaint是否打开，如果打开，则让actor hook住所有与显示相关的所有属性,并发出场景变动的消息。
}
*/
  add:function(sprite, parent)
  {
    if (parent == null)
      parent = this._t.root();

    if (sprite.parent() != undefined)
      this.remove(sprite);
    
    parent._appendChild(sprite);
    
    PublicActiveEvent.scene = this;
    sprite.forEach(foreachActiveFun);

    addremoveEvent.type = "addActor";
    addremoveEvent.actor = sprite;
    this.notify("system", addremoveEvent);

    return this;
  },
/**
@method[remove]{
  @trait[TreeSceneTrait]
  @param[sprite @Sprite]{
  需要删除的精灵;
  }
  @return[this]{}
  删除场景中的某个精灵。

  当删除一个精灵的时候，需要判断它自动重绘是否打开，如果打开需要去unhook住actor上的所有显示相关属性，并发出场景变动的消息。
}
*/
  remove:function(sprite)
  {
    addremoveEvent.type = "removeActor";
    addremoveEvent.actor = sprite;
    this.notify("system", addremoveEvent);  

    if (sprite.parent())
    {
      PublicDeactiveEvent.scene = this;
      sprite.forEach(foreachDeactiveFun);

      return sprite.parent()._removeChild(sprite);
    }

    return this;
  },

  /**
  @method[replace]{
  @trait[TreeSceneTrait]
  @param[oldSprite @Sprite]{
    被替换者;
  }
  @param[newSprite @Sprite]{
    替换者;
  }
  @return[this]{}
    被替换的精灵。

  当删除一个精灵的时候，需要判断它自动重绘是否打开，如果打开需要去unhook住actor上的所有显示相关属性，并发出场景变动的消息。
}
*/
  replace:function(oldSprite,newSprite)
  {

    oldSprite.parent()._replaceChild(oldSprite,newSprite);

    addremoveEvent.type = "removeActor";
    addremoveEvent.actor = oldSprite;
    this.notify("system", addremoveEvent); 

    addremoveEvent.type = "addActor";
    addremoveEvent.actor = newSprite;
    this.notify("system", addremoveEvent);

    PublicActiveEvent.scene = this;
    newSprite.forEach(foreachActiveFun);

    

    return oldSprite;
  },

/**
@method[removeAllActors]{
  @trait[TreeSceneTrait]
  @return[this]{}
  删除场景中所有的精灵。
}
*/
  removeAllActors:function()
  {
    var root = this._t.root();

    root.removeAllChildren();

    return this;
  },
  
/**
@method[isActorInScene]{
  @trait[TreeSceneTrait]
  @param[actor Sprite]{}
  @return[boolean]{}
  询问某个精灵是否处于场景中。
}
*/
  isActorInScene:function(n)
  {
    var root = this._t.root();
    var bIn = false;

    if (!root)
      return false;

    return root.some(
                     function(n1)
                     {
                       return n1 == n;
                     });
  },

  filt:function(container, filter)
  {
    return this._t.root().serializeChildren(container, filter);
  },

  forEachActor : function(cb)
  {
    this._t.root().forEach(cb);
  },

  emitDisplayObjects : function(displayObjs)
  {
    gDisplayObjs = displayObjs;
    this.forEachActor(emitDisplayObjectsFun);
    
    return this.minBoundingDirtyRect();
  },

  requestInteractiveObjects : function(decider, interactiveObjs, evtType)
  {
    gDecider = decider;
    gInteractiveObjs = interactiveObjs;
    gEvtType = evtType;
    this._t.root().reduceChildren(requestInteractionReduceFunction);
  }
  
}, ["root", "owner", "reduceFunction"]);

/**
@iclass[TreeScene Scene (TreeSceneTrait)]{
  TreeScene：树状场景管理器类，被加入到TreeScene中的精灵将会以树状结构进行管理。
}
*/
var TreeScene = Scene.extend({
  initialize : function(param)
  {
    this.execProto("initialize", param);
    this.subTraits(0).__init(param);
  },

  update : function(t, dt)
  {
    this.subTraits(0).__update(t, dt);
  }
}, [], [TreeSceneTrait]);

export$({
  SceneTrait:SceneTrait,
  Scene:Scene,
  TreeSceneTrait:TreeSceneTrait,
  TreeScene:TreeScene
});
};
__modules__["/pathelement.js"] = function(require, load, export$) {
var colortraits = require("./lib/colortraits")
,   geo = require("./lib/geometry")
,   util = require("./lib/util")
,   pathelenP = require("./lib/pathlenprocess");

//var arrayForEach = util.arrayForEach;
var arraySome = util.arraySome;
var arrayFilter = util.arrayFilter;
var READONLY = colortraits.READONLY;
var Trait = colortraits.Trait;
var Klass = colortraits.Klass;


var minusVector = {x: -1, y: 0};

/**
@section{概述}
本模块实现了path子路径的模块：PathGPrim包含的绘图子类型。
这里包含的类型主要包括四种：直线，二次贝塞尔曲线，三次贝塞尔曲线，椭圆弧线(当椭圆长短轴半径相等时为圆弧)。
针对gprim中PathGPrim提供了绘制的路径。
*/
/**
@itrait[MoveToTrait]{
  代表path上中移动到一个起始点的功能单元。
}
**/
/**
@property[point object]{
  @trait[MoveToTrait]
  path的起始点.{x: x, y: y}。
}
*/
/**
@property[type string #:def "M" #:attr 'READONLY]{
  @trait[MoveToTrait]
  path路径的类型。
}
*/
var MoveToTrait = Trait.extend({
  __init: function(param)
  {
    this._t.settype("M");
    this._t.setpoint(param.point); 

    this._t.setlength(undefined);  
  },
  bboxPoint: function()
  {
    return [this.point()];
  },
  localHook: function(cb)
  {
    this.hook(this._t, "point", cb, "b");
    this.hook(this._t, "point", cb, "a");
  },
  unlocalHook: function(cb)
  {
    this.unhook(this._t, "point", cb, "b");
    this.unhook(this._t, "point", cb, "a");
  },
  clearLengthCache: function()
  {
    this._t.setlength(undefined);
  },
  length: function(prepoint)
  {   
    return 0;
  },
  pointAtPercent: function(t, prepoint)
  {
    return this._t.point();
  }
},
  ["type", "point", "length"]);

/**
@itrait[LineToTrait]{
  代表path上从当前点到此点绘制一条直线的功能单元.
}
**/
/**
@property[point object]{
  @trait[LineToTrait]
  path的移动到的点.{x: x, y: y}。
}
*/
/**
@property[type string #:def "L" #:attr 'READONLY]{
  @trait[LineToTrait]
  此段path路径的类型。
}
*/
var LineToTrait = Trait.extend({
  __init: function(param)
  {
    this._t.settype("L");
    this._t.setpoint(param.point);

    this._t.setlength(undefined);
  },
  bboxPoint: function()
  {
    return [this.point()];
  },
  isPointIn: function(prepoint, endpoint, x, y, lineWidth, rERROR)
  {
  //先让转换为开始点和结束点平行的，避免宽度在斜的角度下的问题
    return geo.isPointInLine(prepoint, endpoint, x, y, lineWidth, rERROR);                                     
  },
  localHook: function(cb)
  {
    this.hook(this._t, "point", cb, "b");
    this.hook(this._t, "point", cb, "a");
  },
  unlocalHook: function(cb)
  {
    this.unhook(this._t, "point", cb, "b");
    this.unhook(this._t, "point", cb, "a");
  },
  clearLengthCache: function()
  {
    this._t.setlength(undefined);
  },
  length: function(prepoint)
  {
    var len = this._t.length();
    if(len == undefined){
      len = pathelenP.LineLength(prepoint, this._t.point());
      this._t.setlength(len);
    } 
    return len;
  },
  pointAtPercent: function(t, prepoint)
  {
    return pathelenP.PointAtLine(t, prepoint, this._t.point());
  }                                   
},
  ["point", "type", "length"]);

/**
@itrait[QuadraticCurveTrait]{
  代表从当前点绘制一条二次贝塞尔曲线
}
**/
/**
@property[controlpoint object]{
  @trait[QuadraticCurveTrait]
  path的二次贝塞尔曲线的控制点.{x: x, y: y}。
}
*/
/**
@property[point object]{
  @trait[QuadraticCurveTrait]
  path的二次贝塞尔曲线的终点.{x: x, y: y}。
}
*/
/**
@property[type string #:def "Q" #:attr 'READONLY]{
  @trait[QuadraticCurveTrait]
  此段path路径的类型。
}
*/
var QuadraticCurveTrait = Trait.extend({
  __init: function(param)
  {
    this._t.settype("Q");
    this._t.setpoint(param.point);
    this._t.setcontrolpoint(param.controlpoint);

    this._t.setlength(undefined);                                    
  },
  bboxPoint: function()
  {
    return [this.controlpoint(), this.point()];
  },
  isPointIn: function(prepoint, endpoint, x, y, lineWidth, rERROR)
  {
    var p = {x: x, y: y};
    var matrix = geo.coordinateSysChange(prepoint, endpoint);
    var localPstn = geo.pointApplyMatrix(p, matrix);
    prepoint = geo.pointApplyMatrix(prepoint, matrix);
    endpoint = {x: 0, y: 0};
    var controlpoint = geo.pointApplyMatrix(this.controlpoint(), matrix);

    var a = prepoint.x - 2*controlpoint.x + endpoint.x;
    var b = 2 * controlpoint.x - 2 * prepoint.x;
    var c = prepoint.x - localPstn.x;

    var endt = geo.quadraticResolve(a, b, c);
    return arraySome(endt, function(item)
                          {
                            if(item >= 0 && item <= 1){
                              var evaluate_y = (1 - item)*(1- item)*prepoint.y + 2*item*(1-item)* controlpoint.y+ item*item*endpoint.y;
                              if(Math.abs(localPstn.y - evaluate_y) <= (lineWidth/2 + rERROR)){                                            
                                return true;
                              } else {
                                return false;
                              }
                            }
                          });                                    
  },
  localHook: function(cb)
  {
    this.hookMany(this._t, ["controlpoint", "point"], cb, "b");
    this.hookMany(this._t, ["controlpoint", "point"], cb, "a");
  },
  unlocalHook: function(cb)
  {
    this.unhookMany(this._t, ["controlpoint", "point"], cb, "b");
    this.unhookMany(this._t, ["controlpoint", "point"], cb, "a");
  },
  clearLengthCache: function()
  {
    this._t.setlength(undefined);
  },
  length: function(prepoint)
  {
    var len = this._t.length();
    if(len == undefined){
      var cArray = pathelenP.q2c(prepoint, this._t.controlpoint(), this._t.point());
      this._t.setbezierPoints(cArray);
      len = pathelenP.CubicBezierLength(cArray);
      this._t.setlength(len);
    } 
    return len;
  },
  pointAtPercent: function(t, prepoint)
  {
    return pathelenP.PointAtBezier(t, this._t.bezierPoints());
  }
},
  ["point", "controlpoint", "type", "length", "bezierPoints"]);

/**
@itrait[BezierCurveTrait]{
  代表path上从当前点绘制一条三次贝塞尔曲线。
}
**/
/**
@property[controlpoint1 object]{
  @trait[BezierCurveTrait]
  path的三次贝塞尔曲线的控制点1.{x: x, y: y}。
}
*/
/**
@property[controlpoint2 object]{
  @trait[BezierCurveTrait]
  path的三次贝塞尔曲线的控制点2.{x: x, y: y}。
}
*/
/**
@property[point object]{
  @trait[BezierCurveTrait]
  path的三次贝塞尔曲线的终点.{x: x, y: y}。
}
*/
/**
@property[type string #:def "C" #:attr 'READONLY]{
  @trait[BezierCurveTrait]
  此段path路径的类型。
}
*/
var BezierCurveTrait = Trait.extend({
  __init: function(param)
  {
    this._t.settype("C");
    this._t.setpoint(param.point);
    this._t.setcontrolpoint1(param.controlpoint1);
    this._t.setcontrolpoint2(param.controlpoint2);

    this._t.setlength(undefined);
  },
  bboxPoint: function()
  {
    return [this.controlpoint1(), this.controlpoint2(), this.point()];
  },
  isPointIn: function(prepoint, endpoint, x, y, lineWidth, rERROR)
  {
    var p = {x: x, y: y};
    var matrix = geo.coordinateSysChange(prepoint, endpoint);
    var localPstn = geo.pointApplyMatrix(p, matrix);
    prepoint = geo.pointApplyMatrix(prepoint, matrix);
    endpoint = {x: 0, y: 0};
    var controlpoint1 = geo.pointApplyMatrix(this.controlpoint1(), matrix);
    var controlpoint2 = geo.pointApplyMatrix(this.controlpoint2(), matrix);

    var a = (-prepoint.x) + 3*controlpoint1.x - 3*controlpoint2.x + endpoint.x;
    var b = 3*prepoint.x - 6*controlpoint1.x + 3*controlpoint2.x;
    var c = 3*controlpoint1.x - 3*prepoint.x;
    var d = prepoint.x - localPstn.x;

    var endt = geo.cubicResolve(a, b, c, d);
    return arraySome(endt, function(item)
                          {
                            if(item >= 0 && item <= 1){
                              var evaluate_y = prepoint.y*(1-item)*(1-item)*(1-item) + 3*controlpoint1.y*item*(1-item)*(1-item) + 3*controlpoint2.y *item*item*(1-item) + endpoint.y*item*item*item;
                              if(Math.abs(localPstn.y - evaluate_y) <= (lineWidth/2 + rERROR)){                                 
                                return true;
                              } else {
                                return false;
                              }
                            }
                          });
  },
  localHook: function(cb)
  {
    this.hookMany(this._t, ["point", "controlpoint1", "controlpoint2"], cb, "b");
    this.hookMany(this._t, ["point", "controlpoint1", "controlpoint2"], cb, "a");
  },
  unlocalHook: function(cb)
  {
    this.unhookMany(this._t, ["point", "controlpoint1", "controlpoint2"], cb, "b");
    this.unhookMany(this._t, ["point", "controlpoint1", "controlpoint2"], cb, "a");
  },
  clearLengthCache: function()
  {
    this._t.setlength(undefined);
  },
  length: function(prepoint)
  {
    var len = this._t.length();
    if(len == undefined){
      var cArray = [prepoint, this._t.controlpoint1(), this._t.controlpoint2(), this._t.point()];
      len = pathelenP.CubicBezierLength(cArray);
      this._t.setlength(len);
    } 
    return len;
  },
  pointAtPercent: function(t, prepoint)
  {
    return pathelenP.PointAtBezier(t, [prepoint, this._t.controlpoint1(), this._t.controlpoint2(), this._t.point()]);
  } 
},
  ["point", "controlpoint1", "controlpoint2", "type", "length", "bezierPoints"]);

/**
@itrait[EllipseToTrait]{
  代表从当前点绘制椭圆弧曲线
  如果起始点等于终点, 则表示没有绘制任何弧; 如果rx=ry = 0,则默认绘制为直线; 如果rx或者ry<0,则用其绝对值代替;
  如果rx/ry/x-axis-rotate三者构成的椭圆,大小不能满足达到起始点和终点, 那么会等比缩放变大知道满足;
  x-axis-rotate会通过360求取mode;
  任何large-arc-flag/sweep-flag非0的值都被默认为是1;
}
**/
/**
@property[point object]{
  @trait[EllipseToTrait]
  path弧线的终点.{x: x, y: y}。
}
*/
/**
@property[rx number]{
  @trait[EllipseToTrait]
  弧的x方向的半长轴。
}
*/
/**
@property[ry number]{
  @trait[EllipseToTrait]
  弧的y方向的半长轴。
}
*/
/**
@property[xaxisrotate number]{
  @trait[EllipseToTrait]
  弧度，当前标准椭圆x轴绕当前坐标系x轴旋转的弧度,the x-axis of the ellipse is rotated by x-axis-rotation relative to the x-axis of the current coordinate system.
}
*/
/**
@property[largearcflag number]{
  @trait[EllipseToTrait]
  等于1为大的弧度>PI, 等于0为小的弧度0<=角度<=PI , 若大于0为1，小于等于0为0。
}
*/
/**
@property[sweepflag number]{
  @trait[EllipseToTrait]
  等于1顺时针角度增加的方向，等于0逆时针角度减少的方向, 若大于0为1，小于等于0为0。
}
*/
/**
@property[type string #:def "A" #:attr 'READONLY]{
  @trait[EllipseToTrait]
  此段path路径的类型。
}
*/
var EllipseToTrait = Trait.extend({
  __init: function(param)
  {
    this._t.settype("A");
    this._t.setpoint(param.point);
    this._t.setrx(param.rx);
    this._t.setry(param.ry);
    this._t.setxaxisrotate(param.xaxisrotate);
    this._t.setlargearcflag((param.largearcflag > 0) ? 1 : 0);
    this._t.setsweepflag((param.sweepflag > 0) ? 1 : 0);

    this._t.setlength(undefined);
  },
  ellipseCenterAngle: function(point1)
  {
    var point2 = this.point();
    var rx = this.rx();
    var ry = this.ry();
    if(rx == 0 || ry == 0)//(point1.x == point2.x && point1.y == point2.y)
    {
      return false;              
    }

    var subpp = {x: (point1.x - point2.x)/2, y: (point1.y - point2.y)/2};
    var addpp = {x: (point1.x + point2.x)/2, y: (point1.y + point2.y)/2};
    var matrix = geo.identityMatrix();
    geo.matrixRotateBy(matrix, this.xaxisrotate());
    var invertmatrix = geo.matrixInvert(matrix);
    var xypie = geo.pointApplyMatrix(subpp, invertmatrix);

    var distance = xypie.x*xypie.x/(rx*rx) + xypie.y*xypie.y/(ry*ry);
    if(distance > 1){
      rx = Math.sqrt(distance)*rx;
      ry = Math.sqrt(distance)*ry;
    }

    var temp = (rx*rx*ry*ry - rx*rx*xypie.y*xypie.y - ry*ry*xypie.x*xypie.x)/(rx*rx*xypie.y*xypie.y + ry*ry*xypie.x*xypie.x);
    temp = Math.abs(temp);
    temp = Math.sqrt(temp);
    var centerpie;
    if(this.largearcflag() == this.sweepflag()) {
      centerpie = {x: (-temp)*rx*xypie.y/ry, y: (-temp)*(-ry)*xypie.x/rx};
    } else {
      centerpie = {x: temp*rx*xypie.y/ry, y: temp*(-ry)*xypie.x/rx};
    }

    var center = geo.pointAdd(geo.pointApplyMatrix(centerpie, matrix), addpp);
    var v1 = {x: 1, y: 0};
    var startAngle = geo.getVectorAngle(v1, {x: (xypie.x - centerpie.x)/rx, y: (xypie.y - centerpie.y)/ry});
    var detangle = geo.getVectorAngle({x: (xypie.x - centerpie.x)/rx, y: (xypie.y - centerpie.y)/ry}, {x: ((-xypie.x) - centerpie.x)/rx, y: ((-xypie.y) - centerpie.y)/ry});
    if(this.sweepflag() == 0){
      detangle = detangle - 2*Math.PI;
    }

    this.setcenter(center);
    this.setstartAngle(startAngle);
    this.setendAngle(startAngle + detangle);
    this.setrx(rx);
    this.setry(ry);

    return true;    
  },
  bboxPoint: function()
  {
    //这里会产生临时对象
    if(this.rx() == 0 || this.ry() == 0)
      return [this.point()];
    var radius = Math.max(this.rx(), this.ry());
    var center = this.center();
    var vertex1 = {x: center.x + radius, y: center.y}; 
    var vertex2 = {x: center.x, y: center.y + radius};
    var vertex3 = {x: center.x - radius, y: center.y};
    var vertex4 = {x: center.x, y: center.y - radius};
    return [vertex1, vertex2, vertex3, vertex4];
  },
  isPointIn: function(prepoint, endpoint, x, y, lineWidth, rERROR)
  {
    //三个点全部影视到原点，然后求其与原点的三个夹角再一次计算是否在内部，抛开椭圆
    if(this.rx() == 0 || this.ry() == 0){
      return geo.isPointInLine(prepoint, endpoint, x, y, lineWidth, rERROR); 
    }
    var center = this.center();
    var matrix = geo.identityMatrix(); //
    geo.matrixTranslateBy(matrix, center.x, center.y);
    geo.matrixRotateBy(matrix, this.xaxisrotate());    
    geo.matrixInvertBy(matrix);
    // //
    var newpoint = geo.pointApplyMatrix({x: x, y: y}, matrix);
    var newendpoint = geo.pointApplyMatrix(endpoint, matrix);
    var newprepoint = geo.pointApplyMatrix(prepoint, matrix);

    var endangle = geo.getVectorAngle(newprepoint, newendpoint);
    var angle = geo.getVectorAngle(newprepoint, newpoint);

    if((this.sweepflag() == 0 && (angle >= endangle)) || (this.sweepflag() == 1 && (angle < endangle))){
      var distance = newpoint.x*newpoint.x/(this.rx()*this.rx()) + newpoint.y*newpoint.y/(this.ry()*this.ry());
      var k = Math.sqrt(distance);
      if(k !== 0)
        distance = ((1-k)/k)*((1-k)/k)*(newpoint.x*newpoint.x + newpoint.y*newpoint.y);
      else {
        distance = distance -1;
      } 
      if(Math.sqrt(distance) < lineWidth/2+ rERROR)
        return true; 
    } 
    return false;
  },
  localHook: function(cb)
  {
    this.hookMany(this._t, ["point", "rx", "ry", "xaxisrotate", "largearcflag", "sweepflag",
                           "center", "startAngle", "endAngle"], cb, "b");
    this.hookMany(this._t, ["point", "rx", "ry", "xaxisrotate", "largearcflag", "sweepflag",
                            "center", "startAngle", "endAngle"], cb, "a");
  },
  unlocalHook: function(cb)
  {
    this.unhookMany(this._t, ["point", "rx", "ry", "xaxisrotate", "largearcflag", "sweepflag",
                           "center", "startAngle", "endAngle"], cb, "b");
    this.unhookMany(this._t, ["point", "rx", "ry", "xaxisrotate", "largearcflag", "sweepflag",
                            "center", "startAngle", "endAngle"], cb, "a");
  },
  clearLengthCache: function()
  {
    this._t.setlength(undefined);
  },
  length: function(prepoint)
  {
    var len = this._t.length();
    if(len == undefined){
      len = 0;
      var stPoint = {x: prepoint.x, y: prepoint.y};
      var point = this._t.point();
      var endPoint = {x: point.x, y: point.y};
      pathelenP.EllipseArcStandard(this._t.center(), this._t.xaxisrotate(), stPoint, endPoint);
      var curves = new Array();
      var count = pathelenP.a2c({x: 0, y: 0}, this._t.rx(), this._t.ry(), this._t.startAngle(),  this._t.endAngle() - this._t.startAngle(), stPoint, endPoint, curves);
      var cArray = [stPoint]; 

      this._t.setbezierPoints(cArray.concat(curves));

      var temp, childlen = [];
      for(var j = 0; j < count; j+=3)
      {
        cArray = cArray.slice(cArray.length - 1).concat(curves[j], curves[j+1], curves[j+2]); 
        var temp = pathelenP.CubicBezierLength(cArray);
        len += temp;
        childlen.push(temp);
      } 
      this._t.setbezierLength(childlen);    
      this._t.setlength(len);
    } 
    return len;        
  },
  pointAtPercent: function(t, prepoint)
  {
    var bezierPs =  this._t.bezierPoints();
    var bezierlen = this._t.bezierLength();
    var prelen = 0;
    var alllength = this._t.length();
    for(var j = 0, length =  bezierPs.length; j <length -1; j+=3){
      prelen += bezierlen[j/3];
      if(prelen >= alllength*t) {
        prelen -= bezierlen[j/3];
        var newt = (alllength * t - prelen) / bezierlen[j/3];
        var cArray = bezierPs.slice(j, j+4);
        var p = pathelenP.PointAtBezier(newt, cArray);

        pathelenP.PointApplyEllipse(p, this._t.center(), this._t.xaxisrotate());
        return p;
      }
    }
    
  }
},
  ["point", "rx", "ry", "xaxisrotate", "largearcflag", "sweepflag",
   "center", "startAngle", "endAngle", "type", "length", "bezierPoints", "bezierLength"]);

/**
@itrait[ClosePathTrait]{
  代表path路径闭合
}
**/
/**
@property[type string #:def "Z" #:attr 'READONLY]{
  @trait[ClosePathTrait]
  此段path路径的类型。
}
*/
var originP = {x: 0, y: 0};
var ClosePathTrait = Trait.extend({
  __init: function(param)
  {
    this._t.settype("Z");
    this._t.setpoint(originP);

    this._t.setlength(undefined);
  },
  bboxPoint: function()
  {
    return [];
  },
  isPointIn: function(prepoint, endpoint, x, y, lineWidth, rERROR)
  {
    return geo.isPointInLine(prepoint, endpoint, x, y, lineWidth, rERROR); 
  },
  localHook: function(cb)
  {    
  },
  unlocalHook: function(cb)
  {
  },
  clearLengthCache: function()
  {
    this._t.setlength(undefined);
  },
  length: function(prepoint, endpoint)
  {
    var len = this._t.length();
    if(len == undefined){
      len = pathelenP.LineLength(prepoint, endpoint);     
      this._t.setlength(len);
    } 
    return len;        
  },
  pointAtPercent: function(t, prepoint, endpoint)
  {
    return pathelenP.PointAtLine(t, prepoint, endpoint);
  }
},
  ["point", "type", "length"]);

/**
@iclass[MoveToElement Klass (MoveToTrait)]{
  在path中代表移动到起始点。
  @grant[MoveToTrait type point]
  @constructor[MoveToElement]{
    @param[param object]{
      @verbatim|{
        初始化参数对象包含的属性可以为：
        point：{x: x, y: y}, path的起始点.(必须有)。
      }|
    }
  }
}
**/
var MoveToElement = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize");
    this.subTraits(0).__init(param);
  }
},
  [[READONLY("type"), MoveToTrait.grant("type")] , ["point", MoveToTrait.grant("point")]],
  [MoveToTrait]);
/**
@iclass[LineToElement Klass (LineToTrait)]{
  在path中代表移动到一个点，绘制一条直线。
  @grant[LineToTrait type point]
  @constructor[LineToElement]{
    @param[param object]{
      @verbatim|{
        初始化参数对象包含的属性可以为：
        point：{x: x, y: y}, path的line到一个点.(必须有)。
      }|
    }
  }
}
**/
var LineToElement = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize");
    this.subTraits(0).__init(param);
  }                                     
},
  [["point", LineToTrait.grant("point")], [READONLY("type"), LineToTrait.grant("type")]],
  [LineToTrait]);

/**
@iclass[QuadraticCurveElement Klass (QuadraticCurveTrait)]{
  在path中代表绘制一条二次贝塞尔曲线。
  @grant[QuadraticCurveTrait type point controlpoint]
  @constructor[QuadraticCurveElement]{
    @param[param object]{
      @verbatim|{
        初始化参数对象包含的属性可以为：
        controlpoint：{x: x, y: y}, 二次贝塞尔曲线的控制点.(必须有)。
        point：{x: x, y: y}, 二次贝塞尔曲线的终点.(必须有)。
      }|
    }
  }
}
**/
var QCurveElement = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize");
    this.subTraits(0).__init(param);                                 
  } 
},
 [[READONLY("type"), QuadraticCurveTrait.grant("type")]].concat(QuadraticCurveTrait.grantMany(["point", "controlpoint"])),
 [QuadraticCurveTrait]);

/**
@iclass[BezierCurveElement Klass (BezierCurveTrait)]{
  在path中代表绘制一条三次贝塞尔曲线
  @grant[BezierCurveTrait type point controlpoint1 controlpoint2]
  @constructor[BezierCurveElement]{
    @param[param object]{
      @verbatim|{
        初始化参数对象包含的属性可以为：
        controlpoint1：{x: x, y: y}, 三次贝塞尔曲线的控制点2.(必须有)。
        controlpoint2: {x: x, y: y}, path的三次贝塞尔曲线的控制点2.(必须有)。
        point：{x: x, y: y}, 三次贝塞尔曲线的终点.(必须有)。
      }|
    }
  }
}
**/
var BezierCurveElement = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize");
    this.subTraits(0).__init(param);
  }
},
  [[READONLY("type"), BezierCurveTrait.grant("type")]].concat(BezierCurveTrait.grantMany(["point", "controlpoint1", "controlpoint2"])),
  [BezierCurveTrait]);


/**
@iclass[EllipseToElement Klass (EllipseToTrait)]{
  在path中代表绘制椭圆弧曲线
  如果起始点等于终点, 则表示没有绘制任何弧; 如果rx=ry = 0,则默认绘制为直线; 如果rx或者ry<0,则用其绝对值代替;
  如果rx/ry/x-axis-rotate三者构成的椭圆,大小不能满足达到起始点和终点, 那么会等比缩放变大知道满足;
  x-axis-rotate会通过360求取mode
  任何large-arc-flag/sweep-flag非0的值都被默认为是1  
  @grant[EllipseToTrait type point rx ry xaxisrotate largearcflag sweepflag]
  @constructor[EllipseToElement]{
    @param[param object]{
      @verbatim|{
        初始化参数对象包含的属性可以为：
        point: {x: x, y: y}, 弧的的终点.(必须有)。
        rx: number, 弧的x方向的半长轴.(必须有)。
        ry: number, 弧的y方向的半长轴.(必须有)。
        xaxisrotate, 弧度，当前标准椭圆x轴绕当前坐标系x轴旋转的弧度,the x-axis of the ellipse is rotated by x-axis-rotation relative to the x-axis of the current coordinate system.(必须有)。
        largearcflag, 为1为大的弧度>180, 为0为小的弧度0<=角度<=180.(必须有)。
        sweepflag: 为1顺时针角度增加的方向，为0逆时针角度减少的方向.(必须有)。          
      }|
    }
  }
}
**/
var EllipseToElement = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize", param);
    this.subTraits(0).__init(param);
  }
},
  [[READONLY("type"), EllipseToTrait.grant("type")]].concat(EllipseToTrait.grantMany(["point", "rx", "ry", "xaxisrotate", "largearcflag", "sweepflag",
         "center", "startAngle", "endAngle"])),
  [EllipseToTrait]);

/**
@iclass[ClosePathElement Klass (ClosePathTrait)]{
  代表path闭合
  @grant[ClosePathTrait type]
}
**/
var ClosePathElement = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize");
    this.subTraits(0).__init(param);
  }
},
  [["point", ClosePathTrait.grant("point")], [READONLY("type"), ClosePathTrait.grant("type")]],
  [ClosePathTrait]);


///////////////////////////////////Turtle/////////////////////////////
/*
@iclass[TurtleToward Klass (LineToTrait)]{
  代表在当前坐标系下，旋转eangle，然后走distance，有如下属性：
  {angle: number, 当前坐标系下旋转angle角度}
  {distance: number, 在当前位置当前方向, 走distance距离}
}
*/
var TurtleToward = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize");
    this.subTraits(0).__init(param);
    this.setangle((param.angle == undefined) ? 0 : param.angle);
    this.setpoint({x: param.distance, y: 0});

  }
},
 ["angle", [READONLY("type"), LineToTrait.grant("type")], ["point", LineToTrait.grant("point")]],
 [LineToTrait]);

/*
@iclass[TurtleQCurve Klass (QCurveElement)]{
  代表在当前坐标系下, 绘制一条二次贝塞尔曲线，有如下属性：
  {angle: number, 当前坐标系下旋转的角度}
  {point: {x: x, y: y}, path的二次贝塞尔曲线的终点}
  {controlpoint: {x: x, y: y}, path的二次贝塞尔曲线的控制点}
}
**/
var TurtleQCurve = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize");
    this.subTraits(0).__init(param);
    this.setangle((param.angle == undefined) ? 0 : param.angle);
  }
},
 ["angle", [READONLY("type"), QuadraticCurveTrait.grant("type")]].concat(QuadraticCurveTrait.grantMany(["point", "controlpoint"])),
 [QuadraticCurveTrait]);

/*
@iclass[TurtleBezierCurve Klass (BezierCurveTrait)]{
  代表在当前坐标系下, 绘制一条三次贝塞尔曲线, 有如下属性：
  {angle: number, 当前坐标系下旋转的角度}
  {point: {x: x, y: y}, path的三次贝塞尔曲线的终点}
  {controlpoint1: {x: x, y: y}, path的三次贝塞尔曲线的控制点1}
  {controlpoint2: {x: x, y: y}, path的三次贝塞尔曲线的控制点2}
}
**/
var TurtleBezierCurve = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize", param);
    this.subTraits(0).__init(param);
    this.setangle((param.angle == undefined) ? 0 : param.angle);
  }
},
 ["angle", [READONLY("type"), BezierCurveTrait.grant("type")]].concat(BezierCurveTrait.grantMany(["point", "controlpoint1", "controlpoint2"])),
 [BezierCurveTrait]);

/*
@iclass[TurtleEllipseTo Klass (LineToTrait)]{
  代表在当前坐标系下，旋转angle，然后绘制椭圆弧，有如下属性：
  {angle: number, 当前坐标系下旋转angle角度}
  {point: {x: x, y: y}, 当前坐标系弧的的终点}
  {rx: number, 弧的x方向的半长轴}
  {ry: number, 弧的y方向的半长轴}
  {xaxisrotate, 弧度，当前标准椭圆x轴绕当前坐标系x轴旋转的弧度,the x-axis of the ellipse is rotated by x-axis-rotation relative to the x-axis of the current coordinate system.}
  {largearcflag, 为1为大的弧度>180, 为0为小的弧度0<=角度<=180}
  {sweepflag: 为1顺时针角度增加的方向，为0逆时针角度减少的方向}
  如果起始点等于终点, 则表示没有绘制任何弧; 如果rx=ry = 0,则默认绘制为直线; 如果rx或者ry<0,则用其绝对值代替;
  如果rx/ry/x-axis-rotate三者构成的椭圆,大小不能满足达到起始点和终点, 那么会等比缩放变大知道满足;
  x-axis-rotate会通过360求取mode
  任何large-arc-flag/sweep-flag非0的值都被默认为是1
}
**/
var TurtleEllipseTo = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize");
    this.subTraits(0).__init(param);
    this.setangle((param.angle == undefined) ? 0 : param.angle);
  }
},
 ["angle", [READONLY("type"), EllipseToTrait.grant("type")]].concat(EllipseToTrait.grantMany(["point", "rx", "ry", "xaxisrotate", "largearcflag", "sweepflag",
   "center", "startAngle", "endAngle"])),
 [EllipseToTrait])
/*
@iclass[TurtleClosePath Klass (ClosePathTrait)]{
  代表在当前坐标系下,回到出发点
}
**/
var TurtleClosePath = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize", param);
    this.subTraits(0).__init(param);
    this.setangle((param.angle == undefined) ? 0 : param.angle);
  }
},
 ["angle", ["point", ClosePathTrait.grant("point")], [READONLY("type"), ClosePathTrait.grant("type")]],
 [ClosePathTrait]);

var PathCreat = {
  M: function(item)
  {
    return MoveToElement.create({point: {x: item[1], y: item[2]}});
  },
  L: function(item)
  {
    return LineToElement.create({point: {x: item[1], y: item[2]}});
  },
  Q: function(item)
  {
    return QCurveElement.create({controlpoint: {x: item[1], y: item[2]}, point: {x: item[3], y: item[4]}});
  },
  C: function(item)
  {
    return BezierCurveElement.create({controlpoint1: {x: item[1], y: item[2]}, controlpoint2: {x: item[3], y: item[4]}, point:{x: item[5], y: item[6]}});
  },
  A: function(item)
  {
    return EllipseToElement.create({rx: item[1], ry: item[2], xaxisrotate: item[3], largearcflag: item[4], sweepflag: item[5], point: {x: item[6], y: item[7]}});
  },
  Z: function(item)
  {
    return ClosePathElement.create();
  }
}

var PropertytoSet = {
  point: "setpoint",
  controlpoint: "setcontrolpoint",
  controlpoint1: "setcontrolpoint1",
  controlpoint2: "setcontrolpoint2",
  rx: "setrx",
  ry: "setry",
  xaxisrotate: "setxaxisrotate",
  largearcflag: "setlargearcflag",
  sweepflag: "setsweepflag"
}

export$({
  PathCreat:PathCreat,
  PropertytoSet:PropertytoSet
});


};
__modules__["/gprims/textgprim.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits")
,   helper = require("../lib/helper")
,   ShapTrait = require("./shaptrait").ShapTrait
,   geo = require("../lib/geometry");


var Klass = colortraits.Klass;
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;


/**
@itrait[TextTrait]{
  @extend[ShapTrait]{
  }
  TextTrait实现了文本图元的基本功能。
  @traitGrantMany[ShapTrait type strokeStyle strokeFlag id tag fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY #:trait TextTrait]    
}
*/
/**
@property[text string #:def "A"]{
  @trait[TextTrait]
  显示文本。
}
*/
/**
@property[font object #:def "{style: \"normal\", weight: 400, size: 16, family: \"Arial\"}"]{
  @trait[TextTrait]
  文本的字体类型。可以设置属性为style、weight、size、family的组合(可少选)构成的对象。
  属性取值为：
  style: "noraml"、"italic"、"oblique".
  weight:100、200、300、400、500、600、700、800、900
  size:number以px计
  family:字体系列
}
*/
var defaultText = {text: "A"};
var TextTrait = ShapTrait.extend({
  __init: function(param)
  {
    this.subTraits(0).__init(param);
    if(param == undefined)
      param = defaultText;
    this._t.settext((param.text == undefined) ? "" : param.text);
    this._t.settype("text");
    this.setfont((param.font == undefined) ? {} : param.font);

  },
/**
@method[setfont]{
  @trait[TextTrait]
  @param[font object]{例如：{weight: 500, size: 20}}
  @return[this]{}
  设置文本字体属性。可以设置属性为style、weight、size、family的组合构成的对象。
}
*/
  setfont: function(font)
  {
    this._t.cache().bbox = undefined;
    this._t.setfont(font);
    this._t.font().style = (font.style == undefined) ? "normal" : font.style;
    this._t.font().weight = (font.weight == undefined) ? 400 : font.weight;
    this._t.font().size = (font.size == undefined) ? 16 : font.size;
    this._t.font().family = (font.family == undefined) ? "Arial" : font.family;

    this._t.setfontString(helper.fontToString(this._t.font()));
  },

/** 
@method[fontString]{
 @trait[TextTrait]
 @return[string]{}
 以字符串形式获取当前文本的font。
}
*/
  fontString: function()
  {
    return this._t.fontString();
  },
/**
@method[settext]{
 @trait[TextTrait]
 @param[text string]{
 文本的内容。
 }
 @return[this]{}
 设置文本的内容。
}
*/
  settext: function(text)
  {
    this._t.cache().bbox = undefined;
    this._t.settext(text);
    return this;
  },
  localBbox: function()
  {
    var str = this._t.text();
    var font = this._t.font();
    var h = font.size;
    var w = helper.measureText(str, font).width;    
    return geo.rectMake(0, 0, w, h); 
  },

  localInside: function(x, y)
  {
    var str = this._t.text();
    var font = this._t.font();
    var h = font.size;
    var w = helper.measureText(str, font).width;
    if(x > 0 && x < w && y > 0 && y < h){
      return true;
    }
    return false;        
  },
  localHook: function(cb)
  {
    this.hookMany(this._t, ["strokeStyle", "strokeFlag", "fillFlag", "text", "font", 
                            "fillStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "anchorPoint"], cb, "a");
  },
  unlocalHook: function(cb)
  {

    this.unhookMany(this._t, ["strokeStyle", "strokeFlag", "fillFlag", "text", "font", 
                            "fillStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "anchorPoint"], cb, "a");   
  }
},
["text", "font", "fontString"].concat(ShapTrait.grantMany(["strokeStyle", "strokeFlag", "fillFlag", "cache", "type", "id", "tag", "fillStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "anchorPoint"]))   
);

/**
@iclass[TextKlass Klass (TextTrait)]{
  文本图元。
  @grant[TextTrait type string #:attr 'READONLY]
  @grant[TextTrait text string #:attr 'CUSTOM_SETTER]
  @grant[TextTrait font string #:attr 'CUSTOM_SETTER]
  @grantMany[TextTrait strokeStyle strokeFlag id tag fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY]
}
**/
/**
@property[ratioAnchor object #:def "{ratiox: 0, ratioy: 0}"]{
  @class[TextKlass]
  图元左上角到图元锚点的距离与未经矩阵变换的图元的宽高比组成的对象。
}
*/
/**
@property[anchor object #:def "{x: 0, y: 0}"]{
  @class[TextKlass]
  图元锚点在local坐标系下的位置。
}
*/
var TextKlass = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize");
    this.subTraits(0).__init(param);
  }
},
 [[READONLY("type"), TextTrait.grant("type")], [CUSTOM_SETTER("text"), TextTrait.grant("text")], 
  [CUSTOM_SETTER("font"), TextTrait.grant("font")], [CUSTOM_SETTER("strokeStyle"), TextTrait.grant("strokeStyle")],
  [CUSTOM_SETTER("fillStyle"), TextTrait.grant("fillStyle")], [CUSTOM_SETTER("shadowColor"), TextTrait.grant("shadowColor")]].concat(
  TextTrait.grantMany(["strokeFlag", "fillFlag", "id", "tag", "shadowBlur", "shadowOffsetX", "shadowOffsetY"])),
 [TextTrait]
);

export$({
  TextTrait : TextTrait,
  TextKlass : TextKlass
});
};
__modules__["/lib/debug.js"] = function(require, load, export$) {
var debug = {
  log: function(s)
  {
    console.log(s);
  },      
  
  warning: function(s)
  {
    console.log('!!!WARNING!!!-->' + s + '<-- ');
  },
  
  error: function(s){
    console.log('!!!ERROR!!!-->' + s + '<-- ');
  },
  
  assert : function(exp,msg)
  {
    if (exp)
    {
      return true;
    }
    else
    {
      var theMsg = msg === undefined ? "assert !!!" : msg;
      console.log("exception throwed:  " + theMsg);
      throw (theMsg);
    }
  }
};

export$(debug);

};
__modules__["/thirdlib/rx/rx.aggregates.js"] = function(require, load, export$) {
// Copyright (c) Microsoft Open Technologies, Inc. All rights reserved. See License.txt in the project root for license information.

(function (root, factory) {
    var freeExports = typeof exports == 'object' && exports,
        freeModule = typeof module == 'object' && module && module.exports == freeExports && module,
        freeGlobal = typeof global == 'object' && global;
    if (freeGlobal.global === freeGlobal) {
        window = freeGlobal;
    }

    // Because of build optimizers
    if (typeof define === 'function' && define.amd) {
        define(['rx', 'exports'], function (Rx, exports) {
            root.Rx = factory(root, exports, Rx);
            return root.Rx;
        });
    } else if (typeof module === 'object' && module && module.exports === freeExports) {
        module.exports = factory(root, module.exports, require('./rx'));
    } else {
        root.Rx = factory(root, {}, root.Rx);
    }
}(this, function (global, exp, Rx, undefined) {
    
    // References
    var Observable = Rx.Observable,
        observableProto = Observable.prototype,
        CompositeDisposable = Rx.CompositeDisposable,
        AnonymousObservable = Rx.Internals.AnonymousObservable;

    // Defaults
    var argumentOutOfRange = 'Argument out of range';
    var sequenceContainsNoElements = "Sequence contains no elements.";
    function defaultComparer(x, y) { return x === y; }
    function identity(x) { return x; }
    function subComparer(x, y) {
        if (x > y) {
            return 1;
        }
        if (x === y) {
            return 0;
        }
        return -1;
    }
    
    function extremaBy(source, keySelector, comparer) {
        return new AnonymousObservable(function (observer) {
            var hasValue = false, lastKey = null, list = [];
            return source.subscribe(function (x) {
                var comparison, key;
                try {
                    key = keySelector(x);
                } catch (ex) {
                    observer.onError(ex);
                    return;
                }
                comparison = 0;
                if (!hasValue) {
                    hasValue = true;
                    lastKey = key;
                } else {
                    try {
                        comparison = comparer(key, lastKey);
                    } catch (ex1) {
                        observer.onError(ex1);
                        return;
                    }
                }
                if (comparison > 0) {
                    lastKey = key;
                    list = [];
                }
                if (comparison >= 0) {
                    list.push(x);
                }
            }, observer.onError.bind(observer), function () {
                observer.onNext(list);
                observer.onCompleted();
            });
        });
    }

    function firstOnly(x) {
        if (x.length === 0) {
            throw new Error(sequenceContainsNoElements);
        }
        return x[0];
    }

    /**
     * Applies an accumulator function over an observable sequence, returning the result of the aggregation as a single element in the result sequence. The specified seed value is used as the initial accumulator value.
     * For aggregation behavior with incremental intermediate results, see Observable.scan.
     * 
     * @example
     * 1 - res = source.aggregate(function (acc, x) { return acc + x; });
     * 2 - res = source.aggregate(0, function (acc, x) { return acc + x; });
     * @memberOf Observable#
     * @param {Mixed} [seed] The initial accumulator value.
     * @param {Function} accumulator An accumulator function to be invoked on each element.
     * @returns {Observable} An observable sequence containing a single element with the final accumulator value.
     */
    observableProto.aggregate = function () {
        var seed, hasSeed, accumulator;
        if (arguments.length === 2) {
            seed = arguments[0];
            hasSeed = true;
            accumulator = arguments[1];
        } else {
            accumulator = arguments[0];
        }
        return hasSeed ? this.scan(seed, accumulator).startWith(seed).finalValue() : this.scan(accumulator).finalValue();
    };

    /**
     * Applies an accumulator function over an observable sequence, returning the result of the aggregation as a single element in the result sequence. The specified seed value is used as the initial accumulator value.
     * For aggregation behavior with incremental intermediate results, see Observable.scan.
     * 
     * @example
     * 1 - res = source.reduce(function (acc, x) { return acc + x; });
     * 2 - res = source.reduce(function (acc, x) { return acc + x; }, 0);
     * @memberOf Observable#
     * @param {Mixed} [seed] The initial accumulator value.
     * @param {Function} accumulator An accumulator function to be invoked on each element.
     * @returns {Observable} An observable sequence containing a single element with the final accumulator value.
     */
    observableProto.reduce = function () {
        var seed, hasSeed, accumulator = arguments[0];
        if (arguments.length === 2) {
            hasSeed = true;
            seed = arguments[1];
        } 
        return hasSeed ? this.scan(seed, accumulator).startWith(seed).finalValue() : this.scan(accumulator).finalValue();
    };    

    /**
     * Determines whether any element of an observable sequence satisfies a condition if present, else if any items are in the sequence.
     * 
     * 1 - source.any();
     * 2 - source.any(function (x) { return x > 3; });
     * @memberOf Observable#
     * @param {Function} [predicate] A function to test each element for a condition.
     * @returns {Observable} An observable sequence containing a single element determining whether any elements in the source sequence pass the test in the specified predicate if given, else if any items are in the sequence.
     */
    observableProto.any = function (predicate, thisArg) {
        var source = this;
        return predicate ? 
            source.where(predicate, thisArg).any() : 
            new AnonymousObservable(function (observer) {
                return source.subscribe(function () {
                    observer.onNext(true);
                    observer.onCompleted();
                }, observer.onError.bind(observer), function () {
                    observer.onNext(false);
                    observer.onCompleted();
                });
            });
    };
    observableProto.some = observableProto.any;

    /**
     * Determines whether an observable sequence is empty.
     *
     * @memberOf Observable#
     * @returns {Observable} An observable sequence containing a single element determining whether the source sequence is empty.
     */
    observableProto.isEmpty = function () {
        return this.any().select(function (b) { return !b; });
    };

    /**
     * Determines whether all elements of an observable sequence satisfy a condition.
     * 
     * 1 - res = source.all(function (value) { return value.length > 3; });
     * @memberOf Observable#
     * @param {Function} [predicate] A function to test each element for a condition.
     * @param {Any} [thisArg] Object to use as this when executing callback.
     * @returns {Observable} An observable sequence containing a single element determining whether all elements in the source sequence pass the test in the specified predicate.
     */
    observableProto.all = function (predicate, thisArg) {
        return this.where(function (v) {
            return !predicate(v);
        }, thisArg).any().select(function (b) {
            return !b;
        });
    };
    observableProto.every = observableProto.all;

    /**
     * Determines whether an observable sequence contains a specified element with an optional equality comparer.
     * 
     * 1 - res = source.contains(42);
     * 2 - res = source.contains({ value: 42 }, function (x, y) { return x.value === y.value; });
     * @memberOf Observable#
     * @param value The value to locate in the source sequence.</param>
     * @param {Function} [comparer] An equality comparer to compare elements.
     * @returns {Observable} An observable sequence containing a single element determining whether the source sequence contains an element that has the specified value.
     */
    observableProto.contains = function (value, comparer) {
        comparer || (comparer = defaultComparer);
        return this.where(function (v) {
            return comparer(v, value);
        }).any();
    };

    /**
     * Returns an observable sequence containing a value that represents how many elements in the specified observable sequence satisfy a condition if provided, else the count of items.
     * 
     * 1 - res = source.count();
     * 2 - res = source.count(function (x) { return x > 3; });
     * @memberOf Observable#
     * @param {Function} [predicate]A function to test each element for a condition.
     * @returns {Observable} An observable sequence containing a single element with a number that represents how many elements in the input sequence satisfy the condition in the predicate function if provided, else the count of items in the sequence.
     */
    observableProto.count = function (predicate) {
        return predicate ?
            this.where(predicate).count() :
            this.aggregate(0, function (count) {
                return count + 1;
            });
    };

    /**
     * Computes the sum of a sequence of values that are obtained by invoking an optional transform function on each element of the input sequence, else if not specified computes the sum on each item in the sequence.
     * 
     * 1 - res = source.sum();
     * 2 - res = source.sum(function (x) { return x.value; });
     * @memberOf Observable#
     * @param {Function} [selector]A transform function to apply to each element.
     * @returns {Observable} An observable sequence containing a single element with the sum of the values in the source sequence.
     */    
    observableProto.sum = function (keySelector) {
        return keySelector ? 
            this.select(keySelector).sum() :
            this.aggregate(0, function (prev, curr) {
                return prev + curr;
            });
    };

    /**
     * Returns the elements in an observable sequence with the minimum key value according to the specified comparer.
     * 
     * 1 - source.minBy(function (x) { return x.value; });
     * 2 - source.minBy(function (x) { return x.value; }, function (x, y) { return x - y; });
     * @memberOf Observable#
     * @param {Function} keySelector Key selector function.</param>
     * @param {Function} [comparer] Comparer used to compare key values.</param>
     * @returns {Observable} An observable sequence containing a list of zero or more elements that have a minimum key value.
     */  
    observableProto.minBy = function (keySelector, comparer) {
        comparer || (comparer = subComparer);
        return extremaBy(this, keySelector, function (x, y) {
            return comparer(x, y) * -1;
        });
    };

    /**
     * Returns the minimum element in an observable sequence according to the optional comparer else a default greater than less than check.
     * 
     * 1 - source.min();
     * 2 - source.min(function (x, y) { return x.value - y.value; });
     * @memberOf Observable#
     * @param {Function} [comparer] Comparer used to compare elements.
     * @returns {Observable} An observable sequence containing a single element with the minimum element in the source sequence.
     */
    observableProto.min = function (comparer) {
        return this.minBy(identity, comparer).select(function (x) {
            return firstOnly(x);
        });
    };

    /**
     * Returns the elements in an observable sequence with the maximum  key value according to the specified comparer.
     * 
     * @example
     * 1 - source.maxBy(function (x) { return x.value; });
     * 2 - source.maxBy(function (x) { return x.value; }, function (x, y) { return x - y;; });
     * @memberOf Observable#
     * @param {Function} keySelector Key selector function.
     * @param {Function} [comparer]  Comparer used to compare key values.
     * @returns {Observable} An observable sequence containing a list of zero or more elements that have a maximum key value.
     */
    observableProto.maxBy = function (keySelector, comparer) {
        comparer || (comparer = subComparer);
        return extremaBy(this, keySelector, comparer);
    };

    /**
     * Returns the maximum value in an observable sequence according to the specified comparer.
     * 
     * @example
     * 1 - source.max();
     * 2 - source.max(function (x, y) { return x.value - y.value; });
     * @memberOf Observable#
     * @param {Function} [comparer] Comparer used to compare elements.
     * @returns {Observable} An observable sequence containing a single element with the maximum element in the source sequence.
     */
    observableProto.max = function (comparer) {
        return this.maxBy(identity, comparer).select(function (x) {
            return firstOnly(x);
        });
    };

    /**
     * Computes the average of an observable sequence of values that are in the sequence or obtained by invoking a transform function on each element of the input sequence if present.
     * 
     * @example
     * 1 - res = source.average();
     * 2 - res = source.average(function (x) { return x.value; });
     * @memberOf Observable#
     * @param {Function} [selector] A transform function to apply to each element.
     * @returns {Observable} An observable sequence containing a single element with the average of the sequence of values.
     */
    observableProto.average = function (keySelector) {
        return keySelector ?
            this.select(keySelector).average() :
            this.scan({
                sum: 0,
                count: 0
            }, function (prev, cur) {
                return {
                    sum: prev.sum + cur,
                    count: prev.count + 1
                };
            }).finalValue().select(function (s) {
                return s.sum / s.count;
            });
    };

    function sequenceEqualArray(first, second, comparer) {
        return new AnonymousObservable(function (observer) {
            var count = 0, len = second.length;
            return first.subscribe(function (value) {
                var equal = false;
                try {
                    if (count < len) {
                        equal = comparer(value, second[count++]);
                    }
                } catch (e) {
                    observer.onError(e);
                    return;
                }
                if (!equal) {
                    observer.onNext(false);
                    observer.onCompleted();
                }
            }, observer.onError.bind(observer), function () {
                observer.onNext(count === len);
                observer.onCompleted();
            });
        });
    }

    /**
     *  Determines whether two sequences are equal by comparing the elements pairwise using a specified equality comparer.
     * 
     * @example
     * 1 - res = source.sequenceEqual([1,2,3]);
     * 2 - res = source.sequenceEqual([{ value: 42 }], function (x, y) { return x.value === y.value; });
     * 3 - res = source.sequenceEqual(Rx.Observable.returnValue(42));
     * 4 - res = source.sequenceEqual(Rx.Observable.returnValue({ value: 42 }), function (x, y) { return x.value === y.value; });
     * @memberOf Observable#
     * @param {Observable} second Second observable sequence or array to compare.
     * @param {Function} [comparer] Comparer used to compare elements of both sequences.
     * @returns {Observable} An observable sequence that contains a single element which indicates whether both sequences are of equal length and their corresponding elements are equal according to the specified equality comparer.
     */
    observableProto.sequenceEqual = function (second, comparer) {
        var first = this;
        comparer || (comparer = defaultComparer);
        if (Array.isArray(second)) {
            return sequenceEqualArray(first, second, comparer);
        }
        return new AnonymousObservable(function (observer) {
            var donel = false, doner = false, ql = [], qr = [];
            var subscription1 = first.subscribe(function (x) {
                var equal, v;
                if (qr.length > 0) {
                    v = qr.shift();
                    try {
                        equal = comparer(v, x);
                    } catch (e) {
                        observer.onError(e);
                        return;
                    }
                    if (!equal) {
                        observer.onNext(false);
                        observer.onCompleted();
                    }
                } else if (doner) {
                    observer.onNext(false);
                    observer.onCompleted();
                } else {
                    ql.push(x);
                }
            }, observer.onError.bind(observer), function () {
                donel = true;
                if (ql.length === 0) {
                    if (qr.length > 0) {
                        observer.onNext(false);
                        observer.onCompleted();
                    } else if (doner) {
                        observer.onNext(true);
                        observer.onCompleted();
                    }
                }
            });
            var subscription2 = second.subscribe(function (x) {
                var equal, v;
                if (ql.length > 0) {
                    v = ql.shift();
                    try {
                        equal = comparer(v, x);
                    } catch (exception) {
                        observer.onError(exception);
                        return;
                    }
                    if (!equal) {
                        observer.onNext(false);
                        observer.onCompleted();
                    }
                } else if (donel) {
                    observer.onNext(false);
                    observer.onCompleted();
                } else {
                    qr.push(x);
                }
            }, observer.onError.bind(observer), function () {
                doner = true;
                if (qr.length === 0) {
                    if (ql.length > 0) {
                        observer.onNext(false);
                        observer.onCompleted();
                    } else if (donel) {
                        observer.onNext(true);
                        observer.onCompleted();
                    }
                }
            });
            return new CompositeDisposable(subscription1, subscription2);
        });
    };

    function elementAtOrDefault(source, index, hasDefault, defaultValue) {
        if (index < 0) {
            throw new Error(argumentOutOfRange);
        }
        return new AnonymousObservable(function (observer) {
            var i = index;
            return source.subscribe(function (x) {
                if (i === 0) {
                    observer.onNext(x);
                    observer.onCompleted();
                }
                i--;
            }, observer.onError.bind(observer), function () {
                if (!hasDefault) {
                    observer.onError(new Error(argumentOutOfRange));
                } else {
                    observer.onNext(defaultValue);
                    observer.onCompleted();
                }
            });
        });
    }

    /**
     * Returns the element at a specified index in a sequence.
     * 
     * @example
     * source.elementAt(5);
     * @memberOf Observable#
     * @param {Number} index The zero-based index of the element to retrieve.
     * @returns {Observable} An observable sequence that produces the element at the specified position in the source sequence.
     */
    observableProto.elementAt =  function (index) {
        return elementAtOrDefault(this, index, false);
    };

    /**
     * Returns the element at a specified index in a sequence or a default value if the index is out of range.
     * 
     * @example
     * source.elementAtOrDefault(5);
     * source.elementAtOrDefault(5, 0);
     * @memberOf Observable#
     * @param {Number} index The zero-based index of the element to retrieve.
     * @param [defaultValue] The default value if the index is outside the bounds of the source sequence.
     * @returns {Observable} An observable sequence that produces the element at the specified position in the source sequence, or a default value if the index is outside the bounds of the source sequence.
     */    
    observableProto.elementAtOrDefault = function (index, defaultValue) {
        return elementAtOrDefault(this, index, true, defaultValue);
    };

    function singleOrDefaultAsync(source, hasDefault, defaultValue) {
        return new AnonymousObservable(function (observer) {
            var value = defaultValue, seenValue = false;
            return source.subscribe(function (x) {
                if (seenValue) {
                    observer.onError(new Error('Sequence contains more than one element'));
                } else {
                    value = x;
                    seenValue = true;
                }
            }, observer.onError.bind(observer), function () {
                if (!seenValue && !hasDefault) {
                    observer.onError(new Error(sequenceContainsNoElements));
                } else {
                    observer.onNext(value);
                    observer.onCompleted();
                }
            });
        });
    }

    /**
     * Returns the only element of an observable sequence that satisfies the condition in the optional predicate, and reports an exception if there is not exactly one element in the observable sequence.
     * 
     * @example
     * 1 - res = source.single();
     * 2 - res = source.single(function (x) { return x === 42; });
     * @memberOf Observable#
     * @param {Function} [predicate] A predicate function to evaluate for elements in the source sequence.
     * @returns {Observable} Sequence containing the single element in the observable sequence that satisfies the condition in the predicate.
     */
    observableProto.single = function (predicate) {
        if (predicate) {
            return this.where(predicate).single();
        }
        return singleOrDefaultAsync(this, false);
    };

    /**
     * Returns the only element of an observable sequence that matches the predicate, or a default value if no such element exists; this method reports an exception if there is more than one element in the observable sequence.
     * 
     * @example
     * 1 - res = source.singleOrDefault();
     * 2 - res = source.singleOrDefault(function (x) { return x === 42; });
     * 3 - res = source.singleOrDefault(function (x) { return x === 42; }, 0);
     * 4 - res = source.singleOrDefault(null, 0);
     * @memberOf Observable#
     * @param {Function} predicate A predicate function to evaluate for elements in the source sequence.
     * @param [defaultValue] The default value if the index is outside the bounds of the source sequence.
     * @returns {Observable} Sequence containing the single element in the observable sequence that satisfies the condition in the predicate, or a default value if no such element exists.
     */
    observableProto.singleOrDefault = function (predicate, defaultValue) {
        if (predicate) {
            return this.where(predicate).singleOrDefault(null, defaultValue);
        }
        return singleOrDefaultAsync(this, true, defaultValue);
    };

    function firstOrDefaultAsync(source, hasDefault, defaultValue) {
        return new AnonymousObservable(function (observer) {
            return source.subscribe(function (x) {
                observer.onNext(x);
                observer.onCompleted();
            }, observer.onError.bind(observer), function () {
                if (!hasDefault) {
                    observer.onError(new Error(sequenceContainsNoElements));
                } else {
                    observer.onNext(defaultValue);
                    observer.onCompleted();
                }
            });
        });
    }

    /**
     * Returns the first element of an observable sequence that satisfies the condition in the predicate if present else the first item in the sequence.
     * 
     * @example
     * 1 - res = source.first();
     * 2 - res = source.first(function (x) { return x > 3; });
     * @memberOf Observable#
     * @param {Function} [predicate] A predicate function to evaluate for elements in the source sequence.
     * @returns {Observable} Sequence containing the first element in the observable sequence that satisfies the condition in the predicate if provided, else the first item in the sequence.
     */    
    observableProto.first = function (predicate) {
        if (predicate) {
            return this.where(predicate).first();
        }
        return firstOrDefaultAsync(this, false);
    };

    /**
     * Returns the first element of an observable sequence that satisfies the condition in the predicate, or a default value if no such element exists.
     * 
     * @example     
     * 1 - res = source.firstOrDefault();
     * 2 - res = source.firstOrDefault(function (x) { return x > 3; });
     * 3 - res = source.firstOrDefault(function (x) { return x > 3; }, 0);
     * 4 - res = source.firstOrDefault(null, 0);
     * @memberOf Observable#
     * @param {Function} [predicate] A predicate function to evaluate for elements in the source sequence. 
     * @param [defaultValue] The default value if no such element exists.  If not specified, defaults to null.
     * @returns {Observable} Sequence containing the first element in the observable sequence that satisfies the condition in the predicate, or a default value if no such element exists.
     */
    observableProto.firstOrDefault = function (predicate, defaultValue) {
        if (predicate) {
            return this.where(predicate).firstOrDefault(null, defaultValue);
        }
        return firstOrDefaultAsync(this, true, defaultValue);
    };

    function lastOrDefaultAsync(source, hasDefault, defaultValue) {
        return new AnonymousObservable(function (observer) {
            var value = defaultValue, seenValue = false;
            return source.subscribe(function (x) {
                value = x;
                seenValue = true;
            }, observer.onError.bind(observer), function () {
                if (!seenValue && !hasDefault) {
                    observer.onError(new Error(sequenceContainsNoElements));
                } else {
                    observer.onNext(value);
                    observer.onCompleted();
                }
            });
        });
    }

    /**
     * Returns the last element of an observable sequence that satisfies the condition in the predicate if specified, else the last element.
     * 
     * @example
     * 1 - res = source.last();
     * 2 - res = source.last(function (x) { return x > 3; });
     * @memberOf Observable#
     * @param {Function} [predicate] A predicate function to evaluate for elements in the source sequence.
     * @returns {Observable} Sequence containing the last element in the observable sequence that satisfies the condition in the predicate.
     */
    observableProto.last = function (predicate) {
        if (predicate) {
            return this.where(predicate).last();
        }
        return lastOrDefaultAsync(this, false);
    };

    /**
     * Returns the last element of an observable sequence that satisfies the condition in the predicate, or a default value if no such element exists.
     * 
     * @example
     * 1 - res = source.lastOrDefault();
     * 2 - res = source.lastOrDefault(function (x) { return x > 3; });
     * 3 - res = source.lastOrDefault(function (x) { return x > 3; }, 0);
     * 4 - res = source.lastOrDefault(null, 0);
     * @memberOf Observable#
     * @param {Function} [predicate] A predicate function to evaluate for elements in the source sequence.
     * @param [defaultValue] The default value if no such element exists.  If not specified, defaults to null.
     * @returns {Observable} Sequence containing the last element in the observable sequence that satisfies the condition in the predicate, or a default value if no such element exists.
     */
    observableProto.lastOrDefault = function (predicate, defaultValue) {
        if (predicate) {
            return this.where(predicate).lastOrDefault(null, defaultValue);
        }
        return lastOrDefaultAsync(this, true, defaultValue);
    };

    function findValue (source, predicate, thisArg, yieldIndex) {
        return new AnonymousObservable(function (observer) {
            return source.subscribe(function (x) {
                if (predicate.call(thisArg, x, i, source)) {
                    observer.onNext(yieldIndex ? i : x);
                    observer.onCompleted();
                } else {
                    i++;
                }
            }, observer.onError.bind(observer), function () {
                observer.onNext(yieldIndex ? -1 : undefined);
                observer.onCompleted();
            });
        });        
    }

    /**
     * Searches for an element that matches the conditions defined by the specified predicate, and returns the first occurrence within the entire Observable sequence.
     * 
     * @memberOf Observable#
     * @param {Function} predicate The predicate that defines the conditions of the element to search for.
     * @returns {Observable} An Observable sequence with the first element that matches the conditions defined by the specified predicate, if found; otherwise, undefined.
     */
    observableProto.find = function (predicate) {
        return findValue(this, predicate, arguments[1], false);
    };
     
    /**
     * Searches for an element that matches the conditions defined by the specified predicate, and returns 
     * an Observable sequence with the zero-based index of the first occurrence within the entire Observable sequence.
     *
     * @memberOf Observable#     
     * @param {Function} predicate The predicate that defines the conditions of the element to search for.
     * @returns {Observable} An Observable sequence with the zero-based index of the first occurrence of an element that matches the conditions defined by match, if found; otherwise, –1.
    */
    observableProto.findIndex = function (predicate) {
        return findValue(this, predicate, arguments[1], true);
    };
    return Rx;
}));
};
__modules__["/selection/selector.js"] = function(require, load, export$) {

/**
  @title{Selctor}
*/



var READONLY = require("../lib/colortraits").READONLY;
var PRIVATE = require("../lib/colortraits").PRIVATE;
var Klass = require("../lib/colortraits").Klass;
var assert = require("../lib/debug").assert;

/**
  * @iclass[Selector]{
  *   节点选择器，用于选择满足条件的节点，节点选择器可以通过提供的api进行组合。
  * }
  *
  */

var Selector = Klass.extend({
  initialize:function(predicate){
    this.execProto("initialize");
    this._t.setpredicates([]);
    if(predicate){
      assert(typeof(predicate) === "function", "Selector's constructor must be given function.")
      this._t.predicates().push(predicate);
    }
  },

  /**
  * @method[apply]{
  *   将节点选择器作用到给定的selection上，从selection中节点的孩子节点中，选择出满足条件的节点作为元素，组成新的selection。
  *   @class[Selector]
  *   @param[selection @type[Selection]]{
  *     给定的selection集合。
  *   }
  *   @return[@type[Selection]]{
  *     传入selection的孩子节点中，满足节点选择器的节点组成的Selection集合。
  *   }
  * }
  *
  */
  apply:function(selection){
    var result = null;
    var pres = this._t.predicates()
    for (var i = 0; i < pres.length; i++) {
      result = selection = selection.selectAll(pres[i]);
    };
    return result;
  },
  /**
  * @method[then]{
  *   将当前节点选择器与给定节点选择器进行链式组合，得到新的节点选择器。
  *   @class[Selector]
  *   @param[selector @type[Selector]]{
  *     给定的需要与当前节点选择器进行组合的节点选择器。
  *   }
  *   @return[@type[Selector]]{
  *     组合得到的新的Selector。
  *   }
  * }
  *
  */
  then:function(selector){
    var newSlector = Selector.create();
    for (var i = 0; i < this._t.predicates().length; i++) {
      newSlector.predicates().push(this._t.predicates()[i]);
    };
    for (var i = 0; i < selector.predicates().length; i++) {
      newSlector.predicates().push(selector.predicates()[i]);
    };
    return newSlector;
  }

},[READONLY("predicates")]);


/**
  * @function[kind]{
  *   类型节点选择器，用于选择类型与给定字符串相等的节点。
  *   @param[str string]{
  *     类型字符串（不区分大小写）。
  *   }
  *   @return[@type[Selector]]
  * }
  *
  */
var kind = function(str){
  return Selector.create(function(node){
    return typeof(node.dynamicProperty("kind")) === "string" && node.dynamicProperty("kind").toLowerCase() === str.toLowerCase();
  });
}
/**
  * @function[id]{
  *   id节点选择器，用于选择具有动态属性id，且值与给定字符串相等的节点。
  *   @param[str string]{
  *     id字符串（不区分大小写）。
  *   }
  *   @return[@type[Selector]]
  * }
  *
  */
var id = function(str){
  return Selector.create(function(node){
    return typeof(node.dynamicProperty("id")) === "string" && node.dynamicProperty("id").toLowerCase() === str.toLowerCase();
  });
}


export$({
  Selector:Selector,
  kind:kind,
  id:id
});
};
__modules__["/lib/util.js"] = function(require, load, export$) {

//在chrome浏览器中屏蔽此类工具函数，可以模拟 ie低版本测试。
// Object.keys = undefined;
// Array.prototype.forEach = undefined;
// Array.prototype.reduce = undefined;
// Array.prototype.filter = undefined;
// Array.prototype.map = undefined;
// Array.prototype.some = undefined;
// Object.create = undefined;


var extend = function(target, ext)
{
  if (arguments.length < 2)
    throw "at least 2 params provide to extend"

  var i, obj;
  for (i=1; i<arguments.length; i++){
    obj = arguments[i]
    if (!obj)
      continue;

    var key, val;
    for (key in obj){
      if (!obj.hasOwnProperty(key))
        continue;

      val = obj[key]
      if (val === undefined || val === target)
        continue;

      target[key] = val
    }
  }

  return target;
};

var beget = function(o)
{
  var F = function(){}
  F.prototype = o
  return new F();
};

var callback = function(target, method){
  if (typeof(method) == 'string'){
    method = target[method];
  }
  
  if (typeof(method) == 'function'){
    return function(){
      method.apply(target, arguments);
    }
  }
  else{
    debug.log("cannot create callback!!!"); 
  }
};
  
var copy = function(obj) {
  if (obj === null) {
    return null;
  }
  else if(obj === undefined)
    return undefined;

  var copyedObj;

  if (obj instanceof Array) {
    copyedObj = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      //copy[i] = arguments.callee(obj[i]);
      //Node: strict mode do not allow arguments.callee
      copyedObj[i] = util.copy(obj[i]);
    }
  } 
  else if (typeof(obj) == 'object') {
    if (typeof(obj.copy) == 'function') {
      copyedObj = obj.copy();
    }
    else{
      copyedObj = {};
      var o, x;
      for (x in obj) {
        //Node: strict mode do not allow arguments.callee
        copyedObj[x] = util.copy(obj[x]);
        //copy[x] = arguments.callee(obj[x]);
      }
    }
  } 
  else {
    // Primative type. Doesn't need copying
    copyedObj = obj;
  }

  return copyedObj;
};

var objectKeys;
if(Object.keys)
{
  objectKeys = function(obj)
  {
    return Object.keys(obj);
  }
}
else
{
  objectKeys = function(obj)
  {
    var keys = [];
    var i = 0;
    for(var key in obj)
    {
      if(obj.hasOwnProperty(key))
        keys[i++] = key;
    }
    return keys;
  }
}

var objectKeysForEach = function(obj, cb)
{
  for(var key in obj)
  {
    if(obj.hasOwnProperty(key))
      cb(key, obj);
  }
}

/*
  add functional util reduce/map/forEach/some/filter to util
*/

var objectForEach = function(obj, cb)
{
  for (var key in obj){
    if(obj.hasOwnProperty(key))
      cb(obj[key], key);
  };  
}

var arrayForEach;
if(Array.prototype.forEach)
{
  arrayForEach = function(obj, cb)
  {
    obj.forEach(cb);
  }
}
else
{ 
  arrayForEach = function(obj, cb)
  {
    var i = 0, len = obj.length;
    
    for (; i<len; i++){
      cb(obj[i], i);
    };
  }
}
var reduce = function(obj, cb, initialValue)
{
  var previousValue = (arguments.length == 2 /*|| initialValue == null*/) ? notSpecifiedValue : initialValue;

  var keys = objectKeys(obj);
  if (keys.length == 0)
    return {};
  
  var curIdx = 0;
  
  if (previousValue == notSpecifiedValue)
  {
    //previousValue = obj(keys[0]);
    previousValue = cb(previousValue, obj[keys[0]], keys[0], obj);
    curIdx = 1;
  }

  while (curIdx < keys.length)
  {
    previousValue = cb(previousValue, obj[keys[curIdx]], keys[curIdx], obj);
    curIdx ++;
  }

  return previousValue;
};

var notSpecifiedValue = [];
//cb signatrue  (previousValue, currentValue, key, object) --> anything

var arrayReduce;
if(Array.prototype.reduce)
{
  arrayReduce = function(obj, cb, initialValue)
  {
    return obj.reduce(cb, initialValue);
  };
}
else
{
  arrayReduce = reduce;
}

var arrayFilter
if(Array.prototype.filter)
{
  arrayFilter = function(obj, cb)
  {
    return obj.filter(cb);
  }
}
else
{
  arrayFilter = function(obj, cb)
  {
    reduce(obj, function(prev, cur, key, obj)
                       {
                         if (cb(cur, key, obj))
                         {
                           prev[key] = cur;
                         }

                         return prev;
                       },
                       []);
  };
}

var arrayMap;
if(Array.prototype.map)
{
  arrayMap = function(obj, cb)
  {
    return obj.map(cb);
  }
}
else
{
  arrayMap = function(obj, cb)
  {
    return reduce(obj, function(prev, cur, key, obj)
                       {
                         prev[key] = cb(cur, key, obj);
                         return prev;
                       },
                       []);
  };
}

var arraySome;
if(Array.prototype.some)
{
  arraySome = function(obj, cb)
  {
    return obj.some(cb);
  };
}
else
{
  arraySome = function(obj, cb)
  {
    var i = 0;
    while (i < obj.length)
    {
      if (cb(obj[i], i, obj))
        return true;
      
      i++;
    }

    return false;
  };
}

var ArrayIterator = function(array)
{
  this._array = array;
  this._curIdx = 0;
};

var IteratorEnd = {};

extend(ArrayIterator.prototype, {
  next:function()
  {
    if (this._curIdx != this._array.length)
      this._curIdx ++;
  },
  
  prev:function()
  {
    if (this._curIdx != 0)
      this._curIdx --;
  },
  
  get:function()
  {
    if (this._curIdx == this._array.length)
      return IteratorEnd;
    else
      return this._array[this._curIdx];
  },
  
  end:function()
  {
    return this._curIdx == this._array.length;
  }
});


var it = function()
{
  return new ArrayIterator(this);
};
/*
if(Object.defineProperty)
  Object.defineProperty(Array.prototype,
                        "iterator",
                        {
                          get: function () { return it;},
                          set: function (v) { },
                          enumerable: false
                        });
*/
var bind = function(obj)
{
  var self = this;
  
  return function()
  {
    return self.apply(obj, Array.prototype.slice.call(arguments, 0));
  };
};

var __idGenter = 0;
var identifier = function(obj)
{
  if (obj.__identifier === undefined)
  {
    return obj.__identifier = __idGenter++;
  }
  else
  {
    return obj.__identifier;
  }
}

var freeze;
if(Object.freeze)
{
  freeze = Object.freeze;
}
else
{
  freeze = function(x){return x;};
}

//兼容ie6、7、8没有 Object.create接口。
var objectDotCreate;
if(Object.create)
{
  objectDotCreate = Object.create;
}
else
{
  objectDotCreate = function(proto)
  {
    var ExObjectDotCreate = function()
    {

    }
    ExObjectDotCreate.prototype = proto;
    var newObj = new ExObjectDotCreate();
    newObj.__proto__ = proto;
    return newObj;
  }
}



var util = {
  extend : extend,
  beget : beget, 
  callback : callback,
  copy : copy,
  objectKeys : objectKeys,
  objectKeysForEach : objectKeysForEach, 
  objectForEach : objectForEach,
  arrayForEach : arrayForEach, 
  arrayReduce : arrayReduce,
  arrayFilter : arrayFilter,
  arrayMap : arrayMap, 
  arraySome : arraySome,
  bind : bind,
  freeze : freeze, 
  identifier : identifier,
  objectDotCreate : objectDotCreate
};
                     

export$(util);
};
__modules__["/animate.js"] = function(require, load, export$) {
var util = require("./lib/util")
, debug = require("./lib/debug")
, Klass = require("./lib/colortraits").Klass
, Trait = require("./lib/colortraits").Trait;

var arrayForEach = util.arrayForEach;
var arraySome = util.arraySome;
var arrayFilter = util.arrayFilter;
var identifier = util.identifier;
var objectForEach = util.objectForEach;


/**
* @section{概述}
动画模块。利用时间轴上一系列值，去修改某些属性，从而实现动画效果。

要点：
@itemize[
  @item{timeline: 计算时间轴[0 1]上某点处的值.}
  @item{Animation:利用timeline的值，去影响target的某些属性(比如gprim的一段时间内actor位置的变化等)。}
]
*/



/**
@section{timeline}

 *  @function[percent]{
       如果x大于等于0，且小于等于1，返回true，否则返回false.

 *    @param[x]{
       number;
      }
 *    @return{boolean;}
 *  }

  *  @function[timeline]{
       输入闭区间[0 1]之间的一个数，返回一个任意值。

 *    @param[x]{
       float;[0,1]
      }
 *    @return{any}
 *  }
*/



/**
@subsection{预定义好的timeline}
*/
var tweenFunctions = 
  {
/**
  *  @function[linear]{
      返回值就是percent。

 *    @param[percent]{
       float;[0,1]
      }
 *    @return{precent}
 *  }
 */
    linear :                         function(v) { return v },
/**
  *  @function[set]{
 *    @param[percent]{
       float;[0,1]
      }
 *    @return{返回0或1}
 *  }
 */
    set :                            function(v) { return Math.floor(v) },
/**
  *  @function[discrete]{
 *    @param[percent]{
       float;[0,1]
      }
 *    @return{返回0或1}
 *  }
 */
    discrete :                       function(v) { return Math.floor(v) },
/**
  *  @function[sine]{
 *    @param[percent]{
       float;[0,1]
      }
 *    @return{正弦曲线变化的值}
 *  }
 */
    sine :                           function(v) { return 0.5-0.5*Math.cos(v*Math.PI) },
/**
  *  @function[sproing]{
 *    @param[percent]{
       float;[0,1]
      }
 *    @return{弹簧一样的变化曲线，先快后慢。}
 *  }
 */
    sproing :                        function(v) { return (0.5-0.5*Math.cos(v*3.59261946538606)) * 1.05263157894737},
/**
  *  @function[square]{
 *    @param[percent]{
       float;[0,1]
      }
 *    @return{percent的平方}
 *  }
 */
    square :                         function(v) { return v*v},
/**
  *  @function[cube]{
 *    @param[percent]{
       float;[0,1]
      }
 *    @return{percent的立方}
 *  }
 */
    cube :                           function(v) { return v*v*v},
/**
  *  @function[sqrt]{
 *    @param[percent]{
       float;[0,1]
      }
 *    @return{percent的开方}
 *  }
 */
    sqrt :                           function(v) { return Math.sqrt(v)},
/**
  *  @function[curt]{
 *    @param[percent]{
       float;[0,1]
      }
 *    @return{percent的负1/3次方}
 *  }
 */
    curt :                           function(v) { return Math.pow(v, -0.333333333333)}
  };

/*-------------------------------------------------------------------------------------------
new timeline implement--> support easily combination
-------------------------------------------------------------------------------------------*/

var linear = tweenFunctions['linear'];
var set = tweenFunctions['set'];
var discrete = tweenFunctions['discrete'];
var sine = tweenFunctions['sine'];
var sproing = tweenFunctions['sproing'];
var square = tweenFunctions['square'];
var cube = tweenFunctions['cube'];
var sqrt = tweenFunctions['sqrt'];
var curt = tweenFunctions['curt'];


/**
@subsection{timeline的组合}
*/

/**
  *  @function[lift]{
 *    @param[f]{
       function; 它的参数是当
      }
 *    @return{timeline，这个timeline}
 *  }
 */

var lift = function(f)
{
  return function(tl)
  {
    return function(p)
    {
      return f(tl(p));
    };
  };
};

/**
  *  @function[consttl]{
 *    @param[f]{
       function; 它的参数是当
      }
 *    @return{timeline，这个timeline返回值总为"v"。}
 *  }
 */
var consttl = function(v)
{
  return function(p)
  {
    return v;
  };
};

/**
  *  @function[slerptl]{
 *    @param[v1]{
       number? object? array?
      }
      @param[v2]{
       number? object? array?
      }
      @param[t1]{
       percent; 
      }
 *    @return{timeline，这个timeline每次都是用v1，v2，tl(percent)三个值做线性插值}
 *  }
 */
var slerptl = function(v1, v2, tl)
{
  var t1 = consttl(v1);
  var t2 = consttl(v2);
  var t3 = tl;

  // t1(p) + (t2(p) - t1(p)) * t3(p)
  return addtl(t1, multl(t3, subtl(t2, t1)));
};

/**
  *  @function[maptl]{
 *    @param[op]{
       function; 
      }
      @param[t1]{
       timeline; 
      }
 *    @return{timeline，这个timeline用op映射t1的结果。}
 *  }
 */
var maptl = function(op, tl)
{
  return function(p)
  {
    return op(tl(p));
  };
};

/**
  *  @function[reversetl]{
      @param[t1]{
       timeline; 
      }
 *    @return{timeline，这个timeline调用的结果等于: tl(1-percent)。}
 *  }
 */
var reversetl = function(tl, totalTime)
{
  return function(t)
  {
    return tl(totalTime-t);
  };
};

/**
  *  @function[foldltl]{
      @param[op]{
       any; 
      }
      @param[tls]{
       array of timeline; 
      }
      @param[v]{
       any; 
      }
 *    @return{timeline，这个timeline依次对tls计算值，并使用op进行累积操作，该累积操作初始值为v。}
 *  }
 */
//if you do not want give me
var foldltl = function(op, tls, v)
{
  return function(p)
  {
    var v1, t, i;

    for (i=0, v1=v; i<tls.length; i++)
    {
      t = tls[i](p);

      v1 = op(v1, t);
    }

    return v1;
  }
};

/**
  *  @function[addtl]{
      @param[tls...]{
       timeline;参数是多个，每个都是timeline 
      }
 *    @return{timeline，这个timeline累加tls中所有的timeline。timeline返回的值目前仅支持：number，object，array。}
 *  }
 */
var addtl;
/**
  *  @function[subtl]{
      @param[tls...]{
       timeline;参数是多个，每个都是timeline 
      }
 *    @return{timeline，这个timeline使用tls中的第一个timeline返回值依次减去剩余的timeline返回值。}
 *  }
 */
var subtl;
/**
  *  @function[multl]{
      @param[tls...]{
       timeline;参数是多个，每个都是timeline 
      }
 *    @return{timeline，这个timeline将tls中的所有timeline相乘的结果作为新的timeline的返回值。}
 *  }
 */
var multl;

(function()
 {
   var createoptable = function(primitiveop)
   {
     var objectobject = function(v1, v2)
     {
       var ret = typeof(v1) == "object" ? {} : [];

       debug.assert(typeof(v1) == typeof(v2), "logical error");

       objectForEach(v1, function(val, key)
                 {
                   if (typeof(val) == "object" || typeof(val) == "array")
                     ret[key] = objectobject(val, v2[key]);
                   else
                     ret[key] = primitiveop(val, v2[key]);
                 });

       return ret;
     };

     var objectnumber = function(v1, v2)
     {
       var ret = typeof(v1) == "object" ? {} : [];

       objectForEach(v1, function(val, key)
                 {
                   if (typeof(val) == "object" || typeof(val) == "array")
                     ret[key] = objectnumber(val, v2);
                   else
                     ret[key] = primitiveop(val, v2);
                 });

       return ret;
     };

     var numberobject = function(v1, v2)
     {
       return objectnumber(v2, v1);
     };
     
     var numbernumber = function(v1, v2)
     {
       return primitiveop(v1, v2);
     }

     return {
       objectobject:objectobject,
       arrayarray:objectobject,
       objectarray:objectobject,
       arrayobject:objectobject,
       objectnumber:objectnumber,
       arraynumber:objectnumber,
       numberobject:numberobject,
       numberarray:numberobject,
       numbernumber:numbernumber
     };
   };

   var createop = function(table)
   {
     return function(v1, v2)
     {   
       if (v1 == undefined || v2 == undefined)
         return v1 || v2;

       var optype = typeof(v1) + typeof(v2);
       if (!table[optype])
       {
         debug.error("I donot known how to opeate the two value");
         return undefined;
       }
       
       return table[typeof(v1) + typeof(v2)](v1, v2);
     };
   };
  
   var addop = createop(createoptable(function(v1, v2){return v1 + v2;}));
   var mulop = createop(createoptable(function(v1, v2){return v1 * v2;}));
   var subop = createop(createoptable(function(v1, v2){return v1 - v2;}));
   var divop = createop(createoptable(function(v1, v2){return v1/v2;}));

   var createFoldtlCombinator = function(op)
   {
     return function()
     {
       if (arguments.length == 1)
         return arguments[0];

       var args = [];
       for (var i = 0; i<arguments.length; i++)
       {
         args.push(arguments[i]);
       }

       return foldltl(op, args, undefined);
     };
   };

   addtl = createFoldtlCombinator(addop);
   subtl = createFoldtlCombinator(subop);
   multl = createFoldtlCombinator(mulop);
 }());

var startTimetl = function(startTime, tl)
{
  return function(t)
  {
    return tl(t-startTime);
  }
}

var percentTl = function(startTime, endTime, tl)
{
  return function(t)
  {
    return tl((t-startTime)/(endTime-startTime));
  }
}

//animation
/**
@section{Animation}
Animation：在一段时间内，通过timeline计算出来的值，去修改相关属性。
所以Animation做了两件事情：
@itemize[
  @item{
   计算当前经过的时间占Animation总时间的百分比(percent/c)，然后通过@secref["timeline"]计算当前时间点的值。
  }
  @item{
   利用上面计算的值去影响其他事物(target的属性)。
  }
]


@defthing[target object?]
Animation的target：通过timeline计算出的值所作用的目标。

@defthing[variable (or/c string? array? function?)]
决定Animation如何影响target。@linebreak[]
如果为variable为string?:
@verbatim|{
        target[variable] = timeline(percent)
}|
如果variable为function?:
@verbatim|{
        variable(timeline(percent), target);
}|
如果varibale为array?:@linebreak[]
对其中每一项使用上述两种规则进行处理。

*/


/**
@iclass[AnimationBase Klass]{
  AnimationBase是所有动画的基类。
}

*/
var AnimationBase = Klass.extend(
  {
/**
 *  @method[initialize]{
    @class[AnimationBase]
      动画的初始化函数。
 *  }
 */
    initialize:function(param)
    {
      //AnimationBase.superClass.init.call(this);
      this.execProto("initialize", param);

      this._isPaused = false;
      
      this._state = "prepare";
      this._startTime = -1;
      this._curTime = -1;
    },
/**
 *  @method[prepare]{
    设置动画准备好属性，表明该动画已经可以开始执行了。
    @class[AnimationBase]
    @return{}。
 *  }
 */
    prepare:function(target)
    {
      this._state = "prepare";
      this._startTime = -1;
      this._curTime = -1;
      
      this.doPrepare(target);
    },

    doPrepare:function()
    {
      
    },
/**
 *  @method[target]{
    @class[AnimationBase]
    @return{动画所作用的目标}。
 *  }
 */
    target:function()
    {
      return undefined;
    },
/**
 *  @method[isDone]{
    查询动画是否执行完成。
    @class[AnimationBase]
    @return{boolean；true：完成；false：没有完成}。
 *  }
 */
    isDone:function()
    {
      return (this._curTime - this._startTime) >= this.totalTime();
    },
/**
 *  @method[curTime]{
    返回动画执行的当前时间。
    @class[AnimationBase]
    @return{time}。
 *  }
 */
    curTime:function()
    {
      return this._curTime;
    },
/**
 *  @method[startTime]{
    返回动画开始执行的时间。
    @class[AnimationBase]
    @return{time}。
 *  }
 */
    startTime:function()
    {
      return this._startTime;
    },
/**
 *  @method[update]{
    动画的更新函数，函数会执行动画的timeline，并用timeline的执行结果设置target新的属性值。
    @class[AnimationBase]
    @return{}。
 *  }
 */
    update: function (t, target)
    {
      if (this.isPaused() || this.isDone())
        return;

      if (this._state == "prepare")
      {
        this._startTime = t;
        this._state = "running";
      }
      
      var tg = this.target();
      tg = tg ? tg : target;

      if (this.onFrameBegin)
        this.onFrameBegin(t-this._startTime);

      this.doUpdate(t-this._startTime, target);

      if (this.onFrameEnd)
        this.onFrameEnd(t-this._startTime);

      var prevTime = this._curTime;
      this._curTime = t;

      if (this.hasCBs())
        this.cb(t-this._startTime, prevTime-this._startTime);
    },
/**
 *  @method[regCBsByPercent]{
    注册一些动画执行百分比的回调函数。
    动画将会执行到用户设置的百分比时，调用cb。
    @class[AnimationBase]
    @param[cbs]{
      array of pcb; 比如[{time:0.5, cb:function1}, {time:1, cb:function2}]
    }
    @return{}。
 *  }
 */
    regCBsByPercent:function(cbs)
    {
      var totalTime = this.totalTime();

      return this.regCBsByTime(cbs.map(function(cb)
                                       {
                                         return {time:cb.time * totalTime, cb:cb.cb};
                                       }));
    },
/**
 *  @method[regCBsByTime]{
    注册一些动画执行时间比的回调函数。
    动画将会执行到用户设置的时间时，调用cb。
    @class[AnimationBase]
    @param[cbs]{
      array of pcb; 比如[{time:500, cb:function1}, {time:1000, cb:function2}]
    }
    @return{}。
 *  }
 */
    regCBsByTime:function(cbs)
    {
      if (!this._cbs)
        this._cbs = [];

      this._cbs = this._cbs.concat(cbs);

      this._cbs.sort(function(cb1, cb2)
                             {
                               return cb1.time - cb2.time;
                             });    
    },
/**
 *  @method[regCBByPercent]{
    注册一个动画执行百分比的回调函数。
    动画将会执行到用户设置的百分比时，调用cb。
    @class[AnimationBase]
    @param[time]{
      percent；
    }
    @param[cb]{
      callback function；
    }
    @return{}。
 *  }
 */
    regCBByPercent:function(time, cb)
    {
      return this.regCBByTime(time * this.totalTime(), cb);
    },
/**
 *  @method[regCBByTime]{
    注册一个动画执行时间的回调函数。
    动画将会执行到用户设置的时间时，调用cb。
    @class[AnimationBase]
    @param[time]{
      time
    }
    @param[cb]{
      callback function；
    }
    @return{}。
 *  }
 */
    regCBByTime:function(time, cb)
    {
      if (!this._cbs)
        this._cbs = [];
      
      this._cbs.push({time:time, cb:cb});

      this._cbs.sort(function(cb1, cb2)
                             {
                               return cb1.time - cb2.time;
                             });
    },
/**
 *  @method[cancelCBByTime]{
    取消动画某个时间点的callback注册。
    @class[AnimationBase]
    @param[time]{
      time
    }
    @param[cb]{
      callback function；
    }
    @return{}。
 *  }
 */
    cancelCBByTime:function(time, cb)
    {
      this._cbs = arrayFilter(this._cbs, function(item)
                                                 {
                                                   if (item.time == time && (cb == undefined || cb == item.cb))
                                                     return false;
                                                   
                                                   return true;
                                                 });

      if (this._cbs.length == 0)
      {
        this.rmSlot("_cbs");
      }
    },
/**
 *  @method[cancelCBByPercent]{
    取消动画某个百分比的callback注册。
    @class[AnimationBase]
    @param[percent]{
      float;[0, 1]
    }
    @param[cb]{
      callback function；
    }
    @return{}。
 *  }
 */
    cancelCBByPercent:function(time, cb)
    {
      return this.cancelCBByTime(time*this.totalTime(), cb);
    },
/**
 *  @method[cancelAllCBs]{
    取消动画所有的callback注册。
    @class[AnimationBase]
    @return{}。
 *  }
 */
    cancelAllCBs:function()
    {
      this.rmSlot("_cbs");
    },
/**
 *  @method[cancelAllCBs]{
    查询该动画是否存在用户回调。
    @class[AnimationBase]
    @return{boolean； true：存在；false：不存在。}。
 *  }
 */
    hasCBs:function()
    {
      return this._cbs != undefined;
    },

    //call all cbs between (lastTime, time] or [time lastTime)
    cb:function(time, lastTime)
    {
      if (!this._cbs || lastTime == time)
        return;

      var dirToRight = time > lastTime;

      var cbs = [];
      arrayForEach(this._cbs, function(cb1)
                                {
                                  if ((dirToRight && (lastTime < cb1.time && cb1.time <= time)) ||
                                      (!dirToRight && (time <= cb1.time && cb1.time < lastTime)))
                                    cbs.push(cb1);
                                });

      if (!dirToRight)
        cbs = cbs.reverse();

      arrayForEach(cbs, function(cb1)
                  {
                    cb1.cb(dirToRight);
                  });
    },

    doUpdate:function(t, target)
    {
      debug.assert(false, "Animation base-->should not in");
    },

    /**
 *  @method[copy]{
    拷贝Animation实例。
    @class[AnimationBase]
    @return{animation}。
 *  }
    */
    copy:function()
    {
      debug.assert(false, "Animation base-->should not in");
    },
    
    /**
 *  @method[reverse]{
    拷贝Animation实例，返回的Animation的运动效果与原来的Animation刚好相反。
    @class[AnimationBase]
    @return{animation}。
 *  }
    */
    reverse:function()
    {
      debug.assert(false, "Animation base-->should not in");
    },
    /**
 *  @method[pause]{
    让动画暂停。
    @class[AnimationBase]
    @return{}。
 *  }
    */
    pause:function()
    {    
      if (this._isPaused == true)
      {
        debug.warning("pause paused animation");
      }
      
      this._isPaused = true;
    },
    /**
 *  @method[resume]{
    让暂停的动画回复执行。
    @class[AnimationBase]
    @return{}。
 *  }
    */
    resume:function()
    {
      if (this._isPaused ==  false)
      {
        debug.warning("resume a unpaused animation");
      }

      this._isPaused = false;
    },
    /**
 *  @method[resume]{
    询问动画是否暂停了。
    @class[AnimationBase]
    @return{boolean；true：暂停；false：没有暂停}。
 *  }
    */
    isPaused:function()
    {
      return this._isPaused == true;
    }
  }
);

/**
@iclass[Animation AnimationBase]{
  最基本的动画类,它是所有动画的基类。
}
*/
var Animation = AnimationBase.extend(
  {
/**
 *  @method[initialize]{
      @class[Animation]
      动画的初始化函数。
      @param[params]{
        object；构造一个动画所需要的所有参数集合。例如:{variable:userVariable, timeline:userTimeline, totalTime:userTotalTime, target:userTarget}
      }
 *  }
    */
    initialize: function(params)
    {
      this.execProto("initialize", params);
      
      this._variable = params.variable;
      this._timeline = params.timeline;
      this._totalTime = params.totalTime;

      debug.assert(this._variable && this._timeline && typeof(this._totalTime) == 'number', "Animation parameters error");

      this._target = params.target;
    },
    
    doPrepare: function()
    {
    },
    /**
 *  @method[totalTime]{
      @class[Animation]
      返回动画的总时长。
      @return{time}
 *  }
    */
    totalTime:function()
    {
      return this._totalTime;
    },
    
    _setTargetVal: function(variable, val, target)
    {
      if (typeof(variable) == 'string')
      {
        target.variable = val;
      }
      else if (typeof(variable) == 'function')
      {
        variable(val, target);
      }
      else if (typeof(variable) == 'array')
      {
        arrayForEach(variable, function(item, i, array)
                         {
                           this._setTargetVal(item, val, target);
                         }, 
                         this);
      }
    },

    doUpdate: function(t, target)
    {
      var val = this._timeline(t);
      
      debug.assert(this._target || target, "Animation, there is no target!");
      this._setTargetVal(this._variable, val, this._target ? this._target : target);
    },
    copy:function()
    {
      var newOne = Animation.create({variable:this._variable, timeline:this._timeline, totalTime:this._totalTime, target:this._target});
      return newOne;
    },
    
    reverse:function()
    {
      var newOne = Animation.create({variable:this._variable, timeline:reversetl(this._timeline, this._totalTime), totalTime:this._totalTime, target:this._target});
      return newOne;
    },
    /**
 *  @method[setTarget]{
      @class[Animation]
      @param[traget]{动画作用的对象}
 *  }
    */
    setTarget:function(target)
    {
      this._target = target;
    },

    target: function ()
    {
      return this._target;
    },

    variable:function()
    {
      return this._variable;
    },

    value:function(time)
    {
      var value = {variable:this._variable};
      
      time = time > this._totalTime ? this._totalTime : time;

      value.value = this._timeline(time);

      return [value];
    }

  }
);


/**
@iclass[SequenceAnimation AnimationBase]{
  顺序执行组合动画，该动画可以将多个动画组合起来形成一个新的动画。被组合的动画将会顺序执行。
}
*/
var SequenceAnimation = AnimationBase.extend(
  {
    /**
 *  @method[initialize]{
      @class[SequenceAnimation]
      顺序播放组合动画的初始化函数。
      @param[params]{
        object；构造一个顺序播放组合动画所需要的所有参数集合。例如:{animations:animationArray, interval:intervalTime}
        animations：被组合的动画数组。
        interval：每个动画顺序执行所间隔的时间。
      }
 *  }
    */
    initialize: function(params)
    {
      this.execProto("initialize", params);
      
      debug.assert(params.animations, 'SequenceAnimation constructor param error');

      this._animations = params.animations;
      
      this._curanimation = null;
      
      if (typeof(params.interval) == "number")
        this._interval = params.interval;
      else
        this._interval = 0;

      var prevTime = 0;
      var interval = this._interval;
      this._animations = this._animations.map(function(ani, i)
                                                           {
                                                             var a = {ani:ani, startTime:prevTime + i * interval};
                                                             prevTime += ani.totalTime();
                                                             
                                                             return a;
                                                           });

      this._curAniIdx = -1;
    },
    
    doPrepare: function()
    {
      if (0 == this._animations.length)
      {
        return;
      }

      this._curAniIdx = -1;
    },
    
    doUpdate: function(t, target)
    {
      var curAniIdx = this._curAniIdx;
      var anis = this._animations;

      //check if need select animation
      if (curAniIdx != -1 &&
          anis[curAniIdx].startTime <= t && 
          (curAniIdx == anis.length - 1 ||
           t < anis[curAniIdx+1].startTime))
      {
        //just update it
        anis[curAniIdx].ani.update(t, target);
      }
      else
      {
        var idx = -1;
        arraySome(anis, function(a, i, arr)
                  {
                    if (i == arr.length -1)
                    {
                      idx = i;
                      return true;
                    }

                    if (a.startTime <= t && t <= arr[i+1].startTime)
                    {
                      idx = i;
                      return true;
                    }

                    return false;
                  });

        debug.assert(idx != -1, "logical error");
        
        this._curAniIdx = idx;

        var selectedAni = anis[idx].ani;

        //reset animation
        selectedAni.prepare();
        //set startTime
        selectedAni.update(anis[idx].startTime, target);

        if (t != anis[idx].startTime)
          selectedAni.update(t, target);
      }
    },
    
    copy:function()
    {
      var animations = this._animations.map(function(item)
                                            {
                                              return item.ani.copy();
                                            });
      return SequenceAnimation.create({animations:animations});
    },
    
    reverse:function()
    {
      var animations = this._animations.map(function(item)
                                            {
                                              return item.ani.reverse();
                                            });
      return SequenceAnimation.create({animations:animations.reverse()});
    },

    totalTime:function()
    {
      var totalTime = 0
      ,   interval  = this._interval;

      arrayForEach(this._animations, function(animation, i)
                               {
                                 totalTime += animation.ani.totalTime() + interval;
                               });

      totalTime -= interval;

      return totalTime;
    },

    value:function(time)
    {
      var animation;
      var totalTime = this.totalTime();
      var interval = this._interval;

      time = time > totalTime ? totalTime : time;
      
      arraySome(this._animations, function(a, i)
                                    {
                                      var totalTime = a.ani.totalTime();
                                      if (time > (totalTime + interval))
                                      {
                                        time -= totalTime + interval;
                                        return false;
                                      }
                                      else
                                      {
                                        animation = a.ani;
                                        return true;
                                      }
                                    });

      debug.assert(animation, "canont find animation");
      return animation.value(time);
    }
  });


/**
@iclass[TimesAnimation AnimationBase]{
  多次执行组合动画，该动画可以将某个动画重复执行多次。
}
*/

var TimesAnimation = AnimationBase.extend(
/**
 *  @method[initialize]{
      @class[TimesAnimation]
      TimesAnimation的初始化函数
      @param[params]{
        object；构造一个执行多次的动画所需的参数集合。例如:{times:number, animation:animation, interval:time}
        times:被组合动画所需要重复执行的次数。
        animation：被组合需要重复执行的动画。
        interval：每次执行的时间间隔。
      }
 *  }
 */
  {
    initialize:function(param)
    {
      this.execProto("initialize", param);
      
      this._times = param.times;
      this._animation = param.animation;

      if (typeof(param.interval) == "number")
        this._interval = param.interval;
      else
        this._interval = 0;
    },
    
    doPrepare:function()
    {
      this._animation.prepare();
      this._elapsedTimes = 1;
    },
    
    doUpdate: function(t, target)
    {
      var self = this;

      var doUpdate = function(ani, t)
      {
        ani.update(t, target);
        
        //last animation donot have interval
        if ((self._elapsedTimes + 1 == self._times &&
             t > (ani.startTime() + ani.totalTime())) 
            ||
            (t > (ani.startTime() + ani.totalTime() + self._interval) && 
             self._elapsedTimes < self._times))
        {
          self._elapsedTimes = self._elapsedTimes+1;
          
          //set start time
          var startTime = ani.startTime() + ani.totalTime() + self._interval;

          ani.prepare();

          ani.update(startTime, target);
          
          if (startTime < t)
            doUpdate(ani, t);
        }
      }

      doUpdate(this._animation, t);
    },
    
    copy:function()
    {
      return TimesAnimation.create({animation:this._animation.copy(), times:this._times});
    },
    
    reverse:function()
    {
      return TimesAnimation.create({animation:this._animation.reverse(), times:this._times});
    },

    totalTime:function()
    {
      if (this._times == 0)
        return 0;

      return this._animation.totalTime() * this._times + (this._times - 1) * this._interval;
    },

    value:function(time)
    {
      var totalTime = this.totalTime();

      time = time > totalTime ? totalTime : time;
      
      time = time % (this._animation.totalTime() + this._interval);

      return this._animation.value(time);
    }
  });


/**
@iclass[ParallelAnimation AnimationBase]{
  并行执行组合动画，该动画可以将多个动画组合起来形成一个新的动画，新的动画将会使被组合的动画并行执行。
}
*/
var ParallelAnimation = AnimationBase.extend(
  {
/**
 *  @method[initialize]{
      @class[ParallelAnimation]
      并行组合动画的初始化函数
      @param[params]{
        object；构造一个并行执行动画所需的参数集合。例如:{animations:animationArray}
        times:被组合动画数组。
      }
 *  }
 */
    initialize:function(param)
    {
      this.execProto("initialize", param);
      
      if (param.animations)
        this._animations = param.animations;
      else
        this._animations = [];
    },
    
    doPrepare:function()
    {
      arrayForEach(this._animations, function(animation)
                               {
                                 animation.prepare();
                               });
    },
    
    isDone:function()
    {
      return this._animations.every(function(animation)
                                    {
                                      return animation.isDone();
                                    });
    },
    
    doUpdate: function(t, target)
    {
      arrayForEach(this._animations, function(animation)
                               {
                                 animation.update(t, target);
                               });
    },
    
    copy:function()
    {
      var animations = this._animations.map(function(animation)
                                            {
                                              return animation.copy();
                                            });
      return ParallelAnimation.create({animations:animations});
    },
    
    reverse:function()
    {
      var animations = this._animations.map(function(animation)
                                            {
                                              return animation.reverse();
                                            });
      return ParallelAnimation.create({animations:animations.reverse()});
    },

    totalTime:function()
    {
      var totalTime = 0;
      arrayForEach(this._animations, function(animation, i)
                               {
                                 var t = animation.totalTime();
                                 totalTime = totalTime > t ? totalTime : t;
                               });
      return totalTime;
    },

    value:function(time)
    {
      return this._animations.map(function(animation, i)
                                          {
                                            return animation.value(time);
                                          });
    }
  });

//helper util
var gen_movetl = function(speed)
{
  return function(t)
  {
    return t*speed;
  }
}

/**
 *  @function[moveX]{
      返回一个在x轴上以speed速度匀速运动的动画。
      @param[speed]{
        float;匀速运动速度。
      }
      @return{animation}
 *  }
 */
var moveX = function(pos, speed)
{
  return Animation.create({variable:function(val, target)
                           {
                             target.setx(val);
                           },
                           
                           timeline:function(t)
                           {
                             return t * speed;
                           },

                           totalTime:Infinity});
};

/**
 *  @function[moveY]{
      返回一个在y轴上以speed速度匀速运动的动画。
      @param[speed]{
        float;匀速运动速度。
      }
      @return{animation}
 *  }
 */
var moveY = function(pos, speed)
{
  return Animation.create({variable:function(val, target)
                           {
                             target.sety(val);
                           },
                           timeline:function(t)
                           {
                             return t * speed;
                           },
                           totalTime:Infinity});
};

/**
 *  @function[moveXY]{
      返回一个在x轴、y轴分别以各自速度匀速运动的动画。
      @param[xSpeed]{
        float;X轴匀速运动速度。
      }
      @param[ySpeed]{
        float;y轴匀速运动速度。
      }
      @return{animation}
 *  }
 */
var moveXY = function(pos, xSpeed, ySpeed)
{
  return Animation.create({variable:function(val, target)
                           {
                             target.translate(val.x, val.y);
                           },
                           timeline:function(t)
                           {
                             return {x:xSpeed*t, y:ySpeed*t};
                           },
                           totalTime:Infinity});
};

/**
 *  @function[moveToX]{
      返回一个在x轴上在totalTime时间内从x1位置移动到x2位置的动画。
      @param[x1]{
        float；动画的起点x坐标。
      }
      @param[x2]{
        float；动画的终点x坐标。
      }
      @return{animation}
 *  }
 */
var moveToX = function(x1, x2, totalTime)
{
  return Animation.create({variable:function(val, target)
                           {
                             target.setx(val);
                           },
                           timeline:function(t)
                           {
                             var percent = t / totalTime;
                             return x1 + (x2 - x1) * percent;
                           },
                           totalTime:totalTime});
}
/**
 *  @function[moveToY]{
      返回一个在y轴上在totalTime时间内从y1位置移动到y2位置的动画。
      @param[y1]{
        float；动画的起点y坐标。
      }
      @param[y2]{
        float；动画的终点y坐标。
      }
      @return{animation}
 *  }
 */
var moveToY = function(y1, y2, totalTime)
{
  return Animation.create({variable:function(val, target)
                           {
                             target.sety(val);
                           },
                           timeline:function(t)
                           {
                             var percent = t / totalTime;
                             return y1 + (y2 - y1) * percent;
                           },
                           totalTime:totalTime});
}

/**
 *  @function[makeAnimationsByTime]{
      返回在时间上连续的动画数组。
      @param[variable]{
        function；动画如果作用于target的函数。
      }
      @param[args]{
        aniArray；在时间上连续的动画描述。
      }
      @return{animation}
 *  }
 */
function makeAnimationsByTime(variable, args)
{
  var anis = []

  arrayForEach(args, function(arg, i)
               {
                 // [0 args.length-2]
                 if (i == args.length-1)
                   return;

                 var totalTime = args[i+1][0] - args[i][0]
                 ,   timeline;

                 if (typeof(arg[2]) == "string")
                   timeline = slerptl(args[i][1], args[i+1][1], percentTl(0, totalTime, tweenFunctions[arg[2]]));
                 else
                   timeline = arg[2];
                 
                 anis.push(Animation.create({variable:variable, timeline:timeline, totalTime:totalTime}));
               });

  return anis;
}


/**
 *  @function[moveToByTime]{
      返回在时间上连续的移动动画。
      @param[animationInfo]{
        移动动画描述，可以是多个参数。
      }
      @return{sequenceAnimation}


      例如：
       @verbatim|{
         var moveAni = moveToByTime(
          [0, {x:0, y:32}, 'linear'],
          [1000, {x: 200, y: 150}, 'sine'],
          [2000, {x:400, y:300 - 32}, 'sine']);

         //moveAni将会在0~1000毫秒内以linear timeline运动到{x:0, y:32}，然后又在1000~2000毫秒内以sine timeline运动到 {x: 200, y: 150} 等。
       }|
 *  }
 */
 //[time, pos, 'linear'] ...
var moveToByTime = function()
{
  return SequenceAnimation.create({animations:makeAnimationsByTime(function(val, target)
                                                                   {
                                                                     target.translate(val.x, val.y);
                                                                   }, 
                                                                   Array.prototype.slice.call(arguments, 0))});
}

/**
 *  @function[moveToBySpeed]{
      返回连续的做匀速运动的动画。
      @param[animationInfo]{
        匀速运动动画描述，可以是多个参数。
      }
      @return{sequenceAnimation}


      例如：
       @verbatim|{
         var speedAni = moveToBySpeed(
          [{x:0, y:0}, 5],
          [{x:50, y:100}, 15],
          [{x:90, y:30}]);

         //动画语义为以5的速度运动到{x:50, y:100}后又以15的速度运动到{x:90, y:30}。
       }|
 *  }
 */
//[pos, speed] [pos1, speed1] [pos2, speed2] ... [pos3]
var moveToBySpeed = function()
{
  var args = Array.prototype.slice.call(arguments, 0)
  ,   time = 0;

  args = args.map(function(item, i, arr)
                  {
                    if (i == 0)
                    {
                      return [time, item[0], 'linear'];
                    }

                    //update time
                    var pos0 = arr[i-1][0]
                    ,   pos1 = arr[i][0]
                    ,   xdis = pos1.x - pos0.x
                    ,   ydis = pos1.y - pos0.y;

                    time += Math.abs(Math.sqrt(xdis*xdis + ydis*ydis) / arr[i-1][1]);
                    
                    return [time, item[0], 'linear'];
                  });

  return moveToByTime.apply(undefined, args);
}

/**
 *  @function[rotateToByTime]{
      返回在时间上连续的旋转动画。
      @param[animationInfo]{
        旋转动画描述，可以是多个参数。
      }
      @return{sequenceAnimation}


      例如：
       @verbatim|{
         var rotateAni = rotateToByTime(
          [0, 0, 'sine'],
          [2000, 2.0 * Math.PI, 'sine'],
          [4000, 0*Math.PI]);

         //旋转的语义与moveToByTime类似。
       }|
 *  }
 */
var rotateToByTime = function()
{
  return SequenceAnimation.create({animations:makeAnimationsByTime(function(val, target)
                                                                   {
                                                                     target.setrotate(val);
                                                                   },
                                                                   Array.prototype.slice.call(arguments, 0))});
}

/**
 *  @function[rotateToBySpeed]{
      返回一个匀速的旋转动画。
      @param[animationInfo]{
        旋转动画描述，可以是多个参数。
      }
      @return{sequenceAnimation}


      例如：
       @verbatim|{
         var rotateAni = rotateToBySpeed(
          [0, 'sine'],
          [2.0 * Math.PI, 'sine'],
          [0*Math.PI]);

         //动画的语义与moveToBySpeed类似。
       }|
 *  }
 */
//[val, speed] [val, speed] ... [val]
var rotateToBySpeed = function()
{
  var args = Array.prototype.slice.call(arguments, 0)
  ,   time = 0;

  args = args.map(function(item, i, arr)
                  {
                    //update time
                    if (i == 0)
                    {
                      return [time, item[0], 'linear'];
                    }

                    var start = arr[i-1][0]
                    ,   end = arr[i][0];

                    time += Math.abs(end - start) / Math.abs(arr[i-1][1]);
                    
                    return [time, item[0], 'linear'];
                  });

  return rotateToByTime.apply(undefined, args);
}


/**
 *  @function[scaleToX]{
      返回一个开始为缩放比例为x1在 totalTime的时间内缩放到 x2的缩放动画。
      @param[x1]{
        xScale;x轴初始缩放比例。
      }
      @param[x2]{
        xScale;x轴最终缩放比例。
      }
      @param[totalTime]{
        time；动画持续的总时长。
      }
      @return{animation}
 *  }
 */
var scaleToX = function(x1, x2, totalTime)
{
  return Animation.create({variable:function(val, target)
                           {
                             target.scaleX(val);
                           },
                           timeline:function(t)
                           {
                             var percent = t / totalTime;
                             return x1 + (x2 - x1) * percent;
                           },
                           totalTime:totalTime});
}

/**
 *  @function[scaleToY]{
      返回一个开始为缩放比例为y1在 totalTime的时间内缩放到 y2的缩放动画。
      @param[y1]{
        yScale;y轴初始缩放比例。
      }
      @param[y2]{
        yScale;y轴最终缩放比例。
      }
      @param[totalTime]{
        time；动画持续的总时长。
      }
      @return{animation}
 *  }
 */
var scaleToY = function(y1, y2, totalTime)
{
  return Animation.create({variable:function(val, target)
                           {
                             target.scaleY(val);
                           },
                           timeline:function(t)
                           {
                             var percent = t / totalTime;
                             return y1 + (y2 - y1) * percent;
                           },
                           totalTime:totalTime});
}

/**
 *  @function[scaleToByTime]{
      返回一个在连续时间段内不断缩放的动画。
      @param[animationInfo]{
        缩放动画描述，可以是多个参数。
      }
      @return{sequenceAnimation}


      例如：
       @verbatim|{
         var scaleAni = scaleToByTime(
          [0, {x:0.3, y:0.3}, 'linear'],
          [1000, {x:1.2, y:1.2}, 'sine'],
          [2000, {x:0.3, y:0.3}, 'sine']);

         //缩放的语义与moveToByTime类似。
       }|
 *  }
 */
var scaleToByTime = function()
{
  return SequenceAnimation.create({animations:makeAnimationsByTime(function(val, target)
                                                                   {
                                                                     target.setscale(val.x, val.y);
                                                                   }, 
                                                                   Array.prototype.slice.call(arguments, 0))});

}


/**
 *  @function[scaleToBySpeed]{
      返回一个匀速的旋转动画。
      @param[animationInfo]{
        旋转动画描述，可以是多个参数。
      }
      @return{sequenceAnimation}


      例如：
       @verbatim|{
         var rotateAni = scaleToBySpeed(
          [{x:0.3, y:0.3}, 'sine'],
          [{x:1.2, y:1.2}, 'sine'],
          [{x:0.3, y:0.3}]);

         //动画的语义与moveToBySpeed类似。
       }|
 *  }
 */
var scaleToBySpeed = function()
{
  var args = Array.prototype.slice.call(arguments, 0)
  ,   time = 0;

  args = args.map(function(item, i, arr)
                  {
                    //update time
                    if (i == 0)
                    {
                      return [time, item[0], 'linear'];
                    }

                    var xdist = arr[i][0].x - arr[i-1][0].x
                    ,   ydist = arr[i][0].y - arr[i-1][0].y;

                    time += Math.sqrt(xdist * xdist + ydist * ydist) / Math.abs(arr[i-1][1]);
                    
                    return [time, item[0], 'linear'];
                  });

  return scaleToByTime.apply(undefined, args);
}

/**
 *  @function[seq]{
      帮助函数，返回一个顺序执行的动画。用户不用直接使用SequenceAnimation.create(...)的方式创建动画。
      @param[animations]{
        顺序执行的动画数组。
      }
      @return{sequenceAnimation}
 *  }
 */
var seq = function(animations)
{
  return SequenceAnimation.create({animations:animations});
};


/**
 *  @function[parallel]{
      帮助函数，返回一个并行执行的动画。用户不用直接使用ParallelAnimation.create(...)的方式创建动画。
      @param[animations]{
        并行执行的动画数组。
      }
      @return{parallelAnimation}
 *  }
 */
var parallel = function(animations)
{
  return ParallelAnimation.create({animations:animations});
};

/**
 *  @function[parallel]{
      帮助函数，返回一个连续多次执行的动画。用户不用直接使用 TimesAnimation.create(...)的方式创建动画。
      @param[animations]{
        需要多次执行的动画。
      }
      @param[times]{
        number；执行次数。
      }
      @return{timesAnimation}
 *  }
 */
var times = function(animation, times)
{
  return TimesAnimation.create({animation:animation, times:times});
}



/**
@itrait[AnimatorTrait]{

动画管理器，该管理器提供添加、删除动画等能力。}
**/
var AnimatorTrait = Trait.extend({
  __init : function()
  {
    this._t.setanimations([]);
  },
/**
 *  @method[update]{
      @trait[AnimatorTrait]
      动画驱动函数，需要在一段时间内连续调用此函数才能够驱动动画运行。
 *    @param[t]{
 *     t；当前时间。
 *    }
 *    @param[dt]{
 *     dt; 距离上一次驱动的间隔时间。
 *    }
 *    @param[target]{
       obj; 动画的作用对象。
      }
 *    @return{}
 *  }
 */
  __update : function(t, dt, target)
  {
    var hasDone = false;

    arrayForEach(this._t.animations(), function(animation, i, arr)
     {
       animation.update(t, target);
       if (animation.isDone())
         hasDone = true;
     });

    if (!hasDone)
      return;

    this._t.setanimations(arrayFilter(this._t.animations(), function(animation)
     {
       return !animation.isDone();
     }));
  },
/**
*  @method[addAnimation]{
    @trait[AnimatorTrait]
    添加一个动画到动画管理器中。
    @param[animation]{
      animation；需要添加的动画。
    }
    @param[bSmooth]{
      boolean；是否外部控制播放动画。false：自动播放；true：不自动播放，由外部控制。
      默认值false。
    }
    @return{}
*  }
*/
  addAnimation:function(animation, bSmooth)
  {
    this._t.animations().push(animation);
    if(!bSmooth)
      animation.prepare();
  },
/**
*  @method[removeAnimation]{
    @trait[AnimatorTrait]
    删除一个动画。
    @param[id]{
      id；animation 或者 animation.identifier。
    }
    @return{}
*  }
*/
  removeAnimation:function(id)
  {
    if (typeof(id) != "number")
      id = identifier(id);

    var idx = -1;

    arraySome(this._t.animations(), function(animation, i)
                                  {
                                    if (identifier(animation) == id)
                                    {
                                      idx = i;
                                      return true;
                                    }
                                    else
                                      return false;
                                  });

    if (idx != -1)
      this._t.animations().splice(idx, 1);
  },
/**
*  @method[removeAllAnimations]{
    @trait[AnimatorTrait]
    删除动画管理器中的所有动画。
    @return{}
*  }
*/
  removeAllAnimations:function()
  {
    this._t.setanimations([]);
    return true;
  }
}, ["animations"]);

/**
@iclass[Animation Klass]{
  动画管理器类。提供了添加、删除动画等功能。
}
*/
var Animator = Klass.extend(
{
/**
*  @method[initialize]{
    @class[Animator]
    初始化函数。
*  }
*/
  initialize:function()
  {
    this.subTraits(0).__init();    
  },
/**
 *  @method[update]{
      @class[Animator]
      动画驱动函数，需要在一段时间内连续调用此函数才能够驱动动画运行。
 *    @param[t]{
 *     t；当前时间。
 *    }
 *    @param[dt]{
 *     dt; 距离上一次驱动的间隔时间。
 *    }
 *    @param[target]{
       obj; 动画的作用对象。
      }
 *    @return{}
 *  }
 */
  update : function(t, dt, target)
  {
    this.subTraits(0).__update(t, dt, target);
  }
}, [], [AnimatorTrait]);


export$({
  AnimationBase : AnimationBase,
  Animation : Animation,
  SequenceAnimation : SequenceAnimation,
  TimesAnimation : TimesAnimation,
  ParallelAnimation : ParallelAnimation,
  moveX : moveX,
  moveY : moveY,
  moveXY : moveXY,
  moveToX : moveToX,
  moveToY : moveToY,
  moveToByTime : moveToByTime,
  moveToBySpeed : moveToBySpeed,
  rotateToByTime : rotateToByTime,
  rotateToBySpeed : rotateToBySpeed,
  scaleToX : scaleToX,
  scaleToY : scaleToY,
  scaleToByTime : scaleToByTime,
  scaleToBySpeed : scaleToBySpeed,
  makeAnimationsByTime : makeAnimationsByTime,
  seq : seq,
  parallel : parallel,
  times : times,
  linear:linear,
  set:set,
  discrete:discrete,
  sine:sine,
  sproing:sproing,
  square:square,
  cube:cube,
  sqrt:sqrt,
  curt:curt,
  reversetl:reversetl,
  slerptl:slerptl,
  maptl:maptl,
  foldltl:foldltl,
  addtl:addtl,
  subtl:subtl,
  multl:multl,
  lift:lift,
  consttl:consttl,
  Animator:Animator,
  AnimatorTrait:AnimatorTrait,
  tweenFunctions:tweenFunctions
});

};
__modules__["/sprites/line.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits");
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;
var Sprite = require("./sprite");
var LineTrait = require("../gprims/linegprim").LineTrait;

/**
@title{Line}
*/
/**
@iclass[Line Sprite (LineTrait)]{
  折线精灵，它使用了 LineTrait，具有LineTrait上所有属性和方法。
  @grant[LineTrait type #:attr 'READONLY]
  @grant[LineTrait vertexes]
  @grant[LineTrait lineWidth]
  @grantMany[LineTrait strokeFlag id tag strokeStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineCap lineJoin miterLimit lineDash] 
}
**/
var Line = Sprite.extend({
  initialize: function(param)
  {
    this.execProto("initialize", {gprim:this, interactable:((param == undefined) ? undefined : param.interactable)});
    this.subTraits(0).__init(param);
  }
},
 [[READONLY("type"), LineTrait.grant("type")], [CUSTOM_SETTER("vertexes"), LineTrait.grant("vertexes")],
  [CUSTOM_SETTER("lineWidth"), LineTrait.grant("lineWidth")], [CUSTOM_SETTER("strokeStyle"), LineTrait.grant("strokeStyle")],
  [CUSTOM_SETTER("shadowColor"), LineTrait.grant("shadowColor")]].concat(
  LineTrait.grantMany(["strokeFlag", "id", "tag", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineCap", "lineJoin", "miterLimit", "lineDash"])),
 [LineTrait]);

export$(Line);
};
__modules__["/gprims/compositegprim.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits")
,   ShapTrait = require("./shaptrait").ShapTrait
,   util = require("../lib/util")
,   geo = require("../lib/geometry");

var arrayMap = util.arrayMap;
var Klass = colortraits.Klass;
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;

/**
@itrait[CompositeTrait]{
  @extend[ShapTrait] {
    @traitGrantAll[ShapTrait #:trait CompositeTrait]
  }
  组合gprim功能模块。通过这个gprim模块，用户可以将多个gprim组合成一个gprim。
  该GPrim的类型, type, 值为"composite"。
}
**/
/**
@property[gprims array #:attr 'CUSTOM_SETTER]{
  @trait[CompositeTrait]
  需要组合的gprims数组。
}
*/
var EmptyRect = {x: 0, y: 0, width: 0, height: 0};
var defaultComposite = {};
var CompositeTrait = ShapTrait.extend({
  __init: function(param)
  {
    this.subTraits(0).__init(param);
    if(param == undefined)
      param = defaultComposite;
    this._t.setgprims((param.gprims == undefined) ? [] : param.gprims);
    this._t.settype("composite");
  },
/**
@method[setgprims]{
  @trait[CompositeTrait]
  @param[gprims array]{array of gprims}
  @return[this]{}
  设置组合的gprims。
}
*/
  setgprims: function(gprims)
  {
    this._t.cache().bbox = undefined;
    this._t.setgprims(gprims);
    return this;
  },
/**
@method[B_gprimChange #:hidden]{
  @trait[CompositeTrait]
  @return[boolean]{true, gprim修改过，false, gprim未修改过}
  用于判断其组合的gprims是否修改过，因为它可能包含composite。这里做的是深度遍历去判断。
}
**/
  B_gprimChange: function()
  {
    var cache = this._t.cache();    
    if(cache.stamps == undefined){
      var stamps = arrayMap(this._t.gprims(), function(item)
                                            {
                                              return item.stamp();
                                            });
      cache.stamps = stamps; 
      return true;
    }
    var gprims = this._t.gprims();
    for(var i = 0, length = gprims.length; i < length; i++)
    {
      var item = gprims[i];
      if((item.type() == "composite" ) && (item.B_gprimChange() || (cache.stamps[i] != item.stamp()))){
        return true;
      }else if(cache.stamps[i] != item.stamp()){
        return true;
      }
    }

    return false;

  },
/**
@method[bbox]{
  @trait[CompositeTrait]
  @return[rect]{}
  组合成的gprim的bbox
}
**/
  bbox: function()
  {
    var cache = this._t.cache();
    var mat = this.matrix();
    var calculatestamp = this.stamp();
    if(!this.B_gprimChange() && undefined !== cache.bbox && calculatestamp == cache.stamp)
    {
      return cache.bbox;
    }

    var res = this.localBbox();
    var anchor = this.anchor();
    res.x -= anchor.x;
    res.y -= anchor.y; 
    res = geo.rectApplyMatrixToBoundRect(res, mat);

    cache.stamp = this.stamp();
    cache.bbox = res;
    return res;
  },
/**
@method[localBbox]{
  @trait[CompositeTrait]
  @return[rect]{}
  组合成的gprim的local坐标系下的bbox
}
**/
  localBbox: function()
  {
    var mat = this.matrix();
    var gprims = this._t.gprims();
    if(!gprims.length)
      return EmptyRect;
    var gprim0 = gprims[0].bbox();
    var b = {x: gprim0.x, y: gprim0.y, width: gprim0.width, height: gprim0.height};
    for(var i = 1, length = gprims.length; i <length; i++)
    {
      var subbbox = gprims[i].bbox();
      b = geo.rectUnion(b, subbbox);
    }

    return b;  
  },
/**
@method[localInside]{
  @trait[CompositeTrait]
  @param[x number]{点的横坐标}
  @param[x number]{点的纵坐标}
  @return[boolean]{}
  精确判断一个点是否在此组合gprim上。
}
**/
  localInside: function(x, y)
  {
    var gprims = this._t.gprims();
    for(var i = gprims.length -1; i>= 0; i--)
    {
      var subm = gprims[i];
      var flag = subm.inside(x, y);
      if(flag){
        if((typeof flag) == "object"){
          return flag;
        }else {
          return subm;
        }
      }
    }
    return false;
/*     var gprims = this._t.gprims();
    for(var i = gprims.length -1; i>= 0; i--)
    {
      var subm = gprims[i];
      if(subm.inside(x, y))
      {
        return true
      }
    }
    return false;*/
  },
  localHook: function(cb)
  {   
    this.hookMany(this._t, ["fillFlag", "strokeFlag", "gprims", "strokeStyle", "fillStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineCap", "lineJoin", "miterLimit", "lineWidth", "lineDash", "anchorPoint"], cb, "a");
    var gprims = this._t.gprims();
    for(var i = 0, length = gprims.length; i < length; i++)
    {
      var item = gprims[i];
      item.localHook(cb);
    }
  },
  unlocalHook: function(cb)
  {
   
    this.unhookMany(this._t, ["fillFlag", "strokeFlag", "gprims", "strokeStyle", "fillStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineCap", "lineJoin", "miterLimit", "lineWidth", "lineDash", "anchorPoint"], cb, "a"); 
    var gprims = this._t.gprims();
    for(var i = 0, length = gprims.length; i < length; i++)
    {
      var item = gprims[i];
      item.unlocalHook(cb);
    }
/*     arrayForEach(this._t.gprims(), function(item)
                                    {
                                      item.unlocalHook();
                                    }); */ 
  }
},
  ["gprims"].concat(ShapTrait.grantAll())
);

/**
@iclass[CompositeKlass Klass (CompositeTrait)]{
  组合图元，当组合图元的共有的属性没有自己设定的时候，可以在Composite的层级直接设置组合内部图元的属性。
  @grant[CompositeTrait type #:attr 'READONLY]
  @grantMany[CompositeTrait lineWidth gprims ratioAnchor anchor strokeStyle strokeFlag id tag fillFlag fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineCap lineJoin miterLimit]
  @constructor[CompositeKlass]{
    @param[param object]{
      @verbatim|{
        初始化参数对象包含的属性可以为：
        id:id值。
        tag:tag标签。
        gprims: array, 需要组合的gprim。
        fillStyle：整个文本的fillStyle。如果styles中设置，则以styles为先。
        strokeStyle：整个文本的strokStyle。如果styles中设置，则以styles为先。
        x:精灵的x坐标。
        y:精灵的y坐标。
        z:精灵的z坐标。
        ratioAnchor: 百分比设置锚点。
        anchor：锚点。
        lineWidth、 strokeFlag、 fillFlag、 shadowColor、shadowBlur、shadowOffsetX、shadowOffsetY、lineCap、lineJoin、miterLimit
      }|
    }
  }
}
**/
var CompositeKlass = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize");
    this.subTraits(0).__init(param);
  }
},
 [[READONLY("type"), CompositeTrait.grant("type")], [CUSTOM_SETTER("lineWidth"), CompositeTrait.grant("lineWidth")],
  [CUSTOM_SETTER("gprims"), CompositeTrait.grant("gprims")], [CUSTOM_SETTER("strokeStyle"), CompositeTrait.grant("strokeStyle")],
  [CUSTOM_SETTER("fillStyle"), CompositeTrait.grant("fillStyle")], [CUSTOM_SETTER("shadowColor"), CompositeTrait.grant("shadowColor")]].concat(CompositeTrait.grantMany(["fillFlag", "strokeFlag", "id", "tag", 
    "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineCap", "lineJoin", "miterLimit"])),
[CompositeTrait]);


export$({
  CompositeTrait : CompositeTrait,
  CompositeKlass : CompositeKlass
});

};
__modules__["/thirdlib/rx/all.js"] = function(require, load, export$) {
load("./rx", window);
load("./rx.html", window);
load("./rx.helper", window);
load("./rx.aggregates", window);
load("./rx.time", window);
load("./rx.binding", window);

var Rx = window.Rx;
delete window.Rx;

export$(Rx);
};
__modules__["/lib/canvasobservable.js"] = function(require, load, export$) {
var Rx = require("../thirdlib/rx/all");
var objectDotCreate = require("./util").objectDotCreate;

function calcRelativeMousePstn(evt)
{
  var x = evt.offsetX;
  var y = evt.offsetY;

  if(x == undefined)
  {
    var box = evt.target? evt.target.getBoundingClientRect() : evt.srcElement.getBoundingClientRect();
    if(evt.layerX != undefined)
    {
      //firefox事件兼容
      x = evt.layerX - box.left;
      y = evt.layerY - box.top;
    }

    if(x == undefined)
    {
      //很多浏览器都没有 offsetX (相对target的坐标)，因此必须计算出相对于 target 的坐标。
      x = evt.clientX - box.left;
      y = evt.clientY - box.top;
    }
  }

  return {x:x, y:y};
}

var mousewheelSelectCb = function(evt)
{
  var evtPstn = calcRelativeMousePstn(evt);

  return {
    mouseX:evtPstn.x, 
    mouseY:evtPstn.y,
    wheelDelta:evt.wheelDelta?(evt.wheelDelta):(evt.detail*(-40)),
    type:"mousewheel", 
    sourceEvt:evt};
}

var mouseSelectCb = function(evt)
{
  if(evt.preventDefault)
    evt.preventDefault();
  else if(window.event)
     window.event.returnValue = false;
  
  var evtPstn = calcRelativeMousePstn(evt);
  return {
    mouseX:evtPstn.x,
    mouseY:evtPstn.y,
    sourceEvt:evt
  };
}

var touchSelect = function(evt)
{
  if(evt.preventDefault)
    evt.preventDefault();
  else if(window.event)
     window.event.returnValue = false;

  var newEvt = {type:evt.type};
  var touchEvt;
  var evtPstn;
  
  if(evt.touches && evt.touches.length > 0)
  {
    newEvt.touches = [];
    for(var i = 0; i < evt.touches.length; ++i)
    {
      touchEvt = evt.touches[i];
      newEvt.touches[i] = {sourceEvt:touchEvt};
      evtPstn = calcRelativeMousePstn(touchEvt);
      newEvt.touches[i].mouseX = evtPstn.x;
      newEvt.touches[i].mouseY = evtPstn.y;
    }
    newEvt.mouseX = newEvt.touches[0].mouseX;
    newEvt.mouseY = newEvt.touches[0].mouseY;
  }
  // else
  // {
  //   var evtPstn = calcRelativeMousePstn(evt);
  //   newEvt.sourceEvt = evt;
  //   newEvt.mouseX = evtPstn.x;
  //   newEvt.mouseY = evtPstn.y;
  // }
  
  return newEvt;
}


function keydownSelectGen(evt)
{
  return function(e)
  {
    var evt = {type:type};
    evt.key = e.key;
    evt.keyCode = e.keyCode;
    evt.sourceEvt = e.sourceEvt;

    return evt;
  };
}


function CanvasEventObservables(canvas)
{
  //if (canvas.hasOwnProperty && canvas.hasOwnProperty("ontouchstart"))
  if((canvas.hasOwnProperty && canvas.hasOwnProperty("ontouchstart"))
    ||!!navigator.userAgent.match(/AppleWebKit.*Mobile.*/))
  {
    this.touchstartObservable = Rx.Observable.fromEvent(canvas, "touchstart").select(touchSelect);
    this.touchendObservable = Rx.Observable.fromEvent(canvas, "touchend").select(touchSelect);
    this.touchmoveObservable = Rx.Observable.fromEvent(canvas, "touchmove").select(touchSelect);
  }
  else
  {
    this.mousedownObservable = Rx.Observable.fromEvent(canvas, "mousedown").select(mouseSelectCb);
    this.mouseupObservable = Rx.Observable.fromEvent(canvas, "mouseup").select(mouseSelectCb);
    this.mousemoveObservable = Rx.Observable.fromEvent(canvas, "mousemove").select(mouseSelectCb);
  }
  //this.mouseoverObservable = Rx.Observable.fromEvent(canvas, "mouseover").select(mouseSelectCb);
  //this.mouseoutObservable = Rx.Observable.fromEvent(canvas, "mouseout").select(mouseSelectCb);
  this.keydownObservable = Rx.Observable.fromEvent(canvas, "keydown").select(keydownSelectGen("keyPressed"));
  this.keyupObservable = Rx.Observable.fromEvent(canvas, "keyup").select(keydownSelectGen("keyReleased"));
}

export$({
  CanvasEventObservables:CanvasEventObservables
});
};
__modules__["/sprites/all.js"] = function(require, load, export$) {
export$({
  Annulus : require("./annulus"),
  Arc : require("./arc"),
  AutoWrapText : require("./autowraptext"),
  BubbleReceiver : require("./bubblereceiver"),
  Circle : require("./circle"),
  Clip : require("./clip"),
  Composite : require("./composite"),
  Image : require("./image"),
  Line : require("./line"),
  Path : require("./path"),
  Polygon : require("./polygon"),
  Rect : require("./rect"),
  Text : require("./text"),
  ContainerSprite: require("./container")
});
};
__modules__["/sprites/path.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits");
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;
var Sprite = require("./sprite");
var PathTrait = require("../gprims/pathgprim").PathTrait;

/**
@title{Path}
*/

/**
@iclass[Path Sprite (PathTrait)]{
  路径精灵，它使用了 PathTrait， 具有PathTrait上所有属性和方法。
  @grant[PathTrait type #:attr 'READONLY]
  @grant[PathTrait lineWidth pathElements]
  @grantMany[PathTrait fillFlag strokeFlag id tag strokeStyle fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineCap lineJoin miterLimit lineDash rError]
  @constructor[Path]{
    @param[param object]{
      @verbatim|{
        初始化参数对象包含的属性可以为：
        id:id值。
        tag:tag标签。
        pathElements: 文本内容。(必须有)
        lineWidth:线宽。
        rError:容错值。
        fillStyle：整个文本的fillStyle。如果styles中设置，则以styles为先。
        strokeStyle：整个文本的strokStyle。如果styles中设置，则以styles为先。
        x:精灵的x坐标。
        y:精灵的y坐标。
        z:精灵的z坐标。
        ratioAnchor: 百分比设置锚点。
        anchor：锚点。
        fillFlag、strokeFlag、shadowColor、shadowBlur、shadowOffsetX、shadowOffsetY、lineCap、lineJoin、miterLimit、lineDash        
      }|
    }
  }}
**/

var Path = Sprite.extend({
  initialize: function(param)
  {
    this.execProto("initialize", {gprim:this, interactable:((param == undefined) ? undefined : param.interactable)});
    this.subTraits(0).__init(param);
  }
},
 [[READONLY("type"), PathTrait.grant("type")], [CUSTOM_SETTER("lineWidth"), PathTrait.grant("lineWidth")],
  [CUSTOM_SETTER("pathElements"), PathTrait.grant("pathElements")], [CUSTOM_SETTER("strokeStyle"), PathTrait.grant("strokeStyle")],
  [CUSTOM_SETTER("fillStyle"), PathTrait.grant("fillStyle")], [CUSTOM_SETTER("shadowColor"), PathTrait.grant("shadowColor")]].concat(PathTrait.grantMany(["fillFlag", "strokeFlag", "id", "tag", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineCap", "lineJoin", "miterLimit", "lineDash", "rError"])),
 [PathTrait]);

export$(Path);
};
__modules__["/gprims/pathgprim.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits")
,   ShapTrait = require("./shaptrait").ShapTrait
,   geo = require("../lib/geometry")
,   helper = require("../lib/helper")
,   winding = require("../lib/winding")
,   util = require("../lib/util")
,   pathelement = require("../pathelement")
,   pathelenP = require("../lib/pathlenprocess");

var arrayMap = util.arrayMap;
var Klass = colortraits.Klass;
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;

/**
@itrait[PathTrait]{
  @extend[ShapTrait] {
    @traitGrantAll[ShapTrait #:trait PathTrait]
  }
  @verbatim|{
    提供了path路径的功能模块。
    该GPrim的类型, type, 值为"path"。
    1：创建一条path路径需要用svg path string或者path构成的数组初始化路径pathElements：
    例如svg初始化：pathElements: "M 20 20 L50 20 Q20 100 150 140, C110, 200, 60, 100, 100, 100,  A, 60, 100, 1.2, 1, 1, 200, 100, Z"
        数组初始化：pathElements: [["M", 20, 20],["L", 50, 20], ["Q", 20, 100, 150, 140], ["C", 110, 200, 60, 100, 100, 100], ["A", 60, 100, 1.2, 1, 1, 200, 100], ["Z"]]
    2：修改path路径的某一条路径，调用方法setPathProperty：
    例如：pathobj.setPathProperty(2, "controlpoint", {x: 100, y: 50});表示修改上述pathElements的第三条路径的控制点，则pathElements变成"M 20 20 L50 20 Q100 50 150 140, C110, 200, 60, 100, 100, 100,  A, 60, 100, 1.2, 1, 1, 200, 100, Z"这样的svg路径。
        或者pathElements: [["M", 20, 20],["L", 50, 20]  ["Q", 100, 50, 150, 140], ["C", 110, 200, 60, 100, 100, 100], ["A", 60, 100, 1.2, 1, 1, 200, 100], ["Z"]]   
  }|
}
**/
/**
@property[pathElements array #:attr 'CUSTOM_SETTER]{
  @trait[PathTrait]
  @verbatim|{
    内部包含pathElement路径对象。对象的包含的种类为：      
    MoveToElement： 移动到; "M X Y...."; 属性名/获取值："type", "M", 只读. "point", {x: X, y: Y},
    LineToElement：代表path上绘制一条直线; "...L X Y..."; 属性名/获取值："type", "L", 只读. "point", {x: X, y: Y},
    QCurveElement：代表path上绘制一条二次贝塞尔曲线; ....Q, CX, CY, X, Y....; 属性名/获取值："type", "Q", 只读. "controlpoint", {x: CX, y: CY}. "point", {x: X, y: Y}
    BezierCurveElement：代表path上绘制一条三次贝塞尔曲线; 创建方式: ...C, CX1, CY1, CX2, CY3, X, Y...; 属性名/获取值："type", "C", 只读. "controlpoint1", {x: CX1, y: CY1}. "controlpoint2", {x: CX2, y: CY2}. "point", {x: X, y: Y}
    EllipseToElement：代表path上绘制一条椭圆弧; ...A rx ry xaxisrotation largearcflag sweepflag X Y..; 属性名/获取值："type", "A", 只读. "rx" "ry" "xaxisrotation" "largearcflag" "sweepflag" "point", {x: X, y: Y}
    ClosePathElement：代表path上闭合,在结束设置; ...Z...; 属性名/获取值："type", "Z", 只读. 
    提供了获取和修改这些Path路径每段路径属性的方法.
  }|
}
*/

/**
@property[rError float #:def 0]{
  @trait[PathTrait]
  容错值，检测点是否在path路径上/内的容错值, 默认设置为0。
}
*/
var defaultPath = {pathElements: [["M", 20, 20], ["L", 50, 20]]};
var PathTrait = ShapTrait.extend({
  __init: function(param)
  {
    this.subTraits(0).__init(param);
    if(param == undefined)
      param = defaultPath; 
    this._t.settype("path");   
    this._t.setrError((param.rError == undefined) ? 0 : param.rError);
    if(param.pathElements instanceof Array){
      this.setpathElements(param.pathElements);
    }else{
      this.setpathElements(helper.svgToArray(param.pathElements));
    }  

    this._t.setlength(undefined);
  },
/**
@method[ellipseInit #:hidden]{
  @trait[PathTrait]
  @return[this]{}
  如果path路径中包含了椭圆，这里让椭圆去计算自己的圆心，起始角度等。
  当重新设置path路径的时候，也可能需要重新计算椭圆的圆心
}
*/
  ellipseInit: function()
  {
    var elearray = this._t.pathElements();
    for(var i = 0, length = elearray.length; i < length; i++)
    {
      if(elearray[i].type() == "A")
      {
        elearray[i].ellipseCenterAngle(elearray[i-1].point());
      }
    }
    return this;
  },
/**
@method[setpathElements]{
  @trait[PathTrait]
  @param[path array]{array path/svg path string: path构成的数组或者svg path string。}
  @return[this]{}
  重新设置path的路径，之前的路径会被替换。
}
*/
  setpathElements: function(pathElements)
  {
    if(!(pathElements instanceof Array)){
      pathElements = helper.svgToArray(pathElements);
    }

    this._t.cache().bbox = undefined;
    var paths = arrayMap(pathElements, function(item)
                                        {
                                          var type = item[0];
                                          var f = pathelement.PathCreat[type];
                                          return f(item);
                                        });
    this._t.setpathElements(paths);
    this.ellipseInit();

    //整条路径变得时候都清除
    this._t.__clearAllLengthCache();

    return this;
  },
/**
@method[setPathProperty]{
  @trait[PathTrait]
  @param[index int]{pathElements中第index段path。}
  @param[prop string]{第index path想要修改的属性名。详见：可包含的pathElement}
  @param[newval object]{属性要修改后的值。}
  @return[this]{}
  修改path路径中第index(从0开始)个路径pathElement的prop属性为新值。
}
*/
  setPathProperty: function(index, prop, newval)
  {
    this._t.cache().bbox = undefined;
    var setprop = pathelement.PropertytoSet[prop];
    this._t.pathElements()[index][setprop](newval);
    this.ellipseInit();

    //清除length cache
    this._t.__clearPartLengthCache(index, prop);  

    return this;  
  },
/**
@method[getPathProperty]{
  @trait[PathTrait]
  @param[index int]{pathElements中第index段path。}
  @param[prop string]{第index path想要获取值的属性名。详见：可包含的pathElement}
  @return[object]{获取的指定第index条path路径的prop属性值}
  获取path路径中第index(从0开始)个路径pathElement的prop属性值。
}
*/
  getPathProperty: function(index, prop)
  {
    return this._t.pathElements()[index][prop]();    
  },
/**
@method[localBbox]{
  @trait[PathTrait]
  @return[rect]{loacal坐标系下的矩形包围盒}
  local坐标系下的bbox。
}
*/
  localBbox: function()
  {
    var left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    var vs = this._t.pathElements();
    var lineWidth = this._t.lineWidth();
    for (var i = 0; i < vs.length; i++)
    {
      var eleobj = vs[i].bboxPoint();
      for(var j in eleobj){
        var p = eleobj[j];
        left = ((p.x - lineWidth/2) < left) ? (p.x - lineWidth/2) : left;
        top = ((p.y - lineWidth/2) < top) ? (p.y - lineWidth/2) : top;
        right = ((p.x + lineWidth/2) > right) ? (p.x + lineWidth/2) : right;
        bottom = ((p.y + lineWidth/2) > bottom) ? (p.y + lineWidth/2) : bottom;
      }                                      
    }                                

    return geo.rectMake(left, top, right - left + 1, bottom - top + 1);
  },
/**
@method[localInside]{
  @trait[PathTrait]
  @param[x float]{x坐标值。}
  @param[y float]{y坐标值。}
  @return[boolean]{}
  在local坐标系下判断一个点是否在path内部/上。
  如果曲线为闭合且具有填充，则检测为判断一个点是否在path路径内部。
  如果曲线没有填充，则检测为判断一个点是否在path路径上。
}
*/
  localInside: function(x, y)
  {
    var ls = this._t.pathElements();
    var lastobj = ls[ls.length -1];
    var lineWidth = this._t.lineWidth();
    var rError = this._t.rError();

    if(lastobj.type() == "Z" && (this.fillStyle() != undefined || this.fillFlag()))
    {
      //闭合状态下
      return winding.isPointInPath(ls, x, y);                                      
    }else {
      for(var i = 1, length = ls.length; i < length; i++)
      {
        var endobj = ls[i];
        var prepoint = ls[i-1].point();
        var endpoint;
        if(endobj.type() === "Z"){                                        
          endpoint = ls[0].point();
        } else {
          endpoint = endobj.point();
        }
        if(endobj.isPointIn(prepoint, endpoint, x, y, lineWidth, rError)){
          return true;                                        
        }
      }
      return false;
    }
  },
  localHook: function(cb)
  {
   
    this.hookMany(this._t, ["fillFlag", "strokeFlag", "pathElements", "strokeStyle", "fillStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineCap", "lineJoin", "miterLimit", "lineWidth", "lineDash", "anchorPoint"], cb, "a");
    var pathelements = this._t.pathElements();
    for(var i = 0, length = pathelements.length; i < length; i++)
    {
      var item = pathelements[i];
      item.localHook(cb);
    }
  },
  unlocalHook: function(cb)
  {   
    this.unhookMany(this._t, ["fillFlag", "strokeFlag", "pathElements", "strokeStyle", "fillStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineCap", "lineJoin", "miterLimit", "lineWidth", "lineDash", "anchorPoint"], cb, "a"); 
    var pathelements = this._t.pathElements();
    for(var i = 0, length = pathelements.length; i < length; i++)
    {
      var item = pathelements[i];
      item.unlocalHook(cb);
    }
  },
/**
@method[length]{
  @trait[PathTrait]
  @return[float]{路径的长度}
  获取未缩放前的path路径的长度, 具有缓冲。
}
*/
  length: function()
  {
    var len = this._t.length();
    if(len == undefined) {
      len = 0;
      var pathelements = this._t.pathElements();
      var prepoint; 
      for(var i = 0, pathlength = pathelements.length; i < pathlength; ++i) {
        var item = pathelements[i];
        if(item.type() == "Z") {
          len += item.length(prepoint, pathelements[0].point());
        } else {
          len += item.length(prepoint);
          prepoint = item.point();
        }
      }

      this._t.setlength(len);
    }

    return len;
  },
/*
@method[__clearAllLengthCache #:hidden]{
  @trait[PathTrait]
  @return[this]{}
  清除length以及其子路径上所有缓存。
}
*/
  __clearAllLengthCache: function()
  {
    this._t.setlength(undefined);
    var pathelements = this._t.pathElements(); 
    for(var i = 0, len = pathelements.length; i < len; i++) {
      var obj = pathelements[i];
      obj.clearLengthCache();
    }
    return this; 
  },
/*
@method[__clearPartLengthCache #:hidden]{
  @trait[PathTrait]
  @return[this]{}
  清除length以及部分子路径上的缓存。
}
*/
  __clearPartLengthCache: function(index, prop)
  {
    this._t.setlength(undefined);
    var pathelements = this._t.pathElements();
    var len = pathelements.length;
    if(prop == "point"){
      if(index == 0) {
        pathelements[index+1].clearLengthCache();
      } else if(index == len - 1) {
        pathelements[index].clearLengthCache();
      } else {
        pathelements[index].clearLengthCache();
        pathelements[index+1].clearLengthCache();
      }      
    }else {
      pathelements[index].clearLengthCache();
    }   
    return this; 
  },
/**
@method[pointAtPercent]{
  @trait[PathTrait]
  @param[t float]{0-1之间。}
  @return[point]{{x:a , y: b}}
  Returns the point at the percentage t of the current path. t在 0 到 1 之间.这里不支持缩放。
  注：获取的是未经缩放前path路径上的点，如果path路径经过缩放，这里需要手动对获取的点进行相应的变换。
}
*/
  pointAtPercent: function(t)
  {
    var pathelements = this._t.pathElements();
    var count = pathelements.length;
    if (t < 0 || t > 1 || !count) {
      return;
    }

    var prepoint, len;
    var prelen = 0;
    var totalLength = this.length();
    for(var i = 0, pathlength = pathelements.length; i < pathlength; ++i) {
      var item = pathelements[i];
      if(item.type() == "Z") {
        len = item.length(prepoint, pathelements[0].point());
        prelen += len;
        if(prelen >= t*totalLength) {
          prelen -= len;
          var newt = (totalLength * t - prelen) / len;
          return item.pointAtPercent(newt, prepoint, pathelements[0].point());
        }        
      } else {
        len = item.length(prepoint);
        prelen += len;
        if(prelen >= t*totalLength) {
          prelen -= len;
          var newt = (totalLength * t - prelen) / len;
          return item.pointAtPercent(newt, prepoint);
        }
      }
      prepoint = item.point();

    }
  },
/**
@method[percentAtLength]{
  @trait[PathTrait]
  @param[len float]{大于0。}
  @return[float]{大于0}
  Returns the point at the length  of the current path. len在 0 到 整个长度之间.否则什么都不返回。
  注：这里路径的总长度指的是未经缩放变换的总长度。
  注：获取的是未经缩放前path路径上的点，如果path路径经过缩放，这里需要手动对获取的点进行相应的变换。
}
*/
//这里percent按照线性的来处理，并不是对应于曲线的t
  percentAtLength: function(len)
  {    
    if(len <= 0)
      return 0;
    var alllength = this.length();
    if(len >= alllength)
      return 1;

    var pathelements = this._t.pathElements();
    var prelen = 0;
    var templen;
    var prepoint;
    for(var i = 0, length = pathelements.length; i < length; i++) {
      var item = pathelements[i];      
      if(item.type() == "Z") {
        templen = item.length(prepoint, pathelements[0].point());        
      } else {
        templen = item.length(prepoint);        
      }
      prelen += templen;
      if(prelen >= len) {
        return (prelen - len) / templen;
      }
      prepoint = item.point();     
    }
  }
},
 ["pathElements", "rError", "length"].concat(ShapTrait.grantAll())
);

/**
@iclass[PathKlass Klass (PathTrait)]{
  path绘制路径图元.
  @grant[PathTrait type #:attr 'READONLY]
  @grant[PathTrait lineWidth pathElements]
  @grantMany[PathTrait ratioAnchor anchor fillFlag strokeFlag id tag strokeStyle fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineCap lineJoin miterLimit lineDash rError]
  @constructor[PathKlass]{
    @param[param object]{
      @verbatim|{
        初始化参数对象包含的属性可以为：
        id:id值。
        tag:tag标签。
        pathElements: 路径内容。(必须有)
        lineWidth:线宽。
        rError:容错值。
        fillStyle：整个文本的fillStyle。如果styles中设置，则以styles为先。
        strokeStyle：整个文本的strokStyle。如果styles中设置，则以styles为先。
        x:精灵的x坐标。
        y:精灵的y坐标。
        z:精灵的z坐标。
        ratioAnchor: 百分比设置锚点。
        anchor：锚点。
        fillFlag、strokeFlag、shadowColor、shadowBlur、shadowOffsetX、shadowOffsetY、lineCap、lineJoin、miterLimit、lineDash        
      }|
    }
  }
}
**/
var PathKlass = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize");
    this.subTraits(0).__init(param);
  }
},
[[READONLY("type"), PathTrait.grant("type")], [CUSTOM_SETTER("lineWidth"), PathTrait.grant("lineWidth")],
 [CUSTOM_SETTER("pathElements"), PathTrait.grant("pathElements")], [CUSTOM_SETTER("strokeStyle"), PathTrait.grant("strokeStyle")],
 [CUSTOM_SETTER("fillStyle"), PathTrait.grant("fillStyle")], [CUSTOM_SETTER("shadowColor"), PathTrait.grant("shadowColor")]].concat(PathTrait.grantMany(["fillFlag", "strokeFlag", "id", "tag", 
  "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineCap", "lineJoin", "miterLimit", "lineDash", 
  "rError"])),
[PathTrait]);


export$({
  PathTrait : PathTrait,
  PathKlass : PathKlass
});
};
__modules__["/sprites/image.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits");
var READONLY = colortraits.READONLY;
var Sprite = require("./sprite");
var ImageTrait = require("../gprims/imagegprim").ImageTrait;

/**
@title{Image}
*/

/**
@iclass[Image Sprite (ImageTrait)]{
  图片精灵，它使用了ImageTrait，具有ImageTrait上所有属性和方法.
  @grant[ImageTrait type #:attr 'READONLY]
  @grantMany[ImageTrait alpha constraintmode image tag id] 
}
**/
var Image = Sprite.extend({
  initialize: function(param)
  {
    this.execProto("initialize", {gprim:this, interactable:((param == undefined) ? undefined : param.interactable)});
    this.subTraits(0).__init(param);
  }
},
[[READONLY("type"), ImageTrait.grant("type")]].concat(ImageTrait.grantMany(["alpha", "constraintmode", "image", "tag", "id"])),
 [ImageTrait]);

export$(Image);
};
__modules__["/thirdlib/rx/rx.binding.js"] = function(require, load, export$) {
// Copyright (c) Microsoft Open Technologies, Inc. All rights reserved. See License.txt in the project root for license information.

(function (root, factory) {
    var freeExports = typeof exports == 'object' && exports,
        freeModule = typeof module == 'object' && module && module.exports == freeExports && module,
        freeGlobal = typeof global == 'object' && global;
    if (freeGlobal.global === freeGlobal) {
        window = freeGlobal;
    }

    // Because of build optimizers
    if (typeof define === 'function' && define.amd) {
        define(['rx', 'exports'], function (Rx, exports) {
            root.Rx = factory(root, exports, Rx);
            return root.Rx;
        });
    } else if (typeof module === 'object' && module && module.exports === freeExports) {
        module.exports = factory(root, module.exports, require('./rx'));
    } else {
        root.Rx = factory(root, {}, root.Rx);
    }
}(this, function (global, exp, Rx, undefined) {
    
    var Observable = Rx.Observable,
        observableProto = Observable.prototype,
        AnonymousObservable = Rx.Internals.AnonymousObservable,
        Subject = Rx.Subject,
        AsyncSubject = Rx.AsyncSubject,
        Observer = Rx.Observer,
        ScheduledObserver = Rx.Internals.ScheduledObserver,
        disposableCreate = Rx.Disposable.create,
        disposableEmpty = Rx.Disposable.empty,
        CompositeDisposable = Rx.CompositeDisposable,
        currentThreadScheduler = Rx.Scheduler.currentThread,
        inherits = Rx.Internals.inherits,
        addProperties = Rx.Internals.addProperties;

    // Utilities
    var objectDisposed = 'Object has been disposed';
    function checkDisposed() {
        if (this.isDisposed) {
            throw new Error(objectDisposed);
        }
    }

    /**
     * Multicasts the source sequence notifications through an instantiated subject into all uses of the sequence within a selector function. Each
     * subscription to the resulting sequence causes a separate multicast invocation, exposing the sequence resulting from the selector function's
     * invocation. For specializations with fixed subject types, see Publish, PublishLast, and Replay.
     * 
     * @example
     * 1 - res = source.multicast(observable);
     * 2 - res = source.multicast(function () { return new Subject(); }, function (x) { return x; });
     * 
     * @param {Mixed} subjectOrSubjectSelector 
     * Factory function to create an intermediate subject through which the source sequence's elements will be multicast to the selector function.
     * Or:
     * Subject to push source elements into.
     * 
     * @param {Function} [selector] Optional selector function which can use the multicasted source sequence subject to the policies enforced by the created subject. Specified only if <paramref name="subjectOrSubjectSelector" is a factory function.
     * @returns {Observable} An observable sequence that contains the elements of a sequence produced by multicasting the source sequence within a selector function.
     */
    observableProto.multicast = function (subjectOrSubjectSelector, selector) {
        var source = this;
        return typeof subjectOrSubjectSelector === 'function' ?
            new AnonymousObservable(function (observer) {
                var connectable = source.multicast(subjectOrSubjectSelector());
                return new CompositeDisposable(selector(connectable).subscribe(observer), connectable.connect());
            }) :
            new ConnectableObservable(source, subjectOrSubjectSelector);
    };

    /**
     * Returns an observable sequence that is the result of invoking the selector on a connectable observable sequence that shares a single subscription to the underlying sequence.
     * This operator is a specialization of Multicast using a regular Subject.
     * 
     * @example
     * 1 - res = source.publish();
     * 2 - res = source.publish(function (x) { return x; });
     * 
     * @param {Function} [selector] Selector function which can use the multicasted source sequence as many times as needed, without causing multiple subscriptions to the source sequence. Subscribers to the given source will receive all notifications of the source from the time of the subscription on.
     * @returns {Observable} An observable sequence that contains the elements of a sequence produced by multicasting the source sequence within a selector function.
     */
    observableProto.publish = function (selector) {
        return !selector ?
            this.multicast(new Subject()) :
            this.multicast(function () {
                return new Subject();
            }, selector);
    };

    /**
     * Returns an observable sequence that is the result of invoking the selector on a connectable observable sequence that shares a single subscription to the underlying sequence containing only the last notification.
     * This operator is a specialization of Multicast using a AsyncSubject.
     * 
     * @example
     * 1 - res = source.publishLast();
     * 2 - res = source.publishLast(function (x) { return x; });
     * 
     * @param selector [Optional] Selector function which can use the multicasted source sequence as many times as needed, without causing multiple subscriptions to the source sequence. Subscribers to the given source will only receive the last notification of the source.
     * @returns {Observable} An observable sequence that contains the elements of a sequence produced by multicasting the source sequence within a selector function.
     */
    observableProto.publishLast = function (selector) {
        return !selector ?
            this.multicast(new AsyncSubject()) :
            this.multicast(function () {
                return new AsyncSubject();
            }, selector);
    };

    /**
     * Returns an observable sequence that is the result of invoking the selector on a connectable observable sequence that shares a single subscription to the underlying sequence and starts with initialValue.
     * This operator is a specialization of Multicast using a BehaviorSubject.
     * 
     * @example
     * 1 - res = source.publishValue(42);
     * 2 - res = source.publishLast(function (x) { return x.select(function (y) { return y * y; }) }, 42);
     * 
     * @param {Function} [selector] Optional selector function which can use the multicasted source sequence as many times as needed, without causing multiple subscriptions to the source sequence. Subscribers to the given source will receive immediately receive the initial value, followed by all notifications of the source from the time of the subscription on.
     * @param {Mixed} initialValue Initial value received by observers upon subscription.
     * @returns {Observable} An observable sequence that contains the elements of a sequence produced by multicasting the source sequence within a selector function.
     */
    observableProto.publishValue = function (initialValueOrSelector, initialValue) {
        return arguments.length === 2 ?
            this.multicast(function () {
                return new BehaviorSubject(initialValue);
            }, initialValueOrSelector) :
            this.multicast(new BehaviorSubject(initialValueOrSelector));
    };

    /**
     * Returns an observable sequence that is the result of invoking the selector on a connectable observable sequence that shares a single subscription to the underlying sequence replaying notifications subject to a maximum time length for the replay buffer.
     * This operator is a specialization of Multicast using a ReplaySubject.
     * 
     * @example
     * 1 - res = source.replay(null, 3);
     * 2 - res = source.replay(null, 3, 500);
     * 3 - res = source.replay(null, 3, 500, scheduler);
     * 4 - res = source.replay(function (x) { return x.take(6).repeat(); }, 3, 500, scheduler);
     * 
     * @param selector [Optional] Selector function which can use the multicasted source sequence as many times as needed, without causing multiple subscriptions to the source sequence. Subscribers to the given source will receive all the notifications of the source subject to the specified replay buffer trimming policy.
     * @param bufferSize [Optional] Maximum element count of the replay buffer.
     * @param window [Optional] Maximum time length of the replay buffer.
     * @param scheduler [Optional] Scheduler where connected observers within the selector function will be invoked on.
     * @returns {Observable} An observable sequence that contains the elements of a sequence produced by multicasting the source sequence within a selector function.
     */
    observableProto.replay = function (selector, bufferSize, window, scheduler) {
        return !selector ?
            this.multicast(new ReplaySubject(bufferSize, window, scheduler)) :
            this.multicast(function () {
                return new ReplaySubject(bufferSize, window, scheduler);
            }, selector);
    };

    /** @private */
    var InnerSubscription = function (subject, observer) {
        this.subject = subject;
        this.observer = observer;
    };

    /**
     * @private
     * @memberOf InnerSubscription
     */
    InnerSubscription.prototype.dispose = function () {
        if (!this.subject.isDisposed && this.observer !== null) {
            var idx = this.subject.observers.indexOf(this.observer);
            this.subject.observers.splice(idx, 1);
            this.observer = null;
        }
    };

    /**
     *  Represents a value that changes over time.
     *  Observers can subscribe to the subject to receive the last (or initial) value and all subsequent notifications.
     */
    var BehaviorSubject = Rx.BehaviorSubject = (function (_super) {
        function subscribe(observer) {
            var ex;
            checkDisposed.call(this);
            if (!this.isStopped) {
                this.observers.push(observer);
                observer.onNext(this.value);
                return new InnerSubscription(this, observer);
            }
            ex = this.exception;
            if (ex) {
                observer.onError(ex);
            } else {
                observer.onCompleted();
            }
            return disposableEmpty;
        }

        inherits(BehaviorSubject, _super);

        /**
         *  Initializes a new instance of the BehaviorSubject class which creates a subject that caches its last value and starts with the specified value.
         *  
         *  @param value Initial value sent to observers when no other value has been received by the subject yet.
         */       
        function BehaviorSubject(value) {
            _super.call(this, subscribe);

            this.value = value,
            this.observers = [],
            this.isDisposed = false,
            this.isStopped = false,
            this.exception = null;
        }

        addProperties(BehaviorSubject.prototype, Observer, {
            /**
             * Indicates whether the subject has observers subscribed to it.
             * 
             * @memberOf BehaviorSubject# 
             * @returns {Boolean} Indicates whether the subject has observers subscribed to it.
             */         
            hasObservers: function () {
                return this.observers.length > 0;
            },
            /**
             * Notifies all subscribed observers about the end of the sequence.
             * 
             * @memberOf BehaviorSubject#
             */ 
            onCompleted: function () {
                checkDisposed.call(this);
                if (!this.isStopped) {
                    var os = this.observers.slice(0);
                    this.isStopped = true;
                    for (var i = 0, len = os.length; i < len; i++) {
                        os[i].onCompleted();
                    }

                    this.observers = [];
                }
            },
            /**
             * Notifies all subscribed observers about the exception.
             * 
             * @memberOf BehaviorSubject#
             * @param {Mixed} error The exception to send to all observers.
             */             
            onError: function (error) {
                checkDisposed.call(this);
                if (!this.isStopped) {
                    var os = this.observers.slice(0);
                    this.isStopped = true;
                    this.exception = error;

                    for (var i = 0, len = os.length; i < len; i++) {
                        os[i].onError(error);
                    }

                    this.observers = [];
                }
            },
            /**
             * Notifies all subscribed observers about the arrival of the specified element in the sequence.
             * 
             * @memberOf BehaviorSubject#
             * @param {Mixed} value The value to send to all observers.
             */              
            onNext: function (value) {
                checkDisposed.call(this);
                if (!this.isStopped) {
                    this.value = value;
                    var os = this.observers.slice(0);
                    for (var i = 0, len = os.length; i < len; i++) {
                        os[i].onNext(value);
                    }
                }
            },
            /**
             * Unsubscribe all observers and release resources.
             * 
             * @memberOf BehaviorSubject#
             */            
            dispose: function () {
                this.isDisposed = true;
                this.observers = null;
                this.value = null;
                this.exception = null;
            }
        });

        return BehaviorSubject;
    }(Observable));

    /**
     * Represents an object that is both an observable sequence as well as an observer.
     * Each notification is broadcasted to all subscribed and future observers, subject to buffer trimming policies.
     */  
    var ReplaySubject = Rx.ReplaySubject = (function (_super) {
        /** 
         * @private
         * @constructor
         */
        var RemovableDisposable = function (subject, observer) {
            this.subject = subject;
            this.observer = observer;
        };

        /* 
         * @private
         * @memberOf RemovableDisposable#
         */
        RemovableDisposable.prototype.dispose = function () {
            this.observer.dispose();
            if (!this.subject.isDisposed) {
                var idx = this.subject.observers.indexOf(this.observer);
                this.subject.observers.splice(idx, 1);
            }
        };

        function subscribe(observer) {
            var so = new ScheduledObserver(this.scheduler, observer),
                subscription = new RemovableDisposable(this, so);
            checkDisposed.call(this);
            this._trim(this.scheduler.now());
            this.observers.push(so);

            var n = this.q.length;

            for (var i = 0, len = this.q.length; i < len; i++) {
                so.onNext(this.q[i].value);
            }

            if (this.hasError) {
                n++;
                so.onError(this.error);
            } else if (this.isStopped) {
                n++;
                so.onCompleted();
            }

            so.ensureActive(n);
            return subscription;
        }

        inherits(ReplaySubject, _super);

        /**
         *  Initializes a new instance of the ReplaySubject class with the specified buffer size, window and scheduler.
         * 
         *  @param {Number} [bufferSize] Maximum element count of the replay buffer.
         *  @param {Number} [window] Maximum time length of the replay buffer.
         *  @param {Scheduler} [scheduler] Scheduler the observers are invoked on.
         */
        function ReplaySubject(bufferSize, window, scheduler) {
            this.bufferSize = bufferSize == null ? Number.MAX_VALUE : bufferSize;
            this.window = window == null ? Number.MAX_VALUE : window;
            this.scheduler = scheduler || currentThreadScheduler;
            this.q = [];
            this.observers = [];
            this.isStopped = false;
            this.isDisposed = false;
            this.hasError = false;
            this.error = null;
            _super.call(this, subscribe);
        }

        addProperties(ReplaySubject.prototype, Observer, {
            /**
             * Indicates whether the subject has observers subscribed to it.
             * 
             * @memberOf ReplaySubject# 
             * @returns {Boolean} Indicates whether the subject has observers subscribed to it.
             */         
            hasObservers: function () {
                return this.observers.length > 0;
            },            
            /*
             * @private
             * @memberOf ReplaySubject#
             */
            _trim: function (now) {
                while (this.q.length > this.bufferSize) {
                    this.q.shift();
                }
                while (this.q.length > 0 && (now - this.q[0].interval) > this.window) {
                    this.q.shift();
                }
            },
            /**
             * Notifies all subscribed observers about the arrival of the specified element in the sequence.
             * 
             * @memberOf ReplaySubject#
             * @param {Mixed} value The value to send to all observers.
             */              
            onNext: function (value) {
                var observer;
                checkDisposed.call(this);
                if (!this.isStopped) {
                    var now = this.scheduler.now();
                    this.q.push({ interval: now, value: value });
                    this._trim(now);

                    var o = this.observers.slice(0);
                    for (var i = 0, len = o.length; i < len; i++) {
                        observer = o[i];
                        observer.onNext(value);
                        observer.ensureActive();
                    }
                }
            },
            /**
             * Notifies all subscribed observers about the exception.
             * 
             * @memberOf ReplaySubject#
             * @param {Mixed} error The exception to send to all observers.
             */                 
            onError: function (error) {
                var observer;
                checkDisposed.call(this);
                if (!this.isStopped) {
                    this.isStopped = true;
                    this.error = error;
                    this.hasError = true;
                    var now = this.scheduler.now();
                    this._trim(now);
                    var o = this.observers.slice(0);
                    for (var i = 0, len = o.length; i < len; i++) {
                        observer = o[i];
                        observer.onError(error);
                        observer.ensureActive();
                    }
                    this.observers = [];
                }
            },
            /**
             * Notifies all subscribed observers about the end of the sequence.
             * 
             * @memberOf ReplaySubject#
             */             
            onCompleted: function () {
                var observer;
                checkDisposed.call(this);
                if (!this.isStopped) {
                    this.isStopped = true;
                    var now = this.scheduler.now();
                    this._trim(now);
                    var o = this.observers.slice(0);
                    for (var i = 0, len = o.length; i < len; i++) {
                        observer = o[i];
                        observer.onCompleted();
                        observer.ensureActive();
                    }
                    this.observers = [];
                }
            },
            /**
             * Unsubscribe all observers and release resources.
             * 
             * @memberOf ReplaySubject#
             */               
            dispose: function () {
                this.isDisposed = true;
                this.observers = null;
            }
        });

        return ReplaySubject;
    }(Observable));

    /** @private */
    var ConnectableObservable = (function (_super) {
        inherits(ConnectableObservable, _super);

        /**
         * @constructor
         * @private
         */
        function ConnectableObservable(source, subject) {
            var state = {
                subject: subject,
                source: source.asObservable(),
                hasSubscription: false,
                subscription: null
            };

            this.connect = function () {
                if (!state.hasSubscription) {
                    state.hasSubscription = true;
                    state.subscription = new CompositeDisposable(state.source.subscribe(state.subject), disposableCreate(function () {
                        state.hasSubscription = false;
                    }));
                }
                return state.subscription;
            };

            function subscribe(observer) {
                return state.subject.subscribe(observer);
            }

            _super.call(this, subscribe);
        }

        /**
         * @private
         * @memberOf ConnectableObservable
         */
        ConnectableObservable.prototype.connect = function () { return this.connect(); };

        /**
         * @private
         * @memberOf ConnectableObservable
         */        
        ConnectableObservable.prototype.refCount = function () {
            var connectableSubscription = null, count = 0, source = this;
            return new AnonymousObservable(function (observer) {
                var shouldConnect, subscription;
                count++;
                shouldConnect = count === 1;
                subscription = source.subscribe(observer);
                if (shouldConnect) {
                    connectableSubscription = source.connect();
                }
                return disposableCreate(function () {
                    subscription.dispose();
                    count--;
                    if (count === 0) {
                        connectableSubscription.dispose();
                    }
                });
            });
        };

        return ConnectableObservable;
    }(Observable));

    return Rx;
}));
};
__modules__["/sprites/autowraptext.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits");
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;
var Sprite = require("./sprite");
var AutoWrapTextTrait = require("../gprims/autowraptextgprim").AutoWrapTextTrait;

/**
@title{AutoWrapText}
*/

/**
@iclass[AutoWrapText Sprite (AutoWrapTextTrait)]{
  自动换行文本精灵，它使用了AutoWrapTextTrait，具有AutoWrapTextTrait上所有属性和方法。    
  @grant[AutoWrapTextTrait type #:attr 'READONLY]
  @grant[AutoWrapTextTrait text #:attr 'CUSTOM_SETTER]
  @grant[AutoWrapTextTrait gprims #:attr 'CUSTOM_SETTER]
  @grant[AutoWrapTextTrait styles #:attr 'CUSTOM_SETTER]
  @grant[AutoWrapTextTrait maxWidth #:attr 'CUSTOM_SETTER]
  @grant[AutoWrapTextTrait maxHeight #:attr 'CUSTOM_SETTER]
  @grant[AutoWrapTextTrait align #:attr 'CUSTOM_SETTER]
  @grant[AutoWrapTextTrait lineSpacing #:attr 'CUSTOM_SETTER]
  @grantMany[AutoWrapTextTrait fillFlag strokeStyle strokeFlag id tag fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY] 
  @constructor[AutoWrapText]{
    @param[param object]{
      @verbatim|{
        初始化参数对象包含的属性可以为：
        id:id值。
        tag:tag标签。
        text: 文本内容。
        styles:每行的style组成的数组。
        fillStyle：整个文本的fillStyle。如果styles中设置，则以styles为先。
        strokeStyle：整个文本的strokStyle。如果styles中设置，则以styles为先。
        maxWidth：最大宽度。
        maxHeight：最大高度。
        align:对齐方式。
        lineSpacing：行间距。
        x:精灵的x坐标。
        y:精灵的y坐标。
        z:精灵的z坐标。
        ratioAnchor: 百分比设置锚点。
        anchor：锚点。
        strokeFlag、fillFlag、shadowColor、shadowBlur、shadowOffsetX、shadowOffsetY
      }|
    }
    创建一个创建AutoWrapText类型的对象。
  }
}
**/
var AutoWrapText = Sprite.extend({
  initialize: function(param)
  {
    this.execProto("initialize", {gprim:this, interactable:((param == undefined) ? undefined : param.interactable)});
    this.subTraits(0).__init(param);
  }
},
[[READONLY("type"), AutoWrapTextTrait.grant("type")], [CUSTOM_SETTER("text"), AutoWrapTextTrait.grant("text")], 
  [CUSTOM_SETTER("styles"), AutoWrapTextTrait.grant("styles")], [CUSTOM_SETTER("maxWidth"), AutoWrapTextTrait.grant("maxWidth")],
  [CUSTOM_SETTER("maxHeight"), AutoWrapTextTrait.grant("maxHeight")], [CUSTOM_SETTER("align"), AutoWrapTextTrait.grant("align")],
  [CUSTOM_SETTER("lineSpacing"), AutoWrapTextTrait.grant("lineSpacing")], [CUSTOM_SETTER("gprims"), AutoWrapTextTrait.grant("gprims")],
  [CUSTOM_SETTER("strokeStyle"), AutoWrapTextTrait.grant("strokeStyle")], [CUSTOM_SETTER("fillStyle"), AutoWrapTextTrait.grant("fillStyle")],
  [CUSTOM_SETTER("shadowColor"), AutoWrapTextTrait.grant("shadowColor")]].concat(
  AutoWrapTextTrait.grantMany(["fillFlag", "strokeFlag", "id", "tag", "shadowBlur", "shadowOffsetX", "shadowOffsetY"])),
[AutoWrapTextTrait]);

export$(AutoWrapText);
};
__modules__["/treeactorbase.js"] = function(require, load, export$) {
var Trait = require("./lib/colortraits").Trait;
var Actor = require("actor");
var debug = require("./lib/debug");
var util = require("./lib/util");
var arraySome = util.arraySome;
var arrayReduce = util.arrayReduce;

/**
@itrait[TreeTrait]{
  树状组织结构的功能单元，TreeActor会使用该trait用来拥有树状组织结构能力。
}
*/
var TreeTrait = Trait.extend({
/**
@method[__init #:hidden]{
  @trait[TreeTrait]
  @return[this]{}
  TreeTrait的初始化函数,函数中会监听actor上system消息流，主要处理active消息。
}
*/
  __init : function()
  {
    this._t.setchildren([]);

    var self = this;
    function cb(evt){
      if(evt.type == "active"){
        //清理monitor
        var monitor = self.getMonitor();
        if(!!monitor && (monitor.getHost() !== self)){
          self.clearMonitor();
        }
        //关联父亲的monitor
        var pMonitor = self.parent().getMonitor()
        if(!pMonitor){
          return;//父亲没有monitor
        }else{
          self.applyMonitor(pMonitor);
        }

        //更新自身monitor的level
        self.updateMonitorLevel();

        //通知事件给上层的monitor
        pMonitor.notify({
          member:self
        });
      }
    }
    this.subscribe("system", cb);
  },

/**
@method[setParent #:hidden]{
  @trait[TreeTrait] 
  @return[this]{}
  设置当前节点的父节点，此方法仅供treeactor内部使用。
}
*/
  setParent:function(parent)
  {
    this._t.setparent(parent);

    return this;
  },

/**
@method[parent]{
  @trait[TreeTrait] 
  @return[treeactor]{}
  获取当前节点的父节点。
}
*/
  parent:function()
  {
    return this._t.parent();
  },
/**
@method[children]{
  @trait[TreeTrait]
  @return[array]{}
  获取当前节所有孩子。
}
*/
  children:function()
  {
    return this._t.children();
  },
/**
@method[_appendChild #:hidden]{
  @trait[TreeTrait]
  @param[child treeactor]{}
  @return[this]{}
  添加一个孩子节点。
}
*/
  _appendChild: function(child)
  {
    debug.assert(child.parent() == undefined, "parameter error");

    this._t.children().push(child);
    child.setParent(this);
    child.setDepTransformable(this);
  },
/**
@method[_removeChild #:hidden]{
  @trait[TreeTrait]
  @param[child treeactor]{}
  @return[this]{}
  删除一个孩子节点。
}
*/
  _removeChild: function(child)
  {
    var idx = this._t.children().indexOf(child);
    
    debug.assert(idx != -1, "logical error, You remove an unexist child");
    
    child.setDepTransformable(null);
    child.setParent(null);
    return (this.children().splice(idx, 1))[0];
  },
  /**
  @method[_replaceChild #:hidden]{
    @trait[TreeTrait]
    @param[oldChild treeactor]{
      被替换者。
    }
    @param[newChild treeactor]{
      替换者。
    }
    @return[this]{}
    替换一个孩子节点。
  }
  */
  _replaceChild: function(oldChild,newChild)
  {
    var idx = this._t.children().indexOf(oldChild);
    
    debug.assert(idx != -1, "logical error, You replace an unexist child");
    
    newChild.setDepTransformable(this);
    newChild.setParent(this);
    oldChild.setDepTransformable(null);
    oldChild.setParent(null);

    var tmpArr = [];
    var childs = oldChild.children();
    for (var i = 0; i < childs.length; i++) {
      tmpArr.push(childs[i]);
    };
    for (var i = 0; i < tmpArr.length; i++) {
      oldChild.removeChild(tmpArr[i]);
      newChild.addChild(tmpArr[i]);
    };

    this._t.children()[idx] = newChild;

    return oldChild;
  },
/**
@method[addChild]{
  @trait[TreeTrait]
  @param[child treeactor]{}
  @return[this]{}
  添加一个孩子节点。
}
*/
  addChild : function(child)
  {
    if(this.ownerScene())
      this.ownerScene().add(child, this);
    else
      this._appendChild(child);

    return this;
  },
/**
@method[removeChild]{
  @trait[TreeTrait]
  @param[child treeactor]{}
  @return[this]{}
  删除一个孩子节点,如果该节点处于场景中，需要调用场景的接口删除。
}
*/
  removeChild: function(child)
  {
    if(this.ownerScene())
      this.ownerScene().remove(child);
    else
      this._removeChild(child);

    return this;
  },
  /**
    @method[replaceChild]{
    @trait[TreeTrait]
    @param[oldChild treeactor]{
      被替换者。
    }
    @param[newChild treeactor]{
      替换者。
    }
    @return[this]{}
    替换一个孩子节点,如果该节点处于场景中，需要调用场景的接口删除。
  }
  */
  replaceChild: function(oldChild,newChild)
  {
    if(oldChild === newChild){
      return null;
    }

    if(this.ownerScene())
      return this.ownerScene().replace(oldChild,newChild);
    else
      return  this._replaceChild(oldChild,newChild);   
  },
/**
@method[removeAllChildren]{
  @trait[TreeTrait]
  @return[this]{}
  删除所有的孩子节点，如果父节点处于场景中，需要调用场景的接口删除。
}
*/
  removeAllChildren: function()
  {
    var ownerScene = this.ownerScene();
    var bInScene = ownerScene == undefined ? false : true;

    if(bInScene)
    {
      var len = this.children().length();

      for(var i = 0; i < len; ++i)
      {
        ownerScene.remove(child);
      }
    }
    
    this.setchildren([]);

    return this;
  },
/**
@method[root]{
  @trait[TreeTrait]
  @return[treeActor]{rootActor}
  返回该节点所属的根节点。
}
*/
  root : function()
  {
    var root = this;
    var rootParent = root.parent();

    while(rootParent)
    {
      root = rootParent;
      rootParent = root.parent();
    }

    return root;
  },
/**
@method[some]{
  @trait[TreeTrait]
  @param[f function]{}
  @return[array]{actor array}
  遍历这个子树，返回所有符合f条件(f返回true)的节点。
}
*/
  some:function(f)
  {
    var children = this.children();
    
    if (true == f(this))
      return true;

    return arraySome(children, function(child)
                         {
                           return child.some(f);
                         });
  },

  reduceChildren:function(f, initialize)
  {
    var ret;

    ret = f(initialize, this);

    var children = this.children();

    arrayReduce(children, function(prev, cur)
                          {
                            return cur.reduceChildren(f, prev);
                          },
                          ret);

    return initialize;
  },

  reduce:function(f, initialize)
  {
    var bInitializeSupplied = false;
    if(initialize != null)
      bInitializeSupplied = true;
    var ret;

    if (false == bInitializeSupplied)
    {
      ret = this;
    }
    else
    {
      ret = f(initialize, this);
      if(ret == null) ret = initialize;
    }

    var children = this.children();

    ret = arrayReduce(children, function(prev, cur)
                          {
                            return cur.reduce(f, prev);
                          },
                          ret);

    return ret;
  },
/**
@method[forEach]{
  @trait[TreeTrait]
  @param[f funciton]{}
  @return[undefined]{}
  遍历当前子树，并对每一个节点调用f
}
*/
  forEach:function(f)
  {
    var newf = function(prev, cur)
    {
      f(cur);
    };

    return this.reduce(newf, true);
  },
/**
@method[serializeChildren]{
  @trait[TreeTrait]
  @param[arr array]{}
  @return[array]{}
  序列化当前子树，如果节点不满足filter条件(filter返回false)则把它放到序列化队列中。
}
*/
  serializeChildren:function(arr, filter)
  {
    var self = this;
    return this.reduce( 
                     function(prev, n)
                     {
                       if (filter == undefined || filter(n))
                         prev.push(n);

                       return prev;
                     },
                     arr);
  },
/**
@method[applyMonitor #:hidden]{
  @trait[TreeTrait]
  @param[m monitor]{}
  @return[this]{}
  将监视器作用到当前actor上。
}
*/
  applyMonitor:function(m)
  {
    var monitor = this._t.monitorpointer();
    if(!monitor)
    {
      this._t.setmonitorpointer(m);
    }else
    {
      debug.assert(monitor.getHost() === this,"monitor host must be itself.");
      monitor.setIntersector(m);
    }
    return this;
  },
/**
@method[getMonitor #:hidden]{
  @trait[TreeTrait]
  @return[monitor]{}
  获得监视器。
}
*/
  getMonitor:function()
  {
    return this._t.monitorpointer();
  },
/**
@method[clearMonitor #:hidden]{
  @trait[TreeTrait]
  @return[this]{}
  清除监视器。
}
*/
  clearMonitor:function()
  {
    this._t.setmonitorpointer(undefined);
    return this;
  },
  //被带有监视器的孩子节点重载
  updateMonitorLevel:function()
  {

  }},
 ["parent", "children","monitorpointer"]
);

/**
@iclass[TreeActor Actor (TreeTrait)]{
  TreeActor中默认会以树状的结构组织精灵。
  @constructor[TreeActor]{
    @param[param object]{创建树状精灵所需参数。}
  }
  @jscode{
    //创建一个树状精灵。
    Actor.create({
      interactable:false
    });
  }
}
*/
var TreeActor = Actor.extend({
  initialize: function(param)
  {
    this.execProto("initialize", param);    
    this.subTraits(0).__init();
  }
}, [], [TreeTrait]);
export$({
  TreeActor:TreeActor,
  TreeTrait:TreeTrait
});

};
__modules__["/sprites/rect.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits");
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;
var Sprite = require("./sprite");
var RectTrait = require("../gprims/rectgprim").RectTrait;


/**
@title{Rect}
*/

/**
@iclass[Rect Sprite (RectTrait)]{
  矩形精灵，它使用了 RectTrait ，具有 RectTrait 上所有属性和方法。
  @grant[RectTrait type #:attr 'READONLY]
  @grant[RectTrait lineWidth #:attr 'READONLY]
  @grant[RectTrait width #:attr 'CUSTOM_SETTER]
  @grant[RectTrait height #:attr 'CUSTOM_SETTER]
  @grantMany[RectTrait id tag strokeStyle fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY fillFlag strokeFlag]
}
**/
var Rect = Sprite.extend({
  initialize: function(param)
  {
    this.execProto("initialize", {gprim:this, interactable:((param == undefined) ? undefined : param.interactable)});
    this.subTraits(0).__init(param);
  }
},
 [[READONLY("type"), RectTrait.grant("type")], [CUSTOM_SETTER("lineWidth"), RectTrait.grant("lineWidth")],
  [CUSTOM_SETTER("strokeStyle"), RectTrait.grant("strokeStyle")], [CUSTOM_SETTER("fillStyle"), RectTrait.grant("fillStyle")],
  [CUSTOM_SETTER("shadowColor"), RectTrait.grant("shadowColor")]].concat(
  RectTrait.grantMany(["fillFlag", "strokeFlag", "id", "tag", "shadowBlur", "shadowOffsetX", "shadowOffsetY"])),
 [RectTrait]);

export$(Rect);
};
__modules__["/sprites/arc.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits");
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;
var Sprite = require("./sprite");
var ArcTrait = require("../gprims/arcgprim").ArcTrait;


/**
@title{Arc}
*/

/**
@iclass[Arc Sprite (ArcTrait)]{
  弧线精灵，它使用了 ArcTrait， 具有ArcTrait上所有属性和方法。
  
  @grant[ArcTrait type #:attr 'READONLY]
  @grant[ArcTrait radius #:attr 'READONLY]
  @grant[ArcTrait startAngle #:attr 'READONLY]
  @grant[ArcTrait endAngle #:attr 'READONLY]
  @grant[ArcTrait anticlockwise #:attr 'READONLY]
  @grant[ArcTrait lineWidth #:attr 'READONLY]
  @grantMany[ArcTrait strokeFlag id tag strokeStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineCap lineDash] 
}
**/
var Arc = Sprite.extend({
  initialize: function(param)
  {
    this.execProto("initialize", {gprim:this, interactable:((param == undefined) ? undefined : param.interactable)});
    this.subTraits(0).__init(param);
  }
},
 [[READONLY("type"), ArcTrait.grant("type")], [CUSTOM_SETTER("radius"), ArcTrait.grant("radius")],
  [CUSTOM_SETTER("startAngle"), ArcTrait.grant("startAngle")], [CUSTOM_SETTER("endAngle"), ArcTrait.grant("endAngle")],
  [CUSTOM_SETTER("anticlockwise"), ArcTrait.grant("anticlockwise")],[CUSTOM_SETTER("lineWidth"), ArcTrait.grant("lineWidth")],
  [CUSTOM_SETTER("strokeStyle"), ArcTrait.grant("strokeStyle")], [CUSTOM_SETTER("shadowColor"), ArcTrait.grant("shadowColor")]].concat(
  ArcTrait.grantMany(["strokeFlag", "id", "tag", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineCap", "lineDash"])),
[ArcTrait]);

export$(Arc);
};
__modules__["/painter/honestpainter.js"] = function(require, load, export$) {
var debug = require("../lib/debug");
var assert = require("../lib/debug").assert;
var abs = Math.abs;
var pow = Math.pow;
var CanvasEventObservables = require("../lib/canvasobservable").CanvasEventObservables;
var Klass = require("../lib/colortraits").Klass
,   Trait = require("../lib/colortraits").Trait;

var util = require("../lib/util");

var geometry = require("../lib/geometry"),geometry;
var arrayForEach = util.arrayForEach;

/**
* @section{概述}
顶视角图元绘制器。
colorbox中，gprim代表可视化图元，而这个图元由什么去绘制，则是由painter决定。colorbox将canvas作为默认的绘制器。
*/

/**
@subsection{imageDrawMode}

imageDrawMode: 图像绘制的constraintmode属性的显示设置哈希表。
   }
**/
var imageDrawMode = {
  fitWidth: function(wh, drawparam, param)
  {
    if(!drawparam.x[1] && !drawparam.width[1]){
      drawparam.sx[1] = true;
      drawparam.swidth[1] = true;
      drawparam.x[1] = true;
      drawparam.width[1] = true;
      drawparam.width[0] = wh.gprimw;
    }
  },
  fitHeight: function(wh, drawparam, param)
  {
    if(!drawparam.y[1] && !drawparam.height[1]){
      drawparam.sy[1] = true;
      drawparam.sheight[1] = true;
      drawparam.y[1] = true;
      drawparam.height[1] = true;
      drawparam.height[0] = wh.gprimh;
    }        
  },
  uniformScale: function(wh, drawparam, param)
  {
    if(drawparam.width[1] && !drawparam.height[1]) {
      drawparam.height[0] = wh.imgh*wh.gprimw/wh.imgw;
      drawparam.height[1] = true;
    } else if(drawparam.height[1] && !drawparam.width[1]) {
      drawparam.width[0] = wh.imgw*wh.gprimh/wh.imgh;
      drawparam.width[1] = true;
    }    
  },
  place: function(wh, drawparam, param) 
  {
    if(!drawparam.x[1] && param[3] !== "yAlign"){
      if(drawparam.width[1]){
        drawparam.x[0] = param[1]*wh.gprimw - param[0]*drawparam.width[0];
      }else {
        drawparam.x[0] = param[1]*wh.gprimw - param[0]*wh.imgw;
      }      
      drawparam.x[1] = true;
    } else if(!drawparam.y[1]){
      if(drawparam.height[1]){
        drawparam.y[0] = param[1]*wh.gprimh - param[0]*drawparam.height[0];
      }else {
        drawparam.y[0] = param[1]*wh.gprimh - param[0]*wh.imgh;
      }      
      drawparam.y[1] = true;
    }
  }, 
  cut: function(wh, drawparam, param)
  {
    if(!drawparam.sx[1]){
      drawparam.sx[1] = true;
      drawparam.sx[0] = -drawparam.x[0];
      drawparam.swidth[0] = wh.gprimw*wh.imgh/wh.gprimh;
    }

    if(!drawparam.sy[1]){
      drawparam.sy[1] = true;
      drawparam.sy[0] = -drawparam.y[0];
      drawparam.sheight[0] = wh.gprimh*wh.imgw/wh.gprimw;
    }

    drawparam.x[0] = 0;
    drawparam.y[0] = 0;
    drawparam.width[0] = wh.gprimw;
    drawparam.height[0] = wh.gprimh;                  
  }
}

var beginDrawMode = function (m, ctx)
{
  // var oldStyles = {lineWidth: ctx.lineWidth, fillStyle: ctx.fillStyle, strokeStyle:ctx.strokeStyle,
  //   lineCap: ctx.lineCap, lineJoin: ctx.lineJoin, miterLimit: ctx.miterLimit};
  //目前没有找到需要自己保存的属性

  ctx.save();
  m.applyStyle(ctx);

}

var endDrawMode = function (ctx)
{
  ctx.restore();
}


/**
@subsection{pathDraw}

pathDraw：path绘制函数哈希表。每一种想要被绘制的path路径在pathDraw哈希表中都注册有相应类型的绘制函数。

注册的draw函数格式为：
   @function[draw]{
      某个pathtype的绘制函数。
     @param[pathelement]{
       pathelement；需要进行绘制的pathelement。
      }
      @param[当前的位置]{
        currentpoint: 当前时刻绘制点位于的位置。
      }
      @param[painter]{
       painter；当前所使用的绘制器。
      }      
     @return{}
   }
**/
var pathDraw = {
  M: function (pathelement, ctx) 
  {
    var point = pathelement.point();
    ctx.moveTo(point.x, point.y);
  },
  L: function(pathelement, ctx)
  {
    var point = pathelement.point();
    ctx.lineTo(point.x, point.y);
  },
  Q: function(pathelement, ctx)
  {
    var point = pathelement.point();
    var controlpoint = pathelement.controlpoint();
    ctx.quadraticCurveTo(controlpoint.x, controlpoint.y, point.x, point.y);
  },
  C: function(pathelement, ctx)
  {
    var point = pathelement.point();
    var controlpoint1 = pathelement.controlpoint1();
    var controlpoint2 = pathelement.controlpoint2();
    ctx.bezierCurveTo(controlpoint1.x, controlpoint1.y, controlpoint2.x, controlpoint2.y, point.x,  point.y);
  },
  A: function(pathelement, ctx)
  {
    var rx = pathelement.rx();
    var ry = pathelement.ry();
    var point = pathelement.point();
    if(rx === 0 || ry === 0){
      ctx.lineTo(point.x, point.y);
      return;
    }
    var center_x = pathelement.center().x;
    var center_y = pathelement.center().y;    
    var largearcflag = pathelement.largearcflag();
    var sweepflag = pathelement.sweepflag(); 
    //var currentpoint = pathelement.prepoint();
    var xaxisrotate = pathelement.xaxisrotate();
    
    var startAngle = pathelement.startAngle();
    var endAngle = pathelement.endAngle();

    // if(point.x == currentpoint.x && point.y == currentpoint.y)
    // {
    //   return;
    // }
    
    var sweep = sweepflag === 1 ? false : true; //这里svg和ellipse是相反的，所以这里用svg的
    //ctx.ellipse(center_x, center_y, rx, ry, xaxisrotate, startAngle, endAngle, sweep);

    ctx.translate(center_x, center_y);
    ctx.rotate(xaxisrotate);
    var max = rx > ry ? rx : ry;
    ctx.scale(rx/max, ry/max);
    ctx.arc(0, 0, max, startAngle , endAngle,  sweep);
    ctx.scale(max/rx, max/ry);
    ctx.rotate(-xaxisrotate);
    ctx.translate(-center_x, center_y);

  },

  Z: function(pathelement, ctx)
  {
    ctx.closePath();
  }
}

var _drawBBoxPath = function(m,painter,ctx){
    var b = m.bbox();
    ctx.lineTo(b.width,0);
    ctx.lineTo(b.width,b.height);
    ctx.lineTo(0,b.height);
    ctx.lineTo(0,0);
}


var _hvDrawPath = {
  defaultPath:function(m,painter,ctx){
    _drawBBoxPath(m,painter,ctx);
  },
  circle:function(gp,painter,ctx){
    var r = gp.radius();
    ctx.translate(r, r);
    ctx.arc(0, 0, r, Math.PI*2, 0, true);
    ctx.translate(-r, -r);
  },
  polygon:function(gp,painter,ctx){
    var vs = gp.vertexes();
    for (var i in vs){
      var p = vs[i];
      ctx.lineTo(p.x, p.y);
    }
  },
  line: function(m,painter, ctx)
  {    
    var ls = m.vertexes();
    if(ls == null || ls.length < 1){
      return;
    }

    ctx.moveTo(ls[0].x, ls[0].y);
    for (var i = 1; i<ls.length; i++)
    {
      ctx.lineTo(ls[i].x, ls[i].y);
    }
  },

  arc: function(m, painter, ctx)
  {  
    ctx.arc(0, 0, m.radius(), m.startAngle(), m.endAngle(), m.anticlockwise());
  },
  path: function(m, painter, ctx)
  {
    var ls = m.pathElements();
    if(ls == null || ls.length < 2 || ls[0].type() != "M" || ls[1].type() == "Z"){
      return;
    }
    for(var i = 0, length = ls.length; i < length; i++){
      var type = ls[i].type();
      var f = pathDraw[type];
      f(ls[i], ctx);
    }
  },

  turtle: function(m, painter, ctx)
  {
    var ls = m.pathElements();
    if(ls == null || ls.length < 1  || ls[0].type == "Z"){
      return;
    }
    
    ctx.moveTo(0, 0);  
    for(var i = 0, length = ls.length; i < length; i++)
    {
      ctx.rotate(ls[i].angle());
      var type = ls[i].type();
      var f = pathDraw[type];
      f(ls[i], ctx);
      var point = ls[i].point();
      ctx.translate(point.x, point.y);
    }
  },

  annulus: function(m, painter, ctx)
  {
    var startAngle = m.startAngle();
    var endAngle = m.endAngle();
    var innerradius = m.innerradius();
    var outerradius = m.outerradius();
    ctx.moveTo(innerradius*Math.cos(startAngle), innerradius*Math.sin(startAngle));
    ctx.lineTo(outerradius*Math.cos(startAngle), outerradius*Math.sin(startAngle));
    ctx.arc(0, 0, m.outerradius(), m.startAngle(), m.endAngle(), m.anticlockwise());
    ctx.lineTo(innerradius*Math.cos(endAngle), innerradius*Math.sin(endAngle));
    ctx.arc(0, 0, m.innerradius(), m.endAngle(), m.startAngle(), !m.anticlockwise()); 
  }
}

var hvClip = function(clipper,painter,ctx){
  var mat = clipper.owner().matrix();
  var gp = clipper.gprim();
  //利用setTransform接口，避免了求逆矩阵。
  ctx.setTransform(mat.a, mat.b, mat.c, mat.d, mat.tx, mat.ty);
  var gprimmat = gp.matrix();
  ctx.transform(gprimmat.a, gprimmat.b, gprimmat.c, gprimmat.d, gprimmat.tx, gprimmat.ty);
    
  ctx.beginPath();
  var f = _hvDrawPath[gp.type()];
  if(!f){
    _hvDrawPath["defaultPath"](gp,painter,ctx);
  }else{
    f(gp,painter,ctx);
  }
  ctx.closePath();
  ctx.clip();
}
/**
@subsection{hvDraw}

hvDraw：图元绘制函数哈希表。每一种想要被显示的图元必须往hvDraw哈希表中注册相应类型的绘制函数。


注册的draw函数格式为：
   @function[draw]{
      某个图元的绘制函数。
     @param[m]{
       gprim；需要进行绘制的图元。。
      }
      @param[painter]{
       painter；当前所使用的绘制器。
      }
     @return{}
   }
**/
var hvDraw = {
  gprim: function (m,painter,ctx)
  {
    
  },

  image : function (m, painter, ctx)
  {
    var img = m.image();
    if (img.complete && img.naturalWidth != 0)
    {  
      var alpha = m.alpha();
      var gAlpha = ctx.globalAlpha;
      if(alpha != gAlpha)
      {
        ctx.globalAlpha *= alpha;
      }      

      var constraintmode = m.constraintmode();
      if(constraintmode == undefined){
        ctx.drawImage(img, 0, 0);
        return;
      }
 
      var gprimWidth = m.width();
      var gprimHeight = m.height();
      var imgWidth = img.width;
      var imgHeight = img.height;

      var wh = {imgw: imgWidth, imgh: imgHeight, gprimw: gprimWidth, gprimh: gprimHeight};
      var drawparam = {sx: [0, false], sy: [0, false], swidth: [imgWidth, false], sheight: [imgHeight, false], x: [0, false], y: [0, false], width: [imgWidth, false], height: [imgHeight, false]};   
      
      var type, j, f, length = constraintmode.length;
      for (j = 0; j < length; j++) {    
        type = constraintmode[j].type;
        if(type === "fitHeight" || type === "fitWidth"){
          f = imageDrawMode[type];
          f(wh, drawparam, constraintmode[j].param);
          break;
        }
      }    

      var cutflag;
      for(j = 0; j < length; j++) {
        type = constraintmode[j].type;
        if(type == "cut"){
          cutflag = "cut";
          continue;
        }
        f = imageDrawMode[type];
        f(wh, drawparam, constraintmode[j].param);
      }

      if(cutflag === "cut"){
        f = imageDrawMode[cutflag];
        f(wh, drawparam);
      }

      ctx.drawImage(img, drawparam.sx[0], drawparam.sy[0], drawparam.swidth[0], drawparam.sheight[0], drawparam.x[0], drawparam.y[0], drawparam.width[0], drawparam.height[0]);         
      
      ctx.globalAlpha = gAlpha;
    }
    else
    {
      if (painter.showUnloadedImage())
      {
        ctx.fillStyle = "white";

        ctx.fillRect(5, 5, m.width()-10, m.height()-10);

        var oldWidth = ctx.lineWidth;

        ctx.lineWidth = 5;
        ctx.fillStyle = "blue";
        ctx.strokeStyle = "blue";

        ctx.beginPath();
        ctx.moveTo(5, 5);
        ctx.lineTo(m.width()-11, m.height()-11);

        ctx.moveTo(m.width()-11, 5);
        ctx.lineTo(5, m.height()-15);

        ctx.stroke();

        var oldTextBaseline = ctx.textBaseline;
        
        ctx.font = "18 Arial";
        ctx.textBaseline = "top";

        /*ctx.fillText("未加载\n的图片", 0, 0);*/
        ctx.fillText("未加载图片", 0, 0);
        ctx.textBaseline = oldTextBaseline;
      }
    }

  },

  circle : function (m, painter, ctx)
  {
    beginDrawMode(m, ctx);

    ctx.beginPath();
    _hvDrawPath[m.type()](m,painter,ctx);
    //ctx.closePath();

    if (m.fillStyle() != undefined || m.fillFlag())
      ctx.fill();
    
    if (m.strokeStyle() != undefined || m.strokeFlag())
      ctx.stroke();

    endDrawMode(ctx);
  },

  polygon : function (m, painter, ctx)//pol
  {
    var vs = m.vertexes();
    beginDrawMode(m, ctx);

    ctx.beginPath();
    _hvDrawPath[m.type()](m,painter,ctx);
    ctx.closePath();

    if (m.fillStyle() != undefined || m.fillFlag())
      ctx.fill();
    if (m.strokeStyle() != undefined || m.strokeFlag())
      ctx.stroke();

    endDrawMode(ctx);
  },

  text: function (m, painter, ctx)
  {
    var str = m.text();
    beginDrawMode(m, ctx);

    //FIXME:text 不能直接从0 0开始画，这样显示的是从baseline还是什么位置开始画的。同理boundingbox也需要调整。
    ctx.font = m.fontString();

    var oldTextBaseline = ctx.textBaseline;

    ctx.textBaseline = "middle";
    var halfheight = m.font().size/2;

    if(m.fillStyle() != undefined || m.fillFlag())
      ctx.fillText(str, 0, halfheight);
    if(m.strokeStyle() != undefined || m.strokeFlag())
      ctx.strokeText(str, 0, halfheight);
    else if(m.fillStyle() == undefined && !m.fillFlag())
      ctx.fillText(str, 0, halfheight);

    ctx.textBaseline = oldTextBaseline;

    endDrawMode(ctx);
  },
  

  map: function (m, painter, ctx)
  {
    var map = m.map;
    var width = painter._canvas.width, height = painter._canvas.height;

    map.paint(ctx, 
              0, 0, width, height,
              0, 0, width, height);
  },

  line: function(m, painter, ctx)
  {    
    beginDrawMode(m, ctx);

    var ls = m.vertexes();
    if(ls == null || ls.length < 1)
      return;
    
    ctx.beginPath();
    _hvDrawPath[m.type()](m,painter,ctx);
    //ctx.closePath();

    ctx.stroke();
    //ctx.closePath();  

    endDrawMode(ctx);
  },

  arc: function(m, painter, ctx)
  {  
    beginDrawMode(m, ctx);
    
    ctx.beginPath();
    _hvDrawPath[m.type()](m,painter,ctx);
    //ctx.closePath();

    ctx.stroke();
    endDrawMode(ctx);
  },

  clip: function(m, painter, ctx)
  {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0,0,m.clipw(), m.cliph());
    ctx.clip();
    ctx.translate(-m.clipx(), -m.clipy());
    painter.draw(m.gprim());
    ctx.closePath();
    ctx.restore();    
  },

  proceduregprim: function(m, painter, ctx)
  {
    m.draw(m, painter);
  },

  composite: function(m, painter, ctx)
  {
     //FIXME: 这里貌似要对gprim进行排序。。。还是在camera模块中排序？
     //这里有问题的，需要对于
    beginDrawMode(m, ctx); 
    //console.log("beg");
    var i = 0;

    for(var i=0, length = m.gprims().length; i < length; ++i)
    {
      var subm = m.gprims()[i];
      
      painter.draw(subm, ctx);
    }

    endDrawMode(ctx);
  },

  path: function(m, painter, ctx)
  {
    var ls = m.pathElements();
    if(ls == null || ls.length < 2 || ls[0].type() != "M" || ls[1].type() == "Z")
      return;
    
    beginDrawMode(m, ctx); 
    
    ctx.beginPath();
    _hvDrawPath[m.type()](m,painter,ctx);

    if((m.fillStyle() != undefined || m.fillFlag()) && ls[ls.length - 1].type() == "Z")
    {
      //ctx.fillStyle = m.fillStyle;
      ctx.fill();
    }
    if(m.strokeStyle() != undefined || m.strokeFlag()){
      ctx.stroke();
    }
    endDrawMode(ctx);
  },

  turtle: function(m, painter, ctx)
  {
    var ls = m.pathElements();
    if(ls == null || ls.length < 1  || ls[0].type == "Z")
      return;
    
    beginDrawMode(m, ctx);
    ctx.beginPath();
    ctx.moveTo(0, 0);  
    for(var i = 0, length = ls.length; i < length; i++)
    {
      ctx.rotate(ls[i].angle());
      var type = ls[i].type();
      var f = pathDraw[type];
      f(ls[i], ctx);
      var point = ls[i].point();
      ctx.translate(point.x, point.y);
    }
    //ctx.closePath();
    if((m.fillStyle() != undefined || m.fillFlag()) && ls[ls.length - 1].type() == "Z")
    {
      //ctx.fillStyle = m.fillStyle;
      ctx.fill();
    }
    if(m.strokeStyle() != undefined || m.strokeFlag()){
      ctx.stroke();
    }
    endDrawMode(ctx);
  },

  annulus: function(m, painter, ctx)
  {
    beginDrawMode(m, ctx);
    
    ctx.beginPath();
    _hvDrawPath[m.type()](m,painter,ctx);

    if(m.fillStyle() != undefined || m.fillFlag())
    {
      ctx.fill();
    }
    if(m.strokeStyle() != undefined || m.strokeFlag())
    {
      ctx.stroke();
    }
    endDrawMode(ctx);    
  },

  rect:function(m, painter, ctx)
  {
    beginDrawMode(m, ctx);
    ctx.beginPath();
    ctx.rect(0, 0, m.width(), m.height());

    if(m.fillStyle() != undefined || m.fillFlag())
    {
      ctx.fill();
    }
    if(m.strokeStyle() != undefined || m.strokeFlag())
    {
      ctx.stroke();
    }

    endDrawMode(ctx);
  }
};



var doEffect = function(painter, effect)
{
  var ctx = painter.getContext("2d");
  if (effect.alpha != undefined)
    ctx.globalAlpha *= effect.alpha;
  //fixme:need to support compositer
};

var honestPainterTrait = Trait.extend({
  initialize: function (canvas)
  {
    this.execProto("initialize");

    this._canvas = canvas;
    this._ctx = canvas.getContext("2d");
    this._showUnloadedImage = true;
  },

  sketchpad: function()
  {
    return this._canvas;
  },

  getContext:function(contextId)
  {
    return this._canvas.getContext(contextId);
  },

  bbox: function (m)
  {
    var cache = m.cache;
    if (cache.bbox !== undefined)
    {
      return cache.bbox;
    }

    var f = hvBboxTbl[m.type];
    assert(f, "no bounding box calculator for the `" + m.type + "' type of gprim");
    var res = f(m, this);
    if (!res.nocache)
    {
      cache.bbox = res;
    }
    else
    {
      cache.bbox = undefined;
    }
    return res;
  },

  /*
  anchorPoint: function (m)
  {
    var cache = m.slot("cache");
    if (cache.anchorPoint !== undefined)
    {
      return cache.anchorPoint;
    }

    var ap = m.slot("anchorPoint");
    var res;
    if (!ap.ratio)
    {
      res = {x:ap.point.x, y:ap.point.y};
    }
    else
    {
      var bbox = this.bbox(m);
      var x = bbox.left + bbox.width * ap.point.x;
      var y = bbox.top  + bbox.height * ap.point.y;
      res = {x:x, y:y, nocache:bbox.nocache};
    }

    if (!res.nocache)
      cache.anchorPoint = res;
    else
      cache.anchorPoint = undefined;
    return res;
  },
  */

  inside: function (m, p)
  {
    //var ap = this.anchorPoint(m);
    var bbox = this.bbox(m);
    //var x = p.x + ap.x, y = p.y + ap.y;
    var x = p.x, y = p.y;
    if (bbox.origin.x <= x && x < (bbox.origin.x + bbox.size.width) 
        && bbox.origin.y <= y && y < (bbox.origin.y + bbox.size.height))
    {
      var f = hvInsideTbl[m.type];
      assert(f, "no inside function for the `" + m.type + "' of gprim");
      return f(m, x, y, this);
    }
    else
    {
      return false;
    }
  },

  showUnloadedImage: function(flag)
  {
    if (flag === undefined)
    {
      return this._showUnloadedImage;
    }
    else
    {
      this._showUnloadedImage = flag;
      return flag;
    }
  },

  draw : function (m, spad)
  {
    var ctx = spad || this._ctx;
    var t = m.type();
    var f = hvDraw[t];      
    assert(f, "no draw function for type `" + t + "'");
    
    //var ap = this.anchorPoint(m);
    
    ctx.save();
    //ctx.translate(-ap.x, -ap.y);
    var gprimmat = m.matrix();
    /*ctx.transform(gprimmat.a, gprimmat.b, gprimmat.c, gprimmat.d, Math.round(gprimmat.tx), Math.round(gprimmat.ty));*/
    ctx.transform(gprimmat.a, gprimmat.b, gprimmat.c, gprimmat.d, gprimmat.tx, gprimmat.ty);
    f(m, this, ctx);
    ctx.restore();
  },

  clear: function ()
  {
    var ctx = this._ctx;
    ctx.clearRect(0,0,this._canvas.width, this._canvas.height);
  },

  // redraw : function (content)
  // {
  //   var ctx = this.slot("_ctx");
  //   //pjs.externals.context.clearRect(0,0,pjs.width, pjs.height);
  //   // content.sort(this.slot("_cmpSprites")); //sortByZ(content);
  //   var it = content.iterator();

  //   content.forEach(function(c)
  //                   {
  //                      this.exec("drawItem", c);
  //                   },
  //                   this);
  // },
                                      
  // drawItem:function(node)
  // {
  //    this.exec("drawGPrim", node.exec("gprim"), node.exec("matrix"));
  // },                                    
           
  //gprim -> {matrix:mat, alpha:0.2 ...} -> drawtocanvas
  drawGPrim:function(gprim, mat, effect)
  {
    var t = gprim.type();
    var f = hvDraw[t];
    var ctx = this._ctx;
    ctx.save();

    doEffect(this, effect);

    ctx.transform(mat.a, mat.b, mat.c, mat.d, mat.tx, mat.ty);
     
     //var ap = this.anchorPoint(gprim);
     //ctx.translate(-ap.x, -ap.y);

    var gprimmat = gprim.matrix();
    ctx.transform(gprimmat.a, gprimmat.b, gprimmat.c, gprimmat.d, gprimmat.tx, gprimmat.ty);

    f(gprim, this, ctx);
     
    ctx.restore();
  },

  //ms: [{gprim:gprim, effect:{matrix:mat, alpha:0.2...}} ...]
  drawGPrims:function(ms)
  {
    var self = this;
    arrayForEach(ms, function(mp)
                    {
                    self.drawGPrim(mp.gprim(), mp.matrix(), mp.effect());
                    });
  },

  __doEffect:function(ctx,effect){
    if(!effect){
      return;
    }
    //alpha
    if (effect.getAlpha()!== undefined)
      ctx.globalAlpha *= effect.getAlpha();

    //compositing mode
    if(effect.getCompositing() !== undefined){
      ctx.globalCompositeOperation = effect.getCompositing();
    }
  },
  __intersectClip:function(clipper,ctx){
    if(!clipper){
      return;
    }
    var gp = clipper.gprim();
    hvClip(clipper,this,ctx);
    if(clipper.intersector() !== undefined){
      this._t.__intersectClip(clipper.intersector(),ctx);
    }

  },
  drawEffectedDisplayObject:function(displayObj,clipper,effect){
    var ctx = this._ctx;
    var mat = displayObj.worldMatrix();
    var m = displayObj.gprim();
    var t = m.type();
    var f = hvDraw[t];

    ctx.save();
    assert(f, "no draw function for type '" + t + "'");
    this._t.__doEffect(ctx,effect);
    this._t.__intersectClip(clipper,ctx);
    ctx.setTransform(mat.a, mat.b, mat.c, mat.d, mat.tx, mat.ty);
    var gprimmat = m.matrix();
    ctx.transform(gprimmat.a, gprimmat.b, gprimmat.c, gprimmat.d, gprimmat.tx, gprimmat.ty);
    
    f(m, this, ctx);
    ctx.restore();
  },
  drawDisplayObject:function(displayObj){
    var ctx = this._ctx;
    var mat = displayObj.worldMatrix();
    var m = displayObj.gprim();
    var t = m.type();
    var f = hvDraw[t];

    ctx.save();
    assert(f, "no draw function for type '" + t + "'");
    ctx.setTransform(mat.a, mat.b, mat.c, mat.d, mat.tx, mat.ty);

/*    var bbox = m.bbox();
    ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);*/

    var gprimmat = m.matrix(); 
    ctx.transform(gprimmat.a, gprimmat.b, gprimmat.c, gprimmat.d, gprimmat.tx, gprimmat.ty);
    var anchor = m.anchor();
    if(!(anchor.x == 0 && anchor.y == 0)){
      ctx.translate(-anchor.x, -anchor.y);
    }   

    f(m, this, ctx);    

    ctx.restore();
  },
  
  eventObservables:function()
  {
    if (!this._canvasEventObservables)
    {
      this._canvasEventObservables = new CanvasEventObservables(this.sketchpad());
    }

    return this._canvasEventObservables;
  },

  setWidth : function(w)
  {
    this._canvas.width = w;
  },

  setHeight : function(h)
  {
    this._canvas.height = h;
  },

  getSize : function()
  {
    return {
      width:this._canvas.width,
      height:this._canvas.height
    }
  }
});

var HonestPainter = Klass.extend({}, [], [honestPainterTrait]);


/**
   @function[register]{
     图元的绘制、bbox、inside的注册函数。

     当用户扩展出新的类型的图元时，该图元想要被显示及参与交互，必须用register去注册该图元的绘制及交互判断函数。
     @param[type]{
       string；新图元的类型，必须是唯一的。
      }
      @param[fs]{
       object；需要注册的函数集合。例如{draw:newDraw, bbox:newBbox, inside:newInside}。
      }
     @return{}
   }
**/
HonestPainter.register = function (type, fs)
{
  assert(!hvDraw[type],type + " has already exist in draw functions table");

  hvDraw[type] = fs.draw;

  return fs;
}



hvDraw = hvDraw;

export$({
  HonestPainter: HonestPainter,
  hvDraw: hvDraw
});

};
__modules__["/layeredscene.js"] = function(require, load, export$) {
var TreeScene = require("scene").TreeScene;
var arrayForEach = require("./lib/util").arrayForEach;
var debug = require("./lib/debug");

var debug = require("./lib/debug")
  , TreeActor = require("actor").TreeActor
  , TimeStamper = require('director').TimeStamper
  , geo = require('./lib/geometry')
  , Klass = require("./lib/colortraits").Klass
  , Trait = require("./lib/colortraits").Trait;


var LayeredTreeSceneTrait  = Trait.extend({
  __init:function(owner,layerNum){
    this._t.setlayers([]);
    this._t.setowner(owner);
    for (var i = 0; i < layerNum; i++) {
      this._t.layers().push(TreeScene.create(owner));//default one layer
    };
  },
  addLayer:function(){
    this._t.layers().push(TreeScene.create(this._t.owner()));
    //scene.setLayerIndex(this._t.layers().length - 1);/////////////
    return this._t.layers().length - 1;    //return layer index
  },
  removeLayer:function(i){
    //还要删除layer上的actor以及相应的分层的交互数组元素。
    if(i === undefined || i < 0 || i >= this._t.layers.length){
      return null;
    }
    return this._t.layers.splice(i,1);
  },
  getLayer:function(i){
    if(i === undefined || i < 0 || i >= this._t.layers.length){
      return null;
    }
    return this._t.layers[i];
  },
  __update:function(t,dt){
    arrayForEach(this._t.layers(),function(scene){
      scene.update(t,dt);
    });
  },
  addActorToLayer:function(layerIndex,actor, parentActor){
      this._t.layers()[layerIndex].addActor(actor, parentActor);
  },
  removeActorFromLayer:function(layerIndex,actor){
    if (layerIndex) {
      this._t.layers()[layerIndex].removeActor(actor);
    }else{
      this._t.layers()[0].removeActor(actor);
    }
  },
  emitDisplayObjects : function(displayObjs){
    arrayForEach(this._t.layers(),function(scene){
      scene.emitDisplayObjects(displayObjs);
    });
  },
  emitInteractiveObjects : function(interactiveObjs){
    arrayForEach(this._t.layers(),function(scene){
      scene.emitInteractiveObjects(interactiveObjs);
    });
  }
},["layers","owner"]);


var LayeredTreeScene = TreeScene.extend({
  initialize:function(owner,layerNum){
    this.subTraits(0).__init(owner,layerNum);
  }
},[],[LayeredTreeSceneTrait]);



export$({
  LayeredTreeScene:LayeredTreeScene
});


};
__modules__["/gprims/circlegprim.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits")
,   ShapTrait = require("./shaptrait").ShapTrait
,   geo = require("../lib/geometry");


var Klass = colortraits.Klass;
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;

/**
@itrait[CircleTrait]{
  @extend[ShapTrait]{
  }
  @traitGrantMany[ShapTrait type id tag strokeStyle fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineDash length #:trait CircleTrait]    
  圆形图元的基本功能单元。
}
**/
/**
@property[radius number #:def 10]{
  @trait[CircleTrait]
  圆的半径。
}
*/
var defaultCircle = {radius: 10};
var CircleTrait = ShapTrait.extend({
  __init: function(param)
  {
    this.subTraits(0).__init(param);
    if(param == undefined)
      param = defaultCircle;
    this._t.setradius((param.radius == undefined) ? 10 : param.radius);
    this._t.settype("circle");
    this._t.setlength(undefined);
  },
/**
@method[setradius]{
  @trait[CircleTrait]
  @param[r float]{}
  @return[this]{}
  设置圆的半径。
}
*/
  setradius: function(r)
  {
    this._t.cache().bbox = undefined;
    this._t.setradius(r);

    this._t.setlength(undefined);
    return this;
  },
/**
@method[localBbox]{
  @trait[CircleTrait]
  @return[rect]{}
  获取本地坐标系下图元的包围盒。
}
*/
  localBbox: function()
  {
    var r = this._t.radius();
    var lineWidth = 0;
    if(this._t.strokeFlag() || this._t.strokeStyle() != undefined){
      lineWidth = 1;
    }
    return geo.rectMake(0 - lineWidth/2, 0 - lineWidth/2, 2*r + lineWidth, 2*r + lineWidth); //这里之所以增大是因为绘制哟像素的问题
  },
/*
  @method[localInside]{
    @trait[CircleTrait]
    @return[boolean]{}
    本地坐标系的localInside。
  }
*/
  localInside: function(x, y)
  {
    var center = this._t.radius();
    var d2 = Math.pow(x - center, 2) + Math.pow(y - center, 2);
    return d2 <= center * center;
  },
  localHook: function(cb)
  {
    this.hookMany(this._t, ["fillFlag", "strokeFlag", "radius", "strokeStyle", "fillStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineDash", "anchorPoint"], cb, "a");
  },
  unlocalHook: function(cb)
  {    
    this.unhookMany(this._t, ["fillFlag", "strokeFlag", "radius", "strokeStyle", "fillStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineDash", "anchorPoint"], cb, "a");   
  },
/**
@method[length]{
  @trait[CircleTrait]
  @return[float]{路径的长度}
  获取圆的周长。
}
*/
  length: function()
  {
    var len = this._t.length();
    if(len == undefined){
      var radius = this._t.radius();
      len = 2*Math.PI*radius;

      this._t.setlength(len);
    }

    return len;
  },
/**
@method[pointAtPercent]{
  @trait[CircleTrait]
  @param[t float]{[0-1]，小于等于0, 返回起点; 大于等于1, 返回结束点。}
  @return[point]{}
  Returns the point at the percentage t of the current ircle. t在 0 到 1 之间.检测的方向为顺时针。
    这里是原生的点，不包含缩放的过程。起点为轴上,默认方向为顺时针
}
*/
  pointAtPercent: function(t)
  {
    var radius = this.radius();

    if(t<=0 || t>=1)
      return {x: radius*2, y: radius};

    var len = this.length();    
    var calangle = t*Math.PI*2;

    return {x: radius*Math.cos(calangle)+radius, y: radius*Math.sin(calangle)+radius};

  },
/**
@method[percentAtLength]{
  @trait[CircleTrait]
  @param[len float]{大于0。大于总长度返回1,小于0返回0。}
  @return[float]{percent：大于0}
  Returns the point at the length  of the current circle. len在 0 到 整个长度之间。
}
*/
  percentAtLength: function(len)
  {
    var alllen = this._t.length();
    if(len < 0)
      return 0;
    if(alllen < len)
      return 1;

    return len/alllen;
  }
},
 ["radius"].concat(ShapTrait.grantMany(["fillFlag", "strokeFlag", "cache", "type", "id", "tag", "strokeStyle", "fillStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineDash", "length", "anchorPoint"]))
);

/**
@iclass[CircleKlass Klass (CircleTrait)]{
  圆形图元.
  @grant[CircleTrait type #:attr 'READONLY]
  @grant[CircleTrait radius #:attr 'CUSTOM_SETTER]
  @grantMany[CircleTrait strokeStyle fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineDash id tag]
}
**/
/**
@property[ratioAnchor object #:def "{ratiox: 0, ratioy: 0}"]{
  @class[CircleKlass]
  图元左上角到图元锚点的距离与未经矩阵变换的图元的宽高比组成的对象。
}
*/
/**
@property[anchor object #:def "{x: 0, y: 0}"]{
  @class[CircleKlass]
  图元锚点在local坐标系下的位置。
}
*/
var CircleKlass = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize");
    this.subTraits(0).__init(param);
  }
},
 [[READONLY("type"), CircleTrait.grant("type")], [CUSTOM_SETTER("radius"), CircleTrait.grant("radius")], 
  [CUSTOM_SETTER("strokeStyle"), CircleTrait.grant("strokeStyle")], [CUSTOM_SETTER("fillStyle"), CircleTrait.grant("fillStyle")],
  [CUSTOM_SETTER("shadowColor"), CircleTrait.grant("shadowColor")]].concat(CircleTrait.grantMany(["fillFlag", "strokeFlag", "id", "tag", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "lineDash"])),   
 [CircleTrait]
);

export$({
  CircleKlass : CircleKlass,
  CircleTrait : CircleTrait  
});
};
__modules__["/lib/geometry.js"] = function(require, load, export$) {
var util = require('./util');

var RE_PAIR = /\{\s*([\d.\-]+)\s*,\s*([\d.\-]+)\s*\}/,
RE_DOUBLE_PAIR = /\{\s*(\{[\s\d,.\-]+\})\s*,\s*(\{[\s\d,.\-]+\})\s*\}/;

var cross = function(v1, v2)
{
  return v1.x * v2.y - v1.y * v2.x;
};

var geometry = 
  {
    Point: function (x, y) 
    {
      this.x = x;
      this.y = y;
    },

    Size: function (w, h) 
    {
      this.width = w;
      this.height = h;
    },

    Rect: function (x, y, w, h) 
    {
      this.x = x;
      this.y = y;
      this.width = w;
      this.height = h;
    },


    /*
      a  c  0  tx
      b  d  0  ty
      0  0  1  tz
      0  0  0  1
     */
    Matrix: function (a, b, c, d, tx, ty, tz) 
    {
      this.a = a;
      this.b = b;
      this.c = c;
      this.d = d;
      this.tx = tx;
      this.ty = ty;
      
      if (tz == undefined)
        this.tz = 0;
      else
        this.tz = tz;
    },

    //pointAdd
    pointAdd: function (p1, p2) 
    {
      return geometry.pointMake(p1.x + p2.x, p1.y + p2.y);
    },

    pointAddBy:function(p1, p2)
    {
      p1.x += p2.x;
      p1.y += p2.y;

      return;
    },

    pointSub: function (p1, p2) 
    {
      return geometry.pointMake(p1.x - p2.x, p1.y - p2.y);
    },

    pointSubBy:function(p1, p2)
    {
      p1.x -= p2.x;
      p1.y -= p2.y;

      return;
    },

    pointMultiply: function (p1, p2) 
    {
      return geometry.pointMake(p1.x * p2.x, p1.y * p2.y);
    },

    pointMultiplyBy:function(p1, p2)
    {
      p1.x *= p2.x;
      p1.y *= p2.y;

      return;
    },

    pointNegation: function (p) 
    {
      return geometry.pointMake(-p.x, -p.y);
    },

    pointpNegationBy:function(p)
    {
      p.x = -p.x;
      p.y = -p.y;

      return;
    },

    pointRound: function (p) 
    {
      return geometry.pointMake(Math.round(p.x), Math.round(p.y));
    },

    pointRoundBy:function(p)
    {
      p.x = Math.round(p.x);
      p.y = Math.round(p.y);
      
      return;
    },

    pointCeil: function (p) 
    {
      return geometry.pointMake(Math.ceil(p.x), Math.ceil(p.y));
    },

    pointCeilBy:function(p)
    {
      p.x = Math.ceil(p.x);
      p.y = Math.ceil(p.y);

      return;
    },

    pointFloor: function (p) 
    {
      return geometry.pointMake(Math.floor(p.x), Math.floor(p.y));
    },

    pointFloorBy:function(p)
    {
      p.x = Math.floor(p.x);
      p.y = Math.floor(p.y);

      return;
    },

    PointZero: function () 
    {
      return geometry.pointMake(0, 0);
    },

    isPointInPolygon:function(x, y, vs)
    {
      var length = vs.length;
      var inside = false;
      for(var i = 0, j = length - 1; i < length; i++) {
        if((vs[i].y < y && vs[j].y >= y || vs[j].y < y && vs[i].y >= y) 
            && (vs[i].x <= x || vs[j].x <= x)) {
          inside ^= (vs[i].x + (y - vs[i].y)/(vs[j].y - vs[i].y)*(vs[j].x - vs[i].x) < x);
        }
        j = i;
      }

      return !!inside;
    },
    
    getVectorAngle:function(v1, v2)
    {
      /*
        v1 到 v2的角度。 使用左手法则。 弧度位于 [0, 2PI] 
       */
      var cos = v2.x * v1.x + v2.y * v1.y;
      var mod = Math.sqrt(v2.x * v2.x + v2.y * v2.y) * Math.sqrt(v1.x * v1.x + v1.y * v1.y);

      if (mod == 0)
      {
        return undefined;
      }

      var temp = cos/mod;

      var radian = Math.acos(Math.abs(temp) <= 1 ? temp : ((temp > 0) ? 1 : -1));
      
      if (cross(v1, v2) < 0)
        radian = Math.PI * 2 - radian;
      
      return radian;
    },

    rectMake: function (x, y, w, h) 
    {
      return new geometry.Rect(x, y, w, h);
    },

    rectFromString: function (str) 
    {
      var matches = str.match(RE_DOUBLE_PAIR),
      p = geometry.pointFromString(matches[1]),
      s = geometry.sizeFromString(matches[2]);

      return geometry.rectMake(p.x, p.y, s.width, s.height);
    },

    sizeMake: function (w, h) 
    {
      return new geometry.Size(w, h);
    },

    sizeFromString: function (str) 
    {
      var matches = str.match(RE_PAIR),
      w = parseFloat(matches[1]),
      h = parseFloat(matches[2]);

      return geometry.sizeMake(w, h);
    },

    pointMake: function (x, y) 
    {
      return new geometry.Point(x, y);
    },

    pointFromString: function (str) 
    {
      var matches = str.match(RE_PAIR),
      x = parseFloat(matches[1]),
      y = parseFloat(matches[2]);

      return geometry.pointMake(x, y);
    },

    rectContainsPoint: function (r, p) 
    {
      return ((p.x >= r.x && p.x <= r.x + r.width) &&
            (p.y >= r.y && p.y <= r.y + r.height));
    },

    rectUnion: function (r1, r2) 
    {
      var rect = new geometry.Rect(0, 0, 0, 0);

      rect.x = Math.min(r1.x, r2.x);
      rect.y = Math.min(r1.y, r2.y);
      rect.width = Math.max(r1.x + r1.width, r2.x + r2.width) - rect.x;
      rect.height = Math.max(r1.y + r1.height, r2.y + r2.height) - rect.y;

      return rect;
    },

    rectOverlapsRect: function (r1, r2) 
    {
      if((r1.x + r1.width < r2.x ) || (r2.x + r2.width < r1.x) || (r1.y + r1.height < r2.y) || (r2.y + r2.height < r1.y))
        return false;
      return true;
    },

    rectIntersection: function (lhsRect, rhsRect) 
    {
      var intersection = new geometry.Rect(
        Math.max(lhsRect.x, rhsRect.x),
        Math.max(lhsRect.y, rhsRect.y),
        0,
        0
      );

      intersection.width = Math.min(lhsRect.x + lhsRect.width, rhsRect.x + rhsRect.width) - intersection.x;
      intersection.height = Math.min(lhsRect.y + lhsRect.height, rhsRect.y + rhsRect.height) - intersection.y;

      return intersection;
    },

    boundingRectMake: function (p1, p2, p3, p4) 
    {
      var minX = Math.min(p1.x, p2.x, p3.x, p4.x);
      var minY = Math.min(p1.y, p2.y, p3.y, p4.y);
      var maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
      var maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

      //return new geometry.Rect(minX, minY, (maxX - minX), (maxY - minY));
      return geometry.rectMake(minX, minY, (maxX - minX), (maxY - minY));
    },

    pointApplyMatrix: function (point, t) 
    {
      //return new geometry.Point(t.a * point.x + t.c * point.y + t.tx, t.b * point.x + t.d * point.y + t.ty);
      return geometry.pointMake(t.a * point.x + t.c * point.y + t.tx, t.b * point.x + t.d * point.y + t.ty);
    },

    pointApplyByMatrix: function(point, t)
    {
      var point_x = point.x;
      var point_y = point.y;
      point.x = t.a * point_x + t.c * point_y + t.tx; 
      point.y = t.b * point_x + t.d * point_y + t.ty;
    },

    rectApplyMatrixToBoundRect: function (rect, trans) 
    {
      var p1 = geometry.pointMake(rect.x, rect.y);
      var p2 = geometry.pointMake(rect.x + rect.width, rect.y);
      var p3 = geometry.pointMake(rect.x, rect.y + rect.height);
      var p4 = geometry.pointMake(rect.x + rect.width, rect.y + rect.height);

      geometry.pointApplyByMatrix(p1, trans);
      geometry.pointApplyByMatrix(p2, trans);
      geometry.pointApplyByMatrix(p3, trans);
      geometry.pointApplyByMatrix(p4, trans);

      return geometry.boundingRectMake(p1, p2, p3, p4);
    },

    

    rectApplyByMatrixToBoundRect: function(rect, trans)
    {
      var p1 = geometry.pointMake(rect.x, rect.y);
      var p2 = geometry.pointMake(rect.x + rect.width, rect.y);
      var p3 = geometry.pointMake(rect.x, rect.y + rect.height);
      var p4 = geometry.pointMake(rect.x + rect.width, rect.y + rect.height);

      geometry.pointApplyByMatrix(p1, trans);
      geometry.pointApplyByMatrix(p2, trans);
      geometry.pointApplyByMatrix(p3, trans);
      geometry.pointApplyByMatrix(p4, trans);

      var minX = Math.min(p1.x, p2.x, p3.x, p4.x);
      var minY = Math.min(p1.y, p2.y, p3.y, p4.y);
      var maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
      var maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

      rect.x = minX;
      rect.y = minY;
      rect.width = maxX - minX;
      rect.height = maxY - minY;
    },

    boundRectOverlap: function(rect1, rect2)
    {
      return !((rect1.x > rect2.x + rect2.width) || (rect1.y > rect2.y + rect2.height) || (rect2.x > rect1.x + rect1.width) || (rect2.y > rect1.y + rect1.height));
    },

    matrixInvert: function (trans) 
    {
      var determinant = 1 / (trans.a * trans.d - trans.b * trans.c);

      return new geometry.Matrix(
        determinant * trans.d,
          -determinant * trans.b,
          -determinant * trans.c,
        determinant * trans.a,
        determinant * (trans.c * trans.ty - trans.d * trans.tx),
        determinant * (trans.b * trans.tx - trans.a * trans.ty),
        /*now do not support z invert, just record z*/
        trans.tz
      );
    },

    matrixInvertBy: function (trans) 
    {
      var determinant = 1 / (trans.a * trans.d - trans.b * trans.c);

      var a = determinant * trans.d
      ,   b = -determinant * trans.b
      ,   c = -determinant * trans.c
      ,   d = determinant * trans.a
      ,   tx = determinant * (trans.c * trans.ty - trans.d * trans.tx)
      ,   ty = determinant * (trans.b * trans.tx - trans.a * trans.ty);

      trans.a = a;
      trans.b = b;
      trans.c = c;
      trans.d = d;
      trans.tx = tx;
      trans.ty = ty;

      return;
    },
     
    //matrixMultApply
    matrixMultiply: function (lhs, rhs) 
    {
      return new geometry.Matrix(
        lhs.a * rhs.a + lhs.c * rhs.b,
        lhs.b * rhs.a + lhs.d * rhs.b,
        lhs.a * rhs.c + lhs.c * rhs.d,
        lhs.b * rhs.c + lhs.d * rhs.d,
        lhs.a * rhs.tx + lhs.c * rhs.ty + lhs.tx,
        lhs.b * rhs.tx + lhs.d * rhs.ty + lhs.ty,
        lhs.tz + rhs.tz
      );
    },

    matrixMultiplyBy: function (lhs, rhs) 
    {
      var a = lhs.a * rhs.a + lhs.c * rhs.b
      ,   b = lhs.b * rhs.a + lhs.d * rhs.b
      ,   c = lhs.a * rhs.c + lhs.c * rhs.d
      ,   d = lhs.b * rhs.c + lhs.d * rhs.d
      ,   tx = lhs.a * rhs.tx + lhs.c * rhs.ty + lhs.tx
      ,   ty = lhs.b * rhs.tx + lhs.d * rhs.ty + lhs.ty
      ,   tz = lhs.tz + rhs.tz;
      
      lhs.a = a;
      lhs.b = b;
      lhs.c = c;
      lhs.d = d;
      lhs.tx = tx;
      lhs.ty = ty;
      lhs.tz = tz;

      return;
    },

    matrixTranslate: function (trans, tx, ty, tz) 
    {
      var newTrans = util.copy(trans);
      newTrans.tx = trans.tx + trans.a * tx + trans.c * ty;
      newTrans.ty = trans.ty + trans.b * tx + trans.d * ty;
      
      if (tz != undefined)
      {
        if (trans.tz != undefined)
          newTrans.tz = trans.tz + tz;
        else
          newTrans.tz = tz;
      }
      
      return newTrans;
    },

    matrixTranslateBy: function (trans, tx, ty, tz) 
    {
      if (tz != undefined && trans.tz == undefined)
      {
        trans.tz = 0;
      }
      
      trans.tx = trans.tx + trans.a * tx + trans.c * ty;
      trans.ty = trans.ty + trans.b * tx + trans.d * ty;
      if (tz != undefined)
        trans.tz = trans.tz + tz;

      return;
    },

    matrixRotateBy: function (trans, angle) 
    {
      var sin = Math.sin(angle),
      cos = Math.cos(angle);

      var a, b, c, d;
      a = trans.a * cos + trans.c * sin;
      b = trans.b * cos + trans.d * sin;
      c = trans.c * cos - trans.a * sin;
      d = trans.d * cos - trans.b * sin;

      trans.a = a;
      trans.b = b;
      trans.c = c;
      trans.d = d;

      return;
    },

    matrixRotate: function (trans, angle) 
    {
      var sin = Math.sin(angle),
      cos = Math.cos(angle);

      var a, b, c, d;
      a = trans.a * cos + trans.c * sin;
      b = trans.b * cos + trans.d * sin;
      c = trans.c * cos - trans.a * sin;
      d = trans.d * cos - trans.b * sin;

      return new geometry.Matrix(
        a,
        b,
        c,
        d,
        trans.tx,
        trans.ty,
        trans.tz);
    },

    matrixScaleBy: function (trans, sx, sy) 
    {
      if (sy === undefined) 
      {
        sy = sx;
      }

      //return new geometry.TransformMatrix(trans.a * sx, trans.b * sx, trans.c * sy, trans.d * sy, trans.tx, trans.ty, trans.tz);
      trans.a *= sx;
      trans.b *= sx;
      trans.c *= sy;
      trans.d *= sy;

      return;
    },

    matrixScale: function (trans, sx, sy) 
    {
      if (sy === undefined) 
      {
        sy = sx;
      }

      return new geometry.Matrix(trans.a * sx, trans.b * sx, trans.c * sy, trans.d * sy, trans.tx, trans.ty, trans.tz);
    },

    identityMatrix: function () 
    {
      return new geometry.Matrix(1, 0, 0, 1, 0, 0, 0);
    },

    isIdentityMatrix : function(mat)
    {
      return (mat.a === 1 && mat.b === 0 && mat.c === 0 && mat.d === 1 
        && mat.tx === 0 && mat.ty === 0 && mat.tz === 0);
    },

    decomposeMatrix : function(matrix)
    {
      var sx = Math.sqrt(Math.pow(matrix.a, 2) + Math.pow(matrix.b, 2))
      ,   sy = Math.sqrt(Math.pow(matrix.c, 2) + Math.pow(matrix.d, 2))
      ,   radian = Math.acos(matrix.a/sx)
      ,   tx = matrix.tx
      ,   ty = matrix.ty
      ,   tz = matrix.tz;

      return {sx:sx, sy:sy, radian:radian, tx:matrix.tx, ty:matrix.ty, tz:matrix.tz};
    },

/**
 *  @function[quadraticResolve]{
      求解一元二次方程。
      一元二次方程求解公式：http://zh.wikipedia.org/wiki/%E4%B8%80%E5%85%83%E4%BA%8C%E6%AC%A1%E6%96%B9%E7%A8%8B
      这里的当有重根的时候，只返回一个重根，不会重复。

 *    @param[a]{ number, 二次幂的倍数}     
      @param[b]{ number， 一次幂的倍数} 
      @param[c]{ number, 零次幂的倍数} 
 *    @return[aaa]{array：方程的实数根}
 *  }
 */
    quadraticResolve:function(a, b, c)
    {
      if(a == 0){
        return [-c/b];
      }
      var delt=b*b-4*a*c;
      var x1 = undefined;
      var x2 = undefined;
      if(delt>0)
      {
        x1 = ((-b) + Math.sqrt(delt))/(2*a);
        x2 = ((-b) - Math.sqrt(delt))/(2*a);
        return [x1, x2];                                                                      
      } else if (delt==0) {
        x1 = x2 = (-b)/(2*a);
        return [x1];
      } 
      return [];
    },
/**
 *  @function[cubicResolve]{
      求解一元三次方程。
      一元三次方程求解公式：http://zh.wikipedia.org/wiki/%E4%B8%89%E6%AC%A1%E6%96%B9%E7%A8%8B
      这里的当有重根的时候，只返回一个重根，不会重复。

 *    @param[a]{ number, 三次幂的倍数}     
      @param[b]{ number, 二次幂的倍数} 
      @param[c]{ number, 一次幂的倍数}
      @param[d]{ number, 零次幂的倍数}  
 *    @return[aaa]{array：方程的实数根}
 *  }
 */
    cubicResolve: function(a, b, c, d)
    {
      if(a == 0){
        return geometry.quadraticResolve(b, c, d);
      }

      var X1;
      var X2;
      var X3;

      var A = (b*c)/(6*a*a) - (b*b*b)/(27*a*a*a) - d/(2*a);
      var B = c/(3*a) - (b*b)/(9*a*a);

      var delt = A*A + B*B*B;

      if(delt > 0){
        var sqrtdelt = Math.sqrt(delt);
        X1 = (-b)/(3*a) + ((A + sqrtdelt)/Math.abs(A + sqrtdelt)*Math.pow(Math.abs(A + sqrtdelt), (1/3))) + ((A - sqrtdelt)/Math.abs(A - sqrtdelt)*Math.pow(Math.abs(A - sqrtdelt), (1/3)));
        return [X1];
      }else if(delt == 0){
        if(A*A == 0){
          X1 = X2 = X3 = (-b)/(3*a);
          return [X1]; //现在后面不会重复检测，只返回一个结果
        }else{
          var temp = ((A)/Math.abs(A)*Math.pow(Math.abs(A), (1/3)));
          X1 = (-b)/(3*a) + 2*temp;
          X2 = X3 = (-b)/(3*a)  - temp;
          return [X1, X2];
        }
      }else if (delt < 0){
        var acs = Math.acos(A/Math.pow((-B), (3/2)));
        X1 = (-b)/(3*a) + 2*Math.sqrt(-B)*Math.cos((acs)/3);
        X2 = (-b)/(3*a) + 2*Math.sqrt(-B)*Math.cos((acs + 2*Math.PI)/3);
        X3 = (-b)/(3*a) + 2*Math.sqrt(-B)*Math.cos((acs - 2*Math.PI)/3);

        return [X1, X2, X3];
      }
      return [];
    },
    coordinateSysChange: function(p1, p2)
    {
      //p1.p2两个点的x向量为坐标系横轴.p2为原点
      var matrix = geometry.identityMatrix();
      var angle = geometry.getVectorAngle({x:1, y:0}, geometry.pointSub(p2, p1));

      geometry.matrixTranslateBy(matrix, p2.x, p2.y);
      geometry.matrixRotateBy(matrix, angle);      
      geometry.matrixInvertBy(matrix);      

      return matrix;
    },
/**
 *  @function[isPointInLine]{
      判断一个点是否在一条线段上。
      
 *    @param[prepoint]{ point, 线段的起始点}     
      @param[endpoint]{ point, 线段的终点} 
      @param[p]{ point, 检测的点}
      @param[lineWidth]{ number, 线段的宽度}
      @param[rERROR]{ number, 容许的错误误差}  
 *    @return[aaa]{boolean：是否点在线段上}
 *  }
 */
    isPointInLine: function(prepoint, endpoint, x, y, lineWidth, rERROR)
    {
      var p = {x: x, y: y};
      var matrix = geometry.coordinateSysChange(prepoint, endpoint);
      geometry.pointApplyByMatrix(p, matrix);
      var curprepoint = geometry.pointApplyMatrix(prepoint, matrix);

      if(curprepoint.x <= p.x && p.x <= 0 && Math.abs(p.y) < lineWidth/2 + rERROR)
      {
        return true;
      }else{
        return false;
      }    
    },
/**
 *  @function[ellipseCenterAngle]{
      求取一个椭圆的圆心和椭圆上两点对应的角度。
      
 *    @param[point1]{ point1, 椭圆弧的起始点}     
      @param[point2]{ point, 椭圆弧的终点} 
      @param[rx]{ number, 半径轴}
      @param[ry]{ number, 半径轴}
      @param[xaxisrotate]{ number, 椭圆的旋转角度}
      @param[largearcflag]{ number, 弧的大/小部分}
      @param[sweepflag]{ number, 弧旋转方向}
      @param[circleangle]{ object，输出的结果}    
 *    @return[aaa]{}
 *  }
 */
    ellipseCenterAngle: function(point1, point2, rx, ry,  xaxisrotate, largearcflag, sweepflag, circleangle)
    {
      if(rx == 0 || ry == 0 || (point1.x == point2.x && point1.y == point2.y))
      {
        return;              
      }

      var xypie = {x: (point1.x - point2.x)/2, y: (point1.y - point2.y)/2};
      var addpp = {x: (point1.x + point2.x)/2, y: (point1.y + point2.y)/2};
      var matrix = geometry.identityMatrix();
      geometry.matrixRotateBy(matrix, xaxisrotate);
      var invertmatrix = geometry.matrixInvert(matrix);
      geometry.pointApplyByMatrix(xypie, invertmatrix);

      var distance = xypie.x*xypie.x/(rx*rx) + xypie.y*xypie.y/(ry*ry);
      if(distance > 1){
        rx = Math.sqrt(distance)*rx;
        ry = Math.sqrt(distance)*ry;
      }

      var temp = (rx*rx*ry*ry - rx*rx*xypie.y*xypie.y - ry*ry*xypie.x*xypie.x)/(rx*rx*xypie.y*xypie.y + ry*ry*xypie.x*xypie.x);
      temp = Math.abs(temp);
      temp = Math.sqrt(temp);
      var centerpie;
      if(largearcflag == sweepflag) {
        centerpie = {x: (-temp)*rx*xypie.y/ry, y: (-temp)*(-ry)*xypie.x/rx};
      } else {
        centerpie = {x: temp*rx*xypie.y/ry, y: temp*(-ry)*xypie.x/rx};
      }
      
      var center = geometry.pointAdd(geometry.pointApplyMatrix(centerpie, matrix), addpp);
      var v1 = {x: 1, y: 0};
      var anglestart = geometry.getVectorAngle(v1, {x: (xypie.x - centerpie.x)/rx, y: (xypie.y - centerpie.y)/ry});
      var detangle = geometry.getVectorAngle({x: (xypie.x - centerpie.x)/rx, y: (xypie.y - centerpie.y)/ry}, {x: ((-xypie.x) - centerpie.x)/rx, y: ((-xypie.y) - centerpie.y)/ry});
      if(sweepflag == 0){
        detangle = detangle - 2*Math.PI;
      }
      //   
      circleangle.center = center;
      circleangle.anglestart = anglestart;
      circleangle.detangle = detangle;
      circleangle.rx = rx;
      circleangle.ry = ry;
      return;
    }
  };

export$(geometry);

};
__modules__["/actor.js"] = function(require, load, export$) {
var Klass = require("./lib/colortraits").Klass
,   Trait = require("./lib/colortraits").Trait
,   READONLY = require("./lib/colortraits").READONLY
,   AnimatorTrait = require("animate").AnimatorTrait
,   TransformableTrait = require("./lib/transformable").TransformableTrait
,   geo = require("./lib/geometry");

var InteractorTrait = require("actortraits").InteractorTrait;

var globalTimeStamp = require("./lib/timestamp").globalTimeStamp;
var EventStreamTrait = require("./lib/eventstream");


/**
@title{Actor}
本模块实现了colorbox最重要的一个元素：actor。
actor是组成游戏场景中的实体对象，它是显示图元(gprim)和交互的综合体。有了actor才能在舞台上展示各种各样的图元(图片、多边形、文字等), 及为给各类图元添加交互。

actor必须跟gprim相绑定才会被呈现出来。默认情况下一个actor跟一个gprim相绑定，但允许用户可以定制任意的actor。
*/

/**
@iclass[Actor Klass (TransformableTrait InteractorTrait EventStreamTrait AnimatorTrait)]{
  Actor是所有精灵的基类。
  @constructor[Actor]{
    @param[param object]{创建精灵所需参数。}
  }
  @jscode{
    //创建一个精灵,并且关闭精灵的交互开关，默认是打开的。
    Actor.create({
      interactable:false
    });
  }
  @grant[TransformableTrait x #:attr 'CUSTOM_GETTER_SETTER]
  @grant[TransformableTrait y #:attr 'CUSTOM_GETTER_SETTER]
  @grant[TransformableTrait z #:attr 'CUSTOM_GETTER_SETTER]
  @grant[TransformableTrait scale #:attr 'CUSTOM_GETTER_SETTER]
  @grant[TransformableTrait rotation #:attr 'CUSTOM_GETTER_SETTER]
}
*/
/**
@property[interactable boolean #:def true]{
  @class[Actor]
  精灵的交互开关；true：开启；false：关闭。
  只有为true时，给精灵添加交互才会起作用，否则交互将失效。
}
*/
/**
@property[ownerScene Scene]{
  @class[Actor]
  精灵所属的场景。
}
*/
var Actor = Klass.extend({
  initialize : function(param)
  {
    if(param != null && param.interactable != undefined)
      this._t.setinteractable(param.interactable);
    else
      this._t.setinteractable(true);

    this.subTraits(3).__init();
    var obs = this.createEventStream("system");
    var self = this;
    this._t.setsystemEventStream(obs.select(function(evt){
      if(evt.type == "active"){
        self.setownerScene(evt.scene);
      }else if(evt.type == "deactive"){
        self.setownerScene(undefined);
      }

      return evt;
    }));
    this.subTraits(1).__init(globalTimeStamp);
    this.subTraits(0).__init();
    this.subTraits(2).__init();

  },

  update : function(t, dt)
  {
    this.subTraits(0).__update(t, dt, this);

    return this;
  },

  bbox:function()
  {
    return geo.rectApplyMatrixToBoundRect(geo.rectMake(0, 0, 0, 0), this.matrix());
  },

  subscribe : function(name, callback)
  {
    if(name == "system")
      return this._t.systemEventStream().subscribe(callback);
    else
      return this._t.subject()[name].observable.subscribe(callback);
  },

/**
@method[emitDisplayObjects #:hidden]{
  @class[Actor]
  @param[displayObjs array]{渲染对象列表。}
  @return[array]{displayObjs}
  将精灵的渲染对象提交到displayObjs中；此方法是基类函数，不提供实现策略，需要派生类自己决定提交各自的显示对象。
}
*/
  emitDisplayObjects:function(displayObjs)
  {
    return displayObjs;
  },

/**
@method[emitInteractiveObjects #:hidden]{
  @class[Actor]
  @param[interactiveObjs array]{交互对象列表。}
  @return[array]{interactiveObjs}
  将精灵的交互对象提交到interactiveObjs中；此方法是基类函数，不提供实现策略，需要派生类自己决定提交各自的交互对象。
}
*/
  emitInteractiveObjects:function(interactiveObjs)
  {
    return interactiveObjs;
  },
/**
@method[hookActorVisible #:hidden]{
  @class[Actor]
  @param[cb @type[function]]{hook属性的回调函数。}
  @return[this]{}
  hook住矩阵变化的标志位.
}
*/
  hookActorVisible : function(cb)
  {
    this.hook(this.subTraits(1), "dirtyStamp", cb, "a");
    this.hook(this.subTraits(1), "dirtyStamp", cb, "b");

    return this;
  },
/**
@method[unhookActorVisible #:hidden]{
  @class[Actor]
  @return[this]{}
  unhook住矩阵变化的标志位.
}
*/
  unhookActorVisible: function(cb)
  {
    this.unhook(this.subTraits(1), "dirtyStamp", cb, "a");
    this.unhook(this.subTraits(1), "dirtyStamp", cb, "b");

    return this;
  },
/**
@method[applyEffect #:hidden]{
  @class[Actor]
  @param[clipper effect]{}
  设置渲染效果。
}
*/
  applyEffect:function(effect){
    if(this._t.effect() === effect){
      return;
    }
    this._t.seteffect(effect);
    this.notify("system",{type:"effectChanged",effect:effect});
  },

/**
@method[applyClip #:hidden]{
  @class[Actor]
  @param[clipper clipper]{}
  将裁减者作用到actor上。
}
*/
  applyClip:function(clipper){
    if(this._t.clipper() === clipper){
      return;
    }
    this._t.setclipper(clipper);
    this.notify("system",{type:"clipperChanged",clipper:clipper});
  }


}, ["interactable", "systemEventStream", "ownerScene", ["subject", EventStreamTrait.grant("subject")],READONLY("effect"),READONLY("clipper")], [
  AnimatorTrait,
  TransformableTrait,
  InteractorTrait,
  EventStreamTrait]); 

export$(Actor);


};
__modules__["/sprites/annulus.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits");
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;
var Sprite = require("./sprite");
var AnnulusTrait = require("../gprims/annulusgprim").AnnulusTrait;

/**
@title{Annulus}
*/

/**
@iclass[Annulus Sprite (AnnulusTrait)]{
  环形/扇形精灵，它使用了 AnnulusTrait 具有 AnnulusTrait 上所有属性和方法。
  @grant[AnnulusTrait type #:attr 'READONLY]
  @grant[AnnulusTrait innerradius]
  @grant[AnnulusTrait outerradius]
  @grant[AnnulusTrait startAngle]
  @grant[AnnulusTrait endAngle]
  @grant[AnnulusTrait anticlockwise]
  @grantMany[AnnulusTrait ratioAnchor anchor id tag strokeFlag strokeStyle fillFlag fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineDash] 
  @constructor[Annulus]{
    @param[param object]{
      @verbatim|{
        初始化参数对象包含的属性可以为：
        innerradius、outerradius、startAngle、endAngle、anticlockwise
        x:精灵的x坐标。
        y:精灵的y坐标。
        z:精灵的z坐标。
        ratioAnchor: 百分比设置锚点。
        anchor：锚点。
        id tag strokeFlag strokeStyle fillFlag fillStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineDash
      }|
    }
  }
}
**/
var Annulus = Sprite.extend({
  initialize: function(param)
  {
    this.execProto("initialize", {gprim:this, interactable:((param == undefined) ? undefined : param.interactable)});
    this.subTraits(0).__init(param);
  }  
},
 [[READONLY("type"), AnnulusTrait.grant("type")], [CUSTOM_SETTER("innerradius"), AnnulusTrait.grant("innerradius")],
  [CUSTOM_SETTER("outerradius"), AnnulusTrait.grant("outerradius")], [CUSTOM_SETTER("startAngle"), AnnulusTrait.grant("startAngle")],
  [CUSTOM_SETTER("endAngle"), AnnulusTrait.grant("endAngle")], [CUSTOM_SETTER("anticlockwise"), AnnulusTrait.grant("anticlockwise")],
  [CUSTOM_SETTER("strokeStyle"), AnnulusTrait.grant("strokeStyle")], [CUSTOM_SETTER("fillStyle"), AnnulusTrait.grant("fillStyle")],
  [CUSTOM_SETTER("shadowColor"), AnnulusTrait.grant("shadowColor")]].concat(
  AnnulusTrait.grantMany(["id", "tag", "strokeFlag", "fillFlag", "shadowBlur", "shadowOffsetX", "shadowOffsetY","lineDash"])),
[AnnulusTrait]);

export$(Annulus);
};
__modules__["/lib/pathlenprocess.js"] = function(require, load, export$) {
//gprim 提供计算的方法并且具有缓冲，但是这里模块只是实现真是的计算步骤
//此后统一认为逆时针角度增加为true，顺时针角度减少false
/**
@function[LineLength]{  
  @param[point1 object]{
  直线起点坐标{x:,y:}
  }
  @param[point2 object]{
  直线终点坐标{x:,y:}
  }
  @return[number]{直线的长度}
  这个函数是计算直线的长度。
}
 */
function LineLength(point1, point2)
{
  var dx = point2.x - point1.x;
  var dy = point2.y - point1.y;
  return Math.sqrt(dx*dx + dy*dy);
}

/**
@function[q2c]{  
  @param[point1 object]{
  二次贝塞尔曲线的起始点的坐标{x：,y:}
  }
  @param[point2 object]{
   二次贝塞尔曲线的控制点的坐标{x：,y:}
  }
  @param[point3 object]{
  二次贝塞尔曲线的结束点的坐标{x：,y:}
  }
  @return[array]{返回转变后的三次贝塞尔曲线,对应所有的点的坐标[{x: y:},{x: y},{x: y:},{x: y:}]}
  这个函数是将二次贝塞尔曲线转变成三次贝塞尔曲线
  实现方法为：贝塞尔曲线的升阶算法：http://hczhcz.github.io/2014/07/16/bezier-curves-degree-elevation.html
  实际为：方程等价求解
}
*/
function q2c(point1, point2, point3) 
{
  var _13 = 1 / 3,
      _23 = 2 / 3;
  return [{x: point1.x, y: point1.y},
          {x: _13 * point1.x + _23 * point2.x, y: _13 * point1.y + _23 * point2.y},
          {x: _13 * point3.x + _23 * point2.x, y: _13 * point3.y + _23 * point2.y},
          {x: point3.x, y: point3.y}];
}

/*
@function[splitBezier]{
  @param[cArray array]{
  三次贝塞尔曲线组成的数组，要分割的贝塞尔曲线控制点构成的数组。
  }
  @param[left array]{
  输出的分割后的左边的三次贝塞尔曲线。
  }
  @param[right array]{
  输出的分割后的右边的三次贝塞尔曲线。
  }
  @return[undefined]{}
  这个函数是一个三次贝塞尔曲线分割成两个三次贝塞尔曲线,平均分割。
}
*/

function splitBezier(cArray, left, right)
{
  var c = (cArray[1].x + cArray[2].x)*0.5;
  left[1].x = (cArray[0].x + cArray[1].x)*0.5;
  right[2].x = (cArray[2].x + cArray[3].x)*0.5;
  left[0].x = cArray[0].x;
  right[3].x = cArray[3].x;
  left[2].x = (left[1].x + c)*0.5;
  right[1].x = (c + right[2].x)*0.5;
  left[3].x = right[0].x = (left[2].x + right[1].x)*0.5;

  c = (cArray[1].y + cArray[2].y)*0.5;
  left[1].y = (cArray[0].y + cArray[1].y)*0.5;
  right[2].y = (cArray[2].y + cArray[3].y)*0.5;
  left[0].y = cArray[0].y;
  right[3].y = cArray[3].y;
  left[2].y = (left[1].y + c)*0.5;
  right[1].y = (c + right[2].y)*0.5;
  left[3].y = right[0].y = (left[2].y + right[1].y)*0.5;
}

/*
@function[addIfClose]{
  @param[cArray array]{
  三次贝塞尔曲线控制点组成的数组。
  }
  @param[length array]{
  输出计算的长度。
  }
  @param[error number]{
  容错值。
  }
  @return[undefined]{}
  这个函数是真实计算一个三次贝塞尔曲线的长度。
}
*/
function addIfClose(cArray, length, error)
{
  var left = [{},{},{},{}];
  var right = [{},{},{},{}];

  var len = 0, chord;

  len += LineLength(cArray[0], cArray[1]);
  len += LineLength(cArray[1], cArray[2]);
  len += LineLength(cArray[2], cArray[3]);

  chord = LineLength(cArray[0], cArray[3]);

  if((len-chord) > error) {
      splitBezier(cArray, left, right);                 /* split in two */
      addIfClose(left, length, error);       /* try left side */
      addIfClose(right, length, error);      /* try right side */
      return;
  }

  length[0] += len;

  return;
}

/**
@function[CubicBezierLength]{
  @param[cArray array]{
  三次贝塞尔曲线组成的数组。
  }
  @return[number]{长度值}
  这个函数是计算一个三次贝塞尔曲线的长度。
 }
*/
function CubicBezierLength(cArray)
{
  var length = [0];
  var error = 0.01; //qt中选取的值

  addIfClose(cArray, length, error);

  return length[0];
}

////////////////////////ellipse-arc to besaier
var QT_PATH_KAPPA = 0.5522847498;
var Double_PI = Math.PI*2;
var Half_PI = Math.PI/2;
var FuzzyIsNull = function(num)
{
  return Math.abs(num) < 0.000000000001;
}
var FuzzyCompare = function(p1, p2)
{
  return (Math.abs(p1 - p2) * 1000000000000 <= Math.min(Math.abs(p1), Math.abs(p2)));
}
/*
@function[t_for_arc_angle]{
  @param[radians number]{
   0-Math.PI/2的角度
  }
  @return[number]{0-1这个角度对应的三次贝塞尔曲线的t}
  这个函数是计算当前的这个角度上的点在对应的三次贝塞尔曲线中对应的t.
}
*/
var t_for_arc_angle = function(radians)
{
  if (FuzzyIsNull(radians))
    return 0;

  if (FuzzyCompare(radians, Half_PI))
    return 1;

  var cosAngle = Math.cos(radians);
  var sinAngle = Math.sin(radians);

  // initial guess
  var tc = radians / Half_PI;
  // do some iterations of newton's method to approximate cosAngle
  // finds the zero of the function b.pointAt(tc).x() - cosAngle
  tc -= ((((2-3*QT_PATH_KAPPA) * tc + 3*(QT_PATH_KAPPA-1)) * tc) * tc + 1 - cosAngle) / (((6-9*QT_PATH_KAPPA) * tc + 6*(QT_PATH_KAPPA-1)) * tc); 
  tc -= ((((2-3*QT_PATH_KAPPA) * tc + 3*(QT_PATH_KAPPA-1)) * tc) * tc + 1 - cosAngle) / (((6-9*QT_PATH_KAPPA) * tc + 6*(QT_PATH_KAPPA-1)) * tc); 

  // initial guess
  var ts = tc;
  // do some iterations of newton's method to approximate sinAngle
  // finds the zero of the function b.pointAt(tc).y() - sinAngle
  ts -= ((((3*QT_PATH_KAPPA-2) * ts -  6*QT_PATH_KAPPA + 3) * ts + 3*QT_PATH_KAPPA) * ts - sinAngle) / (((9*QT_PATH_KAPPA-6) * ts + 12*QT_PATH_KAPPA - 6) * ts + 3*QT_PATH_KAPPA);
  ts -= ((((3*QT_PATH_KAPPA-2) * ts -  6*QT_PATH_KAPPA + 3) * ts + 3*QT_PATH_KAPPA) * ts - sinAngle) / (((9*QT_PATH_KAPPA-6) * ts + 12*QT_PATH_KAPPA - 6) * ts + 3*QT_PATH_KAPPA);

  // use the average of the t that best approximates cosAngle
  // and the t that best approximates sinAngle
  var t = 0.5 * (tc + ts);

  return t;
}
var parameterSplitLeft = function(bezier, t, left)
{
  left[0].x = bezier[0].x;
  left[0].y = bezier[0].y;


  left[1].x = bezier[0].x + t * (bezier[1].x - bezier[0].x);
  left[1].y = bezier[0].y + t * (bezier[1].y - bezier[0].y);

  left[2].x = bezier[1].x + t * (bezier[2].x - bezier[1].x);  // temporary holding spot
  left[2].y = bezier[1].y + t * (bezier[2].y - bezier[1].y);  // temporary holding spot



  bezier[2].x = bezier[2].x + t * (bezier[3].x - bezier[2].x);
  bezier[2].y = bezier[2].y + t * (bezier[3].y - bezier[2].y);

  bezier[1].x = left[2].x + t * (bezier[2].x - left[2].x);
  bezier[1].y = left[2].y + t * (bezier[2].y - left[2].y);

  left[2].x = left[1].x + t * (left[2].x - left[1].x);
  left[2].y = left[1].y + t * (left[2].y - left[1].y);

  left[3].x = bezier[0].x = left[2].x + t * (bezier[1].x - left[2].x);
  left[3].y = bezier[0].y = left[2].y + t * (bezier[1].y - left[2].y);
}

var bezierOnInterval = function(bezier, t0, t1)
{
  if (t0 == 0 && t1 == 1)
    return bezier;

  var result = [{},{},{},{}];
  parameterSplitLeft(bezier, t0, result);
  var trueT = (t1-t0)/(1-t0);
  parameterSplitLeft(bezier, trueT, result);

  return result;
}


/**
@function[a2c]{
  @param[cArray array]{
  正椭圆弧的参数[center_x, center_y, rx, ry, rotateangle = erfa, startangle = sita, endangle, rotateflag]。
  x，y:中心点，rx,ry：长短轴半径，startAngle，sweepLength：起始角度和曲线增长的角度，
  x1, y1:其实点的坐标位置，x2, y2:结束点的坐标位置，
  }
  @param[curves array]{
  用于保存三次贝塞尔曲线组成的所有的数组。[[x1, y1], [x2, y2], [x3, y3], [x4, y4....]],不包含起始点。
  }
  @return[int]{构成这个正的椭圆弧需要的三次贝塞尔曲线个数}
  这个函数是将一个正的椭圆用多个三次贝塞尔曲线表示。
  这里按照是和qt中是相反方向的，认为当角度增大的时候，是顺时针的形式，和canvas里面保持一致的。
}
*/
function a2c(centerP, rx, ry, startAngle, sweepLength, p1, p2, curves)
{
  var count = 0;
  var w2k = rx * QT_PATH_KAPPA;
  var h2k = ry * QT_PATH_KAPPA;

/*  var points = [[x + rx, y], [x + rx, y - h2k], [x + w2k, y - ry],
                [x, y - ry], [x - w2k, y - ry], [x - rx, y - h2k],
                [x - rx, y], [x - rx, y + h2k], [x - w2k, y + ry],
                [x, y + ry], [x + w2k, y + ry], [x + rx, y + h2k],
                [x + rx, y]];*/
  var x = centerP.x;
  var y = centerP.y;
  var points = [{x: x + rx, y: y}, {x: x + rx, y: y - h2k}, {x: x + w2k, y: y - ry},
                {x: x, y: y - ry}, {x: x - w2k, y: y - ry}, {x: x - rx, y: y - h2k},
                {x: x - rx, y: y}, {x: x - rx, y: y + h2k}, {x: x - w2k, y: y + ry},
                {x: x, y: y + ry}, {x: x + w2k, y: y + ry}, {x: x + rx, y: y + h2k},
                {x: x + rx, y: y}];

  if (sweepLength > Double_PI) {
    sweepLength = Double_PI;
  }else if (sweepLength < -Double_PI) {
    sweepLength = -Double_PI;
  }

  // Special case fast paths

  if (startAngle == 0.0) {
    var i;
    if (sweepLength == Double_PI) {
        for (i = 11; i >= 0; --i)
            curves[count++] = points[i]; //顺时针
        return count;
    } else if (sweepLength == -Double_PI) {
        for (i = 1; i <= 12; ++i)
            curves[count++] = points[i];  //逆时针
        return count;
    }
  }

  var startSegment = Math.floor(startAngle / Half_PI);  //象限
  var endSegment = Math.floor((startAngle + sweepLength) / Half_PI);

  //占那个三次贝塞尔曲线的比率
  var startT = (startAngle - startSegment * Half_PI) / Half_PI;
  var endT = (startAngle + sweepLength - endSegment * Half_PI) / Half_PI;

  var delta = sweepLength > 0 ? 1 : -1;
  if (delta < 0) {
    startT = 1 - startT;
    endT = 1 - endT;
  }

  // avoid empty start segment
  if (FuzzyIsNull(startT - 1)) {
    startT = 0;
    startSegment += delta;
  }

  // avoid empty end segment
  if (FuzzyIsNull(endT)) {
    endT = 1;
    endSegment -= delta;
  }

  startT = t_for_arc_angle(startT * Half_PI);
  endT = t_for_arc_angle(endT * Half_PI);

  var splitAtStart = !FuzzyIsNull(startT);
  var splitAtEnd = !FuzzyIsNull(endT - 1);

  var end = endSegment + delta;

  // empty arc?
  if (startSegment == end) {
    var quadrant = 3 - ((startSegment % 4) + 4) % 4;
    var j = 3 * quadrant;
    return count;
  }

  //这里是计算起始点和结束点的坐标位置，我们是已经知道的所以不用计算的。
  //find_ellipse_coords(x, y, rx, ry, startAngle, sweepLength, startPoint, endPoint);


  for (var i = startSegment; i != end; i += delta) {
    var quadrant = 3 - ((i % 4) + 4) % 4;
    var j = 3 * quadrant;

    var b;

    //////////////////
    if(delta > 0){
      b = [{x: points[j + 3].x, y: points[j + 3].y}, {x: points[j + 2].x, y: points[j + 2].y}, {x: points[j + 1].x, y: points[j + 1].y}, {x: points[j].x, y: points[j].y}];      
    }else {
      b = [{x: points[j].x, y: points[j].y}, {x: points[j + 1].x, y: points[j + 1].y},  {x: points[j + 2].x, y: points[j + 2].y}, {x: points[j + 3].x, y: points[j + 3].y}];
    }

    // empty arc?
    if (startSegment == endSegment && FuzzyCompare(startT, endT))
        return count;

    if (i == startSegment) {
        if (i == endSegment && splitAtEnd)
            b = bezierOnInterval(b, startT, endT);
        else if (splitAtStart)
            b = bezierOnInterval(b, startT, 1);
    } else if (i == endSegment && splitAtEnd) {
        b = bezierOnInterval(b, 0, endT);
    }

    // push control points
    curves[count++] = b[1]
    curves[count++] = b[2];
    curves[count++] = b[3];
  }

  curves[count-1] = {x: p2.x, y: p2.y};

  return count;
}

/**
@function[EllipseArcStandard]{
  @param[center_point object]{
  圆心的坐标{x:a,  y:b}    
  }
  @param[angle number]{
  以弧度表示的角度。     
  }
  @param[startpoint object]{
  起始点{x:a,  y:b}    
  }
  @param[endpoint object]{
  结束点{x:a,  y:b}      
  }
  @return[number]{}
  这个函数是实现将旋转的椭圆上的点标准化，即将点转换为中心为原点，旋转角度为0的椭圆上的点。
}
*/
var EllipseArcStandard = function(center_p, angle, startpoint, endpoint)
{ 
  var x = (startpoint.x - center_p.x) * Math.cos(angle) + (startpoint.y - center_p.y) * Math.sin(angle);
  var y = (startpoint.y - center_p.y) * Math.cos(angle) - (startpoint.x - center_p.x) * Math.sin(angle);

  startpoint.x = x;
  startpoint.y = y;

  x = (endpoint.x - center_p.x) * Math.cos(angle) + (endpoint.y - center_p.y) * Math.sin(angle);
  y = (endpoint.y - center_p.y) * Math.cos(angle) - (endpoint.x - center_p.x) * Math.sin(angle);

  endpoint.x = x;
  endpoint.y = y;
}

/**
@function[getTotalLength]{
  @param[path array]{
  数据格式为：[["M", {x: X, y: Y}], ["L", {x: X, y: Y}], ["Q", {x: CX, y: Cy}, {x: x, y: y}], ["C", {x: cx1, y: cy1}, {x: cx2, y: cy2}, {x: x, y: y}], 
    ["A", {x: center_x, y: center_y}, rx, ry, xaxisrotate, startAngle, endAngle, largearcflag, sweepflag, {x: x, y: y}], ["Z"]] 要计算的path路径.
  }
  @return[number]{path的长度}
  这个函数是提供给外部的接口,实现path路径的总长度。
}
*/
function getTotalLength(path)
{
  if(path.length <= 1)
    return 0;

  var len = 0;
  var obj, prelength, preobj, cArray;
  var stobj, stlength;

  for(var i = 0; i < path.length; ++i)
  {
    obj = path[i];
    switch(obj[0]){
      case "M":
        break;
      case "L":
      {
        preobj = path[i-1];
        prelength = preobj.length;
        len += LineLength(preobj[prelength - 1], obj[obj.length - 1]);
        break;
      }
      case "Q":
      {
        //需要将二次贝塞尔曲线编程三次求解的
        preobj = path[i-1];
        prelength = preobj.length;
        cArray = q2c(preobj[prelength - 1], obj[1], obj[2]);
        len += CubicBezierLength(cArray);
        break;
      }
      case "C":
      {
        preobj = path[i-1];
        prelength = preobj.length;
        cArray = preobj.slice(prelength - 1).concat(obj.slice(1));
        len += CubicBezierLength(cArray);
        break;
      }
      case "A":
      {
        preobj = path[i-1];
        prelength = preobj.length;
        var stPoint = {x: preobj[prelength-1].x, y: preobj[prelength-1].y};
        var endlength = obj.length;
        var endPoint = {x: obj[endlength - 1].x, y: obj[endlength - 1].y}; 
        EllipseArcStandard(obj[1], obj[4], stPoint, endPoint);
        var curves = new Array();
        var count = a2c({x: 0, y: 0}, obj[2], obj[3], obj[5],  obj[6] - obj[5], stPoint, endPoint, curves);
        cArray = [stPoint];
        for(var j = 0; j < count; j+=3)
        {
          cArray = cArray.slice(cArray.length - 1).concat(curves[j], curves[j+1], curves[j+2]); 
          len += CubicBezierLength(cArray);

        }
        break;
      }
      case "Z":
      {
        preobj = path[i-1];
        prelength = preobj.length;
        stobj = path[0];
        stlength = stobj.length;
        len += LineLength(preobj[prelength-1],stobj[stlength - 1]);
        break;
      }
    } 
  }

  return len;
}

/**
  @function[PointAtLine]{
  @param[t number]{
  0-1之间
  }
  @param[p1 object]{
  直线的起始点{x: a, y: b}
  }
  @param[p2 object]{
  直线的结束点{x: a, y: b}
  }
  @return[object]{point}
  这个函数是返回直线上的某一点，此点满足p1 + t*(p2 - p1).
}
*/
function PointAtLine(t, p1, p2)
{
  return {x: p1.x + t*(p2.x - p1.x), y: p1.y + t*(p2.y - p1.y)};
}

/**
@function[PointAtBezier]{
  @param[t number]{
  0-1之间
  }
  @param[cArray array]{
  三次贝塞尔曲线四个控制点构成的数组[{x:x1, y:y1},{x:x2, y:y2},{x:x3, y:y3},{x:x4, y:y4}].
  }
  @return[object]{point}
  这个函数是返回三次贝塞尔曲线上的某一点，此点满足到起点的路径与贝塞尔曲线的总路径长度的比为t.
}
*/
function PointAtBezier(t, cArray)
{
  var x, y;
  var m_t = 1 - t;
  var a, b, c;

  a = cArray[0].x * m_t + cArray[1].x*t;
  b = cArray[1].x * m_t + cArray[2].x*t;
  c = cArray[2].x * m_t + cArray[3].x*t;
  a = a*m_t + b*t;
  b = b*m_t + c*t;
  x = a*m_t + b*t;

  a = cArray[0].y * m_t + cArray[1].y*t;
  b = cArray[1].y * m_t + cArray[2].y*t;
  c = cArray[2].y * m_t + cArray[3].y*t;
  a = a*m_t + b*t;
  b = b*m_t + c*t;
  y = a*m_t + b*t;

  return {x: x, y: y};  
}

/**
@function[PointApplyEllipse]{
  @param[p object]{
  标准椭圆上的点 
  }
  @param[center object]{
  {x: y:} 中心点    
  }
  @param[angle number]{
  以弧度表示的角度。     
  }
  @return[number]{}
  这个函数是实现将标准椭圆上的点，移动然后旋转。
}
*/
function PointApplyEllipse(p, center, angle)
{
  var x = p.x * Math.cos(angle) - p.y * Math.sin(angle);
  var y = p.y * Math.cos(angle) + p.x * Math.sin(angle);

  p.x = x + center.x;
  p.y = y + center.y;
}



/*
 *  @function[pointAtPercent]{
    Returns the point at the percentage t of the current path. t在 0 到 1 之间.
    @param[path]{
      array: [["M", X, Y], ["L", X, Y], ["Q", CX, Cy, x, y], ["C", cx1, cy1, cx2, cy2, x, y], 
      ["A", center_x, center_y, rx, ry, xaxisrotate, startAngle, endAngle, largearcflag, sweepflag, x, y], ["Z"]] 要计算的path路径.
    }
    @param[t]{
      float : 0-1之间
    }
    @param[totalLength]{
      float : path的总长度
    }
 *  @return[aaa]{point: at the percentage t of the current path}
 *  }
 */
/*function pointAtPercent(path, t, totalLength)
{
  if (t < 0 || t > 1 || !path.length) {
    return [];
  }

  //只有M
  if(path.length == 1) {
    return [path[0][1], path[0][2]];
  }

  //将下列path路径都按照三次贝塞尔曲线来理解
  var curLen = 0;
  var preobj, prelength, prelen = 0, newt;
  for(var i = 0, length = path.length; i < length; i++)
  {
    var obj = path[i];
    switch(obj[0]) {
      case "M":
        break;
      case "L":
      {
        preobj = path[i-1];
        prelength = preobj.length;
        var llen= LineLength(preobj[prelength-2], preobj[prelength-1], obj[1], obj[2]);
        prelen += llen;
        if(prelen/totalLength >= t || i == length - 1) {
          prelen -= llen;
          newt = (totalLength * t - prelen) / llen;
          PointAtLine(newt, preobj[prelength-2], preobj[prelength-1], obj[1], obj[2]);
        }
        break;
      }
      case "Q":
      {

        break;
      }
      case "C":
      {
        break;
      }
      case "A":
      {
        break;
      }
      case "Z":
      {

      }
    }
  }


  qreal totalLength = length();
  qreal curLen = 0;
  qreal bezierLen = 0;

  const int lastElement = path.elementCount() - 1;
    for (int i=0; i <= lastElement; ++i) {
        const QPainterPath::Element &e = path.elementAt(i);

        switch (e.type) {
        case QPainterPath::MoveToElement:
            break;
        case QPainterPath::LineToElement:
        {
            QLineF line(path.elementAt(i-1), e);
            qreal llen = line.length();
            curLen += llen;
            if (i == lastElement || curLen/totalLength >= t) {
                *bezierLength = llen;
                QPointF a = path.elementAt(i-1);
                QPointF delta = e - a;
                return QBezier::fromPoints(a, a + delta / 3, a + 2 * delta / 3, e);
            }
            break;
        }
        case QPainterPath::CurveToElement:
        {
            QBezier b = QBezier::fromPoints(path.elementAt(i-1),
                                            e,
                                            path.elementAt(i+1),
                                            path.elementAt(i+2));
            qreal blen = b.length();
            curLen += blen;

            if (i + 2 == lastElement || curLen/totalLength >= t) {
                *bezierLength = blen;
                return b;
            }

            i += 2;
            break;
        }
        default:
            break;
        }
        *startingLength = curLen;
    }
    return QBezier();

  qreal realT = (totalLength * t - curLen) / bezierLen;

  return b.pointAt(qBound(qreal(0), realT, qreal(1)));
}*/


export$({
  LineLength: LineLength,
  q2c: q2c,
  CubicBezierLength: CubicBezierLength,
  EllipseArcStandard: EllipseArcStandard,
  a2c: a2c,
  getTotalLength: getTotalLength,
  PointApplyEllipse: PointApplyEllipse,
  PointAtLine: PointAtLine,
  PointAtBezier: PointAtBezier
});

};
__modules__["/sprites/bubblereceiver.js"] = function(require, load, export$) {
var TreeActor = require("../treeactor").TreeActor;

/**
@title{BubbleReceiver}
*/

/**
@iclass[BubbleReceiver TreeActor ]{
  冒泡消息的接收节点。只有 BubbleReceiver 节点才能够收到所有孩子节点的冒泡消息。
}
**/
var BubbleReceiver = TreeActor.extend({
  initialize : function()
  {
    this.execProto("initialize", {});
  },

/**
@method[receiveBubble]{
  @class[BubbleReceiver]
  @return[boolean]{是否接收冒泡消息。true：接收；false：不接收。}
}
*/ 
  receiveBubble : function()
  {
    return true;
  },

  emitDisplayObjects : function()
  {

  },

  emitInteractiveObjects : function()
  {

  }
});

export$(BubbleReceiver);
};
__modules__["/pidget.js"] = function(require, load, export$) {
var Klass = require("./lib/colortraits").Klass
,   Trait = require("./lib/colortraits").Trait
,   compose = require("./lib/colortraits").compose
,   debug = require("./lib/debug");

var BasePidget = Klass.extend({
  initialize : function(param)
  {
    this._t.setgprim(param.gprim);
    this._t.setactor(param.actor);
    this._t.setworldMatrix(param.worldMatrix);
    this._t.setviewMatrix(param.viewMatrix);
  }  
}, ["gprim", "actor", "worldMatrix", "viewMatrix"]);

var DisplayObject = BasePidget.extend({
  initialize : function(param)
  {
  	this.execProto("initialize", param);
  },
  draw : function(painter)
  {
    painter.drawDisplayObject(this);
  }
});

var InteractiveObject = BasePidget.extend({
  initialize : function(param)
  {
  	this.execProto("initialize", param);
  },
  inside : function(camera, viewPstn)
  {
    var pstnRel2GPrim = camera.getPstnRelativeToMatrix(viewPstn, this.worldMatrix());
    return this.gprim().inside(pstnRel2GPrim.x,pstnRel2GPrim.y);
  }
});

var EffectedDisplayObject = DisplayObject.extend({
  initialize : function(param)
  {
    this.execProto("initialize",param);
  },
  draw:function(painter)
  {
    var clipper = this.actor().clipper();
    var effect = this.actor().effect();
    painter.drawEffectedDisplayObject(this,clipper,effect);
  }
});

var EffectedInteractiveObject = InteractiveObject.extend({
  initialize : function(param)
  {
    this.execProto("initialize",param);
  },
  inside : function(camera,viewPstn)
  {
    var clipper = this.actor().clipper();
    if(!clipper)
    {
      return this.execProto("inside",camera,viewPstn)
    }else
    {
      return this.execProto("inside",camera,viewPstn) && clipper.inside(camera,viewPstn);
    }
  }
});

export$({
  DisplayObject:DisplayObject,
  InteractiveObject:InteractiveObject,
  EffectedDisplayObject:EffectedDisplayObject,
  EffectedInteractiveObject:EffectedInteractiveObject
});
};
__modules__["/query.js"] = function(require, load, export$) {
var colortraits = require("./lib/colortraits");
var  Trait = colortraits.Trait;

var util = require("./lib/util");
var arrayForEach = util.arrayForEach;
var arraySome = util.arraySome;

/**
@itrait[QueryTrait]{
  查找和替换功能模块
}
**/
/**
@property[id string]{
  @trait[QueryTrait]
  唯一的id值。可以通过id查找/删除一棵树上的图元。
}
*/
/**
@property[tag string]{
  @trait[QueryTrait]
  tag值。可以通过tag组成的路径查找/删除一棵树上的图元。
}
*/
var QueryTrait = Trait.extend({
  __init: function(param)
  {
    this._t.setid(param.id);
    this._t.settag(param.tag);
  },
/**
@method[getGPrimsInPath]{
  @trait[QueryTrait]
  @param[path string]{
  路径，格式为"tag/tag/xxx/../tag"("树根/树孩子/树孩子/.../查找的孩子")。
  实际查找的时候，没有tag会自动跳过去。
  }
  @param[ret array]{
  输入的空数组，存储path路径上所有的gprims。
  }
  @return[boolean]{true:找到，false:没找到}
  查找当前路径下的，所有的gprims，并将其保存在输入的数组中。
  输入一个path路径，以及空数组，空数组表示：输出的path路径上的一连串gprims，返回boolean值表示是否找到。 
}
*/
  getGPrimsInPath: function(path, ret)
  {
  	var paths = path.split("/");
  
	  if (paths.length == 0)
	    return false;

	  ret.push(this);

	  if (this.tag() == paths[0])
	  {
	    paths.splice(0, 1);
	    if (paths.length == 0)
	      return true;
	  }

	  if(this.respondsTo("gprims") == undefined) //this.gprims()
	  {
	    ret.pop(this);
	    return false;
	  }

	  var bFind = arraySome(this.gprims(), function(subm)
                                        {
                                          if (true == subm.getGPrimsInPath(paths.join("/"), ret))
                                          {
                                            return true;
                                          }

                                          return false;
                                        });

	  if (bFind == false)
	  {
	    ret.pop(this);
	    return false;
	  }
	  return true;  	
  },
/**
@method[innergetPath  #:hidden]{
  @trait[QueryTrait]
  @param[m gprim]{
  目标gprim.
  }
  @param[paths array]{
  空数组，用于存储路径。
  }
  @return[boolean]{true:指定的gprim在当前gprim内,false:给定的gprim不在当前此gprim内}
  从当前gprim开始，到指定的gprim路径上，获取paths路径.
  一般为内部调用方法。
}
*/
  innergetPath: function(m, paths)
  {
    //innergetPath内部使用函数
    if (this.tag())
      paths.push(this.tag());

    //if find it
    if (this == m)
      return true;

    if (this.respondsTo("gprims") === undefined)
    {
      if(this.tag())
        paths.pop();
      return false;
    }

    var bFind = arraySome(this.gprims(), function(pmm)
                                        {
                                          if (pmm.innergetPath(m, paths) == true)
                                          {
                                            return true;
                                          }

                                          return false;
                                        });
    
    if (false == bFind)
    {
      if(this.tag())
        paths.pop();

      return false;
    }

    return true;
  },
/**
@method[getPath]{
  @trait[QueryTrait]
  @param[m gprim]{
  要获取路径的gprim。
  }
  @return[path]{获取的路径，格式为"xxx/xxx/...",如果没有找到返回false}
  获取当前gprim到输入的gprim的对应路径。
}
*/
  getPath: function(m)
  {      
    var paths = [];

    if (false == this.innergetPath(m, paths))
    {
      return false;
    }
    else
      return paths.join("/");
  },
/**
@method[findGPrimByPath]{
  @trait[QueryTrait]
  @param[path string]{
  要查询gprim的路径。
  }
  @return[gprim]{返回要查询的gprim, 若没有找到则返回false。}
  在当前树根开始，依据path路径找到对应的那一个gprim。
}
*/
  findGPrimByPath: function(path)
  {
    var ms = [];
    if (this.getGPrimsInPath(path, ms) === false)
      return false;
    
    return ms[ms.length-1];
  },
/**
@method[removeGPrimByPath]{
  @trait[QueryTrait]
  @param[path string]{
  要删除gprim的路径。
  }
  @return[gprim]{返回要删除的gprim, 若没有找到则返回false。}
  当前树根开始，将指定path路径末端的gprim删除掉，并返回被删除的gprim。
  其中，根部的gprim是不可以被移除的。
}
*/
  removeGPrimByPath: function(path)
  {
    var ms = [];
    if (!this.getGPrimsInPath(path, ms))
      return false;

    if (ms.length < 2)
      return false;

    var pm = ms[ms.length-2]
    ,   dm = ms[ms.length-1]
    ,   pms = pm.gprims()

    pms.splice(pms.indexOf(dm), 1);
    pm.setgprims(pms);

    return dm;
  },
/**
@method[replaceGPrimByPath]{
  @trait[QueryTrait]
  @param[path string]{
  替换的gprim的路径。
  }
  @param[m gprim]{
  替换的gprim。
  }
  @return[gprim]{返回被替换的gprim, 否则返回false。}
  当前树根开始, 将指定path路径上的gprim用另外一个gprim替换。
  其中，根部的gprim是不可以被替换的。
}
*/
  replaceGPrimByPath: function(path, m)
  {
    var ms = [];
    if (this.getGPrimsInPath(path, ms) === false)
      return false;

    if (ms.length < 2)
      return false;

    var pm = ms[ms.length-2]
    ,   dm = ms[ms.length-1]
    ,   pms = pm.gprims();

    pms.splice(pms.indexOf(dm), 1, m);
    pm.setgprims(pms);

    return dm;
  },
/**
@method[addGPrimByPath]{
  @trait[QueryTrait]
  @param[path string]{
  添加gprim的路径。
  }
  @param[m gprim]{
  被添加的gprim。
  }    
  @return[boolean]{添加成功返回ture, 添加失败返回false}
  从当前树根开始，给指定path路径上的CompositeGPrim添加一个gprim。
  所以path路径末端所指的gprim必须是一个CompositeGPrim.会添加在gprims数组的后面。
}
*/
  addGPrimByPath: function(path, m)
  {
    if (path === undefined && this.type() == "composite")
    {
      this.gprims().push(m);
      return true;
    }

    var ms = [];
    if (this.getGPrimsInPath(path, ms) === false)
      return false;

    if(ms[ms.length-1].respondsTo("gprims") === undefined)
      return false;

    ms[ms.length-1].gprims().push(m);
    return true;    
  },
/**
@method[findGPrimsBytag]{
  @trait[QueryTrait]
  @param[tag string]{
  标签。
  }
  @param[ret array]{
  一个空array，用于存储所有tag满足条件的gprim。
  }
  @return[undefined]{} 
  查找一颗树上所有tag为此的gprims。
}
*/
  findGPrimsBytag: function(tag, ret)
  {
    if(this.tag() == tag)
    {
      ret.push(this);
    }
    if(this.respondsTo("gprims") == undefined)
      return;
    var gprims = this.gprims();
    for(var i = 0, length = gprims.length; i < length; i++)
    {
      var subm = gprims[i];
      subm.findGPrimsBytag(tag, ret);
    }
/*     arrayForEach(this.gprims(), function(subm)
                                            {
                                              subm.findGPrimsBytag(tag, ret);
                                            });*/
    return;
  },
/**
@method[findGPrimById]{
  @trait[QueryTrait]
  @param[id string]{
  要查找的gprim的id。
  }
  @param[ret array]{
  空数组，用于存储查找到的gprim.
  }
  @return[boolean]{}
  从当前树根开始，查找id为此的gprim, 采用深度遍历优先级法。
  输入一个id，以及空数组，空数组存储满足id的第一个gprim，返回boolean值表示是否找到。
}
*/
  findGPrimById: function(id, ret)
  {
    if(this.id() == id)
    {
      ret.push(this);
      return true;
    }
    if(this.respondsTo("gprims") == undefined)
      return false;

    var bFind = arraySome(this.gprims(), function(subm)
                                        {
                                          if (true == subm.findGPrimById(id, ret))
                                          {
                                            return true;
                                          }

                                          return false;
                                        });
    return bFind;
  },
/**
@method[removeGPrimById]{
  @trait[QueryTrait]
  @param[id string]{
  要移除的gprim的id。
  }
  @return[gprim]{移除成功：返回被移除的gprim,移除失败：返回false}
  在当前树根开始，移除id为此的gprim, 采用深度遍历优先级法。
  根部的gprim不可以被移除
}
*/
  removeGPrimById: function(id)
  {
    var ret = [];
    if(!this.findGPrimById(id, ret))
      return false;
    var m = ret[0];
    ret = [];
    
    if(false == this.getGPrims(m, ret))
      return false;
    if (ret.length < 2)
      return false;

    var pm = ret[ret.length-2]
    ,   dm = ret[ret.length-1]
    ,   pms = pm.gprims();

    pms.splice(pms.indexOf(m), 1);
    pm.setgprims(pms);

    return dm;
  },
/**
@method[replaceGPrimById]{
  @trait[QueryTrait]
  @param[id string]{
  替换的gprim的id。
  }
  @param[newm gprim]{
  替换的gprim。
  }
  @return[gprim]{返回被替换的gprim, 替换失败，返回false。}
  当前树根开始, 将id为此的gprim用另外一个gprim替换。
  其中，根部的gprim是不可以被替换的。
}
*/
  replaceGPrimById: function(id, newm)
  {
    var ms = [];
    if(!this.findGPrimById(id, ms))
      return false;
    var m = ms[0];
    ms= [];
    if (this.getGPrims(m, ms) === false)
      return false;

    if (ms.length < 2)
      return false;

    var pm = ms[ms.length-2]
    ,   dm = ms[ms.length-1]
    ,   pms = pm.gprims();

    pms.splice(pms.indexOf(dm), 1, newm);
    pm.setgprims(pms);

    return dm;
  },
/**
@method[getGPrims]{
  @trait[QueryTrait]
  @param[m gprim]{
  要查找的gprim。
  }
  @param[ret array]{
  空数组，用于存储从树根到此gprim这一路径上的所有的gprim。
  }
  @return[boolean]{true表示这个gprim在此树上，false不在}
  从当前树根开始，查找此gprim, 采用深度遍历优先级法。
}
*/
  getGPrims: function(m, ret)
  {
    ret.push(this);
    if(this == m)
      return true;
    if(this.respondsTo("gprims") == undefined)
    {
      ret.pop();
      return false;
    }

    var bFind = arraySome(this.gprims(), function(subm)
                                          {
                                            if(true == subm.getGPrims(m, ret))
                                              return true;
                                            else
                                              return false;          
                                          })
    


    if(false == bFind)
    {
      ret.pop();
      return false;
    }

    return true;    
  },
/**
@method[replaceGPrim]{
  @trait[QueryTrait]
  @param[oldm gprim]{
  被替换的gprim。
  }
  @param[newm gprim]{
  替换的gprim。
  }
  @return[boolean]{替换成功返回true, 否则返回false。}
  当前树根开始，用新的gprim替换老的gprim
}
*/
  replaceGPrim: function(oldm, newm)
  {
    //这里实现本来可以通过path组合的查找方式实现的，但是path组合方式需要先构成path然后再去替换，要做两次查找，所以这里重新做过查找一次，直接替换

    var ret = [];
    if(!this.getGPrims(oldm, ret))
      return false;

    if (ret.length < 2)
      return false;

    var pm = ret[ret.length-2]
    ,   pms = pm.gprims();

    pms.splice(pms.indexOf(oldm), 1, newm);
    pm.setgprims(pms);

    return true;
  },
/**
@method[removeGPrim]{
  @trait[QueryTrait]
  @param[rm gprim]{
  要删除的gprim。
  }
  @return[boolean]{删除成功则返回true, 否则返回false。}
  当前树根开始，删除输入的gprim
  其中，根部的gprim是不可以被移除的。
}
*/
  removeGPrim: function(m)
  {
    var ret = [];
    if(false == this.getGPrims(m, ret))
      return false;
    if (ret.length < 2)
      return false;

    var pm = ret[ret.length-2]
    ,   pms = pm.gprims();

    pms.splice(pms.indexOf(m), 1);
    pm.setgprims(pms);

    return true;
  },
/**
@method[findGPrimsByType]{
  @trait[QueryTrait]
  @param[type string]{
  gprim的类型。
  }
  @param[ret array]{
  空数组，用于存储所有type为此类型的gprim。
  }
  @return[undefined]{}
  从此根部开始，查找gprim树上所有type类型为此的gprims，并将满足条件的gprims保存在输入的数组内。
}
*/
  findGPrimsByType: function(type, ret)
  {
    if(this.type() == type)
    {
      ret.push(this);
    }
    if(this.respondsTo("gprims") == undefined)
      return;

    var bFind = arrayForEach(this.gprims(), function(subm)
                                            {
                                              subm.findGPrimsByType(type, ret);
                                            });
    return;
  }
},
["id", "tag"]
);

export$({
  QueryTrait:QueryTrait
});


};
__modules__["/thirdlib/rx/rx.helper.js"] = function(require, load, export$) {
/**
* Copyright 2011 Microsoft Corporation
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

(function (root, factory) {
    var freeExports = typeof exports == 'object' && exports &&
    (typeof root == 'object' && root && root == root.global && (window = root), exports);

    // Because of build optimizers
    if (typeof define === 'function' && define.amd) {
        define(['rx', 'exports'], function (Rx, exports) {
            root.Rx = factory(root, exports, Rx);
            return root.Rx;
        });
    }  else if (typeof module == 'object' && module && module.exports == freeExports) {
        var rxroot = factory(root, module.exports, require('./rx'));
        module.exports = rxroot;
    } else {
        root.Rx = factory(root, {}, root.Rx);
    }
}(this, function (global, exports, root, undefined) {

    var Observable = root.Observable,
        observableProto = Observable.prototype,
        observableCreateWithDisposable = Observable.createWithDisposable,
        disposableCreate = root.Disposable.create,
        CompositeDisposable = root.CompositeDisposable,
        RefCountDisposable = root.RefCountDisposable,
        AsyncSubject = root.AsyncSubject;

    //then must give a select funtion
    //select function must return an observable
    Observable.prototype.then = function (selector, eventName) {
        return this.select(selector).switchLatest();
    };

    return root;
}));
};
__modules__["/eventdecider.js"] = function(require, load, export$) {
var geo = require("./lib/geometry")
,   debug = require("./lib/debug")
,   Klass = require("./lib/colortraits").Klass
,   Trait = require("./lib/colortraits").Trait;

var Rx = require("./thirdlib/rx/all");

var util = require("./lib/util");
var arrayForEach = util.arrayForEach;
var arraySome = util.arraySome;
var identifier = util.identifier;
var objectDotCreate = util.objectDotCreate;


//helper function
//fix here 绝大部分时候，view的矩阵是不会变的。做优化。
var addPstnInGameWorld = function(camera, evt)
{
  var mat = geo.matrixInvert(camera.getGameToViewMatrix());
  var gamePstn = geo.pointApplyMatrix({x:evt.mouseX, y:evt.mouseY}, mat);

  evt.gameX = gamePstn.x;
  evt.gameY = gamePstn.y;

  return evt;
};

var addPstnInGameWorld = function(camera, evt)
{
  var mat = geo.matrixInvert(camera.getGameToViewMatrix());
  var gamePstn = geo.pointApplyMatrix({x:evt.mouseX, y:evt.mouseY}, mat);

  evt.gameX = gamePstn.x;
  evt.gameY = gamePstn.y;

  return evt;
};



function preventFlow()
{
  this.flow = false;
}

var cloneEvent = function(evt)
{
  var newEvt = objectDotCreate(evt);

  newEvt.flow = true;
  newEvt.preventFlow = preventFlow;

  return newEvt;
}

function Sort(camera, array, i, j) 
{
  // 结束条件
  if (i == j) {
      return
  };

  var key = array[i];
  var stepi = i; // 记录开始位置
  var stepj = j; // 记录结束位置
  while (j > i) 
  {
    // j <<-------------- 向前查找
    if ((array[j].viewMatrix().tz - key.viewMatrix().tz)  < 0) {
    //if (array[j] >= key) {
      j--;
    } 
    else 
    {
      array[i] = array[j]
      //i++ ------------>>向后查找
      while (j > ++i) {
        if ((array[i].viewMatrix().tz - key.viewMatrix().tz)  <= 0) {
        //if (array[i] > key) {
          array[j] = array[i];
          break;
        }
      }
    }
  }

  // 如果第一个取出的 key 是最小的数
  if (stepi == i) {
      Sort(++i, stepj);
      return;
  }

  // 最后一个空位留给 key
  array[i] = key;

  // 递归
  Sort(stepi, i);
  Sort(j, stepj);
}

function quickSortInteractiveObjs(camera, array) {
  //var array = [8,4,6,2,7,9,3,5,74,5];
  //var array = [0,1,2,44,4,324,5,65,6,6,34,4,5,6,2,43,5,6,62,43,5,1,4,51,56,76,7,7,2,1,45,4,6,7];
  var i = 0;
  var j = array.length - 1;
  
  Sort(camera, array, i, j);

  return array;
}

function compareFun(m1, m2)
{
  return m2.viewMatrix().tz - m1.viewMatrix().tz;
}


//resolve the events which nodes do not know how to dispatch
var deciderTrait = Trait.extend({
  initialize : function(dispatcher)
  {
    this.interactiveObjs = {};
    this.interactiveObjs.mouse = [];
    this.interactiveObjs.keyboard = [];
    this.interactiveObjs.touch = [];
    this._deciderSubject = new Rx.Subject();
    this._deciderObservable = this._deciderSubject.asObservable();
    this._deciderObservable.subscribe(dispatcher);
  },

  deciderObservable : function()
  {
    return this._deciderObservable;
  },

  hitTestNodes:function(camera, pos, interactiveObjs)
  {
    var self = this;
    var hitOne, gprimPath;

    camera.updateViewMatrix(interactiveObjs);
    //在 chrome 下测试 quickSortInteractiveObjs 及原生 array sort 的性能，52个对象连续排序10000次，用时差不多。
    //在 ie7 下 52 个对象连续排序 100 次，原生 sort 和 quickSortInteractiveObjs 的时间比接近 1 : 4；因此采用自己实现的快速排序算法。
    //quickSortInteractiveObjs(camera, interactiveObjs);
    interactiveObjs.sort(compareFun);

    for(var i = 0; i < interactiveObjs.length; ++i)
    {
      var interactiveObj = interactiveObjs[i];      
      gprimPath = self.hitTest(camera, pos, interactiveObj);
      if (gprimPath != false)
      {
        hitOne = interactiveObj;
        break;
      }
    }

    if (hitOne)
    {
      return {hitActor:hitOne.actor(), 
              gprimPath:typeof(gprimPath) == "object" ? gprimPath : undefined};
    }
  },

  //control:{gprim:gprim, effect:{matrix:matrix, ...}}
  hitTest:function(camera, viewPstn, interactiveObj)
  {
    return interactiveObj.inside(camera,viewPstn);
  },

  //type must be mouse or keyboard
  updateInteractiveObjects : function(scene, type)
  {
    this.interactiveObjs[type].length = 0;
    scene.requestInteractiveObjects(this, this.interactiveObjs[type], type);
  }
});

var DeciderBase = Klass.extend({}, [], [deciderTrait]);

var mouseEventDeciderTrait = Trait.extend({
  mousedownDecider : function(camera, evt, interactiveObjs, sub)
  {
    if (this._pressedInfo)
    {
      if(this._pressedInfo.hitActor.queryInteractSubject("mouseReleased") != undefined)
      {
        var newEvt = cloneEvent(evt);
        newEvt.type = 'mouseReleased';
        newEvt.actor = this._pressedInfo.hitActor;

        this._pressedInfo = undefined;
        this._pressedEvent = undefined;

        sub.onNext(newEvt)
      }
    }

    var hitInfo = this.hitTestNodes(camera, {x:evt.mouseX, y:evt.mouseY}, interactiveObjs);
    var targetNode = hitInfo ? hitInfo.hitActor : undefined;
    if (hitInfo && targetNode.queryInteractSubject("mousePressed") != undefined)
    {
      this._pressedInfo = hitInfo;
      this._pressedEvent = cloneEvent(evt);
      this._pressedEvent.type = "mousePressed";
      this._pressedEvent.actor = targetNode;
      this._pressedEvent.gprimPath = hitInfo.gprimPath;

      sub.onNext(this._pressedEvent);
    }
  },

  mousemoveDecider : function(camera, evt, interactiveObjs, sub)
  {    
    if (this._pressedInfo)
    {
      if(this._pressedInfo.hitActor.queryInteractSubject("mouseMoved") != null)
      {
        var newEvt = cloneEvent(evt);
        newEvt.gprimPath = this._pressedInfo.gprimPath;
        newEvt.actor = this._pressedInfo.hitActor;
        newEvt.type = "mouseMoved";

        sub.onNext(newEvt);
      }
    }
    else
    {
      var hitInfo = this.hitTestNodes(camera, {x:evt.mouseX, y:evt.mouseY}, interactiveObjs);
      var targetNode = hitInfo ? hitInfo.hitActor : undefined;

      if (this._activeNode && ((targetNode !== this._activeNode)))
      {
        if(this._activeNode.queryInteractSubject("mouseOut") != null)
        {
          var newEvt = cloneEvent(evt);
          newEvt.type = 'mouseOut';
          newEvt.gprimPath = this._activeGPrimPath;
          newEvt.actor = this._activeNode;
          
          sub.onNext(newEvt);
        }

        this._activeNode = undefined;
        this._activeGPrim = undefined;
        this._activeGPrimPath = undefined;
      }
      else if (hitInfo && targetNode && (targetNode == this._activeNode))
      {
        if(this._activeNode.queryInteractSubject("mouseMoved") != null)
        {
          var newEvt = cloneEvent(evt);
          newEvt.type = "mouseMoved";
          newEvt.gprimPath = hitInfo.gprimPath;
          newEvt.actor = this._activeNode;
      
          sub.onNext(newEvt);
        }
      }
      else if (targetNode && targetNode !== this._activeNode)
      {        
        this._activeNode = hitInfo.hitActor;
        this._activeGPrimPath = hitInfo.gprimPath;

        if(this._activeNode.queryInteractSubject("mouseOver") != null)
        {
          var newEvt = cloneEvent(evt);
          newEvt.type = 'mouseOver';
          newEvt.gprimPath = hitInfo.gprimPath;
          newEvt.actor = this._activeNode;

          sub.onNext(newEvt);
        }
      }
    }
  },

  mouseupDecider : function(camera, evt, interactiveObjs, sub)
  {
    if(this._pressedInfo)
    {
      if(this._pressedInfo.hitActor.queryInteractSubject("mouseReleased") == null)
      {
        this._pressedInfo = undefined;
        this._pressedEvent = undefined;
      }
      else
      {
        var newEvt = cloneEvent(evt);
        newEvt.gprimPath = this._pressedInfo.gprimPath;
        newEvt.actor = this._pressedInfo.hitActor;
        newEvt.type = "mouseReleased";

        this._pressedInfo = undefined;
        this._pressedEvent = undefined;

        sub.onNext(newEvt);
      }
    }
  }

});

var commonEventDeciderTrait = Trait.extend({  
  commonEventDecider:function(camera, evt, interactiveObjs, sub)
  {
    var i, waiter;

    for(var id in waiters)
    {
      var waiter = waiters[id];
      var newEvt = cloneEvent(evt);
      newEvt.actor = waiter;
      sub.onNext(newEvt);
    }
  }

});

function allTouchesInFixedActor(decider, touches, camera, interactiveObjs)
{
  var len = touches.length;
  var fixedHitActor;
  var hitInfo;
  var hitActor;

  for(var i = 0; i < len; ++i)
  {
    hitInfo = decider.hitTestNodes(camera, {x:touches[0].mouseX, y:touches[0].mouseY}, interactiveObjs);
    hitActor = hitInfo ? hitInfo.hitActor : undefined;
    if(fixedHitActor == null)
    {
      fixedHitActor = hitActor;
    }
    if(fixedHitActor == null || fixedHitActor != hitActor)
      return false;
  }

  return fixedHitActor;
}

//将 touch事件，分发为 twoFingerTouch 事件以及 mouseOver、mouseMoved、mouseOut事件等。
var touchDeciderTrait = Trait.extend({
  touchstartDecider : function(camera, evt, interactiveObjs, sub)
  {
    var touches = evt.touches;
    var len = touches.length;
    if(this._t.twoFingerTouching() || len != 2)
    {
      this.mousedownDecider(camera, evt, interactiveObjs, sub);
      return;
    }

    if(len != 2)
      return;

    var fixedHitActor = allTouchesInFixedActor(this, touches, camera, interactiveObjs);
    if(!fixedHitActor)
      return;

    if(fixedHitActor.queryInteractSubject("twoFingerTouch") == null)
      return;

    //two finger touch at fixedHitActor
    var newEvt = cloneEvent(evt);
    newEvt.type = 'twoFingerTouch';
    newEvt.etype = 'touchstart';
    newEvt.actor = fixedHitActor;

    sub.onNext(newEvt);
    this._t.settwoFingerTouching(fixedHitActor);
  },

  touchmoveDecider : function(camera, evt, interactiveObjs, sub)
  {
    var touches = evt.touches;
    if(this._t.twoFingerTouching() == null || touches.length != 2)
    {
      this.mousemoveDecider(camera, evt, interactiveObjs, sub);
      return;
    }

    var fixedHitActor = allTouchesInFixedActor(this, touches, camera, interactiveObjs);
    if(!fixedHitActor || fixedHitActor != this._t.twoFingerTouching())
      return;

    if(fixedHitActor.queryInteractSubject("twoFingerTouch") == null)
      return;

    //two finger touch at fixedHitActor
    var newEvt = cloneEvent(evt);
    newEvt.type = 'twoFingerTouch';
    newEvt.etype = 'touchmove';
    newEvt.actor = fixedHitActor;

    sub.onNext(newEvt);
  },

  touchendDecider : function(camera, evt, interactiveObjs, sub)
  {
    this.mouseupDecider(camera, evt, interactiveObjs, sub);
    if(this._t.twoFingerTouching() == null)
      return;

    var fixedHitActor = this._t.twoFingerTouching();
    if(fixedHitActor.queryInteractSubject("twoFingerTouch") == null)
      return;
    //two finger touch at fixedHitActor
    var newEvt = cloneEvent(evt);
    newEvt.type = 'twoFingerTouch';
    newEvt.etype = 'touchend';
    newEvt.actor = fixedHitActor;

    sub.onNext(newEvt);
    this._t.settwoFingerTouching(undefined);
  }
}, ["twoFingerTouching"]);


var mouse = "mouse";
var keyboard = "keyboard";

var BaseEventDecider = DeciderBase.extend(
  {
    initialize:function(camera, eventObservables, scene, dispatcher)
    {
      this.execProto("initialize", dispatcher);

      var self = this;
      var camera = camera;
      var eventObservables = eventObservables;
      var sub = this._deciderSubject;
      var i = 0;

      this.observers = [];
      if(eventObservables.mousedownObservable)
      {
        this.observers[i++] = eventObservables.mousedownObservable.subscribe(function(evt){
          self.updateInteractiveObjects(scene, mouse);
          addPstnInGameWorld(camera, evt);
          self.mousedownDecider(camera, evt, self.interactiveObjs.mouse, sub);
        });
        this.observers[i++] = eventObservables.mousemoveObservable.subscribe(function(evt){
          self.updateInteractiveObjects(scene, mouse);
          addPstnInGameWorld(camera, evt);
          self.mousemoveDecider(camera, evt, self.interactiveObjs.mouse, sub);
        });
        this.observers[i++] = eventObservables.mouseupObservable.subscribe(function(evt){
          self.updateInteractiveObjects(scene, mouse);
          addPstnInGameWorld(camera, evt);
          self.mouseupDecider(camera, evt, self.interactiveObjs.mouse, sub);
        });
      }
      this.observers[i++] = eventObservables.keydownObservable.subscribe(function(evt){
        self.updateInteractiveObjects(scene, keyboard);
        addPstnInGameWorld(camera, evt);
        self.commonEventDecider(camera, evt, self.interactiveObjs.keyboard, sub);
      });
      this.observers[i++] = eventObservables.keyupObservable.subscribe(function(evt){
        self.updateInteractiveObjects(scene, keyboard);
        addPstnInGameWorld(camera, evt);
        self.commonEventDecider(camera, evt, self.interactiveObjs.keyboard, sub);
      });
      if(eventObservables.touchstartObservable)
      {
        this.observers[i++] = eventObservables.touchstartObservable.subscribe(function(evt){
          self.updateInteractiveObjects(scene, mouse);
          //addPstnInGameWorld(camera, evt);
          self.touchstartDecider(camera, evt, self.interactiveObjs.mouse, sub);
        });
        this.observers[i++] = eventObservables.touchmoveObservable.subscribe(function(evt){
          self.updateInteractiveObjects(scene, mouse);
          //addPstnInGameWorld(camera, evt);
          self.touchmoveDecider(camera, evt, self.interactiveObjs.mouse, sub);
        });
        this.observers[i++] = eventObservables.touchendObservable.subscribe(function(evt){
          self.updateInteractiveObjects(scene, mouse);
          //addPstnInGameWorld(camera, evt);
          self.touchendDecider(camera, evt, self.interactiveObjs.mouse, sub);
        });
      }
    },

    destroy : function()
    {
      for(var i = 0; i < this.observers.length; ++i)
      {
        this.observers[i].dispose();
      }
    }
  },
  [],
  [
    mouseEventDeciderTrait,
    commonEventDeciderTrait,
    touchDeciderTrait
    ]
);

function normalDispatcher(evt)
{
  if(evt.actor.queryInteractSubject(evt.type) == null)
    debugger;
  evt.actor.queryInteractSubject(evt.type).onNext(evt);
}

var EventDecider = BaseEventDecider.extend({
  initialize : function(camera, eventObservables, scene)
  {
    this.execProto("initialize", camera, eventObservables, scene, normalDispatcher);
  }
});

function bubbleDispatcher(evt)
{
  var actor = evt.actor;

  actor.queryInteractSubject(evt.type).onNext(evt);
  if(!evt.flow)
    return;

  var parent = actor.parent();
  while(parent)
  {
    if(parent.hasMethod("receiveBubble") && parent.receiveBubble())
    {
      parent.queryInteractSubject(evt.type).onNext(evt);
      if(!evt.flow)
        return;
    }
    actor = parent;
    parent = parent.parent();
  }
}

var BubbleEventDecider = BaseEventDecider.extend({
  initialize : function(camera, eventObservables, scene)
  {
    this.execProto("initialize", camera, eventObservables, scene, bubbleDispatcher);
  }
});

export$({
  DeciderBase:DeciderBase,
  EventDecider:EventDecider,
  BubbleEventDecider:BubbleEventDecider
});



};
__modules__["/lib/timestamp.js"] = function(require, load, export$) {
var Klass = require("./colortraits").Klass
,   Trait = require("./colortraits").Trait;

/*时间钟模块。*/


var timeStamperTrait = Trait.extend({
  initialize:function(param)
  {
    this.execProto("initialize");
    
    param = param || {};
    
    if (param.startTime != undefined)
      this._startTime = param.startTime;
    else
      this._startTime = 0;
      
    this._curTime = this._startTime;
    
    if (param.step != undefined)
      this._step = param.step;
    else
      this._step = 1;
      
    return this;
  },
  
  stepForward:function(dt)
  {
    if (dt != undefined)
      this._curTime = this._curTime + dt;
    else
      this._curTime = this._curTime + this._step;
  },
  
  adjust:function(t)
  {
    this._curTime = t;
  },

  now:function()
  {
    return this._curTime;
  }
});

var TimeStamper = Klass.extend({}, [], [timeStamperTrait]);
var globalTimeStamp = TimeStamper.create();


export$({
  TimeStamper: TimeStamper,
  globalTimeStamp: globalTimeStamp
});
};
__modules__["/gprims/linegprim.js"] = function(require, load, export$) {
var colortraits = require("../lib/colortraits")
,   ShapTrait = require("./shaptrait").ShapTrait
,   geo = require("../lib/geometry");


var Klass = colortraits.Klass;
var READONLY = colortraits.READONLY;
var CUSTOM_SETTER = colortraits.CUSTOM_SETTER;

/**
@itrait[LineTrait]{
  @extend[ShapTrait]{}
  @traitGrantMany[ShapTrait type id tag strokeStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineWidth lineCap lineJoin miterLimit lineDash #:trait LineTrait]   
  折线图元的基本功能单元。 
}
**/
/**
@property[vertexes array #:def "[{x: 0, y: 0}, {x: 10, y: 0}]"]{
  @trait[LineTrait]
  点构成的数组。
}
*/
var defaultLine = {vertexes: [{x: 0, y: 0}, {x: 10, y: 0}]};
var LineTrait = ShapTrait.extend({
  __init: function(param)
  {
    this.subTraits(0).__init(param);
    if(param == undefined)
      param = defaultLine;
    this._t.setvertexes((param.vertexes == undefined) ? defaultLine.vertexes : param.vertexes);
    this._t.settype("line");

    this._t.setlength(undefined);
  },
/**
@method[setvertexes]{
  @trait[LineTrait]
  @param[vertexes array]{array of Coordinate, 折线的顶点列表。}
  @return[this]{}
  设置折线的顶点列表。
}
*/
  setvertexes: function(vertexes)
  {
    this._t.cache(),bbox = undefined;
    this._t.setvertexes(vertexes);
    this._t.setlength(undefined);
    return this;
  },
  localBbox: function()
  {
    var pstns = this._t.vertexes();
    var xmin, xmax, ymin, ymax;

    for(var i = 0, length = pstns.length; i< length; i++)
    {
      var pstn = pstns[i];
      if (pstn.x < xmin || xmin == undefined)
        xmin = pstn.x;
      if (pstn.x > xmax || xmax == undefined)
        xmax = pstn.x;

      if (pstn.y < ymin || ymin == undefined)
        ymin = pstn.y;
      if (pstn.y > ymax || ymax == undefined)
        ymax = pstn.y;

    }
/*   arrayForEach(pstns, function(pstn)
                        {
                          if (pstn.x < xmin || xmin == undefined)
                            xmin = pstn.x;
                          if (pstn.x > xmax || xmax == undefined)
                            xmax = pstn.x;

                          if (pstn.y < ymin || ymin == undefined)
                            ymin = pstn.y;
                          if (pstn.y > ymax || ymax == undefined)
                            ymax = pstn.y;
                        }); */ 
    var lineWidth = this._t.lineWidth();
    return new geo.Rect(xmin - lineWidth/2, ymin - lineWidth/2, xmax-xmin + lineWidth, ymax-ymin + lineWidth);
  },
  localInside: function(x, y)
  {
    var lineWidth = this._t.lineWidth();
    var pstns = this._t.vertexes();


    for(var i = 1, length = pstns.length; i < length; i++)
    {
      if(geo.isPointInLine(pstns[i-1], pstns[i], x, y, lineWidth, 0)){
        return true;
      }
    }

    return false;
/*   var ret =arraySome(pstns, function(p, i)
                          {
                            if (i == 0)
                              return false;
                            
                            return geo.isPointInLine(pstns[i-1], pstns[i], x, y, lineWidth, 0);
                          });
    return ret;*/
  },
  localHook: function(cb)
  {
    this.hookMany(this._t, ["strokeFlag", "vertexes", "strokeStyle", "shadowColor", "shadowBlur", "shadowOffsetX", 
                            "shadowOffsetY", "lineWidth", "lineCap", "lineJoin", "miterLimit", "lineDash", "anchorPoint"], cb, "a");
  },
  unlocalHook: function(cb)
  {
    this.unhookMany(this._t, ["strokeFlag", "vertexes", "strokeStyle", "shadowColor", "shadowBlur", "shadowOffsetX", 
                            "shadowOffsetY", "lineWidth", "lineCap", "lineJoin", "miterLimit", "lineDash", "anchorPoint"], cb, "a");  
  },
/**
@method[length]{
  @trait[LineTrait]
  @return[float]{}
  获取折线路径的长度。
}
*/
  length: function()
  {
    var len = this._t.length();
    if(len == undefined){
      len = 0;
      var vertexes = this._t.vertexes();
      for(var i = 0, length = vertexes.length; i < length-1; i++)
      {
        var prev = vertexes[i];
        var nextv = vertexes[i+1];
        len += Math.sqrt((prev.x - nextv.x)*(prev.x - nextv.x) + (prev.y - nextv.y)*(prev.y - nextv.y));
      }
      this._t.setlength(len);
    }

    return len;
  },
/**
@method[pointAtPercent]{
  @trait[LineTrait]
  @param[t float]{0~1,小于等于0, 返回起点; 大于等于1, 返回结束点。}
  @return[point]{}
  Returns the point at the percentage t of the current line. t在 0 到 1 之间.
}
*/
  pointAtPercent: function(t)
  {
    var vertexes = this._t.vertexes();
    if(t <= 0){
      return {x: vertexes[0].x, y: vertexes[0].y};
    }
    var length = vertexes.length;
    if(t >= 1){
      return {x: vertexes[length-1].x, y: vertexes[length-1].y};
    }

    var alllen = this.length();
    var prelen = 0;
    for(var i = 0, length = vertexes.length; i < length-1; i++)
    {
      var prev = vertexes[i];
      var nextv = vertexes[i+1];
      var templen =  Math.sqrt((prev.x - nextv.x)*(prev.x - nextv.x) + (prev.y - nextv.y)*(prev.y - nextv.y));
      prelen += templen;
      if(alllen*t <= prelen){
        var percent = (alllen*t - prelen + templen)/templen;
        return {x: prev.x + percent*(nextv.x - prev.x), y:prev.y + percent*(nextv.y - prev.y)};
      }
    }

  },
/**
@method[percentAtLength]{
  @trait[LineTrait]
  @param[len float]{大于0。大于总长度返回1,小于0返回0。}
  @return[float]{}
  Returns the point at the length  of the current line. len在 0 到 整个长度之间。
}
*/
  percentAtLength: function(len)
  {
    var alllen = this._t.length();
    if(len < 0)
      return 0;
    if(alllen < len)
      return 1;

    return len/alllen;
  }
},
 ["vertexes", "length"].concat(ShapTrait.grantMany(["strokeFlag", "cache", "type", "id", "tag", "strokeStyle", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY",
                      "lineWidth", "lineCap", "lineJoin", "miterLimit", "lineDash", "anchorPoint"])) 
);



/**
@iclass[LineKlass Klass (LineTrait)]{
  折线图元。
  @grant[LineTrait type #:attr 'READONLY]
  @grant[LineTrait vertexes #:attr 'CUSTOM_SETTER]
  @grant[LineTrait lineWidth #:attr 'CUSTOM_SETTER]
  @grantMany[LineTrait strokeStyle shadowColor shadowBlur shadowOffsetX shadowOffsetY lineCap lineJoin miterLimit lineDash id tag]
}
**/
/**
@property[ratioAnchor object #:def {ratiox: 0, ratioy: 0}]{
  @class[LineKlass]
  图元左上角到图元锚点的距离与未经矩阵变换的图元的宽高比组成的对象。
}
*/
/**
@property[anchor object #:def {x: 0, y: 0}]{
  @class[LineKlass]
  图元锚点在local坐标系下的位置。
}
*/
var LineKlass = Klass.extend({
  initialize: function(param)
  {
    this.execProto("initialize");
    this.subTraits(0).__init(param);
  }
},
 [[READONLY("type"), LineTrait.grant("type")], [CUSTOM_SETTER("vertexes"), LineTrait.grant("vertexes")],
  [CUSTOM_SETTER("lineWidth"), LineTrait.grant("lineWidth")], [CUSTOM_SETTER("strokeStyle"), LineTrait.grant("strokeStyle")],
  [CUSTOM_SETTER("shadowColor"), LineTrait.grant("shadowColor")]].concat(
  LineTrait.grantMany(["strokeFlag", "id", "tag", "shadowBlur", "shadowOffsetX", "shadowOffsetY",
                            "lineCap", "lineJoin", "miterLimit", "lineDash"])),
 [LineTrait]);


export$({
  LineKlass : LineKlass,
  LineTrait : LineTrait  
});

};



﻿/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

(function () {
  /*
  返回路径的目录，最后一个/前的字段被认为是目录。
  */
  function dirname(path) 
  {
    var tokens = path.split('/');
    tokens.pop();
    return tokens.join('/');
  }
  /*
  返回路径的文件名，不包含文件后缀。
  */
  function basename(path) 
  {
    var tokens = path.split('/');
    return tokens[tokens.length-1];
  }

  /*
  将两个路径合为一个路径。
  */
  function join() 
  {
    return normalize(Array.prototype.join.call(arguments, "/"));
  }

  function normalizeArray(parts, keepBlanks) 
  {
    var directories = [], prev;
    for (var i = 0, l = parts.length - 1; i <= l; i++) 
    {
      var directory = parts[i];

      // if it's blank, but it's not the first thing, and not the last thing, skip it.
      if (directory === "" && i !== 0 && i !== l && !keepBlanks) continue;

      // if it's a dot, and there was some previous dir already, then skip it.
      if (directory === "." && prev !== undefined) continue;

      // if it starts with "", and is a . or .., then skip it.
      if (directories.length === 1 && directories[0] === "" && (
        directory === "." || directory === "..")) continue;

      if (
        directory === ".."
          && directories.length
          && prev !== ".."
          && prev !== "."
          && prev !== undefined
          && (prev !== "" || keepBlanks)
      ) 
      {
        directories.pop();
        prev = directories.slice(-1)[0]
      } else 
      {
        if (prev === ".") directories.pop();
        directories.push(directory);
        prev = directory;
      }
    }
    return directories;
  }

  function normalize(path, keepBlanks) 
  {
    return normalizeArray(path.split("/"), keepBlanks).join("/");
  }

  function getModuleFunction(modulePath)
  {
    return __modules__[modulePath];
  }

  function resolveModulePath(requirePath, parentPath)
  {
    var filename = requirePath + '.js';

    if(getModuleFunction(filename) !== undefined)
    {
      return filename;
    }

    var parentDir = dirname(parentPath);
    filename = join(parentDir, filename);

    //console.log(filename);
    return filename;
  }

  var requiredModules = {};
  var exports = {};
  var parentPath = "/";

  function require(requirePath, thisObj)
  {
    var modulePath = resolveModulePath(requirePath, parentPath);
    if(requiredModules[modulePath] != null)
      return requiredModules[modulePath];

    var moduleFunction = getModuleFunction(modulePath);
    if(moduleFunction == null)
    {
      throw "Unable to find module: " + modulePath;
    }

    var tmpExports = exports;
    var tmpParentPath = parentPath;
    parentPath = modulePath;
    moduleFunction.apply(thisObj, [require, load, export$]);
    requiredModules[modulePath] = exports
    var returnExports = exports;
    exports = tmpExports;
    parentPath = tmpParentPath;

    return returnExports;
  }

  function load(requirePath, thisObj)
  {
    return require(requirePath, thisObj);
  }

  function export$(exportObj)
  {
    exports = exportObj;
  }

  colorbox = require("./colorbox");
})();
  return colorbox;
}