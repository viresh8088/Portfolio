/* =========================================
   LOADER
========================================= */

window.addEventListener("load", () => {

    const loader = document.getElementById("loader");
    const loaderText = loader.querySelector("p");

    if (!VS.allowMotion()) {
        loader.classList.add("hidden");
        return;
    }

    let progress = 0;

    const counter = setInterval(() => {

        progress = Math.min(progress + Math.ceil(Math.random() * 18), 100);

        if (loaderText) {
            loaderText.textContent =
                `INITIALIZING SYSTEM... ${progress}%`;
        }

        if (progress === 100) {
            clearInterval(counter);
        }

    }, 220);

    setTimeout(() => {

        clearInterval(counter);

        loader.classList.add("hidden");

        /* Start jet idle animation once system is online */
        const jetEl = document.querySelector(".jet-container");

        if (jetEl) {
            jetEl.classList.add("in-flight");
        }

    }, 1800);

});


/* =========================================
   MOBILE MENU
========================================= */

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("primaryNavigation");
const mobileNavigationQuery = window.matchMedia("(max-width: 1200px)");

function setNavigationOpen(open) {

    const isOpen = mobileNavigationQuery.matches && open;

    navLinks.classList.toggle("open", isOpen);
    navLinks.inert = mobileNavigationQuery.matches && !isOpen;
    menuToggle.textContent = isOpen ? "✕" : "☰";
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");

}

menuToggle.addEventListener("click", () => {
    setNavigationOpen(!navLinks.classList.contains("open"));
});

/* Close mobile menu after choosing a destination. */
document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => setNavigationOpen(false));
});

mobileNavigationQuery.addEventListener("change", () => setNavigationOpen(false));

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && navLinks.classList.contains("open")) {
        setNavigationOpen(false);
        menuToggle.focus();
    }
});

setNavigationOpen(false);


/* =========================================
   ACTIVE NAVIGATION
========================================= */

const sections = document.querySelectorAll("section[id]");
const navigationLinks = document.querySelectorAll(".nav-links a");

let navigationFrame = 0;

window.addEventListener("scroll", () => {

    if (navigationFrame) {
        return;
    }

    navigationFrame = requestAnimationFrame(() => {

        let currentSection = "";

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            const sectionHeight = section.offsetHeight;

            if (window.scrollY >= sectionTop &&
                window.scrollY < sectionTop + sectionHeight) {
                currentSection = section.getAttribute("id");
            }
        });

        navigationLinks.forEach(link => {
            const isActive = link.getAttribute("href") === `#${currentSection}`;

            link.classList.toggle("active", isActive);

            if (isActive) {
                link.setAttribute("aria-current", "location");
            } else {
                link.removeAttribute("aria-current");
            }
        });

        navigationFrame = 0;

    });

}, { passive: true });


/* =========================================
   PARTICLES
========================================= */

const particleContainer =
    document.getElementById("particles");

function createParticles() {

    if (!particleContainer ||
        !VS.settings.particles ||
        !VS.allowMotion() ||
        particleContainer.childElementCount) {
        return;
    }

    const particleCount = window.innerWidth < 700 ? 28 : 45;

    for (
        let i = 0;
        i < particleCount;
        i++
    ) {

        const particle =
            document.createElement("span");

        particle.classList.add("particle");

        particle.style.left =
            Math.random() * 100 + "%";

        particle.style.animationDuration =
            5 + Math.random() * 10 + "s";

        particle.style.animationDelay =
            Math.random() * 8 + "s";

        particle.style.opacity =
            Math.random();

        particleContainer.appendChild(
            particle
        );

    }

}

function syncParticles() {

    if (!particleContainer) {
        return;
    }

    if (VS.settings.particles && VS.allowMotion()) {
        createParticles();
    } else {
        particleContainer.replaceChildren();
    }
}

syncParticles();

window.addEventListener("vs:settings-change", syncParticles);

if (particleContainer && "IntersectionObserver" in window) {
    const particleObserver = new IntersectionObserver(entries => {
        particleContainer.classList.toggle("is-paused", !entries[0].isIntersecting);
    });

    particleObserver.observe(particleContainer);
}


/* =========================================
   SCROLL REVEAL
========================================= */

const revealElements =
    document.querySelectorAll(
        ".skill-card, .skill-cat-card, .soft-skills-container, .project-card, .achievement-card, .certificate, .certificate-card, .cert-note, .timeline-item, .experience-card, .design-grid, .about-grid, " +
        ".build-intro, .build-step, .build-tech, .build-principles, .build-footer"
    );


revealElements.forEach(element => {
    element.classList.add("reveal");
});

if (VS.allowMotion()) {
    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );

    revealElements.forEach(element => revealObserver.observe(element));
} else {
    revealElements.forEach(element => element.classList.add("visible"));
}


/* Stagger reveals inside each grid */

if (VS.allowMotion()) {
    document.querySelectorAll(
        ".skills-grid, .skills-category-grid, .projects-grid, " +
        ".achievement-grid, .certification-grid, .timeline, .build-journey"
    ).forEach(grid => {
        Array.from(grid.children).forEach((child, index) => {
            child.style.transitionDelay = `${index * 0.12}s`;
        });
    });
}


/* =========================================
   SKILL BAR ANIMATION
   (fills to data-level when scrolled in)
========================================= */

