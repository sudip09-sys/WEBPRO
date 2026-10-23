# WebPRO

**Less watching. More building.**

A personal web programming learning hub by **Sudip Sah** · [@sudip09-sys](https://github.com/sudip09-sys).

[Open WebPRO](https://sudip09-sys.github.io/WEBPRO/)

## Thirteen lectures. Thirteen runnable projects.

| Lecture | Project | Technology |
| --- | --- | --- |
| 01 | Static memory matching game | HTML + inline JavaScript |
| 02 | Mouse and keyboard piano | JavaScript + MP3 audio |
| 03 | Shuffled memory game with difficulty | JavaScript arrays and loops |
| 04 | JSON melody player with pause/reset | JavaScript + Fetch |
| 05 | Typed piano and melody player | TypeScript classes and interfaces |
| 06 | Modular multiple-choice quiz | TypeScript ES modules |
| 07 | Multiplayer memory game with hints | TypeScript, enums and generics |
| 08 | Registration, login and messaging | TypeScript API adapter |
| 09 | Contacts and conversation interface | TypeScript + DOM |
| 10 | Messenger intro, mock content and routing | Angular |
| 11 | Messenger services, fetch and state | Angular signals |
| 12 | Live events, remembered contacts, notifications | Angular + configurable WebSocket transport |
| 13 | Integrated messenger with state tests | Angular + Node tests |

Every project is in its own folder under projects/. Built versions run without installing TypeScript or Angular. Readable source and rebuild instructions are included. The messenger projects share a progressive application architecture; later lectures add real-time features.

## Local preview

Serve this directory with any static HTTP server and open index.html. Opening files directly can prevent JSON loading, browser storage and ES module behavior.

## Messenger modes

The projects run with local demo accounts by default. Use demo passwords only. Two accounts in separate tabs can exchange messages within the same browser. The guide contact is explicitly simulated. Live course API mode is configurable, and lectures 12–13 provide WebSocket integration. Live backend/VPN behavior has not been verified. HTTPS pages require HTTPS/WSS endpoints; use a local HTTP server for an HTTP-only backend.

This educational authentication is not a production identity system. It never remembers plaintext passwords.

## Validation

TypeScript builds pass in strict mode. The Angular production build passes. Lecture 13 includes six Node tests for conversation isolation, ordering, immutability and duplicate event handling.

## Deployment

The Publish WebPRO GitHub Actions workflow packages projects and module downloads and deploys the static site to GitHub Pages.

## Rights

Educational materials retain their required notices and reuse restrictions in materials/LICENSE. Publication permission was supplied by the repository owner. That permission does not change downstream reuse rights. Third-party library notices are retained with their distributions.
