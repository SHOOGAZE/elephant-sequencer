# Changelog

## Unreleased
- Unified OLED panel (caption, dot-matrix name with Cyrillic, scope) shared by GRAINS, ELEPHANT and BEHEMOTH.

## 1.1.0 (2026-11-13)

- Interface levels: SIMPLE (default), ADVANCED and SEQ ONLY. In SIMPLE the effects sit under the mixer.
- Black-and-white glass look on the screens.
- No network requests at all: the unused web font link is gone, the app runs on system fonts.
- The page switch of the sequencer is compact and no longer a white bar.
- Wider tempo buttons on phones; folded phones keep both on screen.
- Sheets close with one compact ✕ button; track arrows match the other apps.
- Knobs report their value to screen readers; tabs are marked as tabs; toasts are announced.
- Install manifest: absolute start address, dark colours, maskable icon.
- Tests: audio fuzz test in the browser (random knobs and notes, the output is watched for NaN and clipping); runs in CI.
