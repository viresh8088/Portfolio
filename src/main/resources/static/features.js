/* =========================================
   FEATURES EXTENSION
   1. Jet HUD panels        9. Command Center
   2. Mission modal         10. Contact form
   3. GitHub live feed      11. Scroll progress
   4. Tech radar sweep      12. Back-to-top
   7. Settings + sound
   16. Console easter egg
========================================= */

const VS = {

    settings: {
        animations: true,
        particles: true,
        parallax: true,
        sound: false
    },

    motionQuery: window.matchMedia("(prefers-reduced-motion: reduce)"),

    allowMotion() {

        return this.settings.animations && !this.motionQuery.matches;

    },

    allowParallax() {

        return this.settings.parallax && this.allowMotion();

    },

    blip(frequency) {

        const AudioEngine = window.AudioContext || window.webkitAudioContext;

        if (!this.settings.sound || !AudioEngine) {
            return;
        }

        try {
            VS.audio = VS.audio || new AudioEngine();

            const osc = VS.audio.createOscillator();
            const gain = VS.audio.createGain();

            osc.type = "square";
            osc.frequency.value = frequency || 880;

            gain.gain.setValueAtTime(0.04, VS.audio.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, VS.audio.currentTime + 0.09);

            osc.connect(gain);
            gain.connect(VS.audio.destination);

            osc.start();
            osc.stop(VS.audio.currentTime + 0.09);
        } catch (error) {
            /* Audio is optional; blocked audio must never break interactions. */
        }

    }

};


/* =========================================
   SETTINGS PERSISTENCE
========================================= */

function applySettings() {

    const s = VS.settings;
    const motionAllowed = VS.allowMotion();

    document.body.classList.toggle("no-motion", !motionAllowed);
    document.body.classList.toggle("no-particles", !motionAllowed || !s.particles);

    document.querySelectorAll(".setting-switch").forEach(input => {

        input.checked = !!s[input.dataset.setting];

    });

    try {
        localStorage.setItem("vs-settings", JSON.stringify(s));
    } catch (error) {
        /* Storage can be unavailable in private or restricted browsing. */
    }

    window.dispatchEvent(new CustomEvent("vs:settings-change"));

}

(function loadSettings() {

    try {

        const saved = JSON.parse(localStorage.getItem("vs-settings"));

        if (saved && typeof saved === "object") {
            Object.keys(VS.settings).forEach(key => {
                if (typeof saved[key] === "boolean") {
                    VS.settings[key] = saved[key];
                }
            });
        }

    } catch (error) {
        /* Corrupted storage keeps the safe defaults. */
    }

    /* The operating-system preference always wins over saved settings. */
    if (VS.motionQuery.matches) {
        VS.settings.animations = false;
        VS.settings.particles = false;
        VS.settings.parallax = false;
    }

})();


/* =========================================
   17. SYSTEM SETTINGS PANEL
========================================= */

const settingsToggle = document.getElementById("settingsToggle");
const settingsPanel = document.getElementById("settingsPanel");

function setSettingsOpen(open) {

    settingsPanel.classList.toggle("open", open);
    settingsToggle.setAttribute("aria-expanded", String(open));

}

settingsToggle.addEventListener("click", () => {

    setSettingsOpen(!settingsPanel.classList.contains("open"));

    VS.blip(660);

});

document.querySelectorAll(".setting-switch").forEach(input => {

    input.addEventListener("change", () => {

        VS.settings[input.dataset.setting] = input.checked;

        if (VS.motionQuery.matches &&
            ["animations", "particles", "parallax"].includes(input.dataset.setting)) {
            VS.settings[input.dataset.setting] = false;
        }

        applySettings();

        VS.blip(input.checked ? 920 : 520);

    });

});

/* Close settings when clicking elsewhere. */

document.addEventListener("click", event => {

    if (settingsPanel.classList.contains("open") &&
        !settingsPanel.contains(event.target) &&
        event.target !== settingsToggle) {
        setSettingsOpen(false);
    }

});

applySettings();

VS.motionQuery.addEventListener("change", event => {

    if (event.matches) {
        VS.settings.animations = false;
        VS.settings.particles = false;
        VS.settings.parallax = false;
        applySettings();
    }

});


/* =========================================
   1. JET HUD PANELS REVEAL
========================================= */

