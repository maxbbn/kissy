﻿/*
Copyright 2012, KISSY UI Library v1.30dev
MIT Licensed
build time: Feb 9 18:01
*/
/**
 * KISSY Calendar
 * @creator  拔赤<lijing00333@163.com>
 */
KISSY.add('calendar/base', function (S, Node, Event, undefined) {
    var EventTarget = Event.Target,
        $ = Node.all,
        win = $(window);

    function Calendar(trigger, config) {
        this._init(trigger, config);
    }

    S.augment(Calendar, EventTarget, {

        /**
         * 日历构造函数
         * @method     _init
         * @param { string }    selector
         * @param { string }    config
         * @private
         */
        _init:function (selector, config) {
            /*
             self.con  日历的容器
             self.id   传进来的id
             self.C_Id 永远代表日历容器的ID
             */
            var self = this, trigger = $(selector);
            self.id = self._stamp(trigger);
            self._buildParam(config);
            if (!self.popup) {
                self.con = trigger;
            } else {
                self.trigger = trigger;
                self.con = new Node('<div>');
                $(document.body).append(self.con);

                self.con.css({
                    'top':'0px',
                    'position':'absolute',
                    'background':'white',
                    'visibility':'hidden',
                    'z-index':99999999
                });
            }
            self.C_Id = self._stamp(self.con);

            self.render();
            self._buildEvent();
            return this;
        },

        /**
         * 日历构造渲染,增加对多日历不联动的处理
         * @param { object }    [o]
         */
        render:function (o) {
            var self = this,
                i,
                _prev, _next, _oym;

            o = o || {};
            self._parseParam(o);

            self.con.addClass('ks-cal-call ks-clearfix ks-cal-call-multi-' + self.pages);
            self.con.html('');

            var _rangeStart = false;
            var _rangeEnd = false;
            if (self.range) {
                if (self.range.start) {
                    _rangeStart = true;
                }
                if (self.range.end) {
                    _rangeEnd = true;
                }
            }
            if (_rangeStart && !self.rangeLinkage) {
                _oym = [self.range.start.getFullYear(), self.range.start.getMonth()];
            }
            else {
                _oym = [self.year, self.month];
            }

            for (i = 0; i < self.pages; i++) {
                if (i === 0) {
                    _prev = true;
                } else if (!self.rangeLinkage) {
                    _prev = true;
                    if (_rangeEnd && (i + 1) == self.pages) {
                        _oym = [self.range.end.getFullYear(), self.range.end.getMonth()];
                    }
                    else {
                        _oym = self._computeNextMonth(_oym);
                    }
                }
                else {
                    _prev = false;
                    _oym = self._computeNextMonth(_oym);
                }
                if (!self.rangeLinkage) {
                    _next = true;
                }
                else {
                    _next = i == (self.pages - 1);
                }
                self.ca = self.ca || [];
                var cal = self.ca[i];
                if (!self.rangeLinkage && cal && (cal.year != _oym[0] || cal.month != _oym[1])) {
                    _oym = [cal.year, cal.month];
                }

                self.ca[i] = new self.Page({
                    year:_oym[0],
                    month:_oym[1],
                    prevArrow:_prev,
                    nextArrow:_next,
                    showTime:self.showTime
                }, self);
                self.ca[i].render();
            }
            return this;

        },

        /**
         * 用以给容器打上id的标记,容器有id则返回
         * @method _stamp
         * @param el
         * @return {string}
         * @private
         */
        _stamp:function (el) {
            if (!el.attr('id')) {
                el.attr('id', S.guid('K_Calendar'));
            }
            return el.attr('id');
        },


        /**
         * 创建日历外框的事件
         * @method _buildEvent
         */
        _buildEvent:function () {
            var self = this, tev, i;
            if (!self.popup) {
                return this;
            }
            //点击空白
            //flush event
            S.each(self.EV, function (tev) {
                if (tev) {
                    tev.target.detach(tev.type, tev.fn);
                }
            });
            self.EV = self.EV || [];
            tev = self.EV[0] = {
                target:$(document),
                type:'click'
            };
            tev.fn = function (e) {
                var target = $(e.target);
                //点击到日历上
                if (target.attr('id') === self.C_Id) {
                    return;
                }
                if ((target.hasClass('ks-next') || target.hasClass('ks-prev')) &&
                    target[0].tagName === 'A') {
                    return;
                }
                //点击在trigger上
                if (target.attr('id') == self.id) {
                    return;
                }

                if (self.con.css('visibility') == 'hidden') {
                    return;
                }

                // bugfix by jayli - popup状态下，点击选择月份的option时日历层关闭
                if (self.con.contains(target) &&
                    (target[0].nodeName.toLowerCase() === 'option' ||
                        target[0].nodeName.toLowerCase() === 'select')) {
                    return;
                }

                var inRegion = function (dot, r) {
                    return dot[0] > r[0].x
                        && dot[0] < r[1].x
                        && dot[1] > r[0].y
                        && dot[1] < r[1].y;
                };
                if (!inRegion([e.pageX, e.pageY], [
                    {
                        x:self.con.offset().left,
                        y:self.con.offset().top
                    },
                    {
                        x:self.con.offset().left + self.con.width(),
                        y:self.con.offset().top + self.con.height()
                    }
                ])) {
                    self.hide();
                }
            };
            tev.target.on(tev.type, tev.fn);
            //点击触点
            for (i = 0; i < self.triggerType.length; i++) {
                tev = self.EV[i + 1] = {
                    target:$('#' + self.id),
                    type:self.triggerType[i],
                    fn:function (e) {
                        e.target = $(e.target);
                        e.preventDefault();
                        //如果focus和click同时存在的hack

                        var a = self.triggerType;
                        if (S.inArray('click', a) && S.inArray('focus', a)) {//同时含有
                            if (e.type == 'focus') {
                                self.toggle();
                            }
                        } else if (S.inArray('click', a) && !S.inArray('focus', a)) {//只有click
                            if (e.type == 'click') {
                                self.toggle();
                            }
                        } else if (!S.inArray('click', a) && S.inArray('focus', a)) {//只有focus
                            setTimeout(function () {//为了跳过document.onclick事件
                                self.toggle();
                            }, 170);
                        } else {
                            self.toggle();
                        }

                    }
                };
                tev.target.on(tev.type, tev.fn);
            }
            return this;
        },

        //处理对齐
        __getAlignOffset:function (node, align) {

            var V = align.charAt(0),
                H = align.charAt(1),
                offset, w, h, x, y;

            if (node) {
                node = Node.one(node);
                offset = node.offset();
                w = node.outerWidth();
                h = node.outerHeight();
            } else {
                offset = { left:win.scrollLeft(), top:win.scrollTop() };
                w = win.width();
                h = win.height();
            }

            x = offset.left;
            y = offset.top;

            if (V === 'c') {
                y += h / 2;
            } else if (V === 'b') {
                y += h;
            }

            if (H === 'c') {
                x += w / 2;
            } else if (H === 'r') {
                x += w;
            }

            return { left:x, top:y };

        },
        /**
         * 改变日历是否显示的状态
         * @mathod toggle
         */
        toggle:function () {
            var self = this;
            if (self.con.css('visibility') == 'hidden') {
                self.show();
            } else {
                self.hide();
            }
        },

        /**
         * 显示日历
         * @method show
         */
        show:function () {
            var self = this;
            self.con.css('visibility', '');
            var points = self.align.points,
                offset = self.align.offset || [0, 0],
                xy = self.con.offset(),
                p1 = self.__getAlignOffset(self.trigger, points[0]),
                p2 = self.__getAlignOffset(self.con, points[1]),
                diff = [p2.left - p1.left, p2.top - p1.top],
                _x = xy.left - diff[0] + offset[0],
                _y = xy.top - diff[1] + offset[1];

            self.con.css('left', _x.toString() + 'px');
            self.con.css('top', _y.toString() + 'px');
            self.fire("show");
            return this;
        },

        /**
         * 隐藏日历
         * @method hide
         */
        hide:function () {
            var self = this;
            self.con.css('visibility', 'hidden');
            self.fire("hide");
            return this;
        },

        /**
         * 创建参数列表
         * @method _buildParam
         * @private
         */
        _buildParam:function (o) {
            var self = this;
            if (o === undefined || o === null) {
                o = { };
            }

            function setParam(def, key) {
                var v = o[key];
                // null在这里是“占位符”，用来清除参数的一个道具
                self[key] = (v === undefined || v === null) ? def : v;
            }

            //这种处理方式不错
            S.each({
                date:new Date(),
                selected:null,
                startDay:0,
                pages:1,
                closable:false,
                rangeSelect:false,
                minDate:false,
                maxDate:false,
                "multiSelect":false,
                navigator:true,
                popup:false,
                showTime:false,
                triggerType:['click'],
                //新增加的配置参数
                disabled:null, //禁止点击的日期数组[new Date(),new Date(2011,11,26)]
                range:null, //已选择的时间段{start:null,end:null}
                rangeLinkage:true,
                align:{
                    points:['bl', 'tl'],
                    offset:[0, 0]
                }, //对其方式
                notLimited:false// 是否出现不限的按钮
            }, setParam);


            // 支持用户传进来一个string
            if (typeof o.triggerType === 'string') {
                o.triggerType = [o.triggerType];
            }

            self.startDay = self.startDay % 7;
            if (self.startDay < 0) {
                self.startDay += 7;
            }

            self.EV = [];
            return this;
        },

        /**
         * 过滤参数列表
         * @method _parseParam
         * @private
         */
        _parseParam:function (o) {
            var self = this, i;
            if (o === undefined || o === null) {
                o = {};
            }
            for (i in o) {
                self[i] = o[i];
            }
            self._handleDate();
            return this;
        },

        /**
         * 模板函数
         * @method _templetShow
         * @private
         */
        _templetShow:function (templet, data) {
            var str_in, value_s, i, m, value, par;
            if (data instanceof Array) {
                str_in = '';
                for (i = 0; i < data.length; i++) {
                    str_in += arguments.callee(templet, data[i]);
                }
                templet = str_in;
            } else {
                value_s = templet.match(/{\$(.*?)}/g);
                if (data !== undefined && value_s !== null) {
                    for (i = 0, m = value_s.length; i < m; i++) {
                        par = value_s[i].replace(/({\$)|}/g, '');
                        value = (data[par] !== undefined) ? data[par] : '';
                        templet = templet.replace(value_s[i], value);
                    }
                }
            }
            return templet;
        },

        /**
         * 处理日期
         * @method _handleDate
         * @private
         */
        _handleDate:function () {
            var self = this,
                date = self.date;
            self.weekday = date.getDay() + 1;//星期几 //指定日期是星期几
            self.day = date.getDate();//几号
            self.month = date.getMonth();//月份
            self.year = date.getFullYear();//年份
            return this;
        },

        //get标题
        _getHeadStr:function (year, month) {
            return year.toString() + '年' + (Number(month) + 1).toString() + '月';
        },

        //月加
        _monthAdd:function () {
            var self = this;
            if (self.month == 11) {
                self.year++;
                self.month = 0;
            } else {
                self.month++;
            }
            self.date = new Date(self.year.toString() + '/' + (self.month + 1).toString() + '/1');
            return this;
        },

        //月减
        _monthMinus:function () {
            var self = this;
            if (self.month === 0) {
                self.year--;
                self.month = 11;
            } else {
                self.month--;
            }
            self.date = new Date(self.year.toString() + '/' + (self.month + 1).toString() + '/1');
            return this;
        },
        //年加
        _yearAdd:function () {
            var self = this;
            self.year++;
            self.date = new Date(self.year.toString() + '/' + (self.month + 1).toString() + '/1');
            return this;
        },

        //年减
        _yearMinus:function () {
            var self = this;
            self.year--;
            self.date = new Date(self.year.toString() + '/' + (self.month + 1).toString() + '/1');
            return this;
        },

        //裸算下一个月的年月,[2009,11],年:fullYear，月:从0开始计数
        _computeNextMonth:function (a) {
            var _year = a[0],
                _month = a[1];
            if (_month == 11) {
                _year++;
                _month = 0;
            } else {
                _month++;
            }
            return [_year, _month];
        },

        //处理日期的偏移量
        _handleOffset:function () {
            var self = this,
                data = ['日', '一', '二', '三', '四', '五', '六'],
                temp = '<span>{$day}</span>',
                offset = self.startDay,
                day_html,
                a = [];
            for (var i = 0; i < 7; i++) {
                a[i] = {
                    day:data[(i + offset) % 7]
                };
            }
            day_html = self._templetShow(temp, a);

            return {
                day_html:day_html
            };
        },

        //处理起始日期,d:Date类型
        _handleRange:function (d) {
            var self = this, t;
            self.range = self.range || {start:null, end:null};
            if ((self.range.start === null && self.range.end === null ) || (self.range.start !== null && self.range.end !== null)) {
                self.range.start = d;
                self.range.end = null;
                self.render();
            } else if (self.range.start !== null && self.range.end === null) {
                self.range.end = d;
                if (self.range.start.getTime() > self.range.end.getTime()) {
                    t = self.range.start;
                    self.range.start = self.range.end;
                    self.range.end = t;
                }
                self.fire('rangeSelect', self.range);

                self.render();
                if (self.popup && self.closable) {
                    self.hide();
                }
            }
            return this;
        }
    });

    return Calendar;
}, { requires:['node', "event"] });

