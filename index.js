/*
Copyright (c) Lauri Rooden <lauri@rooden.ee>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

const fs = require("fs");

var lbels = [];
var data = [];
var cols = 0;
var isInIO = false;

/** Compare function for natural sorting */
var naturalCompare = function (a, b) {
    var i,
        codeA,
        codeB = 1,
        posA = 0,
        posB = 0,
        alphabet = String.alphabet;

    function getCode(str, pos, code) {
        if (code) {
            for (i = pos; (code = getCode(str, i)), code < 76 && code > 65; ) ++i;
            return +str.slice(pos - 1, i);
        }
        code = alphabet && alphabet.indexOf(str.charAt(pos));
        return code > -1
            ? code + 76
            : ((code = str.charCodeAt(pos) || 0), code < 45 || code > 127)
            ? code
            : code < 46
            ? 65 // -
            : code < 48
            ? code - 1
            : code < 58
            ? code + 18 // 0-9
            : code < 65
            ? code - 11
            : code < 91
            ? code + 11 // A-Z
            : code < 97
            ? code - 37
            : code < 123
            ? code + 5 // a-z
            : code - 63;
    }

    if ((a += "") != (b += ""))
        for (; codeB; ) {
            codeA = getCode(a, posA++);
            codeB = getCode(b, posB++);

            if (codeA < 76 && codeB < 76 && codeA > 66 && codeB > 66) {
                codeA = getCode(a, posA, posA);
                codeB = getCode(b, posB, (posA = i));
                posB = i;
            }

            if (codeA != codeB) return codeA < codeB ? -1 : 1;
        }
    return 0;
};

/**
 * Improved version of the typeof operator. Not part of the package.
 * @param {*} operand - The object or primitive whose type is to be returned.
 * @returns {string} - Operand's type
 */
function typeOf(operand) {
    return {}.toString
        .call(operand)
        .match(/\s([a-zA-Z]+)/)[1]
        .toLowerCase();
}

/**
 * Custom parse function for storing values as strings. Not part of the package.
 * @param {*} operand - The object or primitive to be parsed.
 * @returns {string} - Parsed operand.
 */
function parseCustom(operand) {
    if (typeOf(operand) == "object") {
        let result = [];
        for (let j in operand) {
            result.push(`${j}:${operand[j]}`);
        }
        return result.join(", ");
    } else if (typeOf(operand) == "array") {
        return operand.join(", ");
    } else {
        return operand.toString();
    }
}

/** Generate IDs for each `data` element. */
function genId() {
    let id = 10000;

    for (let i = 0; i < data.length; i++) {
        data[i].splice(0, 1, ++id);
    }
}

/** Create the required files. Should be run for initialization and can be called anytime. */
function init() {
    fs.appendFileSync("dbs.lbel", "");
    fs.appendFileSync("dat.lbel", "");
}

/**
 * Create a label or labels in local memory. To be called along with init().
 * @param {(string|string[])} label - The name or names of the label or labels to create.
 */
function create(label) {
    if (arguments.length < 1) throw new TypeError("Missing arguments");
    
    if (typeOf(label) == "string") {
        let temp = ["id"];
        temp.push(label);
        lbels = temp;
    } else if (typeOf(label) == "array") {
        for (l of label) {
            if (typeOf(l) != "string") throw new TypeError(`Invalid data type: ${typeOf(l)}`);
        }
        label.splice(0, 0, "id");
        lbels = label;
    } else {
        throw new TypeError(`Invalid data type: ${typeOf(label)}`);
    }
    
    cols = lbels.length;
}

/**
 * Add a new column or columns to local memory.
 * @param {(string|string[])} col - Name or names of the column or columns to add.
 */
function addC(col) {
    if (arguments.length < 1) throw new TypeError("Missing arguments");

    let n = 1;
    if (typeOf(col) == "string") {
        lbels.push(col);
    } else if (typeOf(col) == "array") {
        for (c of col) {
            if (typeOf(c) != "string") throw new TypeError(`Invalid data type: ${typeOf(c)}`);
            lbels.push(c);
        }
        
        n = col.length;
    } else {
        throw new TypeError(`Invalid data type: ${typeOf(col)}`);
    }

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < data.length; j++) {
            data[j].push("");
        }
    }

    cols = lbels.length;
}

