#!/usr/bin/env node
/**
 * Migrace leaderboard dat z 2025-* na 2026-* klíče v Firestore.
 *
 * Prerekvizity:
 *   npm install firebase-admin
 *
 * Spuštění:
 *   node scripts/migrate-leaderboard.js ./serviceAccountKey.json
 */

const admin = require("firebase-admin");
const path = require("path");

const serviceAccountPath = process.argv[2];
if (!serviceAccountPath) {
    console.error("Použití: node scripts/migrate-leaderboard.js <cesta/k/serviceAccountKey.json>");
    process.exit(1);
}

const serviceAccount = require(path.resolve(serviceAccountPath));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const SET_IDS = [
    "2025-01-26",
    "2025-02-02",
    "2025-02-09",
    "2025-02-16",
    "2025-02-23",
    "2025-03-09",
    "2025-03-16",
];

async function migrateSet(oldId) {
    const newId = oldId.replace("2025-", "2026-");
    const oldRef = db.collection("leaderboards").doc(oldId).collection("scores");
    const newRef = db.collection("leaderboards").doc(newId).collection("scores");

    const snapshot = await oldRef.get();
    if (snapshot.empty) {
        console.log(`  ${oldId}: žádná data, přeskakuji.`);
        return;
    }

    const batch = db.batch();
    snapshot.forEach((doc) => {
        batch.set(newRef.doc(doc.id), doc.data());
    });
    await batch.commit();

    console.log(`  ${oldId} → ${newId}: přeneseno ${snapshot.size} záznamů.`);
}

async function main() {
    console.log("Spouštím migraci leaderboard dat...\n");
    for (const id of SET_IDS) {
        await migrateSet(id);
    }
    console.log("\nHotovo! Stará data v Firestore zůstávají zachována (nebyla smazána).");
    process.exit(0);
}

main().catch((err) => {
    console.error("Chyba:", err);
    process.exit(1);
});
