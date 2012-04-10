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

                barheight = (bottom - paddingTop) * elem.data / data.getMax(height);
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
