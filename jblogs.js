// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/5/LICENSE

(function (mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
  mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
  define(["../../lib/codemirror"], mod);
  else // Plain browser env
  mod(CodeMirror);
})(function (CodeMirror) {
  "use strict";
  
  // Define the custom Mode
  CodeMirror.defineMode('jblogs', function () {
    return {
      startState: function () {
        return {
          noTarget: false,
          noDamage: false,
          matchedTime: false,
          isTarget: false,
          beginPlayerRoleMatch: false,
          beginActionMatch: false,
          beginTargetRoleMatch: false,
          beginDamageMatch: false,
          beginWeaponMatch: false,
          beginButtonMatch: false,
        };
      },
      token: function (stream, state) {
        if (stream.match(/^\[\d{2}:\d{2}\]/)) {
          state.noTarget = false;
          state.noDamage = false;
          state.matchedTime = true;
          state.isTarget = false;
          state.beginPlayerRoleMatch = true;
          state.beginActionMatch = false;
          state.beginTargetRoleMatch = false;
          state.beginDamageMatch = false;
          state.beginWeaponMatch = false;
          state.beginButtonMatch = false;
          return "jb-time";
        }
        
        // Generic irrelevant lines (specific enough that we don't need to section them off to prevent false positives)
        if (stream.match(/^-+(\[?(\[ JAILBREAK LOGS( END)? \])\]?-+)?$/)) {
          stream.skipToEnd();
          return "jb-irrelevant";
        }
        if (stream.match(/^\[DS\] .*$/)) {
          stream.skipToEnd();
          return "jb-irrelevant";
        }

        // Specific irrelevant lines
        if (state.beginTargetRoleMatch || state.beginWeaponMatch) {
          if (stream.match(/ ((button|up|the weapon|a vent or wall|an?) |(\(not previously owned\)))/)) // Irrelevant Action Words
            return "jb-irrelevant";
        }
        if (state.beginButtonMatch) {
          if (stream.match(/(button|\(#)/))
            return "jb-irrelevant";
        }

        // Player role match
        if (state.beginPlayerRoleMatch || state.beginTargetRoleMatch) {
          if (stream.match(/The World/)) {
            state.beginPlayerRoleMatch = false;
            state.beginActionMatch = true;
            return "jb-player";
          }
          var roleMatch = stream.match(/\((Guard|Warden|Prisoner|Rebel)\)/);
          if (roleMatch) {
            if (state.beginPlayerRoleMatch)
              state.beginActionMatch = true;
            else {
              if (state.noDamage) state.beginWeaponMatch = true;
              else state.beginDamageMatch = true;
            }
            state.beginPlayerRoleMatch = false;
            state.beginTargetRoleMatch = false;
            return `jb-role-${roleMatch[1].toLowerCase()}`;
          }
        }
        if (state.beginActionMatch) {
          var kwMatch = stream.match(/(pressed|hurt|killed|picked)/);
          if (kwMatch) { // Action Keywords
            state.beginActionMatch = false;
            if (kwMatch[0] === "pressed") state.beginButtonMatch = true;
            else {
              state.beginTargetRoleMatch = true;
              state.isTarget = true;
            }
            if (kwMatch[0] === "picked") state.noDamage = true;
            return `jb-action-${kwMatch[0]}`;
          }
          kwMatch = stream.match(/(reskinned|dropped|broke|threw)/);
          if (kwMatch) { // Action Keywords
            state.beginActionMatch = false;
            state.beginWeaponMatch = true;
            state.noTarget = true;
            state.noDamage = true;
            return `jb-action-${kwMatch[0]}`;
          }
          if (stream.match(/(is now warden|has died and is no longer warden)/)) {
            state.beginActionMatch = false;
            stream.skipToEnd();
            return "jb-action-warden-related";
          }
        }

        if (state.beginDamageMatch) {
          if (stream.match(/with/))
            return "jb-irrelevant";
          if (stream.match(/\d+ damage/))
            return "jb-damageamount"
          if (stream.match(/ \(/)) {
            state.beginDamageMatch = false;
            state.beginWeaponMatch = true;
            return "jb-irrelevant";
          }
        }

        if (state.beginWeaponMatch) {
          if (stream.match(/[^).]/))
            return "jb-weapon";
          if (stream.match(/[).]/)) {
            state.beginWeaponMatch = false;
            return "jb-irrelevant";
          }
        }

        if (state.beginButtonMatch) {
          if (stream.match(/'.*'/))
            return "jb-button-name";
          if (stream.match(/\d+/))
            return "jb-button-id";
          if (stream.match(/\)$/)) {
            state.beginButtonMatch = false;
            return "jb-irrelevant";
          }
        }
        
        if (!state.matchedTime) {
          stream.skipToEnd();
          return "jb-irrelevant";
        }

        stream.next();
        return (state.isTarget) ? "jb-player-target" : "jb-player";
      },
    }
  });
  
  CodeMirror.defineMIME("text/jblogs", "jblogs");
  
});
