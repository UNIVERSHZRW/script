(function (globalFunction) {
  if (typeof define === "function" && define.amd) {
    define("sealSvg", globalFunction);
  } else {
    globalFunction();
  }
})(function () {
  "use strict";

  function addEvent(type, listener) {
    window.addEventListener ? window.addEventListener(type, listener, false) : window.attachEvent("on" + type, listener);
  }

  function removeEvent(type, listener) {
    window.removeEventListener ? window.removeEventListener(type, listener, false) : window.detachEvent("on" + type, listener);
  }

  function BordersAnimation() {
    var container = document.getElementById("animated-borders");
    var animatedBorders = document.getElementsByClassName("animated-border");
    var staticBorder = document.getElementById("static-border");
    var iterationCount = container.getAttribute("data-borders-animation-iteration-count");
    var state = {
      container: container,
      animatedBorders: animatedBorders,
      staticBorder: staticBorder,
      iterationStaticState: iterationCount !== "infinite" && typeof Number(iterationCount) === "number" ? Number(iterationCount) : "infinite",
      bordersColor: Array.from(animatedBorders).map((border) => border.getAttribute("stroke")),
    };

    var cycleCounter = 0;
    var interval;

    function switchState() {
      if (state.container.getAttribute("data-borders-state") === "DEFAULT") {
        state.container.setAttribute("data-borders-state", "ACTIVE");
      } else {
        var color = state.bordersColor.pop();
        state.bordersColor.unshift(color);
        state.container.setAttribute("data-borders-state", "DEFAULT");
        state.staticBorder.setAttribute("stroke", state.bordersColor[3]);
        state.animatedBorders[0].setAttribute("stroke", state.bordersColor[0]);
        state.animatedBorders[1].setAttribute("stroke", state.bordersColor[1]);
        state.animatedBorders[2].setAttribute("stroke", state.bordersColor[2]);
        state.animatedBorders[3].setAttribute("stroke", state.bordersColor[3]);
      }
    }

    return {
      loop: function (callback) {
        interval = setInterval(function () {
          cycleCounter++;
          if (callback) callback({ cycleCounter: Math.floor(cycleCounter / 8), iterationState: state.iterationStaticState });
          switchState();
        }, 800);
      },
      stopLoop: function () {
        clearInterval(interval);
        interval = undefined;
      },
      state: state,
    };
  }

  function MainAnimation() {
    var sealContainer = document.getElementById("seal-container");
    var animationCount = sealContainer.getAttribute("data-svg-animation-count");
    var iterationLimit = animationCount !== "infinite" && typeof Number(animationCount) === "number" ? Number(animationCount) : "infinite";
    var iterationCounter = 0;
    var bordersAnimation = BordersAnimation();

    function startInitial() {
      setTimeout(function () {
        bordersAnimation.state.container.style.display = "block";
        bordersAnimation.loop(function (event) {
          if (event.cycleCounter === 1) {
            bordersAnimation.stopLoop();
          }
        });
      }, 800);
    }

    return {
      startInitial: startInitial,
    };
  }

  var sealContainer = document.getElementById("seal-container");
  var logo = document.getElementById("company-logo");

  addEvent("DOMContentLoaded", MainAnimation().startInitial);
});