window.addEventListener("load", () => {

    if (VS.allowMotion()) {
        setTimeout(() => document.body.classList.add("hud-on"), 2400);
    } else {
        document.body.classList.add("hud-on");
    }

});


/* =========================================
   12. SCROLL PROGRESS + 13. BACK TO TOP
========================================= */

const scrollProgress = document.getElementById("scrollProgress");
const backToTop = document.getElementById("backToTop");

let scrollFrame = 0;

window.addEventListener("scroll", () => {

    if (scrollFrame) {
        return;
    }

    scrollFrame = requestAnimationFrame(() => {

        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        const ratio = max > 0 ? window.scrollY / max : 0;

        scrollProgress.style.width = `${ratio * 100}%`;
        backToTop.classList.toggle("show", window.scrollY > 500);
        scrollFrame = 0;

    });

}, { passive: true });

backToTop.addEventListener("click", () => {

    window.scrollTo({ top: 0, behavior: VS.allowMotion() ? "smooth" : "auto" });

    VS.blip(740);

});


/* Shared modal behavior: inert background, focus trap, and focus restoration. */

const dialogState = {
    active: null,
    returnFocus: null,
    blockedElements: [],
    overflow: "",
    paddingRight: ""
};

const dialogFocusableSelector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
    'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function openDialog(overlay, trigger) {

    setSettingsOpen(false);

    if (dialogState.active === overlay) {
        return;
    }

    if (dialogState.active) {
        closeDialog(dialogState.active, false);
    }

    dialogState.active = overlay;
    dialogState.returnFocus = trigger || document.activeElement;
    dialogState.overflow = document.body.style.overflow;
    dialogState.paddingRight = document.body.style.paddingRight;
    dialogState.blockedElements = Array.from(document.body.children)
        .filter(element =>
            element !== overlay &&
            !element.classList.contains("mission-overlay") &&
            !element.classList.contains("cc-overlay") &&
            element.tagName !== "SCRIPT"
        )
        .map(element => {
            const wasInert = element.inert;
            element.inert = true;
            return { element, wasInert };
        });

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = "hidden";
    overlay.inert = false;
    overlay.setAttribute("aria-hidden", "false");
    overlay.classList.add("open");

    const panel = overlay.querySelector(".mission-panel, .cc-panel");

    if (panel) {
        panel.focus();
    }

}

function closeDialog(overlay, restoreFocus = true) {

    if (dialogState.active !== overlay) {
        return;
    }

    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    overlay.inert = true;

    dialogState.blockedElements.forEach(({ element, wasInert }) => {
        element.inert = wasInert;
    });

    document.body.style.overflow = dialogState.overflow;
    document.body.style.paddingRight = dialogState.paddingRight;

    const returnFocus = dialogState.returnFocus;

    dialogState.active = null;
    dialogState.returnFocus = null;
    dialogState.blockedElements = [];

    if (restoreFocus && returnFocus && returnFocus.isConnected) {
        returnFocus.focus();
    }

}

