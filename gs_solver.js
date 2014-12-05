/* File: gs_solver.js
 * Contains a Gauss-Seidel relaxation solver for use throughout
 * the simulation.
 */


/* GSSolver is the solver object. This object is tuned specifically
 *  for acting as a linear solver to the fluid simulator.
 * NOTE: currently tuned for the 3D array data structures, using a
 *  z-index of 1 for all arrays.
 * Parameters:
 *  nX      - number of values in the x-axis.
 *  nY      - number of values in the y-axis.
 *  n_iters - max number of iterations to run.
 */
function GSSolver(nX, nY, n_iters) {
    this.nX = nX;
    this.nY = nY;
    this.n_iters = n_iters;

    // Modify the number of iterations that the solver will run for.
    this.setNumIterations = function(n_iters) {
        this.n_iters = n_iters;
    }

    // Solve for 2D array "x" given 2D array "b" and scalar "a".
    // "x" will have the resulting value.
    this.solve = function(x, b, a) {
        // TODO - check for convergence to quit early?
        // run n_iters times
        var div = 1 / (1 + 4*a);
        for(var iter=0; iter<this.n_iters; iter++) {
            for(var i=1; i<=this.nX; i++) {
                for(var j=1; j<=this.nY; j++) {
                    x[i][j][1] = div*(b[i][j][1]
                                      + a*(x[i-1][j][1] + x[i+1][j][1]
                                         + x[i][j-1][1] + x[i][j+1][1]));
                }
            }
        }
    {
}