/**
 *
 * 2011-12-27 by keyapril@gmail.com
 1.新增配置参数：
 disabled:null, //禁止点击的日期数组[new Date(),new Date(2011,11,26)]
 range:    null,//已选择的时间段{start:null,end:null}
 align:{
 points:['bl','tl'],
 offset:[0,0]
 },//对其方式
 notLimited:    false,// 是否出现不限的按钮
 rangLinkage //多个日历是否联动
 2.新增加功能
 -加入了"年"的前进后退
 -加入了不限按钮，在点击之后触发“select”事件，参数为null,
 -Date.parse方法新增对"2011-12-27"字符串的处理
 3.bug修复
 -修复最小最大日期限制后31号始终可点击的BUG
 4.样式的调整
 -美化了。。。
 *
 * 2011-12-06 by yiminghe@gmail.com
 *  - 全局绑定放 document
 *  - fix 清除事件调用
 *
 * 2010-09-09 by lijing00333@163.com - 拔赤
 *     - 将基于YUI2/3的Calendar改为基于KISSY
 *     - 增加起始日期（星期x）的自定义
 *      - 常见浮层的bugfix
 *
 * TODO:
 *   - 日历日期的输出格式的定制
 *   - 多选日期的场景的交互设计
 *//**
 * @fileOverview calendar
 */
