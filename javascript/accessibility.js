/* =========================================================
   A Nomad's Consulting — accessibility page behavior
   ========================================================= */

/* ---------- "On this page" follows your scroll ----------
   Highlights the link for whichever statement section is in the
   middle of the screen. */
(function () {
    "use strict";

    var toc = document.querySelector(".statement__toc");

    if (!toc || !("IntersectionObserver" in window)) {
        return;
    }

    var links = {};
    var current = null;

    toc.querySelectorAll("a[href^='#']").forEach(function (link) {
        links[link.getAttribute("href").slice(1)] = link;
    });

    function setActive(id) {
        var link = links[id];

        if (!link || link === current) {
            return;
        }

        if (current) {
            current.classList.remove("is-active");
            current.removeAttribute("aria-current");
        }

        current = link;
        current.classList.add("is-active");
        current.setAttribute("aria-current", "location");
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                setActive(entry.target.id);
            }
        });
    }, { rootMargin: "-40% 0px -55% 0px" });

    Object.keys(links).forEach(function (id) {
        var section = document.getElementById(id);

        if (section) {
            observer.observe(section);
        }
    });

    // Start on the first section
    setActive(Object.keys(links)[0]);
})();
