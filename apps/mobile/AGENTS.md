# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Design system — use it, never re-implement it

`src/components/ui.tsx` is the single source of truth for every tappable/raised
surface in the app. Before building any screen:

1. **Read `src/components/ui.tsx` first.** Use `Button`, `PrimaryButton`, and
   `Chip` from it. They carry the glossy recipe the mockups are drawn with —
   vertical gradient body, white gloss fading from the top edge, hairline light
   rim, tinted drop shadow, press-scale.
2. **Never write a local button.** No screen-local `CtaButton`, no ad-hoc
   `<LinearGradient>` pill, no one-off shadow constant. If a screen needs a
   variation, add a prop to `Button` — don't fork it.
3. **Take colours and shadows from `UI`, `AQUA_BODY`, `GLASS_BODY`,
   `SHADOW_AQUA`, `SHADOW_GLASS`.** Don't re-sample hex values per screen; a
   second palette is how the app drifts out of sync.
4. Screen-specific tokens (page background, card fill, text colours) may live
   next to the screen, but anything that appears on two screens belongs in
   `ui.tsx`.

A new screen that looks right on its own but uses a different button than the
rest of the app is a bug, not a style choice.

# Generated assets — fixed Higgsfield settings

Every image generated for this app uses **model `gpt_image_2`, `resolution: "1k"`,
`aspect_ratio: "9:16"`, `quality: "medium"`** — no exceptions, no exploring other
models or resolutions. Credits are finite; a bigger resolution is a bug, not an
upgrade. (`1k` is the `resolution` param — `quality` only takes low/medium/high.)

Icons come back as 9:16 frames too: prompt for the subject centred on a flat
background, then crop and key it out locally with PIL, the way the existing
`qa-*.png` and `svc-*.png` assets were made. Batch every asset for a screen into
one `generate_image_batch` call.