KISSY.add("calendar", function (S, C, Page, Time, Date) {
    C.Date = Date;
    return C;
}, {
    requires:["calendar/base", "calendar/page", "calendar/time", "calendar/date"]
});

/**
 左莫 2011-12-28：
 1.新增配置参数：
 disabled:null, //禁止点击的日期数组[new Date(),new Date(2011,11,26)]
 range:    null,//已选择的时间段{start:null,end:null}
 align:{
 points:['bl','tl'],
 offset:[0,0]
 },//对其方式
 notLimited:    false,// 是否出现不限的按钮
 rangLinkage //多个日历是否联动
 2.新增加功能
 -加入了"年"的前进后退
 -加入了不限按钮，在点击之后触发“select”事件，参数为null,
 -Date.parse方法新增对"2011-12-27"字符串的处理
 3.bug修复
 -修复最小最大日期限制后31号始终可点击的BUG
 4.样式的调整
 -美化了
 **//*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 *
 * Last modified by jayli 拔赤 2010-09-09
 * - 增加中文的支持
 * - 简单的本地化，对w（星期x）的支持
 */
KISSY.add('calendar/date', function(S) {

    function dateParse(data,s) {

        var date = null;
		s = s || '-';
        //Convert to date
        if (!(date instanceof Date)) {
            date = new Date(data);
        }
        else {
            return date;
        }

        // Validate
        if (date instanceof Date && (date != "Invalid Date") && !isNaN(date)) {
            return date;
        }
        else {
			var arr = data.toString().split(s);
			if(arr.length==3){
				date = new Date(arr[0], (parseInt(arr[1], 10) - 1), arr[2]);
				if (date instanceof Date && (date != "Invalid Date") && !isNaN(date)) {
					return date;
				}
			}
        }
		return null;

    }


    var dateFormat = function () {
        var token = /w{1}|d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
            timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
            timezoneClip = /[^-+\dA-Z]/g,
            pad = function (val, len) {
                val = String(val);
                len = len || 2;
                while (val.length < len) {
                    val = "0" + val;
                }
                return val;
            },
            // Some common format strings
            masks = {
                "default":      "ddd mmm dd yyyy HH:MM:ss",
                shortDate:      "m/d/yy",
                //mediumDate:     "mmm d, yyyy",
                longDate:       "mmmm d, yyyy",
                fullDate:       "dddd, mmmm d, yyyy",
                shortTime:      "h:MM TT",
                //mediumTime:     "h:MM:ss TT",
                longTime:       "h:MM:ss TT Z",
                isoDate:        "yyyy-mm-dd",
                isoTime:        "HH:MM:ss",
                isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
                isoUTCDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'",

                //added by jayli
                localShortDate:    "yy年mm月dd日",
                localShortDateTime:"yy年mm月dd日 hh:MM:ss TT",
                localLongDate:    "yyyy年mm月dd日",
                localLongDateTime:"yyyy年mm月dd日 hh:MM:ss TT",
                localFullDate:    "yyyy年mm月dd日 w",
                localFullDateTime:"yyyy年mm月dd日 w hh:MM:ss TT"

            },

            // Internationalization strings
            i18n = {
                dayNames: [
                    "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
                    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
                    "星期日","星期一","星期二","星期三","星期四","星期五","星期六"
                ],
                monthNames: [
                    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
                ]
            };

        // Regexes and supporting functions are cached through closure
        return function (date, mask, utc) {

            // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
            if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
                mask = date;
                date = undefined;
            }

            // Passing date through Date applies Date.parse, if necessary
            date = date ? new Date(date) : new Date();
            if (isNaN(date)) {
                throw SyntaxError("invalid date");
            }

            mask = String(masks[mask] || mask || masks["default"]);

            // Allow setting the utc argument via the mask
            if (mask.slice(0, 4) == "UTC:") {
                mask = mask.slice(4);
                utc = true;
            }

            var _ = utc ? "getUTC" : "get",
                d = date[_ + "Date"](),
                D = date[_ + "Day"](),
                m = date[_ + "Month"](),
                y = date[_ + "FullYear"](),
                H = date[_ + "Hours"](),
                M = date[_ + "Minutes"](),
                s = date[_ + "Seconds"](),
                L = date[_ + "Milliseconds"](),
                o = utc ? 0 : date.getTimezoneOffset(),
                flags = {
                    d:    d,
                    dd:   pad(d, undefined),
                    ddd:  i18n.dayNames[D],
                    dddd: i18n.dayNames[D + 7],
                    w:     i18n.dayNames[D + 14],
                    m:    m + 1,
                    mm:   pad(m + 1, undefined),
                    mmm:  i18n.monthNames[m],
                    mmmm: i18n.monthNames[m + 12],
                    yy:   String(y).slice(2),
                    yyyy: y,
                    h:    H % 12 || 12,
                    hh:   pad(H % 12 || 12, undefined),
                    H:    H,
                    HH:   pad(H, undefined),
                    M:    M,
                    MM:   pad(M, undefined),
                    s:    s,
                    ss:   pad(s, undefined),
                    l:    pad(L, 3),
                    L:    pad(L > 99 ? Math.round(L / 10) : L, undefined),
                    t:    H < 12 ? "a" : "p",
                    tt:   H < 12 ? "am" : "pm",
                    T:    H < 12 ? "A" : "P",
                    TT:   H < 12 ? "AM" : "PM",
                    Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                    o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                    S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
                };

            return mask.replace(token, function ($0) {
                return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
            });
        };
    }();

    return {
        format: function(date, mask, utc) {
            return dateFormat(date, mask, utc);
        },
        parse: function(date,s) {
            return dateParse(date,s);
        }
    };
});/**
 * 2010-09-14 拔赤
 *        - 仅支持S.Date.format和S.Date.parse，format仅对常用格式进行支持（不超过10个），也可以自定义
 *        - kissy-lang中是否应当增加Lang.type(o)?或者isDate(d)?
 *        - 模块名称取为datetype还是直接用date? 我更倾向于用date
 *        - YUI的datetype花了大量精力对全球语种进行hack，似乎KISSY是不必要的，KISSY只对中文做hack即可
 */