const skillBars =
    document.querySelectorAll(".skill-bar span");

if (VS.allowMotion()) {
    skillBars.forEach(bar => {
        bar.style.width = "0";
    });

    const skillObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.width = `${entry.target.dataset.level}%`;
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.4 }
    );

    skillBars.forEach(bar => skillObserver.observe(bar));
} else {
    skillBars.forEach(bar => {
        bar.style.width = `${bar.dataset.level}%`;
    });
}


/* =========================================
   PARALLAX EFFECT
   (jet sits inside .jet-parallax wrapper so
   the CSS entrance/bob animation is untouched)
========================================= */

const jetWrapper = document.querySelector(".jet-parallax");
let parallaxFrame = 0;
let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;

window.addEventListener("mousemove", event => {

    if (!jetWrapper) {
        return;
    }

    if (window.innerWidth <= 1000 || !VS.allowParallax()) {
        jetWrapper.style.transform = "";
        return;
    }

    pointerX = event.clientX;
    pointerY = event.clientY;

    if (!parallaxFrame) {
        parallaxFrame = requestAnimationFrame(() => {
            const x = pointerX / window.innerWidth - 0.5;
            const y = pointerY / window.innerHeight - 0.5;

            jetWrapper.style.transform =
                `translate(${x * 25}px, calc(-50% + ${y * 15}px))`;
            parallaxFrame = 0;
        });
    }

}, { passive: true });


/* =========================================
   PROJECT CARD TILT
========================================= */

const projectCards =
    document.querySelectorAll(".project-card");


projectCards.forEach(card => {

    let tiltFrame = 0;
    let tiltX = 0;
    let tiltY = 0;

    card.addEventListener("mousemove", event => {

        if (window.innerWidth < 800 || !VS.allowMotion()) {
            return;
        }

        tiltX = event.clientX;
        tiltY = event.clientY;

        if (!tiltFrame) {
            tiltFrame = requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                const x = tiltX - rect.left;
                const y = tiltY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -3;
                const rotateY = ((x - centerX) / centerX) * 3;

                card.style.transform =
                    `perspective(700px) rotateX(${rotateX}deg) ` +
                    `rotateY(${rotateY}deg) translateY(-5px)`;
                card.style.setProperty("--glow-x", `${x}px`);
                card.style.setProperty("--glow-y", `${y}px`);
                tiltFrame = 0;
            });
        }

    });

    card.addEventListener("mouseleave", () => {
        cancelAnimationFrame(tiltFrame);
        tiltFrame = 0;
        card.style.transform = "";
    });

});


/* =========================================
   SMOOTH BUTTON CLICK
========================================= */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

    anchor.addEventListener("click", function(event) {

        const href = this.getAttribute("href");

        if (!href || href === "#") {
            return;
        }

        const target = document.querySelector(href);

        if (!target) {
            return;
        }

        event.preventDefault();

        if (!target.hasAttribute("tabindex")) {
            target.setAttribute("tabindex", "-1");
        }

        target.focus({ preventScroll: true });
        target.scrollIntoView({ behavior: VS.allowMotion() ? "smooth" : "auto" });

    });

});


/* =========================================
   TERMINAL TYPING EFFECT
   (runs when the terminal scrolls into view)
========================================= */

const terminalLines =
    document.querySelectorAll(
        ".terminal-output"
    );

function typeLine(line, delay) {

    const originalText =
        line.textContent;

    line.textContent = "";

    setTimeout(() => {

        let character = 0;

        const typing =
            setInterval(() => {

                line.textContent +=
                    originalText[character];

                character++;

                if (
                    character >=
                    originalText.length
                ) {

                    clearInterval(typing);

                }

            }, 45);

    }, delay);

}

const terminal =
    document.querySelector(".contact-terminal");

if (terminal && VS.allowMotion()) {

    const terminalObserver =
        new IntersectionObserver(
            (entries, observer) => {

                entries.forEach(entry => {

                    if (entry.isIntersecting) {

                        terminalLines.forEach((line, index) => {

                            typeLine(line, 1000 + index * 700);

                        });

                        observer.unobserve(entry.target);

                    }

                });

            },
            {
                threshold: 0.3
            }
        );

    terminalObserver.observe(terminal);

}


/* =========================================
   DESIGN-SYSTEM IMAGE SHOWCASE
   (shows the image when assets/images/design_system.jpg
   exists, otherwise keeps the animated vector mock)
========================================= */

const designShowcase =
    document.getElementById("designShowcase");

if (designShowcase) {

    const designImg =
        designShowcase.querySelector("img");

    const screenMock =
        document.querySelector(".screen-mock");

    designImg.addEventListener("load", () => {

        designShowcase.classList.add("loaded");

        if (screenMock) {
            screenMock.classList.add("hidden");
        }

    });

    designImg.addEventListener("error", () => {

        designShowcase.remove();

    });

}


/* =========================================
   CONSOLE MESSAGE
========================================= */

console.log(
    "%cVIRESH SARADAR",
    "font-size:25px;font-weight:bold;color:#00eaff;"
);

console.log(
    "%cJava Full Stack Developer | UI/UX Designer",
    "font-size:14px;color:#ffffff;"
);

console.log(
    "%cThink Different. Design Different.",
    "font-size:12px;color:#00bfff;"
);