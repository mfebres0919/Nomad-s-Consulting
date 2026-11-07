/* =========================================================
   A Nomad's Consulting — homepage behavior
   ========================================================= */

/* ---------- Services carousel ----------
   The center card faces forward and the others tilt back behind it.
   It advances every 7 seconds, pauses on hover, focus, the pause
   button, or a hidden tab, and stays still for reduced motion.
   Arrows, swipes, clicking a side card, and the nav's
   Services links all move it. */
(function () {
    "use strict";

    var carousel = document.querySelector(".services__carousel");

    if (!carousel) {
        return;
    }

    var stage = carousel.querySelector(".services__stage");
    var cards = Array.prototype.slice.call(carousel.querySelectorAll(".service-card"));
    var countCurrent = carousel.querySelector(".services__count-current");
    var barFill = carousel.querySelector(".services__bar-fill");
    var pauseButton = carousel.querySelector(".services__pause");
    var total = cards.length;
    var current = 0;
    var timer = null;
    var interval = 7000;
    var paused = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var held = false;

    function show(index) {
        current = (index + total) % total;

        cards.forEach(function (card, i) {
            var offset = (i - current + total) % total;
            var pos = offset === 0 ? "center" : offset === 1 ? "right" : offset === total - 1 ? "left" : "hidden";
            var button = card.querySelector(".service-card__btn");

            card.setAttribute("data-pos", pos);

            // Only the centered card's button is reachable by keyboard
            if (button) {
                button.tabIndex = pos === "center" ? 0 : -1;
            }
        });

        countCurrent.textContent = (current < 9 ? "0" : "") + (current + 1);
    }

    // Restart the bar so it fills over the same time as the timer
    function runBar(running) {
        barFill.classList.remove("is-running");
        void barFill.offsetWidth;
        barFill.classList.toggle("is-running", running);
    }

    function restart() {
        clearInterval(timer);

        var running = !paused && !held && !document.hidden;

        if (running) {
            timer = setInterval(function () {
                show(current + 1);
                runBar(true);
            }, interval);
        }

        runBar(running);
    }

    function setPaused(value) {
        paused = value;
        pauseButton.setAttribute("aria-pressed", String(paused));
        pauseButton.setAttribute("aria-label", paused ? "Play automatic rotation" : "Pause automatic rotation");
        // Announce changes only when the visitor is driving
        stage.setAttribute("aria-live", paused ? "polite" : "off");
        restart();
    }

    function go(index) {
        show(index);
        restart();
    }

    carousel.querySelectorAll(".services__arrow").forEach(function (arrow) {
        arrow.addEventListener("click", function () {
            go(current + Number(arrow.getAttribute("data-dir")));
        });
    });

    pauseButton.addEventListener("click", function () {
        setPaused(!paused);
    });

    // Clicking a side card brings it to the center
    cards.forEach(function (card, i) {
        card.addEventListener("click", function (event) {
            if (card.getAttribute("data-pos") !== "center") {
                event.preventDefault();
                go(i);
            }
        });
    });

    // Hold still while the visitor is reading or using the controls
    carousel.addEventListener("mouseenter", function () {
        held = true;
        restart();
    });

    carousel.addEventListener("mouseleave", function () {
        held = false;
        restart();
    });

    carousel.addEventListener("focusin", function () {
        held = true;
        restart();
    });

    carousel.addEventListener("focusout", function (event) {
        if (!carousel.contains(event.relatedTarget)) {
            held = false;
            restart();
        }
    });

    carousel.addEventListener("keydown", function (event) {
        if (event.key === "ArrowLeft") {
            go(current - 1);
        } else if (event.key === "ArrowRight") {
            go(current + 1);
        }
    });

    // Swipe on touch screens
    var startX = null;

    stage.addEventListener("touchstart", function (event) {
        startX = event.touches[0].clientX;
    }, { passive: true });

    stage.addEventListener("touchend", function (event) {
        if (startX === null) {
            return;
        }

        var distance = event.changedTouches[0].clientX - startX;

        if (Math.abs(distance) > 40) {
            go(current + (distance < 0 ? 1 : -1));
        }

        startX = null;
    });

    document.addEventListener("visibilitychange", restart);

    // Nav links like #gap-year bring that card to the center
    function showLinkedCard() {
        var index = cards.findIndex(function (card) {
            return "#" + card.id === location.hash;
        });

        if (index > -1) {
            go(index);
        }
    }

    window.addEventListener("hashchange", showLinkedCard);

    carousel.style.setProperty("--interval", interval + "ms");
    carousel.classList.add("is-ready");
    show(0);
    showLinkedCard();
    setPaused(paused);
})();

/* ---------- Travel photo strip ----------
   Scrolls on its own (CSS); this wires up the pause button. */
(function () {
    "use strict";

    var gallery = document.querySelector(".gallery");

    if (!gallery) {
        return;
    }

    var button = gallery.querySelector(".gallery__pause");

    button.addEventListener("click", function () {
        var paused = !gallery.classList.contains("is-paused");
        gallery.classList.toggle("is-paused", paused);
        button.setAttribute("aria-pressed", String(paused));
        button.setAttribute("aria-label", paused ? "Play photo strip" : "Pause photo strip");
    });
})();

/* ---------- Final CTA photo rotation ----------
   Crossfades through her travel photos every 6 seconds. Each next
   photo loads a moment before it shows. Pauses with the button or a
   hidden tab, and stays on the first photo for reduced motion. */
(function () {
    "use strict";

    var cta = document.querySelector(".cta");

    if (!cta) {
        return;
    }

    var slides = cta.querySelectorAll(".cta__slide");
    var button = cta.querySelector(".cta__pause");
    var current = 0;
    var timer = null;
    var paused = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var started = false;

    function load(slide) {
        slide.querySelectorAll("source[data-srcset]").forEach(function (source) {
            source.srcset = source.dataset.srcset;
            source.removeAttribute("data-srcset");
        });

        var img = slide.querySelector("img[data-src]");

        if (img) {
            img.src = img.dataset.src;
            img.removeAttribute("data-src");
        }
    }

    function show(index) {
        var next = slides[index];
        var img = next.querySelector("img");

        function swap() {
            slides[current].classList.remove("is-active");
            next.classList.add("is-active");
            current = index;
            load(slides[(current + 1) % slides.length]);
        }

        load(next);

        if (img.complete && img.naturalWidth) {
            swap();
        } else {
            img.addEventListener("load", swap, { once: true });
        }
    }

    function restart() {
        clearInterval(timer);

        if (started && !paused && !document.hidden) {
            timer = setInterval(function () {
                show((current + 1) % slides.length);
            }, 6000);
        }
    }

    button.addEventListener("click", function () {
        paused = !paused;
        button.setAttribute("aria-pressed", String(paused));
        button.setAttribute("aria-label", paused ? "Play background photos" : "Pause background photos");
        restart();
    });

    document.addEventListener("visibilitychange", restart);

    // Only start (and fetch photo two) once the section is near the screen
    var observer = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
            started = true;
            load(slides[1]);
            restart();
            observer.disconnect();
        }
    }, { rootMargin: "200px 0px" });

    observer.observe(cta);

    if (paused) {
        button.setAttribute("aria-pressed", "true");
        button.setAttribute("aria-label", "Play background photos");
    }
})();