/**
 * @module     日历
 * @creator  拔赤<lijing00333@163.com>
 */
KISSY.add('calendar/page', function(S, UA, Node, Calendar) {

    S.augment(Calendar, {

        Page: function(config, father) {
            /**
             * 子日历构造器
             * @constructor S.Calendar.Page
             * @param {object} config ,参数列表，需要指定子日历所需的年月
             * @param {object} father,指向Y.Calendar实例的指针，需要共享父框的参数
             * @return 子日历的实例
             */

            //属性
            this.father = father;
            this.month = Number(config.month);
            this.year = Number(config.year);
            this.prevArrow = config.prevArrow;
            this.nextArrow = config.nextArrow;
            this.node = null;
            this.timmer = null;//时间选择的实例
            this.id = '';
            this.EV = [];
            this.html = [
                '<div class="ks-cal-box" id="{$id}">',
                '<div class="ks-cal-hd">',
                '<a href="javascript:void(0);" class="ks-prev-year {$prev}"><</a><a href="javascript:void(0);" class="ks-prev-month {$prev}"><</a>',
                '<a href="javascript:void(0);" class="ks-title">{$title}</a>',
                '<a href="javascript:void(0);" class="ks-next-month {$next}">></a><a href="javascript:void(0);" class="ks-next-year {$next}">></a>',
                '</div>',
                '<div class="ks-cal-bd">',
                '<div class="ks-whd">',
                /*
                 '<span>日</span>',
                 '<span>一</span>',
                 '<span>二</span>',
                 '<span>三</span>',
                 '<span>四</span>',
                 '<span>五</span>',
                 '<span>六</span>',
                 */
                father._handleOffset().day_html,
                '</div>',
                '<div class="ks-dbd ks-clearfix">',
                '{$ds}',
                /*
                 <a href="" class="ks-null">1</a>
                 <a href="" class="ks-disabled">3</a>
                 <a href="" class="ks-selected">1</a>
                 <a href="" class="ks-today">1</a>
                 <a href="">1</a>
                 */
				'<div style="clear:both;"></div>',
                '</div>',
                '</div>',
                '<div class="ks-setime hidden">',
                '</div>',
				'<div class="{$notlimited}"><a href="#" class="ks-cal-notLimited {$notlimitedCls}">不限</a></div>',
                '<div class="ks-cal-ft {$showtime}">',
                '<div class="ks-cal-time">',
                '时间：00:00 &hearts;',
                '</div>',
                '</div>',
                '<div class="ks-selectime hidden">',//<!--用以存放点选时间的一些关键值-->',
                '</div>',
                '</div><!--#ks-cal-box-->'
            ].join("");
            this.nav_html = [
                '<p>',
                '月',
                '<select' +
                    ' value="{$the_month}">',
                '<option class="m1" value="1">01</option>',
                '<option class="m2" value="2">02</option>',
                '<option class="m3" value="3">03</option>',
                '<option class="m4" value="4">04</option>',
                '<option class="m5" value="5">05</option>',
                '<option class="m6" value="6">06</option>',
                '<option class="m7" value="7">07</option>',
                '<option class="m8" value="8">08</option>',
                '<option class="m9" value="9">09</option>',
                '<option class="m10" value="10">10</option>',
                '<option class="m11" value="11">11</option>',
                '<option class="m12" value="12">12</option>',
                '</select>',
                '</p>',
                '<p>',
                '年',
                '<input type="text" value="{$the_year}" onfocus="this.select()"/>',
                '</p>',
                '<p>',
                '<button class="ok">确定</button><button class="cancel">取消</button>',
                '</p>'
            ].join("");


            //方法
            //常用的数据格式的验证
            this.Verify = function() {

                var isDay = function(n) {
                    if (!/^\d+$/i.test(n)) {
                        return false;
                    }
                    n = Number(n);
                    return !(n < 1 || n > 31);

                },
                    isYear = function(n) {
                        if (!/^\d+$/i.test(n)) {
                            return false;
                        }
                        n = Number(n);
                        return !(n < 100 || n > 10000);

                    },
                    isMonth = function(n) {
                        if (!/^\d+$/i.test(n)) {
                            return false;
                        }
                        n = Number(n);
                        return !(n < 1 || n > 12);


                    };

                return {
                    isDay:isDay,
                    isYear:isYear,
                    isMonth:isMonth

                };


            };

            /**
             * 渲染子日历的UI
             */
            this._renderUI = function() {
                var cc = this,_o = {},ft;
                cc.HTML = '';
                _o.prev = '';
                _o.next = '';
                _o.title = '';
                _o.ds = '';
				_o.notlimited='';
				_o.notlimitedClass='';
                if (!cc.prevArrow) {
                    _o.prev = 'hidden';
                }
                if (!cc.nextArrow) {
                    _o.next = 'hidden';
                }
                if (!cc.father.showTime) {
                    _o.showtime = 'hidden';
                }
				if (!cc.father.notLimited) {
                    _o.notlimited='hidden';
                }
				
				if(cc.father.showTime&&cc.father.notLimited){
					_o.notlimitedCls='ks-cal-notLimited-showTime';
				}
				if(cc.father.notLimited&&!cc.father.selected){
					_o.notlimitedCls+=' ks-cal-notLimited-selected';
				}
                _o.id = cc.id = 'ks-cal-' + Math.random().toString().replace(/.\./i, '');
                _o.title = cc.father._getHeadStr(cc.year, cc.month);
                cc.createDS();
                _o.ds = cc.ds;
                cc.father.con.append(cc.father._templetShow(cc.html, _o));
                cc.node = Node.one('#' + cc.id);
                if (cc.father.showTime) {
                    ft = cc.node.one('.ks-cal-ft');
                    cc.timmer = new cc.father.TimeSelector(ft, cc.father);
                }
                return this;
            };
            /**
             * 创建子日历的事件
             */
            this._buildEvent = function() {
                var cc = this,i,
                    tev,
                    con = Node.one('#' + cc.id);
                //flush event
                S.each(cc.EV, function(tev) {
                    if (tev) {
                        tev.target.detach(tev.type, tev.fn);
                    }
                });
                cc.EV = cc.EV || [];
                tev = cc.EV[0] = {
                    target:     con.one('div.ks-dbd'),
                    type:"click",
                    fn:   function(e) {
                        e.preventDefault();
						if(e.target.tagName!='A'){
							//如果不是点击在A标签上，直接return;
							return;
						}
                        e.target = Node(e.target);
						
                        if (e.target.hasClass('ks-null')) {
                            return;
                        }
                        if (e.target.hasClass('ks-disabled')) {
                            return;
                        }
                        var d = new Date(cc.year,cc.month,Number(e.target.html()));
                        cc.father.dt_date = d;
                        cc.father.fire('select', {
                            date:d
                        });
                        if (cc.father.popup && cc.father.closable&&!cc.father.showTime&&!cc.father.rangeSelect) {
                            cc.father.hide();
                        }
                        if (cc.father.rangeSelect) {
                            cc.father._handleRange(d);
                        }
                        cc.father.render({selected:d});
                    }
                };
                function bindEventTev() {
                    tev.target.on(tev.type, tev.fn);
                }

                bindEventTev();
                //向前一月
                tev = cc.EV[1] = {
                    target:con.one('a.ks-prev-month'),
                    type:'click',
                    fn:function(e) {
                        e.preventDefault();
						if(!cc.father.rangeLinkage){
							cc._monthMinus();
						}
                        cc.father._monthMinus().render();
                        cc.father.fire('monthChange', {
                            date:new Date(cc.father.year + '/' + (cc.father.month + 1) + '/01')
                        });
                    }
                };
                bindEventTev();
                //向后一月
                tev = cc.EV[2] = {
                    target:con.one('a.ks-next-month'),
                    type:'click',
                    fn: function(e) {
                        e.preventDefault();
						if(!cc.father.rangeLinkage){
							cc._monthAdd();
						}
                        cc.father._monthAdd().render();
                        cc.father.fire('monthChange', {
                            date:new Date(cc.father.year + '/' + (cc.father.month + 1) + '/01')
                        });
                    }
                };
                bindEventTev();
				//向前一年
                tev = cc.EV[3] = {
                    target:con.one('a.ks-prev-year'),
                    type:'click',
                    fn:function(e) {
                        e.preventDefault();
						if(!cc.father.rangeLinkage){
							cc._yearMinus();
						}
                        cc.father._yearMinus().render();
                        cc.father.fire('monthChange', {
                            date:new Date(cc.father.year + '/' + (cc.father.month + 1) + '/01')
                        });
                    }
                };
                bindEventTev();
                //向后一年
                tev = cc.EV[4] = {
                    target:con.one('a.ks-next-year'),
                    type:'click',
                    fn: function(e) {
                        e.preventDefault();
						if(!cc.father.rangeLinkage){
							cc._yearAdd();
						}
                        cc.father._yearAdd().render();
                        cc.father.fire('monthChange', {
                            date:new Date(cc.father.year + '/' + (cc.father.month + 1) + '/01')
                        });
                    }
                };
                bindEventTev();
                if (cc.father.navigator) {
                    tev = cc.EV[5] = {
                        target:con.one('a.ks-title'),
                        type:'click',
                        fn:function(e) {
                            try {
                                cc.timmer.hidePopup();
                                e.preventDefault();
                            } catch(exp) {
                            }
                            e.target = Node(e.target);
                            var setime_node = con.one('.ks-setime');
                            setime_node.html('');
                            var in_str = cc.father._templetShow(cc.nav_html, {
                                the_month:cc.month + 1,
                                the_year:cc.year
                            });
                            setime_node.html(in_str);
                            setime_node.removeClass('hidden');
                            con.one('input').on('keydown', function(e) {
                                e.target = Node(e.target);
                                if (e.keyCode == 38) {//up
                                    e.target.val(Number(e.target.val()) + 1);
                                    e.target[0].select();
                                }
                                if (e.keyCode == 40) {//down
                                    e.target.val(Number(e.target.val()) - 1);
                                    e.target[0].select();
                                }
                                if (e.keyCode == 13) {//enter
                                    var _month = con.one('.ks-setime').one('select').val();
                                    var _year = con.one('.ks-setime').one('input').val();
                                    con.one('.ks-setime').addClass('hidden');
                                    if (!cc.Verify().isYear(_year)) {
                                        return;
                                    }
                                    if (!cc.Verify().isMonth(_month)) {
                                        return;
                                    }
                                    cc.father.render({
                                        date:new Date(_year + '/' + _month + '/01')
                                    });
                                    cc.father.fire('monthChange', {
                                        date:new Date(_year + '/' + _month + '/01')
                                    });
                                }
                            });
                        }
                    };
                    bindEventTev();
                    tev = cc.EV[6] = {
                        target:con.one('.ks-setime'),
                        type:'click',
                        fn:function(e) {
                            e.preventDefault();
                            e.target = Node(e.target);
                            if (e.target.hasClass('ok')) {
                                var _month = con.one('.ks-setime').one('select').val(),
                                    _year = con.one('.ks-setime').one('input').val();
                                con.one('.ks-setime').addClass('hidden');
                                if (!cc.Verify().isYear(_year)) {
                                    return;
                                }
                                if (!cc.Verify().isMonth(_month)) {
                                    return;
                                }
                                cc.father.render({
                                    date:new Date(_year + '/' + _month + '/01')
                                });
                                cc.father.fire('monthChange', {
                                    date:new Date(_year + '/' + _month + '/01')
                                });
                            } else if (e.target.hasClass('cancel')) {
                                con.one('.ks-setime').addClass('hidden');
                            }
                        }
                    };
                    bindEventTev();
                }
				
				if(cc.father.notLimited){
					tev = cc.EV[cc.EV.length] = {
                        target:con.one('.ks-cal-notLimited'),
                        type:'click',
                        fn:function(e) {
                            e.preventDefault();
							cc.father.range={start:null,end:null};
                            cc.father.fire('select',{date:null});
							if (cc.father.popup && cc.father.closable) {
								cc.father.hide();
							}
							cc.father.render({selected:null});
                        }
                    };
                    bindEventTev();
				}
                return this;

            };
			//月加
        this._monthAdd=function() {
            var self = this;
            if (self.month == 11) {
                self.year++;
                self.month = 0;
            } else {
                self.month++;
            }
        },

        //月减
        this._monthMinus=function() {
            var self = this;
            if (self.month === 0) {
                self.year--;
                self.month = 11;
            } else {
                self.month--;
            }
        },
		//年加
        this._yearAdd=function() {
            var self = this;
            self.year++;
        };

        //年减
        this._yearMinus=function() {
            var self = this;
            self.year--;
        };
			
			
			
            /**
             * 得到当前子日历的node引用
             */
            this._getNode = function() {
                var cc = this;
                return cc.node;
            };
            /**
             * 得到某月有多少天,需要给定年来判断闰年
             */
            this._getNumOfDays = function(year, month) {
                return 32 - new Date(year, month - 1, 32).getDate();
            };
			
			this._isDisabled = function(arrDisabled,date){
				if(arrDisabled&&arrDisabled.length>0){
					for(var i=0;i<arrDisabled.length;i++){
						var d = arrDisabled[i];
						if(date.getFullYear()==d.getFullYear()&&date.getMonth()==d.getMonth()&&date.getDate()==d.getDate()){
							return true;
						}
					}
				}
				return false;
			}
            /**
             * 生成日期的html
			 * 
             */
            this.createDS = function() {
                var cc = this,
                    s = '',
                    startOffset = (7-cc.father.startDay+new Date(cc.year + '/' + (cc.month + 1) + '/01').getDay())%7,//当月第一天是星期几
                    days = cc._getNumOfDays(cc.year, cc.month + 1),
					selected = cc.father.selected,
					today = new Date(),
                    i, _td_s;

				
				for(var i=0;i<startOffset;i++){
					s += '<a href="javascript:void(0);" class="ks-null">0</a>';
				}
				//左莫优化了日历生成
                for (i = 1; i <= days; i++) {
					var cls = '';
					var date = new Date(cc.year,cc.month, i);
					if((cc.father.minDate&&date<cc.father.minDate) || (cc.father.maxDate&&date>cc.father.maxDate) ||cc._isDisabled(cc.father.disabled,date)){
						cls = 'ks-disabled';
					}
					else if(cc.father.range&&date>=cc.father.range.start&&date<=cc.father.range.end){
						cls = 'ks-range';
					}
					else if(selected&&selected.getFullYear() == cc.year&&selected.getMonth() == cc.month&&selected.getDate()==i){
						cls = 'ks-selected';
					}
					
					if(today.getFullYear() == cc.year&&today.getMonth() == cc.month&&today.getDate()==i){
						cls += ' ks-today';
					}
					
					s += '<a '+(cls?'class='+cls:'')+' href="javascript:void(0);">' + i + '</a>';
				}
                cc.ds = s;
                return this;
            };
            /**
             * 渲染
             */
            this.render = function() {
                var cc = this;
                cc._renderUI();
                cc._buildEvent();
                return this;
            };


        }//Page constructor over
    });
    return Calendar;
}, { requires:["ua","node","calendar/base"] });/**
 * @module     日历

 * @creator  拔赤<lijing00333@163.com>
 */
