// Fluency Gym content: levels, activities, prompts and the recovery toolkit.
// All times are in seconds. Content is plain data so it can be localized or
// extended without touching the engine or UI.

export const LEVELS = [
  {
    id: 1,
    name: 'Foundation',
    zone: 'Warm-Up Zone',
    pressure: 'Low',
    color: '#2f9e6e',
    goal: 'Make speaking feel automatic and safe.',
    description:
      'Generous prep time, familiar topics and ready-made language chunks. ' +
      'You build the "muscle memory" of speaking so that less of your brain ' +
      'is busy searching for words when pressure arrives later.',
    showScaffolds: true,
    showToolkit: true,
    unlock: null,
  },
  {
    id: 2,
    name: 'Builder',
    zone: 'Strength Zone',
    pressure: 'Medium',
    color: '#d98a1c',
    goal: 'Organize ideas quickly and recover from gaps.',
    description:
      'Shorter prep, shrinking time limits and deliberate word gaps. You ' +
      'practise structuring answers on the spot and talking around words ' +
      'you do not know, instead of freezing.',
    showScaffolds: true,
    showToolkit: true,
    unlock: { fromLevel: 1, minReps: 6, minDistinct: 3, minAvgFluency: 3 },
  },
  {
    id: 3,
    name: 'Performance',
    zone: 'Arena',
    pressure: 'High',
    color: '#d6453d',
    goal: 'Stay fluent under real-world pressure.',
    description:
      'Little or no prep, rapid-fire questions, surprise interruptions and ' +
      'assigned opinions. Scaffolds are removed so you rely on the habits ' +
      'you built in the first two levels.',
    showScaffolds: false,
    showToolkit: false,
    unlock: { fromLevel: 2, minReps: 8, minDistinct: 3, minAvgFluency: 3 },
  },
];

// Things a listener might say while you are talking (Level 3 curveballs).
export const INTERRUPTIONS = [
  'Sorry, could you give me an example?',
  'Wait — why do you think that?',
  'Can you say that more simply?',
  "Hmm, I'm not sure I agree.",
  'What do you mean by that exactly?',
  'Sorry, I missed that. What was your main point?',
  'How does that affect you personally?',
  'Is that always true?',
  'Can you speed up a bit? We are short on time.',
  'Interesting — what would the opposite view be?',
];

export const CONNECTORS = [
  'first of all', 'on the other hand', 'for example', 'however',
  'as a result', 'what is more', 'in my experience', 'that said',
  'the main reason is', 'to sum up', 'in contrast', 'because of this',
  'even though', 'not only… but also', 'as far as I know',
];

export const FILLERS = [
  'um', 'umm', 'uh', 'uhh', 'er', 'erm', 'ah', 'hmm',
  'like', 'you know', 'i mean', 'basically', 'sort of', 'kind of',
];

