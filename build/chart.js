/*
Copyright 2012, KISSY UI Library v1.30dev
MIT Licensed
build time: Apr 10 11:07
*/
/*global KISSY */
KISSY.add('chart/axis', function(S, Path) {
    var Event = S.Event,
        LINE = 'line',
        BAR = 'bar';

    /**
     * Axis of Chart
     * @constructor
     * @param {Data} data of Chart.
     * @param {Chart} chart instance of current chart.
     */
    function Axis(data, chart) {
        var self = this,
            label,
            cfgitem;

        self.chart = chart;
        self.type = data.type;
        self.data = data;
        self.axisData = data.axis();
        self.current_x = -1;
        self.initEvent();

        S.each(self.axisData, function(item, label) {
            item.name = item.name ? item.name : false;
        });

        self.initdata();
    }

    S.augment(Axis, S.EventTarget, {
        /**
         * 初始化 Y轴 Label
         */
        initYLabel : function() {
            var self = this,
                data = self.data,
                config = data.config,
                chart = self.chart,
                height = chart.height,
                width = chart.width,
                axisData = self.axisData,
                max = self.data.y_max,
                n = Math.ceil((height - config.paddingBottom - config.paddingTop) / 40),
                g = max / n,
                labels = [];
            for (i = 0; i <= n; i++) {
                labels.push(g * i);
            }
            axisData.y.labels = labels
        },

        /**
         * 初始化数据
         */
        initdata : function(axisData, cfg) {
            this.initYLabel();

            var self = this,
                data = self.data,
                chart = self.chart,
                cwidth = chart.width,
                height = chart.height,
                config = data.config,
                axisData = self.axisData,
                xd = axisData.x,
                yd = axisData.y,
                xl = xd.labels.length,
                yl = yd.labels.length,
                right = cwidth - config.paddingRight,
                left = config.paddingLeft,
                bottom = height - config.paddingBottom,
                top = config.paddingTop,
                ygap = (bottom - top) / (yl - 1),
                width = right - left,
                xgap, pathx,pathleft,pathright,
                lgap = Math.ceil(120 * xl / width);
            //init X Axis
            xd._lpath = {
                x : right * 2 - left,
                y : height - bottom + 20
            };
            xd._path = [];
            xd._area = [];
            xd._showlabel = [];
            for (i = 0; i < xl; i++) {
                if (this.type === LINE) {
                    xgap = width / (xl - 1);
                    pathx = left + i * xgap;
                    pathleft = (i === 0) ? pathx : pathx - xgap / 2;
                    pathright = (i === (xl - 1)) ? pathx : pathx + xgap / 2;
                } else {
                    xgap = width / xl;
                    pathx = left + (i + 0.5) * xgap;
                    pathleft = pathx - xgap / 2;
                    pathright = pathx + xgap / 2;
                }
                xd._showlabel.push(i === 0 || i % lgap === 0);
                xd._path.push({
                    left : pathleft,
                    right : pathright,
                    top : top,
                    bottom : bottom,
                    x : pathx
                });

                xd._area.push(new Path.RectPath(pathleft, top, pathright - pathleft, bottom - top));
            }
            //init Y Axis
            yd._lpath = {
                x: (bottom - top) / 2 + top,
                y : -10
            };
            yd._path = [];
            for (i = 0; i < yl; i++) {
                yd._path.push({
                    y : bottom - ygap * i,
                    left : left,
                    right : right
                });
            }
        },

        /**
         * 初始化事件
         * @private
         */
        initEvent : function() {
            if (this.type === LINE) {
                Event.on(this.chart, "mouse_move", this.chartMouseMove, this);
                Event.on(this.chart, "mouse_leave", this.chartMouseLeave, this);
            }
        },

        /**
         * 解除事件绑定
         */
        destory : function() {
            if (this.type === LINE) {
                Event.remove(this.chart, "mouse_move", this.chartMouseMove);
                Event.remove(this.chart, "mouse_leave", this.chartMouseLeave);
            }
        },
        //事件回调函数
        chartMouseMove : function(ev) {
            var self = this;

            S.each(self.axisData.x._area, function(path, idx) {
                if (idx !== self.current_x && path.inpath(ev.x, ev.y)) {
                    self.current_x = idx;
                    self.fire("xaxishover", {index : idx, x : self.axisData.x._path[idx].x});
                    self.fire("redraw");
                    return false;
                }
            });
        },
        
        chartMouseLeave : function(ev) {
            var self = this;
            self.current_x = -1;
            self.fire("redraw");
            self.fire("leave");
        },

        /**
         * 绘坐标系
         * @param {CanasContext} context of current canvas
         */
        draw : function(ctx) {
            var self = this,
                config = self.data.config,
                axisData = self.data.axis(),
                cfgx = axisData.x,
                cfgy = axisData.y,
                lx = cfgx.labels.length,
                ly = cfgy.labels.length,
                label,
                gridleft,
                width = self.chart.width,
                isline = self.type === LINE,
                isbar = self.type === BAR,
                i,
                iscurrent,
                px,
                py,
                textwidth,
                labelx,
                showlabel;

            ctx.save();
            //draw y axis
            for (i = 0; i < ly; i++) {
                py = cfgy._path[i];
                label = cfgy.labels[i];
                //draw even bg
                if (i % 2 === 1 && i > 0) {
                    ctx.save();
                    ctx.fillStyle = config.axisBackgroundColor;
                    ctx.fillRect(
                        py.left,
                        py.y,
                        py.right - py.left,
                        cfgy._path[i - 1].y - py.y);
                    ctx.restore();
                }
                //draw grid
                if (i !== 0 && i !== ly - 1) {
                    ctx.strokeStyle = config.axisGridColor;
                    ctx.lineWidth = "1.0";
                    ctx.beginPath();
                    ctx.moveTo(py.left, py.y);
                    ctx.lineTo(py.right, py.y);
                    ctx.stroke();
                }
                //draw label
                if (label) {
                    ctx.font = "12px Tohoma";
                    ctx.textAlign = "right";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = config.axisTextColor;
                    ctx.fillText(label, py.left - 5, py.y);
                }
            }
            //draw x axis
            for (i = 0; i < lx; i++) {
                iscurrent = (i === self.current_x);
                px = cfgx._path[i];
                label = cfgx.labels[i];
                showlabel = cfgx._showlabel[i];
                //draw x grid
                ctx.strokeStyle = isline && iscurrent ? "#404040" : config.axisGridColor;
                ctx.lineWidth = isline && iscurrent ? "1.6" : "1.0";
                if (isbar) {
                    if (i !== 0) {
                        ctx.beginPath();
                        ctx.moveTo(px.left, px.bottom);
                        ctx.lineTo(px.left, px.top);
                        ctx.stroke();
                    }
                }
                if (isline) {
                    if (i !== 0 && i !== lx - 1) {
                        ctx.beginPath();
                        ctx.moveTo(px.x, px.bottom);
                        ctx.lineTo(px.x, px.top);
                        ctx.stroke();
                    }
                }
                //draw x label
                if (label && showlabel) {
                    ctx.font = "13px Tahoma";
                    if (isline && i === 0) {
                        ctx.textAlign = "left";
                    } else if (isline && i === lx - 1) {
                        ctx.textAlign = "right";
                    } else {
                        ctx.textAlign = "center";
                    }
                    ctx.textBaseline = "top";
                    ctx.fillStyle = config.axisTextColor;
                    ctx.fillText(label, px.x, px.bottom + 5);
                }
            }

            if (self.current_x !== -1) {
                px = cfgx._path[self.current_x];
                label = cfgx.labels[self.current_x];
                ctx.font = "12px Tahoma";
                textwidth = ctx.measureText(label).width + 6;
                ctx.fillStyle = "#333";
                labelx = Math.max(px.x - textwidth / 2, config.paddingLeft);
                labelx = Math.min(labelx, width - config.paddingRight - textwidth);
                ctx.fillRect(labelx, px.bottom, textwidth, 20);
                ctx.textAlign = "left";
                ctx.fillStyle = "#ffffff";
                ctx.fillText(label, labelx + 2, px.bottom + 5);
            }
            ctx.restore();
            self.drawLabels(ctx);
        },

        /**
         * 绘制坐标轴名称
         * @private
         */
        drawLabels : function(ctx) {
            var self = this,
                data = self.data.axis(),
                config = self.data.config,
                yname = data.y.name,
                xname = data.x.name,
                px = data.x._lpath,
                py = data.y._lpath;

            if (config.hideYAxisName && config.hideXAxisName) {
                return;
            }
            
            ctx.save();
            ctx.font = "10px Arial";
            ctx.fillStyle = "#808080";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            if (!config.hideXAxisName) {
                ctx.fillText('(' + xname + ')', px.x, px.y);
            }
            if (!config.hideYAxisName) {
                ctx.rotate(Math.PI / 2);
                ctx.translate(py.x, py.y);
                ctx.fillText('(' + yname + ')', 0, 0);
            }
            ctx.restore();
            

            
        }
    });
    return Axis;
}, {
    requires : ["chart/path"]
});
KISSY.add("chart/chart", function (S, Util, Data, SimpleTooltip, ChartLine, ChartBar) {

    /**
     * 图表默认配置
     */
    var defaultCfg = {
            'left' : 40,
            'top'  : 40
        },

        chartManger,

        /**
         * Event Mouse leave
         */

        MOUSE_LEAVE = "mouse_leave",

        /**
         * Event Mouse move
         */
        MOUSE_MOVE = "mouse_move";

    /**
     * 图表实例管理器，在这里，对图表间公用的资源进行管理
     * @constructor
     */
    function ChartManager () {
        var self = this;
        self.list = [];
        self.current_index = -1;
        self.init();
    }

    S.augment(ChartManager, S.EventTarget, {
        /**
         * 添加图表实例
         * @param {Chart} chart 新建的图表
         */
        add : function (chart) {
            var self = this,
                index;

            self.list.push(chart);
            index = self.list.length - 1;
            chart
                .on('active', function (ev) {
                    if (self.current_index!== index) {
                        self.fire('focusChange');
                    }
                    self.current_index = index;
                });
        }, 
        /**
         * 从管理器删除图表
         * @param  {Chart} chart 要删除的图表
         * @return {[type]}       [description]
         */
        remove : function (chart) {
            chart.detach('mouseenter');

            S.each(self.list, function (c, index) {
                if (c === index) {
                    self.list[index] = null;
                }
            });
        },

        /**
         * 获取ToolTip 对象
         * @return {SimpleTooltip} 所有图表共享一个Tooltip实例
         */
        getTooltip : function () {
            if (!this.tooltip) {
                this.tooltip = new SimpleTooltip();
            }
            return this.tooltip;
        },


        /**
         * init the manager
         * @return {ChartManager} 链式调用
         */
        init : function () {
            var self = this;
            S.one('body')
                .on('mousemove', self._bodyMouseMove, self);
            return self;
        },

        /**
         * 鼠标move事件处理共享
         * @param  {Event} ev 事件对象
         */
        _bodyMouseMove : function (ev) {
            var self = this,
                chart,
                ox,
                oy;

            if (self.current_index > -1) {
                chart = self.list[self.current_index];
            }

            if (!chart) {
                return
            }
            
            ox = ev.pageX - chart.offset.left;
            oy = ev.pageY - chart.offset.top;

            if (ox > 0 && ox < chart.width && oy > 0 && oy < chart.height) {
                chart.fire(MOUSE_MOVE, 
                    { 
                        x:ox,
                        y:oy
                    }
                );
            } else {
                chart.fire(MOUSE_LEAVE);
            }
        }
     });

    

    /**
     * class Chart
     * @constructor
     * @param {String|Object} canvas HTML   Element
     * @param {String|Object} data of canvas
     */
    function Chart(canvas, data) {
        if (!(this instanceof Chart)) return new Chart(canvas, data);
        var self = this,
            elCanvas = this.elCanvas = S.one(canvas);

        if (!elCanvas) return;

        
        self.width = parseInt(elCanvas.attr('width'), 10),
        self.height = parseInt(elCanvas.attr('height'), 10);

        self.elCanvas = elCanvas;
        self.ctx = -1;
        self.tooltip = chartManager.getTooltip();

        if (data) {
            self.data = data;
            self._initContext();
        }

        chartManager.add(this);
    }

    S.mix(Chart, {
        /**
         * Chart Type Extention
         * @param {Object} cfg chart extention
         */
        addType : function (cfg) {
            S.mix(Chart.types, cfg);
        },

        types : {}
    })

    S.extend(Chart, S.Base, /**@lends Chart.prototype*/ {

        /**
         * render form
         * @param {Object} the chart data
         */
        render : function (data) {
            var self = this;

            if (data) {
                self.data = data;
            }

            // ensure we have got context here
            if (self.ctx == -1) {
                self.data = data;
                self._initContext();
                return;
            }


            //wait... context to init
            if (self.ctx === 0) {
                return;
            }

            //绘图相关属性
            self._drawcfg = S.merge(defaultCfg, data.config, {
                width : self.width,
                height : self.height
            });
            //处理输入数据
            self._data = new Data(data, self._drawcfg);
            // if (!self._data) return;
            data = self._data;

            //初始化
            self.initChart();

            


            // if (data.type === "bar" || data.type === "line") {

            //     //generate the max of Y axis
            //     self._drawcfg.max = data.axis().y.max || Axis.getMax(data.max(), self._drawcfg);

            // }

            self.element = new Chart.types[data.type](data, this, self._drawcfg);//Element.getElement(self._data, self, self._drawcfg);

            self.layers.push(self.element);

            var config = data.config;

            // 设置背景
            var gra = self.ctx.createLinearGradient(0,0,0,self.height);
            self.backgroundFillStyle = null;
            if (config.backgroundStyle && typeof config.backgroundStyle === "object") {
                gra.addColorStop(0, config.backgroundStyle.start);
                gra.addColorStop(1, config.backgroundStyle.end);
                self.backgroundFillStyle = gra;
            }else if (S.isString(config.backgroundStyle)) {
                self.backgroundFillStyle = config.backgroundStyle;
            }

            setTimeout(function () {
                self._redraw();
                self.initEvent();
            }, 100);
        },

        /**
         * init Canvas Context
         * @private
         */
        _initContext : function () {
            var self = this;
            if (typeof self.ctx == 'object') return;
 
            if (self.elCanvas[0].getContext) {
                //flashcanvas初始化需要时间
                setTimeout(function () {
                    self.ctx = self.elCanvas[0].getContext('2d');
                    self._contextReady();
                }, 0);

            } else {
                // wait for  flashCanvas to init canvas
                self.ctx = 0;
                self._count = (typeof self._count == "number") ? self._count - 1 : 30;
                if (self._count >= 0) {
                    setTimeout(function ctx() {
                        self._initContext();
                    }, 50);
                } else {
                    //提示文案：糟了，你的浏览器还不支持我们的图表
                    var text = S.one("<p class='ks-chart-error' >\u7cdf\u4e86\uff0c\u4f60\u7684\u6d4f\u89c8\u5668\u8fd8\u4e0d\u652f\u6301\u6211\u4eec\u7684\u56fe\u8868</p>");
                    text.insertAfter(self.elCanvas);
                }
            }
        },

        

        /**
         * execute when the ctx is ready
         * @private
         */
        _contextReady : function () {
            var self = this;
            if (self.data) {
                self.render(self.data);
           }
        },

        /**
         * show the loading text
         */
        loading : function () {
            //提示文案 载入中
            this.showMessage("\u8F7D\u5165\u4E2D...");
        },

        /**
         * show text
         * @param {String} msg 文案
         */
        showMessage : function (msg) {
            var ctx = this.ctx,
                tx = this.width / 2,
                ty = this.height / 2;
            ctx.clearRect(0, 0, this.width, this.height);
            ctx.save();
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "#808080";
            ctx.fillText(msg, tx, ty);
            ctx.restore();
        },

        /**
         * init the chart for render
         * this will remove all the event
         * @private
         */
        initChart : function () {
            var self = this;
            self.layers = [];
            self._updateOffset();
            self.loading();

            if (self.element) {
                self.element.destory();
                self.element = null;
            }

            if (self._event_inited) {
                self.elCanvas
                    .detach("mouseenter", self._mouseenterHandle)
                    .detach("mouseleave", self._mouseLeaveHandle);

                self.detach();
            }

            self.tooltip.hide();
        },


        /**
         * 初始化图表事件
         */
        initEvent : function () {
            var self = this;

            self._event_inited = true;

            self.elCanvas
                // .on("mousemove", self._mousemoveHandle, self)
                .on("mouseenter", self._mouseenterHandle, self)
                .on("mouseleave", self._mouseLeaveHandle, self);

            self.on(MOUSE_LEAVE, self._drawAreaLeave, self);

            

            self.element
                .on("redraw", self._redraw, self)
                .on("showtooltip", function (ev) {
                    var msg = S.isString(ev.message) ? ev.message : ev.message.innerHTML;
                    self.tooltip.show(msg);
                })
                .on("hidetooltip", function (ev) {
                    self.tooltip.hide();
                });

        },

        /**
         * draw all layers
         * @private
         */
        draw : function () {
            var self = this,
                ctx = self.ctx,
                drawcfg = self._drawcfg;

            //ctx.save();
            //ctx.globalAlpha = k;
            if (self.backgroundFillStyle) {
                ctx.fillStyle = self.backgroundFillStyle;
                ctx.fillRect(0, 0, drawcfg.width, drawcfg.height);
            }else{
                ctx.clearRect(0, 0, drawcfg.width, drawcfg.height);
            }

            S.each(self.layers, function (e, i) {
                e.draw(ctx, drawcfg);
            });
            //ctx.restore();
        },

        /**
         * Get The Draw Context of Canvas
         * @return {CanvasContext} the context Object 
         */
        ctx : function () {
            if (this.ctx) {
                return this.ctx;
            }
            if (this.elCanvas[0].getContext) {
                this.ctx = this.elCanvas.getContext('2d');
                return this.ctx;
            }else{
                return null;
            }
        },
        /**
         * redraw the layers
         * @private
         */
        _redraw : function () {
            this._redrawmark = true;
            if (!this._running) {
                this._run();
            }
        },
        /**
         * run the Timer
         * @private
         */
        _run : function () {
            var self = this;
            clearTimeout(self._timeoutid);
            self._running = true;
            self._redrawmark = false;
            self._timeoutid = setTimeout(function go() {
                self.draw();
                if (self._redrawmark) {
                    self._run();
                } else {
                    self._running = false;
                }
            }, 1000 / 24);
        },
        
        /**
         * event handler
         * @private
         */
        _drawAreaLeave : function (ev) {
            this.tooltip.hide();
        },

        /**
         * event handle
         * @private
         */
        _mouseenterHandle : function (e) {
            var self = this;
            this._updateOffset();
            self.fire('active')
            
        },

        /**
         * get canvas offset
         * @private
         * @return {Object} offset of canvas element
         */
        _updateOffset : function () {
            this.offset = this.elCanvas.offset();
            return this.offset;
        },
        /**
         * event handler
         * @private
         */
        _mouseLeaveHandle : function (ev) {
            var self = this,
                tooltip = self.tooltip;

            self.fire(MOUSE_LEAVE);

        }
    });

    Chart.addType(ChartLine);
    Chart.addType(ChartBar);
    /*export*/
    chartManager = window.chartManager = new ChartManager();
    S.Chart = Chart;
    return Chart;

}, {
    requires:[
        'chart/util',
        'chart/data',
        'chart/simpletooltip',
        'chart/chart_line',
        'chart/chart_bar'
    ]
});
KISSY.add('chart/chart_bar', function (S, Util, Path, Axis, Frame) {
    var MOUSE_LEAVE = "mouse_leave",
        MOUSE_MOVE = "mouse_move";

    function darker(c) {
        var hsl = c.hslData(),
            l = hsl[2],
            s = hsl[1],
            b  = (l + s/2) * 0.6,
        l = b - s/2;
        return new Util.Color.hsl(hsl[0],s,l);
    }

    /**
     * class ChartBar for Bar Chart
     */
    function ChartBar(data, chart, drawcfg) {
        var self = this;
        self.data = data;
        self.chart = chart;
        self.drawcfg = drawcfg;
        self.config = data.config;

        self.initData(drawcfg);
        

        self.current = [-1,-1];
        self.anim = new Util.Anim(self.config.animationDuration,self.config.animationEasing)//,1,"bounceOut");
        self.axis = new Axis(data, chart);
        self.frame = new Frame(chart, data);
        self.anim.init();
        self.initEvent();
    }

    S.augment(ChartBar, S.EventTarget, {

        initData : function () {
            var self          = this,
                chart         = self.chart,
                width         = chart.width,
                height        = chart.height,
                data          = self.data,
                config        = data.config,
                elemLength    = data.elements().length,
                maxlength     = data.maxElementLength(),
                paddingRight  = config.paddingRight,
                paddingLeft   = config.paddingLeft,
                paddingTop    = config.paddingTop,
                paddingBottom = config.paddingBottom,
                right         = width - paddingRight,
                left          = paddingLeft,
                bottom        = height - paddingBottom,
                itemwidth     = (right - left) / maxlength,
                gap           = itemwidth / 5 / elemLength,//gap between bars
                padding       = itemwidth / 3 / elemLength,
                barwidth      = (itemwidth - (elemLength - 1) * gap - 2 * padding) / elemLength,
                items         = [],
                barheight,
                barleft,
                bartop,
                color;

            self.maxLength = maxlength;

            self.items = items;
            self.data.eachElement(function (elem,idx,idx2) {
                if (idx2 === -1) idx2 = 0;

                if (!items[idx]) {
                    items[idx] = {
                        _x : [],
                        _top  :  [],
                        _left  :  [],
                        _path  :  [],
                        _width  :  [],
                        _height  :  [],
                        _colors : [],
                        _dcolors : [],
                        _labels : []
                    }
                }

                var element = items[idx];

                barheight = (bottom - paddingTop) * elem.data / data.y_max;
                barleft = left + idx2 * itemwidth + padding + idx * (barwidth + gap);
                bartop = bottom - barheight;

                color = Util.Color(self.data.getColor(idx,"bar"));
                colord = darker(color);

                element._left[idx2] = barleft;
                element._top[idx2] = bartop;
                element._width[idx2] = barwidth;
                element._height[idx2] = barheight;
                element._path[idx2] = new Path.RectPath(barleft,bartop,barwidth,barheight);
                element._x[idx2] = barleft+barwidth/2;
                element._colors[idx2] = color;
                element._dcolors[idx2] = colord;
                element._labels[idx2] = elem.label;
            });

        },

        /**
         * draw the barElement
         * @param {Object} Canvas Object
         */
        draw : function (ctx) {
            var self = this,
                items = self.items,
                data = self.data,
                config = data.config,
                ml = self.maxLength,
                color,
                gradiet,
                colord,
                chsl,
                barheight,
                cheight,
                barleft,
                bartop,
                k = self.anim.get(),
                i;

            self.axis.draw(ctx);
            self.frame.draw(ctx);

            if (self.data.config.showLabels) {
                self.drawNames(ctx);
            }

            S.each(items, function (bar, idx) {
                for(i = 0; i< ml; i++) {
                    barleft = bar._left[i];
                    barheight = bar._height[i];
                    cheight = barheight * k;
                    bartop = bar._top[i] + barheight - cheight;
                    barwidth = bar._width[i];
                    color =    bar._colors[i];
                    dcolor =    bar._dcolors[i];

                    //draw backgraound
                    gradiet = ctx.createLinearGradient(barleft,bartop,barleft,bartop + cheight);
                    gradiet.addColorStop(0,color.css());
                    gradiet.addColorStop(1,dcolor.css());

                    ctx.fillStyle = gradiet;
                    //ctx.fillStyle = color;
                    ctx.fillRect(barleft,bartop,barwidth,cheight);
                    //draw label on the bar
                    if (ml === 1 && barheight > 25) {
                        ctx.save();
                        ctx.fillStyle = "#fff";
                        ctx.font = "20px bold Arial";
                        ctx.textBaseline = "top";
                        ctx.textAlign = "center";
                        element = self.data.elements()[idx];
                        ctx.fillText(Util.numberFormat(element.data, element.format), bar._x[i], bartop + 2);
                        ctx.restore();
                    }
                }

            });

            if (k < 1) {
                self.fire("redraw");
            }
        },

        initEvent : function () {
            var self = this;
            self.chart.on(MOUSE_MOVE, self.chartMouseMove,self);
            self.chart.on(MOUSE_LEAVE, self.chartMouseLeave,self);
        },

        destory : function () {
            var self = this;
            self.chart.detach(MOUSE_MOVE, self.chartMouseMove);
            self.chart.detach(MOUSE_LEAVE, self.chartMouseLeave);
        },

        chartMouseMove : function (ev) {
            var self = this,
                current = [-1,-1],
                items = self.items;

            S.each(self.items, function (bar,idx) {
                S.each(bar._path, function (path,index) {
                    if (path.inpath(ev.x,ev.y)) {
                        current = [idx,index];
                    }
                });
            });

            if ( current[0] === self.current[0] && current[1] === self.current[1]) {
                return;
            }

            self.current = current;

            if (current[0] + current[1] >= 0) {
                self.fire("barhover",{index:current});
                self.fire("showtooltip",{
                    top : items[current[0]]._top[current[1]],
                    left : items[current[0]]._x[current[1]],
                    message : self.getTooltip(current)
                });
            }else{
                self.fire("hidetooltip");
            }
        },

        chartMouseLeave : function () {
            this.current = [-1,-1];
        },
        /**
         * get tip HTML by id
         * @return {String}
         **/
        getTooltip : function (index) {
            var self = this,
                eidx = index[0],
                didx = index[1],
                item = self.items[eidx],
                msg = "<div class='bartip'>"+
                    "<span style='color:"+item._colors[didx].css()+";'>"+
                    item._labels[didx]+"</span></div>";
            return msg;
        },
        

        drawNames : function (ctx) {

            var self = this,
                chart = self.chart,
                width = chart.width,
                height = chart.height,
                data   = self.data,
                elements = self.data.elements(),
                config = data.config,
                l = elements.length,
                i = l - 1,
                br = width - config.paddingRight,
                by = config.paddingTop - 12,
                d,
                c;
            for(;  i>=0;  i--) {
                d = elements[i];
                if (d.notdraw) {
                    continue;
                }
                c = data.getColor(i);
                //draw text
                ctx.save();
                ctx.textAlign = "end";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#808080";
                ctx.font = "12px Arial";
                ctx.fillText(d.name, br, by);
                br -= ctx.measureText(d.name).width + 10;
                ctx.restore();
                //draw color dot
                ctx.save();
                ctx.beginPath();
                ctx.fillStyle = c;
                ctx.arc(br,by,5,0,Math.PI*2,true);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                br -= 10;
            }
        }
    });

    return {
        'bar' : ChartBar
    };
},{
    requires : ["chart/util", "chart/path", "chart/axis", "chart/frame"]
});
KISSY.add('chart/chart_line', function(S, Util, Axis, Frame) {
    /**
     * class Element for Line chart
     */
    function LineElement(data, chart, drawcfg) {
        var self = this;
        self.chart = chart;
        self.data = data;
        self.elements = data.elements();
        self._current = -1;
        self.config = data.config;
        self.drawcfg = drawcfg;
        self.initdata(drawcfg);
        self._ready_idx = -1;

        self.anim = new Util.Anim(
            self.config.animationDuration,
            self.config.animationEasing
        );
        self.axis = new Axis(data, chart, drawcfg);
        self.frame = new Frame(chart, data);
        self.anim.init();
        self.init();

    }

    S.augment(LineElement, S.EventTarget, {
        /**
         * 根据数据源，生成图形数据
         */
        initdata: function() {
            var self = this,
                data = self.data,
                chart = self.chart,
                width = chart.width,
                height = chart.height,
                config = data.config,
                elements = self.elements,
                ml = data.maxElementLength(),
                left = config.paddingLeft,
                max = data.y_max,
                bottom = height - config.paddingBottom,
                height = bottom - config.paddingTop,
                width = width - config.paddingRight - left,
                gap = width / (ml - 1),
                maxtop,
                i,
                j;

            var items = [];
            self.items = items;

            data.eachElement(function(elem, idx, idx2) {
                if (!items[idx]) {
                    items[idx] = {
                        _points: [],
                        _labels: [],
                        _color: data.getColor(idx),
                        _maxtop: bottom,
                        _drawbg: idx === config.drawbg,
                        _notdraw : elem.notdraw
                    };
                }
                var element = items[idx];
                ptop = Math.max(
                    bottom - elem.data / max * height,
                    config.paddingTop - 5
                );
                element._maxtop = Math.min(element._maxtop, ptop);
                element._labels[idx2] = elem.label;
                element._points[idx2] = {
                    x: left + gap * idx2,
                    y: ptop,
                    nodata: elem.data === null,
                    bottom: bottom
                };

            });

        },

        draw: function(ctx, cfg) {

            var self = this,
                data = self.data,
                config = data.config,
                left = config.paddingLeft,
                right = cfg.width - config.paddingRight,
                top = config.paddingTop,
                bottom = cfg.height - config.paddingBottom,
                height = bottom - top,
                max = data.y_max,
                color,
                ptop,
                points,
                i,
                l,
                t,
                k = self.anim.get(), gradiet;

            self.axis.draw(ctx, cfg);
            self.frame.draw(ctx, cfg);
            if (data.config.showLabels) {
                self.drawNames(ctx, cfg);
            }

            // the animation
            if (k >= 1 && this._ready_idx < self.items.length - 1) {
                self._ready_idx++;
                self.anim.init();
                k = self.anim.get();
            }

            if (this._ready_idx !== data.elements().length - 1 || k !== 1) {
                this.fire('redraw');
            }

            S.each(self.items, function(linecfg, idx) {
                var p;
                if (linecfg._notdraw) {
                    return;
                }
                if (idx !== self._ready_idx) {
                    t = (idx > self._ready_idx) ? 0 : 1;
                } else {
                    t = k;
                }

                color = linecfg._color;
                points = linecfg._points;

                //draw bg
                if (linecfg._drawbg) {
                    ctx.save();
                    ctx.globalAlpha = 0.4;
                    maxtop = bottom - (bottom - linecfg._maxtop) * t;

                    gradiet = ctx.createLinearGradient(left, maxtop, left, bottom);
                    gradiet.addColorStop(0, color);
                    gradiet.addColorStop(1, 'rgb(255,255,255)');

                    ctx.fillStyle = gradiet;
                    ctx.beginPath();
                    ctx.moveTo(left, bottom);

                    for (i = 0; i < points.length; i++) {
                        p = points[i];
                        ptop = bottom - (bottom - p.y) * t;
                        ctx.lineTo(p.x, ptop);
                    }

                    ctx.lineTo(right, bottom);
                    ctx.stroke();
                    ctx.fill();
                    ctx.restore();
                }

                //draw line
                ctx.save();
                l = points.length;
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (i = 0; i < l; i++) {
                    p = points[i];
                    if (p.nodata) continue;
                    ptop = bottom - (bottom - p.y) * t;
                    if (i === 0) {
                        ctx.moveTo(p.x, ptop);
                    } else {
                        ctx.lineTo(p.x, ptop);
                    }
                }
                ctx.stroke();
                ctx.restore();

                //draw point
                ctx.save();
                for (i = 0; i < l; i++) {
                    p = points[i];
                    if (p.nodata) continue;
                    ptop = bottom - (bottom - p.y) * t;
                    //circle outter
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(p.x, ptop, 5, 0, Math.PI * 2, true);
                    ctx.closePath();
                    ctx.fill();
                    //circle innner
                    if (i !== self._current) {
                        ctx.fillStyle = '#fff';
                        ctx.beginPath();
                        ctx.arc(p.x, ptop, 3, 0, Math.PI * 2, true);
                        ctx.closePath();
                        ctx.fill();
                    }
                }
                ctx.restore();
            });
        },

        init: function() {
            var self = this;
            self._ready_idx = 0;

            self.axis
                .on('xaxishover', self._axis_hover, self)
                .on('leave', self._axis_leave, self)
                .on('redraw', self._redraw, self);
        },

        destory: function() {
            var self = this;
            self.axis
                .detach('xaxishover', self._axis_hover)
                .detach('leave', self._axis_leave)
                .detach('redraw', self._redraw);
        },

        _redraw: function() {
            this.fire('redraw');
        },

        _axis_hover: function(e) {
            var idx = e.index;
            if (this._current !== idx) {
                this._current = idx;
                this.fire('redraw');
                this.fire('showtooltip', {
                    message: this.getTooltip(idx)
                });
            }
        },

        _axis_leave: function(e) {
            this._current = -1;
            this.fire('redraw');
        },
        /**
         * get tip HTML by id
         * @param {Number} index of data.
         * @return {String} html of the tips.
         **/
        getTooltip: function(index) {
            var self = this, ul, li;
            ul = '<ul>';

            S.each(self.items, function(item, idx) {
                if (item._points[index].nodata) {
                    return;
                }
                li = '<li><p style="color:' + item._color + '">' +
                        item._labels[index] +
                    '</p></li>';
                ul += li;
            });
            ul += '</ul>';
            return ul;
        },

        drawNames: function(ctx) {
            var self = this,
                width = self.chart.width,
                data = self.data,
                config = data.config,
                elements = data.elements(),
                l = elements.length,
                i = l - 1,
                br = width - config.paddingRight,
                by = config.paddingTop - 12,
                d,
                color;
            for (; i >= 0; i--) {
                d = elements[i];

                if (d.notdraw) {
                    continue;
                }

                color = self.data.getColor(i);
                //draw text
                ctx.save();
                ctx.textAlign = 'end';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#808080';
                ctx.font = '12px Arial';

                ctx.fillText(d.name, br, by);

                br -= ctx.measureText(d.name).width + 10;
                ctx.restore();
                //draw color dot
                ctx.save();
                ctx.beginPath();
                ctx.fillStyle = color;
                ctx.arc(br, by, 5, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                br -= 10;
            }
        }

    });

    return {
        'line' : LineElement
    };
},
{
    requires: ['chart/util', 'chart/axis', 'chart/frame']
});
KISSY.add('chart/data', function(S, Util){
    /**
     * 图表默认配置
     */
    var defaultConfig= {
        //上边距
        paddingTop: 30,
        //左边距
        paddingLeft : 40,
        //右边距
        paddingRight : 20,
        //底边距
        paddingBottom : 20,
        //是否显示标签
        showLabels : true,
        //颜色配置
        colors : [],
        //动画间隔
        animationDuration : .5,
        //动画Easing函数
        animationEasing : "easeInStrong",
        // 不显示Y座标名称
        hideYAxisName : false,

        // 不显示X座标名称
        hideXAxisName : true,
        //背景色 或 背景渐变
        /*
        {
            start : "#222",
            end : "#666"
        }
        */
        backgroundStyle : false,
        //坐标字体颜色
        axisTextColor : "#999",
        //坐标间隔背景颜色
        axisBackgroundColor : "rgba(238, 238, 238, 0.4)",
        //坐标线框颜色
        axisGridColor : "#e4e4e4",
        //Number Format
        //针对特定数据设置numberFormat可以用
        //numberFormats : ['0.00','0.000']
        //null 表示不做format处理
        //默认为 null
        numberFormat : null,
        //边框颜色
        frameColor : "#d7d7d7"
    };

    /**
     * 特定图标配置
     */
    var specificConfig = {
        'line' : {
            //是否在折线下绘制渐变背景
            //值为要绘制背景的折线index
            drawbg : -1
        },
        'bar' : { },
        'pie' : {
            //pie 默认动画时间
            animationDuration : 1.8,
            //pie 的默认动画效果
            animationEasing : "bounceOut",
            paddingTop : 10,
            paddingBottom : 10,
            paddingLeft : 10,
            paddingRight : 10,
            drawShadow : true,
            shadow : {
                blur : 3,
                color : '#000'
            },
            labelTemplate : "{name} {pecent}%", //{name} {data} {pecent}
            firstPieOut : false // 第一块飞出
        }
    };


    /**
     * 图表数据
     * 处理图表输入数据
     * @constructor
     * @param {Object} 输入的图表JSON数据
     */
    function Data(data, drawcfg) {
        if (!data || !data.type) return;
        if (!this instanceof Data)
            return new Data(data);
        var self = this,
            cfg = data.config;

        self.origin = data;
        data = S.clone(data);
        self.type = data.type.toLowerCase();
        //self._design = data.design;

        self.config = cfg = S.merge(defaultConfig, specificConfig[self.type], cfg);
        /**
         * 配置兼容
         */
        S.each({
            'left'  : 'paddingLeft',
            'top'   : 'paddingTop',
            'bottom': 'paddingBottom',
            'right' : 'paddingRight'
        }, function (item, key) {
            if (key in cfg && S.isNumber(cfg[key])) {
                cfg[item] = cfg[key];
            }
        });

        self._elements = self._expandElement(self._initElement(data));
        self._initElementItem();
        self._axis = data.axis;
        self.y_max = self.getMax(self.max(), drawcfg);
    }

    S.augment(Data, /**@lends Data.protoptype*/{
        /**
         * get the AxisData
         */
        axis : function () {
            return this._axis;
        },

        /**
         * get the Element Data
         */
        elements : function () {
            return this._elements;
        },

        /**
         * get the the max length of each Element
         */
        maxElementLength: function () {
            var ml = 0;
            S.each(this._elements, function (elem,idx) {
                if (S.isArray(elem.items)) {
                    ml = Math.max(ml, elem.items.length);
                } else {
                    ml = Math.max(ml,1)
                }
            });
            return ml;
        },


        /**
         * Get the color for the Element
         * from the user config or the default
         * color
         * @param {Number} the index of the element
         * @param {String} type of Chart
         */
        getColor : function (idx,type) {
            var length = this._elements.length;
            var usercolor = this.config.colors
            if (S.isArray(usercolor) && usercolor[idx]) {
                return usercolor[idx];
            }

            //getColor frome user defined function
            if (S.isFunction (usercolor)) {
                return usercolor(idx);
            }

            //get color from default Color getter
            return this.getDefaultColor(idx,length,type);
        },

        /**
         * return the sum of all Data
         */
        sum: function () {
            var d = 0;
            this.eachElement(function (item) {
                d += item.data;
            });
            return d;
        },

        /**
         * Get the Biggest Data from element
         */
        max : function () {
            return this._max;
        },

        getMax : function(max, cfg) {
            var config = this.config,
                h = cfg.height - config.paddingBottom - config.paddingTop,
                n = Math.ceil(h / 40),
                g = max / n,
                i;

            if (g <= 1) {
                g = 1;
            } else if (g > 1 && g <= 5) {
                g = Math.ceil(g);
            } else if (g > 5 && g <= 10) {
                g = 10;
            } else {
                i = 1;
                do{
                    i *= 10;
                    g = g / 10;
                } while (g > 10)
                g = Math.ceil(g) * i;
            }
            return g * n;
        },

        /**
         * get the default color depending on idx and length, and types of chart 
         * @param {Number} index of element
         * @param {Number} length of element
         */
        getDefaultColor : function (idx, length) {
            //在色相环上取色
            var colorgap = 1/3,
                //h = Math.floor(idx/3)/length + 1/(idx%3 + 1)*colorgap,
                h = colorgap * idx, //h of color hsl
                s = .7, // s of color hsl
                b = 1,//b of  color hsb
                l = b - s*.5, //l of color hsl
                i, j, k;

            if(idx < 3){
                h = colorgap * idx + 0.05;
            }else{
                //防止最后一个颜色落在第3区间
                if(length % 3 == 0){
                    if(idx === length -1){
                        idx = length - 2;
                    }else
                    if(idx === length - 2){
                        idx = length - 1;
                    }
                }
                i = idx % 3;
                j = Math.ceil(length/3);
                k = Math.ceil((idx + 1)/3);
                h = i*colorgap + colorgap/j * (k-1);
            }
            return Util.Color.hsl(h,s,l).hexTriplet();
        },


        /**
         * execuse fn on each Element item
         */
        eachElement : function (fn) {
            var self = this;

            S.each(self._elements, function (item,idx) {
                if (item.items) {
                    S.each(item.items, function (i, idx2) {
                        fn(i,idx,idx2);
                    });
                } else {
                    fn(item, idx, -1);
                }
            });
        },


        /**
         * normalize Input Element
         * @private
         * @param {Object} input data
         */
        _initElement : function (data) {
            var elements = null,
                elem,
                self = this,
                newelem;

            //数组形式
            if (data.elements && S.isArray(data.elements)) {
                elements = S.clone(data.elements);
            }

            //对象形式
            if (!data.elements && data.element && S.isArray(data.element.names)) {
                elements = [];
                elem = data.element;
                S.each(elem.names, function　(name,　idx) {
                    elements.push({
                        name   : name,
                        data   : S.isArray(elem.datas) ? elem.datas[idx] : null,
                        label  : S.isArray(elem.labels) ? elem.labels[idx] : elem.label
                    });
                });
            }

            return elements;
        },
        /**
         * expand the sub element
         * @param {Object} the Element Object
         * @private
         */
        _expandElement : function (data) {
            var datas,
                self = this;
            S.each(data, function (element, idx) {

                if (S.isArray(element.datas)) {

                    element.items = [];

                    S.each(element.datas, function (d, index) {
                        var itemdata = {
                            name : element.name,
                            data : d
                        };


                        itemdata.label = S.isArray(element.labels) ? 
                            element.labels[index] : element.label;

                        element.items.push(itemdata);
                    });
                }

            });
            return data;
        },


        /**
         * Init the Element Item
         * parse the label
         */
        _initElementItem: function () {
            var self = this;

            self._max = 0;

            self.eachElement(function (elem, idx, idx2) {
                var label;

                //统计最大值
                if (idx === 0 && (!idx2)) self._max = elem.data || 0;
                elem.data = S.isNumber(elem.data) ? elem.data : null ;
                self._max = Math.max(self._max, elem.data);

                

                //数字的格式
                if (S.isArray(self.config.numberFormat) ) {
                    elem.format = self.config.numberFormat[idx];
                } else if (S.isString(self.config.numberFormat)) {
                    elem.format = self.config.numberFormat;
                }

                if (typeof elem.format == 'undefined' ) {
                    elem.format = self.config.numberFormat;
                }

                label = (typeof elem.label === 'undefined') ? null : elem.label;

                elem.label = S.substitute(
                    label, {
                        name : elem.name,
                        data : elem.format && typeof elem.data === 'number' ? Util.numberFormat(elem.data, elem.format) : elem.data
                    }
                );

                elem.notdraw = self._elements[idx].notdraw;

            });
        }
    });

    return Data;

}, {
    requires : ["chart/util"]
});KISSY.add("chart/frame",function(S, Path){

    /**
     * The Border Layer
     */
    function Frame(chart, data){
        var self = this,
            config = data.config,
            width = chart.width,
            height = chart.height;

        this.data = data;

        this.path = new Path.RectPath(
                        config.paddingLeft,
                        config.paddingTop,
                        width - config.paddingRight - config.paddingLeft,
                        height - config.paddingBottom - config.paddingTop
                    );
    }

    S.augment(Frame,{
        draw : function(ctx){
            ctx.save();
            ctx.strokeStyle = this.data.config.frameColor;
            ctx.lineWidth = 2.0;
            this.path.draw(ctx);
            ctx.stroke();
            ctx.restore();
        }
    });

    return Frame;
}, {
    requires : ['chart/path']
});
KISSY.add('chart', function (ev, Chart) {
    return Chart;
}, {
    requires : ['chart/chart']
});
KISSY.add('chart/path',function(S){
    var ie = S.UA.ie;

    function Path(x,y,w,h){ }
    S.augment(Path,{
        /**
         * get the path draw
         */
        draw : function(ctx){ },
        /**
         * get the path draw
         */
        inpath : function(ox,oy,ctx){ }
    });

    function RectPath(x,y,w,h){
        this.rect = {x:x,y:y,w:w,h:h};
    }

    S.extend(RectPath, Path, {
        draw : function(ctx){
            var r = this.rect;
            ctx.beginPath();
            ctx.rect(r.x,r.y,r.w,r.h);
        },
        inpath : function(ox,oy,ctx){
            var r = this.rect,
                left = r.x,
                top = r.y,
                right = left + r.w,
                bottom = top + r.h,
                detect = ox > left && ox < right && oy > top && oy < bottom;
            return detect;
        }
    });

    function ArcPath(x,y,r,b,e,a){
        this._arc= {x:x,y:y,r:r,b:b,e:e,a:a};
    }
    S.extend(ArcPath, Path, {
        draw : function(ctx){
            var r = this._arc;
            ctx.beginPath();
            ctx.moveTo(r,x,r.y);
            ctx.arc(r.x,r.y,r.r,r.b,r.e,r.a);
            ctx.closePath();
        },
        /**
         * detect if point(ox,oy) in path
         */
        inpath : function(ox,oy,ctx){
            if(ctx){
                this.draw(ctx);
                return ctx.isPointInPath(ox,oy);
            }
            var r = this._arc,
                dx = ox - r.x,
                dy = ox - r.y,
                incircle = (Math.pow(dx, 2) + Math.pow(dy, 2))<= Math.pow(r.r, 2),
                detect;
            if(!incircle) {
                return false;
            }
            if(dx === 0){
                if(dy === 0){
                    return false;
                }else{
                    da = dy>0?Math.PI/2:Math.PI*1.5;
                }
            }else{
                //TODO
            }

            return detect;
        }
    });

    return {
        Path : Path,
        RectPath : RectPath,
        ArcPath : ArcPath
    };
});
KISSY.add('chart/simpletooltip', function(S){

    /**
     * 工具提示，总是跟随鼠标
     */
    function SimpleTooltip(){
        var self = this;
        self.n_c = S.all("<div class='ks-chart-tooltip'>");
        self._offset = {left:0,top:0}
        self.hide();

        S.ready(function(){
            S.one('body')
                .append(self.n_c)
                .on("mousemove", self._mousemove, self);
        });

    }

    S.augment(SimpleTooltip,{
        _mousemove : function(ev){
            var self = this,
                ttx = ev.pageX,
                tty = ev.pageY;
            if(self._show){
                self._updateOffset(ttx, tty);
            }else{
                //save the position
                self._offset.left = ttx;
                self._offset.top = tty;
            }
        },

        _updateOffset : function(x,y){
            var Dom = S.DOM;

            if(x > Dom.scrollLeft() + Dom.viewportWidth() - 100){
                x -= this.n_c.width() + 6;
            }
            if(y > Dom.scrollTop() + Dom.viewportHeight() - 100){
                y -= this.n_c.height() + 20;
            }
            this.n_c.offset({left:x, top:y+12});
        },
        /**
         * show the tooltip
         * @param {String} the message to show
         */
        show : function(msg){
            // console.log('show')
            var self = this;
            self._show = true;

            self.n_c
                .html(msg)
                .css("display","block")

        },
        /**
         * hide the tooltip
         */
        hide : function(){
            // console.log('hide')
            var self = this;
            self._show = false;
            self.n_c.css("display","none");
        },

        _init : function(){}
    });

    return SimpleTooltip;
});



/*! @source http://purl.eligrey.com/github/color.js/blob/master/color.js*/
KISSY.add('chart/util', function(S) {
    /*
     * color.js
     * Version 0.2.1.2
     *
     * 2009-09-12
     * 
     * By Eli Grey, http://eligrey.com
     * Licensed under the X11/MIT License
     *   See LICENSE.md
     */
    var Color = (function () {
        var str = "string",
            Color = function Color(r, g, b, a) {
                var
                    color = this,
                    args = arguments.length,
                    parseHex = function (h) {
                        return parseInt(h, 16);
                    };

                if (args < 3) { // called as Color(color [, alpha])
                    if (typeof r === str) {
                        r = r.substr(r.indexOf("#") + 1);
                        var threeDigits = r.length === 3;
                        r = parseHex(r);
                        threeDigits &&
                        (r = (((r & 0xF00) * 0x1100) | ((r & 0xF0) * 0x110) | ((r & 0xF) * 0x11)));
                    }

                    args === 2 && // alpha specifed
                    (a = g);

                    g = (r & 0xFF00) / 0x100;
                    b = r & 0xFF;
                    r = r >>> 0x10;
                }

                if (!(color instanceof Color)) {
                    return new Color(r, g, b, a);
                }

                this.channels = [
                    typeof r === str && parseHex(r) || r,
                    typeof g === str && parseHex(g) || g,
                    typeof b === str && parseHex(b) || b,
                    (typeof a !== str && typeof a !== "number") && 1 ||
                        typeof a === str && parseFloat(a) || a
                ];
            },
            proto = Color.prototype,
            undef = "undefined",
            lowerCase = "toLowerCase",
            math = Math,
            colorDict;

        // RGB to HSL and HSL to RGB code from
        // http://www.mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript

        Color.RGBtoHSL = function (rgb) {
            // in JS 1.7 use: var [r, g, b] = rgb;
            var r = rgb[0],
                g = rgb[1],
                b = rgb[2];

            r /= 255;
            g /= 255;
            b /= 255;

            var max = math.max(r, g, b),
                min = math.min(r, g, b),
                h, s, l = (max + min) / 2;

            if (max === min) {
                h = s = 0; // achromatic
            } else {
                var d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }

            return [h, s, l];

        };

        Color.HSLtoRGB = function (hsl) {
            // in JS 1.7 use: var [h, s, l] = hsl;
            var h = hsl[0],
                s = hsl[1],
                l = hsl[2],

                r, g, b,

                hue2rgb = function (p, q, t) {
                    if (t < 0) {
                        t += 1;
                    }
                    if (t > 1) {
                        t -= 1;
                    }
                    if (t < 1 / 6) {
                        return p + (q - p) * 6 * t;
                    }
                    if (t < 1 / 2) {
                        return q;
                    }
                    if (t < 2 / 3) {
                        return p + (q - p) * (2 / 3 - t) * 6;
                    }
                    return p;
                };

            if (s === 0) {
                r = g = b = l; // achromatic
            } else {
                var
                    q = l < 0.5 ? l * (1 + s) : l + s - l * s,
                    p = 2 * l - q;
                r = hue2rgb(p, q, h + 1 / 3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1 / 3);
            }

            return [r * 0xFF, g * 0xFF, b * 0xFF];
        };

        Color.rgb = function (r, g, b, a) {
            return new Color(r, g, b, typeof a !== undef ? a : 1);
        };

        Color.hsl = function (h, s, l, a) {
            var rgb = Color.HSLtoRGB([h, s, l]),
                ceil = math.ceil;
            return new Color(ceil(rgb[0]), ceil(rgb[1]), ceil(rgb[2]), typeof a !== undef ? a : 1);
        };

        Color.TO_STRING_METHOD = "hexTriplet"; // default toString method used

        Color.parse = function (color) {
            color = color.replace(/^\s+/g, "") // trim leading whitespace
                [lowerCase]();

            if (color[0] === "#") {
                return new Color(color);
            }

            var cssFn = color.substr(0, 3), i;

            color = color.replace(/[^\d,.]/g, "").split(",");
            i = color.length;

            while (i--) {
                color[i] = color[i] && parseFloat(color[i]) || 0;
            }

            switch (cssFn) {
                case "rgb": // handle rgb[a](red, green, blue [, alpha])
                    return Color.rgb.apply(Color, color); // no need to break;
                case "hsl": // handle hsl[a](hue, saturation, lightness [, alpha])
                    color[0] /= 360;
                    color[1] /= 100;
                    color[2] /= 100;
                    return Color.hsl.apply(Color, color);
            }

            return null;
        };

        (Color.clearColors = function () {
            colorDict = {
                transparent: [0, 0, 0, 0]
            };
        })();

        Color.define = function (color, rgb) {
            colorDict[color[lowerCase]()] = rgb;
        };

        Color.get = function (color) {
            color = color[lowerCase]();

            if (Object.prototype.hasOwnProperty.call(colorDict, color)) {
                return Color.apply(null, [].concat(colorDict[color]));
            }

            return null;
        };

        Color.del = function (color) {
            return delete colorDict[color[lowerCase]()];
        };

        Color.random = function (rangeStart, rangeEnd) {
            typeof rangeStart === str &&
                (rangeStart = Color.get(rangeStart)) &&
            (rangeStart = rangeStart.getValue());
            typeof rangeEnd === str &&
                (rangeEnd = Color.get(rangeEnd)) &&
            (rangeEnd = rangeEnd.getValue());

            var floor = math.floor,
                random = math.random;

            rangeEnd = (rangeEnd || 0xFFFFFF) + 1;
            if (!isNaN(rangeStart)) {
                return new Color(floor((random() * (rangeEnd - rangeStart)) + rangeStart));
            }
            // random color from #000000 to #FFFFFF
            return new Color(floor(random() * rangeEnd));
        };

        proto.toString = function () {
            return this[Color.TO_STRING_METHOD]();
        };

        proto.valueOf = proto.getValue = function () {
            var channels = this.channels;
            return (
                (channels[0] * 0x10000) |
                    (channels[1] * 0x100  ) |
                    channels[2]
                );
        };

        proto.setValue = function (value) {
            this.channels.splice(
                0, 3,

                value >>> 0x10,
                (value & 0xFF00) / 0x100,
                value & 0xFF
                );
        };

        proto.hexTriplet = ("01".substr(-1) === "1" ?
            // pad 6 zeros to the left
            function () {
                return "#" + ("00000" + this.getValue().toString(16)).substr(-6);
            }
            : // IE doesn't support substr with negative numbers
            function () {
                var str = this.getValue().toString(16);
                return "#" + (new Array(str.length < 6 ? 6 - str.length + 1 : 0)).join("0") + str;
            }
            );

        proto.css = function () {
            var color = this;
            return color.channels[3] === 1 ? color.hexTriplet() : color.rgba();
        };

        // TODO: make the following functions less redundant

        proto.rgbData = function () {
            return this.channels.slice(0, 3);
        };

        proto.hslData = function () {
            return Color.RGBtoHSL(this.rgbData());
        };

        proto.rgb = function () {
            return "rgb(" + this.rgbData().join(",") + ")";
        };

        proto.rgba = function () {
            return "rgba(" + this.channels.join(",") + ")";
        };

        proto.hsl = function () {
            var hsl = this.hslData();
            return "hsl(" + hsl[0] * 360 + "," + (hsl[1] * 100) + "%," + (hsl[2] * 100) + "%)";
        };

        proto.hsla = function () {
            var hsl = this.hslData();
            return "hsla(" + hsl[0] * 360 + "," + (hsl[1] * 100) + "%," + (hsl[2] * 100) + "%," + this.channels[3] + ")";
        };

        return Color;
    }());

    /**
     * Formats the number according to the ‘format’ string;
     * adherses to the american number standard where a comma
     * is inserted after every 3 digits.
     *  note: there should be only 1 contiguous number in the format,
     * where a number consists of digits, period, and commas
     *        any other characters can be wrapped around this number, including ‘$’, ‘%’, or text
     *        examples (123456.789):
     *          ‘0 - (123456) show only digits, no precision
     *          ‘0.00 - (123456.78) show only digits, 2 precision
     *          ‘0.0000 - (123456.7890) show only digits, 4 precision
     *          ‘0,000 - (123,456) show comma and digits, no precision
     *          ‘0,000.00 - (123,456.78) show comma and digits, 2 precision
     *          ‘0,0.00 - (123,456.78) shortcut method, show comma and digits, 2 precision
     *
     * @method format
     * @param format {string} the way you would like to format this text
     * @return {string} the formatted number
     * @public
     */
    var numberFormat = function(that,format) {
        if (typeof format !== "string") {
            return;
        } // sanity check

        var hasComma = -1 < format.indexOf(","),
            psplit = format.split('.');

        // compute precision
        if (1 < psplit.length) {
            // fix number precision
            that = that.toFixed(psplit[1].length);
        }
        // error: too many periods
        else if (2 < psplit.length) {
            throw('NumberFormatException: invalid format, formats should have no more than 1 period:' + format);
        }
        // remove precision
        else {
            that = that.toFixed(0);
        }

        // get the string now that precision is correct
        var fnum = that.toString();

        // format has comma, then compute commas
        if (hasComma) {
            // remove precision for computation
            psplit = fnum.split('.');

            var cnum = psplit[0],
                parr = [],
                j = cnum.length,
                m = Math.floor(j / 3),
                n = cnum.length % 3 || 3; // n cannot be ZERO or causes infinite loop

            // break the number into chunks of 3 digits; first chunk may be less than 3
            for (var i = 0; i < j; i += n) {
                if (i != 0) {
                    n = 3;
                }
                parr[parr.length] = cnum.substr(i, n);
                m -= 1;
            }

            // put chunks back together, separated by comma
            fnum = parr.join(',');

            // add the precision back in
            if (psplit[1]) {
                fnum += '.' + psplit[1];
            }
        }

        // replace the number portion of the format with fnum
        return format.replace(/[\d,?\.?]+/, fnum);
    };


    
    function Anim(duration,easing){
        this.duration = duration*1000;
        this.fnEasing = S.isString(easing) ? S.Easing[easing] : easing;
    }

    S.augment(Anim, {

        init : function () {
            this.start = new Date().getTime();
            this.finish = this.start + this.duration;
        },

        get : function () {
            var now = new Date().getTime(),k;
            if(now > this.finish) {
                return 1;
            }
            k = (now - this.start)/this.duration;
            return this.fnEasing(k);
        }
    });

    return {
        Color : Color,
        numberFormat : numberFormat,
        Anim : Anim
    };
});

