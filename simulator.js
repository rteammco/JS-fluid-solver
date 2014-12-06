/* File: simulator.js
 * The Simulator object maintains the Grid object and all of the
 * simulation values, as well as the main algorithm steps.
 */


BOUNDARY_MIRROR = 0;
BOUNDARY_OPPOSE_X = 1;
BOUNDARY_OPPOSE_Y = 2;


/* The Simulator object provides an API for running the simulation using
 * the resources made available by the Grid data structure.
 * Parameters:
 *      ui - a UI object that keeps track of the GUI and user interaction,
 *           and also provides all of the sim parameters.
 */
function Simulator(ui) {
    this.ui = ui;
    this.timeStep = this.ui.dT;
    // TODO - change ui.___ to getter functions.
    this.grid = new Grid([this.ui.grid_cols, this.ui.grid_rows, 1],
                         [this.ui.width, this.ui.height, 0], 2, ui);

    // To each element of array dest adds the respective element of the
    // source (also an array) multiplied by the time step.
    // Use to add source arrays for velocity and density.
    this.addSource = function(dest, source) {
        for(var i=0; i<this.grid.N[X_DIM]+2; i++)
            for(var j=0; j<this.grid.N[Y_DIM]+2; j++)
                for(var k=0; k<this.grid.N[Z_DIM]+2; k++)
                    dest[i][j][k] += this.timeStep * source[i][j][k];
    }

    // Sets the values of vector cur to the "diffused" values.
    // That is, the values of cur "leak in" to and "leak out" of all
    // neighboring cells.
    // k is the diffusion constant (diff or visc, depending)
    // bMode is the boundary mode for setBoundary().
    this.diffuse = function(cur, prev, k, bMode) {
        //var a = this.timeStep * k * this.grid.N[X_DIM] * this.grid.N[Y_DIM];
        var a = this.timeStep * k * Math.sqrt(this.ui.width * this.ui.height);
        for(var iter=0; iter<this.ui.solver_iters; iter++) {
            for(var i=1; i<=this.grid.N[X_DIM]; i++) {
                for(var j=1; j<=this.grid.N[Y_DIM]; j++) {
                    cur[i][j][1] = (prev[i][j][1]
                                    + a*(cur[i-1][j][1] + cur[i+1][j][1] +
                                         cur[i][j-1][1] + cur[i][j+1][1])
                              ) / (1 + 4*a);
                }
            }
            this.setBoundary(cur, bMode);
        }
    }

    // Sets the fields in cur to be the values of prev flowing in the
    // direction given by velocity vel (a multi-dimensional velocity field).
    // bMode is the boundary mode for setBoundary().
    this.advect = function(cur, prev, vel, bMode) {
        var lX = this.grid.len_cells[X_DIM];
        var lY = this.grid.len_cells[Y_DIM];
        for(var i=1; i<=this.grid.N[X_DIM]; i++) {
            for(var j=1; j<=this.grid.N[Y_DIM]; j++) {
                // get resulting x coordinate cell after backtracking by vel
                var start_x = i * lX;
                var end_x = start_x - this.timeStep * vel[X_DIM][i][j][1];
                if(end_x < 0)
                    end_x = 0;
                if(end_x > this.grid.N[X_DIM] * lX)
                    end_x = this.grid.N[X_DIM] * lX;
                var i0 = Math.floor(end_x / lX + 0.000001); // NOTE - rounding error
                var i1 = i0 + 1;
                // get resulting y coodinate cell after backtracking by vel
                var start_y = j * lY;
                var end_y = start_y - this.timeStep * vel[Y_DIM][i][j][1];
                if(end_y < 0)
                    end_y = 0;
                if(end_y > this.grid.N[Y_DIM] * lY)
                    end_y = this.grid.N[Y_DIM] * lY;
                var j0 = Math.floor(end_y / lY + 0.000001); // NOTE - rounding error
                var j1 = j0 + 1;
                // bilinear interopolation:
                var s1 = (end_x - start_x)/lX;
                var s0 = 1 - s1;
                var t1 = (end_y - start_y)/lY;
                var t0 = 1 - t1;
                cur[i][j][1] = s0*(t0*prev[i0][j0][1] + t1*prev[i0][j1][1]) +
                               s1*(t0*prev[i1][j0][1] + t1*prev[i1][j1][1]);
            }
        }
        this.setBoundary(cur, bMode);
    }

    // Project step forces velocities to be mass-conserving.
    this.project = function(vel, buf) {
        var Lx = 1.0 / this.ui.width;
        var Ly = 1.0 / this.ui.height;
        var p = buf[X_DIM];
        var div = buf[Y_DIM];
        for(var i=1; i<=this.grid.N[X_DIM]; i++) {
            for(var j=1; j<=this.grid.N[Y_DIM]; j++) {
                div[i][j][1] = -0.5*(Lx*(vel[X_DIM][i+1][j][1] - vel[X_DIM][i-1][j][1]) +
                                     Ly*(vel[Y_DIM][i][j+1][1] - vel[Y_DIM][i][j-1][1]));
                p[i][j][1] = 0;
            }
        }
        this.setBoundary(div, BOUNDARY_MIRROR);
        this.setBoundary(p, BOUNDARY_MIRROR);
        // TODO - move to a separate function (shared w/ diffuse)
        for(var iter=0; iter<this.ui.solver_iters; iter++) {
            for(var i=1; i<=this.grid.N[X_DIM]; i++) {
                for(var j=1; j<=this.grid.N[Y_DIM]; j++) {
                    p[i][j][1] = (div[i][j][1]
                                  + p[i-1][j][1] + p[i+1][j][1]
                                  + p[i][j-1][1] + p[i][j+1][1]
                                 ) / 4;
                }
            }
            this.setBoundary(p, BOUNDARY_MIRROR);
        }
        for(var i=1; i<=this.grid.N[X_DIM]; i++) {
            for(var j=1; j<=this.grid.N[Y_DIM]; j++) {
                vel[X_DIM][i][j][1] -= 0.5*(p[i+1][j][1] - p[i-1][j][1]) / Lx;
                vel[Y_DIM][i][j][1] -= 0.5*(p[i][j+1][1] - p[i][j-1][1]) / Ly;
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
    this.setBoundary = function(X, mode) {
        // index 1 and "last" are the endpoints of the active grid
        var lastX = this.grid.N[X_DIM];
        var lastY = this.grid.N[Y_DIM];
        // index 0 and "edge" are the border cells we're updating
        var edgeX = lastX + 1;
        var edgeY = lastY + 1;
        // update left and right edges
        for(var j=1; j<=lastY; j++) {
            if(mode == BOUNDARY_OPPOSE_X) {
                X[0][j][1] = -X[1][j][1];
                X[edgeX][j][1] = -X[lastX][j][1];
            }
            else {
                X[0][j][1] = X[1][j][1];
                X[edgeX][j][1] = X[lastX][j][1];
            }
        }
        // update top and bottom edges
        for(var i=1; i<=lastX; i++) {
            if(mode == BOUNDARY_OPPOSE_Y) {
                X[i][0][1] = -X[i][1][1];
                X[i][edgeY][1] = -X[i][lastY][1];
            }
            else {
                X[i][0][1] = X[i][1][1];
                X[i][edgeY][1] = X[i][lastY][1];
            }
        }
        // update corners to be averages of their nearest edge neighbors
        X[0][0][1]         = 0.5*(X[1][0][1] + X[0][1][1]);
        X[0][edgeY][1]     = 0.5*(X[1][edgeY][1] + X[0][lastY][1]);
        X[edgeX][0][1]     = 0.5*(X[lastX][0][1] + X[edgeX][1][1]);
        X[edgeX][edgeY][1] = 0.5*(X[lastX][edgeY][1] + X[edgeX][lastY][1]);
    }

    // Does one velocity field update.
    this.vStep = function() {
        for(var dim=0; dim<N_DIMS; dim++) {
            //if(keep_prev)
            this.addSource(this.grid.vel[dim], this.grid.prev_vel[dim]);
            this.addSource(this.grid.vel[dim], this.grid.src_vel[dim]);
        }
        this.grid.swapV();
        for(var dim=0; dim<N_DIMS; dim++)
            this.diffuse(this.grid.vel[dim], this.grid.prev_vel[dim],
                         this.ui.visc, dim+1); // TODO - boundary dim
        this.project(this.grid.vel, this.grid.prev_vel);
        this.grid.swapV();
        for(var dim=0; dim<N_DIMS; dim++)
            this.advect(this.grid.vel[dim], this.grid.prev_vel[dim],
                        this.grid.vel, dim+1); // TODO - boundary dim
        this.project(this.grid.vel, this.grid.prev_vel);
    }

    // Does one scalar field update.
    this.dStep = function() {
        //if(keep_prev)
        this.addSource(this.grid.dens, this.grid.prev_dens);
        this.addSource(this.grid.dens, this.grid.src_dens);
        this.grid.swapD();
        this.diffuse(this.grid.dens, this.grid.prev_dens,
                     this.ui.diff, BOUNDARY_MIRROR);
        this.grid.swapD();
        this.advect(this.grid.dens, this.grid.prev_dens,
                    this.grid.vel, BOUNDARY_MIRROR);
        
    }
    
    // Take one step in the simulation.
    this.step = function(ctx) {
        //this.grid.clearCurrent();
        this.grid.clearPrev();
        this.grid.clearSources();
        var src_point = this.ui.getSource();
        if(src_point) {
            if(this.ui.getActionType() == ACT_DENSITY_SRC)
                this.grid.addDensSource(src_point.x, src_point.y, 1);
            else {
                var vX = this.ui.getDragX();
                var vY = this.ui.getDragY();
                this.grid.addVelSource(src_point.x, src_point.y, vX, vY);
            }
        }
        this.vStep();
        this.dStep();
        this.grid.render(ui.ctx, ui.show_grid, ui.show_vels);
    }

    // Adds gravity to the simulation. Pass negative g-force value to
    // remove the gravity component again.
    // The gravity is added as a gravity current.
    this.addGravity = function(g) {
        for(var i=0; i<this.grid.N[X_DIM]+2; i++)
            for(var j=0; j<this.grid.N[Y_DIM]+2; j++)
                for(var k=0; k<this.grid.N[Z_DIM]+2; k++)
                    this.grid.src_vel[Y_DIM][i][j][k] = g;
    }
}
