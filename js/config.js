/* ==========================================================================
   WEDDING CONTENT — the only file you need to edit for text.
   Everything on the website (names, story, events, RSVP) is read from here.
   Placeholder content is marked  // ✎  — replace it with your details.
   ========================================================================== */

window.WEDDING = {
  /* ---------- The couple ---------- */
  couple: {
    first:  "Simran",
    second: "Rajat",
    initials: ["R", "S"],
    hashtag: "#RajKiSimran"
  },

  /* ---------- Hero ---------- */
  hero: {
    eyebrow: "The wedding celebrations of",
    dateLine: "24 – 26 November 2026",
    place: ""
  },

  /* Wedding moment used for the countdown (ISO format, with India offset) */
  countdownTo: "2026-11-26T20:00:00+05:30",

  /* ---------- The invitation statement (lights up word by word on scroll) ---------- */
  statement:
    "Our story wouldn’t be complete without you. Please join us as we tie the knot.",

  /* ---------- Opening screen (tap to open; also starts the music) ---------- */
  intro: {
    enabled: true,
    blessing: "श्री गणेशाय नमः",       // shown at the very top of the opening screen (Hindi)
    line: "You are invited to the wedding of",
    button: "Open the invitation"
  },

  /* ---------- Our Story ---------- */
  story: {
    title: "How it all began",
    intro:
      "Less than a kilometre apart till 16 years of age, and somehow, we never crossed paths. Then a music class brought us into the same room, sharing the same सुर but never a single word.",
    milestones: [                                                           // ✎ photo: optional, files in assets/story/<name>-480.webp and -800.webp (4:5)
      { when: "2015", title: "The first hello",
        text: "A Facebook poke broke the silence, and after days of poking back and forth, it all began. On 16th May 2015, two school kids who knew nothing about life promised to never give up on each other." },
      { when: "2017 – 2020", title: "Long distance, chapter one",
        text: "Rajat left for college, and love moved to late-night phone calls and counting the days till the next holiday home. Through the miles, ghar walon ki daant, and every up and down, we held on." },
      { when: "2020", title: "Together, finally… or so we thought",
        text: "The miles finally disappeared, and everything we had waited for was just a short drive away. We were sure the hardest part was behind us." },
      { when: "2023 – 2025", title: "Long distance, chapter two",
        text: "Then Simran moved to Bangalore. Back to video calls that ran past midnight, falling asleep on call, and missing each other in two different cities. Until the day Rajat waited at arrivals with a sign, and this time, she was home for good.",
        photo: { s: "assets/story/arrival", w: 800, h: 1000, caption: "Long distance, finally over", alt: "Rajat at the airport arrivals gate holding a sign that reads VIP Arrival: Simran Nagpal, Simran beside him with a bouquet." } },
      { when: "11 January 2026", title: "The question",
        text: "Candles, roses, a sky full of sparklers and one glowing question. Rajat went down on one knee, and she said yes!!",
        photo: { s: "assets/story/proposal", w: 800, h: 1000, caption: "She said yes!", alt: "Rajat on one knee holding out a ring to Simran under a floral arch and a neon sign reading Will you marry me?" } },
      { when: "2026", title: "Forever begins",
        text: "More than 11 years, two long distances and countless calls later, we can’t wait to make it official. And now we want to celebrate it with the people who made us who we are — you ❤️",
        photo: { s: "assets/story/forever", w: 800, h: 1000, caption: "Just the beginning", alt: "Simran and Rajat walking hand in hand down a red earth path, Simran looking back and smiling with sunflowers raised." } }
    ]
  },

  /* ---------- Film interlude ---------- */
  film: {
    quote: "Whatever our souls are made of, his and mine are the same.", // ✎
    attribution: "Emily Brontë"                                          // ✎ or ""
  },

  /* ---------- Events (from the printed invitation) ----------
     id      → lowercase, matches the photo name: inputs/03_events/event-<id>.jpg
     date    → "YYYY-MM-DD"     start / end → 24h "HH:MM" (end optional)
     mapsUrl → paste the Google Maps share link. If empty, a Maps search for the address is used.
     art     → the card's illustration for this function (shown until you add an event photo)
     tone    → background colour of the card when there's no photo                                */
  events: [
    {
      id: "engagement", name: "Engagement", tagline: "",
      art: "assets/flora/engagement.webp",
      date: "2026-11-24", start: "11:00",
      venue: "Khatir Grace", address: "Near Omaxe World Street, Sector 79, Faridabad",
      mapsUrl: "", dress: "", tone: "#F2CFC9"
    },
    {
      art: "assets/flora/haldi.webp",
      id: "haldi", name: "Haldi", tagline: "Join us as we bless the couple with love, laughter, and haldi traditions.",
      date: "2026-11-25", start: "11:00",
      venue: "Green Leaves Farm & Restaurant", address: "Amolik Chowk, Neherpar, Faridabad",
      mapsUrl: "", dress: "Hues of Yellow", tone: "#EFD9A0"
    },
    {
      art: "assets/flora/sangeet.webp",
      id: "sangeet", name: "Sangeet", tagline: "Get ready to dance to Bollywood beats and make unforgettable memories. Followed by dinner.",
      date: "2026-11-25", start: "18:00",
      venue: "Green Leaves Farm & Restaurant", address: "Amolik Chowk, Neherpar, Faridabad",
      mapsUrl: "", dress: "Glitters", tone: "#DCC3CF"
    },
    {
      id: "wedding", name: "Wedding", tagline: "",
      art: "assets/flora/wedding.webp",
      date: "2026-11-26", start: "20:00",
      venue: "Amber Resort", address: "Mahipal Green Valley, Surajkund Road, Faridabad",
      mapsUrl: "", dress: "", tone: "#E8B9B1"
    }
  ],

  /* ---------- Editions (filtered versions of the invitation) ----------
     Which events each version hides. The active one is set in js/edition.js
     (tools/build-edition.sh writes it). See docs/EDITIONS.md.                 */
  editions: {
    "full":     {},
    "no-haldi": { exclude: ["haldi"] }
  },

  /* ---------- Gallery ---------- */
  gallery: {
    title: "Moments",
    intro: "A few frames from the story so far."
  },

  /* ---------- RSVP ----------
     endpoint → the Google Apps Script "Web app URL" (see docs/RSVP-SETUP.md).
                Until it's set, the form shows a friendly "not connected yet" message. */
  rsvp: {
    endpoint: "https://script.google.com/macros/s/AKfycbwLgEbgZq2xaD8F722t3fFaQFv_v-6Sv8UeDIb8lj3Bqm4BZijc9BMSsgFzNEclwg2_/exec",
    deadline: "",                       // ✎ e.g. "10 November 2026" (sentence hidden while empty)
    maxGuests: 6
  },

  /* ---------- Footer ---------- */
  contacts: [
    { label: "RSVP", name: "Nagpal, Bhatia, Arora & Gera Family", phones: ["+91 99990 12909", "+91 98109 61010"] }
  ],
  signoff: "",                          // ✎ e.g. "With love, the Nagpal & Ahuja families"

  timezone: "Asia/Kolkata"
};
