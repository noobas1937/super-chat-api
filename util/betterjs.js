if (![].removeAt) {
    Array.prototype.removeAt = function (index) {
        if (index >= 0 && index < this.length) {
            var item = this[index];
            this.splice(index, 1);
            return item;
        } else {
            return undefined;
        }
    };
}
if (![].insertAt) {
    Array.prototype.insertAt = function (index, item) {
        if (index >= this.length) {
            this.push(item);
        } else {
            this.splice(index, 1, item, this[index]);
        }
    };
}
if (![].extend) {
    Array.prototype.extend = function (items) {
        for (var i = 0; i < items.length; ++i) {
            this.push(items[i]);
        }
        return this;
    };
}
if (![].remove) {
    Array.prototype.remove = function (item) {
        var index = this.indexOf(item);
        if (index >= 0) {
            this.removeAt(index);
        }
        return this;
    };
}
String.prototype.lpad = function (padString, length) {
    var str = this;
    while (str.length < length) {
        str = padString + str;
    }
    return str;
};
if (![].subItems) {
    Array.prototype.subItems = function (start, end) {
        if (end === undefined) {
            end = 0;
        }
        if (start === undefined) {
            start = 0;
        }
        if (end == 0) {
            end = this.length;
        }
        var result = [];
        for (var i = start; i < end; ++i) {
            if (i >= 0 && i < this.length) {
                result.push(this[i]);
            }
        }
        return result;
    };
}
if (![].contains) {
    Array.prototype.contains = function (item) {
        for (var i = 0; i < this.length; ++i) {
            if (this[i] === item) {
                return true;
            }
        }
        return false;
    };
}
Array.prototype.join = function (sep, attr) {
    sep = sep || '';
    var result = '';
    for (var i = 0; i < this.length; ++i) {
        if (i > 0) {
            result += sep;
        }

        if (this[i] !== null && this[i] !== undefined) {
            if (attr) {
                result += this[i][attr];
            } else {
                result += this[i].toString();
            }
        }
    }
    return result;
};
if (Array.prototype.clear === undefined) {
    Array.prototype.clear = function () {
        this.length = 0;
    };
}
if (Array.prototype.last === undefined) {
    Array.prototype.last = function () {
        return this.length > 0 ? this[this.length - 1] : null;
    };
}
if (Array.prototype.endsWith === undefined) {
    Array.prototype.endsWith = function (str) {
        if (!str) {
            return true;
        }
        return this.indexOf(str) + str.length === this.length;
    };
}