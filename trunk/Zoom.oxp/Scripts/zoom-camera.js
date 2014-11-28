/*jslint bitwise: true, es5: true, newcap: true, nomen: true, regexp: true, unparam: true, todo: true, white: true,
indent: 4, maxerr: 50, maxlen: 120 */
/*jshint boss: true, curly: true, eqeqeq: true, eqnull: true, es5: true, evil: true, forin: true, laxbreak: true,
loopfunc: true, noarg: true, noempty: true, strict: true, nonew: true, undef: true */
/*global Quaternion, Vector3D, addFrameCallback, isValidFrameCallback, player, removeFrameCallback */

/* zoom.js
 *
 * Copyright © 2013 Richard Thomas Harrison (Tricky)
 *
 * This work is licensed under the Creative Commons
 * Attribution-Noncommercial-Share Alike 3.0 Unported License.
 *
 * To view a copy of this license, visit
 * http://creativecommons.org/licenses/by-nc-sa/3.0/ or send a letter
 * to Creative Commons, 171 Second Street, Suite 300, San Francisco,
 * California, 94105, USA.
 *
 * World script for the Zoom Camera OXP.
 */

(function () {
    "use strict";

    /* Standard public variables for OXP scripts. */
    this.name = "ZoomCamera";
    this.author = "Tricky";
    this.copyright = "© 2013 Richard Thomas Harrison (Tricky)";
    this.license = "CC BY-NC-SA 3.0";
    this.description = "World script for the Zoom Camera OXP.";
    this.version = "1.0";

    /* Private variable. */
    var p_main = {};

    /* World script event handlers. */

    /* NAME
     *   startUp
     *
     * FUNCTION
     *   We only need to do this once.
     *   This will get redefined after a new game or loading of a new Commander.
     */
    this.startUp = function () {
        /* Setup the private main variable. */
        this.$setUp();

        /* No longer needed after setting up. */
        delete this.startUp;
    };

    /* NAME
     *   shipWillExitWitchspace
     *
     * FUNCTION
     *   Player is about to exit from Witchspace.
     *   Reset everything just before exiting Witchspace.
     */
    this.shipWillExitWitchspace = function () {
        /* Setup the private main variable. */
        this.$setUp();
    };

    /* NAME
     *   viewDirectionChanged
     *
     * FUNCTION
     *   The viewDirectionChanged handler is called when the player view changes,
     *   with a string to indicate which view the player is facing.
     *
     * INPUT
     *   view - string
     *     "VIEW_FORWARD", "VIEW_AFT", "VIEW_PORT", "VIEW_STARBOARD", "VIEW_CUSTOM", "VIEW_GUI_DISPLAY"
     */
    this.viewDirectionChanged = function (view) {
        if (view === "VIEW_FORWARD") {
            p_main.view = "FORWARD";
            p_main.orientation = new Quaternion(1, 0, 0, 0);
        } else if (view === "VIEW_AFT") {
            p_main.view = "AFT";
            p_main.orientation = new Quaternion(0, 0, 1, 0);
        } else if (view === "VIEW_PORT") {
            p_main.view = "PORT";
            p_main.orientation = new Quaternion(0.7071, 0, 0.7071, 0);
        } else if (view === "VIEW_STARBOARD") {
            p_main.view = "STARBOARD";
            p_main.orientation = new Quaternion(0.7071, 0, -0.7071, 0);
        }
    };

    /* NAME
     *   shipDied
     *
     * FUNCTION
     *   Player died, remove the frame callback.
     */
    this.shipDied = this.$removeEquipmentFCBReference = function () {
        /* Stop and remove the frame callback. */
        if (this.$equipmentFCBReference) {
            if (isValidFrameCallback(this.$equipmentFCBReference)) {
                removeFrameCallback(this.$equipmentFCBReference);
            }

            this.$equipmentFCBReference = null;
        }
    };

    /* NAME
     *   $setUp
     *
     * FUNCTION
     *   Setup the private main variable.
     */
    this.$setUp = function () {
        /* Initialise the p_main variable object.
         * Encapsulates all private global data.
         */
        p_main = {
            /* True if the Zoom Camera has been activated. */
            activated : false,
            /* Distance of the Zoom Camera in metres. */
            distance : 0,
            distanceDelta : 0,
            /* Zoom Camera mode.
             * "activate", "zoom-in", "zoom-out", "deactivate"
             */
            mode : "activate",
            newDistance : 0,
            /* Orientation for the view direction. */
            orientation : new Quaternion(1, 0, 0, 0),
            /* View direction before going to the external camera view.
             * "FORWARD", "AFT", "PORT", "STARBOARD"
             */
            view : "FORWARD"
        };

        /* Reset the zoom camera. */
        this.$equipmentReset();
    };

    /* NAME
     *   $calculateVectorPosition
     *
     * FUNCTION
     *   Calculate a vector position between the target's surface and the origin's surface.
     *
     * INPUTS
     *   origin - entity of the origin
     *   target - entity of the target
     *   dfts - distance from the target's surface
     *
     * RESULT
     *   result - vector position above the target's surface
     */
    this.$calculateVectorPosition = function (origin, target, dfts) {
        var targetDistance = origin.position.distanceTo(target.position),
        ratio = (target.collisionRadius + origin.collisionRadius + dfts) / targetDistance;

        return (Vector3D.interpolate(target.position, origin.position, ratio));
    };

    /* NAME
     *   $equipmentActivated
     *
     * FUNCTION
     *   Activate the equipment.
     */
    this.$equipmentActivated = function () {
        var playerShip = player.ship,
        maxDistance,
        position;

        if (p_main.mode === "activate") {
            this.$equipmentSet();
            player.consoleMessage("Zoom Camera activated.");
            player.consoleMessage("Mode: Zoom in.");
        } else if (p_main.mode === "deactivate") {
            this.$equipmentReset();
            player.consoleMessage("Zoom Camera deactivated.");
            player.consoleMessage("Mode: Activate Zoom Camera.");
        } else if (playerShip.viewDirection === "VIEW_CUSTOM" && p_main.distanceDelta === 0) {
            if (p_main.mode === "zoom-in") {
                /* Initial maximum distance just outside the scanner range. */
                maxDistance = playerShip.scannerRange + 2000;

                if (playerShip.target && playerShip.target.isValid) {
                    /* Calculate a vector position 10m from the player target's surface. */
                    position = this.$calculateVectorPosition(playerShip, playerShip.target, 10);
                    /* Maximum distance set to the vector position's distance from the player. */
                    maxDistance = playerShip.position.distanceTo(position);
                }

                if (p_main.distance + 2000 + playerShip.collisionRadius < maxDistance) {
                    p_main.distanceDelta = 150;
                    p_main.newDistance = p_main.distance + 2000;
                    player.consoleMessage("Zooming in. Zoom distance: " + (p_main.newDistance / 1000) + "km");
                }
            } else if (p_main.mode === "zoom-out") {
                if (p_main.distance - 2000 >= 0) {
                    p_main.distanceDeleta = -150;
                    p_main.newDistance = p_main.distance - 2000;
                    player.consoleMessage("Zooming out. Zoom distance: " + (p_main.newDistance / 1000) + "km");
                }
            }
        }
    };

    /* NAME
     *   $equipmentMode
     *
     * FUNCTION
     *   Change the equipment mode.
     */
    this.$equipmentMode = function () {
        if (!p_main.activated) {
            p_main.mode = "activate";
            player.consoleMessage("Mode: Activate Zoom Camera.");
        } else {
            if (p_main.mode === "zoom-in") {
                p_main.mode = "zoom-out";
                player.consoleMessage("Mode: Zoom out.");
            } else if (p_main.mode === "zoom-out") {
                p_main.mode = "deactivate";
                player.consoleMessage("Mode: Deactivate Zoom Camera.");
            } else if (p_main.mode === "deactivate") {
                p_main.mode = "zoom-in";
                player.consoleMessage("Mode: Zoom in.");
            }
        }
    };

    /* NAME
     *   $equipmentSet
     *
     * FUNCTION
     *   Setup the equipment.
     */
    this.$equipmentSet = function () {
        p_main.activated = true;
        p_main.distance = 0;
        p_main.distanceDelta = 0;
        p_main.mode = "zoom-in";
        p_main.newDistance = 0;
        this.$equipmentFCBReference = addFrameCallback(this.$equipmentFCB.bind(this));
    };

    /* NAME
     *   $equipmentReset
     *
     * FUNCTION
     *   Reset the equipment.
     */
    this.$equipmentReset = function () {
        p_main.activated = false;
        p_main.mode = "activate";
        this.$removeEquipmentFCBReference();

        if (player.ship.viewDirection === "VIEW_CUSTOM") {
            player.ship.resetCustomView();
        }
    };

    /* NAME
     *   $equipmentFCB
     *
     * FUNCTION
     *   Zoom Camera frame callback.
     *
     * INPUT
     *   delta - amount of game clock time past since the last frame
     */
    this.$equipmentFCB = function (delta) {
        var magnitude,
        playerShip,
        target,
        targetDistance,
        targetPosition,
        view = p_main.view,
        viewOrientation,
        viewPosition;

        if (delta === 0.0) {
            /* Do nothing if paused. */
            return;
        }

        if (player.ship.viewDirection === "VIEW_CUSTOM") {
            playerShip = player.ship;
            target = playerShip.target;

            if (target && target.isValid && p_main.distanceDelta === 0) {
                /* Calculate a vector position 10m from the target's surface. */
                targetPosition = this.$calculateVectorPosition(playerShip, target, 10);
                targetDistance = playerShip.position.distanceTo(targetPosition);

                if (p_main.distance + playerShip.collisionRadius >= targetDistance) {
                    /* Zoom out if the target has come closer to the player. */
                    p_main.distanceDelta = -150;
                    p_main.newDistance = p_main.distance - 2000;
                    player.consoleMessage("Zooming out. Zoom distance: " + (p_main.newDistance / 1000) + "km");
                }
            }

            if (p_main.distanceDelta !== 0) {
                log(this.name, "Distance: " + p_main.distance + ", New Distance: " + p_main.newDistance + ", DistanceDelta: " + p_main.distanceDelta);
            }

            if (p_main.distance !== p_main.newDistance) {
                p_main.distance += p_main.distanceDelta;
                p_main.distanceDelta += (p_main.distanceDelta > 0 ? -4 : 4);

                if (p_main.distanceDelta === 0 ||
                    (p_main.distanceDelta > 0 && p_main.distance > p_main.newDistance) ||
                    (p_main.distanceDelta < 0 && p_main.newDistance > p_main.distance)) {
                    p_main.distance = p_main.newDistance;
                    p_main.distanceDelta = 0;

                    log(this.name, "Achieved distance: " + p_main.distance);
                }
            }

            /* Add on the collision radius of the player ship to the zoom distance. */
            magnitude = p_main.distance + playerShip.collisionRadius;

            if (view === "FORWARD") {
                /* Front. */
                viewPosition = new Vector3D(0, 0, magnitude);
            } else if (view === "AFT") {
                /* Back. */
                viewPosition = new Vector3D(0, 0, -magnitude);
            } else if (view === "PORT") {
                /* Left. */
                viewPosition = new Vector3D(-magnitude, 0, 0);
            } else if (view === "STARBOARD") {
                /* Right. */
                viewPosition = new Vector3D(magnitude, 0, 0);
            }

            playerShip.setCustomView(viewPosition, p_main.orientation, view);
        }
    };
}.bind(this)());
