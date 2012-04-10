KISSY.add("chart/chart", function (S, Util, Data, SimpleTooltip, ChartLine, ChartBar, ChartPie) {

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
    Chart.addType(ChartPie);
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
        'chart/chart_bar',
        'chart/chart_pie'
    ]
});
