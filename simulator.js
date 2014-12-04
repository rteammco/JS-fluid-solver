/* File: simulator.js
 * The Simulator object maintains the Grid object and all of the
 * simulation values, as well as the main algorithm steps.
 */


X_DIM = 0;
Y_DIM = 1;
Z_DIM = 2;

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
    // bMode is the boundary mode for setBoundary().
    this.diffuse = function(X, X0, k, bMode) {
        var a = this.timeStep * k * this.grid.nX * this.grid.nY;
        for(var k=0; k<20; k++) {
            for(var i=1; i<=this.grid.nX; i++) {
                for(var j=1; j<=this.grid.nY; j++) {
                    X[i][j] = (X0[i][j] + a*(X[i-1][j] + X[i+1][j] +
                                             X[i][j-1] + X[i][j+1])
                              ) / (1 + 4*a);
                }
            }
            this.setBoundary(X, bMode);
        }
    }

    // Sets the fields in D to be the values of D0 flowing in the direction
    // given by velocity V (a multi-dimensional velocity field).
    // bMode is the boundary mode for setBoundary().
    this.advect = function(D, D0, V, bMode) {
        var dX = this.grid.nX;// * this.timeStep; TODO?
        var dY = this.grid.nY;// * this.timeStep; TODO?
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
        this.setBoundary(D, bMode);
    }

    // Project step forces velocities to be mass-conserving.
    this.project = function(vel, buf) { // u v p div
        var Lx = 1.0 / this.grid.nX;
        var Ly = 1.0 / this.grid.nY;
        var p = buf[X_DIM];
        var div = buf[Y_DIM];
        
        for(var i=1; i<=this.grid.nX; i++) {
            for(var j=1; j<=this.grid.nY; j++) {
                div[i][j] = -0.5*(Lx*(vel[X_DIM][i+1][j] - vel[X_DIM][i-1][j]) +
                                  Ly*(vel[Y_DIM][i][j+1] - vel[Y_DIM][i][j-1]));
                p[i][j] = 0;
            }
        }
        this.setBoundary(div);
        this.setBoundary(p);

        for(var iter=0; iter<20; iter++) {
            for(var i=1; i<=this.grid.nX; i++) {
                for(var j=1; j<=this.grid.nY; j++) {
                    p[i][j] = (div[i][j]
                               + p[i-1][j] + p[i+1][j]
                               + p[i][j-1] + p[i][j+1]
                              ) / 4;
                }
            }
            this.setBoundary(p);
        }

        for(var i=1; i<=this.grid.nX; i++) {
            for(var j=1; j<=this.grid.nY; j++) {
                vel[X_DIM][i][j] -= 0.5*(p[i+1][j] - p[i-1][j]) / Lx;
                vel[Y_DIM][i][j] -= 0.5*(p[i][j+1] - p[i][j-1]) / Ly;
            }
        }
        this.setBoundary(vel[X_DIM], BOUNDARY_OPPOSE_X);
        this.setBoundary(vel[Y_DIM], BOUNDARY_OPPOSE_Y);
    }

    // Sets the values of X on the boundary cells (inactive in the actual
    // simulation visualization) to the appropriate values based on mode.
    // mode:
    //  BOUNDARY_MIRROR   => all border values will be copied from the
    //      closest inner neighboring cell.
    //  BOUNDARY_OPPOSE_X => the left and right edges will have inverse
    //      values of the closest inner neighors.
    //  BOUNDARY_OPPOSE_Y => the top and bottom edges will have inverse
    //      values of the closest inner neighbors.
    this.setBoundary = function(X, mode = BOUNDARY_MIRROR) {
        // index 1 and "last" are the endpoints of the active grid
        var lastX = this.grid.nX;
        var lastY = this.grid.nY;
        // index 0 and "edge" are the border cells we're updating
        var edgeX = lastX + 1;
        var edgeY = lastY + 1;
        // update left and right edges
        for(var j=1; j<=lastY; j++) {
            if(mode == BOUNDARY_OPPOSE_X) {
                X[0][j] = -X[1][j];
                X[edgeX][j] = -X[lastX][j];
            }
            else {
                X[0][j] = X[1][j];
                X[edgeX][j] = X[lastX][j];
            }
        }
        // update top and bottom edges
        for(var i=1; i<=lastX; i++) {
            if(mode == BOUNDARY_OPPOSE_Y) {
                X[i][0] = -X[i][1];
                X[i][edgeY] = -X[i][lastY];
            }
            else {
                X[i][0] = X[i][1];
                X[i][edgeY] = X[i][lastY];
            }
        }
        // update corners to be averages of their nearest edge neighbors
        X[0][0]         = 0.5*(X[1][0] + X[0][1]);
        X[0][edgeY]     = 0.5*(X[1][edgeY] + X[0][lastY]);
        X[edgeX][0]     = 0.5*(X[lastX][0] + X[edgeX][1]);
        X[edgeX][edgeY] = 0.5*(X[lastX][edgeY] + X[edgeX][lastY]);
    }

    // Does one velocity field update. TODO - loop dimensions
    this.vStep = function() {
        this.addSource(this.grid.vel[X_DIM],
                       this.grid.prev_vel[X_DIM]);
        this.addSource(this.grid.vel[Y_DIM],
                       this.grid.prev_vel[Y_DIM]);
        this.grid.swapV();
        this.diffuse(this.grid.vel[X_DIM],
                     this.grid.prev_vel[X_DIM],
                     this.visc, BOUNDARY_OPPOSE_X);
        this.diffuse(this.grid.vel[Y_DIM],
                     this.grid.prev_vel[Y_DIM],
                     this.visc, BOUNDARY_OPPOSE_Y);
        this.project(this.grid.vel, this.grid.prev_vel);
        this.grid.swapV();
        this.advect(this.grid.vel[X_DIM],
                    this.grid.prev_vel[X_DIM],
                    this.grid.vel, BOUNDARY_OPPOSE_X);
        this.advect(this.grid.vel[Y_DIM],
                    this.grid.prev_vel[Y_DIM],
                    this.grid.vel, BOUNDARY_OPPOSE_Y);
        this.project(this.grid.vel, this.grid.prev_vel);
    }

    // Does one scalar field update.
    this.dStep = function() {
        this.addSource(this.grid.dens, this.grid.prev_dens);
        this.grid.swapD();
        this.diffuse(this.grid.dens, this.grid.prev_dens,
                     this.diff, BOUNDARY_MIRROR);
        this.grid.swapD();
        this.advect(this.grid.dens, this.grid.prev_dens,
                    this.grid.vel, BOUNDARY_MIRROR);
        
    }

    // Take one step in the simulation.
    this.step = function(ctx) {
        this.grid.clearPrev();
        this.vStep();
        this.dStep();
        this.grid.render(ctx, false, true);
    }

    // When the user clicks, interface with the stuff.
    this.registerClick = function(x, y) {
        this.grid.registerClick(x, y);
    }
}
