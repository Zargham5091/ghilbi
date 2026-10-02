// lib/content.ts
/** Shared (server + client) content model, defaults and sanitizer. */

export type ThemeKey = "dawn" | "amber" | "purple" | "green" | "rose";
export type SceneKind = "desk" | "hills" | "forest" | "city" | "vineyard";

export interface Theme {
    label: string;
    accent: string;
    from: string;
    via: string;
    to: string;
}

export const THEMES: Record<ThemeKey, Theme> = {
    dawn: {label: "Dawn Blue", accent: "#8ec5ff", from: "#1e3a6e", via: "#4b6fb3", to: "#a9c9ee"},
    amber: {label: "Golden Hour", accent: "#f6b756", from: "#7a2e2e", via: "#d9772b", to: "#f6c76e"},
    purple: {label: "Dusk Purple", accent: "#c4a3ff", from: "#2b2350", via: "#7a4f9e", to: "#e08fb0"},
    green: {label: "Forest Green", accent: "#8fd9a8", from: "#0f3b2e", via: "#2f7d5b", to: "#bfe3a0"},
    rose: {label: "Rose Wine", accent: "#ff9bb0", from: "#3b1020", via: "#a3324f", to: "#f4a38c"},
};

export const THEME_KEYS = Object.keys(THEMES) as ThemeKey[];
export const SCENE_KINDS: SceneKind[] = ["desk", "hills", "forest", "city", "vineyard"];

export interface Chapter {
    id: string;
    kicker: string;
    period: string;
    title: string;
    jp: string;
    story: string;
    struggle: string;
    goal: string;
    lesson: string;
    code: string;
    output: string;
    theme: ThemeKey;
    scene: SceneKind;
    /** Hex id of an image stored in MongoDB ("" = none). */
    imageId: string;
    /** Optional external image URL, used when imageId is empty. */
    imageUrl: string;
    /** Hex id of a music file stored in MongoDB ("" = none). */
    audioId: string;
    /** Optional external audio URL, used when audioId is empty. */
    audioUrl: string;
    /** Second where the played part of the track begins. */
    audioStart: number;
    /** How many seconds of the track play (then it loops). */
    audioLen: number;
}

export interface Profile {
    name: string;
    role: string;
    company: string;
    jpBadge: string;
}

export interface ThenNow {
    oldLabel: string;
    newLabel: string;
    oldCode: string;
    services: string[];
}

export interface SiteContent {
    profile: Profile;
    chapters: Chapter[];
    thenNow: ThenNow;
    goalsAhead: string[];
}

