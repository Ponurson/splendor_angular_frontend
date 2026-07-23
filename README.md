# splendor_angular

App Subject: Web App version of popular game Splendor, concetrated on smartphone interface.

Description: Turn based card/board game. New user has to register and login. User is then redirected to home page from where he can invite up to 3 other currently logged in users. Challenged players then need to confirm invitation to start proper game. Objective is to gain most points, during their turn players can either pick resources or buy card for resources. All bought cards produce 1 resource every turn, cards are also sometimes worth points.

REST app, with frontend developed in Angular, basic auth for security, can be tested through github pages: https://ponurson.github.io/splendor_angular_frontend/ Backend - Spring Boot with Spring Security on Heroku with Heroku Postgres

Frontend was based on: https://jasonwatmore.com/post/2020/04/28/angular-9-user-registration-and-login-example-tutorial

## Play vs computer (local bots)

The home page has a "Play vs computer" section: pick 1–3 computer opponents
(default 1) and start. The whole game then runs inside the browser — an HTTP
interceptor (`src/app/_offline/`) answers every `/game/*` call from a local
TypeScript port of the backend rules, so nothing reaches Spring until the game
ends. Online multiplayer keeps using the REST backend unchanged.

The offline/Android build (`npm run build:offline`, `npm run cap:sync` to
update the Capacitor project) additionally emulates login and the lobby, so
the APK needs no server at all. Card and noble data is generated from the
backend's `data.sql` with `npm run generate:game-data` — do not edit
`game-data.ts` by hand.

## Security audit

Run dependency vulnerability checks without changing dependencies:

```sh
npm run security:audit
```

The script runs `npm audit --package-lock-only --audit-level=high`, so it reports from `package-lock.json` and exits non-zero for high or critical vulnerabilities. It does not require secrets.