export const ACTIVITIES = [
  // ───────────────────────── Level 1 · Foundation ─────────────────────────
  {
    id: 'shadow-echo',
    level: 1,
    name: 'Shadow Echo',
    skill: 'Rhythm & automaticity',
    tagline: 'Hear a sentence, repeat it instantly with the same rhythm.',
    why:
      'Shadowing trains pronunciation, stress and rhythm without any ' +
      'pressure to invent content, so high-frequency phrases become automatic.',
    steps: [
      'Listen to the model sentence (it is read aloud).',
      'Repeat it immediately, copying speed, stress and intonation.',
      "Don't stop to fix mistakes — keep the flow going.",
    ],
    tts: true,
    rounds: [
      { prep: 0, speak: 8, fresh: true },
      { prep: 0, speak: 8, fresh: true },
      { prep: 0, speak: 8, fresh: true },
      { prep: 0, speak: 8, fresh: true },
      { prep: 0, speak: 8, fresh: true },
    ],
    scaffolds: ['Mumble along if needed — sound first, accuracy second.'],
    prompts: [
      "To be honest, I haven't really thought about it before.",
      "That's a good question — let me think for a second.",
      'What I mean is, it depends on the situation.',
      "I'm not completely sure, but I think it's a good idea.",
      'The thing is, I usually prefer to plan ahead.',
      'Could you say that again, please? I missed the last part.',
      'In my opinion, the most important thing is to stay calm.',
      'I see what you mean, but I look at it a bit differently.',
      "Let me put it another way: it's easier than it looks.",
      "As far as I know, it's open until six o'clock.",
      'Honestly, it was one of the best days I have had in a while.',
      "Sorry, I've lost my train of thought. Where was I?",
      "That reminds me of something that happened last year.",
      'If I had more time, I would definitely try it.',
    ],
  },
  {
    id: 'chunk-reps',
    level: 1,
    name: 'Chunk Reps',
    skill: 'Ready-made phrases',
    tagline: 'Take one useful chunk and say three different sentences with it.',
    why:
      'Fluent speakers rely on pre-built "chunks" rather than assembling every ' +
      'word. Repeating a chunk in new sentences stores it for fast retrieval.',
    steps: [
      'Read the chunk shown on screen.',
      'Say at least three different sentences that use it.',
      'Make the sentences about your own life — it sticks better.',
    ],
    rounds: [{ prep: 10, speak: 40, fresh: false }],
    scaffolds: [
      'Sentence 1: about today. Sentence 2: about your past. Sentence 3: about your future.',
    ],
    prompts: [
      'The thing is, …',
      "I've been meaning to …",
      "It's not that …, it's just that …",
      'What I like most about … is …',
      'I used to …, but now …',
      "I'm thinking of …",
      "It depends on whether …",
      'The best part was when …',
      "I'd rather … than …",
      "It took me a while to …",
      "If it were up to me, …",
      "I'm not a big fan of …",
    ],
  },
  {
    id: 'picture-this',
    level: 1,
    name: 'Picture This',
    skill: 'Describing with a scaffold',
    tagline: 'Describe something familiar using a simple What–Where–Details–Feeling frame.',
    why:
      'Familiar content reduces cognitive load, and a fixed frame removes the ' +
      '"what do I say next?" panic, so attention goes to speaking smoothly.',
    steps: [
      'Picture the topic clearly in your head during prep.',
      'Walk through the frame: What is it? Where? Three details. How do you feel about it?',
      'Keep talking until the timer ends — add more details if you finish early.',
    ],
    rounds: [{ prep: 30, speak: 60, fresh: false }],
    scaffolds: ['What is it?', 'Where / when?', 'Three details (look, sound, people)', 'How do you feel about it — and why?'],
    prompts: [
      'Your favourite room in your home',
      'Your typical morning routine',
      'A café or restaurant you like',
      'The street where you grew up',
      'Your favourite piece of clothing',
      'A photo on your phone that you like',
      'The view from your window',
      'A local market or shop you visit often',
      'Your favourite way to relax at the weekend',
      'A gift you received and loved',
      'The best meal you have ever had',
      'A person you see every day',
    ],
  },
  {
    id: 'easy-questions',
    level: 1,
    name: 'Easy Answers',
    skill: 'Confidence on familiar topics',
    tagline: 'Answer three friendly personal questions, one after another.',
    why:
      'Starting with questions you already know the answers to builds a ' +
      'success habit: your brain learns that speaking = OK, not danger.',
    steps: [
      'Read the question and start answering when the timer begins.',
      'Give a short answer, then add one reason and one example.',
      "Short pauses are fine. Use a toolkit phrase if you're stuck.",
    ],
    rounds: [
      { prep: 10, speak: 30, fresh: true },
      { prep: 10, speak: 30, fresh: true },
      { prep: 10, speak: 30, fresh: true },
    ],
    scaffolds: ['Answer → Reason ("because…") → Example ("for example…")'],
    prompts: [
      'What do you usually do after work or school?',
      'What kind of music do you like?',
      'Tell me about your hometown.',
      'What did you eat yesterday?',
      'Do you prefer mornings or evenings? Why?',
      'What is your favourite season?',
      'How do you usually travel to work or school?',
      'What is a hobby you enjoy?',
      'Who is someone you like spending time with?',
      'What was the last film or series you watched?',
      'What is something you want to learn this year?',
      'Describe your ideal weekend.',
    ],
  },

  // ───────────────────────── Level 2 · Builder ─────────────────────────
  {
    id: 'four-three-two',
    level: 2,
    name: '4‑3‑2 Retell',
    skill: 'Speed through repetition',
    tagline: 'Tell the same story three times with less time each round.',
    why:
      'Based on Nation\'s 4/3/2 technique: repeating content under shrinking ' +
      'time pushes you to speak faster with fewer pauses, because the ' +
      'ideas are already planned.',
    steps: [
      'Plan a short story during prep.',
      'Round 1: tell it fully (90 s). Round 2: same story, 60 s. Round 3: 45 s.',
      'Keep all the key points — just say them more fluently each time.',
    ],
    rounds: [
      { prep: 30, speak: 90, fresh: false },
      { prep: 5, speak: 60, fresh: false },
      { prep: 5, speak: 45, fresh: false },
    ],
    scaffolds: ['Beginning: set the scene', 'Middle: what went wrong / surprised you', 'End: how it finished + what you learned'],
    prompts: [
      'A time you got lost',
      'Your first day at a new job or school',
      'A trip that did not go as planned',
      'A time you helped someone',
      'The most embarrassing moment you are happy to share',
      'A time you had to make a quick decision',
      'How you met a close friend',
      'A time you learned something the hard way',
      'A memorable celebration',
      'A problem you solved recently',
    ],
  },
  {
    id: 'prep-answer',
    level: 2,
    name: 'PREP Answer',
    skill: 'Structuring opinions fast',
    tagline: 'Give an opinion using Point → Reason → Example → Point.',
    why:
      'A reusable structure means you never start from zero. Under pressure, ' +
      'the frame carries you while you find the words.',
    steps: [
      'Decide your position in the short prep time — any position is fine.',
      'Point: state it. Reason: say why. Example: make it real. Point: repeat it.',
      'Aim to finish your final Point before the timer ends.',
    ],
    rounds: [{ prep: 15, speak: 60, fresh: false }],
    scaffolds: ['P — "I think…"', 'R — "The main reason is…"', 'E — "For example…"', 'P — "So overall, I believe…"'],
    prompts: [
      'Should everyone learn to cook?',
      'Is it better to live in a city or in the countryside?',
      'Should phones be banned in schools?',
      'Is working from home better than working in an office?',
      'Are video games good for children?',
      'Should public transport be free?',
      'Is it important to travel abroad?',
      'Do social media make people happier?',
      'Should people retire earlier?',
      'Is it better to rent or to buy a home?',
      'Should tourists learn the local language?',
      'Is failure necessary for success?',
    ],
  },
  {
    id: 'talk-around-it',
    level: 2,
    name: 'Talk Around It',
    skill: 'Recovering from word gaps',
    tagline: 'Explain a word without saying it — the core anti-freeze skill.',
    why:
      'Freezing often starts with one missing word. Circumlocution ("it\'s a ' +
      'kind of…", "the thing you use to…") keeps you talking when a word ' +
      'disappears.',
    steps: [
      'You get a word. Do NOT say it.',
      'Describe it: what type of thing, what it is used for, where you find it, what it looks like.',
      'Imagine a listener who must guess it.',
    ],
    rounds: [
      { prep: 5, speak: 30, fresh: true },
      { prep: 5, speak: 30, fresh: true },
      { prep: 5, speak: 30, fresh: true },
    ],
    scaffolds: ["It's a kind of…", "You use it to / when…", "You usually find it in…", "It looks / feels like…", "It's the opposite of…"],
    prompts: [
      'umbrella', 'dentist', 'passport', 'ladder', 'wallet', 'thermometer',
      'neighbour', 'charger', 'receipt', 'elevator', 'sunscreen', 'deadline',
      'landlord', 'refund', 'traffic jam', 'hangover', 'wedding', 'blister',
    ],
  },
  {
    id: 'role-play',
    level: 2,
    name: 'Real-World Role-Play',
    skill: 'Everyday transactions',
    tagline: 'Handle a practical situation from start to finish.',
    why:
      'Transactional situations (shops, phone calls, complaints) are where ' +
      'learners most often feel rushed. Rehearsing them lowers real-life anxiety.',
    steps: [
      'Read the situation. Plan your opening line in prep.',
      'Speak your side: greet, explain the problem, ask for what you need, respond to the other person.',
      'When the other person "speaks" (pop-up), react naturally.',
    ],
    interruptions: 1,
    rounds: [{ prep: 20, speak: 75, fresh: false }],
    scaffolds: ['Hi, I was wondering if you could help me…', 'The problem is…', 'Would it be possible to…?', 'Thanks, I appreciate it.'],
    prompts: [
      'Call a restaurant to book a table for six on Friday, but you have one guest with a nut allergy.',
      'Return a pair of shoes that broke after two days. You lost the receipt.',
      'Tell your landlord the heating has not worked for three days.',
      'Ask your manager for a day off next week for a family event.',
      'Explain to a doctor\'s receptionist that you need an appointment today.',
      'Your hotel room is noisy. Ask the front desk to change it.',
      'Your internet is down. Call customer support.',
      'You were charged twice at a shop. Explain the problem at the counter.',
      'Ask a neighbour politely to turn their music down.',
      'You missed your train. Ask the ticket office about your options.',
    ],
  },
  {
    id: 'link-it-up',
    level: 2,
    name: 'Link It Up',
    skill: 'Connected speech',
    tagline: 'Talk about a topic and naturally use three required connectors.',
    why:
      'Connectors make speech sound fluent and give you "thinking time" while ' +
      'they are being said. Forcing them in builds the habit.',
    steps: [
      'Look at the topic and the three connectors.',
      'Speak for 60 seconds and use all three connectors naturally.',
      'Tick them off in your head as you use them.',
    ],
    requirements: { pool: CONNECTORS, count: 3, label: 'Use these connectors' },
    rounds: [{ prep: 15, speak: 60, fresh: false }],
    scaffolds: ['Put a connector at the start of each new idea.'],
    prompts: [
      'Technology in daily life', 'Learning a new language', 'Healthy habits',
      'Your city', 'Friendship', 'Money and saving', 'Holidays', 'The future of work',
      'Food and culture', 'Sport', 'Climate and the environment', 'Online shopping',
    ],
  },

  // ───────────────────────── Level 3 · Performance ─────────────────────────
  {
    id: 'hot-seat',
    level: 3,
    name: 'Hot Seat',
    skill: 'Instant responses',
    tagline: 'Six rapid questions. Three seconds to think. Go.',
    why:
      'Real conversations rarely give prep time. Rapid-fire practice trains ' +
      'you to start speaking before your answer is "perfect".',
    steps: [
      'Each question appears with only 3 seconds before you must speak.',
      'Start with a buying-time phrase if you need to — then answer.',
      'Any answer is better than silence. Keep moving.',
    ],
    rounds: Array.from({ length: 6 }, () => ({ prep: 3, speak: 15, fresh: true })),
    scaffolds: ['"Good question — I\'d say…"'],
    prompts: [
      'What is the best advice you have ever received?',
      'If you could live anywhere, where would it be?',
      'What makes a good teacher?',
      'What would you do with an extra hour every day?',
      'What is overrated?',
      'Describe yourself in three words and explain one.',
      'What is a skill everyone should have?',
      'What is the hardest part of learning a language?',
      'Cats or dogs — and why?',
      'What would you change about your city?',
      'What is something you changed your mind about?',
      'What is your biggest strength?',
      'What small thing makes you happy?',
      'What job would you never do?',
      'What is a tradition from your culture you love?',
      'What would you tell your younger self?',
    ],
  },
  {
    id: 'curveball',
    level: 3,
    name: 'Curveball Talk',
    skill: 'Handling interruptions',
    tagline: 'Talk for 90 seconds while surprise questions interrupt you.',
    why:
      'Interruptions are a major trigger for freezing. Practising "respond ' +
      'and return" teaches you to recover your thread instead of losing it.',
    steps: [
      'Start talking about the topic.',
      'When a pop-up interrupts, respond to it directly.',
      'Then return: "Anyway, as I was saying…" and continue.',
    ],
    interruptions: 3,
    rounds: [{ prep: 10, speak: 90, fresh: false }],
    scaffolds: ['Respond → "Anyway, as I was saying…" → continue'],
    prompts: [
      'Why people should (or should not) learn history',
      'The role of technology in education',
      'What makes a city a good place to live',
      'Should people work four days a week?',
      'The importance of sleep',
      'How your country has changed in the last 20 years',
      'Why hobbies matter for adults',
      'The pros and cons of tourism',
      'What makes a good leader',
      'Is it better to be a specialist or a generalist?',
    ],
  },
  {
    id: 'mock-interview',
    level: 3,
    name: 'Mock Interview',
    skill: 'High-stakes answers',
    tagline: 'Four interview questions, five seconds to think each.',
    why:
      'Interviews combine evaluation, time pressure and unpredictable ' +
      'questions — the exact mix that causes performance anxiety.',
    steps: [
      'Imagine you are in a real interview. Sit up and make eye contact with the screen.',
      'Answer each question clearly; use STAR for experience questions (Situation, Task, Action, Result).',
      'If you blank, buy time politely, then answer.',
    ],
    rounds: Array.from({ length: 4 }, () => ({ prep: 5, speak: 45, fresh: true })),
    scaffolds: ['STAR: Situation → Task → Action → Result'],
    prompts: [
      'Tell me about yourself.',
      'Why do you want this position?',
      'Describe a challenge you faced and how you handled it.',
      'What is your greatest weakness?',
      'Tell me about a time you worked in a team.',
      'Where do you see yourself in five years?',
      'Describe a time you made a mistake at work or school.',
      'How do you deal with stress?',
      'Why should we choose you over other candidates?',
      'Tell me about a time you had to learn something quickly.',
      'How do you handle disagreement with a colleague?',
      'Do you have any questions for us?',
    ],
  },
  {
    id: 'devils-advocate',
    level: 3,
    name: "Devil's Advocate",
    skill: 'Arguing an assigned view',
    tagline: 'Your side is revealed only when the timer starts.',
    why:
      'Defending a view you did not choose removes the comfort of prepared ' +
      'opinions and trains flexible, on-the-spot reasoning.',
    steps: [
      'Read the motion during prep — think about BOTH sides.',
      'When speaking starts, your side appears. Argue it convincingly.',
      'Give at least two reasons and one example.',
    ],
    reveal: ['Argue FOR the motion', 'Argue AGAINST the motion'],
    rounds: [{ prep: 10, speak: 60, fresh: false }],
    scaffolds: ['Some people think… but I would argue…'],
    prompts: [
      'Homework should be banned.',
      'Everyone should have a four-day work week.',
      'Cash should be abolished.',
      'Children should learn to code before they learn a second language.',
      'Cities should ban private cars from the centre.',
      'University education should be free.',
      'Social media does more harm than good.',
      'It is better to have a few close friends than many acquaintances.',
      'Artificial intelligence will create more jobs than it destroys.',
      'Tourists should pay extra taxes in popular cities.',
    ],
  },
  {
    id: 'spotlight',
    level: 3,
    name: 'Spotlight Talk',
    skill: 'Impromptu presentation',
    tagline: 'A two-minute talk on a random word. Zero preparation.',
    why:
      'The ultimate test: sustaining speech with no plan. Connect the word ' +
      'to any story, opinion or fact — the goal is to keep going.',
    steps: [
      'A single word appears. Start speaking immediately.',
      'Link it to something you know: a memory, an opinion, a fact.',
      'If you run out, connect to a new angle: "Another thing this makes me think of is…"',
    ],
    rounds: [{ prep: 0, speak: 120, fresh: false }],
    scaffolds: ['Memory → Opinion → Wider world → Conclusion'],
    prompts: [
      'Bridges', 'Silence', 'Keys', 'Rain', 'Mistakes', 'Coffee', 'Maps',
      'Mirrors', 'Neighbours', 'Deadlines', 'Luck', 'Shoes', 'Windows', 'Time',
      'Borders', 'Noise',
    ],
  },
];

