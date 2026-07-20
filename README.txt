VAINAAR v1.0 COMPLETE

Deze versie bevat:
- permanente accounts
- versleutelde wachtwoorden
- permanente characters
- character wijzigen via Profiel of Instellingen
- permanente chatberichten
- live online teller
- realtime Socket.IO-chat
- blauwe, rode en gele neonanimaties
- automatische database-map
- automatische SQLite-database
- Windows start.bat

STARTEN
1. Pak de ZIP volledig uit.
2. Open de map vainaar-v1-complete.
3. Dubbelklik op start.bat.
4. Laat de twee zwarte vensters open.
5. De website opent op http://localhost:5173

DATABASE
De database staat in:
data\vainaar.sqlite

De map data wordt automatisch aangemaakt wanneer deze ontbreekt.
Verwijder vainaar.sqlite niet als je accounts, characters en berichten wilt bewaren.

CHARACTER WIJZIGEN
1. Log in.
2. Klik links op PROFIEL of INSTELLINGEN.
3. Pas je character aan.
4. Klik op KARAKTER OPSLAAN.


NIEUWE PRIVÉKANALEN
- Klik naast KANALEN op de gele plusknop.
- Geef het privékanaal een naam.
- Alleen de maker kan het kanaal standaard zien.
- De backend ondersteunt het toevoegen van leden via e-mailadres.
- Kanalen hebben nu een blauwe of gele LED-rand.


POORT AL IN GEBRUIK
Deze versie sluit oude Vainaar-processen op poort 3000 en 5173 automatisch af.

Gebruik:
- start.bat om Vainaar schoon opnieuw te starten
- stop-vainaar.bat om Vainaar volledig te stoppen


VRIENDEN EN PRIVÉCOMMUNICATIE
- Zoek gebruikers op naam of e-mailadres.
- Stuur en accepteer vriendschapsverzoeken.
- Open privéchats met geaccepteerde vrienden.
- Start audio- of videogesprekken vanuit de vriendenpagina.
- Camera en microfoon vereisen toestemming van de browser.

BELANGRIJK VOOR BELLEN
- WebRTC werkt doorgaans lokaal en op veel internetverbindingen.
- Voor betrouwbare publieke gesprekken achter strenge routers/firewalls is een TURN-server nodig.
- Camera en microfoon werken in browsers alleen via localhost of HTTPS.


KANAAL-EMOJI'S
- Elk standaardkanaal heeft een eigen emoji.
- Bij een nieuw privékanaal kan de maker zelf een emoji kiezen.

DISCORD EN INSTAGRAM
1. Kopieer .env.example naar een nieuw bestand met de naam .env
2. Vul je echte Discord-uitnodigingslink in bij VITE_DISCORD_URL
3. Vul je echte Instagram-profiel in bij VITE_INSTAGRAM_URL
4. Start Vainaar opnieuw


OPSTART- EN INSTALLATIEFOUT GEFIXT
- Processen worden nu maar één keer per PID afgesloten.
- Verdwenen processen veroorzaken geen foutmeldingen meer.
- better-sqlite3 is bijgewerkt voor Node.js 24.
- Oude node_modules en package-lock worden bij de eerste start vervangen.
- npm audit- en fundmeldingen zijn tijdens installatie uitgeschakeld.

EERSTE START
De eerste start kan enkele minuten duren omdat alle modules worden geïnstalleerd.
Daarna start Vainaar sneller.

HANDMATIG OPNIEUW INSTALLEREN
Dubbelklik op install-vainaar.bat.


LOGIN DESIGN
- Login en registratie staan nu exact in het midden.
- Premium glassmorphism-paneel.
- Blauwe, gele en rode neonrand.
- Subtiele geanimeerde gloed achter het paneel.
- Logo blijft linksboven zichtbaar.


REALISTISCHE CHARACTER CREATOR
- De eenvoudige CSS-avatar is vervangen door een realistische character preview.
- Huid, haarstijl, haarkleur en outfit blijven als accountinstellingen opgeslagen.
- De pagina gebruikt de Vainaar neon-stijl en is responsive.
- Afbeelding: public/vainaar-realistic-character.png


GESLACHTSKIEZER
- Kies MANNELIJK of VROUWELIJK in de character creator.
- De gekozen variant wordt permanent opgeslagen bij het account.
- De preview en neonaccenten veranderen mee.
- Je kunt dit later opnieuw wijzigen via Profiel of Instellingen.


EDITBARE CHARACTER FIX
De vorige preview was een vaste afbeelding. Deze versie gebruikt een gelaagde SVG-avatar.

Alles verandert nu live:
- mannelijk of vrouwelijk
- huidskleur
- haarstijl
- haarkleur
- outfit
- outfitstijl

Alle keuzes worden nog steeds permanent bij het account opgeslagen.


VAINAAR V4 REALISTISCHE BEWERKBARE AVATAR
- Volledig gelaagde SVG-avatar.
- Betere menselijke lichaamsverhoudingen.
- Realistischer gezicht met schaduwen, ogen, neus, mond en kaak.
- Duidelijke mannelijke en vrouwelijke vormen.
- Realistischere hoodie, jas, broek, zakken en schoenen.
- Alle keuzes wijzigen direct live.
- Alle keuzes worden permanent opgeslagen.


ACHTERGRONDMUZIEK
- Ingebouwde rechtenvrije cyber-ambient via Web Audio.
- Start na de eerste klik.
- Aan/uit en volume via Instellingen.
- Wordt zachter tijdens bellen.