KISSY.add('calendar/time', function(S, Node,Calendar) {

    S.augment(Calendar, {

        /**
         * 时间选择构造器

         * @constructor S.Calendar.TimerSelector
         * @param {object} ft ,timer所在的容器
         * @param {object} father 指向S.Calendar实例的指针，需要共享父框的参数
         */
        TimeSelector:function(ft, father) {
            //属性

            this.father = father;
            this.fcon = ft.parent('.ks-cal-box');
            this.popupannel = this.fcon.one('.ks-selectime');//点选时间的弹出层
            if (typeof father._time == 'undefined') {//确保初始值和当前时间一致
                father._time = new Date();
            }
            this.time = father._time;
            this.status = 's';//当前选择的状态，'h','m','s'依次判断更新哪个值

            this.ctime = Node('<div class="ks-cal-time">时间：<span class="h">h</span>:<span class="m">m</span>:<span class="s">s</span><!--{{arrow--><div class="cta"><button class="u"></button><button class="d"></button></div><!--arrow}}--></div>');
            this.button = Node('<button class="ct-ok">确定</button>');
            //小时

            this.h_a = ['00','01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23'];
            //分钟

            this.m_a = ['00','10','20','30','40','50'];
            //秒

            this.s_a = ['00','10','20','30','40','50'];


            //方法

            /**
             * 创建相应的容器html，值均包含在a中
             * 参数：要拼装的数组
             * 返回：拼好的innerHTML,结尾还要带一个关闭的a



             *
             */
            this.parseSubHtml = function(a) {
                var in_str = '';
                for (var i = 0; i < a.length; i++) {
                    in_str += '<a href="javascript:void(0);" class="item">' + a[i] + '</a>';
                }
                in_str += '<a href="javascript:void(0);" class="x">x</a>';
                return in_str;
            };
            /**
             * 显示ks-selectime容器
             * 参数，构造好的innerHTML

             */
            this.showPopup = function(instr) {
                var self = this;
                this.popupannel.html(instr);
                this.popupannel.removeClass('hidden');
                var status = self.status;
                self.ctime.all('span').removeClass('on');
                switch (status) {
                    case 'h':
                        self.ctime.all('.h').addClass('on');
                        break;
                    case 'm':
                        self.ctime.all('.m').addClass('on');
                        break;
                    case 's':
                        self.ctime.all('.s').addClass('on');
                        break;
                }
            };
            /**
             * 隐藏ks-selectime容器
             */
            this.hidePopup = function() {
                this.popupannel.addClass('hidden');
            };
            /**
             * 不对其做更多的上下文假设，仅仅根据time显示出来

             */
            this.render = function() {
                var self = this;
                var h = self.get('h');
                var m = self.get('m');
                var s = self.get('s');
                self.father._time = self.time;
                self.ctime.all('.h').html(h);
                self.ctime.all('.m').html(m);
                self.ctime.all('.s').html(s);
                return self;
            };
            //这里的set和get都只是对time的操作，并不对上下文做过多假设

            /**
             * set(status,v)
             * h:2,'2'
             */
            this.set = function(status, v) {
                var self = this;
                v = Number(v);
                switch (status) {
                    case 'h':
                        self.time.setHours(v);
                        break;
                    case 'm':
                        self.time.setMinutes(v);
                        break;
                    case 's':
                        self.time.setSeconds(v);
                        break;
                }
                self.render();
            };
            /**
             * get(status)
             */
            this.get = function(status) {
                var self = this;
                var time = self.time;
                switch (status) {
                    case 'h':
                        return time.getHours();
                    case 'm':
                        return time.getMinutes();
                    case 's':
                        return time.getSeconds();
                }
            };

            /**
             * add()
             * 状态值代表的变量增1

             */
            this.add = function() {
                var self = this;
                var status = self.status;
                var v = self.get(status);
                v++;
                self.set(status, v);
            };
            /**
             * minus()
             * 状态值代表的变量增1

             */
            this.minus = function() {
                var self = this;
                var status = self.status;
                var v = self.get(status);
                v--;
                self.set(status, v);
            };


            //构造

            this._init = function() {
                var self = this;
                ft.html('').append(self.ctime);
                ft.append(self.button);
                self.render();
                self.popupannel.on('click', function(e) {
                    var el = Node(e.target);
                    if (el.hasClass('x')) {//关闭
                        self.hidePopup();
                    } else if (el.hasClass('item')) {//点选一个值
                        var v = Number(el.html());
                        self.set(self.status, v);
                        self.hidePopup();
                    }
                });
                //确定的动作

                self.button.on('click', function() {
                    //初始化读取父框的date

                    var d = typeof self.father.dt_date == 'undefined' ? self.father.date : self.father.dt_date;
                    d.setHours(self.get('h'));
                    d.setMinutes(self.get('m'));
                    d.setSeconds(self.get('s'));
                    self.father.fire('timeSelect', {
                        date:d
                    });
                    if (self.father.popup && self.father.closable) {
                        self.father.hide();
                    }
                });
                //ctime上的键盘事件，上下键，左右键的监听
                //TODO 考虑是否去掉


                self.ctime.on('keyup', function(e) {
                    if (e.keyCode == 38 || e.keyCode == 37) {//up or left
                        //e.stopPropagation();
                        e.preventDefault();
                        self.add();
                    }
                    if (e.keyCode == 40 || e.keyCode == 39) {//down or right
                        //e.stopPropagation();
                        e.preventDefault();
                        self.minus();
                    }
                });
                //上的箭头动作

                self.ctime.one('.u').on('click', function() {
                    self.hidePopup();
                    self.add();
                });
                //下的箭头动作

                self.ctime.one('.d').on('click', function() {
                    self.hidePopup();
                    self.minus();
                });
                //弹出选择小时

                self.ctime.one('.h').on('click', function() {
                    var in_str = self.parseSubHtml(self.h_a);
                    self.status = 'h';
                    self.showPopup(in_str);
                });
                //弹出选择分钟

                self.ctime.one('.m').on('click', function() {
                    var in_str = self.parseSubHtml(self.m_a);
                    self.status = 'm';
                    self.showPopup(in_str);
                });
                //弹出选择秒

                self.ctime.one('.s').on('click', function() {
                    var in_str = self.parseSubHtml(self.s_a);
                    self.status = 's';
                    self.showPopup(in_str);
                });


            };
            this._init();


        }

    });

    return Calendar;

}, { requires:["node","calendar/base"] });
