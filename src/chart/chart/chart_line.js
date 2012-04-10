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
            console.log(elements);
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