document.addEventListener("keydown", event => {

    const overlay = dialogState.active;

    if (!overlay) {
        return;
    }

    if (event.key === "Escape") {
        event.preventDefault();
        closeDialog(overlay);
        return;
    }

    if (event.key !== "Tab") {
        return;
    }

    const panel = overlay.querySelector(".mission-panel, .cc-panel");
    const focusable = panel
        ? Array.from(panel.querySelectorAll(dialogFocusableSelector))
            .filter(element => element.getClientRects().length > 0)
        : [];

    if (!focusable.length) {
        event.preventDefault();
        panel?.focus();
        return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey &&
        (document.activeElement === first || document.activeElement === panel ||
         !panel.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey &&
               (document.activeElement === last || document.activeElement === panel ||
                !panel.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
    }

});


/* =========================================
   14. COMMAND CENTER
========================================= */

const ccOpen = document.getElementById("ccOpen");
const ccOverlay = document.getElementById("ccOverlay");
const ccClose = document.getElementById("ccClose");

function openCC() {

    openDialog(ccOverlay, ccOpen);
    VS.blip(880);

}

function closeCC() {

    closeDialog(ccOverlay);

}

ccOpen.addEventListener("click", openCC);
ccClose.addEventListener("click", closeCC);

ccOverlay.addEventListener("click", event => {

    if (event.target === ccOverlay) {
        closeCC();
    }

});

document.querySelectorAll("[data-cc]").forEach(link => {

    link.addEventListener("click", closeCC);

});

/* Escape also closes the non-modal settings disclosure. */

document.addEventListener("keydown", event => {

    if (event.key === "Escape" && !dialogState.active) {
        setSettingsOpen(false);
    }

});


/* =========================================
   2. MISSION DETAILS MODAL
========================================= */

const missionOverlay = document.getElementById("missionOverlay");
const missionClose = document.getElementById("missionClose");

const missionTag = document.getElementById("missionTag");
const missionTitle = document.getElementById("missionTitle");
const missionProblem = document.getElementById("missionProblem");
const missionObjective = document.getElementById("missionObjective");
const missionImage = document.getElementById("missionImage");
const missionImageCaption = document.getElementById("missionImageCaption");
const missionVisualLabel = document.getElementById("missionVisualLabel");
const missionArchitecture = document.getElementById("missionArchitecture");
const missionTech = document.getElementById("missionTech");
const missionFeatures = document.getElementById("missionFeatures");
const missionChallenges = document.getElementById("missionChallenges");
const missionView = document.getElementById("missionView");
const missionGithub = document.getElementById("missionGithub");
const missionDemoNote = document.getElementById("missionDemoNote");
const missionNote = document.getElementById("missionNote");
const missionNoteText = document.getElementById("missionNoteText");
const missionPanel = missionOverlay.querySelector(".mission-panel");

function splitMissionValues(value) {

    return (value || "").split("|")
        .map(item => item.trim())
        .filter(Boolean);

}

function renderMissionArchitecture(card) {

    const layers = splitMissionValues(card.dataset.architecture);

    missionArchitecture.replaceChildren();
    missionArchitecture.setAttribute(
        "aria-label",
        `Project architecture: ${layers.join(" to ")}`
    );

    layers.forEach((layer, index) => {

        const node = document.createElement("div");
        const step = document.createElement("span");
        const label = document.createElement("strong");

        node.className = "architecture-node";
        step.textContent = String(index + 1).padStart(2, "0");
        label.textContent = layer;
        node.append(step, label);
        missionArchitecture.appendChild(node);

    });

}

function renderMissionChallenges(card) {

    missionChallenges.replaceChildren();

    splitMissionValues(card.dataset.challenges).forEach(entry => {

        const separator = entry.indexOf("~");

        if (separator < 1) {
            return;
        }

        const challenge = entry.slice(0, separator).trim();
        const solution = entry.slice(separator + 1).trim();
        const item = document.createElement("div");
        const challengeBlock = document.createElement("div");
        const solutionBlock = document.createElement("div");
        const challengeLabel = document.createElement("span");
        const solutionLabel = document.createElement("span");
        const challengeText = document.createElement("p");
        const solutionText = document.createElement("p");

        item.className = "challenge-item";
        challengeLabel.className = "small-label";
        solutionLabel.className = "small-label";
        challengeLabel.textContent = "CHALLENGE";
        solutionLabel.textContent = "SOLUTION";
        challengeText.textContent = challenge;
        solutionText.textContent = solution;
        challengeBlock.append(challengeLabel, challengeText);
        solutionBlock.append(solutionLabel, solutionText);
        item.append(challengeBlock, solutionBlock);
        missionChallenges.appendChild(item);

    });

}

function openMission(card) {

    const titleParts = splitMissionValues(card.dataset.title);
    const githubLink = card.dataset.github ||
        (card.dataset.links || "").split("|")[0];
    const demoLink = card.dataset.demo || "";
    const demoNote = card.dataset.demoNote || "";

    missionTag.textContent =
        `MISSION ${card.dataset.mission || "00"}`;

    missionTitle.innerHTML =
        `${ghEscape(titleParts[0] || "")}<em>${ghEscape(titleParts[1] || "")}</em>`;

    missionProblem.textContent = card.dataset.problem || "";
    missionObjective.textContent = card.dataset.objective || "";

    missionImage.src = card.dataset.image || "";
    missionImage.alt = card.dataset.imageAlt || "Project visual";
    missionImageCaption.textContent = card.dataset.imageCaption || "";
    missionVisualLabel.textContent = card.dataset.imageKind || "PROJECT VISUAL";

    renderMissionArchitecture(card);
    renderMissionChallenges(card);

    missionTech.replaceChildren();

    splitMissionValues(card.dataset.tech).forEach(tech => {

        const chip = document.createElement("span");

        chip.textContent = tech;
        missionTech.appendChild(chip);

    });

    missionFeatures.replaceChildren();

    splitMissionValues(card.dataset.features).forEach(feature => {

        const li = document.createElement("li");

        li.textContent = feature;
        missionFeatures.appendChild(li);

    });

    missionGithub.href = githubLink;
    missionGithub.hidden = !githubLink;
    missionView.href = demoLink || "#";
    missionView.textContent = card.dataset.demoLabel || "LIVE DEMO ↗";
    missionView.hidden = !demoLink;
    missionDemoNote.textContent = demoNote;
    missionDemoNote.hidden = !demoNote;
    missionNoteText.textContent = card.dataset.note || "";
    missionNote.hidden = !missionNoteText.textContent;

    missionPanel.scrollTop = 0;
    openDialog(missionOverlay, card);
    VS.blip(980);

}

function closeMission() {

    closeDialog(missionOverlay);

}

document.querySelectorAll(".project-card").forEach(card => {

    card.addEventListener("click", () => {

        /* Don't open while the user is selecting text. */
        if (window.getSelection().toString()) {
            return;
        }

        openMission(card);

    });

    card.addEventListener("keydown", event => {

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openMission(card);
        }

    });

});

missionClose.addEventListener("click", closeMission);

missionOverlay.addEventListener("click", event => {

    if (event.target === missionOverlay) {
        closeMission();
    }

});


/* =========================================
   3. GITHUB COMMAND CENTER (LIVE FEED)
========================================= */

const GH_USER = "viresh8088";

const LANG_COLORS = {
    Java: "#b07219",
    JavaScript: "#f1e05a",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Python: "#3572a5",
    TypeScript: "#3178c6"
};

function ghCount(el, target) {

    if (!el) {
        return;
    }

    if (!VS.allowMotion()) {
        el.textContent = target;
        return;
    }

    let current = 0;

    const step = Math.max(1, Math.ceil(target / 40));

    const timer = setInterval(() => {

        current += step;

        if (current >= target) {
            current = target;
            clearInterval(timer);
        }

        el.textContent = current;

    }, 40);

}

/* Escape network-sourced strings before inserting into markup */

function ghEscape(value) {

    return String(value ?? "").replace(
        /[&<>"']/g,
        c => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;"
        }[c])
    );

}