// Phrases for buying time, repairing and recovering — the anti-freeze kit.
export const TOOLKIT = [
  {
    id: 'buy-time',
    title: 'Buy thinking time',
    when: 'You need a few seconds before answering.',
    phrases: [
      "That's a good question…",
      'Let me think about that for a second.',
      "Hmm, that's an interesting one.",
      "Well, I'd say that…",
      "I've never really thought about it, but…",
    ],
  },
  {
    id: 'word-gap',
    title: 'Missing a word',
    when: 'The exact word will not come.',
    phrases: [
      "It's a kind of…",
      "It's the thing you use to…",
      "I don't know the word in English, but it's like…",
      "What's the word… it's similar to…",
      'The opposite of…',
    ],
  },
  {
    id: 'clarify',
    title: 'Clarify or ask for repetition',
    when: 'You did not understand, or need a moment.',
    phrases: [
      'Sorry, could you say that again?',
      'Do you mean…?',
      'Could you speak a bit more slowly, please?',
      'Just to check — you are asking about…?',
    ],
  },
  {
    id: 'self-correct',
    title: 'Fix a mistake smoothly',
    when: 'You notice an error mid-sentence.',
    phrases: ['Sorry, I mean…', 'Let me rephrase that.', 'What I meant to say was…', 'Or rather…'],
  },
  {
    id: 'get-back',
    title: 'Get back on track',
    when: 'You lost your thread or were interrupted.',
    phrases: [
      'Anyway, as I was saying…',
      'Where was I? Oh yes…',
      'Going back to my main point…',
      "Sorry, I've lost my train of thought. What I wanted to say is…",
    ],
  },
  {
    id: 'handle-interruption',
    title: 'Handle interruptions',
    when: 'Someone challenges or cuts in.',
    phrases: [
      "That's a fair point, but…",
      'Good question — for example…',
      'I see what you mean. However…',
      'Can I just finish my point?',
    ],
  },
  {
    id: 'finish',
    title: 'Finish confidently',
    when: 'You want to end instead of trailing off.',
    phrases: ['So, to sum up…', "That's basically how I see it.", 'So overall, I think…', 'And that is why…'],
  },
];

// Short reframes shown between reps to counter perfectionism and anxiety.
export const MINDSET_TIPS = [
  'Communication beats perfection. Native speakers pause and restart too.',
  'A pause is not a failure. Silence of 2–3 seconds feels long only to you.',
  'Aim for "understood", not "flawless".',
  'Recovering from a freeze is a skill — every recovery counts as a rep.',
  'Nerves and excitement feel the same in the body. Call it excitement.',
  'Slow down slightly. Slower speech usually sounds more fluent, not less.',
  'Your listener wants you to succeed. They are on your side.',
];