/**
 * Add a new row to local memory. Missing array elements will default to an empty string.
 * @param {Array} row - Row data.
 */
function addR(row) {
    if (arguments.length < 1) throw new TypeError("Missing arguments");
    if (typeOf(row) != "array") throw new TypeError(`Invalid data type: ${typeOf(row)}`);
    if (cols - 1 < row.length) throw new RangeError("Too many row elements provided");

    for (let i = 0; i < cols - row.length; i++) {
        row.push("");
    }
    
    row.splice(0, 0, 10000);
    data.push(row);
    genId();
}

/**
 * Delete the column or columns at the specified index or indices from local memory.
 * @param {(number|number[]|string|string[])} inx - Index or indices or label or labels of the column or columns to delete.
 */
function clearC(inx) {
    if (arguments.length < 1) throw new TypeError("Missing arguments");
    
    if (typeOf(inx) == "number") {
        if (!lbels[inx + 1]) throw new RangeError(`Index ${inx} out of range`);
        
        lbels.splice(inx + 1, 1);
        for (let i = 0; i < data.length; i++) {
            data[i].splice(inx + 1, 1);
        }
    } else if (typeOf(inx) == "string") {
        if (inx == "id") throw new RangeError("Cannot delete column: id");
        if (!lbels.includes(inx)) throw new RangeError(`Column not found: ${inx}`);
        
        let index = lbels.indexOf(inx);
        lbels.splice(index, 1);
        for (let i = 0; i < data.length; i++) {
            data[i].splice(index, 1);
        }
    } else if (typeOf(inx) == "array") {
        for (let i of inx) {
            if (typeOf(i) == "number") {
                if (!lbels[i + 1]) throw new RangeError(`Index ${i} out of range`);
                
                lbels.splice(i + 1, 1, "TO-DELETE");
                for (let j = 0; j < data.length; j++) {
                    data[j].splice(i + 1, 1, "TO-DELETE");
                }
            } else if (typeOf(i) == "string") {
                if (i == "id") throw new RangeError("Cannot delete column: id");
                if (!lbels.includes(i)) throw new RangeError(`Column not found: ${i}`);
                
                let index = lbels.indexOf(i);
                lbels.splice(index, 1, "TO-DELETE");
                for (let j = 0; j < data.length; j++) {
                    data[j].splice(index, 1, "TO-DELETE");
                }
            } else {
                throw new TypeError(`Invalid data type: ${typeOf(i)}`);
            }
        }
        
        lbels = lbels.filter((l) => l != "TO-DELETE");
        for (let i = 0; i < data.length; i++) {
            data[i] = data[i].filter((d) => d != "TO-DELETE");
        }
    } else {
        throw new TypeError(`Invalid data type: ${typeOf(inx)}`);
    }

    cols = lbels.length;
}

/**
 * Delete the row or rows at the specified index or indices from local memory.
 * @param {(number|number[])} inx - Index or indices of the row or rows to delete.
 */
function clearR(inx) {
    if (arguments.length < 1) throw new TypeError("Missing arguments");
    
    if (typeOf(inx) == "number") {
        if (!data[inx]) throw new RangeError(`Index ${inx} out of range`);
        
        data.splice(inx, 1);
    } else if (typeOf(inx) == "array") {
        for (let i of inx) {
            if (typeOf(i) != "number") throw new TypeError(`Invalid data type: ${typeOf(i)}`);
            if (!data[i]) throw new RangeError(`Index ${i} out of range`);
            
            data.splice(i, 1, "TO-DELETE");
        }
        
        data = data.filter((d) => d != "TO-DELETE");
    } else {
        throw new TypeError(`Invalid data type: ${typeOf(inx)}`);
    }

    genId();
}

/** Clear everything from local memory. */
function clearAll() {
    lbels = [];
    data = [];
    cols = 0;
}

