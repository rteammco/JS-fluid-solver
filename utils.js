/* File: utils.js
/* Provides functions and tools to be used by various other classes.
 */


/* Generates a preallocated array of size n filled with zeros. */
function zeros(n) {
    return Array.apply(null, new Array(n)).map(Number.prototype.valueOf, 0);
}


/* Generates a preallocated 2D array of size n by m filled with zeros. */
function zeros2d(n, m) {
    var arr = new Array();
    for(var i=0; i<n; i++)
        arr.push(zeros(m));
    return arr;
}


/* Generates a preallocated 3D array of size n by m by l filled with zeros. */
function zeros3d(n, m, l) {
    var arr = new Array();
    for(var i=0; i<n; i++)
        arr.push(zeros2d(m, l));
    return arr;
}


/* Generates a preallocated 4D zero-array of size n by m by l by k. */
function zeros4d(n, m, l, k) {
    var arr = new Array();
    for(var i=0; i<n; i++)
        arr.push(zeros3d(m, l, k));
    return arr;
}
