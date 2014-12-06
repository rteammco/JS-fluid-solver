/* File: grid.js
 * Definition for the Grid object that contains all of the current
 * velocity and density values on a 2D or 3D region.
 */


/* Grid Object Constants: */
GRID_COLOR = "#555555";
GRID_DENSITY_COLOR = "0, 153, 153"; // has to be in RGB!
GRID_VELOCITY_COLOR = "yellow";
GRID_TEXT_COLOR = "#00FF00";
GRID_LINE_WIDTH = 1;


/* The Grid object:
 * Maintains the current state of the simulation and keeps track
 * of all velocities and forces. Also provides an API for drawing
 * the grid itself and obtaining information about each grid cell.
 * Parameters:
 *     N = array with number of cells in each dimension (x, y, z) axis.
 *         for 2D, set this to 1.
 *     size = array with the size of each dimension (widht, height, depth).
 *         for 2D, set this to 0.
 *     nDims = the number of dimensions (2 or 3).
 *     ui = the UI object (used for rendering).
 */
function Grid(N, size, nDims, ui) {
    // set the number of cells in each axis
    this.N = N;
    this.size = size;
    this.nDims = nDims;
    this.ui = ui;

    // compute the length of each cell in each axis
    this.len_cells = new Array();
    for(var i=0; i<this.size.length; i++)
        this.len_cells.push(this.size[i] / (this.N[i] + 2));

    // Generates a velocity array appropriately fitted to this grid.
    this.generateVelArray = function() {
        return zeros4d(3, this.N[X_DIM]+2, this.N[Y_DIM]+2, this.N[Z_DIM]+2);
    }

    // Generates a density array appropriately fitted to this grid.
    this.generateDensArray = function() {
        return zeros3d(this.N[X_DIM]+2, this.N[Y_DIM]+2, this.N[Z_DIM]+2);
    }
    
    // allocate the velocity and density field arrays (3rd dim ignored for 2D).
    this.vel = this.generateVelArray();
    this.prev_vel = this.generateVelArray();
    this.src_vel = this.generateVelArray();
    this.dens = this.generateDensArray();
    this.prev_dens = this.generateDensArray();
    this.src_dens = this.generateDensArray();

    // Zeros out the given velocity and density arrays.
    this.clearArrays = function(v, d) {
        for(var i=0; i<(this.N[X_DIM]+2); i++) {
            for(var j=0; j<(this.N[Y_DIM]+2); j++) {
                for(var k=0; k<(this.N[Z_DIM]+2); k++) {
                    for(var dim=0; dim<3; dim++)
                        v[dim][i][j][k] = 0;
                    d[i][j][k] = 0;
                }
            }
        }
    }

    // Clears out the source arrays.
    this.clearSources = function() {
        this.clearArrays(this.src_vel, this.src_dens);
    }

    // Clears out the current data arrays.
    this.clearCurrent = function() {
        this.clearArrays(this.vel, this.dens);
    }

    // Clears out the previous data arrays (non-conserving).
    this.clearPrev = function() {
        this.clearArrays(this.prev_vel, this.prev_dens);
    }

    // Adds a source to the velocity source array in the given direction.
    // x, y location is absolute, and the appropriate cell is determined.
    // TODO - z-axis?
    this.addVelSource = function(x, y, vX, vY) {
        var idx = this.getContainerCell(x, y);
        this.src_vel[X_DIM][idx.i][idx.j][1] = vX;
        this.src_vel[Y_DIM][idx.i][idx.j][1] = vY;
    }

    // Adds a source to the density source array of the given value d.
    // x, y location is absolute, and the appropriate cell is determined.
    // TODO - z-axis?
    this.addDensSource = function(x, y, d) {
        var idx = this.getContainerCell(x, y);
        this.src_dens[idx.i][idx.j][1] = d;
    }

    // Swaps the velocity array pointers (old and new).
    this.swapV = function() {
        var temp = this.vel;
        this.vel = this.prev_vel;
        this.prev_vel = temp;
    }

    // Swaps the density array pointers (old and new).
    this.swapD = function() {
        var temp = this.dens;
        this.dens = this.prev_dens;
        this.prev_dens = temp;
    }

    // Returns the density value at the given index. Returns previous
    // values if "prev" is set to true. Accounts for border cell cases.
    this.getD = function(x, y, z, prev) {
        var d = this.dens;
        if(prev)
            d = this.prev_dens;
        return this.get(x, y, z, d);
    }

    // Returns the array value of A at the given index. Accounts for
    // border cell cases (which mirror their closest inner neighbor).
    // NOTE: border cases only considered for x and y so far.
    this.get = function(x, y, z, A) {
        // TODO - same code for velocities
        // TODO - z-axis not accounted for
        // TODO - too many ifs... clean up?
        var x_max = this.N[X_DIM] + 1;
        var y_max = this.N[Y_DIM] + 1;
        // first handle the four corner cases:
        if(x == 0 && y == 0) // (0, 0)
            return 0.5*(this.get(1, 0, z, A) +
                        this.get(0, 1, z, A));
        else if(x == 0 && y == y_max) // (0, N+1)
            return 0.5*(this.get(1, y_max, z, A) +
                        this.get(0, y_max-1, z, A));
        else if(x == x_max && y == 0) // (N+1, 0)
            return 0.5*(this.get(x_max, 1, z, A) +
                        this.get(x_max-1, 0, z, A));
        else if(x == x_max && y == y_max) // (N+1, N+1)
            return 0.5*(this.get(x_max-1, y_max, z, A) +
                        this.get(x_max, y_max-1, z, A));
        // now the edge cases
        else if(x == 0) // left edge
            return A[1][y][z];
        else if(x == x_max) // right edge
            return A[x_max-1][y][z];
        else if(y == 0) // top edge
            return A[x][1][z];
        else if(y == y_max) // bottom edge
            return A[x][y_max-1][z];
        // otherwise, return the cell value normally
        else
            return A[x][y][z];
    }

    // Returns an object containing the i, j, k index of the cell that
    // contains the given x, y, z point.
    this.getContainerCell = function(x, y, z) {
        var i = Math.floor(x / this.len_cells[X_DIM]);
        var j = Math.floor(y / this.len_cells[Y_DIM]);
        var k = Math.floor(z / this.len_cells[Z_DIM]);
        return {i:i, j:j, k:k};
    }

    // Adds an immediate source to the clicked cell - TODO
    // TODO - only works for 2D
    this.registerClick = function(x, y, val) {
        var idx = this.getContainerCell(x, y, 0);
        this.dens[idx.i][idx.j][1] = val;
    }

    // Renders this Grid using the given context.
    // Render method is changed depending on Grid dimension.
    this.render = function(ctx) {
        if(this.nDims == 2)
            this.render2D(ctx);
        else
            alert("Dimension not supported.");
    }

    // Render a 2D representation of this Grid. Only works for 2D setup.
    this.render2D = function(ctx) {
        ctx.clearRect(0, 0, this.size[X_DIM], this.size[Y_DIM]);
        ctx.save();
        // draw the densities
        var total_dens = 0;
        var w = Math.floor(this.len_cells[X_DIM]);
        var h = Math.floor(this.len_cells[Y_DIM]);
        var start_x = (this.ui.width - w*(this.N[X_DIM]+2)) / 2;
        var start_y = (this.ui.height - h*(this.N[Y_DIM]+2)) / 2;
        for(var i=0; i<this.N[X_DIM]+2; i++) {
            for(var j=0; j<this.N[Y_DIM]+2; j++) {
                var dens = this.dens[i][j][1];
                total_dens += dens;
                if(dens > 0) {
                    var x = Math.floor(i * w + start_x);
                    var y = Math.floor(j * h + start_y);
                    // TODO - changed for visualization
                    var real_dens = dens;
                    dens *= 1000;
                    ctx.fillStyle = "rgba(" + GRID_DENSITY_COLOR + ", " + dens + ")";
                    if(dens >= 1)
                        dens = 1;
                    if(real_dens >= 1)
                        ctx.fillStyle = "#FF0000";
                    ctx.fillRect(x, y, w, h);
                }
            }
        }
        // if option is enabled, draw the grid
        if(this.ui.show_grid) {
            ctx.strokeStyle = GRID_COLOR;
            ctx.lineWidth = GRID_LINE_WIDTH;
            // draw the x axis lines
            for(var i=0; i<this.N[X_DIM]+2+1; i++) {
                ctx.beginPath();
                var x = Math.floor(i * w + start_x);
                ctx.moveTo(x, start_y);
                ctx.lineTo(x, this.ui.height - start_y);
                ctx.stroke();
            }
            // draw the y axis lines
            for(var i=0; i<this.N[Y_DIM]+2+1; i++) {
                ctx.beginPath();
                var y = Math.floor(i * h + start_y);
                ctx.moveTo(start_x, y);
                ctx.lineTo(this.ui.width - start_x, y);
                ctx.stroke();
            }
        }
        // if option is enabled, draw the velocity vectors
        if(this.ui.show_vels) {
            // TODO - fix the renderring here to match the above fixes
            ctx.strokeStyle = GRID_VELOCITY_COLOR;
            ctx.lineWidth = GRID_LINE_WIDTH;
            for(var i=0; i<this.N[X_DIM]+2; i++) {
                for(var j=0; j<this.N[Y_DIM]+2; j++) {
                    var x = Math.floor(i * w + start_x);
                    var y = Math.floor((j+1) * h + start_y);
                    var vX = Math.ceil(this.vel[X_DIM][i][j][1]*1000);
                    var vY = Math.ceil(this.vel[Y_DIM][i][j][1]*1000);
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x+vX, y+vY);
                    ctx.stroke();
                }
            }
        }
        // Display tooltips
        if(this.ui.show_stats) {
            ctx.fillStyle = GRID_TEXT_COLOR;
            ctx.font = "16px Ariel";
            total_dens = Math.round(10000*total_dens)/10000;
            ctx.fillText("Total System Density: " + total_dens, 20, 30);
        }
        ctx.restore();
    }
}
