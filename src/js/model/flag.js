/*
  Digi Crush
  A game to crush the digits.
  Copyright (C) 2020 William Wong.  All rights reserved.
  williamw520@gmail.com
*/

import U from "/js/util/util.js";
import {BaseNode} from "/js/engine/basenode.js";
import {pg} from "/js/engine/pregen.js";
import {v3} from "/js/engine/vector.js";
import A from "/js/engine/animate.js";
import gl3d from "/js/game/gl3d.js";
import state from "/js/game/state.js";
import flag_render from "/js/game/flag_render.js";


// Flag states
const S_FREE = 0;
const S_ACTIVE = 1;
const S_HIT = 2;
const S_FLY = 3;
const S_DEAD = 4;


// flag item
export class Flag extends BaseNode {
    constructor(imageIndex) {
        super();
        this.ch = imageIndex || 0;              // char image index, 0-based.
        this.bg = [0.5, 1.0, 0.0, 1.0];
        this.fstate = S_FREE;
        this.hitTime = new A.Timeline(300);     // hit state animation timeout lasts 300ms.
        this.flyTime = new A.Timeline(1000);    // fly state animation timeout
    }

    activate(prevFlag) {
        this.ch = U.rand(0, gl3d.digitCount);
        this.pos = [ (prevFlag ? prevFlag.pos[0] + state.SPACE_BETWEEN : state.BEGIN_X), 0, 0 ];
        this.scale = 0.25;                      // model scale 
        this.xrot = 0;                          // model x-axis rotation
        this.yrot = 0;
        this.velocity = [0, 0, 0];              // velocity vector, distance per tick on [x,y,z]
        this.force = [0, 0, 0];                 // acceleration vector, velocity per tick on [vx,vy,vz]
        this.xrotSpeed = 0;                     // rotation speed in degree.
        this.wavePeriod = Math.random() * 50;
        this.rflag = null;
        this.fstate = S_ACTIVE;
    }

    setRNeighbor(flagToRight) {
        this.rflag = flagToRight;
    }

    isFree()    { return this.fstate == S_FREE      }
    isActive()  { return this.fstate == S_ACTIVE    }
    isHit()     { return this.fstate == S_HIT       }
    isFly()     { return this.fstate == S_FLY       }
    isDead()    { return this.fstate == S_DEAD      }
    isAlive()   { return this.fstate == S_ACTIVE || this.fstate == S_HIT }

    toFree() {
        this.fstate = S_FREE;
        return this;
    }

    toHit() {
        this.hitTime.start(performance.now());
        this.xrotSpeed = 8;
        this.fstate = S_HIT;
    }

    toFly() {
        this.flyTime.start(performance.now());
        this.velocity[1] = 0.05;
        this.velocity[2] = -0.05;
        this.xrotSpeed = 24;
        this.fstate = S_FLY;
    }

    toDead() {
        this.fstate = S_DEAD;
    }

    onUpdate(time, delta, parent) {
        switch (this.fstate) {
        case S_HIT:
            if (!this.hitTime.step(time)) {
                this.xrotSpeed = 8 + M.floor(6 * A.easeInQuad(this.hitTime.pos));
            } else {
                this.toFly();
            }
            break;
        case S_FLY:
            if (!this.flyTime.step(time)) {
                this.scale = 0.25 - 0.15 * A.easeInCubic(this.flyTime.pos);
            } else {
                this.toDead();
            }
            break;
        }

        this._adjustVelocity();
        v3.addTo(this.pos, this.velocity);
        v3.addTo(this.velocity, this.force);
        this.wavePeriod += delta * 0.001;
        this.xrot += this.xrotSpeed;

        super.onUpdate(time, delta, parent);
    }

    onDraw() {
        let modelRotation = pg.xrot(this.xrot);
        flag_render.draw(gl3d.gl, this.ch, this.pos, this.scale, modelRotation, this.bg, gl3d.facingView(), this.wavePeriod);
        super.onDraw();         // run onDraw() on child nodes.
    }

    _adjustVelocity() {
        if (this.rflag) {
            let xdelta = this.rflag.pos[0] - this.pos[0];
            if (xdelta < (state.SPACE_BETWEEN - 0.01)) {
                this.velocity[0] = -0.01;
                this.pos[0] = this.rflag.pos[0] - state.SPACE_BETWEEN + 0.01;
            } else if (xdelta > (state.SPACE_BETWEEN + 0.01)) {
                this.velocity[0] =  0.10;
            }
            else {
                this.velocity[0] = -0.01;
            }
        } else {
            this.velocity[0] = -0.01;
        }
    }

}