/** Store the data from local memory in the database, clearing it. */
function store() {
    while (true) {
        if (!isInIO) break;
    }
    isInIO = true;

    for (let l of lbels) {
        fs.appendFileSync("dbs.lbel", l + "\n");
    }
    
    for (let d of data) {
        for (let i of d) {
            fs.appendFileSync("dat.lbel", parseCustom(i) + "\n");
        }
    }

    clearAll();
    isInIO = false;
}

/** Retrieve data from the database, storing it in local memory. */
function retrieve() {
    while (true) {
        if (!isInIO) break;
    }
    isInIO = true;

    lbels = fs.readFileSync("./dbs.lbel", "utf-8").split("\n").filter(Boolean);
    cols = lbels.length;

    let lines = fs.readFileSync("./dat.lbel", "utf-8").split("\n").filter(Boolean);
    data = [];

    let num = lines.length / cols;
    if (!isFinite(num)) throw new Error("No data to retrieve in the database");

    for (let i = 0; i < num; i++) {
        let row = [];
        for (let j = 0; j < cols; j++) {
            row.push(lines[j]);
        }
        
        lines.splice(0, cols);
        data.push(row);
    }

    isInIO = false;
}

/** Display the data from local memory in the form of a table. */
function view() {
    let view = [];
    for (let d of data) {
        let obj = {};
        lbels.forEach((l, i) => {
            obj[l] = parseCustom(d[i]);
        });
        view.push(obj);
    }

    console.table(view);
}

/**
 * Return certain column or columns from local memory.
 * @param {(number|number[]|string|string[])} inx - Index or indices or label or labels of the column or columns to return.
 * @param {boolean} [object=false] - Whether to return the column or columns data as an object or not.
 * @returns {(Array|Array[]|Object)} - Column or columns data.
 */
function returnC(inx, object = false) {
    if (arguments.length < 1) throw new TypeError("Missing arguments");
    
    if (typeOf(inx) == "number") {
        if (typeOf(object) != "boolean") throw new TypeError(`Invalid data type: ${typeOf(object)}`);
        if (!lbels[inx]) throw new RangeError(`Index ${inx} out of range`);
        
        let col = object ? {} : [lbels[inx]];
        if (object) {
            col[lbels[inx]] = [];
            for (let i = 0; i < data.length; i++) {
                col[lbels[inx]].push(data[i][inx]);
            }
        } else {
            for (let i = 0; i < data.length; i++) {
                col.push(data[i][inx]);
            }
        }
        
        return col;
    } else if (typeOf(inx) == "string") {
        if (typeOf(object) != "boolean") throw new TypeError(`Invalid data type: ${typeOf(object)}`);
        if (!lbels.includes(inx)) throw new RangeError(`Column not found: ${inx}`);
        
        let col = object ? {} : [inx];
        if (object) {
            col[inx] = [];
            for (let i = 0; i < data.length; i++) {
                col[inx].push(data[i][lbels.indexOf(inx)]);
            }
        } else {
            for (let i = 0; i < data.length; i++) {
                col.push(data[i][lbels.indexOf(inx)]);
            }
        }
        
        return col;
    } else if (typeOf(inx) == "array") {
        if (typeOf(object) != "boolean") throw new TypeError(`Invalid data type: ${typeOf(object)}`);
        
        let columns = object ? {} : [];
        for (let i of inx) {
            if (typeOf(i) == "number") {
                if (!lbels[i]) throw new RangeError(`Index ${i} out of range`);
                
                if (object) {
                    columns[lbels[i]] = [];
                    for (let j = 0; j < data.length; j++) {
                        columns[lbels[i]].push(data[j][i]);
                    }
                } else {
                    let col = [lbels[i]];
                    for (let j = 0; j < data.length; j++) {
                        col.push(data[j][i]);
                    }
                    
                    columns.push(col);
                }
            } else if (typeOf(i) == "string") {
                if (!lbels.includes(i)) throw new RangeError(`Column not found: ${i}`);
                
                if (object) {
                    columns[i] = [];
                    for (let j = 0; j < data.length; j++) {
                        columns[i].push(data[j][lbels.indexOf(i)]);
                    }
                } else {
                    let col = [i];
                    for (let j = 0; j < data.length; j++) {
                        col.push(data[j][lbels.indexOf(i)]);
                    }
                    
                    columns.push(col);
                }
            } else {
                throw new TypeError(`Invalid data type: ${typeOf(i)}`);
            }
        }
        
        return columns;
    } else {
        throw new TypeError(`Invalid data type: ${typeOf(inx)}`);
    }
}

