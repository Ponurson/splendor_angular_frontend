#!/usr/bin/env node
// Rebuilds src/app/_offline/game-data.ts from the backend's data.sql, so the local
// game and Spring always share one card set. Run: npm run generate:game-data
import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sql = readFileSync(
    join(root, '..', 'splendor_spring_boot_backend', 'src', 'main', 'resources', 'data.sql'), 'utf8');

// java TokenType ordinals, used by the cards.produces column
const TOKEN_BY_ORDINAL = ['DIAMOND', 'EMERALD', 'RUBY', 'SAPPHIRE', 'ONYX', 'GOLD'];

// card ids are the insertion order, starting at 1, exactly like the auto-increment column
const cards = [...sql.matchAll(/INSERT INTO cards \(level, points, produces, graphic\) VALUES \((\d+),(\d+),(\d+),'([^']+)'\)/g)]
    .map(([, level, points, produces, graphic], i) => ({
        id: String(i + 1),
        level: +level,
        points: +points,
        produces: TOKEN_BY_ORDINAL[+produces],
        graphic,
        cost: {}
    }));
for (const stmt of sql.match(/INSERT INTO card_cost[^;]+;/g) || []) {
    for (const [, id, cost, token] of stmt.matchAll(/\((\d+),(\d+),'(\w+)'\)/g)) {
        if (+cost > 0) {
            cards[+id - 1].cost[token] = +cost;
        }
    }
}

const nobles = [];
for (const stmt of sql.match(/INSERT INTO nobles[^;]+;/g) || []) {
    for (const [, id, graphic, points] of stmt.matchAll(/\((\d+),'([^']+)',(\d+)\)/g)) {
        nobles.push({id: String(id), graphic, points: +points, cardCombination: {}});
    }
}
for (const stmt of sql.match(/INSERT INTO noble_card_combination[^;]+;/g) || []) {
    for (const [, id, count, token] of stmt.matchAll(/\((\d+),(\d+),'(\w+)'\)/g)) {
        nobles.find(n => n.id === String(id)).cardCombination[token] = +count;
    }
}

const out = `// Generated from splendor_spring_boot_backend/src/main/resources/data.sql — do not hand-edit.
import {Card} from '@app/_models/card';
import {Noble} from '@app/_models/noble';

export const CARDS: Card[] = ${JSON.stringify(cards, null, 1)} as unknown as Card[];

export const NOBLES: Noble[] = ${JSON.stringify(nobles, null, 1)} as unknown as Noble[];
`;
writeFileSync(join(root, 'src', 'app', '_offline', 'game-data.ts'), out);
console.log(`game-data.ts: ${cards.length} cards, ${nobles.length} nobles`);
