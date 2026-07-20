export default function EditableCharacter({ config }) {
  const female = config.gender === "female";
  const skin = config.skin || "#f3c3a2";
  const hair = config.hairColor || "#101010";
  const accent = config.outfit || "#00a8ff";
  const hairStyle = config.hairStyle || "neo";
  const outfitStyle = config.outfitStyle || "tech";

  return (
    <svg
      className="editable-character-svg realistic"
      viewBox="0 0 620 940"
      role="img"
      aria-label={female ? "Realistische vrouwelijke avatar" : "Realistische mannelijke avatar"}
    >
      <defs>
        <linearGradient id="skinMain" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={lighten(skin, 18)} />
          <stop offset=".55" stopColor={skin} />
          <stop offset="1" stopColor={darken(skin, 30)} />
        </linearGradient>

        <linearGradient id="skinShadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skin} />
          <stop offset="1" stopColor={darken(skin, 38)} />
        </linearGradient>

        <linearGradient id="jacketMain" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={lighten(accent, 18)} />
          <stop offset=".35" stopColor={accent} />
          <stop offset="1" stopColor={darken(accent, 52)} />
        </linearGradient>

        <linearGradient id="fabricDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a2434" />
          <stop offset=".55" stopColor="#0b111b" />
          <stop offset="1" stopColor="#02050a" />
        </linearGradient>

        <linearGradient id="shoeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#171d27" />
          <stop offset="1" stopColor="#020305" />
        </linearGradient>

        <radialGradient id="faceLight" cx=".38" cy=".28" r=".78">
          <stop offset="0" stopColor="rgba(255,255,255,.28)" />
          <stop offset=".5" stopColor="rgba(255,255,255,.05)" />
          <stop offset="1" stopColor="rgba(0,0,0,.18)" />
        </radialGradient>

        <filter id="characterShadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="24" stdDeviation="18" floodColor="#000" floodOpacity=".6" />
        </filter>

        <filter id="blueGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse cx="310" cy="873" rx="210" ry="40" fill="rgba(0,168,255,.13)" stroke="#00a8ff" strokeWidth="5" filter="url(#blueGlow)" />

      <g filter="url(#characterShadow)">
        {/* legs */}
        <path
          d={female
            ? "M223 592 C225 690 220 765 205 835 L270 835 C276 738 281 665 285 585 Z"
            : "M184 584 C192 688 190 772 169 838 L263 838 C273 722 280 650 286 576 Z"}
          fill="url(#fabricDark)"
          stroke="#26364d"
          strokeWidth="4"
        />
        <path
          d={female
            ? "M335 585 C339 665 344 738 350 835 L415 835 C400 765 395 690 397 592 Z"
            : "M334 576 C340 650 347 722 357 838 L451 838 C430 772 428 688 436 584 Z"}
          fill="url(#fabricDark)"
          stroke="#26364d"
          strokeWidth="4"
        />

        {/* cargo seams */}
        <path d="M212 662 L274 654" stroke="#33445d" strokeWidth="4" opacity=".7" />
        <path d="M346 654 L408 662" stroke="#33445d" strokeWidth="4" opacity=".7" />
        <rect x={female ? 220 : 192} y="675" width={female ? 47 : 64} height="44" rx="6" fill="#0a1019" stroke="#31425a" />
        <rect x={female ? 353 : 364} y="675" width={female ? 47 : 64} height="44" rx="6" fill="#0a1019" stroke="#31425a" />

        {/* shoes */}
        <path
          d={female
            ? "M178 816 C214 800 253 802 280 828 L279 870 L155 870 C148 842 157 826 178 816 Z"
            : "M133 814 C191 795 245 799 278 829 L277 874 L105 874 C99 839 111 822 133 814 Z"}
          fill="url(#shoeGrad)"
          stroke={accent}
          strokeWidth="5"
        />
        <path
          d={female
            ? "M342 828 C369 802 408 800 444 816 C465 826 474 842 467 870 L343 870 Z"
            : "M342 829 C375 799 429 795 487 814 C509 822 521 839 515 874 L343 874 Z"}
          fill="url(#shoeGrad)"
          stroke={accent}
          strokeWidth="5"
        />
        <path d="M170 844 L265 844" stroke="#e6edf7" strokeWidth="6" opacity=".8" />
        <path d="M355 844 L450 844" stroke="#e6edf7" strokeWidth="6" opacity=".8" />

        {/* torso */}
        <path
          d={female
            ? "M193 316 C220 278 258 259 310 259 C362 259 400 278 427 316 L397 595 C367 617 339 628 310 628 C281 628 253 617 223 595 Z"
            : "M143 318 C187 259 241 242 310 242 C379 242 433 259 477 318 L430 594 C388 621 350 632 310 632 C270 632 232 621 190 594 Z"}
          fill="url(#jacketMain)"
          stroke={lighten(accent, 28)}
          strokeWidth="5"
        />

        {/* hood */}
        <path
          d={female
            ? "M220 320 C230 266 263 238 310 238 C357 238 390 266 400 320 C368 298 340 289 310 289 C280 289 252 298 220 320 Z"
            : "M176 322 C188 256 235 220 310 220 C385 220 432 256 444 322 C401 290 357 278 310 278 C263 278 219 290 176 322 Z"}
          fill="#0a111c"
          stroke={darken(accent, 12)}
          strokeWidth="5"
        />

        {/* zipper and chest panels */}
        <path d="M310 282 L310 592" stroke="#06090f" strokeWidth="11" />
        <path d="M242 349 L289 368 L281 427 L222 404 Z" fill="#0b1119" opacity=".9" />
        <path d="M378 349 L331 368 L339 427 L398 404 Z" fill="#0b1119" opacity=".9" />
        <path d="M244 479 L294 479 L294 528 L232 528 Z" fill="#060a10" opacity=".8" />
        <path d="M326 479 L376 479 L388 528 L326 528 Z" fill="#060a10" opacity=".8" />

        {/* arms */}
        <path
          d={female
            ? "M206 327 C164 354 145 412 145 498 C145 553 164 590 194 593 C220 589 232 554 229 514 L244 368 Z"
            : "M161 329 C106 375 84 445 91 548 C95 600 121 622 154 611 C184 598 194 563 188 522 L220 358 Z"}
          fill="url(#jacketMain)"
          stroke={lighten(accent, 28)}
          strokeWidth="5"
        />
        <path
          d={female
            ? "M414 327 C456 354 475 412 475 498 C475 553 456 590 426 593 C400 589 388 554 391 514 L376 368 Z"
            : "M459 329 C514 375 536 445 529 548 C525 600 499 622 466 611 C436 598 426 563 432 522 L400 358 Z"}
          fill="url(#jacketMain)"
          stroke={lighten(accent, 28)}
          strokeWidth="5"
        />

        {/* hands */}
        <path d={female ? "M145 492 Q155 523 181 529 Q196 520 194 493Z" : "M91 538 Q102 571 135 578 Q156 564 153 533Z"} fill="url(#skinShadow)" />
        <path d={female ? "M475 492 Q465 523 439 529 Q424 520 426 493Z" : "M529 538 Q518 571 485 578 Q464 564 467 533Z"} fill="url(#skinShadow)" />

        {/* neck */}
        <path
          d={female ? "M273 232 L347 232 L340 281 Q310 296 280 281 Z" : "M264 224 L356 224 L348 284 Q310 304 272 284 Z"}
          fill="url(#skinShadow)"
        />

        {/* head */}
        <path
          d={female
            ? "M231 102 C248 58 279 40 310 40 C341 40 372 58 389 102 L381 193 C373 245 347 274 310 282 C273 274 247 245 239 193 Z"
            : "M220 98 C239 48 274 28 310 28 C346 28 381 48 400 98 L390 196 C379 251 350 282 310 290 C270 282 241 251 230 196 Z"}
          fill="url(#skinMain)"
          stroke={darken(skin, 34)}
          strokeWidth="4"
        />

        {/* ears */}
        <ellipse cx={female ? 236 : 224} cy="164" rx="18" ry="34" fill="url(#skinShadow)" />
        <ellipse cx={female ? 384 : 396} cy="164" rx="18" ry="34" fill="url(#skinShadow)" />

        {/* face lighting */}
        <path
          d={female
            ? "M245 108 C264 76 286 64 310 64 C337 64 358 78 377 112 L367 190 C360 226 340 250 310 258 C280 250 260 226 253 190 Z"
            : "M234 106 C256 68 283 52 310 52 C340 52 366 70 386 110 L376 194 C367 234 344 260 310 268 C276 260 253 234 244 194 Z"}
          fill="url(#faceLight)"
          opacity=".75"
        />

        {/* hair */}
        {hairStyle === "neo" && (
          <path
            d={female
              ? "M224 128 C217 72 245 39 276 30 L291 61 L313 18 L331 61 L365 32 L397 93 L382 128 C359 98 335 88 310 89 C283 87 254 98 238 132 Z"
              : "M208 130 C197 65 228 28 267 19 L288 58 L311 2 L336 58 L378 24 L412 91 L393 132 C365 96 339 84 310 85 C277 82 245 96 223 138 Z"}
            fill={hair}
            stroke={lighten(hair, 30)}
            strokeWidth="4"
          />
        )}

        {hairStyle === "wave" && (
          <path
            d="M207 132 C205 62 250 20 312 23 C365 25 403 62 409 111 C385 81 362 73 343 78 C360 95 356 115 337 126 C323 97 298 86 272 93 C249 98 228 112 207 132 Z"
            fill={hair}
            stroke={lighten(hair, 30)}
            strokeWidth="4"
          />
        )}

        {hairStyle === "buzz" && (
          <path
            d="M224 110 C239 54 269 34 310 34 C351 34 381 54 396 110 C369 91 341 82 310 82 C279 82 251 91 224 110 Z"
            fill={hair}
            stroke={lighten(hair, 30)}
            strokeWidth="4"
          />
        )}

        {/* eyebrows */}
        <path d={female ? "M263 149 Q281 137 298 149" : "M257 146 Q279 132 300 145"} fill="none" stroke={darken(hair, 14)} strokeWidth="8" strokeLinecap="round" />
        <path d={female ? "M322 149 Q340 137 357 149" : "M320 145 Q341 132 363 146"} fill="none" stroke={darken(hair, 14)} strokeWidth="8" strokeLinecap="round" />

        {/* eyes */}
        <ellipse cx="282" cy="165" rx="10" ry="7" fill="#f7fbff" />
        <ellipse cx="338" cy="165" rx="10" ry="7" fill="#f7fbff" />
        <circle cx="283" cy="165" r="5" fill="#00d7ff" />
        <circle cx="337" cy="165" r="5" fill="#00d7ff" />
        <circle cx="283" cy="165" r="2.4" fill="#071018" />
        <circle cx="337" cy="165" r="2.4" fill="#071018" />

        {/* nose */}
        <path d="M310 161 C304 182 301 197 310 202 C318 204 325 202 329 198" fill="none" stroke={darken(skin, 40)} strokeWidth="4" strokeLinecap="round" />

        {/* lips */}
        <path
          d={female ? "M283 228 Q310 245 338 226 Q310 252 283 228Z" : "M286 229 Q310 240 334 229"}
          fill={female ? "#a83f67" : "none"}
          stroke={female ? "#7b2747" : "#6a3439"}
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* chin / beard shadow male */}
        {!female && (
          <path d="M255 225 Q310 275 365 225 Q350 275 310 286 Q270 275 255 225Z" fill="rgba(20,15,15,.12)" />
        )}

        {/* logos and details */}
        <text x="310" y="460" textAnchor="middle" fill="#f5fbff" fontSize="54" fontWeight="900">V</text>
        <path d="M220 316 L258 347" stroke={lighten(accent, 48)} strokeWidth="7" />
        <path d="M400 316 L362 347" stroke={lighten(accent, 48)} strokeWidth="7" />

        {outfitStyle === "future" && (
          <>
            <path d="M194 352 L248 302" stroke="#f4f7fb" strokeWidth="15" opacity=".88" />
            <path d="M426 352 L372 302" stroke="#f4f7fb" strokeWidth="15" opacity=".88" />
            <path d="M226 562 L394 562" stroke="#f4f7fb" strokeWidth="10" opacity=".8" />
          </>
        )}

        {outfitStyle === "stealth" && (
          <>
            <path d="M190 359 L430 359" stroke="#020305" strokeWidth="26" opacity=".88" />
            <path d="M218 291 L402 291" stroke="#020305" strokeWidth="18" opacity=".9" />
            <path d="M238 536 L382 536" stroke="#020305" strokeWidth="16" opacity=".85" />
          </>
        )}
      </g>
    </svg>
  );
}

function normalize(hex) {
  const raw = String(hex || "#000000").replace("#", "");
  return raw.length === 3 ? raw.split("").map(c => c + c).join("") : raw.padEnd(6, "0").slice(0, 6);
}

function shift(hex, amount) {
  const value = normalize(hex);
  const num = parseInt(value, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (num & 255) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function lighten(hex, amount) {
  return shift(hex, Math.abs(amount));
}

function darken(hex, amount) {
  return shift(hex, -Math.abs(amount));
}
