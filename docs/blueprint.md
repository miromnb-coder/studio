# **App Name**: AI Life Operator

## Core Features:

- Secure User Authentication: Provides email/password or magic link login, protected routes, user profile management, and secure sign out.
- Flexible Financial Input: Allows users to upload images/screenshots, paste text snippets, or add manual notes, with files stored in Firebase Storage and metadata in Firestore.
- Proactive Financial Analysis Tool: A critical tool designed to detect financial patterns like subscriptions, duplicate charges, hidden fees, trial endings, price increases, unusual recurring spending, and possible savings opportunities. It estimates monthly savings, assigns confidence levels, urgency levels, and provides structured insights and recommended actions, returning copyable messages if relevant. It includes a rule-based logic fallback system for robust operation.
- Action & Automation Engine: A proactive tool that, after each financial analysis, automatically generates prioritized action plans, step-by-step execution flows, and simulates agent behaviors (e.g., 'AI will send cancellation email to X'), projecting estimated financial results. It also generates copyable cancellation messages, negotiation prompts, reminders, and checklists, with a 'Fix this for me' button for simulated action triggering.
- Personalized Financial Dashboard: Offers a high-level overview of the user's financial status, featuring total estimated monthly savings, active subscriptions, upcoming renewals, urgent alerts, smart insights, and recent analysis activity.
- Comprehensive History System: Automatically saves all financial analyses, allowing users to easily revisit past results, view timestamps, summaries, and savings estimates in a timeline or list format.
- User Configuration Settings: Provides user-configurable options for dark mode, notification preferences, privacy/data controls, and a language-ready structure.

## Style Guidelines:

- Primary color: A deep, intelligent blue-purple (#9494F7) for reliability and sophistication, with a hover state of #7E7CF4.
- Background colors: Very dark charcoal (#19191C) for the main background, #232327 for surfaces/cards, and #2C2C31 for alternate surfaces.
- Accent color: Vibrant sky blue (#6BCCF2) for highlights and interactive elements.
- Semantic colors: Success (#39D98A), Warning (#F5C451), and Danger (#FF6B6B) for clear status indications.
- Text colors: Primary text is light (#F5F7FA), secondary text is subtle (#A7AFBD), and borders are a soft white rgba(255,255,255,0.08).
- Headings use 'Space Grotesk' for a modern, techy, and prominent feel with strong hierarchy.
- Body text uses 'Inter' for clean readability and objective presentation of financial data.
- Minimal outline icons with consistent stroke width for a clean, modern, and uncluttered aesthetic.
- Mobile-first, responsive grid layout with generous spacing and a card-based UI, ensuring strong hierarchy and one clear primary action per screen.
- Subtle fades, smooth slides, gentle hover states, and micro-interactions provide polished transitions and responsive feedback, maintaining a fast and calm motion.