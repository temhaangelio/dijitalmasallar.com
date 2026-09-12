/**
 * Foreign words, written the way a Turkish speaker says them.
 *
 * The voice reads with Turkish letter-to-sound rules, so "Cloudflare" comes out as five Turkish
 * syllables and "OpenAI" as "o-pe-na-i". Nothing in the engine can know better: to it they are
 * Turkish words spelled oddly. The fix is to hand it the pronunciation instead of the spelling.
 *
 * This runs on the copy that goes to the voice only. What is stored and shown stays the real text —
 * an editor reading "Klaudfleyr" in the panel would think something had broken.
 *
 * The list is drawn from what actually appears in these notes: Google, OpenAI, Claude, Gemini and
 * the rest, measured over the last few months of posts rather than guessed at.
 */

/** Longer keys are replaced first, so "Hugging Face" wins over "Face". */
const words: Record<string, string> = {
  // Şirketler ve ürünler
  "hugging face": "Haging Feys",
  "data agent": "Deyta Eycınt",
  "sam altman": "Sem Altman",
  "google cloud": "Gugıl Klaud",
  "apple watch": "Epıl Voç",
  "openai": "Oupın Ey Ay",
  "chatgpt": "Çet Ci Pi Ti",
  "cloudflare": "Klaudfleyr",
  "snowflake": "Snovfleyk",
  "bigquery": "Big Kiviri",
  "databricks": "Deytabriks",
  "mongodb": "Mongo Di Bi",
  "redshift": "Redşift",
  "microsoft": "Maykrosoft",
  "anthropic": "Entropik",
  "whatsapp": "Vatsap",
  "instagram": "İnstagram",
  "youtube": "Yutup",
  "nvidia": "Envidya",
  "xiaomi": "Şaomi",
  "android": "Androyd",
  "iphone": "Ayfon",
  "ipad": "Ayped",
  "google": "Gugıl",
  "gemini": "Cemini",
  "claude": "Klod",
  "apple": "Epıl",
  "adobe": "Adobi",
  "gmail": "Cimeyl",
  "slack": "Slek",
  "intel": "İntel",
  "mac": "Mek",
  "opera": "Opera",
  "foundry": "Faundri",
  "enterprise": "Entırprayz",
  "cybercab": "Saybırkeb",
  "meta": "Meta",
  "tesla": "Tesla",
  "amazon": "Amazon",
  "netflix": "Netfliks",
  "spotify": "Spotifay",
  "github": "Githab",
  "linkedin": "Linkdin",
  "threads": "Tredz",
  "windows": "Vindovs",
  "azure": "Ejır",
  "firefox": "Fayrfoks",
  "chrome": "Krom",
  "safari": "Safari",
  "edge": "Ec",

  // Sıfat ve ürün ekleri
  "cloud": "Klaud",
  "live": "Layv",
  "flash": "Fleş",
  "muse": "Myuz",
  "max": "Meks",
  "watch": "Voç",
  "power": "Pauır",
  "pixel": "Piksıl",
  "search": "Sörç",
  "workspace": "Vörkspeys",
  "studio": "Stüdyo",

  // Kısaltmalar: İngilizce harf adlarıyla söylenenler
  "ai": "yapay zekâ",
  "api": "Ey Pi Ay",
  "gpt": "Ci Pi Ti",
  "ios": "Ay O Es",
  "saas": "Sas",
  "casb": "Kasb",
  "llm": "El El Em",
  "gpu": "Ci Pi Yu",
  "cpu": "Si Pi Yu",
  "usb": "Yu Es Bi",
  "url": "Yu Ar El",
  "pdf": "Pi Di Ef",
  "seo": "Es E O",
  "vpn": "Vi Pi En",
};

/** Turkish letter names, for an acronym the list does not know. */
const letters: Record<string, string> = {
  A: "A", B: "Be", C: "Ce", D: "De", E: "E", F: "Fe", G: "Ge", H: "He", I: "I", İ: "İ",
  J: "Je", K: "Ke", L: "Le", M: "Me", N: "Ne", O: "O", P: "Pe", Q: "Ku", R: "Re", S: "Se",
  T: "Te", U: "U", V: "Ve", W: "Çift Ve", X: "İks", Y: "Ye", Z: "Ze", Ç: "Çe", Ğ: "Ğe",
  Ö: "Ö", Ş: "Şe", Ü: "Ü",
};

const keys = Object.keys(words).sort((a, b) => b.length - a.length);

/** Letters a Turkish word can be built from, so a replacement never starts mid-word. */
const wordCharacters = "A-Za-zÇĞİIÖŞÜçğıiöşü0-9";

function escape(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/*
 * Turkish has no lookbehind-free way to say "not inside a word" with \b alone: `\bAI\b` matches the
 * "AI" inside "AI'ın" correctly but also inside "KAI" under some engines' idea of a word character,
 * which does not include the dotted letters. The boundaries are spelled out instead.
 */
const pattern = new RegExp(`(^|[^${wordCharacters}])(${keys.map(escape).join("|")})(?![${wordCharacters}])`, "gi");

/** An unknown run of capitals: NASA, CASB, TÜİK. Two to five letters, no lower case inside. */
const acronymPattern = new RegExp(`(^|[^${wordCharacters}])([A-ZÇĞİÖŞÜ]{2,5})(?![${wordCharacters}])`, "g");

/**
 * The text as the voice should say it.
 *
 * Turkish suffixes survive: the boundary stops before an apostrophe, so "OpenAI'ın" keeps its "'ın"
 * and only the name is swapped.
 */
export function pronounceTurkish(text: string) {
  const said = text.replace(pattern, (_match, before: string, word: string) => `${before}${words[word.toLowerCase()]}`);
  return said.replace(acronymPattern, (match, before: string, acronym: string) => {
    const spelled = [...acronym].map((letter) => letters[letter]).filter(Boolean);
    return spelled.length === acronym.length ? `${before}${spelled.join(" ")}` : match;
  });
}