/**
 * Return certain row or rows from local memory.
 * @param {(number|number[])} inx - Index or indices of the row or rows to return.
 * @returns {(Array|Array[])} - Row or rows data.
 */
function returnR(inx) {
    if (arguments.length < 1) throw new TypeError("Missing arguments");
    
    if (typeOf(inx) == "number") {
        if (!data[inx]) throw new RangeError(`Index ${inx} out of range`);
        
        return data[inx];
    } else if (typeOf(inx) == "array") {
        let rows = [];
        for (let i of inx) {
            if (typeOf(i) != "number") throw new TypeError(`Invalid data type: ${typeOf(i)}`);
            if (!data[i]) throw new RangeError(`Index ${i} out of range`);
            
            rows.push(data[i]);
        }
        
        return rows;
    } else {
        throw new TypeError(`Invalid data type: ${typeOf(inx)}`);
    }
}

/**
 * Update certain row in local memory. Missing array elements will default to an empty string.
 * @param {number} inx - Index of the row to update.
 * @param {Array} row - New row data.
 */
function updateR(inx, row) {
    if (arguments.length < 2) throw new TypeError("Missing arguments");
    if (typeOf(inx) != "number") throw new TypeError(`Invalid data type: ${typeOf(inx)}`);
    if (typeOf(row) != "array") throw new TypeError(`Invalid data type: ${typeOf(row)}`);
    if (!data[inx]) throw new RangeError(`Index ${inx} out of range`);
    if (cols - 1 < row.length) throw new RangeError("Too many row elements provided");

    for (let i = 0; i < cols - row.length; i++) {
        row.push("");
    }
    
    row.splice(0, 0, 10000);
    data[inx] = row;
    genId();
}

/**
 * Update a single item of certain row in local memory.
 * @param {number} inxR - Index of the row to access.
 * @param {number} inxI - Index of the item to update.
 * @param {*} item - New item data.
 */
function updateRi(inxR, inxI, item) {
    if (arguments.length < 3) throw new TypeError("Missing arguments");
    if (typeOf(inxR) != "number") throw new TypeError(`Invalid data type: ${typeOf(inxR)}`);
    if (typeOf(inxI) != "number") throw new TypeError(`Invalid data type: ${typeOf(inxI)}`);
    if (!data[inxR]) throw new RangeError(`Index ${inxR} out of range`);
    if (!data[inxR][inxI + 1]) throw new RangeError(`Index ${inxI} out of range`);

    data[inxR][inxI + 1] = item;
}

/**
 * Update certain column in local memory. Missing array elements will default to an empty string.
 * @param {(number|string)} inx - Index or label of the column to update.
 * @param {(Array|Object)} col - New column data.
 */