export const DEFAULT_CONTENT: SiteContent = {
    profile: {
        name: "Zargham Ali",
        role: "Senior Software Engineer",
        company: "AgileTech",
        jpBadge: "敏捷技術",
    },
    chapters: [
        {
            id: "c1",
            kicker: "Chapter 01",
            period: "Day Zero",
            title: "Hello, World",
            jp: "はじめまして",
            story:
                "It began with a blinking cursor. One line of code, one tiny message — and suddenly the world felt buildable.",
            struggle: "Nothing made sense yet. Brackets, semicolons, and error messages that looked like English but weren't.",
            goal: "Make the computer say something, anything, on purpose.",
            lesson: "Every expert once stared at an empty file and typed their first print().",
            code: 'console.log("Hello, World!");',
            output: "Hello, World!",
            theme: "purple",
            scene: "desk",
            imageId: "",
            imageUrl: "",
            audioId: "",
            audioUrl: "",
            audioStart: 45, // Blue Bird (Naruto Shippuden OP): chorus lifts
            audioLen: 12, // seconds that loop when a visitor stays (auto-play moves on after 3-5 s)
        },
        {
            id: "c2",
            kicker: "Chapter 02",
            period: "The Learning Years",
            title: "Tutorial Hell & Late Nights",
            jp: "努力の日々",
            story:
                "Courses, documentation, unfinished side projects and far too many browser tabs. Progress came in tiny inches, then, one evening, all at once.",
            struggle:
                "Imposter syndrome crept in as I pasted answers I didn't yet understand and broke things I didn't know could break.",
            goal: "Build one whole project, start to finish, without a tutorial open beside it.",
            lesson: "Confusion is just understanding that hasn't finished loading.",
            code: "// why is this undefined?!\nconsole.log(user.name);",
            output: "TypeError: Cannot read properties of undefined",
            theme: "green",
            scene: "forest",
            imageId: "",
            imageUrl: "",
            audioId: "",
            audioUrl: "",
            audioStart: 30, // Unravel (Tokyo Ghoul OP): haunting intro
            audioLen: 12, // seconds that loop when a visitor stays (auto-play moves on after 3-5 s)
        },
        {
            id: "c3",
            kicker: "Chapter 03",
            period: "Year 1 · The Spark",
            title: "First Commit & Foundations",
            jp: "最初のコミット",
            story:
                "The first real job. A shared repository, a team that already knew where everything lived, and my name on a commit. I learned Git, code review, and how to ask good questions.",
            struggle:
                "Reading a huge codebase I hadn't written, afraid one wrong push would break everything.",
            goal: "Understand the foundations well enough to be trusted with real tasks.",
            lesson: "Small, careful commits beat big, heroic ones.",
            code: 'git commit -m "feat: my first real commit"',
            output: "[main 1a2b3c4] feat: my first real commit",
            theme: "dawn",
            scene: "hills",
            imageId: "",
            imageUrl: "",
            audioId: "",
            audioUrl: "",
            audioStart: 50, // Again (Fullmetal Alchemist: Brotherhood OP): beat drops
            audioLen: 12, // seconds that loop when a visitor stays (auto-play moves on after 3-5 s)
        },
        {
            id: "c4",
            kicker: "Chapter 04",
            period: "Shipping to Real Users",
            title: "Tiny Wins",
            jp: "小さな勝利",
            story:
                "The first feature that real people actually used. Tests went green, the deploy finished, and somewhere a stranger clicked a button I had built.",
            struggle:
                "Learning to estimate better, asking for help, and surviving my first big code review.",
            goal: "Own a feature from idea to production.",
            lesson: "Shipping teaches faster than any course ever could.",
            code: "npm test && npm run deploy",
            output: "✔ All tests passed. Deployed 🚀",
            theme: "green",
            scene: "hills",
            imageId: "",
            imageUrl: "",
            audioId: "",
            audioUrl: "",
            audioStart: 65, // Silhouette (Naruto Shippuden OP): energetic chorus
            audioLen: 12, // seconds that loop when a visitor stays (auto-play moves on after 3-5 s)
        },
        {
            id: "c5",
            kicker: "Chapter 05",
            period: "The Production Dragon",
            title: "The 2 AM Incident",
            jp: "夜の戦い",
            story:
                "An alert at night, dashboards glowing red, and a bug that only existed in production. We traced it together, fixed it, and wrote down what we learned.",
            struggle: "Legacy code, unclear logs, and the pressure of systems people depend on.",
            goal: "Stay calm, find the root cause, and make sure it never happens the same way again.",
            lesson: "Good logs and a calm team are worth more than any clever trick.",
            code: "grep ERROR orders.log | tail -n 5",
            output: "Found it: a missing null check. 🐉",
            theme: "purple",
            scene: "city",
            imageId: "",
            imageUrl: "",
            audioId: "",
            audioUrl: "",
            audioStart: 40, // My War (Attack on Titan OP): intensity
            audioLen: 12, // seconds that loop when a visitor stays (auto-play moves on after 3-5 s)
        },
        {
            id: "c6",
            kicker: "Chapter 06",
            period: "Year 2 · The Level Up",
            title: "Building the Big Picture",
            jp: "大規模開発",
            story:
                "Two years in, the work changed shape. Instead of single features I was designing whole systems: services that talk to each other, pipelines that deploy safely, and code other engineers can trust. Collaboration taught me that trust in code matters as much as speed.",
            struggle:
                "Trade-offs everywhere. Speed or safety, simple or flexible, and learning to explain decisions to people who don't write code.",
            goal: "Design enterprise-scale solutions that are reliable, understandable and kind to the next developer.",
            lesson: "Senior doesn't mean knowing everything. It means making the whole team better.",
            code: "// from one line… to a whole platform\nplatform.deploy({ gateway, auth, orders, events });",
            output: "8 services healthy ✅",
            theme: "amber",
            scene: "city",
            imageId: "",
            imageUrl: "",
            audioId: "",
            audioUrl: "",
            audioStart: 55, // Crossing Field (Sword Art Online OP): uplift
            audioLen: 12, // seconds that loop when a visitor stays (auto-play moves on after 3-5 s)
        },
        {
            id: "c7",
            kicker: "Chapter 07",
            period: "Looking Ahead",
            title: "Aging Like Fine Wine",
            jp: "熟成",
            story:
                "Two years in, I'm not the same person who typed that first line. Growth needed patience, pressure, and cracked bottles along the way.",
            struggle:
                "Staying curious when everything moves fast, and remembering that growth doesn't always feel like progress.",
            goal: "Keep learning, keep mentoring, and keep building things that last.",
            lesson: "Be patient with yourself. The good stuff gets better with age.",
            code: "while (alive) {\n  learn();\n  build();\n  share();\n}",
            output: "Cheers to the next year 🥂",
            theme: "rose",
            scene: "vineyard",
            imageId: "",
            imageUrl: "",
            audioId: "",
            audioUrl: "",
            audioStart: 70, // Brave Shine (Fate/stay night OP): emotional chorus
            audioLen: 12, // seconds that loop when a visitor stays (auto-play moves on after 3-5 s)
        },
    ],
    thenNow: {
        oldLabel: "Hello, World",
        newLabel: "Full-scale enterprise",
        oldCode: 'console.log("Hello, World!");',
        services: [
            "API Gateway",
            "Auth Service",
            "Orders Service",
            "Event Bus",
            "Database + Cache",
            "CI/CD Pipeline",
            "Monitoring",
            "Docs & Reviews",
        ],
    },
    goalsAhead: [
        "Architect systems that serve millions",
        "Mentor the next wave of engineers",
        "Give a first conference talk",
        "Learn something new every quarter",
    ],
};