async function loadGitHub() {

    const grid = document.getElementById("ghGrid");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {

        const [reposRes, eventsRes] = await Promise.all([

            fetch(
                `https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=pushed`,
                { signal: controller.signal }
            ),
            fetch(
                `https://api.github.com/users/${GH_USER}/events?per_page=100`,
                { signal: controller.signal }
            )

        ]);

        if (!reposRes.ok) {
            throw new Error("GitHub API unavailable");
        }

        const repos = await reposRes.json();
        const events = eventsRes.ok ? await eventsRes.json() : [];

        const javaCount = repos.filter(r => r.language === "Java").length;
        const uiCount = repos.filter(
            r => ["HTML", "CSS", "JavaScript"].includes(r.language)
        ).length;
        const pushCount = eventsRes.ok
            ? events.filter(e => e.type === "PushEvent").reduce(
                (sum, e) => sum + (e.payload?.push_id ? 1 : (e.payload?.commits?.length || 0)),
                0
            )
            : null;

        ghCount(document.getElementById("ghRepos"), repos.length);
        ghCount(document.getElementById("ghJava"), javaCount);
        ghCount(document.getElementById("ghUi"), uiCount);

        const pushStat = document.getElementById("ghContrib");

        if (pushCount === null) {
            pushStat.textContent = "--";
        } else {
            ghCount(pushStat, pushCount);
        }

        grid.innerHTML = "";

        const designRepos = repos.filter(r => !r.fork).slice(0, 6);

        if (!designRepos.length) {
            grid.innerHTML =
                `<div class="gh-offline-note">No public repositories found yet — check back soon.</div>`;
            return;
        }

        designRepos.forEach(repo => {

            const card = document.createElement("div");
            const langColor = LANG_COLORS[repo.language] || "#7c8a99";

            card.classList.add("gh-card");
            card.innerHTML = `
                <h4>${ghEscape(repo.name.toUpperCase())}</h4>
                <p class="gh-desc">${ghEscape(repo.description || "No repository description provided.")}</p>
                <div class="gh-meta">
                    <i><span class="gh-lang" style="background:${ghEscape(langColor)}"></span>${ghEscape(repo.language || "N/A")}</i>
                    <i>★ ${Number(repo.stargazers_count) || 0}</i>
                    <i>⑂ ${Number(repo.forks_count) || 0}</i>
                </div>
                <a href="${ghEscape(encodeURI(repo.html_url))}" target="_blank" rel="noopener noreferrer">VIEW REPOSITORY ↗</a>
            `;

            grid.appendChild(card);

        });

    } catch (error) {

        grid.innerHTML = `
            <div class="gh-offline-note">
                LIVE UPLINK OFFLINE — GitHub API unreachable (rate limit or no connection).
                Visit
                <a href="https://github.com/${GH_USER}" target="_blank" rel="noopener noreferrer" style="color:var(--cyan)">github.com/${GH_USER}</a>
                directly.
            </div>
        `;

        ["ghRepos", "ghJava", "ghUi", "ghContrib"].forEach(id => {
            const stat = document.getElementById(id);
            if (stat) {
                stat.textContent = "--";
            }
        });

    } finally {
        clearTimeout(timeout);
    }

}