function updateC(inx, col) {
    if (arguments.length < 2) throw new TypeError("Missing arguments");
    
    if (typeOf(inx) == "number") {
        if (typeOf(col) == "array") {
            if (typeOf(col[0]) != "string") throw new TypeError(`Invalid data type: ${typeOf(col[0])}`);
            if (!lbels[inx + 1]) throw new RangeError(`Index ${inx} out of range`);
            if (data.length < col.length - 1) throw new RangeError("Too many column elements provided");
            
            let len = data.length - (col.length - 1);
            for (let i = 0; i < len; i++) {
                col.push("");
            }
            
            lbels.splice(inx + 1, 1, col.shift());
            
            for (let i = 0; i < data.length; i++) {
                data[i][inx + 1] = col[i];
            }
        } else if (typeOf(col) == "object") {
            if (!lbels[inx + 1]) throw new RangeError(`Index ${inx} out of range`);
            if (data.length < col[Object.keys(col)[0]].length) throw new RangeError("Too many column elements provided");
            
            let len = data.length - col[Object.keys(col)[0]].length;
            for (let i = 0; i < len; i++) {
                col[Object.keys(col)[0]].push("");
            }
            
            lbels.splice(inx + 1, 1, Object.keys(col)[0]);
            
            for (let i = 0; i < data.length; i++) {
                data[i][inx + 1] = col[Object.keys(col)[0]][i];
            }
        } else {
            throw new TypeError(`Invalid data type: ${typeOf(col)}`);
        }
    } else if (typeOf(inx) == "string") {
        if (typeOf(col) == "array") {
            if (typeOf(col[0]) != "string") throw new TypeError(`Invalid data type: ${typeOf(col[0])}`);
            if (inx == "id") throw new RangeError("Cannot update column: id");
            if (!lbels.includes(inx)) throw new RangeError(`Column not found: ${inx}`);
            if (data.length < col.length - 1) throw new RangeError("Too many column elements provided");
            
            let len = data.length - (col.length - 1);
            for (let i = 0; i < len; i++) {
                col.push("");
            }
            
            let label = col.shift();
            
            for (let i = 0; i < data.length; i++) {
                data[i][lbels.indexOf(inx)] = col[i];
            }
            
            lbels.splice(lbels.indexOf(inx), 1, label);
        } else if (typeOf(col) == "object") {
            if (inx == "id") throw new RangeError("Cannot update column: id");
            if (!lbels.includes(inx)) throw new RangeError(`Column not found: ${inx}`);
            if (data.length < col[Object.keys(col)[0]].length) throw new RangeError("Too many column elements provided");
            
            let len = data.length - col[Object.keys(col)[0]].length;
            for (let i = 0; i < len; i++) {
                col[Object.keys(col)[0]].push("");
            }
            
            for (let i = 0; i < data.length; i++) {
                data[i][lbels.indexOf(inx)] = col[Object.keys(col)[0]][i];
            }
            
            lbels.splice(lbels.indexOf(inx), 1, Object.keys(col)[0]);
        } else {
            throw new TypeError(`Invalid data type: ${typeOf(col)}`);
        }
    } else {
        throw new TypeError(`Invalid data type: ${typeOf(inx)}`);
    }
}

/**
 * Sort out certain column using a natural sort algorithm.
 * @param {(number|string)} inx - Index or label of the column to sort out.
 * @param {boolean} [reverse=false] - Whether to sort out the column in reverse order or not.
 */
function sortC(inx, reverse = false) {
    if (arguments.length < 1) throw new TypeError("Missing arguments");
    
    if (typeOf(inx) == "number") {
        if (typeOf(reverse) != "boolean") throw new TypeError(`Invalid data type: ${typeOf(reverse)}`);
        if (!lbels[inx + 1]) throw new RangeError(`Index ${inx} out of range`);
        
        let col = [];
        for (let i = 0; i < data.length; i++) {
            col.push(data[i][inx + 1]);
        }

        col.sort(naturalCompare);
        if (reverse) col.reverse();

        for (let i = 0; i < data.length; i++) {
            data[i][inx + 1] = col[i];
        }
    } else if (typeOf(inx) == "string") {
        if (typeOf(reverse) != "boolean") throw new TypeError(`Invalid data type: ${typeOf(reverse)}`);
        if (inx == "id") throw new RangeError("Cannot sort out column: id");
        if (!lbels.includes(inx)) throw new RangeError(`Column not found: ${inx}`);
        
        let col = [];
        for (let i = 0; i < data.length; i++) {
            col.push(data[i][lbels.indexOf(inx)]);
        }

        col.sort(naturalCompare);
        if (reverse) col.reverse();

        for (let i = 0; i < data.length; i++) {
            data[i][lbels.indexOf(inx)] = col[i];
        }
    } else {
        throw new TypeError(`Invalid data type: ${typeOf(inx)}`);
    }
}

module.exports = {
    init: init,
    create: create,
    addC: addC,
    addR: addR,
    clearC: clearC,
    clearR: clearR,
    clearAll: clearAll,
    store: store,
    retrieve: retrieve,
    view: view,
    returnC: returnC,
    returnR: returnR,
    updateR: updateR,
    updateRi: updateRi,
    updateC: updateC,
    sortC: sortC
};