/* ---------------- sanitizer ---------------- */

const str = (v: unknown, max: number, fallback = ""): string =>
    typeof v === "string" ? v.slice(0, max) : fallback;

const list = (v: unknown, maxItems: number, maxLen: number, fallback: string[]): string[] => {
    if (!Array.isArray(v)) return fallback;
    return v
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.trim().slice(0, maxLen))
        .filter(Boolean)
        .slice(0, maxItems);
};

const num = (v: unknown, min: number, max: number, fallback: number): number =>
    typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

export const MAX_CHAPTERS = 12;

function sanitizeChapter(raw: unknown, i: number): Chapter {
    const r = isObj(raw) ? raw : {};
    const theme = THEME_KEYS.includes(r.theme as ThemeKey) ? (r.theme as ThemeKey) : "amber";
    const scene = SCENE_KINDS.includes(r.scene as SceneKind) ? (r.scene as SceneKind) : "hills";
    const imageId = typeof r.imageId === "string" && /^[a-f0-9]{24}$/.test(r.imageId) ? r.imageId : "";
    const imageUrl = typeof r.imageUrl === "string" && /^https?:\/\//i.test(r.imageUrl) ? r.imageUrl.slice(0, 600) : "";
    return {
        id: str(r.id, 40) || `c${i + 1}-${Math.random().toString(36).slice(2, 7)}`,
        kicker: str(r.kicker, 40),
        period: str(r.period, 60),
        title: str(r.title, 80),
        jp: str(r.jp, 40),
        story: str(r.story, 700),
        struggle: str(r.struggle, 400),
        goal: str(r.goal, 400),
        lesson: str(r.lesson, 400),
        code: str(r.code, 400),
        output: str(r.output, 200),
        theme,
        scene,
        imageId,
        imageUrl,
        audioId: typeof r.audioId === "string" && /^[a-f0-9]{24}$/.test(r.audioId) ? r.audioId : "",
        audioUrl: typeof r.audioUrl === "string" && /^https?:\/\//i.test(r.audioUrl) ? r.audioUrl.slice(0, 600) : "",
        audioStart: num(r.audioStart, 0, 3600, 0),
        audioLen: num(r.audioLen, 1, 30, 5),
    };
}

export function sanitizeContent(raw: unknown): SiteContent {
    const d = DEFAULT_CONTENT;
    if (!isObj(raw)) return d;
    const p = isObj(raw.profile) ? raw.profile : {};
    const t = isObj(raw.thenNow) ? raw.thenNow : {};
    const chapters = Array.isArray(raw.chapters)
        ? raw.chapters.slice(0, MAX_CHAPTERS).map(sanitizeChapter)
        : [];
    return {
        profile: {
            name: str(p.name, 60, d.profile.name),
            role: str(p.role, 80, d.profile.role),
            company: str(p.company, 60, d.profile.company),
            jpBadge: str(p.jpBadge, 30, d.profile.jpBadge),
        },
        chapters: chapters.length ? chapters : d.chapters,
        thenNow: {
            oldLabel: str(t.oldLabel, 40, d.thenNow.oldLabel),
            newLabel: str(t.newLabel, 40, d.thenNow.newLabel),
            oldCode: str(t.oldCode, 300, d.thenNow.oldCode),
            services: list(t.services, 12, 40, d.thenNow.services),
        },
        goalsAhead: list(raw.goalsAhead, 8, 90, d.goalsAhead),
    };
}

export function blankChapter(n: number): Chapter {
    return {
        id: `c${Date.now().toString(36)}`,
        kicker: `Chapter ${String(n).padStart(2, "0")}`,
        period: "A new chapter",
        title: "Untitled chapter",
        jp: "新章",
        story: "Tell this part of the story…",
        struggle: "What was hard?",
        goal: "What were you aiming for?",
        lesson: "What did you learn?",
        code: "// something you wrote\nconsole.log('new chapter');",
        output: "new chapter",
        theme: "amber",
        scene: "hills",
        imageId: "",
        imageUrl: "",
        audioId: "",
        audioUrl: "",
        audioStart: 0,
        audioLen: 5,
    };
}