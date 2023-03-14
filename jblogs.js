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
            matchedTarget: false,
            matchedPlayerTeam: false,
            matchedAction: false,
            noTarget: false,
            matchedTime: false
          };
        },
        token: function (stream, state) {
          if (state.damageStart && stream.match(/damage/)) {
            if (stream.match(/\d/)) {
              return "jb-damageamount";
            }
          }
  
          if (stream.match(/^\[\d{2}:\d{2}\]/)) {
            state.matchedPlayer = false;
            state.matchedPlayerTeam = false;
            state.matchedTarget = false;
            state.noTarget = false;
            state.matchedTime = true;
            return "jb-time";
          }
  
          if(stream.match(/-.+(\[ JAILBREAK LOGS \])?/)) {
            stream.skipToEnd();
            return "jb-header";
          }
  
          if (stream.match(/\((Guard|Warden)\)/i)) {
            state.matchedPlayer = false;
            if (state.matchedPlayerTeam)
              state.matchedTarget = true;
            state.matchedPlayerTeam = true;
            return "jb-teamct"
          }
          if (stream.match(/\(Prisoner\)/)) {
            state.matchedPlayer = false;
            if (state.matchedPlayerTeam)
              state.matchedTarget = true;
            state.matchedPlayerTeam = true;
            return "jb-teamt";
          }
          if (stream.match(/\(Rebel\)/)) {
            state.matchedPlayer = false;
            if (state.matchedPlayerTeam)
              state.matchedTarget = true;
            state.matchedPlayerTeam = true;
            return "jb-rebel";
          }
          if (state.matchedPlayerTeam) {
            if (stream.match(/(pressed button|hurt|killed|picked up)/)) {
              state.matchedAction = true;
              return "jb-action";
            }
            if (stream.match(/(reskinned|dropped the weapon|broke a vent or wall)/)) {
              state.matchedAction = true;
              state.noTarget = true;
              return "jb-action";
            }
  
            if (state.matchedAction && !state.matchedTarget) {
              if (state.noTarget && state.matchedTime) {
                stream.next();
                return "jb-weapon"
              }
              stream.next();
              return "jb-target";
            }
  
            if (stream.match('with')) {
              state.damageStart = true;
              return "jb-damage";
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
  