/* Fetch only when the section scrolls into view */

const githubSection = document.getElementById("github");

if (githubSection) {

    const ghObserver = new IntersectionObserver(
        (entries, observer) => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    loadGitHub();

                    observer.unobserve(entry.target);

                }

            });

        },
        { threshold: 0.1 }
    );

    ghObserver.observe(githubSection);

}


/* =========================================
   15. CONTACT FORM TRANSMISSION
========================================= */

const contactForm = document.getElementById("contactForm");

if (contactForm) {

    const cfSubmit = document.getElementById("cfSubmit");
    const cfFill = document.getElementById("cfFill");
    const cfStatus = document.getElementById("cfStatus");
    const submitMarkup = cfSubmit.innerHTML;
    const fields = {
        name: document.getElementById("cfName"),
        email: document.getElementById("cfEmail"),
        subject: document.getElementById("cfSubject"),
        message: document.getElementById("cfMessage")
    };

    let isSubmitting = false;

    function setContactStatus(message, state = "") {
        cfStatus.textContent = message;
        cfStatus.className = `cf-status${state ? ` is-${state}` : ""}`;
    }

    function clearFieldError(fieldName) {

        const input = fields[fieldName];
        const error = document.getElementById(`cf-${fieldName}-error`);

        if (!input) {
            return;
        }

        input.removeAttribute("aria-invalid");

        const describedBy = (input.getAttribute("aria-describedby") || "")
            .split(/\s+/)
            .filter(id => id && id !== `cf-${fieldName}-error`)
            .join(" ");

        if (describedBy) {
            input.setAttribute("aria-describedby", describedBy);
        } else {
            input.removeAttribute("aria-describedby");
        }

        error?.remove();

    }

    function showFieldError(fieldName, message) {

        const input = fields[fieldName];

        if (!input) {
            return;
        }

        clearFieldError(fieldName);

        const error = document.createElement("span");
        const errorId = `cf-${fieldName}-error`;

        error.id = errorId;
        error.className = "cf-field-error";
        error.textContent = message;
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", errorId);
        input.insertAdjacentElement("afterend", error);

    }

    function clearFieldErrors() {
        Object.keys(fields).forEach(clearFieldError);
    }

    contactForm.addEventListener("input", event => {
        if (fields[event.target.name]) {
            clearFieldError(event.target.name);
        }
    });

    contactForm.addEventListener("submit", async event => {

        event.preventDefault();

        if (isSubmitting) {
            return;
        }

        clearFieldErrors();
        setContactStatus("");

        if (!contactForm.reportValidity()) {
            setContactStatus("PLEASE CORRECT THE HIGHLIGHTED FIELDS.", "error");
            return;
        }

        const payload = {
            name: fields.name.value.trim(),
            email: fields.email.value.trim(),
            subject: fields.subject.value.trim(),
            message: fields.message.value.trim()
        };
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        isSubmitting = true;
        cfSubmit.disabled = true;
        cfSubmit.innerHTML = "TRANSMITTING... <span>▸▸▸</span>";
        cfSubmit.setAttribute("aria-busy", "true");
        cfFill.style.width = "25%";
        setContactStatus("TRANSMITTING SECURE PAYLOAD...", "loading");

        try {

            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            let data = null;

            try {
                data = await response.json();
            } catch (error) {
                data = null;
            }

            if (!response.ok) {

                if (Array.isArray(data?.fieldErrors)) {
                    data.fieldErrors.forEach(issue => {
                        showFieldError(issue.field, issue.message || "Invalid value");
                    });
                }

                const message = data?.message ||
                    (response.status === 409
                        ? "This message was already received. Please wait before trying again."
                        : "Transmission failed. Please try again later.");

                cfFill.style.width = "0";
                setContactStatus(String(message).toUpperCase(), "error");

                const firstInvalid = contactForm.querySelector('[aria-invalid="true"]');
                firstInvalid?.focus();
                return;
            }

            if (!data?.reference) {
                throw new Error("The server returned an invalid confirmation.");
            }

            cfFill.style.width = "100%";
            setContactStatus(
                `MESSAGE RECEIVED ✓ — REFERENCE ${data.reference}`,
                "success"
            );
            contactForm.reset();
            VS.blip(1180);

        } catch (error) {

            cfFill.style.width = "0";

            if (error.name === "AbortError") {
                setContactStatus("TRANSMISSION TIMED OUT. PLEASE TRY AGAIN.", "error");
            } else if (error instanceof TypeError) {
                setContactStatus("CONNECTION FAILED. CHECK YOUR NETWORK AND TRY AGAIN.", "error");
            } else {
                setContactStatus(error.message || "TRANSMISSION FAILED. PLEASE TRY AGAIN.", "error");
            }

        } finally {

            clearTimeout(timeout);
            isSubmitting = false;
            cfSubmit.disabled = false;
            cfSubmit.removeAttribute("aria-busy");
            cfSubmit.innerHTML = submitMarkup;

        }

    });

}


