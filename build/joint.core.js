(function(root, factory) {

    if (typeof define === 'function' && define.amd) {

        // For AMD.

        define(['backbone', 'lodash', 'jquery'], function(Backbone, _, $) {

            Backbone.$ = $;

            return factory(root, Backbone, _, $);
        });

    } else if (typeof exports !== 'undefined') {

        // For Node.js or CommonJS.

        var Backbone = require('backbone');
        var _ = require('lodash');
        var $ = Backbone.$ = require('jquery');

        module.exports = factory(root, Backbone, _, $);

    } else {

        // As a browser global.

        var Backbone = root.Backbone;
        var _ = root._;
        var $ = Backbone.$ = root.jQuery || root.$;

        root.joint = factory(root, Backbone, _, $);
        root.g = root.joint.g;
        root.V = root.Vectorizer = root.joint.V;
    }

}(this, function(root, Backbone, _, $) {

(function() {

    /**
     * version: 0.3.0
     * git://github.com/davidchambers/Base64.js.git
     */

    var object = typeof exports != 'undefined' ? exports : this; // #8: web workers
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

    function InvalidCharacterError(message) {
        this.message = message;
    }

    InvalidCharacterError.prototype = new Error;
    InvalidCharacterError.prototype.name = 'InvalidCharacterError';

    // encoder
    // [https://gist.github.com/999166] by [https://github.com/nignag]
    object.btoa || (
        object.btoa = function(input) {
            var str = String(input);
            for (
                // initialize result and counter
                var block, charCode, idx = 0, map = chars, output = '';
                // if the next str index does not exist:
                //   change the mapping table to "="
                //   check if d has no fractional digits
                str.charAt(idx | 0) || (map = '=', idx % 1);
                // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
                output += map.charAt(63 & block >> 8 - idx % 1 * 8)
            ) {
                charCode = str.charCodeAt(idx += 3 / 4);
                if (charCode > 0xFF) {
                    throw new InvalidCharacterError("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
                }
                block = block << 8 | charCode;
            }
            return output;
        });

    // decoder
    // [https://gist.github.com/1020396] by [https://github.com/atk]
    object.atob || (
        object.atob = function(input) {
            var str = String(input).replace(/=+$/, '');
            if (str.length % 4 == 1) {
                throw new InvalidCharacterError("'atob' failed: The string to be decoded is not correctly encoded.");
            }
            for (
                // initialize result and counters
                var bc = 0, bs, buffer, idx = 0, output = '';
                // get next character
                // eslint-disable-next-line no-cond-assign
                buffer = str.charAt(idx++);
                // character found in table? initialize bit storage and add its ascii value;
                ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
                    // and if not first of each 4 characters,
                    // convert the first 8 bits to one ascii character
                bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
            ) {
                // try to find character in table (0-63, not found => -1)
                buffer = chars.indexOf(buffer);
            }
            return output;
        });

}());

(function() {

    if (typeof Uint8Array !== 'undefined' || typeof window === 'undefined') {
        return;
    }

    function subarray(start, end) {
        return this.slice(start, end);
    }

    function set_(array, offset) {

        if (arguments.length < 2) {
            offset = 0;
        }
        for (var i = 0, n = array.length; i < n; ++i, ++offset) {
            this[offset] = array[i] & 0xFF;
        }
    }

    // we need typed arrays
    function TypedArray(arg1) {

        var result;
        if (typeof arg1 === 'number') {
            result = new Array(arg1);
            for (var i = 0; i < arg1; ++i) {
                result[i] = 0;
            }
        } else {
            result = arg1.slice(0);
        }
        result.subarray = subarray;
        result.buffer = result;
        result.byteLength = result.length;
        result.set = set_;
        if (typeof arg1 === 'object' && arg1.buffer) {
            result.buffer = arg1.buffer;
        }

        return result;
    }

    window.Uint8Array = TypedArray;
    window.Uint32Array = TypedArray;
    window.Int32Array = TypedArray;
})();

/**
 * make xhr.response = 'arraybuffer' available for the IE9
 */
(function() {

    if (typeof XMLHttpRequest === 'undefined') {
        return;
    }

    if ('response' in XMLHttpRequest.prototype ||
        'mozResponseArrayBuffer' in XMLHttpRequest.prototype ||
        'mozResponse' in XMLHttpRequest.prototype ||
        'responseArrayBuffer' in XMLHttpRequest.prototype) {
        return;
    }

    Object.defineProperty(XMLHttpRequest.prototype, 'response', {
        get: function() {
            return new Uint8Array(new VBArray(this.responseBody).toArray());
        }
    });
})();

// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, 'includes', {
        value: function(searchElement, fromIndex) {

            // 1. Let O be ? ToObject(this value).
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }

            var o = Object(this);

            // 2. Let len be ? ToLength(? Get(O, "length")).
            var len = o.length >>> 0;

            // 3. If len is 0, return false.
            if (len === 0) {
                return false;
            }

            // 4. Let n be ? ToInteger(fromIndex).
            //    (If fromIndex is undefined, this step produces the value 0.)
            var n = fromIndex | 0;

            // 5. If n ≥ 0, then
            //  a. Let k be n.
            // 6. Else n < 0,
            //  a. Let k be len + n.
            //  b. If k < 0, let k be 0.
            var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

            function sameValueZero(x, y) {
                return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
            }

            // 7. Repeat, while k < len
            while (k < len) {
                // a. Let elementK be the result of ? Get(O, ! ToString(k)).
                // b. If SameValueZero(searchElement, elementK) is true, return true.
                // c. Increase k by 1.
                if (sameValueZero(o[k], searchElement)) {
                    return true;
                }
                k++;
            }

            // 8. Return false
            return false;
        }
    });
}

// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
        value: function(predicate) {
            // 1. Let O be ? ToObject(this value).
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }

            var o = Object(this);

            // 2. Let len be ? ToLength(? Get(O, "length")).
            var len = o.length >>> 0;

            // 3. If IsCallable(predicate) is false, throw a TypeError exception.
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }

            // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
            var thisArg = arguments[1];

            // 5. Let k be 0.
            var k = 0;

            // 6. Repeat, while k < len
            while (k < len) {
                // a. Let Pk be ! ToString(k).
                // b. Let kValue be ? Get(O, Pk).
                // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                // d. If testResult is true, return kValue.
                var kValue = o[k];
                if (predicate.call(thisArg, kValue, k, o)) {
                    return kValue;
                }
                // e. Increase k by 1.
                k++;
            }

            // 7. Return undefined.
            return undefined;
        }
    });
}

// Production steps of ECMA-262, Edition 6, 22.1.2.1
if (!Array.from) {
    Array.from = (function () {
        var toStr = Object.prototype.toString;
        var isCallable = function (fn) {
            return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
        };
        var toInteger = function (value) {
            var number = Number(value);
            if (isNaN(number)) { return 0; }
            if (number === 0 || !isFinite(number)) { return number; }
            return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
        };
        var maxSafeInteger = Math.pow(2, 53) - 1;
        var toLength = function (value) {
            var len = toInteger(value);
            return Math.min(Math.max(len, 0), maxSafeInteger);
        };

        // The length property of the from method is 1.
        return function from(arrayLike/*, mapFn, thisArg */) {
            // 1. Let C be the this value.
            var C = this;

            // 2. Let items be ToObject(arrayLike).
            var items = Object(arrayLike);

            // 3. ReturnIfAbrupt(items).
            if (arrayLike == null) {
                throw new TypeError('Array.from requires an array-like object - not null or undefined');
            }

            // 4. If mapfn is undefined, then let mapping be false.
            var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
            var T;
            if (typeof mapFn !== 'undefined') {
                // 5. else
                // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
                if (!isCallable(mapFn)) {
                    throw new TypeError('Array.from: when provided, the second argument must be a function');
                }

                // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
                if (arguments.length > 2) {
                    T = arguments[2];
                }
            }

            // 10. Let lenValue be Get(items, "length").
            // 11. Let len be ToLength(lenValue).
            var len = toLength(items.length);

            // 13. If IsConstructor(C) is true, then
            // 13. a. Let A be the result of calling the [[Construct]] internal method
            // of C with an argument list containing the single item len.
            // 14. a. Else, Let A be ArrayCreate(len).
            var A = isCallable(C) ? Object(new C(len)) : new Array(len);

            // 16. Let k be 0.
            var k = 0;
            // 17. Repeat, while k < len… (also steps a - h)
            var kValue;
            while (k < len) {
                kValue = items[k];
                if (mapFn) {
                    A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
                } else {
                    A[k] = kValue;
                }
                k += 1;
            }
            // 18. Let putStatus be Put(A, "length", len, true).
            A.length = len;
            // 20. Return A.
            return A;
        };
    }());
}

// https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
if (!Array.prototype.findIndex) {
    Object.defineProperty(Array.prototype, 'findIndex', {
        value: function(predicate) {
            // 1. Let O be ? ToObject(this value).
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }

            var o = Object(this);

            // 2. Let len be ? ToLength(? Get(O, "length")).
            var len = o.length >>> 0;

            // 3. If IsCallable(predicate) is false, throw a TypeError exception.
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }

            // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
            var thisArg = arguments[1];

            // 5. Let k be 0.
            var k = 0;

            // 6. Repeat, while k < len
            while (k < len) {
                // a. Let Pk be ! ToString(k).
                // b. Let kValue be ? Get(O, Pk).
                // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                // d. If testResult is true, return k.
                var kValue = o[k];
                if (predicate.call(thisArg, kValue, k, o)) {
                    return k;
                }
                // e. Increase k by 1.
                k++;
            }

            // 7. Return -1.
            return -1;
        }
    });
}

Number.isFinite = Number.isFinite || function(value) {
    return typeof value === 'number' && isFinite(value);
};

//The following works because NaN is the only value in javascript which is not equal to itself.
Number.isNaN = Number.isNaN || function(value) {
    return value !== value;
}



//      Geometry library.

var g = (function() {

    var g = {};

    // Declare shorthands to the most used math functions.
    var math = Math;
    var abs = math.abs;
    var cos = math.cos;
    var sin = math.sin;
    var sqrt = math.sqrt;
    var mmin = math.min;
    var mmax = math.max;
    var atan2 = math.atan2;
    var round = math.round;
    var floor = math.floor;
    var PI = math.PI;
    var random = math.random;
    var pow = math.pow;

    g.bezier = {

        // Cubic Bezier curve path through points.
        // Ported from C# implementation by Oleg V. Polikarpotchkin and Peter Lee (http://www.codeproject.com/KB/graphics/BezierSpline.aspx).
        // @param {array} points Array of points through which the smooth line will go.
        // @return {array} SVG Path commands as an array
        curveThroughPoints: function(points) {

            var controlPoints = this.getCurveControlPoints(points);
            var path = ['M', points[0].x, points[0].y];

            for (var i = 0; i < controlPoints[0].length; i++) {
                path.push('C', controlPoints[0][i].x, controlPoints[0][i].y, controlPoints[1][i].x, controlPoints[1][i].y, points[i + 1].x, points[i + 1].y);
            }

            return path;
        },

        // Get open-ended Bezier Spline Control Points.
        // @param knots Input Knot Bezier spline points (At least two points!).
        // @param firstControlPoints Output First Control points. Array of knots.length - 1 length.
        // @param secondControlPoints Output Second Control points. Array of knots.length - 1 length.
        getCurveControlPoints: function(knots) {

            var firstControlPoints = [];
            var secondControlPoints = [];
            var n = knots.length - 1;
            var i;

            // Special case: Bezier curve should be a straight line.
            if (n == 1) {
                // 3P1 = 2P0 + P3
                firstControlPoints[0] = Point((2 * knots[0].x + knots[1].x) / 3,
                                              (2 * knots[0].y + knots[1].y) / 3);
                // P2 = 2P1 – P0
                secondControlPoints[0] = Point(2 * firstControlPoints[0].x - knots[0].x,
                                               2 * firstControlPoints[0].y - knots[0].y);
                return [firstControlPoints, secondControlPoints];
            }

            // Calculate first Bezier control points.
            // Right hand side vector.
            var rhs = [];

            // Set right hand side X values.
            for (i = 1; i < n - 1; i++) {
                rhs[i] = 4 * knots[i].x + 2 * knots[i + 1].x;
            }
            rhs[0] = knots[0].x + 2 * knots[1].x;
            rhs[n - 1] = (8 * knots[n - 1].x + knots[n].x) / 2.0;
            // Get first control points X-values.
            var x = this.getFirstControlPoints(rhs);

            // Set right hand side Y values.
            for (i = 1; i < n - 1; ++i) {
                rhs[i] = 4 * knots[i].y + 2 * knots[i + 1].y;
            }
            rhs[0] = knots[0].y + 2 * knots[1].y;
            rhs[n - 1] = (8 * knots[n - 1].y + knots[n].y) / 2.0;
            // Get first control points Y-values.
            var y = this.getFirstControlPoints(rhs);

            // Fill output arrays.
            for (i = 0; i < n; i++) {
                // First control point.
                firstControlPoints.push(Point(x[i], y[i]));
                // Second control point.
                if (i < n - 1) {
                    secondControlPoints.push(Point(2 * knots [i + 1].x - x[i + 1],
                                                   2 * knots[i + 1].y - y[i + 1]));
                } else {
                    secondControlPoints.push(Point((knots[n].x + x[n - 1]) / 2,
                                                   (knots[n].y + y[n - 1]) / 2));
                }
            }
            return [firstControlPoints, secondControlPoints];
        },

        // Divide a Bezier curve into two at point defined by value 't' <0,1>.
        // Using deCasteljau algorithm. http://math.stackexchange.com/a/317867
        // @param control points (start, control start, control end, end)
        // @return a function accepts t and returns 2 curves each defined by 4 control points.
        getCurveDivider: function(p0, p1, p2, p3) {

            return function divideCurve(t) {

                var l = Line(p0, p1).pointAt(t);
                var m = Line(p1, p2).pointAt(t);
                var n = Line(p2, p3).pointAt(t);
                var p = Line(l, m).pointAt(t);
                var q = Line(m, n).pointAt(t);
                var r = Line(p, q).pointAt(t);
                return [{ p0: p0, p1: l, p2: p, p3: r }, { p0: r, p1: q, p2: n, p3: p3 }];
            };
        },

        // Solves a tridiagonal system for one of coordinates (x or y) of first Bezier control points.
        // @param rhs Right hand side vector.
        // @return Solution vector.
        getFirstControlPoints: function(rhs) {

            var n = rhs.length;
            // `x` is a solution vector.
            var x = [];
            var tmp = [];
            var b = 2.0;

            x[0] = rhs[0] / b;
            // Decomposition and forward substitution.
            for (var i = 1; i < n; i++) {
                tmp[i] = 1 / b;
                b = (i < n - 1 ? 4.0 : 3.5) - tmp[i];
                x[i] = (rhs[i] - x[i - 1]) / b;
            }
            for (i = 1; i < n; i++) {
                // Backsubstitution.
                x[n - i - 1] -= tmp[n - i] * x[n - i];
            }
            return x;
        },

        // Solves an inversion problem -- Given the (x, y) coordinates of a point which lies on
        // a parametric curve x = x(t)/w(t), y = y(t)/w(t), ﬁnd the parameter value t
        // which corresponds to that point.
        // @param control points (start, control start, control end, end)
        // @return a function accepts a point and returns t.
        getInversionSolver: function(p0, p1, p2, p3) {

            var pts = arguments;
            function l(i, j) {
                // calculates a determinant 3x3
                // [p.x  p.y  1]
                // [pi.x pi.y 1]
                // [pj.x pj.y 1]
                var pi = pts[i];
                var pj = pts[j];
                return function(p) {
                    var w = (i % 3 ? 3 : 1) * (j % 3 ? 3 : 1);
                    var lij = p.x * (pi.y - pj.y) + p.y * (pj.x - pi.x) + pi.x * pj.y - pi.y * pj.x;
                    return w * lij;
                };
            }
            return function solveInversion(p) {
                var ct = 3 * l(2, 3)(p1);
                var c1 = l(1, 3)(p0) / ct;
                var c2 = -l(2, 3)(p0) / ct;
                var la = c1 * l(3, 1)(p) + c2 * (l(3, 0)(p) + l(2, 1)(p)) + l(2, 0)(p);
                var lb = c1 * l(3, 0)(p) + c2 * l(2, 0)(p) + l(1, 0)(p);
                return lb / (lb - la);
            };
        }
    };

    var Ellipse = g.Ellipse = function(c, a, b) {

        if (!(this instanceof Ellipse)) {
            return new Ellipse(c, a, b);
        }

        if (c instanceof Ellipse) {
            return new Ellipse(Point(c), c.a, c.b);
        }

        c = Point(c);
        this.x = c.x;
        this.y = c.y;
        this.a = a;
        this.b = b;
    };

    g.Ellipse.fromRect = function(rect) {

        rect = Rect(rect);
        return Ellipse(rect.center(), rect.width / 2, rect.height / 2);
    };

    g.Ellipse.prototype = {

        bbox: function() {

            return Rect(this.x - this.a, this.y - this.b, 2 * this.a, 2 * this.b);
        },

        clone: function() {

            return Ellipse(this);
        },

        /**
         * @param {g.Point} point
         * @returns {number} result < 1 - inside ellipse, result == 1 - on ellipse boundary, result > 1 - outside
         */
        normalizedDistance: function(point) {

            var x0 = point.x;
            var y0 = point.y;
            var a = this.a;
            var b = this.b;
            var x = this.x;
            var y = this.y;

            return ((x0 - x) * (x0 - x)) / (a * a ) + ((y0 - y) * (y0 - y)) / (b * b);
        },

        // inflate by dx and dy
        // @param dx {delta_x} representing additional size to x
        // @param dy {delta_y} representing additional size to y -
        // dy param is not required -> in that case y is sized by dx
        inflate: function(dx, dy) {
            if (dx === undefined) {
                dx = 0;
            }

            if (dy === undefined) {
                dy = dx;
            }

            this.a += 2 * dx;
            this.b += 2 * dy;

            return this;
        },


        /**
         * @param {g.Point} p
         * @returns {boolean}
         */
        containsPoint: function(p) {

            return this.normalizedDistance(p) <= 1;
        },

        /**
         * @returns {g.Point}
         */
        center: function() {

            return Point(this.x, this.y);
        },

        /** Compute angle between tangent and x axis
         * @param {g.Point} p Point of tangency, it has to be on ellipse boundaries.
         * @returns {number} angle between tangent and x axis
         */
        tangentTheta: function(p) {

            var refPointDelta = 30;
            var x0 = p.x;
            var y0 = p.y;
            var a = this.a;
            var b = this.b;
            var center = this.bbox().center();
            var m = center.x;
            var n = center.y;

            var q1 = x0 > center.x + a / 2;
            var q3 = x0 < center.x - a / 2;

            var y, x;
            if (q1 || q3) {
                y = x0 > center.x ? y0 - refPointDelta : y0 + refPointDelta;
                x = (a * a / (x0 - m)) - (a * a * (y0 - n) * (y - n)) / (b * b * (x0 - m)) + m;
            } else {
                x = y0 > center.y ? x0 + refPointDelta : x0 - refPointDelta;
                y = ( b * b / (y0 - n)) - (b * b * (x0 - m) * (x - m)) / (a * a * (y0 - n)) + n;
            }

            return g.point(x, y).theta(p);

        },

        equals: function(ellipse) {

            ellipse = Ellipse(ellipse);
            return ellipse.x === this.x &&
                    ellipse.y === this.y &&
                    ellipse.a === this.a &&
                    ellipse.b === this.b;
        },

        // Find point on me where line from my center to
        // point p intersects my boundary.
        // @param {number} angle If angle is specified, intersection with rotated ellipse is computed.
        intersectionWithLineFromCenterToPoint: function(p, angle) {

            p = Point(p);
            if (angle) p.rotate(Point(this.x, this.y), angle);
            var dx = p.x - this.x;
            var dy = p.y - this.y;
            var result;
            if (dx === 0) {
                result = this.bbox().pointNearestToPoint(p);
                if (angle) return result.rotate(Point(this.x, this.y), -angle);
                return result;
            }
            var m = dy / dx;
            var mSquared = m * m;
            var aSquared = this.a * this.a;
            var bSquared = this.b * this.b;
            var x = sqrt(1 / ((1 / aSquared) + (mSquared / bSquared)));

            x = dx < 0 ? -x : x;
            var y = m * x;
            result = Point(this.x + x, this.y + y);
            if (angle) return result.rotate(Point(this.x, this.y), -angle);
            return result;
        },

        toString: function() {

            return Point(this.x, this.y).toString() + ' ' + this.a + ' ' + this.b;
        }
    };

    var Line = g.Line = function(p1, p2) {

        if (!(this instanceof Line)) {
            return new Line(p1, p2);
        }

        if (p1 instanceof Line) {
            return Line(p1.start, p1.end);
        }

        this.start = Point(p1);
        this.end = Point(p2);
    };

    g.Line.prototype = {

        // @return the bearing (cardinal direction) of the line. For example N, W, or SE.
        // @returns {String} One of the following bearings : NE, E, SE, S, SW, W, NW, N.
        bearing: function() {

            var lat1 = toRad(this.start.y);
            var lat2 = toRad(this.end.y);
            var lon1 = this.start.x;
            var lon2 = this.end.x;
            var dLon = toRad(lon2 - lon1);
            var y = sin(dLon) * cos(lat2);
            var x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dLon);
            var brng = toDeg(atan2(y, x));

            var bearings = ['NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];

            var index = brng - 22.5;
            if (index < 0)
                index += 360;
            index = parseInt(index / 45);

            return bearings[index];
        },

        clone: function() {

            return Line(this.start, this.end);
        },

        equals: function(l) {

            return this.start.x === l.start.x &&
                    this.start.y === l.start.y &&
                    this.end.x === l.end.x &&
                    this.end.y === l.end.y;
        },

        // @return {point} Point where I'm intersecting a line.
        // @return [point] Points where I'm intersecting a rectangle.
        // @see Squeak Smalltalk, LineSegment>>intersectionWith:
        intersect: function(l) {

            if (l instanceof Line) {
                // Passed in parameter is a line.

                var pt1Dir = Point(this.end.x - this.start.x, this.end.y - this.start.y);
                var pt2Dir = Point(l.end.x - l.start.x, l.end.y - l.start.y);
                var det = (pt1Dir.x * pt2Dir.y) - (pt1Dir.y * pt2Dir.x);
                var deltaPt = Point(l.start.x - this.start.x, l.start.y - this.start.y);
                var alpha = (deltaPt.x * pt2Dir.y) - (deltaPt.y * pt2Dir.x);
                var beta = (deltaPt.x * pt1Dir.y) - (deltaPt.y * pt1Dir.x);

                if (det === 0 ||
                    alpha * det < 0 ||
                    beta * det < 0) {
                    // No intersection found.
                    return null;
                }
                if (det > 0) {
                    if (alpha > det || beta > det) {
                        return null;
                    }
                } else {
                    if (alpha < det || beta < det) {
                        return null;
                    }
                }
                return Point(this.start.x + (alpha * pt1Dir.x / det),
                             this.start.y + (alpha * pt1Dir.y / det));

            } else if (l instanceof Rect) {
                // Passed in parameter is a rectangle.

                var r = l;
                var rectLines = [ r.topLine(), r.rightLine(), r.bottomLine(), r.leftLine() ];
                var points = [];
                var dedupeArr = [];
                var pt, i;

                for (i = 0; i < rectLines.length; i ++) {
                    pt = this.intersect(rectLines[i]);
                    if (pt !== null && dedupeArr.indexOf(pt.toString()) < 0) {
                        points.push(pt);
                        dedupeArr.push(pt.toString());
                    }
                }

                return points.length > 0 ? points : null;
            }

            // Passed in parameter is neither a Line nor a Rectangle.
            return null;
        },

        // @return {double} length of the line
        length: function() {
            return sqrt(this.squaredLength());
        },

        // @return {point} my midpoint
        midpoint: function() {
            return Point((this.start.x + this.end.x) / 2,
                         (this.start.y + this.end.y) / 2);
        },

        // @return {point} my point at 't' <0,1>
        pointAt: function(t) {

            var x = (1 - t) * this.start.x + t * this.end.x;
            var y = (1 - t) * this.start.y + t * this.end.y;
            return Point(x, y);
        },

        // @return {number} the offset of the point `p` from the line. + if the point `p` is on the right side of the line, - if on the left and 0 if on the line.
        pointOffset: function(p) {

            // Find the sign of the determinant of vectors (start,end), where p is the query point.
            return ((this.end.x - this.start.x) * (p.y - this.start.y) - (this.end.y - this.start.y) * (p.x - this.start.x)) / 2;
        },

        // @return vector {point} of the line
        vector: function() {

            return Point(this.end.x - this.start.x, this.end.y - this.start.y);
        },

        // @return {point} the closest point on the line to point `p`
        closestPoint: function(p) {

            return this.pointAt(this.closestPointNormalizedLength(p));
        },

        // @return {number} the normalized length of the closest point on the line to point `p`
        closestPointNormalizedLength: function(p) {

            var product = this.vector().dot(Line(this.start, p).vector());

            return Math.min(1, Math.max(0, product / this.squaredLength()));
        },

        // @return {integer} length without sqrt
        // @note for applications where the exact length is not necessary (e.g. compare only)
        squaredLength: function() {
            var x0 = this.start.x;
            var y0 = this.start.y;
            var x1 = this.end.x;
            var y1 = this.end.y;
            return (x0 -= x1) * x0 + (y0 -= y1) * y0;
        },

        toString: function() {
            return this.start.toString() + ' ' + this.end.toString();
        }
    };

    // For backwards compatibility:
    g.Line.prototype.intersection = g.Line.prototype.intersect;

    /*
        Point is the most basic object consisting of x/y coordinate.

        Possible instantiations are:
        * `Point(10, 20)`
        * `new Point(10, 20)`
        * `Point('10 20')`
        * `Point(Point(10, 20))`
    */
    var Point = g.Point = function(x, y) {

        if (!(this instanceof Point)) {
            return new Point(x, y);
        }

        if (typeof x === 'string') {
            var xy = x.split(x.indexOf('@') === -1 ? ' ' : '@');
            x = parseInt(xy[0], 10);
            y = parseInt(xy[1], 10);
        } else if (Object(x) === x) {
            y = x.y;
            x = x.x;
        }

        this.x = x === undefined ? 0 : x;
        this.y = y === undefined ? 0 : y;
    };

    // Alternative constructor, from polar coordinates.
    // @param {number} Distance.
    // @param {number} Angle in radians.
    // @param {point} [optional] Origin.
    g.Point.fromPolar = function(distance, angle, origin) {

        origin = (origin && Point(origin)) || Point(0, 0);
        var x = abs(distance * cos(angle));
        var y = abs(distance * sin(angle));
        var deg = normalizeAngle(toDeg(angle));

        if (deg < 90) {
            y = -y;
        } else if (deg < 180) {
            x = -x;
            y = -y;
        } else if (deg < 270) {
            x = -x;
        }

        return Point(origin.x + x, origin.y + y);
    };

    // Create a point with random coordinates that fall into the range `[x1, x2]` and `[y1, y2]`.
    g.Point.random = function(x1, x2, y1, y2) {

        return Point(floor(random() * (x2 - x1 + 1) + x1), floor(random() * (y2 - y1 + 1) + y1));
    };

    g.Point.prototype = {

        // If point lies outside rectangle `r`, return the nearest point on the boundary of rect `r`,
        // otherwise return point itself.
        // (see Squeak Smalltalk, Point>>adhereTo:)
        adhereToRect: function(r) {

            if (r.containsPoint(this)) {
                return this;
            }

            this.x = mmin(mmax(this.x, r.x), r.x + r.width);
            this.y = mmin(mmax(this.y, r.y), r.y + r.height);
            return this;
        },

        // Return the bearing between me and the given point.
        bearing: function(point) {

            return Line(this, point).bearing();
        },

        // Returns change in angle from my previous position (-dx, -dy) to my new position
        // relative to ref point.
        changeInAngle: function(dx, dy, ref) {

            // Revert the translation and measure the change in angle around x-axis.
            return Point(this).offset(-dx, -dy).theta(ref) - this.theta(ref);
        },

        clone: function() {

            return Point(this);
        },

        difference: function(dx, dy) {

            if ((Object(dx) === dx)) {
                dy = dx.y;
                dx = dx.x;
            }

            return Point(this.x - (dx || 0), this.y - (dy || 0));
        },

        // Returns distance between me and point `p`.
        distance: function(p) {

            return Line(this, p).length();
        },

        squaredDistance: function(p) {

            return Line(this, p).squaredLength();
        },

        equals: function(p) {

            return this.x === p.x && this.y === p.y;
        },

        magnitude: function() {

            return sqrt((this.x * this.x) + (this.y * this.y)) || 0.01;
        },

        // Returns a manhattan (taxi-cab) distance between me and point `p`.
        manhattanDistance: function(p) {

            return abs(p.x - this.x) + abs(p.y - this.y);
        },

        // Move point on line starting from ref ending at me by
        // distance distance.
        move: function(ref, distance) {

            var theta = toRad(Point(ref).theta(this));
            return this.offset(cos(theta) * distance, -sin(theta) * distance);
        },

        // Scales x and y such that the distance between the point and the origin (0,0) is equal to the given length.
        normalize: function(length) {

            var scale = (length || 1) / this.magnitude();
            return this.scale(scale, scale);
        },

        // Offset me by the specified amount.
        offset: function(dx, dy) {

            if ((Object(dx) === dx)) {
                dy = dx.y;
                dx = dx.x;
            }

            this.x += dx || 0;
            this.y += dy || 0;
            return this;
        },

        // Returns a point that is the reflection of me with
        // the center of inversion in ref point.
        reflection: function(ref) {

            return Point(ref).move(this, this.distance(ref));
        },

        // Rotate point by angle around origin.
        rotate: function(origin, angle) {

            angle = (angle + 360) % 360;
            this.toPolar(origin);
            this.y += toRad(angle);
            var point = Point.fromPolar(this.x, this.y, origin);
            this.x = point.x;
            this.y = point.y;
            return this;
        },

        round: function(precision) {

            var f = pow(10, precision || 0);
            this.x = round(this.x * f) / f;
            this.y = round(this.y * f) / f;
            return this;
        },

        // Scale point with origin.
        scale: function(sx, sy, origin) {

            origin = (origin && Point(origin)) || Point(0, 0);
            this.x = origin.x + sx * (this.x - origin.x);
            this.y = origin.y + sy * (this.y - origin.y);
            return this;
        },

        snapToGrid: function(gx, gy) {

            this.x = snapToGrid(this.x, gx);
            this.y = snapToGrid(this.y, gy || gx);
            return this;
        },

        // Compute the angle between me and `p` and the x axis.
        // (cartesian-to-polar coordinates conversion)
        // Return theta angle in degrees.
        theta: function(p) {

            p = Point(p);
            // Invert the y-axis.
            var y = -(p.y - this.y);
            var x = p.x - this.x;
            var rad = atan2(y, x); // defined for all 0 corner cases
            
            // Correction for III. and IV. quadrant.
            if (rad < 0) {
                rad = 2 * PI + rad;
            }
            return 180 * rad / PI;
        },

        // Compute the angle between vector from me to p1 and the vector from me to p2.
        // ordering of points p1 and p2 is important!
        // theta function's angle convention:
        // returns angles between 0 and 180 when the angle is counterclockwise
        // returns angles between 180 and 360 to convert clockwise angles into counterclockwise ones
        // returns NaN if any of the points p1, p2 is coincident with this point
        angleBetween: function(p1, p2) {
            
            var angleBetween = (this.equals(p1) || this.equals(p2)) ? NaN : (this.theta(p2) - this.theta(p1));
            if (angleBetween < 0) {
                angleBetween += 360; // correction to keep angleBetween between 0 and 360
            }
            return angleBetween;
        },

        // Compute the angle between the vector from 0,0 to me and the vector from 0,0 to p.
        // Returns NaN if p is at 0,0.
        vectorAngle: function(p) {
            
            var zero = Point(0,0);
            return zero.angleBetween(this, p);
        },

        toJSON: function() {

            return { x: this.x, y: this.y };
        },

        // Converts rectangular to polar coordinates.
        // An origin can be specified, otherwise it's 0@0.
        toPolar: function(o) {

            o = (o && Point(o)) || Point(0, 0);
            var x = this.x;
            var y = this.y;
            this.x = sqrt((x - o.x) * (x - o.x) + (y - o.y) * (y - o.y)); // r
            this.y = toRad(o.theta(Point(x, y)));
            return this;
        },

        toString: function() {

            return this.x + '@' + this.y;
        },

        update: function(x, y) {

            this.x = x || 0;
            this.y = y || 0;
            return this;
        },

        // Returns the dot product of this point with given other point
        dot: function(p) {

            return p ? (this.x * p.x + this.y * p.y) : NaN;
        },

        // Returns the cross product of this point relative to two other points
        // this point is the common point
        // point p1 lies on the first vector, point p2 lies on the second vector
        // watch out for the ordering of points p1 and p2!
        // positive result indicates a clockwise ("right") turn from first to second vector
        // negative result indicates a counterclockwise ("left") turn from first to second vector
        // note that the above directions are reversed from the usual answer on the Internet
        // that is because we are in a left-handed coord system (because the y-axis points downward)
        cross: function(p1, p2) {

            return (p1 && p2) ? (((p2.x - this.x) * (p1.y - this.y)) - ((p2.y - this.y) * (p1.x - this.x))) : NaN;
        }
    };

    var Rect = g.Rect = function(x, y, w, h) {

        if (!(this instanceof Rect)) {
            return new Rect(x, y, w, h);
        }

        if ((Object(x) === x)) {
            y = x.y;
            w = x.width;
            h = x.height;
            x = x.x;
        }

        this.x = x === undefined ? 0 : x;
        this.y = y === undefined ? 0 : y;
        this.width = w === undefined ? 0 : w;
        this.height = h === undefined ? 0 : h;
    };

    g.Rect.fromEllipse = function(e) {

        e = Ellipse(e);
        return Rect(e.x - e.a, e.y - e.b, 2 * e.a, 2 * e.b);
    };

    g.Rect.prototype = {

        // Find my bounding box when I'm rotated with the center of rotation in the center of me.
        // @return r {rectangle} representing a bounding box
        bbox: function(angle) {

            var theta = toRad(angle || 0);
            var st = abs(sin(theta));
            var ct = abs(cos(theta));
            var w = this.width * ct + this.height * st;
            var h = this.width * st + this.height * ct;
            return Rect(this.x + (this.width - w) / 2, this.y + (this.height - h) / 2, w, h);
        },

        bottomLeft: function() {

            return Point(this.x, this.y + this.height);
        },

        bottomLine: function() {

            return Line(this.bottomLeft(), this.corner());
        },

        bottomMiddle: function() {

            return Point(this.x + this.width / 2, this.y + this.height);
        },

        center: function() {

            return Point(this.x + this.width / 2, this.y + this.height / 2);
        },

        clone: function() {

            return Rect(this);
        },

        // @return {bool} true if point p is insight me
        containsPoint: function(p) {

            p = Point(p);
            return p.x >= this.x && p.x <= this.x + this.width && p.y >= this.y && p.y <= this.y + this.height;
        },

        // @return {bool} true if rectangle `r` is inside me.
        containsRect: function(r) {

            var r0 = Rect(this).normalize();
            var r1 = Rect(r).normalize();
            var w0 = r0.width;
            var h0 = r0.height;
            var w1 = r1.width;
            var h1 = r1.height;

            if (!w0 || !h0 || !w1 || !h1) {
                // At least one of the dimensions is 0
                return false;
            }

            var x0 = r0.x;
            var y0 = r0.y;
            var x1 = r1.x;
            var y1 = r1.y;

            w1 += x1;
            w0 += x0;
            h1 += y1;
            h0 += y0;

            return x0 <= x1 && w1 <= w0 && y0 <= y1 && h1 <= h0;
        },

        corner: function() {

            return Point(this.x + this.width, this.y + this.height);
        },

        // @return {boolean} true if rectangles are equal.
        equals: function(r) {

            var mr = Rect(this).normalize();
            var nr = Rect(r).normalize();
            return mr.x === nr.x && mr.y === nr.y && mr.width === nr.width && mr.height === nr.height;
        },

        // @return {rect} if rectangles intersect, {null} if not.
        intersect: function(r) {

            var myOrigin = this.origin();
            var myCorner = this.corner();
            var rOrigin = r.origin();
            var rCorner = r.corner();

            // No intersection found
            if (rCorner.x <= myOrigin.x ||
                rCorner.y <= myOrigin.y ||
                rOrigin.x >= myCorner.x ||
                rOrigin.y >= myCorner.y) return null;

            var x = Math.max(myOrigin.x, rOrigin.x);
            var y = Math.max(myOrigin.y, rOrigin.y);

            return Rect(x, y, Math.min(myCorner.x, rCorner.x) - x, Math.min(myCorner.y, rCorner.y) - y);
        },

        // Find point on my boundary where line starting
        // from my center ending in point p intersects me.
        // @param {number} angle If angle is specified, intersection with rotated rectangle is computed.
        intersectionWithLineFromCenterToPoint: function(p, angle) {

            p = Point(p);
            var center = Point(this.x + this.width / 2, this.y + this.height / 2);
            var result;
            if (angle) p.rotate(center, angle);

            // (clockwise, starting from the top side)
            var sides = [
                Line(this.origin(), this.topRight()),
                Line(this.topRight(), this.corner()),
                Line(this.corner(), this.bottomLeft()),
                Line(this.bottomLeft(), this.origin())
            ];
            var connector = Line(center, p);

            for (var i = sides.length - 1; i >= 0; --i) {
                var intersection = sides[i].intersection(connector);
                if (intersection !== null) {
                    result = intersection;
                    break;
                }
            }
            if (result && angle) result.rotate(center, -angle);
            return result;
        },

        leftLine: function() {

            return Line(this.origin(), this.bottomLeft());
        },

        leftMiddle: function() {

            return Point(this.x , this.y + this.height / 2);
        },

        // Move and expand me.
        // @param r {rectangle} representing deltas
        moveAndExpand: function(r) {

            this.x += r.x || 0;
            this.y += r.y || 0;
            this.width += r.width || 0;
            this.height += r.height || 0;
            return this;
        },

        // inflate by dx and dy, recompute origin [x, y]
        // @param dx {delta_x} representing additional size to x
        // @param dy {delta_y} representing additional size to y -
        // dy param is not required -> in that case y is sized by dx
        inflate: function(dx, dy) {
            if (dx === undefined) {
                dx = 0;
            }

            if (dy === undefined) {
                dy = dx;
            }

            this.x -= dx;
            this.y -= dy;
            this.width += 2 * dx;
            this.height += 2 * dy;

            return this;
        },

        // Normalize the rectangle; i.e., make it so that it has a non-negative width and height.
        // If width < 0 the function swaps the left and right corners,
        // and it swaps the top and bottom corners if height < 0
        // like in http://qt-project.org/doc/qt-4.8/qrectf.html#normalized
        normalize: function() {

            var newx = this.x;
            var newy = this.y;
            var newwidth = this.width;
            var newheight = this.height;
            if (this.width < 0) {
                newx = this.x + this.width;
                newwidth = -this.width;
            }
            if (this.height < 0) {
                newy = this.y + this.height;
                newheight = -this.height;
            }
            this.x = newx;
            this.y = newy;
            this.width = newwidth;
            this.height = newheight;
            return this;
        },

        origin: function() {

            return Point(this.x, this.y);
        },

        // @return {point} a point on my boundary nearest to the given point.
        // @see Squeak Smalltalk, Rectangle>>pointNearestTo:
        pointNearestToPoint: function(point) {

            point = Point(point);
            if (this.containsPoint(point)) {
                var side = this.sideNearestToPoint(point);
                switch (side){
                    case 'right': return Point(this.x + this.width, point.y);
                    case 'left': return Point(this.x, point.y);
                    case 'bottom': return Point(point.x, this.y + this.height);
                    case 'top': return Point(point.x, this.y);
                }
            }
            return point.adhereToRect(this);
        },

        rightLine: function() {

            return Line(this.topRight(), this.corner());
        },

        rightMiddle: function() {

            return Point(this.x + this.width, this.y + this.height / 2);
        },

        round: function(precision) {

            var f = pow(10, precision || 0);
            this.x = round(this.x * f) / f;
            this.y = round(this.y * f) / f;
            this.width = round(this.width * f) / f;
            this.height = round(this.height * f) / f;
            return this;
        },

        // Scale rectangle with origin.
        scale: function(sx, sy, origin) {

            origin = this.origin().scale(sx, sy, origin);
            this.x = origin.x;
            this.y = origin.y;
            this.width *= sx;
            this.height *= sy;
            return this;
        },

        maxRectScaleToFit: function(rect, origin) {

            rect = g.Rect(rect);
            origin || (origin = rect.center());

            var sx1, sx2, sx3, sx4, sy1, sy2, sy3, sy4;
            var ox = origin.x;
            var oy = origin.y;

            // Here we find the maximal possible scale for all corner points (for x and y axis) of the rectangle,
            // so when the scale is applied the point is still inside the rectangle.

            sx1 = sx2 = sx3 = sx4 = sy1 = sy2 = sy3 = sy4 = Infinity;

            // Top Left
            var p1 = rect.origin();
            if (p1.x < ox) {
                sx1 = (this.x - ox) / (p1.x - ox);
            }
            if (p1.y < oy) {
                sy1 = (this.y - oy) / (p1.y - oy);
            }
            // Bottom Right
            var p2 = rect.corner();
            if (p2.x > ox) {
                sx2 = (this.x + this.width - ox) / (p2.x - ox);
            }
            if (p2.y > oy) {
                sy2 = (this.y + this.height - oy) / (p2.y - oy);
            }
            // Top Right
            var p3 = rect.topRight();
            if (p3.x > ox) {
                sx3 = (this.x + this.width - ox) / (p3.x - ox);
            }
            if (p3.y < oy) {
                sy3 = (this.y - oy) / (p3.y - oy);
            }
            // Bottom Left
            var p4 = rect.bottomLeft();
            if (p4.x < ox) {
                sx4 = (this.x - ox) / (p4.x - ox);
            }
            if (p4.y > oy) {
                sy4 = (this.y + this.height - oy) / (p4.y - oy);
            }

            return {
                sx: Math.min(sx1, sx2, sx3, sx4),
                sy: Math.min(sy1, sy2, sy3, sy4)
            };
        },

        maxRectUniformScaleToFit: function(rect, origin) {

            var scale = this.maxRectScaleToFit(rect, origin);
            return Math.min(scale.sx, scale.sy);
        },

        // @return {string} (left|right|top|bottom) side which is nearest to point
        // @see Squeak Smalltalk, Rectangle>>sideNearestTo:
        sideNearestToPoint: function(point) {

            point = Point(point);
            var distToLeft = point.x - this.x;
            var distToRight = (this.x + this.width) - point.x;
            var distToTop = point.y - this.y;
            var distToBottom = (this.y + this.height) - point.y;
            var closest = distToLeft;
            var side = 'left';

            if (distToRight < closest) {
                closest = distToRight;
                side = 'right';
            }
            if (distToTop < closest) {
                closest = distToTop;
                side = 'top';
            }
            if (distToBottom < closest) {
                closest = distToBottom;
                side = 'bottom';
            }
            return side;
        },

        snapToGrid: function(gx, gy) {

            var origin = this.origin().snapToGrid(gx, gy);
            var corner = this.corner().snapToGrid(gx, gy);
            this.x = origin.x;
            this.y = origin.y;
            this.width = corner.x - origin.x;
            this.height = corner.y - origin.y;
            return this;
        },

        topLine: function() {

            return Line(this.origin(), this.topRight());
        },

        topMiddle: function() {

            return Point(this.x + this.width / 2, this.y);
        },

        topRight: function() {

            return Point(this.x + this.width, this.y);
        },

        toJSON: function() {

            return { x: this.x, y: this.y, width: this.width, height: this.height };
        },

        toString: function() {

            return this.origin().toString() + ' ' + this.corner().toString();
        },

        // @return {rect} representing the union of both rectangles.
        union: function(rect) {

            var myOrigin = this.origin();
            var myCorner = this.corner();
            var rOrigin = rect.origin();
            var rCorner = rect.corner();

            var originX = Math.min(myOrigin.x, rOrigin.x);
            var originY = Math.min(myOrigin.y, rOrigin.y);
            var cornerX = Math.max(myCorner.x, rCorner.x);
            var cornerY = Math.max(myCorner.y, rCorner.y);

            return Rect(originX, originY, cornerX - originX, cornerY - originY);
        }
    };

    var Polyline = g.Polyline = function(points) {

        if (!(this instanceof Polyline)) {
            return new Polyline(points);
        }

        this.points = (Array.isArray(points)) ? points.map(Point) : [];
    };

    Polyline.prototype = {

        pointAtLength: function(length) {
            var points = this.points;
            var l = 0;
            for (var i = 0, n = points.length - 1; i < n; i++) {
                var a = points[i];
                var b = points[i+1];
                var d = a.distance(b);
                l += d;
                if (length <= l) {
                    return Line(b, a).pointAt(d ? (l - length) / d : 0);
                }
            }
            return null;
        },

        length: function() {
            var points = this.points;
            var length = 0;
            for (var i = 0, n = points.length - 1; i < n; i++) {
                length += points[i].distance(points[i+1]);
            }
            return length;
        },

        closestPoint: function(p) {
            return this.pointAtLength(this.closestPointLength(p));
        },

        closestPointLength: function(p) {
            var points = this.points;
            var pointLength;
            var minSqrDistance = Infinity;
            var length = 0;
            for (var i = 0, n = points.length - 1; i < n; i++) {
                var line = Line(points[i], points[i+1]);
                var lineLength = line.length();
                var cpNormalizedLength = line.closestPointNormalizedLength(p);
                var cp = line.pointAt(cpNormalizedLength);
                var sqrDistance = cp.squaredDistance(p);
                if (sqrDistance < minSqrDistance) {
                    minSqrDistance = sqrDistance;
                    pointLength = length + cpNormalizedLength * lineLength;
                }
                length += lineLength;
            }
            return pointLength;
        },

        toString: function() {

            return this.points + '';
        },

        // Returns a convex-hull polyline from this polyline.
        // this function implements the Graham scan (https://en.wikipedia.org/wiki/Graham_scan)
        // output polyline starts at the first element of the original polyline that is on the hull
        // output polyline then continues clockwise from that point
        convexHull: function() {

            var i;
            var n;

            var points = this.points;

            // step 1: find the starting point - point with the lowest y (if equality, highest x)
            var startPoint;
            n = points.length;
            for (i = 0; i < n; i++) {
                if (startPoint === undefined) {
                    // if this is the first point we see, set it as start point
                    startPoint = points[i];
                } else if (points[i].y < startPoint.y) {
                    // start point should have lowest y from all points
                    startPoint = points[i];
                } else if ((points[i].y === startPoint.y) && (points[i].x > startPoint.x)) {
                    // if two points have the lowest y, choose the one that has highest x
                    // there are no points to the right of startPoint - no ambiguity about theta 0
                    // if there are several coincident start point candidates, first one is reported
                    startPoint = points[i];
                }
            }

            // step 2: sort the list of points
            // sorting by angle between line from startPoint to point and the x-axis (theta)
            
            // step 2a: create the point records = [point, originalIndex, angle]
            var sortedPointRecords = [];
            n = points.length;
            for (i = 0; i < n; i++) {
                var angle = startPoint.theta(points[i]);
                if (angle === 0) {
                    angle = 360; // give highest angle to start point
                    // the start point will end up at end of sorted list
                    // the start point will end up at beginning of hull points list
                }
                
                var entry = [points[i], i, angle];
                sortedPointRecords.push(entry);
            }

            // step 2b: sort the list in place
            sortedPointRecords.sort(function(record1, record2) {
                // returning a negative number here sorts record1 before record2
                // if first angle is smaller than second, first angle should come before second
                var sortOutput = record1[2] - record2[2];  // negative if first angle smaller
                if (sortOutput === 0) {
                    // if the two angles are equal, sort by originalIndex
                    sortOutput = record2[1] - record1[1]; // negative if first index larger
                    // coincident points will be sorted in reverse-numerical order
                    // so the coincident points with lower original index will be considered first
                }
                return sortOutput;
            });

            // step 2c: duplicate start record from the top of the stack to the bottom of the stack
            if (sortedPointRecords.length > 2) {
                var startPointRecord = sortedPointRecords[sortedPointRecords.length-1];
                sortedPointRecords.unshift(startPointRecord);
            }

            // step 3a: go through sorted points in order and find those with right turns
            // we want to get our results in clockwise order
            var insidePoints = {}; // dictionary of points with left turns - cannot be on the hull
            var hullPointRecords = []; // stack of records with right turns - hull point candidates

            var currentPointRecord;
            var currentPoint;
            var lastHullPointRecord;
            var lastHullPoint;
            var secondLastHullPointRecord;
            var secondLastHullPoint;
            while (sortedPointRecords.length !== 0) {
                currentPointRecord = sortedPointRecords.pop();
                currentPoint = currentPointRecord[0];

                // check if point has already been discarded
                // keys for insidePoints are stored in the form 'point.x@point.y@@originalIndex'
                if (insidePoints.hasOwnProperty(currentPointRecord[0] + '@@' + currentPointRecord[1])) {
                    // this point had an incorrect turn at some previous iteration of this loop
                    // this disqualifies it from possibly being on the hull
                    continue;
                }

                var correctTurnFound = false;
                while (!correctTurnFound) {
                    if (hullPointRecords.length < 2) {
                        // not enough points for comparison, just add current point
                        hullPointRecords.push(currentPointRecord);
                        correctTurnFound = true;
                    
                    } else {
                        lastHullPointRecord = hullPointRecords.pop();
                        lastHullPoint = lastHullPointRecord[0];
                        secondLastHullPointRecord = hullPointRecords.pop();
                        secondLastHullPoint = secondLastHullPointRecord[0];

                        var crossProduct = secondLastHullPoint.cross(lastHullPoint, currentPoint);

                        if (crossProduct < 0) {
                            // found a right turn
                            hullPointRecords.push(secondLastHullPointRecord);
                            hullPointRecords.push(lastHullPointRecord);
                            hullPointRecords.push(currentPointRecord);
                            correctTurnFound = true;

                        } else if (crossProduct === 0) {
                            // the three points are collinear
                            // three options:
                            // there may be a 180 or 0 degree angle at lastHullPoint
                            // or two of the three points are coincident
                            var THRESHOLD = 1e-10; // we have to take rounding errors into account
                            var angleBetween = lastHullPoint.angleBetween(secondLastHullPoint, currentPoint);
                            if (Math.abs(angleBetween - 180) < THRESHOLD) { // rouding around 180 to 180
                                // if the cross product is 0 because the angle is 180 degrees
                                // discard last hull point (add to insidePoints)
                                //insidePoints.unshift(lastHullPoint);
                                insidePoints[lastHullPointRecord[0] + '@@' + lastHullPointRecord[1]] = lastHullPoint;
                                // reenter second-to-last hull point (will be last at next iter)
                                hullPointRecords.push(secondLastHullPointRecord);
                                // do not do anything with current point
                                // correct turn not found
                            
                            } else if (lastHullPoint.equals(currentPoint) || secondLastHullPoint.equals(lastHullPoint)) {
                                // if the cross product is 0 because two points are the same
                                // discard last hull point (add to insidePoints)
                                //insidePoints.unshift(lastHullPoint);
                                insidePoints[lastHullPointRecord[0] + '@@' + lastHullPointRecord[1]] = lastHullPoint;
                                // reenter second-to-last hull point (will be last at next iter)
                                hullPointRecords.push(secondLastHullPointRecord);
                                // do not do anything with current point
                                // correct turn not found
                                                        
                            } else if (Math.abs(((angleBetween + 1) % 360) - 1) < THRESHOLD) { // rounding around 0 and 360 to 0
                                // if the cross product is 0 because the angle is 0 degrees
                                // remove last hull point from hull BUT do not discard it
                                // reenter second-to-last hull point (will be last at next iter)
                                hullPointRecords.push(secondLastHullPointRecord);
                                // put last hull point back into the sorted point records list
                                sortedPointRecords.push(lastHullPointRecord);
                                // we are switching the order of the 0deg and 180deg points
                                // correct turn not found
                            }

                        } else {
                            // found a left turn
                            // discard last hull point (add to insidePoints)
                            //insidePoints.unshift(lastHullPoint);
                            insidePoints[lastHullPointRecord[0] + '@@' + lastHullPointRecord[1]] = lastHullPoint;
                            // reenter second-to-last hull point (will be last at next iter of loop)
                            hullPointRecords.push(secondLastHullPointRecord);
                            // do not do anything with current point
                            // correct turn not found
                        }
                    }
                }
            }
            // at this point, hullPointRecords contains the output points in clockwise order
            // the points start with lowest-y,highest-x startPoint, and end at the same point

            // step 3b: remove duplicated startPointRecord from the end of the array
            if (hullPointRecords.length > 2) {
                hullPointRecords.pop();
            }

            // step 4: find the lowest originalIndex record and put it at the beginning of hull
            var lowestHullIndex; // the lowest originalIndex on the hull
            var indexOfLowestHullIndexRecord = -1; // the index of the record with lowestHullIndex
            n = hullPointRecords.length;
            for (i = 0; i < n; i++) {
                var currentHullIndex = hullPointRecords[i][1];

                if (lowestHullIndex === undefined || currentHullIndex < lowestHullIndex) {
                    lowestHullIndex = currentHullIndex;
                    indexOfLowestHullIndexRecord = i;
                }
            }

            var hullPointRecordsReordered = [];
            if (indexOfLowestHullIndexRecord > 0) {
                var newFirstChunk = hullPointRecords.slice(indexOfLowestHullIndexRecord);
                var newSecondChunk = hullPointRecords.slice(0, indexOfLowestHullIndexRecord);
                hullPointRecordsReordered = newFirstChunk.concat(newSecondChunk);
            } else {
                hullPointRecordsReordered = hullPointRecords;
            }

            var hullPoints = [];
            n = hullPointRecordsReordered.length;
            for (i = 0; i < n; i++) {
                hullPoints.push(hullPointRecordsReordered[i][0]);
            }

            return Polyline(hullPoints);
        }
    };


    var normalizeAngle = g.normalizeAngle = function(angle) {

        return (angle % 360) + (angle < 0 ? 360 : 0);
    };

    g.scale = {

        // Return the `value` from the `domain` interval scaled to the `range` interval.
        linear: function(domain, range, value) {

            var domainSpan = domain[1] - domain[0];
            var rangeSpan = range[1] - range[0];
            return (((value - domain[0]) / domainSpan) * rangeSpan + range[0]) || 0;
        }
    };

    var snapToGrid = g.snapToGrid = function(value, gridSize) {

        return gridSize * Math.round(value / gridSize);
    };

    var toDeg = g.toDeg = function(rad) {

        return (180 * rad / PI) % 360;
    };

    var toRad = g.toRad = function(deg, over360) {

        over360 = over360 || false;
        deg = over360 ? deg : (deg % 360);
        return deg * PI / 180;
    };

    // For backwards compatibility:
    g.ellipse = g.Ellipse;
    g.line = g.Line;
    g.point = g.Point;
    g.rect = g.Rect;

    return g;

})();

// Vectorizer.
// -----------

// A tiny library for making your life easier when dealing with SVG.
// The only Vectorizer dependency is the Geometry library.


var V;
var Vectorizer;

V = Vectorizer = (function() {

    'use strict';

    var hasSvg = typeof window === 'object' &&
                !!(
                    window.SVGAngle ||
                    document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1')
                );

    // SVG support is required.
    if (!hasSvg) {

        // Return a function that throws an error when it is used.
        return function() {
            throw new Error('SVG is required to use Vectorizer.');
        };
    }

    // XML namespaces.
    var ns = {
        xmlns: 'http://www.w3.org/2000/svg',
        xml: 'http://www.w3.org/XML/1998/namespace',
        xlink: 'http://www.w3.org/1999/xlink'
    };

    var SVGversion = '1.1';

    var V = function(el, attrs, children) {

        // This allows using V() without the new keyword.
        if (!(this instanceof V)) {
            return V.apply(Object.create(V.prototype), arguments);
        }

        if (!el) return;

        if (V.isV(el)) {
            el = el.node;
        }

        attrs = attrs || {};

        if (V.isString(el)) {

            if (el.toLowerCase() === 'svg') {

                // Create a new SVG canvas.
                el = V.createSvgDocument();

            } else if (el[0] === '<') {

                // Create element from an SVG string.
                // Allows constructs of type: `document.appendChild(V('<rect></rect>').node)`.

                var svgDoc = V.createSvgDocument(el);

                // Note that `V()` might also return an array should the SVG string passed as
                // the first argument contain more than one root element.
                if (svgDoc.childNodes.length > 1) {

                    // Map child nodes to `V`s.
                    var arrayOfVels = [];
                    var i, len;

                    for (i = 0, len = svgDoc.childNodes.length; i < len; i++) {

                        var childNode = svgDoc.childNodes[i];
                        arrayOfVels.push(new V(document.importNode(childNode, true)));
                    }

                    return arrayOfVels;
                }

                el = document.importNode(svgDoc.firstChild, true);

            } else {

                el = document.createElementNS(ns.xmlns, el);
            }

            V.ensureId(el);
        }

        this.node = el;

        this.setAttributes(attrs);

        if (children) {
            this.append(children);
        }

        return this;
    };

    /**
     * @param {SVGGElement} toElem
     * @returns {SVGMatrix}
     */
    V.prototype.getTransformToElement = function(toElem) {
        toElem = V.toNode(toElem);
        return toElem.getScreenCTM().inverse().multiply(this.node.getScreenCTM());
    };

    /**
     * @param {SVGMatrix} matrix
     * @param {Object=} opt
     * @returns {Vectorizer|SVGMatrix} Setter / Getter
     */
    V.prototype.transform = function(matrix, opt) {

        var node = this.node;
        if (V.isUndefined(matrix)) {
            return V.transformStringToMatrix(this.attr('transform'));
        }

        if (opt && opt.absolute) {
            return this.attr('transform', V.matrixToTransformString(matrix));
        }

        var svgTransform = V.createSVGTransform(matrix);
        node.transform.baseVal.appendItem(svgTransform);
        return this;
    };

    V.prototype.translate = function(tx, ty, opt) {

        opt = opt || {};
        ty = ty || 0;

        var transformAttr = this.attr('transform') || '';
        var transform = V.parseTransformString(transformAttr);
        transformAttr = transform.value;
        // Is it a getter?
        if (V.isUndefined(tx)) {
            return transform.translate;
        }

        transformAttr = transformAttr.replace(/translate\([^\)]*\)/g, '').trim();

        var newTx = opt.absolute ? tx : transform.translate.tx + tx;
        var newTy = opt.absolute ? ty : transform.translate.ty + ty;
        var newTranslate = 'translate(' + newTx + ',' + newTy + ')';

        // Note that `translate()` is always the first transformation. This is
        // usually the desired case.
        this.attr('transform', (newTranslate + ' ' + transformAttr).trim());
        return this;
    };

    V.prototype.rotate = function(angle, cx, cy, opt) {

        opt = opt || {};

        var transformAttr = this.attr('transform') || '';
        var transform = V.parseTransformString(transformAttr);
        transformAttr = transform.value;

        // Is it a getter?
        if (V.isUndefined(angle)) {
            return transform.rotate;
        }

        transformAttr = transformAttr.replace(/rotate\([^\)]*\)/g, '').trim();

        angle %= 360;

        var newAngle = opt.absolute ? angle : transform.rotate.angle + angle;
        var newOrigin = (cx !== undefined && cy !== undefined) ? ',' + cx + ',' + cy : '';
        var newRotate = 'rotate(' + newAngle + newOrigin + ')';

        this.attr('transform', (transformAttr + ' ' + newRotate).trim());
        return this;
    };

    // Note that `scale` as the only transformation does not combine with previous values.
    V.prototype.scale = function(sx, sy) {

        sy = V.isUndefined(sy) ? sx : sy;

        var transformAttr = this.attr('transform') || '';
        var transform = V.parseTransformString(transformAttr);
        transformAttr = transform.value;

        // Is it a getter?
        if (V.isUndefined(sx)) {
            return transform.scale;
        }

        transformAttr = transformAttr.replace(/scale\([^\)]*\)/g, '').trim();

        var newScale = 'scale(' + sx + ',' + sy + ')';

        this.attr('transform', (transformAttr + ' ' + newScale).trim());
        return this;
    };

    // Get SVGRect that contains coordinates and dimension of the real bounding box,
    // i.e. after transformations are applied.
    // If `target` is specified, bounding box will be computed relatively to `target` element.
    V.prototype.bbox = function(withoutTransformations, target) {

        var box;
        var node = this.node;
        var ownerSVGElement = node.ownerSVGElement;

        // If the element is not in the live DOM, it does not have a bounding box defined and
        // so fall back to 'zero' dimension element.
        if (!ownerSVGElement) {
            return g.Rect(0, 0, 0, 0);
        }

        try {

            box = node.getBBox();

        } catch (e) {

            // Fallback for IE.
            box = {
                x: node.clientLeft,
                y: node.clientTop,
                width: node.clientWidth,
                height: node.clientHeight
            };
        }

        if (withoutTransformations) {
            return g.Rect(box);
        }

        var matrix = this.getTransformToElement(target || ownerSVGElement);

        return V.transformRect(box, matrix);
    };
    
    // Returns an SVGRect that contains coordinates and dimensions of the real bounding box,
    // i.e. after transformations are applied.
    // Fixes a browser implementation bug that returns incorrect bounding boxes for groups of svg elements.
    // Takes an (Object) `opt` argument (optional) with the following attributes:
    // (Object) `target` (optional): if not undefined, transform bounding boxes relative to `target`; if undefined, transform relative to this
    // (Boolean) `recursive` (optional): if true, recursively enter all groups and get a union of element bounding boxes (svg bbox fix); if false or undefined, return result of native function this.node.getBBox();
    V.prototype.getBBox = function(opt) {

        var options = {};

        var outputBBox;
        var node = this.node;
        var ownerSVGElement = node.ownerSVGElement;

        // If the element is not in the live DOM, it does not have a bounding box defined and
        // so fall back to 'zero' dimension element.
        if (!ownerSVGElement) {
            return g.Rect(0, 0, 0, 0);
        }

        if (opt) {
            if (opt.target) { // check if target exists
                options.target = V.toNode(opt.target); // works for V objects, jquery objects, and node objects
            }
            if (opt.recursive) {
                options.recursive = opt.recursive;
            }
        }

        if (!options.recursive) {
            try {
                outputBBox = node.getBBox();
            } catch (e) {
                // Fallback for IE.
                outputBBox = {
                    x: node.clientLeft,
                    y: node.clientTop,
                    width: node.clientWidth,
                    height: node.clientHeight
                };
            }

            if (!options.target) {
                // transform like this (that is, not at all)
                return g.Rect(outputBBox);
            } else {
                // transform like target
                var matrix = this.getTransformToElement(options.target);
                return V.transformRect(outputBBox, matrix);
            }
        } else { // if we want to calculate the bbox recursively
            // browsers report correct bbox around svg elements (one that envelops the path lines tightly)
            // but some browsers fail to report the same bbox when the elements are in a group (returning a looser bbox that also includes control points, like node.getClientRect())
            // this happens even if we wrap a single svg element into a group!
            // this option setting makes the function recursively enter all the groups from this and deeper, get bboxes of the elements inside, then return a union of those bboxes

            var children = this.children();
            var n = children.length;
            
            if (n === 0) {
                return this.getBBox({ target: options.target, recursive: false });
            }

            // recursion's initial pass-through setting:
            // recursive passes-through just keep the target as whatever was set up here during the initial pass-through
            if (!options.target) {
                // transform children/descendants like this (their parent/ancestor)
                options.target = this;
            } // else transform children/descendants like target

            for (var i = 0; i < n; i++) {
                var currentChild = children[i];

                var childBBox;

                // if currentChild is not a group element, get its bbox with a nonrecursive call
                if (currentChild.children().length === 0) {
                    childBBox = currentChild.getBBox({ target: options.target, recursive: false });
                }
                else {
                    // if currentChild is a group element (determined by checking the number of children), enter it with a recursive call
                    childBBox = currentChild.getBBox({ target: options.target, recursive: true });
                }

                if (!outputBBox) {
                    // if this is the first iteration
                    outputBBox = childBBox;
                } else {
                    // make a new bounding box rectangle that contains this child's bounding box and previous bounding box
                    outputBBox = outputBBox.union(childBBox);
                }
            }

            return outputBBox;
        }
    };

    V.prototype.text = function(content, opt) {

        // Replace all spaces with the Unicode No-break space (http://www.fileformat.info/info/unicode/char/a0/index.htm).
        // IE would otherwise collapse all spaces into one.
        content = V.sanitizeText(content);
        opt = opt || {};
        var eol = opt.eol;
        var lines = content.split('\n');
        var tspan;

        // An empty text gets rendered into the DOM in webkit-based browsers.
        // In order to unify this behaviour across all browsers
        // we rather hide the text element when it's empty.
        if (content) {
            this.removeAttr('display');
        } else {
            this.attr('display', 'none');
        }

        // Preserve spaces. In other words, we do not want consecutive spaces to get collapsed to one.
        this.attr('xml:space', 'preserve');

        // Easy way to erase all `<tspan>` children;
        this.node.textContent = '';

        var textNode = this.node;

        if (opt.textPath) {

            // Wrap the text in the SVG <textPath> element that points
            // to a path defined by `opt.textPath` inside the internal `<defs>` element.
            var defs = this.find('defs');
            if (defs.length === 0) {
                defs = V('defs');
                this.append(defs);
            }

            // If `opt.textPath` is a plain string, consider it to be directly the
            // SVG path data for the text to go along (this is a shortcut).
            // Otherwise if it is an object and contains the `d` property, then this is our path.
            var d = Object(opt.textPath) === opt.textPath ? opt.textPath.d : opt.textPath;
            if (d) {
                var path = V('path', { d: d });
                defs.append(path);
            }

            var textPath = V('textPath');
            // Set attributes on the `<textPath>`. The most important one
            // is the `xlink:href` that points to our newly created `<path/>` element in `<defs/>`.
            // Note that we also allow the following construct:
            // `t.text('my text', { textPath: { 'xlink:href': '#my-other-path' } })`.
            // In other words, one can completely skip the auto-creation of the path
            // and use any other arbitrary path that is in the document.
            if (!opt.textPath['xlink:href'] && path) {
                textPath.attr('xlink:href', '#' + path.node.id);
            }

            if (Object(opt.textPath) === opt.textPath) {
                textPath.attr(opt.textPath);
            }
            this.append(textPath);
            // Now all the `<tspan>`s will be inside the `<textPath>`.
            textNode = textPath.node;
        }

        var offset = 0;
        var x = ((opt.x !== undefined) ? opt.x : this.attr('x')) || 0;

        // Shift all the <tspan> but first by one line (`1em`)
        var lineHeight = opt.lineHeight || '1em';
        if (opt.lineHeight === 'auto') {
            lineHeight = '1.5em';
        }

        var firstLineHeight = 0;
        for (var i = 0; i < lines.length; i++) {

            var vLineAttributes = { 'class': 'v-line' };
            if (i === 0) {
                vLineAttributes.dy = '0em';
            } else {
                vLineAttributes.dy = lineHeight;
                vLineAttributes.x = x;
            }
            var vLine = V('tspan', vLineAttributes);

            var lastI = lines.length - 1;
            var line = lines[i];
            if (line) {

                // Get the line height based on the biggest font size in the annotations for this line.
                var maxFontSize = 0;
                if (opt.annotations) {

                    // Find the *compacted* annotations for this line.
                    var lineAnnotations = V.annotateString(lines[i], V.isArray(opt.annotations) ? opt.annotations : [opt.annotations], { offset: -offset, includeAnnotationIndices: opt.includeAnnotationIndices });

                    var lastJ = lineAnnotations.length - 1;
                    for (var j = 0; j < lineAnnotations.length; j++) {

                        var annotation = lineAnnotations[j];
                        if (V.isObject(annotation)) {

                            var fontSize = parseFloat(annotation.attrs['font-size']);
                            if (fontSize && fontSize > maxFontSize) {
                                maxFontSize = fontSize;
                            }

                            tspan = V('tspan', annotation.attrs);
                            if (opt.includeAnnotationIndices) {
                                // If `opt.includeAnnotationIndices` is `true`,
                                // set the list of indices of all the applied annotations
                                // in the `annotations` attribute. This list is a comma
                                // separated list of indices.
                                tspan.attr('annotations', annotation.annotations);
                            }
                            if (annotation.attrs['class']) {
                                tspan.addClass(annotation.attrs['class']);
                            }

                            if (eol && j === lastJ && i !== lastI) {
                                annotation.t += eol;
                            }
                            tspan.node.textContent = annotation.t;

                        } else {

                            if (eol && j === lastJ && i !== lastI) {
                                annotation += eol;
                            }
                            tspan = document.createTextNode(annotation || ' ');
                        }
                        vLine.append(tspan);
                    }

                    if (opt.lineHeight === 'auto' && maxFontSize && i !== 0) {

                        vLine.attr('dy', (maxFontSize * 1.2) + 'px');
                    }

                } else {

                    if (eol && i !== lastI) {
                        line += eol;
                    }

                    vLine.node.textContent = line;
                }

                if (i === 0) {
                    firstLineHeight = maxFontSize;
                }
            } else {

                // Make sure the textContent is never empty. If it is, add a dummy
                // character and make it invisible, making the following lines correctly
                // relatively positioned. `dy=1em` won't work with empty lines otherwise.
                vLine.addClass('v-empty-line');
                // 'opacity' needs to be specified with fill, stroke. Opacity without specification
                // is not applied in Firefox
                vLine.node.style.fillOpacity = 0;
                vLine.node.style.strokeOpacity = 0;
                vLine.node.textContent = '-';
            }

            V(textNode).append(vLine);

            offset += line.length + 1;      // + 1 = newline character.
        }

        // `alignment-baseline` does not work in Firefox.
        // Setting `dominant-baseline` on the `<text>` element doesn't work in IE9.
        // In order to have the 0,0 coordinate of the `<text>` element (or the first `<tspan>`)
        // in the top left corner we translate the `<text>` element by `0.8em`.
        // See `http://www.w3.org/Graphics/SVG/WG/wiki/How_to_determine_dominant_baseline`.
        // See also `http://apike.ca/prog_svg_text_style.html`.
        var y = this.attr('y');
        if (y === null) {
            this.attr('y', firstLineHeight || '0.8em');
        }

        return this;
    };

    /**
     * @public
     * @param {string} name
     * @returns {Vectorizer}
     */
    V.prototype.removeAttr = function(name) {

        var qualifiedName = V.qualifyAttr(name);
        var el = this.node;

        if (qualifiedName.ns) {
            if (el.hasAttributeNS(qualifiedName.ns, qualifiedName.local)) {
                el.removeAttributeNS(qualifiedName.ns, qualifiedName.local);
            }
        } else if (el.hasAttribute(name)) {
            el.removeAttribute(name);
        }
        return this;
    };

    V.prototype.attr = function(name, value) {

        if (V.isUndefined(name)) {

            // Return all attributes.
            var attributes = this.node.attributes;
            var attrs = {};

            for (var i = 0; i < attributes.length; i++) {
                attrs[attributes[i].name] = attributes[i].value;
            }

            return attrs;
        }

        if (V.isString(name) && V.isUndefined(value)) {
            return this.node.getAttribute(name);
        }

        if (typeof name === 'object') {

            for (var attrName in name) {
                if (name.hasOwnProperty(attrName)) {
                    this.setAttribute(attrName, name[attrName]);
                }
            }

        } else {

            this.setAttribute(name, value);
        }

        return this;
    };

    V.prototype.remove = function() {

        if (this.node.parentNode) {
            this.node.parentNode.removeChild(this.node);
        }

        return this;
    };

    V.prototype.empty = function() {

        while (this.node.firstChild) {
            this.node.removeChild(this.node.firstChild);
        }

        return this;
    };

    V.prototype.setAttributes = function(attrs) {

        for (var key in attrs) {
            if (attrs.hasOwnProperty(key)) {
                this.setAttribute(key, attrs[key]);
            }
        }

        return this;
    };

    V.prototype.append = function(els) {

        if (!V.isArray(els)) {
            els = [els];
        }

        for (var i = 0, len = els.length; i < len; i++) {
            this.node.appendChild(V.toNode(els[i]));
        }

        return this;
    };

    V.prototype.prepend = function(els) {

        var child = this.node.firstChild;
        return child ? V(child).before(els) : this.append(els);
    };

    V.prototype.before = function(els) {

        var node = this.node;
        var parent = node.parentNode;

        if (parent) {

            if (!V.isArray(els)) {
                els = [els];
            }

            for (var i = 0, len = els.length; i < len; i++) {
                parent.insertBefore(V.toNode(els[i]), node);
            }
        }

        return this;
    };

    V.prototype.appendTo = function(node) {
        V.toNode(node).appendChild(this.node);
        return this;
    },

    V.prototype.svg = function() {

        return this.node instanceof window.SVGSVGElement ? this : V(this.node.ownerSVGElement);
    };

    V.prototype.defs = function() {

        var defs = this.svg().node.getElementsByTagName('defs');

        return (defs && defs.length) ? V(defs[0]) : undefined;
    };

    V.prototype.clone = function() {

        var clone = V(this.node.cloneNode(true/* deep */));
        // Note that clone inherits also ID. Therefore, we need to change it here.
        clone.node.id = V.uniqueId();
        return clone;
    };

    V.prototype.findOne = function(selector) {

        var found = this.node.querySelector(selector);
        return found ? V(found) : undefined;
    };

    V.prototype.find = function(selector) {

        var vels = [];
        var nodes = this.node.querySelectorAll(selector);

        if (nodes) {

            // Map DOM elements to `V`s.
            for (var i = 0; i < nodes.length; i++) {
                vels.push(V(nodes[i]));
            }
        }

        return vels;
    };

    // Returns an array of V elements made from children of this.node.
    V.prototype.children = function() {

        var children = this.node.childNodes;
        
        var outputArray = [];
        for (var i = 0; i < children.length; i++) {
            var currentChild = children[i];
            if (currentChild.nodeType === 1) {
                outputArray.push(V(children[i])); 
            }
        }
        return outputArray;
    };

    // Find an index of an element inside its container.
    V.prototype.index = function() {

        var index = 0;
        var node = this.node.previousSibling;

        while (node) {
            // nodeType 1 for ELEMENT_NODE
            if (node.nodeType === 1) index++;
            node = node.previousSibling;
        }

        return index;
    };

    V.prototype.findParentByClass = function(className, terminator) {

        var ownerSVGElement = this.node.ownerSVGElement;
        var node = this.node.parentNode;

        while (node && node !== terminator && node !== ownerSVGElement) {

            var vel = V(node);
            if (vel.hasClass(className)) {
                return vel;
            }

            node = node.parentNode;
        }

        return null;
    };

    // https://jsperf.com/get-common-parent
    V.prototype.contains = function(el) {

        var a = this.node;
        var b = V.toNode(el);
        var bup = b && b.parentNode;

        return (a === bup) || !!(bup && bup.nodeType === 1 && (a.compareDocumentPosition(bup) & 16));
    };

    // Convert global point into the coordinate space of this element.
    V.prototype.toLocalPoint = function(x, y) {

        var svg = this.svg().node;

        var p = svg.createSVGPoint();
        p.x = x;
        p.y = y;

        try {

            var globalPoint = p.matrixTransform(svg.getScreenCTM().inverse());
            var globalToLocalMatrix = this.getTransformToElement(svg).inverse();

        } catch (e) {
            // IE9 throws an exception in odd cases. (`Unexpected call to method or property access`)
            // We have to make do with the original coordianates.
            return p;
        }

        return globalPoint.matrixTransform(globalToLocalMatrix);
    };

    V.prototype.translateCenterToPoint = function(p) {

        var bbox = this.getBBox({ target: this.svg() });
        var center = bbox.center();

        this.translate(p.x - center.x, p.y - center.y);
    };

    // Efficiently auto-orient an element. This basically implements the orient=auto attribute
    // of markers. The easiest way of understanding on what this does is to imagine the element is an
    // arrowhead. Calling this method on the arrowhead makes it point to the `position` point while
    // being auto-oriented (properly rotated) towards the `reference` point.
    // `target` is the element relative to which the transformations are applied. Usually a viewport.
    V.prototype.translateAndAutoOrient = function(position, reference, target) {

        // Clean-up previously set transformations except the scale. If we didn't clean up the
        // previous transformations then they'd add up with the old ones. Scale is an exception as
        // it doesn't add up, consider: `this.scale(2).scale(2).scale(2)`. The result is that the
        // element is scaled by the factor 2, not 8.

        var s = this.scale();
        this.attr('transform', '');
        this.scale(s.sx, s.sy);

        var svg = this.svg().node;
        var bbox = this.getBBox({ target: target });

        // 1. Translate to origin.
        var translateToOrigin = svg.createSVGTransform();
        translateToOrigin.setTranslate(-bbox.x - bbox.width / 2, -bbox.y - bbox.height / 2);

        // 2. Rotate around origin.
        var rotateAroundOrigin = svg.createSVGTransform();
        var angle = g.point(position).changeInAngle(position.x - reference.x, position.y - reference.y, reference);
        rotateAroundOrigin.setRotate(angle, 0, 0);

        // 3. Translate to the `position` + the offset (half my width) towards the `reference` point.
        var translateFinal = svg.createSVGTransform();
        var finalPosition = g.point(position).move(reference, bbox.width / 2);
        translateFinal.setTranslate(position.x + (position.x - finalPosition.x), position.y + (position.y - finalPosition.y));

        // 4. Apply transformations.
        var ctm = this.getTransformToElement(target);
        var transform = svg.createSVGTransform();
        transform.setMatrix(
            translateFinal.matrix.multiply(
                rotateAroundOrigin.matrix.multiply(
                    translateToOrigin.matrix.multiply(
                        ctm)))
        );

        // Instead of directly setting the `matrix()` transform on the element, first, decompose
        // the matrix into separate transforms. This allows us to use normal Vectorizer methods
        // as they don't work on matrices. An example of this is to retrieve a scale of an element.
        // this.node.transform.baseVal.initialize(transform);

        var decomposition = V.decomposeMatrix(transform.matrix);

        this.translate(decomposition.translateX, decomposition.translateY);
        this.rotate(decomposition.rotation);
        // Note that scale has been already applied, hence the following line stays commented. (it's here just for reference).
        //this.scale(decomposition.scaleX, decomposition.scaleY);

        return this;
    };

    V.prototype.animateAlongPath = function(attrs, path) {

        path = V.toNode(path);

        var id = V.ensureId(path);
        var animateMotion = V('animateMotion', attrs);
        var mpath = V('mpath', { 'xlink:href': '#' + id });

        animateMotion.append(mpath);

        this.append(animateMotion);
        try {
            animateMotion.node.beginElement();
        } catch (e) {
            // Fallback for IE 9.
            // Run the animation programatically if FakeSmile (`http://leunen.me/fakesmile/`) present
            if (document.documentElement.getAttribute('smiling') === 'fake') {

                // Register the animation. (See `https://answers.launchpad.net/smil/+question/203333`)
                var animation = animateMotion.node;
                animation.animators = [];

                var animationID = animation.getAttribute('id');
                if (animationID) id2anim[animationID] = animation;

                var targets = getTargets(animation);
                for (var i = 0, len = targets.length; i < len; i++) {
                    var target = targets[i];
                    var animator = new Animator(animation, target, i);
                    animators.push(animator);
                    animation.animators[i] = animator;
                    animator.register();
                }
            }
        }
        return this;
    };

    V.prototype.hasClass = function(className) {

        return new RegExp('(\\s|^)' + className + '(\\s|$)').test(this.node.getAttribute('class'));
    };

    V.prototype.addClass = function(className) {

        if (!this.hasClass(className)) {
            var prevClasses = this.node.getAttribute('class') || '';
            this.node.setAttribute('class', (prevClasses + ' ' + className).trim());
        }

        return this;
    };

    V.prototype.removeClass = function(className) {

        if (this.hasClass(className)) {
            var newClasses = this.node.getAttribute('class').replace(new RegExp('(\\s|^)' + className + '(\\s|$)', 'g'), '$2');
            this.node.setAttribute('class', newClasses);
        }

        return this;
    };

    V.prototype.toggleClass = function(className, toAdd) {

        var toRemove = V.isUndefined(toAdd) ? this.hasClass(className) : !toAdd;

        if (toRemove) {
            this.removeClass(className);
        } else {
            this.addClass(className);
        }

        return this;
    };

    // Interpolate path by discrete points. The precision of the sampling
    // is controlled by `interval`. In other words, `sample()` will generate
    // a point on the path starting at the beginning of the path going to the end
    // every `interval` pixels.
    // The sampler can be very useful for e.g. finding intersection between two
    // paths (finding the two closest points from two samples).
    V.prototype.sample = function(interval) {

        interval = interval || 1;
        var node = this.node;
        var length = node.getTotalLength();
        var samples = [];
        var distance = 0;
        var sample;
        while (distance < length) {
            sample = node.getPointAtLength(distance);
            samples.push({ x: sample.x, y: sample.y, distance: distance });
            distance += interval;
        }
        return samples;
    };

    V.prototype.convertToPath = function() {

        var path = V('path');
        path.attr(this.attr());
        var d = this.convertToPathData();
        if (d) {
            path.attr('d', d);
        }
        return path;
    };

    V.prototype.convertToPathData = function() {

        var tagName = this.node.tagName.toUpperCase();

        switch (tagName) {
            case 'PATH':
                return this.attr('d');
            case 'LINE':
                return V.convertLineToPathData(this.node);
            case 'POLYGON':
                return V.convertPolygonToPathData(this.node);
            case 'POLYLINE':
                return V.convertPolylineToPathData(this.node);
            case 'ELLIPSE':
                return V.convertEllipseToPathData(this.node);
            case 'CIRCLE':
                return V.convertCircleToPathData(this.node);
            case 'RECT':
                return V.convertRectToPathData(this.node);
        }

        throw new Error(tagName + ' cannot be converted to PATH.');
    };

    // Find the intersection of a line starting in the center
    // of the SVG `node` ending in the point `ref`.
    // `target` is an SVG element to which `node`s transformations are relative to.
    // In JointJS, `target` is the `paper.viewport` SVG group element.
    // Note that `ref` point must be in the coordinate system of the `target` for this function to work properly.
    // Returns a point in the `target` coordinte system (the same system as `ref` is in) if
    // an intersection is found. Returns `undefined` otherwise.
    V.prototype.findIntersection = function(ref, target) {

        var svg = this.svg().node;
        target = target || svg;
        var bbox = this.getBBox({ target: target });
        var center = bbox.center();

        if (!bbox.intersectionWithLineFromCenterToPoint(ref)) return undefined;

        var spot;
        var tagName = this.node.localName.toUpperCase();

        // Little speed up optimalization for `<rect>` element. We do not do conversion
        // to path element and sampling but directly calculate the intersection through
        // a transformed geometrical rectangle.
        if (tagName === 'RECT') {

            var gRect = g.rect(
                parseFloat(this.attr('x') || 0),
                parseFloat(this.attr('y') || 0),
                parseFloat(this.attr('width')),
                parseFloat(this.attr('height'))
            );
            // Get the rect transformation matrix with regards to the SVG document.
            var rectMatrix = this.getTransformToElement(target);
            // Decompose the matrix to find the rotation angle.
            var rectMatrixComponents = V.decomposeMatrix(rectMatrix);
            // Now we want to rotate the rectangle back so that we
            // can use `intersectionWithLineFromCenterToPoint()` passing the angle as the second argument.
            var resetRotation = svg.createSVGTransform();
            resetRotation.setRotate(-rectMatrixComponents.rotation, center.x, center.y);
            var rect = V.transformRect(gRect, resetRotation.matrix.multiply(rectMatrix));
            spot = g.rect(rect).intersectionWithLineFromCenterToPoint(ref, rectMatrixComponents.rotation);

        } else if (tagName === 'PATH' || tagName === 'POLYGON' || tagName === 'POLYLINE' || tagName === 'CIRCLE' || tagName === 'ELLIPSE') {

            var pathNode = (tagName === 'PATH') ? this : this.convertToPath();
            var samples = pathNode.sample();
            var minDistance = Infinity;
            var closestSamples = [];

            var i, sample, gp, centerDistance, refDistance, distance;

            for (i = 0; i < samples.length; i++) {

                sample = samples[i];
                // Convert the sample point in the local coordinate system to the global coordinate system.
                gp = V.createSVGPoint(sample.x, sample.y);
                gp = gp.matrixTransform(this.getTransformToElement(target));
                sample = g.point(gp);
                centerDistance = sample.distance(center);
                // Penalize a higher distance to the reference point by 10%.
                // This gives better results. This is due to
                // inaccuracies introduced by rounding errors and getPointAtLength() returns.
                refDistance = sample.distance(ref) * 1.1;
                distance = centerDistance + refDistance;

                if (distance < minDistance) {
                    minDistance = distance;
                    closestSamples = [{ sample: sample, refDistance: refDistance }];
                } else if (distance < minDistance + 1) {
                    closestSamples.push({ sample: sample, refDistance: refDistance });
                }
            }

            closestSamples.sort(function(a, b) {
                return a.refDistance - b.refDistance;
            });

            if (closestSamples[0]) {
                spot = closestSamples[0].sample;
            }
        }

        return spot;
    };

    /**
     * @private
     * @param {string} name
     * @param {string} value
     * @returns {Vectorizer}
     */
    V.prototype.setAttribute = function(name, value) {

        var el = this.node;

        if (value === null) {
            this.removeAttr(name);
            return this;
        }

        var qualifiedName = V.qualifyAttr(name);

        if (qualifiedName.ns) {
            // Attribute names can be namespaced. E.g. `image` elements
            // have a `xlink:href` attribute to set the source of the image.
            el.setAttributeNS(qualifiedName.ns, name, value);
        } else if (name === 'id') {
            el.id = value;
        } else {
            el.setAttribute(name, value);
        }

        return this;
    };

    // Create an SVG document element.
    // If `content` is passed, it will be used as the SVG content of the `<svg>` root element.
    V.createSvgDocument = function(content) {

        var svg = '<svg xmlns="' + ns.xmlns + '" xmlns:xlink="' + ns.xlink + '" version="' + SVGversion + '">' + (content || '') + '</svg>';
        var xml = V.parseXML(svg, { async: false });
        return xml.documentElement;
    };

    V.idCounter = 0;

    // A function returning a unique identifier for this client session with every call.
    V.uniqueId = function() {

        return 'v-' + (++V.idCounter);
    };

    V.ensureId = function(node) {

        return node.id || (node.id = V.uniqueId());
    };
    // Replace all spaces with the Unicode No-break space (http://www.fileformat.info/info/unicode/char/a0/index.htm).
    // IE would otherwise collapse all spaces into one. This is used in the text() method but it is
    // also exposed so that the programmer can use it in case he needs to. This is useful e.g. in tests
    // when you want to compare the actual DOM text content without having to add the unicode character in
    // the place of all spaces.
    V.sanitizeText = function(text) {

        return (text || '').replace(/ /g, '\u00A0');
    };

    V.isUndefined = function(value) {

        return typeof value === 'undefined';
    };

    V.isString = function(value) {

        return typeof value === 'string';
    };

    V.isObject = function(value) {

        return value && (typeof value === 'object');
    };

    V.isArray = Array.isArray;

    V.parseXML = function(data, opt) {

        opt = opt || {};

        var xml;

        try {
            var parser = new DOMParser();

            if (!V.isUndefined(opt.async)) {
                parser.async = opt.async;
            }

            xml = parser.parseFromString(data, 'text/xml');
        } catch (error) {
            xml = undefined;
        }

        if (!xml || xml.getElementsByTagName('parsererror').length) {
            throw new Error('Invalid XML: ' + data);
        }

        return xml;
    };

    /**
     * @param {string} name
     * @returns {{ns: string|null, local: string}} namespace and attribute name
     */
    V.qualifyAttr = function(name) {

        if (name.indexOf(':') !== -1) {
            var combinedKey = name.split(':');
            return {
                ns: ns[combinedKey[0]],
                local: combinedKey[1]
            };
        }

        return {
            ns: null,
            local: name
        };
    };

    V.transformRegex = /(\w+)\(([^,)]+),?([^)]+)?\)/gi;
    V.transformSeparatorRegex = /[ ,]+/;
    V.transformationListRegex = /^(\w+)\((.*)\)/;

    V.transformStringToMatrix = function(transform) {

        var transformationMatrix = V.createSVGMatrix();
        var matches = transform && transform.match(V.transformRegex);
        if (!matches) {
            return transformationMatrix;
        }

        for (var i = 0, n = matches.length; i < n; i++) {
            var transformationString = matches[i];

            var transformationMatch = transformationString.match(V.transformationListRegex);
            if (transformationMatch) {
                var sx, sy, tx, ty, angle;
                var ctm = V.createSVGMatrix();
                var args = transformationMatch[2].split(V.transformSeparatorRegex);
                switch (transformationMatch[1].toLowerCase()) {
                    case 'scale':
                        sx = parseFloat(args[0]);
                        sy = (args[1] === undefined) ? sx : parseFloat(args[1]);
                        ctm = ctm.scaleNonUniform(sx, sy);
                        break;
                    case 'translate':
                        tx = parseFloat(args[0]);
                        ty = parseFloat(args[1]);
                        ctm = ctm.translate(tx, ty);
                        break;
                    case 'rotate':
                        angle = parseFloat(args[0]);
                        tx = parseFloat(args[1]) || 0;
                        ty = parseFloat(args[2]) || 0;
                        if (tx !== 0 || ty !== 0) {
                            ctm = ctm.translate(tx, ty).rotate(angle).translate(-tx, -ty);
                        } else {
                            ctm = ctm.rotate(angle);
                        }
                        break;
                    case 'skewx':
                        angle = parseFloat(args[0]);
                        ctm = ctm.skewX(angle);
                        break;
                    case 'skewy':
                        angle = parseFloat(args[0]);
                        ctm = ctm.skewY(angle);
                        break;
                    case 'matrix':
                        ctm.a = parseFloat(args[0]);
                        ctm.b = parseFloat(args[1]);
                        ctm.c = parseFloat(args[2]);
                        ctm.d = parseFloat(args[3]);
                        ctm.e = parseFloat(args[4]);
                        ctm.f = parseFloat(args[5]);
                        break;
                    default:
                        continue;
                }

                transformationMatrix = transformationMatrix.multiply(ctm);
            }

        }
        return transformationMatrix;
    };

    V.matrixToTransformString = function(matrix) {
        matrix || (matrix = true);

        return 'matrix(' +
            (matrix.a !== undefined ? matrix.a : 1) + ',' +
            (matrix.b !== undefined ? matrix.b : 0) + ',' +
            (matrix.c !== undefined ? matrix.c : 0) + ',' +
            (matrix.d !== undefined ? matrix.d : 1) + ',' +
            (matrix.e !== undefined ? matrix.e : 0) + ',' +
            (matrix.f !== undefined ? matrix.f : 0) +
            ')';
    };

    V.parseTransformString = function(transform) {

        var translate, rotate, scale;

        if (transform) {

            var separator = V.transformSeparatorRegex;

            // Allow reading transform string with a single matrix
            if (transform.trim().indexOf('matrix') >= 0) {

                var matrix = V.transformStringToMatrix(transform);
                var decomposedMatrix = V.decomposeMatrix(matrix);

                translate = [decomposedMatrix.translateX, decomposedMatrix.translateY];
                scale = [decomposedMatrix.scaleX, decomposedMatrix.scaleY];
                rotate = [decomposedMatrix.rotation];

                var transformations = [];
                if (translate[0] !== 0 ||  translate[0] !== 0) {
                    transformations.push('translate(' + translate + ')');
                }
                if (scale[0] !== 1 ||  scale[1] !== 1) {
                    transformations.push('scale(' + scale + ')');
                }
                if (rotate[0] !== 0) {
                    transformations.push('rotate(' + rotate + ')');
                }
                transform = transformations.join(' ');

            } else {

                var translateMatch = transform.match(/translate\((.*?)\)/);
                if (translateMatch) {
                    translate = translateMatch[1].split(separator);
                }
                var rotateMatch = transform.match(/rotate\((.*?)\)/);
                if (rotateMatch) {
                    rotate = rotateMatch[1].split(separator);
                }
                var scaleMatch = transform.match(/scale\((.*?)\)/);
                if (scaleMatch) {
                    scale = scaleMatch[1].split(separator);
                }
            }
        }

        var sx = (scale && scale[0]) ? parseFloat(scale[0]) : 1;

        return {
            value: transform,
            translate: {
                tx: (translate && translate[0]) ? parseInt(translate[0], 10) : 0,
                ty: (translate && translate[1]) ? parseInt(translate[1], 10) : 0
            },
            rotate: {
                angle: (rotate && rotate[0]) ? parseInt(rotate[0], 10) : 0,
                cx: (rotate && rotate[1]) ? parseInt(rotate[1], 10) : undefined,
                cy: (rotate && rotate[2]) ? parseInt(rotate[2], 10) : undefined
            },
            scale: {
                sx: sx,
                sy: (scale && scale[1]) ? parseFloat(scale[1]) : sx
            }
        };
    };

    V.deltaTransformPoint = function(matrix, point) {

        var dx = point.x * matrix.a + point.y * matrix.c + 0;
        var dy = point.x * matrix.b + point.y * matrix.d + 0;
        return { x: dx, y: dy };
    };

    V.decomposeMatrix = function(matrix) {

        // @see https://gist.github.com/2052247

        // calculate delta transform point
        var px = V.deltaTransformPoint(matrix, { x: 0, y: 1 });
        var py = V.deltaTransformPoint(matrix, { x: 1, y: 0 });

        // calculate skew
        var skewX = ((180 / Math.PI) * Math.atan2(px.y, px.x) - 90);
        var skewY = ((180 / Math.PI) * Math.atan2(py.y, py.x));

        return {

            translateX: matrix.e,
            translateY: matrix.f,
            scaleX: Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b),
            scaleY: Math.sqrt(matrix.c * matrix.c + matrix.d * matrix.d),
            skewX: skewX,
            skewY: skewY,
            rotation: skewX // rotation is the same as skew x
        };
    };

    // Return the `scale` transformation from the following equation:
    // `translate(tx, ty) . rotate(angle) . scale(sx, sy) === matrix(a,b,c,d,e,f)`
    V.matrixToScale = function(matrix) {

        var a,b,c,d;
        if (matrix) {
            a = V.isUndefined(matrix.a) ? 1 : matrix.a;
            d = V.isUndefined(matrix.d) ? 1 : matrix.d;
            b = matrix.b;
            c = matrix.c;
        } else {
            a = d = 1;
        }
        return {
            sx: b ? Math.sqrt(a * a + b * b) : a,
            sy: c ? Math.sqrt(c * c + d * d) : d
        };
    },

    // Return the `rotate` transformation from the following equation:
    // `translate(tx, ty) . rotate(angle) . scale(sx, sy) === matrix(a,b,c,d,e,f)`
    V.matrixToRotate = function(matrix) {

        var p = { x: 0, y: 1 };
        if (matrix) {
            p =  V.deltaTransformPoint(matrix, p);
        }

        return {
            angle: g.normalizeAngle(g.toDeg(Math.atan2(p.y, p.x)) - 90)
        };
    },

    // Return the `translate` transformation from the following equation:
    // `translate(tx, ty) . rotate(angle) . scale(sx, sy) === matrix(a,b,c,d,e,f)`
    V.matrixToTranslate = function(matrix) {

        return {
            tx: (matrix && matrix.e) || 0,
            ty: (matrix && matrix.f) || 0
        };
    },

    V.isV = function(object) {

        return object instanceof V;
    };

    // For backwards compatibility:
    V.isVElement = V.isV;

    var svgDocument = V('svg').node;

    V.createSVGMatrix = function(matrix) {

        var svgMatrix = svgDocument.createSVGMatrix();
        for (var component in matrix) {
            svgMatrix[component] = matrix[component];
        }

        return svgMatrix;
    };

    V.createSVGTransform = function(matrix) {

        if (!V.isUndefined(matrix)) {

            if (!(matrix instanceof SVGMatrix)) {
                matrix = V.createSVGMatrix(matrix);
            }

            return svgDocument.createSVGTransformFromMatrix(matrix);
        }

        return svgDocument.createSVGTransform();
    };

    V.createSVGPoint = function(x, y) {

        var p = svgDocument.createSVGPoint();
        p.x = x;
        p.y = y;
        return p;
    };

    V.transformRect = function(r, matrix) {

        var p = svgDocument.createSVGPoint();

        p.x = r.x;
        p.y = r.y;
        var corner1 = p.matrixTransform(matrix);

        p.x = r.x + r.width;
        p.y = r.y;
        var corner2 = p.matrixTransform(matrix);

        p.x = r.x + r.width;
        p.y = r.y + r.height;
        var corner3 = p.matrixTransform(matrix);

        p.x = r.x;
        p.y = r.y + r.height;
        var corner4 = p.matrixTransform(matrix);

        var minX = Math.min(corner1.x, corner2.x, corner3.x, corner4.x);
        var maxX = Math.max(corner1.x, corner2.x, corner3.x, corner4.x);
        var minY = Math.min(corner1.y, corner2.y, corner3.y, corner4.y);
        var maxY = Math.max(corner1.y, corner2.y, corner3.y, corner4.y);

        return g.Rect(minX, minY, maxX - minX, maxY - minY);
    };

    V.transformPoint = function(p, matrix) {

        return g.Point(V.createSVGPoint(p.x, p.y).matrixTransform(matrix));
    };

    // Convert a style represented as string (e.g. `'fill="blue"; stroke="red"'`) to
    // an object (`{ fill: 'blue', stroke: 'red' }`).
    V.styleToObject = function(styleString) {
        var ret = {};
        var styles = styleString.split(';');
        for (var i = 0; i < styles.length; i++) {
            var style = styles[i];
            var pair = style.split('=');
            ret[pair[0].trim()] = pair[1].trim();
        }
        return ret;
    };

    // Inspired by d3.js https://github.com/mbostock/d3/blob/master/src/svg/arc.js
    V.createSlicePathData = function(innerRadius, outerRadius, startAngle, endAngle) {

        var svgArcMax = 2 * Math.PI - 1e-6;
        var r0 = innerRadius;
        var r1 = outerRadius;
        var a0 = startAngle;
        var a1 = endAngle;
        var da = (a1 < a0 && (da = a0, a0 = a1, a1 = da), a1 - a0);
        var df = da < Math.PI ? '0' : '1';
        var c0 = Math.cos(a0);
        var s0 = Math.sin(a0);
        var c1 = Math.cos(a1);
        var s1 = Math.sin(a1);

        return (da >= svgArcMax)
            ? (r0
               ? 'M0,' + r1
               + 'A' + r1 + ',' + r1 + ' 0 1,1 0,' + (-r1)
               + 'A' + r1 + ',' + r1 + ' 0 1,1 0,' + r1
               + 'M0,' + r0
               + 'A' + r0 + ',' + r0 + ' 0 1,0 0,' + (-r0)
               + 'A' + r0 + ',' + r0 + ' 0 1,0 0,' + r0
               + 'Z'
               : 'M0,' + r1
               + 'A' + r1 + ',' + r1 + ' 0 1,1 0,' + (-r1)
               + 'A' + r1 + ',' + r1 + ' 0 1,1 0,' + r1
               + 'Z')
            : (r0
               ? 'M' + r1 * c0 + ',' + r1 * s0
               + 'A' + r1 + ',' + r1 + ' 0 ' + df + ',1 ' + r1 * c1 + ',' + r1 * s1
               + 'L' + r0 * c1 + ',' + r0 * s1
               + 'A' + r0 + ',' + r0 + ' 0 ' + df + ',0 ' + r0 * c0 + ',' + r0 * s0
               + 'Z'
               : 'M' + r1 * c0 + ',' + r1 * s0
               + 'A' + r1 + ',' + r1 + ' 0 ' + df + ',1 ' + r1 * c1 + ',' + r1 * s1
               + 'L0,0'
               + 'Z');
    };

    // Merge attributes from object `b` with attributes in object `a`.
    // Note that this modifies the object `a`.
    // Also important to note that attributes are merged but CSS classes are concatenated.
    V.mergeAttrs = function(a, b) {

        for (var attr in b) {

            if (attr === 'class') {
                // Concatenate classes.
                a[attr] = a[attr] ? a[attr] + ' ' + b[attr] : b[attr];
            } else if (attr === 'style') {
                // `style` attribute can be an object.
                if (V.isObject(a[attr]) && V.isObject(b[attr])) {
                    // `style` stored in `a` is an object.
                    a[attr] = V.mergeAttrs(a[attr], b[attr]);
                } else if (V.isObject(a[attr])) {
                    // `style` in `a` is an object but it's a string in `b`.
                    // Convert the style represented as a string to an object in `b`.
                    a[attr] = V.mergeAttrs(a[attr], V.styleToObject(b[attr]));
                } else if (V.isObject(b[attr])) {
                    // `style` in `a` is a string, in `b` it's an object.
                    a[attr] = V.mergeAttrs(V.styleToObject(a[attr]), b[attr]);
                } else {
                    // Both styles are strings.
                    a[attr] = V.mergeAttrs(V.styleToObject(a[attr]), V.styleToObject(b[attr]));
                }
            } else {
                a[attr] = b[attr];
            }
        }

        return a;
    };

    V.annotateString = function(t, annotations, opt) {

        annotations = annotations || [];
        opt = opt || {};

        var offset = opt.offset || 0;
        var compacted = [];
        var batch;
        var ret = [];
        var item;
        var prev;

        for (var i = 0; i < t.length; i++) {

            item = ret[i] = t[i];

            for (var j = 0; j < annotations.length; j++) {

                var annotation = annotations[j];
                var start = annotation.start + offset;
                var end = annotation.end + offset;

                if (i >= start && i < end) {
                    // Annotation applies.
                    if (V.isObject(item)) {
                        // There is more than one annotation to be applied => Merge attributes.
                        item.attrs = V.mergeAttrs(V.mergeAttrs({}, item.attrs), annotation.attrs);
                    } else {
                        item = ret[i] = { t: t[i], attrs: annotation.attrs };
                    }
                    if (opt.includeAnnotationIndices) {
                        (item.annotations || (item.annotations = [])).push(j);
                    }
                }
            }

            prev = ret[i - 1];

            if (!prev) {

                batch = item;

            } else if (V.isObject(item) && V.isObject(prev)) {
                // Both previous item and the current one are annotations. If the attributes
                // didn't change, merge the text.
                if (JSON.stringify(item.attrs) === JSON.stringify(prev.attrs)) {
                    batch.t += item.t;
                } else {
                    compacted.push(batch);
                    batch = item;
                }

            } else if (V.isObject(item)) {
                // Previous item was a string, current item is an annotation.
                compacted.push(batch);
                batch = item;

            } else if (V.isObject(prev)) {
                // Previous item was an annotation, current item is a string.
                compacted.push(batch);
                batch = item;

            } else {
                // Both previous and current item are strings.
                batch = (batch || '') + item;
            }
        }

        if (batch) {
            compacted.push(batch);
        }

        return compacted;
    };

    V.findAnnotationsAtIndex = function(annotations, index) {

        var found = [];

        if (annotations) {

            annotations.forEach(function(annotation) {

                if (annotation.start < index && index <= annotation.end) {
                    found.push(annotation);
                }
            });
        }

        return found;
    };

    V.findAnnotationsBetweenIndexes = function(annotations, start, end) {

        var found = [];

        if (annotations) {

            annotations.forEach(function(annotation) {

                if ((start >= annotation.start && start < annotation.end) || (end > annotation.start && end <= annotation.end) || (annotation.start >= start && annotation.end < end)) {
                    found.push(annotation);
                }
            });
        }

        return found;
    };

    // Shift all the text annotations after character `index` by `offset` positions.
    V.shiftAnnotations = function(annotations, index, offset) {

        if (annotations) {

            annotations.forEach(function(annotation) {

                if (annotation.start < index && annotation.end >= index) {
                    annotation.end += offset;
                } else if (annotation.start >= index) {
                    annotation.start += offset;
                    annotation.end += offset;
                }
            });
        }

        return annotations;
    };

    V.convertLineToPathData = function(line) {

        line = V(line);
        var d = [
            'M', line.attr('x1'), line.attr('y1'),
            'L', line.attr('x2'), line.attr('y2')
        ].join(' ');
        return d;
    };

    V.convertPolygonToPathData = function(polygon) {

        var points = V.getPointsFromSvgNode(V(polygon).node);

        if (!(points.length > 0)) return null;

        return V.svgPointsToPath(points) + ' Z';
    };

    V.convertPolylineToPathData = function(polyline) {

        var points = V.getPointsFromSvgNode(V(polyline).node);

        if (!(points.length > 0)) return null;

        return V.svgPointsToPath(points);
    };

    V.svgPointsToPath = function(points) {

        var i;

        for (i = 0; i < points.length; i++) {
            points[i] = points[i].x + ' ' + points[i].y;
        }

        return 'M ' + points.join(' L');
    };

    V.getPointsFromSvgNode = function(node) {

        var points = [];
        var i;

        for (i = 0; i < node.points.numberOfItems; i++) {
            points.push(node.points.getItem(i));
        }

        return points;
    };

    V.KAPPA = 0.5522847498307935;

    V.convertCircleToPathData = function(circle) {

        circle = V(circle);
        var cx = parseFloat(circle.attr('cx')) || 0;
        var cy = parseFloat(circle.attr('cy')) || 0;
        var r = parseFloat(circle.attr('r'));
        var cd = r * V.KAPPA; // Control distance.

        var d = [
            'M', cx, cy - r,    // Move to the first point.
            'C', cx + cd, cy - r, cx + r, cy - cd, cx + r, cy, // I. Quadrant.
            'C', cx + r, cy + cd, cx + cd, cy + r, cx, cy + r, // II. Quadrant.
            'C', cx - cd, cy + r, cx - r, cy + cd, cx - r, cy, // III. Quadrant.
            'C', cx - r, cy - cd, cx - cd, cy - r, cx, cy - r, // IV. Quadrant.
            'Z'
        ].join(' ');
        return d;
    };

    V.convertEllipseToPathData = function(ellipse) {

        ellipse = V(ellipse);
        var cx = parseFloat(ellipse.attr('cx')) || 0;
        var cy = parseFloat(ellipse.attr('cy')) || 0;
        var rx = parseFloat(ellipse.attr('rx'));
        var ry = parseFloat(ellipse.attr('ry')) || rx;
        var cdx = rx * V.KAPPA; // Control distance x.
        var cdy = ry * V.KAPPA; // Control distance y.

        var d = [
            'M', cx, cy - ry,    // Move to the first point.
            'C', cx + cdx, cy - ry, cx + rx, cy - cdy, cx + rx, cy, // I. Quadrant.
            'C', cx + rx, cy + cdy, cx + cdx, cy + ry, cx, cy + ry, // II. Quadrant.
            'C', cx - cdx, cy + ry, cx - rx, cy + cdy, cx - rx, cy, // III. Quadrant.
            'C', cx - rx, cy - cdy, cx - cdx, cy - ry, cx, cy - ry, // IV. Quadrant.
            'Z'
        ].join(' ');
        return d;
    };

    V.convertRectToPathData = function(rect) {

        rect = V(rect);

        return V.rectToPath({
            x: parseFloat(rect.attr('x')) || 0,
            y: parseFloat(rect.attr('y')) || 0,
            width: parseFloat(rect.attr('width')) || 0,
            height: parseFloat(rect.attr('height')) || 0,
            rx: parseFloat(rect.attr('rx')) || 0,
            ry: parseFloat(rect.attr('ry')) || 0
        });
    };

    // Convert a rectangle to SVG path commands. `r` is an object of the form:
    // `{ x: [number], y: [number], width: [number], height: [number], top-ry: [number], top-ry: [number], bottom-rx: [number], bottom-ry: [number] }`,
    // where `x, y, width, height` are the usual rectangle attributes and [top-/bottom-]rx/ry allows for
    // specifying radius of the rectangle for all its sides (as opposed to the built-in SVG rectangle
    // that has only `rx` and `ry` attributes).
    V.rectToPath = function(r) {

        var d;
        var x = r.x;
        var y = r.y;
        var width = r.width;
        var height = r.height;
        var topRx = Math.min(r.rx || r['top-rx'] || 0, width / 2);
        var bottomRx = Math.min(r.rx || r['bottom-rx'] || 0, width / 2);
        var topRy = Math.min(r.ry || r['top-ry'] || 0, height / 2);
        var bottomRy = Math.min(r.ry || r['bottom-ry'] || 0, height / 2);

        if (topRx || bottomRx || topRy || bottomRy) {
            d = [
                'M', x, y + topRy,
                'v', height - topRy - bottomRy,
                'a', bottomRx, bottomRy, 0, 0, 0, bottomRx, bottomRy,
                'h', width - 2 * bottomRx,
                'a', bottomRx, bottomRy, 0, 0, 0, bottomRx, -bottomRy,
                'v', -(height - bottomRy - topRy),
                'a', topRx, topRy, 0, 0, 0, -topRx, -topRy,
                'h', -(width - 2 * topRx),
                'a', topRx, topRy, 0, 0, 0, -topRx, topRy,
                'Z'
            ];
        } else {
            d = [
                'M', x, y,
                'H', x + width,
                'V', y + height,
                'H', x,
                'V', y,
                'Z'
            ];
        }

        return d.join(' ');
    };

    V.toNode = function(el) {
        return V.isV(el) ? el.node : (el.nodeName && el || el[0]);
    };

    return V;

})();


// Global namespace.

var joint = {

    version: '1.1.1-alpha.1',

    config: {
        // The class name prefix config is for advanced use only.
        // Be aware that if you change the prefix, the JointJS CSS will no longer function properly.
        classNamePrefix: 'joint-',
        defaultTheme: 'default'
    },

    // `joint.dia` namespace.
    dia: {},

    // `joint.ui` namespace.
    ui: {},

    // `joint.layout` namespace.
    layout: {},

    // `joint.shapes` namespace.
    shapes: {},

    // `joint.format` namespace.
    format: {},

    // `joint.connectors` namespace.
    connectors: {},

    // `joint.highlighters` namespace.
    highlighters: {},

    // `joint.routers` namespace.
    routers: {},

    // `joint.mvc` namespace.
    mvc: {
        views: {}
    },

    setTheme: function(theme, opt) {

        opt = opt || {};

        joint.util.invoke(joint.mvc.views, 'setTheme', theme, opt);

        // Update the default theme on the view prototype.
        joint.mvc.View.prototype.defaultTheme = theme;
    },

    // `joint.env` namespace.
    env: {

        _results: {},

        _tests: {

            svgforeignobject: function() {
                return !!document.createElementNS &&
              /SVGForeignObject/.test(({}).toString.call(document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')));
            }
        },

        addTest: function(name, fn) {

            return joint.env._tests[name] = fn;
        },

        test: function(name) {

            var fn = joint.env._tests[name];

            if (!fn) {
                throw new Error('Test not defined ("' + name + '"). Use `joint.env.addTest(name, fn) to add a new test.`');
            }

            var result = joint.env._results[name];

            if (typeof result !== 'undefined') {
                return result;
            }

            try {
                result = fn();
            } catch (error) {
                result = false;
            }

            // Cache the test result.
            joint.env._results[name] = result;

            return result;
        }
    },

    util: {

        // Return a simple hash code from a string. See http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/.
        hashCode: function(str) {

            var hash = 0;
            if (str.length == 0) return hash;
            for (var i = 0; i < str.length; i++) {
                var c = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + c;
                hash = hash & hash; // Convert to 32bit integer
            }
            return hash;
        },

        getByPath: function(obj, path, delim) {

            var keys = Array.isArray(path) ? path.slice() : path.split(delim || '/');
            var key;

            while (keys.length) {
                key = keys.shift();
                if (Object(obj) === obj && key in obj) {
                    obj = obj[key];
                } else {
                    return undefined;
                }
            }
            return obj;
        },

        setByPath: function(obj, path, value, delim) {

            var keys = Array.isArray(path) ? path : path.split(delim || '/');

            var diver = obj;
            var i = 0;

            for (var len = keys.length; i < len - 1; i++) {
                // diver creates an empty object if there is no nested object under such a key.
                // This means that one can populate an empty nested object with setByPath().
                diver = diver[keys[i]] || (diver[keys[i]] = {});
            }
            diver[keys[len - 1]] = value;

            return obj;
        },

        unsetByPath: function(obj, path, delim) {

            delim = delim || '/';

            var pathArray = Array.isArray(path) ? path.slice() : path.split(delim);

            var propertyToRemove = pathArray.pop();
            if (pathArray.length > 0) {

                // unsetting a nested attribute
                var parent = joint.util.getByPath(obj, pathArray, delim);

                if (parent) {
                    delete parent[propertyToRemove];
                }

            } else {

                // unsetting a primitive attribute
                delete obj[propertyToRemove];
            }

            return obj;
        },

        flattenObject: function(obj, delim, stop) {

            delim = delim || '/';
            var ret = {};

            for (var key in obj) {

                if (!obj.hasOwnProperty(key)) continue;

                var shouldGoDeeper = typeof obj[key] === 'object';
                if (shouldGoDeeper && stop && stop(obj[key])) {
                    shouldGoDeeper = false;
                }

                if (shouldGoDeeper) {

                    var flatObject = this.flattenObject(obj[key], delim, stop);

                    for (var flatKey in flatObject) {
                        if (!flatObject.hasOwnProperty(flatKey)) continue;
                        ret[key + delim + flatKey] = flatObject[flatKey];
                    }

                } else {

                    ret[key] = obj[key];
                }
            }

            return ret;
        },

        uuid: function() {

            // credit: http://stackoverflow.com/posts/2117523/revisions

            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16|0;
                var v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        },

        // Generate global unique id for obj and store it as a property of the object.
        guid: function(obj) {

            this.guid.id = this.guid.id || 1;
            obj.id = (obj.id === undefined ? 'j_' + this.guid.id++ : obj.id);
            return obj.id;
        },

        toKebabCase: function(string) {

            return string.replace(/[A-Z]/g, '-$&').toLowerCase();
        },

        // Copy all the properties to the first argument from the following arguments.
        // All the properties will be overwritten by the properties from the following
        // arguments. Inherited properties are ignored.
        mixin: _.assign,

        // Copy all properties to the first argument from the following
        // arguments only in case if they don't exists in the first argument.
        // All the function propererties in the first argument will get
        // additional property base pointing to the extenders same named
        // property function's call method.
        supplement: _.defaults,

        // Same as `mixin()` but deep version.
        deepMixin: _.mixin,

        // Same as `supplement()` but deep version.
        deepSupplement: _.defaultsDeep,

        normalizeEvent: function(evt) {

            var touchEvt = evt.originalEvent && evt.originalEvent.changedTouches && evt.originalEvent.changedTouches[0];
            if (touchEvt) {
                for (var property in evt) {
                    // copy all the properties from the input event that are not
                    // defined on the touch event (functions included).
                    if (touchEvt[property] === undefined) {
                        touchEvt[property] = evt[property];
                    }
                }
                return touchEvt;
            }

            return evt;
        },

        nextFrame: (function() {

            var raf;

            if (typeof window !== 'undefined') {

                raf = window.requestAnimationFrame ||
                        window.webkitRequestAnimationFrame ||
                        window.mozRequestAnimationFrame ||
                        window.oRequestAnimationFrame ||
                        window.msRequestAnimationFrame;
            }

            if (!raf) {

                var lastTime = 0;

                raf = function(callback) {

                    var currTime = new Date().getTime();
                    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                    var id = setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);

                    lastTime = currTime + timeToCall;

                    return id;
                };
            }

            return function(callback, context) {
                return context
                    ? raf(callback.bind(context))
                    : raf(callback);
            };

        })(),

        cancelFrame: (function() {

            var caf;
            var client = typeof window != 'undefined';

            if (client) {

                caf = window.cancelAnimationFrame ||
                        window.webkitCancelAnimationFrame ||
                        window.webkitCancelRequestAnimationFrame ||
                        window.msCancelAnimationFrame ||
                        window.msCancelRequestAnimationFrame ||
                        window.oCancelAnimationFrame ||
                        window.oCancelRequestAnimationFrame ||
                        window.mozCancelAnimationFrame ||
                        window.mozCancelRequestAnimationFrame;
            }

            caf = caf || clearTimeout;

            return client ? caf.bind(window) : caf;

        })(),

        shapePerimeterConnectionPoint: function(linkView, view, magnet, reference) {

            var bbox;
            var spot;

            if (!magnet) {

                // There is no magnet, try to make the best guess what is the
                // wrapping SVG element. This is because we want this "smart"
                // connection points to work out of the box without the
                // programmer to put magnet marks to any of the subelements.
                // For example, we want the functoin to work on basic.Path elements
                // without any special treatment of such elements.
                // The code below guesses the wrapping element based on
                // one simple assumption. The wrapping elemnet is the
                // first child of the scalable group if such a group exists
                // or the first child of the rotatable group if not.
                // This makese sense because usually the wrapping element
                // is below any other sub element in the shapes.
                var scalable = view.$('.scalable')[0];
                var rotatable = view.$('.rotatable')[0];

                if (scalable && scalable.firstChild) {

                    magnet = scalable.firstChild;

                } else if (rotatable && rotatable.firstChild) {

                    magnet = rotatable.firstChild;
                }
            }

            if (magnet) {

                spot = V(magnet).findIntersection(reference, linkView.paper.viewport);
                if (!spot) {
                    bbox = V(magnet).getBBox({ target: linkView.paper.viewport });
                }

            } else {

                bbox = view.model.getBBox();
                spot = bbox.intersectionWithLineFromCenterToPoint(reference);
            }
            return spot || bbox.center();
        },

        parseCssNumeric: function(strValue, restrictUnits) {

            restrictUnits = restrictUnits || [];
            var cssNumeric = { value: parseFloat(strValue) };

            if (Number.isNaN(cssNumeric.value)) {
                return null;
            }

            var validUnitsExp = restrictUnits.join('|');

            if (joint.util.isString(strValue)) {
                var matches = new RegExp('(\\d+)(' + validUnitsExp + ')$').exec(strValue);
                if (!matches) {
                    return null;
                }
                if (matches[2]) {
                    cssNumeric.unit = matches[2];
                }
            }
            return cssNumeric;
        },

        breakText: function(text, size, styles, opt) {

            opt = opt || {};

            var width = size.width;
            var height = size.height;

            var svgDocument = opt.svgDocument || V('svg').node;
            var textElement = V('<text><tspan></tspan></text>').attr(styles || {}).node;
            var textSpan = textElement.firstChild;
            var textNode = document.createTextNode('');

            // Prevent flickering
            textElement.style.opacity = 0;
            // Prevent FF from throwing an uncaught exception when `getBBox()`
            // called on element that is not in the render tree (is not measurable).
            // <tspan>.getComputedTextLength() returns always 0 in this case.
            // Note that the `textElement` resp. `textSpan` can become hidden
            // when it's appended to the DOM and a `display: none` CSS stylesheet
            // rule gets applied.
            textElement.style.display = 'block';
            textSpan.style.display = 'block';

            textSpan.appendChild(textNode);
            svgDocument.appendChild(textElement);

            if (!opt.svgDocument) {

                document.body.appendChild(svgDocument);
            }

            var words = text.split(' ');
            var full = [];
            var lines = [];
            var p;
            var lineHeight;

            for (var i = 0, l = 0, len = words.length; i < len; i++) {

                var word = words[i];

                textNode.data = lines[l] ? lines[l] + ' ' + word : word;

                if (textSpan.getComputedTextLength() <= width) {

                    // the current line fits
                    lines[l] = textNode.data;

                    if (p) {
                        // We were partitioning. Put rest of the word onto next line
                        full[l++] = true;

                        // cancel partitioning
                        p = 0;
                    }

                } else {

                    if (!lines[l] || p) {

                        var partition = !!p;

                        p = word.length - 1;

                        if (partition || !p) {

                            // word has only one character.
                            if (!p) {

                                if (!lines[l]) {

                                    // we won't fit this text within our rect
                                    lines = [];

                                    break;
                                }

                                // partitioning didn't help on the non-empty line
                                // try again, but this time start with a new line

                                // cancel partitions created
                                words.splice(i, 2, word + words[i + 1]);

                                // adjust word length
                                len--;

                                full[l++] = true;
                                i--;

                                continue;
                            }

                            // move last letter to the beginning of the next word
                            words[i] = word.substring(0, p);
                            words[i + 1] = word.substring(p) + words[i + 1];

                        } else {

                            // We initiate partitioning
                            // split the long word into two words
                            words.splice(i, 1, word.substring(0, p), word.substring(p));

                            // adjust words length
                            len++;

                            if (l && !full[l - 1]) {
                                // if the previous line is not full, try to fit max part of
                                // the current word there
                                l--;
                            }
                        }

                        i--;

                        continue;
                    }

                    l++;
                    i--;
                }

                // if size.height is defined we have to check whether the height of the entire
                // text exceeds the rect height
                if (height !== undefined) {

                    if (lineHeight === undefined) {

                        var heightValue;

                        // use the same defaults as in V.prototype.text
                        if (styles.lineHeight === 'auto') {
                            heightValue = { value: 1.5, unit: 'em' };
                        } else {
                            heightValue = joint.util.parseCssNumeric(styles.lineHeight, ['em']) || { value: 1, unit: 'em' };
                        }

                        lineHeight = heightValue.value;
                        if (heightValue.unit === 'em' ) {
                            lineHeight *= textElement.getBBox().height;
                        }
                    }

                    if (lineHeight * lines.length > height) {

                        // remove overflowing lines
                        lines.splice(Math.floor(height / lineHeight));

                        break;
                    }
                }
            }

            if (opt.svgDocument) {

                // svg document was provided, remove the text element only
                svgDocument.removeChild(textElement);

            } else {

                // clean svg document
                document.body.removeChild(svgDocument);
            }

            return lines.join('\n');
        },

        imageToDataUri: function(url, callback) {

            if (!url || url.substr(0, 'data:'.length) === 'data:') {
                // No need to convert to data uri if it is already in data uri.

                // This not only convenient but desired. For example,
                // IE throws a security error if data:image/svg+xml is used to render
                // an image to the canvas and an attempt is made to read out data uri.
                // Now if our image is already in data uri, there is no need to render it to the canvas
                // and so we can bypass this error.

                // Keep the async nature of the function.
                return setTimeout(function() {
                    callback(null, url);
                }, 0);
            }

            // chrome IE10 IE11
            var modernHandler = function(xhr, callback) {

                if (xhr.status === 200) {

                    var reader = new FileReader();

                    reader.onload = function(evt) {
                        var dataUri = evt.target.result;
                        callback(null, dataUri);
                    };

                    reader.onerror = function() {
                        callback(new Error('Failed to load image ' + url));
                    };

                    reader.readAsDataURL(xhr.response);
                } else {
                    callback(new Error('Failed to load image ' + url));
                }

            };

            var legacyHandler = function(xhr, callback) {

                var Uint8ToString = function(u8a) {
                    var CHUNK_SZ = 0x8000;
                    var c = [];
                    for (var i = 0; i < u8a.length; i += CHUNK_SZ) {
                        c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ)));
                    }
                    return c.join('');
                };


                if (xhr.status === 200) {

                    var bytes = new Uint8Array(xhr.response);

                    var suffix = (url.split('.').pop()) || 'png';
                    var map = {
                        'svg': 'svg+xml'
                    };
                    var meta = 'data:image/' + (map[suffix] || suffix) + ';base64,';
                    var b64encoded = meta + btoa(Uint8ToString(bytes));
                    callback(null, b64encoded);
                } else {
                    callback(new Error('Failed to load image ' + url));
                }
            };

            var xhr = new XMLHttpRequest();

            xhr.open('GET', url, true);
            xhr.addEventListener('error', function() {
                callback(new Error('Failed to load image ' + url));
            });

            xhr.responseType = window.FileReader ? 'blob' : 'arraybuffer';

            xhr.addEventListener('load', function() {
                if (window.FileReader) {
                    modernHandler(xhr, callback);
                } else {
                    legacyHandler(xhr, callback);
                }
            });

            xhr.send();
        },

        getElementBBox: function(el) {

            var $el = $(el);
            if ($el.length === 0) {
                throw new Error('Element not found')
            }

            var element = $el[0];
            var doc = element.ownerDocument;
            var clientBBox = element.getBoundingClientRect();

            var strokeWidthX = 0;
            var strokeWidthY = 0;

            // Firefox correction
            if (element.ownerSVGElement) {

                var vel = V(element);
                var bbox = vel.getBBox({ target: vel.svg() });

                // if FF getBoundingClientRect includes stroke-width, getBBox doesn't.
                // To unify this across all browsers we need to adjust the final bBox with `stroke-width` value.
                strokeWidthX = (clientBBox.width - bbox.width);
                strokeWidthY = (clientBBox.height - bbox.height);
            }

            return  {
                x: clientBBox.left + window.pageXOffset - doc.documentElement.offsetLeft + strokeWidthX / 2,
                y: clientBBox.top + window.pageYOffset - doc.documentElement.offsetTop + strokeWidthY / 2,
                width: clientBBox.width - strokeWidthX,
                height: clientBBox.height - strokeWidthY
            };
        },


        // Highly inspired by the jquery.sortElements plugin by Padolsey.
        // See http://james.padolsey.com/javascript/sorting-elements-with-jquery/.
        sortElements: function(elements, comparator) {

            var $elements = $(elements);
            var placements = $elements.map(function() {

                var sortElement = this;
                var parentNode = sortElement.parentNode;
                // Since the element itself will change position, we have
                // to have some way of storing it's original position in
                // the DOM. The easiest way is to have a 'flag' node:
                var nextSibling = parentNode.insertBefore(document.createTextNode(''), sortElement.nextSibling);

                return function() {

                    if (parentNode === this) {
                        throw new Error('You can\'t sort elements if any one is a descendant of another.');
                    }

                    // Insert before flag:
                    parentNode.insertBefore(this, nextSibling);
                    // Remove flag:
                    parentNode.removeChild(nextSibling);
                };
            });

            return Array.prototype.sort.call($elements, comparator).each(function(i) {
                placements[i].call(this);
            });
        },

        // Sets attributes on the given element and its descendants based on the selector.
        // `attrs` object: { [SELECTOR1]: { attrs1 }, [SELECTOR2]: { attrs2}, ... } e.g. { 'input': { color : 'red' }}
        setAttributesBySelector: function(element, attrs) {

            var $element = $(element);

            joint.util.forIn(attrs, function(attrs, selector) {
                var $elements = $element.find(selector).addBack().filter(selector);
                // Make a special case for setting classes.
                // We do not want to overwrite any existing class.
                if (joint.util.has(attrs, 'class')) {
                    $elements.addClass(attrs['class']);
                    attrs = joint.util.omit(attrs, 'class');
                }
                $elements.attr(attrs);
            });
        },

        // Return a new object with all for sides (top, bottom, left and right) in it.
        // Value of each side is taken from the given argument (either number or object).
        // Default value for a side is 0.
        // Examples:
        // joint.util.normalizeSides(5) --> { top: 5, left: 5, right: 5, bottom: 5 }
        // joint.util.normalizeSides({ left: 5 }) --> { top: 0, left: 5, right: 0, bottom: 0 }
        normalizeSides: function(box) {

            if (Object(box) !== box) {
                box = box || 0;
                return { top: box, bottom: box, left: box, right: box };
            }

            return {
                top: box.top || 0,
                bottom: box.bottom || 0,
                left: box.left || 0,
                right: box.right || 0
            };
        },

        timing: {

            linear: function(t) {
                return t;
            },

            quad: function(t) {
                return t * t;
            },

            cubic: function(t) {
                return t * t * t;
            },

            inout: function(t) {
                if (t <= 0) return 0;
                if (t >= 1) return 1;
                var t2 = t * t;
                var t3 = t2 * t;
                return 4 * (t < .5 ? t3 : 3 * (t - t2) + t3 - .75);
            },

            exponential: function(t) {
                return Math.pow(2, 10 * (t - 1));
            },

            bounce: function(t) {
                for (var a = 0, b = 1; 1; a += b, b /= 2) {
                    if (t >= (7 - 4 * a) / 11) {
                        var q = (11 - 6 * a - 11 * t) / 4;
                        return -q * q + b * b;
                    }
                }
            },

            reverse: function(f) {
                return function(t) {
                    return 1 - f(1 - t);
                };
            },

            reflect: function(f) {
                return function(t) {
                    return .5 * (t < .5 ? f(2 * t) : (2 - f(2 - 2 * t)));
                };
            },

            clamp: function(f, n, x) {
                n = n || 0;
                x = x || 1;
                return function(t) {
                    var r = f(t);
                    return r < n ? n : r > x ? x : r;
                };
            },

            back: function(s) {
                if (!s) s = 1.70158;
                return function(t) {
                    return t * t * ((s + 1) * t - s);
                };
            },

            elastic: function(x) {
                if (!x) x = 1.5;
                return function(t) {
                    return Math.pow(2, 10 * (t - 1)) * Math.cos(20 * Math.PI * x / 3 * t);
                };
            }
        },

        interpolate: {

            number: function(a, b) {
                var d = b - a;
                return function(t) { return a + d * t; };
            },

            object: function(a, b) {
                var s = Object.keys(a);
                return function(t) {
                    var i, p;
                    var r = {};
                    for (i = s.length - 1; i != -1; i--) {
                        p = s[i];
                        r[p] = a[p] + (b[p] - a[p]) * t;
                    }
                    return r;
                };
            },

            hexColor: function(a, b) {

                var ca = parseInt(a.slice(1), 16);
                var cb = parseInt(b.slice(1), 16);
                var ra = ca & 0x0000ff;
                var rd = (cb & 0x0000ff) - ra;
                var ga = ca & 0x00ff00;
                var gd = (cb & 0x00ff00) - ga;
                var ba = ca & 0xff0000;
                var bd = (cb & 0xff0000) - ba;

                return function(t) {

                    var r = (ra + rd * t) & 0x000000ff;
                    var g = (ga + gd * t) & 0x0000ff00;
                    var b = (ba + bd * t) & 0x00ff0000;

                    return '#' + (1 << 24 | r | g | b ).toString(16).slice(1);
                };
            },

            unit: function(a, b) {

                var r = /(-?[0-9]*.[0-9]*)(px|em|cm|mm|in|pt|pc|%)/;
                var ma = r.exec(a);
                var mb = r.exec(b);
                var p = mb[1].indexOf('.');
                var f = p > 0 ? mb[1].length - p - 1 : 0;
                a = +ma[1];
                var d = +mb[1] - a;
                var u = ma[2];

                return function(t) {
                    return (a + d * t).toFixed(f) + u;
                };
            }
        },

        // SVG filters.
        filter: {

            // `color` ... outline color
            // `width`... outline width
            // `opacity` ... outline opacity
            // `margin` ... gap between outline and the element
            outline: function(args) {

                var tpl = '<filter><feFlood flood-color="${color}" flood-opacity="${opacity}" result="colored"/><feMorphology in="SourceAlpha" result="morphedOuter" operator="dilate" radius="${outerRadius}" /><feMorphology in="SourceAlpha" result="morphedInner" operator="dilate" radius="${innerRadius}" /><feComposite result="morphedOuterColored" in="colored" in2="morphedOuter" operator="in"/><feComposite operator="xor" in="morphedOuterColored" in2="morphedInner" result="outline"/><feMerge><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';

                var margin = Number.isFinite(args.margin) ? args.margin : 2;
                var width = Number.isFinite(args.width) ? args.width : 1;

                return joint.util.template(tpl)({
                    color: args.color || 'blue',
                    opacity: Number.isFinite(args.opacity) ? args.opacity : 1,
                    outerRadius: margin + width,
                    innerRadius: margin
                });
            },

            // `color` ... color
            // `width`... width
            // `blur` ... blur
            // `opacity` ... opacity
            highlight: function(args) {

                var tpl = '<filter><feFlood flood-color="${color}" flood-opacity="${opacity}" result="colored"/><feMorphology result="morphed" in="SourceGraphic" operator="dilate" radius="${width}"/><feComposite result="composed" in="colored" in2="morphed" operator="in"/><feGaussianBlur result="blured" in="composed" stdDeviation="${blur}"/><feBlend in="SourceGraphic" in2="blured" mode="normal"/></filter>';

                return joint.util.template(tpl)({
                    color: args.color || 'red',
                    width: Number.isFinite(args.width) ? args.width : 1,
                    blur: Number.isFinite(args.blur) ? args.blur : 0,
                    opacity: Number.isFinite(args.opacity) ? args.opacity : 1
                });
            },

            // `x` ... horizontal blur
            // `y` ... vertical blur (optional)
            blur: function(args) {

                var x = Number.isFinite(args.x) ? args.x : 2;

                return joint.util.template('<filter><feGaussianBlur stdDeviation="${stdDeviation}"/></filter>')({
                    stdDeviation: Number.isFinite(args.y) ? [x, args.y] : x
                });
            },

            // `dx` ... horizontal shift
            // `dy` ... vertical shift
            // `blur` ... blur
            // `color` ... color
            // `opacity` ... opacity
            dropShadow: function(args) {

                var tpl = 'SVGFEDropShadowElement' in window
                    ? '<filter><feDropShadow stdDeviation="${blur}" dx="${dx}" dy="${dy}" flood-color="${color}" flood-opacity="${opacity}"/></filter>'
                    : '<filter><feGaussianBlur in="SourceAlpha" stdDeviation="${blur}"/><feOffset dx="${dx}" dy="${dy}" result="offsetblur"/><feFlood flood-color="${color}"/><feComposite in2="offsetblur" operator="in"/><feComponentTransfer><feFuncA type="linear" slope="${opacity}"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>';

                return joint.util.template(tpl)({
                    dx: args.dx || 0,
                    dy: args.dy || 0,
                    opacity: Number.isFinite(args.opacity) ? args.opacity : 1,
                    color: args.color || 'black',
                    blur: Number.isFinite(args.blur) ? args.blur : 4
                });
            },

            // `amount` ... the proportion of the conversion. A value of 1 is completely grayscale. A value of 0 leaves the input unchanged.
            grayscale: function(args) {

                var amount = Number.isFinite(args.amount) ? args.amount : 1;

                return joint.util.template('<filter><feColorMatrix type="matrix" values="${a} ${b} ${c} 0 0 ${d} ${e} ${f} 0 0 ${g} ${b} ${h} 0 0 0 0 0 1 0"/></filter>')({
                    a: 0.2126 + 0.7874 * (1 - amount),
                    b: 0.7152 - 0.7152 * (1 - amount),
                    c: 0.0722 - 0.0722 * (1 - amount),
                    d: 0.2126 - 0.2126 * (1 - amount),
                    e: 0.7152 + 0.2848 * (1 - amount),
                    f: 0.0722 - 0.0722 * (1 - amount),
                    g: 0.2126 - 0.2126 * (1 - amount),
                    h: 0.0722 + 0.9278 * (1 - amount)
                });
            },

            // `amount` ... the proportion of the conversion. A value of 1 is completely sepia. A value of 0 leaves the input unchanged.
            sepia: function(args) {

                var amount = Number.isFinite(args.amount) ? args.amount : 1;

                return joint.util.template('<filter><feColorMatrix type="matrix" values="${a} ${b} ${c} 0 0 ${d} ${e} ${f} 0 0 ${g} ${h} ${i} 0 0 0 0 0 1 0"/></filter>')({
                    a: 0.393 + 0.607 * (1 - amount),
                    b: 0.769 - 0.769 * (1 - amount),
                    c: 0.189 - 0.189 * (1 - amount),
                    d: 0.349 - 0.349 * (1 - amount),
                    e: 0.686 + 0.314 * (1 - amount),
                    f: 0.168 - 0.168 * (1 - amount),
                    g: 0.272 - 0.272 * (1 - amount),
                    h: 0.534 - 0.534 * (1 - amount),
                    i: 0.131 + 0.869 * (1 - amount)
                });
            },

            // `amount` ... the proportion of the conversion. A value of 0 is completely un-saturated. A value of 1 leaves the input unchanged.
            saturate: function(args) {

                var amount = Number.isFinite(args.amount) ? args.amount : 1;

                return joint.util.template('<filter><feColorMatrix type="saturate" values="${amount}"/></filter>')({
                    amount: 1 - amount
                });
            },

            // `angle` ...  the number of degrees around the color circle the input samples will be adjusted.
            hueRotate: function(args) {

                return joint.util.template('<filter><feColorMatrix type="hueRotate" values="${angle}"/></filter>')({
                    angle: args.angle || 0
                });
            },

            // `amount` ... the proportion of the conversion. A value of 1 is completely inverted. A value of 0 leaves the input unchanged.
            invert: function(args) {

                var amount = Number.isFinite(args.amount) ? args.amount : 1;

                return joint.util.template('<filter><feComponentTransfer><feFuncR type="table" tableValues="${amount} ${amount2}"/><feFuncG type="table" tableValues="${amount} ${amount2}"/><feFuncB type="table" tableValues="${amount} ${amount2}"/></feComponentTransfer></filter>')({
                    amount: amount,
                    amount2: 1 - amount
                });
            },

            // `amount` ... proportion of the conversion. A value of 0 will create an image that is completely black. A value of 1 leaves the input unchanged.
            brightness: function(args) {

                return joint.util.template('<filter><feComponentTransfer><feFuncR type="linear" slope="${amount}"/><feFuncG type="linear" slope="${amount}"/><feFuncB type="linear" slope="${amount}"/></feComponentTransfer></filter>')({
                    amount: Number.isFinite(args.amount) ? args.amount : 1
                });
            },

            // `amount` ... proportion of the conversion. A value of 0 will create an image that is completely black. A value of 1 leaves the input unchanged.
            contrast: function(args) {

                var amount = Number.isFinite(args.amount) ? args.amount : 1;

                return joint.util.template('<filter><feComponentTransfer><feFuncR type="linear" slope="${amount}" intercept="${amount2}"/><feFuncG type="linear" slope="${amount}" intercept="${amount2}"/><feFuncB type="linear" slope="${amount}" intercept="${amount2}"/></feComponentTransfer></filter>')({
                    amount: amount,
                    amount2: .5 - amount / 2
                });
            }
        },

        format: {

            // Formatting numbers via the Python Format Specification Mini-language.
            // See http://docs.python.org/release/3.1.3/library/string.html#format-specification-mini-language.
            // Heavilly inspired by the D3.js library implementation.
            number: function(specifier, value, locale) {

                locale = locale || {

                    currency: ['$', ''],
                    decimal: '.',
                    thousands: ',',
                    grouping: [3]
                };

                // See Python format specification mini-language: http://docs.python.org/release/3.1.3/library/string.html#format-specification-mini-language.
                // [[fill]align][sign][symbol][0][width][,][.precision][type]
                var re = /(?:([^{])?([<>=^]))?([+\- ])?([$#])?(0)?(\d+)?(,)?(\.-?\d+)?([a-z%])?/i;

                var match = re.exec(specifier);
                var fill = match[1] || ' ';
                var align = match[2] || '>';
                var sign = match[3] || '';
                var symbol = match[4] || '';
                var zfill = match[5];
                var width = +match[6];
                var comma = match[7];
                var precision = match[8];
                var type = match[9];
                var scale = 1;
                var prefix = '';
                var suffix = '';
                var integer = false;

                if (precision) precision = +precision.substring(1);

                if (zfill || fill === '0' && align === '=') {
                    zfill = fill = '0';
                    align = '=';
                    if (comma) width -= Math.floor((width - 1) / 4);
                }

                switch (type) {
                    case 'n':
                        comma = true; type = 'g';
                        break;
                    case '%':
                        scale = 100; suffix = '%'; type = 'f';
                        break;
                    case 'p':
                        scale = 100; suffix = '%'; type = 'r';
                        break;
                    case 'b':
                    case 'o':
                    case 'x':
                    case 'X':
                        if (symbol === '#') prefix = '0' + type.toLowerCase();
                        break;
                    case 'c':
                    case 'd':
                        integer = true; precision = 0;
                        break;
                    case 's':
                        scale = -1; type = 'r';
                        break;
                }

                if (symbol === '$') {
                    prefix = locale.currency[0];
                    suffix = locale.currency[1];
                }

                // If no precision is specified for `'r'`, fallback to general notation.
                if (type == 'r' && !precision) type = 'g';

                // Ensure that the requested precision is in the supported range.
                if (precision != null) {
                    if (type == 'g') precision = Math.max(1, Math.min(21, precision));
                    else if (type == 'e' || type == 'f') precision = Math.max(0, Math.min(20, precision));
                }

                var zcomma = zfill && comma;

                // Return the empty string for floats formatted as ints.
                if (integer && (value % 1)) return '';

                // Convert negative to positive, and record the sign prefix.
                var negative = value < 0 || value === 0 && 1 / value < 0 ? (value = -value, '-') : sign;

                var fullSuffix = suffix;

                // Apply the scale, computing it from the value's exponent for si format.
                // Preserve the existing suffix, if any, such as the currency symbol.
                if (scale < 0) {
                    var unit = this.prefix(value, precision);
                    value = unit.scale(value);
                    fullSuffix = unit.symbol + suffix;
                } else {
                    value *= scale;
                }

                // Convert to the desired precision.
                value = this.convert(type, value, precision);

                // Break the value into the integer part (before) and decimal part (after).
                var i = value.lastIndexOf('.');
                var before = i < 0 ? value : value.substring(0, i);
                var after = i < 0 ? '' : locale.decimal + value.substring(i + 1);

                function formatGroup(value) {

                    var i = value.length;
                    var t = [];
                    var j = 0;
                    var g = locale.grouping[0];
                    while (i > 0 && g > 0) {
                        t.push(value.substring(i -= g, i + g));
                        g = locale.grouping[j = (j + 1) % locale.grouping.length];
                    }
                    return t.reverse().join(locale.thousands);
                }

                // If the fill character is not `'0'`, grouping is applied before padding.
                if (!zfill && comma && locale.grouping) {

                    before = formatGroup(before);
                }

                var length = prefix.length + before.length + after.length + (zcomma ? 0 : negative.length);
                var padding = length < width ? new Array(length = width - length + 1).join(fill) : '';

                // If the fill character is `'0'`, grouping is applied after padding.
                if (zcomma) before = formatGroup(padding + before);

                // Apply prefix.
                negative += prefix;

                // Rejoin integer and decimal parts.
                value = before + after;

                return (align === '<' ? negative + value + padding
                        : align === '>' ? padding + negative + value
                        : align === '^' ? padding.substring(0, length >>= 1) + negative + value + padding.substring(length)
                        : negative + (zcomma ? value : padding + value)) + fullSuffix;
            },

            // Formatting string via the Python Format string.
            // See https://docs.python.org/2/library/string.html#format-string-syntax)
            string: function(formatString, value) {

                var fieldDelimiterIndex;
                var fieldDelimiter = '{';
                var endPlaceholder = false;
                var formattedStringArray = [];

                while ((fieldDelimiterIndex = formatString.indexOf(fieldDelimiter)) !== -1) {

                    var pieceFormatedString, formatSpec, fieldName;

                    pieceFormatedString = formatString.slice(0, fieldDelimiterIndex);

                    if (endPlaceholder) {
                        formatSpec = pieceFormatedString.split(':');
                        fieldName = formatSpec.shift().split('.');
                        pieceFormatedString = value;

                        for (var i = 0; i < fieldName.length; i++)
                            pieceFormatedString = pieceFormatedString[fieldName[i]];

                        if (formatSpec.length)
                            pieceFormatedString = this.number(formatSpec, pieceFormatedString);
                    }

                    formattedStringArray.push(pieceFormatedString);

                    formatString = formatString.slice(fieldDelimiterIndex + 1);
                    fieldDelimiter = (endPlaceholder = !endPlaceholder) ? '}' : '{';
                }
                formattedStringArray.push(formatString);

                return formattedStringArray.join('');
            },

            convert: function(type, value, precision) {

                switch (type) {
                    case 'b': return value.toString(2);
                    case 'c': return String.fromCharCode(value);
                    case 'o': return value.toString(8);
                    case 'x': return value.toString(16);
                    case 'X': return value.toString(16).toUpperCase();
                    case 'g': return value.toPrecision(precision);
                    case 'e': return value.toExponential(precision);
                    case 'f': return value.toFixed(precision);
                    case 'r': return (value = this.round(value, this.precision(value, precision))).toFixed(Math.max(0, Math.min(20, this.precision(value * (1 + 1e-15), precision))));
                    default: return value + '';
                }
            },

            round: function(value, precision) {

                return precision
                    ? Math.round(value * (precision = Math.pow(10, precision))) / precision
                    : Math.round(value);
            },

            precision: function(value, precision) {

                return precision - (value ? Math.ceil(Math.log(value) / Math.LN10) : 1);
            },

            prefix: function(value, precision) {

                var prefixes = ['y', 'z', 'a', 'f', 'p', 'n', 'µ', 'm', '', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'].map(function(d, i) {
                    var k = Math.pow(10, Math.abs(8 - i) * 3);
                    return {
                        scale: i > 8 ? function(d) { return d / k; } : function(d) { return d * k; },
                        symbol: d
                    };
                });

                var i = 0;
                if (value) {
                    if (value < 0) value *= -1;
                    if (precision) value = this.round(value, this.precision(value, precision));
                    i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
                    i = Math.max(-24, Math.min(24, Math.floor((i <= 0 ? i + 1 : i - 1) / 3) * 3));
                }
                return prefixes[8 + i / 3];
            }
        },

        /*
            Pre-compile the HTML to be used as a template.
        */
        template: function(html) {

            /*
                Must support the variation in templating syntax found here:
                https://lodash.com/docs#template
            */
            var regex = /<%= ([^ ]+) %>|\$\{ ?([^\{\} ]+) ?\}|\{\{([^\{\} ]+)\}\}/g;

            return function(data) {

                data = data || {};

                return html.replace(regex, function(match) {

                    var args = Array.from(arguments);
                    var attr = args.slice(1, 4).find(function(_attr) {
                        return !!_attr;
                    });

                    var attrArray = attr.split('.');
                    var value = data[attrArray.shift()];

                    while (value !== undefined && attrArray.length) {
                        value = value[attrArray.shift()];
                    }

                    return value !== undefined ? value : '';
                });
            };
        },

        /**
         * @param {Element=} el Element, which content is intent to display in full-screen mode, 'document.body' is default.
         */
        toggleFullScreen: function(el) {

            el = el || document.body;

            function prefixedResult(el, prop) {

                var prefixes = ['webkit', 'moz', 'ms', 'o', ''];
                for (var i = 0; i < prefixes.length; i++) {
                    var prefix = prefixes[i];
                    var propName = prefix ? (prefix + prop) : (prop.substr(0, 1).toLowerCase() + prop.substr(1));
                    if (el[propName] !== undefined) {
                        return joint.util.isFunction(el[propName]) ? el[propName]() : el[propName];
                    }
                }
            }

            if (prefixedResult(document, 'FullscreenElement') || prefixedResult(document, 'FullScreenElement')) {
                prefixedResult(document, 'ExitFullscreen') || // Spec.
                prefixedResult(document, 'CancelFullScreen'); // Firefox
            } else {
                prefixedResult(el, 'RequestFullscreen') || // Spec.
                prefixedResult(el, 'RequestFullScreen'); // Firefox
            }
        },

        addClassNamePrefix: function(className) {

            if (!className) return className;

            return className.toString().split(' ').map(function(_className) {

                if (_className.substr(0, joint.config.classNamePrefix.length) !== joint.config.classNamePrefix) {
                    _className = joint.config.classNamePrefix + _className;
                }

                return _className;

            }).join(' ');
        },

        removeClassNamePrefix: function(className) {

            if (!className) return className;

            return className.toString().split(' ').map(function(_className) {

                if (_className.substr(0, joint.config.classNamePrefix.length) === joint.config.classNamePrefix) {
                    _className = _className.substr(joint.config.classNamePrefix.length);
                }

                return _className;

            }).join(' ');
        },

        wrapWith: function(object, methods, wrapper) {

            if (joint.util.isString(wrapper)) {

                if (!joint.util.wrappers[wrapper]) {
                    throw new Error('Unknown wrapper: "' + wrapper + '"');
                }

                wrapper = joint.util.wrappers[wrapper];
            }

            if (!joint.util.isFunction(wrapper)) {
                throw new Error('Wrapper must be a function.');
            }

            _.each(methods, function(method) {
                object[method] = wrapper(object[method]);
            });
        },

        wrappers: {

            /*
                Prepares a function with the following usage:

                    fn([cell, cell, cell], opt);
                    fn([cell, cell, cell]);
                    fn(cell, cell, cell, opt);
                    fn(cell, cell, cell);
                    fn(cell);
            */
            cells: function(fn) {

                return function() {

                    var args = Array.from(arguments);
                    var n = args.length;
                    var cells = n > 0 && args[0] || [];
                    var opt = n > 1 && args[n - 1] || {};

                    if (!Array.isArray(cells)) {

                        if (opt instanceof joint.dia.Cell) {
                            cells = args;
                        } else if (cells instanceof joint.dia.Cell) {
                            cells = args.length > 1 ? _.initial(args) : args;
                        }
                    }

                    if (opt instanceof joint.dia.Cell) {
                        opt = {};
                    }

                    return fn.call(this, cells, opt);
                };
            }
        },
        // lodash 3 vs 4 incompatible
        sortedIndex: _.sortedIndexBy || _.sortedIndex,

        uniq: _.uniqBy || _.uniq,
        uniqueId: _.uniqueId,
        without: _.without,

        isFunction: _.isFunction,
        result: _.result,
        union: _.union,
        invoke: _.invokeMap || _.invoke,
        difference: _.difference,
        omit: _.omit,
        pick: _.pick,
        has: _.has,
        bindAll: _.bindAll,
        assign: _.assign,
        defaults: _.defaults,
        defaultsDeep: _.defaultsDeep,
        isPlainObject: _.isPlainObject,
        isEmpty: _.isEmpty,
        isEqual: _.isEqual,
        noop: function() {},
        cloneDeep: _.cloneDeep,
        toArray: _.toArray,
        flattenDeep: _.flattenDeep,
        camelCase: _.camelCase,
        groupBy: _.groupBy,
        forIn: _.forIn,

        isBoolean: function(value) {
            var toString = Object.prototype.toString;
            return value === true || value === false || (!!value && typeof value === 'object' && toString.call(value) === '[object Boolean]');
        },

        isObject: function(value) {
            return !!value && (typeof value === 'object' || typeof value === 'function');
        },

        isNumber: function(value) {
            var toString = Object.prototype.toString;
            return typeof value === 'number' || (!!value && typeof value === 'object' && toString.call(value) === '[object Number]');
        },

        isString: function(value) {
            var toString = Object.prototype.toString;
            return typeof value === 'string' || (!!value && typeof value === 'object' && toString.call(value) === '[object String]');
        },

        merge: _.merge
    }
};


joint.mvc.View = Backbone.View.extend({

    options: {},
    theme: null,
    themeClassNamePrefix: joint.util.addClassNamePrefix('theme-'),
    requireSetThemeOverride: false,
    defaultTheme: joint.config.defaultTheme,

    constructor: function(options) {

        Backbone.View.call(this, options);
    },

    initialize: function(options) {

        this.requireSetThemeOverride = options && !!options.theme;

        this.options = joint.util.assign({}, this.options, options);

        joint.util.bindAll(this, 'setTheme', 'onSetTheme', 'remove', 'onRemove');

        joint.mvc.views[this.cid] = this;

        this.setTheme(this.options.theme || this.defaultTheme);
        this._ensureElClassName();
        this.init();
    },

    // Override the Backbone `_ensureElement()` method in order to create an
    // svg element (e.g., `<g>`) node that wraps all the nodes of the Cell view.
    _ensureElement: function() {
        var el;

        if (this.svgElement) {

            if (!this.el) {

                var attrs = joint.util.assign({ id: this.id }, joint.util.result(this, 'attributes'));
                if (this.className) attrs['class'] = joint.util.result(this, 'className');
                el = V(joint.util.result(this, 'tagName'), attrs).node;

            } else {

                el = joint.util.result(this, 'el');
            }

            this.setElement(el, false);

        } else {

            Backbone.View.prototype._ensureElement.call(this);

        }

    },

    // Utilize an alternative DOM manipulation API by
    // adding an element reference wrapped in Vectorizer.
    _setElement: function(el) {

        if (this.svgElement) {

            this.$el = el instanceof Backbone.$ ? el : Backbone.$(el);
            this.el = this.$el[0];
            this.vel = V(this.el);

        } else {

            Backbone.View.prototype._setElement.call(this, el);

        }

    },

    _ensureElClassName: function() {

        var className = joint.util.result(this, 'className');
        var prefixedClassName = joint.util.addClassNamePrefix(className);

        this.$el.removeClass(className);
        this.$el.addClass(prefixedClassName);
    },

    init: function() {
        // Intentionally empty.
        // This method is meant to be overriden.
    },

    onRender: function() {
        // Intentionally empty.
        // This method is meant to be overriden.
    },

    setTheme: function(theme, opt) {

        opt = opt || {};

        // Theme is already set, override is required, and override has not been set.
        // Don't set the theme.
        if (this.theme && this.requireSetThemeOverride && !opt.override) {
            return this;
        }

        this.removeThemeClassName();
        this.addThemeClassName(theme);
        this.onSetTheme(this.theme/* oldTheme */, theme/* newTheme */);
        this.theme = theme;

        return this;
    },

    addThemeClassName: function(theme) {

        theme = theme || this.theme;

        var className = this.themeClassNamePrefix + theme;

        this.$el.addClass(className);

        return this;
    },

    removeThemeClassName: function(theme) {

        theme = theme || this.theme;

        var className = this.themeClassNamePrefix + theme;

        this.$el.removeClass(className);

        return this;
    },

    onSetTheme: function(oldTheme, newTheme) {
        // Intentionally empty.
        // This method is meant to be overriden.
    },

    remove: function() {

        this.onRemove();

        joint.mvc.views[this.cid] = null;

        Backbone.View.prototype.remove.apply(this, arguments);

        return this;
    },

    onRemove: function() {
        // Intentionally empty.
        // This method is meant to be overriden.
    },

    getEventNamespace: function() {
        // Returns a per-session unique namespace
        return '.joint-event-ns-' + this.cid;
    }

}, {

    extend: function() {

        var args = Array.from(arguments);

        // Deep clone the prototype and static properties objects.
        // This prevents unexpected behavior where some properties are overwritten outside of this function.
        var protoProps = args[0] && joint.util.assign({}, args[0]) || {};
        var staticProps = args[1] && joint.util.assign({}, args[1]) || {};

        // Need the real render method so that we can wrap it and call it later.
        var renderFn = protoProps.render || (this.prototype && this.prototype.render) || null;

        /*
            Wrap the real render method so that:
                .. `onRender` is always called.
                .. `this` is always returned.
        */
        protoProps.render = function() {

            if (renderFn) {
                // Call the original render method.
                renderFn.apply(this, arguments);
            }

            // Should always call onRender() method.
            this.onRender();

            // Should always return itself.
            return this;
        };

        return Backbone.View.extend.call(this, protoProps, staticProps);
    }
});



joint.dia.GraphCells = Backbone.Collection.extend({

    cellNamespace: joint.shapes,

    initialize: function(models, opt) {

        // Set the optional namespace where all model classes are defined.
        if (opt.cellNamespace) {
            this.cellNamespace = opt.cellNamespace;
        }

        this.graph = opt.graph;
    },

    model: function(attrs, options) {

        var collection = options.collection;
        var namespace = collection.cellNamespace;

        // Find the model class in the namespace or use the default one.
        var ModelClass = (attrs.type === 'link')
            ? joint.dia.Link
            : joint.util.getByPath(namespace, attrs.type, '.') || joint.dia.Element;

        var cell = new ModelClass(attrs, options);
        // Add a reference to the graph. It is necessary to do this here because this is the earliest place
        // where a new model is created from a plain JS object. For other objects, see `joint.dia.Graph>>_prepareCell()`.
        cell.graph = collection.graph;

        return cell;
    },

    // `comparator` makes it easy to sort cells based on their `z` index.
    comparator: function(model) {

        return model.get('z') || 0;
    }
});


joint.dia.Graph = Backbone.Model.extend({

    _batches: {},

    initialize: function(attrs, opt) {

        opt = opt || {};

        // Passing `cellModel` function in the options object to graph allows for
        // setting models based on attribute objects. This is especially handy
        // when processing JSON graphs that are in a different than JointJS format.
        var cells = new joint.dia.GraphCells([], {
            model: opt.cellModel,
            cellNamespace: opt.cellNamespace,
            graph: this
        });
        Backbone.Model.prototype.set.call(this, 'cells', cells);

        // Make all the events fired in the `cells` collection available.
        // to the outside world.
        cells.on('all', this.trigger, this);

        // Backbone automatically doesn't trigger re-sort if models attributes are changed later when
        // they're already in the collection. Therefore, we're triggering sort manually here.
        this.on('change:z', this._sortOnChangeZ, this);
        this.on('batch:stop', this._onBatchStop, this);

        // `joint.dia.Graph` keeps an internal data structure (an adjacency list)
        // for fast graph queries. All changes that affect the structure of the graph
        // must be reflected in the `al` object. This object provides fast answers to
        // questions such as "what are the neighbours of this node" or "what
        // are the sibling links of this link".

        // Outgoing edges per node. Note that we use a hash-table for the list
        // of outgoing edges for a faster lookup.
        // [node ID] -> Object [edge] -> true
        this._out = {};
        // Ingoing edges per node.
        // [node ID] -> Object [edge] -> true
        this._in = {};
        // `_nodes` is useful for quick lookup of all the elements in the graph, without
        // having to go through the whole cells array.
        // [node ID] -> true
        this._nodes = {};
        // `_edges` is useful for quick lookup of all the links in the graph, without
        // having to go through the whole cells array.
        // [edge ID] -> true
        this._edges = {};

        cells.on('add', this._restructureOnAdd, this);
        cells.on('remove', this._restructureOnRemove, this);
        cells.on('reset', this._restructureOnReset, this);
        cells.on('change:source', this._restructureOnChangeSource, this);
        cells.on('change:target', this._restructureOnChangeTarget, this);
        cells.on('remove', this._removeCell, this);
    },

    _sortOnChangeZ: function() {

        if (!this.hasActiveBatch('to-front') && !this.hasActiveBatch('to-back')) {
            this.get('cells').sort();
        }
    },

    _onBatchStop: function(data) {

        var batchName = data && data.batchName;
        if ((batchName === 'to-front' || batchName === 'to-back') && !this.hasActiveBatch(batchName)) {
            this.get('cells').sort();
        }
    },

    _restructureOnAdd: function(cell) {

        if (cell.isLink()) {
            this._edges[cell.id] = true;
            var source = cell.get('source');
            var target = cell.get('target');
            if (source.id) {
                (this._out[source.id] || (this._out[source.id] = {}))[cell.id] = true;
            }
            if (target.id) {
                (this._in[target.id] || (this._in[target.id] = {}))[cell.id] = true;
            }
        } else {
            this._nodes[cell.id] = true;
        }
    },

    _restructureOnRemove: function(cell) {

        if (cell.isLink()) {
            delete this._edges[cell.id];
            var source = cell.get('source');
            var target = cell.get('target');
            if (source.id && this._out[source.id] && this._out[source.id][cell.id]) {
                delete this._out[source.id][cell.id];
            }
            if (target.id && this._in[target.id] && this._in[target.id][cell.id]) {
                delete this._in[target.id][cell.id];
            }
        } else {
            delete this._nodes[cell.id];
        }
    },

    _restructureOnReset: function(cells) {

        // Normalize into an array of cells. The original `cells` is GraphCells Backbone collection.
        cells = cells.models;

        this._out = {};
        this._in = {};
        this._nodes = {};
        this._edges = {};

        cells.forEach(this._restructureOnAdd, this);
    },

    _restructureOnChangeSource: function(link) {

        var prevSource = link.previous('source');
        if (prevSource.id && this._out[prevSource.id]) {
            delete this._out[prevSource.id][link.id];
        }
        var source = link.get('source');
        if (source.id) {
            (this._out[source.id] || (this._out[source.id] = {}))[link.id] = true;
        }
    },

    _restructureOnChangeTarget: function(link) {

        var prevTarget = link.previous('target');
        if (prevTarget.id && this._in[prevTarget.id]) {
            delete this._in[prevTarget.id][link.id];
        }
        var target = link.get('target');
        if (target.id) {
            (this._in[target.id] || (this._in[target.id] = {}))[link.id] = true;
        }
    },

    // Return all outbound edges for the node. Return value is an object
    // of the form: [edge] -> true
    getOutboundEdges: function(node) {

        return (this._out && this._out[node]) || {};
    },

    // Return all inbound edges for the node. Return value is an object
    // of the form: [edge] -> true
    getInboundEdges: function(node) {

        return (this._in && this._in[node]) || {};
    },

    toJSON: function() {

        // Backbone does not recursively call `toJSON()` on attributes that are themselves models/collections.
        // It just clones the attributes. Therefore, we must call `toJSON()` on the cells collection explicitely.
        var json = Backbone.Model.prototype.toJSON.apply(this, arguments);
        json.cells = this.get('cells').toJSON();
        return json;
    },

    fromJSON: function(json, opt) {

        if (!json.cells) {

            throw new Error('Graph JSON must contain cells array.');
        }

        return this.set(json, opt);
    },

    set: function(key, val, opt) {

        var attrs;

        // Handle both `key`, value and {key: value} style arguments.
        if (typeof key === 'object') {
            attrs = key;
            opt = val;
        } else {
            (attrs = {})[key] = val;
        }

        // Make sure that `cells` attribute is handled separately via resetCells().
        if (attrs.hasOwnProperty('cells')) {
            this.resetCells(attrs.cells, opt);
            attrs = joint.util.omit(attrs, 'cells');
        }

        // The rest of the attributes are applied via original set method.
        return Backbone.Model.prototype.set.call(this, attrs, opt);
    },

    clear: function(opt) {

        opt = joint.util.assign({}, opt, { clear: true });

        var collection = this.get('cells');

        if (collection.length === 0) return this;

        this.startBatch('clear', opt);

        // The elements come after the links.
        var cells = collection.sortBy(function(cell) {
            return cell.isLink() ? 1 : 2;
        });

        do {

            // Remove all the cells one by one.
            // Note that all the links are removed first, so it's
            // safe to remove the elements without removing the connected
            // links first.
            cells.shift().remove(opt);

        } while (cells.length > 0);

        this.stopBatch('clear');

        return this;
    },

    _prepareCell: function(cell, opt) {

        var attrs;
        if (cell instanceof Backbone.Model) {
            attrs = cell.attributes;
            if (!cell.graph && (!opt || !opt.dry)) {
                // An element can not be member of more than one graph.
                // A cell stops being the member of the graph after it's explicitely removed.
                cell.graph = this;
            }
        } else {
            // In case we're dealing with a plain JS object, we have to set the reference
            // to the `graph` right after the actual model is created. This happens in the `model()` function
            // of `joint.dia.GraphCells`.
            attrs = cell;
        }

        if (!joint.util.isString(attrs.type)) {
            throw new TypeError('dia.Graph: cell type must be a string.');
        }

        return cell;
    },

    maxZIndex: function() {

        var lastCell = this.get('cells').last();
        return lastCell ? (lastCell.get('z') || 0) : 0;
    },

    addCell: function(cell, opt) {

        if (Array.isArray(cell)) {

            return this.addCells(cell, opt);
        }

        if (cell instanceof Backbone.Model) {

            if (!cell.has('z')) {
                cell.set('z', this.maxZIndex() + 1);
            }

        } else if (cell.z === undefined) {

            cell.z = this.maxZIndex() + 1;
        }

        this.get('cells').add(this._prepareCell(cell, opt), opt || {});

        return this;
    },

    addCells: function(cells, opt) {

        if (cells.length) {

            cells = joint.util.flattenDeep(cells);
            opt.position = cells.length;

            this.startBatch('add');
            cells.forEach(function(cell) {
                opt.position--;
                this.addCell(cell, opt);
            }, this);
            this.stopBatch('add');
        }

        return this;
    },

    // When adding a lot of cells, it is much more efficient to
    // reset the entire cells collection in one go.
    // Useful for bulk operations and optimizations.
    resetCells: function(cells, opt) {

        var preparedCells = joint.util.toArray(cells).map(function(cell) {
            return this._prepareCell(cell, opt);
        }, this);
        this.get('cells').reset(preparedCells, opt);

        return this;
    },

    removeCells: function(cells, opt) {

        if (cells.length) {

            this.startBatch('remove');
            joint.util.invoke(cells, 'remove', opt);
            this.stopBatch('remove');
        }

        return this;
    },

    _removeCell: function(cell, collection, options) {

        options = options || {};

        if (!options.clear) {
            // Applications might provide a `disconnectLinks` option set to `true` in order to
            // disconnect links when a cell is removed rather then removing them. The default
            // is to remove all the associated links.
            if (options.disconnectLinks) {

                this.disconnectLinks(cell, options);

            } else {

                this.removeLinks(cell, options);
            }
        }
        // Silently remove the cell from the cells collection. Silently, because
        // `joint.dia.Cell.prototype.remove` already triggers the `remove` event which is
        // then propagated to the graph model. If we didn't remove the cell silently, two `remove` events
        // would be triggered on the graph model.
        this.get('cells').remove(cell, { silent: true });

        if (cell.graph === this) {
            // Remove the element graph reference only if the cell is the member of this graph.
            cell.graph = null;
        }
    },

    // Get a cell by `id`.
    getCell: function(id) {

        return this.get('cells').get(id);
    },

    getCells: function() {

        return this.get('cells').toArray();
    },

    getElements: function() {
        return Object.keys(this._nodes).map(this.getCell, this);
    },

    getLinks: function() {
        return Object.keys(this._edges).map(this.getCell, this);
    },

    getFirstCell: function() {

        return this.get('cells').first();
    },

    getLastCell: function() {

        return this.get('cells').last();
    },

    // Get all inbound and outbound links connected to the cell `model`.
    getConnectedLinks: function(model, opt) {

        opt = opt || {};

        var inbound = opt.inbound;
        var outbound = opt.outbound;
        if (inbound === undefined && outbound === undefined) {
            inbound = outbound = true;
        }

        // The final array of connected link models.
        var links = [];
        // Connected edges. This hash table ([edge] -> true) serves only
        // for a quick lookup to check if we already added a link.
        var edges = {};

        if (outbound) {
            joint.util.forIn(this.getOutboundEdges(model.id), function(exists, edge) {
                if (!edges[edge]) {
                    links.push(this.getCell(edge));
                    edges[edge] = true;
                }
            }.bind(this));
        }
        if (inbound) {
            joint.util.forIn(this.getInboundEdges(model.id), function(exists, edge) {
                // Skip links that were already added. Those must be self-loop links
                // because they are both inbound and outbond edges of the same element.
                if (!edges[edge]) {
                    links.push(this.getCell(edge));
                    edges[edge] = true;
                }
            }.bind(this));
        }

        // If 'deep' option is 'true', return all the links that are connected to any of the descendent cells
        // and are not descendents themselves.
        if (opt.deep) {

            var embeddedCells = model.getEmbeddedCells({ deep: true });
            // In the first round, we collect all the embedded edges so that we can exclude
            // them from the final result.
            var embeddedEdges = {};
            embeddedCells.forEach(function(cell) {
                if (cell.isLink()) {
                    embeddedEdges[cell.id] = true;
                }
            });
            embeddedCells.forEach(function(cell) {
                if (cell.isLink()) return;
                if (outbound) {
                    joint.util.forIn(this.getOutboundEdges(cell.id), function(exists, edge) {
                        if (!edges[edge] && !embeddedEdges[edge]) {
                            links.push(this.getCell(edge));
                            edges[edge] = true;
                        }
                    }.bind(this));
                }
                if (inbound) {
                    joint.util.forIn(this.getInboundEdges(cell.id), function(exists, edge) {
                        if (!edges[edge] && !embeddedEdges[edge]) {
                            links.push(this.getCell(edge));
                            edges[edge] = true;
                        }
                    }.bind(this));
                }
            }, this);
        }

        return links;
    },

    getNeighbors: function(model, opt) {

        opt = opt || {};

        var inbound = opt.inbound;
        var outbound = opt.outbound;
        if (inbound === undefined && outbound === undefined) {
            inbound = outbound = true;
        }

        var neighbors = this.getConnectedLinks(model, opt).reduce(function(res, link) {

            var source = link.get('source');
            var target = link.get('target');
            var loop = link.hasLoop(opt);

            // Discard if it is a point, or if the neighbor was already added.
            if (inbound && joint.util.has(source, 'id') && !res[source.id]) {

                var sourceElement = this.getCell(source.id);

                if (loop || (sourceElement && sourceElement !== model && (!opt.deep || !sourceElement.isEmbeddedIn(model)))) {
                    res[source.id] = sourceElement;
                }
            }

            // Discard if it is a point, or if the neighbor was already added.
            if (outbound && joint.util.has(target, 'id') && !res[target.id]) {

                var targetElement = this.getCell(target.id);

                if (loop || (targetElement && targetElement !== model && (!opt.deep || !targetElement.isEmbeddedIn(model)))) {
                    res[target.id] = targetElement;
                }
            }

            return res;
        }.bind(this), {});

        return joint.util.toArray(neighbors);
    },

    getCommonAncestor: function(/* cells */) {

        var cellsAncestors = Array.from(arguments).map(function(cell) {

            var ancestors = [];
            var parentId = cell.get('parent');

            while (parentId) {

                ancestors.push(parentId);
                parentId = this.getCell(parentId).get('parent');
            }

            return ancestors;

        }, this);

        cellsAncestors = cellsAncestors.sort(function(a, b) {
            return a.length - b.length;
        });

        var commonAncestor = joint.util.toArray(cellsAncestors.shift()).find(function(ancestor) {
            return cellsAncestors.every(function(cellAncestors) {
                return cellAncestors.includes(ancestor)
            });
        });

        return this.getCell(commonAncestor);
    },

    // Find the whole branch starting at `element`.
    // If `opt.deep` is `true`, take into account embedded elements too.
    // If `opt.breadthFirst` is `true`, use the Breadth-first search algorithm, otherwise use Depth-first search.
    getSuccessors: function(element, opt) {

        opt = opt || {};
        var res = [];
        // Modify the options so that it includes the `outbound` neighbors only. In other words, search forwards.
        this.search(element, function(el) {
            if (el !== element) {
                res.push(el);
            }
        }, joint.util.assign({}, opt, { outbound: true }));
        return res;
    },

    // Clone `cells` returning an object that maps the original cell ID to the clone. The number
    // of clones is exactly the same as the `cells.length`.
    // This function simply clones all the `cells`. However, it also reconstructs
    // all the `source/target` and `parent/embed` references within the `cells`.
    // This is the main difference from the `cell.clone()` method. The
    // `cell.clone()` method works on one single cell only.
    // For example, for a graph: `A --- L ---> B`, `cloneCells([A, L, B])`
    // returns `[A2, L2, B2]` resulting to a graph: `A2 --- L2 ---> B2`, i.e.
    // the source and target of the link `L2` is changed to point to `A2` and `B2`.
    cloneCells: function(cells) {

        cells = joint.util.uniq(cells);

        // A map of the form [original cell ID] -> [clone] helping
        // us to reconstruct references for source/target and parent/embeds.
        // This is also the returned value.
        var cloneMap = joint.util.toArray(cells).reduce(function(map, cell) {
            map[cell.id] = cell.clone();
            return map;
        }, {});

        joint.util.toArray(cells).forEach(function(cell) {

            var clone = cloneMap[cell.id];
            // assert(clone exists)

            if (clone.isLink()) {
                var source = clone.get('source');
                var target = clone.get('target');
                if (source.id && cloneMap[source.id]) {
                    // Source points to an element and the element is among the clones.
                    // => Update the source of the cloned link.
                    clone.prop('source/id', cloneMap[source.id].id);
                }
                if (target.id && cloneMap[target.id]) {
                    // Target points to an element and the element is among the clones.
                    // => Update the target of the cloned link.
                    clone.prop('target/id', cloneMap[target.id].id);
                }
            }

            // Find the parent of the original cell
            var parent = cell.get('parent');
            if (parent && cloneMap[parent]) {
                clone.set('parent', cloneMap[parent].id);
            }

            // Find the embeds of the original cell
            var embeds = joint.util.toArray(cell.get('embeds')).reduce(function(newEmbeds, embed) {
                // Embedded cells that are not being cloned can not be carried
                // over with other embedded cells.
                if (cloneMap[embed]) {
                    newEmbeds.push(cloneMap[embed].id);
                }
                return newEmbeds;
            }, []);

            if (!joint.util.isEmpty(embeds)) {
                clone.set('embeds', embeds);
            }
        });

        return cloneMap;
    },

    // Clone the whole subgraph (including all the connected links whose source/target is in the subgraph).
    // If `opt.deep` is `true`, also take into account all the embedded cells of all the subgraph cells.
    // Return a map of the form: [original cell ID] -> [clone].
    cloneSubgraph: function(cells, opt) {

        var subgraph = this.getSubgraph(cells, opt);
        return this.cloneCells(subgraph);
    },

    // Return `cells` and all the connected links that connect cells in the `cells` array.
    // If `opt.deep` is `true`, return all the cells including all their embedded cells
    // and all the links that connect any of the returned cells.
    // For example, for a single shallow element, the result is that very same element.
    // For two elements connected with a link: `A --- L ---> B`, the result for
    // `getSubgraph([A, B])` is `[A, L, B]`. The same goes for `getSubgraph([L])`, the result is again `[A, L, B]`.
    getSubgraph: function(cells, opt) {

        opt = opt || {};

        var subgraph = [];
        // `cellMap` is used for a quick lookup of existance of a cell in the `cells` array.
        var cellMap = {};
        var elements = [];
        var links = [];

        joint.util.toArray(cells).forEach(function(cell) {
            if (!cellMap[cell.id]) {
                subgraph.push(cell);
                cellMap[cell.id] = cell;
                if (cell.isLink()) {
                    links.push(cell);
                } else {
                    elements.push(cell);
                }
            }

            if (opt.deep) {
                var embeds = cell.getEmbeddedCells({ deep: true });
                embeds.forEach(function(embed) {
                    if (!cellMap[embed.id]) {
                        subgraph.push(embed);
                        cellMap[embed.id] = embed;
                        if (embed.isLink()) {
                            links.push(embed);
                        } else {
                            elements.push(embed);
                        }
                    }
                });
            }
        });

        links.forEach(function(link) {
            // For links, return their source & target (if they are elements - not points).
            var source = link.get('source');
            var target = link.get('target');
            if (source.id && !cellMap[source.id]) {
                var sourceElement = this.getCell(source.id);
                subgraph.push(sourceElement);
                cellMap[sourceElement.id] = sourceElement;
                elements.push(sourceElement);
            }
            if (target.id && !cellMap[target.id]) {
                var targetElement = this.getCell(target.id);
                subgraph.push(this.getCell(target.id));
                cellMap[targetElement.id] = targetElement;
                elements.push(targetElement);
            }
        }, this);

        elements.forEach(function(element) {
            // For elements, include their connected links if their source/target is in the subgraph;
            var links = this.getConnectedLinks(element, opt);
            links.forEach(function(link) {
                var source = link.get('source');
                var target = link.get('target');
                if (!cellMap[link.id] && source.id && cellMap[source.id] && target.id && cellMap[target.id]) {
                    subgraph.push(link);
                    cellMap[link.id] = link;
                }
            });
        }, this);

        return subgraph;
    },

    // Find all the predecessors of `element`. This is a reverse operation of `getSuccessors()`.
    // If `opt.deep` is `true`, take into account embedded elements too.
    // If `opt.breadthFirst` is `true`, use the Breadth-first search algorithm, otherwise use Depth-first search.
    getPredecessors: function(element, opt) {

        opt = opt || {};
        var res = [];
        // Modify the options so that it includes the `inbound` neighbors only. In other words, search backwards.
        this.search(element, function(el) {
            if (el !== element) {
                res.push(el);
            }
        }, joint.util.assign({}, opt, { inbound: true }));
        return res;
    },

    // Perform search on the graph.
    // If `opt.breadthFirst` is `true`, use the Breadth-first Search algorithm, otherwise use Depth-first search.
    // By setting `opt.inbound` to `true`, you can reverse the direction of the search.
    // If `opt.deep` is `true`, take into account embedded elements too.
    // `iteratee` is a function of the form `function(element) {}`.
    // If `iteratee` explicitely returns `false`, the searching stops.
    search: function(element, iteratee, opt) {

        opt = opt || {};
        if (opt.breadthFirst) {
            this.bfs(element, iteratee, opt);
        } else {
            this.dfs(element, iteratee, opt);
        }
    },

    // Breadth-first search.
    // If `opt.deep` is `true`, take into account embedded elements too.
    // If `opt.inbound` is `true`, reverse the search direction (it's like reversing all the link directions).
    // `iteratee` is a function of the form `function(element, distance) {}`.
    // where `element` is the currently visited element and `distance` is the distance of that element
    // from the root `element` passed the `bfs()`, i.e. the element we started the search from.
    // Note that the `distance` is not the shortest or longest distance, it is simply the number of levels
    // crossed till we visited the `element` for the first time. It is especially useful for tree graphs.
    // If `iteratee` explicitely returns `false`, the searching stops.
    bfs: function(element, iteratee, opt) {

        opt = opt || {};
        var visited = {};
        var distance = {};
        var queue = [];

        queue.push(element);
        distance[element.id] = 0;

        while (queue.length > 0) {
            var next = queue.shift();
            if (!visited[next.id]) {
                visited[next.id] = true;
                if (iteratee(next, distance[next.id]) === false) return;
                this.getNeighbors(next, opt).forEach(function(neighbor) {
                    distance[neighbor.id] = distance[next.id] + 1;
                    queue.push(neighbor);
                });
            }
        }
    },

    // Depth-first search.
    // If `opt.deep` is `true`, take into account embedded elements too.
    // If `opt.inbound` is `true`, reverse the search direction (it's like reversing all the link directions).
    // `iteratee` is a function of the form `function(element, distance) {}`.
    // If `iteratee` explicitely returns `false`, the search stops.
    dfs: function(element, iteratee, opt, _visited, _distance) {

        opt = opt || {};
        var visited = _visited || {};
        var distance = _distance || 0;
        if (iteratee(element, distance) === false) return;
        visited[element.id] = true;

        this.getNeighbors(element, opt).forEach(function(neighbor) {
            if (!visited[neighbor.id]) {
                this.dfs(neighbor, iteratee, opt, visited, distance + 1);
            }
        }, this);
    },

    // Get all the roots of the graph. Time complexity: O(|V|).
    getSources: function() {

        var sources = [];
        joint.util.forIn(this._nodes, function(exists, node) {
            if (!this._in[node] || joint.util.isEmpty(this._in[node])) {
                sources.push(this.getCell(node));
            }
        }.bind(this));
        return sources;
    },

    // Get all the leafs of the graph. Time complexity: O(|V|).
    getSinks: function() {

        var sinks = [];
        joint.util.forIn(this._nodes, function(exists, node) {
            if (!this._out[node] || joint.util.isEmpty(this._out[node])) {
                sinks.push(this.getCell(node));
            }
        }.bind(this));
        return sinks;
    },

    // Return `true` if `element` is a root. Time complexity: O(1).
    isSource: function(element) {

        return !this._in[element.id] || joint.util.isEmpty(this._in[element.id]);
    },

    // Return `true` if `element` is a leaf. Time complexity: O(1).
    isSink: function(element) {

        return !this._out[element.id] || joint.util.isEmpty(this._out[element.id]);
    },

    // Return `true` is `elementB` is a successor of `elementA`. Return `false` otherwise.
    isSuccessor: function(elementA, elementB) {

        var isSuccessor = false;
        this.search(elementA, function(element) {
            if (element === elementB && element !== elementA) {
                isSuccessor = true;
                return false;
            }
        }, { outbound: true });
        return isSuccessor;
    },

    // Return `true` is `elementB` is a predecessor of `elementA`. Return `false` otherwise.
    isPredecessor: function(elementA, elementB) {

        var isPredecessor = false;
        this.search(elementA, function(element) {
            if (element === elementB && element !== elementA) {
                isPredecessor = true;
                return false;
            }
        }, { inbound: true });
        return isPredecessor;
    },

    // Return `true` is `elementB` is a neighbor of `elementA`. Return `false` otherwise.
    // `opt.deep` controls whether to take into account embedded elements as well. See `getNeighbors()`
    // for more details.
    // If `opt.outbound` is set to `true`, return `true` only if `elementB` is a successor neighbor.
    // Similarly, if `opt.inbound` is set to `true`, return `true` only if `elementB` is a predecessor neighbor.
    isNeighbor: function(elementA, elementB, opt) {

        opt = opt || {};

        var inbound = opt.inbound;
        var outbound = opt.outbound;
        if (inbound === undefined && outbound === undefined) {
            inbound = outbound = true;
        }

        var isNeighbor = false;

        this.getConnectedLinks(elementA, opt).forEach(function(link) {

            var source = link.get('source');
            var target = link.get('target');

            // Discard if it is a point.
            if (inbound && joint.util.has(source, 'id') && source.id === elementB.id) {
                isNeighbor = true;
                return false;
            }

            // Discard if it is a point, or if the neighbor was already added.
            if (outbound && joint.util.has(target, 'id') && target.id === elementB.id) {
                isNeighbor = true;
                return false;
            }
        });

        return isNeighbor;
    },

    // Disconnect links connected to the cell `model`.
    disconnectLinks: function(model, options) {

        this.getConnectedLinks(model).forEach(function(link) {

            link.set(link.get('source').id === model.id ? 'source' : 'target', g.point(0, 0), options);
        });
    },

    // Remove links connected to the cell `model` completely.
    removeLinks: function(model, options) {

        joint.util.invoke(this.getConnectedLinks(model), 'remove', options);
    },

    // Find all elements at given point
    findModelsFromPoint: function(p) {

        return this.getElements().filter(function(el) {
            return el.getBBox().containsPoint(p);
        });
    },

    // Find all elements in given area
    findModelsInArea: function(rect, opt) {

        rect = g.rect(rect);
        opt = joint.util.defaults(opt || {}, { strict: false });

        var method = opt.strict ? 'containsRect' : 'intersect';

        return this.getElements().filter(function(el) {
            return rect[method](el.getBBox());
        });
    },

    // Find all elements under the given element.
    findModelsUnderElement: function(element, opt) {

        opt = joint.util.defaults(opt || {}, { searchBy: 'bbox' });

        var bbox = element.getBBox();
        var elements = (opt.searchBy == 'bbox')
            ? this.findModelsInArea(bbox)
            : this.findModelsFromPoint(bbox[opt.searchBy]());

        // don't account element itself or any of its descendents
        return elements.filter(function(el) {
            return element.id !== el.id && !el.isEmbeddedIn(element);
        });
    },


    // Return bounding box of all elements.
    getBBox: function(cells, opt) {

        return this.getCellsBBox(cells || this.getElements(), opt);
    },

    // Return the bounding box of all cells in array provided.
    // Links are being ignored.
    getCellsBBox: function(cells, opt) {

        return joint.util.toArray(cells).reduce(function(memo, cell) {
            if (cell.isLink()) return memo;
            if (memo) {
                return memo.union(cell.getBBox(opt));
            } else {
                return cell.getBBox(opt);
            }
        }, null);
    },

    translate: function(dx, dy, opt) {

        // Don't translate cells that are embedded in any other cell.
        var cells = this.getCells().filter(function(cell) {
            return !cell.isEmbedded();
        });

        joint.util.invoke(cells, 'translate', dx, dy, opt);
    },

    resize: function(width, height, opt) {

        return this.resizeCells(width, height, this.getCells(), opt);
    },

    resizeCells: function(width, height, cells, opt) {

        // `getBBox` method returns `null` if no elements provided.
        // i.e. cells can be an array of links
        var bbox = this.getCellsBBox(cells);
        if (bbox) {
            var sx = Math.max(width / bbox.width, 0);
            var sy = Math.max(height / bbox.height, 0);
            joint.util.invoke(cells, 'scale', sx, sy, bbox.origin(), opt);
        }

        return this;
    },

    startBatch: function(name, data) {

        data = data || {};
        this._batches[name] = (this._batches[name] || 0) + 1;

        return this.trigger('batch:start', joint.util.assign({}, data, { batchName: name }));
    },

    stopBatch: function(name, data) {

        data = data || {};
        this._batches[name] = (this._batches[name] || 0) - 1;

        return this.trigger('batch:stop', joint.util.assign({}, data, { batchName: name }));
    },

    hasActiveBatch: function(name) {
        if (name) {
            return this._batches[name];
        } else {
            return joint.util.toArray(this._batches).some(function(batches) {
                return batches > 0;
            });
        }
    }
});

joint.util.wrapWith(joint.dia.Graph.prototype, ['resetCells', 'addCells', 'removeCells'], 'cells');

(function(joint, _, g, $, util) {

    function isPercentage(val) {
        return util.isString(val) && val.slice(-1) === '%';
    }

    function setWrapper(attrName, dimension) {
        return function(value, refBBox) {
            var isValuePercentage = isPercentage(value);
            value = parseFloat(value);
            if (isValuePercentage) {
                value /= 100;
            }

            var attrs = {};
            if (isFinite(value)) {
                var attrValue = (isValuePercentage || value >= 0 && value <= 1)
                    ? value * refBBox[dimension]
                    : Math.max(value + refBBox[dimension], 0);
                attrs[attrName] = attrValue;
            }

            return attrs;
        };
    }

    function positionWrapper(axis, dimension, origin) {
        return function(value, refBBox) {
            var valuePercentage = isPercentage(value);
            value = parseFloat(value);
            if (valuePercentage) {
                value /= 100;
            }

            var delta;
            if (isFinite(value)) {
                var refOrigin = refBBox[origin]();
                if (valuePercentage || value > 0 && value < 1) {
                    delta = refOrigin[axis] + refBBox[dimension] * value;
                } else {
                    delta = refOrigin[axis] + value;
                }
            }

            var point = g.Point();
            point[axis] = delta || 0;
            return point;
        };
    }

    function offsetWrapper(axis, dimension, corner) {
        return function(value, nodeBBox) {
            var delta;
            if (value === 'middle') {
                delta = nodeBBox[dimension] / 2;
            } else if (value === corner) {
                delta = nodeBBox[dimension];
            } else if (isFinite(value)) {
                // TODO: or not to do a breaking change?
                delta = (value > -1 && value < 1) ? (-nodeBBox[dimension] * value) : -value;
            } else if (isPercentage(value)) {
                delta = nodeBBox[dimension] * parseFloat(value) / 100;
            } else {
                delta = 0;
            }

            var point = g.Point();
            point[axis] = -(nodeBBox[axis] + delta);
            return point;
        };
    }

    var attributesNS = joint.dia.attributes = {

        xlinkHref: {
            set: 'xlink:href'
        },

        xlinkShow: {
            set: 'xlink:show'
        },

        xmlSpace: {
            set: 'xml:space'
        },

        filter: {
            qualify: util.isPlainObject,
            set: function(filter) {
                return 'url(#' + this.paper.defineFilter(filter) + ')';
            }
        },

        fill: {
            qualify: util.isPlainObject,
            set: function(fill) {
                return 'url(#' + this.paper.defineGradient(fill) + ')';
            }
        },

        stroke: {
            qualify: util.isPlainObject,
            set: function(stroke) {
                return 'url(#' + this.paper.defineGradient(stroke) + ')';
            }
        },

        sourceMarker: {
            qualify: util.isPlainObject,
            set: function(marker) {
                return { 'marker-start': 'url(#' + this.paper.defineMarker(marker) + ')' };
            }
        },

        targetMarker: {
            qualify: util.isPlainObject,
            set: function(marker) {
                marker = util.assign({ transform: 'rotate(180)' }, marker);
                return { 'marker-end': 'url(#' + this.paper.defineMarker(marker) + ')' };
            }
        },

        vertexMarker: {
            qualify: util.isPlainObject,
            set: function(marker) {
                return { 'marker-mid': 'url(#' + this.paper.defineMarker(marker) + ')' };
            }
        },

        text: {
            set: function(text, refBBox, node, attrs) {
                var $node = $(node);
                var cacheName = 'joint-text';
                var cache = $node.data(cacheName);
                var textAttrs = joint.util.pick(attrs, 'lineHeight', 'annotations', 'textPath', 'x', 'eol');
                var fontSize = textAttrs.fontSize = attrs['font-size'] || attrs['fontSize'];
                var textHash = JSON.stringify([text, textAttrs]);
                // Update the text only if there was a change in the string
                // or any of its attributes.
                if (cache === undefined || cache !== textHash) {
                    // Chrome bug:
                    // Tspans positions defined as `em` are not updated
                    // when container `font-size` change.
                    if (fontSize) {
                        node.setAttribute('font-size', fontSize);
                    }
                    V(node).text('' + text, textAttrs);
                    $node.data(cacheName, textHash);
                }
            }
        },

        textWrap: {
            qualify: util.isPlainObject,
            set: function(value, refBBox, node, attrs) {
                // option `width`
                var width = value.width || 0;
                if (isPercentage(width)) {
                    refBBox.width *= parseFloat(width) / 100;
                } else if (width <= 0) {
                    refBBox.width += width;
                } else {
                    refBBox.width = width;
                }
                // option `height`
                var height = value.height || 0;
                if (isPercentage(height)) {
                    refBBox.height *= parseFloat(height) / 100;
                } else if (height <= 0) {
                    refBBox.height += height;
                } else {
                    refBBox.height = height;
                }
                // option `text`
                var wrappedText = joint.util.breakText('' + value.text, refBBox, {
                    'font-weight': attrs['font-weight'] || attrs.fontWeight,
                    'font-size': attrs['font-size'] || attrs.fontSize,
                    'font-family': attrs['font-family'] || attrs.fontFamily
                }, {
                    // Provide an existing SVG Document here
                    // instead of creating a temporary one over again.
                    svgDocument: this.paper.svg
                });

                V(node).text(wrappedText);
            }
        },

        lineHeight: {
            qualify: function(lineHeight, node, attrs) {
                return (attrs.text !== undefined);
            }
        },

        textPath: {
            qualify: function(textPath, node, attrs) {
                return (attrs.text !== undefined);
            }
        },

        annotations: {
            qualify: function(annotations, node, attrs) {
                return (attrs.text !== undefined);
            }
        },

        // `port` attribute contains the `id` of the port that the underlying magnet represents.
        port: {
            set: function(port) {
                return (port === null || port.id === undefined) ? port : port.id;
            }
        },

        // `style` attribute is special in the sense that it sets the CSS style of the subelement.
        style: {
            qualify: util.isPlainObject,
            set: function(styles, refBBox, node) {
                $(node).css(styles);
            }
        },

        html: {
            set: function(html, refBBox, node) {
                $(node).html(html + '');
            }
        },

        ref: {
            // We do not set `ref` attribute directly on an element.
            // The attribute itself does not qualify for relative positioning.
        },

        // if `refX` is in [0, 1] then `refX` is a fraction of bounding box width
        // if `refX` is < 0 then `refX`'s absolute values is the right coordinate of the bounding box
        // otherwise, `refX` is the left coordinate of the bounding box

        refX: {
            position: positionWrapper('x', 'width', 'origin')
        },

        refY: {
            position: positionWrapper('y', 'height', 'origin')
        },

        // `ref-dx` and `ref-dy` define the offset of the subelement relative to the right and/or bottom
        // coordinate of the reference element.

        refDx: {
            position: positionWrapper('x', 'width', 'corner')
        },

        refDy: {
            position: positionWrapper('y', 'height', 'corner')
        },

        // 'ref-width'/'ref-height' defines the width/height of the subelement relatively to
        // the reference element size
        // val in 0..1         ref-width = 0.75 sets the width to 75% of the ref. el. width
        // val < 0 || val > 1  ref-height = -20 sets the height to the the ref. el. height shorter by 20

        refWidth: {
            set: setWrapper('width', 'width')
        },

        refHeight: {
            set: setWrapper('height', 'height')
        },

        refRx: {
            set: setWrapper('rx', 'width')
        },

        refRy: {
            set: setWrapper('ry', 'height')
        },

        refCx: {
            set: setWrapper('cx', 'width')
        },

        refCy: {
            set: setWrapper('cy', 'height')
        },

        // `x-alignment` when set to `middle` causes centering of the subelement around its new x coordinate.
        // `x-alignment` when set to `right` uses the x coordinate as referenced to the right of the bbox.

        xAlignment: {
            offset: offsetWrapper('x', 'width', 'right')
        },

        // `y-alignment` when set to `middle` causes centering of the subelement around its new y coordinate.
        // `y-alignment` when set to `bottom` uses the y coordinate as referenced to the bottom of the bbox.

        yAlignment: {
            offset: offsetWrapper('y', 'height', 'bottom')
        }
    };

    // This allows to combine both absolute and relative positioning
    // refX: 50%, refX2: 20
    attributesNS.refX2 = attributesNS.refX;
    attributesNS.refY2 = attributesNS.refY;

    // Aliases for backwards compatibility
    attributesNS['ref-x'] = attributesNS.refX;
    attributesNS['ref-y'] = attributesNS.refY;
    attributesNS['ref-dy'] = attributesNS.refDy;
    attributesNS['ref-dx'] = attributesNS.refDx;
    attributesNS['ref-width'] = attributesNS.refWidth;
    attributesNS['ref-height'] = attributesNS.refHeight;
    attributesNS['x-alignment'] = attributesNS.xAlignment;
    attributesNS['y-alignment'] = attributesNS.yAlignment;

})(joint, _, g, $, joint.util);


// joint.dia.Cell base model.
// --------------------------

joint.dia.Cell = Backbone.Model.extend({

    // This is the same as Backbone.Model with the only difference that is uses joint.util.merge
    // instead of just _.extend. The reason is that we want to mixin attributes set in upper classes.
    constructor: function(attributes, options) {

        var defaults;
        var attrs = attributes || {};
        this.cid = joint.util.uniqueId('c');
        this.attributes = {};
        if (options && options.collection) this.collection = options.collection;
        if (options && options.parse) attrs = this.parse(attrs, options) || {};
        if ((defaults = joint.util.result(this, 'defaults'))) {
            //<custom code>
            // Replaced the call to _.defaults with joint.util.merge.
            attrs = joint.util.merge({}, defaults, attrs);
            //</custom code>
        }
        this.set(attrs, options);
        this.changed = {};
        this.initialize.apply(this, arguments);
    },

    translate: function(dx, dy, opt) {

        throw new Error('Must define a translate() method.');
    },

    toJSON: function() {

        var defaultAttrs = this.constructor.prototype.defaults.attrs || {};
        var attrs = this.attributes.attrs;
        var finalAttrs = {};

        // Loop through all the attributes and
        // omit the default attributes as they are implicitly reconstructable by the cell 'type'.
        joint.util.forIn(attrs, function(attr, selector) {

            var defaultAttr = defaultAttrs[selector];

            joint.util.forIn(attr, function(value, name) {

                // attr is mainly flat though it might have one more level (consider the `style` attribute).
                // Check if the `value` is object and if yes, go one level deep.
                if (joint.util.isObject(value) && !Array.isArray(value)) {

                    joint.util.forIn(value, function(value2, name2) {

                        if (!defaultAttr || !defaultAttr[name] || !joint.util.isEqual(defaultAttr[name][name2], value2)) {

                            finalAttrs[selector] = finalAttrs[selector] || {};
                            (finalAttrs[selector][name] || (finalAttrs[selector][name] = {}))[name2] = value2;
                        }
                    });

                } else if (!defaultAttr || !joint.util.isEqual(defaultAttr[name], value)) {
                    // `value` is not an object, default attribute for such a selector does not exist
                    // or it is different than the attribute value set on the model.

                    finalAttrs[selector] = finalAttrs[selector] || {};
                    finalAttrs[selector][name] = value;
                }
            });
        });

        var attributes = joint.util.cloneDeep(joint.util.omit(this.attributes, 'attrs'));
        //var attributes = JSON.parse(JSON.stringify(_.omit(this.attributes, 'attrs')));
        attributes.attrs = finalAttrs;

        return attributes;
    },

    initialize: function(options) {

        if (!options || !options.id) {

            this.set('id', joint.util.uuid(), { silent: true });
        }

        this._transitionIds = {};

        // Collect ports defined in `attrs` and keep collecting whenever `attrs` object changes.
        this.processPorts();
        this.on('change:attrs', this.processPorts, this);
    },

    /**
     * @deprecated
     */
    processPorts: function() {

        // Whenever `attrs` changes, we extract ports from the `attrs` object and store it
        // in a more accessible way. Also, if any port got removed and there were links that had `target`/`source`
        // set to that port, we remove those links as well (to follow the same behaviour as
        // with a removed element).

        var previousPorts = this.ports;

        // Collect ports from the `attrs` object.
        var ports = {};
        joint.util.forIn(this.get('attrs'), function(attrs, selector) {

            if (attrs && attrs.port) {

                // `port` can either be directly an `id` or an object containing an `id` (and potentially other data).
                if (attrs.port.id !== undefined) {
                    ports[attrs.port.id] = attrs.port;
                } else {
                    ports[attrs.port] = { id: attrs.port };
                }
            }
        });

        // Collect ports that have been removed (compared to the previous ports) - if any.
        // Use hash table for quick lookup.
        var removedPorts = {};
        joint.util.forIn(previousPorts, function(port, id) {

            if (!ports[id]) removedPorts[id] = true;
        });

        // Remove all the incoming/outgoing links that have source/target port set to any of the removed ports.
        if (this.graph && !joint.util.isEmpty(removedPorts)) {

            var inboundLinks = this.graph.getConnectedLinks(this, { inbound: true });
            inboundLinks.forEach(function(link) {

                if (removedPorts[link.get('target').port]) link.remove();
            });

            var outboundLinks = this.graph.getConnectedLinks(this, { outbound: true });
            outboundLinks.forEach(function(link) {

                if (removedPorts[link.get('source').port]) link.remove();
            });
        }

        // Update the `ports` object.
        this.ports = ports;
    },

    remove: function(opt) {

        opt = opt || {};

        // Store the graph in a variable because `this.graph` won't' be accessbile after `this.trigger('remove', ...)` down below.
        var graph = this.graph;
        if (graph) {
            graph.startBatch('remove');
        }

        // First, unembed this cell from its parent cell if there is one.
        var parentCellId = this.get('parent');
        if (parentCellId) {

            var parentCell = graph && graph.getCell(parentCellId);
            parentCell.unembed(this);
        }

        joint.util.invoke(this.getEmbeddedCells(), 'remove', opt);

        this.trigger('remove', this, this.collection, opt);

        if (graph) {
            graph.stopBatch('remove');
        }

        return this;
    },

    toFront: function(opt) {

        if (this.graph) {

            opt = opt || {};

            var z = (this.graph.getLastCell().get('z') || 0) + 1;

            this.startBatch('to-front').set('z', z, opt);

            if (opt.deep) {

                var cells = this.getEmbeddedCells({ deep: true, breadthFirst: true });
                cells.forEach(function(cell) { cell.set('z', ++z, opt); });

            }

            this.stopBatch('to-front');
        }

        return this;
    },

    toBack: function(opt) {

        if (this.graph) {

            opt = opt || {};

            var z = (this.graph.getFirstCell().get('z') || 0) - 1;

            this.startBatch('to-back');

            if (opt.deep) {

                var cells = this.getEmbeddedCells({ deep: true, breadthFirst: true });
                cells.reverse().forEach(function(cell) { cell.set('z', z--, opt); });
            }

            this.set('z', z, opt).stopBatch('to-back');
        }

        return this;
    },

    embed: function(cell, opt) {

        if (this === cell || this.isEmbeddedIn(cell)) {

            throw new Error('Recursive embedding not allowed.');

        } else {

            this.startBatch('embed');

            var embeds = joint.util.assign([], this.get('embeds'));

            // We keep all element ids after link ids.
            embeds[cell.isLink() ? 'unshift' : 'push'](cell.id);

            cell.set('parent', this.id, opt);
            this.set('embeds', joint.util.uniq(embeds), opt);

            this.stopBatch('embed');
        }

        return this;
    },

    unembed: function(cell, opt) {

        this.startBatch('unembed');

        cell.unset('parent', opt);
        this.set('embeds', joint.util.without(this.get('embeds'), cell.id), opt);

        this.stopBatch('unembed');

        return this;
    },

    // Return an array of ancestor cells.
    // The array is ordered from the parent of the cell
    // to the most distant ancestor.
    getAncestors: function() {

        var ancestors = [];
        var parentId = this.get('parent');

        if (!this.graph) {
            return ancestors;
        }

        while (parentId !== undefined) {
            var parent = this.graph.getCell(parentId);
            if (parent !== undefined) {
                ancestors.push(parent);
                parentId = parent.get('parent');
            } else {
                break;
            }
        }

        return ancestors;
    },

    getEmbeddedCells: function(opt) {

        opt = opt || {};

        // Cell models can only be retrieved when this element is part of a collection.
        // There is no way this element knows about other cells otherwise.
        // This also means that calling e.g. `translate()` on an element with embeds before
        // adding it to a graph does not translate its embeds.
        if (this.graph) {

            var cells;

            if (opt.deep) {

                if (opt.breadthFirst) {

                    // breadthFirst algorithm
                    cells = [];
                    var queue = this.getEmbeddedCells();

                    while (queue.length > 0) {

                        var parent = queue.shift();
                        cells.push(parent);
                        queue.push.apply(queue, parent.getEmbeddedCells());
                    }

                } else {

                    // depthFirst algorithm
                    cells = this.getEmbeddedCells();
                    cells.forEach(function(cell) {
                        cells.push.apply(cells, cell.getEmbeddedCells(opt));
                    });
                }

            } else {

                cells = joint.util.toArray(this.get('embeds')).map(this.graph.getCell, this.graph);
            }

            return cells;
        }
        return [];
    },

    isEmbeddedIn: function(cell, opt) {

        var cellId = joint.util.isString(cell) ? cell : cell.id;
        var parentId = this.get('parent');

        opt = joint.util.defaults({ deep: true }, opt);

        // See getEmbeddedCells().
        if (this.graph && opt.deep) {

            while (parentId) {
                if (parentId === cellId) {
                    return true;
                }
                parentId = this.graph.getCell(parentId).get('parent');
            }

            return false;

        } else {

            // When this cell is not part of a collection check
            // at least whether it's a direct child of given cell.
            return parentId === cellId;
        }
    },

    // Whether or not the cell is embedded in any other cell.
    isEmbedded: function() {

        return !!this.get('parent');
    },

    // Isolated cloning. Isolated cloning has two versions: shallow and deep (pass `{ deep: true }` in `opt`).
    // Shallow cloning simply clones the cell and returns a new cell with different ID.
    // Deep cloning clones the cell and all its embedded cells recursively.
    clone: function(opt) {

        opt = opt || {};

        if (!opt.deep) {
            // Shallow cloning.

            var clone = Backbone.Model.prototype.clone.apply(this, arguments);
            // We don't want the clone to have the same ID as the original.
            clone.set('id', joint.util.uuid());
            // A shallow cloned element does not carry over the original embeds.
            clone.unset('embeds');
            // And can not be embedded in any cell
            // as the clone is not part of the graph.
            clone.unset('parent');

            return clone;

        } else {
            // Deep cloning.

            // For a deep clone, simply call `graph.cloneCells()` with the cell and all its embedded cells.
            return joint.util.toArray(joint.dia.Graph.prototype.cloneCells.call(null, [this].concat(this.getEmbeddedCells({ deep: true }))));
        }
    },

    // A convenient way to set nested properties.
    // This method merges the properties you'd like to set with the ones
    // stored in the cell and makes sure change events are properly triggered.
    // You can either set a nested property with one object
    // or use a property path.
    // The most simple use case is:
    // `cell.prop('name/first', 'John')` or
    // `cell.prop({ name: { first: 'John' } })`.
    // Nested arrays are supported too:
    // `cell.prop('series/0/data/0/degree', 50)` or
    // `cell.prop({ series: [ { data: [ { degree: 50 } ] } ] })`.
    prop: function(props, value, opt) {

        var delim = '/';
        var isString = joint.util.isString(props);

        if (isString || Array.isArray(props)) {
            // Get/set an attribute by a special path syntax that delimits
            // nested objects by the colon character.

            if (arguments.length > 1) {

                var path;
                var pathArray;

                if (isString) {
                    path = props;
                    pathArray = path.split('/')
                } else {
                    path = props.join(delim);
                    pathArray = props.slice();
                }

                var property = pathArray[0];
                var pathArrayLength = pathArray.length;

                opt = opt || {};
                opt.propertyPath = path;
                opt.propertyValue = value;
                opt.propertyPathArray = pathArray;

                if (pathArrayLength === 1) {
                    // Property is not nested. We can simply use `set()`.
                    return this.set(property, value, opt);
                }

                var update = {};
                // Initialize the nested object. Subobjects are either arrays or objects.
                // An empty array is created if the sub-key is an integer. Otherwise, an empty object is created.
                // Note that this imposes a limitation on object keys one can use with Inspector.
                // Pure integer keys will cause issues and are therefore not allowed.
                var initializer = update;
                var prevProperty = property;

                for (var i = 1; i < pathArrayLength; i++) {
                    var pathItem = pathArray[i];
                    var isArrayIndex = Number.isFinite(isString ? Number(pathItem) : pathItem);
                    initializer = initializer[prevProperty] = isArrayIndex ? [] : {};
                    prevProperty = pathItem;
                }

                // Fill update with the `value` on `path`.
                update = joint.util.setByPath(update, pathArray, value, '/');

                var baseAttributes = joint.util.merge({}, this.attributes);
                // if rewrite mode enabled, we replace value referenced by path with
                // the new one (we don't merge).
                opt.rewrite && joint.util.unsetByPath(baseAttributes, path, '/');

                // Merge update with the model attributes.
                var attributes = joint.util.merge(baseAttributes, update);
                // Finally, set the property to the updated attributes.
                return this.set(property, attributes[property], opt);

            } else {

                return joint.util.getByPath(this.attributes, props, delim);
            }
        }

        return this.set(joint.util.merge({}, this.attributes, props), value);
    },

    // A convient way to unset nested properties
    removeProp: function(path, opt) {

        // Once a property is removed from the `attrs` attribute
        // the cellView will recognize a `dirty` flag and rerender itself
        // in order to remove the attribute from SVG element.
        opt = opt || {};
        opt.dirty = true;

        var pathArray = Array.isArray(path) ? path : path.split('/');

        if (pathArray.length === 1) {
            // A top level property
            return this.unset(path, opt);
        }

        // A nested property
        var property = pathArray[0];
        var nestedPath = pathArray.slice(1);
        var propertyValue = joint.util.merge({}, this.get(property));

        joint.util.unsetByPath(propertyValue, nestedPath, '/');

        return this.set(property, propertyValue, opt);
    },

    // A convenient way to set nested attributes.
    attr: function(attrs, value, opt) {

        var args = Array.from(arguments);
        if (args.length === 0) {
            return this.get('attrs');
        }

        if (Array.isArray(attrs)) {
            args[0] = ['attrs'].concat(attrs);
        } else if (joint.util.isString(attrs)) {
            // Get/set an attribute by a special path syntax that delimits
            // nested objects by the colon character.
            args[0] = 'attrs/' + attrs;

        } else {

            args[0] = { 'attrs' : attrs };
        }

        return this.prop.apply(this, args);
    },

    // A convenient way to unset nested attributes
    removeAttr: function(path, opt) {

        if (Array.isArray(path)) {

            return this.removeProp(['attrs'].concat(path));
        }

        return this.removeProp('attrs/' + path, opt);
    },

    transition: function(path, value, opt, delim) {

        delim = delim || '/';

        var defaults = {
            duration: 100,
            delay: 10,
            timingFunction: joint.util.timing.linear,
            valueFunction: joint.util.interpolate.number
        };

        opt = joint.util.assign(defaults, opt);

        var firstFrameTime = 0;
        var interpolatingFunction;

        var setter = function(runtime) {

            var id, progress, propertyValue;

            firstFrameTime = firstFrameTime || runtime;
            runtime -= firstFrameTime;
            progress = runtime / opt.duration;

            if (progress < 1) {
                this._transitionIds[path] = id = joint.util.nextFrame(setter);
            } else {
                progress = 1;
                delete this._transitionIds[path];
            }

            propertyValue = interpolatingFunction(opt.timingFunction(progress));

            opt.transitionId = id;

            this.prop(path, propertyValue, opt);

            if (!id) this.trigger('transition:end', this, path);

        }.bind(this);

        var initiator = function(callback) {

            this.stopTransitions(path);

            interpolatingFunction = opt.valueFunction(joint.util.getByPath(this.attributes, path, delim), value);

            this._transitionIds[path] = joint.util.nextFrame(callback);

            this.trigger('transition:start', this, path);

        }.bind(this);

        return setTimeout(initiator, opt.delay, setter);
    },

    getTransitions: function() {
        return Object.keys(this._transitionIds);
    },

    stopTransitions: function(path, delim) {

        delim = delim || '/';

        var pathArray = path && path.split(delim);

        _(this._transitionIds).keys().filter(pathArray && function(key) {

            return joint.util.isEqual(pathArray, key.split(delim).slice(0, pathArray.length));

        }).each(function(key) {

            joint.util.cancelFrame(this._transitionIds[key]);

            delete this._transitionIds[key];

            this.trigger('transition:end', this, key);

        }, this);

        return this;
    },

    // A shorcut making it easy to create constructs like the following:
    // `var el = (new joint.shapes.basic.Rect).addTo(graph)`.
    addTo: function(graph, opt) {

        graph.addCell(this, opt);
        return this;
    },

    // A shortcut for an equivalent call: `paper.findViewByModel(cell)`
    // making it easy to create constructs like the following:
    // `cell.findView(paper).highlight()`
    findView: function(paper) {

        return paper.findViewByModel(this);
    },

    isElement: function() {

        return false;
    },

    isLink: function() {

        return false;
    },

    startBatch: function(name, opt) {
        if (this.graph) { this.graph.startBatch(name, joint.util.assign({}, opt, { cell: this })); }
        return this;
    },

    stopBatch: function(name, opt) {
        if (this.graph) { this.graph.stopBatch(name, joint.util.assign({}, opt, { cell: this })); }
        return this;
    }

}, {

    getAttributeDefinition: function(attrName) {

        var defNS = this.attributes;
        var globalDefNS = joint.dia.attributes;
        return (defNS && defNS[attrName]) || globalDefNS[attrName];
    },

    define: function(type, defaults, protoProps, staticProps) {

        protoProps = joint.util.assign({
            defaults: joint.util.defaultsDeep({ type: type }, defaults, this.prototype.defaults)
        }, protoProps);

        var Cell = this.extend(protoProps, staticProps);
        joint.util.setByPath(joint.shapes, type, Cell, '.');
        return Cell;
    }
});

// joint.dia.CellView base view and controller.
// --------------------------------------------

// This is the base view and controller for `joint.dia.ElementView` and `joint.dia.LinkView`.

joint.dia.CellView = joint.mvc.View.extend({

    tagName: 'g',

    svgElement: true,

    className: function() {

        var classNames = ['cell'];
        var type = this.model.get('type');

        if (type) {

            type.toLowerCase().split('.').forEach(function(value, index, list) {
                classNames.push('type-' + list.slice(0, index + 1).join('-'));
            });
        }

        return classNames.join(' ');
    },

    attributes: function() {

        return { 'model-id': this.model.id };
    },

    constructor: function(options) {

        // Make sure a global unique id is assigned to this view. Store this id also to the properties object.
        // The global unique id makes sure that the same view can be rendered on e.g. different machines and
        // still be associated to the same object among all those clients. This is necessary for real-time
        // collaboration mechanism.
        options.id = options.id || joint.util.guid(this);

        joint.mvc.View.call(this, options);
    },

    init: function() {

        joint.util.bindAll(this, 'remove', 'update');

        // Store reference to this to the <g> DOM element so that the view is accessible through the DOM tree.
        this.$el.data('view', this);

        // Add the cell's type to the view's element as a data attribute.
        this.$el.attr('data-type', this.model.get('type'));

        this.listenTo(this.model, 'change:attrs', this.onChangeAttrs);
    },

    onChangeAttrs: function(cell, attrs, opt) {

        if (opt.dirty) {

            // dirty flag could be set when a model attribute was removed and it needs to be cleared
            // also from the DOM element. See cell.removeAttr().
            return this.render();
        }

        return this.update(cell, attrs, opt);
    },

    // Return `true` if cell link is allowed to perform a certain UI `feature`.
    // Example: `can('vertexMove')`, `can('labelMove')`.
    can: function(feature) {

        var interactive = joint.util.isFunction(this.options.interactive)
                            ? this.options.interactive(this)
                            : this.options.interactive;

        return (joint.util.isObject(interactive) && interactive[feature] !== false) ||
                (joint.util.isBoolean(interactive) && interactive !== false);
    },

    findBySelector: function(selector, root) {

        var $root = $(root || this.el);
        // These are either descendants of `this.$el` of `this.$el` itself.
        // `.` is a special selector used to select the wrapping `<g>` element.
        return (selector === '.') ? $root : $root.find(selector);
    },

    notify: function(eventName) {

        if (this.paper) {

            var args = Array.prototype.slice.call(arguments, 1);

            // Trigger the event on both the element itself and also on the paper.
            this.trigger.apply(this, [eventName].concat(args));

            // Paper event handlers receive the view object as the first argument.
            this.paper.trigger.apply(this.paper, [eventName, this].concat(args));
        }
    },

    getStrokeBBox: function(el) {
        // Return a bounding box rectangle that takes into account stroke.
        // Note that this is a naive and ad-hoc implementation that does not
        // works only in certain cases and should be replaced as soon as browsers will
        // start supporting the getStrokeBBox() SVG method.
        // @TODO any better solution is very welcome!

        var isMagnet = !!el;

        el = el || this.el;
        var bbox = V(el).getBBox({ target: this.paper.viewport });

        var strokeWidth;
        if (isMagnet) {

            strokeWidth = V(el).attr('stroke-width');

        } else {

            strokeWidth = this.model.attr('rect/stroke-width') || this.model.attr('circle/stroke-width') || this.model.attr('ellipse/stroke-width') || this.model.attr('path/stroke-width');
        }

        strokeWidth = parseFloat(strokeWidth) || 0;

        return g.rect(bbox).moveAndExpand({ x: -strokeWidth / 2, y: -strokeWidth / 2, width: strokeWidth, height: strokeWidth });
    },

    getBBox: function() {

        return this.vel.getBBox({ target: this.paper.viewport });
    },

    highlight: function(el, opt) {

        el = !el ? this.el : this.$(el)[0] || this.el;

        // set partial flag if the highlighted element is not the entire view.
        opt = opt || {};
        opt.partial = (el !== this.el);

        this.notify('cell:highlight', el, opt);
        return this;
    },

    unhighlight: function(el, opt) {

        el = !el ? this.el : this.$(el)[0] || this.el;

        opt = opt || {};
        opt.partial = el != this.el;

        this.notify('cell:unhighlight', el, opt);
        return this;
    },

    // Find the closest element that has the `magnet` attribute set to `true`. If there was not such
    // an element found, return the root element of the cell view.
    findMagnet: function(el) {

        var $el = this.$(el);
        var $rootEl = this.$el;

        if ($el.length === 0) {
            $el = $rootEl;
        }

        do {

            var magnet = $el.attr('magnet');
            if ((magnet || $el.is($rootEl)) && magnet !== 'false') {
                return $el[0];
            }

            $el = $el.parent();

        } while ($el.length > 0);

        // If the overall cell has set `magnet === false`, then return `undefined` to
        // announce there is no magnet found for this cell.
        // This is especially useful to set on cells that have 'ports'. In this case,
        // only the ports have set `magnet === true` and the overall element has `magnet === false`.
        return undefined;
    },

    // Construct a unique selector for the `el` element within this view.
    // `prevSelector` is being collected through the recursive call.
    // No value for `prevSelector` is expected when using this method.
    getSelector: function(el, prevSelector) {

        if (el === this.el) {
            return prevSelector;
        }

        var selector;

        if (el) {

            var nthChild = V(el).index() + 1;
            selector = el.tagName + ':nth-child(' + nthChild + ')';

            if (prevSelector) {
                selector += ' > ' + prevSelector;
            }

            selector = this.getSelector(el.parentNode, selector);
        }

        return selector;
    },

    getAttributeDefinition: function(attrName) {

        return this.model.constructor.getAttributeDefinition(attrName);
    },

    setNodeAttributes: function(node, attrs) {

        if (!joint.util.isEmpty(attrs)) {
            if (node instanceof SVGElement) {
                V(node).attr(attrs);
            } else {
                $(node).attr(attrs);
            }
        }
    },

    processNodeAttributes: function(node, attrs) {

        var attrName, attrVal, def, i, n;
        var normalAttrs, setAttrs, positionAttrs, offsetAttrs;
        var relatives = [];
        // divide the attributes between normal and special
        for (attrName in attrs) {
            if (!attrs.hasOwnProperty(attrName)) continue;
            attrVal = attrs[attrName];
            def = this.getAttributeDefinition(attrName);
            if (def && (!joint.util.isFunction(def.qualify) || def.qualify.call(this, attrVal, node, attrs))) {
                if (joint.util.isString(def.set)) {
                    normalAttrs || (normalAttrs = {});
                    normalAttrs[def.set] = attrVal;
                }
                if (attrVal !== null) {
                    relatives.push(attrName, def);
                }
            } else {
                normalAttrs || (normalAttrs = {});
                normalAttrs[joint.util.toKebabCase(attrName)] = attrVal;
            }
        }

        // handle the rest of attributes via related method
        // from the special attributes namespace.
        for (i = 0, n = relatives.length; i < n; i+=2) {
            attrName = relatives[i];
            def = relatives[i+1];
            attrVal = attrs[attrName];
            if (joint.util.isFunction(def.set)) {
                setAttrs || (setAttrs = {});
                setAttrs[attrName] = attrVal;
            }
            if (joint.util.isFunction(def.position)) {
                positionAttrs || (positionAttrs = {});
                positionAttrs[attrName] = attrVal;
            }
            if (joint.util.isFunction(def.offset)) {
                offsetAttrs || (offsetAttrs = {});
                offsetAttrs[attrName] = attrVal;
            }
        }

        return {
            raw: attrs,
            normal: normalAttrs,
            set: setAttrs,
            position: positionAttrs,
            offset: offsetAttrs
        };
    },

    updateRelativeAttributes: function(node, attrs, refBBox, opt) {

        opt || (opt = {});

        var attrName, attrVal, def;
        var rawAttrs = attrs.raw || {};
        var nodeAttrs = attrs.normal || {};
        var setAttrs = attrs.set;
        var positionAttrs = attrs.position;
        var offsetAttrs = attrs.offset;

        for (attrName in setAttrs) {
            attrVal = setAttrs[attrName];
            def = this.getAttributeDefinition(attrName);
            // SET - set function should return attributes to be set on the node,
            // which will affect the node dimensions based on the reference bounding
            // box. e.g. `width`, `height`, `d`, `rx`, `ry`, `points
            var setResult = def.set.call(this, attrVal, refBBox.clone(), node, rawAttrs);
            if (joint.util.isObject(setResult)) {
                joint.util.assign(nodeAttrs, setResult);
            } else if (setResult !== undefined) {
                nodeAttrs[attrName] = setResult;
            }
        }

        if (node instanceof HTMLElement) {
            // TODO: setting the `transform` attribute on HTMLElements
            // via `node.style.transform = 'matrix(...)';` would introduce
            // a breaking change (e.g. basic.TextBlock).
            this.setNodeAttributes(node, nodeAttrs);
            return;
        }

        // The final translation of the subelement.
        var nodeTransform = nodeAttrs.transform;
        var nodeMatrix = V.transformStringToMatrix(nodeTransform);
        var nodePosition = g.Point(nodeMatrix.e, nodeMatrix.f);
        if (nodeTransform) {
            nodeAttrs = joint.util.omit(nodeAttrs, 'transform');
            nodeMatrix.e = nodeMatrix.f = 0;
        }

        // Calculate node scale determined by the scalable group
        // only if later needed.
        var sx, sy, translation;
        if (positionAttrs || offsetAttrs) {
            var nodeScale = this.getNodeScale(node, opt.scalableNode);
            sx = nodeScale.sx;
            sy = nodeScale.sy;
        }

        var positioned = false;
        for (attrName in positionAttrs) {
            attrVal = positionAttrs[attrName];
            def = this.getAttributeDefinition(attrName);
            // POSITION - position function should return a point from the
            // reference bounding box. The default position of the node is x:0, y:0 of
            // the reference bounding box or could be further specify by some
            // SVG attributes e.g. `x`, `y`
            translation = def.position.call(this, attrVal, refBBox.clone(), node, rawAttrs);
            if (translation) {
                nodePosition.offset(g.Point(translation).scale(sx, sy));
                positioned || (positioned = true);
            }
        }

        // The node bounding box could depend on the `size` set from the previous loop.
        // Here we know, that all the size attributes have been already set.
        this.setNodeAttributes(node, nodeAttrs);

        var offseted = false;
        if (offsetAttrs) {
            // Check if the node is visible
            var nodeClientRect = node.getBoundingClientRect();
            if (nodeClientRect.width > 0 && nodeClientRect.height > 0) {
                var nodeBBox = V.transformRect(node.getBBox(), nodeMatrix).scale(1 / sx, 1 / sy);
                for (attrName in offsetAttrs) {
                    attrVal = offsetAttrs[attrName];
                    def = this.getAttributeDefinition(attrName);
                    // OFFSET - offset function should return a point from the element
                    // bounding box. The default offset point is x:0, y:0 (origin) or could be further
                    // specify with some SVG attributes e.g. `text-anchor`, `cx`, `cy`
                    translation = def.offset.call(this, attrVal, nodeBBox, node, rawAttrs);
                    if (translation) {
                        nodePosition.offset(g.Point(translation).scale(sx, sy));
                        offseted || (offseted = true);
                    }
                }
            }
        }

        // Do not touch node's transform attribute if there is no transformation applied.
        if (nodeTransform !== undefined || positioned || offseted) {
            // Round the coordinates to 1 decimal point.
            nodePosition.round(1);
            nodeMatrix.e = nodePosition.x;
            nodeMatrix.f = nodePosition.y;
            node.setAttribute('transform', V.matrixToTransformString(nodeMatrix));
        }
    },

    getNodeScale: function(node, scalableNode) {

        // Check if the node is a descendant of the scalable group.
        var sx, sy;
        if (scalableNode && scalableNode.contains(node)) {
            var scale = scalableNode.scale();
            sx = 1 / scale.sx;
            sy = 1 / scale.sy;
        } else {
            sx = 1;
            sy = 1;
        }

        return { sx: sx, sy: sy };
    },

    findNodesAttributes: function(attrs, root, selectorCache) {

        // TODO: merge attributes in order defined by `index` property

        var nodesAttrs = {};

        for (var selector in attrs) {
            if (!attrs.hasOwnProperty(selector)) continue;
            var $selected = selectorCache[selector] = this.findBySelector(selector, root);

            for (var i = 0, n = $selected.length; i < n; i++) {
                var node = $selected[i];
                var nodeId = V.ensureId(node);
                var nodeAttrs = attrs[selector];
                var prevNodeAttrs = nodesAttrs[nodeId];
                if (prevNodeAttrs) {
                    if (!prevNodeAttrs.merged) {
                        prevNodeAttrs.merged = true;
                        prevNodeAttrs.attributes = joint.util.cloneDeep(prevNodeAttrs.attributes);
                    }
                    joint.util.merge(prevNodeAttrs.attributes, nodeAttrs);
                } else {
                    nodesAttrs[nodeId] = {
                        attributes: nodeAttrs,
                        node: node,
                        merged: false
                    };
                }
            }
        }

        return nodesAttrs;
    },

    // Default is to process the `model.attributes.attrs` object and set attributes on subelements based on the selectors,
    // unless `attrs` parameter was passed.
    updateDOMSubtreeAttributes: function(rootNode, attrs, opt) {

        opt || (opt = {});
        opt.rootBBox || (opt.rootBBox = g.Rect());

        // Cache table for query results and bounding box calculation.
        // Note that `selectorCache` needs to be invalidated for all
        // `updateAttributes` calls, as the selectors might pointing
        // to nodes designated by an attribute or elements dynamically
        // created.
        var selectorCache = {};
        var bboxCache = {};
        var relativeItems = [];
        var item, node, nodeAttrs, nodeData, processedAttrs;

        var roAttrs = opt.roAttributes;
        var nodesAttrs = this.findNodesAttributes(roAttrs || attrs, rootNode, selectorCache);
        // `nodesAttrs` are different from all attributes, when
        // rendering only  attributes sent to this method.
        var nodesAllAttrs = (roAttrs)
            ? nodesAllAttrs = this.findNodesAttributes(attrs, rootNode, selectorCache)
            : nodesAttrs;

        for (var nodeId in nodesAttrs) {
            nodeData = nodesAttrs[nodeId];
            nodeAttrs = nodeData.attributes;
            node = nodeData.node;
            processedAttrs = this.processNodeAttributes(node, nodeAttrs);

            if (!processedAttrs.set && !processedAttrs.position && !processedAttrs.offset) {
                // Set all the normal attributes right on the SVG/HTML element.
                this.setNodeAttributes(node, processedAttrs.normal);

            } else {

                var nodeAllAttrs = nodesAllAttrs[nodeId] && nodesAllAttrs[nodeId].attributes;
                var refSelector = (nodeAllAttrs && (nodeAttrs.ref === undefined))
                    ? nodeAllAttrs.ref
                    : nodeAttrs.ref;

                var refNode;
                if (refSelector) {
                    refNode = (selectorCache[refSelector] || this.findBySelector(refSelector, rootNode))[0];
                    if (!refNode) {
                        throw new Error('dia.ElementView: "' + refSelector + '" reference does not exists.');
                    }
                } else {
                    refNode = null;
                }

                item = {
                    node: node,
                    refNode: refNode,
                    processedAttributes: processedAttrs,
                    allAttributes: nodeAllAttrs
                };

                // If an element in the list is positioned relative to this one, then
                // we want to insert this one before it in the list.
                var itemIndex = relativeItems.findIndex(function(item) {
                    return item.refNode === node;
                });

                if (itemIndex > -1) {
                    relativeItems.splice(itemIndex, 0, item);
                } else {
                    relativeItems.push(item);
                }
            }
        }

        for (var i = 0, n = relativeItems.length; i < n; i++) {
            item = relativeItems[i];
            node = item.node;
            refNode = item.refNode;

            // Find the reference element bounding box. If no reference was provided, we
            // use the optional bounding box.
            var refNodeId = refNode ? V.ensureId(refNode) : '';
            var refBBox = bboxCache[refNodeId];
            if (!refBBox) {
                // Get the bounding box of the reference element relative to the `rotatable` `<g>` (without rotation)
                // or to the root `<g>` element if no rotatable group present if reference node present.
                // Uses the bounding box provided.
                refBBox = bboxCache[refNodeId] = (refNode)
                    ? V(refNode).getBBox({ target: (opt.rotatableNode || rootNode) })
                    : opt.rootBBox;
            }

            if (roAttrs) {
                // if there was a special attribute affecting the position amongst passed-in attributes
                // we have to merge it with the rest of the element's attributes as they are necessary
                // to update the position relatively (i.e `ref-x` && 'ref-dx')
                processedAttrs = this.processNodeAttributes(node, item.allAttributes);
                this.mergeProcessedAttributes(processedAttrs, item.processedAttributes);

            } else {
                processedAttrs = item.processedAttributes;
            }

            this.updateRelativeAttributes(node, processedAttrs, refBBox, opt);
        }
    },

    mergeProcessedAttributes: function(processedAttrs, roProcessedAttrs) {

        processedAttrs.set || (processedAttrs.set = {});
        processedAttrs.position || (processedAttrs.position = {});
        processedAttrs.offset || (processedAttrs.offset = {});

        joint.util.assign(processedAttrs.set, roProcessedAttrs.set);
        joint.util.assign(processedAttrs.position, roProcessedAttrs.position);
        joint.util.assign(processedAttrs.offset, roProcessedAttrs.offset);

        // Handle also the special transform property.
        var transform = processedAttrs.normal && processedAttrs.normal.transform;
        if (transform !== undefined && roProcessedAttrs.normal) {
            roProcessedAttrs.normal.transform = transform;
        }
        processedAttrs.normal = roProcessedAttrs.normal;
    },

    // Interaction. The controller part.
    // ---------------------------------

    // Interaction is handled by the paper and delegated to the view in interest.
    // `x` & `y` parameters passed to these functions represent the coordinates already snapped to the paper grid.
    // If necessary, real coordinates can be obtained from the `evt` event object.

    // These functions are supposed to be overriden by the views that inherit from `joint.dia.Cell`,
    // i.e. `joint.dia.Element` and `joint.dia.Link`.

    pointerdblclick: function(evt, x, y) {

        this.notify('cell:pointerdblclick', evt, x, y);
    },

    pointerclick: function(evt, x, y) {

        this.notify('cell:pointerclick', evt, x, y);
    },

    pointerdown: function(evt, x, y) {

        if (this.model.graph) {
            this.model.startBatch('pointer');
            this._graph = this.model.graph;
        }

        this.notify('cell:pointerdown', evt, x, y);
    },

    pointermove: function(evt, x, y) {

        this.notify('cell:pointermove', evt, x, y);
    },

    pointerup: function(evt, x, y) {

        this.notify('cell:pointerup', evt, x, y);

        if (this._graph) {
            // we don't want to trigger event on model as model doesn't
            // need to be member of collection anymore (remove)
            this._graph.stopBatch('pointer', { cell: this.model });
            delete this._graph;
        }
    },

    mouseover: function(evt) {

        this.notify('cell:mouseover', evt);
    },

    mouseout: function(evt) {

        this.notify('cell:mouseout', evt);
    },

    mouseenter: function(evt) {

        this.notify('cell:mouseenter', evt);
    },

    mouseleave: function(evt) {

        this.notify('cell:mouseleave', evt);
    },

    mousewheel: function(evt, x, y, delta) {

        this.notify('cell:mousewheel', evt, x, y, delta);
    },

    contextmenu: function(evt, x, y) {

        this.notify('cell:contextmenu', evt, x, y);
    },

    setInteractivity: function(value) {

        this.options.interactive = value;
    }
});

// joint.dia.Element base model.
// -----------------------------

joint.dia.Element = joint.dia.Cell.extend({

    defaults: {
        position: { x: 0, y: 0 },
        size: { width: 1, height: 1 },
        angle: 0
    },

    initialize: function() {

        this._initializePorts();
        joint.dia.Cell.prototype.initialize.apply(this, arguments);
    },

    /**
     * @abstract
     */
    _initializePorts: function() {
        // implemented in ports.js
    },

    isElement: function() {

        return true;
    },

    position: function(x, y, opt) {

        var isSetter = joint.util.isNumber(y);

        opt = (isSetter ? opt : x) || {};

        // option `parentRelative` for setting the position relative to the element's parent.
        if (opt.parentRelative) {

            // Getting the parent's position requires the collection.
            // Cell.get('parent') helds cell id only.
            if (!this.graph) throw new Error('Element must be part of a graph.');

            var parent = this.graph.getCell(this.get('parent'));
            var parentPosition = parent && !parent.isLink()
                ? parent.get('position')
                : { x: 0, y: 0 };
        }

        if (isSetter) {

            if (opt.parentRelative) {
                x += parentPosition.x;
                y += parentPosition.y;
            }

            if (opt.deep) {
                var currentPosition = this.get('position');
                this.translate(x - currentPosition.x, y - currentPosition.y, opt);
            } else {
                this.set('position', { x: x, y: y }, opt);
            }

            return this;

        } else { // Getter returns a geometry point.

            var elementPosition = g.point(this.get('position'));

            return opt.parentRelative
                ? elementPosition.difference(parentPosition)
                : elementPosition;
        }
    },

    translate: function(tx, ty, opt) {

        tx = tx || 0;
        ty = ty || 0;

        if (tx === 0 && ty === 0) {
            // Like nothing has happened.
            return this;
        }

        opt = opt || {};
        // Pass the initiator of the translation.
        opt.translateBy = opt.translateBy || this.id;

        var position = this.get('position') || { x: 0, y: 0 };

        if (opt.restrictedArea && opt.translateBy === this.id) {

            // We are restricting the translation for the element itself only. We get
            // the bounding box of the element including all its embeds.
            // All embeds have to be translated the exact same way as the element.
            var bbox = this.getBBox({ deep: true });
            var ra = opt.restrictedArea;
            //- - - - - - - - - - - - -> ra.x + ra.width
            // - - - -> position.x      |
            // -> bbox.x
            //                ▓▓▓▓▓▓▓   |
            //         ░░░░░░░▓▓▓▓▓▓▓
            //         ░░░░░░░░░        |
            //   ▓▓▓▓▓▓▓▓░░░░░░░
            //   ▓▓▓▓▓▓▓▓               |
            //   <-dx->                     | restricted area right border
            //         <-width->        |   ░ translated element
            //   <- - bbox.width - ->       ▓ embedded element
            var dx = position.x - bbox.x;
            var dy = position.y - bbox.y;
            // Find the maximal/minimal coordinates that the element can be translated
            // while complies the restrictions.
            var x = Math.max(ra.x + dx, Math.min(ra.x + ra.width + dx - bbox.width, position.x + tx));
            var y = Math.max(ra.y + dy, Math.min(ra.y + ra.height + dy - bbox.height, position.y + ty));
            // recalculate the translation taking the resctrictions into account.
            tx = x - position.x;
            ty = y - position.y;
        }

        var translatedPosition = {
            x: position.x + tx,
            y: position.y + ty
        };

        // To find out by how much an element was translated in event 'change:position' handlers.
        opt.tx = tx;
        opt.ty = ty;

        if (opt.transition) {

            if (!joint.util.isObject(opt.transition)) opt.transition = {};

            this.transition('position', translatedPosition, joint.util.assign({}, opt.transition, {
                valueFunction: joint.util.interpolate.object
            }));

        } else {

            this.set('position', translatedPosition, opt);
        }

        // Recursively call `translate()` on all the embeds cells.
        joint.util.invoke(this.getEmbeddedCells(), 'translate', tx, ty, opt);

        return this;
    },

    size: function(width, height, opt) {

        var currentSize = this.get('size');
        // Getter
        // () signature
        if (width === undefined) {
            return {
                width: currentSize.width,
                height: currentSize.height
            };
        }
        // Setter
        // (size, opt) signature
        if (joint.util.isObject(width)) {
            opt = height;
            height = joint.util.isNumber(width.height) ? width.height : currentSize.height;
            width = joint.util.isNumber(width.width) ? width.width : currentSize.width;
        }

        return this.resize(width, height, opt);
    },

    resize: function(width, height, opt) {

        opt = opt || {};

        this.startBatch('resize', opt);

        if (opt.direction) {

            var currentSize = this.get('size');

            switch (opt.direction) {

                case 'left':
                case 'right':
                    // Don't change height when resizing horizontally.
                    height = currentSize.height;
                    break;

                case 'top':
                case 'bottom':
                    // Don't change width when resizing vertically.
                    width = currentSize.width;
                    break;
            }

            // Get the angle and clamp its value between 0 and 360 degrees.
            var angle = g.normalizeAngle(this.get('angle') || 0);

            var quadrant = {
                'top-right': 0,
                'right': 0,
                'top-left': 1,
                'top': 1,
                'bottom-left': 2,
                'left': 2,
                'bottom-right': 3,
                'bottom': 3
            }[opt.direction];

            if (opt.absolute) {

                // We are taking the element's rotation into account
                quadrant += Math.floor((angle + 45) / 90);
                quadrant %= 4;
            }

            // This is a rectangle in size of the unrotated element.
            var bbox = this.getBBox();

            // Pick the corner point on the element, which meant to stay on its place before and
            // after the rotation.
            var fixedPoint = bbox[['bottomLeft', 'corner', 'topRight', 'origin'][quadrant]]();

            // Find  an image of the previous indent point. This is the position, where is the
            // point actually located on the screen.
            var imageFixedPoint = g.point(fixedPoint).rotate(bbox.center(), -angle);

            // Every point on the element rotates around a circle with the centre of rotation
            // in the middle of the element while the whole element is being rotated. That means
            // that the distance from a point in the corner of the element (supposed its always rect) to
            // the center of the element doesn't change during the rotation and therefore it equals
            // to a distance on unrotated element.
            // We can find the distance as DISTANCE = (ELEMENTWIDTH/2)^2 + (ELEMENTHEIGHT/2)^2)^0.5.
            var radius = Math.sqrt((width * width) + (height * height)) / 2;

            // Now we are looking for an angle between x-axis and the line starting at image of fixed point
            // and ending at the center of the element. We call this angle `alpha`.

            // The image of a fixed point is located in n-th quadrant. For each quadrant passed
            // going anti-clockwise we have to add 90 degrees. Note that the first quadrant has index 0.
            //
            // 3 | 2
            // --c-- Quadrant positions around the element's center `c`
            // 0 | 1
            //
            var alpha = quadrant * Math.PI / 2;

            // Add an angle between the beginning of the current quadrant (line parallel with x-axis or y-axis
            // going through the center of the element) and line crossing the indent of the fixed point and the center
            // of the element. This is the angle we need but on the unrotated element.
            alpha += Math.atan(quadrant % 2 == 0 ? height / width : width / height);

            // Lastly we have to deduct the original angle the element was rotated by and that's it.
            alpha -= g.toRad(angle);

            // With this angle and distance we can easily calculate the centre of the unrotated element.
            // Note that fromPolar constructor accepts an angle in radians.
            var center = g.point.fromPolar(radius, alpha, imageFixedPoint);

            // The top left corner on the unrotated element has to be half a width on the left
            // and half a height to the top from the center. This will be the origin of rectangle
            // we were looking for.
            var origin = g.point(center).offset(width / -2, height / -2);

            // Resize the element (before re-positioning it).
            this.set('size', { width: width, height: height }, opt);

            // Finally, re-position the element.
            this.position(origin.x, origin.y, opt);

        } else {

            // Resize the element.
            this.set('size', { width: width, height: height }, opt);
        }

        this.stopBatch('resize', opt);

        return this;
    },

    scale: function(sx, sy, origin, opt) {

        var scaledBBox = this.getBBox().scale(sx, sy, origin);
        this.startBatch('scale', opt);
        this.position(scaledBBox.x, scaledBBox.y, opt);
        this.resize(scaledBBox.width, scaledBBox.height, opt);
        this.stopBatch('scale');
        return this;
    },

    fitEmbeds: function(opt) {

        opt = opt || {};

        // Getting the children's size and position requires the collection.
        // Cell.get('embdes') helds an array of cell ids only.
        if (!this.graph) throw new Error('Element must be part of a graph.');

        var embeddedCells = this.getEmbeddedCells();

        if (embeddedCells.length > 0) {

            this.startBatch('fit-embeds', opt);

            if (opt.deep) {
                // Recursively apply fitEmbeds on all embeds first.
                joint.util.invoke(embeddedCells, 'fitEmbeds', opt);
            }

            // Compute cell's size and position  based on the children bbox
            // and given padding.
            var bbox = this.graph.getCellsBBox(embeddedCells);
            var padding = joint.util.normalizeSides(opt.padding);

            // Apply padding computed above to the bbox.
            bbox.moveAndExpand({
                x: -padding.left,
                y: -padding.top,
                width: padding.right + padding.left,
                height: padding.bottom + padding.top
            });

            // Set new element dimensions finally.
            this.set({
                position: { x: bbox.x, y: bbox.y },
                size: { width: bbox.width, height: bbox.height }
            }, opt);

            this.stopBatch('fit-embeds');
        }

        return this;
    },

    // Rotate element by `angle` degrees, optionally around `origin` point.
    // If `origin` is not provided, it is considered to be the center of the element.
    // If `absolute` is `true`, the `angle` is considered is abslute, i.e. it is not
    // the difference from the previous angle.
    rotate: function(angle, absolute, origin, opt) {

        if (origin) {

            var center = this.getBBox().center();
            var size = this.get('size');
            var position = this.get('position');
            center.rotate(origin, this.get('angle') - angle);
            var dx = center.x - size.width / 2 - position.x;
            var dy = center.y - size.height / 2 - position.y;
            this.startBatch('rotate', { angle: angle, absolute: absolute, origin: origin });
            this.position(position.x + dx, position.y + dy, opt);
            this.rotate(angle, absolute, null, opt);
            this.stopBatch('rotate');

        } else {

            this.set('angle', absolute ? angle : (this.get('angle') + angle) % 360, opt);
        }

        return this;
    },

    getBBox: function(opt) {

        opt = opt || {};

        if (opt.deep && this.graph) {

            // Get all the embedded elements using breadth first algorithm,
            // that doesn't use recursion.
            var elements = this.getEmbeddedCells({ deep: true, breadthFirst: true });
            // Add the model itself.
            elements.push(this);

            return this.graph.getCellsBBox(elements);
        }

        var position = this.get('position');
        var size = this.get('size');

        return g.rect(position.x, position.y, size.width, size.height);
    }
});

// joint.dia.Element base view and controller.
// -------------------------------------------


joint.dia.ElementView = joint.dia.CellView.extend({

    /**
     * @abstract
     */
    _removePorts: function() {
        // implemented in ports.js
    },

    /**
     *
     * @abstract
     */
    _renderPorts: function() {
        // implemented in ports.js
    },

    className: function() {

        var classNames = joint.dia.CellView.prototype.className.apply(this).split(' ');

        classNames.push('element');

        return classNames.join(' ');
    },

    initialize: function() {

        joint.dia.CellView.prototype.initialize.apply(this, arguments);

        var model = this.model;

        this.listenTo(model, 'change:position', this.translate);
        this.listenTo(model, 'change:size', this.resize);
        this.listenTo(model, 'change:angle', this.rotate);
        this.listenTo(model, 'change:markup', this.render);

        this._initializePorts();
    },

    /**
     * @abstract
     */
    _initializePorts: function() {

    },

    update: function(cell, renderingOnlyAttrs) {

        this._removePorts();

        var model = this.model;
        var modelAttrs = model.attr();
        this.updateDOMSubtreeAttributes(this.el, modelAttrs, {
            rootBBox: g.Rect(model.size()),
            scalableNode: this.scalableNode,
            rotatableNode: this.rotatableNode,
            // Use rendering only attributes if they differs from the model attributes
            roAttributes: (renderingOnlyAttrs === modelAttrs) ? null : renderingOnlyAttrs
        });

        this._renderPorts();
    },

    // `prototype.markup` is rendered by default. Set the `markup` attribute on the model if the
    // default markup is not desirable.
    renderMarkup: function() {

        var markup = this.model.get('markup') || this.model.markup;

        if (markup) {

            var svg = joint.util.template(markup)();
            var nodes = V(svg);

            this.vel.append(nodes);

        } else {

            throw new Error('properties.markup is missing while the default render() implementation is used.');
        }
    },

    render: function() {

        this.$el.empty();

        this.renderMarkup();
        this.rotatableNode = this.vel.findOne('.rotatable');
        var scalable = this.scalableNode = this.vel.findOne('.scalable');
        if (scalable) {
            // Double update is necessary for elements with the scalable group only
            // Note the resize() triggers the other `update`.
            this.update();
        }
        this.resize();
        this.rotate();
        this.translate();

        return this;
    },

    resize: function(cell, changed, opt) {

        var model = this.model;
        var size = model.get('size') || { width: 1, height: 1 };
        var angle = model.get('angle') || 0;

        var scalable = this.scalableNode;
        if (!scalable) {

            if (angle !== 0) {
                // update the origin of the rotation
                this.rotate();
            }
            // update the ref attributes
            this.update();

            // If there is no scalable elements, than there is nothing to scale.
            return;
        }

        // Getting scalable group's bbox.
        // Due to a bug in webkit's native SVG .getBBox implementation, the bbox of groups with path children includes the paths' control points.
        // To work around the issue, we need to check whether there are any path elements inside the scalable group.
        var recursive = false;
        if (scalable.node.getElementsByTagName('path').length > 0) {
            // If scalable has at least one descendant that is a path, we need to switch to recursive bbox calculation.
            // If there are no path descendants, group bbox calculation works and so we can use the (faster) native function directly.
            recursive = true;
        }
        var scalableBBox = scalable.getBBox({ recursive: recursive });

        // Make sure `scalableBbox.width` and `scalableBbox.height` are not zero which can happen if the element does not have any content. By making
        // the width/height 1, we prevent HTML errors of the type `scale(Infinity, Infinity)`.
        var sx = (size.width / (scalableBBox.width || 1));
        var sy = (size.height / (scalableBBox.height || 1));
        scalable.attr('transform', 'scale(' + sx + ',' + sy + ')');

        // Now the interesting part. The goal is to be able to store the object geometry via just `x`, `y`, `angle`, `width` and `height`
        // Order of transformations is significant but we want to reconstruct the object always in the order:
        // resize(), rotate(), translate() no matter of how the object was transformed. For that to work,
        // we must adjust the `x` and `y` coordinates of the object whenever we resize it (because the origin of the
        // rotation changes). The new `x` and `y` coordinates are computed by canceling the previous rotation
        // around the center of the resized object (which is a different origin then the origin of the previous rotation)
        // and getting the top-left corner of the resulting object. Then we clean up the rotation back to what it originally was.

        // Cancel the rotation but now around a different origin, which is the center of the scaled object.
        var rotatable = this.rotatableNode;
        var rotation = rotatable && rotatable.attr('transform');
        if (rotation && rotation !== 'null') {

            rotatable.attr('transform', rotation + ' rotate(' + (-angle) + ',' + (size.width / 2) + ',' + (size.height / 2) + ')');
            var rotatableBBox = scalable.getBBox({ target: this.paper.viewport });

            // Store new x, y and perform rotate() again against the new rotation origin.
            model.set('position', { x: rotatableBBox.x, y: rotatableBBox.y }, opt);
            this.rotate();
        }

        // Update must always be called on non-rotated element. Otherwise, relative positioning
        // would work with wrong (rotated) bounding boxes.
        this.update();
    },

    translate: function(model, changes, opt) {

        var position = this.model.get('position') || { x: 0, y: 0 };

        this.vel.attr('transform', 'translate(' + position.x + ',' + position.y + ')');
    },

    rotate: function() {

        var rotatable = this.rotatableNode;
        if (!rotatable) {
            // If there is no rotatable elements, then there is nothing to rotate.
            return;
        }

        var angle = this.model.get('angle') || 0;
        var size = this.model.get('size') || { width: 1, height: 1 };

        var ox = size.width / 2;
        var oy = size.height / 2;

        if (angle !== 0) {
            rotatable.attr('transform', 'rotate(' + angle + ',' + ox + ',' + oy + ')');
        } else {
            rotatable.removeAttr('transform');
        }
    },

    getBBox: function(opt) {

        if (opt && opt.useModelGeometry) {
            var bbox = this.model.getBBox().bbox(this.model.get('angle'));
            return this.paper.localToPaperRect(bbox);
        }

        return joint.dia.CellView.prototype.getBBox.apply(this, arguments);
    },

    // Embedding mode methods
    // ----------------------

    prepareEmbedding: function(opt) {

        opt = opt || {};

        var model = opt.model || this.model;
        var paper = opt.paper || this.paper;
        var graph = paper.model;

        model.startBatch('to-front', opt);

        // Bring the model to the front with all his embeds.
        model.toFront({ deep: true, ui: true });

        // Note that at this point cells in the collection are not sorted by z index (it's running in the batch, see
        // the dia.Graph._sortOnChangeZ), so we can't assume that the last cell in the collection has the highest z.
        var maxZ = graph.get('cells').max('z').get('z');
        var connectedLinks = graph.getConnectedLinks(model, { deep: true });

        // Move to front also all the inbound and outbound links that are connected
        // to any of the element descendant. If we bring to front only embedded elements,
        // links connected to them would stay in the background.
        joint.util.invoke(connectedLinks, 'set', 'z', maxZ + 1, { ui: true });

        model.stopBatch('to-front');

        // Before we start looking for suitable parent we remove the current one.
        var parentId = model.get('parent');
        parentId && graph.getCell(parentId).unembed(model, { ui: true });
    },

    processEmbedding: function(opt) {

        opt = opt || {};

        var model = opt.model || this.model;
        var paper = opt.paper || this.paper;

        var paperOptions = paper.options;
        var candidates = paper.model.findModelsUnderElement(model, { searchBy: paperOptions.findParentBy });

        if (paperOptions.frontParentOnly) {
            // pick the element with the highest `z` index
            candidates = candidates.slice(-1);
        }

        var newCandidateView = null;
        var prevCandidateView = this._candidateEmbedView;

        // iterate over all candidates starting from the last one (has the highest z-index).
        for (var i = candidates.length - 1; i >= 0; i--) {

            var candidate = candidates[i];

            if (prevCandidateView && prevCandidateView.model.id == candidate.id) {

                // candidate remains the same
                newCandidateView = prevCandidateView;
                break;

            } else {

                var view = candidate.findView(paper);
                if (paperOptions.validateEmbedding.call(paper, this, view)) {

                    // flip to the new candidate
                    newCandidateView = view;
                    break;
                }
            }
        }

        if (newCandidateView && newCandidateView != prevCandidateView) {
            // A new candidate view found. Highlight the new one.
            this.clearEmbedding();
            this._candidateEmbedView = newCandidateView.highlight(null, { embedding: true });
        }

        if (!newCandidateView && prevCandidateView) {
            // No candidate view found. Unhighlight the previous candidate.
            this.clearEmbedding();
        }
    },

    clearEmbedding: function() {

        var candidateView = this._candidateEmbedView;
        if (candidateView) {
            // No candidate view found. Unhighlight the previous candidate.
            candidateView.unhighlight(null, { embedding: true });
            this._candidateEmbedView = null;
        }
    },

    finalizeEmbedding: function(opt) {

        opt = opt || {};

        var candidateView = this._candidateEmbedView;
        var model = opt.model || this.model;
        var paper = opt.paper || this.paper;

        if (candidateView) {

            // We finished embedding. Candidate view is chosen to become the parent of the model.
            candidateView.model.embed(model, { ui: true });
            candidateView.unhighlight(null, { embedding: true });

            delete this._candidateEmbedView;
        }

        joint.util.invoke(paper.model.getConnectedLinks(model, { deep: true }), 'reparent', { ui: true });
    },

    // Interaction. The controller part.
    // ---------------------------------

    pointerdown: function(evt, x, y) {

        var paper = this.paper;

        if (
            evt.target.getAttribute('magnet') &&
            this.can('addLinkFromMagnet') &&
            paper.options.validateMagnet.call(paper, this, evt.target)
        ) {

            this.model.startBatch('add-link');

            var link = paper.getDefaultLink(this, evt.target);

            link.set({
                source: {
                    id: this.model.id,
                    selector: this.getSelector(evt.target),
                    port: evt.target.getAttribute('port')
                },
                target: { x: x, y: y }
            });

            paper.model.addCell(link);

            var linkView = this._linkView = paper.findViewByModel(link);

            linkView.pointerdown(evt, x, y);
            linkView.startArrowheadMove('target', { whenNotAllowed: 'remove' });

        } else {

            this._dx = x;
            this._dy = y;

            this.restrictedArea = paper.getRestrictedArea(this);

            joint.dia.CellView.prototype.pointerdown.apply(this, arguments);
            this.notify('element:pointerdown', evt, x, y);
        }
    },

    pointermove: function(evt, x, y) {

        if (this._linkView) {

            // let the linkview deal with this event
            this._linkView.pointermove(evt, x, y);

        } else {

            var grid = this.paper.options.gridSize;

            if (this.can('elementMove')) {

                var position = this.model.get('position');

                // Make sure the new element's position always snaps to the current grid after
                // translate as the previous one could be calculated with a different grid size.
                var tx = g.snapToGrid(position.x, grid) - position.x + g.snapToGrid(x - this._dx, grid);
                var ty = g.snapToGrid(position.y, grid) - position.y + g.snapToGrid(y - this._dy, grid);

                this.model.translate(tx, ty, { restrictedArea: this.restrictedArea, ui: true });

                if (this.paper.options.embeddingMode) {

                    if (!this._inProcessOfEmbedding) {
                        // Prepare the element for embedding only if the pointer moves.
                        // We don't want to do unnecessary action with the element
                        // if an user only clicks/dblclicks on it.
                        this.prepareEmbedding();
                        this._inProcessOfEmbedding = true;
                    }

                    this.processEmbedding();
                }
            }

            this._dx = g.snapToGrid(x, grid);
            this._dy = g.snapToGrid(y, grid);

            joint.dia.CellView.prototype.pointermove.apply(this, arguments);
            this.notify('element:pointermove', evt, x, y);
        }
    },

    pointerup: function(evt, x, y) {

        if (this._linkView) {

            // Let the linkview deal with this event.
            this._linkView.pointerup(evt, x, y);
            this._linkView = null;
            this.model.stopBatch('add-link');

        } else {

            if (this._inProcessOfEmbedding) {
                this.finalizeEmbedding();
                this._inProcessOfEmbedding = false;
            }

            this.notify('element:pointerup', evt, x, y);
            joint.dia.CellView.prototype.pointerup.apply(this, arguments);
        }
    },

    mouseenter: function(evt) {

        joint.dia.CellView.prototype.mouseenter.apply(this, arguments);
        this.notify('element:mouseenter', evt);
    },

    mouseleave: function(evt) {

        joint.dia.CellView.prototype.mouseleave.apply(this, arguments);
        this.notify('element:mouseleave', evt);
    }
});


// joint.dia.Link base model.
// --------------------------

joint.dia.Link = joint.dia.Cell.extend({

    // The default markup for links.
    markup: [
        '<path class="connection" stroke="black" d="M 0 0 0 0"/>',
        '<path class="marker-source" fill="black" stroke="black" d="M 0 0 0 0"/>',
        '<path class="marker-target" fill="black" stroke="black" d="M 0 0 0 0"/>',
        '<path class="connection-wrap" d="M 0 0 0 0"/>',
        '<g class="labels"/>',
        '<g class="marker-vertices"/>',
        '<g class="marker-arrowheads"/>',
        '<g class="link-tools"/>'
    ].join(''),

    labelMarkup: [
        '<g class="label">',
        '<rect />',
        '<text />',
        '</g>'
    ].join(''),

    toolMarkup: [
        '<g class="link-tool">',
        '<g class="tool-remove" event="remove">',
        '<circle r="11" />',
        '<path transform="scale(.8) translate(-16, -16)" d="M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z" />',
        '<title>Remove link.</title>',
        '</g>',
        '<g class="tool-options" event="link:options">',
        '<circle r="11" transform="translate(25)"/>',
        '<path fill="white" transform="scale(.55) translate(29, -16)" d="M31.229,17.736c0.064-0.571,0.104-1.148,0.104-1.736s-0.04-1.166-0.104-1.737l-4.377-1.557c-0.218-0.716-0.504-1.401-0.851-2.05l1.993-4.192c-0.725-0.91-1.549-1.734-2.458-2.459l-4.193,1.994c-0.647-0.347-1.334-0.632-2.049-0.849l-1.558-4.378C17.165,0.708,16.588,0.667,16,0.667s-1.166,0.041-1.737,0.105L12.707,5.15c-0.716,0.217-1.401,0.502-2.05,0.849L6.464,4.005C5.554,4.73,4.73,5.554,4.005,6.464l1.994,4.192c-0.347,0.648-0.632,1.334-0.849,2.05l-4.378,1.557C0.708,14.834,0.667,15.412,0.667,16s0.041,1.165,0.105,1.736l4.378,1.558c0.217,0.715,0.502,1.401,0.849,2.049l-1.994,4.193c0.725,0.909,1.549,1.733,2.459,2.458l4.192-1.993c0.648,0.347,1.334,0.633,2.05,0.851l1.557,4.377c0.571,0.064,1.148,0.104,1.737,0.104c0.588,0,1.165-0.04,1.736-0.104l1.558-4.377c0.715-0.218,1.399-0.504,2.049-0.851l4.193,1.993c0.909-0.725,1.733-1.549,2.458-2.458l-1.993-4.193c0.347-0.647,0.633-1.334,0.851-2.049L31.229,17.736zM16,20.871c-2.69,0-4.872-2.182-4.872-4.871c0-2.69,2.182-4.872,4.872-4.872c2.689,0,4.871,2.182,4.871,4.872C20.871,18.689,18.689,20.871,16,20.871z"/>',
        '<title>Link options.</title>',
        '</g>',
        '</g>'
    ].join(''),

    // The default markup for showing/removing vertices. These elements are the children of the .marker-vertices element (see `this.markup`).
    // Only .marker-vertex and .marker-vertex-remove element have special meaning. The former is used for
    // dragging vertices (changin their position). The latter is used for removing vertices.
    vertexMarkup: [
        '<g class="marker-vertex-group" transform="translate(<%= x %>, <%= y %>)">',
        '<circle class="marker-vertex" idx="<%= idx %>" r="10" />',
        '<path class="marker-vertex-remove-area" idx="<%= idx %>" d="M16,5.333c-7.732,0-14,4.701-14,10.5c0,1.982,0.741,3.833,2.016,5.414L2,25.667l5.613-1.441c2.339,1.317,5.237,2.107,8.387,2.107c7.732,0,14-4.701,14-10.5C30,10.034,23.732,5.333,16,5.333z" transform="translate(5, -33)"/>',
        '<path class="marker-vertex-remove" idx="<%= idx %>" transform="scale(.8) translate(9.5, -37)" d="M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z">',
        '<title>Remove vertex.</title>',
        '</path>',
        '</g>'
    ].join(''),

    arrowheadMarkup: [
        '<g class="marker-arrowhead-group marker-arrowhead-group-<%= end %>">',
        '<path class="marker-arrowhead" end="<%= end %>" d="M 26 0 L 0 13 L 26 26 z" />',
        '</g>'
    ].join(''),

    defaults: {

        type: 'link',
        source: {},
        target: {}
    },

    isLink: function() {

        return true;
    },

    disconnect: function() {

        return this.set({ source: g.point(0, 0), target: g.point(0, 0) });
    },

    // A convenient way to set labels. Currently set values will be mixined with `value` if used as a setter.
    label: function(idx, value, opt) {

        idx = idx || 0;

        // Is it a getter?
        if (arguments.length <= 1) {
            return this.prop(['labels', idx]);
        }

        return this.prop(['labels', idx], value, opt);
    },

    translate: function(tx, ty, opt) {

        // enrich the option object
        opt = opt || {};
        opt.translateBy = opt.translateBy || this.id;
        opt.tx = tx;
        opt.ty = ty;

        return this.applyToPoints(function(p) {
            return { x: (p.x || 0) + tx, y: (p.y || 0) + ty };
        }, opt);
    },

    scale: function(sx, sy, origin, opt) {

        return this.applyToPoints(function(p) {
            return g.point(p).scale(sx, sy, origin).toJSON();
        }, opt);
    },

    applyToPoints: function(fn, opt) {

        if (!joint.util.isFunction(fn)) {
            throw new TypeError('dia.Link: applyToPoints expects its first parameter to be a function.');
        }

        var attrs = {};

        var source = this.get('source');
        if (!source.id) {
            attrs.source = fn(source);
        }

        var target = this.get('target');
        if (!target.id) {
            attrs.target = fn(target);
        }

        var vertices = this.get('vertices');
        if (vertices && vertices.length > 0) {
            attrs.vertices = vertices.map(fn);
        }

        return this.set(attrs, opt);
    },

    reparent: function(opt) {

        var newParent;

        if (this.graph) {

            var source = this.graph.getCell(this.get('source').id);
            var target = this.graph.getCell(this.get('target').id);
            var prevParent = this.graph.getCell(this.get('parent'));

            if (source && target) {
                newParent = this.graph.getCommonAncestor(source, target);
            }

            if (prevParent && (!newParent || newParent.id !== prevParent.id)) {
                // Unembed the link if source and target has no common ancestor
                // or common ancestor changed
                prevParent.unembed(this, opt);
            }

            if (newParent) {
                newParent.embed(this, opt);
            }
        }

        return newParent;
    },

    hasLoop: function(opt) {

        opt = opt || {};

        var sourceId = this.get('source').id;
        var targetId = this.get('target').id;

        if (!sourceId || !targetId) {
            // Link "pinned" to the paper does not have a loop.
            return false;
        }

        var loop = sourceId === targetId;

        // Note that there in the deep mode a link can have a loop,
        // even if it connects only a parent and its embed.
        // A loop "target equals source" is valid in both shallow and deep mode.
        if (!loop && opt.deep && this.graph) {

            var sourceElement = this.graph.getCell(sourceId);
            var targetElement = this.graph.getCell(targetId);

            loop = sourceElement.isEmbeddedIn(targetElement) || targetElement.isEmbeddedIn(sourceElement);
        }

        return loop;
    },

    getSourceElement: function() {

        var source = this.get('source');

        return (source && source.id && this.graph && this.graph.getCell(source.id)) || null;
    },

    getTargetElement: function() {

        var target = this.get('target');

        return (target && target.id && this.graph && this.graph.getCell(target.id)) || null;
    },

    // Returns the common ancestor for the source element,
    // target element and the link itself.
    getRelationshipAncestor: function() {

        var connectionAncestor;

        if (this.graph) {

            var cells = [
                this,
                this.getSourceElement(), // null if source is a point
                this.getTargetElement() // null if target is a point
            ].filter(function(item) {
                return !!item;
            });

            connectionAncestor = this.graph.getCommonAncestor.apply(this.graph, cells);
        }

        return connectionAncestor || null;
    },

    // Is source, target and the link itself embedded in a given element?
    isRelationshipEmbeddedIn: function(element) {

        var elementId = joint.util.isString(element) ? element : element.id;
        var ancestor = this.getRelationshipAncestor();

        return !!ancestor && (ancestor.id === elementId || ancestor.isEmbeddedIn(elementId));
    }
},
    {
        endsEqual: function(a, b) {

            var portsEqual = a.port === b.port || !a.port && !b.port;
            return a.id === b.id && portsEqual;
        }
    });


// joint.dia.Link base view and controller.
// ----------------------------------------

joint.dia.LinkView = joint.dia.CellView.extend({

    className: function() {

        var classNames = joint.dia.CellView.prototype.className.apply(this).split(' ');

        classNames.push('link');

        return classNames.join(' ');
    },

    options: {

        shortLinkLength: 100,
        doubleLinkTools: false,
        longLinkLength: 160,
        linkToolsOffset: 40,
        doubleLinkToolsOffset: 60,
        sampleInterval: 50
    },

    _z: null,

    initialize: function(options) {

        joint.dia.CellView.prototype.initialize.apply(this, arguments);

        // create methods in prototype, so they can be accessed from any instance and
        // don't need to be create over and over
        if (typeof this.constructor.prototype.watchSource !== 'function') {
            this.constructor.prototype.watchSource = this.createWatcher('source');
            this.constructor.prototype.watchTarget = this.createWatcher('target');
        }

        // `_.labelCache` is a mapping of indexes of labels in the `this.get('labels')` array to
        // `<g class="label">` nodes wrapped by Vectorizer. This allows for quick access to the
        // nodes in `updateLabelPosition()` in order to update the label positions.
        this._labelCache = {};

        // keeps markers bboxes and positions again for quicker access
        this._markerCache = {};

        // bind events
        this.startListening();
    },

    startListening: function() {

        var model = this.model;

        this.listenTo(model, 'change:markup', this.render);
        this.listenTo(model, 'change:smooth change:manhattan change:router change:connector', this.update);
        this.listenTo(model, 'change:toolMarkup', this.onToolsChange);
        this.listenTo(model, 'change:labels change:labelMarkup', this.onLabelsChange);
        this.listenTo(model, 'change:vertices change:vertexMarkup', this.onVerticesChange);
        this.listenTo(model, 'change:source', this.onSourceChange);
        this.listenTo(model, 'change:target', this.onTargetChange);
    },

    onSourceChange: function(cell, source, opt) {

        // Start watching the new source model.
        this.watchSource(cell, source);
        // This handler is called when the source attribute is changed.
        // This can happen either when someone reconnects the link (or moves arrowhead),
        // or when an embedded link is translated by its ancestor.
        // 1. Always do update.
        // 2. Do update only if the opposite end ('target') is also a point.
        if (!opt.translateBy || !this.model.get('target').id) {
            opt.updateConnectionOnly = true;
            this.update(this.model, null, opt);
        }
    },

    onTargetChange: function(cell, target, opt) {

        // Start watching the new target model.
        this.watchTarget(cell, target);
        // See `onSourceChange` method.
        if (!opt.translateBy) {
            opt.updateConnectionOnly = true;
            this.update(this.model, null, opt);
        }
    },

    onVerticesChange: function(cell, changed, opt) {

        this.renderVertexMarkers();

        // If the vertices have been changed by a translation we do update only if the link was
        // the only link that was translated. If the link was translated via another element which the link
        // is embedded in, this element will be translated as well and that triggers an update.
        // Note that all embeds in a model are sorted - first comes links, then elements.
        if (!opt.translateBy || opt.translateBy === this.model.id) {
            // Vertices were changed (not as a reaction on translate)
            // or link.translate() was called or
            opt.updateConnectionOnly = true;
            this.update(cell, null, opt);
        }
    },

    onToolsChange: function() {

        this.renderTools().updateToolsPosition();
    },

    onLabelsChange: function(link, labels, opt) {

        var requireRender = true;

        // Here is an optimalization for cases when we know, that change does
        // not require rerendering of all labels.
        if (('propertyPathArray' in opt) && ('propertyValue' in opt)) {
            // The label is setting by `prop()` method
            var pathArray = opt.propertyPathArray || [];
            var pathLength = pathArray.length;
            if (pathLength > 1) {
                // We are changing a single label here e.g. 'labels/0/position'
                if (pathLength === 2) {
                    // We are changing the entire label. Need to check if the
                    // markup is also being changed.
                    requireRender = ('markup' in Object(opt.propertyValue));
                } else if (pathArray[2] !== 'markup') {
                    // We are changing a label property but not the markup
                    requireRender = false;
                }
            }
        }

        if (requireRender) {
            this.renderLabels();
        } else {
            this.updateLabels();
        }

        this.updateLabelPositions();
    },

    // Rendering
    //----------

    render: function() {

        this.$el.empty();

        // A special markup can be given in the `properties.markup` property. This might be handy
        // if e.g. arrowhead markers should be `<image>` elements or any other element than `<path>`s.
        // `.connection`, `.connection-wrap`, `.marker-source` and `.marker-target` selectors
        // of elements with special meaning though. Therefore, those classes should be preserved in any
        // special markup passed in `properties.markup`.
        var model = this.model;
        var markup = model.get('markup') || model.markup;
        var children = V(markup);

        // custom markup may contain only one children
        if (!Array.isArray(children)) children = [children];

        // Cache all children elements for quicker access.
        this._V = {}; // vectorized markup;
        children.forEach(function(child) {

            var className = child.attr('class');

            if (className) {
                // Strip the joint class name prefix, if there is one.
                className = joint.util.removeClassNamePrefix(className);
                this._V[$.camelCase(className)] = child;
            }

        }, this);

        // Only the connection path is mandatory
        if (!this._V.connection) throw new Error('link: no connection path in the markup');

        // partial rendering
        this.renderTools();
        this.renderVertexMarkers();
        this.renderArrowheadMarkers();

        this.vel.append(children);

        // rendering labels has to be run after the link is appended to DOM tree. (otherwise <Text> bbox
        // returns zero values)
        this.renderLabels();

        // start watching the ends of the link for changes
        this.watchSource(model, model.get('source'))
            .watchTarget(model, model.get('target'))
            .update();

        return this;
    },

    renderLabels: function() {

        var vLabels = this._V.labels;
        if (!vLabels) {
            return this;
        }

        vLabels.empty();

        var model = this.model;
        var labels = model.get('labels') || [];
        var labelCache = this._labelCache = {};
        var labelsCount = labels.length;
        if (labelsCount === 0) {
            return this;
        }

        var labelTemplate = joint.util.template(model.get('labelMarkup') || model.labelMarkup);
        // This is a prepared instance of a vectorized SVGDOM node for the label element resulting from
        // compilation of the labelTemplate. The purpose is that all labels will just `clone()` this
        // node to create a duplicate.
        var labelNodeInstance = V(labelTemplate());

        for (var i = 0; i < labelsCount; i++) {

            var label = labels[i];
            var labelMarkup = label.markup;
            // Cache label nodes so that the `updateLabels()` can just update the label node positions.
            var vLabelNode = labelCache[i] = (labelMarkup)
                ? V('g').append(V(labelMarkup))
                : labelNodeInstance.clone();

            vLabelNode
                .addClass('label')
                .attr('label-idx', i)
                .appendTo(vLabels);
        }

        this.updateLabels();

        return this;
    },

    updateLabels: function() {

        if (!this._V.labels) {
            return this;
        }

        var labels = this.model.get('labels') || [];
        var canLabelMove = this.can('labelMove');

        for (var i = 0, n = labels.length; i < n; i++) {

            var vLabel = this._labelCache[i];
            var label = labels[i];

            vLabel.attr('cursor', (canLabelMove ? 'move' : 'default'));

            var labelAttrs = label.attrs;
            if (!label.markup) {
                // Default attributes to maintain backwards compatibility
                labelAttrs = joint.util.merge({
                    text: {
                        textAnchor: 'middle',
                        fontSize: 14,
                        pointerEvents: 'none',
                        yAlignment: 'middle'
                    },
                    rect: {
                        ref: 'text',
                        fill: 'white',
                        rx: 3,
                        ry: 3,
                        refWidth: 1,
                        refHeight: 1,
                        refX: 0,
                        refY: 0
                    }
                }, labelAttrs);
            }

            this.updateDOMSubtreeAttributes(vLabel.node, labelAttrs, {
                rootBBox: g.Rect(label.size)
            });
        }

        return this;
    },

    renderTools: function() {

        if (!this._V.linkTools) return this;

        // Tools are a group of clickable elements that manipulate the whole link.
        // A good example of this is the remove tool that removes the whole link.
        // Tools appear after hovering the link close to the `source` element/point of the link
        // but are offset a bit so that they don't cover the `marker-arrowhead`.

        var $tools = $(this._V.linkTools.node).empty();
        var toolTemplate = joint.util.template(this.model.get('toolMarkup') || this.model.toolMarkup);
        var tool = V(toolTemplate());

        $tools.append(tool.node);

        // Cache the tool node so that the `updateToolsPosition()` can update the tool position quickly.
        this._toolCache = tool;

        // If `doubleLinkTools` is enabled, we render copy of the tools on the other side of the
        // link as well but only if the link is longer than `longLinkLength`.
        if (this.options.doubleLinkTools) {

            var tool2;
            if (this.model.get('doubleToolMarkup') || this.model.doubleToolMarkup) {
                toolTemplate = joint.util.template(this.model.get('doubleToolMarkup') || this.model.doubleToolMarkup);
                tool2 = V(toolTemplate());
            } else {
                tool2 = tool.clone();
            }

            $tools.append(tool2.node);
            this._tool2Cache = tool2;
        }

        return this;
    },

    renderVertexMarkers: function() {

        if (!this._V.markerVertices) return this;

        var $markerVertices = $(this._V.markerVertices.node).empty();

        // A special markup can be given in the `properties.vertexMarkup` property. This might be handy
        // if default styling (elements) are not desired. This makes it possible to use any
        // SVG elements for .marker-vertex and .marker-vertex-remove tools.
        var markupTemplate = joint.util.template(this.model.get('vertexMarkup') || this.model.vertexMarkup);

        joint.util.toArray(this.model.get('vertices')).forEach(function(vertex, idx) {

            $markerVertices.append(V(markupTemplate(joint.util.assign({ idx: idx }, vertex))).node);
        });

        return this;
    },

    renderArrowheadMarkers: function() {

        // Custom markups might not have arrowhead markers. Therefore, jump of this function immediately if that's the case.
        if (!this._V.markerArrowheads) return this;

        var $markerArrowheads = $(this._V.markerArrowheads.node);

        $markerArrowheads.empty();

        // A special markup can be given in the `properties.vertexMarkup` property. This might be handy
        // if default styling (elements) are not desired. This makes it possible to use any
        // SVG elements for .marker-vertex and .marker-vertex-remove tools.
        var markupTemplate = joint.util.template(this.model.get('arrowheadMarkup') || this.model.arrowheadMarkup);

        this._V.sourceArrowhead = V(markupTemplate({ end: 'source' }));
        this._V.targetArrowhead = V(markupTemplate({ end: 'target' }));

        $markerArrowheads.append(this._V.sourceArrowhead.node, this._V.targetArrowhead.node);

        return this;
    },

    // Updating
    //---------

    // Default is to process the `attrs` object and set attributes on subelements based on the selectors.
    update: function(model, attributes, opt) {

        opt = opt || {};

        if (!opt.updateConnectionOnly) {
            // update SVG attributes defined by 'attrs/'.
            this.updateDOMSubtreeAttributes(this.el, this.model.attr());
        }

        // update the link path, label position etc.
        this.updateConnection(opt);
        this.updateLabelPositions();
        this.updateToolsPosition();
        this.updateArrowheadMarkers();

        // Local perpendicular flag (as opposed to one defined on paper).
        // Could be enabled inside a connector/router. It's valid only
        // during the update execution.
        this.options.perpendicular = null;
        // Mark that postponed update has been already executed.
        this.updatePostponed = false;

        return this;
    },

    updateConnection: function(opt) {

        opt = opt || {};

        var model = this.model;
        var route;

        if (opt.translateBy && model.isRelationshipEmbeddedIn(opt.translateBy)) {
            // The link is being translated by an ancestor that will
            // shift source point, target point and all vertices
            // by an equal distance.
            var tx = opt.tx || 0;
            var ty = opt.ty || 0;

            route = this.route = joint.util.toArray(this.route).map(function(point) {
                // translate point by point by delta translation
                return g.point(point).offset(tx, ty);
            });

            // translate source and target connection and marker points.
            this._translateConnectionPoints(tx, ty);

        } else {
            // Necessary path finding
            route = this.route = this.findRoute(model.get('vertices') || [], opt);
            // finds all the connection points taking new vertices into account
            this._findConnectionPoints(route);
        }

        var pathData = this.getPathData(route);

        // The markup needs to contain a `.connection`
        this._V.connection.attr('d', pathData);
        this._V.connectionWrap && this._V.connectionWrap.attr('d', pathData);

        this._translateAndAutoOrientArrows(this._V.markerSource, this._V.markerTarget);
    },

    _findConnectionPoints: function(vertices) {

        // cache source and target points
        var sourcePoint, targetPoint, sourceMarkerPoint, targetMarkerPoint;
        var verticesArr = joint.util.toArray(vertices);

        var firstVertex = verticesArr[0];

        sourcePoint = this.getConnectionPoint(
            'source', this.model.get('source'), firstVertex || this.model.get('target')
        ).round();

        var lastVertex = verticesArr[verticesArr.length - 1];

        targetPoint = this.getConnectionPoint(
            'target', this.model.get('target'), lastVertex || sourcePoint
        ).round();

        // Move the source point by the width of the marker taking into account
        // its scale around x-axis. Note that scale is the only transform that
        // makes sense to be set in `.marker-source` attributes object
        // as all other transforms (translate/rotate) will be replaced
        // by the `translateAndAutoOrient()` function.
        var cache = this._markerCache;

        if (this._V.markerSource) {

            cache.sourceBBox = cache.sourceBBox || this._V.markerSource.getBBox();

            sourceMarkerPoint = g.point(sourcePoint).move(
                firstVertex || targetPoint,
                cache.sourceBBox.width * this._V.markerSource.scale().sx * -1
            ).round();
        }

        if (this._V.markerTarget) {

            cache.targetBBox = cache.targetBBox || this._V.markerTarget.getBBox();

            targetMarkerPoint = g.point(targetPoint).move(
                lastVertex || sourcePoint,
                cache.targetBBox.width * this._V.markerTarget.scale().sx * -1
            ).round();
        }

        // if there was no markup for the marker, use the connection point.
        cache.sourcePoint = sourceMarkerPoint || sourcePoint.clone();
        cache.targetPoint = targetMarkerPoint || targetPoint.clone();

        // make connection points public
        this.sourcePoint = sourcePoint;
        this.targetPoint = targetPoint;
    },

    _translateConnectionPoints: function(tx, ty) {

        var cache = this._markerCache;

        cache.sourcePoint.offset(tx, ty);
        cache.targetPoint.offset(tx, ty);
        this.sourcePoint.offset(tx, ty);
        this.targetPoint.offset(tx, ty);
    },

    updateLabelPositions: function() {

        if (!this._V.labels) return this;

        // This method assumes all the label nodes are stored in the `this._labelCache` hash table
        // by their indexes in the `this.get('labels')` array. This is done in the `renderLabels()` method.

        var labels = this.model.get('labels') || [];
        if (!labels.length) return this;

        var samples;
        var connectionElement = this._V.connection.node;
        var connectionLength = connectionElement.getTotalLength();

        // Firefox returns connectionLength=NaN in odd cases (for bezier curves).
        // In that case we won't update labels at all.
        if (Number.isNaN(connectionLength)) {
            return this;
        }

        for (var idx = 0, n = labels.length; idx < n; idx++) {

            var label = labels[idx];
            var position = label.position;
            var isPositionObject = joint.util.isObject(position);
            var labelCoordinates;

            var distance = isPositionObject ? position.distance : position;
            var offset = isPositionObject ? position.offset : { x: 0, y: 0 };

            if (Number.isFinite(distance)) {
                distance = (distance > connectionLength) ? connectionLength : distance; // sanity check
                distance = (distance < 0) ? connectionLength + distance : distance;
                distance = (distance > 1) ? distance : connectionLength * distance;
            } else {
                distance = connectionLength / 2;
            }

            labelCoordinates = connectionElement.getPointAtLength(distance);

            if (joint.util.isObject(offset)) {

                // Just offset the label by the x,y provided in the offset object.
                labelCoordinates = g.point(labelCoordinates).offset(offset);

            } else if (Number.isFinite(offset)) {

                if (!samples) {
                    samples = this._samples || this._V.connection.sample(this.options.sampleInterval);
                }

                // Offset the label by the amount provided in `offset` to an either
                // side of the link.

                // 1. Find the closest sample & its left and right neighbours.
                var minSqDistance = Infinity;
                var closestSampleIndex, sample, sqDistance;
                for (var i = 0, m = samples.length; i < m; i++) {
                    sample = samples[i];
                    sqDistance = g.line(sample, labelCoordinates).squaredLength();
                    if (sqDistance < minSqDistance) {
                        minSqDistance = sqDistance;
                        closestSampleIndex = i;
                    }
                }
                var prevSample = samples[closestSampleIndex - 1];
                var nextSample = samples[closestSampleIndex + 1];

                // 2. Offset the label on the perpendicular line between
                // the current label coordinate ("at `distance`") and
                // the next sample.
                var angle = 0;
                if (nextSample) {
                    angle = g.point(labelCoordinates).theta(nextSample);
                } else if (prevSample) {
                    angle = g.point(prevSample).theta(labelCoordinates);
                }
                labelCoordinates = g.point(labelCoordinates).offset(offset).rotate(labelCoordinates, angle - 90);
            }

            this._labelCache[idx].attr('transform', 'translate(' + labelCoordinates.x + ', ' + labelCoordinates.y + ')');
        }

        return this;
    },


    updateToolsPosition: function() {

        if (!this._V.linkTools) return this;

        // Move the tools a bit to the target position but don't cover the `sourceArrowhead` marker.
        // Note that the offset is hardcoded here. The offset should be always
        // more than the `this.$('.marker-arrowhead[end="source"]')[0].bbox().width` but looking
        // this up all the time would be slow.

        var scale = '';
        var offset = this.options.linkToolsOffset;
        var connectionLength = this.getConnectionLength();

        // Firefox returns connectionLength=NaN in odd cases (for bezier curves).
        // In that case we won't update tools position at all.
        if (!Number.isNaN(connectionLength)) {

            // If the link is too short, make the tools half the size and the offset twice as low.
            if (connectionLength < this.options.shortLinkLength) {
                scale = 'scale(.5)';
                offset /= 2;
            }

            var toolPosition = this.getPointAtLength(offset);

            this._toolCache.attr('transform', 'translate(' + toolPosition.x + ', ' + toolPosition.y + ') ' + scale);

            if (this.options.doubleLinkTools && connectionLength >= this.options.longLinkLength) {

                var doubleLinkToolsOffset = this.options.doubleLinkToolsOffset || offset;

                toolPosition = this.getPointAtLength(connectionLength - doubleLinkToolsOffset);
                this._tool2Cache.attr('transform', 'translate(' + toolPosition.x + ', ' + toolPosition.y + ') ' + scale);
                this._tool2Cache.attr('visibility', 'visible');

            } else if (this.options.doubleLinkTools) {

                this._tool2Cache.attr('visibility', 'hidden');
            }
        }

        return this;
    },


    updateArrowheadMarkers: function() {

        if (!this._V.markerArrowheads) return this;

        // getting bbox of an element with `display="none"` in IE9 ends up with access violation
        if ($.css(this._V.markerArrowheads.node, 'display') === 'none') return this;

        var sx = this.getConnectionLength() < this.options.shortLinkLength ? .5 : 1;
        this._V.sourceArrowhead.scale(sx);
        this._V.targetArrowhead.scale(sx);

        this._translateAndAutoOrientArrows(this._V.sourceArrowhead, this._V.targetArrowhead);

        return this;
    },

    // Returns a function observing changes on an end of the link. If a change happens and new end is a new model,
    // it stops listening on the previous one and starts listening to the new one.
    createWatcher: function(endType) {

        // create handler for specific end type (source|target).
        var onModelChange = function(endModel, opt) {
            this.onEndModelChange(endType, endModel, opt);
        };

        function watchEndModel(link, end) {

            end = end || {};

            var endModel = null;
            var previousEnd = link.previous(endType) || {};

            if (previousEnd.id) {
                this.stopListening(this.paper.getModelById(previousEnd.id), 'change', onModelChange);
            }

            if (end.id) {
                // If the observed model changes, it caches a new bbox and do the link update.
                endModel = this.paper.getModelById(end.id);
                this.listenTo(endModel, 'change', onModelChange);
            }

            onModelChange.call(this, endModel, { cacheOnly: true });

            return this;
        }

        return watchEndModel;
    },

    onEndModelChange: function(endType, endModel, opt) {

        var doUpdate = !opt.cacheOnly;
        var model = this.model;
        var end = model.get(endType) || {};

        if (endModel) {

            var selector = this.constructor.makeSelector(end);
            var oppositeEndType = endType == 'source' ? 'target' : 'source';
            var oppositeEnd = model.get(oppositeEndType) || {};
            var oppositeSelector = oppositeEnd.id && this.constructor.makeSelector(oppositeEnd);

            // Caching end models bounding boxes.
            // If `opt.handleBy` equals the client-side ID of this link view and it is a loop link, then we already cached
            // the bounding boxes in the previous turn (e.g. for loop link, the change:source event is followed
            // by change:target and so on change:source, we already chached the bounding boxes of - the same - element).
            if (opt.handleBy === this.cid && selector == oppositeSelector) {

                // Source and target elements are identical. We're dealing with a loop link. We are handling `change` event for the
                // second time now. There is no need to calculate bbox and find magnet element again.
                // It was calculated already for opposite link end.
                this[endType + 'BBox'] = this[oppositeEndType + 'BBox'];
                this[endType + 'View'] = this[oppositeEndType + 'View'];
                this[endType + 'Magnet'] = this[oppositeEndType + 'Magnet'];

            } else if (opt.translateBy) {
                // `opt.translateBy` optimizes the way we calculate bounding box of the source/target element.
                // If `opt.translateBy` is an ID of the element that was originally translated. This allows us
                // to just offset the cached bounding box by the translation instead of calculating the bounding
                // box from scratch on every translate.

                var bbox = this[endType + 'BBox'];
                bbox.x += opt.tx;
                bbox.y += opt.ty;

            } else {
                // The slowest path, source/target could have been rotated or resized or any attribute
                // that affects the bounding box of the view might have been changed.

                var view = this.paper.findViewByModel(end.id);
                var magnetElement = view.el.querySelector(selector);

                this[endType + 'BBox'] = view.getStrokeBBox(magnetElement);
                this[endType + 'View'] = view;
                this[endType + 'Magnet'] = magnetElement;
            }

            if (opt.handleBy === this.cid && opt.translateBy &&
                model.isEmbeddedIn(endModel) &&
                !joint.util.isEmpty(model.get('vertices'))) {
                // Loop link whose element was translated and that has vertices (that need to be translated with
                // the parent in which my element is embedded).
                // If the link is embedded, has a loop and vertices and the end model
                // has been translated, do not update yet. There are vertices still to be updated (change:vertices
                // event will come in the next turn).
                doUpdate = false;
            }

            if (!this.updatePostponed && oppositeEnd.id) {
                // The update was not postponed (that can happen e.g. on the first change event) and the opposite
                // end is a model (opposite end is the opposite end of the link we're just updating, e.g. if
                // we're reacting on change:source event, the oppositeEnd is the target model).

                var oppositeEndModel = this.paper.getModelById(oppositeEnd.id);

                // Passing `handleBy` flag via event option.
                // Note that if we are listening to the same model for event 'change' twice.
                // The same event will be handled by this method also twice.
                if (end.id === oppositeEnd.id) {
                    // We're dealing with a loop link. Tell the handlers in the next turn that they should update
                    // the link instead of me. (We know for sure there will be a next turn because
                    // loop links react on at least two events: change on the source model followed by a change on
                    // the target model).
                    opt.handleBy = this.cid;
                }

                if (opt.handleBy === this.cid || (opt.translateBy && oppositeEndModel.isEmbeddedIn(opt.translateBy))) {

                    // Here are two options:
                    // - Source and target are connected to the same model (not necessarily the same port).
                    // - Both end models are translated by the same ancestor. We know that opposite end
                    //   model will be translated in the next turn as well.
                    // In both situations there will be more changes on the model that trigger an
                    // update. So there is no need to update the linkView yet.
                    this.updatePostponed = true;
                    doUpdate = false;
                }
            }

        } else {

            // the link end is a point ~ rect 1x1
            this[endType + 'BBox'] = g.rect(end.x || 0, end.y || 0, 1, 1);
            this[endType + 'View'] = this[endType + 'Magnet'] = null;
        }

        if (doUpdate) {
            opt.updateConnectionOnly = true;
            this.update(model, null, opt);
        }
    },

    _translateAndAutoOrientArrows: function(sourceArrow, targetArrow) {

        // Make the markers "point" to their sticky points being auto-oriented towards
        // `targetPosition`/`sourcePosition`. And do so only if there is a markup for them.
        var route = joint.util.toArray(this.route);
        if (sourceArrow) {
            sourceArrow.translateAndAutoOrient(
                this.sourcePoint,
                route[0] || this.targetPoint,
                this.paper.viewport
            );
        }

        if (targetArrow) {
            targetArrow.translateAndAutoOrient(
                this.targetPoint,
                route[route.length - 1] || this.sourcePoint,
                this.paper.viewport
            );
        }
    },

    removeVertex: function(idx) {

        var vertices = joint.util.assign([], this.model.get('vertices'));

        if (vertices && vertices.length) {

            vertices.splice(idx, 1);
            this.model.set('vertices', vertices, { ui: true });
        }

        return this;
    },

    // This method ads a new vertex to the `vertices` array of `.connection`. This method
    // uses a heuristic to find the index at which the new `vertex` should be placed at assuming
    // the new vertex is somewhere on the path.
    addVertex: function(vertex) {

        // As it is very hard to find a correct index of the newly created vertex,
        // a little heuristics is taking place here.
        // The heuristics checks if length of the newly created
        // path is lot more than length of the old path. If this is the case,
        // new vertex was probably put into a wrong index.
        // Try to put it into another index and repeat the heuristics again.

        var vertices = (this.model.get('vertices') || []).slice();
        // Store the original vertices for a later revert if needed.
        var originalVertices = vertices.slice();

        // A `<path>` element used to compute the length of the path during heuristics.
        var path = this._V.connection.node.cloneNode(false);

        // Length of the original path.
        var originalPathLength = path.getTotalLength();
        // Current path length.
        var pathLength;
        // Tolerance determines the highest possible difference between the length
        // of the old and new path. The number has been chosen heuristically.
        var pathLengthTolerance = 20;
        // Total number of vertices including source and target points.
        var idx = vertices.length + 1;

        // Loop through all possible indexes and check if the difference between
        // path lengths changes significantly. If not, the found index is
        // most probably the right one.
        while (idx--) {

            vertices.splice(idx, 0, vertex);
            V(path).attr('d', this.getPathData(this.findRoute(vertices)));

            pathLength = path.getTotalLength();

            // Check if the path lengths changed significantly.
            if (pathLength - originalPathLength > pathLengthTolerance) {

                // Revert vertices to the original array. The path length has changed too much
                // so that the index was not found yet.
                vertices = originalVertices.slice();

            } else {

                break;
            }
        }

        if (idx === -1) {
            // If no suitable index was found for such a vertex, make the vertex the first one.
            idx = 0;
            vertices.splice(idx, 0, vertex);
        }

        this.model.set('vertices', vertices, { ui: true });

        return idx;
    },

    // Send a token (an SVG element, usually a circle) along the connection path.
    // Example: `link.findView(paper).sendToken(V('circle', { r: 7, fill: 'green' }).node)`
    // `opt.duration` is optional and is a time in milliseconds that the token travels from the source to the target of the link. Default is `1000`.
    // `opt.directon` is optional and it determines whether the token goes from source to target or other way round (`reverse`)
    // `callback` is optional and is a function to be called once the token reaches the target.
    sendToken: function(token, opt, callback) {

        function onAnimationEnd(vToken, callback) {
            return function() {
                vToken.remove();
                if (typeof callback === 'function') {
                    callback();
                }
            };
        }

        var duration, isReversed;
        if (joint.util.isObject(opt)) {
            duration = opt.duration;
            isReversed = (opt.direction === 'reverse');
        } else {
            // Backwards compatibility
            duration = opt;
            isReversed = false;
        }

        duration = duration || 1000;

        var animationAttributes = {
            dur: duration + 'ms',
            repeatCount: 1,
            calcMode: 'linear',
            fill: 'freeze'
        };

        if (isReversed) {
            animationAttributes.keyPoints = '1;0';
            animationAttributes.keyTimes = '0;1';
        }

        var vToken = V(token);
        var vPath = this._V.connection;

        vToken
            .appendTo(this.paper.viewport)
            .animateAlongPath(animationAttributes, vPath);

        setTimeout(onAnimationEnd(vToken, callback), duration);
    },

    findRoute: function(oldVertices) {

        var namespace = joint.routers;
        var router = this.model.get('router');
        var defaultRouter = this.paper.options.defaultRouter;

        if (!router) {

            if (this.model.get('manhattan')) {
                // backwards compability
                router = { name: 'orthogonal' };
            } else if (defaultRouter) {
                router = defaultRouter;
            } else {
                return oldVertices;
            }
        }

        var args = router.args || {};
        var routerFn = joint.util.isFunction(router) ? router : namespace[router.name];

        if (!joint.util.isFunction(routerFn)) {
            throw new Error('unknown router: "' + router.name + '"');
        }

        var newVertices = routerFn.call(this, oldVertices || [], args, this);

        return newVertices;
    },

    // Return the `d` attribute value of the `<path>` element representing the link
    // between `source` and `target`.
    getPathData: function(vertices) {

        var namespace = joint.connectors;
        var connector = this.model.get('connector');
        var defaultConnector = this.paper.options.defaultConnector;

        if (!connector) {

            // backwards compability
            if (this.model.get('smooth')) {
                connector = { name: 'smooth' };
            } else {
                connector = defaultConnector || {};
            }
        }

        var connectorFn = joint.util.isFunction(connector) ? connector : namespace[connector.name];
        var args = connector.args || {};

        if (!joint.util.isFunction(connectorFn)) {
            throw new Error('unknown connector: "' + connector.name + '"');
        }

        var pathData = connectorFn.call(
            this,
            this._markerCache.sourcePoint, // Note that the value is translated by the size
            this._markerCache.targetPoint, // of the marker. (We'r not using this.sourcePoint)
            vertices || (this.model.get('vertices') || {}),
            args, // options
            this
        );

        return pathData;
    },

    // Find a point that is the start of the connection.
    // If `selectorOrPoint` is a point, then we're done and that point is the start of the connection.
    // If the `selectorOrPoint` is an element however, we need to know a reference point (or element)
    // that the link leads to in order to determine the start of the connection on the original element.
    getConnectionPoint: function(end, selectorOrPoint, referenceSelectorOrPoint) {

        var spot;

        // If the `selectorOrPoint` (or `referenceSelectorOrPoint`) is `undefined`, the `source`/`target` of the link model is `undefined`.
        // We want to allow this however so that one can create links such as `var link = new joint.dia.Link` and
        // set the `source`/`target` later.
        joint.util.isEmpty(selectorOrPoint) && (selectorOrPoint = { x: 0, y: 0 });
        joint.util.isEmpty(referenceSelectorOrPoint) && (referenceSelectorOrPoint = { x: 0, y: 0 });

        if (!selectorOrPoint.id) {

            // If the source is a point, we don't need a reference point to find the sticky point of connection.
            spot = g.Point(selectorOrPoint);

        } else {

            // If the source is an element, we need to find a point on the element boundary that is closest
            // to the reference point (or reference element).
            // Get the bounding box of the spot relative to the paper viewport. This is necessary
            // in order to follow paper viewport transformations (scale/rotate).
            // `_sourceBbox` (`_targetBbox`) comes from `_sourceBboxUpdate` (`_sourceBboxUpdate`)
            // method, it exists since first render and are automatically updated
            var spotBBox = g.Rect(end === 'source' ? this.sourceBBox : this.targetBBox);

            var reference;

            if (!referenceSelectorOrPoint.id) {

                // Reference was passed as a point, therefore, we're ready to find the sticky point of connection on the source element.
                reference = g.Point(referenceSelectorOrPoint);

            } else {

                // Reference was passed as an element, therefore we need to find a point on the reference
                // element boundary closest to the source element.
                // Get the bounding box of the spot relative to the paper viewport. This is necessary
                // in order to follow paper viewport transformations (scale/rotate).
                var referenceBBox = g.Rect(end === 'source' ? this.targetBBox : this.sourceBBox);

                reference = referenceBBox.intersectionWithLineFromCenterToPoint(spotBBox.center());
                reference = reference || referenceBBox.center();
            }

            var paperOptions = this.paper.options;
            // If `perpendicularLinks` flag is set on the paper and there are vertices
            // on the link, then try to find a connection point that makes the link perpendicular
            // even though the link won't point to the center of the targeted object.
            if (paperOptions.perpendicularLinks || this.options.perpendicular) {

                var nearestSide;
                var spotOrigin = spotBBox.origin();
                var spotCorner = spotBBox.corner();

                if (spotOrigin.y <= reference.y && reference.y <= spotCorner.y) {

                    nearestSide = spotBBox.sideNearestToPoint(reference);
                    switch (nearestSide) {
                        case 'left':
                            spot = g.Point(spotOrigin.x, reference.y);
                            break;
                        case 'right':
                            spot = g.Point(spotCorner.x, reference.y);
                            break;
                        default:
                            spot = spotBBox.center();
                            break;
                    }

                } else if (spotOrigin.x <= reference.x && reference.x <= spotCorner.x) {

                    nearestSide = spotBBox.sideNearestToPoint(reference);
                    switch (nearestSide) {
                        case 'top':
                            spot = g.Point(reference.x, spotOrigin.y);
                            break;
                        case 'bottom':
                            spot = g.Point(reference.x, spotCorner.y);
                            break;
                        default:
                            spot = spotBBox.center();
                            break;
                    }

                } else {

                    // If there is no intersection horizontally or vertically with the object bounding box,
                    // then we fall back to the regular situation finding straight line (not perpendicular)
                    // between the object and the reference point.
                    spot = spotBBox.intersectionWithLineFromCenterToPoint(reference);
                    spot = spot || spotBBox.center();
                }

            } else if (paperOptions.linkConnectionPoint) {

                var view = end === 'target' ? this.targetView : this.sourceView;
                var magnet = end === 'target' ? this.targetMagnet : this.sourceMagnet;

                spot = paperOptions.linkConnectionPoint(this, view, magnet, reference);

            } else {

                spot = spotBBox.intersectionWithLineFromCenterToPoint(reference);
                spot = spot || spotBBox.center();
            }
        }

        return spot;
    },

    // Public API
    // ----------

    getConnectionLength: function() {

        return this._V.connection.node.getTotalLength();
    },

    getPointAtLength: function(length) {

        return this._V.connection.node.getPointAtLength(length);
    },

    // Interaction. The controller part.
    // ---------------------------------

    _beforeArrowheadMove: function() {

        this._z = this.model.get('z');
        this.model.toFront();

        // Let the pointer propagate throught the link view elements so that
        // the `evt.target` is another element under the pointer, not the link itself.
        this.el.style.pointerEvents = 'none';

        if (this.paper.options.markAvailable) {
            this._markAvailableMagnets();
        }
    },

    _afterArrowheadMove: function() {

        if (this._z !== null) {
            this.model.set('z', this._z, { ui: true });
            this._z = null;
        }

        // Put `pointer-events` back to its original value. See `startArrowheadMove()` for explanation.
        // Value `auto` doesn't work in IE9. We force to use `visiblePainted` instead.
        // See `https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events`.
        this.el.style.pointerEvents = 'visiblePainted';

        if (this.paper.options.markAvailable) {
            this._unmarkAvailableMagnets();
        }
    },

    _createValidateConnectionArgs: function(arrowhead) {
        // It makes sure the arguments for validateConnection have the following form:
        // (source view, source magnet, target view, target magnet and link view)
        var args = [];

        args[4] = arrowhead;
        args[5] = this;

        var oppositeArrowhead;
        var i = 0;
        var j = 0;

        if (arrowhead === 'source') {
            i = 2;
            oppositeArrowhead = 'target';
        } else {
            j = 2;
            oppositeArrowhead = 'source';
        }

        var end = this.model.get(oppositeArrowhead);

        if (end.id) {
            args[i] = this.paper.findViewByModel(end.id);
            args[i + 1] = end.selector && args[i].el.querySelector(end.selector);
        }

        function validateConnectionArgs(cellView, magnet) {
            args[j] = cellView;
            args[j + 1] = cellView.el === magnet ? undefined : magnet;
            return args;
        }

        return validateConnectionArgs;
    },

    _markAvailableMagnets: function() {

        function isMagnetAvailable(view, magnet) {
            var paper = view.paper;
            var validate = paper.options.validateConnection;
            return validate.apply(paper, this._validateConnectionArgs(view, magnet));
        }

        var paper = this.paper;
        var elements = paper.model.getElements();
        this._marked = {};

        for (var i = 0, n = elements.length; i < n; i++) {
            var view = elements[i].findView(paper);

            if (!view) {
                continue;
            }

            var magnets = Array.prototype.slice.call(view.el.querySelectorAll('[magnet]'));
            if (view.el.getAttribute('magnet') !== 'false') {
                // Element wrapping group is also a magnet
                magnets.push(view.el);
            }

            var availableMagnets = magnets.filter(isMagnetAvailable.bind(this, view));

            if (availableMagnets.length > 0) {
                // highlight all available magnets
                for (var j = 0, m = availableMagnets.length; j < m; j++) {
                    view.highlight(availableMagnets[j], { magnetAvailability: true })
                }
                // highlight the entire view
                view.highlight(null, { elementAvailability: true });

                this._marked[view.model.id] = availableMagnets;
            }
        }
    },

    _unmarkAvailableMagnets: function() {

        var markedKeys = Object.keys(this._marked);
        var id;
        var markedMagnets;

        for (var i = 0, n = markedKeys.length; i < n; i++) {
            id = markedKeys[i];
            markedMagnets = this._marked[id];

            var view = this.paper.findViewByModel(id);
            if (view) {
                for (var j = 0, m = markedMagnets.length; j < m; j++) {
                    view.unhighlight(markedMagnets[j], { magnetAvailability: true })
                }
                view.unhighlight(null, { elementAvailability: true });
            }
        }

        this._marked = null;
    },

    startArrowheadMove: function(end, opt) {

        opt = joint.util.defaults(opt || {}, { whenNotAllowed: 'revert' });
        // Allow to delegate events from an another view to this linkView in order to trigger arrowhead
        // move without need to click on the actual arrowhead dom element.
        this._action = 'arrowhead-move';
        this._whenNotAllowed = opt.whenNotAllowed;
        this._arrowhead = end;
        this._initialMagnet = this[end + 'Magnet'] || (this[end + 'View'] ? this[end + 'View'].el : null);
        this._initialEnd = joint.util.assign({}, this.model.get(end)) || { x: 0, y: 0 };
        this._validateConnectionArgs = this._createValidateConnectionArgs(this._arrowhead);
        this._beforeArrowheadMove();
    },

    pointerdown: function(evt, x, y) {

        joint.dia.CellView.prototype.pointerdown.apply(this, arguments);
        this.notify('link:pointerdown', evt, x, y);

        this._dx = x;
        this._dy = y;

        // if are simulating pointerdown on a link during a magnet click, skip link interactions
        if (evt.target.getAttribute('magnet') != null) return;

        var className = joint.util.removeClassNamePrefix(evt.target.getAttribute('class'));
        var parentClassName = joint.util.removeClassNamePrefix(evt.target.parentNode.getAttribute('class'));
        var labelNode;
        if (parentClassName === 'label') {
            className = parentClassName;
            labelNode = evt.target.parentNode;
        } else {
            labelNode = evt.target;
        }

        switch (className) {

            case 'marker-vertex':
                if (this.can('vertexMove')) {
                    this._action = 'vertex-move';
                    this._vertexIdx = evt.target.getAttribute('idx');
                }
                break;

            case 'marker-vertex-remove':
            case 'marker-vertex-remove-area':
                if (this.can('vertexRemove')) {
                    this.removeVertex(evt.target.getAttribute('idx'));
                }
                break;

            case 'marker-arrowhead':
                if (this.can('arrowheadMove')) {
                    this.startArrowheadMove(evt.target.getAttribute('end'));
                }
                break;

            case 'label':
                if (this.can('labelMove')) {
                    this._action = 'label-move';
                    this._labelIdx = parseInt(V(labelNode).attr('label-idx'), 10);
                    // Precalculate samples so that we don't have to do that
                    // over and over again while dragging the label.
                    this._samples = this._V.connection.sample(1);
                    this._linkLength = this._V.connection.node.getTotalLength();
                }
                break;

            default:

                var targetParentEvent = evt.target.parentNode.getAttribute('event');
                if (targetParentEvent) {
                    if (this.can('useLinkTools')) {
                        // `remove` event is built-in. Other custom events are triggered on the paper.
                        if (targetParentEvent === 'remove') {
                            this.model.remove();
                        } else {
                            this.notify(targetParentEvent, evt, x, y);
                        }
                    }
                } else {
                    if (this.can('vertexAdd')) {

                        // Store the index at which the new vertex has just been placed.
                        // We'll be update the very same vertex position in `pointermove()`.
                        this._vertexIdx = this.addVertex({ x: x, y: y });
                        this._action = 'vertex-move';
                    }
                }
        }
    },

    pointermove: function(evt, x, y) {

        switch (this._action) {

            case 'vertex-move':

                var vertices = joint.util.assign([], this.model.get('vertices'));
                vertices[this._vertexIdx] = { x: x, y: y };
                this.model.set('vertices', vertices, { ui: true });
                break;

            case 'label-move':

                var dragPoint = { x: x, y: y };
                var samples = this._samples;
                var minSqDistance = Infinity;
                var closestSample;
                var closestSampleIndex;
                var p;
                var sqDistance;
                for (var i = 0, n = samples.length; i < n; i++) {
                    p = samples[i];
                    sqDistance = g.line(p, dragPoint).squaredLength();
                    if (sqDistance < minSqDistance) {
                        minSqDistance = sqDistance;
                        closestSample = p;
                        closestSampleIndex = i;
                    }
                }
                var prevSample = samples[closestSampleIndex - 1];
                var nextSample = samples[closestSampleIndex + 1];
                var offset = 0;
                if (prevSample && nextSample) {
                    offset = g.line(prevSample, nextSample).pointOffset(dragPoint);
                } else if (prevSample) {
                    offset = g.line(prevSample, closestSample).pointOffset(dragPoint);
                } else if (nextSample) {
                    offset = g.line(closestSample, nextSample).pointOffset(dragPoint);
                }

                this.model.label(this._labelIdx, {
                    position: {
                        distance: closestSample.distance / this._linkLength,
                        offset: offset
                    }
                });
                break;

            case 'arrowhead-move':

                if (this.paper.options.snapLinks) {

                    // checking view in close area of the pointer

                    var r = this.paper.options.snapLinks.radius || 50;
                    var viewsInArea = this.paper.findViewsInArea({ x: x - r, y: y - r, width: 2 * r, height: 2 * r });

                    if (this._closestView) {
                        this._closestView.unhighlight(this._closestEnd.selector, {
                            connecting: true,
                            snapping: true
                        });
                    }
                    this._closestView = this._closestEnd = null;

                    var distance;
                    var minDistance = Number.MAX_VALUE;
                    var pointer = g.point(x, y);

                    viewsInArea.forEach(function(view) {

                        // skip connecting to the element in case '.': { magnet: false } attribute present
                        if (view.el.getAttribute('magnet') !== 'false') {

                            // find distance from the center of the model to pointer coordinates
                            distance = view.model.getBBox().center().distance(pointer);

                            // the connection is looked up in a circle area by `distance < r`
                            if (distance < r && distance < minDistance) {

                                if (this.paper.options.validateConnection.apply(
                                    this.paper, this._validateConnectionArgs(view, null)
                                )) {
                                    minDistance = distance;
                                    this._closestView = view;
                                    this._closestEnd = { id: view.model.id };
                                }
                            }
                        }

                        view.$('[magnet]').each(function(index, magnet) {

                            var bbox = V(magnet).getBBox({ target: this.paper.viewport });

                            distance = pointer.distance({
                                x: bbox.x + bbox.width / 2,
                                y: bbox.y + bbox.height / 2
                            });

                            if (distance < r && distance < minDistance) {

                                if (this.paper.options.validateConnection.apply(
                                    this.paper, this._validateConnectionArgs(view, magnet)
                                )) {
                                    minDistance = distance;
                                    this._closestView = view;
                                    this._closestEnd = {
                                        id: view.model.id,
                                        selector: view.getSelector(magnet),
                                        port: magnet.getAttribute('port')
                                    };
                                }
                            }

                        }.bind(this));

                    }, this);

                    if (this._closestView) {
                        this._closestView.highlight(this._closestEnd.selector, {
                            connecting: true,
                            snapping: true
                        });
                    }

                    this.model.set(this._arrowhead, this._closestEnd || { x: x, y: y }, { ui: true });

                } else {

                    // checking views right under the pointer

                    // Touchmove event's target is not reflecting the element under the coordinates as mousemove does.
                    // It holds the element when a touchstart triggered.
                    var target = (evt.type === 'mousemove')
                        ? evt.target
                        : document.elementFromPoint(evt.clientX, evt.clientY);

                    if (this._targetEvent !== target) {
                        // Unhighlight the previous view under pointer if there was one.
                        if (this._magnetUnderPointer) {
                            this._viewUnderPointer.unhighlight(this._magnetUnderPointer, {
                                connecting: true
                            });
                        }

                        this._viewUnderPointer = this.paper.findView(target);
                        if (this._viewUnderPointer) {
                            // If we found a view that is under the pointer, we need to find the closest
                            // magnet based on the real target element of the event.
                            this._magnetUnderPointer = this._viewUnderPointer.findMagnet(target);

                            if (this._magnetUnderPointer && this.paper.options.validateConnection.apply(
                                this.paper,
                                this._validateConnectionArgs(this._viewUnderPointer, this._magnetUnderPointer)
                            )) {
                                // If there was no magnet found, do not highlight anything and assume there
                                // is no view under pointer we're interested in reconnecting to.
                                // This can only happen if the overall element has the attribute `'.': { magnet: false }`.
                                if (this._magnetUnderPointer) {
                                    this._viewUnderPointer.highlight(this._magnetUnderPointer, {
                                        connecting: true
                                    });
                                }
                            } else {
                                // This type of connection is not valid. Disregard this magnet.
                                this._magnetUnderPointer = null;
                            }
                        } else {
                            // Make sure we'll unset previous magnet.
                            this._magnetUnderPointer = null;
                        }
                    }

                    this._targetEvent = target;

                    this.model.set(this._arrowhead, { x: x, y: y }, { ui: true });
                }
                break;
        }

        this._dx = x;
        this._dy = y;

        joint.dia.CellView.prototype.pointermove.apply(this, arguments);
        this.notify('link:pointermove', evt, x, y);
    },

    pointerup: function(evt, x, y) {

        if (this._action === 'label-move') {

            this._samples = null;

        } else if (this._action === 'arrowhead-move') {

            var model = this.model;
            var paper = this.paper;
            var paperOptions = paper.options;
            var arrowhead = this._arrowhead;
            var initialEnd = this._initialEnd;
            var magnetUnderPointer;

            if (paperOptions.snapLinks) {

                // Finish off link snapping.
                // Everything except view unhighlighting was already done on pointermove.
                if (this._closestView) {
                    this._closestView.unhighlight(this._closestEnd.selector, {
                        connecting: true,
                        snapping: true
                    });

                    magnetUnderPointer = this._closestView.findMagnet(this._closestEnd.selector);
                }

                this._closestView = this._closestEnd = null;

            } else {

                var viewUnderPointer = this._viewUnderPointer;
                magnetUnderPointer = this._magnetUnderPointer;

                this._viewUnderPointer = null;
                this._magnetUnderPointer = null;

                if (magnetUnderPointer) {

                    viewUnderPointer.unhighlight(magnetUnderPointer, { connecting: true });
                    // Find a unique `selector` of the element under pointer that is a magnet. If the
                    // `this._magnetUnderPointer` is the root element of the `this._viewUnderPointer` itself,
                    // the returned `selector` will be `undefined`. That means we can directly pass it to the
                    // `source`/`target` attribute of the link model below.
                    var selector = viewUnderPointer.getSelector(magnetUnderPointer);
                    var port = magnetUnderPointer.getAttribute('port');
                    var arrowheadValue = { id: viewUnderPointer.model.id };
                    if (port != null) arrowheadValue.port = port;
                    if (selector != null) arrowheadValue.selector = selector;
                    model.set(arrowhead, arrowheadValue, { ui: true });
                }
            }

            // If the changed link is not allowed, revert to its previous state.
            if (!paper.linkAllowed(this)) {

                switch (this._whenNotAllowed) {

                    case 'remove':
                        model.remove({ ui: true });
                        break;

                    case 'revert':
                    default:
                        model.set(arrowhead, initialEnd, { ui: true });
                        break;
                }

            } else {

                // Reparent the link if embedding is enabled
                if (paperOptions.embeddingMode && model.reparent()) {
                    // Make sure we don't reverse to the original 'z' index (see afterArrowheadMove()).
                    this._z = null;
                }

                var currentEnd = model.prop(arrowhead);
                var endChanged = currentEnd && !joint.dia.Link.endsEqual(initialEnd, currentEnd);
                if (endChanged) {

                    if (initialEnd.id) {
                        this.notify('link:disconnect', evt, paper.findViewByModel(initialEnd.id), this._initialMagnet, arrowhead);
                    }
                    if (currentEnd.id) {
                        this.notify('link:connect', evt, paper.findViewByModel(currentEnd.id), magnetUnderPointer, arrowhead);
                    }
                }
            }

            this._afterArrowheadMove();
        }

        this._action = null;
        this._whenNotAllowed = null;
        this._initialMagnet = null;
        this._initialEnd = null;
        this._validateConnectionArgs = null;

        this.notify('link:pointerup', evt, x, y);
        joint.dia.CellView.prototype.pointerup.apply(this, arguments);
    },

    mouseenter: function(evt) {

        joint.dia.CellView.prototype.mouseenter.apply(this, arguments);
        this.notify('link:mouseenter', evt);
    },

    mouseleave: function(evt) {

        joint.dia.CellView.prototype.mouseleave.apply(this, arguments);
        this.notify('link:mouseleave', evt);
    }

}, {

    makeSelector: function(end) {

        var selector = '[model-id="' + end.id + '"]';
        // `port` has a higher precendence over `selector`. This is because the selector to the magnet
        // might change while the name of the port can stay the same.
        if (end.port) {
            selector += ' [port="' + end.port + '"]';
        } else if (end.selector) {
            selector += ' ' + end.selector;
        }

        return selector;
    }

});


joint.dia.Paper = joint.mvc.View.extend({

    className: 'paper',

    options: {

        width: 800,
        height: 600,
        origin: { x: 0, y: 0 }, // x,y coordinates in top-left corner
        gridSize: 1,

        // Whether or not to draw the grid lines on the paper's DOM element.
        // e.g drawGrid: true, drawGrid: { color: 'red', thickness: 2 }
        drawGrid: false,

        // Whether or not to draw the background on the paper's DOM element.
        // e.g. background: { color: 'lightblue', image: '/paper-background.png', repeat: 'flip-xy' }
        background: false,

        perpendicularLinks: false,
        elementView: joint.dia.ElementView,
        linkView: joint.dia.LinkView,
        snapLinks: false, // false, true, { radius: value }

        // When set to FALSE, an element may not have more than 1 link with the same source and target element.
        multiLinks: true,

        // For adding custom guard logic.
        guard: function(evt, view) {

            // FALSE means the event isn't guarded.
            return false;
        },

        highlighting: {
            'default': {
                name: 'stroke',
                options: {
                    padding: 3
                }
            },
            magnetAvailability: {
                name: 'addClass',
                options: {
                    className: 'available-magnet'
                }
            },
            elementAvailability: {
                name: 'addClass',
                options: {
                    className: 'available-cell'
                }
            }
        },

        // Prevent the default context menu from being displayed.
        preventContextMenu: true,
        // Prevent the default action for blank:pointer<action>.
        preventDefaultBlankAction: true,
        // Restrict the translation of elements by given bounding box.
        // Option accepts a boolean:
        //  true - the translation is restricted to the paper area
        //  false - no restrictions
        // A method:
        // restrictTranslate: function(elementView) {
        //     var parentId = elementView.model.get('parent');
        //     return parentId && this.model.getCell(parentId).getBBox();
        // },
        // Or a bounding box:
        // restrictTranslate: { x: 10, y: 10, width: 790, height: 590 }
        restrictTranslate: false,
        // Marks all available magnets with 'available-magnet' class name and all available cells with
        // 'available-cell' class name. Marks them when dragging a link is started and unmark
        // when the dragging is stopped.
        markAvailable: false,

        // Defines what link model is added to the graph after an user clicks on an active magnet.
        // Value could be the Backbone.model or a function returning the Backbone.model
        // defaultLink: function(elementView, magnet) { return condition ? new customLink1() : new customLink2() }
        defaultLink: new joint.dia.Link,

        // A connector that is used by links with no connector defined on the model.
        // e.g. { name: 'rounded', args: { radius: 5 }} or a function
        defaultConnector: { name: 'normal' },

        // A router that is used by links with no router defined on the model.
        // e.g. { name: 'oneSide', args: { padding: 10 }} or a function
        defaultRouter: { name: 'normal' },

        /* CONNECTING */

        // Check whether to add a new link to the graph when user clicks on an a magnet.
        validateMagnet: function(cellView, magnet) {
            return magnet.getAttribute('magnet') !== 'passive';
        },

        // Check whether to allow or disallow the link connection while an arrowhead end (source/target)
        // being changed.
        validateConnection: function(cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
            return (end === 'target' ? cellViewT : cellViewS) instanceof joint.dia.ElementView;
        },

        /* EMBEDDING */

        // Enables embedding. Reparents the dragged element with elements under it and makes sure that
        // all links and elements are visible taken the level of embedding into account.
        embeddingMode: false,

        // Check whether to allow or disallow the element embedding while an element being translated.
        validateEmbedding: function(childView, parentView) {
            // by default all elements can be in relation child-parent
            return true;
        },

        // Determines the way how a cell finds a suitable parent when it's dragged over the paper.
        // The cell with the highest z-index (visually on the top) will be choosen.
        findParentBy: 'bbox', // 'bbox'|'center'|'origin'|'corner'|'topRight'|'bottomLeft'

        // If enabled only the element on the very front is taken into account for the embedding.
        // If disabled the elements under the dragged view are tested one by one
        // (from front to back) until a valid parent found.
        frontParentOnly: true,

        // Interactive flags. See online docs for the complete list of interactive flags.
        interactive: {
            labelMove: false
        },

        // When set to true the links can be pinned to the paper.
        // i.e. link source/target can be a point e.g. link.get('source') ==> { x: 100, y: 100 };
        linkPinning: true,

        // Allowed number of mousemove events after which the pointerclick event will be still triggered.
        clickThreshold: 0,

        // Number of required mousemove events before the first pointermove event will be triggered.
        moveThreshold: 0,

        // The namespace, where all the cell views are defined.
        cellViewNamespace: joint.shapes,

        // The namespace, where all the cell views are defined.
        highlighterNamespace: joint.highlighters
    },

    events: {

        'mousedown': 'pointerdown',
        'dblclick': 'mousedblclick',
        'click': 'mouseclick',
        'touchstart': 'pointerdown',
        'touchend': 'mouseclick',
        'touchmove': 'pointermove',
        'mousemove': 'pointermove',
        'mouseover .joint-cell': 'cellMouseover',
        'mouseout .joint-cell': 'cellMouseout',
        'contextmenu': 'contextmenu',
        'mousewheel': 'mousewheel',
        'DOMMouseScroll': 'mousewheel',
        'mouseenter .joint-cell': 'cellMouseenter',
        'mouseleave .joint-cell': 'cellMouseleave'
    },

    _highlights: {},

    init: function() {

        joint.util.bindAll(this, 'pointerup');

        var model = this.model = this.options.model || new joint.dia.Graph;

        this.setGrid(this.options.drawGrid);
        this.cloneOptions();
        this.render();
        this.setDimensions();

        this.listenTo(model, 'add', this.onCellAdded)
            .listenTo(model, 'remove', this.removeView)
            .listenTo(model, 'reset', this.resetViews)
            .listenTo(model, 'sort', this._onSort)
            .listenTo(model, 'batch:stop', this._onBatchStop);

        this.on('cell:highlight', this.onCellHighlight)
            .on('cell:unhighlight', this.onCellUnhighlight)
            .on('scale translate', this.update);

        // Hold the value when mouse has been moved: when mouse moved, no click event will be triggered.
        this._mousemoved = 0;
        // Hash of all cell views.
        this._views = {};
        // Reference to the paper owner document
        this.$document = $(this.el.ownerDocument);
    },

    cloneOptions: function() {

        var options = this.options;

        // This is a fix for the case where two papers share the same options.
        // Changing origin.x for one paper would change the value of origin.x for the other.
        // This prevents that behavior.
        options.origin = joint.util.assign({}, options.origin);
        options.defaultConnector = joint.util.assign({}, options.defaultConnector);
        // Return the default highlighting options into the user specified options.
        options.highlighting = joint.util.defaultsDeep(
            {},
            options.highlighting,
            this.constructor.prototype.options.highlighting
        );
    },

    bindDocumentEvents: function() {
        var eventNS = this.getEventNamespace();
        this.$document.on('mouseup' + eventNS + ' touchend' + eventNS, this.pointerup);
    },

    unbindDocumentEvents: function() {
        this.$document.off(this.getEventNamespace());
    },

    render: function() {

        this.$el.empty();

        this.svg = V('svg').attr({ width: '100%', height: '100%' }).node;
        this.viewport = V('g').addClass(joint.util.addClassNamePrefix('viewport')).node;
        this.defs = V('defs').node;

        // Append `<defs>` element to the SVG document. This is useful for filters and gradients.
        V(this.svg).append([this.viewport, this.defs]);

        this.$background = $('<div/>').addClass(joint.util.addClassNamePrefix('paper-background'));
        if (this.options.background) {
            this.drawBackground(this.options.background);
        }

        this.$grid = $('<div/>').addClass(joint.util.addClassNamePrefix('paper-grid'));
        if (this.options.drawGrid) {
            this.drawGrid();
        }

        this.$el.append(this.$background, this.$grid, this.svg);

        return this;
    },

    update: function() {

        if (this.options.drawGrid) {
            this.drawGrid();
        }

        if (this._background) {
            this.updateBackgroundImage(this._background);
        }
    },

    // For storing the current transformation matrix (CTM) of the paper's viewport.
    _viewportMatrix: null,
    // For verifying whether the CTM is up-to-date. The viewport transform attribute
    // could have been manipulated directly.
    _viewportTransformString: null,

    matrix: function(ctm) {

        var viewport = this.viewport;

        // Getter:
        if (ctm === undefined) {

            var transformString = viewport.getAttribute('transform');

            if ((this._viewportTransformString || null) === transformString) {
                // It's ok to return the cached matrix. The transform attribute has not changed since
                // the matrix was stored.
                ctm = this._viewportMatrix;
            } else {
                // The viewport transform attribute has changed. Measure the matrix and cache again.
                ctm = viewport.getCTM();
                this._viewportMatrix = ctm;
                this._viewportTransformString = transformString;
            }

            // Clone the cached current transformation matrix.
            // If no matrix previously stored the identity matrix is returned.
            return V.createSVGMatrix(ctm);
        }

        // Setter:
        ctm = V.createSVGMatrix(ctm);
        V(viewport).transform(ctm, { absolute: true });
        this._viewportMatrix = ctm;
        this._viewportTransformString = viewport.getAttribute('transform');

        return this;
    },

    clientMatrix: function() {

        return V.createSVGMatrix(this.viewport.getScreenCTM());
    },

    _onSort: function() {
        if (!this.model.hasActiveBatch('add')) {
            this.sortViews();
        }
    },

    _onBatchStop: function(data) {
        var name = data && data.batchName;
        if (name === 'add' && !this.model.hasActiveBatch('add')) {
            this.sortViews();
        }
    },

    onRemove: function() {

        //clean up all DOM elements/views to prevent memory leaks
        this.removeViews();
        this.unbindDocumentEvents();
    },

    setDimensions: function(width, height) {

        width = this.options.width = width || this.options.width;
        height = this.options.height = height || this.options.height;

        this.$el.css({
            width: Math.round(width),
            height: Math.round(height)
        });

        this.trigger('resize', width, height);
    },

    setOrigin: function(ox, oy) {

        return this.translate(ox || 0, oy || 0, { absolute: true });
    },

    // Expand/shrink the paper to fit the content. Snap the width/height to the grid
    // defined in `gridWidth`, `gridHeight`. `padding` adds to the resulting width/height of the paper.
    // When options { fitNegative: true } it also translates the viewport in order to make all
    // the content visible.
    fitToContent: function(gridWidth, gridHeight, padding, opt) { // alternatively function(opt)

        if (joint.util.isObject(gridWidth)) {
            // first parameter is an option object
            opt = gridWidth;
            gridWidth = opt.gridWidth || 1;
            gridHeight = opt.gridHeight || 1;
            padding = opt.padding || 0;

        } else {

            opt = opt || {};
            gridWidth = gridWidth || 1;
            gridHeight = gridHeight || 1;
            padding = padding || 0;
        }

        padding = joint.util.normalizeSides(padding);

        // Calculate the paper size to accomodate all the graph's elements.
        var bbox = V(this.viewport).getBBox();

        var currentScale = this.scale();
        var currentTranslate = this.translate();

        bbox.x *= currentScale.sx;
        bbox.y *= currentScale.sy;
        bbox.width *= currentScale.sx;
        bbox.height *= currentScale.sy;

        var calcWidth = Math.max(Math.ceil((bbox.width + bbox.x) / gridWidth), 1) * gridWidth;
        var calcHeight = Math.max(Math.ceil((bbox.height + bbox.y) / gridHeight), 1) * gridHeight;

        var tx = 0;
        var ty = 0;

        if ((opt.allowNewOrigin == 'negative' && bbox.x < 0) || (opt.allowNewOrigin == 'positive' && bbox.x >= 0) || opt.allowNewOrigin == 'any') {
            tx = Math.ceil(-bbox.x / gridWidth) * gridWidth;
            tx += padding.left;
            calcWidth += tx;
        }

        if ((opt.allowNewOrigin == 'negative' && bbox.y < 0) || (opt.allowNewOrigin == 'positive' && bbox.y >= 0) || opt.allowNewOrigin == 'any') {
            ty = Math.ceil(-bbox.y / gridHeight) * gridHeight;
            ty += padding.top;
            calcHeight += ty;
        }

        calcWidth += padding.right;
        calcHeight += padding.bottom;

        // Make sure the resulting width and height are greater than minimum.
        calcWidth = Math.max(calcWidth, opt.minWidth || 0);
        calcHeight = Math.max(calcHeight, opt.minHeight || 0);

        // Make sure the resulting width and height are lesser than maximum.
        calcWidth = Math.min(calcWidth, opt.maxWidth || Number.MAX_VALUE);
        calcHeight = Math.min(calcHeight, opt.maxHeight || Number.MAX_VALUE);

        var dimensionChange = calcWidth != this.options.width || calcHeight != this.options.height;
        var originChange = tx != currentTranslate.tx || ty != currentTranslate.ty;

        // Change the dimensions only if there is a size discrepency or an origin change
        if (originChange) {
            this.translate(tx, ty);
        }
        if (dimensionChange) {
            this.setDimensions(calcWidth, calcHeight);
        }
    },

    scaleContentToFit: function(opt) {

        var contentBBox = this.getContentBBox();

        if (!contentBBox.width || !contentBBox.height) return;

        opt = opt || {};

        joint.util.defaults(opt, {
            padding: 0,
            preserveAspectRatio: true,
            scaleGrid: null,
            minScale: 0,
            maxScale: Number.MAX_VALUE
            //minScaleX
            //minScaleY
            //maxScaleX
            //maxScaleY
            //fittingBBox
        });

        var padding = opt.padding;

        var minScaleX = opt.minScaleX || opt.minScale;
        var maxScaleX = opt.maxScaleX || opt.maxScale;
        var minScaleY = opt.minScaleY || opt.minScale;
        var maxScaleY = opt.maxScaleY || opt.maxScale;

        var fittingBBox;
        if (opt.fittingBBox) {
            fittingBBox = opt.fittingBBox;
        } else {
            var currentTranslate = this.translate();
            fittingBBox = {
                x: currentTranslate.tx,
                y: currentTranslate.ty,
                width: this.options.width,
                height: this.options.height
            };
        }

        fittingBBox = g.rect(fittingBBox).moveAndExpand({
            x: padding,
            y: padding,
            width: -2 * padding,
            height: -2 * padding
        });

        var currentScale = this.scale();

        var newSx = fittingBBox.width / contentBBox.width * currentScale.sx;
        var newSy = fittingBBox.height / contentBBox.height * currentScale.sy;

        if (opt.preserveAspectRatio) {
            newSx = newSy = Math.min(newSx, newSy);
        }

        // snap scale to a grid
        if (opt.scaleGrid) {

            var gridSize = opt.scaleGrid;

            newSx = gridSize * Math.floor(newSx / gridSize);
            newSy = gridSize * Math.floor(newSy / gridSize);
        }

        // scale min/max boundaries
        newSx = Math.min(maxScaleX, Math.max(minScaleX, newSx));
        newSy = Math.min(maxScaleY, Math.max(minScaleY, newSy));

        this.scale(newSx, newSy);

        var contentTranslation = this.getContentBBox();

        var newOx = fittingBBox.x - contentTranslation.x;
        var newOy = fittingBBox.y - contentTranslation.y;

        this.translate(newOx, newOy);
    },

    getContentBBox: function() {

        var crect = this.viewport.getBoundingClientRect();

        // Using Screen CTM was the only way to get the real viewport bounding box working in both
        // Google Chrome and Firefox.
        var clientCTM = this.clientMatrix();

        // for non-default origin we need to take the viewport translation into account
        var currentTranslate = this.translate();

        return g.rect({
            x: crect.left - clientCTM.e + currentTranslate.tx,
            y: crect.top - clientCTM.f + currentTranslate.ty,
            width: crect.width,
            height: crect.height
        });
    },

    // Returns a geometry rectangle represeting the entire
    // paper area (coordinates from the left paper border to the right one
    // and the top border to the bottom one).
    getArea: function() {

        return this.paperToLocalRect({
            x: 0,
            y: 0,
            width: this.options.width,
            height: this.options.height
        });
    },

    getRestrictedArea: function() {

        var restrictedArea;

        if (joint.util.isFunction(this.options.restrictTranslate)) {
            // A method returning a bounding box
            restrictedArea = this.options.restrictTranslate.apply(this, arguments);
        } else if (this.options.restrictTranslate === true) {
            // The paper area
            restrictedArea = this.getArea();
        } else {
            // Either false or a bounding box
            restrictedArea = this.options.restrictTranslate || null;
        }

        return restrictedArea;
    },

    createViewForModel: function(cell) {

        // A class taken from the paper options.
        var optionalViewClass;

        // A default basic class (either dia.ElementView or dia.LinkView)
        var defaultViewClass;

        // A special class defined for this model in the corresponding namespace.
        // e.g. joint.shapes.basic.Rect searches for joint.shapes.basic.RectView
        var namespace = this.options.cellViewNamespace;
        var type = cell.get('type') + 'View';
        var namespaceViewClass = joint.util.getByPath(namespace, type, '.');

        if (cell.isLink()) {
            optionalViewClass = this.options.linkView;
            defaultViewClass = joint.dia.LinkView;
        } else {
            optionalViewClass = this.options.elementView;
            defaultViewClass = joint.dia.ElementView;
        }

        // a) the paper options view is a class (deprecated)
        //  1. search the namespace for a view
        //  2. if no view was found, use view from the paper options
        // b) the paper options view is a function
        //  1. call the function from the paper options
        //  2. if no view was return, search the namespace for a view
        //  3. if no view was found, use the default
        var ViewClass = (optionalViewClass.prototype instanceof Backbone.View)
            ? namespaceViewClass || optionalViewClass
            : optionalViewClass.call(this, cell) || namespaceViewClass || defaultViewClass;

        return new ViewClass({
            model: cell,
            interactive: this.options.interactive
        });
    },

    onCellAdded: function(cell, graph, opt) {

        if (this.options.async && opt.async !== false && joint.util.isNumber(opt.position)) {

            this._asyncCells = this._asyncCells || [];
            this._asyncCells.push(cell);

            if (opt.position == 0) {

                if (this._frameId) throw new Error('another asynchronous rendering in progress');

                this.asyncRenderViews(this._asyncCells, opt);
                delete this._asyncCells;
            }

        } else {

            this.renderView(cell);
        }
    },

    removeView: function(cell) {

        var view = this._views[cell.id];

        if (view) {
            view.remove();
            delete this._views[cell.id];
        }

        return view;
    },

    renderView: function(cell) {

        var view = this._views[cell.id] = this.createViewForModel(cell);

        V(this.viewport).append(view.el);
        view.paper = this;
        view.render();

        // This is the only way to prevent image dragging in Firefox that works.
        // Setting -moz-user-select: none, draggable="false" attribute or user-drag: none didn't help.
        $(view.el).find('image').on('dragstart', function() { return false; });

        return view;
    },

    beforeRenderViews: function(cells) {

        // Make sure links are always added AFTER elements.
        // They wouldn't find their sources/targets in the DOM otherwise.
        cells.sort(function(a) { return (a.isLink()) ? 1 : -1; });

        return cells;
    },

    afterRenderViews: function() {

        this.sortViews();
    },

    resetViews: function(cellsCollection, opt) {

        // clearing views removes any event listeners
        this.removeViews();

        var cells = cellsCollection.models.slice();

        // `beforeRenderViews()` can return changed cells array (e.g sorted).
        cells = this.beforeRenderViews(cells, opt) || cells;

        this.cancelRenderViews();

        if (this.options.async) {

            this.asyncRenderViews(cells, opt);
            // Sort the cells once all elements rendered (see asyncRenderViews()).

        } else {

            for (var i = 0, n = cells.length; i < n; i++) {
                this.renderView(cells[i]);
            }

            // Sort the cells in the DOM manually as we might have changed the order they
            // were added to the DOM (see above).
            this.sortViews();
        }
    },

    cancelRenderViews: function() {
        if (this._frameId) {
            joint.util.cancelFrame(this._frameId);
            delete this._frameId;
        }
    },

    removeViews: function() {

        joint.util.invoke(this._views, 'remove');

        this._views = {};
    },

    asyncBatchAdded: joint.util.noop,

    asyncRenderViews: function(cells, opt) {

        if (this._frameId) {

            var batchSize = (this.options.async && this.options.async.batchSize) || 50;
            var batchCells = cells.splice(0, batchSize);

            batchCells.forEach(function(cell) {

                // The cell has to be part of the graph.
                // There is a chance in asynchronous rendering
                // that a cell was removed before it's rendered to the paper.
                if (cell.graph === this.model) this.renderView(cell);

            }, this);

            this.asyncBatchAdded();
        }

        if (!cells.length) {

            // No cells left to render.
            delete this._frameId;
            this.afterRenderViews(opt);
            this.trigger('render:done', opt);

        } else {

            // Schedule a next batch to render.
            this._frameId = joint.util.nextFrame(function() {
                this.asyncRenderViews(cells, opt);
            }, this);
        }
    },

    sortViews: function() {

        // Run insertion sort algorithm in order to efficiently sort DOM elements according to their
        // associated model `z` attribute.

        var $cells = $(this.viewport).children('[model-id]');
        var cells = this.model.get('cells');

        joint.util.sortElements($cells, function(a, b) {

            var cellA = cells.get($(a).attr('model-id'));
            var cellB = cells.get($(b).attr('model-id'));

            return (cellA.get('z') || 0) > (cellB.get('z') || 0) ? 1 : -1;
        });
    },

    scale: function(sx, sy, ox, oy) {

        // getter
        if (sx === undefined) {
            return V.matrixToScale(this.matrix());
        }

        // setter
        if (sy === undefined) {
            sy = sx;
        }
        if (ox === undefined) {
            ox = 0;
            oy = 0;
        }

        var translate = this.translate();

        if (ox || oy || translate.tx || translate.ty) {
            var newTx = translate.tx - ox * (sx - 1);
            var newTy = translate.ty - oy * (sy - 1);
            this.translate(newTx, newTy);
        }

        var ctm = this.matrix();
        ctm.a = sx || 0;
        ctm.d = sy || 0;

        this.matrix(ctm);

        this.trigger('scale', sx, sy, ox, oy);

        return this;
    },

    // Experimental - do not use in production.
    rotate: function(angle, cx, cy) {

        // getter
        if (angle === undefined) {
            return V.matrixToRotate(this.matrix());
        }

        // setter

        // If the origin is not set explicitely, rotate around the center. Note that
        // we must use the plain bounding box (`this.el.getBBox()` instead of the one that gives us
        // the real bounding box (`bbox()`) including transformations).
        if (cx === undefined) {
            var bbox = this.viewport.getBBox();
            cx = bbox.width / 2;
            cy = bbox.height / 2;
        }

        var ctm = this.matrix().translate(cx,cy).rotate(angle).translate(-cx,-cy);
        this.matrix(ctm);

        return this;
    },

    translate: function(tx, ty) {

        // getter
        if (tx === undefined) {
            return V.matrixToTranslate(this.matrix());
        }

        // setter

        var ctm = this.matrix();
        ctm.e = tx || 0;
        ctm.f = ty || 0;

        this.matrix(ctm);

        var newTranslate = this.translate();
        var origin = this.options.origin;
        origin.x = newTranslate.tx;
        origin.y = newTranslate.ty;

        this.trigger('translate', newTranslate.tx, newTranslate.ty);

        if (this.options.drawGrid) {
            this.drawGrid();
        }

        return this;
    },

    // Find the first view climbing up the DOM tree starting at element `el`. Note that `el` can also
    // be a selector or a jQuery object.
    findView: function($el) {

        var el = joint.util.isString($el)
            ? this.viewport.querySelector($el)
            : $el instanceof $ ? $el[0] : $el;

        while (el && el !== this.el && el !== document) {

            var id = el.getAttribute('model-id');
            if (id) return this._views[id];

            el = el.parentNode;
        }

        return undefined;
    },

    // Find a view for a model `cell`. `cell` can also be a string representing a model `id`.
    findViewByModel: function(cell) {

        var id = joint.util.isString(cell) ? cell : cell.id;

        return this._views[id];
    },

    // Find all views at given point
    findViewsFromPoint: function(p) {

        p = g.point(p);

        var views = this.model.getElements().map(this.findViewByModel, this);

        return views.filter(function(view) {
            return view && view.vel.getBBox({ target: this.viewport }).containsPoint(p);
        }, this);
    },

    // Find all views in given area
    findViewsInArea: function(rect, opt) {

        opt = joint.util.defaults(opt || {}, { strict: false });
        rect = g.rect(rect);

        var views = this.model.getElements().map(this.findViewByModel, this);
        var method = opt.strict ? 'containsRect' : 'intersect';

        return views.filter(function(view) {
            return view && rect[method](view.vel.getBBox({ target: this.viewport }));
        }, this);
    },

    getModelById: function(id) {

        return this.model.getCell(id);
    },

    snapToGrid: function(x, y) {

        // Convert global coordinates to the local ones of the `viewport`. Otherwise,
        // improper transformation would be applied when the viewport gets transformed (scaled/rotated).
        return this.clientToLocalPoint(x, y).snapToGrid(this.options.gridSize);
    },

    localToPaperPoint: function(x, y) {
        // allow `x` to be a point and `y` undefined
        var localPoint = g.Point(x, y);
        var paperPoint = V.transformPoint(localPoint, this.matrix());
        return g.Point(paperPoint);
    },

    localToPaperRect: function(x, y, width, height) {
        // allow `x` to be a rectangle and rest arguments undefined
        var localRect = g.Rect(x, y);
        var paperRect = V.transformRect(localRect, this.matrix());
        return g.Rect(paperRect);
    },

    paperToLocalPoint: function(x, y) {
        // allow `x` to be a point and `y` undefined
        var paperPoint = g.Point(x, y);
        var localPoint = V.transformPoint(paperPoint, this.matrix().inverse());
        return g.Point(localPoint);
    },

    paperToLocalRect: function(x, y, width, height) {
        // allow `x` to be a rectangle and rest arguments undefined
        var paperRect = g.Rect(x, y, width, height);
        var localRect = V.transformRect(paperRect, this.matrix().inverse());
        return g.Rect(localRect);
    },

    localToClientPoint: function(x, y) {
        // allow `x` to be a point and `y` undefined
        var localPoint = g.Point(x, y);
        var clientPoint = V.transformPoint(localPoint, this.clientMatrix());
        return g.Point(clientPoint);
    },

    localToClientRect: function(x, y, width, height) {
        // allow `x` to be a point and `y` undefined
        var localRect = g.Rect(x, y, width, height);
        var clientRect = V.transformRect(localRect, this.clientMatrix());
        return g.Rect(clientRect);
    },

    // Transform client coordinates to the paper local coordinates.
    // Useful when you have a mouse event object and you'd like to get coordinates
    // inside the paper that correspond to `evt.clientX` and `evt.clientY` point.
    // Example: var localPoint = paper.clientToLocalPoint({ x: evt.clientX, y: evt.clientY });
    clientToLocalPoint: function(x, y) {
        // allow `x` to be a point and `y` undefined
        var clientPoint = g.Point(x, y);
        var localPoint = V.transformPoint(clientPoint, this.clientMatrix().inverse());
        return g.Point(localPoint);
    },

    clientToLocalRect: function(x, y, width, height) {
        // allow `x` to be a point and `y` undefined
        var clientRect = g.Rect(x, y, width, height);
        var localRect = V.transformRect(clientRect, this.clientMatrix().inverse());
        return g.Rect(localRect);
    },

    localToPagePoint: function(x, y) {
        return this.localToPaperPoint(x, y).offset(this.pageOffset());
    },

    localToPageRect: function(x, y, width, height) {
        return this.localToPaperRect(x, y, width, height).moveAndExpand(this.pageOffset());
    },

    pageToLocalPoint: function(x, y) {
        var pagePoint = g.Point(x, y);
        var paperPoint = pagePoint.difference(this.pageOffset());
        return this.paperToLocalPoint(paperPoint);
    },

    pageToLocalRect: function(x, y, width, height) {
        var pageOffset = this.pageOffset();
        var paperRect = g.Rect(x, y, width, height);
        paperRect.x -= pageOffset.x;
        paperRect.y -= pageOffset.y;
        return this.paperToLocalRect(paperRect);
    },

    clientOffset: function() {
        var clientRect = this.svg.getBoundingClientRect();
        return g.Point(clientRect.left, clientRect.top);
    },

    pageOffset: function() {
        return this.clientOffset().offset(window.scrollX, window.scrollY);
    },

    linkAllowed: function(linkViewOrModel) {

        var link;

        if (linkViewOrModel instanceof joint.dia.Link) {
            link = linkViewOrModel;
        } else if (linkViewOrModel instanceof joint.dia.LinkView) {
            link = linkViewOrModel.model;
        } else {
            throw new Error('Must provide link model or view.');
        }

        if (!this.options.multiLinks) {

            // Do not allow multiple links to have the same source and target.

            var source = link.get('source');
            var target = link.get('target');

            if (source.id && target.id) {

                var sourceModel = link.getSourceElement();

                if (sourceModel) {

                    var connectedLinks = this.model.getConnectedLinks(sourceModel, {
                        outbound: true,
                        inbound: false
                    });

                    var numSameLinks = connectedLinks.filter(function(_link) {

                        var _source = _link.get('source');
                        var _target = _link.get('target');

                        return _source && _source.id === source.id &&
                                (!_source.port || (_source.port === source.port)) &&
                                _target && _target.id === target.id &&
                                (!_target.port || (_target.port === target.port));

                    }).length;

                    if (numSameLinks > 1) {
                        return false;
                    }
                }
            }
        }

        if (
            !this.options.linkPinning &&
            (
                !joint.util.has(link.get('source'), 'id') ||
                !joint.util.has(link.get('target'), 'id')
            )
        ) {
            // Link pinning is not allowed and the link is not connected to the target.
            return false;
        }

        return true;
    },

    getDefaultLink: function(cellView, magnet) {

        return joint.util.isFunction(this.options.defaultLink)
        // default link is a function producing link model
            ? this.options.defaultLink.call(this, cellView, magnet)
        // default link is the Backbone model
            : this.options.defaultLink.clone();
    },

    // Cell highlighting
    // -----------------
    resolveHighlighter: function(opt) {

        opt = opt || {};
        var highlighterDef = opt.highlighter;
        var paperOpt = this.options;

        /*
            Expecting opt.highlighter to have the following structure:
            {
                name: 'highlighter-name',
                options: {
                    some: 'value'
                }
            }
        */
        if (highlighterDef === undefined) {

            // check for built-in types
            var type = _.chain(opt)
                .pick('embedding', 'connecting', 'magnetAvailability', 'elementAvailability')
                .keys().first().value();

            highlighterDef = (type && paperOpt.highlighting[type]) || paperOpt.highlighting['default'];
        }

        // Do nothing if opt.highlighter is falsey.
        // This allows the case to not highlight cell(s) in certain cases.
        // For example, if you want to NOT highlight when embedding elements.
        if (!highlighterDef) return false;

        // Allow specifying a highlighter by name.
        if (joint.util.isString(highlighterDef)) {
            highlighterDef = {
                name: highlighterDef
            };
        }

        var name = highlighterDef.name;
        var highlighter = paperOpt.highlighterNamespace[name];

        // Highlighter validation
        if (!highlighter) {
            throw new Error('Unknown highlighter ("' + name + '")');
        }
        if (typeof highlighter.highlight !== 'function') {
            throw new Error('Highlighter ("' + name + '") is missing required highlight() method');
        }
        if (typeof highlighter.unhighlight !== 'function') {
            throw new Error('Highlighter ("' + name + '") is missing required unhighlight() method');
        }

        return {
            highlighter: highlighter,
            options: highlighterDef.options || {},
            name: name
        };
    },

    onCellHighlight: function(cellView, magnetEl, opt) {

        opt = this.resolveHighlighter(opt);
        if (!opt) return;
        if (!magnetEl.id) {
            magnetEl.id = V.uniqueId();
        }

        var key = opt.name + magnetEl.id + JSON.stringify(opt.options);
        if (!this._highlights[key]) {

            var highlighter = opt.highlighter;
            highlighter.highlight(cellView, magnetEl, joint.util.assign({}, opt.options));

            this._highlights[key] = {
                cellView: cellView,
                magnetEl: magnetEl,
                opt: opt.options,
                highlighter: highlighter
            };
        }
    },

    onCellUnhighlight: function(cellView, magnetEl, opt) {

        opt = this.resolveHighlighter(opt);
        if (!opt) return;

        var key = opt.name + magnetEl.id + JSON.stringify(opt.options);
        var highlight = this._highlights[key];
        if (highlight) {

            // Use the cellView and magnetEl that were used by the highlighter.highlight() method.
            highlight.highlighter.unhighlight(highlight.cellView, highlight.magnetEl, highlight.opt);

            this._highlights[key] = null;
        }
    },

    // Interaction.
    // ------------

    mousedblclick: function(evt) {

        evt.preventDefault();
        evt = joint.util.normalizeEvent(evt);

        var view = this.findView(evt.target);
        if (this.guard(evt, view)) return;

        var localPoint = this.snapToGrid({ x: evt.clientX, y: evt.clientY });

        if (view) {

            view.pointerdblclick(evt, localPoint.x, localPoint.y);

        } else {

            this.trigger('blank:pointerdblclick', evt, localPoint.x, localPoint.y);
        }
    },

    mouseclick: function(evt) {

        // Trigger event when mouse not moved.
        if (this._mousemoved <= this.options.clickThreshold) {

            evt = joint.util.normalizeEvent(evt);

            var view = this.findView(evt.target);
            if (this.guard(evt, view)) return;

            var localPoint = this.snapToGrid({ x: evt.clientX, y: evt.clientY });

            if (view) {

                view.pointerclick(evt, localPoint.x, localPoint.y);

            } else {

                this.trigger('blank:pointerclick', evt, localPoint.x, localPoint.y);
            }
        }
    },

    // Guard guards the event received. If the event is not interesting, guard returns `true`.
    // Otherwise, it return `false`.
    guard: function(evt, view) {

        if (this.options.guard && this.options.guard(evt, view)) {
            return true;
        }

        if (evt.data && evt.data.guarded !== undefined) {
            return evt.data.guarded;
        }

        if (view && view.model && (view.model instanceof joint.dia.Cell)) {
            return false;
        }

        if (this.svg === evt.target || this.el === evt.target || $.contains(this.svg, evt.target)) {
            return false;
        }

        return true;    // Event guarded. Paper should not react on it in any way.
    },

    contextmenu: function(evt) {

        evt = joint.util.normalizeEvent(evt);

        if (this.options.preventContextMenu) {
            evt.preventDefault();
        }

        var view = this.findView(evt.target);
        if (this.guard(evt, view)) return;

        var localPoint = this.snapToGrid({ x: evt.clientX, y: evt.clientY });

        if (view) {

            view.contextmenu(evt, localPoint.x, localPoint.y);

        } else {

            this.trigger('blank:contextmenu', evt, localPoint.x, localPoint.y);
        }
    },

    pointerdown: function(evt) {

        this.bindDocumentEvents();

        evt = joint.util.normalizeEvent(evt);

        var view = this.findView(evt.target);
        if (this.guard(evt, view)) return;

        this._mousemoved = 0;

        var localPoint = this.snapToGrid({ x: evt.clientX, y: evt.clientY });

        if (view) {

            evt.preventDefault();

            this.sourceView = view;

            view.pointerdown(evt, localPoint.x, localPoint.y);

        } else {

            if (this.options.preventDefaultBlankAction) {
                evt.preventDefault();
            }

            this.trigger('blank:pointerdown', evt, localPoint.x, localPoint.y);
        }
    },

    pointermove: function(evt) {

        var view = this.sourceView;
        if (view) {

            evt.preventDefault();

            // Mouse moved counter.
            var mousemoved = ++this._mousemoved;
            if (mousemoved > this.options.moveThreshold) {

                evt = joint.util.normalizeEvent(evt);

                var localPoint = this.snapToGrid({ x: evt.clientX, y: evt.clientY });
                view.pointermove(evt, localPoint.x, localPoint.y);
            }
        }
    },

    pointerup: function(evt) {

        this.unbindDocumentEvents();

        evt = joint.util.normalizeEvent(evt);

        var localPoint = this.snapToGrid({ x: evt.clientX, y: evt.clientY });

        if (this.sourceView) {

            this.sourceView.pointerup(evt, localPoint.x, localPoint.y);

            //"delete sourceView" occasionally throws an error in chrome (illegal access exception)
            this.sourceView = null;

        } else {

            this.trigger('blank:pointerup', evt, localPoint.x, localPoint.y);
        }
    },

    mousewheel: function(evt) {

        evt = joint.util.normalizeEvent(evt);
        var view = this.findView(evt.target);
        if (this.guard(evt, view)) return;

        var originalEvent = evt.originalEvent;
        var localPoint = this.snapToGrid({ x: originalEvent.clientX, y: originalEvent.clientY });
        var delta = Math.max(-1, Math.min(1, (originalEvent.wheelDelta || -originalEvent.detail)));

        if (view) {

            view.mousewheel(evt, localPoint.x, localPoint.y, delta);

        } else {

            this.trigger('blank:mousewheel', evt, localPoint.x, localPoint.y, delta);
        }
    },

    cellMouseover: function(evt) {

        evt = joint.util.normalizeEvent(evt);
        var view = this.findView(evt.target);
        if (view) {
            if (this.guard(evt, view)) return;
            view.mouseover(evt);
        }
    },

    cellMouseout: function(evt) {

        evt = joint.util.normalizeEvent(evt);
        var view = this.findView(evt.target);
        if (view) {
            if (this.guard(evt, view)) return;
            view.mouseout(evt);
        }
    },

    cellMouseenter: function(evt) {

        evt = joint.util.normalizeEvent(evt);
        var view = this.findView(evt.target);
        if (view && !this.guard(evt, view)) {
            view.mouseenter(evt);
        }
    },

    cellMouseleave: function(evt) {

        evt = joint.util.normalizeEvent(evt);
        var view = this.findView(evt.target);
        if (view && !this.guard(evt, view)) {
            view.mouseleave(evt);
        }
    },

    setGridSize: function(gridSize) {

        this.options.gridSize = gridSize;

        if (this.options.drawGrid) {
            this.drawGrid();
        }

        return this;
    },

    clearGrid: function() {

        if (this.$grid) {
            this.$grid.css('backgroundImage', 'none');
        }
        return this;
    },

    _getGriRefs: function () {

        if (!this._gridCache) {

            this._gridCache = {
                root: V('svg', { width: '100%', height: '100%' }, V('defs')),
                patterns: {},
                add: function (id, vel) {
                    V(this.root.node.childNodes[0]).append(vel);
                    this.patterns[id] = vel;
                    this.root.append(V('rect', { width: "100%", height: "100%", fill: 'url(#' + id + ')' }));
                },
                get: function (id) {
                    return  this.patterns[id]
                },
                exist: function (id) {
                    return this.patterns[id] !== undefined;
                }
            }
        }

        return this._gridCache;
    },

    setGrid:function (drawGrid) {

        this.clearGrid();

        this._gridCache = null;
        this._gridSettings = [];

        var optionsList = Array.isArray(drawGrid) ? drawGrid : [drawGrid || {}];
        optionsList.forEach(function (item) {
            this._gridSettings.push.apply(this._gridSettings, this._resolveDrawGridOption(item));
        }, this);
        return this;
    },

    _resolveDrawGridOption: function (opt) {

        var namespace = this.constructor.gridPatterns;
        if (joint.util.isString(opt) && Array.isArray(namespace[opt])) {
            return namespace[opt].map(function(item) {
                return joint.util.assign({}, item);
            });
        }

        var options = opt || { args: [{}] };
        var isArray = Array.isArray(options);
        var name = options.name;

        if (!isArray && !name && !options.markup ) {
            name = 'dot';
        }

        if (name && Array.isArray(namespace[name])) {
            var pattern = namespace[name].map(function(item) {
                return joint.util.assign({}, item);
            });

            var args = Array.isArray(options.args) ? options.args : [options.args || {}];

            joint.util.defaults(args[0], joint.util.omit(opt, 'args'));
            for (var i = 0; i < args.length; i++) {
                if (pattern[i]) {
                    joint.util.assign(pattern[i], args[i]);
                }
            }
            return pattern;
        }

        return isArray ? options : [options];
    },

    drawGrid: function(opt) {

        var gridSize = this.options.gridSize;
        if (gridSize <= 1) {
            return this.clearGrid();
        }

        var localOptions = Array.isArray(opt) ? opt : [opt];

        var ctm = this.matrix();
        var refs = this._getGriRefs();

        this._gridSettings.forEach(function (gridLayerSetting, index) {

            var id = 'pattern_'  + index;
            var options = joint.util.merge(gridLayerSetting, localOptions[index], {
                sx: ctm.a || 1,
                sy: ctm.d || 1,
                ox: ctm.e || 0,
                oy: ctm.f || 0
            });

            options.width = gridSize * (ctm.a || 1) * (options.scaleFactor || 1);
            options.height = gridSize * (ctm.d || 1) * (options.scaleFactor || 1);

            if (!refs.exist(id)) {
                refs.add(id, V('pattern', { id: id, patternUnits: 'userSpaceOnUse' }, V(options.markup)))
            }

            var patternDefVel = refs.get(id);

            if (joint.util.isFunction(options.update)) {
                options.update(patternDefVel.node.childNodes[0], options);
            }

            var x = options.ox % options.width;
            if (x < 0) x += options.width;

            var y = options.oy % options.height;
            if (y < 0) y += options.height;

            patternDefVel.attr({
                x: x,
                y: y,
                width: options.width,
                height: options.height
            });
        });

        var patternUri = new XMLSerializer().serializeToString(refs.root.node);
        patternUri = 'url(data:image/svg+xml;base64,' + btoa(patternUri) + ')';

        this.$grid.css('backgroundImage', patternUri);

        return this;
    },

    updateBackgroundImage: function(opt) {

        opt = opt || {};

        var backgroundPosition = opt.position || 'center';
        var backgroundSize = opt.size || 'auto auto';

        var currentScale = this.scale();
        var currentTranslate = this.translate();

        // backgroundPosition
        if (joint.util.isObject(backgroundPosition)) {
            var x = currentTranslate.tx + (currentScale.sx * (backgroundPosition.x || 0));
            var y = currentTranslate.ty + (currentScale.sy * (backgroundPosition.y || 0));
            backgroundPosition = x + 'px ' + y + 'px';
        }

        // backgroundSize
        if (joint.util.isObject(backgroundSize)) {
            backgroundSize = g.rect(backgroundSize).scale(currentScale.sx, currentScale.sy);
            backgroundSize = backgroundSize.width + 'px ' + backgroundSize.height + 'px';
        }

        this.$background.css({
            backgroundSize: backgroundSize,
            backgroundPosition: backgroundPosition
        });
    },

    drawBackgroundImage: function(img, opt) {

        // Clear the background image if no image provided
        if (!(img instanceof HTMLImageElement)) {
            this.$background.css('backgroundImage', '');
            return;
        }

        opt = opt || {};

        var backgroundImage;
        var backgroundSize = opt.size;
        var backgroundRepeat = opt.repeat || 'no-repeat';
        var backgroundOpacity = opt.opacity || 1;
        var backgroundQuality = Math.abs(opt.quality) || 1;
        var backgroundPattern = this.constructor.backgroundPatterns[joint.util.camelCase(backgroundRepeat)];

        if (joint.util.isFunction(backgroundPattern)) {
            // 'flip-x', 'flip-y', 'flip-xy', 'watermark' and custom
            img.width *= backgroundQuality;
            img.height *= backgroundQuality;
            var canvas = backgroundPattern(img, opt);
            if (!(canvas instanceof HTMLCanvasElement)) {
                throw new Error('dia.Paper: background pattern must return an HTML Canvas instance');
            }

            backgroundImage = canvas.toDataURL('image/png');
            backgroundRepeat = 'repeat';
            if (joint.util.isObject(backgroundSize)) {
                // recalculate the tile size if an object passed in
                backgroundSize.width *= canvas.width / img.width;
                backgroundSize.height *= canvas.height / img.height;
            } else if (backgroundSize === undefined) {
                // calcule the tile size if no provided
                opt.size = {
                    width: canvas.width / backgroundQuality,
                    height: canvas.height / backgroundQuality
                };
            }
        } else {
            // backgroundRepeat:
            // no-repeat', 'round', 'space', 'repeat', 'repeat-x', 'repeat-y'
            backgroundImage = img.src;
            if (backgroundSize === undefined) {
                // pass the image size for  the backgroundSize if no size provided
                opt.size = {
                    width: img.width,
                    height: img.height
                };
            }
        }

        this.$background.css({
            opacity: backgroundOpacity,
            backgroundRepeat: backgroundRepeat,
            backgroundImage: 'url(' + backgroundImage + ')'
        });

        this.updateBackgroundImage(opt);
    },

    updateBackgroundColor: function(color) {

        this.$el.css('backgroundColor', color || '');
    },

    drawBackground: function(opt) {

        opt = opt || {};

        this.updateBackgroundColor(opt.color);

        if (opt.image) {
            opt = this._background = joint.util.cloneDeep(opt);
            var img = document.createElement('img');
            img.onload = this.drawBackgroundImage.bind(this, img, opt);
            img.src = opt.image;
        } else {
            this.drawBackgroundImage(null);
            this._background = null;
        }

        return this;
    },

    setInteractivity: function(value) {

        this.options.interactive = value;

        joint.util.invoke(this._views, 'setInteractivity', value);
    },

    // Paper Defs

    isDefined: function(defId) {
        return !!this.svg.getElementById(defId);
    },

    defineFilter: function(filter) {

        if (!joint.util.isObject(filter)) {
            throw new TypeError('dia.Paper: defineFilter() requires 1. argument to be an object.');
        }

        var filterId = filter.id;
        var name = filter.name;
        // Generate a hash code from the stringified filter definition. This gives us
        // a unique filter ID for different definitions.
        if (!filterId) {
            filterId = name + this.svg.id + joint.util.hashCode(JSON.stringify(filter));
        }
        // If the filter already exists in the document,
        // we're done and we can just use it (reference it using `url()`).
        // If not, create one.
        if (!this.isDefined(filterId)) {

            var namespace = joint.util.filter;
            var filterSVGString = namespace[name] && namespace[name](filter.args || {});
            if (!filterSVGString) {
                throw new Error('Non-existing filter ' + name);
            }

            // Set the filter area to be 3x the bounding box of the cell
            // and center the filter around the cell.
            var filterAttrs = joint.util.assign({
                filterUnits: 'objectBoundingBox',
                x: -1,
                y: -1,
                width: 3,
                height: 3
            }, filter.attrs, {
                id: filterId
            });

            V(filterSVGString, filterAttrs).appendTo(this.defs);
        }

        return filterId;
    },

    defineGradient: function(gradient) {

        if (!joint.util.isObject(gradient)) {
            throw new TypeError('dia.Paper: defineGradient() requires 1. argument to be an object.');
        }

        var gradientId = gradient.id;
        var type = gradient.type;
        var stops = gradient.stops;
        // Generate a hash code from the stringified filter definition. This gives us
        // a unique filter ID for different definitions.
        if (!gradientId) {
            gradientId = type + this.svg.id + joint.util.hashCode(JSON.stringify(gradient));
        }
        // If the gradient already exists in the document,
        // we're done and we can just use it (reference it using `url()`).
        // If not, create one.
        if (!this.isDefined(gradientId)) {

            var stopTemplate = joint.util.template('<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>');
            var gradientStopsStrings = joint.util.toArray(stops).map(function(stop) {
                return stopTemplate({
                    offset: stop.offset,
                    color: stop.color,
                    opacity: Number.isFinite(stop.opacity) ? stop.opacity : 1
                });
            });

            var gradientSVGString = [
                '<' + type + '>',
                gradientStopsStrings.join(''),
                '</' + type + '>'
            ].join('');

            var gradientAttrs = joint.util.assign({ id: gradientId }, gradient.attrs);

            V(gradientSVGString, gradientAttrs).appendTo(this.defs);
        }

        return gradientId;
    },

    defineMarker: function(marker) {

        if (!joint.util.isObject(marker)) {
            throw new TypeError('dia.Paper: defineMarker() requires 1. argument to be an object.');
        }

        var markerId = marker.id;

        // Generate a hash code from the stringified filter definition. This gives us
        // a unique filter ID for different definitions.
        if (!markerId) {
            markerId = this.svg.id + joint.util.hashCode(JSON.stringify(marker));
        }

        if (!this.isDefined(markerId)) {

            var attrs = joint.util.omit(marker, 'type', 'userSpaceOnUse');
            var pathMarker = V('marker', {
                id: markerId,
                orient: 'auto',
                overflow: 'visible',
                markerUnits: marker.markerUnits || 'userSpaceOnUse'
            }, [
                V(marker.type || 'path', attrs)
            ]);

            pathMarker.appendTo(this.defs);
        }

        return markerId;
    }

}, {

    backgroundPatterns: {

        flipXy: function(img) {
            // d b
            // q p

            var canvas = document.createElement('canvas');
            var imgWidth = img.width;
            var imgHeight = img.height;

            canvas.width = 2 * imgWidth;
            canvas.height = 2 * imgHeight;

            var ctx = canvas.getContext('2d');
            // top-left image
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
            // xy-flipped bottom-right image
            ctx.setTransform(-1, 0, 0, -1, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
            // x-flipped top-right image
            ctx.setTransform(-1, 0, 0, 1, canvas.width, 0);
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
            // y-flipped bottom-left image
            ctx.setTransform(1, 0, 0, -1, 0, canvas.height);
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

            return canvas;
        },

        flipX: function(img) {
            // d b
            // d b

            var canvas = document.createElement('canvas');
            var imgWidth = img.width;
            var imgHeight = img.height;

            canvas.width = imgWidth * 2;
            canvas.height = imgHeight;

            var ctx = canvas.getContext('2d');
            // left image
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
            // flipped right image
            ctx.translate(2 * imgWidth, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

            return canvas;
        },

        flipY: function(img) {
            // d d
            // q q

            var canvas = document.createElement('canvas');
            var imgWidth = img.width;
            var imgHeight = img.height;

            canvas.width = imgWidth;
            canvas.height = imgHeight * 2;

            var ctx = canvas.getContext('2d');
            // top image
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
            // flipped bottom image
            ctx.translate(0, 2 * imgHeight);
            ctx.scale(1, -1);
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

            return canvas;
        },

        watermark: function(img, opt) {
            //   d
            // d

            opt = opt || {};

            var imgWidth = img.width;
            var imgHeight = img.height;

            var canvas = document.createElement('canvas');
            canvas.width = imgWidth * 3;
            canvas.height = imgHeight * 3;

            var ctx = canvas.getContext('2d');
            var angle = joint.util.isNumber(opt.watermarkAngle) ? -opt.watermarkAngle : -20;
            var radians = g.toRad(angle);
            var stepX = canvas.width / 4;
            var stepY = canvas.height / 4;

            for (var i = 0; i < 4; i ++) {
                for (var j = 0; j < 4; j++) {
                    if ((i + j) % 2 > 0) {
                        // reset the current transformations
                        ctx.setTransform(1, 0, 0, 1, (2 * i - 1) * stepX, (2 * j - 1)  * stepY);
                        ctx.rotate(radians);
                        ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
                    }
                }
            }

            return canvas;
        }
    },

    gridPatterns: {
        dot: [{
            color: '#AAAAAA',
            thickness: 1,
            markup: 'rect',
            update: function(el, opt) {
                V(el).attr({
                    width: opt.thickness * opt.sx,
                    height: opt.thickness * opt.sy,
                    fill: opt.color
                });
            }
        }],
        fixedDot: [{
            color: '#AAAAAA',
            thickness: 1,
            markup: 'rect',
            update: function(el, opt) {
                var size = opt.sx <= 1 ? opt.thickness * opt.sx : opt.thickness;
                V(el).attr({ width: size, height: size, fill: opt.color });
            }
        }],
        mesh: [{
            color: '#AAAAAA',
            thickness: 1,
            markup: 'path',
            update: function(el, opt) {

                var d;
                var width = opt.width;
                var height = opt.height;
                var thickness = opt.thickness;

                if (width - thickness >= 0 && height - thickness >= 0) {
                    d = ['M', width, 0, 'H0 M0 0 V0', height].join(' ');
                } else {
                    d = 'M 0 0 0 0';
                }

                V(el).attr({ 'd': d, stroke: opt.color, 'stroke-width': opt.thickness });
            }
        }],
        doubleMesh: [{
            color: '#AAAAAA',
            thickness: 1,
            markup: 'path',
            update: function(el, opt) {

                var d;
                var width = opt.width;
                var height = opt.height;
                var thickness = opt.thickness;

                if (width - thickness >= 0 && height - thickness >= 0) {
                    d = ['M', width, 0, 'H0 M0 0 V0', height].join(' ');
                } else {
                    d = 'M 0 0 0 0';
                }

                V(el).attr({ 'd': d, stroke: opt.color, 'stroke-width': opt.thickness });
            }
        }, {
            color: '#000000',
            thickness: 3,
            scaleFactor: 4,
            markup: 'path',
            update: function(el, opt) {

                var d;
                var width = opt.width;
                var height = opt.height;
                var thickness = opt.thickness;

                if (width - thickness >= 0 && height - thickness >= 0) {
                    d = ['M', width, 0, 'H0 M0 0 V0', height].join(' ');
                } else {
                    d = 'M 0 0 0 0';
                }

                V(el).attr({ 'd': d, stroke: opt.color, 'stroke-width': opt.thickness });
            }
        }]
    }
});

(function(joint, _, util) {

    var PortData = function(data) {

        var clonedData = util.cloneDeep(data) || {};
        this.ports = [];
        this.groups = {};
        this.portLayoutNamespace = joint.layout.Port;
        this.portLabelLayoutNamespace = joint.layout.PortLabel;

        this._init(clonedData);
    };

    PortData.prototype = {

        getPorts: function() {
            return this.ports;
        },

        getGroup: function(name) {
            return this.groups[name] || {};
        },

        getPortsByGroup: function(groupName) {

            return this.ports.filter(function(port) {
                return port.group === groupName;
            });
        },

        getGroupPortsMetrics: function(groupName, elBBox) {

            var group = this.getGroup(groupName);
            var ports = this.getPortsByGroup(groupName);

            var groupPosition = group.position || {};
            var groupPositionName = groupPosition.name;
            var namespace = this.portLayoutNamespace;
            if (!namespace[groupPositionName]) {
                groupPositionName = 'left';
            }

            var groupArgs = groupPosition.args || {};
            var portsArgs = ports.map(function(port) {
                return port && port.position && port.position.args;
            });
            var groupPortTransformations = namespace[groupPositionName](portsArgs, elBBox, groupArgs);

            var accumulator = {
                ports: ports,
                result: []
            };

            util.toArray(groupPortTransformations).reduce(function(res, portTransformation, index) {
                var port = res.ports[index];
                res.result.push({
                    portId: port.id,
                    portTransformation: portTransformation,
                    labelTransformation: this._getPortLabelLayout(port, g.Point(portTransformation), elBBox),
                    portAttrs: port.attrs,
                    portSize: port.size,
                    labelSize: port.label.size
                });
                return res;
            }.bind(this), accumulator);

            return accumulator.result;
        },

        _getPortLabelLayout: function(port, portPosition, elBBox) {

            var namespace = this.portLabelLayoutNamespace;
            var labelPosition = port.label.position.name || 'left';

            if (namespace[labelPosition]) {
                return namespace[labelPosition](portPosition, elBBox, port.label.position.args);
            }

            return null;
        },

        _init: function(data) {

            // prepare groups
            if (util.isObject(data.groups)) {
                var groups = Object.keys(data.groups);
                for (var i = 0, n = groups.length; i < n; i++) {
                    var key = groups[i];
                    this.groups[key] = this._evaluateGroup(data.groups[key]);
                }
            }

            // prepare ports
            var ports = util.toArray(data.items);
            for (var j = 0, m = ports.length; j < m; j++) {
                this.ports.push(this._evaluatePort(ports[j]));
            }
        },

        _evaluateGroup: function(group) {

            return util.merge(group, {
                position: this._getPosition(group.position, true),
                label: this._getLabel(group, true)
            });
        },

        _evaluatePort: function(port) {

            var evaluated = util.assign({}, port);

            var group = this.getGroup(port.group);

            evaluated.markup = evaluated.markup || group.markup;
            evaluated.attrs = util.merge({}, group.attrs, evaluated.attrs);
            evaluated.position = this._createPositionNode(group, evaluated);
            evaluated.label = util.merge({}, group.label, this._getLabel(evaluated));
            evaluated.z = this._getZIndex(group, evaluated);
            evaluated.size = util.assign({}, group.size, evaluated.size);

            return evaluated;
        },

        _getZIndex: function(group, port) {

            if (util.isNumber(port.z)) {
                return port.z;
            }
            if (util.isNumber(group.z) || group.z === 'auto') {
                return group.z;
            }
            return 'auto';
        },

        _createPositionNode: function(group, port) {

            return util.merge({
                name: 'left',
                args: {}
            }, group.position, { args: port.args });
        },

        _getPosition: function(position, setDefault) {

            var args = {};
            var positionName;

            if (util.isFunction(position)) {
                positionName = 'fn';
                args.fn = position;
            } else if (util.isString(position)) {
                positionName = position;
            } else if (position === undefined) {
                positionName = setDefault ? 'left' : null;
            } else if (Array.isArray(position)) {
                positionName = 'absolute';
                args.x = position[0];
                args.y = position[1];
            } else if (util.isObject(position)) {
                positionName = position.name;
                util.assign(args, position.args);
            }

            var result = { args: args };

            if (positionName) {
                result.name = positionName;
            }
            return result;
        },

        _getLabel: function(item, setDefaults) {

            var label = item.label || {};

            var ret = label;
            ret.position = this._getPosition(label.position, setDefaults);

            return ret;
        }
    };

    util.assign(joint.dia.Element.prototype, {

        _initializePorts: function() {

            this._createPortData();
            this.on('change:ports', function() {

                this._processRemovedPort();
                this._createPortData();
            }, this);
        },

        /**
         * remove links tied wiht just removed element
         * @private
         */
        _processRemovedPort: function() {

            var current = this.get('ports') || {};
            var currentItemsMap = {};

            util.toArray(current.items).forEach(function(item) {
                currentItemsMap[item.id] = true;
            });

            var previous = this.previous('ports') || {};
            var removed = {};

            util.toArray(previous.items).forEach(function(item) {
                if (!currentItemsMap[item.id]) {
                    removed[item.id] = true;
                }
            });

            var graph = this.graph;
            if (graph && !util.isEmpty(removed)) {

                var inboundLinks = graph.getConnectedLinks(this, { inbound: true });
                inboundLinks.forEach(function(link) {

                    if (removed[link.get('target').port]) link.remove();
                });

                var outboundLinks = graph.getConnectedLinks(this, { outbound: true });
                outboundLinks.forEach(function(link) {

                    if (removed[link.get('source').port]) link.remove();
                });
            }
        },

        /**
         * @returns {boolean}
         */
        hasPorts: function() {

            return this.prop('ports/items').length > 0;
        },

        /**
         * @param {string} id
         * @returns {boolean}
         */
        hasPort: function(id) {

            return this.getPortIndex(id) !== -1;
        },

        /**
         * @returns {Array<object>}
         */
        getPorts: function() {

            return util.cloneDeep(this.prop('ports/items')) || [];
        },

        /**
         * @param {string} id
         * @returns {object}
         */
        getPort: function(id) {

            return util.cloneDeep(util.toArray(this.prop('ports/items')).find( function(port) {
                return port.id && port.id === id;
            }));
        },

        /**
         * @param {string} groupName
         * @returns {Object<portId, {x: number, y: number, angle: number}>}
         */
        getPortsPositions: function(groupName) {

            var portsMetrics = this._portSettingsData.getGroupPortsMetrics(groupName, g.Rect(this.size()));

            return portsMetrics.reduce(function(positions, metrics) {
                var transformation = metrics.portTransformation;
                positions[metrics.portId] = {
                    x: transformation.x,
                    y: transformation.y,
                    angle: transformation.angle
                };
                return positions;
            }, {});
        },

        /**
         * @param {string|Port} port port id or port
         * @returns {number} port index
         */
        getPortIndex: function(port) {

            var id = util.isObject(port) ? port.id : port;

            if (!this._isValidPortId(id)) {
                return -1;
            }

            return util.toArray(this.prop('ports/items')).findIndex(function(item) {
                return item.id === id;
            });
        },

        /**
         * @param {object} port
         * @param {object} [opt]
         * @returns {joint.dia.Element}
         */
        addPort: function(port, opt) {

            if (!util.isObject(port) || Array.isArray(port)) {
                throw new Error('Element: addPort requires an object.');
            }

            var ports = util.assign([], this.prop('ports/items'));
            ports.push(port);
            this.prop('ports/items', ports, opt);

            return this;
        },

        /**
         * @param {string} portId
         * @param {string|object=} path
         * @param {*=} value
         * @param {object=} opt
         * @returns {joint.dia.Element}
         */
        portProp: function(portId, path, value, opt) {

            var index = this.getPortIndex(portId);

            if (index === -1) {
                throw new Error('Element: unable to find port with id ' + portId);
            }

            var args = Array.prototype.slice.call(arguments, 1);
            if (Array.isArray(path)) {
                args[0] = ['ports', 'items', index].concat(path);
            } else if (util.isString(path)) {

                // Get/set an attribute by a special path syntax that delimits
                // nested objects by the colon character.
                args[0] = ['ports/items/', index, '/', path].join('');

            } else {

                args = ['ports/items/' + index];
                if (util.isPlainObject(path)) {
                    args.push(path);
                    args.push(value);
                }
            }

            return this.prop.apply(this, args);
        },

        _validatePorts: function() {

            var portsAttr = this.get('ports') || {};

            var errorMessages = [];
            portsAttr = portsAttr || {};
            var ports = util.toArray(portsAttr.items);

            ports.forEach(function(p) {

                if (typeof p !== 'object') {
                    errorMessages.push('Element: invalid port ', p);
                }

                if (!this._isValidPortId(p.id)) {
                    p.id = util.uuid();
                }
            }, this);

            if (joint.util.uniq(ports, 'id').length !== ports.length) {
                errorMessages.push('Element: found id duplicities in ports.');
            }

            return errorMessages;
        },

        /**
         * @param {string} id port id
         * @returns {boolean}
         * @private
         */
        _isValidPortId: function(id) {

            return id !== null && id !== undefined && !util.isObject(id);
        },

        addPorts: function(ports, opt) {

            if (ports.length) {
                this.prop('ports/items', util.assign([], this.prop('ports/items')).concat(ports), opt);
            }

            return this;
        },

        removePort: function(port, opt) {

            var options = opt || {};
            var ports = util.assign([], this.prop('ports/items'));

            var index = this.getPortIndex(port);

            if (index !== -1) {
                ports.splice(index, 1);
                options.rewrite = true;
                this.prop('ports/items', ports, options);
            }

            return this;
        },

        /**
         * @private
         */
        _createPortData: function() {

            var err = this._validatePorts();

            if (err.length > 0) {
                this.set('ports', this.previous('ports'));
                throw new Error(err.join(' '));
            }

            var prevPortData;

            if (this._portSettingsData) {

                prevPortData = this._portSettingsData.getPorts();
            }

            this._portSettingsData = new PortData(this.get('ports'));

            var curPortData = this._portSettingsData.getPorts();

            if (prevPortData) {

                var added = curPortData.filter(function(item) {
                    if (!prevPortData.find(function(prevPort) { return prevPort.id === item.id;})) {
                        return item;
                    }
                });

                var removed = prevPortData.filter(function(item) {
                    if (!curPortData.find(function(curPort) { return curPort.id === item.id;})) {
                        return item;
                    }
                });

                if (removed.length > 0) {
                    this.trigger('ports:remove', this, removed);
                }

                if (added.length > 0) {
                    this.trigger('ports:add', this, added);
                }
            }
        }
    });

    util.assign(joint.dia.ElementView.prototype, {

        portContainerMarkup: '<g class="joint-port"/>',
        portMarkup: '<circle class="joint-port-body" r="10" fill="#FFFFFF" stroke="#000000"/>',
        portLabelMarkup: '<text class="joint-port-label" fill="#000000"/>',
        /** @type {Object<string, {portElement: Vectorizer, portLabelElement: Vectorizer}>} */
        _portElementsCache: null,

        /**
         * @private
         */
        _initializePorts: function() {

            this._portElementsCache = {};

            this.listenTo(this.model, 'change:ports', function() {

                this._refreshPorts();
            });
        },

        /**
         * @typedef {Object} Port
         *
         * @property {string} id
         * @property {Object} position
         * @property {Object} label
         * @property {Object} attrs
         * @property {string} markup
         * @property {string} group
         */

        /**
         * @private
         */
        _refreshPorts: function() {

            this._removePorts();
            this._portElementsCache = {};

            this._renderPorts();
        },

        /**
         * @private
         */
        _renderPorts: function() {

            // references to rendered elements without z-index
            var elementReferences = [];
            var elem = this._getContainerElement();

            for (var i = 0, count = elem.node.childNodes.length; i < count; i++) {
                elementReferences.push(elem.node.childNodes[i]);
            }

            var portsGropsByZ = util.groupBy(this.model._portSettingsData.getPorts(), 'z');
            var withoutZKey = 'auto';

            // render non-z first
            util.toArray(portsGropsByZ[withoutZKey]).forEach(function(port) {
                var portElement = this._getPortElement(port);
                elem.append(portElement);
                elementReferences.push(portElement);
            }, this);

            var groupNames = Object.keys(portsGropsByZ);
            for (var k = 0; k < groupNames.length; k++) {
                var groupName = groupNames[k];
                if (groupName !== withoutZKey) {
                    var z = parseInt(groupName, 10);
                    this._appendPorts(portsGropsByZ[groupName], z, elementReferences);
                }
            }

            this._updatePorts();
        },

        /**
         * @returns {V}
         * @private
         */
        _getContainerElement: function() {

            return this.rotatableNode || this.vel;
        },

        /**
         * @param {Array<Port>}ports
         * @param {number} z
         * @param refs
         * @private
         */
        _appendPorts: function(ports, z, refs) {

            var containerElement = this._getContainerElement();
            var portElements = util.toArray(ports).map(this._getPortElement, this);

            if (refs[z] || z < 0) {
                V(refs[Math.max(z, 0)]).before(portElements);
            } else {
                containerElement.append(portElements);
            }
        },

        /**
         * Try to get element from cache,
         * @param port
         * @returns {*}
         * @private
         */
        _getPortElement: function(port) {

            if (this._portElementsCache[port.id]) {
                return this._portElementsCache[port.id].portElement;
            }
            return this._createPortElement(port);
        },

        /**
         * @private
         */
        _updatePorts: function() {

            // layout ports without group
            this._updatePortGroup(undefined);
            // layout ports with explicit group
            var groupsNames = Object.keys(this.model._portSettingsData.groups);
            groupsNames.forEach(this._updatePortGroup, this);
        },

        /**
         * @private
         */
        _removePorts: function() {
            util.invoke(this._portElementsCache, 'portElement.remove');
        },

        /**
         * @param {Port} port
         * @returns {V}
         * @private
         */
        _createPortElement: function(port) {

            var portContentElement = V(this._getPortMarkup(port));
            var portLabelContentElement = V(this._getPortLabelMarkup(port.label));

            if (portContentElement && portContentElement.length > 1) {
                throw new Error('ElementView: Invalid port markup - multiple roots.');
            }

            portContentElement.attr({
                'port': port.id,
                'port-group': port.group
            });

            var portElement = V(this.portContainerMarkup)
                .append(portContentElement)
                .append(portLabelContentElement);

            this._portElementsCache[port.id] = {
                portElement: portElement,
                portLabelElement: portLabelContentElement
            };

            return portElement;
        },

        /**
         * @param {string=} groupName
         * @private
         */
        _updatePortGroup: function(groupName) {

            var elementBBox = g.Rect(this.model.size());
            var portsMetrics = this.model._portSettingsData.getGroupPortsMetrics(groupName, elementBBox);

            for (var i = 0, n = portsMetrics.length; i < n; i++) {
                var metrics = portsMetrics[i];
                var portId = metrics.portId;
                var cached = this._portElementsCache[portId] || {};
                var portTransformation = metrics.portTransformation;
                this.applyPortTransform(cached.portElement, portTransformation);
                this.updateDOMSubtreeAttributes(cached.portElement.node, metrics.portAttrs, {
                    rootBBox: g.Rect(metrics.portSize)
                });

                var labelTransformation = metrics.labelTransformation;
                if (labelTransformation) {
                    this.applyPortTransform(cached.portLabelElement, labelTransformation, (-portTransformation.angle || 0));
                    this.updateDOMSubtreeAttributes(cached.portLabelElement.node, labelTransformation.attrs, {
                        rootBBox: g.Rect(metrics.labelSize)
                    });
                }
            }
        },

        /**
         * @param {Vectorizer} element
         * @param {{dx:number, dy:number, angle: number, attrs: Object, x:number: y:number}} transformData
         * @param {number=} initialAngle
         * @constructor
         */
        applyPortTransform: function(element, transformData, initialAngle) {

            var matrix = V.createSVGMatrix()
                .rotate(initialAngle || 0)
                .translate(transformData.x || 0, transformData.y || 0)
                .rotate(transformData.angle || 0);

            element.transform(matrix, { absolute: true });
        },

        /**
         * @param {Port} port
         * @returns {string}
         * @private
         */
        _getPortMarkup: function(port) {

            return port.markup || this.model.get('portMarkup') || this.model.portMarkup || this.portMarkup;
        },

        /**
         * @param {Object} label
         * @returns {string}
         * @private
         */
        _getPortLabelMarkup: function(label) {

            return label.markup || this.model.get('portLabelMarkup') || this.model.portLabelMarkup || this.portLabelMarkup;
        }

    });
}(joint, _, joint.util));

joint.dia.Element.define('basic.Generic', {
    attrs: {
        '.': { fill: '#ffffff', stroke: 'none' }
    }
});

joint.shapes.basic.Generic.define('basic.Rect', {
    attrs: {
        'rect': {
            fill: '#ffffff',
            stroke: '#000000',
            width: 100,
            height: 60
        },
        'text': {
            fill: '#000000',
            text: '',
            'font-size': 14,
            'ref-x': .5,
            'ref-y': .5,
            'text-anchor': 'middle',
            'y-alignment': 'middle',
            'font-family': 'Arial, helvetica, sans-serif'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><rect/></g><text/></g>'
});

joint.shapes.basic.TextView = joint.dia.ElementView.extend({

    initialize: function() {
        joint.dia.ElementView.prototype.initialize.apply(this, arguments);
        // The element view is not automatically rescaled to fit the model size
        // when the attribute 'attrs' is changed.
        this.listenTo(this.model, 'change:attrs', this.resize);
    }
});

joint.shapes.basic.Generic.define('basic.Text', {
    attrs: {
        'text': {
            'font-size': 18,
            fill: '#000000'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><text/></g></g>',
});

joint.shapes.basic.Generic.define('basic.Circle', {
    size: { width: 60, height: 60 },
    attrs: {
        'circle': {
            fill: '#ffffff',
            stroke: '#000000',
            r: 30,
            cx: 30,
            cy: 30
        },
        'text': {
            'font-size': 14,
            text: '',
            'text-anchor': 'middle',
            'ref-x': .5,
            'ref-y': .5,
            'y-alignment': 'middle',
            fill: '#000000',
            'font-family': 'Arial, helvetica, sans-serif'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><circle/></g><text/></g>',
});

joint.shapes.basic.Generic.define('basic.Ellipse', {
    size: { width: 60, height: 40 },
    attrs: {
        'ellipse': {
            fill: '#ffffff',
            stroke: '#000000',
            rx: 30,
            ry: 20,
            cx: 30,
            cy: 20
        },
        'text': {
            'font-size': 14,
            text: '',
            'text-anchor': 'middle',
            'ref-x': .5,
            'ref-y': .5,
            'y-alignment': 'middle',
            fill: '#000000',
            'font-family': 'Arial, helvetica, sans-serif'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><ellipse/></g><text/></g>',
});

joint.shapes.basic.Generic.define('basic.Polygon', {
    size: { width: 60, height: 40 },
    attrs: {
        'polygon': {
            fill: '#ffffff',
            stroke: '#000000'
        },
        'text': {
            'font-size': 14,
            text: '',
            'text-anchor': 'middle',
            'ref-x': .5,
            'ref-dy': 20,
            'y-alignment': 'middle',
            fill: '#000000',
            'font-family': 'Arial, helvetica, sans-serif'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><polygon/></g><text/></g>',
});

joint.shapes.basic.Generic.define('basic.Polyline', {
    size: { width: 60, height: 40 },
    attrs: {
        'polyline': {
            fill: '#ffffff',
            stroke: '#000000'
        },
        'text': {
            'font-size': 14,
            text: '',
            'text-anchor': 'middle',
            'ref-x': .5,
            'ref-dy': 20,
            'y-alignment': 'middle',
            fill: '#000000',
            'font-family': 'Arial, helvetica, sans-serif'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><polyline/></g><text/></g>',
});

joint.shapes.basic.Generic.define('basic.Image', {
    attrs: {
        'text': {
            'font-size': 14,
            text: '',
            'text-anchor': 'middle',
            'ref-x': .5,
            'ref-dy': 20,
            'y-alignment': 'middle',
            fill: '#000000',
            'font-family': 'Arial, helvetica, sans-serif'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><image/></g><text/></g>',
});

joint.shapes.basic.Generic.define('basic.Path', {
    size: { width: 60, height: 60 },
    attrs: {
        'path': {
            fill: '#ffffff',
            stroke: '#000000'
        },
        'text': {
            'font-size': 14,
            text: '',
            'text-anchor': 'middle',
            'ref': 'path',
            'ref-x': .5,
            'ref-dy': 10,
            fill: '#000000',
            'font-family': 'Arial, helvetica, sans-serif'
        }
    }

}, {
    markup: '<g class="rotatable"><g class="scalable"><path/></g><text/></g>',
});

joint.shapes.basic.Path.define('basic.Rhombus', {
    attrs: {
        'path': {
            d: 'M 30 0 L 60 30 30 60 0 30 z'
        },
        'text': {
            'ref-y': .5,
            'ref-dy': null,
            'y-alignment': 'middle'
        }
    }
});


/**
 * @deprecated use the port api instead
 */
// PortsModelInterface is a common interface for shapes that have ports. This interface makes it easy
// to create new shapes with ports functionality. It is assumed that the new shapes have
// `inPorts` and `outPorts` array properties. Only these properties should be used to set ports.
// In other words, using this interface, it is no longer recommended to set ports directly through the
// `attrs` object.

// Usage:
// joint.shapes.custom.MyElementWithPorts = joint.shapes.basic.Path.extend(_.extend({}, joint.shapes.basic.PortsModelInterface, {
//     getPortAttrs: function(portName, index, total, selector, type) {
//         var attrs = {};
//         var portClass = 'port' + index;
//         var portSelector = selector + '>.' + portClass;
//         var portTextSelector = portSelector + '>text';
//         var portBodySelector = portSelector + '>.port-body';
//
//         attrs[portTextSelector] = { text: portName };
//         attrs[portBodySelector] = { port: { id: portName || _.uniqueId(type) , type: type } };
//         attrs[portSelector] = { ref: 'rect', 'ref-y': (index + 0.5) * (1 / total) };
//
//         if (selector === '.outPorts') { attrs[portSelector]['ref-dx'] = 0; }
//
//         return attrs;
//     }
//}));
joint.shapes.basic.PortsModelInterface = {

    initialize: function() {

        this.updatePortsAttrs();
        this.on('change:inPorts change:outPorts', this.updatePortsAttrs, this);

        // Call the `initialize()` of the parent.
        this.constructor.__super__.constructor.__super__.initialize.apply(this, arguments);
    },

    updatePortsAttrs: function(eventName) {

        if (this._portSelectors) {

            var newAttrs = joint.util.omit(this.get('attrs'), this._portSelectors);
            this.set('attrs', newAttrs, { silent: true });
        }

        // This holds keys to the `attrs` object for all the port specific attribute that
        // we set in this method. This is necessary in order to remove previously set
        // attributes for previous ports.
        this._portSelectors = [];

        var attrs = {};

        joint.util.toArray(this.get('inPorts')).forEach(function(portName, index, ports) {
            var portAttributes = this.getPortAttrs(portName, index, ports.length, '.inPorts', 'in');
            this._portSelectors = this._portSelectors.concat(Object.keys(portAttributes));
            joint.util.assign(attrs, portAttributes);
        }, this);

        joint.util.toArray(('outPorts')).forEach(function(portName, index, ports) {
            var portAttributes = this.getPortAttrs(portName, index, ports.length, '.outPorts', 'out');
            this._portSelectors = this._portSelectors.concat(Object.keys(portAttributes));
            joint.util.assign(attrs, portAttributes);
        }, this);

        // Silently set `attrs` on the cell so that noone knows the attrs have changed. This makes sure
        // that, for example, command manager does not register `change:attrs` command but only
        // the important `change:inPorts`/`change:outPorts` command.
        this.attr(attrs, { silent: true });
        // Manually call the `processPorts()` method that is normally called on `change:attrs` (that we just made silent).
        this.processPorts();
        // Let the outside world (mainly the `ModelView`) know that we're done configuring the `attrs` object.
        this.trigger('process:ports');
    },

    getPortSelector: function(name) {

        var selector = '.inPorts';
        var index = this.get('inPorts').indexOf(name);

        if (index < 0) {
            selector = '.outPorts';
            index = this.get('outPorts').indexOf(name);

            if (index < 0) throw new Error("getPortSelector(): Port doesn't exist.");
        }

        return selector + '>g:nth-child(' + (index + 1) + ')>.port-body';
    }
};

joint.shapes.basic.PortsViewInterface = {

    initialize: function() {

        // `Model` emits the `process:ports` whenever it's done configuring the `attrs` object for ports.
        this.listenTo(this.model, 'process:ports', this.update);

        joint.dia.ElementView.prototype.initialize.apply(this, arguments);
    },

    update: function() {

        // First render ports so that `attrs` can be applied to those newly created DOM elements
        // in `ElementView.prototype.update()`.
        this.renderPorts();
        joint.dia.ElementView.prototype.update.apply(this, arguments);
    },

    renderPorts: function() {

        var $inPorts = this.$('.inPorts').empty();
        var $outPorts = this.$('.outPorts').empty();

        var portTemplate = joint.util.template(this.model.portMarkup);

        var ports = this.model.ports || [];
        ports.filter(function(p) {
            return p.type === 'in';
        }).forEach(function(port, index) {

            $inPorts.append(V(portTemplate({ id: index, port: port })).node);
        });

        ports.filter(function(p) {
            return p.type === 'out';
        }).forEach(function(port, index) {

            $outPorts.append(V(portTemplate({ id: index, port: port })).node);
        });
    }
};

joint.shapes.basic.Generic.define('basic.TextBlock', {
    // see joint.css for more element styles
    attrs: {
        rect: {
            fill: '#ffffff',
            stroke: '#000000',
            width: 80,
            height: 100
        },
        text: {
            fill: '#000000',
            'font-size': 14,
            'font-family': 'Arial, helvetica, sans-serif'
        },
        '.content': {
            text: '',
            'ref-x': .5,
            'ref-y': .5,
            'y-alignment': 'middle',
            'x-alignment': 'middle'
        }
    },

    content: ''
}, {
    markup: [
        '<g class="rotatable">',
        '<g class="scalable"><rect/></g>',
        joint.env.test('svgforeignobject') ? '<foreignObject class="fobj"><body xmlns="http://www.w3.org/1999/xhtml"><div class="content"/></body></foreignObject>' : '<text class="content"/>',
        '</g>'
    ].join(''),

    initialize: function() {

        this.listenTo(this, 'change:size', this.updateSize);
        this.listenTo(this, 'change:content', this.updateContent);
        this.updateSize(this, this.get('size'));
        this.updateContent(this, this.get('content'));
        joint.shapes.basic.Generic.prototype.initialize.apply(this, arguments);
    },

    updateSize: function(cell, size) {

        // Selector `foreignObject' doesn't work accross all browsers, we'r using class selector instead.
        // We have to clone size as we don't want attributes.div.style to be same object as attributes.size.
        this.attr({
            '.fobj': joint.util.assign({}, size),
            div: {
                style: joint.util.assign({}, size)
            }
        });
    },

    updateContent: function(cell, content) {

        if (joint.env.test('svgforeignobject')) {

            // Content element is a <div> element.
            this.attr({
                '.content': {
                    html: content
                }
            });

        } else {

            // Content element is a <text> element.
            // SVG elements don't have innerHTML attribute.
            this.attr({
                '.content': {
                    text: content
                }
            });
        }
    },

    // Here for backwards compatibility:
    setForeignObjectSize: function() {

        this.updateSize.apply(this, arguments);
    },

    // Here for backwards compatibility:
    setDivContent: function() {

        this.updateContent.apply(this, arguments);
    }
});

// TextBlockView implements the fallback for IE when no foreignObject exists and
// the text needs to be manually broken.
joint.shapes.basic.TextBlockView = joint.dia.ElementView.extend({

    initialize: function() {

        joint.dia.ElementView.prototype.initialize.apply(this, arguments);

        // Keep this for backwards compatibility:
        this.noSVGForeignObjectElement = !joint.env.test('svgforeignobject');

        if (!joint.env.test('svgforeignobject')) {

            this.listenTo(this.model, 'change:content change:size', function(cell) {
                // avoiding pass of extra paramters
                this.updateContent(cell);
            });
        }
    },

    update: function(cell, renderingOnlyAttrs) {

        var model = this.model;

        if (!joint.env.test('svgforeignobject')) {

            // Update everything but the content first.
            var noTextAttrs = joint.util.omit(renderingOnlyAttrs || model.get('attrs'), '.content');
            joint.dia.ElementView.prototype.update.call(this, model, noTextAttrs);

            if (!renderingOnlyAttrs || joint.util.has(renderingOnlyAttrs, '.content')) {
                // Update the content itself.
                this.updateContent(model, renderingOnlyAttrs);
            }

        } else {

            joint.dia.ElementView.prototype.update.call(this, model, renderingOnlyAttrs);
        }
    },

    updateContent: function(cell, renderingOnlyAttrs) {

        // Create copy of the text attributes
        var textAttrs = joint.util.merge({}, (renderingOnlyAttrs || cell.get('attrs'))['.content']);

        textAttrs = joint.util.omit(textAttrs, 'text');

        // Break the content to fit the element size taking into account the attributes
        // set on the model.
        var text = joint.util.breakText(cell.get('content'), cell.get('size'), textAttrs, {
            // measuring sandbox svg document
            svgDocument: this.paper.svg
        });

        // Create a new attrs with same structure as the model attrs { text: { *textAttributes* }}
        var attrs = joint.util.setByPath({}, '.content', textAttrs, '/');

        // Replace text attribute with the one we just processed.
        attrs['.content'].text = text;

        // Update the view using renderingOnlyAttributes parameter.
        joint.dia.ElementView.prototype.update.call(this, cell, attrs);
    }
});

joint.routers.manhattan = (function(g, _, joint, util) {

    'use strict';

    var config = {

        // size of the step to find a route
        step: 10,

        // use of the perpendicular linkView option to connect center of element with first vertex
        perpendicular: true,

        // should be source or target not to be consider as an obstacle
        excludeEnds: [], // 'source', 'target'

        // should be any element with a certain type not to be consider as an obstacle
        excludeTypes: ['basic.Text'],

        // if number of route finding loops exceed the maximum, stops searching and returns
        // fallback route
        maximumLoops: 2000,

        // possible starting directions from an element
        startDirections: ['left', 'right', 'top', 'bottom'],

        // possible ending directions to an element
        endDirections: ['left', 'right', 'top', 'bottom'],

        // specify directions above
        directionMap: {
            right: { x: 1, y: 0 },
            bottom: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            top: { x: 0, y: -1 }
        },

        // maximum change of the direction
        maxAllowedDirectionChange: 90,

        // padding applied on the element bounding boxes
        paddingBox: function() {

            var step = this.step;

            return {
                x: -step,
                y: -step,
                width: 2 * step,
                height: 2 * step
            };
        },

        // an array of directions to find next points on the route
        directions: function() {

            var step = this.step;

            return [
                { offsetX: step  , offsetY: 0     , cost: step },
                { offsetX: 0     , offsetY: step  , cost: step },
                { offsetX: -step , offsetY: 0     , cost: step },
                { offsetX: 0     , offsetY: -step , cost: step }
            ];
        },

        // a penalty received for direction change
        penalties: function() {

            return {
                0: 0,
                45: this.step / 2,
                90: this.step / 2
            };
        },

        // * Deprecated *
        // a simple route used in situations, when main routing method fails
        // (exceed loops, inaccessible).
        /* i.e.
          function(from, to, opts) {
            // Find an orthogonal route ignoring obstacles.
            var point = ((opts.previousDirAngle || 0) % 180 === 0)
                    ? g.point(from.x, to.y)
                    : g.point(to.x, from.y);
            return [point, to];
          },
        */
        fallbackRoute: function() {
            return null;
        },

        // if a function is provided, it's used to route the link while dragging an end
        // i.e. function(from, to, opts) { return []; }
        draggingRoute: null
    };

    // Map of obstacles
    // Helper structure to identify whether a point lies in an obstacle.
    function ObstacleMap(opt) {

        this.map = {};
        this.options = opt;
        // tells how to divide the paper when creating the elements map
        this.mapGridSize = 100;
    }

    ObstacleMap.prototype.build = function(graph, link) {

        var opt = this.options;


        // source or target element could be excluded from set of obstacles
        var excludedEnds = util.toArray(opt.excludeEnds).reduce(function(res, item) {
            var end = link.get(item);
            if (end) {
                var cell = graph.getCell(end.id);
                if (cell) {
                    res.push(cell);
                }
            }
            return res;
        }, []);

        // Exclude any embedded elements from the source and the target element.
        var excludedAncestors = [];

        var source = graph.getCell(link.get('source').id);
        if (source) {
            excludedAncestors = util.union(excludedAncestors, source.getAncestors().map(function(cell) { return cell.id }));
        }

        var target = graph.getCell(link.get('target').id);
        if (target) {
            excludedAncestors = util.union(excludedAncestors, target.getAncestors().map(function(cell) { return cell.id }));
        }

        // builds a map of all elements for quicker obstacle queries (i.e. is a point contained
        // in any obstacle?) (a simplified grid search)
        // The paper is divided to smaller cells, where each of them holds an information which
        // elements belong to it. When we query whether a point is in an obstacle we don't need
        // to go through all obstacles, we check only those in a particular cell.
        var mapGridSize = this.mapGridSize;

        graph.getElements().reduce(function(map, element) {

            var isExcludedType = util.toArray(opt.excludeTypes).includes(element.get('type'));
            var isExcludedEnd = excludedEnds.find(function(excluded) { return excluded.id === element.id });
            var isExcludedAncestor = excludedAncestors.includes(element.id);

            var isExcluded = isExcludedType || isExcludedEnd || isExcludedAncestor;
            if (!isExcluded) {
                var bBox = element.getBBox().moveAndExpand(opt.paddingBox);

                var origin = bBox.origin().snapToGrid(mapGridSize);
                var corner = bBox.corner().snapToGrid(mapGridSize);

                for (var x = origin.x; x <= corner.x; x += mapGridSize) {
                    for (var y = origin.y; y <= corner.y; y += mapGridSize) {
                        var gridKey = x + '@' + y;
                        map[gridKey] = map[gridKey] || [];
                        map[gridKey].push(bBox);
                    }
                }
            }
            return map;
        }, this.map);

        return this;
    };

    ObstacleMap.prototype.isPointAccessible = function(point) {

        var mapKey = point.clone().snapToGrid(this.mapGridSize).toString();

        return util.toArray(this.map[mapKey]).every( function(obstacle) {
            return !obstacle.containsPoint(point);
        });
    };

    // Sorted Set
    // Set of items sorted by given value.
    function SortedSet() {
        this.items = [];
        this.hash = {};
        this.values = {};
        this.OPEN = 1;
        this.CLOSE = 2;
    }

    SortedSet.prototype.add = function(item, value) {

        if (this.hash[item]) {
            // item removal
            this.items.splice(this.items.indexOf(item), 1);
        } else {
            this.hash[item] = this.OPEN;
        }

        this.values[item] = value;

        var index = joint.util.sortedIndex(this.items, item, function(i) {
            return this.values[i];
        }, this);

        this.items.splice(index, 0, item);
    };

    SortedSet.prototype.remove = function(item) {
        this.hash[item] = this.CLOSE;
    };

    SortedSet.prototype.isOpen = function(item) {
        return this.hash[item] === this.OPEN;
    };

    SortedSet.prototype.isClose = function(item) {
        return this.hash[item] === this.CLOSE;
    };

    SortedSet.prototype.isEmpty = function() {
        return this.items.length === 0;
    };

    SortedSet.prototype.pop = function() {
        var item =  this.items.shift();
        this.remove(item);
        return item;
    };

    function normalizePoint(point) {
        return g.point(
            point.x === 0 ? 0 : Math.abs(point.x) / point.x,
            point.y === 0 ? 0 : Math.abs(point.y) / point.y
        );
    }

    // reconstructs a route by concating points with their parents
    function reconstructRoute(parents, point, startCenter, endCenter) {

        var route = [];
        var prevDiff = normalizePoint(endCenter.difference(point));
        var current = point;
        var parent;

        while ((parent = parents[current])) {

            var diff = normalizePoint(current.difference(parent));

            if (!diff.equals(prevDiff)) {

                route.unshift(current);
                prevDiff = diff;
            }

            current = parent;
        }

        var startDiff = normalizePoint(g.point(current).difference(startCenter));
        if (!startDiff.equals(prevDiff)) {
            route.unshift(current);
        }

        return route;
    }

    // find points around the rectangle taking given directions in the account
    function getRectPoints(bbox, directionList, opt) {

        var step = opt.step;
        var center = bbox.center();
        var keys = util.isObject(opt.directionMap) ? Object.keys(opt.directionMap) : [];
        var dirLis = util.toArray(directionList);
        return keys.reduce(function(res, key) {

            if (dirLis.includes(key)) {

                var direction = opt.directionMap[key];

                var x = direction.x * bbox.width / 2;
                var y = direction.y * bbox.height / 2;

                var point = center.clone().offset(x, y);

                if (bbox.containsPoint(point)) {

                    point.offset(direction.x * step, direction.y * step);
                }

                res.push(point.snapToGrid(step));
            }
            return res;

        }, []);
    }

    // returns a direction index from start point to end point
    function getDirectionAngle(start, end, dirLen) {

        var q = 360 / dirLen;
        return Math.floor(g.normalizeAngle(start.theta(end) + q / 2) / q) * q;
    }

    function getDirectionChange(angle1, angle2) {

        var dirChange = Math.abs(angle1 - angle2);
        return dirChange > 180 ? 360 - dirChange : dirChange;
    }

    // heurestic method to determine the distance between two points
    function estimateCost(from, endPoints) {

        var min = Infinity;

        for (var i = 0, len = endPoints.length; i < len; i++) {
            var cost = from.manhattanDistance(endPoints[i]);
            if (cost < min) min = cost;
        }

        return min;
    }

    // finds the route between to points/rectangles implementing A* alghoritm
    function findRoute(start, end, map, opt) {

        var step = opt.step;
        var startPoints, endPoints;
        var startCenter, endCenter;

        // set of points we start pathfinding from
        if (start instanceof g.rect) {
            startPoints = getRectPoints(start, opt.startDirections, opt);
            startCenter = start.center().snapToGrid(step);
        } else {
            startCenter = start.clone().snapToGrid(step);
            startPoints = [startCenter];
        }

        // set of points we want the pathfinding to finish at
        if (end instanceof g.rect) {
            endPoints = getRectPoints(end, opt.endDirections, opt);
            endCenter = end.center().snapToGrid(step);
        } else {
            endCenter = end.clone().snapToGrid(step);
            endPoints = [endCenter];
        }

        // take into account only accessible end points
        startPoints = startPoints.filter(map.isPointAccessible, map);
        endPoints = endPoints.filter(map.isPointAccessible, map);

        // Check if there is a accessible end point.
        // We would have to use a fallback route otherwise.
        if (startPoints.length > 0 && endPoints.length >  0) {

            // The set of tentative points to be evaluated, initially containing the start points.
            var openSet = new SortedSet();
            // Keeps reference to a point that is immediate predecessor of given element.
            var parents = {};
            // Cost from start to a point along best known path.
            var costs = {};

            for (var i = 0, n = startPoints.length; i < n; i++) {
                var point = startPoints[i];

                var key = point.toString();
                openSet.add(key, estimateCost(point, endPoints));
                costs[key] = 0;
            }

            // directions
            var dir, dirChange;
            var dirs = opt.directions;
            var dirLen = dirs.length;
            var loopsRemain = opt.maximumLoops;
            var endPointsKeys = util.invoke(endPoints, 'toString');

            // main route finding loop
            while (!openSet.isEmpty() && loopsRemain > 0) {

                // remove current from the open list
                var currentKey = openSet.pop();
                var currentPoint = g.point(currentKey);
                var currentDist = costs[currentKey];
                var previousDirAngle = currentDirAngle;
                var currentDirAngle = parents[currentKey]
                    ? getDirectionAngle(parents[currentKey], currentPoint, dirLen)
                    : opt.previousDirAngle != null ? opt.previousDirAngle : getDirectionAngle(startCenter, currentPoint, dirLen);

                // Check if we reached any endpoint
                if (endPointsKeys.indexOf(currentKey) >= 0) {
                    // We don't want to allow route to enter the end point in opposite direction.
                    dirChange = getDirectionChange(currentDirAngle, getDirectionAngle(currentPoint, endCenter, dirLen));
                    if (currentPoint.equals(endCenter) || dirChange < 180) {
                        opt.previousDirAngle = currentDirAngle;
                        return reconstructRoute(parents, currentPoint, startCenter, endCenter);
                    }
                }

                // Go over all possible directions and find neighbors.
                for (i = 0; i < dirLen; i++) {

                    dir = dirs[i];
                    dirChange = getDirectionChange(currentDirAngle, dir.angle);
                    // if the direction changed rapidly don't use this point
                    // Note that check is relevant only for points with previousDirAngle i.e.
                    // any direction is allowed for starting points
                    if (previousDirAngle && dirChange > opt.maxAllowedDirectionChange) {
                        continue;
                    }

                    var neighborPoint = currentPoint.clone().offset(dir.offsetX, dir.offsetY);
                    var neighborKey = neighborPoint.toString();
                    // Closed points from the openSet were already evaluated.
                    if (openSet.isClose(neighborKey) || !map.isPointAccessible(neighborPoint)) {
                        continue;
                    }

                    // The current direction is ok to proccess.
                    var costFromStart = currentDist + dir.cost + opt.penalties[dirChange];

                    if (!openSet.isOpen(neighborKey) || costFromStart < costs[neighborKey]) {
                        // neighbor point has not been processed yet or the cost of the path
                        // from start is lesser than previously calcluated.
                        parents[neighborKey] = currentPoint;
                        costs[neighborKey] = costFromStart;
                        openSet.add(neighborKey, costFromStart + estimateCost(neighborPoint, endPoints));
                    }
                }

                loopsRemain--;
            }
        }

        // no route found ('to' point wasn't either accessible or finding route took
        // way to much calculations)
        return opt.fallbackRoute(startCenter, endCenter, opt);
    }

    // resolve some of the options
    function resolveOptions(opt) {

        opt.directions = util.result(opt, 'directions');
        opt.penalties = util.result(opt, 'penalties');
        opt.paddingBox = util.result(opt, 'paddingBox');

        util.toArray(opt.directions).forEach(function(direction) {

            var point1 = g.point(0, 0);
            var point2 = g.point(direction.offsetX, direction.offsetY);

            direction.angle = g.normalizeAngle(point1.theta(point2));
        });
    }

    // initiation of the route finding
    function router(vertices, opt) {

        resolveOptions(opt);

        // enable/disable linkView perpendicular option
        this.options.perpendicular = !!opt.perpendicular;

        // expand boxes by specific padding
        var sourceBBox = g.rect(this.sourceBBox).moveAndExpand(opt.paddingBox);
        var targetBBox = g.rect(this.targetBBox).moveAndExpand(opt.paddingBox);

        // pathfinding
        var map = (new ObstacleMap(opt)).build(this.paper.model, this.model);
        var oldVertices = util.toArray(vertices).map(g.point);
        var newVertices = [];
        var tailPoint = sourceBBox.center().snapToGrid(opt.step);

        // find a route by concating all partial routes (routes need to go through the vertices)
        // startElement -> vertex[1] -> ... -> vertex[n] -> endElement
        for (var i = 0, len = oldVertices.length; i <= len; i++) {

            var partialRoute = null;

            var from = to || sourceBBox;
            var to = oldVertices[i];

            if (!to) {

                to = targetBBox;

                // 'to' is not a vertex. If the target is a point (i.e. it's not an element), we
                // might use dragging route instead of main routing method if that is enabled.
                var endingAtPoint = !this.model.get('source').id || !this.model.get('target').id;

                if (endingAtPoint && util.isFunction(opt.draggingRoute)) {
                    // Make sure we passing points only (not rects).
                    var dragFrom = from instanceof g.rect ? from.center() : from;
                    partialRoute = opt.draggingRoute(dragFrom, to.origin(), opt);
                }
            }

            // if partial route has not been calculated yet use the main routing method to find one
            partialRoute = partialRoute || findRoute(from, to, map, opt);

            if (partialRoute === null) {
                // The partial route could not be found.
                // use orthogonal (do not avoid elements) route instead.
                if (!util.isFunction(joint.routers.orthogonal)) {
                    throw new Error('Manhattan requires the orthogonal router.');
                }
                return joint.routers.orthogonal(vertices, opt, this);
            }

            var leadPoint = partialRoute[0];

            if (leadPoint && leadPoint.equals(tailPoint)) {
                // remove the first point if the previous partial route had the same point as last
                partialRoute.shift();
            }

            tailPoint = partialRoute[partialRoute.length - 1] || tailPoint;

            Array.prototype.push.apply(newVertices, partialRoute);
        }

        return newVertices;
    }

    // public function
    return function(vertices, opt, linkView) {

        return router.call(linkView, vertices, util.assign({}, config, opt));
    };

})(g, _, joint, joint.util);

joint.routers.metro = (function(util) {

    if (!util.isFunction(joint.routers.manhattan)) {

        throw new Error('Metro requires the manhattan router.');
    }

    var config = {

        // cost of a diagonal step (calculated if not defined).
        diagonalCost: null,

        // an array of directions to find next points on the route
        directions: function() {

            var step = this.step;
            var diagonalCost = this.diagonalCost || Math.ceil(Math.sqrt(step * step << 1));

            return [
                { offsetX: step  , offsetY: 0     , cost: step },
                { offsetX: step  , offsetY: step  , cost: diagonalCost },
                { offsetX: 0     , offsetY: step  , cost: step },
                { offsetX: -step , offsetY: step  , cost: diagonalCost },
                { offsetX: -step , offsetY: 0     , cost: step },
                { offsetX: -step , offsetY: -step , cost: diagonalCost },
                { offsetX: 0     , offsetY: -step , cost: step },
                { offsetX: step  , offsetY: -step , cost: diagonalCost }
            ];
        },
        maxAllowedDirectionChange: 45,
        // a simple route used in situations, when main routing method fails
        // (exceed loops, inaccessible).
        fallbackRoute: function(from, to, opts) {

            // Find a route which breaks by 45 degrees ignoring all obstacles.

            var theta = from.theta(to);

            var a = { x: to.x, y: from.y };
            var b = { x: from.x, y: to.y };

            if (theta % 180 > 90) {
                var t = a;
                a = b;
                b = t;
            }

            var p1 = (theta % 90) < 45 ? a : b;

            var l1 = g.line(from, p1);

            var alpha = 90 * Math.ceil(theta / 90);

            var p2 = g.point.fromPolar(l1.squaredLength(), g.toRad(alpha + 135), p1);

            var l2 = g.line(to, p2);

            var point = l1.intersection(l2);

            return point ? [point.round(), to] : [to];
        }
    };

    // public function
    return function(vertices, opts, linkView) {

        return joint.routers.manhattan(vertices, util.assign({}, config, opts), linkView);
    };

})(joint.util);

// Does not make any changes to vertices.
// Returns the arguments that are passed to it, unchanged.
joint.routers.normal = function(vertices, opt, linkView) {

    return vertices;
};

// Routes the link always to/from a certain side
//
// Arguments:
//   padding ... gap between the element and the first vertex. :: Default 40.
//   side ... 'left' | 'right' | 'top' | 'bottom' :: Default 'bottom'.
//
joint.routers.oneSide = function(vertices, opt, linkView) {

    var side = opt.side || 'bottom';
    var padding = opt.padding || 40;

    // LinkView contains cached source an target bboxes.
    // Note that those are Geometry rectangle objects.
    var sourceBBox = linkView.sourceBBox;
    var targetBBox = linkView.targetBBox;
    var sourcePoint = sourceBBox.center();
    var targetPoint = targetBBox.center();

    var coordinate, dimension, direction;

    switch (side) {
        case 'bottom':
            direction = 1;
            coordinate = 'y';
            dimension = 'height';
            break;
        case 'top':
            direction = -1;
            coordinate = 'y';
            dimension = 'height';
            break;
        case 'left':
            direction = -1;
            coordinate = 'x';
            dimension = 'width';
            break;
        case 'right':
            direction = 1;
            coordinate = 'x';
            dimension = 'width';
            break;
        default:
            throw new Error('Router: invalid side');
    }

    // move the points from the center of the element to outside of it.
    sourcePoint[coordinate] += direction * (sourceBBox[dimension] / 2 + padding);
    targetPoint[coordinate] += direction * (targetBBox[dimension] / 2 + padding);

    // make link orthogonal (at least the first and last vertex).
    if (direction * (sourcePoint[coordinate] - targetPoint[coordinate]) > 0) {
        targetPoint[coordinate] = sourcePoint[coordinate];
    } else {
        sourcePoint[coordinate] = targetPoint[coordinate];
    }

    return [sourcePoint].concat(vertices, targetPoint);
};

joint.routers.orthogonal = (function(util) {

    // bearing -> opposite bearing
    var opposite = {
        N: 'S',
        S: 'N',
        E: 'W',
        W: 'E'
    };

    // bearing -> radians
    var radians = {
        N: -Math.PI / 2 * 3,
        S: -Math.PI / 2,
        E: 0,
        W: Math.PI
    };

    // HELPERS //

    // simple bearing method (calculates only orthogonal cardinals)
    function bearing(from, to) {
        if (from.x == to.x) return from.y > to.y ? 'N' : 'S';
        if (from.y == to.y) return from.x > to.x ? 'W' : 'E';
        return null;
    }

    // returns either width or height of a bbox based on the given bearing
    function boxSize(bbox, brng) {
        return bbox[brng == 'W' || brng == 'E' ? 'width' : 'height'];
    }

    // expands a box by specific value
    function expand(bbox, val) {
        return g.rect(bbox).moveAndExpand({ x: -val, y: -val, width: 2 * val, height: 2 * val });
    }

    // transform point to a rect
    function pointBox(p) {
        return g.rect(p.x, p.y, 0, 0);
    }

    // returns a minimal rect which covers the given boxes
    function boundary(bbox1, bbox2) {

        var x1 = Math.min(bbox1.x, bbox2.x);
        var y1 = Math.min(bbox1.y, bbox2.y);
        var x2 = Math.max(bbox1.x + bbox1.width, bbox2.x + bbox2.width);
        var y2 = Math.max(bbox1.y + bbox1.height, bbox2.y + bbox2.height);

        return g.rect(x1, y1, x2 - x1, y2 - y1);
    }

    // returns a point `p` where lines p,p1 and p,p2 are perpendicular and p is not contained
    // in the given box
    function freeJoin(p1, p2, bbox) {

        var p = g.point(p1.x, p2.y);
        if (bbox.containsPoint(p)) p = g.point(p2.x, p1.y);
        // kept for reference
        // if (bbox.containsPoint(p)) p = null;
        return p;
    }

    // PARTIAL ROUTERS //

    function vertexVertex(from, to, brng) {

        var p1 = g.point(from.x, to.y);
        var p2 = g.point(to.x, from.y);
        var d1 = bearing(from, p1);
        var d2 = bearing(from, p2);
        var xBrng = opposite[brng];

        var p = (d1 == brng || (d1 != xBrng && (d2 == xBrng || d2 != brng))) ? p1 : p2;

        return { points: [p], direction: bearing(p, to) };
    }

    function elementVertex(from, to, fromBBox) {

        var p = freeJoin(from, to, fromBBox);

        return { points: [p], direction: bearing(p, to) };
    }

    function vertexElement(from, to, toBBox, brng) {

        var route = {};

        var pts = [g.point(from.x, to.y), g.point(to.x, from.y)];
        var freePts = pts.filter(function(pt) { return !toBBox.containsPoint(pt); });
        var freeBrngPts = freePts.filter(function(pt) { return bearing(pt, from) != brng; });

        var p;

        if (freeBrngPts.length > 0) {

            // try to pick a point which bears the same direction as the previous segment
            p = freeBrngPts.filter(function(pt) { return bearing(from, pt) == brng; }).pop();
            p = p || freeBrngPts[0];

            route.points = [p];
            route.direction = bearing(p, to);

        } else {

            // Here we found only points which are either contained in the element or they would create
            // a link segment going in opposite direction from the previous one.
            // We take the point inside element and move it outside the element in the direction the
            // route is going. Now we can join this point with the current end (using freeJoin).

            p = util.difference(pts, freePts)[0];

            var p2 = g.point(to).move(p, -boxSize(toBBox, brng) / 2);
            var p1 = freeJoin(p2, from, toBBox);

            route.points = [p1, p2];
            route.direction = bearing(p2, to);
        }

        return route;
    }

    function elementElement(from, to, fromBBox, toBBox) {

        var route = elementVertex(to, from, toBBox);
        var p1 = route.points[0];

        if (fromBBox.containsPoint(p1)) {

            route = elementVertex(from, to, fromBBox);
            var p2 = route.points[0];

            if (toBBox.containsPoint(p2)) {

                var fromBorder = g.point(from).move(p2, -boxSize(fromBBox, bearing(from, p2)) / 2);
                var toBorder = g.point(to).move(p1, -boxSize(toBBox, bearing(to, p1)) / 2);
                var mid = g.line(fromBorder, toBorder).midpoint();

                var startRoute = elementVertex(from, mid, fromBBox);
                var endRoute = vertexVertex(mid, to, startRoute.direction);

                route.points = [startRoute.points[0], endRoute.points[0]];
                route.direction = endRoute.direction;
            }
        }

        return route;
    }

    // Finds route for situations where one of end is inside the other.
    // Typically the route is conduct outside the outer element first and
    // let go back to the inner element.
    function insideElement(from, to, fromBBox, toBBox, brng) {

        var route = {};
        var bndry = expand(boundary(fromBBox, toBBox), 1);

        // start from the point which is closer to the boundary
        var reversed = bndry.center().distance(to) > bndry.center().distance(from);
        var start = reversed ? to : from;
        var end = reversed ? from : to;

        var p1, p2, p3;

        if (brng) {
            // Points on circle with radius equals 'W + H` are always outside the rectangle
            // with width W and height H if the center of that circle is the center of that rectangle.
            p1 = g.point.fromPolar(bndry.width + bndry.height, radians[brng], start);
            p1 = bndry.pointNearestToPoint(p1).move(p1, -1);
        } else {
            p1 = bndry.pointNearestToPoint(start).move(start, 1);
        }

        p2 = freeJoin(p1, end, bndry);

        if (p1.round().equals(p2.round())) {
            p2 = g.point.fromPolar(bndry.width + bndry.height, g.toRad(p1.theta(start)) + Math.PI / 2, end);
            p2 = bndry.pointNearestToPoint(p2).move(end, 1).round();
            p3 = freeJoin(p1, p2, bndry);
            route.points = reversed ? [p2, p3, p1] : [p1, p3, p2];
        } else {
            route.points = reversed ? [p2, p1] : [p1, p2];
        }

        route.direction = reversed ? bearing(p1, to) : bearing(p2, to);

        return route;
    }

    // MAIN ROUTER //

    // Return points that one needs to draw a connection through in order to have a orthogonal link
    // routing from source to target going through `vertices`.
    function findOrthogonalRoute(vertices, opt, linkView) {

        var padding = opt.elementPadding || 20;

        var orthogonalVertices = [];
        var sourceBBox = expand(linkView.sourceBBox, padding);
        var targetBBox = expand(linkView.targetBBox, padding);

        vertices = util.toArray(vertices).map(g.point);
        vertices.unshift(sourceBBox.center());
        vertices.push(targetBBox.center());

        var brng;

        for (var i = 0, max = vertices.length - 1; i < max; i++) {

            var route = null;
            var from = vertices[i];
            var to = vertices[i + 1];
            var isOrthogonal = !!bearing(from, to);

            if (i == 0) {

                if (i + 1 == max) { // route source -> target

                    // Expand one of elements by 1px so we detect also situations when they
                    // are positioned one next other with no gap between.
                    if (sourceBBox.intersect(expand(targetBBox, 1))) {
                        route = insideElement(from, to, sourceBBox, targetBBox);
                    } else if (!isOrthogonal) {
                        route = elementElement(from, to, sourceBBox, targetBBox);
                    }

                } else { // route source -> vertex

                    if (sourceBBox.containsPoint(to)) {
                        route = insideElement(from, to, sourceBBox, expand(pointBox(to), padding));
                    } else if (!isOrthogonal) {
                        route = elementVertex(from, to, sourceBBox);
                    }
                }

            } else if (i + 1 == max) { // route vertex -> target

                var orthogonalLoop = isOrthogonal && bearing(to, from) == brng;

                if (targetBBox.containsPoint(from) || orthogonalLoop) {
                    route = insideElement(from, to, expand(pointBox(from), padding), targetBBox, brng);
                } else if (!isOrthogonal) {
                    route = vertexElement(from, to, targetBBox, brng);
                }

            } else if (!isOrthogonal) { // route vertex -> vertex
                route = vertexVertex(from, to, brng);
            }

            if (route) {
                Array.prototype.push.apply(orthogonalVertices, route.points);
                brng = route.direction;
            } else {
                // orthogonal route and not looped
                brng = bearing(from, to);
            }

            if (i + 1 < max) {
                orthogonalVertices.push(to);
            }
        }

        return orthogonalVertices;
    }

    return findOrthogonalRoute;

})(joint.util);

joint.connectors.normal = function(sourcePoint, targetPoint, vertices) {

    // Construct the `d` attribute of the `<path>` element.
    var d = ['M', sourcePoint.x, sourcePoint.y];

    joint.util.toArray(vertices).forEach(function(vertex) {

        d.push(vertex.x, vertex.y);
    });

    d.push(targetPoint.x, targetPoint.y);

    return d.join(' ');
};

joint.connectors.rounded = function(sourcePoint, targetPoint, vertices, opts) {

    opts = opts || {};

    var offset = opts.radius || 10;

    var c1, c2, d1, d2, prev, next;

    // Construct the `d` attribute of the `<path>` element.
    var d = ['M', sourcePoint.x, sourcePoint.y];

    joint.util.toArray(vertices).forEach(function(vertex, index) {

        // the closest vertices
        prev = vertices[index - 1] || sourcePoint;
        next = vertices[index + 1] || targetPoint;

        // a half distance to the closest vertex
        d1 = d2 || g.point(vertex).distance(prev) / 2;
        d2 = g.point(vertex).distance(next) / 2;

        // control points
        c1 = g.point(vertex).move(prev, -Math.min(offset, d1)).round();
        c2 = g.point(vertex).move(next, -Math.min(offset, d2)).round();

        d.push(c1.x, c1.y, 'S', vertex.x, vertex.y, c2.x, c2.y, 'L');
    });

    d.push(targetPoint.x, targetPoint.y);

    return d.join(' ');
};

joint.connectors.smooth = function(sourcePoint, targetPoint, vertices) {

    var d;

    if (vertices.length) {

        d = g.bezier.curveThroughPoints([sourcePoint].concat(vertices).concat([targetPoint]));

    } else {
        // if we have no vertices use a default cubic bezier curve, cubic bezier requires
        // two control points. The two control points are both defined with X as mid way
        // between the source and target points. SourceControlPoint Y is equal to sourcePoint Y
        // and targetControlPointY being equal to targetPointY.
        var controlPointX = (sourcePoint.x + targetPoint.x) / 2;

        d = [
            'M', sourcePoint.x, sourcePoint.y,
            'C', controlPointX, sourcePoint.y, controlPointX, targetPoint.y,
            targetPoint.x, targetPoint.y
        ];
    }

    return d.join(' ');
};

joint.connectors.jumpover = (function(_, g, util) {

    // default size of jump if not specified in options
    var JUMP_SIZE = 5;

    // available jump types
    var JUMP_TYPES = ['arc', 'gap', 'cubic'];

    // takes care of math. error for case when jump is too close to end of line
    var CLOSE_PROXIMITY_PADDING = 1;

    // list of connector types not to jump over.
    var IGNORED_CONNECTORS = ['smooth'];

    /**
     * Transform start/end and vertices into series of lines
     * @param {g.point} sourcePoint start point
     * @param {g.point} targetPoint end point
     * @param {g.point[]} vertices optional list of vertices
     * @return {g.line[]} [description]
     */
    function createLines(sourcePoint, targetPoint, vertices) {
        // make a flattened array of all points
        var points = [].concat(sourcePoint, vertices, targetPoint);
        return points.reduce(function(resultLines, point, idx) {
            // if there is a next point, make a line with it
            var nextPoint = points[idx + 1];
            if (nextPoint != null) {
                resultLines[idx] = g.line(point, nextPoint);
            }
            return resultLines;
        }, []);
    }

    function setupUpdating(jumpOverLinkView) {
        var updateList = jumpOverLinkView.paper._jumpOverUpdateList;

        // first time setup for this paper
        if (updateList == null) {
            updateList = jumpOverLinkView.paper._jumpOverUpdateList = [];
            jumpOverLinkView.paper.on('cell:pointerup', updateJumpOver);
            jumpOverLinkView.paper.model.on('reset', function() {
                updateList = jumpOverLinkView.paper._jumpOverUpdateList = [];
            });
        }

        // add this link to a list so it can be updated when some other link is updated
        if (updateList.indexOf(jumpOverLinkView) < 0) {
            updateList.push(jumpOverLinkView);

            // watch for change of connector type or removal of link itself
            // to remove the link from a list of jump over connectors
            jumpOverLinkView.listenToOnce(jumpOverLinkView.model, 'change:connector remove', function() {
                updateList.splice(updateList.indexOf(jumpOverLinkView), 1);
            });
        }
    }

    /**
     * Handler for a batch:stop event to force
     * update of all registered links with jump over connector
     * @param {object} batchEvent optional object with info about batch
     */
    function updateJumpOver() {
        var updateList = this._jumpOverUpdateList;
        for (var i = 0; i < updateList.length; i++) {
            updateList[i].update();
        }
    }

    /**
     * Utility function to collect all intersection poinst of a single
     * line against group of other lines.
     * @param {g.line} line where to find points
     * @param {g.line[]} crossCheckLines lines to cross
     * @return {g.point[]} list of intersection points
     */
    function findLineIntersections(line, crossCheckLines) {
        return _(crossCheckLines).map(function(crossCheckLine) {
            return line.intersection(crossCheckLine);
        }).compact().value();
    }

    /**
     * Sorting function for list of points by their distance.
     * @param {g.point} p1 first point
     * @param {g.point} p2 second point
     * @return {number} squared distance between points
     */
    function sortPoints(p1, p2) {
        return g.line(p1, p2).squaredLength();
    }

    /**
     * Split input line into multiple based on intersection points.
     * @param {g.line} line input line to split
     * @param {g.point[]} intersections poinst where to split the line
     * @param {number} jumpSize the size of jump arc (length empty spot on a line)
     * @return {g.line[]} list of lines being split
     */
    function createJumps(line, intersections, jumpSize) {
        return intersections.reduce(function(resultLines, point, idx) {
            // skipping points that were merged with the previous line
            // to make bigger arc over multiple lines that are close to each other
            if (point.skip === true) {
                return resultLines;
            }

            // always grab the last line from buffer and modify it
            var lastLine = resultLines.pop() || line;

            // calculate start and end of jump by moving by a given size of jump
            var jumpStart = g.point(point).move(lastLine.start, -(jumpSize));
            var jumpEnd = g.point(point).move(lastLine.start, +(jumpSize));

            // now try to look at the next intersection point
            var nextPoint = intersections[idx + 1];
            if (nextPoint != null) {
                var distance = jumpEnd.distance(nextPoint);
                if (distance <= jumpSize) {
                    // next point is close enough, move the jump end by this
                    // difference and mark the next point to be skipped
                    jumpEnd = nextPoint.move(lastLine.start, distance);
                    nextPoint.skip = true;
                }
            } else {
                // this block is inside of `else` as an optimization so the distance is
                // not calculated when we know there are no other intersection points
                var endDistance = jumpStart.distance(lastLine.end);
                // if the end is too close to possible jump, draw remaining line instead of a jump
                if (endDistance < jumpSize * 2 + CLOSE_PROXIMITY_PADDING) {
                    resultLines.push(lastLine);
                    return resultLines;
                }
            }

            var startDistance = jumpEnd.distance(lastLine.start);
            if (startDistance < jumpSize * 2 + CLOSE_PROXIMITY_PADDING) {
                // if the start of line is too close to jump, draw that line instead of a jump
                resultLines.push(lastLine);
                return resultLines;
            }

            // finally create a jump line
            var jumpLine = g.line(jumpStart, jumpEnd);
            // it's just simple line but with a `isJump` property
            jumpLine.isJump = true;

            resultLines.push(
                g.line(lastLine.start, jumpStart),
                jumpLine,
                g.line(jumpEnd, lastLine.end)
            );
            return resultLines;
        }, []);
    }

    /**
     * Assemble `D` attribute of a SVG path by iterating given lines.
     * @param {g.line[]} lines source lines to use
     * @param {number} jumpSize the size of jump arc (length empty spot on a line)
     * @return {string}
     */
    function buildPath(lines, jumpSize, jumpType) {
        // first move to the start of a first line
        var start = ['M', lines[0].start.x, lines[0].start.y];

        // make a paths from lines
        var paths = _(lines).map(function(line) {
            if (line.isJump) {
                var diff;
                if (jumpType === 'arc') {
                    diff = line.start.difference(line.end);
                    // determine rotation of arc based on difference between points
                    var xAxisRotate = Number(diff.x < 0 && diff.y < 0);
                    // for a jump line we create an arc instead
                    return ['A', jumpSize, jumpSize, 0, 0, xAxisRotate, line.end.x, line.end.y];
                } else if (jumpType === 'gap') {
                    return ['M', line.end.x, line.end.y];
                } else if (jumpType === 'cubic') {
                    diff = line.start.difference(line.end);
                    var angle = line.start.theta(line.end);
                    var xOffset = jumpSize * 0.6;
                    var yOffset = jumpSize * 1.35;
                    // determine rotation of curve based on difference between points
                    if (diff.x < 0 && diff.y < 0) {
                        yOffset *= -1;
                    }
                    var controlStartPoint = g.point(line.start.x + xOffset, line.start.y + yOffset).rotate(line.start, angle);
                    var controlEndPoint = g.point(line.end.x - xOffset, line.end.y + yOffset).rotate(line.end, angle);
                    // create a cubic bezier curve
                    return ['C', controlStartPoint.x, controlStartPoint.y, controlEndPoint.x, controlEndPoint.y, line.end.x, line.end.y];
                }
            }
            return ['L', line.end.x, line.end.y];
        }).flatten().value();

        return [].concat(start, paths).join(' ');
    }

    /**
     * Actual connector function that will be run on every update.
     * @param {g.point} sourcePoint start point of this link
     * @param {g.point} targetPoint end point of this link
     * @param {g.point[]} vertices of this link
     * @param {object} opts options
     * @property {number} size optional size of a jump arc
     * @return {string} created `D` attribute of SVG path
     */
    return function(sourcePoint, targetPoint, vertices, opts) { // eslint-disable-line max-params

        setupUpdating(this);

        var jumpSize = opts.size || JUMP_SIZE;
        var jumpType = opts.jump && ('' + opts.jump).toLowerCase();
        var ignoreConnectors = opts.ignoreConnectors || IGNORED_CONNECTORS;

        // grab the first jump type as a default if specified one is invalid
        if (JUMP_TYPES.indexOf(jumpType) === -1) {
            jumpType = JUMP_TYPES[0];
        }

        var paper = this.paper;
        var graph = paper.model;
        var allLinks = graph.getLinks();

        // there is just one link, draw it directly
        if (allLinks.length === 1) {
            return buildPath(
                createLines(sourcePoint, targetPoint, vertices),
                jumpSize, jumpType
            );
        }

        var thisModel = this.model;
        var thisIndex = allLinks.indexOf(thisModel);
        var defaultConnector = paper.options.defaultConnector || {};

        // not all links are meant to be jumped over.
        var links = allLinks.filter(function(link, idx) {

            var connector = link.get('connector') || defaultConnector;

            // avoid jumping over links with connector type listed in `ignored connectors`.
            if (util.toArray(ignoreConnectors).includes(connector.name)) {
                return false;
            }
            // filter out links that are above this one and  have the same connector type
            // otherwise there would double hoops for each intersection
            if (idx > thisIndex) {
                return connector.name !== 'jumpover';
            }
            return true;
        });

        // find views for all links
        var linkViews = links.map(function(link) {
            return paper.findViewByModel(link);
        });

        // create lines for this link
        var thisLines = createLines(
            sourcePoint,
            targetPoint,
            vertices
        );

        // create lines for all other links
        var linkLines = linkViews.map(function(linkView) {
            if (linkView == null) {
                return [];
            }
            if (linkView === this) {
                return thisLines;
            }
            return createLines(
                linkView.sourcePoint,
                linkView.targetPoint,
                linkView.route
            );
        }, this);

        // transform lines for this link by splitting with jump lines at
        // points of intersection with other links
        var jumpingLines = thisLines.reduce(function(resultLines, thisLine) {
            // iterate all links and grab the intersections with this line
            // these are then sorted by distance so the line can be split more easily
            var intersections = _(links).map(function(link, i) {
                // don't intersection with itself
                if (link === thisModel) {
                    return null;
                }
                return findLineIntersections(thisLine, linkLines[i]);
            }).flatten().compact().sortBy(_.partial(sortPoints, thisLine.start)).value();

            if (intersections.length > 0) {
                // split the line based on found intersection points
                resultLines.push.apply(resultLines, createJumps(thisLine, intersections, jumpSize));
            } else {
                // without any intersection the line goes uninterrupted
                resultLines.push(thisLine);
            }
            return resultLines;
        }, []);

        return buildPath(jumpingLines, jumpSize, jumpType);
    };
}(_, g, joint.util));

(function(_, g, joint, util) {

    function portTransformAttrs(point, angle, opt) {

        var trans = point.toJSON();

        trans.angle = angle || 0;

        return joint.util.defaults({}, opt, trans);
    }

    function lineLayout(ports, p1, p2) {
        return ports.map(function(port, index, ports) {
            var p = this.pointAt(((index + 0.5) / ports.length));
            // `dx`,`dy` per port offset option
            if (port.dx || port.dy) {
                p.offset(port.dx || 0, port.dy || 0);
            }

            return portTransformAttrs(p.round(), 0, port);
        }, g.line(p1, p2));
    }

    function ellipseLayout(ports, elBBox, startAngle, stepFn) {

        var center = elBBox.center();
        var ratio = elBBox.width / elBBox.height;
        var p1 = elBBox.topMiddle();

        var ellipse = g.Ellipse.fromRect(elBBox);

        return ports.map(function(port, index, ports) {

            var angle = startAngle + stepFn(index, ports.length);
            var p2 = p1.clone()
                .rotate(center, -angle)
                .scale(ratio, 1, center);

            var theta = port.compensateRotation ? -ellipse.tangentTheta(p2) : 0;

            // `dx`,`dy` per port offset option
            if (port.dx || port.dy) {
                p2.offset(port.dx || 0, port.dy || 0);
            }

            // `dr` delta radius option
            if (port.dr) {
                p2.move(center, port.dr);
            }

            return portTransformAttrs(p2.round(), theta, port);
        });
    }

    // Creates a point stored in arguments
    function argPoint(bbox, args) {

        var x = args.x;
        if (util.isString(x)) {
            x = parseFloat(x) / 100 * bbox.width;
        }

        var y = args.y;
        if (util.isString(y)) {
            y = parseFloat(y) / 100 * bbox.height;
        }

        return g.point(x || 0, y || 0);
    }

    joint.layout.Port = {

        /**
         * @param {Array<Object>} ports
         * @param {g.Rect} elBBox
         * @param {Object=} opt opt Group options
         * @returns {Array<g.Point>}
         */
        absolute: function(ports, elBBox, opt) {
            //TODO v.talas angle
            return ports.map(argPoint.bind(null, elBBox));
        },

        /**
         * @param {Array<Object>} ports
         * @param {g.Rect} elBBox
         * @param {Object=} opt opt Group options
         * @returns {Array<g.Point>}
         */
        fn: function(ports, elBBox, opt) {
            return opt.fn(ports, elBBox, opt);
        },

        /**
         * @param {Array<Object>} ports
         * @param {g.Rect} elBBox
         * @param {Object=} opt opt Group options
         * @returns {Array<g.Point>}
         */
        line: function(ports, elBBox, opt) {

            var start = argPoint(elBBox, opt.start || elBBox.origin());
            var end = argPoint(elBBox, opt.end || elBBox.corner());

            return lineLayout(ports, start, end);
        },

        /**
         * @param {Array<Object>} ports
         * @param {g.Rect} elBBox
         * @param {Object=} opt opt Group options
         * @returns {Array<g.Point>}
         */
        left: function(ports, elBBox, opt) {
            return lineLayout(ports, elBBox.origin(), elBBox.bottomLeft());
        },

        /**
         * @param {Array<Object>} ports
         * @param {g.Rect} elBBox
         * @param {Object=} opt opt Group options
         * @returns {Array<g.Point>}
         */
        right: function(ports, elBBox, opt) {
            return lineLayout(ports, elBBox.topRight(), elBBox.corner());
        },

        /**
         * @param {Array<Object>} ports
         * @param {g.Rect} elBBox
         * @param {Object=} opt opt Group options
         * @returns {Array<g.Point>}
         */
        top: function(ports, elBBox, opt) {
            return lineLayout(ports, elBBox.origin(), elBBox.topRight());
        },

        /**
         * @param {Array<Object>} ports
         * @param {g.Rect} elBBox
         * @param {Object=} opt opt Group options
         * @returns {Array<g.Point>}
         */
        bottom: function(ports, elBBox, opt) {
            return lineLayout(ports, elBBox.bottomLeft(), elBBox.corner());
        },

        /**
         * @param {Array<Object>} ports
         * @param {g.Rect} elBBox
         * @param {Object=} opt Group options
         * @returns {Array<g.Point>}
         */
        ellipseSpread: function(ports, elBBox, opt) {

            var startAngle = opt.startAngle || 0;
            var stepAngle = opt.step || 360 / ports.length;

            return ellipseLayout(ports, elBBox, startAngle, function(index) {
                return index * stepAngle;
            });
        },

        /**
         * @param {Array<Object>} ports
         * @param {g.Rect} elBBox
         * @param {Object=} opt Group options
         * @returns {Array<g.Point>}
         */
        ellipse: function(ports, elBBox, opt) {

            var startAngle = opt.startAngle || 0;
            var stepAngle = opt.step || 20;

            return ellipseLayout(ports, elBBox, startAngle, function(index, count) {
                return (index + 0.5 - count / 2) * stepAngle;
            });
        }
    };

})(_, g, joint, joint.util);

(function(_, g, joint, util) {

    function labelAttributes(opt1, opt2) {

        return util.defaultsDeep({}, opt1, opt2, {
            x: 0,
            y: 0,
            angle: 0,
            attrs: {
                '.': {
                    y: '0',
                    'text-anchor': 'start'
                }
            }
        });

    }

    function outsideLayout(portPosition, elBBox, autoOrient, opt) {

        opt = util.defaults({}, opt, { offset: 15 });
        var angle = elBBox.center().theta(portPosition);
        var x = getBBoxAngles(elBBox);

        var tx, ty, y, textAnchor;
        var offset = opt.offset;
        var orientAngle = 0;

        if (angle < x[1] || angle > x[2]) {
            y = '.3em';
            tx = offset;
            ty = 0;
            textAnchor = 'start';
        } else if (angle < x[0]) {
            y = '0';
            tx = 0;
            ty = -offset;
            if (autoOrient) {
                orientAngle = -90;
                textAnchor = 'start';
            } else {
                textAnchor = 'middle';
            }
        } else if (angle < x[3]) {
            y = '.3em';
            tx = -offset;
            ty = 0;
            textAnchor = 'end';
        } else {
            y = '.6em';
            tx = 0;
            ty = offset;
            if (autoOrient) {
                orientAngle = 90;
                textAnchor = 'start';
            } else {
                textAnchor = 'middle';
            }
        }

        var round = Math.round;
        return labelAttributes({
            x: round(tx),
            y: round(ty),
            angle: orientAngle,
            attrs: {
                '.': {
                    y: y,
                    'text-anchor': textAnchor
                }
            }
        });
    }

    function getBBoxAngles(elBBox) {

        var center = elBBox.center();

        var tl = center.theta(elBBox.origin());
        var bl = center.theta(elBBox.bottomLeft());
        var br = center.theta(elBBox.corner());
        var tr = center.theta(elBBox.topRight());

        return [tl, tr, br, bl];
    }

    function insideLayout(portPosition, elBBox, autoOrient, opt) {

        var angle = elBBox.center().theta(portPosition);
        opt = util.defaults({}, opt, { offset: 15 });

        var tx, ty, y, textAnchor;
        var offset = opt.offset;
        var orientAngle = 0;

        var bBoxAngles = getBBoxAngles(elBBox);

        if (angle < bBoxAngles[1] || angle > bBoxAngles[2]) {
            y = '.3em';
            tx = -offset;
            ty = 0;
            textAnchor = 'end';
        } else if (angle < bBoxAngles[0]) {
            y = '.6em';
            tx = 0;
            ty = offset;
            if (autoOrient) {
                orientAngle = 90;
                textAnchor = 'start';
            } else {
                textAnchor = 'middle';
            }
        } else if (angle < bBoxAngles[3]) {
            y = '.3em';
            tx = offset;
            ty = 0;
            textAnchor = 'start';
        } else {
            y = '0em';
            tx = 0;
            ty = -offset;
            if (autoOrient) {
                orientAngle = -90;
                textAnchor = 'start';
            } else {
                textAnchor = 'middle';
            }
        }

        var round = Math.round;
        return labelAttributes({
            x: round(tx),
            y: round(ty),
            angle: orientAngle,
            attrs: {
                '.': {
                    y: y,
                    'text-anchor': textAnchor
                }
            }
        });
    }

    function radialLayout(portCenterOffset, autoOrient, opt) {

        opt = util.defaults({}, opt, { offset: 20 });

        var origin = g.point(0, 0);
        var angle = -portCenterOffset.theta(origin);
        var orientAngle = angle;
        var offset = portCenterOffset.clone()
            .move(origin, opt.offset)
            .difference(portCenterOffset)
            .round();

        var y = '.3em';
        var textAnchor;

        if ((angle + 90) % 180 === 0) {
            textAnchor = autoOrient ? 'end' : 'middle';
            if (!autoOrient && angle === -270) {
                y = '0em';
            }
        } else if (angle > -270 && angle < -90) {
            textAnchor = 'start';
            orientAngle = angle - 180;
        } else {
            textAnchor = 'end';
        }

        var round = Math.round;
        return labelAttributes({
            x: round(offset.x),
            y: round(offset.y),
            angle: autoOrient ? orientAngle : 0,
            attrs: {
                '.': {
                    y: y,
                    'text-anchor': textAnchor
                }
            }
        });
    }

    joint.layout.PortLabel = {

        manual: function(portPosition, elBBox, opt) {
            return labelAttributes(opt, portPosition)
        },

        left: function(portPosition, elBBox, opt) {
            return labelAttributes(opt, { x: -15, attrs: { '.': { y: '.3em', 'text-anchor': 'end' } } });
        },

        right: function(portPosition, elBBox, opt) {
            return labelAttributes(opt, { x: 15, attrs: { '.': { y: '.3em', 'text-anchor': 'start' } } });
        },

        top: function(portPosition, elBBox, opt) {
            return labelAttributes(opt, { y: -15, attrs: { '.': { 'text-anchor': 'middle' } } });
        },

        bottom: function(portPosition, elBBox, opt) {
            return labelAttributes(opt, { y: 15, attrs: { '.': { y: '.6em', 'text-anchor': 'middle' } } });
        },

        outsideOriented: function(portPosition, elBBox, opt) {
            return outsideLayout(portPosition, elBBox, true, opt);
        },

        outside: function(portPosition, elBBox, opt) {
            return outsideLayout(portPosition, elBBox, false, opt);
        },

        insideOriented: function(portPosition, elBBox, opt) {
            return insideLayout(portPosition, elBBox, true, opt);
        },

        inside: function(portPosition, elBBox, opt) {
            return insideLayout(portPosition, elBBox, false, opt);
        },

        radial: function(portPosition, elBBox, opt) {
            return radialLayout(portPosition.difference(elBBox.center()), false, opt);
        },

        radialOriented: function(portPosition, elBBox, opt) {
            return radialLayout(portPosition.difference(elBBox.center()), true, opt);
        }
    };

})(_, g, joint, joint.util);

joint.highlighters.addClass = {

    className: joint.util.addClassNamePrefix('highlighted'),

    /**
     * @param {joint.dia.CellView} cellView
     * @param {Element} magnetEl
     * @param {object=} opt
     */
    highlight: function(cellView, magnetEl, opt) {

        var options = opt || {};
        var className = options.className || this.className;
        V(magnetEl).addClass(className);
    },

    /**
     * @param {joint.dia.CellView} cellView
     * @param {Element} magnetEl
     * @param {object=} opt
     */
    unhighlight: function(cellView, magnetEl, opt) {

        var options = opt || {};
        var className = options.className || this.className;
        V(magnetEl).removeClass(className);
    }
};

joint.highlighters.opacity = {

    /**
     * @param {joint.dia.CellView} cellView
     * @param {Element} magnetEl
     */
    highlight: function(cellView, magnetEl) {

        V(magnetEl).addClass(joint.util.addClassNamePrefix('highlight-opacity'));
    },

    /**
     * @param {joint.dia.CellView} cellView
     * @param {Element} magnetEl
     */
    unhighlight: function(cellView, magnetEl) {

        V(magnetEl).removeClass(joint.util.addClassNamePrefix('highlight-opacity'));
    }
};

joint.highlighters.stroke = {

    defaultOptions: {
        padding: 3,
        rx: 0,
        ry: 0,
        attrs: {
            'stroke-width': 3,
            stroke: '#FEB663'
        }
    },

    _views: {},

    getHighlighterId: function(magnetEl, opt) {

        return magnetEl.id + JSON.stringify(opt);
    },

    removeHighlighter: function(id) {
        if (this._views[id]) {
            this._views[id].remove();
            this._views[id] = null;
        }
    },

    /**
     * @param {joint.dia.CellView} cellView
     * @param {Element} magnetEl
     * @param {object=} opt
     */
    highlight: function(cellView, magnetEl, opt) {

        var id = this.getHighlighterId(magnetEl, opt);

        // Only highlight once.
        if (this._views[id]) return;

        var options = joint.util.defaults(opt || {}, this.defaultOptions);

        var magnetVel = V(magnetEl);
        var magnetBBox;

        try {

            var pathData = magnetVel.convertToPathData();

        } catch (error) {

            // Failed to get path data from magnet element.
            // Draw a rectangle around the entire cell view instead.
            magnetBBox = magnetVel.bbox(true/* without transforms */);
            pathData = V.rectToPath(joint.util.assign({}, options, magnetBBox));
        }

        var highlightVel = V('path').attr({
            d: pathData,
            'pointer-events': 'none',
            'vector-effect': 'non-scaling-stroke',
            'fill': 'none'
        }).attr(options.attrs);

        var highlightMatrix = magnetVel.getTransformToElement(cellView.el);

        // Add padding to the highlight element.
        var padding = options.padding;
        if (padding) {

            magnetBBox || (magnetBBox = magnetVel.bbox(true));

            var cx = magnetBBox.x + (magnetBBox.width / 2);
            var cy = magnetBBox.y + (magnetBBox.height / 2);

            magnetBBox = V.transformRect(magnetBBox, highlightMatrix);

            var width = Math.max(magnetBBox.width, 1);
            var height = Math.max(magnetBBox.height, 1);
            var sx = (width + padding) / width;
            var sy = (height + padding) / height;

            var paddingMatrix = V.createSVGMatrix({
                a: sx,
                b: 0,
                c: 0,
                d: sy,
                e: cx - sx * cx,
                f: cy - sy * cy
            });

            highlightMatrix = highlightMatrix.multiply(paddingMatrix);
        }

        highlightVel.transform(highlightMatrix);

        // joint.mvc.View will handle the theme class name and joint class name prefix.
        var highlightView = this._views[id] = new joint.mvc.View({
            svgElement: true,
            className: 'highlight-stroke',
            el: highlightVel.node
        });

        // Remove the highlight view when the cell is removed from the graph.
        var removeHandler = this.removeHighlighter.bind(this, id);
        var cell = cellView.model;
        highlightView.listenTo(cell, 'remove', removeHandler);
        highlightView.listenTo(cell.graph, 'reset', removeHandler);

        cellView.vel.append(highlightVel);
    },

    /**
     * @param {joint.dia.CellView} cellView
     * @param {Element} magnetEl
     * @param {object=} opt
     */
    unhighlight: function(cellView, magnetEl, opt) {

        this.removeHighlighter(this.getHighlighterId(magnetEl, opt));
    }
};


    joint.g = g;
    joint.V = joint.Vectorizer = V;

    return joint;

}));