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
  CodeMirror.defineMode('tttlogs', function () {
    return {
      startState: function () {
        // State variables used to determine where we're at in the stream
        return {
          noTarget: false,
          matchedTime: false,
          isRoundNumber: false,
          isTarget: false,
          beginPlayerRoleMatch: false,
          beginActionMatch: false,
          beginTargetRoleMatch: false,
          beginDamageMatch: false,
          beginWeaponMatch: false
        };
      },
      token: function (stream, state) {
        if (stream.match(/^\[\d{2}:\d{2}\]/)) {
          // Reset state variables
          state.noTarget = false;
          state.matchedTime = true;
          state.isRoundNumber = false;
          state.isTarget = false;
          state.beginPlayerRoleMatch = true;
          state.beginActionMatch = false;
          state.beginTargetRoleMatch = false;
          state.beginDamageMatch = false;
          state.beginWeaponMatch = false;
          return "ttt-time";
        }
        
        // Generic irrelevant lines (specific enough that we don't need to section them off to prevent false positives)
        if (stream.match(/^-+(\[?(TTT LOGS)\]?-+)?$/)) {
          stream.skipToEnd();
          return "ttt-irrelevant";
        }
        if (stream.match(/^\[DS\] .*$/)) {
          stream.skipToEnd();
          return "ttt-irrelevant";
        }
        if (stream.match(/ -> \[?/) || stream.match(/\]($| - )/))
          return "ttt-irrelevant";
        if (stream.match(/^BAD ACTION$/)) {
          stream.skipToEnd();
          return "ttt-bad-action";
        }
        if (stream.match(/^TRAITOR DETECTED$/)) {
          stream.skipToEnd();
          return "ttt-traitor-detected";
        }

        // Round number, will highlight the number as time and the rest as irrelevant
        if (stream.match(/TTT Round #/)) {
          state.isRoundNumber = true;
          return "ttt-irrelevant";
        }
        if (state.isRoundNumber) {
          if (stream.match(/\d+/))
            return "ttt-round-number";
          else {
            state.isRoundNumber = false;
            stream.skipToEnd();
            return "ttt-irrelevant";
          }
        }
        
        // Player role match
        if (state.beginPlayerRoleMatch || state.beginTargetRoleMatch) {
          var roleMatch = stream.match(/\((Innocent|Traitor|Detective)\)/i);
          if (roleMatch) {
            if (state.beginPlayerRoleMatch)
              state.beginActionMatch = true;
            else {
              if (state.noDamage) state.beginWeaponMatch = true;
              else state.beginDamageMatch = true;
            }
            state.beginPlayerRoleMatch = false;
            state.beginTargetRoleMatch = false;
            return `ttt-role-${roleMatch[1].toLowerCase()}`;
          }
        }
        // Action match
        if (state.beginActionMatch) {
          if (stream.match(/ was /)) // Irrelevant Action Words
            return "ttt-irrelevant";
          var kwMatch = stream.match(/(damaged|killed|tased|identified)/);
          if (kwMatch) { // Action Keywords, with target
            state.beginActionMatch = false;
            state.isTarget = true;
            state.beginTargetRoleMatch = true;
            return `ttt-action-${kwMatch[0]}`;
          }
          kwMatch = stream.match(/(purchased)/);
          if (kwMatch) { // Action Keywords, no target
            state.beginActionMatch = false;
            state.beginWeaponMatch = true;
            state.noTarget = true;
            return `ttt-action-${kwMatch[0]}`;
          }
        }
        if (state.beginTargetRoleMatch || state.beginWeaponMatch) { // Sectioned Off Irrelevant Words (false-positives if they weren't sectioned off)
          if (stream.match(/ (by|body of|an item from the shop:) /)) { // Irrelevant Action Words
            return "ttt-irrelevant";
          }
        }
        
        if (state.beginDamageMatch) {
          if (stream.match(/ for /)) // Irrelevant Action Words
            return "ttt-irrelevant";
          if (stream.match(/\d+ damage/)) // Damage Amount
            return "ttt-damageamount";
          if (stream.match(/ \(HEADSHOT\) /)) // Headshot
            return "ttt-headshot";
          if (stream.match(/ ?with /)) { // Irrelevant Word, damage section is over
            state.beginDamageMatch = false;
            state.beginWeaponMatch = true;
            return "ttt-irrelevant";
          }
        }
        
        if (state.beginWeaponMatch) {
          stream.beginWeaponMatch = false;
          var m = stream.match(/[^\]]+/);
          // Wallhack is a special case, it's specially formatted
          return (m.includes("Wallhack")) ? "ttt-wallhack" : "ttt-weapon";
        }
        
        if (!state.matchedTime) { // Irrelevant Lines
          stream.skipToEnd();
          return "ttt-irrelevant";
        }

        // If we haven't found anything, we're probably at a player name
        // When looking for names, we look for role matches and if they don't match, it's part of the name.
        stream.next();
        return (state.isTarget) ? "ttt-player-target" : "ttt-player";
      },
    }
  });
  
  CodeMirror.defineMIME("text/tttlogs", "tttlogs");
  
});
