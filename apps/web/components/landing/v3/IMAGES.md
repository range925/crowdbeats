# Crowdbeats Landing v3 — Image & Art-Direction Report

## 1. Tooling and Pipeline
- **Generator**: `generate_image` tool (Google Imagen model integration via Antigravity).
- **Post-Processing**: `sharp` (v0.34.x) running in `apps/web/scripts/process_landing_images.js`.
- **Target Formats**: High-quality PNG masters + highly optimized WebP variants (quality 82, effort 6).
- **Zero Upscaling Guarantee**: If the source pixel dimension is narrower than a target width, the image is capped at source width rather than artificially enlarged, ensuring crisp sharpness without blurring or artifacts.

---

## 2. Asset Manifest & Specifications

| Slot | Source (px) | Output Files | Render (px) | Size | Aspect Ratio | Suggested CSS `object-position` |
|---|---|---|---|---|---|---|
| **Hero Desktop** | 1376×768 JPEG | `hero-desktop-master.png`<br>`hero-desktop-1280.webp`<br>`hero-desktop-1920.webp`<br>`hero-desktop-2560.webp` | 1365×768<br>1280×720<br>1365×768 (capped)<br>1365×768 (capped) | 497.5 KB<br>57.1 KB<br>63.2 KB<br>63.2 KB | 16:9 | `center right` (protects musician on the right while leaving left 45% clear for headline) |
| **Hero Mobile** | 896×1200 JPEG | `hero-mobile-master.png`<br>`hero-mobile-750.webp`<br>`hero-mobile-1080.webp` | 896×1120<br>750×938<br>896×1120 (capped) | 503.4 KB<br>55.7 KB<br>71.4 KB | 4:5 | `top center` (keeps performer in top 55%, dark shadows at bottom for CTAs) |
| **Fans (#for-fans)** | 896×1200 JPEG | `fans-master.png`<br>`fans-800.webp`<br>`fans-1400.webp` | 896×1120<br>800×1000<br>896×1120 (capped) | 495.0 KB<br>70.1 KB<br>82.1 KB | 4:5 | `center center` |
| **Solo (#solo-musicians)** | 896×1200 JPEG | `solo-master.png`<br>`solo-800.webp`<br>`solo-1400.webp` | 896×1120<br>800×1000<br>896×1120 (capped) | 439.4 KB<br>71.1 KB<br>83.8 KB | 4:5 | `center center` |
| **Band (#bands)** | 1200×896 JPEG | `band-master.png`<br>`band-800.webp`<br>`band-1400.webp` | 1195×896<br>800×600<br>1195×896 (capped) | 600.0 KB<br>78.4 KB<br>143.7 KB | 4:3 | `center center` |
| **Chapter (#build-your-next-chapter)** | 1264×848 JPEG | `chapter-master.png`<br>`chapter-1000.webp`<br>`chapter-1600.webp` | 1264×843<br>1000×667<br>1264×843 (capped) | 680.8 KB<br>87.1 KB<br>128.6 KB | 3:2 | `center center` |

---

## 3. Prompts & Visual Intent

### 1. Hero Desktop (`hero_desktop_v3`)
- **Prompt:** `Cinematic, editorial 35mm photograph of an adult acoustic singer-songwriter performing on a small stage in an intimate dimly lit music lounge. The performer is positioned in the right half of the frame holding an acoustic guitar correctly with natural hand posture, singing into a vintage microphone on a stand. Atmospheric warm amber stage spotlight with subtle violet rim light from behind. In the soft-focus foreground and right background, a diverse adult audience is enjoying the music. The entire left 45% of the frame is a calm, dark, moody shadowed wall with gentle gradient falloff, completely free of clutter, suitable for text overlay. High dynamic range, natural skin tones, absolutely no text, no logos, no watermarks, no signage.`
- **Review:** Natural finger placement on guitar frets, vintage mic cleanly positioned, dark left wall allows crisp HTML headline overlay without washed out contrast.

### 2. Hero Mobile (`hero_mobile_v3`)
- **Prompt:** `Vertical cinematic editorial photograph of an adult acoustic singer-songwriter performing on stage in a warm-lit intimate lounge. The performer is in the upper half of the composition, singing into a microphone on a stand with an acoustic guitar. Warm tungsten stage lighting with subtle violet rim light. The lower 45% of the frame transitions into deep dark moody shadows and soft silhouettes of the seated audience, clean and calm for text placement. Natural anatomy, realistic hands, no text, no logos, no signage, no watermarks.`
- **Review:** Performer clearly framed in the upper 55%; bottom 45% contains dark silhouettes that blend with dark background, leaving generous space for headlines and buttons on small viewports.

### 3. Fans (`fans_v3`)
- **Prompt:** `Warm candid editorial photograph of two diverse adult friends standing in the audience at an intimate live music venue, smiling and enjoying the live show. One friend holds a smartphone casually at chest height, screen completely obscured and turned away from the camera. In the softly blurred background, warm stage lighting illuminates a performer on stage. Believable club atmosphere, authentic expressions, natural skin tones, no text, no logos, no phone UI visible.`
- **Review:** Expressive, authentic smiling faces. Phone screen is completely turned away (no fake UI). Soft-focus musician in the background confirms live concert context.

### 4. Solo Musician (`solo_v3`)
- **Prompt:** `Cinematic medium close-up photograph of a talented adult keyboardist and vocalist performing live on stage at night under dramatic warm stage spotlights with subtle deep violet backlighting. Hands resting naturally on the keyboard keys, expressive and focused face, atmospheric haze. Believable music venue backdrop, realistic anatomy, no text, no logos, no watermarks.`
- **Review:** Showcases a different discipline (keyboardist/vocalist) from the acoustic guitarist hero. Realistic hands, authentic stage lighting with violet backlight.

### 5. Band (`band_v3`)
- **Prompt:** `Wide editorial live concert photograph of a tight-knit 4-piece indie rock band performing energetically on an authentic club stage. Female lead singer at the mic, guitarist playing a vintage electric guitar, bassist in the pocket, and drummer in the back at a realistic drum kit. Warm amber stage lamps, subtle cool rim lights, atmospheric haze, cohesive performance energy. Plausible instruments, correct anatomy and hand positions, no text, no logos, no watermarks.`
- **Review:** 4 distinct band members, realistic drums and pedalboard gear on stage floor, enthusiastic crowd in soft focus.

### 6. Chapter (`chapter_v3`)
- **Prompt:** `Warm candid photograph taken near the stage edge at an indie music venue after a performance. The musician is leaning over the stage chatting relaxed and smiling with a couple of enthusiastic adult audience members, sharing a genuine post-show conversation. Warm ambient venue lighting, natural laughter and connection, authentic venue details, no text, no logos, no watermarks.`
- **Review:** Demonstrates community and post-show connection, perfectly communicating "One performance can be the start of something bigger."

---

## 4. Accessibility Alt Text

- **Hero Desktop:** `An acoustic musician singing into a vintage microphone while playing guitar on an intimate lounge stage with an audience enjoying the show.`
- **Hero Mobile:** `A musician performing on an intimate lounge stage under warm spotlight.`
- **Fans:** `Two audience members smiling and enjoying a live musical performance together at an intimate venue.`
- **Solo:** `A musician playing keyboard and singing into a stage microphone during a live performance.`
- **Band:** `A four-piece live band performing on stage in an indie venue with the audience cheering.`
- **Chapter:** `A musician crouching at the edge of the stage after a show to chat warmly with audience members.`
