/*
 * Copyright (C) 2019-2023 Yahweasel
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
 * SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
 * OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
 * CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

(function() {
    function isWebAssemblySupported(module) {
        module = module || [0x0, 0x61, 0x73, 0x6d, 0x1, 0x0, 0x0, 0x0];
        if (typeof WebAssembly !== "object" || typeof WebAssembly.instantiate !== "function")
            return false;
        try {
            var module = new WebAssembly.Module(new Uint8Array(module));
            if (module instanceof WebAssembly.Module)
                return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
        } catch (e) {}
        return false;
    }

    var base = ".";
    var nodejs = (typeof process !== "undefined");

    if (typeof WebRtcAec3 === "undefined")
        WebRtcAec3 = {};

    if (WebRtcAec3.base)
        base = WebRtcAec3.base;

    var wasm = !WebRtcAec3.nowasm && isWebAssemblySupported();
    var target =
        wasm ? "wasm" :
        "asm";
    WebRtcAec3.target = target;

    // The loader itself
    WebRtcAec3.WebRtcAec3 = function() {
        var args = arguments;

        return Promise.all([]).then(function() {
            // Load it
            if (typeof WebRtcAec3Factory === "undefined") {
                var toLoad = base + "/webrtcaec3-@VER." + target + ".js";
                if (nodejs) {
                    WebRtcAec3Factory = require(toLoad);
                } else {
                    return new Promise(function(res, rej) {
                        var scr = document.createElement("script");
                        scr.type = "text/javascript";
                        scr.src = toLoad;
                        scr.onload = res;
                        scr.onerror = rej;
                        document.body.appendChild(scr);
                    });
                }
            }

        }).then(function() {
            // Replace this with it
            WebRtcAec3.WebRtcAec3 = WebRtcAec3Factory;
            delete WebRtcAec3Factory;

            // And create the instance
            return WebRtcAec3.WebRtcAec3.call(WebRtcAec3, args);

        });
    }

    if (nodejs)
        module.exports = WebRtcAec3;

})();
