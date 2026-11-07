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

/* ---------- Smooth scrolling (Lenis) ----------
   Mouse wheel and trackpad scrolling ease slightly instead of jumping.
   lerp 0.15 stays close to native so it never feels laggy. Touch
   scrolling stays native, and it's off for reduced motion. In-page
   links glide to their section and still land below the header. */
(function () {
    "use strict";

    // Mouse and trackpad only: touch scrolling is native anyway, and
    // skipping Lenis there saves phones a constant animation loop
    if (typeof Lenis === "undefined" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        return;
    }

    var lenis = new Lenis({ lerp: 0.15, smoothWheel: true });
    window.lenis = lenis;

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    document.addEventListener("click", function (event) {
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) {
            return;
        }

        var link = event.target.closest("a[href^='#']");

        if (!link || link.getAttribute("href").length < 2) {
            return;
        }

        var target = document.getElementById(link.getAttribute("href").slice(1));

        if (!target) {
            return;
        }

        event.preventDefault();

        var pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
        lenis.scrollTo(target, { offset: -pad });
        history.pushState(null, "", link.getAttribute("href"));

        // Let listeners (like the services carousel) react to the new hash
        window.dispatchEvent(new HashChangeEvent("hashchange"));

        // Move keyboard focus too, like a normal anchor jump
        if (!target.hasAttribute("tabindex")) {
            target.setAttribute("tabindex", "-1");
        }

        target.focus({ preventScroll: true });
    });
})();

/* ---------- Load images when their section arrives ----------
   Images below the hero carry data-src / data-srcset and only load
   when their section is about to come on screen. Each one fades in
   once it has loaded. */
(function () {
    "use strict";

    var sections = document.querySelectorAll("main > section, footer");

    function loadImages(scope) {
        scope.querySelectorAll("img[data-src]").forEach(function (img) {
            var picture = img.closest("picture");

            if (img.closest("[data-lazy-skip]")) {
                return;
            }

            if (picture) {
                picture.querySelectorAll("source[data-srcset]").forEach(function (source) {
                    source.srcset = source.dataset.srcset;
                    source.removeAttribute("data-srcset");
                });
            }

            img.classList.add("is-pending");
            img.addEventListener("load", function () {
                img.classList.add("is-loaded");
                img.classList.remove("is-pending");
            }, { once: true });

            img.src = img.dataset.src;
            img.removeAttribute("data-src");
        });
    }

    if (!("IntersectionObserver" in window)) {
        loadImages(document);
        sections.forEach(function (section) {
            section.classList.add("is-near");
        });
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                loadImages(entry.target);
                // Lets CSS background art load now too
                entry.target.classList.add("is-near");
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: "100px 0px" });

    sections.forEach(function (section) {
        observer.observe(section);
    });

    // Slideshow photos load on their own schedule; show them softly too
    document.addEventListener("load", function (event) {
        if (event.target.tagName === "IMG") {
            event.target.classList.add("is-loaded");
        }
    }, true);
})();

/* ---------- Fade-ins ----------
   Elements with data-reveal fade in slowly (about 2.2s) as they come
   on screen. Once finished, the attribute is removed so the element
   gets its normal transitions back (button hovers and so on). */
(function () {
    "use strict";

    var items = document.querySelectorAll("[data-reveal]");

    function finish(el) {
        el.addEventListener("transitionend", function done(event) {
            if (event.target === el && event.propertyName === "filter") {
                el.removeAttribute("data-reveal");
                el.removeAttribute("data-reveal-delay");
                el.removeEventListener("transitionend", done);
            }
        });
    }

    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        items.forEach(function (el) {
            el.classList.add("is-revealed");
        });
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-revealed");
                finish(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });

    items.forEach(function (el) {
        observer.observe(el);
    });
})();

