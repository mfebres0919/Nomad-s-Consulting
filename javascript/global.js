/* =========================================================
   A Nomad's Consulting — shared behavior
   ========================================================= */

/* ---------- Navigation ----------
   Hamburger opens the menu panel, Services opens its dropdown
   (click on any screen, hover on desktop), Escape and outside
   clicks close everything, and the bar firms up on scroll. */
(function () {
    "use strict";

    var nav = document.getElementById("nav");

    if (!nav) {
        return;
    }

    var toggle = nav.querySelector(".nav__toggle");
    var dropItem = nav.querySelector(".nav__item--dropdown");
    var dropToggle = nav.querySelector(".nav__drop-toggle");
    var desktop = window.matchMedia("(min-width: 1024px)");
    var hoverable = window.matchMedia("(hover: hover)");
    var closeTimer = null;

    function setMenu(open) {
        nav.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");

        if (!open) {
            setDropdown(false);
        }
    }

    function setDropdown(open) {
        if (!dropItem) {
            return;
        }

        clearTimeout(closeTimer);
        dropItem.classList.toggle("is-open", open);
        dropToggle.setAttribute("aria-expanded", String(open));
    }

    toggle.addEventListener("click", function () {
        setMenu(!nav.classList.contains("is-open"));
    });

    if (dropItem) {
        dropToggle.addEventListener("click", function () {
            setDropdown(!dropItem.classList.contains("is-open"));
        });

        dropItem.addEventListener("mouseenter", function () {
            if (desktop.matches && hoverable.matches) {
                setDropdown(true);
            }
        });

        dropItem.addEventListener("mouseleave", function () {
            if (desktop.matches && hoverable.matches) {
                closeTimer = setTimeout(function () {
                    setDropdown(false);
                }, 180);
            }
        });

        // Close the dropdown when keyboard focus leaves it
        dropItem.addEventListener("focusout", function (event) {
            if (!dropItem.contains(event.relatedTarget)) {
                setDropdown(false);
            }
        });
    }

    // Choosing a link closes the menu so the page can scroll to it
    nav.querySelectorAll(".nav__menu a").forEach(function (link) {
        link.addEventListener("click", function () {
            setMenu(false);
        });
    });

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") {
            return;
        }

        if (dropItem && dropItem.classList.contains("is-open")) {
            setDropdown(false);
            dropToggle.focus();
        } else if (nav.classList.contains("is-open")) {
            setMenu(false);
            toggle.focus();
        }
    });

    document.addEventListener("click", function (event) {
        if (!nav.contains(event.target)) {
            setMenu(false);
        }
    });

    // Reset the mobile menu when the screen grows to desktop
    desktop.addEventListener("change", function () {
        setMenu(false);
    });

    // Firmer glass once the page scrolls
    var ticking = false;

    function updateScrolled() {
        ticking = false;
        nav.classList.toggle("is-scrolled", window.scrollY > 24);
    }

    window.addEventListener("scroll", function () {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(updateScrolled);
        }
    }, { passive: true });

    updateScrolled();
})();

/* ---------- Active section in the nav ----------
   Highlights the link for whichever section is in the middle of
   the screen, and slides the desktop pill behind it. */
(function () {
    "use strict";

    var menu = document.querySelector(".nav__menu");
    var indicator = document.querySelector(".nav__indicator");

    if (!menu || !("IntersectionObserver" in window)) {
        return;
    }

    var desktop = window.matchMedia("(min-width: 1024px)");
    var links = {};
    var current = null;

    // Top-level links by section id. Services sub-sections light up
    // the Services button.
    menu.querySelectorAll(".nav__links > .nav__item > .nav__link[href^='#']").forEach(function (link) {
        links[link.getAttribute("href").slice(1)] = link;
    });

    var servicesToggle = menu.querySelector(".nav__drop-toggle");

    if (servicesToggle) {
        menu.querySelectorAll(".nav__dropdown-link").forEach(function (link) {
            links[link.getAttribute("href").slice(1)] = servicesToggle;
        });
    }

    function placeIndicator() {
        if (!indicator) {
            return;
        }

        if (!current || !desktop.matches) {
            indicator.classList.remove("is-visible");
            return;
        }

        var box = menu.getBoundingClientRect();
        var rect = current.getBoundingClientRect();
        indicator.style.width = rect.width + "px";
        indicator.style.transform = "translateX(" + (rect.left - box.left) + "px)";
        indicator.classList.add("is-visible");
    }

    function setActive(id) {
        var link = links[id] || null;

        if (link === current) {
            return;
        }

        if (current) {
            current.classList.remove("is-active");
            current.removeAttribute("aria-current");
        }

        current = link;

        if (current) {
            current.classList.add("is-active");

            if (current.tagName === "A") {
                current.setAttribute("aria-current", "location");
            }
        }

        placeIndicator();
    }

    // A section counts as "current" when it crosses the middle band of the screen
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                setActive(entry.target.id);
            }
        });
    }, { rootMargin: "-45% 0px -50% 0px" });

    Object.keys(links).forEach(function (id) {
        var section = document.getElementById(id);

        if (section) {
            observer.observe(section);
        }
    });

    window.addEventListener("resize", placeIndicator);
    desktop.addEventListener("change", placeIndicator);

    if (document.fonts) {
        document.fonts.ready.then(placeIndicator);
    }
})();

/* ---------- Footer year ---------- */
(function () {
    "use strict";

    var year = document.querySelector(".footer__year");

    if (year) {
        year.textContent = new Date().getFullYear();
    }
})();

/* ---------- Back to top ----------
   Shows the button once the visitor has scrolled past the first screen. */
(function () {
    "use strict";

    var button = document.querySelector(".back-to-top");

    if (!button) {
        return;
    }

    var ticking = false;

    function update() {
        ticking = false;
        button.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.6);
    }

    window.addEventListener("scroll", function () {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    }, { passive: true });

    update();
})();
