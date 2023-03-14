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
          damageStart: false,
          matchedPlayer: false,
          matchedPlayerTeam: false,
          matchedTarget: false,
          matchedAction: false,
          noTarget: false,
          matchedTime: false
        };
      },
      token: function (stream, state) {
        if (stream.match(/^\[\d{2}:\d{2}\]/)) {
          state.damageStart = false;
          state.matchedPlayer = false;
          state.matchedPlayerTeam = false;
          state.matchedTarget = false;
          state.matchedAction = false;
          state.noTarget = false;
          state.matchedTime = true;
          return "jb-time";
        }
        
        if(stream.match(/^-+(\[?(\[ JAILBREAK LOGS( END)? \])\]?-+)?$/)) {
          stream.skipToEnd();
          return "jb-irrelevant";
        }
        var roleMatch = stream.match(/\((Guard|Warden|Prisoner|Rebel)\)/i);
        if (roleMatch) {
          state.matchedPlayer = false;
          if (state.matchedPlayerTeam)
          state.matchedTarget = true;
          state.matchedPlayerTeam = true;
          return `jb-role-${roleMatch[1].toLowerCase()}`;
        }
        if (state.matchedPlayerTeam) {
          var kwMatch = stream.match(/(pressed|hurt|killed|picked)/);
          if (kwMatch) { // Action Keywords
            state.matchedAction = true;
            if (kwMatch[0] == "picked") state.damageStart = true; // Weapon after target, no damage
            return `jb-action-${kwMatch[0]}`;
          }
          kwMatch = stream.match(/(reskinned|dropped|broke|threw)/);
          if (kwMatch) { // Action Keywords
            state.matchedAction = true;
            state.noTarget = true;
            return `jb-action-${kwMatch[0]}`;
          }
          if (stream.match(/(is now warden|has died and is no longer warden)/)) {
            state.matchedAction = true;
            return "jb-action-warden-related";
          }
          if (state.matchedAction && !state.matchedTarget && stream.match(/ (button|up|the weapon|a vent or wall|an?) /)) { // Irrelevant Action Words
            return "jb-irrelevant";
          }
          
          if (state.matchedAction && !state.matchedTarget) {
            if (state.noTarget && state.matchedTime) {
              stream.next();
              return "jb-weapon"
            }
            stream.next();
            return "jb-player-target";
          }
          
          if (stream.match(/with/)) {
            state.damageStart = true;
            return "jb-irrelevant";
          }
          
          if (state.damageStart) {
            if (stream.match(/\d+ damage/))
            return "jb-damageamount";
            stream.next();
            return "jb-weapon";
          }
          stream.next();
          return null;
        }
        
        if (stream.match(/The World/)) {
          stream.next();
          state.matchedPlayerTeam = true;
          return "jb-player";
        }
        
        
        if (!state.matchedTime) {
          stream.skipToEnd();
          return null;
        }
        stream.next();
        return "jb-player";
      },
    }
  });
  
  CodeMirror.defineMIME("text/jblogs", "jblogs");
  
});
