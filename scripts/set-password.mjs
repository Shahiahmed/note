/**
 * Настройка входа: спрашивает логин и пароль, кладёт в .env.local
 * логин, PBKDF2-хеш пароля и случайный секрет для подписи сессии.
 *
 * Сам пароль никуда не записывается и в истории команд не остаётся —
 * ввод скрыт.
 *
 *   npm run set-password
 */
import { createInterface } from "node:readline";
import { randomBytes, pbkdf2Sync } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ENV_PATH = resolve(process.cwd(), ".env.local");
const ITERATIONS = 210_000;

function ask(question, { hidden = false } = {}) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });

  return new Promise((done) => {
    if (hidden) {
      // Прячем ввод: перерисовываем только приглашение.
      const onData = () => {
        rl.output.write(`\x1b[2K\r${question}`);
      };
      rl.output.write(question);
      rl.input.on("data", onData);
      rl.question("", (answer) => {
        rl.input.off("data", onData);
        rl.output.write("\n");
        rl.close();
        done(answer);
      });
      return;
    }

    rl.question(question, (answer) => {
      rl.close();
      done(answer);
    });
  });
}

function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(password.normalize("NFKC"), salt, ITERATIONS, 32, "sha256");
  // Двоеточие вместо `$`: Next.js разворачивает $переменные в .env.
  return `pbkdf2:${ITERATIONS}:${salt.toString("hex")}:${hash.toString("hex")}`;
}

/** Меняет значение переменной в тексте .env, добавляя её при отсутствии. */
function upsert(text, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(text)) return text.replace(re, line);
  return `${text.replace(/\s*$/, "")}\n${line}\n`;
}

const login = (await ask("Логин: ")).trim();
if (!login) {
  console.error("Логин не может быть пустым.");
  process.exit(1);
}

const password = await ask("Пароль: ", { hidden: true });
if (password.length < 8) {
  console.error("Пароль должен быть не короче 8 символов.");
  process.exit(1);
}

const repeat = await ask("Пароль ещё раз: ", { hidden: true });
if (password !== repeat) {
  console.error("Пароли не совпадают.");
  process.exit(1);
}

let text = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : "";
text = upsert(text, "AUTH_LOGIN", login);
text = upsert(text, "AUTH_PASSWORD_HASH", hashPassword(password));
text = upsert(text, "AUTH_SECRET", randomBytes(32).toString("hex"));
writeFileSync(ENV_PATH, text, "utf8");

console.log("\nГотово: логин, хеш пароля и секрет сессии записаны в .env.local");
console.log("Перезапустите приложение (npm run dev), чтобы вход заработал.");
