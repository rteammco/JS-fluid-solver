/* File: simulator.js
 * The Simulator object maintains the Grid object and all of the
 * simulation values, as well as the main algorithm steps.
 */


X_DIM = 0;
Y_DIM = 1;

BOUNDARY_MIRROR = 0;
BOUNDARY_OPPOSE_X = 1;
BOUNDARY_OPPOSE_Y = 2;

/* The Simulator object provides an API for running the simulation using
 * the resources made available by the Grid data structure.
 * Parameters:
 *      N - the size of the grid (N by N practical grid).
 *      width - the width of the grid region.
 *      height - the height of the grid region.
 *      visc - the viscocity constant.
 *      diff - the diffusion constant.
 *      timeStep - the time step.
 */
function Simulator(N, width, height, visc, diff, timeStep) {
    this.diff = diff; // diffusion constant
    this.visc = visc; // fluid viscosity
    this.timeStep = timeStep;     // time step

    // initialize the grid structure
    this.grid = new Grid(N, N, width, height);

    // To each element of array X, adds the respective element of force
    // F (also an array) multiplied by the time step.
    this.addSource = function(X, F) {
        for(var i=0; i<this.grid.nX; i++)
            for(var j=0; j<this.grid.nY; j++)
                X[i][j] += this.timeStep * F[i][j];
    }

    // Sets the values of vector X to the "diffused" values from X0.
    // That is, the values of X "leak in" to and "leak out" of all
    // neighboring cells.
    this.diffuse = function(X, X0) {
        var a = this.timeStep * this.diff * this.grid.nX * this.grid.nY;
        for(var k=0; k<20; k++) {
            for(var i=1; i<=this.grid.nX; i++) {
                for(var j=1; j<=this.grid.nY; j++) {
                    X[i][j] = (X0[i][j] + a*(X[i-1][j] + X[i+1][j] +
                                             X[i][j-1] + X[i][j+1])
                              ) / (1 + 4*a);
                }
            }
        }
        // TODO - boundary
    }

    // Sets the fields in D to be the values of D0 flowing in the direction
    // given by velocity V (a multi-dimensional velocity field).
    this.advect = function(D, D0, V) {
        var dX = this.grid.nX * this.timeStep;
        var dY = this.grid.nY * this.timeStep;
        for(var i=1; i<=this.grid.nX; i++) {
            for(var j=1; j<=this.grid.nY; j++) {
                // get resulting x coordinate cell
                var x = i - dX * V[X_DIM][i][j];
                if(x < 0.5)
                    x = 0.5;
                if(x > this.grid.nX + 0.5)
                    x = this.grid.nX + 0.5;
                var i0 = Math.floor(x);
                var i1 = i0 + 1;
                // get resulting y coodinate cell
                var y = j - dY * V[Y_DIM][i][j];
                if(y < 0.5)
                    y = 0.5;
                if(y > this.grid.nY + 0.5)
                    y = this.grid.nY + 0.5;
                var j0 = Math.floor(y);
                var j1 = j0 + 1;
                // bilinear interopolation:
                var s1 = x - i0;
                var s0 = 1 - s1;
                var t1 = y - j0;
                var t0 = 1 - t1;
                D[i][j] = s0*(t0*D0[i0][j0] + t1*D0[i0][j1]) +
                        + s1*(t0*D0[i1][j0] + t1*D0[i1][j1]);
            }
        }
        // TODO - boundary
    }

    this.project = function(U, P, DIV) {
        var Lx = 1.0 / this.grid.nX;
        var Ly = 1.0 / this.grid.nY;
        
        for(var i=1; i<=this.grid.nX; i++) {
            for(var j=1; j<=this.grid.nY; j++) {
                //TODO
            }
        }
    }

    // Updates and fixes the boundary cells.
    this.setBoundary = function(X, mode = BOUNDARY_MIRROR) {
        for(var i=1; i<=(X.length-2); i++) {
            if(mode == BOUNDARY_OPPOSE_X) {
                // TODO
            }
        }
    }

    // Does one velocity field update.
    this.vStep = function(U1, U0, visc, F, dT) {
        // TODO
    }

    // Does one scalar field update.
    this.dStep = function() {
        this.addSource(this.grid.densities, this.grid.prev_densities);
        this.grid.swapD();
        this.diffuse(this.grid.densities, this.grid.prev_densities, this.diff);
        this.grid.swapD();
        this.advect(this.grid.densities, this.grid.prev_densities, this.grid.velocities);
        
    }

    // Take one step in the simulation.
    this.step = function(ctx) {
        this.vStep();
        this.dStep();
        this.grid.render(ctx);
    }

    // When the user clicks, interface with the stuff.
    this.registerClick = function(x, y) {
        this.grid.registerClick(x, y);
    }
}
