/*jslint bitwise: true, es5: true, newcap: true, nomen: true, regexp: true, unparam: true, todo: true, white: true,
indent: 4, maxerr: 50, maxlen: 120 */
/*jshint boss: true, curly: true, eqeqeq: true, eqnull: true, es5: true, evil: true, forin: true, laxbreak: true,
loopfunc: true, noarg: true, noempty: true, strict: true, nonew: true, undef: true */
/*global player, worldScripts */

/* zoom-equipment.js
 *
 * Copyright © 2012-2013 Richard Thomas Harrison (Tricky)
 *
 * This work is licensed under the Creative Commons
 * Attribution-Noncommercial-Share Alike 3.0 Unported License.
 *
 * To view a copy of this license, visit
 * http://creativecommons.org/licenses/by-nc-sa/3.0/ or send a letter
 * to Creative Commons, 171 Second Street, Suite 300, San Francisco,
 * California, 94105, USA.
 *
 * Zoom Camera equipment script.
 */

(function () {
    "use strict";

    /* Standard public variables for OXP scripts. */
    this.name = "zoom-equipment.js";
    this.author = "Tricky";
    this.copyright = "© 2013 Richard Thomas Harrison (Tricky)";
    this.license = "CC BY-NC-SA 3.0";
    this.description = "Equipment activation script for the Zoom Camera OXP.";
    this.version = "1.0";

    /* Zoom Camera equipment key. */
    var p_equipmentKey = "EQ_ZOOM_CAMERA";

    /* NAME
     *   activated
     *
     * FUNCTION
     *   Equipment activated with the 'n' key.
     */
    this.activated = function () {
        var equipmentStatus = player.ship.equipmentStatus(p_equipmentKey);

        if (equipmentStatus === "EQUIPMENT_OK") {
            worldScripts.ZoomCamera.$equipmentActivated();
        } else if (equipmentStatus === "EQUIPMENT_DAMAGED") {
            this.equipmentDamaged(p_equipmentKey);
        }
    };

    /* NAME
     *   mode
     *
     * FUNCTION
     *   Equipment activated with the 'b' key.
     */
    this.mode = function () {
        var equipmentStatus = player.ship.equipmentStatus(p_equipmentKey);

        if (equipmentStatus === "EQUIPMENT_OK") {
            worldScripts.ZoomCamera.$equipmentMode();
        } else if (equipmentStatus === "EQUIPMENT_DAMAGED") {
            this.equipmentDamaged(p_equipmentKey);
        }
    };

    /* NAME
     *   equipmentDamaged
     *
     * FUNCTION
     *   Equipment became damaged.
     *
     * INPUT
     *   equipment - key of the equipment
     */
    this.equipmentDamaged = function (equipment) {
        if (equipment === p_equipmentKey) {
            worldScripts.ZoomCamera.$equipmentReset();
            player.consoleMessage("Zoom camera damaged!");
        }
    };
}.bind(this)());
