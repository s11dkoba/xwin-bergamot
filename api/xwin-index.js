/* The index is published on xwin-crimson-overdrive, which sends no CORS
   headers, so the browser cannot read it directly. This runs on Vercel,
   reads the score out of the server-rendered page and hands it back as
   JSON. The band name is derived from the score here rather than
   translated from the source, so no Japanese can reach the page. */

const SOURCE = 'https://xwin-crimson-overdrive.vercel.app/xwin-index';

const BANDS = [
  { min: 80, label: 'Strong upside',               tone: 'up' },
  { min: 60, label: 'Upside bias',                 tone: 'up' },
  { min: 40, label: 'Neutral, no clear direction', tone: 'flat' },
  { min: 20, label: 'Downside bias',               tone: 'down' },
  { min: 0,  label: 'Strong downside',             tone: 'down' }
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DAY_CHANGE = '前日比';  // 前日比
const AS_OF      = '時点';        // 時点

function parse(html) {
  /* the label reads "... 100 点中 82 点", so the score is the figure after
     点中 — matching the first "N 点" would take the denominator instead.
     The gauge's own text node is the fallback if that label ever changes. */
  const sm = html.match(/点中\s*(\d{1,3})\s*点/)
          || html.match(/tabular-nums"[^>]*>(\d{1,3})<\/text>/)
          || html.match(/"fontWeight":"700"[\s\S]{0,80}?"children":(\d{1,3})\}/);
  if (!sm) return null;
  const n = Number(sm[1]);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;

  /* the day change is rendered as a list of fragments, e.g. "前日比"," ","+",7
     so pull the run up to the closing bracket and keep only sign and digits */
  let change = null;
  /* the word also appears in the page's own dictionary of UI strings, where
     no number follows it, so walk every occurrence and take the first that
     actually carries one */
  for (let at = html.indexOf(DAY_CHANGE); at >= 0 && change === null;
       at = html.indexOf(DAY_CHANGE, at + 1)) {
    let seg = html.slice(at + DAY_CHANGE.length, at + DAY_CHANGE.length + 120);
    const end = seg.indexOf(']');
    if (end < 0) continue;
    const cm = seg.slice(0, end).replace(/[^0-9+−-]/g, '').match(/^([+−-])?(\d+)$/);
    if (cm) change = (cm[1] === '-' || cm[1] === '−' ? -1 : 1) * Number(cm[2]);
  }

  let asOf = null;
  const dm = html.match(new RegExp('(\\d{4})\\.(\\d{2})\\.(\\d{2})\\s*' + AS_OF));
  if (dm) asOf = Number(dm[3]) + ' ' + MONTHS[Number(dm[2]) - 1] + ' ' + dm[1];

  const band = BANDS.find(function (b) { return n >= b.min; });
  return { score: n, label: band.label, tone: band.tone, change: change, asOf: asOf };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const r = await fetch(SOURCE, {
      headers: { 'user-agent': 'xwin-bergamot/1.0 (+https://xwin-bergamot.vercel.app)' }
    });
    if (!r.ok) throw new Error('source responded ' + r.status);
    const data = parse(await r.text());
    if (!data) throw new Error('score not found in source');
    /* the score moves once a day; a shared cache spares the source */
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
    res.status(200).json(data);
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: String((e && e.message) || e) });
  }
};

module.exports.parse = parse;
