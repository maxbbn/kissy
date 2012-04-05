KISSY.add('chart/element_bar', function (S, Util, Path) {
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
     * class BarElement for Bar Chart
     */
    function BarElement(data, chart, drawcfg) {
        var self = this;
        self.data = data;
        self.chart = chart;
        self.drawcfg = drawcfg;
        self.config = data.config;

        self.initData(drawcfg);
        self.initEvent();

        self.current = [-1,-1];
        self.anim = new Util.Anim(self.config.animationDuration,self.config.animationEasing)//,1,"bounceOut");
        self.anim.init();
    }

    S.augment(BarElement, S.EventTarget, {

        initData : function (cfg) {
            var self      = this,
                data      = self.data,
                elemLength= data.elements().length,
                maxlength = data.maxElementLength(),
                right = cfg.width - cfg.paddingRight,
                left = cfg.paddingLeft,
                bottom = cfg.height - cfg.paddingBottom,
                itemwidth = (right - left)/maxlength,
                gap = itemwidth/5/elemLength,//gap between bars
                padding = itemwidth/3/elemLength,
                barwidth = (itemwidth - (elemLength - 1) * gap - 2*padding)/elemLength,
                barheight,barleft,bartop,color,
                items = [];
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

                barheight = (bottom - cfg.top) * elem.data / cfg.max;
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
                data = self.items,
                ml = self.maxLength,
                color,gradiet,colord,chsl,
                barheight,cheight,barleft,bartop,
                //for anim
                k = self.anim.get(),
                i;

            if (self.data.config.showLabels) {
                self.drawNames(ctx);
            }

            S.each(data, function (bar, idx) {
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
                        data = self.data.elements()[idx];
                        ctx.fillText(Util.numberFormat(data.data, data.format), bar._x[i], bartop + 2);
                        ctx.restore();
                    }
                }

            });

            if (k < 1) {
                self.fire("redraw");
            }
        },

        initEvent : function () {
            this.chart.on(MOUSE_MOVE,this.chartMouseMove,this);
            this.chart.on(MOUSE_LEAVE,this.chartMouseLeave,this);
        },

        destory : function () {
            this.chart.detach(MOUSE_MOVE,this.chartMouseMove);
            this.chart.detach(MOUSE_LEAVE,this.chartMouseLeave);
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
                cfg = self.drawcfg,
                data = self.data.elements(),
                l = data.length,
                i = l - 1,
                br = cfg.width - cfg.paddingRight,
                by = cfg.paddingTop - 12,
                d,
                c;

            for(; i>=0; i--) {
                d = data[i];
                if (d.notdraw) {
                    continue;
                }
                c = self.data.getColor(i);
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

    return BarElement;
},{
    requires : ["chart/util", "chart/path"]
});
