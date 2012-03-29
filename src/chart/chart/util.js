


/*! @source http://purl.eligrey.com/github/color.js/blob/master/color.js*/
KISSY.add(function(S) {
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

