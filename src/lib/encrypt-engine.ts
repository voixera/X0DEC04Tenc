import type { EncryptionSettings } from "./types";
import crypto from "crypto";

function randomIdentifier(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
  const start = chars[Math.floor(Math.random() * chars.length)];
  const allChars = chars + "0123456789";
  let result = start;
  for (let i = 1; i < length; i++) {
    result += allChars[Math.floor(Math.random() * allChars.length)];
  }
  return result;
}

function encryptString(str: string): string {
  const key = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-128-gcm", key, iv);
  let encrypted = cipher.update(str, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${encrypted}:${tag}:${key.toString("hex")}`;
}

function removeComments(code: string): string {
  let result = "";
  let i = 0;
  let inString: string | null = null;
  let inLongString = false;
  let longStringLevel = 0;

  while (i < code.length) {
    if (inLongString) {
      const closePattern = "]" + "=".repeat(longStringLevel) + "]";
      const closeIdx = code.indexOf(closePattern, i);
      if (closeIdx === -1) {
        result += code.slice(i);
        break;
      }
      result += code.slice(i, closeIdx + closePattern.length);
      i = closeIdx + closePattern.length;
      inLongString = false;
      continue;
    }

    if (inString) {
      if (code[i] === "\\" && i + 1 < code.length) {
        result += code[i] + code[i + 1];
        i += 2;
        continue;
      }
      if (code[i] === inString) {
        result += code[i];
        i++;
        inString = null;
        continue;
      }
      result += code[i];
      i++;
      continue;
    }

    if (code[i] === '"' || code[i] === "'") {
      inString = code[i];
      result += code[i];
      i++;
      continue;
    }

    if (code[i] === "[") {
      let level = 0;
      let j = i + 1;
      while (j < code.length && code[j] === "=") {
        level++;
        j++;
      }
      if (j < code.length && code[j] === "[") {
        inLongString = true;
        longStringLevel = level;
        const header = code.slice(i, j + 1);
        result += header;
        i = j + 1;
        continue;
      }
    }

    if (code[i] === "-" && i + 1 < code.length && code[i + 1] === "-") {
      if (i + 2 < code.length && code[i + 2] === "[") {
        let level = 0;
        let j = i + 3;
        while (j < code.length && code[j] === "=") {
          level++;
          j++;
        }
        if (j < code.length && code[j] === "[") {
          const closePattern = "]" + "=".repeat(level) + "]";
          const closeIdx = code.indexOf(closePattern, j + 1);
          if (closeIdx !== -1) {
            i = closeIdx + closePattern.length;
          } else {
            i = code.length;
          }
          continue;
        }
      }
      const nl = code.indexOf("\n", i);
      if (nl === -1) {
        break;
      }
      i = nl;
      continue;
    }

    result += code[i];
    i++;
  }

  return result;
}

function minifyCode(code: string): string {
  return code
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join("\n");
}

function buildDecryptionRuntime(
  encryptedChunks: { varName: string; data: string }[]
): string {
  const lines: string[] = [];
  lines.push("-- X0DEC04T Encrypt Protected");
  lines.push(
    "local function _x0d(h)local k,i,e,t=h:match('(.+):(.+):(.+):(.+)');local c={}for m in k:gmatch('..')do c[#c+1]=tonumber(m,16)end;local d={}for m in t:gmatch('..')do d[#d+1]=tonumber(m,16)end;local r={}for m in i:gmatch('..')do r[#r+1]=tonumber(m,16)end;local o=''for j=1,#r do o=o..string.char(((r[j]-d[(j-1)%#d+1]-c[(j-1)%#c+1])%256))end;return o end"
  );
  for (const chunk of encryptedChunks) {
    lines.push(`local ${chunk.varName}=_x0d("${chunk.data}")`);
  }
  return lines.join("\n");
}

export function encryptLuaCode(
  code: string,
  settings: EncryptionSettings
): { encrypted: string; stats: { originalSize: number; encryptedSize: number } } {
  const startTime = performance.now();
  let processed = code;
  const originalSize = Buffer.byteLength(code, "utf8");

  if (settings.removeComments) {
    processed = removeComments(processed);
  }

  if (settings.minify) {
    processed = minifyCode(processed);
  }

  const idLen = settings.randomIdentifierLength || 8;
  const luaKeywords = new Set([
    "and","break","do","else","elseif","end","false","for","function",
    "goto","if","in","local","nil","not","or","repeat","return","then",
    "true","until","while","print","require","tostring","tonumber",
    "type","pairs","ipairs","next","select","unpack","table","string",
    "math","io","os","error","pcall","xpcall","assert","setmetatable",
    "getmetatable","rawget","rawset","rawequal","rawlen","load",
    "loadstring","dofile","loadfile","coroutine","debug","_G","_VERSION",
    "collectgarbage","arg","self",
  ]);

  const identifierMap = new Map<string, string>();

  function getOrCreateId(name: string): string {
    if (luaKeywords.has(name)) return name;
    if (identifierMap.has(name)) return identifierMap.get(name)!;
    const newId = "_" + randomIdentifier(idLen);
    identifierMap.set(name, newId);
    return newId;
  }

  if (settings.renameVariable || settings.renameFunction || settings.renameLocal) {
    const identRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    let inStr: string | null = null;
    let result = "";
    let lastIndex = 0;

    for (let i = 0; i < processed.length; i++) {
      if (inStr) {
        if (processed[i] === "\\" && i + 1 < processed.length) {
          i++;
          continue;
        }
        if (processed[i] === inStr) {
          inStr = null;
        }
        continue;
      }
      if (processed[i] === '"' || processed[i] === "'") {
        inStr = processed[i];
      }
    }

    processed = processed.replace(identRegex, (match) => {
      if (luaKeywords.has(match)) return match;
      return getOrCreateId(match);
    });
  }

  const encryptedChunks: { varName: string; data: string }[] = [];

  if (settings.encryptString) {
    const stringRegex = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g;
    let chunkIndex = 0;
    processed = processed.replace(stringRegex, (match) => {
      const inner = match.slice(1, -1);
      if (inner.length === 0) return match;
      const varName = "_s" + randomIdentifier(idLen) + chunkIndex;
      const data = encryptString(inner);
      encryptedChunks.push({ varName, data });
      chunkIndex++;
      return varName;
    });
  }

  if (settings.encodeConstant) {
    processed = processed.replace(/\b(\d+)\b/g, (match) => {
      const n = parseInt(match, 10);
      if (isNaN(n) || n > 1000000) return match;
      const offset = Math.floor(Math.random() * 100) + 1;
      return `(${n + offset}-${offset})`;
    });
  }

  if (settings.protectGlobal) {
    const protectHeader = `local _ENV=setmetatable({},{__index=_G,__newindex=function(t,k,v)rawset(t,k,v)end})\n`;
    processed = protectHeader + processed;
  }

  let output = "";
  if (encryptedChunks.length > 0) {
    output = buildDecryptionRuntime(encryptedChunks) + "\n" + processed;
  } else {
    output = "-- X0DEC04T Encrypt Protected\n" + processed;
  }

  if (settings.compressOutput) {
    output = output
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .join(";");
  }

  const encryptedSize = Buffer.byteLength(output, "utf8");

  return {
    encrypted: output,
    stats: { originalSize, encryptedSize },
  };
}