/* =========================================
   16. CONSOLE EASTER EGG
========================================= */

function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({
        behavior: VS.allowMotion() ? "smooth" : "auto"
    });
}

window.viresh = {

    help() {

        console.log(
            `%cAVAILABLE COMMANDS`,
            "font-size:13px;font-weight:bold;color:#00eaff;"
        );

        console.table({
            "about()":        "Jump to the About section",
            "skills()":       "Jump to Technical Skills",
            "projects()":     "Jump to Selected Projects",
            "certifications()": "Jump to Certifications",
            "github()":       "Open GitHub Command Center",
            "contact()":      "Jump to Contact",
            "viewResume()":   "Open latest resume in new tab",
            "resume()":       "Trigger resume download",
            "missions()":     "List all project missions"
        });

        return "SYSTEM READY.";
    },

    about() {
        scrollToSection("about");
        return "→ ABOUT";
    },

    skills() {
        scrollToSection("skills");
        return "→ SKILLS";
    },

    projects() {
        scrollToSection("projects");
        return "→ PROJECTS";
    },

    certifications() {
        scrollToSection("certifications");
        return "→ CERTIFICATIONS";
    },

    github() {
        scrollToSection("github");
        return "→ GITHUB COMMAND CENTER";
    },

    contact() {
        scrollToSection("contact");
        return "→ CONTACT";
    },

    viewResume() {
        window.open("assets/resume/Viresh_Resume.pdf", "_blank", "noopener,noreferrer");
        return "↗ OPENING LATEST RESUME...";
    },

    resume() {

        const a = document.createElement("a");

        a.href = "assets/resume/Viresh_Resume.pdf";
        a.download = "Viresh_Saradar_Resume.pdf";
        a.click();

        return "⇩ DOWNLOADING LATEST RESUME...";
    },

    missions() {

        return Array.from(
            document.querySelectorAll(".project-card")
        ).map(card =>
            `MISSION ${card.dataset.mission} — ${card.dataset.title.replace("|", " ")}`
        );
    }

};

console.log(
    "%c⚙ DEV CONSOLE UNLOCKED — type viresh.help()",
    "font-size:12px;color:#00bfff;"
);
